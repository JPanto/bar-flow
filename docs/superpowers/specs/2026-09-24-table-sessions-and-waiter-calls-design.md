# Especificación de Diseño: Sesiones de Mesa Dinámicas, Portal de Cliente y Sistema de Llamados en Tiempo Real con Transición Cromática

**Fecha:** 2026-09-24  
**Estado:** Aprobado para Planificación  
**Autor:** Antigravity & User  

---

## 1. Objetivos y Alcance

Esta especificación detalla la incorporación de dos subsistemas esenciales para la operación y atención en sala:

1. **Sesiones Dinámicas de Mesa con Identificador por Palabras Clave:**
   * Generación automática de una palabra clave gastronómica y memorable (ej. `MOJITO-24`, `BURGER-81`) al ocupar una mesa.
   * Sirve como identificador unívoco de la cuenta del cliente para pagos en caja y futuras comandas/pedidos.
2. **Portal del Cliente Responsivo por Mesa (`/?mesa=:tableId`):**
   * Acceso por código QR o enlace directo desde el móvil del cliente.
   * Visualización del identificador dinámico de mesa y botones de llamada rápida (*Llamar Mesero*, *Pedir la Cuenta*, *Asistencia*).
3. **Bus de Eventos en Tiempo Real (WebSockets + BroadcastChannel):**
   * Arquitectura híbrida desacoplada que soporta WebSockets para nube y `BroadcastChannel` local para sincronización multi-pantalla instantánea sin conexión (PWA Offline).
4. **Sistema de Priorización y Gradiente Cromático Continuo:**
   * Ordenamiento de llamados en estricto orden de espera (FIFO).
   * Cálculo segundo a segundo de una transición cromática suave en espacio HSL (de Verde esmeralda a Amarillo, Ámbar, Naranja y Rojo carmín pulsante).
   * Reflejo visual en el Croquis (halo pulsante sobre la mesa) y en el panel flotante de llamados para los meseros.

---

## 2. Modelo de Datos Relacional y Esquema Dexie

Se añaden dos tablas a la base de datos `BarMvpDB` (Versión 2):

### 2.1. `table_sessions`
* `id` (string, PK): UUID de sesión.
* `tableId` (string, FK indexada): Identificador de la mesa.
* `sessionWord` (string, indexado): Palabra dinámica (ej. `"MOJITO-24"`).
* `status` (`'active' | 'closed'`, indexado): Estado de la sesión.
* `openedAt` (number): Timestamp de inicio de la sesión.
* `closedAt` (number | null): Timestamp de cierre de la sesión.

### 2.2. `waiter_calls`
* `id` (string, PK): UUID del llamado.
* `tableId` (string, FK indexada): Identificador de la mesa.
* `sessionId` (string, FK indexada): Sesión vinculada.
* `tableName` (string): Nombre visible de la mesa (ej. `"Mesa 4"`).
* `sessionWord` (string): Código de la mesa en ese momento.
* `reason` (`'waiter' | 'bill' | 'help'`): Motivo del llamado.
* `status` (`'pending' | 'attending' | 'resolved' | 'cancelled'`, indexado): Estado del llamado.
* `createdAt` (number, indexado): Timestamp de creación (clave para ordenamiento FIFO).
* `attendingAt` (number | null): Timestamp en que el mesero marcó "en camino".
* `resolvedAt` (number | null): Timestamp de finalización de atención.

---

## 3. Generador de Palabras Gastronómicas (`src/utils/wordGenerator.ts`)

* Diccionario temático curado:
  * Coctelería: `MOJITO`, `MARGARITA`, `GIN`, `TEQUILA`, `MEZCAL`, `DAIQUIRI`, `CAIPIRINHA`, `SANGRIA`, `PIÑACOLADA`, `MALBEC`.
  * Gastronomía & Bar: `BURGER`, `NACHOS`, `TAPAS`, `TACO`, `PIZZA`, `CERVEZA`, `ESPRESSO`, `BBQ`, `CHEDDAR`, `CRISPY`.
* Número aleatorio: Entre `10` y `99`.
* Formato resultante: `[PALABRA]-[NUMERO]` (ej. `MOJITO-24`).
* Comprobación: Al generar, se verifica que no esté activa en otra mesa en ese momento.

---

## 4. Motor de Gradiente Cromático Continuo (`src/utils/urgencyGradient.ts`)

La función `calculateUrgency(createdAt: number, currentTime = Date.now())` calcula:

* `secondsElapsed = Math.floor((currentTime - createdAt) / 1000)`
* Interpolación de tono (Hue en HSL):
  * **0s a 120s (0 a 2 min):** Hue transita de `145°` (verde esmeralda) a `60°` (amarillo).
  * **120s a 240s (2 a 4 min):** Hue transita de `60°` (amarillo) a `25°` (ámbar / naranja cálido).
  * **240s a 360s (4 a 6 min):** Hue transita de `25°` a `0°` (rojo carmín puro).
  * **> 360s (Crítico):** Hue fijo en `0°`, saturación 100%, luminosidad 45%, con bandera `isCritical = true` para activar pulsación animada.
* Salidas:
  * `hue`: number (0 a 145)
  * `hslColor`: `hsl(${hue}, 85%, 48%)`
  * `hexColor`: valor hexadecimal equivalente para Canvas 2D.
  * `formattedTime`: Cadena legible de tiempo transcurrido (ej. `"45s"`, `"2m 10s"`).
  * `urgencyLabel`: `"Reciente" | "En espera" | "Urgente" | "Crítico"`.
  * `isCritical`: boolean.

---

## 5. Bus de Comunicación en Tiempo Real (`src/services/realtime.ts`)

* **Eventos del Bus:**
  * `CALL_CREATED`: `{ call: WaiterCall }`
  * `CALL_ATTENDING`: `{ callId: string, attendingAt: number }`
  * `CALL_RESOLVED`: `{ callId: string, resolvedAt: number }`
  * `CALL_CANCELLED`: `{ callId: string }`
  * `SESSION_STARTED`: `{ session: TableSession }`
* **Capa de Transporte Híbrido:**
  * `BroadcastChannelTransport`: Canal local `'bar_flow_realtime'` con fallback a IndexedDB, garantizando latencia cero entre pestañas/ventanas y modo offline autónomo.
  * `WebSocketTransport`: Cliente WebSocket preparado para conectarse a un endpoint configurable (`VITE_WS_URL` o URL de Cloudflare Workers / Durable Objects).
  * Se despacha a través de una interfaz común: `realtimeService.publish(event)` y `realtimeService.subscribe(listener)`.

---

## 6. Componentes e Interfaz de Usuario

### 6.1. Portal del Cliente (`src/components/customer/CustomerPortal.tsx`)
* Detecta parámetro en URL (ej. `?mesa=table-id` o ruta hash).
* Recupera la mesa y su sesión activa (`table_sessions`).
* Muestra la palabra dinámica (`MOJITO-24`) con botón de copiar y explicación clara de uso en caja.
* 3 Botones principales de llamado con iconos claros:
  * 🛎️ *Llamar al Mesero*
  * 💳 *Pedir la Cuenta*
  * ❓ *Asistencia General*
* Si hay un llamado activo:
  * Muestra tarjeta de estado en vivo con barra de progreso que se tiñe gradualmente con el color exacto del gradiente.
  * Muestra si el mesero está *"En camino"* o si está en cola.
  * Botón para cancelar el llamado.

### 6.2. Panel de Llamados del Personal (`src/components/service/CallsQueueDrawer.tsx`)
* Botón de campana en la barra de navegación (`Navbar`) con badge de llamados pendientes que adopta el color del llamado más urgente.
* Al pulsar, despliega un panel lateral/drawer con la lista de llamados pendientes:
  * Ordenamiento estricto FIFO (el más antiguo primero).
  * Borde y acento cromático individual según el tiempo de cada mesa.
  * Botón *"En camino"* (notifica al cliente en tiempo real que ya van hacia allá).
  * Botón *"Resolver"* (marca como atendido y despeja el llamado).
* Alerta sonora sutil mediante `AudioContext` nativo (sin archivos de audio externos).

### 6.3. Integración en el Croquis Canvas (`TableNode.tsx`)
* Si la mesa tiene un llamado activo pendiente, se renderiza un halo exterior circular/rectangular con efecto glow y color exacto de su gradiente de urgencia.
* Icono de campana flotante sobre la mesa para fácil identificación espacial.

### 6.4. Modal de Código QR de Mesa (`src/components/croquis/TableQrModal.tsx`)
* Accesible desde el inspector de mesa o modal de servicio.
* Genera el código QR nativo (usando SVG) con la URL directa para esa mesa (`http://.../?mesa=ID`).
* Botón *"Abrir vista cliente en nueva pestaña"* para pruebas inmediatas en navegador.

---

## 7. Plan de Verificación y Testing

1. **Pruebas Unitarias:**
   * `tests/wordGenerator.test.ts`: Unicidad y formato `[PALABRA]-[NUMERO]`.
   * `tests/urgencyGradient.test.ts`: Verificación de la progresión cromática matemática (Verde a Amarillo a Naranja a Rojo y bandera `isCritical`).
   * `tests/realtime.test.ts`: Pruebas de pub/sub del bus de eventos en tiempo real.
   * `tests/sessionsAndCalls.test.ts`: Creación de sesión al ocupar mesa, cierre de sesión al liberar mesa, ciclo de vida completo de un llamado (pendiente -> atendiendo -> resuelto).
2. **Pruebas de Compilación y PWA:**
   * `npm run build` sin errores de TypeScript ni empaquetado.
3. **Prueba Interactiva Extremo a Extremo:**
   * Abrir panel mesero en una ventana y la URL del cliente (`/?mesa=...`) en otra ventana o móvil.
   * Emitir llamado desde cliente, verificar campanilla y aparición inmediata en el panel de mesero con temporizador y cambio continuo de color.
   * Pulsar "En camino", verificar actualización en tiempo real en la pantalla del cliente.
