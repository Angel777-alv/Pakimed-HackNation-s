/**
 * Pakimed - Internationalization (i18n) Manager
 * 
 * Responsabilidades:
 * 1. Gestión de diccionarios clínicos en Español, Inglés y Alemán.
 * 2. Adaptación del lenguaje hacia UX médica humana, directa y amigable.
 * 3. Provisión de plantillas de consulta auténticas (médico-paciente) en cada idioma.
 * 4. Configuración del reconocimiento de voz (STT) y estandarización global DHIS2.
 */

const I18nManager = {
  currentLang: 'es',

  localesSTT: {
    es: 'es-MX',
    en: 'en-US',
    de: 'de-DE'
  },

  languages: [
    {
      code: 'es',
      name: 'Español',
      flag: '🇲🇽',
      badge: 'Idioma Principal',
      role: 'Atención Comunitaria',
      summary: 'Dictado de voz natural y estructuración médica local en español.'
    },
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      badge: 'International',
      role: 'Global Telemedicine',
      summary: 'Natural voice dictation & local clinical structuring in English.'
    },
    {
      code: 'de',
      name: 'Deutsch',
      flag: '🇩🇪',
      badge: 'Humanitär',
      role: 'Humanitärer Einsatz',
      summary: 'Natürliches Sprachendiktat und lokale klinische Erfassung auf Deutsch.'
    }
  ],

  scenarios: {
    es: [
      {
        id: 'caso1_laura',
        title: 'Laura Gómez (34 años)',
        subtitle: 'Infección urinaria aguda · PA: 110/70',
        text: 'Hola, buenas tardes. Toma asiento. Dame tu nombre completo y tu edad, por favor. Hola doctor, buenas tardes. Me llamo Laura Gómez y tengo 34 años. Laura Gómez, 34 años. Muy bien, Laura, ¿cuál es el motivo de tu consulta? Doctor, desde hace tres días tengo mucho ardor al orinar. Siento ganas de ir al baño a cada rato, pero cuando voy, solo salen unas gotitas. Y hoy en la mañana noté que la orina estaba como rosada, con un poco de sangre. Además me duele aquí abajo en el vientre. Entiendo. Disuria, polaquiuria, tenesmo vesical y hematuria macroscópica leve de tres días de evolución, acompañado de dolor pélvico. ¿Has tomado algún medicamento para esto? Solo he estado tomando jugo de arándano y mucha agua, pero el ardor no se me quita. De acuerdo, remedios caseros sin mejoría y sin medicamentos previos. ¿Tienes alguna enfermedad crónica? ¿Sufres de infecciones urinarias seguido? ¿Y eres alérgica a algún medicamento? No, doctor, ninguna enfermedad ni alergias. Es la primera vez que me da algo así. Perfecto. Vamos a tomarte los signos vitales primero. Tu presión arterial está en 110 sobre 70, frecuencia cardíaca de 78 latidos por minuto, temperatura de 37.1 grados y saturación de oxígeno al 98 por ciento. Signos estables y afebril. Vamos a iniciar tratamiento con Nitrofurantoína de 100 miligramos cada 6 horas por siete días.'
      },
      {
        id: 'caso2_javier',
        title: 'Javier Ruiz (50 años)',
        subtitle: 'Lumbagia aguda con irradiación · PA: 120/80',
        text: 'Hola, buenas tardes. Pasa, por favor. Dime tu nombre completo y tu edad. Buenas tardes, doctor. Me llamo Javier Ruiz y tengo 50 años. Javier Ruiz, 50 años. Toma asiento, Javier. ¿Qué te trae por aquí? Pues fíjese que el lunes pasado estaba cargando unas cajas pesadas en la bodega y sentí un tirón muy fuerte en la espalda baja. Desde entonces tengo un dolor punzante que me baja por la nalga hasta la rodilla derecha. Casi no me puedo agachar ni caminar bien. Entiendo. Dolor lumbar agudo de cinco días de evolución posterior a esfuerzo físico, con irradiación a miembro pélvico derecho. ¿Has tomado algo para este dolor? Un compañero me dio unas pastillas de naproxeno de 250 miligramos y también me inyectaron complejo B hace tres días, pero me calma un ratito y luego vuelve. Naproxeno de 250 miligramos y complejo B intramuscular con alivio parcial. ¿Padeces alguna enfermedad crónica como diabetes o hipertensión? ¿Eres alérgico a algún medicamento? Ninguna enfermedad, doctor, no soy hipertenso ni diabético. Y que yo sepa, no soy alérgico a nada. Muy bien. Voy a revisar tus signos vitales antes de explorarte la columna. Tu presión arterial está en 120 sobre 80, pulso de 82 latidos por minuto, temperatura de 36.6 grados y saturación de oxígeno al 97 por ciento. Vamos a indicarte Ibuprofeno de 400 miligramos cada 8 horas por 5 días con reposo relativo.'
      },
      {
        id: 'caso3_roberto',
        title: 'Roberto Sánchez (55 años)',
        subtitle: 'Cuadro respiratorio agudo · PA: 130/85',
        text: 'Buenas tardes doctor. Me llamo Roberto Sánchez y tengo 55 años. Buenas tardes don Roberto. ¿Qué molestias tiene hoy? Llevo cuatro días con mucha tos con flema verdosa, dificultad leve para respirar y anoche sentí escalofríos y calor en la frente. Entiendo, tos productiva purulenta y fiebre cuantificada. Tomamos signos vitales: presión arterial 130/85, frecuencia cardíaca de 90 latidos por minuto, temperatura en 38.6 grados y saturación de 95 por ciento. No refiere alergias medicamentosas. Le recetaré Amoxicilina con Ácido Clavulánico 875/125 mg cada 12 horas por 7 días y Paracetamol 500 mg cada 6 horas.'
      }
    ],

    en: [
      {
        id: 'caso1_laura',
        title: 'Laura Gomez (34 years old)',
        subtitle: 'Acute urinary tract infection · BP: 110/70',
        text: 'Good afternoon, please have a seat. What is your full name and age? Hello doctor. My name is Laura Gomez and I am 34 years old. Very well Laura, what brings you in today? Doctor, for three days I have had a severe burning sensation when urinating. I feel like going to the bathroom constantly, but only a few drops come out. This morning the urine was pinkish with some blood, and my lower abdomen hurts. I understand: dysuria, urinary frequency, and hematuria for three days. Have you taken any medications? Only cranberry juice and water, but the burning persists. No allergies reported. Let us check your vitals: blood pressure is 110/70, heart rate 78 bpm, temperature 37.1 °C, and oxygen saturation 98%. Vitals are stable. We will prescribe Nitrofurantoin 100mg every 6 hours for seven days.'
      },
      {
        id: 'caso2_javier',
        title: 'Javier Ruiz (50 years old)',
        subtitle: 'Acute lumbago with radiculopathy · BP: 120/80',
        text: 'Good afternoon, please come in. Tell me your full name and age. Good afternoon doctor. My name is Javier Ruiz and I am 50 years old. Have a seat Javier. What happened? On Monday I was lifting heavy boxes at work and felt a sharp pull in my lower back. Since then I have a sharp pain radiating down my right leg to the knee. I can barely bend or walk. Acute lower back pain of five days duration. Have you taken anything? A coworker gave me naproxen 250mg and I received a B-complex injection, but it only helps for a short time. No allergies or chronic conditions. Your blood pressure is 120/80, heart rate 82 bpm, temperature 36.6 °C, and oxygen saturation 97%. We will prescribe Ibuprofen 400mg every 8 hours for 5 days with relative rest.'
      },
      {
        id: 'caso3_roberto',
        title: 'Robert Sanchez (55 years old)',
        subtitle: 'Acute respiratory infection · BP: 130/85',
        text: 'Good afternoon doctor. My name is Robert Sanchez and I am 55 years old. What symptoms are you experiencing? For four days I have had a heavy cough with greenish phlegm, mild shortness of breath, and fever with chills last night. Productive cough and fever. Checking vitals: blood pressure 130/85, heart rate 90 bpm, temperature 38.6 °C, oxygen saturation 95%. No known drug allergies. Prescribing Amoxicillin Clavulanate 875/125mg every 12 hours for 7 days and Paracetamol 500mg every 6 hours.'
      }
    ],

    de: [
      {
        id: 'caso1_laura',
        title: 'Laura Gomez (34 Jahre alt)',
        subtitle: 'Akute Zystitis / Harnwegsinfekt · RR: 110/70',
        text: 'Guten Tag, bitte nehmen Sie Platz. Nennen Sie mir bitte Ihren vollständigen Namen und Ihr Alter. Guten Tag Herr Doktor. Mein Name ist Laura Gomez und ich bin 34 Jahre alt. Sehr gut Laura, was führt Sie zu mir? Herr Doktor, seit drei Tagen habe ich starkes Brennen beim Wasserlassen. Ich muss ständig auf die Toilette, aber es kommen nur wenige Tropfen. Heute früh war der Urin rötlich mit etwas Blut, und mein Unterbauch schmerzt. Verstehe: Dysurie, Pollakisurie und Hämaturie seit drei Tagen. Haben Sie Medikamente eingenommen? Nur Preiselbeersaft und reichlich Wasser, aber das Brennen hört nicht auf. Keine Allergien bekannt. Ihre Vitalwerte: Blutdruck 110/70, Puls 78 Schläge pro Minute, Temperatur 37.1 °C, Sauerstoffsättigung 98%. Wir verschreiben Nitrofurantoin 100mg alle 6 Stunden für sieben Tage.'
      },
      {
        id: 'caso2_javier',
        title: 'Javier Ruiz (50 Jahre alt)',
        subtitle: 'Akuter Hexenschuss mit Ausstrahlung · RR: 120/80',
        text: 'Guten Tag, treten Sie bitte ein. Wie lautet Ihr vollständiger Name und Ihr Alter? Guten Tag Herr Doktor. Ich heiße Javier Ruiz und bin 50 Jahre alt. Nehmen Sie Platz Javier. Was ist passiert? Am Montag habe ich schwere Kartons gehoben und plötzlich einen heftigen Stich im unteren Rücken gespürt. Seitdem habe ich stechende Schmerzen, die über das Gesäß bis ins rechte Knie ausstrahlen. Ich kann mich kaum bücken. Haben Sie etwas dagegen genommen? Ein Kollege gab mir Naproxen 250mg Tabletten, das lindert aber nur kurzzeitig. Keine Vorerkrankungen oder Allergien. Ihr Blutdruck liegt bei 120/80, Puls 82 bpm, Temperatur 36.6 °C und Sauerstoffsättigung 97%. Ich verordne Ibuprofen 400mg alle 8 Stunden für 5 Tage mit Schonung.'
      },
      {
        id: 'caso3_roberto',
        title: 'Robert Schmidt (55 Jahre alt)',
        subtitle: 'Akuter Atemwegsinfekt · RR: 130/85',
        text: 'Guten Tag Herr Doktor. Mein Name ist Robert Schmidt und ich bin 55 Jahre alt. Welche Beschwerden haben Sie? Seit vier Tagen habe ich starken Husten mit grünlichem Auswurf, leichte Atemnot und gestern Abend Schüttelfrost und Fieber. Wir messen Ihre Vitalwerte: Blutdruck 130/85, Puls 90 bpm, Temperatur 38.6 °C, Sauerstoffsättigung 95%. Keine Medikamentenallergien. Ich verordne Amoxicillin Clavulansäure 875/125mg alle 12 Stunden für 7 Tage und Paracetamol 500mg alle 6 Stunden.'
      }
    ]
  },

  translations: {
    es: {
      app_brand_tag: 'GLOBAL AI HACKATHON 2026 · SMALL AI SALUD',
      app_main_title: 'Pakimed — Asistente Clínico Rural On-Device',
      app_subtitle: 'Inferencia Edge AI multilingüe para estructuración médica offline y sincronización con DHIS2.',
      btn_demo: 'Demostración de Consulta',
      btn_network_sim: 'Conectividad: Simular Red Móvil (3G)',
      btn_network_offline: 'Modo Local (Sin red)',
      
      // Screen 1 - Home
      dr_greeting: 'Hola, Dr. Morales',
      dr_location: 'Centro de Salud Comunitario · Sala 04',
      badge_edge_active: 'Asistente Activo',
      quick_prompts_header: 'Casos Clínicos Frecuentes',
      quick_prompts_hint: 'Toca para cargar consulta',
      btn_start_dictation: 'Iniciar Dictado de Consulta',
      
      // Carousel
      carousel_badge_main: 'Idioma de Consulta',
      carousel_lang_selected: 'Idioma Activo para Voz y Diálogo',
      carousel_action_switch: 'Activar',
      
      // Bottom Dock
      dock_home: 'Inicio',
      dock_structure: 'Estructurar',
      dock_dictate: 'Dictar',
      dock_validate: 'Validación',
      dock_record: 'Expediente',
      
      // Screen 2 - Dictation
      screen2_title: 'Dictado de Consulta Médica',
      screen2_desc: 'El médico y el paciente conversan libremente. El asistente capturará los datos relevantes.',
      mic_hint: 'Toca para grabar audio de la consulta',
      btn_record_start: 'Comenzar Grabación',
      btn_record_stop: 'Detener y Procesar',
      dictation_placeholder: 'Presiona el micrófono para hablar o selecciona un caso de prueba arriba...',
      btn_structure_action: 'Estructurar Consulta Médica',
      engine_selector_label: 'Modo de Inteligencia Artificial:',
      engine_hybrid: 'Híbrido (ConText + Qwen2.5)',
      engine_heuristic: 'Heurístico Local (Offline)',
      
      // Screen 3 - Structuring
      screen3_title: 'Organizando Consulta Médica...',
      screen3_desc: 'Extrayendo signos vitales, antecedentes y síntomas directamente en tu dispositivo.',
      step1_capture: 'Audio Capturado',
      step2_ai: 'Análisis Small AI',
      step3_ready: 'Listo para Validación',
      
      // Screen 4 - Validation
      screen4_title: 'Validación Médica',
      screen4_desc: 'Revisa y confirma la información extraída antes de guardarla en el expediente.',
      field_patient: 'Paciente',
      field_age: 'Edad',
      field_gender: 'Género',
      field_bp: 'Presión Arterial',
      field_hr: 'Pulso',
      field_temp: 'Temperatura',
      field_spo2: 'Saturación O₂',
      field_symptoms: 'Síntomas Registrados',
      field_meds: 'Indicaciones y Medicamentos',
      field_notes: 'Observaciones Médicas',
      field_allergies: 'Alergias',
      no_allergies: 'Sin alergias registradas',
      btn_approve: 'Aprobar y Guardar Expediente',
      btn_edit: 'Modificar Datos',
      doctor_control_note: 'Tu criterio médico prevalece siempre sobre las sugerencias del asistente.',
      
      // Screen 5 - Confirmed Record
      screen5_title: 'Expediente Guardado en el Dispositivo',
      screen5_desc: 'La consulta quedó resguardada de forma segura e inmutable en el almacenamiento local.',
      store_forward_notice: 'Sincronización Automática: Se enviará a DHIS2 en cuanto se restablezca la conexión.',
      btn_new_consult: 'Atender Siguiente Paciente',
      
      // Telemetry Right Side
      telemetry_title: 'Monitoreo y Sincronización',
      telemetry_subtitle: 'Supervisión en tiempo real de procesamiento on-device y enlace DHIS2.',
      telemetry_traffic_label: 'Tráfico Externo en Consulta',
      telemetry_traffic_badge: 'Aislamiento Total',
      telemetry_supervision_label: 'Control y Guardarraíles',
      telemetry_supervision_badge: 'Verificado',
      telemetry_supervision_text: 'Protocolo de fidelidad activo: cero diagnósticos autónomos.',
      telemetry_queue_title: 'Expedientes Locales Resguardados',
      telemetry_btn_sync: 'Sincronizar Lote con DHIS2',
      telemetry_dhis2_title: 'Integración Estándar con Sistema de Salud (DHIS2)',
      telemetry_dhis2_desc: 'Estructura internacional unificada Tracker / Event API:'
    },

    en: {
      app_brand_tag: 'GLOBAL AI HACKATHON 2026 · SMALL AI HEALTH',
      app_main_title: 'Pakimed — On-Device Rural Clinical Assistant',
      app_subtitle: 'Multilingual Edge AI inference for offline medical structuring and DHIS2 sync.',
      btn_demo: 'Clinical Consultation Demo',
      btn_network_sim: 'Connectivity: Simulate Mobile Network (3G)',
      btn_network_offline: 'Local Mode (Offline)',
      
      // Screen 1 - Home
      dr_greeting: 'Hello, Dr. Morales',
      dr_location: 'Community Health Center · Room 04',
      badge_edge_active: 'Assistant Active',
      quick_prompts_header: 'Frequent Clinical Cases',
      quick_prompts_hint: 'Tap to load dialogue',
      btn_start_dictation: 'Start Consultation Dictation',
      
      // Carousel
      carousel_badge_main: 'Consultation Language',
      carousel_lang_selected: 'Active Language for Voice & Dialogue',
      carousel_action_switch: 'Select',
      
      // Bottom Dock
      dock_home: 'Home',
      dock_structure: 'Structure',
      dock_dictate: 'Dictate',
      dock_validate: 'Validation',
      dock_record: 'Records',
      
      // Screen 2 - Dictation
      screen2_title: 'Medical Consultation Dictation',
      screen2_desc: 'Doctor and patient talk naturally. The assistant captures relevant clinical findings.',
      mic_hint: 'Tap to record consultation audio',
      btn_record_start: 'Start Recording',
      btn_record_stop: 'Stop & Process',
      dictation_placeholder: 'Press the microphone or pick a test case above...',
      btn_structure_action: 'Structure Medical Encounter',
      engine_selector_label: 'Artificial Intelligence Mode:',
      engine_hybrid: 'Hybrid (ConText + Qwen2.5)',
      engine_heuristic: 'Local Heuristic (Offline)',
      
      // Screen 3 - Structuring
      screen3_title: 'Structuring Medical Encounter...',
      screen3_desc: 'Extracting vital signs, history, and symptoms directly on your device.',
      step1_capture: 'Audio Captured',
      step2_ai: 'Small AI NER',
      step3_ready: 'Ready for Review',
      
      // Screen 4 - Validation
      screen4_title: 'Clinical Review',
      screen4_desc: 'Review and confirm extracted findings before saving to medical record.',
      field_patient: 'Patient',
      field_age: 'Age',
      field_gender: 'Gender',
      field_bp: 'Blood Pressure',
      field_hr: 'Heart Rate',
      field_temp: 'Temperature',
      field_spo2: 'O₂ Saturation',
      field_symptoms: 'Reported Symptoms',
      field_meds: 'Active Prescriptions',
      field_notes: 'Clinical Notes',
      field_allergies: 'Allergies',
      no_allergies: 'No allergies recorded',
      btn_approve: 'Approve & Save Encounter',
      btn_edit: 'Edit Information',
      doctor_control_note: 'Your clinical judgment always takes precedence over AI suggestions.',
      
      // Screen 5 - Confirmed Record
      screen5_title: 'Record Secured on Device',
      screen5_desc: 'The consultation has been encrypted and safely saved to local device storage.',
      store_forward_notice: 'Store-and-Forward: Will automatically sync to DHIS2 upon network availability.',
      btn_new_consult: 'Next Patient',
      
      // Telemetry Right Side
      telemetry_title: 'Data Monitoring & Synchronization',
      telemetry_subtitle: 'Real-time auditing of on-device processing and DHIS2 health reporting.',
      telemetry_traffic_label: 'External Traffic During Visit',
      telemetry_traffic_badge: 'Local Confinement',
      telemetry_supervision_label: 'Clinical Supervision & Guardrails',
      telemetry_supervision_badge: 'Verified',
      telemetry_supervision_text: 'Fidelity protocol active: zero autonomous diagnoses.',
      telemetry_queue_title: 'Local Clinical Record Queue',
      telemetry_btn_sync: 'Sync Batch with DHIS2',
      telemetry_dhis2_title: 'Global Health Standard Integration (DHIS2)',
      telemetry_dhis2_desc: 'Unified international Tracker / Event API payload:'
    },

    de: {
      app_brand_tag: 'GLOBAL AI HACKATHON 2026 · SMALL AI GESUNDHEIT',
      app_main_title: 'Pakimed — On-Device Klinischer Assistent',
      app_subtitle: 'Mehrsprachige Edge-KI für Offline-Strukturierung und DHIS2-Synchronisation.',
      btn_demo: 'Sprechstunden-Demo',
      btn_network_sim: 'Konnektivität: Mobilfunk simulieren (3G)',
      btn_network_offline: 'Lokaler Modus (Offline)',
      
      // Screen 1 - Home
      dr_greeting: 'Guten Tag, Dr. Morales',
      dr_location: 'Gemeindegesundheitszentrum · Raum 04',
      badge_edge_active: 'Assistent Aktiv',
      quick_prompts_header: 'Häufige Konsultationsfälle',
      quick_prompts_hint: 'Antippen zum Laden',
      btn_start_dictation: 'Sprechstundendiktat starten',
      
      // Carousel
      carousel_badge_main: 'Sprechstundensprache',
      carousel_lang_selected: 'Aktive Sprache für Sprache & Dialog',
      carousel_action_switch: 'Auswählen',
      
      // Bottom Dock
      dock_home: 'Start',
      dock_structure: 'Struktur',
      dock_dictate: 'Diktat',
      dock_validate: 'Validierung',
      dock_record: 'Akte',
      
      // Screen 2 - Dictation
      screen2_title: 'Medizinisches Sprechstundendiktat',
      screen2_desc: 'Arzt und Patient sprechen natürlich. Der Assistent erfasst klinische Daten.',
      mic_hint: 'Tippen zum Aufnehmen des Gesprächs',
      btn_record_start: 'Aufnahme starten',
      btn_record_stop: 'Stoppen & Verarbeiten',
      dictation_placeholder: 'Mikrofon drücken oder Testfall oben wählen...',
      btn_structure_action: 'Konsultation strukturieren',
      engine_selector_label: 'Künstliche Intelligenz Modus:',
      engine_hybrid: 'Hybrid (ConText + Qwen2.5)',
      engine_heuristic: 'Lokale Heuristik (Offline)',
      
      // Screen 3 - Structuring
      screen3_title: 'Konsultation wird strukturiert...',
      screen3_desc: 'Vitalparameter, Vorgeschichte und Symptome werden auf dem Gerät erfasst.',
      step1_capture: 'Sprache erfasst',
      step2_ai: 'Small AI NER',
      step3_ready: 'Bereit zur Prüfung',
      
      // Screen 4 - Validation
      screen4_title: 'Ärztliche Prüfung',
      screen4_desc: 'Prüfen und bestätigen Sie die extrahierten Daten vor der Speicherung.',
      field_patient: 'Patient',
      field_age: 'Alter',
      field_gender: 'Geschlecht',
      field_bp: 'Blutdruck',
      field_hr: 'Puls',
      field_temp: 'Temperatur',
      field_spo2: 'Sauerstoff O₂',
      field_symptoms: 'Erfasste Symptome',
      field_meds: 'Verordnete Medikamente',
      field_notes: 'Klinische Notizen',
      field_allergies: 'Allergien',
      no_allergies: 'Keine Allergien bekannt',
      btn_approve: 'Bestätigen & Speichern',
      btn_edit: 'Daten anpassen',
      doctor_control_note: 'Ihre ärztliche Entscheidung hat stets Vorrang vor KI-Vorschlägen.',
      
      // Screen 5 - Confirmed Record
      screen5_title: 'Patientenakte lokal gesichert',
      screen5_desc: 'Die Konsultation wurde verschlüsselt im lokalen Gerätespeicher abgelegt.',
      store_forward_notice: 'Store-and-Forward: Automatische DHIS2-Übertragung bei Netzverbindung.',
      btn_new_consult: 'Nächster Patient',
      
      // Telemetry Right Side
      telemetry_title: 'Datenüberwachung & Synchronisation',
      telemetry_subtitle: 'Echtzeitüberwachung der On-Device-Verarbeitung und DHIS2-Meldung.',
      telemetry_traffic_label: 'Externer Datenverkehr',
      telemetry_traffic_badge: 'Vollständig Lokal',
      telemetry_supervision_label: 'Klinische Aufsicht & Guardrails',
      telemetry_supervision_badge: 'Geprüft',
      telemetry_supervision_text: 'Treueprotokoll aktiv: keine autonome Diagnosestellung.',
      telemetry_queue_title: 'Lokale Warteschlange der Akten',
      telemetry_btn_sync: 'Stapel mit DHIS2 abgleichen',
      telemetry_dhis2_title: 'Globaler Gesundheitsstandard (DHIS2)',
      telemetry_dhis2_desc: 'International einheitlicher Tracker / Event API Datensatz:'
    }
  },

  get(key) {
    const dict = this.translations[this.currentLang] || this.translations.es;
    return dict[key] || key;
  },

  getCurrentLanguage() {
    return this.currentLang;
  },

  getSTTLocale() {
    return this.localesSTT[this.currentLang] || 'es-MX';
  },

  getScenarios() {
    return this.scenarios[this.currentLang] || this.scenarios.es;
  },

  setLanguage(langCode) {
    if (!['es', 'en', 'de'].includes(langCode)) return;
    this.currentLang = langCode;

    // Actualizar elementos con atributo data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.get(key);
      if (val) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });

    // Actualizar idioma en el reconocedor de voz si existe
    if (window.voiceRecorder) {
      window.voiceRecorder.setLanguage(this.getSTTLocale());
    }

    // Disparar evento para componentes reactivos
    window.dispatchEvent(new CustomEvent('pakimed:languageChanged', {
      detail: { lang: langCode, localeSTT: this.getSTTLocale() }
    }));
  }
};

if (typeof window !== 'undefined') {
  window.I18nManager = I18nManager;
}
