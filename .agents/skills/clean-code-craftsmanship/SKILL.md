---
name: clean-code-craftsmanship
description: Guía de buenas prácticas de Clean Code, principios SOLID, diseño modular, refactorización y artesanía de software para el desarrollo de código legible, mantenible y robusto.
---

# Clean Code & Software Craftsmanship Skill

Esta skill instruye al agente en la aplicación rigurosa de principios de calidad de software y código limpio durante todo el ciclo de desarrollo.

## Principios Fundamentales

### 1. Regla de Responsabilidad Única (SRP)
- Cada módulo, clase y función debe tener una única razón para cambiar.
- Las funciones deben hacer **una sola cosa** y hacerla de manera predecible.
- Longitud recomendada de funciones: menos de 25-30 líneas.

### 2. Nombrado Semántico y Expresivo
- Utiliza nombres que revelen la intención de negocio (ej. `hasAutonomousDiagnosticAttempt()` en lugar de `checkText()`).
- Evita abreviaturas crípticas o nombres genéricos como `data`, `item`, `temp`, `info` a menos que su contexto sea trivial.
- Funciones booleanas deben iniciar con verbos predicativos: `isValid`, `isPendingSync`, `canSendBatch`.

### 3. Principio DRY (Don't Repeat Yourself) & KISS (Keep It Simple, Stupid)
- Centraliza la lógica repetitiva en utilidades modulares.
- No sobreingenierices: prefiere soluciones directas y transparentes frente a abstracciones prematuras complejas.

### 4. Funciones Puras y Manejo de Efectos Secundarios
- Separa la lógica de procesamiento y transformación de datos (funciones puras y testeables) de la capa de persistencia (I/O, IndexedDB, eventos de red).
- Evita mutaciones directas de objetos pasados por parámetro; usa inmutabilidad y clones cuando sea apropiado.

### 5. Manejo Defensivo y Elegante de Errores
- Valida entradas al inicio de las funciones (guard clauses).
- No ocultes errores silenciosamente; regístralos con contexto descriptivo y devuelve estados claros (`{ success: false, error: ... }`).

### 6. Estructura de Archivos y Modularidad
- Cada archivo representa una responsabilidad lógica clara.
- Usa ES Modules (`import`/`export`) explícitos.
