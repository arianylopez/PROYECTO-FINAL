# ADR-007: Eliminación de Sentry y Adopción de Logs Estructurados JSON Internos

**Estado:** Aceptada  
**Fecha:** 2026-06-23  

## Contexto
Para garantizar la mantenibilidad y la salud de un sistema modular compuesto por diversos dominios, una pieza fundamental es la **Observabilidad**. Cuando ocurre un error 500 en producción, especialmente uno originado por dependencias en cascada entre módulos, el desarrollador necesita conocer el contexto (el input exacto, los ids de rastreo, el usuario, la consulta fallida y el stack trace) sin demoras.

El planteamiento inicial era inyectar globalmente el SDK del popular servicio de monitoreo en la nube externo, **Sentry** (tanto en Frontend como en los micro-módulos del Backend). No obstante, decisiones operativas de la rúbrica excluyeron el uso obligatorio de herramientas y tableros externos, obligando a re-pensar la solución.

Las alternativas pasaron por:
1. Volver al método de logging crudo en crudo estándar tradicional en Python `import logging; logger.info("Usuario hizo X")`.
2. Estructurar nuestro propio formato de Logs en crudo pero como objetos inmutables de JSON, que contengan identificadores de rastreo transversales, para emular la capacidad de un agregador externo.

## Decisión
Hemos decidido descartar de plano el servicio administrado externo de Sentry. A cambio, todas las aplicaciones y módulos desarrollados adoptarán un paradigma de **Logging Estructurado Interno en formato JSON**. 

En lugar de textos en crudo, cada impresión en consola emite un JSON estrictamente estructurado que contiene llaves de control como:
```json
{
  "timestamp": "2026-06-23T15:30:10.123Z",
  "level": "ERROR",
  "module": "business_api",
  "event": "seat_reservation_failed",
  "trace_id": "b9x3l9-88fjkl-12jjd9",
  "user_id": "10099382",
  "duration_ms": 110,
  "error": "RedisConnectionError: Host unreachable"
}
```
Esto se inyectará transversalmente a nivel Middleware de FastAPI y Django para atrapar cada error global de los endpoints sin escribir bloques try-catch repetitivos a lo largo de cada vista. Las entradas se dirigen explícitamente hacia el canal de salida estándar del sistema operativo (stdout) a cargo de Docker.

## Consecuencias

### Positivas
- **Independencia Completa de Servicios Externos:** No nos atamos a una plataforma específica ni lidiamos con latencias de red por envíos de datos analíticos a servidores extranjeros. Toda la lógica de diagnóstico vive y muere en nuestro Docker.
- **Portabilidad Excepcional:** Al convertir el output del servidor en flujos puros de JSON estándar de una línea, el archivo es 100% portable y está preparado (future-proof) por si el día de mañana deseamos inyectarlo a la fuerza bruta dentro de un agregador tradicional como el Elastic Stack (Logstash, Kibana) o Grafana Loki, sin necesidad de reprogramar un solo módulo en nuestro código.
- **Seguridad en Datos Personales enmascarados:** Tenemos control pleno sobre qué viaja al log. Se ha programado por diseño que antes de exportarse, todas las contraseñas enviadas en los cuerpos, y todos los números de tarjetas se enmascaren internamente.

### Negativas
- **Carencia de Paneles de Visualización (Dashboards):** Sin Sentry, Kibana o similares, la única manera de revisar el rastreo de fallos en desarrollo actual será utilizando la interfaz básica de logs del terminal (`docker compose logs -f`) e inspeccionando texto con herramientas de comando (`grep` o `jq`). Identificar tendencias visuales a partir de un error crónico, sin herramientas visuales out-of-the-box, resulta tedioso.
- **Consumo Exponencial de Almacenamiento:** Un sistema fuertemente tipado en JSON resulta sumamente verborrágico y puede hacer crecer los volúmenes de logs en el entorno de desarrollo a una gran velocidad. Se hace necesario gestionar reglas de borrado automático de los registros por parte del demanio Docker.
