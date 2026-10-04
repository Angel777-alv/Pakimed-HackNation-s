/**
 * Pakimed - Controlador de la Consola Institucional de Telemetría y DHIS2
 * Responsabilidad exclusiva: Panel lateral derecho (Centro de Telemetría).
 * Desacoplado de la interfaz móvil del médico; se sincroniza automáticamente
 * escuchando eventos de ClinicalDB (window.Pakimed.DB).
 */

class TelemetryController {
  constructor() {
    this.isOnline = false;
    this.db = window.Pakimed && window.Pakimed.DB ? window.Pakimed.DB : null;
    this.initElements();
    this.bindEvents();
    this.subscribeToDB();
    this.render();
  }

  initElements() {
    this.networkToggle = document.getElementById('networkToggle');
    this.telemBytes = document.getElementById('telemBytes');
    this.telemSafety = document.getElementById('telemSafety');
    this.telemNetwork = document.getElementById('telemNetwork');
    this.queueList = document.getElementById('queueList');
    this.syncAllBtn = document.getElementById('syncAllBtn');
    this.dhis2JsonViewer = document.getElementById('dhis2JsonViewer');
    this.syncStatusAlert = document.getElementById('syncStatusAlert');
    this.phoneBadge = document.getElementById('phoneBadge');
  }

  bindEvents() {
    if (this.networkToggle) {
      this.networkToggle.addEventListener('click', () => {
        this.toggleNetwork();
      });
    }

    if (this.syncAllBtn) {
      this.syncAllBtn.addEventListener('click', () => {
        this.syncWithDHIS2();
      });
    }

    window.addEventListener('pakimed:languageChanged', () => {
      this.updateOnlineUI();
      this.render();
    });
  }

  subscribeToDB() {
    if (this.db && typeof this.db.subscribe === 'function') {
      this.db.subscribe((event, payload) => {
        this.render();
        if (event === 'RECORD_SAVED' && this.syncStatusAlert) {
          this.syncStatusAlert.textContent = `✓ Expediente ${payload.id} resguardado en almacenamiento local cifrado.`;
        }
      });
    }
  }

  toggleNetwork() {
    this.isOnline = !this.isOnline;
    this.updateOnlineUI();
    this.renderMetrics();
  }

  updateOnlineUI() {
    const i18n = window.I18nManager;
    if (this.isOnline) {
      if (this.phoneBadge) {
        this.phoneBadge.className = 'status-pill online';
        this.phoneBadge.textContent = i18n ? i18n.get('phone_status_online') : '📶 Enlace Activo (3G)';
      }
      if (this.networkToggle) {
        this.networkToggle.textContent = i18n ? i18n.get('btn_network_offline') : 'Modo Local (Sin red)';
      }
      if (this.telemNetwork) {
        this.telemNetwork.textContent = i18n ? i18n.get('telemetry_network_state_online') : 'Enlace institucional 3G disponible (Listo para sincronizar)';
      }
      if (this.syncAllBtn) {
        this.syncAllBtn.disabled = false;
      }
    } else {
      if (this.phoneBadge) {
        this.phoneBadge.className = 'status-pill offline';
        this.phoneBadge.textContent = i18n ? i18n.get('phone_status_offline') : 'Modo Local (Sin red)';
      }
      if (this.networkToggle) {
        this.networkToggle.textContent = i18n ? i18n.get('btn_network_sim') : 'Conectividad: Simular Red Móvil (3G)';
      }
      if (this.telemNetwork) {
        this.telemNetwork.textContent = i18n ? i18n.get('telemetry_network_state_offline') : 'Modo Autónomo Local (Almacenamiento Seguro)';
      }
    }
  }

  render() {
    this.renderMetrics();
    this.renderQueue();
  }

  renderMetrics() {
    if (!this.db) return;
    const stats = this.db.getTelemetryStats(this.isOnline);

    if (this.telemBytes) {
      this.telemBytes.textContent = stats.outgoingTrafficKB;
    }
  }

  renderQueue() {
    if (!this.queueList || !this.db) return;
    const records = this.db.getAllRecords();

    if (records.length === 0) {
      this.queueList.innerHTML = '<div class="empty-queue-msg">No hay expedientes en cola. Valide una consulta médica en el teléfono para visualizarla aquí.</div>';
      return;
    }

    this.queueList.innerHTML = records.map(r => `
      <div class="queue-card ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
        <div>
          <div class="queue-card-id">${r.id} &middot; Paciente ${r.data.patient?.gender || 'N/A'} (${r.data.patient?.age ? r.data.patient.age + ' ' + (r.data.patient?.ageUnit || 'años') : 'Edad no reg.'})</div>
          <div class="queue-card-desc">Registrado: ${new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | ${r.data.symptoms?.slice(0, 2).join(', ') || 'Consulta médica general'}</div>
        </div>
        <span class="queue-tag ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
          ${r.status === 'SYNCED' ? '✓ Consolidado en DHIS2' : '⏳ En Cola Local (Store & Forward)'}
        </span>
      </div>
    `).join('');
  }

  async syncWithDHIS2() {
    if (!this.isOnline) {
      alert('La aplicación se encuentra en Modo Local autónomo. Activa el enlace móvil institucional con el botón superior para realizar la sincronización por lotes.');
      return;
    }

    this.syncAllBtn.disabled = true;
    this.syncAllBtn.textContent = 'Transmitiendo expedientes al sistema de salud...';

    await new Promise(r => setTimeout(r, 900));

    if (this.db) {
      const count = this.db.markAllSynced();
      if (this.syncStatusAlert) {
        this.syncStatusAlert.textContent = `✓ ${count} expediente(s) transmitidos y consolidados con éxito en la base de datos de DHIS2.`;
      }
    }

    this.syncAllBtn.disabled = false;
    this.syncAllBtn.textContent = 'Sincronizar Lote con DHIS2';
    this.render();
  }

  showDHIS2Payload(payload) {
    if (this.dhis2JsonViewer) {
      this.dhis2JsonViewer.textContent = JSON.stringify(payload, null, 2);
    }
  }

  setSafetyStatus(statusText, isWarning = false) {
    if (this.telemSafety) {
      const dotClass = isWarning ? 'dot-warn' : 'dot-ok';
      this.telemSafety.innerHTML = `<span class="${dotClass}"></span> ${statusText}`;
    }
  }
}

// Inicialización global
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.TelemetryController = TelemetryController;
}
