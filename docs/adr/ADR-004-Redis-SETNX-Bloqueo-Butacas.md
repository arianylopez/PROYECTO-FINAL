# ADR-004: Bloqueo de Butacas usando Redis SETNX

**Estado:** Aceptada  
**Fecha:** 2026-06-23  

## Contexto
En una plataforma de cine, el proceso de **checkout y reserva de butacas** es la funcionalidad transaccional más crítica. Múltiples usuarios podrían estar mirando el plano de una misma sala para la misma función e intentando reservar la misma butaca exacta al mismo tiempo.
El sistema requiere garantizar de forma absoluta que no exista **double booking** (sobreventa del mismo asiento) cuando varios usuarios aprietan "Continuar al pago" concurrentemente. 

Las alternativas analizadas fueron:
1. **Pessimistic Locking en SQL:** Usar un `SELECT ... FOR UPDATE` en PostgreSQL para bloquear la butaca en la tabla durante los 10 minutos de gracia del proceso de compra.
2. **Lock Distribuido o Semáforos lógicos en Memoria (Redis).**

Puesto que el proceso de pago no es instantáneo, el usuario recibe 10 minutos para llenar sus datos (reserva temporal). Mantener un bloqueo a nivel de base de datos relacional (Pessimistic Locking) abierto durante 10 minutos por cada usuario intentando comprar en un fin de semana de gran estreno saturaría severamente las conexiones (connection pool exhaust) del PostgreSQL, degradando el rendimiento general.

## Decisión
Hemos decidido implementar el control de concurrencia y reserva de butacas mediante la operación atómica de Redis **`SETNX`** (Set if Not eXists).

El proceso de backend funciona así:
1. Cuando un usuario reserva butacas, el sistema realiza una operación `SETNX reservation:{screening_id}:{seat_id} {user_id} EX 600` por cada butaca en Redis.
2. Si cualquiera de estas operaciones devuelve `0` (la llave ya existía), significa que alguien más bloqueó el asiento milisegundos antes. La transacción lógica de ese request falla inmediatamente, se cancelan los *locks* ya obtenidos para ese usuario (rollback atómico o borrado manual), y se informa al usuario mediante código HTTP 409 (Conflicto).
3. El parámetro `EX 600` configura un Time-To-Live (TTL) automático de 10 minutos (600 segundos). Pasado ese tiempo, Redis elimina la clave automáticamente, liberando la butaca para el resto del público sin necesidad de correr scripts secundarios o cronjobs pesados en base de datos.
4. Si el pago es exitoso, el sistema inserta las butacas confirmadas en PostgreSQL permanentemente y elimina explícitamente los *locks* de Redis.

## Consecuencias

### Positivas
- **Evita la sobreventa con altísima velocidad:** Redis opera completamente en memoria, siendo capaz de gestionar miles de operaciones atómicas SETNX por segundo, haciendo frente a concurrencia intensiva (ej: lanzamiento de entradas para *Spider-Man*) sin ningún problema de latencia notable ni riesgo de condición de carrera (race conditions).
- **Protección del Connection Pool Relacional:** PostgreSQL ya no carga con la responsabilidad de mantener las butacas "temporales". Solo interviene al final del flujo, cuando el pago ya está simulado y autorizado, para persistir permanentemente los datos en disco, salvando una enorme cantidad de capacidad operativa.
- **Limpieza de Recursos (Self-Healing):** El uso de TTLs previene butacas secuestradas permanentemente ("zombie seats") por usuarios que cerraron el navegador o perdieron conexión, garantizando que el inventario retorne de manera automática y natural al mercado.

### Negativas
- **Persistencia Volátil Exponencial:** A diferencia del bloqueo transaccional rígido de SQL, Redis funciona principalmente en RAM. Si el servidor Redis sufre una caída (crash) catastrófica y reinicia sin snapshot guardado, se perderían temporalmente todos los bloqueos en curso de los usuarios que estaban escribiendo su número de tarjeta. Al reanudar operaciones, esas butacas temporalmente bloqueadas se liberarían antes de los 10 minutos pautados.
*(Para propósitos académicos de un sistema sin pasarelas externas en la vida real, se consideró que este riesgo es totalmente aceptable en función del enorme beneficio en rendimiento y limpieza que provee).*
