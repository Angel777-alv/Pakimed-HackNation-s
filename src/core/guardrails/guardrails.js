/**
 * Pakimed Safety Guardrails Engine (IEEE 7000-2021 Ethical AI & Clinical Range Validation)
 * 
 * Implementa 3 pilares de seguridad médica:
 * 1. Cero Diagnóstico Autónomo (IEEE 7000): Bloqueo de diagnósticos inferidos.
 * 2. Rangos Fisiológicos y Observaciones Cuantitativas: 
 *    - Límites biológicos extremos (Bloqueo de datos imposibles).
 *    - Observaciones numéricas objetivas fuera de rangos de referencia (Sin emitir diagnósticos).
 * 3. Validación de Identificación y Completitud Clínica: Protección de DHIS2 Tracker API.
 */

const Guardrails = {
  // Frases de inferencia diagnóstica no dictadas por el facultativo
  DIAGNOSTIC_KEYWORDS: [
    'el paciente padece de',
    'diagnostico probable',
    'diagnóstico probable',
    'se diagnostica con',
    'sugiero recetar',
    'tratamiento recomendado por la ia',
    'pronostico desfavorable',
    'pronóstico desfavorable',
    'posible cuadro clinico no dictado',
    'crisis hipertensiva',
    'diagnostico de infeccion',
    'diagnóstico de infección',
    'taquicardia patologica'
  ],

  // Límites fisiológicos humanos biológicos extremos (Valores fuera de esto son imposibles / errores de captura)
  PHYSIOLOGICAL_RANGES: {
    BP_SYS: { min: 50, max: 250, unit: 'mmHg', label: 'Presión Sistólica' },
    BP_DIA: { min: 30, max: 140, unit: 'mmHg', label: 'Presión Diastólica' },
    TEMPERATURE: { min: 32.0, max: 43.0, unit: '°C', label: 'Temperatura' },
    HEART_RATE: { min: 30, max: 230, unit: 'lpm', label: 'Frecuencia Cardíaca' },
    SPO2: { min: 50, max: 100, unit: '%', label: 'Saturación de Oxígeno' },
    AGE_YEARS: { min: 0, max: 120, unit: 'años', label: 'Edad' }
  },

  // Rangos de referencia clínica habitual (Para observaciones descriptivas cuantitativas - Cero Diagnóstico)
  STANDARD_REFERENCE: {
    BP_SYS: { min: 90, max: 130, unit: 'mmHg', label: 'Presión Sistólica' },
    BP_DIA: { min: 60, max: 85, unit: 'mmHg', label: 'Presión Diastólica' },
    TEMPERATURE: { min: 35.8, max: 37.5, unit: '°C', label: 'Temperatura' },
    HEART_RATE: { min: 60, max: 100, unit: 'lpm', label: 'Frecuencia Cardíaca' },
    SPO2: { min: 94, max: 100, unit: '%', label: 'Saturación de Oxígeno' }
  },

  /**
   * Valida que no existan inferencias diagnósticas autónomas (IEEE 7000)
   * @param {string} text
   * @returns {{isValid: boolean, warnings: string[]}}
   */
  validateNoAutonomousDiagnosis(text) {
    const lower = (text || '').toLowerCase();
    const warnings = [];

    for (const keyword of this.DIAGNOSTIC_KEYWORDS) {
      if (lower.includes(keyword)) {
        warnings.push(`Inferencia no autorizada detectada: "${keyword}". Requiere transcripción médica literal.`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  },

  /**
   * Audita constantes vitales:
   * - Errores críticos de rango biológico (imposibles) -> isValid: false (Bloqueo)
   * - Observaciones cuantitativas fuera de rango de referencia estándar (Cero diagnóstico) -> observations[]
   * @param {Object} data - Objeto clínico
   * @returns {{isValid: boolean, criticalErrors: string[], observations: string[], outOfRangeFields: string[]}}
   */
  validatePhysiologicalRanges(data = {}) {
    const criticalErrors = [];
    const observations = [];
    const outOfRangeFields = [];
    const vitals = data.vitals || {};
    const patient = data.patient || {};

    // 1. Presión Arterial
    if (vitals.bloodPressure) {
      const parts = String(vitals.bloodPressure).split('/');
      const sys = parseInt(parts[0], 10);
      const dia = parts[1] && parts[1] !== '--' ? parseInt(parts[1], 10) : null;

      if (!isNaN(sys)) {
        // Límite extremo (Bloqueo)
        if (sys < this.PHYSIOLOGICAL_RANGES.BP_SYS.min || sys > this.PHYSIOLOGICAL_RANGES.BP_SYS.max) {
          criticalErrors.push(`Presión sistólica (${sys} mmHg) fuera de rango biológico posible (50 - 250 mmHg).`);
          outOfRangeFields.push('bloodPressure');
        } else if (sys > this.STANDARD_REFERENCE.BP_SYS.max || sys < this.STANDARD_REFERENCE.BP_SYS.min) {
          // Observación cuantitativa objetiva (Cero diagnóstico)
          observations.push(`Presión sistólica registrada en ${sys} mmHg (rango de referencia estándar: 90–130 mmHg).`);
        }
      }

      if (dia !== null && !isNaN(dia)) {
        if (dia < this.PHYSIOLOGICAL_RANGES.BP_DIA.min || dia > this.PHYSIOLOGICAL_RANGES.BP_DIA.max) {
          criticalErrors.push(`Presión diastólica (${dia} mmHg) fuera de rango biológico posible (30 - 140 mmHg).`);
          if (!outOfRangeFields.includes('bloodPressure')) outOfRangeFields.push('bloodPressure');
        } else if (dia > this.STANDARD_REFERENCE.BP_DIA.max || dia < this.STANDARD_REFERENCE.BP_DIA.min) {
          observations.push(`Presión diastólica registrada en ${dia} mmHg (rango de referencia estándar: 60–85 mmHg).`);
        }
      }
    }

    // 2. Temperatura
    if (vitals.temperature !== null && vitals.temperature !== undefined) {
      const temp = parseFloat(vitals.temperature);
      if (!isNaN(temp)) {
        if (temp < this.PHYSIOLOGICAL_RANGES.TEMPERATURE.min || temp > this.PHYSIOLOGICAL_RANGES.TEMPERATURE.max) {
          criticalErrors.push(`Temperatura (${temp} °C) inverosímil o fuera de rango biológico (32.0 - 43.0 °C).`);
          outOfRangeFields.push('temperature');
        } else if (temp > this.STANDARD_REFERENCE.TEMPERATURE.max || temp < this.STANDARD_REFERENCE.TEMPERATURE.min) {
          observations.push(`Temperatura registrada en ${temp} °C (rango de referencia estándar: 36.0–37.5 °C).`);
        }
      }
    }

    // 3. Frecuencia Cardíaca (Pulso)
    if (vitals.heartRate !== null && vitals.heartRate !== undefined) {
      const hr = parseInt(vitals.heartRate, 10);
      if (!isNaN(hr)) {
        if (hr < this.PHYSIOLOGICAL_RANGES.HEART_RATE.min || hr > this.PHYSIOLOGICAL_RANGES.HEART_RATE.max) {
          criticalErrors.push(`Frecuencia cardíaca (${hr} lpm) fuera de rango biológico posible (30 - 230 lpm).`);
          outOfRangeFields.push('heartRate');
        } else if (hr > this.STANDARD_REFERENCE.HEART_RATE.max || hr < this.STANDARD_REFERENCE.HEART_RATE.min) {
          observations.push(`Frecuencia cardíaca registrada en ${hr} lpm (rango de referencia estándar: 60–100 lpm).`);
        }
      }
    }

    // 4. Saturación de Oxígeno (SpO2)
    if (vitals.oxygenSaturation !== null && vitals.oxygenSaturation !== undefined) {
      const o2 = parseInt(vitals.oxygenSaturation, 10);
      if (!isNaN(o2)) {
        if (o2 < this.PHYSIOLOGICAL_RANGES.SPO2.min || o2 > this.PHYSIOLOGICAL_RANGES.SPO2.max) {
          criticalErrors.push(`Saturación de O₂ (${o2}%) fuera de rango biológico (50 - 100%).`);
          outOfRangeFields.push('oxygenSaturation');
        } else if (o2 < this.STANDARD_REFERENCE.SPO2.min) {
          observations.push(`Saturación de O₂ registrada en ${o2}% (rango de referencia estándar: ≥ 94%).`);
        }
      }
    }

    // 5. Edad
    if (patient.age !== null && patient.age !== undefined && patient.ageUnit !== 'meses') {
      const age = parseInt(patient.age, 10);
      if (!isNaN(age)) {
        if (age < this.PHYSIOLOGICAL_RANGES.AGE_YEARS.min || age > this.PHYSIOLOGICAL_RANGES.AGE_YEARS.max) {
          criticalErrors.push(`Edad dictada (${age} años) fuera de rango plausible.`);
          outOfRangeFields.push('age');
        }
      }
    }

    return {
      isValid: criticalErrors.length === 0,
      criticalErrors,
      observations,
      warnings: [...criticalErrors, ...observations],
      outOfRangeFields
    };
  },

  /**
   * Valida identificación obligatoria del paciente y completitud clínica mínima para DHIS2
   * @param {Object} data
   * @returns {{isComplete: boolean, reason: string|null, missingName: boolean, missingClinicalData: boolean}}
   */
  validateClinicalCompleteness(data = {}) {
    const patient = data.patient || {};
    const vitals = data.vitals || {};
    
    // 1. Identificación del Paciente (Obligatorio para DHIS2)
    const hasPatientName = Boolean(patient.name && String(patient.name).trim().length >= 2);

    // 2. Al menos una entidad clínica
    const hasVitals = Boolean(
      vitals.bloodPressure || 
      vitals.temperature || 
      vitals.heartRate || 
      vitals.oxygenSaturation
    );
    const hasSymptoms = Array.isArray(data.symptoms) && data.symptoms.length > 0;
    const hasPrescriptions = Array.isArray(data.prescriptions) && data.prescriptions.length > 0;
    const hasClinicalData = hasVitals || hasSymptoms || hasPrescriptions;

    let reason = null;
    if (!hasPatientName && !hasClinicalData) {
      reason = 'Se requiere el nombre del paciente y al menos un dato clínico (signos, síntomas o prescripciones) para consolidar el expediente.';
    } else if (!hasPatientName) {
      reason = 'Identificación requerida: Ingrese el nombre del paciente en "Ajustar Registro" para habilitar la firma del expediente.';
    } else if (!hasClinicalData) {
      reason = 'Registro clínico vacío: No se detectaron signos vitales, sintomatología ni prescripciones en el dictado.';
    }

    return {
      isComplete: hasPatientName && hasClinicalData,
      reason,
      missingName: !hasPatientName,
      missingClinicalData: !hasClinicalData
    };
  },

  /**
   * Detecta campos opcionales no medidos para informar al facultativo
   * @param {Object} data
   * @returns {string[]} Lista de campos ausentes
   */
  detectMissingOptionalFields(data = {}) {
    const missing = [];
    const vitals = data.vitals || {};
    const patient = data.patient || {};

    if (!patient.age) missing.push('Edad');
    if (!patient.gender) missing.push('Género');
    if (!vitals.bloodPressure) missing.push('Presión Arterial');
    else if (String(vitals.bloodPressure).includes('/--')) missing.push('Presión Diastólica');
    if (!vitals.temperature) missing.push('Temperatura');
    if (!vitals.heartRate) missing.push('Pulso (FC)');
    if (!vitals.oxygenSaturation) missing.push('Sat. O₂ (SpO2)');

    return missing;
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
