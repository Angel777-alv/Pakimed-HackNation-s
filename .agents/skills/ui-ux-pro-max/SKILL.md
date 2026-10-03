---
name: ui-ux-pro-max
description: UI/UX design intelligence by Next Level Builder for web, mobile, and desktop interfaces. Provides 67+ UI styles, 192 product palettes, 74 font pairings, 119 UX guidelines, touch targets, dark mode contrast, accessibility (WCAG AA), and pre-delivery checklists.
---

# UI/UX Pro Max - Design Intelligence (Next Level Builder)

Esta skill proporciona inteligencia de diseño profesional de UI/UX para crear, auditar y pulir interfaces atractivas, accesibles y con alta tasa de conversión, evitando plantillas genéricas.

## Cuándo Aplicar Esta Skill
Aplica esta skill al diseñar páginas, componentes, temas de color, tipografía, layouts responsive, micro-animaciones o al auditar accesibilidad y ergonomía táctil en el proyecto.

---

## Matriz de Prioridad de Reglas UI/UX

| Prioridad | Categoría | Impacto | Regla Clave (Must-Have) | Anti-Patrones a Evitar |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Accesibilidad (a11y)** | CRÍTICO | Contraste mínimo 4.5:1 (WCAG AA), `aria-label` en botones con solo icono, soporte de teclado y foco visible. | Eliminar anillos de foco, botones sin label accesible. |
| **2** | **Touch & Interacción** | CRÍTICO | Tamaño de objetivo táctil mínimo de **44×44px** (óptimo 48×48px), espaciado >8px, retroalimentación táctil activa. | Depender exclusivamente de `:hover` para móviles, estados sin transición (0ms). |
| **3** | **Rendimiento & Layout** | ALTO | Layout mobile-first, sin scroll horizontal involuntario, prevención de saltos de contenido (CLS < 0.1). | Anchos fijos en píxeles que rompen en pantallas pequeñas. |
| **4** | **Estilo y Coherencia** | ALTO | Consistencia visual: paleta de diseño definida en CSS variables, iconos SVG limpios (evitar emojis como iconos de UI). | Mezcla aleatoria de estilos visuales no armónicos. |
| **5** | **Tipografía y Color** | MEDIO | Base de texto ≥16px para inputs (evita auto-zoom en iOS), `line-height: 1.5`, tokens semánticos claros. | Texto de cuerpo <12px, gris sobre gris sin contraste. |
| **6** | **Micro-animaciones** | MEDIO | Duraciones de 200-300ms con curvas de aceleración naturales (`cubic-bezier`), respeto a `prefers-reduced-motion`. | Transiciones infinitas o lentas que entorpecen la agilidad del médico. |
| **7** | **Formularios & Feedback** | MEDIO | Labels siempre visibles (nunca depender solo de `placeholder`), validaciones claras cerca del campo. | Mensajes de error crípticos o alejados del input. |

---

## Paleta y Sistema de Diseño Recomendado para Pakimed (Salud / Edge AI)
* **Background Primario:** `#0b132b` (Slate Profundo)
* **Superficie de Tarjetas:** `rgba(28, 37, 65, 0.85)` con `backdrop-filter: blur(16px)`
* **Acento Principal (Cian Clínico):** `#48cae4` / `#00b4d8`
* **Confirmación / Éxito:** `#10b981` (Emerald)
* **Alerta Ética / Baja Confianza:** `#f59e0b` (Warm Amber)
* **Tipografía:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`

---

## Checklist de Pre-Entrega UI/UX
- [ ] ¿Los botones principales son fáciles de presionar en teléfonos con una sola mano?
- [ ] ¿El texto es perfectamente legible bajo cualquier condición de luz?
- [ ] ¿Los estados de carga e inferencia comunican progreso claramente?
- [ ] ¿La interfaz se adapta sin deformaciones a cualquier ancho de pantalla?
