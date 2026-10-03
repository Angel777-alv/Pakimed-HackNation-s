---
name: dhis2-schema-mapper
description: Guía y utilidades para validar y formatear registros médicos clínicos al formato JSON estándar de DHIS2 Tracker / Event API.
---

# DHIS2 Schema Mapper Skill

Esta skill proporciona pautas y estructuras estándar para transformar entidades clínicas extraídas de la voz de un médico en el payload requerido por DHIS2.

## Estructura de Evento DHIS2 Típico

```json
{
  "program": "CLINICAL_CONSULTATION_PROGRAM_ID",
  "orgUnit": "RURAL_CLINIC_ORG_UNIT_ID",
  "eventDate": "2026-10-03T12:00:00.000Z",
  "status": "COMPLETED",
  "dataValues": [
    { "dataElement": "PATIENT_AGE", "value": "34" },
    { "dataElement": "PATIENT_GENDER", "value": "F" },
    { "dataElement": "SYMPTOMS_SUMMARY", "value": "Fiebre y tos seca" },
    { "dataElement": "VITAL_BP_SYSTOLIC", "value": "120" },
    { "dataElement": "VITAL_BP_DIASTOLIC", "value": "80" },
    { "dataElement": "VITAL_TEMP_C", "value": "38.5" },
    { "dataElement": "PRESCRIBED_MEDICATION", "value": "Paracetamol 500mg c/8h" },
    { "dataElement": "PHYSICIAN_NOTES", "value": "Paciente orientada, hidratación recomendada" }
  ]
}
```

## Validación
- Todos los valores numéricos de signos vitales deben normalizarse.
- Toda información de medicamentos debe incluir dosis explícita aprobada por el médico.
