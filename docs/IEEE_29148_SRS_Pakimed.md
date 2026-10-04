# Especificación de Requisitos de Software (SRS)
## Proyecto: Pakimed - Asistente de Registro Clínico Offline (Edge AI)
**Conforme a los estándares ISO/IEC/IEEE 29148:2018 (SRS) e IEEE 7000-2021 (Ethical AI)**  
**Reto:** Small AI for Development - Sector Salud (Global AI Hackathon 2026)  
**Versión:** 1.1.0  
**Fecha:** Octubre 2026  
**Estado:** Aprobado para Desarrollo de MVP  

---

## 1. Introducción

### 1.1 Propósito
El propósito de este documento es definir formalmente los requisitos funcionales, no funcionales, arquitectónicos y los guardarraíles éticos para el Producto Mínimo Viable (MVP) de **Pakimed**, un asistente de registro clínico por voz diseñado para operar 100% offline en dispositivos móviles de médicos en entornos rurales y de bajos recursos.

### 1.2 Alcance del Producto
Pakimed es una solución móvil basada en **Small AI / Edge AI** que elimina la carga administrativa de entrada manual de datos en clínicas rurales sobrepobladas. Permite al trabajador de la salud dictar el resumen de la consulta en su idioma local, procesa el audio on-device mediante el motor ultra-ligero **Moonshine Voice (Edge ASR)** sin enviar datos a la nube, extrae entidades clínicas estructuradas (signos vitales, síntomas, medicamentos prescritos), genera una **previsualización clínica inmediata** con una **ventana modal interactiva de ajuste y modificación manual (Human-in-the-Loop)**, y almacena los expedientes cifrados en una cola local (*Store-and-Forward*) para su posterior sincronización con la plataforma institucional **DHIS2**.

### 1.3 Definiciones, Acrónimos y Abreviaturas
* **Small AI / SLM (Small Language Model):** Modelos compactos optimizados para inferencia on-device con bajo consumo de memoria y energía.
* **Moonshine Voice:** Arquitectura de reconocimiento automático de voz (ASR) optimizada específicamente para inferencia local en procesadores y hardware móvil de gama baja.
* **Edge AI:** Ejecución de modelos de inteligencia artificial directamente en el hardware del usuario final sin depender de servidores en la nube.
* **Human-in-the-Loop (HITL):** Principio de diseño donde la decisión y aprobación final dependen estrictamente de un ser humano (el profesional médico).
* **DHIS2 (District Health Information Software 2):** Plataforma estándar de gestión de información de salud pública adoptada en más de 70 países.
* **Store-and-Forward:** Patrón arquitectónico de persistencia donde los datos se guardan de forma local y segura hasta que se detecte una conexión de red confiable.
* **NER (Named Entity Recognition):** Reconocimiento y extracción de entidades nombradas clínicas a partir de texto no estructurado.

### 1.4 Referencias y Estándares
* **ISO/IEC/IEEE 29148:2018:** Systems and software engineering — Life cycle processes — Requirements engineering.
* **IEEE 7000-2021:** Model Process for Addressing Ethical Concerns During System Design.
* **DHIS2 Web API Documentation:** Tracker and Event capture schema specifications.

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
Pakimed opera como una aplicación autónoma de borde en el dispositivo móvil del médico, presentada en un marco interactivo de smartphone. No requiere servidores intermediarios propios para el procesamiento de voz o lenguaje natural, garantizando soberanía y privacidad total de los datos.

```mermaid
flowchart TD
    subgraph S1["1. Entrada & Captura (Screen 1)"]
        A["🎙️ Voz del Médico / Preset Demo"] --> B["⚙️ Moonshine Voice (Edge ASR)"]
        B --> C["📝 Transcripción de Texto Crudo"]
    end

    subgraph S2["2. Inferencia & Guardarraíles (Screen 2)"]
        C --> D["🛡️ Filtro Ético & Guardarraíl No-Diagnóstico (IEEE 7000)"]
        D --> E["🧠 Clinical NER Engine (Signos, Síntomas, Fármacos)"]
        E --> F["📊 Asignación de Confianza (Confidence Score > 75%)"]
    end

    subgraph S3["3. Previsualización & Human-in-the-Loop (Screen 3)"]
        F --> G["📋 Previsualización del Expediente Estructurado"]
        G --> H{"¿Requiere Corrección?"}
        H -- "Sí (Clic en Modificar)" --> I["✏️ Ventana Modal de Ajuste Manual"]
        I --> G
        H -- "Conforme" --> J["✅ Visto Bueno Médico (Firma HITL)"]
    end

    subgraph S4["4. Persistencia & Sincronización (Screen 4)"]
        J --> K["📦 Cola Local Cifrada Store-and-Forward (Estado: PENDING_SYNC)"]
        K --> L{"🌐 Detección de Red (Offline / 3G)"}
        L -- "Offline" --> M["💾 Retención Segura en el Dispositivo"]
        L -- "Conexión Detectada" --> N["🏥 Mapeo & Envío a DHIS2 Tracker API (Estado: SYNCED)"]
    end
```

### 2.2 Funciones del Producto (Resumen del MVP)
1. **Captura y Transcripción Acústica On-Device (Moonshine Voice):** Reconocimiento de dictado clínico adaptado a hardware móvil de gama baja.
2. **Extracción Estructurada de Entidades (Clinical NER):** Clasificación automática de edad, género, signos vitales, sintomatología y fármacos indicados.
3. **Guardarraíles de Seguridad y No-Diagnóstico:** Bloqueo proactivo de cualquier inferencia diagnóstica o recomendación autónoma no dictada.
4. **Previsualización Clínica y Ventana de Modificación (HITL):** Vista resumen del expediente con ventana modal de ajuste manual de datos para aprobación médica.
5. **Persistencia Store-and-Forward & Sincronización DHIS2:** Encolado local seguro y serialización compatible con el estándar DHIS2 Tracker/Event API.
6. **Controles de Demostración Rápida (Pitch Readiness):** Botón de ejecución automatizada del pipeline para presentaciones ágiles del jurado.

### 2.3 Características de los Usuarios
* **Usuario Primario:** Médicos generales, enfermeros y trabajadores comunitarios de salud en clínicas rurales y puestos de atención primaria.
* **Contexto Operativo:** Jornadas de alta afluencia de pacientes, tiempos de consulta reducidos (3 a 7 minutos), ausencia de teclados físicos y nula o precaria conectividad a internet.

### 2.4 Restricciones de Diseño e Implementación
* **Arquitectura 100% Offline-First:** El flujo central de captura, procesamiento y aprobación debe funcionar íntegramente sin acceso a internet.
* **Hardware de Entrada:** Diseñado para teléfonos inteligentes de gama baja/media con recursos limitados (< 1.5 GB de RAM disponible para la app).
* **Privacidad Estricta:** Cero transmisión de audios sin procesar o datos clínicos a servidores comerciales o LLMs en la nube (OpenAI, Anthropic, etc.).

---

## 3. Requisitos Específicos

### 3.1 Requisitos Funcionales (RF)

#### RF-01: Captura de Audio y Dictado Clínico (Moonshine Voice Engine)
* **RF-01.1:** El sistema debe proveer una interfaz táctil enmarcada en una vista de smartphone con un botón principal de micrófono de alta visibilidad (target ≥ 48px).
* **RF-01.2:** El sistema debe procesar el audio mediante la arquitectura de **Moonshine Voice** on-device sin latencia de red.
* **RF-01.3:** El sistema debe incluir un selector de escenarios clínicos precargados para demostración instantánea durante el pitch.
* **RF-01.4:** El sistema debe incluir un botón de **Ejecución Automática de Pipeline (Demo 1-Click)** para recorrer fluidamente todo el ciclo de atención médica.

#### RF-02: Extracción Estructurada de Entidades Clínicas (NER)
* **RF-02.1:** El motor on-device debe procesar el texto transcrito y extraer los siguientes campos estructurados:
  * *Datos Demográficos:* Edad (número/unidad) y Género (F/M).
  * *Signos Vitales:* Presión arterial (Sistólica/Diastólica en mmHg), Temperatura corporal (°C) y Frecuencia cardíaca (lpm).
  * *Síntomas:* Lista normalizada de sintomatología referida.
  * *Prescripciones:* Nombre de fármacos, dosis y frecuencia dictadas explícitamente por el médico.
* **RF-02.2:** La extracción debe completarse en un tiempo no mayor a 2.0 segundos en el dispositivo móvil.

#### RF-03: Guardarraíles de Seguridad y Ética (IEEE 7000)
* **RF-03.1 (Regla Estricta de No-Diagnóstico):** El sistema **NUNCA** debe inferir, generar o sugerir diagnósticos médicos, pronósticos o tratamientos que no hayan sido expresamente dictados por el médico.
* **RF-03.2 (Manejo de Baja Confianza):** Si el motor de extracción detecta ambigüedad o un nivel de confianza inferior al 75% en un término clínico, debe marcar el campo en blanco o resaltar la necesidad de llenado manual.
* **RF-03.3 (Human-in-the-Loop Obligatorio):** Ningún registro podrá guardarse o encolarse sin la aprobación explícita mediante el botón de visto bueno por parte del profesional médico.
* **RF-03.4 (Regla de Completitud Clínica y Calidad de Datos):** Si el dictado procesado carece de al menos un dato clínico válido (signo vital, síntoma o prescripción), el sistema debe clasificar el registro como *Incompleto*, disparar una alerta preventiva visible, bloquear el envío a DHIS2 y proveer mecanismos inmediatos para reanudar el dictado o completar manualmente vía la ventana modal HITL.

#### RF-04: Previsualización Clínica y Ventana de Modificación de Formulario
* **RF-04.1 (Previsualización Estructurada):** El sistema debe generar una tarjeta de previsualización integral y estética del expediente del paciente antes de la aprobación.
* **RF-04.2 (Ventana Modal de Modificación y Ajuste):** El profesional de la salud debe poder desplegar una ventana modal interactiva para editar, corregir o complementar cualquier valor demográfico, signo vital, síntoma o fármaco.
* **RF-04.3 (Verificación Ética Visible):** La previsualización debe mostrar un distintivo visible de cumplimiento de guardarraíles ("Cero diagnóstico generado automáticamente").

#### RF-05: Almacenamiento Seguro Store-and-Forward
* **RF-05.1:** Al aprobar la consulta, el registro debe almacenarse en la base de datos local del dispositivo (IndexedDB / LocalStorage) en estado `PENDING_SYNC`.
* **RF-05.2:** El sistema debe listar el historial de consultas locales diferenciando registros sincronizados vs. pendientes.
* **RF-05.3:** El sistema debe permitir al usuario alternar entre simulación Offline y detección de red 3G/Wi-Fi.

#### RF-06: Serialización e Integración con DHIS2
* **RF-06.1:** El sistema debe convertir el registro clínico aprobado en un payload JSON conforme a la especificación estándar de DHIS2 Event / Tracker API.
* **RF-06.2:** Al detectar conectividad, el sistema debe permitir la sincronización en lotes de los registros pendientes.

---

## 4. Requisitos No Funcionales (RNF)

#### RNF-01: Rendimiento y Eficiencia (Small AI)
* **RNF-01.1:** El consumo de memoria RAM de la aplicación en ejecución no debe exceder 1.5 GB.
* **RNF-01.2:** La aplicación debe iniciar y estar lista para dictado en menos de 2.5 segundos.

#### RNF-02: Usabilidad y Experiencia de Usuario (UX)
* **RNF-02.1:** Interfaz presentada en marco de smartphone (Mobile Viewport) con soporte responsive.
* **RNF-02.2:** Contraste visual elevado y paleta de colores médicos profesionales (Dark Slate / Medical Cyan / Emerald) aptos para condiciones de luz variables en campo.

#### RNF-03: Seguridad y Privacidad
* **RNF-03.1:** Principio de privacidad por diseño: Ningún fragmento de audio o dato sensible de salud del paciente debe transmitirse a servidores de terceros.
* **RNF-03.2:** Los registros almacenados en el dispositivo deben mantenerse aislados en el sandbox seguro del navegador o almacenamiento local.

---

## 5. Matriz de Trazabilidad de Requisitos (MVP)

| ID Requisito | Descripción | Componente en Código | Estándar / Criterio Hackatón |
| :--- | :--- | :--- | :--- |
| **RF-01** | Captura de audio (Moonshine Voice ASR) | `src/core/audio/voice_recorder.js` | Edge AI / Inclusión local |
| **RF-02** | Extracción clínica estructurada | `src/core/nlp/clinical_ner.js` | Small AI on-device |
| **RF-03** | Guardarraíles éticos & No-diagnóstico | `src/core/guardrails/guardrails.js` | IEEE 7000 / IA Responsable (Pass/Fail) |
| **RF-04** | Previsualización y Ventana de Modificación | `src/app/index.js` & `index.html` | Supervisión médica obligatoria (HITL) |
| **RF-05** | Cola Store-and-Forward | `src/core/storage/offline_queue.js` | Resiliencia Offline |
| **RF-06** | Mapeo y serialización DHIS2 | `src/integrations/dhis2/dhis2_adapter.js` | Estándar global de salud pública |

---

## 6. Criterios de Aceptación del MVP para el Hackatón
1. **Flujo Demostrable Completo (User Journey de 4 Pantallas en Teléfono Simulado):**
   * Pantalla 1: Captura con Moonshine Voice / Selección de caso de prueba + Botón Demo 1-Click.
   * Pantalla 2: Inferencia Edge AI offline sin tráfico de red.
   * Pantalla 3: Previsualización de ficha clínica y ventana modal de ajuste con guardarraíles éticos y visto bueno médico.
   * Pantalla 4: Vista de cola Store-and-Forward y visualización del payload JSON oficial listo para DHIS2.
2. **Cumplimiento Ético Estricto:** Evidencia explícita en código y UI de que la herramienta actúa únicamente como asistente de documentación y no como prescriptor o diagnosticador autónomo.
N oficial listo para DHIS2.
2. **Cumplimiento Ético Estricto:** Evidencia explícita en código y UI de que la herramienta actúa únicamente como asistente de documentación y no como prescriptor o diagnosticador autónomo.
