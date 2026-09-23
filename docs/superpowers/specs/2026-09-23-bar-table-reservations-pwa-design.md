# Especificación de Diseño: Sistema PWA de Gestión de Mesas, Croquis y Reservas para Bar / Gastrobar

**Fecha:** 2026-09-23  
**Estado:** Aprobado para Planificación  
**Autor:** Antigravity & User  

---

## 1. Resumen Ejecutivo y Objetivos

El objetivo de este proyecto es construir un **Producto Mínimo Viable (MVP)** de un sistema web progresivo (**PWA**) para la gestión integral de mesas, diseño de croquis y reservas de bares, gastrobares y restaurantes.

### Principios Fundamentales:
* **Offline-First:** Funcionamiento 100% autónomo sin conexión a internet mediante IndexedDB y Service Workers.
* **Croquis Interactivo Fluido:** Dibujo de distribución espacial con mesas redondas, cuadradas, rectangulares y barras, con libre desplazamiento (drag & drop), rotación y redimensionamiento.
* **Escalabilidad a Online:** Modelo de datos relacional normalizado con patrón **Outbox (`sync_queue`)** para conectarse en etapas posteriores a backends en la nube (PostgreSQL, Supabase, Node.js) y WebSockets para sincronización en tiempo real entre terminales.

---

## 2. Pila Tecnológica (Tech Stack)

* **Entorno & Build Tool:** Vite + React (TypeScript).
* **Estilos & UI:** Tailwind CSS + Lucide React (iconografía moderna y limpia con temática gastrobar).
* **Motor del Croquis:** `konva` + `react-konva` (Canvas 2D de alto rendimiento con soporte de drag & drop, transformers nativos, pan y zoom).
* **Persistencia Local:** `dexie` + `dexie-react-hooks` (capa relacional optimizada sobre IndexedDB con reactividad en componentes).
* **Capacidades PWA:** `vite-plugin-pwa` (Workbox, caching de assets, manifest interactivo, instalable en iPad/Android/Desktop).
* **Testing:** Vitest para pruebas unitarias de persistencia, sincronización y cálculos geométricos de sillas.

---

## 3. Modelo de Datos Relacional y Patrón Outbox

La base de datos local en IndexedDB se gestiona mediante Dexie (`BarMvpDB`):

### 3.1. Tablas y Esquemas

#### `zones` (Zonas del Local)
* `id` (string, PK): Identificador único (UUID).
* `name` (string): Nombre visible (ej. *"Salón Principal"*, *"Terraza"*, *"Barra"*).
* `width` (number): Ancho del lienzo en píxeles (default: 2000).
* `height` (number): Alto del lienzo en píxeles (default: 1500).
* `isDefault` (boolean): Zona predeterminada al cargar.
* `createdAt` (number): Timestamp de creación.

#### `tables` (Mesas y Mobiliario)
* `id` (string, PK): Identificador UUID.
* `zoneId` (string, FK indexada): Referencia a `zones.id`.
* `name` (string): Nombre o número de la mesa (ej. *"Mesa 1"*, *"T-04"*, *"Barra VIP"*).
* `shape` (`'round' | 'square' | 'rectangle' | 'counter'`): Forma geométrica.
* `x` (number): Coordenada X relativa a la zona.
* `y` (number): Coordenada Y relativa a la zona.
* `width` (number): Ancho o diámetro en píxeles.
* `height` (number): Alto en píxeles.
* `rotation` (number): Grados de rotación (0 a 360).
* `seats` (number): Capacidad de comensales / sillas.
* `status` (`'available' | 'occupied' | 'reserved' | 'blocked'`): Estado operativo actual.
* `updatedAt` (number): Timestamp de última actualización.

#### `reservations` (Agenda de Reservas)
* `id` (string, PK): Identificador UUID.
* `tableId` (string | null, FK indexada): Mesa asignada opcionalmente.
* `customerName` (string): Nombre del cliente.
* `customerPhone` (string): Teléfono de contacto.
* `customerEmail` (string, opcional): Correo electrónico.
* `date` (string, indexado): Fecha en formato `YYYY-MM-DD`.
* `time` (string): Hora en formato `HH:mm` (ej. `"20:30"`).
* `pax` (number): Cantidad de comensales esperados.
* `notes` (string, opcional): Alergias, preferencias, observaciones.
* `status` (`'confirmed' | 'seated' | 'cancelled' | 'no_show' | 'completed'`): Estado de la reserva.
* `createdAt` (number): Timestamp de registro.

#### `sync_queue` (Cola de Sincronización - Outbox Pattern)
* `id` (number, PK autoincremental): Secuencia de evento.
* `entity` (`'zone' | 'table' | 'reservation'`): Tipo de entidad mutada.
* `action` (`'INSERT' | 'UPDATE' | 'DELETE'`): Operación realizada.
* `entityId` (string): UUID de la entidad.
* `payload` (any): Datos asociados al evento o delta.
* `createdAt` (number): Timestamp del suceso.
* `status` (`'pending' | 'synced' | 'failed'`): Estado de despacho hacia backend remoto.

---

## 4. Arquitectura del Croquis (Motor React-Konva)

El componente principal del croquis se estructura en capas (Konva Layers):

1. **`GridLayer`**: Cuadrícula de referencia visual con soporte para **Snap-to-Grid** (alineación magnética a intervalos de 20px) configurable (activado/desactivado).
2. **`FurnitureLayer`**: Dibuja elementos estructurales y de barra (`counter`).
3. **`TablesLayer`**:
   * **Cuerpo de la Mesa:** Representación visual con color contextual según estado (`available`: esmeralda/verde, `occupied`: carmín/rojo, `reserved`: ámbar/amarillo, `blocked`: pizarra/gris).
   * **Sillas Perimetrales:** Distribución paramétrica de sillas (círculos o rectángulos curvados) alrededor de la mesa según la forma y la cantidad de asientos (`seats`).
   * **Etiqueta Central:** Muestra el nombre/número de mesa y la capacidad de comensales (ej. *"M4 (4p)"*).
4. **`TransformerLayer`**: Instancia de `Konva.Transformer` activa en Modo Editor para rotación continua y redimensionamiento libre con restricción de proporciones mínimas.
5. **Navegación:**
   * Soporte de Zoom (con botones flotantes `+`, `-`, `100%` y rueda de ratón / pinch multitouch).
   * Paneo libre arrastrando el fondo del escenario (`draggable` condicional).

---

## 5. Modos de Operación

### 5.1. Modo Editor de Croquis
* **Creación de Mesas:**
  * Mesa Redonda (2 o 4 sillas).
  * Mesa Cuadrada (2 o 4 sillas).
  * Mesa Rectangular (6 u 8 sillas).
  * Barra de Tragos con taburetes (longitud ajustable).
* **Edición de Atributos:**
  * Al hacer clic en un elemento, se despliega un panel lateral o modal para editar: Nombre, Capacidad de Sillas (`seats`), Dimensiones exactas, o Eliminar mesa.
* **Arrastre y Alineación:**
  * Desplazamiento libre arrastrando sobre el canvas con acople automático a la rejilla si el Snap-to-Grid está activo.
  * Persistencia inmediata o botón de guardar cambios al plano.

### 5.2. Modo En Servicio (Operativo)
* **Gestión Rápida de Mesas:**
  * Al pulsar una mesa en servicio, se abre el panel de control operativo:
    * **Cambiar Estado:** Ocupar mesa (con comensales walk-in o asignando reserva existente), Liberar mesa (pasa a disponible y finaliza reserva si existía), Bloquear mesa.
    * **Detalles de Ocupación:** Muestra información del cliente si está sentada o reservada, y tiempo de servicio.
* **Sincronización Automática con Reservas:**
  * Al marcar una reserva como *"Sentada"*, la mesa asociada se actualiza a `occupied`.
  * Mesas con reservas dentro del rango de los próximos 45 minutos destacan visualmente con borde o fondo `reserved`.

---

## 6. Módulo de Reservas y Agenda

* **Navegación Temporal:** Selector de fechas para alternar entre días (Hoy, Mañana, Calendario interactivo).
* **Listado de Reservas:**
  * Agrupadas por hora / turno (Almuerzo / Cena).
  * Indicador de comensales totales y estado de reserva.
* **Formulario de Registro:**
  * Campos: Cliente, Teléfono, Email (opcional), Fecha, Hora, Número de personas (`pax`), Zona de preferencia y Mesa asignada.
  * Selector inteligente que filtra mesas disponibles en esa zona con capacidad adecuada (`seats >= pax`).
* **Acciones Rápidas:**
  * *"Sentar Ahora"* (ocupa la mesa en el croquis).
  * *"Cancelar"* / *"Completar"*.

---

## 7. Soporte PWA, Offline y Respaldo Local

* **Vite PWA Plugin:**
  * Configuración de Service Worker con Workbox y caché de assets para carga 100% offline.
  * Manifiesto (`manifest.webmanifest`) con `name: "Bar & Resto Flow"`, `display: "standalone"`, `theme_color: "#0f172a"`.
* **Monitor de Conectividad:**
  * Badge en la barra de navegación: *"Modo Local (Offline)"* o *"En línea"*.
  * Contador reactivo de operaciones pendientes en `sync_queue`.
* **Copia de Seguridad (Backup):**
  * Botón para **Exportar base de datos a JSON**: descarga instantánea del esquema y datos completos del local.
  * Botón para **Importar archivo JSON**: restauración completa para migrar datos entre dispositivos o realizar pruebas.
* **Datos Semilla (Seed Initial Data):**
  * Al iniciar en una base de datos vacía, la app precarga una zona demostrativa (*"Salón Principal"*), un conjunto de 6 mesas organizadas y 2 reservas de prueba, permitiendo probar el croquis y las reservas de inmediato sin configuración manual tediosa.

---

## 8. Plan de Verificación y Testing

1. **Pruebas Unitarias (Vitest):**
   * Verificación del servicio de base de datos Dexie (inserción, actualización, eliminación en cascada y generación de entradas en `sync_queue`).
   * Verificación de la función de cálculo de posiciones de sillas alrededor de mesas redondas y rectangulares.
2. **Pruebas de Integración y Renderizado:**
   * Renderizado de la barra de herramientas, alternancia entre Modo Editor y Modo Servicio.
   * Asignación de reserva y actualización reactiva del estado de la mesa en el canvas.
3. **Prueba de Build y PWA:**
   * Ejecución exitosa de `npm run build` sin errores de TypeScript ni empaquetado.
   * Generación correcta de los artefactos del Service Worker y Manifest.
