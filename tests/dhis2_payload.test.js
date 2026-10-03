/**
 * Tests para la serialización y formato estándar DHIS2
 */

import { DHIS2Adapter } from '../src/integrations/dhis2/dhis2_adapter.js';

function runDHIS2Tests() {
  console.log('--- Iniciando Pruebas de Serialización DHIS2 ---');
  let passed = 0;
  let total = 0;

  total++;
  const mockRecord = {
    patient: { age: 34, gender: 'F' },
    vitals: { bloodPressure: '120/80', temperature: 38.5, heartRate: 78 },
    symptoms: ['fiebre', 'tos seca'],
    prescriptions: ['Paracetamol 500mg c/8h'],
    doctorNotes: 'Consulta rural completada',
    approvedAt: '2026-10-03T12:00:00.000Z'
  };

  const payload = DHIS2Adapter.formatToDHIS2Event(mockRecord);

  const hasProgram = payload.program === 'PAKIMED_PRIMARY_HEALTH_PRG';
  const hasStatus = payload.status === 'COMPLETED';
  const hasDataValues = Array.isArray(payload.dataValues) && payload.dataValues.length >= 6;

  if (hasProgram && hasStatus && hasDataValues) {
    console.log('✅ Test DHIS2 Superado: Estructura de evento conforme a la especificación oficial.');
    passed++;
  } else {
    console.error('❌ Test DHIS2 Falló:', payload);
  }

  console.log(`\nResumen: ${passed}/${total} pruebas superadas.`);
}

runDHIS2Tests();
