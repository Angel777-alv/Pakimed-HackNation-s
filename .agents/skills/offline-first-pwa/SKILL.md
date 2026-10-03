---
name: offline-first-pwa
description: Patrones de arquitectura de software para aplicaciones Offline-First, persistencia local segura (IndexedDB/LocalStorage), colas Store-and-Forward y sincronización resiliente ante redes intermitentes.
---

# Offline-First & Resilient Storage Skill

Esta skill instruye al agente en el diseño y programación de aplicaciones que garantizan operatividad plena sin conexión a internet y sincronización asíncrona robusta.

## Patrón de Arquitectura Store-and-Forward

```text
[Acción de Guardado Médico]
            │
            ▼
[Persistencia Local en Cola (PENDING_SYNC)]
            │
            ├─▶ [Detector de Conectividad (online/offline/3G)]
            │            │
            │            ▼ (¿Hay Red?)
            │       ┌────┴────┐
            │       ▼         ▼
            │     [SÍ]      [NO]
            │       │         │
            │       │         └─▶ [Mantiene en Cola Local]
            ▼       ▼
[Envío en Lotes hacia DHIS2]
            │
            ▼ (Respuesta Exitosa)
[Marca Registro como SYNCED con ID Externo]
```

## Buenas Prácticas Técnicas

### 1. Manejo de Estados de Red
- Suscribirse a los eventos estándar de la Web API:
  - `window.addEventListener('online', ...)`
  - `window.addEventListener('offline', ...)`
  - `navigator.onLine`
- Proporcionar siempre un mecanismo manual de prueba / forzado de sincronización en la UI.

### 2. Estructura de Elementos en Cola
Cada registro en la cola local debe contar con metadata de trazabilidad:
```json
{
  "id": "vox_1727980000_abc12",
  "createdAt": "2026-10-03T12:00:00.000Z",
  "status": "PENDING_SYNC", // "PENDING_SYNC" | "SYNCED" | "FAILED"
  "retryCount": 0,
  "data": { ... },
  "syncedAt": null,
  "dhis2EventId": null
}
```

### 3. Reintentos con Retroceso Exponencial (Exponential Backoff)
- En caso de errores de red intermitentes durante el envío a DHIS2, incrementar el contador de intentos y esperar intervalos escalonados (ej. 2s, 4s, 8s).
- No descartar nunca un registro de la cola local hasta recibir confirmación HTTP 200/201 del servidor.
