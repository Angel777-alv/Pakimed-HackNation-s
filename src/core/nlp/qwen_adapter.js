/**
 * Pakimed Qwen2.5-0.5B Small AI On-Device Adapter
 * 
 * Implementa la inferencia del modelo ligero Qwen2.5-0.5B para extracción
 * clínica estructurada con razonamiento semántico multilingüe, guardarraíles
 * de seguridad y fallback automático instantáneo al motor heurístico.
 */

(function (global) {
  'use strict';

  const QwenAdapter = {
    // Configuración predeterminada del Edge Runtime Local
    config: {
      endpoint: 'http://localhost:11434/api/generate',
      tagsEndpoint: 'http://localhost:11434/api/tags',
      modelName: 'qwen2.5:0.5b',
      timeoutMs: 8000,
      temperature: 0.1,
      isEnabled: true,
      isAvailable: false
    },

    // In-browser WebGPU worker (si está activo en modo PWA)
    inBrowserWorker: null,

    /**
     * System Prompt Clínico Especializado para Small AI (Qwen2.5)
     */
    getSystemPrompt() {
      return `Eres un asistente de inteligencia artificial médica offline de alta precisión para centros de salud comunitarios rurales. Tu única función es extraer datos estructurados de transcripciones de consultas médicas en español.

REGLAS DE SEGURIDAD CLÍNICA ESTRICTAS (CERO ALUCINACIÓN):
1. Responde EXCLUSIVAMENTE con un objeto JSON válido. No agregues saludos, explicaciones, markdown ni texto fuera del JSON.
2. CONSTANTES VITALES: Si un signo vital (presión arterial, temperatura, pulso/frecuencia cardíaca, saturación de oxígeno) NO fue dictado ni mencionado explícitamente, su valor DEBE ser null. NUNCA inventes cifras.
3. PRESIÓN ARTERIAL: Normalízala en formato "SISTÓLICA/DIASTÓLICA" (ejemplo: "130/80"). Si se dice "150 sobre 95", es "150/95".
4. SATURACIÓN DE OXÍGENO: Extrae el valor numérico en porcentaje (ej. 89). Reconoce términos como "saturación", "oxigenación", "spo2".
5. ALERGIAS vs RECETAS: Si el paciente dice ser alérgico a un medicamento (ej. "alérgico a la penicilina"), colócalo únicamente en "allergies". NUNCA lo coloques en "prescriptions".
6. AUTOMEDICACIÓN PREVIA vs RECETAS: Si el paciente menciona haber tomado algo antes de la consulta (ej. "me tomé un paracetamol anoche"), colócalo en "priorMedications". NUNCA lo coloques en "prescriptions".
7. PRESCRIPCIONES ACTIVAS: Solo incluye en "prescriptions" los medicamentos que el médico receta o indica activamente para tomar (ejemplo: "Salbutamol en aerosol, 2 disparos cada 8 horas", "Bromhexina 8 mg cada 12 horas"). Si el médico suspende un fármaco, no lo recetes.
8. TIEMPO DE EVOLUCIÓN: Identifica la duración de los síntomas (ejemplo: "tres días", "4 días").
9. EDAD: Si la paciente dice "nací en 1990", calcula su edad considerando el año actual 2026 (ej. 36 años).

ESTRUCTURA JSON EXACTA REQUERIDA:
{
  "patient": {
    "name": "Nombre y Apellidos o null",
    "age": 0 o null,
    "gender": "F" o "M" o null,
    "allergies": [],
    "priorMedications": [],
    "chronicConditions": []
  },
  "vitals": {
    "bloodPressure": "120/80" o null,
    "temperature": 37.0 o null,
    "heartRate": 80 o null,
    "oxygenSaturation": 98 o null
  },
  "symptoms": ["síntoma 1", "síntoma 2"],
  "timeEvolution": "tiempo o null",
  "prescriptions": ["fármaco dosis frecuencia"]
}`;
    },

    /**
     * Verifica la disponibilidad del micro-servidor local de Qwen (Ollama / Llama.cpp)
     * @returns {Promise<boolean>}
     */
    async checkAvailability() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const response = await fetch(this.config.tagsEndpoint, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const hasQwen = Array.isArray(data.models) && data.models.some(m => 
            m.name.toLowerCase().includes('qwen') || m.name.toLowerCase().includes('0.5b') || m.name.toLowerCase().includes('1.5b')
          );
          this.config.isAvailable = true;
          return true;
        }
      } catch (e) {
        // Servidor no disponible o modo offline sin micro-servidor
      }

      this.config.isAvailable = false;
      return false;
    },

    /**
     * Limpia y parsea de forma segura el texto devuelto por el SLM
     * @param {string} rawResponse
     * @returns {Object|null}
     */
    parseModelOutput(rawResponse) {
      if (!rawResponse || typeof rawResponse !== 'string') return null;

      let clean = rawResponse.trim();

      // 1. Remover bloques markdown ```json ... ```
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      // 2. Extraer el primer bloque {...} balanceado si hay texto sobrante
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(clean);
      } catch (err) {
        console.warn('[QwenAdapter] Error al parsear JSON inicial, intentando reparación:', err);
        // Reparación de comas finales (trailing commas)
        const repaired = clean.replace(/,\s*([}\]])/g, '$1');
        try {
          return JSON.parse(repaired);
        } catch (repairErr) {
          console.error('[QwenAdapter] Falló la reparación del JSON:', repairErr);
          return null;
        }
      }
    },

    /**
     * Realiza la extracción estructurada mediante Qwen2.5-0.5B
     * @param {string} rawTranscript
     * @returns {Promise<Object>} Ficha clínica estructurada y auditada
     */
    async extract(rawTranscript) {
      const text = (rawTranscript || '').trim();
      const fallbackNER = global.Pakimed?.NER;

      // Si no hay texto, retornar estado vacío
      if (!text) {
        return fallbackNER ? fallbackNER.extract(text) : null;
      }

      // 1. Intentar inferencia neuronal con Qwen si está habilitado
      if (this.config.isEnabled) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

          const payload = {
            model: this.config.modelName,
            system: this.getSystemPrompt(),
            prompt: `TRANSCRIPCIÓN CLÍNICA A ESTRUCTURAR:\n"${text}"\n\nJSON:`,
            stream: false,
            format: 'json',
            options: {
              temperature: this.config.temperature,
              num_predict: 512
            }
          };

          const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const outputText = data.response || '';
            const parsed = this.parseModelOutput(outputText);

            if (parsed && typeof parsed === 'object') {
              console.log('[QwenAdapter] Inferencia exitosa de Qwen2.5-0.5B:', parsed);
              return this.integrateAndAudit(parsed, text);
            }
          }
        } catch (err) {
          console.info('[QwenAdapter] Micro-runtime Qwen no accesible o tiempo de espera agotado. Activando motor heurístico ConText de respaldo:', err.message);
        }
      }

      // 2. Fallback Transparente: Motor Heurístico ConText (Siempre funcional)
      if (fallbackNER) {
        console.log('[QwenAdapter] Ejecutando extracción mediante Motor Heurístico ConText (Nivel 1).');
        return fallbackNER.extract(text);
      }

      throw new Error('No hay motor de extracción disponible.');
    },

    /**
     * Integra la salida del modelo con los guardarraíles de seguridad (IEEE 7000)
     * @param {Object} slmOutput
     * @param {string} rawTranscript
     * @returns {Object}
     */
    integrateAndAudit(slmOutput, rawTranscript) {
      const Guardrails = global.Pakimed?.Guardrails;

      // Estructura canónica segura
      const result = {
        rawTranscript: rawTranscript,
        patient: {
          name: slmOutput.patient?.name || null,
          age: typeof slmOutput.patient?.age === 'number' ? slmOutput.patient.age : null,
          ageUnit: 'años',
          gender: slmOutput.patient?.gender === 'F' || slmOutput.patient?.gender === 'M' ? slmOutput.patient.gender : null,
          allergies: Array.isArray(slmOutput.patient?.allergies) ? slmOutput.patient.allergies : [],
          priorMedications: Array.isArray(slmOutput.patient?.priorMedications) ? slmOutput.patient.priorMedications : [],
          chronicConditions: Array.isArray(slmOutput.patient?.chronicConditions) ? slmOutput.patient.chronicConditions : [],
          confidence: 0.98,
          engine: 'Qwen2.5-0.5B (Small AI)'
        },
        vitals: {
          bloodPressure: slmOutput.vitals?.bloodPressure || null,
          temperature: typeof slmOutput.vitals?.temperature === 'number' ? slmOutput.vitals.temperature : null,
          heartRate: typeof slmOutput.vitals?.heartRate === 'number' ? slmOutput.vitals.heartRate : null,
          oxygenSaturation: typeof slmOutput.vitals?.oxygenSaturation === 'number' ? slmOutput.vitals.oxygenSaturation : null
        },
        symptoms: Array.isArray(slmOutput.symptoms) ? slmOutput.symptoms : [],
        timeEvolution: slmOutput.timeEvolution || null,
        prescriptions: Array.isArray(slmOutput.prescriptions) ? slmOutput.prescriptions : [],
        doctorNotes: rawTranscript,
        guardrailAlerts: [],
        rangeWarnings: [],
        missingFields: [],
        isAutonomousDiagnosis: false,
        isComplete: true,
        completenessMessage: null
      };

      // Auditoría Ética y Fisiológica
      if (Guardrails) {
        // 1. No-Diagnóstico (IEEE 7000)
        const diagCheck = Guardrails.validateNoAutonomousDiagnosis(rawTranscript);
        if (!diagCheck.isValid) {
          result.guardrailAlerts.push(...diagCheck.warnings);
          result.isAutonomousDiagnosis = true;
        }

        // 2. Límites fisiológicos
        const rangeCheck = Guardrails.validatePhysiologicalRanges(result);
        if (rangeCheck.criticalErrors.length > 0) {
          result.guardrailAlerts.push(...rangeCheck.criticalErrors);
          result.isComplete = false;
          result.completenessMessage = 'Valores fuera de límites biológicos humanos.';
        }
        result.rangeWarnings = rangeCheck.warnings;
        result.guardrailAlerts.push(...rangeCheck.warnings);

        // 3. Completitud clínica
        const compCheck = Guardrails.validateClinicalCompleteness(result);
        result.isComplete = compCheck.isComplete;
        result.completenessMessage = compCheck.reason;

        // 4. Campos no dictados
        result.missingFields = Guardrails.detectMissingOptionalFields(result);
      }

      return result;
    }
  };

  // Exportar al namespace global de Pakimed
  global.Pakimed = global.Pakimed || {};
  global.Pakimed.QwenAdapter = QwenAdapter;

})(typeof window !== 'undefined' ? window : this);
