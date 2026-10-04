/**
 * Pakimed - Controlador de la Aplicación Móvil del Médico
 * 
 * Responsabilidad: Coordinación de vistas y eventos en la interfaz táctil móvil.
 * Arquitectura modular y limpia: Consume servicios especializados de window.Pakimed.*
 * - window.Pakimed.VoiceRecorder (Captura streaming dual-buffer)
 * - window.Pakimed.NER (Extracción clínica híbrida con identificación de paciente)
 * - window.Pakimed.Guardrails (Auditoría ética IEEE 7000, no-diagnóstico y completitud)
 * - window.Pakimed.ModalController (Edición manual HITL reactiva)
 * - window.Pakimed.DB (Persistencia local reactiva)
 * - window.Pakimed.DHIS2 (Mapeo y sanitización Tracker/Event)
 */

class PakimedApp {
  constructor() {
    this.currentScreen = 1;
    this.extractedData = null;
    this.voiceEngine = null;
    this.modalController = null;
    this.isRecordApproved = false;

    this.initElements();
    this.initVoiceEngine();
    this.initModalController();
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
    this.prevName = document.getElementById('prevName');
    this.prevAge = document.getElementById('prevAge');
    this.prevGender = document.getElementById('prevGender');
    this.prevBP = document.getElementById('prevBP');
    this.prevTemp = document.getElementById('prevTemp');
    this.prevHR = document.getElementById('prevHR');
    this.prevSpO2 = document.getElementById('prevSpO2');
    this.prevSymptoms = document.getElementById('prevSymptoms');
    this.prevMeds = document.getElementById('prevMeds');
    this.prevNotes = document.getElementById('prevNotes');
    this.unmeasuredFieldsBox = document.getElementById('unmeasuredFieldsBox');
    this.unmeasuredFieldsText = document.getElementById('unmeasuredFieldsText');
    this.allergiesBox = document.getElementById('allergiesBox');
    this.allergiesText = document.getElementById('allergiesText');
    this.guardrailAlert = document.getElementById('guardrailAlert');
    this.incompleteAlert = document.getElementById('incompleteAlert');
    this.incompleteAlertMsg = document.getElementById('incompleteAlertMsg');
    this.btnOpenEdit = document.getElementById('btnOpenEdit');
    this.approveBtn = document.getElementById('approveBtn');

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
    const VoiceRecorderClass = window.Pakimed?.VoiceRecorder;
    if (VoiceRecorderClass) {
      this.voiceEngine = new VoiceRecorderClass({
        onResult: ({ fullTranscript }) => {
          if (this.dictationText) {
            this.dictationText.value = fullTranscript;
          }
        },
        onError: (err) => console.warn('Aviso de micrófono:', err),
        onStateChange: (state, payload) => this.handleVoiceState(state, payload)
      });
    }
  }

  initModalController() {
    const ModalClass = window.Pakimed?.ModalController;
    if (ModalClass) {
      this.modalController = new ModalClass({
        onSave: (updatedData) => this.handleDataUpdate(updatedData)
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
      if (this.recordTimerText && payload?.formatted) {
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
        const templates = window.Pakimed?.VoiceRecorder?.getTemplates() || [];
        const idx = parseInt(val, 10);
        if (!isNaN(idx) && templates[idx]) {
          this.dictationText.value = templates[idx].transcript;
        }
      });
    }

    if (this.dictationText) {
      this.dictationText.addEventListener('input', (e) => {
        if (this.voiceEngine) {
          this.voiceEngine.setBaseTranscript(e.target.value);
        }
      });
    }

    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => this.toggleRecording());
    }

    if (this.processBtn) {
      this.processBtn.addEventListener('click', () => this.processDictation());
    }

    if (this.btnOpenEdit) {
      this.btnOpenEdit.addEventListener('click', () => this.openEditModal());
    }

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
    // Candado estricto de navegación hacia la Pantalla 4 (Expediente)
    if (step === 4 && !this.isRecordApproved) {
      alert('Debe validar y registrar la consulta médica en la Pantalla 3 antes de ver la confirmación del expediente.');
      return;
    }

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

    this.isRecordApproved = false;
    this.goToScreen(2);

    // Animación visual del pipeline con Small AI (< 25 KB)
    this.setPipelineStep(1, 'Normalizando transcripción e identificando paciente...');
    await new Promise(r => setTimeout(r, 400));

    this.setPipelineStep(2, 'Extrayendo entidades clínicas mediante ontología on-device (< 25 KB)...');
    await new Promise(r => setTimeout(r, 500));

    const NER = window.Pakimed?.NER;
    this.extractedData = NER ? NER.extract(text) : { rawTranscript: text, patient: {}, vitals: {}, symptoms: [], prescriptions: [] };

    this.setPipelineStep(3, 'Verificando guardarraíles éticos IEEE 7000 (Cero diagnóstico autónomo)...');
    await new Promise(r => setTimeout(r, 400));

    this.setPipelineStep(4, 'Auditando identificación obligatoria y rangos fisiológicos para DHIS2...');
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
    if (!data) return;

    // 1. Identificación y Demográficos del Paciente
    const p = data.patient || {};
    if (this.prevName) {
      if (p.name) {
        this.prevName.textContent = p.name;
        this.prevName.style.color = '#0f766e';
      } else {
        this.prevName.textContent = '⚠️ No identificado (Requiere nombre)';
        this.prevName.style.color = '#dc2626';
      }
    }

    if (this.prevAge) {
      this.prevAge.textContent = p.age !== null && p.age !== undefined 
        ? `${p.age} ${p.ageUnit || 'años'}` 
        : 'Edad no indicada';
    }
    
    if (this.prevGender) {
      this.prevGender.textContent = p.gender === 'F' 
        ? 'Femenino' 
        : (p.gender === 'M' ? 'Masculino' : 'Género no indicado');
    }

    // 2. Constantes Vitales
    this.prevBP.textContent = data.vitals?.bloodPressure || '--';
    this.prevTemp.textContent = data.vitals?.temperature ? `${data.vitals.temperature} °C` : '--';
    this.prevHR.textContent = data.vitals?.heartRate ? `${data.vitals.heartRate} lpm` : '--';
    if (this.prevSpO2) {
      this.prevSpO2.textContent = data.vitals?.oxygenSaturation ? `${data.vitals.oxygenSaturation}%` : '--';
    }

    // 3. Aviso de Constantes No Medidas / Parciales
    if (this.unmeasuredFieldsBox && this.unmeasuredFieldsText) {
      const missing = data.missingFields || (window.Pakimed?.Guardrails?.detectMissingOptionalFields(data) || []);
      if (missing.length > 0) {
        this.unmeasuredFieldsBox.classList.remove('hidden');
        this.unmeasuredFieldsText.textContent = missing.join(', ');
      } else {
        this.unmeasuredFieldsBox.classList.add('hidden');
      }
    }

    // 3.1 Aviso de Alergias Medicamentosas Detectadas
    if (this.allergiesBox && this.allergiesText) {
      if (data.patient?.allergies?.length > 0) {
        this.allergiesBox.classList.remove('hidden');
        this.allergiesText.textContent = data.patient.allergies.join(', ');
      } else {
        this.allergiesBox.classList.add('hidden');
      }
    }

    // 4. Síntomas
    if (data.symptoms?.length > 0) {
      this.prevSymptoms.innerHTML = data.symptoms.map(s => `<span class="tag-pill symptom">${s}</span>`).join('');
    } else {
      this.prevSymptoms.innerHTML = '<span class="text-muted">Ningún síntoma específico identificado</span>';
    }

    // 5. Medicación y Prescripciones
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

    // 6. Transcripción original
    this.prevNotes.textContent = `"${data.rawTranscript || 'Sin notas'}"`;

    // 7. Actualización integral de Guardarraíles y Banners de Alerta
    this.updateAlertsAndSafetyStatus(data);
  }

  updateAlertsAndSafetyStatus(data) {
    const telem = window.pakimedTelemetry;

    // Caso A: Registro Incompleto o Falta de Nombre (Bloqueo de Aprobación)
    if (!data.isComplete) {
      if (this.incompleteAlert) {
        this.incompleteAlert.classList.remove('hidden');
        if (this.incompleteAlertMsg && data.completenessMessage) {
          this.incompleteAlertMsg.textContent = data.completenessMessage;
        }
      }
      if (this.guardrailAlert) this.guardrailAlert.classList.add('hidden');
      if (telem) telem.setSafetyStatus('Bloqueo: Requiere identificación o datos clínicos', true);

      this.approveBtn.disabled = true;
      this.approveBtn.style.opacity = '0.45';
      this.approveBtn.title = 'Complete el nombre y datos clínicos en "Ajustar Registro" para habilitar la firma';
      return;
    }

    // Caso B: Registro Válido
    if (this.incompleteAlert) this.incompleteAlert.classList.add('hidden');
    if (this.guardrailAlert) {
      this.guardrailAlert.classList.remove('hidden');

      if (data.guardrailAlerts && data.guardrailAlerts.length > 0) {
        // Observación cuantitativa de rango o inferencia detectada (Cero diagnóstico)
        this.guardrailAlert.className = 'safety-banner warning';
        this.guardrailAlert.innerHTML = `⚠️ <strong>Observación Médica / Constantes:</strong><br>${data.guardrailAlerts.join('<br>')}`;
        if (telem) telem.setSafetyStatus('Observación: Constantes vitales fuera de rango estándar', true);
      } else {
        // Protocolo seguro verificado
        this.guardrailAlert.className = 'safety-banner secure';
        this.guardrailAlert.innerHTML = `🛡️ <strong>Protocolo Clínico Verificado:</strong> Registro generado fielmente a partir del dictado. Toda decisión terapéutica permanece bajo supervisión y firma médica.`;
        if (telem) telem.setSafetyStatus('Protocolo de Transcripción Fiel Activo', false);
      }
    }

    this.approveBtn.disabled = false;
    this.approveBtn.style.opacity = '1';
    this.approveBtn.title = 'Validar y registrar en expediente';
  }

  openEditModal() {
    if (!this.extractedData) return;
    if (!this.modalController) this.initModalController();
    if (this.modalController) {
      this.modalController.open(this.extractedData, (updated) => this.handleDataUpdate(updated));
    }
  }

  handleDataUpdate(updatedData) {
    this.extractedData = updatedData;
    this.renderPreview(this.extractedData);
  }

  approveRecord() {
    if (!this.extractedData || !this.extractedData.isComplete) {
      alert('No es posible consolidar un expediente sin nombre del paciente y datos clínicos.');
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

    this.isRecordApproved = true;
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
