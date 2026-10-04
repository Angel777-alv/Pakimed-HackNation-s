/**
 * Pakimed DHIS2 Standard Adapter
 * 
 * Convierte el registro clínico estructurado y validado por el médico
 * en el formato oficial de intercambio JSON de la API de Eventos/Tracker de DHIS2.
 */

const DHIS2Adapter = {
  DEFAULT_PROGRAM: 'SALUD_PRIMARIA_RURAL_01',
  DEFAULT_ORG_UNIT: 'CLINICA_COMUNITARIA_04',

  DATA_ELEMENTS: {
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
   * Formatea un registro clínico en payload compatible con DHIS2
   * @param {Object} record - Datos del paciente aprobados
   * @returns {Object} JSON DHIS2 Event
   */
  format(record) {
    const dataValues = [];

    if (record.patient) {
      if (record.patient.age !== null && record.patient.age !== undefined) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.PATIENT_AGE,
          value: String(record.patient.age)
        });
      }
      if (record.patient.gender) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.PATIENT_GENDER,
          value: record.patient.gender
        });
      }
    }

    if (record.vitals) {
      if (record.vitals.bloodPressure) {
        const parts = String(record.vitals.bloodPressure).split('/');
        if (parts.length === 2) {
          dataValues.push({ dataElement: this.DATA_ELEMENTS.BP_SYS, value: parts[0].trim() });
          dataValues.push({ dataElement: this.DATA_ELEMENTS.BP_DIA, value: parts[1].trim() });
        }
      }
      if (record.vitals.temperature) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.TEMPERATURE,
          value: String(record.vitals.temperature)
        });
      }
      if (record.vitals.heartRate) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.HEART_RATE,
          value: String(record.vitals.heartRate)
        });
      }
      if (record.vitals.oxygenSaturation) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.SPO2,
          value: String(record.vitals.oxygenSaturation) + '%'
        });
      }
    }

    if (Array.isArray(record.symptoms) && record.symptoms.length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.SYMPTOMS,
        value: record.symptoms.join(', ')
      });
    }

    if (Array.isArray(record.prescriptions) && record.prescriptions.length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.PRESCRIPTIONS,
        value: record.prescriptions.join('; ')
      });
    }

    if (record.doctorNotes) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.DOCTOR_NOTES,
        value: record.doctorNotes
      });
    }

    return {
      program: this.DEFAULT_PROGRAM,
      orgUnit: this.DEFAULT_ORG_UNIT,
      eventDate: record.approvedAt || new Date().toISOString(),
      status: 'COMPLETED_APPROVED_BY_DOCTOR',
      compliance: 'PROTOCOLO_TRANSCRIPCION_FIEL_VERIFICADO',
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
