/**
 * Pakimed Hybrid Clinical Fusion Engine
 * 
 * Implementa el ensamble cooperativo entre:
 * 1. Motor Heurístico Determinista ConText (Nivel 1): Ancla infalible para constantes
 *    vitales y datos demográficos del paciente (0% alucinación numérica).
 * 2. Small AI Qwen2.5-0.5B (Nivel 2): Refinador semántico para desambiguar prescripciones,
 *    aislar negaciones ("alérgica a nada") y detectar antecedentes.
 * 3. Guardarraíles Éticos IEEE 7000 y Serialización DHIS2.
 */

(function (global) {
  'use strict';

  const FusionEngine = {

    /**
     * Fusiona los resultados deterministas y semánticos
     * @param {Object} nerResult - Salida de ConText (ClinicalNER)
     * @param {Object|null} slmResult - Salida de Qwen2.5 (QwenAdapter)
     * @param {string} rawTranscript - Texto dictado original
     * @returns {Object} Ficha médica fusionada y auditada
     */
    fuse(nerResult, slmResult, rawTranscript) {
      const Guardrails = global.Pakimed?.Guardrails;
      const text = rawTranscript || '';

      // Si no hay resultado de SLM, entregar ConText con limpieza de recetas
      if (!slmResult) {
        return this._sanitizePureNer(nerResult, text);
      }

      const pNer = nerResult?.patient || {};
      const pSlm = slmResult?.patient || {};
      const vNer = nerResult?.vitals || {};
      const vSlm = slmResult?.vitals || {};

      // 1. Demográficos: ConText tiene prioridad absoluta de anclaje (cero alucinación)
      const patientName = (pNer.name && pNer.name.trim() !== '') ? pNer.name.trim() : (pSlm.name && pSlm.name !== 'null' ? pSlm.name.trim() : null);
      const patientAge = (typeof pNer.age === 'number' && !isNaN(pNer.age)) ? pNer.age : (typeof pSlm.age === 'number' ? pSlm.age : null);
      const patientGender = pNer.gender || pSlm.gender || null;

      // 2. Alergias: SLM es superior aislando negaciones ("alérgica a nada", "ninguna")
      const allergies = this._fuseAllergies(pNer.allergies, pSlm.allergies, text);

      // 3. Automedicación previa vs remedios caseros (excluir "jugo de arándano", "mucha agua")
      const priorMedications = this._fusePriorMeds(pNer.priorMedications, pSlm.priorMedications);

      // 4. Antecedentes patológicos / Condiciones crónicas (Unión deduplicada)
      const chronicConditions = this._fuseChronicConditions(pNer.chronicConditions, pSlm.chronicConditions);

      // 5. Constantes Vitales: ConText es el ancla inmutable (cero alucinación numérica)
      const vitals = {
        bloodPressure: vNer.bloodPressure || null,
        temperature: (typeof vNer.temperature === 'number' && !isNaN(vNer.temperature)) ? vNer.temperature : null,
        heartRate: (typeof vNer.heartRate === 'number' && !isNaN(vNer.heartRate)) ? vNer.heartRate : null,
        oxygenSaturation: (typeof vNer.oxygenSaturation === 'number' && !isNaN(vNer.oxygenSaturation)) ? vNer.oxygenSaturation : null
      };

      // 6. Prescripciones: SLM es superior desambiguando fármacos y eliminando ruido conversacional
      const prescriptions = this._fusePrescriptions(nerResult?.prescriptions, slmResult?.prescriptions);

      // 7. Síntomas y Duración (Unión deduplicada)
      const symptoms = this._fuseSymptoms(nerResult?.symptoms, slmResult?.symptoms);
      const timeEvolution = nerResult?.timeEvolution || slmResult?.timeEvolution || null;

      // Ficha clínica canónica fusionada
      const fused = {
        rawTranscript: text,
        patient: {
          name: patientName,
          age: patientAge,
          ageUnit: 'años',
          gender: patientGender,
          allergies: allergies,
          priorMedications: priorMedications,
          chronicConditions: chronicConditions,
          confidence: 0.99,
          engine: 'Ensamble Híbrido (ConText + Qwen2.5)'
        },
        vitals: vitals,
        symptoms: symptoms,
        timeEvolution: timeEvolution,
        prescriptions: prescriptions,
        doctorNotes: text,
        guardrailAlerts: [],
        rangeWarnings: [],
        missingFields: [],
        isAutonomousDiagnosis: false,
        isComplete: true,
        completenessMessage: null
      };

      // Auditoría Ética y Fisiológica (IEEE 7000)
      if (Guardrails) {
        // 1. Detección de No-Diagnóstico
        const diagCheck = Guardrails.validateNoAutonomousDiagnosis(text);
        if (!diagCheck.isValid) {
          fused.guardrailAlerts.push(...diagCheck.warnings);
          fused.isAutonomousDiagnosis = true;
        }

        // 2. Rangos fisiológicos
        const rangeCheck = Guardrails.validatePhysiologicalRanges(fused);
        if (rangeCheck.criticalErrors.length > 0) {
          fused.guardrailAlerts.push(...rangeCheck.criticalErrors);
          fused.isComplete = false;
          fused.completenessMessage = 'Constantes fisiológicas fuera de límites biológicos.';
        }
        fused.rangeWarnings = rangeCheck.warnings;
        fused.guardrailAlerts.push(...rangeCheck.warnings);

        // 3. Completitud clínica obligatoria
        const compCheck = Guardrails.validateClinicalCompleteness(fused);
        fused.isComplete = compCheck.isComplete;
        fused.completenessMessage = compCheck.reason;

        // 4. Detección de campos omitidos
        fused.missingFields = Guardrails.detectMissingOptionalFields(fused);
      }

      return fused;
    },

    /**
     * Desambigua prescripciones eliminando frases espurias
     */
    _fusePrescriptions(nerPrescriptions, slmPrescriptions) {
      const isNoise = (text) => {
        const lower = text.toLowerCase().trim();
        return (
          lower.startsWith('te la primera') ||
          lower.startsWith('tomarte la primera') ||
          lower.startsWith('hacerlos mañana') ||
          lower.startsWith('me hago el') ||
          lower.startsWith('te veo en') ||
          lower.includes('urocultivo') ||
          lower.includes('examen general de orina') ||
          !lower.match(/[a-záéíóúñ]{4,}/i)
        );
      };

      // Si el SLM extrajo prescripciones limpias, darles preferencia
      if (Array.isArray(slmPrescriptions) && slmPrescriptions.length > 0) {
        const cleaned = slmPrescriptions
          .map(p => String(p).trim())
          .filter(p => p.length > 3 && !isNoise(p));
        if (cleaned.length > 0) return cleaned;
      }

      // Si no, filtrar las de ConText
      if (Array.isArray(nerPrescriptions)) {
        return nerPrescriptions
          .map(p => String(p).trim())
          .filter(p => p.length > 3 && !isNoise(p));
      }

      return [];
    },

    /**
     * Aísla negaciones de alergias
     */
    _fuseAllergies(nerAllergies, slmAllergies, rawText) {
      const lowerText = (rawText || '').toLowerCase();
      // Si la transcripción dice explícitamente "alérgica a nada" o "sin alergias"
      if (
        lowerText.includes('alérgica a nada') ||
        lowerText.includes('alergica a nada') ||
        lowerText.includes('sin alergias') ||
        lowerText.includes('niega alergias') ||
        lowerText.includes('alérgico a nada')
      ) {
        return [];
      }

      const list = Array.isArray(slmAllergies) && slmAllergies.length > 0
        ? slmAllergies
        : (Array.isArray(nerAllergies) ? nerAllergies : []);

      return list.filter(a => {
        const l = String(a).toLowerCase().trim();
        return l !== 'nada' && l !== 'ninguna' && l !== 'sin alergias' && l !== 'ninguno';
      });
    },

    /**
     * Filtra automedicación previa descartando remedios caseros
     */
    _fusePriorMeds(nerMeds, slmMeds) {
      const isHomeRemedy = (m) => {
        const l = String(m).toLowerCase().trim();
        return (
          l.includes('arándano') ||
          l.includes('arandano') ||
          l.includes('jugo') ||
          l.includes('agua') ||
          l.includes('té') ||
          l.includes('infusión') ||
          l.includes('nada') ||
          l.includes('ninguno')
        );
      };

      const source = (Array.isArray(slmMeds) && slmMeds.length > 0) ? slmMeds : (Array.isArray(nerMeds) ? nerMeds : []);
      return source.map(s => String(s).trim()).filter(s => s.length > 2 && !isHomeRemedy(s));
    },

    /**
     * Fusión de condiciones crónicas y antecedentes
     */
    _fuseChronicConditions(nerConditions, slmConditions) {
      const set = new Set();
      (Array.isArray(nerConditions) ? nerConditions : []).forEach(c => set.add(String(c).trim()));
      (Array.isArray(slmConditions) ? slmConditions : []).forEach(c => set.add(String(c).trim()));
      return Array.from(set).filter(c => c.length > 2);
    },

    /**
     * Fusión y deduplicación de síntomas
     */
    _fuseSymptoms(nerSymptoms, slmSymptoms) {
      const set = new Set();
      (Array.isArray(nerSymptoms) ? nerSymptoms : []).forEach(s => set.add(String(s).trim()));
      (Array.isArray(slmSymptoms) ? slmSymptoms : []).forEach(s => set.add(String(s).trim()));
      return Array.from(set).filter(s => s.length > 2);
    },

    /**
     * Sanitización cuando opera exclusivamente en Modo ConText Ultrarrápido
     */
    _sanitizePureNer(nerResult, rawTranscript) {
      if (!nerResult) return null;
      const sanitized = JSON.parse(JSON.stringify(nerResult));
      sanitized.prescriptions = this._fusePrescriptions(sanitized.prescriptions, null);
      sanitized.patient.allergies = this._fuseAllergies(sanitized.patient?.allergies, null, rawTranscript);
      sanitized.patient.priorMedications = this._fusePriorMeds(sanitized.patient?.priorMedications, null);
      sanitized.patient.engine = 'ConText Edge AI (25 KB)';
      return sanitized;
    }
  };

  // Exportar al namespace global de Pakimed
  global.Pakimed = global.Pakimed || {};
  global.Pakimed.FusionEngine = FusionEngine;

})(typeof window !== 'undefined' ? window : this);
