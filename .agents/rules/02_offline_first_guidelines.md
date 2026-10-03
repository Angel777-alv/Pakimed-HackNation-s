# Pautas Offline-First y Store-and-Forward

## 1. Filosofía Edge AI & Offline
- La aplicación debe ser 100% funcional sin conexión a Internet (PWA con Service Workers y almacenamiento local).
- Inferencia de voz y lenguaje local (simulada o ejecutada en on-device SLM).

## 2. Cola Store-and-Forward
- Los registros validados y firmados por el médico se encolan localmente en estado `PENDING_SYNC`.
- Los datos almacenados localmente deben estar encriptados o en sandbox seguro.
- La aplicación debe detectar eventos de red (`navigator.onLine`, reconexiones 3G/Wi-Fi) para sincronizar en lotes hacia los endpoints de DHIS2.
- Manejo de reintentos con retroceso exponencial (exponential backoff) ante fallas de red intermitentes.

## 3. Compatibilidad DHIS2
- Todo payload enviado debe cumplir con el formato estándar de eventos / Tracker de DHIS2 (`trackedEntityInstances` o `events`).
