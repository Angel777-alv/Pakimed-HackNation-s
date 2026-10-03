# Guion del Video de Pitch - Pakimed (2-5 Minutos)

## Estructura del Video (Hackatón Global AI 2026 - Small AI Sector Salud)

---

### 1. El Problema (0:00 - 0:45)
* **Escenario:** "En clínicas rurales sobrepobladas y centros de salud primaria, los médicos dedican hasta el 50% de su tiempo a transcribir datos a mano en libretas o lidiar con formularios lentos en teléfonos de gama baja sin conexión a internet."
* **Impacto:** Menos tiempo de calidad para cada paciente, pérdida de expedientes y desconexión con los sistemas de salud pública nacional (DHIS2).

---

### 2. La Solución: Small AI en el Borde con Moonshine Voice (0:45 - 1:30)
* **¿Por qué Small AI?:** En zonas sin cobertura, los LLMs en la nube son inaccesibles y vulneran la privacidad del paciente. Pakimed ejecuta **Moonshine Voice ASR** y un extractor NER clínico **100% on-device (Edge AI)** con cero transmisión de red.
* **Guardarraíles Éticos Innegociables (IEEE 7000):**
  * **Cero Diagnóstico Autónomo:** La IA actúa estrictamente como asistente de documentación; nunca inventa diagnósticos ni prescribe autónomamente.
  * **Human-in-the-Loop:** El médico tiene la última palabra mediante una previsualización clínica clara y una ventana modal de ajuste manual.

---

### 3. Demostración en Vivo: User Journey de 4 Fases (1:30 - 3:30)
* **Paso 1 (Dictado Clínico / Moonshine Voice):** El médico dicta naturalmente o selecciona un caso de prueba. El texto se transcribe localmente sin consumir datos.
* **Paso 2 (Inferencia Edge SLM):** Extracción instantánea de signos vitales, demografía, síntomas y recetas (0 KB enviados a la nube).
* **Paso 3 (Previsualización y Modal HITL):** Se genera la ficha resumen del paciente. Si se requiere modificar algún valor, el botón **"✏️ Modificar"** despliega la ventana de edición táctil antes de dar el visto bueno con guardarraíles activos.
* **Paso 4 (Store-and-Forward hacia DHIS2):** El expediente queda encolado localmente. Al activar la simulación de señal 3G, se sincroniza en lote y se exporta el payload JSON oficial para DHIS2 Tracker API.

---

### 4. Impacto, Inclusión y Escalabilidad (3:30 - 4:15)
* **Eficiencia Extrema:** Corre en dispositivos Android/iOS económicos (<1.5 GB RAM).
* **Inclusión Local:** Compatible con dialectos y acentos rurales mediante datasets abiertos (Mozilla Common Voice / MMS).
* **Conclusión:** Pakimed devuelve el tiempo y la atención médica a quienes más lo necesitan: los pacientes en comunidades remotas.
