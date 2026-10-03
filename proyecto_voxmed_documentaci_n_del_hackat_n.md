# Proyecto: Pakimed - Asistente de Registro Clínico Offline
**Reto:** Small AI for Development - Sector Salud (Global AI Hackathon 2026)

---

## 1. Título y Resumen del Proyecto
*   **Nombre del prototipo:** Pakimed (Asistente de Registro Clínico por Voz)
*   **Problem Statement (Declaración del problema):** 
    *Because of this tool, [médicos rurales y trabajadores de la salud] will [reducir el tiempo de administración y documentar consultas eficientemente] by [el final de su turno]; we know this because [las clínicas están sobrepobladas y los pesados requisitos de mantenimiento de registros limitan el tiempo de atención que pueden dedicar a cada paciente].*

## 2. Contexto y Problemática (El Escenario)
Las clínicas rurales operan bajo condiciones de extrema presión. Los pacientes enfrentan largas esperas debido a la sobrepoblación y la calidad de la atención se ve afectada por el tiempo limitado que los médicos pueden dedicar a cada persona. Gran parte de este tiempo es consumido por las pesadas cargas de registro manual de datos de los pacientes. Además, la infraestructura tecnológica es limitada:
*   Carecen de conexión Wi-Fi estable.
*   Dependen de teléfonos móviles convencionales o smartphones de gama de entrada con paquetes de datos 3G intermitentes.

## 3. La Solución Propuesta
Pakimed es un Asistente de Registro Clínico que opera completamente offline en el teléfono del médico. Permite al trabajador de la salud dictar un resumen de la consulta (síntomas, signos vitales, medicación recetada) en su idioma local. La aplicación procesa el audio localmente, extrae las entidades médicas clave y autocompleta el formulario del paciente.
*   **Justificación de la IA (Por qué no usar algo más simple):** Un SMS, un formulario web o una hoja de cálculo no resuelven el cuello de botella principal: el tiempo de entrada manual de datos. Usar un modelo pequeño de Inteligencia Artificial (Speech-to-Text y NLP ligero) elimina la fricción de escribir en teclados pequeños, permitiendo al médico hablar de forma natural y ahorrar minutos valiosos por cada paciente.

## 4. Funcionalidades Clave y Arquitectura Técnica
*   **Reconocimiento de voz (Speech Recognition):** Transcripción automática de voz a texto optimizada para idiomas locales, procesada directamente en el dispositivo.
*   **Procesamiento Edge AI (On-device):** El modelo de IA (SLM - Small Language Model) se descarga ("side-loaded") y se ejecuta 100% offline. Esto garantiza la operatividad sin importar el estado de la red.
*   **Sincronización "Store-and-forward":** Los expedientes generados se guardan localmente en el dispositivo de forma encriptada. Cuando el teléfono detecta señal (ej. cuando el médico compra un paquete 3G), los datos se empaquetan y se envían.
*   **Ajuste institucional (DHIS2):** Los datos estructurados por la IA están formateados para integrarse directamente en **DHIS2**, la plataforma estándar de información de salud utilizada en más de 70 países.

## 5. Criterios de Seguridad, Reglas y Restricciones (Guardarraíles)
Para cumplir estrictamente con los criterios de evaluación de "IA Responsable" (Pass/Fail) y mitigar riesgos:
*   **Regla estricta de No Diagnóstico:** La herramienta *nunca* infiere enfermedades, no evalúa imágenes médicas y no sugiere tratamientos. Actúa exclusivamente como un transcriptor y estructurador de la información clínica que el médico dicta.
*   **Human-in-the-loop y Fail-safe:** La IA no guarda registros automáticamente. Presenta en pantalla el texto extraído para que el médico lo lea, edite si hay errores, y dé el visto bueno (aprobación humana). Si la IA tiene baja confianza en una palabra (ej. nombres raros de medicamentos), deja el espacio en blanco y pide explícitamente al médico que lo ingrese manualmente (evitando alucinaciones).
*   **Privacidad de Datos:** Al realizar todo el procesamiento de inferencia de la IA de manera offline, los datos sensibles no viajan a servidores de terceros para ser analizados, reduciendo dramáticamente las vulnerabilidades de ciberseguridad.

## 6. Datos y Modelos (Datasets)
El proyecto se fundamenta y utilizará los siguientes recursos de datos permitidos:
*   **Para el idioma (Entrenamiento/Fine-tuning de voz):** *Mozilla Common Voice* o *MMS (Meta)*, como base para comprender idiomas locales y acentos de bajos recursos.
*   **Para el ecosistema de salud:** Documentación y esquema de datos de demostración de *DHIS2* para estructurar correctamente los campos de salida (JSON/XML) que la aplicación generará.
