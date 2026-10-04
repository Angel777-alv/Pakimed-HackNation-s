/**
 * Pakimed - Modal HITL Form Controller (Human-In-The-Loop)
 * 
 * Responsabilidades:
 * 1. Control del ciclo de vida del modal de edición manual.
 * 2. Validación reactiva de rangos fisiológicos (PAS, PAD, Temp, FC, SpO2, Edad).
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

    // Validación reactiva en tiempo real sobre los campos de constantes vitales
    const vitalInputs = [this.fieldBP, this.fieldTemp, this.fieldHR, this.fieldSpO2, this.fieldAge];
    vitalInputs.forEach(input => {
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
    const ageVal = this.fieldAge?.value?.trim();
    const tempVal = this.fieldTemp?.value?.trim();
    const hrVal = this.fieldHR?.value?.trim();
    const spO2Val = this.fieldSpO2?.value?.trim();

    return {
      patient: {
        age: ageVal ? parseInt(ageVal, 10) : null,
        ageUnit: 'años',
        gender: this.fieldGender?.value || null
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
    const errors = [];
    const invalidFields = new Set();

    if (Guardrails) {
      // 1. Validar Rangos Fisiológicos
      const rangeCheck = Guardrails.validatePhysiologicalRanges(formData);
      if (!rangeCheck.isValid) {
        errors.push(...rangeCheck.warnings);
        rangeCheck.outOfRangeFields.forEach(f => invalidFields.add(f));
      }

      // 2. Validar Completitud Clínica
      const compCheck = Guardrails.validateClinicalCompleteness(formData);
      if (!compCheck.isComplete) {
        errors.push(compCheck.reason);
      }
    }

    // Marcado visual de campos erróneos en el DOM
    this.setFieldStatus(this.fieldBP, invalidFields.has('bloodPressure'));
    this.setFieldStatus(this.fieldTemp, invalidFields.has('temperature'));
    this.setFieldStatus(this.fieldHR, invalidFields.has('heartRate'));
    this.setFieldStatus(this.fieldSpO2, invalidFields.has('oxygenSaturation'));
    this.setFieldStatus(this.fieldAge, invalidFields.has('age'));

    // Mostrar u ocultar panel de alertas del modal
    if (this.alertEl) {
      if (errors.length > 0) {
        this.alertEl.classList.remove('hidden');
        this.alertEl.innerHTML = `⚠️ <strong>Observaciones de Validación:</strong><br>${errors.join('<br>')}`;
      } else {
        this.alertEl.classList.add('hidden');
        this.alertEl.innerHTML = '';
      }
    }

    // Deshabilitar botón de guardar si hay errores críticos de rango
    const hasCriticalRangeError = invalidFields.size > 0;
    if (this.btnSave) {
      this.btnSave.disabled = hasCriticalRangeError;
      this.btnSave.style.opacity = hasCriticalRangeError ? '0.5' : '1';
      this.btnSave.title = hasCriticalRangeError 
        ? 'Corrige los valores atípicos marcados en rojo antes de guardar' 
        : 'Guardar cambios validados';
    }

    return { isValid: errors.length === 0, hasCriticalRangeError, errors, formData };
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
    [this.fieldBP, this.fieldTemp, this.fieldHR, this.fieldSpO2, this.fieldAge].forEach(el => {
      if (el) el.classList.remove('input-invalid');
    });
    if (this.alertEl) {
      this.alertEl.classList.add('hidden');
      this.alertEl.innerHTML = '';
    }
  }

  handleSave() {
    const { isValid, hasCriticalRangeError, formData } = this.validateLive();
    if (hasCriticalRangeError) {
      alert('No es posible guardar valores de constantes vitales fuera de rangos biológicos plausibles.');
      return;
    }

    // Ejecución de la suite completa de guardarraíles
    const Guardrails = window.Pakimed?.Guardrails;
    const finalData = {
      ...this.currentData,
      ...formData,
      guardrailAlerts: [],
      rangeWarnings: []
    };

    if (Guardrails) {
      const diagCheck = Guardrails.validateNoAutonomousDiagnosis(finalData.doctorNotes);
      if (!diagCheck.isValid) {
        finalData.guardrailAlerts.push(...diagCheck.warnings);
        finalData.isAutonomousDiagnosis = true;
      }

      const rangeCheck = Guardrails.validatePhysiologicalRanges(finalData);
      if (!rangeCheck.isValid) {
        finalData.rangeWarnings.push(...rangeCheck.warnings);
        finalData.guardrailAlerts.push(...rangeCheck.warnings);
      }

      const compCheck = Guardrails.validateClinicalCompleteness(finalData);
      finalData.isComplete = compCheck.isComplete;
      finalData.completenessMessage = compCheck.reason;
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
