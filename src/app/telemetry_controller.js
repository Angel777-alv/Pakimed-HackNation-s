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
    this.telemSafetyText = document.getElementById('telemSafetyText');
    this.telemNetworkText = document.getElementById('telemNetworkText');
    this.queueList = document.getElementById('queueList');
    this.syncAllBtn = document.getElementById('syncAllBtn');
    this.dhis2JsonViewer = document.getElementById('dhis2JsonViewer');
    this.syncStatusAlert = document.getElementById('syncStatusAlert');
    this.phoneBadge = document.getElementById('phoneBadge');

    // Elementos del Pipeline Visualizer
    this.pipelineStatusDot = document.getElementById('pipelineStatusDot');
    this.pipelineStatusText = document.getElementById('pipelineStatusText');
    this.inspectorStepBadge = document.getElementById('inspectorStepBadge');
    this.inspectorTitle = document.getElementById('inspectorTitle');
    this.inspectorLatencyBadge = document.getElementById('inspectorLatencyBadge');
    this.inspectorDescription = document.getElementById('inspectorDescription');

    this.nodes = {
      1: document.getElementById('nodeVoice'),
      2: document.getElementById('nodeAI'),
      3: document.getElementById('nodeSafety'),
      4: document.getElementById('nodeVault'),
      5: document.getElementById('nodeCloud')
    };

    this.connectors = {
      1: document.getElementById('connector1_2'),
      2: document.getElementById('connector2_3'),
      3: document.getElementById('connector3_4'),
      4: document.getElementById('connector4_5')
    };

    this.currentStep = 0;
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

    // Click-to-Inspect en cada nodo del pipeline interactivo
    Object.keys(this.nodes).forEach(stepStr => {
      const stepNum = parseInt(stepStr, 10);
      const nodeEl = this.nodes[stepNum];
      if (nodeEl) {
        nodeEl.addEventListener('click', (e) => {
          e.preventDefault();
          this.setPipelineStep(stepNum, { manualInspect: true });
        });
      }
    });

    window.addEventListener('pakimed:languageChanged', () => {
      this.updateOnlineUI();
      this.render();
    });
  }

  subscribeToDB() {
    if (this.db && typeof this.db.subscribe === 'function') {
      this.db.subscribe((event, payload) => {
        this.render();
        if (event === 'RECORD_SAVED') {
          if (this.syncStatusAlert) {
            this.syncStatusAlert.textContent = `✓ Record ${payload.id} safely stored in local encrypted queue.`;
          }
          this.setPipelineStep(4);
        }
      });
    }
  }

  /**
   * Actualiza el estado reactivo del pipeline (Paso 0 a 5)
   */
  setPipelineStep(stepIndex, options = {}) {
    const STEPS = {
      0: {
        stepBadge: 'READY · STANDBY',
        title: 'Edge System Ready for Encounter',
        latencyBadge: '⚡ 0ms Latency',
        punchline: 'System waiting for clinical consultation dictation. All processing runs completely on-device without internet.',
        statusText: 'Pipeline Ready · Standby Mode',
        safetyText: 'Zero AI Diagnosis'
      },
      1: {
        stepBadge: 'STEP 1 ACTIVE',
        title: 'Doctor Voice Dictation',
        latencyBadge: '🎙️ Live Audio Buffer',
        punchline: 'Capturing conversational audio directly in device RAM. No external audio streaming or third-party servers involved.',
        statusText: 'Capturing Voice · Moonshine On-Device ASR',
        safetyText: 'Local Audio Confinement'
      },
      2: {
        stepBadge: 'STEP 2 ACTIVE',
        title: 'Local AI Clinical Extraction',
        latencyBadge: '🧠 ~18ms On-Device Latency',
        punchline: 'Small AI (ConText + Qwen2.5) extracts vitals, symptoms, and dosages locally with < 35 KB memory footprint.',
        statusText: 'Extracting Entities · Small AI & Clinical NER',
        safetyText: 'Entity Extraction Only'
      },
      3: {
        stepBadge: 'STEP 3 ACTIVE',
        title: 'Clinical Safety & Doctor Verification',
        latencyBadge: '🛡️ IEEE 7000 Guardrails Active',
        punchline: 'Strict zero autonomous AI diagnosis enforcement. Biological plausibility filters flag out-of-range vitals before doctor signs.',
        statusText: 'Safety Audit · Clinician Review (HITL)',
        safetyText: 'Doctor Retains Final Sign-off'
      },
      4: {
        stepBadge: 'STEP 4 ACTIVE',
        title: 'Encrypted Local Vault Storage',
        latencyBadge: '💾 AES-256 Local Sandbox',
        punchline: 'Encounter saved in immutable device SQLite/IndexedDB queue. Preserved safely against power loss or lack of coverage.',
        statusText: 'Secured On-Device · Store & Forward Queue',
        safetyText: 'Encrypted at Rest'
      },
      5: {
        stepBadge: 'STEP 5 ACTIVE',
        title: 'Institutional Public Health Sync (DHIS2)',
        latencyBadge: '🚀 One-Click Cloud Sync',
        punchline: 'When 3G/Wi-Fi link is detected, encrypted batches are validated and synchronized directly into national DHIS2 servers.',
        statusText: 'Synchronizing Batch · Official DHIS2 Tracker API',
        safetyText: 'DHIS2 Compliant Payload'
      }
    };

    const stepData = STEPS[stepIndex] || STEPS[0];
    this.currentStep = stepIndex;

    // Actualizar Inspector Spotlight Card
    if (this.inspectorStepBadge) this.inspectorStepBadge.textContent = stepData.stepBadge;
    if (this.inspectorTitle) this.inspectorTitle.textContent = stepData.title;
    if (this.inspectorLatencyBadge) this.inspectorLatencyBadge.textContent = stepData.latencyBadge;
    if (this.inspectorDescription) this.inspectorDescription.textContent = stepData.punchline;
    if (this.telemSafetyText) this.telemSafetyText.textContent = stepData.safetyText;
    if (this.pipelineStatusText) this.pipelineStatusText.textContent = stepData.statusText;

    // Actualizar clases visuales de los nodos (1 a 5)
    Object.keys(this.nodes).forEach(sStr => {
      const s = parseInt(sStr, 10);
      const nodeEl = this.nodes[s];
      if (!nodeEl) return;

      nodeEl.classList.remove('active', 'completed', 'idle');
      if (s === stepIndex) {
        nodeEl.classList.add('active');
      } else if (s < stepIndex) {
        nodeEl.classList.add('completed');
      } else {
        nodeEl.classList.add('idle');
      }
    });

    // Actualizar conectores
    Object.keys(this.connectors).forEach(cStr => {
      const c = parseInt(cStr, 10);
      const connEl = this.connectors[c];
      if (!connEl) return;

      if (c < stepIndex) {
        connEl.classList.add('active');
      } else {
        connEl.classList.remove('active');
      }
    });
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
        this.phoneBadge.textContent = i18n ? i18n.get('phone_status_online') : '📶 3G Link Active';
      }
      if (this.networkToggle) {
        this.networkToggle.textContent = 'Network: Switch to Offline Mode';
      }
      if (this.telemNetworkText) {
        this.telemNetworkText.textContent = '3G Health Network Online';
      }
      if (this.syncAllBtn) {
        this.syncAllBtn.disabled = false;
      }
    } else {
      if (this.phoneBadge) {
        this.phoneBadge.className = 'status-pill offline';
        this.phoneBadge.textContent = i18n ? i18n.get('phone_status_offline') : 'Local Mode (Offline)';
      }
      if (this.networkToggle) {
        this.networkToggle.textContent = 'Network: Simulate 3G Online Link';
      }
      if (this.telemNetworkText) {
        this.telemNetworkText.textContent = 'Offline Autonomous';
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
      this.queueList.innerHTML = '<div class="empty-queue-msg">No encounters in queue. Validate a consultation on the phone to preview it here.</div>';
      return;
    }

    this.queueList.innerHTML = records.map(r => `
      <div class="queue-card ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
        <div>
          <div class="queue-card-id">${r.id} &middot; Patient ${r.data.patient?.gender || 'N/A'} (${r.data.patient?.age ? r.data.patient.age + ' ' + (r.data.patient?.ageUnit || 'y') : 'Age N/A'})</div>
          <div class="queue-card-desc">Recorded: ${new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | ${r.data.symptoms?.slice(0, 2).join(', ') || 'General consultation'}</div>
        </div>
        <span class="queue-tag ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
          ${r.status === 'SYNCED' ? '✓ Synced with DHIS2' : '⏳ In Local Queue (Store & Forward)'}
        </span>
      </div>
    `).join('');
  }

  async syncWithDHIS2() {
    if (!this.isOnline) {
      alert('Application is in Offline Autonomous Mode. Please click the top button to simulate a 3G network link before syncing batch.');
      return;
    }

    this.syncAllBtn.disabled = true;
    this.syncAllBtn.textContent = 'Transmitting batch to public health cloud...';
    this.setPipelineStep(5);

    await new Promise(r => setTimeout(r, 900));

    if (this.db) {
      const count = this.db.markAllSynced();
      if (this.syncStatusAlert) {
        this.syncStatusAlert.textContent = `✓ ${count} record(s) transmitted and consolidated successfully into DHIS2.`;
      }
    }

    this.syncAllBtn.disabled = false;
    this.syncAllBtn.textContent = 'Sync Batch with DHIS2';
    this.render();
  }

  showDHIS2Payload(payload) {
    if (this.dhis2JsonViewer) {
      this.dhis2JsonViewer.textContent = JSON.stringify(payload, null, 2);
    }
  }

  setSafetyStatus(statusText, isWarning = false) {
    if (this.telemSafetyText) {
      this.telemSafetyText.textContent = statusText;
      if (isWarning) {
        this.telemSafetyText.className = 'strip-metric-val text-amber';
      } else {
        this.telemSafetyText.className = 'strip-metric-val text-emerald';
      }
    }
  }
}

// Inicialización global
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.TelemetryController = TelemetryController;
}
