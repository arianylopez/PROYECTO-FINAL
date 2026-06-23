# ADR-001: Monolito Modular vs. Microservicios

**Estado:** Aceptada  
**Fecha:** 2026-06-23  

## Contexto
El proyecto final requiere la construcción de una plataforma de servicios completa en funcionalidades, con módulos que cubren responsabilidades distintas pero interconectadas:
1. **Identidad y Acceso (Auth):** Gestión de usuarios, sesiones y roles.
2. **Administración (Admin):** Mantenimiento del catálogo de películas y funciones.
3. **Catálogo y Búsqueda (API Pública):** Exploración de cartelera optimizada para lectura rápida.
4. **Negocio (Business):** Reservas de butacas, control de concurrencia y flujo de checkout.
5. **Actividad del Usuario (UGC):** Reseñas, calificaciones y listas de favoritos.
6. **Recomendaciones:** Lógica predictiva basada en historiales de usuario.

Las opciones de diseño arquitectónico a gran escala consideradas fueron:
1. **Microservicios distribuidos:** Desplegar cada módulo de manera independiente con su propio repositorio, base de datos exclusiva y comunicación estricta a través de red (HTTP/gRPC/Colas de mensajes).
2. **Monolito tradicional:** Todo el código acoplado sin límites estrictos, lo que habitualmente resulta en el antipatrón de "Big Ball of Mud".
3. **Monolito Modular:** Todo el código reside en un solo repositorio y se despliega como una única unidad funcional, pero internamente el código está separado en módulos con responsabilidades limitadas, fronteras explícitas y comunicación en memoria.

## Decisión
Adoptamos una **Arquitectura de Monolito Modular**.
Hemos diseñado el sistema para que conviva dentro de una misma aplicación (utilizando un solo despliegue con `docker-compose`), pero con divisiones estrictas por dominios funcionales (cada módulo vive en su propio directorio `modules/` y expone únicamente las interfaces o *endpoints* permitidos). Para garantizar el respeto a estas fronteras, nos apoyamos en herramientas de validación de arquitectura como `import-linter` en Python y los boundaries de ESLint en el Frontend. 

## Consecuencias

### Positivas
- **Despliegue y Orquestación Simples:** Solo necesitamos orquestar un servidor de aplicaciones principal con sus respectivas bases de datos de respaldo y workers, en lugar de mantener N microservicios, lo que acelera enormemente el ciclo de desarrollo (el famoso `docker-compose up` levanta el sistema completo).
- **Rendimiento Mejorado entre Módulos:** Como los módulos se comunican dentro del mismo proceso de red/servidor (in-process) o vía bases de datos rápidas en la misma red local de Docker, eliminamos la latencia de red inherente a las comunicaciones entre microservicios (no sufrimos el recargo de serialización/deserialización HTTP constante entre backend-a-backend).
- **Fácil Refactorización y Debugging:** Encontrar la raíz de un error es más directo usando stack traces convencionales. Los tests de integración abarcan el sistema completo sin requerir entornos falsos (mocking de servicios distribuidos complejos).
- **Escalabilidad Preparada:** Al haber aislado las lógicas en módulos y haber optado por esquemas/bases de datos separadas (ADR-002), el monolito modular es fácilmente divisible en el futuro. Si el módulo de Recomendaciones requiere más capacidad de cómputo, puede ser extraído a un microservicio independiente casi sin esfuerzo refactorizador.

### Negativas
- **Escalamiento Acoplado:** No podemos escalar el módulo de Auth de forma independiente al módulo de Catálogo. Si la API pública recibe un pico masivo de tráfico, deberemos escalar horizontalmente la totalidad del monolito (creando réplicas del contenedor entero).
- **Impacto de Errores Graves:** Un error crítico como un fallo de memoria (Memory Leak) o un bloqueo del hilo principal (Thread Blocking) causado por un solo módulo (ej. cálculos pesados del módulo de Recomendaciones) puede tirar abajo la instancia completa del monolito, afectando temporalmente la disponibilidad de los otros módulos.
- **Disciplina Estricta Requerida:** La frontera entre módulos es lógica, no física. Dependemos enteramente de nuestra disciplina como desarrolladores y de nuestras herramientas de integración continua (CI) para no violar el encapsulamiento importando métodos privados de otros módulos o haciendo JOINs en SQL entre esquemas prohibidos.
