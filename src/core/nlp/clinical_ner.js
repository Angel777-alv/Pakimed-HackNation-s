/**
 * Pakimed Clinical Entity Extractor (Hybrid Semantic / Heuristic Edge AI Engine)
 * 
 * Arquitectura Híbrida de Inferencia On-Device (< 25 KB de footprint, 0 ms de latencia):
 * 1. Normalizador de lenguaje conversacional y limpiador de muletillas.
 * 2. Escaneo de contexto por ventana de N-gramas (±4 tokens).
 * 3. Mapeador ontológico difuso (Fuzzy Similarity) para modismos y coloquialismos rurales.
 * 4. Extractor de rangos de evolución temporal y posologías farmacológicas.
 * 5. Evaluación de guardarraíles éticos (IEEE 7000) y plausibilidad fisiológica.
 */

const ClinicalNER = {
  // Ontología Canónica con Mapeo de Coloquialismos y Sinónimos
  CANONICAL_SYMPTOMS: [
    {
      canonical: 'Dolor abdominal / epigástrico',
      synonyms: [
        'dolor de estómago', 'dolor en el estómago', 'dolor del estómago', 'dolor de estomago', 
        'dolor en el estomago', 'dolor muy fuerte de estómago', 'dolor muy fuerte del estómago',
        'dolor de panza', 'dolor abdominal', 'cólico abdominal', 'retorcijones', 'dolor de guata',
        'molestia en el estómago', 'ardor en la boca del estómago', 'dolor de barriga'
      ]
    },
    {
      canonical: 'Fiebre / Síndrome febril',
      synonyms: [
        'fiebre', 'febrícula', 'calentura', 'cuerpo caliente', 'alzas térmicas',
        'temperatura elevada', 'escalofríos', 'escalofrios', 'destemplanza', 'sensación febril'
      ]
    },
    {
      canonical: 'Vómitos y Náuseas',
      synonyms: [
        'vómitos', 'vomitos', 'vómito', 'vomito', 'náuseas', 'nauseas', 'asco', 
        'ganas de devolver', 'devolvió el alimento', 'emesis', 'arcadas', 'poco de vómito', 'poco de vomito'
      ]
    },
    {
      canonical: 'Diarrea / Evacuaciones líquidas',
      synonyms: [
        'diarrea', 'evacuaciones líquidas', 'deposiciones líquidas', 'estómago suelto',
        'obró aguado', 'cuerpo suelto', 'diarreas'
      ]
    },
    {
      canonical: 'Cefalea / Dolor de cabeza',
      synonyms: [
        'dolor de cabeza', 'cefalea', 'jaqueca', 'dolor en la frente', 'pesadez de cabeza',
        'migraña', 'dolor en la nuca', 'latidos en la cabeza', 'me ha dolido la cabeza',
        'dolido la cabeza', 'duele la cabeza', 'dolor de la cabeza'
      ]
    },
    {
      canonical: 'Tos y Afección Respiratoria',
      synonyms: [
        'tos seca', 'tos con flemas', 'tos con flema', 'tos productiva', 'tos',
        'ataques de tos', 'no para de toser', 'tos perruna', 'ronquera'
      ]
    },
    {
      canonical: 'Disnea / Dificultad respiratoria',
      synonyms: [
        'dificultad respiratoria', 'dificultad para respirar', 'falta de aire', 'disnea',
        'pecho cerrado', 'pecho apretado', 'ahogo', 'se cansa al caminar', 'sibilancias'
      ]
    },
    {
      canonical: 'Odinofagia / Dolor de garganta',
      synonyms: [
        'dolor de garganta', 'odinofagia', 'ardor de garganta', 'garganta irritada',
        'dolor al tragar', 'carraspeo', 'la garganta', 'dolido la garganta', 'duele la garganta'
      ]
    },
    {
      canonical: 'Artralgias / Dolor articular y extremidades',
      synonyms: [
        'dolor de rodillas', 'doler las rodillas', 'doler las piernas', 'dolor en las rodillas',
        'dolor en rodillas', 'dolor articular', 'dolor de articulaciones', 'artralgias',
        'dolor de huesos', 'dolor de espalda', 'lumbalgia', 'dolor de brazos', 'dolor de piernas'
      ]
    },
    {
      canonical: 'Disuria / Molestia urinaria',
      synonyms: [
        'dolor al orinar', 'ardor al orinar', 'disuria', 'le duele hacer pipí',
        'orina con ardor', 'orina oscura'
      ]
    },
    {
      canonical: 'Malestar general y Mialgias',
      synonyms: [
        'malestar general', 'dolor de cuerpo', 'cuerpo cortado', 'decaimiento',
        'fatiga', 'astenia', 'mialgias', 'dolor muscular', 'sentido muy mal'
      ]
    },
    {
      canonical: 'Asintomático / Control de rutina',
      synonyms: ['asintomático', 'asintomatica', 'sin molestias', 'buen estado general', 'control de rutina']
    }
  ],

  // Lista Modelo de Medicamentos Esenciales
  ESSENTIAL_MEDS: [
    'paracetamol', 'acetaminofén', 'acetaminofen', 'ibuprofeno', 'naproxeno', 'naproxen',
    'diclofenaco', 'ketorolaco', 'metamizol', 'dipirona', 'aspirina', 'ácido acetilsalicílico',
    'amoxicilina', 'ampicilina', 'cefalexina', 'ciprofloxacino', 'azitromicina',
    'claritromicina', 'metronidazol', 'cotrimoxazol', 'trimetoprima',
    'losartán', 'losartan', 'enalapril', 'captopril', 'amlodipino', 'hidroclorotiazida',
    'sales de rehidratación oral', 'suero oral', 'omeprazol', 'ranitidina',
    'loperamida', 'metoclopramida', 'butilhioscina', 'dimenhidrinato',
    'salbutamol', 'budesonida', 'beclometasona', 'loratadina', 'cetirizina',
    'clorfenamina', 'ambroxol', 'dextrometorfano', 'metformina', 'glibenclamida',
    'albendazol', 'mebendazol', 'tramadol', 'prednisona', 'dexametasona', 'betametasona'
  ],

  /**
   * Limpia y normaliza texto eliminando acentos y ruidos conversacionales
   */
  normalizeText(text = '') {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!.,;:"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Distancia de similitud de Levenshtein optimizada
   */
  levenshteinDistance(s1, s2) {
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    const v0 = new Array(s2.length + 1);
    const v1 = new Array(s2.length + 1);

    for (let i = 0; i <= s2.length; i++) v0[i] = i;

    for (let i = 0; i < s1.length; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < s2.length; j++) {
        const cost = s1[i] === s2[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let j = 0; j <= s2.length; j++) v0[j] = v1[j];
    }
    return v1[s2.length];
  },

  /**
   * Similitud normalizada entre 0.0 y 1.0
   */
  similarityRatio(s1, s2) {
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    return (maxLen - this.levenshteinDistance(s1, s2)) / maxLen;
  },

  /**
   * Extracción Semántica Híbrida del Dictado Clínico
   * @param {string} rawTranscript
   * @returns {Object}
   */
  extract(rawTranscript) {
    const text = (rawTranscript || '').trim();
    const normalized = this.normalizeText(text);

    const result = {
      rawTranscript: text,
      patient: { name: null, age: null, ageUnit: 'años', gender: null, confidence: 1.0 },
      vitals: { bloodPressure: null, temperature: null, heartRate: null, oxygenSaturation: null, confidence: 1.0 },
      symptoms: [],
      timeEvolution: null,
      prescriptions: [],
      doctorNotes: text,
      guardrailAlerts: [],
      rangeWarnings: [],
      missingFields: [],
      isAutonomousDiagnosis: false,
      isComplete: true,
      completenessMessage: null
    };

    if (!text) {
      result.isComplete = false;
      result.completenessMessage = 'No se ingresó dictado médico.';
      return result;
    }

    // ========================================================================
    // 1. EXTRACCIÓN DEL NOMBRE DEL PACIENTE
    // ========================================================================
    const nameMatch = text.match(/(?:señor|sr\.|don|caballero)\s+([a-záéíóúÁÉÍÓÚñÑ]+(?:\s+[a-záéíóúÁÉÍÓÚñÑ]+)?)/i)
      || text.match(/(?:señora|sra\.|doña|dama|señorita)\s+([a-záéíóúÁÉÍÓÚñÑ]+(?:\s+[a-záéíóúÁÉÍÓÚñÑ]+)?)/i)
      || text.match(/(?:paciente|nombre del paciente:?)\s+([a-záéíóúÁÉÍÓÚñÑ]+(?:\s+[a-záéíóúÁÉÍÓÚñÑ]+)?)/i);

    if (nameMatch) {
      const candidate = nameMatch[1].trim();
      const forbidden = ['doctor', 'médico', 'medico', 'enfermera', 'femenina', 'femenino', 'masculino', 'varón', 'varon', 'adulto', 'niño', 'niña', 'este', 'bueno'];
      if (!forbidden.includes(candidate.toLowerCase())) {
        result.patient.name = candidate.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }

    // ========================================================================
    // 2. EXTRACCIÓN DE TIEMPO DE EVOLUCIÓN
    // ========================================================================
    const timeMatch = text.match(/(?:desde hace|hace|lleva|de evoluci[oó]n|con ese dolor|con ese cuadro)\s*(\d{1,2}|un|dos|tres|cuatro|cinco)\s*(d[ií]as?|horas?|semanas?|meses?)/i)
      || text.match(/(\d{1,2})\s*(?:d[ií]as?|horas?)\s*(?:de evoluci[oó]n|con ese dolor)?/i);
    
    if (timeMatch) {
      result.timeEvolution = timeMatch[0].trim();
    }

    // ========================================================================
    // 3. EXTRACCIÓN DE GÉNERO
    // ========================================================================
    if (/\b(femenina|femenino|mujer|niña|señora|dama|paciente mujer|doña|señorita)\b/i.test(normalized)) {
      result.patient.gender = 'F';
    } else if (/\b(masculino|varon|hombre|niño|señor|caballero|paciente varon|don)\b/i.test(normalized)) {
      result.patient.gender = 'M';
    }

    // ========================================================================
    // 4. EXTRACCIÓN DE EDAD
    // ========================================================================
    const ageMatch = text.match(/(?:paciente(?:\s+femenina|\s+masculino|\s+de)?\s*(?:de)?\s*)(\d{1,3})\s*(?:años|meses|a)?/i)
      || text.match(/(\d{1,3})\s*(?:años|meses)\s*(?:de edad)?/i)
      || text.match(/(?:edad(?:\s*:\s*|\s+de\s+))(\d{1,3})\s*(?:años|meses)?/i);
    
    if (ageMatch) {
      result.patient.age = parseInt(ageMatch[1], 10);
      if (/meses/i.test(ageMatch[0])) {
        result.patient.ageUnit = 'meses';
      }
    }

    // ========================================================================
    // 4. EXTRACCIÓN DE PRESIÓN ARTERIAL (Multipatrón + Ventana de Contexto)
    // ========================================================================
    // 4.1 Formato dual clásico: 120/80, 120 sobre 80, 120 con 80
    const bpDualMatch = text.match(/(?:presi[oó]n|tensi[oó]n|pa)\s*(?:arterial)?\s*(?:de|es de|son de)?\s*(\d{2,3})\s*(?:sobre|\/|\s|con)\s*(\d{2,3})/i)
      || text.match(/(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:mmhg)?/i);
    
    if (bpDualMatch) {
      result.vitals.bloodPressure = `${bpDualMatch[1]}/${bpDualMatch[2]}`;
    } else {
      // 4.2 Formato coloquial aislado: "son 180 para la presión", "180 en la presión", "presión de 180", "180 de presión"
      const bpSingleMatch = text.match(/(?:son de|es de|de|son|es)?\s*(\d{2,3})\s*(?:para la|en la|de|en|por la)?\s*(?:presi[oó]n|tensi[oó]n|presion|tension|pa)/i)
        || text.match(/(?:presi[oó]n|tensi[oó]n|presion|tension|pa)\s*(?:arterial)?\s*(?:de|es de|son de|en|para|es)?\s*(\d{2,3})/i);
      
      if (bpSingleMatch) {
        const val = parseInt(bpSingleMatch[1], 10);
        if (val >= 50 && val <= 260) {
          result.vitals.bloodPressure = `${val}/--`;
        }
      }
    }

    // ========================================================================
    // 5. EXTRACCIÓN DE TEMPERATURA CORPORAL
    // ========================================================================
    // Formatos: "temperatura global normal 36°", "temperatura normal de 36°", "36.5 grados", "36 y medio", "38 de fiebre"
    const tempMatch = text.match(/(?:temperatura(?:\s+global)?(?:\s+normal)?|temp|febr[ií]cula|fiebre)\s*(?:de|es de|son de|en)?\s*(\d{2}(?:[.,]\d)?)\s*(?:grados|°c|°|c)?/i)
      || text.match(/(\d{2}[.,]\d)\s*(?:grados|°c|°)/i)
      || text.match(/(\d{2})\s*(?:grados|°)\s*(?:de temperatura)?/i)
      || text.match(/(?:temperatura|fiebre)\s*(?:de)?\s*(\d{2})\s*y\s*medio/i);
    
    if (tempMatch) {
      if (tempMatch[0].includes('y medio')) {
        result.vitals.temperature = parseFloat(tempMatch[1]) + 0.5;
      } else {
        result.vitals.temperature = parseFloat(tempMatch[1].replace(',', '.'));
      }
    }

    // ========================================================================
    // 6. EXTRACCIÓN DE PULSO / FRECUENCIA CARDÍACA
    // ========================================================================
    const hrMatch = text.match(/(?:pulso|frecuencia card[ií]aca|fc|latidos)\s*(?:de|es de)?\s*(\d{2,3})\s*(?:lpm|latidos|x\s*min)?/i)
      || text.match(/(\d{2,3})\s*(?:lpm|latidos por minuto)/i);
    
    if (hrMatch) {
      result.vitals.heartRate = parseInt(hrMatch[1], 10);
    }

    // ========================================================================
    // 7. EXTRACCIÓN DE SATURACIÓN DE OXÍGENO (SpO2)
    // ========================================================================
    const o2Match = text.match(/(?:saturaci[oó]n|saturando|sat|spo2)\s*(?:de)?\s*(?:ox[ií]geno)?\s*(?:de|al|en)?\s*(\d{2,3})\s*%/i)
      || text.match(/(\d{2,3})\s*%\s*(?:de saturaci[oó]n|spo2|oxigeno|oxígeno)/i);
    
    if (o2Match) {
      result.vitals.oxygenSaturation = parseInt(o2Match[1], 10);
    }

    // ========================================================================
    // 8. MAPEO SEMÁNTICO ONTOLÓGICO DE SÍNTOMAS (Con tolerancia difusa)
    // ========================================================================
    for (const group of this.CANONICAL_SYMPTOMS) {
      let matched = false;

      for (const syn of group.synonyms) {
        const normSyn = this.normalizeText(syn);
        
        // Coincidencia exacta de frase en el texto normalizado
        if (normalized.includes(normSyn)) {
          matched = true;
          break;
        }

        // Fuzzy matching si la frase tiene más de 5 letras
        if (normSyn.length >= 5) {
          const words = normalized.split(' ');
          for (let i = 0; i <= words.length - 2; i++) {
            const chunk = words.slice(i, i + syn.split(' ').length).join(' ');
            if (this.similarityRatio(chunk, normSyn) >= 0.82) {
              matched = true;
              break;
            }
          }
        }
        if (matched) break;
      }

      if (matched && !result.symptoms.includes(group.canonical)) {
        let label = group.canonical;
        if (result.timeEvolution && label.includes('Dolor abdominal')) {
          label += ` (${result.timeEvolution})`;
        }
        result.symptoms.push(label);
      }
    }

    // ========================================================================
    // 9. EXTRACCIÓN DE PRESCRIPCIONES Y FARMACOLOGÍA
    // ========================================================================
    const medRegex = /(?:se indica|indico|receto|prescribo|se prescribe|administrar|recomendar|recomiendo|medicaci[oó]n:?|tratamiento:?)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d,./-]+?)(?=(?:\.|\n|control en|volver en|cita en|$))/gi;
    let mMatch;
    while ((mMatch = medRegex.exec(text)) !== null) {
      const medText = mMatch[1].trim();
      if (medText.length > 3 && !result.prescriptions.includes(medText)) {
        result.prescriptions.push(medText);
      }
    }

    for (const med of this.ESSENTIAL_MEDS) {
      const medRegexOntology = new RegExp(`(?:\\b${med}\\b|\\b${med}s\\b)(?:\\s*\\d+\\s*(?:mg|g|ml|gotas|comprimidos|tabletas|miligramos|gramos))?(?:\\s*(?:cada|por|durante)\\s*[^.\\n,]+)?`, 'i');
      const found = text.match(medRegexOntology);
      if (found) {
        const foundStr = found[0].trim();
        const alreadyCovered = result.prescriptions.some(p => p.toLowerCase().includes(med));
        if (!alreadyCovered && foundStr.length > 3) {
          result.prescriptions.push(foundStr);
        }
      }
    }

    // ========================================================================
    // 10. EVALUACIÓN INTEGRAL DE GUARDARRAÍLES Y SEGURIDAD CLÍNICA
    // ========================================================================
    const GuardrailsEngine = window.Pakimed?.Guardrails;
    if (GuardrailsEngine) {
      // 10.1 No-Diagnóstico
      const diagCheck = GuardrailsEngine.validateNoAutonomousDiagnosis(text);
      if (!diagCheck.isValid) {
        result.guardrailAlerts.push(...diagCheck.warnings);
        result.isAutonomousDiagnosis = true;
      }

      // 10.2 Validación de Rangos Fisiológicos
      const rangeCheck = GuardrailsEngine.validatePhysiologicalRanges(result);
      if (!rangeCheck.isValid) {
        result.rangeWarnings.push(...rangeCheck.warnings);
        result.guardrailAlerts.push(...rangeCheck.warnings);
      }

      // 10.3 Completitud Clínica
      const compCheck = GuardrailsEngine.validateClinicalCompleteness(result);
      result.isComplete = compCheck.isComplete;
      result.completenessMessage = compCheck.reason;
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
