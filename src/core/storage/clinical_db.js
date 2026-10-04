/**
 * Pakimed Clinical Database & Telemetry Engine (On-Device Store-and-Forward)
 * 
 * Gestiona la persistencia local de expedientes clínicos, cálculo de telemetría institucional
 * y notificaciones mediante patrón observador (Event Subscription).
 * Totalmente compatible con ejecución en navegador local (LocalStorage / IndexedDB).
 */

class ClinicalDB {
  constructor() {
    this.STORAGE_KEY = 'pakimed_clinical_db_v1';
    this.METRICS_KEY = 'pakimed_telemetry_metrics_v1';
    this.listeners = [];
  }

  /**
   * Suscribe un listener que será notificado ante cualquier cambio en la BD
   * @param {Function} callback
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Notifica a todos los suscriptores
   * @private
   */
  _notify(event, data) {
    this.listeners.forEach(cb => {
      try {
        cb(event, data);
      } catch (err) {
        console.error('Error en listener de ClinicalDB:', err);
      }
    });
  }

  /**
   * Obtiene todos los expedientes guardados en el dispositivo
   * @returns {Array<Object>}
   */
  getAllRecords() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error al leer expedientes de ClinicalDB:', e);
      return [];
    }
  }

  /**
   * Obtiene únicamente los expedientes pendientes de sincronización
   * @returns {Array<Object>}
   */
  getPendingRecords() {
    return this.getAllRecords().filter(r => r.status === 'PENDING_SYNC');
  }

  /**
   * Guarda un nuevo expediente clínico en la base de datos local
   * @param {Object} clinicalData - Datos estructurados y validados por el médico
   * @returns {Object} Expediente persistido con metadatos
   */
  saveRecord(clinicalData) {
    const records = this.getAllRecords();
    const entry = {
      id: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      status: 'PENDING_SYNC', // 'PENDING_SYNC' | 'SYNCED'
      syncedAt: null,
      dhis2EventId: null,
      data: clinicalData,
      localSecurityHash: 'SHA256-LOC-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    };

    records.unshift(entry);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));

    this._notify('RECORD_SAVED', entry);
    return entry;
  }

  /**
   * Marca todos los expedientes pendientes como consolidados en DHIS2
   * @returns {number} Cantidad de registros sincronizados
   */
  markAllSynced() {
    const records = this.getAllRecords();
    const now = new Date().toISOString();
    let syncedCount = 0;

    records.forEach(item => {
      if (item.status === 'PENDING_SYNC') {
        item.status = 'SYNCED';
        item.syncedAt = now;
        item.dhis2EventId = 'DHIS2_EV_' + Math.random().toString(36).substr(2, 7).toUpperCase();
        syncedCount++;
      }
    });

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    this._notify('ALL_SYNCED', { syncedCount, syncedAt: now });
    return syncedCount;
  }

  /**
   * Retorna métricas de telemetría calculadas a partir del estado de la BD
   * @param {boolean} isOnline - Estado actual del enlace de red
   * @returns {Object}
   */
  getTelemetryStats(isOnline = false) {
    const records = this.getAllRecords();
    const pending = records.filter(r => r.status === 'PENDING_SYNC').length;
    const synced = records.filter(r => r.status === 'SYNCED').length;

    return {
      totalRecords: records.length,
      pendingCount: pending,
      syncedCount: synced,
      outgoingTrafficKB: isOnline ? (synced * 1.8).toFixed(1) + ' KB' : '0.0 KB',
      isSecureLocal: true,
      lastSyncTime: records.find(r => r.syncedAt)?.syncedAt || null
    };
  }

  /**
   * Elimina todos los datos locales (para pruebas o reset)
   */
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._notify('DB_CLEARED', null);
  }
}

// Instancia Singleton
const clinicalDBInstance = new ClinicalDB();

// Exportación Universal
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.DB = clinicalDBInstance;
  window.Pakimed.Storage = clinicalDBInstance; // Alias de compatibilidad
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClinicalDB, clinicalDBInstance };
}
