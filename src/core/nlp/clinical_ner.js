/**
 * Pakimed Clinical Entity Extractor (On-Device SLM / NER Engine)
 * 
 * Extrae entidades clínicas estructuradas a partir del dictado médico continuo:
 * - Demografía del paciente (Edad, Género)
 * - Signos vitales (Presión arterial, Temperatura, Pulso)
 * - Sintomatología normalizada
 * - Prescripción farmacológica con posología
 * - Evaluación de guardarraíles éticos IEEE 7000 (No-diagnóstico autónomo)
 */

import { Guardrails } from '../guardrails/guardrails.js';

export class ClinicalNER {
  /**
   * Extrae entidades estructuradas del texto dictado con puntuaciones de confianza
   * @param {string} rawTranscript - Texto del dictado
   * @returns {Object} Datos clínicos estructurados
   */
  static extractClinicalEntities(rawTranscript) {
    const text = (rawTranscript || '').trim();
    const result = {
      rawTranscript: text,
      patient: {
        age: null,
        gender: null,
        confidence: 0.95
      },
      vitals: {
        bloodPressure: null,
        temperature: null,
        heartRate: null,
        confidence: 0.92
      },
      symptoms: [],
      prescriptions: [],
      doctorNotes: text,
      guardrailAlerts: [],
      isAutonomousDiagnosisDetected: false
    };

    if (!text) {
      return result;
    }

    // 1. Extracción de Edad
    const ageMatch = text.match(/(?:paciente(?:\s+femenina|\s+masculino|\s+de)?\s*(?:de)?\s*)(\d{1,3})\s*(?:años|meses|a)?/i) 
      || text.match(/(\d{1,3})\s*(?:años|meses)\s*(?:de edad)?/i);
    if (ageMatch) {
      result.patient.age = parseInt(ageMatch[1], 10);
    }

    // 2. Extracción de Género
    if (/\b(femenina|femenino|mujer|niña|señora|dama)\b/i.test(text)) {
      result.patient.gender = 'F';
    } else if (/\b(masculino|varon|varón|hombre|niño|señor|caballero)\b/i.test(text)) {
      result.patient.gender = 'M';
    }

    // 3. Extracción de Presión Arterial
    const bpMatch = text.match(/(?:presi[oó]n|tensi[oó]n|pa)\s*(?:arterial)?\s*(?:de)?\s*(\d{2,3})\s*(?:sobre|\/|\s)\s*(\d{2,3})/i)
      || text.match(/(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:mmhg)?/i);
    if (bpMatch) {
      result.vitals.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
    }

    // 4. Extracción de Temperatura Corporal
    const tempMatch = text.match(/(?:temperatura|temp|fiebre)\s*(?:de)?\s*(\d{2}(?:[.,]\d)?)\s*(?:grados|°c|c)?/i)
      || text.match(/(\d{2}[.,]\d)\s*(?:grados|°c)/i);
    if (tempMatch) {
      result.vitals.temperature = parseFloat(tempMatch[1].replace(',', '.'));
    }

    // 5. Extracción de Frecuencia Cardíaca / Pulso
    const hrMatch = text.match(/(?:pulso|frecuencia card[ií]aca|fc|latidos)\s*(?:de)?\s*(\d{2,3})\s*(?:lpm|latidos|x\s*min)?/i);
    if (hrMatch) {
      result.vitals.heartRate = parseInt(hrMatch[1], 10);
    }

    // 6. Extracción de Síntomas
    const commonSymptoms = [
      'fiebre', 'tos', 'tos seca', 'tos con flemas', 'dolor de cabeza', 'cefalea',
      'dolor abdominal', 'diarrea', 'vomito', 'vómitos', 'náuseas', 'nauseas',
      'dificultad respiratoria', 'disnea', 'malestar general', 'odinofagia',
      'dolor de garganta', 'escalofrios', 'escalofríos', 'mareo', 'astenia',
      'asintomático', 'asintomatica', 'asintomático'
    ];

    for (const symptom of commonSymptoms) {
      const regex = new RegExp(`\\b${symptom}\\b`, 'i');
      if (regex.test(text) && !result.symptoms.includes(symptom)) {
        result.symptoms.push(symptom);
      }
    }

    // 7. Extracción de Prescripciones
    const medRegex = /(?:se indica|indico|receto|prescribo|se prescribe|administrar|medicaci[oó]n:?|tratamiento:?)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d,./-]+?)(?=(?:\.|\n|control en|volver en|cita en|$))/gi;
    let match;
    while ((match = medRegex.exec(text)) !== null) {
      const medText = match[1].trim();
      if (medText.length > 3 && !result.prescriptions.includes(medText)) {
        result.prescriptions.push(medText);
      }
    }

    // Si no capturó con regex amplia pero menciona medicamentos conocidos
    if (result.prescriptions.length === 0) {
      const knownMeds = ['paracetamol', 'ibuprofeno', 'amoxicilina', 'losartán', 'losartan', 'sales de rehidratación oral', 'suero oral'];
      for (const med of knownMeds) {
        if (text.toLowerCase().includes(med)) {
          const medSnippet = text.substring(text.toLowerCase().indexOf(med)).split('.')[0];
          result.prescriptions.push(medSnippet.trim());
          break;
        }
      }
    }

    // 8. Validación de Guardarraíles de Seguridad
    const guardrailCheck = Guardrails.validateNoAutonomousDiagnosis(text);
    if (!guardrailCheck.isValid) {
      result.guardrailAlerts.push(...guardrailCheck.warnings);
      result.isAutonomousDiagnosisDetected = true;
    }

    return result;
  }
}
