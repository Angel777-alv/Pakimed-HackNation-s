# Reglas de Seguridad y Guardarraíles Éticos de Pakimed

## 1. Regla Absoluta de No Diagnóstico
- **Cero Diagnóstico:** La IA **NUNCA** debe inferir diagnósticos, recomendar tratamientos médicos ni evaluar imágenes médicas.
- **Rol Estricto:** La IA actúa únicamente como un transcriptor y estructurador de la información clínica explícitamente dictada por el médico.
- Si en el dictado no se menciona explícitamente un campo o valor, la IA no debe asumir ni deducir información médica.

## 2. Human-in-the-Loop Obligatorio
- **Sin Guardado Automático:** Ningún registro puede ser persistido ni enviado al servidor sin la revisión y aprobación explícita de un profesional de la salud.
- **Manejo de Baja Confianza:** Cuando la confianza del modelo en una entidad o término médico sea baja (o ambigua), el campo debe marcarse claramente como pendiente o dejarse en blanco, requiriendo entrada manual para evitar alucinaciones.

## 3. Privacidad y Soberanía de Datos
- Todo el procesamiento de voz y extracción NLP se realiza 100% en el dispositivo (Edge AI).
- Ningún dato de salud sensible o audio debe ser transmitido a servidores de terceros para procesamiento en la nube.
