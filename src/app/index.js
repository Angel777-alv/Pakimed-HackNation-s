/**
 * Pakimed Main Controller (Tactical Clinical Edge AI)
 * 
 * Orquestador del User Journey móvil con diseño Stitch Tactical:
 * - Pantalla 1: Captura y dictado con Moonshine Voice ASR
 * - Pantalla 2: Inferencia Edge SLM on-device (0 Bytes de red)
 * - Pantalla 3: Previsualización de Ficha Clínica y Modal de Modificación (HITL)
 * - Pantalla 4: Cola Store-and-Forward y Serialización Estándar DHIS2
 * - Barra Demo: Ejecución 1-Click para Pitch y Grabación
 */

import { VoiceRecorder } from '../core/audio/voice_recorder.js';
import { ClinicalNER } from '../core/nlp/clinical_ner.js';
import { OfflineQueue } from '../core/storage/offline_queue.js';
import { DHIS2Adapter } from '../integrations/dhis2/dhis2_adapter.js';

class PakimedApp {
  constructor() {
    this.currentScreen = 1;
    this.extractedData = null;
    this.isOnline = false; // Iniciamos en 100% Offline para el Hackatón
    this.isAutoDemoRunning = false;

    this.recorder = new VoiceRecorder({
      onResult: (data) => this.handleVoiceResult(data),
      onStateChange: (state) => this.handleRecordingState(state)
    });

    this.initElements();
    this.bindEvents();
    this.startClock();
    this.loadScenarios();
    this.renderQueue();
    this.updateOnlineStatus();
  }

  initElements() {
    // Stepper y Navegación
    this.stepButtons = document.querySelectorAll('.step-btn');
    this.screenViews = document.querySelectorAll('.screen-view');
    this.phoneClock = document.getElementById('phoneClock');
    this.networkToggle = document.getElementById('networkToggle');
    this.networkBadge = document.getElementById('networkBadge');
    this.btnQuickDemo = document.getElementById('btnQuickDemo');
    this.headerQueueCount = document.getElementById('headerQueueCount');

    // Pantalla 1 (Dictado)
    this.scenarioSelect = document.getElementById('scenarioSelect');
    this.micBtn = document.getElementById('micBtn');
    this.micStatusText = document.getElementById('micStatusText');
    this.dictationText = document.getElementById('dictationText');
    this.processBtn = document.getElementById('processBtn');

    // Pantalla 2 (Inferencia)
    this.processingStepText = document.getElementById('processingStepText');

    // Pantalla 3 (Previsualización & HITL)
    this.guardrailAlerts = document.getElementById('guardrailAlerts');
    this.prevAge = document.getElementById('prevAge');
    this.prevGender = document.getElementById('prevGender');
    this.prevBP = document.getElementById('prevBP');
    this.prevTemp = document.getElementById('prevTemp');
    this.prevHR = document.getElementById('prevHR');
    this.prevSymptoms = document.getElementById('prevSymptoms');
    this.prevMeds = document.getElementById('prevMeds');
    this.prevNotes = document.getElementById('prevNotes');
    this.btnOpenEditModal = document.getElementById('btnOpenEditModal');
    this.approveBtn = document.getElementById('approveBtn');

    // Modal de Edición Manual
    this.editModal = document.getElementById('editModal');
    this.btnCloseModal = document.getElementById('btnCloseModal');
    this.btnCancelEdit = document.getElementById('btnCancelEdit');
    this.btnSaveEdit = document.getElementById('btnSaveEdit');
    this.fieldAge = document.getElementById('fieldAge');
    this.fieldGender = document.getElementById('fieldGender');
    this.fieldBP = document.getElementById('fieldBP');
    this.fieldTemp = document.getElementById('fieldTemp');
    this.fieldHR = document.getElementById('fieldHR');
    this.fieldSymptoms = document.getElementById('fieldSymptoms');
    this.fieldMeds = document.getElementById('fieldMeds');
    this.fieldNotes = document.getElementById('fieldNotes');

    // Pantalla 4 (Store-and-Forward)
    this.queueContainer = document.getElementById('queueContainer');
    this.syncAllBtn = document.getElementById('syncAllBtn');
    this.jsonPreview = document.getElementById('jsonPreview');
  }

  bindEvents() {
    // Stepper Navigation
    this.stepButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.getAttribute('data-step'), 10);
        this.goToScreen(step);
      });
    });

    // Micrófono
    this.micBtn.addEventListener('click', () => {
      if (this.recorder.isRecording) {
        this.recorder.stop();
      } else {
        this.recorder.start();
      }
    });

    // Selector de escenarios
    this.scenarioSelect.addEventListener('change', (e) => {
      const scenarios = VoiceRecorder.getDemoScenarios();
      const index = parseInt(e.target.value, 10);
      if (!isNaN(index) && scenarios[index]) {
        this.dictationText.value = scenarios[index].transcript;
      }
    });

    // Procesar inferencia
    this.processBtn.addEventListener('click', () => {
      this.runOfflineInference();
    });

    // Abrir Modal de Modificación
    this.btnOpenEditModal.addEventListener('click', () => {
      this.openEditModal();
    });

    // Cerrar Modal
    this.btnCloseModal.addEventListener('click', () => this.closeEditModal());
    this.btnCancelEdit.addEventListener('click', () => this.closeEditModal());
    this.editModal.addEventListener('click', (e) => {
      if (e.target === this.editModal) this.closeEditModal();
    });

    // Guardar cambios del Modal
    this.btnSaveEdit.addEventListener('click', () => {
      this.saveModalChanges();
    });

    // Aprobar Expediente
    this.approveBtn.addEventListener('click', () => {
      this.approveRecord();
    });

    // Sincronizar Lote DHIS2
    this.syncAllBtn.addEventListener('click', () => {
      this.syncPendingRecords();
    });

    // Toggle de Red (Offline / 3G)
    this.networkToggle.addEventListener('click', () => {
      this.isOnline = !this.isOnline;
      this.updateOnlineStatus();
    });

    // Botón Demo Rápida (1-Click Pitch Pipeline)
    this.btnQuickDemo.addEventListener('click', () => {
      this.runQuickDemoPipeline();
    });
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      if (this.phoneClock) {
        this.phoneClock.textContent = `${hours}:${minutes}`;
      }
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  loadScenarios() {
    const scenarios = VoiceRecorder.getDemoScenarios();
    this.scenarioSelect.innerHTML = '<option value="">-- Seleccionar caso de prueba --</option>';
    scenarios.forEach((s, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = s.title;
      this.scenarioSelect.appendChild(opt);
    });

    if (scenarios.length > 0) {
      this.dictationText.value = scenarios[0].transcript;
      this.scenarioSelect.value = "0";
    }
  }

  updateOnlineStatus() {
    if (this.isOnline) {
      this.networkBadge.className = 'status-badge-offline online';
      this.networkBadge.innerHTML = '<span class="status-icon">📶</span> 3G ONLINE';
      this.networkBadge.style.background = 'rgba(78, 222, 163, 0.18)';
      this.networkBadge.style.color = '#4edea3';
      this.networkBadge.style.borderColor = 'rgba(78, 222, 163, 0.4)';
      this.networkToggle.textContent = 'Simular 100% Offline';
    } else {
      this.networkBadge.className = 'status-badge-offline';
      this.networkBadge.innerHTML = '<span class="status-icon">📶</span> OFFLINE';
      this.networkBadge.style.background = 'rgba(255, 177, 72, 0.15)';
      this.networkBadge.style.color = '#ffb148';
      this.networkBadge.style.borderColor = 'rgba(255, 177, 72, 0.35)';
      this.networkToggle.textContent = '📶 Simular Señal 3G';
    }
  }

  goToScreen(stepNumber) {
    this.currentScreen = stepNumber;
    this.stepButtons.forEach(b => {
      b.classList.toggle('active', parseInt(b.getAttribute('data-step'), 10) === stepNumber);
    });
    this.screenViews.forEach(v => {
      v.classList.toggle('active', parseInt(v.getAttribute('data-screen'), 10) === stepNumber);
    });
  }

  handleRecordingState(state) {
    if (state === 'RECORDING') {
      this.micBtn.classList.add('recording');
      this.micStatusText.textContent = '🎙️ Grabando dictado con Moonshine Voice ASR...';
    } else {
      this.micBtn.classList.remove('recording');
      this.micStatusText.textContent = 'Toca para iniciar el dictado clínico';
    }
  }

  handleVoiceResult({ finalTranscript }) {
    if (finalTranscript) {
      this.dictationText.value += (this.dictationText.value ? ' ' : '') + finalTranscript;
    }
  }

  async runOfflineInference() {
    const text = this.dictationText.value.trim();
    if (!text) {
      alert('Por favor dicta o escribe una nota clínica antes de procesar.');
      return;
    }

    this.goToScreen(2); // Inferencia
    this.processingStepText.textContent = 'Ejecutando Moonshine ASR y Extractor NER local...';

    await new Promise(r => setTimeout(r, 650));
    this.processingStepText.textContent = 'Aplicando guardarraíles éticos IEEE 7000 (Cero Diagnóstico)...';
    await new Promise(r => setTimeout(r, 450));

    this.extractedData = ClinicalNER.extractClinicalEntities(text);
    this.renderPreviewCard(this.extractedData);
    this.goToScreen(3); // Previsualización HITL
  }

  renderPreviewCard(data) {
    // Demografía
    this.prevAge.textContent = data.patient.age ? `${data.patient.age}a` : 'S/E';
    this.prevGender.textContent = data.patient.gender === 'F' ? '(Femenino)' : (data.patient.gender === 'M' ? '(Masculino)' : '(No reg.)');

    // Signos Vitales
    this.prevBP.textContent = data.vitals.bloodPressure || '120/80';
    this.prevTemp.textContent = data.vitals.temperature !== null ? data.vitals.temperature : '36.8';
    this.prevHR.textContent = data.vitals.heartRate !== null ? data.vitals.heartRate : '75';

    // Síntomas
    if (data.symptoms && data.symptoms.length > 0) {
      this.prevSymptoms.innerHTML = data.symptoms.map(s => `<span class="symptom-chip">${s}</span>`).join('');
    } else {
      this.prevSymptoms.innerHTML = '<span class="symptom-chip" style="opacity:0.6;">Sin síntomas detectados</span>';
    }

    // Prescripciones
    if (data.prescriptions && data.prescriptions.length > 0) {
      this.prevMeds.innerHTML = data.prescriptions.map(p => `
        <div class="prescription-row">
          <span class="rx-icon">💊</span>
          <div class="rx-info">
            <strong>${p}</strong>
            <span>Prescripción explícita dictada</span>
          </div>
          <span class="rx-stock-badge">En Botiquín Rural</span>
        </div>
      `).join('');
    } else {
      this.prevMeds.innerHTML = '<div class="prescription-row"><span class="rx-icon">📋</span><div class="rx-info"><strong>Ninguna medicación indicada</strong></div></div>';
    }

    // Dictado Original
    this.prevNotes.textContent = `"${data.rawTranscript || 'Sin notas'}"`;

    // Alertas de Guardarraíles
    if (data.guardrailAlerts && data.guardrailAlerts.length > 0) {
      this.guardrailAlerts.innerHTML = `
        <div class="guardrail-alert warning">
          ⚠️ <strong>Alerta Ética:</strong> ${data.guardrailAlerts.join('<br>')}
        </div>
      `;
    } else {
      this.guardrailAlerts.innerHTML = `
        <div class="guardrail-alert">
          🛡️ <strong>Guardarraíl Activo:</strong> Cero diagnóstico autónomo detectado. La IA estructuró únicamente lo dictado por el médico.
        </div>
      `;
    }
  }

  openEditModal() {
    if (!this.extractedData) return;
    this.fieldAge.value = this.extractedData.patient.age || '';
    this.fieldGender.value = this.extractedData.patient.gender || '';
    this.fieldBP.value = this.extractedData.vitals.bloodPressure || '';
    this.fieldTemp.value = this.extractedData.vitals.temperature || '';
    this.fieldHR.value = this.extractedData.vitals.heartRate || '';
    this.fieldSymptoms.value = this.extractedData.symptoms.join(', ');
    this.fieldMeds.value = this.extractedData.prescriptions.join('; ');
    this.fieldNotes.value = this.extractedData.doctorNotes || '';

    this.editModal.classList.add('open');
    this.editModal.setAttribute('aria-hidden', 'false');
  }

  closeEditModal() {
    this.editModal.classList.remove('open');
    this.editModal.setAttribute('aria-hidden', 'true');
  }

  saveModalChanges() {
    if (!this.extractedData) return;

    this.extractedData.patient.age = this.fieldAge.value ? parseInt(this.fieldAge.value, 10) : null;
    this.extractedData.patient.gender = this.fieldGender.value;
    this.extractedData.vitals.bloodPressure = this.fieldBP.value.trim();
    this.extractedData.vitals.temperature = this.fieldTemp.value ? parseFloat(this.fieldTemp.value) : null;
    this.extractedData.vitals.heartRate = this.fieldHR.value ? parseInt(this.fieldHR.value, 10) : null;
    this.extractedData.symptoms = this.fieldSymptoms.value.split(',').map(s => s.trim()).filter(Boolean);
    this.extractedData.prescriptions = this.fieldMeds.value.split(';').map(m => m.trim()).filter(Boolean);
    this.extractedData.doctorNotes = this.fieldNotes.value.trim();

    this.renderPreviewCard(this.extractedData);
    this.closeEditModal();
  }

  approveRecord() {
    if (!this.extractedData) return;

    const approvedRecord = {
      patient: {
        age: this.extractedData.patient.age,
        gender: this.extractedData.patient.gender
      },
      vitals: {
        bloodPressure: this.extractedData.vitals.bloodPressure,
        temperature: this.extractedData.vitals.temperature,
        heartRate: this.extractedData.vitals.heartRate
      },
      symptoms: this.extractedData.symptoms,
      prescriptions: this.extractedData.prescriptions,
      doctorNotes: this.extractedData.doctorNotes,
      approvedAt: new Date().toISOString()
    };

    OfflineQueue.enqueue(approvedRecord);
    const dhis2Payload = DHIS2Adapter.formatToDHIS2Event(approvedRecord);
    this.jsonPreview.textContent = JSON.stringify(dhis2Payload, null, 2);

    this.renderQueue();
    this.goToScreen(4); // Pasar a cola Store-and-Forward
  }

  renderQueue() {
    const records = OfflineQueue.getRecords();
    const pendingCount = records.filter(r => r.status === 'PENDING_SYNC').length;
    if (this.headerQueueCount) {
      this.headerQueueCount.textContent = `${pendingCount} Encolados`;
    }

    if (records.length === 0) {
      this.queueContainer.innerHTML = '<p style="color: var(--text-variant); font-size: 0.72rem; text-align: center; padding: 1rem;">No hay consultas en la cola local.</p>';
      return;
    }

    this.queueContainer.innerHTML = records.map(r => `
      <div class="queue-card-item ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
        <div>
          <div class="queue-item-title">
            Expediente #${r.id.substring(4, 9)} &middot; Paciente ${r.data.patient?.gender || 'N/A'} (${r.data.patient?.age ? r.data.patient.age + 'a' : 'S/E'})
          </div>
          <div class="queue-item-meta">
            ${new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | ${r.data.symptoms?.slice(0, 2).join(', ') || 'General'}
          </div>
        </div>
        <span class="badge-signal ${r.status === 'SYNCED' ? 'online' : 'offline'}">
          ${r.status === 'SYNCED' ? '✓ Enviado' : '⏳ Pendiente'}
        </span>
      </div>
    `).join('');
  }

  async syncPendingRecords() {
    if (!this.isOnline) {
      alert('⚠️ Actualmente estás en modo 100% Offline. Activa el botón "📶 Simular Señal 3G" para sincronizar con DHIS2.');
      return;
    }

    this.syncAllBtn.disabled = true;
    this.syncAllBtn.textContent = 'Enviando a DHIS2...';

    await OfflineQueue.processPendingQueue(async (record) => {
      const payload = DHIS2Adapter.formatToDHIS2Event(record);
      return await DHIS2Adapter.sendEvent(payload);
    });

    this.syncAllBtn.disabled = false;
    this.syncAllBtn.textContent = 'Sincronizar Lote';
    this.renderQueue();
  }

  /**
   * Pipeline Automatizado de 1-Clic para Demostración Ágil del Pitch
   */
  async runQuickDemoPipeline() {
    if (this.isAutoDemoRunning) return;
    this.isAutoDemoRunning = true;

    // 1. Pantalla 1: Cargar caso y simular dictado
    this.goToScreen(1);
    const scenarios = VoiceRecorder.getDemoScenarios();
    this.scenarioSelect.value = "0";
    this.dictationText.value = scenarios[0].transcript;
    this.micBtn.classList.add('recording');
    this.micStatusText.textContent = '🎙️ Transcribiendo con Moonshine Voice ASR...';

    await new Promise(r => setTimeout(r, 800));
    this.micBtn.classList.remove('recording');

    // 2. Pantalla 2: Inferencia Edge SLM
    this.goToScreen(2);
    this.processingStepText.textContent = 'Extrayendo entidades clínicas on-device...';
    await new Promise(r => setTimeout(r, 600));

    // 3. Pantalla 3: Renderizar Previsualización
    this.extractedData = ClinicalNER.extractClinicalEntities(this.dictationText.value);
    this.renderPreviewCard(this.extractedData);
    this.goToScreen(3);
    await new Promise(r => setTimeout(r, 900));

    // 4. Aprobación y Pantalla 4
    this.approveRecord();

    this.isAutoDemoRunning = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pakimedApp = new PakimedApp();
});
