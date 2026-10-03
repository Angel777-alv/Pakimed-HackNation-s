/**
 * Pakimed Safety Guardrails Engine (IEEE 7000-2021 Ethical AI Compliance)
 * 
 * Implementa las reglas innegociables de seguridad clínica:
 * 1. Cero Diagnóstico Autónomo: Bloqueo de frases diagnósticas o tratamientos no dictados.
 * 2. Human-in-the-Loop: Supervisión médica obligatoria antes de persistir o transmitir.
 * 3. Confianza y Validación: Alertar términos con baja certeza (<75%).
 */

export const Guardrails = {
  // Frases diagnósticas no autorizadas generadas autónomamente por IA
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
        warnings.push(`Inferencia no autorizada detectada: "${keyword}". Requiere revisión y validación del médico.`);
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
  }
};
