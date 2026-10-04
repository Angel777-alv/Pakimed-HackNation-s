/**
 * Pakimed - Modal HITL Form Controller (Human-In-The-Loop)
 * 
 * Responsabilidades:
 * 1. Control del ciclo de vida del modal de edición manual.
 * 2. Validación reactiva en vivo de nombre obligatorio y rangos fisiológicos.
 * 3. Bloqueo y señalización de valores anómalos o biológicamente imposibles.
 * 4. Extracción higiénica de datos para actualización del expediente clínico.
 */

class ModalController {
  constructor(options = {}) {
    this.modalEl = document.getElementById('editModal');
    this.btnClose = document.getElementById('btnCloseModal');
    this.btnCancel = document.getElementById('btnCancelEdit');
    this.btnSave = document.getElementById('btnSaveEdit');
    this.alertEl = document.getElementById('modalValidationAlert');

    // Campos del formulario
    this.fieldName = document.getElementById('fieldName');
    this.fieldAge = document.getElementById('fieldAge');
    this.fieldGender = document.getElementById('fieldGender');
    this.fieldBP = document.getElementById('fieldBP');
    this.fieldTemp = document.getElementById('fieldTemp');
    this.fieldHR = document.getElementById('fieldHR');
    this.fieldSpO2 = document.getElementById('fieldSpO2');
    this.fieldSymptoms = document.getElementById('fieldSymptoms');
    this.fieldMeds = document.getElementById('fieldMeds');
    this.fieldNotes = document.getElementById('fieldNotes');

    this.onSave = options.onSave || null;
    this.currentData = null;

    this.initEvents();
  }

  initEvents() {
    if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());
    if (this.btnCancel) this.btnCancel.addEventListener('click', () => this.close());
    if (this.btnSave) this.btnSave.addEventListener('click', () => this.handleSave());

    // Validación reactiva en tiempo real sobre nombre y constantes vitales
    const liveInputs = [this.fieldName, this.fieldBP, this.fieldTemp, this.fieldHR, this.fieldSpO2, this.fieldAge];
    liveInputs.forEach(input => {
      if (input) {
        input.addEventListener('input', () => this.validateLive());
        input.addEventListener('change', () => this.validateLive());
      }
    });
  }

  open(extractedData, onSaveCallback) {
    this.currentData = extractedData ? JSON.parse(JSON.stringify(extractedData)) : null;
    if (onSaveCallback) this.onSave = onSaveCallback;

    this.populate();
    this.validateLive();
    if (this.modalEl) {
      this.modalEl.classList.add('open');
      this.modalEl.setAttribute('aria-hidden', 'false');
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.remove('open');
      this.modalEl.setAttribute('aria-hidden', 'true');
    }
    this.clearErrors();
  }

  populate() {
    if (!this.currentData) return;
    const { patient = {}, vitals = {}, symptoms = [], prescriptions = [], doctorNotes = '', rawTranscript = '' } = this.currentData;

    if (this.fieldName) this.fieldName.value = patient.name || '';
    if (this.fieldAge) this.fieldAge.value = patient.age !== null && patient.age !== undefined ? patient.age : '';
    if (this.fieldGender) this.fieldGender.value = patient.gender || '';
    if (this.fieldBP) this.fieldBP.value = vitals.bloodPressure || '';
    if (this.fieldTemp) this.fieldTemp.value = vitals.temperature !== null && vitals.temperature !== undefined ? vitals.temperature : '';
    if (this.fieldHR) this.fieldHR.value = vitals.heartRate !== null && vitals.heartRate !== undefined ? vitals.heartRate : '';
    if (this.fieldSpO2) this.fieldSpO2.value = vitals.oxygenSaturation !== null && vitals.oxygenSaturation !== undefined ? vitals.oxygenSaturation : '';
    if (this.fieldSymptoms) this.fieldSymptoms.value = (symptoms || []).join(', ');
    if (this.fieldMeds) this.fieldMeds.value = (prescriptions || []).join('; ');
    if (this.fieldNotes) this.fieldNotes.value = doctorNotes || rawTranscript || '';
  }

  getFormData() {
    const nameVal = this.fieldName?.value?.trim() || null;
    const ageVal = this.fieldAge?.value?.trim();
    const tempVal = this.fieldTemp?.value?.trim();
    const hrVal = this.fieldHR?.value?.trim();
    const spO2Val = this.fieldSpO2?.value?.trim();

    return {
      patient: {
        name: nameVal,
        age: ageVal ? parseInt(ageVal, 10) : null,
        ageUnit: 'años',
        gender: this.fieldGender?.value || null,
        allergies: this.currentData?.patient?.allergies || [],
        priorMedications: this.currentData?.patient?.priorMedications || []
      },
      vitals: {
        bloodPressure: this.fieldBP?.value?.trim() || null,
        temperature: tempVal ? parseFloat(tempVal.replace(',', '.')) : null,
        heartRate: hrVal ? parseInt(hrVal, 10) : null,
        oxygenSaturation: spO2Val ? parseInt(spO2Val, 10) : null
      },
      symptoms: this.fieldSymptoms?.value 
        ? this.fieldSymptoms.value.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      prescriptions: this.fieldMeds?.value
        ? this.fieldMeds.value.split(';').map(m => m.trim()).filter(Boolean)
        : [],
      doctorNotes: this.fieldNotes?.value?.trim() || '',
      rawTranscript: this.currentData?.rawTranscript || this.fieldNotes?.value?.trim() || ''
    };
  }

  validateLive() {
    const formData = this.getFormData();
    const Guardrails = window.Pakimed?.Guardrails;
    const blockingErrors = [];
    const observations = [];
    const invalidFields = new Set();

    // 1. Validar Nombre Obligatorio
    if (!formData.patient.name || formData.patient.name.length < 2) {
      const nameErr = (window.I18nManager && typeof window.I18nManager.get === 'function')
        ? window.I18nManager.get('modal_alert_name_required')
        : 'Identificación requerida: Ingrese el nombre del paciente para habilitar el guardado.';
      blockingErrors.push(nameErr);
      invalidFields.add('name');
    }

    if (Guardrails) {
      // 2. Validar Rangos Fisiológicos
      const rangeCheck = Guardrails.validatePhysiologicalRanges(formData);
      if (!rangeCheck.isValid) {
        blockingErrors.push(...rangeCheck.criticalErrors);
        rangeCheck.outOfRangeFields.forEach(f => invalidFields.add(f));
      }
      if (rangeCheck.observations.length > 0) {
        observations.push(...rangeCheck.observations);
      }

      // 3. Validar Completitud Clínica
      const compCheck = Guardrails.validateClinicalCompleteness(formData);
      if (compCheck.missingClinicalData) {
        blockingErrors.push(compCheck.reason);
      }
    }

    // Marcado visual de campos erróneos en el DOM
    this.setFieldStatus(this.fieldName, invalidFields.has('name'));
    this.setFieldStatus(this.fieldBP, invalidFields.has('bloodPressure'));
    this.setFieldStatus(this.fieldTemp, invalidFields.has('temperature'));
    this.setFieldStatus(this.fieldHR, invalidFields.has('heartRate'));
    this.setFieldStatus(this.fieldSpO2, invalidFields.has('oxygenSaturation'));
    this.setFieldStatus(this.fieldAge, invalidFields.has('age'));

    // Mostrar u ocultar panel de alertas del modal
    if (this.alertEl) {
      const allMessages = [...blockingErrors, ...observations];
      if (allMessages.length > 0) {
        this.alertEl.classList.remove('hidden');
        const alertTitle = (window.I18nManager && typeof window.I18nManager.get === 'function')
          ? window.I18nManager.get('modal_alert_title')
          : 'Validación de Registro';
        this.alertEl.innerHTML = `⚠️ <strong>${alertTitle}:</strong><br>${allMessages.join('<br>')}`;
      } else {
        this.alertEl.classList.add('hidden');
        this.alertEl.innerHTML = '';
      }
    }

    // Deshabilitar botón de guardar si hay errores de bloqueo
    const hasBlockingError = blockingErrors.length > 0;
    if (this.btnSave) {
      this.btnSave.disabled = hasBlockingError;
      this.btnSave.style.opacity = hasBlockingError ? '0.5' : '1';
      this.btnSave.title = hasBlockingError 
        ? ((window.I18nManager && typeof window.I18nManager.get === 'function')
            ? window.I18nManager.get('modal_alert_name_required')
            : 'Complete el nombre y corrija los valores atípicos antes de guardar')
        : 'Guardar cambios validados';
    }

    return { isValid: !hasBlockingError, hasBlockingError, blockingErrors, observations, formData };
  }

  setFieldStatus(element, isInvalid) {
    if (!element) return;
    if (isInvalid) {
      element.classList.add('input-invalid');
    } else {
      element.classList.remove('input-invalid');
    }
  }

  clearErrors() {
    [this.fieldName, this.fieldBP, this.fieldTemp, this.fieldHR, this.fieldSpO2, this.fieldAge].forEach(el => {
      if (el) el.classList.remove('input-invalid');
    });
    if (this.alertEl) {
      this.alertEl.classList.add('hidden');
      this.alertEl.innerHTML = '';
    }
  }

  handleSave() {
    const { isValid, hasBlockingError, formData } = this.validateLive();
    if (hasBlockingError || !isValid) {
      const saveAlert = (window.I18nManager && typeof window.I18nManager.get === 'function')
        ? window.I18nManager.get('alert_invalid_save')
        : 'Por favor ingrese el nombre del paciente y verifique que las constantes vitales sean biológicamente válidas.';
      alert(saveAlert);
      return;
    }

    // Ejecución de la suite completa de guardarraíles
    const Guardrails = window.Pakimed?.Guardrails;
    const finalData = {
      ...this.currentData,
      ...formData,
      guardrailAlerts: [],
      rangeWarnings: [],
      missingFields: []
    };

    if (Guardrails) {
      const diagCheck = Guardrails.validateNoAutonomousDiagnosis(finalData.doctorNotes);
      if (!diagCheck.isValid) {
        finalData.guardrailAlerts.push(...diagCheck.warnings);
        finalData.isAutonomousDiagnosis = true;
      }

      const rangeCheck = Guardrails.validatePhysiologicalRanges(finalData);
      if (rangeCheck.criticalErrors.length > 0) {
        finalData.guardrailAlerts.push(...rangeCheck.criticalErrors);
      }
      if (rangeCheck.observations.length > 0) {
        finalData.guardrailAlerts.push(...rangeCheck.observations);
      }
      finalData.rangeWarnings = rangeCheck.warnings;

      const compCheck = Guardrails.validateClinicalCompleteness(finalData);
      finalData.isComplete = compCheck.isComplete;
      finalData.completenessMessage = compCheck.reason;

      finalData.missingFields = Guardrails.detectMissingOptionalFields(finalData);
    }

    this.close();

    if (this.onSave) {
      this.onSave(finalData);
    }
  }
}

// Exportación Universal
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.ModalController = ModalController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalController };
}
