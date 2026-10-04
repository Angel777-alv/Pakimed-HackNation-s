/**
 * Pakimed Store-and-Forward Offline Queue
 * 
 * Gestiona la persistencia local de expedientes clínicos en el sandbox
 * del navegador (LocalStorage / IndexedDB) y su ciclo de vida:
 * - PENDING_SYNC (Almacenamiento seguro on-device)
 * - SYNCED (Consolidado en DHIS2 al detectar red)
 */

const OfflineQueue = {
  STORAGE_KEY: 'pakimed_offline_records_v3',

  /**
   * Obtiene todos los registros almacenados
   * @returns {Array}
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer la cola local:', e);
      return [];
    }
  },

  /**
   * Guarda un nuevo expediente en la cola local
   * @param {Object} clinicalRecord - Datos estructurados y validados por el médico
   * @returns {Object} Entrada persistida
   */
  save(clinicalRecord) {
    const items = this.getAll();
    const entry = {
      id: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      status: 'PENDING_SYNC', // 'PENDING_SYNC' | 'SYNCED'
      data: clinicalRecord
    };
    items.unshift(entry);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    return entry;
  },

  /**
   * Marca todas las consultas pendientes como sincronizadas con DHIS2
   */
  markAllSynced() {
    const items = this.getAll();
    const now = new Date().toISOString();
    items.forEach(item => {
      item.status = 'SYNCED';
      item.syncedAt = now;
      item.dhis2EventId = 'DHIS2_EV_' + Math.random().toString(36).substr(2, 7).toUpperCase();
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  },

  /**
   * Limpia toda la cola local (para propósitos de depuración o reset)
   */
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

// Exportación Universal
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.Storage = OfflineQueue;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflineQueue };
}
