/**
 * Pakimed Safety Guardrails Engine (IEEE 7000-2021 Ethical AI Compliance)
 * 
 * Reglas de seguridad clínica:
 * 1. Cero Diagnóstico Autónomo: Bloqueo de frases diagnósticas no dictadas.
 * 2. Human-in-the-Loop: Supervisión médica obligatoria antes de persistir o transmitir.
 * 3. Confianza y Validación: Alertar términos con certeza < 75%.
 * 4. Completitud Clínica: Detección y bloqueo de registros sin datos médicos.
 */

const Guardrails = {
  DIAGNOSTIC_KEYWORDS: [
    'el paciente padece de',
    'diagnostico probable',
    'diagnóstico probable',
    'se diagnostica con',
    'sugiero recetar',
    'tratamiento recomendado por la ia',
    'pronostico desfavorable',
    'pronóstico desfavorable',
    'posible cuadro clinico no dictado'
  ],

  /**
   * Valida que el sistema no esté infiriendo diagnósticos autónomos
   * @param {string} text - Texto del dictado o inferencia
   * @returns {{isValid: boolean, warnings: string[]}}
   */
  validateNoAutonomousDiagnosis(text) {
    const lower = (text || '').toLowerCase();
    const warnings = [];

    for (const keyword of this.DIAGNOSTIC_KEYWORDS) {
      if (lower.includes(keyword)) {
        warnings.push(`Inferencia no autorizada detectada: "${keyword}". Requiere revisión y validación facultativa.`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  },

  /**
   * Evalúa la confianza de un campo clínico extraído
   * @param {Object} fieldEntry
   * @returns {{needsManualReview: boolean, confidence: number}}
   */
  evaluateConfidence(fieldEntry = {}) {
    const confidence = fieldEntry.confidence ?? 1.0;
    const threshold = 0.75;

    return {
      needsManualReview: confidence < threshold || !fieldEntry.value,
      confidence
    };
  },

  /**
   * Valida que la consulta contenga al menos un dato clínico estructurado
   * Evita polucionar la base de datos DHIS2 con consultas vacías o casuales.
   * @param {Object} data - Datos clínicos extraídos por NER
   * @returns {{isComplete: boolean, reason: string|null}}
   */
  validateClinicalCompleteness(data = {}) {
    const vitals = data.vitals || {};
    const hasVitals = Boolean(
      vitals.bloodPressure || 
      vitals.temperature || 
      vitals.heartRate || 
      vitals.oxygenSaturation
    );
    const hasSymptoms = Array.isArray(data.symptoms) && data.symptoms.length > 0;
    const hasPrescriptions = Array.isArray(data.prescriptions) && data.prescriptions.length > 0;

    const isComplete = hasVitals || hasSymptoms || hasPrescriptions;

    return {
      isComplete,
      reason: isComplete 
        ? null 
        : 'No se detectaron signos vitales, sintomatología ni prescripciones en el dictado. Registro clínico incompleto.'
    };
  }
};

// Exportación Universal (Navegador y Node.js)
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.Guardrails = Guardrails;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Guardrails };
}
