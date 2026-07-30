import { PreExecutionSnapshot, DatabaseType } from '../types';
import { INITIAL_TABLE_DATA } from '../db/initialData';

class BackupManager {
  private snapshots: Map<string, PreExecutionSnapshot> = new Map();

  public createSnapshot(dbType: DatabaseType, table: string, queryText: string, currentData: any[]): PreExecutionSnapshot {
    const snapshotId = `SNAP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    
    // Deep clone data to freeze state prior to execution
    const snapshotData = JSON.parse(JSON.stringify(currentData));

    const snapshot: PreExecutionSnapshot = {
      id: snapshotId,
      timestamp: new Date().toISOString(),
      dbType,
      table,
      affectedRowCount: currentData.length,
      snapshotData,
      status: 'ACTIVE',
      queryText
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  public getSnapshot(snapshotId: string): PreExecutionSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  public getAllSnapshots(): PreExecutionSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public rollback(snapshotId: string): { success: boolean; restoredRows: number; table: string; message: string } {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return { success: false, restoredRows: 0, table: '', message: 'Snapshot not found.' };
    }

    if (snapshot.status === 'ROLLED_BACK') {
      return { success: false, restoredRows: 0, table: snapshot.table, message: 'Snapshot already rolled back.' };
    }

    // Restore dataset state
    INITIAL_TABLE_DATA[snapshot.table] = JSON.parse(JSON.stringify(snapshot.snapshotData));
    snapshot.status = 'ROLLED_BACK';

    return {
      success: true,
      restoredRows: snapshot.snapshotData.length,
      table: snapshot.table,
      message: `Database state for table '${snapshot.table}' successfully restored to snapshot ${snapshotId}.`
    };
  }
}

export const backupManager = new BackupManager();
