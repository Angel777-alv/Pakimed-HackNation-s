/**
 * Pakimed - Controlador de la Aplicación Móvil del Médico
 * 
 * Responsabilidad: Coordinación de vistas y eventos en la interfaz táctil móvil.
 * Arquitectura modular y limpia: Consume servicios especializados de window.Pakimed.*
 * - window.Pakimed.VoiceRecorder (Captura streaming dual-buffer)
 * - window.Pakimed.NER (Extracción clínica heurística ConText)
 * - window.Pakimed.QwenAdapter (Extracción semántica Small AI Qwen2.5)
 * - window.Pakimed.FusionEngine (Ensamble cooperativo híbrido y guardarraíles)
 * - window.Pakimed.Guardrails (Auditoría ética IEEE 7000, no-diagnóstico y completitud)
 * - window.Pakimed.ModalController (Edición manual HITL reactiva)
 * - window.Pakimed.DB (Persistencia local reactiva)
 * - window.Pakimed.DHIS2 (Mapeo y sanitización Tracker/Event)
 * 
 * Navegación controlada por Bottom Dock:
 * 1: Homepage / Inicio (Dr. Morales)
 * 2: Dictado por Voz & Nuevo Paciente (FAB Central +)
 * 3: Estructuración On-Device (Pipeline)
 * 4: Validación Médica & Signos Vitales (HITL)
 * 5: Expediente Clínico Digital & Cola DHIS2
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
    this.initLanguageCarousel();
    this.startClock();
    this.checkQwenAvailability();
  }

  initElements() {
    // Smartphone: Header, Dock & Nav
    this.phoneClock = document.getElementById('phoneClock');
    this.phoneBadge = document.getElementById('phoneBadge');
    this.screenViews = document.querySelectorAll('.phone-screen-view');
    this.dockTabs = document.querySelectorAll('.dock-tab');
    this.dockFloatingActionBtn = document.getElementById('dockFloatingActionBtn');
    this.promptPills = document.querySelectorAll('.quick-prompt-pill');
    this.networkToggle = document.getElementById('networkToggle');

    // Pantalla 1: Inicio
    this.scenarioSelect = document.getElementById('scenarioSelect');

    // Pantalla 2: Dictado
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
    this.pipeSteps = [
      document.getElementById('pipeStep1'),
      document.getElementById('pipeStep2'),
      document.getElementById('pipeStep3'),
      document.getElementById('pipeStep4')
    ];

    // Pantalla 4: Validación y Expediente
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

    // Selector Táctico de Motor Small AI
    this.btnEngineHeuristic = document.getElementById('btnEngineHeuristic');
    this.btnEngineQwen = document.getElementById('btnEngineQwen');
    this.aiEngineStatusBadge = document.getElementById('aiEngineStatusBadge');
    this.prevEngineBadge = document.getElementById('prevEngineBadge');
    this.activeEngine = 'hybrid';
  }

  setupInitialState() {
    // 1. Área de dictado limpia
    if (this.dictationText) {
      this.dictationText.value = '';
    }

    // 2. Verificación proactiva de disponibilidad de Qwen2.5 Local
    this.checkQwenAvailability();
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
      window.voiceRecorder = this.voiceEngine;
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
      if (this.recordTimerBadge) this.recordTimerBadge.classList.add('hidden');
      if (this.waveVisualizer) {
        this.waveVisualizer.classList.remove('active');
        this.waveVisualizer.classList.add('dormant');
      }
      this.micStatusText.textContent = 'Listo para consulta médica · Micrófono en espera';
    }
  }

  bindEvents() {
    // 1. Navegación por Bottom Dock (4 tabs)
    this.dockTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const screen = parseInt(tab.getAttribute('data-dock-screen'), 10);
        if (screen) this.goToScreen(screen);
      });
    });

    // 2. Botón Flotante Central (+) del Dock
    if (this.dockFloatingActionBtn) {
      this.dockFloatingActionBtn.addEventListener('click', () => {
        if (this.currentScreen !== 2) {
          this.goToScreen(2);
        } else {
          this.toggleRecording();
        }
      });
    }

    // 3. Sugerencias rápidas de consulta en Pantalla 1
    this.promptPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.getAttribute('data-case-index'), 10);
        this.selectScenario(idx);
        this.goToScreen(2);
      });
    });

    // 4. Selector nativo de escenarios
    if (this.scenarioSelect) {
      this.scenarioSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '') {
          this.dictationText.value = '';
          return;
        }
        const idx = parseInt(val, 10);
        this.selectScenario(idx);
      });
    }

    // 5. Input manual en área de dictado
    if (this.dictationText) {
      this.dictationText.addEventListener('input', (e) => {
        if (this.voiceEngine) {
          this.voiceEngine.setBaseTranscript(e.target.value);
        }
      });
    }

    // 6. Micrófono
    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => this.toggleRecording());
    }

    // 7. Estructurar consulta
    if (this.processBtn) {
      this.processBtn.addEventListener('click', () => this.processDictation());
    }

    // 8. Modal de ajustes HITL
    if (this.btnOpenEdit) {
      this.btnOpenEdit.addEventListener('click', () => this.openEditModal());
    }

    // 9. Aprobación de expediente
    if (this.approveBtn) {
      this.approveBtn.addEventListener('click', () => this.approveRecord());
    }

    // 10. Demo guiado para Pitch
    if (this.btnQuickDemo) {
      this.btnQuickDemo.addEventListener('click', () => this.runQuickDemo());
    }

    // 11. Simulación de conectividad de red
    if (this.networkToggle) {
      this.networkToggle.addEventListener('click', () => {
        const telem = window.pakimedTelemetry;
        if (telem) telem.toggleNetwork();
      });
    }

    // 12. Toggle de Pipeline Small AI
    if (this.btnEngineHeuristic) {
      this.btnEngineHeuristic.addEventListener('click', () => this.setEngine('heuristic'));
    }
    if (this.btnEngineQwen) {
      this.btnEngineQwen.addEventListener('click', () => this.setEngine('hybrid'));
    }
  }

  initLanguageCarousel() {
    this.carouselSlideIndex = 0;
    this.carouselTrack = document.getElementById('carouselTrack');
    this.carouselDots = document.querySelectorAll('.carousel-dot');
    this.btnPrevLang = document.getElementById('btnPrevLang');
    this.btnNextLang = document.getElementById('btnNextLang');
    const slides = document.querySelectorAll('.carousel-slide');

    const updateCarouselUI = (index, triggerChange = true) => {
      this.carouselSlideIndex = index;
      if (this.carouselTrack) {
        this.carouselTrack.style.transform = `translateX(-${index * 100}%)`;
      }
      this.carouselDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });

      if (triggerChange && slides[index]) {
        const lang = slides[index].getAttribute('data-lang');
        this.switchLanguage(lang, index);
      }
    };

    if (this.btnPrevLang) {
      this.btnPrevLang.addEventListener('click', (e) => {
        e.stopPropagation();
        const newIdx = (this.carouselSlideIndex - 1 + slides.length) % slides.length;
        updateCarouselUI(newIdx, true);
      });
    }

    if (this.btnNextLang) {
      this.btnNextLang.addEventListener('click', (e) => {
        e.stopPropagation();
        const newIdx = (this.carouselSlideIndex + 1) % slides.length;
        updateCarouselUI(newIdx, true);
      });
    }

    this.carouselDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(dot.getAttribute('data-slide-index'), 10);
        updateCarouselUI(idx, true);
      });
    });

    slides.forEach((slide, idx) => {
      slide.addEventListener('click', () => {
        const lang = slide.getAttribute('data-lang');
        this.switchLanguage(lang, idx);
      });

      const btn = slide.querySelector('.slide-select-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const lang = btn.getAttribute('data-switch-lang');
          this.switchLanguage(lang, idx);
        });
      }
    });

    // Activar idioma inicial explícitamente sincronizando todas las vistas y data-i18n
    const initialLang = window.I18nManager ? window.I18nManager.getCurrentLanguage() : 'es';
    this.switchLanguage(initialLang, 0);
  }

  switchLanguage(lang, slideIndex) {
    if (!window.I18nManager) return;
    window.I18nManager.setLanguage(lang);

    const slides = document.querySelectorAll('.carousel-slide');
    slides.forEach((slide, idx) => {
      const isCurrent = slide.getAttribute('data-lang') === lang;
      if (isCurrent) {
        slide.classList.add('active');
        const mainRow = slide.querySelector('.slide-main-row');
        if (mainRow) {
          const oldBtn = slide.querySelector('.slide-select-btn');
          if (oldBtn) oldBtn.remove();
          let activePill = slide.querySelector('.slide-active-pill');
          if (!activePill) {
            activePill = document.createElement('span');
            activePill.className = 'slide-active-pill';
            mainRow.appendChild(activePill);
          }
          activePill.textContent = window.I18nManager.get('slide_active_pill');
        }
      } else {
        slide.classList.remove('active');
        const mainRow = slide.querySelector('.slide-main-row');
        const activePill = slide.querySelector('.slide-active-pill');
        if (activePill) activePill.remove();
        if (mainRow) {
          let selectBtn = slide.querySelector('.slide-select-btn');
          if (!selectBtn) {
            selectBtn = document.createElement('button');
            selectBtn.className = 'slide-select-btn';
            selectBtn.type = 'button';
            selectBtn.setAttribute('data-switch-lang', slide.getAttribute('data-lang'));
            selectBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.switchLanguage(slide.getAttribute('data-lang'), idx);
            });
            mainRow.appendChild(selectBtn);
          }
          selectBtn.textContent = window.I18nManager.get('carousel_action_switch');
        }
      }
    });

    if (typeof slideIndex === 'number') {
      this.carouselSlideIndex = slideIndex;
      if (this.carouselTrack) {
        this.carouselTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
      }
      this.carouselDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === slideIndex);
      });
    }

    this.renderScenarios();

    if (this.voiceEngine) {
      this.voiceEngine.setLanguage(window.I18nManager.getSTTLocale());
    }

    if (this.micStatusText) {
      this.micStatusText.textContent = window.I18nManager.get('mic_hint');
    }
    if (this.dictationText) {
      this.dictationText.placeholder = window.I18nManager.get('dictation_placeholder');
    }
    if (this.aiEngineStatusBadge) {
      this.aiEngineStatusBadge.textContent = this.activeEngine === 'hybrid' 
        ? window.I18nManager.get('engine_status_hybrid') 
        : window.I18nManager.get('engine_status_heuristic');
    }

    this.selectScenario(0);

    if (this.extractedData) {
      this.renderPreview(this.extractedData);
    }
  }

  renderScenarios() {
    const listEl = document.getElementById('promptPillsList');
    if (!listEl) return;
    const scenarios = window.I18nManager ? window.I18nManager.getScenarios() : [];
    listEl.innerHTML = '';

    if (this.scenarioSelect) {
      this.scenarioSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    }

    scenarios.forEach((sc, idx) => {
      if (this.scenarioSelect) {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${sc.title}: ${sc.subtitle}`;
        this.scenarioSelect.appendChild(opt);
      }

      const btn = document.createElement('button');
      btn.className = `quick-prompt-pill ${idx === 0 ? 'active' : ''}`;
      btn.type = 'button';
      btn.setAttribute('data-case-index', idx);
      btn.innerHTML = `
        <span class="prompt-hash-icon">#</span>
        <div class="prompt-pill-content">
          <span class="prompt-pill-text">${sc.title}</span>
          <span class="prompt-pill-sub">${sc.subtitle}</span>
        </div>
      `;
      btn.addEventListener('click', () => {
        this.selectScenario(idx);
        this.goToScreen(2);
      });
      listEl.appendChild(btn);
    });
  }

  selectScenario(idx) {
    const scenarios = window.I18nManager ? window.I18nManager.getScenarios() : [];
    if (scenarios[idx]) {
      if (this.dictationText) {
        this.dictationText.value = scenarios[idx].text;
      }
      if (this.scenarioSelect) {
        this.scenarioSelect.value = idx;
      }
      const pills = document.querySelectorAll('.quick-prompt-pill');
      pills.forEach((p, pIdx) => {
        p.classList.toggle('active', pIdx === idx);
      });
      if (this.voiceEngine) {
        this.voiceEngine.setBaseTranscript(scenarios[idx].text);
      }
    }
  }

  async setEngine(engine) {
    this.activeEngine = engine;
    if (this.btnEngineHeuristic) {
      this.btnEngineHeuristic.classList.toggle('active', engine === 'heuristic');
    }
    if (this.btnEngineQwen) {
      this.btnEngineQwen.classList.toggle('active', engine === 'hybrid');
    }
    if (this.aiEngineStatusBadge) {
      if (engine === 'hybrid') {
        this.aiEngineStatusBadge.textContent = '🧬 Híbrido (Comprobando...)';
        this.aiEngineStatusBadge.classList.add('qwen');
        await this.checkQwenAvailability();
      } else {
        this.aiEngineStatusBadge.textContent = '⚡ ConText (< 2 ms)';
        this.aiEngineStatusBadge.classList.remove('qwen');
      }
    }
  }

  async checkQwenAvailability() {
    const Qwen = window.Pakimed?.QwenAdapter;
    if (Qwen) {
      const isUp = await Qwen.checkAvailability();
      if (isUp) {
        console.log('[PakimedApp] Micro-servidor Qwen2.5 detectado y listo en el dispositivo.');
        if (this.aiEngineStatusBadge && this.activeEngine === 'hybrid') {
          this.aiEngineStatusBadge.textContent = '🧬 Híbrido Activo';
          this.aiEngineStatusBadge.classList.add('qwen');
        }
      } else {
        console.log('[PakimedApp] Micro-servidor Qwen2.5 no detectado (Fallback activo a ConText).');
        if (this.aiEngineStatusBadge && this.activeEngine === 'hybrid') {
          this.aiEngineStatusBadge.textContent = '⚡ ConText (Qwen offline)';
          this.aiEngineStatusBadge.classList.remove('qwen');
        }
      }
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

  goToScreen(screenNum) {
    // Candado estricto: la Pantalla 5 (Expediente) requiere validación en Pantalla 4
    if (screenNum === 5 && !this.isRecordApproved) {
      alert('Debe validar y firmar la consulta médica en la Pantalla 4 antes de ver la confirmación del expediente.');
      return;
    }

    this.currentScreen = screenNum;

    // 1. Alternar vistas de pantalla
    this.screenViews.forEach(v => {
      const vScreen = parseInt(v.getAttribute('data-screen'), 10);
      v.classList.toggle('active', vScreen === screenNum);
    });

    // 2. Sincronizar estado activo de las pestañas en el Bottom Dock
    this.dockTabs.forEach(d => {
      const targetScreen = parseInt(d.getAttribute('data-dock-screen'), 10);
      d.classList.toggle('active', targetScreen === screenNum);
    });

    // 3. Estado visual del botón central flotante (+)
    if (this.dockFloatingActionBtn) {
      this.dockFloatingActionBtn.classList.toggle('active-mode', screenNum === 2);
    }

    // 4. Sincronizar pipeline reactivo de telemetría institucional (Live Architecture Flow)
    const telem = window.pakimedTelemetry;
    if (telem && typeof telem.setPipelineStep === 'function') {
      if (screenNum === 1) telem.setPipelineStep(0); // Standby / Ready
      else if (screenNum === 2) telem.setPipelineStep(1); // Step 1: Voice Input
      else if (screenNum === 3) telem.setPipelineStep(2); // Step 2: Local AI
      else if (screenNum === 4) telem.setPipelineStep(3); // Step 3: Clinical Safety
      else if (screenNum === 5) telem.setPipelineStep(4); // Step 4: Local Vault
    }
  }

  async processDictation() {
    const text = this.dictationText.value.trim();
    if (!text) {
      alert('Por favor dicta o redacta las notas de la consulta antes de estructurar.');
      return;
    }

    this.isRecordApproved = false;
    this.goToScreen(3); // Pantalla 3: Estructuración On-Device

    // Animación visual del pipeline híbrido
    this.setPipelineStep(1, 'Normalizando transcripción y extrayendo ancla determinista con ConText (< 2 ms)...');
    await new Promise(r => setTimeout(r, 250));

    const NER = window.Pakimed?.NER;
    const Qwen = window.Pakimed?.QwenAdapter;
    const FusionEngine = window.Pakimed?.FusionEngine;

    // 1. Extracción ancla infalible con ConText (0% alucinación en constantes y datos)
    const nerResult = NER ? NER.extract(text) : null;

    if (this.activeEngine === 'hybrid' && Qwen && FusionEngine) {
      this.setPipelineStep(2, 'Refinando semántica y desambiguando prescripciones con Qwen2.5...');
      let slmResult = null;
      try {
        const lang = window.I18nManager ? window.I18nManager.getCurrentLanguage() : 'es';
        slmResult = await Qwen.extract(text, { lang });
      } catch (err) {
        console.warn('[PakimedApp] Qwen no respondió, continuando con ancla ConText:', err);
      }

      this.setPipelineStep(3, 'Ejecutando fusión de datos deterministas y razonamiento semántico...');
      await new Promise(r => setTimeout(r, 250));
      this.extractedData = FusionEngine.fuse(nerResult, slmResult, text);
    } else if (FusionEngine) {
      this.setPipelineStep(2, 'Estructurando con motor determinista ConText on-device (< 25 KB)...');
      await new Promise(r => setTimeout(r, 200));
      this.extractedData = FusionEngine.fuse(nerResult, null, text);
    } else {
      this.extractedData = nerResult;
    }

    this.setPipelineStep(4, 'Verificando guardarraíles éticos IEEE 7000 y formato DHIS2...');
    await new Promise(r => setTimeout(r, 250));

    this.renderPreview(this.extractedData);
    this.goToScreen(4); // Pantalla 4: Validación Médica & Signos Vitales
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
        if (checkSpan) checkSpan.innerHTML = '<svg class="mono-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (stepNum === activeStep) {
        el.classList.add('active');
        if (checkSpan) checkSpan.innerHTML = '<svg class="mono-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>';
      } else {
        el.classList.add('pending');
        if (checkSpan) checkSpan.innerHTML = '<svg class="mono-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>';
      }
    });
  }

  renderPreview(data) {
    if (!data) return;
    const i18n = window.I18nManager;

    // 0. Distintivo del Motor de Extracción Realmente Utilizado
    if (this.prevEngineBadge) {
      const engineName = data.patient?.engine || '';
      if (engineName.includes('Híbrido')) {
        this.prevEngineBadge.textContent = i18n ? i18n.get('engine_badge_hybrid') : '🧬 Ensamble Híbrido (ConText + Qwen2.5)';
        this.prevEngineBadge.className = 'ai-engine-badge-sub hybrid';
      } else if (engineName.includes('Qwen')) {
        this.prevEngineBadge.textContent = i18n ? i18n.get('engine_badge_qwen') : '🧠 Qwen2.5-0.5B (Small AI)';
        this.prevEngineBadge.className = 'ai-engine-badge-sub qwen';
      } else {
        this.prevEngineBadge.textContent = i18n ? i18n.get('engine_badge_context') : '⚡ ConText Edge AI (25 KB)';
        this.prevEngineBadge.className = 'ai-engine-badge-sub';
      }
    }

    // 1. Identificación y Demográficos del Paciente
    const p = data.patient || {};
    if (this.prevName) {
      if (p.name) {
        this.prevName.textContent = p.name;
        this.prevName.style.color = '#0f766e';
      } else {
        this.prevName.textContent = i18n ? `⚠️ ${i18n.get('demographic_unidentified')}` : '⚠️ No identificado (Requiere nombre)';
        this.prevName.style.color = '#dc2626';
      }
    }

    if (this.prevAge) {
      const ageUnitStr = i18n ? i18n.get('demographic_age_unit') : (p.ageUnit || 'años');
      const unspecAge = i18n ? i18n.get('demographic_age_unspecified') : 'Edad no indicada';
      this.prevAge.textContent = (p.age !== null && p.age !== undefined)
        ? `${p.age} ${ageUnitStr}` 
        : unspecAge;
    }
    
    if (this.prevGender) {
      let genderStr;
      if (p.gender === 'F') {
        genderStr = i18n ? i18n.get('demographic_gender_female') : 'Femenino';
      } else if (p.gender === 'M') {
        genderStr = i18n ? i18n.get('demographic_gender_male') : 'Masculino';
      } else {
        genderStr = i18n ? i18n.get('demographic_gender_unspecified') : 'Género no indicado';
      }
      this.prevGender.textContent = genderStr;
    }

    // 2. Constantes Vitales
    if (this.prevBP) this.prevBP.textContent = data.vitals?.bloodPressure || '--';
    if (this.prevTemp) this.prevTemp.textContent = data.vitals?.temperature ? `${data.vitals.temperature}` : '--';
    if (this.prevHR) this.prevHR.textContent = data.vitals?.heartRate ? `${data.vitals.heartRate}` : '--';
    if (this.prevSpO2) {
      this.prevSpO2.textContent = data.vitals?.oxygenSaturation ? `${data.vitals.oxygenSaturation}` : '--';
    }

    // 3. Aviso de Constantes No Medidas / Parciales
    if (this.unmeasuredFieldsBox && this.unmeasuredFieldsText) {
      const missing = data.missingFields || (window.Pakimed?.Guardrails?.detectMissingOptionalFields(data) || []);
      if (missing.length > 0) {
        this.unmeasuredFieldsBox.classList.remove('hidden');
        const translatedMissing = missing.map(m => {
          if (!i18n) return m;
          if (m === 'Edad' || m === 'Age' || m === 'Alter') return i18n.get('vital_name_age');
          if (m === 'Género' || m === 'Gender' || m === 'Geschlecht') return i18n.get('vital_name_gender');
          if (m === 'Presión Arterial' || m === 'Blood Pressure' || m === 'Blutdruck') return i18n.get('vital_name_bp');
          if (m === 'Presión Diastólica' || m === 'Diastolic BP' || m === 'Diastolischer Blutdruck') return i18n.get('vital_name_dia');
          if (m === 'Temperatura' || m === 'Temperature' || m === 'Temperatur') return i18n.get('vital_name_temp');
          if (m === 'Pulso (FC)' || m === 'Heart Rate (Pulse)' || m === 'Puls (Herzfrequenz)') return i18n.get('vital_name_hr');
          if (m === 'Sat. O₂ (SpO2)' || m === 'O₂ Saturation (SpO2)' || m === 'Sauerstoffsättigung (SpO2)') return i18n.get('vital_name_spo2');
          return m;
        });
        this.unmeasuredFieldsText.textContent = translatedMissing.join(', ');
      } else {
        this.unmeasuredFieldsBox.classList.add('hidden');
      }
    }

    // 3.1 Aviso de Alergias Medicamentosas Detectadas
    if (this.allergiesBox && this.allergiesText) {
      if (data.patient?.allergies?.length > 0) {
        this.allergiesBox.classList.remove('hidden');
        this.allergiesBox.style.display = 'block';
        this.allergiesText.textContent = data.patient.allergies.join(', ');
      } else {
        this.allergiesBox.classList.add('hidden');
        this.allergiesBox.style.display = 'none';
        this.allergiesText.textContent = '';
      }
    }

    // 4. Síntomas
    if (this.prevSymptoms) {
      if (data.symptoms?.length > 0) {
        this.prevSymptoms.innerHTML = data.symptoms.map(s => `<span class="tag-pill symptom">${s}</span>`).join('');
      } else {
        const emptySymText = i18n ? i18n.get('empty_symptoms') : 'Ningún síntoma específico identificado';
        this.prevSymptoms.innerHTML = `<span class="text-muted">${emptySymText}</span>`;
      }
    }

    // 5. Medicación y Prescripciones
    if (this.prevMeds) {
      if (data.prescriptions?.length > 0) {
        const rxBadgeText = i18n ? i18n.get('rx_badge_title') : 'Receta';
        const rxSubText = i18n ? i18n.get('rx_sub_verified') : 'Indicación facultativa verificada';
        this.prevMeds.innerHTML = data.prescriptions.map(p => `
          <div class="rx-row">
            <span class="rx-badge">
              <svg class="mono-icon rx-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              ${rxBadgeText}
            </span>
            <div>
              <strong>${p}</strong>
              <p class="rx-sub">${rxSubText}</p>
            </div>
          </div>
        `).join('');
      } else {
        const emptyRxText = i18n ? i18n.get('empty_prescriptions') : 'No se indicó medicación en este registro.';
        this.prevMeds.innerHTML = `<p class="text-muted">${emptyRxText}</p>`;
      }
    }

    // 6. Transcripción original
    if (this.prevNotes) {
      this.prevNotes.textContent = `"${data.rawTranscript || 'Sin notas'}"`;
    }

    // 7. Actualización integral de Guardarraíles y Banners de Alerta
    this.updateAlertsAndSafetyStatus(data);
  }

  updateAlertsAndSafetyStatus(data) {
    const telem = window.pakimedTelemetry;
    const i18n = window.I18nManager;

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
      const blockTitle = i18n ? i18n.get('alert_approve_blocked') : 'Complete el nombre y datos clínicos en "Ajustar Registro" para habilitar la firma';
      this.approveBtn.title = blockTitle;
      return;
    }

    // Caso B: Registro Válido
    if (this.incompleteAlert) this.incompleteAlert.classList.add('hidden');
    if (this.guardrailAlert) {
      this.guardrailAlert.classList.remove('hidden');

      if (data.guardrailAlerts && data.guardrailAlerts.length > 0) {
        this.guardrailAlert.className = 'safety-banner warning';
        const obsTitle = i18n ? i18n.get('safety_observation_title') : 'Observación Médica / Constantes:';
        this.guardrailAlert.innerHTML = `⚠️ <strong>${obsTitle}</strong><br>${data.guardrailAlerts.join('<br>')}`;
        if (telem) telem.setSafetyStatus('Observación: Constantes vitales fuera de rango estándar', true);
      } else {
        this.guardrailAlert.className = 'safety-banner secure';
        const verifiedTitle = i18n ? i18n.get('safety_protocol_verified_title') : 'Protocolo Clínico Verificado:';
        const verifiedDesc = i18n ? i18n.get('safety_protocol_verified_desc') : 'Registro generado fielmente a partir del dictado. Toda decisión terapéutica permanece bajo supervisión facultativa.';
        this.guardrailAlert.innerHTML = `<svg class="mono-icon banner-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg><div><strong>${verifiedTitle}</strong> ${verifiedDesc}</div>`;
        if (telem) telem.setSafetyStatus('Protocolo de Transcripción Fiel Activo', false);
      }
    }

    this.approveBtn.disabled = false;
    this.approveBtn.style.opacity = '1';
    this.approveBtn.title = i18n ? i18n.get('btn_approve') : 'Validar y registrar en expediente';
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
    this.goToScreen(5); // Pantalla 5: Expediente Clínico Digital Resguardado
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
    // 1. Ir a pantalla 2 y cargar caso representativo
    this.goToScreen(2);
    this.selectScenario(0);

    // 2. Simular captura de audio clínico
    if (this.voiceEngine) {
      this.voiceEngine.start();
      await new Promise(r => setTimeout(r, 1100));
      this.voiceEngine.stop();
      await new Promise(r => setTimeout(r, 850));
    }

    // 3. Estructurar con el pipeline híbrido (pantalla 3 y luego 4)
    await this.processDictation();
    await new Promise(r => setTimeout(r, 900));

    // 4. Consolidar en expediente si está completo (pantalla 5)
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
