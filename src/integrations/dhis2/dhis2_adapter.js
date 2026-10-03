/**
 * Pakimed DHIS2 Standard Adapter
 * Convierte el registro clínico validado y aprobado por el médico
 * en la estructura JSON oficial para la API de Eventos/Tracker de DHIS2.
 */

export class DHIS2Adapter {
  static DEFAULT_PROGRAM_ID = 'PAKIMED_PRIMARY_HEALTH_PRG';
  static DEFAULT_ORG_UNIT = 'RURAL_CLINIC_OU_001';

  // Mapeo de identificadores estándar DHIS2 DataElement
  static DATA_ELEMENTS = {
    PATIENT_AGE: 'DE_PATIENT_AGE_YRS',
    PATIENT_GENDER: 'DE_PATIENT_GENDER',
    SYMPTOMS: 'DE_CLINICAL_SYMPTOMS',
    BP_SYSTOLIC: 'DE_VITAL_BP_SYS',
    BP_DIASTOLIC: 'DE_VITAL_BP_DIA',
    TEMPERATURE: 'DE_VITAL_TEMP_CELSIUS',
    HEART_RATE: 'DE_VITAL_HEART_RATE',
    PRESCRIPTIONS: 'DE_PRESCRIBED_MEDICATIONS',
    DOCTOR_NOTES: 'DE_CLINICAL_NOTES_APPROVED'
  };

  /**
   * Transforma una consulta clínica aprobada en payload DHIS2
   * @param {Object} clinicalRecord
   * @param {Object} options
   * @returns {Object} Payload listo para POST /api/events o almacenamiento Store-and-Forward
   */
  static formatToDHIS2Event(clinicalRecord, options = {}) {
    const dataValues = [];

    if (clinicalRecord.patient) {
      if (clinicalRecord.patient.age !== null && clinicalRecord.patient.age !== undefined) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.PATIENT_AGE,
          value: String(clinicalRecord.patient.age)
        });
      }
      if (clinicalRecord.patient.gender) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.PATIENT_GENDER,
          value: String(clinicalRecord.patient.gender)
        });
      }
    }

    if (clinicalRecord.vitals) {
      if (clinicalRecord.vitals.bloodPressure) {
        const parts = String(clinicalRecord.vitals.bloodPressure).split('/');
        if (parts.length === 2) {
          dataValues.push({ dataElement: this.DATA_ELEMENTS.BP_SYSTOLIC, value: parts[0].trim() });
          dataValues.push({ dataElement: this.DATA_ELEMENTS.BP_DIASTOLIC, value: parts[1].trim() });
        }
      }
      if (clinicalRecord.vitals.temperature) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.TEMPERATURE,
          value: String(clinicalRecord.vitals.temperature)
        });
      }
      if (clinicalRecord.vitals.heartRate) {
        dataValues.push({
          dataElement: this.DATA_ELEMENTS.HEART_RATE,
          value: String(clinicalRecord.vitals.heartRate)
        });
      }
    }

    if (clinicalRecord.symptoms && clinicalRecord.symptoms.length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.SYMPTOMS,
        value: clinicalRecord.symptoms.join(', ')
      });
    }

    if (clinicalRecord.prescriptions && clinicalRecord.prescriptions.length > 0) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.PRESCRIPTIONS,
        value: clinicalRecord.prescriptions.join('; ')
      });
    }

    if (clinicalRecord.doctorNotes) {
      dataValues.push({
        dataElement: this.DATA_ELEMENTS.DOCTOR_NOTES,
        value: String(clinicalRecord.doctorNotes)
      });
    }

    return {
      program: options.programId || this.DEFAULT_PROGRAM_ID,
      orgUnit: options.orgUnitId || this.DEFAULT_ORG_UNIT,
      eventDate: clinicalRecord.approvedAt || new Date().toISOString(),
      status: 'COMPLETED',
      dataValues
    };
  }

  /**
   * Simula el envío HTTP al servidor DHIS2
   * @param {Object} dhis2Payload
   * @returns {Promise<{success: boolean, eventId: string, timestamp: string}>}
   */
  static async sendEvent(dhis2Payload) {
    // Simulación de latencia de red (Edge to DHIS2)
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      eventId: 'DHIS2_EVT_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      importedCount: dhis2Payload.dataValues.length
    };
  }
}
