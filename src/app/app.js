/**
 * Pakimed - Controlador de Interfaz de Usuario (UI Orchestrator)
 * Arquitectura Desacoplada y Modular:
 * Consume los servicios provistos por los módulos de src/core/ y src/integrations/:
 * - window.Pakimed.VoiceRecorder (src/core/audio/voice_recorder.js)
 * - window.Pakimed.NER (src/core/nlp/clinical_ner.js)
 * - window.Pakimed.Guardrails (src/core/guardrails/guardrails.js)
 * - window.Pakimed.Storage (src/core/storage/offline_queue.js)
 * - window.Pakimed.DHIS2 (src/integrations/dhis2/dhis2_adapter.js)
 * 
 * Navegación 100% controlada por la barra inferior (Bottom Dock):
 * 1: Homepage / Inicio
 * 2: Dictado por Voz & Nuevo Paciente (Botón Central +)
 * 3: Estructuración On-Device (Pipeline)
 * 4: Validación Médica & Signos Vitales
 * 5: Expediente Clínico Digital & Cola DHIS2
 */

// Símbolos monocromáticos SVG reusables
const SVG_ICONS = {
  mic: `<svg class="mono-icon-mic" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>`,
  stop: `<svg class="mono-icon-stop" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
  shield: `<svg class="mono-icon banner-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  alert: `<svg class="mono-icon banner-icon alert-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  rx: `<svg class="mono-icon rx-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  check: `<svg class="mono-icon inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  clock: `<svg class="mono-icon inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  signal: `<svg class="mono-icon inline" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h2"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V4"/></svg>`
};

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
    this.screenViews = document.querySelectorAll('.phone-screen-view');
    this.dockTabs = document.querySelectorAll('.dock-tab');
    this.dockFloatingActionBtn = document.getElementById('dockFloatingActionBtn');
    this.promptPills = document.querySelectorAll('.quick-prompt-pill');

    // Pantalla 1: Homepage
    this.scenarioSelect = document.getElementById('scenarioSelect');

    // Pantalla 2: Dictado & Captura
    this.micBtn = document.getElementById('micBtn');
    this.micIcon = document.getElementById('micIcon');
    this.micStatusText = document.getElementById('micStatusText');
    this.dictationText = document.getElementById('dictationText');
    this.processBtn = document.getElementById('processBtn');
    this.recordTimerBadge = document.getElementById('recordTimerBadge');
    this.recordTimerText = document.getElementById('recordTimerText');
    this.waveVisualizer = document.getElementById('waveVisualizer');
    this.audioProcessingIndicator = document.getElementById('audioProcessingIndicator');

    // Pantalla 3: Estructuración On-Device
    this.processingStepText = document.getElementById('processingStepText');
    this.pipeStep1 = document.getElementById('pipeStep1');
    this.pipeStep2 = document.getElementById('pipeStep2');
    this.pipeStep3 = document.getElementById('pipeStep3');
    this.pipeStep4 = document.getElementById('pipeStep4');

    // Pantalla 4: Validación Médica & Signos Vitales
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
          console.warn('Voice engine notification:', err);
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
      if (this.micIcon) this.micIcon.innerHTML = SVG_ICONS.stop;
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
      if (this.micIcon) this.micIcon.innerHTML = SVG_ICONS.mic;
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
      if (this.micIcon) this.micIcon.innerHTML = SVG_ICONS.mic;
      if (this.recordTimerBadge) this.recordTimerBadge.classList.add('hidden');
      if (this.waveVisualizer) {
        this.waveVisualizer.classList.remove('active');
        this.waveVisualizer.classList.add('dormant');
      }
      this.micStatusText.textContent = 'Toca para iniciar captura de audio';
    }
  }

  bindEvents() {
    // 1. Barra de Navegación Inferior (Bottom Dock)
    this.dockTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const screen = parseInt(tab.getAttribute('data-dock-screen'), 10);
        if (screen) {
          this.goToScreen(screen);
        }
      });
    });

    // 2. Botón Central Elevado (+) en el Dock
    if (this.dockFloatingActionBtn) {
      this.dockFloatingActionBtn.addEventListener('click', () => {
        if (this.currentScreen !== 2) {
          this.goToScreen(2);
        } else {
          this.toggleRecording();
        }
      });
    }

    // 3. Plantillas Clínicas de Selección Rápida (# en Homepage)
    this.promptPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.getAttribute('data-case-index'), 10);
        this.selectScenario(idx);
        // Llevar inmediatamente al facultativo al área de dictado
        this.goToScreen(2);
      });
    });

    // 4. Selector nativo de casos (compatibilidad)
    if (this.scenarioSelect) {
      this.scenarioSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        this.selectScenario(idx);
      });
    }

    // 5. Botón Micrófono
    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => {
        this.toggleRecording();
      });
    }

    // 6. Procesar Dictado
    if (this.processBtn) {
      this.processBtn.addEventListener('click', () => {
        this.processDictation();
      });
    }

    // 7. Modal de Edición (HITL)
    if (this.btnOpenEdit) this.btnOpenEdit.addEventListener('click', () => this.openEditModal());
    if (this.btnCloseModal) this.btnCloseModal.addEventListener('click', () => this.closeEditModal());
    if (this.btnCancelEdit) this.btnCancelEdit.addEventListener('click', () => this.closeEditModal());
    if (this.btnSaveEdit) this.btnSaveEdit.addEventListener('click', () => this.saveModalEdit());

    // 8. Aprobar Expediente
    if (this.approveBtn) {
      this.approveBtn.addEventListener('click', () => {
        this.approveRecord();
      });
    }

    // 9. Alternar Conectividad (Modo Local / 3G)
    if (this.networkToggle) {
      this.networkToggle.addEventListener('click', () => {
        this.isOnline = !this.isOnline;
        this.updateOnlineUI();
      });
    }

    // 10. Sincronizar hacia DHIS2
    if (this.syncAllBtn) {
      this.syncAllBtn.addEventListener('click', () => {
        this.syncWithDHIS2();
      });
    }

    // 11. Demostración Guiada
    if (this.btnQuickDemo) {
      this.btnQuickDemo.addEventListener('click', () => {
        this.runQuickDemo();
      });
    }
  }

  selectScenario(idx) {
    const templates = window.Pakimed && window.Pakimed.VoiceRecorder 
      ? window.Pakimed.VoiceRecorder.getTemplates() 
      : [];

    if (!isNaN(idx) && templates[idx]) {
      if (this.scenarioSelect) this.scenarioSelect.value = String(idx);
      if (this.dictationText) this.dictationText.value = templates[idx].transcript;

      // Actualizar estilo visual activo de las pastillas
      this.promptPills.forEach(p => {
        const pIdx = parseInt(p.getAttribute('data-case-index'), 10);
        p.classList.toggle('active', pIdx === idx);
      });
    }
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
    if (!this.scenarioSelect) return;
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

    // Cargar la primera plantilla por defecto
    this.selectScenario(0);
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

  goToScreen(screenNum) {
    this.currentScreen = screenNum;

    // 1. Alternar vistas de pantalla del teléfono
    this.screenViews.forEach(v => {
      const vScreen = parseInt(v.getAttribute('data-screen'), 10);
      v.classList.toggle('active', vScreen === screenNum);
    });

    // 2. Sincronizar estado activo de las pestañas en la barra inferior (Dock)
    this.dockTabs.forEach(d => {
      const targetScreen = parseInt(d.getAttribute('data-dock-screen'), 10);
      d.classList.toggle('active', targetScreen === screenNum);
    });

    // 3. Estado visual del botón central flotante (+)
    if (this.dockFloatingActionBtn) {
      this.dockFloatingActionBtn.classList.toggle('active-mode', screenNum === 2);
    }
  }

  async processDictation() {
    const text = this.dictationText.value.trim();
    if (!text) {
      alert('Por favor dicta o escribe las notas clínicas antes de continuar.');
      return;
    }

    this.goToScreen(3); // Pantalla 3: Estructuración On-Device

    // Animación visual de pasos de pipeline real
    this.updatePipelineProgress(1);
    this.processingStepText.textContent = 'Normalizando transcripción y preparando análisis lingüístico...';
    await new Promise(r => setTimeout(r, 450));

    this.updatePipelineProgress(2);
    this.processingStepText.textContent = 'Extrayendo entidades clínicas mediante ontología on-device (< 35 KB)...';
    await new Promise(r => setTimeout(r, 550));

    // Ejecución del motor NER
    const NER = window.Pakimed ? window.Pakimed.NER : null;
    this.extractedData = NER ? NER.extract(text) : { rawTranscript: text, vitals: {}, symptoms: [], prescriptions: [] };

    this.updatePipelineProgress(3);
    this.processingStepText.textContent = 'Verificando guardarraíles éticos IEEE 7000 (Cero diagnóstico autónomo)...';
    await new Promise(r => setTimeout(r, 400));

    this.updatePipelineProgress(4);
    this.processingStepText.textContent = 'Validando completitud clínica para protección de DHIS2...';
    await new Promise(r => setTimeout(r, 350));

    this.renderPreview(this.extractedData);
    this.goToScreen(4); // Pasar a Validación Médica & Signos Vitales
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
        if (checkSpan) checkSpan.innerHTML = SVG_ICONS.check;
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
    if (this.prevAge) {
      this.prevAge.textContent = data.patient && data.patient.age !== null 
        ? `${data.patient.age}` 
        : '--';
    }
    
    if (this.prevGender) {
      this.prevGender.textContent = data.patient && data.patient.gender === 'F' 
        ? 'Femenino' 
        : (data.patient && data.patient.gender === 'M' ? 'Masculino' : 'No indicado');
    }

    // 2. Signos Vitales
    if (this.prevBP) this.prevBP.textContent = data.vitals && data.vitals.bloodPressure ? data.vitals.bloodPressure : '--';
    if (this.prevTemp) this.prevTemp.textContent = data.vitals && data.vitals.temperature ? `${data.vitals.temperature}` : '--';
    if (this.prevHR) this.prevHR.textContent = data.vitals && data.vitals.heartRate ? `${data.vitals.heartRate}` : '--';
    if (this.prevSpO2) {
      this.prevSpO2.textContent = data.vitals && data.vitals.oxygenSaturation ? `${data.vitals.oxygenSaturation}` : '--';
    }

    // 3. Síntomas
    if (this.prevSymptoms) {
      if (data.symptoms && data.symptoms.length > 0) {
        this.prevSymptoms.innerHTML = data.symptoms.map(s => `<span class="tag-pill symptom">${s}</span>`).join('');
      } else {
        this.prevSymptoms.innerHTML = '<span class="text-muted">Ningún síntoma específico identificado</span>';
      }
    }

    // 4. Medicamentos
    if (this.prevMeds) {
      if (data.prescriptions && data.prescriptions.length > 0) {
        this.prevMeds.innerHTML = data.prescriptions.map(p => `
          <div class="rx-row">
            <span class="rx-badge">
              ${SVG_ICONS.rx}
              Receta
            </span>
            <div>
              <strong>${p}</strong>
              <p class="rx-sub">Indicación facultativa verificada</p>
            </div>
          </div>
        `).join('');
      } else {
        this.prevMeds.innerHTML = '<p class="text-muted">No se indicó medicación en este registro.</p>';
      }
    }

    // 5. Transcripción original
    if (this.prevNotes) {
      this.prevNotes.textContent = `"${data.rawTranscript || 'Sin notas'}"`;
    }

    // 6. Evaluación de Guardarraíles y Completitud Clínica
    if (!data.isComplete) {
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
      this.approveBtn.disabled = true;
      this.approveBtn.style.opacity = '0.45';
      this.approveBtn.title = 'Requiere al menos 1 signo vital, síntoma o prescripción para enviar a DHIS2';
    } else {
      if (this.incompleteAlert) this.incompleteAlert.classList.add('hidden');
      if (this.guardrailAlert) {
        this.guardrailAlert.classList.remove('hidden');
        if (data.guardrailAlerts && data.guardrailAlerts.length > 0) {
          this.guardrailAlert.className = 'safety-banner warning';
          this.guardrailAlert.innerHTML = `
            ${SVG_ICONS.alert}
            <div><strong>Observación Médica:</strong> ${data.guardrailAlerts.join('<br>')}</div>
          `;
          if (this.telemSafety) this.telemSafety.innerHTML = '<span class="dot-warn"></span> Advertencia: Requiere revisión médica';
        } else {
          this.guardrailAlert.className = 'safety-banner secure';
          this.guardrailAlert.innerHTML = `
            ${SVG_ICONS.shield}
            <div><strong>Protocolo Clínico Verificado:</strong> Registro generado fielmente a partir del dictado. Toda decisión terapéutica permanece bajo supervisión facultativa.</div>
          `;
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
    this.fieldAge.value = this.extractedData.patient?.age || '';
    this.fieldGender.value = this.extractedData.patient?.gender || '';
    this.fieldBP.value = this.extractedData.vitals?.bloodPressure || '';
    this.fieldTemp.value = this.extractedData.vitals?.temperature || '';
    this.fieldHR.value = this.extractedData.vitals?.heartRate || '';
    if (this.fieldSpO2) {
      this.fieldSpO2.value = this.extractedData.vitals?.oxygenSaturation || '';
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

    // Revalidar completitud clínica
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
    this.goToScreen(5); // Pasar a Pantalla 5: Expediente Clínico

    if (this.syncStatusAlert) {
      this.syncStatusAlert.textContent = `Expediente ${saved.id} validado y resguardado en el almacenamiento local.`;
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
          ${r.status === 'SYNCED' ? `${SVG_ICONS.check} Consolidado en DHIS2` : `${SVG_ICONS.clock} En Cola Local (Store &amp; Forward)`}
        </span>
      </div>
    `).join('');
  }

  updateOnlineUI() {
    if (this.isOnline) {
      if (this.phoneBadge) {
        this.phoneBadge.className = 'status-pill online';
        this.phoneBadge.innerHTML = `${SVG_ICONS.signal} Enlace Activo (3G)`;
      }
      if (this.networkToggle) {
        this.networkToggle.innerHTML = `
          ${SVG_ICONS.signal}
          <span>Conectividad: Cambiar a Modo Local (Sin Red)</span>
        `;
      }
      if (this.telemNetwork) this.telemNetwork.textContent = 'Enlace institucional 3G disponible (Listo para sincronizar)';
      if (this.syncAllBtn) this.syncAllBtn.disabled = false;
    } else {
      if (this.phoneBadge) {
        this.phoneBadge.className = 'status-pill offline';
        this.phoneBadge.innerHTML = 'Modo Local (Sin red)';
      }
      if (this.networkToggle) {
        this.networkToggle.innerHTML = `
          ${SVG_ICONS.signal}
          <span>Conectividad: Simular Red Móvil (3G)</span>
        `;
      }
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
    this.syncAllBtn.innerHTML = `
      <svg class="mono-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
      <span>Sincronizar Lote con DHIS2</span>
    `;
    this.renderQueue();

    if (this.syncStatusAlert) {
      this.syncStatusAlert.textContent = 'Todos los expedientes en cola fueron consolidados con éxito en la base de datos de DHIS2.';
    }
  }

  async runQuickDemo() {
    // Paso 1: Cargar plantilla clínica y mostrar captura de audio activa
    this.goToScreen(2);
    this.selectScenario(0);

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
