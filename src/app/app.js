/**
 * Pakimed - Controlador de Interfaz de Usuario (UI Orchestrator)
 * Arquitectura Desacoplada y Modular:
 * Consume los servicios provistos por los módulos de src/core/ y src/integrations/:
 * - window.Pakimed.VoiceRecorder (src/core/audio/voice_recorder.js)
 * - window.Pakimed.NER (src/core/nlp/clinical_ner.js)
 * - window.Pakimed.Guardrails (src/core/guardrails/guardrails.js)
 * - window.Pakimed.Storage (src/core/storage/offline_queue.js)
 * - window.Pakimed.DHIS2 (src/integrations/dhis2/dhis2_adapter.js)
 */

class PakimedApp {
  constructor() {
    this.currentScreen = 1;
    this.extractedData = null;
    this.isOnline = false;
    this.voiceEngine = null;

    this.initElements();
    this.initVoiceEngine();
    this.bindEvents();
    this.loadScenarios();
    this.renderQueue();
    this.updateOnlineUI();
    this.startClock();
  }

  initElements() {
    // Dispositivo Móvil
    this.phoneClock = document.getElementById('phoneClock');
    this.phoneBadge = document.getElementById('phoneBadge');
    this.stepTabs = document.querySelectorAll('.step-tab');
    this.screenViews = document.querySelectorAll('.phone-screen-view');

    // Pantalla 1: Dictado
    this.scenarioSelect = document.getElementById('scenarioSelect');
    this.micBtn = document.getElementById('micBtn');
    this.micIcon = document.getElementById('micIcon');
    this.micStatusText = document.getElementById('micStatusText');
    this.dictationText = document.getElementById('dictationText');
    this.processBtn = document.getElementById('processBtn');
    this.recordTimerBadge = document.getElementById('recordTimerBadge');
    this.recordTimerText = document.getElementById('recordTimerText');
    this.waveVisualizer = document.getElementById('waveVisualizer');
    this.audioProcessingIndicator = document.getElementById('audioProcessingIndicator');

    // Pantalla 2: Estructuración
    this.processingStepText = document.getElementById('processingStepText');
    this.pipeStep1 = document.getElementById('pipeStep1');
    this.pipeStep2 = document.getElementById('pipeStep2');
    this.pipeStep3 = document.getElementById('pipeStep3');
    this.pipeStep4 = document.getElementById('pipeStep4');

    // Pantalla 3: Validación Médica
    this.prevAge = document.getElementById('prevAge');
    this.prevGender = document.getElementById('prevGender');
    this.prevBP = document.getElementById('prevBP');
    this.prevTemp = document.getElementById('prevTemp');
    this.prevHR = document.getElementById('prevHR');
    this.prevSpO2 = document.getElementById('prevSpO2');
    this.prevSymptoms = document.getElementById('prevSymptoms');
    this.prevMeds = document.getElementById('prevMeds');
    this.prevNotes = document.getElementById('prevNotes');
    this.guardrailAlert = document.getElementById('guardrailAlert');
    this.incompleteAlert = document.getElementById('incompleteAlert');
    this.incompleteAlertMsg = document.getElementById('incompleteAlertMsg');
    this.btnOpenEdit = document.getElementById('btnOpenEdit');
    this.approveBtn = document.getElementById('approveBtn');

    // Modal de Edición (HITL)
    this.editModal = document.getElementById('editModal');
    this.btnCloseModal = document.getElementById('btnCloseModal');
    this.btnCancelEdit = document.getElementById('btnCancelEdit');
    this.btnSaveEdit = document.getElementById('btnSaveEdit');
    this.fieldAge = document.getElementById('fieldAge');
    this.fieldGender = document.getElementById('fieldGender');
    this.fieldBP = document.getElementById('fieldBP');
    this.fieldTemp = document.getElementById('fieldTemp');
    this.fieldHR = document.getElementById('fieldHR');
    this.fieldSpO2 = document.getElementById('fieldSpO2');
    this.fieldSymptoms = document.getElementById('fieldSymptoms');
    this.fieldMeds = document.getElementById('fieldMeds');
    this.fieldNotes = document.getElementById('fieldNotes');

    // Consola Institucional de Telemetría (Lado Derecho)
    this.networkToggle = document.getElementById('networkToggle');
    this.btnQuickDemo = document.getElementById('btnQuickDemo');
    this.telemBytes = document.getElementById('telemBytes');
    this.telemSafety = document.getElementById('telemSafety');
    this.telemNetwork = document.getElementById('telemNetwork');
    this.queueList = document.getElementById('queueList');
    this.syncAllBtn = document.getElementById('syncAllBtn');
    this.dhis2JsonViewer = document.getElementById('dhis2JsonViewer');
    this.syncStatusAlert = document.getElementById('syncStatusAlert');
  }

  initVoiceEngine() {
    const VoiceRecorderClass = (window.Pakimed && window.Pakimed.VoiceRecorder) 
      ? window.Pakimed.VoiceRecorder 
      : null;

    if (VoiceRecorderClass) {
      this.voiceEngine = new VoiceRecorderClass({
        onResult: ({ finalTranscript, interimTranscript }) => {
          const current = this.dictationText.value;
          const toAdd = finalTranscript || interimTranscript;
          if (toAdd && !current.includes(toAdd)) {
            this.dictationText.value = current ? `${current} ${toAdd}` : toAdd;
          }
        },
        onError: (err) => {
          console.warn('Voice engine error/notice:', err);
        },
        onStateChange: (state, payload) => {
          this.handleVoiceStateChange(state, payload);
        }
      });
    }
  }

  handleVoiceStateChange(state, payload) {
    if (state === 'RECORDING') {
      this.micBtn.classList.add('recording');
      if (this.micIcon) this.micIcon.textContent = '⏹️';
      if (this.waveVisualizer) {
        this.waveVisualizer.classList.remove('dormant');
        this.waveVisualizer.classList.add('active');
      }
      if (this.recordTimerBadge) this.recordTimerBadge.classList.remove('hidden');
      if (this.audioProcessingIndicator) this.audioProcessingIndicator.classList.add('hidden');
      this.micStatusText.textContent = 'Grabando consulta... Toca para finalizar';
    } else if (state === 'TICK') {
      if (this.recordTimerText && payload && payload.formatted) {
        this.recordTimerText.textContent = payload.formatted;
      }
    } else if (state === 'PROCESSING') {
      this.micBtn.classList.remove('recording');
      if (this.micIcon) this.micIcon.textContent = '🎤';
      if (this.recordTimerBadge) this.recordTimerBadge.classList.add('hidden');
      if (this.waveVisualizer) {
        this.waveVisualizer.classList.remove('active');
        this.waveVisualizer.classList.add('dormant');
      }
      if (this.audioProcessingIndicator) this.audioProcessingIndicator.classList.remove('hidden');
      this.micStatusText.textContent = 'Procesando captura de voz on-device...';

      setTimeout(() => {
        if (this.audioProcessingIndicator) this.audioProcessingIndicator.classList.add('hidden');
        this.micStatusText.textContent = 'Audio capturado. Puedes revisar el texto o volver a grabar.';
      }, 850);
    } else if (state === 'IDLE') {
      this.micBtn.classList.remove('recording');
      if (this.micIcon) this.micIcon.textContent = '🎤';
      if (this.recordTimerBadge) this.recordTimerBadge.classList.add('hidden');
      if (this.waveVisualizer) {
        this.waveVisualizer.classList.remove('active');
        this.waveVisualizer.classList.add('dormant');
      }
      this.micStatusText.textContent = 'Toca para iniciar captura de audio';
    }
  }

  bindEvents() {
    // Pestañas del teléfono
    this.stepTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const step = parseInt(tab.getAttribute('data-step'), 10);
        this.goToScreen(step);
      });
    });

    // Selector de Plantillas
    this.scenarioSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      const templates = window.Pakimed && window.Pakimed.VoiceRecorder 
        ? window.Pakimed.VoiceRecorder.getTemplates() 
        : [];
      if (!isNaN(idx) && templates[idx]) {
        this.dictationText.value = templates[idx].transcript;
      }
    });

    // Botón Micrófono
    this.micBtn.addEventListener('click', () => {
      this.toggleRecording();
    });

    // Procesar Dictado
    this.processBtn.addEventListener('click', () => {
      this.processDictation();
    });

    // Modal de Edición (HITL)
    this.btnOpenEdit.addEventListener('click', () => this.openEditModal());
    this.btnCloseModal.addEventListener('click', () => this.closeEditModal());
    this.btnCancelEdit.addEventListener('click', () => this.closeEditModal());
    this.btnSaveEdit.addEventListener('click', () => this.saveModalEdit());

    // Aprobar Expediente
    this.approveBtn.addEventListener('click', () => {
      this.approveRecord();
    });

    // Alternar Conectividad (Modo Local / 3G)
    this.networkToggle.addEventListener('click', () => {
      this.isOnline = !this.isOnline;
      this.updateOnlineUI();
    });

    // Sincronizar hacia DHIS2
    this.syncAllBtn.addEventListener('click', () => {
      this.syncWithDHIS2();
    });

    // Demostración Guiada
    this.btnQuickDemo.addEventListener('click', () => {
      this.runQuickDemo();
    });
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      if (this.phoneClock) this.phoneClock.textContent = `${h}:${m}`;
    };
    updateTime();
    setInterval(updateTime, 15000);
  }

  loadScenarios() {
    this.scenarioSelect.innerHTML = '<option value="">-- Elige una plantilla clínica (Opcional) --</option>';
    const templates = window.Pakimed && window.Pakimed.VoiceRecorder 
      ? window.Pakimed.VoiceRecorder.getTemplates() 
      : [];

    templates.forEach((t, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = t.title;
      this.scenarioSelect.appendChild(opt);
    });

    // Inicialmente dejar el área abierta para dictado libre
    this.scenarioSelect.value = "0";
    if (templates[0]) {
      this.dictationText.value = templates[0].transcript;
    }
  }

  toggleRecording() {
    if (!this.voiceEngine) {
      this.initVoiceEngine();
    }

    if (this.voiceEngine) {
      if (this.voiceEngine.isRecording) {
        this.voiceEngine.stop();
      } else {
        this.voiceEngine.start();
      }
    }
  }

  goToScreen(step) {
    this.currentScreen = step;
    this.stepTabs.forEach(t => t.classList.toggle('active', parseInt(t.getAttribute('data-step'), 10) === step));
    this.screenViews.forEach(v => v.classList.toggle('active', parseInt(v.getAttribute('data-screen'), 10) === step));
  }

  async processDictation() {
    const text = this.dictationText.value.trim();
    if (!text) {
      alert('Por favor dicta o escribe las notas clínicas antes de continuar.');
      return;
    }

    this.goToScreen(2); // Pantalla 2: Estructuración On-Device

    // Animación visual de pasos de pipeline real
    this.updatePipelineProgress(1);
    this.processingStepText.textContent = 'Normalizando transcripción y preparando análisis lingüístico...';
    await new Promise(r => setTimeout(r, 450));

    this.updatePipelineProgress(2);
    this.processingStepText.textContent = 'Extrayendo entidades clínicas mediante ontología on-device (< 35 KB)...';
    await new Promise(r => setTimeout(r, 550));

    // Ejecución real del motor NER
    const NER = window.Pakimed ? window.Pakimed.NER : null;
    this.extractedData = NER ? NER.extract(text) : { rawTranscript: text, vitals: {}, symptoms: [], prescriptions: [] };

    this.updatePipelineProgress(3);
    this.processingStepText.textContent = 'Verificando guardarraíles éticos IEEE 7000 (Cero diagnóstico autónomo)...';
    await new Promise(r => setTimeout(r, 400));

    this.updatePipelineProgress(4);
    this.processingStepText.textContent = 'Validando completitud clínica para protección de DHIS2...';
    await new Promise(r => setTimeout(r, 350));

    this.renderPreview(this.extractedData);
    this.goToScreen(3); // Pasar a Validación Médica
  }

  updatePipelineProgress(activeStep) {
    const steps = [this.pipeStep1, this.pipeStep2, this.pipeStep3, this.pipeStep4];
    steps.forEach((el, idx) => {
      if (!el) return;
      const stepNum = idx + 1;
      const checkSpan = el.querySelector('.pipe-check');

      el.classList.remove('done', 'active', 'pending');
      if (stepNum < activeStep) {
        el.classList.add('done');
        if (checkSpan) checkSpan.textContent = '✓';
      } else if (stepNum === activeStep) {
        el.classList.add('active');
        if (checkSpan) checkSpan.textContent = '●';
      } else {
        el.classList.add('pending');
        if (checkSpan) checkSpan.textContent = '○';
      }
    });
  }

  renderPreview(data) {
    // 1. Demografía
    this.prevAge.textContent = data.patient && data.patient.age !== null 
      ? `${data.patient.age} ${data.patient.ageUnit || 'años'}` 
      : 'No indicada';
    
    this.prevGender.textContent = data.patient && data.patient.gender === 'F' 
      ? 'Femenino' 
      : (data.patient && data.patient.gender === 'M' ? 'Masculino' : 'No indicado');

    // 2. Signos Vitales
    this.prevBP.textContent = data.vitals && data.vitals.bloodPressure ? data.vitals.bloodPressure : '--';
    this.prevTemp.textContent = data.vitals && data.vitals.temperature ? `${data.vitals.temperature} °C` : '--';
    this.prevHR.textContent = data.vitals && data.vitals.heartRate ? `${data.vitals.heartRate} lpm` : '--';
    if (this.prevSpO2) {
      this.prevSpO2.textContent = data.vitals && data.vitals.oxygenSaturation ? `${data.vitals.oxygenSaturation}%` : '--';
    }

    // 3. Síntomas
    if (data.symptoms && data.symptoms.length > 0) {
      this.prevSymptoms.innerHTML = data.symptoms.map(s => `<span class="tag-pill symptom">${s}</span>`).join('');
    } else {
      this.prevSymptoms.innerHTML = '<span class="text-muted">Ningún síntoma específico identificado</span>';
    }

    // 4. Medicamentos
    if (data.prescriptions && data.prescriptions.length > 0) {
      this.prevMeds.innerHTML = data.prescriptions.map(p => `
        <div class="rx-row">
          <span class="rx-badge">💊 Receta</span>
          <div>
            <strong>${p}</strong>
            <p class="rx-sub">Indicación facultativa verificada</p>
          </div>
        </div>
      `).join('');
    } else {
      this.prevMeds.innerHTML = '<p class="text-muted">No se indicó medicación en este registro.</p>';
    }

    // 5. Transcripción original
    this.prevNotes.textContent = `"${data.rawTranscript || 'Sin notas'}"`;

    // 6. Evaluación de Guardarraíles y Completitud Clínica
    if (!data.isComplete) {
      // Disparo de Alerta de Completitud (No hay signos, síntomas ni recetas)
      if (this.incompleteAlert) {
        this.incompleteAlert.classList.remove('hidden');
        if (this.incompleteAlertMsg && data.completenessMessage) {
          this.incompleteAlertMsg.textContent = data.completenessMessage;
        }
      }
      if (this.guardrailAlert) this.guardrailAlert.classList.add('hidden');
      if (this.telemSafety) {
        this.telemSafety.innerHTML = '<span class="dot-warn"></span> Alerta: Registro incompleto (Sin datos clínicos)';
      }
      // Bloquear botón de aprobación para proteger DHIS2
      this.approveBtn.disabled = true;
      this.approveBtn.style.opacity = '0.45';
      this.approveBtn.title = 'Requiere al menos 1 signo vital, síntoma o prescripción para enviar a DHIS2';
    } else {
      // Registro Completo
      if (this.incompleteAlert) this.incompleteAlert.classList.add('hidden');
      if (this.guardrailAlert) {
        this.guardrailAlert.classList.remove('hidden');
        if (data.guardrailAlerts && data.guardrailAlerts.length > 0) {
          this.guardrailAlert.className = 'safety-banner warning';
          this.guardrailAlert.innerHTML = `⚠️ <strong>Observación Médica:</strong> ${data.guardrailAlerts.join('<br>')}`;
          if (this.telemSafety) this.telemSafety.innerHTML = '<span class="dot-warn"></span> Advertencia: Requiere revisión médica';
        } else {
          this.guardrailAlert.className = 'safety-banner secure';
          this.guardrailAlert.innerHTML = `🛡️ <strong>Protocolo Clínico Verificado:</strong> Registro generado fielmente a partir del dictado. Toda decisión terapéutica permanece bajo supervisión y firma médica.`;
          if (this.telemSafety) this.telemSafety.innerHTML = '<span class="dot-ok"></span> Protocolo de Transcripción Fiel Activo';
        }
      }
      this.approveBtn.disabled = false;
      this.approveBtn.style.opacity = '1';
      this.approveBtn.title = 'Validar y almacenar en expediente local';
    }
  }

  openEditModal() {
    if (!this.extractedData) return;
    this.fieldAge.value = this.extractedData.patient.age || '';
    this.fieldGender.value = this.extractedData.patient.gender || '';
    this.fieldBP.value = this.extractedData.vitals.bloodPressure || '';
    this.fieldTemp.value = this.extractedData.vitals.temperature || '';
    this.fieldHR.value = this.extractedData.vitals.heartRate || '';
    if (this.fieldSpO2) {
      this.fieldSpO2.value = this.extractedData.vitals.oxygenSaturation || '';
    }
    this.fieldSymptoms.value = (this.extractedData.symptoms || []).join(', ');
    this.fieldMeds.value = (this.extractedData.prescriptions || []).join('; ');
    this.fieldNotes.value = this.extractedData.doctorNotes || '';

    this.editModal.classList.add('open');
  }

  closeEditModal() {
    this.editModal.classList.remove('open');
  }

  saveModalEdit() {
    if (!this.extractedData) return;

    this.extractedData.patient.age = this.fieldAge.value ? parseInt(this.fieldAge.value, 10) : null;
    this.extractedData.patient.gender = this.fieldGender.value;
    this.extractedData.vitals.bloodPressure = this.fieldBP.value.trim();
    this.extractedData.vitals.temperature = this.fieldTemp.value ? parseFloat(this.fieldTemp.value) : null;
    this.extractedData.vitals.heartRate = this.fieldHR.value ? parseInt(this.fieldHR.value, 10) : null;
    if (this.fieldSpO2) {
      this.extractedData.vitals.oxygenSaturation = this.fieldSpO2.value ? parseInt(this.fieldSpO2.value, 10) : null;
    }
    this.extractedData.symptoms = this.fieldSymptoms.value.split(',').map(s => s.trim()).filter(Boolean);
    this.extractedData.prescriptions = this.fieldMeds.value.split(';').map(m => m.trim()).filter(Boolean);
    this.extractedData.doctorNotes = this.fieldNotes.value.trim();

    // Revalidador de completitud clínica
    const Guardrails = window.Pakimed ? window.Pakimed.Guardrails : null;
    if (Guardrails) {
      const check = Guardrails.validateClinicalCompleteness(this.extractedData);
      this.extractedData.isComplete = check.isComplete;
      this.extractedData.completenessMessage = check.reason;
    }

    this.renderPreview(this.extractedData);
    this.closeEditModal();
  }

  approveRecord() {
    if (!this.extractedData || !this.extractedData.isComplete) {
      alert('No es posible consolidar un expediente sin datos clínicos.');
      return;
    }

    const Storage = window.Pakimed ? window.Pakimed.Storage : null;
    const DHIS2 = window.Pakimed ? window.Pakimed.DHIS2 : null;

    const record = {
      patient: this.extractedData.patient,
      vitals: this.extractedData.vitals,
      symptoms: this.extractedData.symptoms,
      prescriptions: this.extractedData.prescriptions,
      doctorNotes: this.extractedData.doctorNotes,
      approvedAt: new Date().toISOString()
    };

    const saved = Storage ? Storage.save(record) : { id: 'EXP-LOCAL' };
    const dhis2Payload = DHIS2 ? DHIS2.format(record) : record;

    if (this.dhis2JsonViewer) {
      this.dhis2JsonViewer.textContent = JSON.stringify(dhis2Payload, null, 2);
    }

    this.renderQueue();
    this.goToScreen(4); // Mostrar confirmación en el teléfono

    if (this.syncStatusAlert) {
      this.syncStatusAlert.textContent = `✓ Expediente ${saved.id} validado y resguardado en el almacenamiento local.`;
    }
  }

  renderQueue() {
    const Storage = window.Pakimed ? window.Pakimed.Storage : null;
    const records = Storage ? Storage.getAll() : [];
    if (!this.queueList) return;

    if (records.length === 0) {
      this.queueList.innerHTML = '<div class="empty-queue-msg">No hay expedientes en cola. Valide una consulta médica para visualizarla aquí.</div>';
      return;
    }

    this.queueList.innerHTML = records.map(r => `
      <div class="queue-card ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
        <div>
          <div class="queue-card-id">${r.id} &middot; Paciente ${r.data.patient?.gender || 'N/A'} (${r.data.patient?.age ? r.data.patient.age + ' ' + (r.data.patient?.ageUnit || 'años') : 'Edad no reg.'})</div>
          <div class="queue-card-desc">Registrado: ${new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | ${r.data.symptoms?.slice(0, 2).join(', ') || 'Consulta médica'}</div>
        </div>
        <span class="queue-tag ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
          ${r.status === 'SYNCED' ? '✓ Consolidado en DHIS2' : '⏳ En Cola Local (Store & Forward)'}
        </span>
      </div>
    `).join('');
  }

  updateOnlineUI() {
    if (this.isOnline) {
      if (this.phoneBadge) {
        this.phoneBadge.className = 'status-pill online';
        this.phoneBadge.innerHTML = '📶 Enlace Activo (3G)';
      }
      this.networkToggle.textContent = 'Conectividad: Cambiar a Modo Local (Sin Red)';
      if (this.telemNetwork) this.telemNetwork.textContent = 'Enlace institucional 3G disponible (Listo para sincronizar)';
      if (this.syncAllBtn) this.syncAllBtn.disabled = false;
    } else {
      if (this.phoneBadge) {
        this.phoneBadge.className = 'status-pill offline';
        this.phoneBadge.innerHTML = 'Modo Local (Sin red)';
      }
      this.networkToggle.textContent = 'Conectividad: Simular Red Móvil (3G)';
      if (this.telemNetwork) this.telemNetwork.textContent = 'Modo Autónomo Local (Almacenamiento Seguro)';
    }
  }

  async syncWithDHIS2() {
    if (!this.isOnline) {
      alert('La aplicación se encuentra en Modo Local autónomo. Activa el enlace móvil institucional con el botón superior para realizar la sincronización por lotes.');
      return;
    }

    const Storage = window.Pakimed ? window.Pakimed.Storage : null;
    this.syncAllBtn.disabled = true;
    this.syncAllBtn.textContent = 'Transmitiendo expedientes al sistema de salud...';

    await new Promise(r => setTimeout(r, 1000));
    if (Storage) {
      Storage.markAllSynced();
    }

    this.syncAllBtn.disabled = false;
    this.syncAllBtn.textContent = 'Sincronizar Lote con DHIS2';
    this.renderQueue();

    if (this.syncStatusAlert) {
      this.syncStatusAlert.textContent = '✓ Todos los expedientes en cola fueron consolidados con éxito en la base de datos de DHIS2.';
    }
  }

  async runQuickDemo() {
    // Paso 1: Cargar plantilla clínica y mostrar captura de audio activa
    this.goToScreen(1);
    this.scenarioSelect.value = "0";
    const templates = window.Pakimed && window.Pakimed.VoiceRecorder 
      ? window.Pakimed.VoiceRecorder.getTemplates() 
      : [];

    if (templates[0]) {
      this.dictationText.value = templates[0].transcript;
    }

    if (this.voiceEngine) {
      this.voiceEngine.start();
      await new Promise(r => setTimeout(r, 1200));
      this.voiceEngine.stop();
      await new Promise(r => setTimeout(r, 900));
    }

    // Paso 2: Procesar con el pipeline
    await this.processDictation();
    await new Promise(r => setTimeout(r, 1000));

    // Paso 3: Aprobar si está completo
    if (this.extractedData && this.extractedData.isComplete) {
      this.approveRecord();
    }
  }
}

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  window.pakimedApp = new PakimedApp();
});
