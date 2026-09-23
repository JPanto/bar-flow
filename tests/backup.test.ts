import { describe, it, expect, beforeEach } from 'vitest';
import { BarMvpDB } from '../src/db';
import { seedInitialData } from '../src/db/seed';
import { exportDatabaseToJson, importDatabaseFromJson } from '../src/utils/backup';

describe('JSON Backup and Restore Utility', () => {
  let sourceDb: BarMvpDB;
  let targetDb: BarMvpDB;

  beforeEach(async () => {
    sourceDb = new BarMvpDB(`src_db_${Date.now()}_${Math.random()}`);
    await sourceDb.open();
    await seedInitialData(sourceDb);

    targetDb = new BarMvpDB(`target_db_${Date.now()}_${Math.random()}`);
    await targetDb.open();
  });

  it('should export database to valid JSON string and restore it into target db', async () => {
    const jsonString = await exportDatabaseToJson(sourceDb);
    expect(jsonString).toBeDefined();

    const parsed = JSON.parse(jsonString);
    expect(parsed.version).toBe(1);
    expect(parsed.data.zones.length).toBeGreaterThan(0);
    expect(parsed.data.tables.length).toBe(6);
    expect(parsed.data.reservations.length).toBe(2);

    // Target DB initially empty
    const initialZones = await targetDb.zones.count();
    expect(initialZones).toBe(0);

    // Import into target
    const result = await importDatabaseFromJson(targetDb, jsonString);
    expect(result.success).toBe(true);

    // Verify target DB restored
    const restoredZones = await targetDb.zones.toArray();
    expect(restoredZones.length).toBe(parsed.data.zones.length);
    expect(restoredZones[0].name).toBe('Salón Principal');

    const restoredTables = await targetDb.restaurantTables.toArray();
    expect(restoredTables.length).toBe(6);

    const restoredReservations = await targetDb.reservations.toArray();
    expect(restoredReservations.length).toBe(2);
  });

  it('should reject invalid JSON content gracefully', async () => {
    const result = await importDatabaseFromJson(targetDb, 'invalid json string');
    expect(result.success).toBe(false);
  });
});
