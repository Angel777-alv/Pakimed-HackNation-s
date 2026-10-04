/**
 * Pakimed DHIS2 Standard Adapter
 * 
 * Convierte el registro clínico estructurado y validado por el médico
 * en el formato oficial de intercambio JSON de la API de Eventos/Tracker de DHIS2.
 * 
 * Principio de Sanitización: Solo empaqueta datos medidos y válidos en dataValues
 * (omite campos nulos o no dictados para no corromper la base institucional).
 */

const DHIS2Adapter = {
  DEFAULT_PROGRAM: 'SALUD_PRIMARIA_RURAL_01',
  DEFAULT_ORG_UNIT: 'CLINICA_COMUNITARIA_04',

  DATA_ELEMENTS: {
    PATIENT_NAME: 'DE_NOMBRE_PACIENTE',
    PATIENT_AGE: 'DE_EDAD_ANOS',
    PATIENT_GENDER: 'DE_GENERO',
    BP_SYS: 'DE_PRESION_SISTOLICA',
    BP_DIA: 'DE_PRESION_DIASTOLICA',
    TEMPERATURE: 'DE_TEMP_CELSIUS',
    HEART_RATE: 'DE_PULSO_LPM',
    SPO2: 'DE_SATURACION_O2',
    SYMPTOMS: 'DE_SINTOMAS_REPORTADOS',
    PRESCRIPTIONS: 'DE_FARMACOS_INDICADOS',
    DOCTOR_NOTES: 'DE_NOTAS_RESPALDO'
  },

  /**
   * Formatea un registro clínico en payload compatible con DHIS2 Tracker / Event API
   * @param {Object} record - Datos del paciente aprobados
   * @returns {Object} JSON DHIS2 Event
   */
  format(record = {}) {
    const dataValues = [];
    const patient = record.patient || {};
    const vitals = record.vitals || {};

    // 1. Identificación y Demográficos del Paciente
    if (patient.name && String(patient.name).trim().length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.PATIENT_NAME,
        value: String(patient.name).trim()
      });
    }

    if (patient.age !== null && patient.age !== undefined && !isNaN(patient.age)) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.PATIENT_AGE,
        value: String(patient.age)
      });
    }

    if (patient.gender && (patient.gender === 'F' || patient.gender === 'M')) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.PATIENT_GENDER,
        value: patient.gender === 'F' ? 'FEMENINO' : 'MASCULINO'
      });
    }

    // 2. Constantes Vitales Sanitizadas (Solo empaqueta valores reales medidos)
    if (vitals.bloodPressure) {
      const parts = String(vitals.bloodPressure).split('/');
      const sys = parts[0] ? parts[0].trim() : null;
      const dia = parts[1] ? parts[1].trim() : null;

      if (sys && sys !== '--' && !isNaN(parseInt(sys, 10))) {
        dataValues.push({ dataElement: this.DATA_ELEMENTS.BP_SYS, value: sys });
      }
      if (dia && dia !== '--' && !isNaN(parseInt(dia, 10))) {
        dataValues.push({ dataElement: this.DATA_ELEMENTS.BP_DIA, value: dia });
      }
    }

    if (vitals.temperature !== null && vitals.temperature !== undefined && !isNaN(vitals.temperature)) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.TEMPERATURE,
        value: String(vitals.temperature)
      });
    }

    if (vitals.heartRate !== null && vitals.heartRate !== undefined && !isNaN(vitals.heartRate)) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.HEART_RATE,
        value: String(vitals.heartRate)
      });
    }

    if (vitals.oxygenSaturation !== null && vitals.oxygenSaturation !== undefined && !isNaN(vitals.oxygenSaturation)) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.SPO2,
        value: String(vitals.oxygenSaturation) + '%'
      });
    }

    // 3. Sintomatología
    if (Array.isArray(record.symptoms) && record.symptoms.length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.SYMPTOMS,
        value: record.symptoms.join(', ')
      });
    }

    // 4. Prescripciones
    if (Array.isArray(record.prescriptions) && record.prescriptions.length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.PRESCRIPTIONS,
        value: record.prescriptions.join('; ')
      });
    }

    // 5. Notas clínicas literales de respaldo
    if (record.doctorNotes && String(record.doctorNotes).trim().length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.DOCTOR_NOTES,
        value: record.doctorNotes.trim()
      });
    }

    return {
      program: this.DEFAULT_PROGRAM,
      orgUnit: this.DEFAULT_ORG_UNIT,
      eventDate: record.approvedAt || new Date().toISOString(),
      status: 'COMPLETED_APPROVED_BY_DOCTOR',
      compliance: 'PROTOCOLO_TRANSCRIPCION_FIEL_VERIFICADO',
      patientIdentifier: patient.name ? String(patient.name).trim() : 'ANONIMO',
      dataValues
    };
  }
};

// Exportación Universal
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.DHIS2 = DHIS2Adapter;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DHIS2Adapter };
}
