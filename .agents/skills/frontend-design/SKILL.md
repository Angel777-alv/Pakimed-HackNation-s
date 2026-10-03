---
name: frontend-design
description: Directrices avanzadas de ingeniería UI/UX para construir interfaces web distintivas, accesibles, de alto impacto estético y optimizadas para interacción táctil en dispositivos móviles.
---

# Frontend Design & UI/UX Excellence Skill

Esta skill guía al agente para crear interfaces de usuario de calidad profesional, evitando plantillas genéricas o diseños monótonos.

## Principios de Diseño Visual

### 1. Paleta de Color Curada y Tematización
- Define un sistema de diseño con variables CSS (`:root`) para fondos, superficies, bordes, acentos y estados semánticos (éxito, advertencia, peligro).
- Para aplicaciones médicas como Pakimed:
  - **Superficie Principal:** Tonos azul noche / pizarra profundo (`#0b132b`, `#1c2541`).
  - **Acentos:** Cian médico (`#48cae4`), Turquesa vibrante (`#00b4d8`), Verde esmeralda de confirmación (`#10b981`).
  - **Alertas Éticas:** Ámbar cálido (`#f59e0b`) para baja confianza y revisiones manuales.

### 2. Tipografía y Jerarquía Visual
- Utiliza fuentes modernas y legibles (`Inter`, `Plus Jakarta Sans`, `Roboto`).
- Jerarquía tipográfica estricta: un único `<h1>` por pantalla, subtítulos informativos y labels de alta visibilidad.
- Espaciado armónico con escalas de 4px/8px (padding, margins, gaps).

### 3. Enfoque Mobile-First y Ergonomía Táctil
- Los botones primarios de acción táctil (ej. botón de micrófono y botón de aprobación) deben tener un tamaño mínimo de **48x48px** para interacción con una sola mano.
- Formularios compactos pero espaciosos, con inputs de altura táctil adecuada (mínimo 44px) y contraste accesible (WCAG AA).

### 4. Micro-interacciones y Estados de Carga
- Proporciona retroalimentación inmediata en cada acción del usuario:
  - Ondas de pulso al grabar audio.
  - Indicadores sutiles de inferencia on-device.
  - Transiciones suaves (`cubic-bezier(0.4, 0, 0.2, 1)`) entre pantallas.
