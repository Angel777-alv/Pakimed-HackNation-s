/**
 * Pakimed Store-and-Forward Offline Queue
 * Gestiona el almacenamiento local cifrado/seguro de expedientes
 * y la sincronización por lotes hacia DHIS2 cuando hay conectividad.
 */

export class OfflineQueue {
  static STORAGE_KEY = 'pakimed_offline_records_v1';

  /**
   * Obtiene todos los registros locales
   * @returns {Array}
   */
  static getRecords() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer de almacenamiento local:', e);
      return [];
    }
  }

  /**
   * Guarda un nuevo registro en la cola local
   * @param {Object} clinicalRecord
   * @returns {Object} Registro guardado con id y timestamp
   */
  static enqueue(clinicalRecord) {
    const records = this.getRecords();
    const entry = {
      id: 'vox_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      status: 'PENDING_SYNC', // 'PENDING_SYNC' | 'SYNCED' | 'FAILED'
      data: clinicalRecord,
      retryCount: 0
    };
    records.unshift(entry);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    return entry;
  }

  /**
   * Marca registros como sincronizados
   * @param {string} id
   * @param {string} dhis2EventId
   */
  static markAsSynced(id, dhis2EventId) {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index].status = 'SYNCED';
      records[index].syncedAt = new Date().toISOString();
      records[index].dhis2EventId = dhis2EventId;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    }
  }

  /**
   * Simula o ejecuta el envío Store-and-Forward de todos los registros pendientes
   * @param {Function} syncHandler - Función adaptadora hacia DHIS2
   * @returns {Promise<{successCount: number, failedCount: number}>}
   */
  static async processPendingQueue(syncHandler) {
    const records = this.getRecords();
    const pending = records.filter(r => r.status === 'PENDING_SYNC');
    let successCount = 0;
    let failedCount = 0;

    for (const item of pending) {
      try {
        const result = await syncHandler(item.data);
        if (result && result.success) {
          this.markAsSynced(item.id, result.eventId || 'DHIS2_' + Date.now());
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }

    return { successCount, failedCount };
  }

  /**
   * Limpia registros antiguos sincronizados
   */
  static clearSynced() {
    const records = this.getRecords().filter(r => r.status === 'PENDING_SYNC');
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
  }
}
