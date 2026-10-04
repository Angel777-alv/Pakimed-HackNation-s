/**
 * Pakimed Safety Guardrails Engine (IEEE 7000-2021 Ethical AI & Clinical Range Validation)
 * 
 * Implementa 3 pilares de seguridad médica:
 * 1. Cero Diagnóstico Autónomo (IEEE 7000): Bloqueo de diagnósticos inferidos.
 * 2. Rangos Fisiológicos Plausibles: Detección y alerta de valores biológicamente anómalos o imposibles.
 * 3. Validación de Completitud Clínica: Protección contra expedientes vacíos hacia DHIS2.
 */

const Guardrails = {
  // Frases de inferencia autónoma no dictadas
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

  // Límites fisiológicos humanos de seguridad clínica
  PHYSIOLOGICAL_RANGES: {
    BP_SYS: { min: 50, max: 250, unit: 'mmHg', label: 'Presión Sistólica' },
    BP_DIA: { min: 30, max: 140, unit: 'mmHg', label: 'Presión Diastólica' },
    TEMPERATURE: { min: 32.0, max: 43.0, unit: '°C', label: 'Temperatura' },
    HEART_RATE: { min: 30, max: 230, unit: 'lpm', label: 'Frecuencia Cardíaca' },
    SPO2: { min: 50, max: 100, unit: '%', label: 'Saturación de Oxígeno' },
    AGE_YEARS: { min: 0, max: 120, unit: 'años', label: 'Edad' }
  },

  /**
   * Valida que no existan inferencias diagnósticas autónomas
   * @param {string} text
   * @returns {{isValid: boolean, warnings: string[]}}
   */
  validateNoAutonomousDiagnosis(text) {
    const lower = (text || '').toLowerCase();
    const warnings = [];

    for (const keyword of this.DIAGNOSTIC_KEYWORDS) {
      if (lower.includes(keyword)) {
        warnings.push(`Inferencia no autorizada detectada: "${keyword}". Requiere revisión facultativa.`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  },

  /**
   * Valida que las constantes vitales pertenezcan a rangos humanos plausibles
   * @param {Object} data - Objeto de datos clínicos extraídos
   * @returns {{isValid: boolean, warnings: string[], outOfRangeFields: string[]}}
   */
  validatePhysiologicalRanges(data = {}) {
    const warnings = [];
    const outOfRangeFields = [];
    const vitals = data.vitals || {};
    const patient = data.patient || {};

    // 1. Presión Arterial
    if (vitals.bloodPressure) {
      const parts = String(vitals.bloodPressure).split('/');
      const sys = parseInt(parts[0], 10);
      const dia = parts[1] ? parseInt(parts[1], 10) : null;

      if (!isNaN(sys)) {
        if (sys < this.PHYSIOLOGICAL_RANGES.BP_SYS.min || sys > this.PHYSIOLOGICAL_RANGES.BP_SYS.max) {
          warnings.push(`Presión sistólica (${sys} mmHg) fuera de rango fisiológico plausible (50 - 250 mmHg).`);
          outOfRangeFields.push('bloodPressure');
        }
      }
      if (dia !== null && !isNaN(dia)) {
        if (dia < this.PHYSIOLOGICAL_RANGES.BP_DIA.min || dia > this.PHYSIOLOGICAL_RANGES.BP_DIA.max) {
          warnings.push(`Presión diastólica (${dia} mmHg) fuera de rango fisiológico plausible (30 - 140 mmHg).`);
          if (!outOfRangeFields.includes('bloodPressure')) outOfRangeFields.push('bloodPressure');
        }
      }
    }

    // 2. Temperatura
    if (vitals.temperature !== null && vitals.temperature !== undefined) {
      const temp = parseFloat(vitals.temperature);
      if (!isNaN(temp)) {
        if (temp < this.PHYSIOLOGICAL_RANGES.TEMPERATURE.min || temp > this.PHYSIOLOGICAL_RANGES.TEMPERATURE.max) {
          warnings.push(`Temperatura (${temp} °C) inverosímil o fuera de rango biológico (32.0 - 43.0 °C).`);
          outOfRangeFields.push('temperature');
        }
      }
    }

    // 3. Frecuencia Cardíaca
    if (vitals.heartRate !== null && vitals.heartRate !== undefined) {
      const hr = parseInt(vitals.heartRate, 10);
      if (!isNaN(hr)) {
        if (hr < this.PHYSIOLOGICAL_RANGES.HEART_RATE.min || hr > this.PHYSIOLOGICAL_RANGES.HEART_RATE.max) {
          warnings.push(`Frecuencia cardíaca (${hr} lpm) fuera de rango humano plausible (30 - 230 lpm).`);
          outOfRangeFields.push('heartRate');
        }
      }
    }

    // 4. Saturación de Oxígeno (SpO2)
    if (vitals.oxygenSaturation !== null && vitals.oxygenSaturation !== undefined) {
      const o2 = parseInt(vitals.oxygenSaturation, 10);
      if (!isNaN(o2)) {
        if (o2 < this.PHYSIOLOGICAL_RANGES.SPO2.min || o2 > this.PHYSIOLOGICAL_RANGES.SPO2.max) {
          warnings.push(`Saturación de O₂ (${o2}%) fuera de rango válido (50 - 100%).`);
          outOfRangeFields.push('oxygenSaturation');
        }
      }
    }

    // 5. Edad
    if (patient.age !== null && patient.age !== undefined && patient.ageUnit !== 'meses') {
      const age = parseInt(patient.age, 10);
      if (!isNaN(age)) {
        if (age < this.PHYSIOLOGICAL_RANGES.AGE_YEARS.min || age > this.PHYSIOLOGICAL_RANGES.AGE_YEARS.max) {
          warnings.push(`Edad dictada (${age} años) fuera de rango plausible.`);
          outOfRangeFields.push('age');
        }
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      outOfRangeFields
    };
  },

  /**
   * Valida completitud clínica mínima
   * @param {Object} data
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

// Exportación Universal
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.Guardrails = Guardrails;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Guardrails };
}
