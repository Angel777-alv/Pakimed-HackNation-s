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
      phone_status_offline: 'Modo Local (Sin red)',
      phone_status_online: '📶 Enlace Activo (3G)',
      
      // Screen 1 - Home
      dr_greeting: 'Hola, Dr. Morales',
      dr_location: 'Centro de Salud Comunitario · Sala 04',
      badge_edge_active: 'Asistente Activo',
      quick_prompts_header: 'Plantillas de Consulta Frecuente',
      quick_prompts_hint: 'Toca para cargar',
      btn_start_dictation: 'Iniciar Dictado de Consulta',
      
      // Carousel
      carousel_badge_main: 'Idioma de Consulta',
      carousel_lang_selected: 'Idioma Activo para Voz y Diálogo',
      carousel_action_switch: 'Activar',
      slide_active_pill: 'Activo',
      
      // Bottom Dock
      dock_home: 'Inicio',
      dock_structure: 'Estructurar',
      dock_dictate: 'Dictar',
      dock_validate: 'Validación',
      dock_record: 'Expediente',
      dock_fab_title: 'Agregar Paciente & Dictar Consulta',
      
      // Screen 2 - Dictation
      screen2_title: 'Captura de Consulta Facultativa',
      screen2_desc: 'Dictado del Facultativo:',
      mic_hint: 'Toca para iniciar captura de audio',
      btn_record_start: 'Comenzar Grabación',
      btn_record_stop: 'Detener y Procesar',
      dictation_placeholder: 'El dictado clínico estructurado aparecerá aquí...',
      btn_structure_action: 'Estructurar Consulta Médica',
      engine_selector_label: 'Modo de Inteligencia Artificial:',
      engine_context_btn: '⚡ ConText',
      engine_hybrid_btn: '🧬 Ensamble Híbrido',
      engine_status_hybrid: '🧬 Híbrido Activo',
      engine_status_heuristic: '⚡ ConText Activo',
      timer_recording_label: '· Grabando',
      audio_processing_text: 'Procesando audio localmente...',
      
      // Screen 3 - Structuring
      screen3_title: 'Estructuración On-Device',
      screen3_desc: 'Extrayendo signos vitales y entidades clínicas en el dispositivo...',
      step1_capture: 'Normalización de audio y ancla determinista',
      step2_ai: 'Refinamiento semántico de recetas con Qwen2.5',
      step3_ready: 'Fusión de datos y guardarraíles',
      step4_dhis2: 'Validación clínica y mapeo a estándar de salud',
      
      // Screen 4 - Validation
      screen4_title: 'Signos Vitales & Validación',
      screen4_desc: 'Revisa y confirma la información extraída antes de guardarla en el expediente.',
      field_patient: 'Paciente',
      field_age: 'Edad',
      field_gender: 'Género',
      field_bp: 'Presión Arterial',
      field_hr: 'Frecuencia Cardíaca',
      field_temp: 'Temperatura',
      field_spo2: 'Sat. Oxígeno (SpO2)',
      field_symptoms: 'Síntomas registrados:',
      field_meds: 'Esquema terapéutico indicado:',
      field_notes: 'Transcripción original de referencia:',
      field_allergies: 'Alergias Medicamentosas:',
      no_allergies: 'Sin alergias registradas',
      btn_approve: 'Validar y Registrar',
      btn_edit: 'Ajustar',
      btn_dictate_again: 'Dictar nuevamente',
      doctor_control_note: 'Tu criterio médico prevalece siempre sobre las sugerencias del asistente.',
      status_sinus_regular: 'Ritmo sinusal regular',
      status_fever_mild: 'Estado febril leve',
      status_normoxemia: 'Normoxemia',
      status_no_record: 'Sin registro en consulta',
      vital_bp_subtitle: 'Sistólica / Diastólica',
      vital_missing_banner_title: 'Constantes no dictadas en consulta:',
      vital_allergies_banner_title: 'Alergias Medicamentosas:',
      
      // Insignias del motor de extracción en validación
      engine_badge_hybrid: '🧬 Ensamble Híbrido (ConText + Qwen2.5)',
      engine_badge_qwen: '🧠 Inferencia Small AI Qwen2.5',
      engine_badge_context: '⚡ ConText Edge AI (25 KB)',
      
      // Demografía localizada
      demographic_age_unit: 'años',
      demographic_age_unspecified: 'Edad no indicada',
      demographic_gender_female: 'Femenino',
      demographic_gender_male: 'Masculino',
      demographic_gender_unspecified: 'Género no indicado',
      demographic_name_missing: '⚠️ No identificado (Requiere nombre)',
      
      // Nombres de constantes no dictadas
      vital_name_bp: 'Presión Arterial',
      vital_name_dia: 'Presión Diastólica',
      vital_name_temp: 'Temperatura',
      vital_name_hr: 'Pulso (FC)',
      vital_name_spo2: 'Sat. O₂ (SpO2)',
      vital_name_age: 'Edad',
      vital_name_gender: 'Género',
      
      // Estados vacíos y etiquetas de consulta
      empty_symptoms: 'Ningún síntoma específico identificado',
      empty_prescriptions: 'No se indicó medicación en este registro.',
      rx_badge_title: 'Receta',
      rx_sub_verified: 'Indicación facultativa verificada',
      notes_empty: 'Sin notas',
      
      // Banners de seguridad clínica y guardarraíles
      safety_protocol_verified_title: 'Protocolo Clínico Verificado:',
      safety_protocol_verified_desc: 'Registro generado fielmente a partir del dictado. Toda decisión terapéutica permanece bajo supervisión facultativa.',
      safety_observation_title: 'Observación Médica / Constantes:',
      safety_incomplete_title: 'Registro Incompleto',
      safety_incomplete_msg: 'No se identificaron signos vitales ni síntomas en el audio. Se requiere revisión facultativa.',
      
      // Alertas y tooltips
      btn_approve_tooltip: 'Validar y registrar en expediente',
      btn_approve_blocked_tooltip: 'Complete el nombre y datos clínicos en "Ajustar" para habilitar la firma',
      alert_approve_blocked: 'No es posible consolidar un expediente sin nombre del paciente y datos clínicos.',
      alert_invalid_save: 'Por favor ingrese el nombre del paciente y verifique que las constantes vitales sean biológicamente válidas.',
      
      // Errores de guardarraíles fisiológicos
      guardrail_err_bp_sys: 'Presión sistólica ({val} mmHg) fuera de rango biológico (50–250 mmHg).',
      guardrail_err_bp_dia: 'Presión diastólica ({val} mmHg) fuera de rango biológico (30–140 mmHg).',
      guardrail_err_temp: 'Temperatura ({val} °C) fuera de rango biológico (32.0–43.0 °C).',
      guardrail_err_hr: 'Frecuencia cardíaca ({val} lpm) fuera de rango biológico (30–230 lpm).',
      guardrail_err_spo2: 'Saturación de O₂ ({val}%) fuera de rango biológico (50–100%).',
      guardrail_err_age: 'Edad dictada ({val} años) fuera de rango plausible (0–120 años).',
      guardrail_obs_bp_sys: 'Presión sistólica en {val} mmHg (referencia estándar: 90–130 mmHg).',
      guardrail_obs_bp_dia: 'Presión diastólica en {val} mmHg (referencia estándar: 60–85 mmHg).',
      guardrail_obs_temp: 'Temperatura en {val} °C (referencia estándar: 36.0–37.5 °C).',
      guardrail_obs_hr: 'Frecuencia cardíaca en {val} lpm (referencia estándar: 60–100 lpm).',
      guardrail_obs_spo2: 'Saturación de O₂ en {val}% (referencia estándar: ≥ 94%).',
      
      // Screen 5 - Confirmed Record
      screen5_title: 'Expediente Clínico Resguardado',
      screen5_desc: 'La consulta ha sido encriptada e incorporada a la base de datos local inmutable del dispositivo.',
      store_forward_notice: 'Sincronización Store-and-Forward: En cuanto se detecte enlace 3G o institucional, el lote se consolidará automáticamente.',
      btn_new_consult: 'Nueva Consulta',
      doc_scanner_sheet: 'Expediente Clínico Digital',
      pipeline_step_capture: 'Captura Dictada',
      pipeline_step_ner: 'Small AI NER',
      pipeline_step_validated: 'Validado',
      
      // Telemetry Right Side (Preservado en estándar inglés oficial)
      telemetry_tag: 'Institutional Control & Telemetry Center',
      telemetry_title: 'Data Monitoring & Synchronization',
      telemetry_subtitle: 'Real-time auditing of on-device processing, clinician review, and public health standards.',
      telemetry_traffic_label: 'External Traffic During Visit',
      telemetry_traffic_badge: 'Local Confinement',
      telemetry_traffic_desc: 'Total absence of external network calls during clinical care.',
      telemetry_supervision_label: 'Clinical Supervision & Guardrails',
      telemetry_supervision_badge: 'Validated',
      telemetry_supervision_text: 'Faithful Transcription Protocol Active',
      telemetry_supervision_desc: 'Active prevention of diagnostic inferences not endorsed by clinician.',
      telemetry_network_label: 'Connectivity Channel',
      telemetry_network_state_offline: 'Local Autonomous Mode (Secure Storage)',
      telemetry_network_state_online: '3G Health Network Available (Ready to Sync)',
      telemetry_network_desc: 'Records remain in encrypted local database until institutional link is restored.',
      telemetry_queue_title: 'Local Clinical Record Queue',
      telemetry_queue_desc: 'Records stored locally awaiting institutional network link:',
      telemetry_btn_sync: 'Sync Batch',
      telemetry_sync_banner: 'Records remain preserved intact in local storage against power outages or coverage loss.',
      telemetry_dhis2_title: 'Public Health Integration',
      telemetry_dhis2_desc: 'Structured clinical payload ready for institutional sync:',
      telemetry_dhis2_empty: '// Once validated, the structured clinical payload will appear here',
      
      // Modal HITL
      modal_title: 'Ajustar Registro Clínico del Paciente',
      modal_intro: 'El criterio facultativo prevalece sobre cualquier inferencia automatizada. Valide o modifique los valores antes del registro definitivo:',
      modal_patient_label: 'Nombre del Paciente (Obligatorio):',
      modal_patient_placeholder: 'Nombre completo',
      modal_age_label: 'Edad (años):',
      modal_gender_label: 'Género:',
      modal_gender_select: 'Seleccionar',
      modal_gender_female: 'Femenino',
      modal_gender_male: 'Masculino',
      modal_bp_label: 'Presión Arterial:',
      modal_temp_label: 'Temperatura (°C):',
      modal_hr_label: 'Pulso (lpm):',
      modal_spo2_label: 'Saturación O₂ (% SpO2):',
      modal_allergies_label: 'Alergias Medicamentosas:',
      modal_allergies_placeholder: 'Ej: Penicilina (o dejar vacío)',
      modal_symptoms_label: 'Síntomas registrados (separados por coma):',
      modal_symptoms_placeholder: 'Ej: disuria, fiebre, dolor abdominal',
      modal_meds_label: 'Medicamentos e indicaciones facultativas:',
      modal_meds_placeholder: 'Ej: Nitrofurantoína 100mg cada 6 horas',
      modal_notes_label: 'Observaciones clínicas de respaldo:',
      modal_cancel: 'Cancelar',
      modal_save: 'Guardar Registro',
      modal_alert_title: 'Validación de Registro:',
      modal_alert_name_required: 'Identificación requerida: Ingrese el nombre del paciente para habilitar el guardado.',
      modal_alert_clinical_required: 'Se requiere el nombre del paciente y al menos un dato clínico para consolidar el expediente.',
      modal_alert_empty_record: 'Registro clínico vacío: No se detectaron signos vitales, sintomatología ni prescripciones.',
      btn_save_modal_tooltip: 'Guardar cambios validados',
      btn_save_modal_blocked_tooltip: 'Complete el nombre y corrija los valores atípicos antes de guardar'
    },

    en: {
      app_brand_tag: 'GLOBAL AI HACKATHON 2026 · SMALL AI HEALTH',
      app_main_title: 'Pakimed — On-Device Rural Clinical Assistant',
      app_subtitle: 'Multilingual Edge AI inference for offline medical structuring and DHIS2 sync.',
      btn_demo: 'Clinical Consultation Demo',
      btn_network_sim: 'Connectivity: Simulate Mobile Network (3G)',
      btn_network_offline: 'Local Mode (Offline)',
      phone_status_offline: 'Local Mode (Offline)',
      phone_status_online: '📶 Active Link (3G)',
      
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
      slide_active_pill: 'Active',
      
      // Bottom Dock
      dock_home: 'Home',
      dock_structure: 'Structure',
      dock_dictate: 'Dictate',
      dock_validate: 'Validation',
      dock_record: 'Records',
      dock_fab_title: 'Add Patient & Dictate Encounter',
      
      // Screen 2 - Dictation
      screen2_title: 'Clinical Encounter Capture',
      screen2_desc: 'Clinician Dictation:',
      mic_hint: 'Tap to start audio recording',
      btn_record_start: 'Start Recording',
      btn_record_stop: 'Stop & Process',
      dictation_placeholder: 'Structured clinical dictation will appear here...',
      btn_structure_action: 'Structure Medical Encounter',
      engine_selector_label: 'Artificial Intelligence Mode:',
      engine_context_btn: '⚡ ConText',
      engine_hybrid_btn: '🧬 Hybrid Ensemble',
      engine_status_hybrid: '🧬 Hybrid Active',
      engine_status_heuristic: '⚡ ConText Active',
      timer_recording_label: '· Recording',
      audio_processing_text: 'Processing audio locally...',
      
      // Screen 3 - Structuring
      screen3_title: 'On-Device Structuring',
      screen3_desc: 'Extracting vital signs and clinical entities on the device...',
      step1_capture: 'Audio normalization and deterministic anchor',
      step2_ai: 'Semantic prescription refinement with Qwen2.5',
      step3_ready: 'Data fusion and safety guardrails',
      step4_dhis2: 'Clinical validation and health standard mapping',
      
      // Screen 4 - Validation
      screen4_title: 'Vital Signs & Validation',
      screen4_desc: 'Review and confirm extracted findings before saving to medical record.',
      field_patient: 'Patient',
      field_age: 'Age',
      field_gender: 'Gender',
      field_bp: 'Blood Pressure',
      field_hr: 'Heart Rate',
      field_temp: 'Temperature',
      field_spo2: 'O₂ Saturation (SpO2)',
      field_symptoms: 'Reported symptoms:',
      field_meds: 'Indicated therapeutic regimen:',
      field_notes: 'Original reference transcript:',
      field_allergies: 'Drug Allergies:',
      no_allergies: 'No allergies recorded',
      btn_approve: 'Validate & Record',
      btn_edit: 'Adjust',
      btn_dictate_again: 'Dictate again',
      doctor_control_note: 'Your clinical judgment always takes precedence over AI suggestions.',
      status_sinus_regular: 'Regular sinus rhythm',
      status_fever_mild: 'Mild fever state',
      status_normoxemia: 'Normoxemia',
      status_no_record: 'No value dictated in visit',
      vital_bp_subtitle: 'Systolic / Diastolic',
      vital_missing_banner_title: 'Vitals not dictated in visit:',
      vital_allergies_banner_title: 'Drug Allergies:',
      
      // Extraction engine badges
      engine_badge_hybrid: '🧬 Hybrid Ensemble (ConText + Qwen2.5)',
      engine_badge_qwen: '🧠 Small AI Qwen2.5 Inference',
      engine_badge_context: '⚡ ConText Edge AI (25 KB)',
      
      // Localized demographics
      demographic_age_unit: 'years old',
      demographic_age_unspecified: 'Age not specified',
      demographic_gender_female: 'Female',
      demographic_gender_male: 'Male',
      demographic_gender_unspecified: 'Gender not specified',
      demographic_name_missing: '⚠️ Not identified (Name required)',
      
      // Missing vitals names
      vital_name_bp: 'Blood Pressure',
      vital_name_dia: 'Diastolic Pressure',
      vital_name_temp: 'Temperature',
      vital_name_hr: 'Heart Rate (HR)',
      vital_name_spo2: 'O₂ Sat. (SpO2)',
      vital_name_age: 'Age',
      vital_name_gender: 'Gender',
      
      // Empty states & labels
      empty_symptoms: 'No specific symptoms identified',
      empty_prescriptions: 'No medication indicated in this encounter.',
      rx_badge_title: 'Prescription',
      rx_sub_verified: 'Verified clinician instruction',
      notes_empty: 'No notes',
      
      // Safety guardrails & banners
      safety_protocol_verified_title: 'Clinical Protocol Verified:',
      safety_protocol_verified_desc: 'Record generated faithfully from dictation. All clinical decisions remain under clinician supervision.',
      safety_observation_title: 'Clinical Observation / Vitals:',
      safety_incomplete_title: 'Incomplete Record',
      safety_incomplete_msg: 'No vital signs or symptoms identified in audio. Clinician review required.',
      
      // Alerts & tooltips
      btn_approve_tooltip: 'Validate and record encounter',
      btn_approve_blocked_tooltip: 'Enter name and findings in "Adjust" to enable approval',
      alert_approve_blocked: 'Cannot finalize record without patient name and clinical findings.',
      alert_invalid_save: 'Please enter patient name and ensure vital signs are biologically valid.',
      
      // Physiological guardrail errors
      guardrail_err_bp_sys: 'Systolic pressure ({val} mmHg) out of plausible range (50–250 mmHg).',
      guardrail_err_bp_dia: 'Diastolic pressure ({val} mmHg) out of plausible range (30–140 mmHg).',
      guardrail_err_temp: 'Temperature ({val} °C) out of plausible range (32.0–43.0 °C).',
      guardrail_err_hr: 'Heart rate ({val} bpm) out of plausible range (30–230 bpm).',
      guardrail_err_spo2: 'O₂ saturation ({val}%) out of plausible range (50–100%).',
      guardrail_err_age: 'Reported age ({val} years) out of plausible range (0–120 years).',
      guardrail_obs_bp_sys: 'Systolic pressure at {val} mmHg (standard reference: 90–130 mmHg).',
      guardrail_obs_bp_dia: 'Diastolic pressure at {val} mmHg (standard reference: 60–85 mmHg).',
      guardrail_obs_temp: 'Temperature at {val} °C (standard reference: 36.0–37.5 °C).',
      guardrail_obs_hr: 'Heart rate at {val} bpm (standard reference: 60–100 bpm).',
      guardrail_obs_spo2: 'O₂ saturation at {val}% (standard reference: ≥ 94%).',
      
      // Screen 5 - Confirmed Record
      screen5_title: 'Encounter Record Secured',
      screen5_desc: 'The consultation has been encrypted and saved into the immutable local device storage.',
      store_forward_notice: 'Store-and-Forward: Batch will be automatically synchronized upon 3G connection.',
      btn_new_consult: 'Next Patient',
      doc_scanner_sheet: 'Digital Medical Record',
      pipeline_step_capture: 'Dictated Audio',
      pipeline_step_ner: 'Small AI NER',
      pipeline_step_validated: 'Validated',
      
      // Telemetry Right Side (Preserved in official standard English)
      telemetry_tag: 'Institutional Control & Telemetry Center',
      telemetry_title: 'Data Monitoring & Synchronization',
      telemetry_subtitle: 'Real-time auditing of on-device processing, clinician review, and public health standards.',
      telemetry_traffic_label: 'External Traffic During Visit',
      telemetry_traffic_badge: 'Local Confinement',
      telemetry_traffic_desc: 'Total absence of external network calls during clinical care.',
      telemetry_supervision_label: 'Clinical Supervision & Guardrails',
      telemetry_supervision_badge: 'Validated',
      telemetry_supervision_text: 'Faithful Transcription Protocol Active',
      telemetry_supervision_desc: 'Active prevention of diagnostic inferences not endorsed by clinician.',
      telemetry_network_label: 'Connectivity Channel',
      telemetry_network_state_offline: 'Local Autonomous Mode (Secure Storage)',
      telemetry_network_state_online: '3G Health Network Available (Ready to Sync)',
      telemetry_network_desc: 'Records remain in encrypted local database until institutional link is restored.',
      telemetry_queue_title: 'Local Clinical Record Queue',
      telemetry_queue_desc: 'Records stored locally awaiting institutional network link:',
      telemetry_btn_sync: 'Sync Batch',
      telemetry_sync_banner: 'Records remain preserved intact in local storage against power outages or coverage loss.',
      telemetry_dhis2_title: 'Public Health Integration',
      telemetry_dhis2_desc: 'Structured clinical payload ready for institutional sync:',
      telemetry_dhis2_empty: '// Once validated, the structured clinical payload will appear here',
      
      // Modal HITL
      modal_title: 'Adjust Patient Clinical Record',
      modal_intro: 'Clinician judgment takes precedence over automated inference. Validate or modify values before final recording:',
      modal_patient_label: 'Patient Name (Required):',
      modal_patient_placeholder: 'Full name',
      modal_age_label: 'Age (years):',
      modal_gender_label: 'Gender:',
      modal_gender_select: 'Select',
      modal_gender_female: 'Female',
      modal_gender_male: 'Male',
      modal_bp_label: 'Blood Pressure:',
      modal_temp_label: 'Temperature (°C):',
      modal_hr_label: 'Heart Rate (bpm):',
      modal_spo2_label: 'O₂ Saturation (% SpO2):',
      modal_allergies_label: 'Drug Allergies:',
      modal_allergies_placeholder: 'E.g. Penicillin (or leave empty)',
      modal_symptoms_label: 'Reported symptoms (comma-separated):',
      modal_symptoms_placeholder: 'E.g. dysuria, fever, pelvic pain',
      modal_meds_label: 'Prescriptions & instructions:',
      modal_meds_placeholder: 'E.g. Nitrofurantoin 100mg every 6 hours',
      modal_notes_label: 'Clinical reference notes:',
      modal_cancel: 'Cancel',
      modal_save: 'Save Record',
      modal_alert_title: 'Record Validation:',
      modal_alert_name_required: 'Identification required: Enter patient name to enable saving.',
      modal_alert_clinical_required: 'Patient name and at least one clinical finding are required to save record.',
      modal_alert_empty_record: 'Empty encounter: No vitals, symptoms or prescriptions detected.',
      btn_save_modal_tooltip: 'Save validated changes',
      btn_save_modal_blocked_tooltip: 'Complete name and fix outliers before saving'
    },

    de: {
      app_brand_tag: 'GLOBAL AI HACKATHON 2026 · SMALL AI GESUNDHEIT',
      app_main_title: 'Pakimed — On-Device Klinischer Assistent',
      app_subtitle: 'Mehrsprachige Edge-KI für Offline-Strukturierung und DHIS2-Synchronisation.',
      btn_demo: 'Sprechstunden-Demo',
      btn_network_sim: 'Konnektivität: Mobilfunk simulieren (3G)',
      btn_network_offline: 'Lokaler Modus (Offline)',
      phone_status_offline: 'Lokaler Modus (Offline)',
      phone_status_online: '📶 Mobilfunk Aktiv (3G)',
      
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
      slide_active_pill: 'Aktiv',
      
      // Bottom Dock
      dock_home: 'Start',
      dock_structure: 'Struktur',
      dock_dictate: 'Diktat',
      dock_validate: 'Validierung',
      dock_record: 'Akte',
      dock_fab_title: 'Patient aufnehmen & Diktat starten',
      
      // Screen 2 - Dictation
      screen2_title: 'Ärztliche Konsultationserfassung',
      screen2_desc: 'Diktat des Arztes:',
      mic_hint: 'Tippen zum Starten der Sprachaufnahme',
      btn_record_start: 'Aufnahme starten',
      btn_record_stop: 'Stoppen & Verarbeiten',
      dictation_placeholder: 'Strukturiertes klinisches Diktat erscheint hier...',
      btn_structure_action: 'Konsultation strukturieren',
      engine_selector_label: 'Künstliche Intelligenz Modus:',
      engine_context_btn: '⚡ ConText',
      engine_hybrid_btn: '🧬 Hybrides Ensemble',
      engine_status_hybrid: '🧬 Hybrid Aktiv',
      engine_status_heuristic: '⚡ ConText Aktiv',
      timer_recording_label: '· Aufnahme',
      audio_processing_text: 'Audio wird lokal verarbeitet...',
      
      // Screen 3 - Structuring
      screen3_title: 'On-Device Strukturierung',
      screen3_desc: 'Vitalparameter und klinische Daten werden auf dem Gerät erfasst...',
      step1_capture: 'Sprachnormalisierung und deterministischer Anker',
      step2_ai: 'Semantische Rezeptverfeinerung mit Qwen2.5',
      step3_ready: 'Datenfusion und Sicherheitsleitplanken',
      step4_dhis2: 'Klinische Validierung und DHIS2-Musterabgleich',
      
      // Screen 4 - Validation
      screen4_title: 'Vitalparameter & Validierung',
      screen4_desc: 'Prüfen und bestätigen Sie die extrahierten Daten vor der Speicherung.',
      field_patient: 'Patient',
      field_age: 'Alter',
      field_gender: 'Geschlecht',
      field_bp: 'Blutdruck',
      field_hr: 'Herzfrequenz',
      field_temp: 'Temperatur',
      field_spo2: 'Sauerstoffsättigung (SpO2)',
      field_symptoms: 'Erfasste Symptome:',
      field_meds: 'Verordnete Therapie:',
      field_notes: 'Originales Referenztranskript:',
      field_allergies: 'Medikamentenallergien:',
      no_allergies: 'Keine Allergien bekannt',
      btn_approve: 'Validieren & Speichern',
      btn_edit: 'Anpassen',
      btn_dictate_again: 'Erneut diktieren',
      doctor_control_note: 'Ihre ärztliche Entscheidung hat stets Vorrang vor KI-Vorschlägen.',
      status_sinus_regular: 'Regulärer Sinusrhythmus',
      status_fever_mild: 'Leichtes Fieber erfasst',
      status_normoxemia: 'Normoxämie',
      status_no_record: 'Kein Wert im Diktat',
      vital_bp_subtitle: 'Systolisch / Diastolisch',
      vital_missing_banner_title: 'In der Visite nicht erfasste Vitalwerte:',
      vital_allergies_banner_title: 'Medikamentenallergien:',
      
      // Insignias del motor de extracción en validación
      engine_badge_hybrid: '🧬 Hybrides Ensemble (ConText + Qwen2.5)',
      engine_badge_qwen: '🧠 Small AI Qwen2.5 Inferenz',
      engine_badge_context: '⚡ ConText Edge AI (25 KB)',
      
      // Demografía localizada
      demographic_age_unit: 'Jahre alt',
      demographic_age_unspecified: 'Alter nicht angegeben',
      demographic_gender_female: 'Weiblich',
      demographic_gender_male: 'Männlich',
      demographic_gender_unspecified: 'Geschlecht nicht angegeben',
      demographic_name_missing: '⚠️ Nicht identifiziert (Name erforderlich)',
      
      // Nombres de constantes no dictadas
      vital_name_bp: 'Blutdruck',
      vital_name_dia: 'Diastolischer Druck',
      vital_name_temp: 'Temperatur',
      vital_name_hr: 'Puls (HF)',
      vital_name_spo2: 'O₂-Sättigung (SpO2)',
      vital_name_age: 'Alter',
      vital_name_gender: 'Geschlecht',
      
      // Estados vacíos y etiquetas de consulta
      empty_symptoms: 'Keine spezifischen Symptome erfasst',
      empty_prescriptions: 'Keine Medikation in dieser Konsultation verordnet.',
      rx_badge_title: 'Rezept',
      rx_sub_verified: 'Geprüfte ärztliche Verordnung',
      notes_empty: 'Keine Notizen',
      
      // Banners de seguridad clínica y guardarraíles
      safety_protocol_verified_title: 'Geprüftes Klinisches Protokoll:',
      safety_protocol_verified_desc: 'Befund getreu aus dem Diktat erfasst. Alle therapeutischen Entscheidungen verbleiben unter ärztlicher Aufsicht.',
      safety_observation_title: 'Medizinische Beobachtung / Vitalwerte:',
      safety_incomplete_title: 'Unvollständige Akte',
      safety_incomplete_msg: 'Keine Vitalparameter oder Symptome im Audio erfasst. Ärztliche Prüfung erforderlich.',
      
      // Alertas y tooltips
      btn_approve_tooltip: 'Validieren und in Akte speichern',
      btn_approve_blocked_tooltip: 'Namen und Befunde in "Anpassen" vervollständigen',
      alert_approve_blocked: 'Akte kann ohne Patientennamen und klinische Daten nicht gespeichert werden.',
      alert_invalid_save: 'Bitte Patientennamen eingeben und auf biologisch valide Vitalwerte achten.',
      
      // Errores de guardarraíles fisiológicos
      guardrail_err_bp_sys: 'Systolischer Blutdruck ({val} mmHg) außerhalb des physiologischen Bereichs (50–250 mmHg).',
      guardrail_err_bp_dia: 'Diastolischer Blutdruck ({val} mmHg) außerhalb des physiologischen Bereichs (30–140 mmHg).',
      guardrail_err_temp: 'Temperatur ({val} °C) außerhalb des physiologischen Bereichs (32.0–43.0 °C).',
      guardrail_err_hr: 'Herzfrequenz ({val} bpm) außerhalb des physiologischen Bereichs (30–230 bpm).',
      guardrail_err_spo2: 'Sauerstoffsättigung ({val}%) außerhalb des physiologischen Bereichs (50–100%).',
      guardrail_err_age: 'Eingegebenes Alter ({val} Jahre) außerhalb des plausiblen Bereichs (0–120 Jahre).',
      guardrail_obs_bp_sys: 'Systolischer Blutdruck bei {val} mmHg (Standardreferenz: 90–130 mmHg).',
      guardrail_obs_bp_dia: 'Diastolischer Blutdruck bei {val} mmHg (Standardreferenz: 60–85 mmHg).',
      guardrail_obs_temp: 'Temperatur bei {val} °C (Standardreferenz: 36.0–37.5 °C).',
      guardrail_obs_hr: 'Herzfrequenz bei {val} bpm (Standardreferenz: 60–100 bpm).',
      guardrail_obs_spo2: 'Sauerstoffsättigung bei {val}% (Standardreferenz: ≥ 94%).',
      
      // Screen 5 - Confirmed Record
      screen5_title: 'Patientenakte lokal gesichert',
      screen5_desc: 'Die Konsultation wurde verschlüsselt im unveränderlichen lokalen Gerätespeicher abgelegt.',
      store_forward_notice: 'Store-and-Forward: Automatische Übertragung, sobald Mobilfunkempfang besteht.',
      btn_new_consult: 'Nächster Patient',
      doc_scanner_sheet: 'Digitale Patientenakte',
      pipeline_step_capture: 'Sprachdiktat',
      pipeline_step_ner: 'Small AI NER',
      pipeline_step_validated: 'Geprüft',
      
      // Telemetry Right Side (Preservado en estándar inglés oficial)
      telemetry_tag: 'Institutional Control & Telemetry Center',
      telemetry_title: 'Data Monitoring & Synchronization',
      telemetry_subtitle: 'Real-time auditing of on-device processing, clinician review, and public health standards.',
      telemetry_traffic_label: 'External Traffic During Visit',
      telemetry_traffic_badge: 'Local Confinement',
      telemetry_traffic_desc: 'Total absence of external network calls during clinical care.',
      telemetry_supervision_label: 'Clinical Supervision & Guardrails',
      telemetry_supervision_badge: 'Validated',
      telemetry_supervision_text: 'Faithful Transcription Protocol Active',
      telemetry_supervision_desc: 'Active prevention of diagnostic inferences not endorsed by clinician.',
      telemetry_network_label: 'Connectivity Channel',
      telemetry_network_state_offline: 'Local Autonomous Mode (Secure Storage)',
      telemetry_network_state_online: '3G Health Network Available (Ready to Sync)',
      telemetry_network_desc: 'Records remain in encrypted local database until institutional link is restored.',
      telemetry_queue_title: 'Local Clinical Record Queue',
      telemetry_queue_desc: 'Records stored locally awaiting institutional network link:',
      telemetry_btn_sync: 'Sync Batch',
      telemetry_sync_banner: 'Records remain preserved intact in local storage against power outages or coverage loss.',
      telemetry_dhis2_title: 'Public Health Integration',
      telemetry_dhis2_desc: 'Structured clinical payload ready for institutional sync:',
      telemetry_dhis2_empty: '// Once validated, the structured clinical payload will appear here',
      
      // Modal HITL
      modal_title: 'Patientenakte anpassen',
      modal_intro: 'Das ärztliche Urteil hat stets Vorrang vor automatisierten Schlüssen. Werte vor Speicherung prüfen:',
      modal_patient_label: 'Patientenname (Erforderlich):',
      modal_patient_placeholder: 'Vollständiger Name',
      modal_age_label: 'Alter (Jahre):',
      modal_gender_label: 'Geschlecht:',
      modal_gender_select: 'Auswählen',
      modal_gender_female: 'Weiblich',
      modal_gender_male: 'Männlich',
      modal_bp_label: 'Blutdruck:',
      modal_temp_label: 'Temperatur (°C):',
      modal_hr_label: 'Puls (bpm):',
      modal_spo2_label: 'Sauerstoffsättigung (% SpO2):',
      modal_allergies_label: 'Medikamentenallergien:',
      modal_allergies_placeholder: 'Z.B. Penicillin (oder leer lassen)',
      modal_symptoms_label: 'Erfasste Symptome (kommagetrennt):',
      modal_symptoms_placeholder: 'Z.B. Dysurie, Fieber, Unterbauchschmerz',
      modal_meds_label: 'Verordnete Medikamente & Anweisungen:',
      modal_meds_placeholder: 'Z.B. Nitrofurantoin 100mg alle 6 Stunden',
      modal_notes_label: 'Klinische Notizen:',
      modal_cancel: 'Abbrechen',
      modal_save: 'Akte speichern',
      modal_alert_title: 'Validierungsübersicht:',
      modal_alert_name_required: 'Identifikation erforderlich: Bitte Patientennamen eingeben.',
      modal_alert_clinical_required: 'Patientenname und mindestens ein klinischer Befund sind erforderlich.',
      modal_alert_empty_record: 'Leere Visite: Keine Vitalwerte, Symptome oder Rezepte erkannt.',
      btn_save_modal_tooltip: 'Validierte Änderungen speichern',
      btn_save_modal_blocked_tooltip: 'Namen und Ausreißer vor Speichern korrigieren'
    }
  },

  get(key, params = {}) {
    const dict = this.translations[this.currentLang] || this.translations.es;
    let text = dict[key] || key;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }
    return text;
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

    // 1. Actualizar elementos con atributo data-i18n (texto o placeholder según tag)
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

    // 2. Actualizar placeholders específicos
    const placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderEls.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = this.get(key);
      if (val) {
        el.placeholder = val;
      }
    });

    // 3. Actualizar tooltips / títulos
    const titleEls = document.querySelectorAll('[data-i18n-title]');
    titleEls.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = this.get(key);
      if (val) {
        el.title = val;
      }
    });

    // 4. Actualizar reconocedor de voz si existe
    if (window.voiceRecorder && typeof window.voiceRecorder.setLanguage === 'function') {
      window.voiceRecorder.setLanguage(this.getSTTLocale());
    } else if (window.pakimedApp && window.pakimedApp.voiceEngine && typeof window.pakimedApp.voiceEngine.setLanguage === 'function') {
      window.pakimedApp.voiceEngine.setLanguage(this.getSTTLocale());
    }

    // 5. Disparar evento para componentes reactivos
    window.dispatchEvent(new CustomEvent('pakimed:languageChanged', {
      detail: { lang: langCode, localeSTT: this.getSTTLocale() }
    }));
  }
};

if (typeof window !== 'undefined') {
  window.I18nManager = I18nManager;
}
