/**
 * Tests unitarios para los Guardarraíles de Seguridad y Ética de Pakimed
 */

import { Guardrails } from '../src/core/guardrails/guardrails.js';
import { ClinicalNER } from '../src/core/nlp/clinical_ner.js';

function runGuardrailTests() {
  console.log('--- Iniciando Pruebas de Guardarraíles ---');
  let passed = 0;
  let total = 0;

  // Test 1: No diagnóstico autónomo
  total++;
  const safeText = "Paciente de 45 años con fiebre y dolor de cabeza. Presión 120/80. Se indica paracetamol 500mg.";
  const safeCheck = Guardrails.validateNoAutonomousDiagnosis(safeText);
  if (safeCheck.isValid && safeCheck.warnings.length === 0) {
    console.log('✅ Test 1 Superado: Texto clínico regular sin diagnósticos autónomos.');
    passed++;
  } else {
    console.error('❌ Test 1 Falló:', safeCheck);
  }

  // Test 2: Detección de frase de diagnóstico no permitido
  total++;
  const unsafeText = "El paciente padece de neumonía bacteriana severa. Se diagnostica con bronquitis.";
  const unsafeCheck = Guardrails.validateNoAutonomousDiagnosis(unsafeText);
  if (!unsafeCheck.isValid && unsafeCheck.warnings.length > 0) {
    console.log('✅ Test 2 Superado: Guardarraíl detectó correctamente inferencia diagnóstica no autorizada.');
    passed++;
  } else {
    console.error('❌ Test 2 Falló: No se detectó la frase diagnóstica.');
  }

  // Test 3: Extracción NER y preservación de guardarraíles
  total++;
  const nerResult = ClinicalNER.extractClinicalEntities(safeText);
  if (nerResult.patient.age === 45 && nerResult.vitals.bloodPressure === '120/80') {
    console.log('✅ Test 3 Superado: Extracción de entidades estructuradas correcta.');
    passed++;
  } else {
    console.error('❌ Test 3 Falló:', nerResult);
  }

  console.log(`\nResumen: ${passed}/${total} pruebas superadas.`);
}

runGuardrailTests();
