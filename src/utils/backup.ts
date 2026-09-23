import { BarMvpDB } from '../db';
import { DatabaseBackup } from '../types/database';

export async function exportDatabaseToJson(database: BarMvpDB): Promise<string> {
  const zones = await database.zones.toArray();
  const tables = await database.restaurantTables.toArray();
  const reservations = await database.reservations.toArray();
  const customers = await database.customers.toArray();
  const syncQueue = await database.sync_queue.toArray();

  const backup: DatabaseBackup = {
    version: 1,
    exportedAt: Date.now(),
    data: {
      zones,
      tables,
      reservations,
      customers,
      syncQueue,
    },
  };

  return JSON.stringify(backup, null, 2);
}

export async function downloadBackupFile(database: BarMvpDB): Promise<void> {
  const jsonString = await exportDatabaseToJson(database);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `bar-flow-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseFromJson(
  database: BarMvpDB,
  jsonString: string
): Promise<{ success: boolean; message: string }> {
  try {
    const backup: DatabaseBackup = JSON.parse(jsonString);

    if (!backup.version || !backup.data) {
      return { success: false, message: 'El archivo no tiene el formato de respaldo válido.' };
    }

    await database.transaction(
      'rw',
      database.zones,
      database.restaurantTables,
      database.reservations,
      database.customers,
      database.sync_queue,
      async () => {
        // Clear existing tables
        await database.zones.clear();
        await database.restaurantTables.clear();
        await database.reservations.clear();
        await database.customers.clear();
        await database.sync_queue.clear();

        // Restore tables
        if (backup.data.zones?.length) {
          await database.zones.bulkAdd(backup.data.zones);
        }
        if (backup.data.tables?.length) {
          await database.restaurantTables.bulkAdd(backup.data.tables);
        }
        if (backup.data.reservations?.length) {
          await database.reservations.bulkAdd(backup.data.reservations);
        }
        if (backup.data.customers?.length) {
          await database.customers.bulkAdd(backup.data.customers);
        }
        if (backup.data.syncQueue?.length) {
          await database.sync_queue.bulkAdd(backup.data.syncQueue);
        }
      }
    );

    return {
      success: true,
      message: `Restauración exitosa: ${backup.data.tables?.length || 0} mesas y ${backup.data.reservations?.length || 0} reservas restauradas.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al procesar el archivo: ${err?.message || 'Archivo JSON corrupto'}`,
    };
  }
}
