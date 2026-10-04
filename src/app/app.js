/**
 * Pakimed - Controlador de la Aplicación Móvil del Médico
 * Responsabilidad exclusiva: Vista de smartphone táctil (columna izquierda).
 * Arquitectura modular y limpia: Consume servicios de window.Pakimed.*
 * - window.Pakimed.VoiceRecorder
 * - window.Pakimed.NER
 * - window.Pakimed.Guardrails
 * - window.Pakimed.DB
 * - window.Pakimed.DHIS2
 */

class PakimedApp {
  constructor() {
    this.currentScreen = 1;
    this.extractedData = null;
    this.voiceEngine = null;

    this.initElements();
    this.initVoiceEngine();
    this.bindEvents();
    this.setupInitialState();
    this.startClock();
  }

  initElements() {
    // Smartphone: Header & Nav
    this.phoneClock = document.getElementById('phoneClock');
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

    // Pantalla 2: Estructuración On-Device
    this.processingStepText = document.getElementById('processingStepText');
    this.pipeSteps = [
      document.getElementById('pipeStep1'),
      document.getElementById('pipeStep2'),
      document.getElementById('pipeStep3'),
      document.getElementById('pipeStep4')
    ];

    // Pantalla 3: Validación y Expediente
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

    // Modal HITL
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

    // Botón de Pitch Demo
    this.btnQuickDemo = document.getElementById('btnQuickDemo');
  }

  setupInitialState() {
    // 1. Selector en blanco
    if (this.scenarioSelect) {
      this.scenarioSelect.innerHTML = '<option value="">-- Seleccionar plantilla de consulta (Opcional) --</option>';
      const templates = window.Pakimed && window.Pakimed.VoiceRecorder 
        ? window.Pakimed.VoiceRecorder.getTemplates() 
        : [];

      templates.forEach((t, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = t.title;
        this.scenarioSelect.appendChild(opt);
      });
      this.scenarioSelect.value = '';
    }

    // 2. Área de dictado 100% limpia
    if (this.dictationText) {
      this.dictationText.value = '';
      this.dictationText.placeholder = 'Presiona el micrófono para iniciar el dictado clínico o redacta las notas de la consulta aquí...';
    }

    // 3. Indicador de estado en espera activa
    if (this.micStatusText) {
      this.micStatusText.textContent = 'Listo para consulta médica · Micrófono en espera';
    }
  }

  initVoiceEngine() {
    const VoiceRecorderClass = window.Pakimed && window.Pakimed.VoiceRecorder 
      ? window.Pakimed.VoiceRecorder 
      : null;

    if (VoiceRecorderClass) {
      this.voiceEngine = new VoiceRecorderClass({
        onResult: ({ finalTranscript, interimTranscript }) => {
          const current = this.dictationText.value;
          const textChunk = finalTranscript || interimTranscript;
          if (textChunk && !current.includes(textChunk)) {
            this.dictationText.value = current ? `${current} ${textChunk}` : textChunk;
          }
        },
        onError: (err) => console.warn('Aviso de micrófono:', err),
        onStateChange: (state, payload) => this.handleVoiceState(state, payload)
      });
    }
  }

  handleVoiceState(state, payload) {
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
        this.micStatusText.textContent = 'Captura finalizada. Revisa el texto o continúa dictando.';
      }, 800);
    } else if (state === 'IDLE') {
      this.micBtn.classList.remove('recording');
      if (this.micIcon) this.micIcon.textContent = '🎤';
      if (this.recordTimerBadge) this.recordTimerBadge.classList.add('hidden');
      if (this.waveVisualizer) {
        this.waveVisualizer.classList.remove('active');
        this.waveVisualizer.classList.add('dormant');
      }
      this.micStatusText.textContent = 'Listo para consulta médica · Micrófono en espera';
    }
  }

  bindEvents() {
    this.stepTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const step = parseInt(tab.getAttribute('data-step'), 10);
        this.goToScreen(step);
      });
    });

    if (this.scenarioSelect) {
      this.scenarioSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '') {
          this.dictationText.value = '';
          return;
        }
        const templates = window.Pakimed && window.Pakimed.VoiceRecorder 
          ? window.Pakimed.VoiceRecorder.getTemplates() 
          : [];
        const idx = parseInt(val, 10);
        if (!isNaN(idx) && templates[idx]) {
          this.dictationText.value = templates[idx].transcript;
        }
      });
    }

    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => this.toggleRecording());
    }

    if (this.processBtn) {
      this.processBtn.addEventListener('click', () => this.processDictation());
    }

    if (this.btnOpenEdit) this.btnOpenEdit.addEventListener('click', () => this.openEditModal());
    if (this.btnCloseModal) this.btnCloseModal.addEventListener('click', () => this.closeEditModal());
    if (this.btnCancelEdit) this.btnCancelEdit.addEventListener('click', () => this.closeEditModal());
    if (this.btnSaveEdit) this.btnSaveEdit.addEventListener('click', () => this.saveModalEdit());

    if (this.approveBtn) {
      this.approveBtn.addEventListener('click', () => this.approveRecord());
    }

    if (this.btnQuickDemo) {
      this.btnQuickDemo.addEventListener('click', () => this.runQuickDemo());
    }
  }

  toggleRecording() {
    if (!this.voiceEngine) this.initVoiceEngine();
    if (!this.voiceEngine) return;

    if (this.voiceEngine.isRecording) {
      this.voiceEngine.stop();
    } else {
      this.voiceEngine.start();
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
      alert('Por favor dicta o redacta las notas de la consulta antes de estructurar.');
      return;
    }

    this.goToScreen(2);

    // Animación visual del pipeline
    this.setPipelineStep(1, 'Normalizando transcripción y preparando análisis lingüístico...');
    await new Promise(r => setTimeout(r, 450));

    this.setPipelineStep(2, 'Extrayendo entidades clínicas mediante ontología on-device (< 35 KB)...');
    await new Promise(r => setTimeout(r, 550));

    const NER = window.Pakimed ? window.Pakimed.NER : null;
    this.extractedData = NER ? NER.extract(text) : { rawTranscript: text, vitals: {}, symptoms: [], prescriptions: [] };

    this.setPipelineStep(3, 'Verificando guardarraíles éticos IEEE 7000 (Cero diagnóstico autónomo)...');
    await new Promise(r => setTimeout(r, 400));

    this.setPipelineStep(4, 'Validando completitud clínica para protección de DHIS2...');
    await new Promise(r => setTimeout(r, 350));

    this.renderPreview(this.extractedData);
    this.goToScreen(3);
  }

  setPipelineStep(activeStep, desc) {
    if (this.processingStepText) this.processingStepText.textContent = desc;
    this.pipeSteps.forEach((el, idx) => {
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
    this.prevAge.textContent = data.patient && data.patient.age !== null 
      ? `${data.patient.age} ${data.patient.ageUnit || 'años'}` 
      : 'No indicada';
    
    this.prevGender.textContent = data.patient && data.patient.gender === 'F' 
      ? 'Femenino' 
      : (data.patient && data.patient.gender === 'M' ? 'Masculino' : 'No indicado');

    this.prevBP.textContent = data.vitals?.bloodPressure || '--';
    this.prevTemp.textContent = data.vitals?.temperature ? `${data.vitals.temperature} °C` : '--';
    this.prevHR.textContent = data.vitals?.heartRate ? `${data.vitals.heartRate} lpm` : '--';
    if (this.prevSpO2) {
      this.prevSpO2.textContent = data.vitals?.oxygenSaturation ? `${data.vitals.oxygenSaturation}%` : '--';
    }

    if (data.symptoms?.length > 0) {
      this.prevSymptoms.innerHTML = data.symptoms.map(s => `<span class="tag-pill symptom">${s}</span>`).join('');
    } else {
      this.prevSymptoms.innerHTML = '<span class="text-muted">Ningún síntoma específico identificado</span>';
    }

    if (data.prescriptions?.length > 0) {
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

    this.prevNotes.textContent = `"${data.rawTranscript || 'Sin notas'}"`;

    const telem = window.pakimedTelemetry;

    if (!data.isComplete) {
      if (this.incompleteAlert) {
        this.incompleteAlert.classList.remove('hidden');
        if (this.incompleteAlertMsg && data.completenessMessage) {
          this.incompleteAlertMsg.textContent = data.completenessMessage;
        }
      }
      if (this.guardrailAlert) this.guardrailAlert.classList.add('hidden');
      if (telem) telem.setSafetyStatus('Alerta: Registro incompleto (Sin datos clínicos)', true);

      this.approveBtn.disabled = true;
      this.approveBtn.style.opacity = '0.45';
      this.approveBtn.title = 'Requiere al menos 1 signo vital, síntoma o prescripción para aprobar';
    } else {
      if (this.incompleteAlert) this.incompleteAlert.classList.add('hidden');
      if (this.guardrailAlert) {
        this.guardrailAlert.classList.remove('hidden');
        if (data.guardrailAlerts?.length > 0) {
          this.guardrailAlert.className = 'safety-banner warning';
          this.guardrailAlert.innerHTML = `⚠️ <strong>Observación Médica:</strong> ${data.guardrailAlerts.join('<br>')}`;
          if (telem) telem.setSafetyStatus('Advertencia: Requiere revisión médica', true);
        } else {
          this.guardrailAlert.className = 'safety-banner secure';
          this.guardrailAlert.innerHTML = `🛡️ <strong>Protocolo Clínico Verificado:</strong> Registro generado fielmente a partir del dictado. Toda decisión terapéutica permanece bajo supervisión y firma médica.`;
          if (telem) telem.setSafetyStatus('Protocolo de Transcripción Fiel Activo', false);
        }
      }
      this.approveBtn.disabled = false;
      this.approveBtn.style.opacity = '1';
      this.approveBtn.title = 'Validar y registrar en expediente';
    }
  }

  openEditModal() {
    if (!this.extractedData) return;
    this.fieldAge.value = this.extractedData.patient.age || '';
    this.fieldGender.value = this.extractedData.patient.gender || '';
    this.fieldBP.value = this.extractedData.vitals.bloodPressure || '';
    this.fieldTemp.value = this.extractedData.vitals.temperature || '';
    this.fieldHR.value = this.extractedData.vitals.heartRate || '';
    if (this.fieldSpO2) this.fieldSpO2.value = this.extractedData.vitals.oxygenSaturation || '';
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

    const Guardrails = window.Pakimed?.Guardrails;
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

    const DB = window.Pakimed?.DB;
    const DHIS2 = window.Pakimed?.DHIS2;

    const record = {
      patient: this.extractedData.patient,
      vitals: this.extractedData.vitals,
      symptoms: this.extractedData.symptoms,
      prescriptions: this.extractedData.prescriptions,
      doctorNotes: this.extractedData.doctorNotes,
      approvedAt: new Date().toISOString()
    };

    if (DB) {
      DB.saveRecord(record);
    }

    if (DHIS2 && window.pakimedTelemetry) {
      const payload = DHIS2.format(record);
      window.pakimedTelemetry.showDHIS2Payload(payload);
    }

    this.goToScreen(4);
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

  async runQuickDemo() {
    this.goToScreen(1);
    const templates = window.Pakimed?.VoiceRecorder?.getTemplates() || [];
    if (templates[0]) {
      this.scenarioSelect.value = '0';
      this.dictationText.value = templates[0].transcript;
    }

    if (this.voiceEngine) {
      this.voiceEngine.start();
      await new Promise(r => setTimeout(r, 1100));
      this.voiceEngine.stop();
      await new Promise(r => setTimeout(r, 850));
    }

    await this.processDictation();
    await new Promise(r => setTimeout(r, 900));

    if (this.extractedData && this.extractedData.isComplete) {
      this.approveRecord();
    }
  }
}

// Inicialización de la aplicación móvil y la consola de telemetría
window.addEventListener('DOMContentLoaded', () => {
  window.pakimedTelemetry = new (window.Pakimed.TelemetryController || class {})();
  window.pakimedApp = new PakimedApp();
});
