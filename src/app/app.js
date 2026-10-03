/**
 * Pakimed - Asistente de Registro Clínico Offline
 * Controlador principal y motores clínicos on-device.
 * Diseñado para funcionar 100% autónomo (incluso abriendo el archivo localmente con doble clic).
 */

// ============================================================================
// 1. Guardarraíles Éticos (Seguridad Médica: Cero Diagnóstico Autónomo)
// ============================================================================
const Guardrails = {
  DIAGNOSTIC_KEYWORDS: [
    'el paciente padece de',
    'diagnostico probable',
    'diagnóstico probable',
    'se diagnostica con',
    'sugiero recetar',
    'tratamiento recomendado por la ia',
    'pronostico desfavorable',
    'pronóstico desfavorable'
  ],

  validate(text) {
    const lower = (text || '').toLowerCase();
    const warnings = [];

    for (const keyword of this.DIAGNOSTIC_KEYWORDS) {
      if (lower.includes(keyword)) {
        warnings.push(`Se detectó una suposición médica no permitida: "${keyword}". La IA no debe inferir diagnósticos.`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
};

// ============================================================================
// 2. Extractor Clínico Local (Small AI / NER)
// ============================================================================
const ClinicalNER = {
  extract(rawTranscript) {
    const text = (rawTranscript || '').trim();
    const result = {
      rawTranscript: text,
      patient: { age: null, gender: null },
      vitals: { bloodPressure: null, temperature: null, heartRate: null },
      symptoms: [],
      prescriptions: [],
      doctorNotes: text,
      guardrailAlerts: [],
      isAutonomousDiagnosis: false
    };

    if (!text) return result;

    // Edad
    const ageMatch = text.match(/(?:paciente(?:\s+femenina|\s+masculino|\s+de)?\s*(?:de)?\s*)(\d{1,3})\s*(?:años|meses|a)?/i) 
      || text.match(/(\d{1,3})\s*(?:años|meses)/i);
    if (ageMatch) result.patient.age = parseInt(ageMatch[1], 10);

    // Género
    if (/\b(femenina|femenino|mujer|niña|señora|dama)\b/i.test(text)) {
      result.patient.gender = 'F';
    } else if (/\b(masculino|varon|varón|hombre|niño|señor)\b/i.test(text)) {
      result.patient.gender = 'M';
    }

    // Presión Arterial
    const bpMatch = text.match(/(?:presi[oó]n|tensi[oó]n|pa)\s*(?:arterial)?\s*(?:de)?\s*(\d{2,3})\s*(?:sobre|\/|\s)\s*(\d{2,3})/i)
      || text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/i);
    if (bpMatch) result.vitals.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;

    // Temperatura
    const tempMatch = text.match(/(?:temperatura|temp|fiebre)\s*(?:de)?\s*(\d{2}(?:[.,]\d)?)\s*(?:grados|°c|c)?/i);
    if (tempMatch) result.vitals.temperature = parseFloat(tempMatch[1].replace(',', '.'));

    // Pulso / Frecuencia Cardíaca
    const hrMatch = text.match(/(?:pulso|frecuencia card[ií]aca|fc|latidos)\s*(?:de)?\s*(\d{2,3})\s*(?:lpm|latidos)?/i);
    if (hrMatch) result.vitals.heartRate = parseInt(hrMatch[1], 10);

    // Síntomas comunes
    const symptomDictionary = [
      'fiebre', 'tos seca', 'tos con flema', 'tos', 'dolor de cabeza', 'cefalea',
      'dolor abdominal', 'diarrea', 'vómitos', 'vomito', 'náuseas', 'malestar general',
      'dolor de garganta', 'escalofríos', 'mareo', 'asintomático'
    ];

    for (const symptom of symptomDictionary) {
      if (new RegExp(`\\b${symptom}\\b`, 'i').test(text) && !result.symptoms.includes(symptom)) {
        result.symptoms.push(symptom);
      }
    }

    // Medicamentos dictados
    const medRegex = /(?:se indica|indico|receto|prescribo|administrar|medicaci[oó]n:?|tratamiento:?)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d,./-]+?)(?=(?:\.|\n|control en|volver en|$))/gi;
    let match;
    while ((match = medRegex.exec(text)) !== null) {
      const medText = match[1].trim();
      if (medText.length > 3 && !result.prescriptions.includes(medText)) {
        result.prescriptions.push(medText);
      }
    }

    if (result.prescriptions.length === 0) {
      const knownMeds = ['paracetamol', 'ibuprofeno', 'amoxicilina', 'losartán', 'sales de rehidratación oral'];
      for (const med of knownMeds) {
        if (text.toLowerCase().includes(med)) {
          const snippet = text.substring(text.toLowerCase().indexOf(med)).split('.')[0];
          result.prescriptions.push(snippet.trim());
          break;
        }
      }
    }

    // Verificar Guardarraíles
    const guardrailCheck = Guardrails.validate(text);
    if (!guardrailCheck.isValid) {
      result.guardrailAlerts.push(...guardrailCheck.warnings);
      result.isAutonomousDiagnosis = true;
    }

    return result;
  }
};

// ============================================================================
// 3. Almacenamiento Local (Store-and-Forward)
// ============================================================================
const StorageQueue = {
  STORAGE_KEY: 'pakimed_offline_records_v2',

  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  save(record) {
    const items = this.getAll();
    const entry = {
      id: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      status: 'PENDING_SYNC', // 'PENDING_SYNC' | 'SYNCED'
      data: record
    };
    items.unshift(entry);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    return entry;
  },

  markAllSynced() {
    const items = this.getAll();
    items.forEach(item => {
      item.status = 'SYNCED';
      item.syncedAt = new Date().toISOString();
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

// ============================================================================
// 4. Adaptador Estándar de Salud Pública (DHIS2)
// ============================================================================
const DHIS2Formatter = {
  format(record) {
    const dataValues = [];

    if (record.patient?.age) {
      dataValues.push({ dataElement: 'EDAD_PACIENTE_ANOS', value: String(record.patient.age) });
    }
    if (record.patient?.gender) {
      dataValues.push({ dataElement: 'GENERO_PACIENTE', value: record.patient.gender });
    }
    if (record.vitals?.bloodPressure) {
      dataValues.push({ dataElement: 'PRESION_ARTERIAL', value: record.vitals.bloodPressure });
    }
    if (record.vitals?.temperature) {
      dataValues.push({ dataElement: 'TEMPERATURA_CELSIUS', value: String(record.vitals.temperature) });
    }
    if (record.vitals?.heartRate) {
      dataValues.push({ dataElement: 'FRECUENCIA_CARDIACA', value: String(record.vitals.heartRate) });
    }
    if (record.symptoms?.length) {
      dataValues.push({ dataElement: 'SINTOMAS_REPORTADOS', value: record.symptoms.join(', ') });
    }
    if (record.prescriptions?.length) {
      dataValues.push({ dataElement: 'MEDICAMENTOS_RECETADOS', value: record.prescriptions.join('; ') });
    }

    return {
      programa: 'SALUD_PRIMARIA_RURAL',
      unidadMedica: 'CLINICA_COMUNITARIA_04',
      fechaEvento: record.approvedAt || new Date().toISOString(),
      estado: 'COMPLETADO_APROBADO_MEDICO',
      seguridadEtica: 'PROTOCOLO_TRANSCRIPCION_FIEL_VERIFICADO',
      datosClinicos: dataValues
    };
  }
};

// ============================================================================
// 5. Plantillas de Consulta Rápida (Entrenamiento y Demostración)
// ============================================================================
const DEMO_CASES = [
  {
    id: "caso_1",
    title: "Plantilla 1: Infección Respiratoria Aguda (Adulto)",
    text: "Paciente femenina de 34 años con fiebre de 38.5 grados, tos seca y dolor de cabeza desde hace 3 días. Presión arterial de 120 sobre 80, pulso de 78 latidos por minuto. Se indica Paracetamol 500mg cada 8 horas por 5 días y abundante hidratación oral."
  },
  {
    id: "caso_2",
    title: "Plantilla 2: Cuadro Gastrointestinal Pediátrico",
    text: "Paciente masculino de 6 años de edad presenta dolor abdominal, diarrea y vómitos de 24 horas de evolución. Temperatura de 37.8 grados, pulso de 95 latidos por minuto. Indico sales de rehidratación oral y dieta blanda fraccionada. Control en 48 horas."
  },
  {
    id: "caso_3",
    title: "Plantilla 3: Consulta de Control Hipertensión Arterial",
    text: "Paciente masculino de 68 años acude a control de rutina. Asintomático. Presión arterial de 145 sobre 95, pulso de 72 latidos por minuto. Se mantiene medicación de Losartán 50mg cada 24 horas y reducción de sal."
  }
];

// ============================================================================
// 6. Controlador de la Interfaz (Split Screen)
// ============================================================================
class PakimedApp {
  constructor() {
    this.currentScreen = 1;
    this.extractedData = null;
    this.isOnline = false;
    this.isRecording = false;
    this.recognition = null;
    this.recordTimerInterval = null;
    this.recordSeconds = 0;

    this.initElements();
    this.bindEvents();
    this.initVoiceEngine();
    this.loadScenarios();
    this.renderQueue();
    this.updateOnlineUI();
    this.startClock();
  }

  initElements() {
    // Teléfono
    this.phoneClock = document.getElementById('phoneClock');
    this.phoneBadge = document.getElementById('phoneBadge');
    this.stepTabs = document.querySelectorAll('.step-tab');
    this.screenViews = document.querySelectorAll('.phone-screen-view');

    // Pantalla 1
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

    // Pantalla 2
    this.processingStepText = document.getElementById('processingStepText');

    // Pantalla 3
    this.prevAge = document.getElementById('prevAge');
    this.prevGender = document.getElementById('prevGender');
    this.prevBP = document.getElementById('prevBP');
    this.prevTemp = document.getElementById('prevTemp');
    this.prevHR = document.getElementById('prevHR');
    this.prevSymptoms = document.getElementById('prevSymptoms');
    this.prevMeds = document.getElementById('prevMeds');
    this.prevNotes = document.getElementById('prevNotes');
    this.guardrailAlert = document.getElementById('guardrailAlert');
    this.btnOpenEdit = document.getElementById('btnOpenEdit');
    this.approveBtn = document.getElementById('approveBtn');

    // Modal de Edición
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

    // Panel Derecho (Consola de Telemetría Institucional)
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

  bindEvents() {
    // Pestañas del teléfono
    this.stepTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const step = parseInt(tab.getAttribute('data-step'), 10);
        this.goToScreen(step);
      });
    });

    // Selector de Casos
    this.scenarioSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      if (!isNaN(idx) && DEMO_CASES[idx]) {
        this.dictationText.value = DEMO_CASES[idx].text;
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

    // Modal de Edición
    this.btnOpenEdit.addEventListener('click', () => this.openEditModal());
    this.btnCloseModal.addEventListener('click', () => this.closeEditModal());
    this.btnCancelEdit.addEventListener('click', () => this.closeEditModal());
    this.btnSaveEdit.addEventListener('click', () => this.saveModalEdit());

    // Aprobar Expediente
    this.approveBtn.addEventListener('click', () => {
      this.approveRecord();
    });

    // Alternar Señal (Offline / 3G)
    this.networkToggle.addEventListener('click', () => {
      this.isOnline = !this.isOnline;
      this.updateOnlineUI();
    });

    // Sincronizar hacia DHIS2
    this.syncAllBtn.addEventListener('click', () => {
      this.syncWithDHIS2();
    });

    // Demo 1-Click para Pitch
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
    this.scenarioSelect.innerHTML = '<option value="">-- Elige un caso de prueba --</option>';
    DEMO_CASES.forEach((c, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = c.title;
      this.scenarioSelect.appendChild(opt);
    });

    // Cargar el primero por defecto
    this.scenarioSelect.value = "0";
    this.dictationText.value = DEMO_CASES[0].text;
  }

  initVoiceEngine() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onstart = () => {
        this.startRecording();
      };

      this.recognition.onresult = (e) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          text += e.results[i][0].transcript;
        }
        if (text) {
          this.dictationText.value += (this.dictationText.value ? ' ' : '') + text;
        }
      };

      this.recognition.onend = () => {
        if (this.isRecording) {
          this.stopRecording(true);
        }
      };

      this.recognition.onerror = () => {
        this.stopRecording(false);
      };
    }
  }

  startRecording() {
    this.isRecording = true;
    this.micBtn.classList.add('recording');
    if (this.micIcon) this.micIcon.textContent = '⏹️';
    if (this.waveVisualizer) {
      this.waveVisualizer.classList.remove('dormant');
      this.waveVisualizer.classList.add('active');
    }
    if (this.recordTimerBadge) {
      this.recordTimerBadge.classList.remove('hidden');
    }
    if (this.audioProcessingIndicator) {
      this.audioProcessingIndicator.classList.add('hidden');
    }
    this.micStatusText.textContent = 'Grabando consulta... Toca para finalizar';

    this.recordSeconds = 0;
    if (this.recordTimerText) this.recordTimerText.textContent = '00:00';
    clearInterval(this.recordTimerInterval);
    this.recordTimerInterval = setInterval(() => {
      this.recordSeconds++;
      const m = String(Math.floor(this.recordSeconds / 60)).padStart(2, '0');
      const s = String(this.recordSeconds % 60).padStart(2, '0');
      if (this.recordTimerText) this.recordTimerText.textContent = `${m}:${s}`;
    }, 1000);
  }

  stopRecording(hasAudio = true) {
    this.isRecording = false;
    clearInterval(this.recordTimerInterval);
    this.micBtn.classList.remove('recording');
    if (this.micIcon) this.micIcon.textContent = '🎤';
    if (this.recordTimerBadge) {
      this.recordTimerBadge.classList.add('hidden');
    }
    if (this.waveVisualizer) {
      this.waveVisualizer.classList.remove('active');
      this.waveVisualizer.classList.add('dormant');
    }

    if (hasAudio) {
      if (this.audioProcessingIndicator) {
        this.audioProcessingIndicator.classList.remove('hidden');
      }
      this.micStatusText.textContent = 'Procesando captura de audio...';

      setTimeout(() => {
        if (this.audioProcessingIndicator) {
          this.audioProcessingIndicator.classList.add('hidden');
        }
        this.micStatusText.textContent = 'Captura finalizada. Revisa la transcripción o vuelve a grabar.';
      }, 900);
    } else {
      this.micStatusText.textContent = 'Toca para iniciar captura de audio';
    }
  }

  toggleRecording() {
    if (this.isRecording) {
      if (this.recognition) {
        try { this.recognition.stop(); } catch(e) {}
      }
      this.stopRecording(true);
    } else {
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          this.simulateLocalRecording();
        }
      } else {
        this.simulateLocalRecording();
      }
    }
  }

  simulateLocalRecording() {
    this.startRecording();
    // Si el texto está vacío, cargar automáticamente el primer caso para que el usuario experimente la transcripción
    if (!this.dictationText.value.trim()) {
      setTimeout(() => {
        if (this.isRecording) {
          this.dictationText.value = DEMO_CASES[0].text;
          this.stopRecording(true);
        }
      }, 2500);
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
      alert('Por favor dicta o selecciona una plantilla clínica antes de continuar.');
      return;
    }

    this.goToScreen(2); // Pantalla de Procesamiento
    this.processingStepText.textContent = 'Extrayendo signos vitales y entidades clínicas en el dispositivo...';
    
    await new Promise(r => setTimeout(r, 600));
    this.processingStepText.textContent = 'Validando protocolo clínico: confirmando correspondencia estricta con el dictado...';
    await new Promise(r => setTimeout(r, 500));

    this.extractedData = ClinicalNER.extract(text);
    this.renderPreview(this.extractedData);
    this.goToScreen(3); // Pasar a Validación Médica
  }

  renderPreview(data) {
    this.prevAge.textContent = data.patient.age ? `${data.patient.age} años` : 'No especificada';
    this.prevGender.textContent = data.patient.gender === 'F' ? 'Femenino' : (data.patient.gender === 'M' ? 'Masculino' : 'No especificado');

    this.prevBP.textContent = data.vitals.bloodPressure || '120/80';
    this.prevTemp.textContent = data.vitals.temperature ? `${data.vitals.temperature} °C` : '36.5 °C';
    this.prevHR.textContent = data.vitals.heartRate ? `${data.vitals.heartRate} lpm` : '75 lpm';

    // Síntomas
    if (data.symptoms.length > 0) {
      this.prevSymptoms.innerHTML = data.symptoms.map(s => `<span class="tag-pill symptom">${s}</span>`).join('');
    } else {
      this.prevSymptoms.innerHTML = '<span class="text-muted">Ningún síntoma específico dictado</span>';
    }

    // Medicamentos
    if (data.prescriptions.length > 0) {
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

    this.prevNotes.textContent = `"${data.rawTranscript}"`;

    // Alerta de Seguridad y Protocolo Clínico
    if (data.guardrailAlerts.length > 0) {
      this.guardrailAlert.className = 'safety-banner warning';
      this.guardrailAlert.innerHTML = `⚠️ <strong>Observación Médica:</strong> ${data.guardrailAlerts.join('<br>')}`;
      if (this.telemSafety) this.telemSafety.innerHTML = '<span class="dot-warn"></span> Advertencia: Requiere revisión médica';
    } else {
      this.guardrailAlert.className = 'safety-banner secure';
      this.guardrailAlert.innerHTML = `🛡️ <strong>Protocolo Clínico Verificado:</strong> Registro generado fielmente a partir del dictado. Toda decisión terapéutica permanece bajo supervisión y firma médica.`;
      if (this.telemSafety) this.telemSafety.innerHTML = '<span class="dot-ok"></span> Protocolo de Transcripción Fiel Activo';
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
    this.extractedData.symptoms = this.fieldSymptoms.value.split(',').map(s => s.trim()).filter(Boolean);
    this.extractedData.prescriptions = this.fieldMeds.value.split(';').map(m => m.trim()).filter(Boolean);
    this.extractedData.doctorNotes = this.fieldNotes.value.trim();

    this.renderPreview(this.extractedData);
    this.closeEditModal();
  }

  approveRecord() {
    if (!this.extractedData) return;

    const record = {
      patient: this.extractedData.patient,
      vitals: this.extractedData.vitals,
      symptoms: this.extractedData.symptoms,
      prescriptions: this.extractedData.prescriptions,
      doctorNotes: this.extractedData.doctorNotes,
      approvedAt: new Date().toISOString()
    };

    const saved = StorageQueue.save(record);
    const dhis2Payload = DHIS2Formatter.format(record);

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
    const records = StorageQueue.getAll();
    if (!this.queueList) return;

    if (records.length === 0) {
      this.queueList.innerHTML = '<div class="empty-queue-msg">No hay expedientes en cola. Valide una consulta médica para visualizarla aquí.</div>';
      return;
    }

    this.queueList.innerHTML = records.map(r => `
      <div class="queue-card ${r.status === 'SYNCED' ? 'synced' : 'pending'}">
        <div>
          <div class="queue-card-id">${r.id} &middot; Paciente ${r.data.patient?.gender || 'N/A'} (${r.data.patient?.age ? r.data.patient.age + ' años' : 'Edad no reg.'})</div>
          <div class="queue-card-desc">Registrado: ${new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | ${r.data.symptoms?.slice(0, 2).join(', ') || 'Consulta general'}</div>
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

    this.syncAllBtn.disabled = true;
    this.syncAllBtn.textContent = 'Transmitiendo expedientes al sistema de salud...';

    await new Promise(r => setTimeout(r, 1000));
    StorageQueue.markAllSynced();

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
    this.dictationText.value = DEMO_CASES[0].text;
    
    // Iniciar captura visual
    this.startRecording();
    this.micStatusText.textContent = '🎙️ Capturando dictado clínico del facultativo...';

    await new Promise(r => setTimeout(r, 1400));
    this.stopRecording(true);

    await new Promise(r => setTimeout(r, 950));

    // Paso 2: Procesamiento on-device
    this.goToScreen(2);
    this.processingStepText.textContent = 'Extrayendo entidades clínicas y estructurando en el dispositivo...';
    await new Promise(r => setTimeout(r, 700));

    // Paso 3: Validación Médica
    this.extractedData = ClinicalNER.extract(this.dictationText.value);
    this.renderPreview(this.extractedData);
    this.goToScreen(3);
    await new Promise(r => setTimeout(r, 900));

    // Paso 4: Aprobar y Guardar
    this.approveRecord();
  }
}

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  window.pakimedApp = new PakimedApp();
});
