/**
 * Pakimed Clinical Entity Extractor (On-Device Small AI / NER Engine)
 * 
 * Ontología clínica rural optimizada (< 35 KB en memoria):
 * - Signos vitales: Presión arterial, Temperatura, Pulso, Saturación de Oxígeno (SpO2).
 * - Demografía del paciente: Edad (años/meses), Género (F/M).
 * - Sintomatología clasificada (~80 entidades de atención primaria).
 * - Farmacología esencial OMS con posología y vías de administración.
 * - Guardarraíles éticos (IEEE 7000) y completitud clínica.
 */

const ClinicalNER = {
  // Ontología de Sintomatología de Atención Primaria Rural
  SYMPTOM_ONTOLOGY: [
    // Respiratorios
    'tos seca', 'tos con flemas', 'tos productiva', 'tos con flema', 'tos',
    'dificultad respiratoria', 'disnea', 'falta de aire', 'dolor de pecho', 'dolor torácico',
    'dolor de garganta', 'odinofagia', 'ardor de garganta', 'rinorrea', 'secreción nasal',
    'congestión nasal', 'estornudos', 'sibilancias', 'ronquera',
    // Gastrointestinales
    'dolor abdominal', 'dolor de estómago', 'cólico abdominal', 'diarrea', 'evacuaciones líquidas',
    'vómitos', 'vomitos', 'vómito', 'vomito', 'náuseas', 'nauseas', 'acidez', 'reflujo',
    'inapetencia', 'pérdida de apetito', 'distensión abdominal',
    // Infecciosos y Sistémicos
    'fiebre', 'febrícula', 'alzas térmicas', 'temperatura elevada', 'escalofríos', 'escalofrios',
    'malestar general', 'decaimiento', 'fatiga', 'astenia', 'cansancio', 'sudoración nocturna',
    'dolor muscular', 'mialgias', 'dolor articular', 'artralgias', 'dolor de cuerpo',
    // Neurológicos
    'dolor de cabeza', 'cefalea', 'mareo', 'mareos', 'vértigo', 'desmayo', 'somnolencia',
    'visión borrosa',
    // Dermatológicos y Alérgicos
    'prurito', 'picazón', 'erupción cutánea', 'granos en la piel', 'ronchas', 'urticaria',
    'edema', 'hinchazón en tobillos', 'hinchazón en pies',
    // Genitourinarios
    'dolor al orinar', 'ardor al orinar', 'disuria', 'orina oscura',
    // Asintomático
    'asintomático', 'asintomatica', 'sin molestias', 'buen estado general'
  ],

  // Medicamentos Esenciales de Atención Primaria (Lista Modelo OMS)
  ESSENTIAL_MEDS: [
    'paracetamol', 'acetaminofén', 'acetaminofen', 'ibuprofeno', 'diclofenaco',
    'metamizol', 'dipirona', 'aspirina', 'ácido acetilsalicílico',
    'amoxicilina', 'ampicilina', 'cefalexina', 'ciprofloxacino', 'azitromicina',
    'claritromicina', 'metronidazol', 'cotrimoxazol', 'trimetoprima',
    'losartán', 'losartan', 'enalapril', 'captopril', 'amlodipino', 'hidroclorotiazida',
    'sales de rehidratación oral', 'suero oral', 'omeprazol', 'ranitidina',
    'loperamida', 'metoclopramida', 'butilhioscina', 'dimenhidrinato',
    'salbutamol', 'budesonida', 'beclometasona', 'loratadina', 'cetirizina',
    'clorfenamina', 'ambroxol', 'dextrometorfano', 'metformina', 'glibenclamida',
    'albendazol', 'mebendazol'
  ],

  /**
   * Extrae entidades estructuradas y evalúa correspondencia y confianza clínica
   * @param {string} rawTranscript - Texto del dictado
   * @returns {Object}
   */
  extract(rawTranscript) {
    const text = (rawTranscript || '').trim();
    const result = {
      rawTranscript: text,
      patient: { age: null, ageUnit: 'años', gender: null, confidence: 1.0 },
      vitals: { bloodPressure: null, temperature: null, heartRate: null, oxygenSaturation: null, confidence: 1.0 },
      symptoms: [],
      prescriptions: [],
      doctorNotes: text,
      atypicalNotes: [],
      guardrailAlerts: [],
      isAutonomousDiagnosis: false,
      isComplete: true,
      completenessMessage: null,
      entitiesFound: 0
    };

    if (!text) {
      result.isComplete = false;
      result.completenessMessage = 'No se ingresó dictado médico.';
      return result;
    }

    // 1. EDAD
    const ageMatch = text.match(/(?:paciente(?:\s+femenina|\s+masculino|\s+de)?\s*(?:de)?\s*)(\d{1,3})\s*(?:años|meses|a)?/i)
      || text.match(/(\d{1,3})\s*(?:años|meses)\s*(?:de edad)?/i)
      || text.match(/(?:edad(?:\s*:\s*|\s+de\s+))(\d{1,3})\s*(?:años|meses)?/i);
    
    if (ageMatch) {
      result.patient.age = parseInt(ageMatch[1], 10);
      if (/meses/i.test(ageMatch[0])) {
        result.patient.ageUnit = 'meses';
      }
      result.entitiesFound++;
    }

    // 2. GÉNERO
    if (/\b(femenina|femenino|mujer|niña|señora|dama|paciente mujer)\b/i.test(text)) {
      result.patient.gender = 'F';
      result.entitiesFound++;
    } else if (/\b(masculino|varon|varón|hombre|niño|señor|caballero|paciente varón)\b/i.test(text)) {
      result.patient.gender = 'M';
      result.entitiesFound++;
    }

    // 3. PRESIÓN ARTERIAL (Sistólica / Diastólica)
    const bpMatch = text.match(/(?:presi[oó]n|tensi[oó]n|pa)\s*(?:arterial)?\s*(?:de)?\s*(\d{2,3})\s*(?:sobre|\/|\s)\s*(\d{2,3})/i)
      || text.match(/(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:mmhg)?/i);
    if (bpMatch) {
      result.vitals.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
      result.entitiesFound++;
    }

    // 4. TEMPERATURA CORPORAL (°C)
    const tempMatch = text.match(/(?:temperatura|temp|febrícula|fiebre)\s*(?:de)?\s*(\d{2}(?:[.,]\d)?)\s*(?:grados|°c|c)?/i)
      || text.match(/(\d{2}[.,]\d)\s*(?:grados|°c)/i);
    if (tempMatch) {
      result.vitals.temperature = parseFloat(tempMatch[1].replace(',', '.'));
      result.entitiesFound++;
    }

    // 5. PULSO / FRECUENCIA CARDÍACA (lpm)
    const hrMatch = text.match(/(?:pulso|frecuencia card[ií]aca|fc|latidos)\s*(?:de)?\s*(\d{2,3})\s*(?:lpm|latidos|x\s*min)?/i);
    if (hrMatch) {
      result.vitals.heartRate = parseInt(hrMatch[1], 10);
      result.entitiesFound++;
    }

    // 6. SATURACIÓN DE OXÍGENO (SpO2 %)
    const o2Match = text.match(/(?:saturaci[oó]n|sat|spo2)\s*(?:de)?\s*(?:ox[ií]geno)?\s*(?:de)?\s*(\d{2,3})\s*%/i)
      || text.match(/(\d{2,3})\s*%\s*(?:de saturaci[oó]n|spo2)/i);
    if (o2Match) {
      result.vitals.oxygenSaturation = parseInt(o2Match[1], 10);
      result.entitiesFound++;
    }

    // 7. SÍNTOMAS ONTOLÓGICOS
    for (const symptom of this.SYMPTOM_ONTOLOGY) {
      const escaped = symptom.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text) && !result.symptoms.includes(symptom)) {
        result.symptoms.push(symptom);
        result.entitiesFound++;
      }
    }

    // 8. PRESCRIPCIONES Y MEDICAMENTOS
    // 8.1 Extracción por patrones de indicación médica directa
    const medRegex = /(?:se indica|indico|receto|prescribo|se prescribe|administrar|medicaci[oó]n:?|tratamiento:?)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d,./-]+?)(?=(?:\.|\n|control en|volver en|cita en|$))/gi;
    let match;
    while ((match = medRegex.exec(text)) !== null) {
      const medText = match[1].trim();
      if (medText.length > 3 && !result.prescriptions.includes(medText)) {
        result.prescriptions.push(medText);
        result.entitiesFound++;
      }
    }

    // 8.2 Búsqueda ontológica de principios activos con posología
    for (const med of this.ESSENTIAL_MEDS) {
      const medRegexOntology = new RegExp(`\\b${med}\\b(?:\\s*\\d+\\s*(?:mg|g|ml|gotas|comprimidos|tabletas))?(?:\\s*(?:cada|por|durante)\\s*[^.\\n,]+)?`, 'i');
      const m = text.match(medRegexOntology);
      if (m) {
        const foundStr = m[0].trim();
        const alreadyCovered = result.prescriptions.some(p => p.toLowerCase().includes(med));
        if (!alreadyCovered && foundStr.length > 3) {
          result.prescriptions.push(foundStr);
          result.entitiesFound++;
        }
      }
    }

    // 9. VALIDACIÓN DE GUARDARRAÍLES (IEEE 7000: No-Diagnóstico)
    const GuardrailsEngine = (typeof window !== 'undefined' && window.Pakimed && window.Pakimed.Guardrails) 
      ? window.Pakimed.Guardrails 
      : ((typeof Guardrails !== 'undefined') ? Guardrails : null);

    if (GuardrailsEngine) {
      const guardrailCheck = GuardrailsEngine.validateNoAutonomousDiagnosis(text);
      if (!guardrailCheck.isValid) {
        result.guardrailAlerts.push(...guardrailCheck.warnings);
        result.isAutonomousDiagnosis = true;
      }

      // Validar Completitud Clínica (¿Hay signos, síntomas o fármacos?)
      const completenessCheck = GuardrailsEngine.validateClinicalCompleteness(result);
      result.isComplete = completenessCheck.isComplete;
      result.completenessMessage = completenessCheck.reason;
    }

    return result;
  }
};

// Exportación Universal
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.NER = ClinicalNER;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClinicalNER };
}
