# ADR-003: FastAPI para módulos asíncronos y Django para Admin

**Estado:** Aceptada  
**Fecha:** 2026-06-23  

## Contexto
El sistema CinemaPlus tiene necesidades funcionales muy heterogéneas.
Por un lado, el módulo del **Catálogo Público**, **Negocio**, **Actividad de Usuario (UGC)** y **Recomendaciones** requieren servir a miles de usuarios simultáneamente. Deben ser capaces de manejar I/O concurrente, integrarse con caches como Redis de baja latencia (p95 < 100ms) y resolver respuestas masivas en tiempos muy ajustados sin bloquear hilos.

Por otro lado, el **Panel Administrativo** requiere un ecosistema maduro, seguro y estandarizado para que los administradores puedan crear y editar entidades, configurar salas, ver métricas y gestionar los logs de auditoría visualmente, sin tener que construir interfaces web complejas y APIs CRUD repetitivas desde cero.

Se analizó utilizar un solo framework para todos los módulos (por ejemplo, construir todo el sistema y la administración en FastAPI + React o construir absolutamente todo el backend en Django).

## Decisión
Se decidió utilizar una estrategia de frameworks dentro de Python:
- **FastAPI** para todos los módulos de alta concurrencia (`auth`, `catalog`, `business`, `ugc`, `recommendations`), impulsado por su naturaleza asíncrona (`asyncio`), inyección de dependencias flexible, generación automática de OpenAPI y alto rendimiento.
- **Django** dedicado exclusivamente al panel administrativo (`admin`), debido a la solidez de su "Django Admin" integrado que nos permite desplegar paneles de control visuales robustos de forma casi inmediata (out-of-the-box).

Ambos sistemas conviven bajo el mismo ecosistema desplegado e interactúan con la misma base de datos `BusinessDB`.

## Consecuencias

### Positivas
- **Elección de herramienta óptima por tarea:** Aprovechamos la potencia de FastAPI para I/O concurrente y serialización de JSON con Pydantic en milisegundos, logrando los SLAs exigidos en los endpoints de usuario. Al mismo tiempo, nos ahorramos semanas de trabajo de programación Frontend y Backend en los paneles de control gracias al soporte y madurez del Django Admin y la personalización estética de django-jazzmin.
- **Validación robusta:** Pydantic y FastAPI aseguran contratos fuertemente tipados en las interfaces de cara al cliente.
- **Separación arquitectónica estricta:** Al usar distintos frameworks, se fuerzan automáticamente las fronteras entre el módulo de administración y los módulos de cara al cliente final, disminuyendo el riesgo de cruces de dominio indeseados.

### Negativas
- **Dos Frameworks en un proyecto:** Aumenta la complejidad técnica del equipo de desarrollo, quienes deben estar familiarizados o aprender simultáneamente tanto los patrones asíncronos y el ORM de SQLAlchemy (usado en FastAPI) como los patrones sincrónicos y el ORM de Django.
- **Mantenimiento duplicado de modelos:** Las definiciones de base de datos se manejan con Django ORM por un lado (para el panel admin) y con SQLAlchemy o consultas directas para FastAPI. Las migraciones de esquemas quedan delegadas principalmente al framework de Django, y SQLAlchemy confía en el esquema resultante, lo que requiere estricta comunicación dentro del equipo y rigurosos tests de integración.
