# ADR-002: Dos instancias PostgreSQL (AuthDB y BusinessDB)

**Estado:** Aceptada  
**Fecha:** 2026-06-23  

## Contexto
El sistema CinemaPlus gestiona información de diversas naturalezas. Por un lado, maneja datos sumamente sensibles que pertenecen a la **Identidad y Acceso** de los usuarios (contraseñas *hasheadas*, huellas de dispositivos, información personal de edad, roles administrativos). Por otro lado, maneja los **Datos Operativos** de alto tráfico (catálogo de películas, funciones, reserva de butacas, órdenes de compra y logs de auditoría).

Al definir la arquitectura de base de datos relacional para el Monolito Modular, se presentaron las siguientes alternativas:
1. Una única base de datos PostgreSQL y un único esquema (`public`).
2. Una única base de datos PostgreSQL, pero separada lógicamente mediante esquemas (`schema auth`, `schema catalog`, `schema business`).
3. Dos instancias/bases de datos PostgreSQL físicas separadas.

## Decisión
Hemos decidido implementar **Dos instancias PostgreSQL separadas**:
1. **AuthDB** (Puerto 5433): Dedicada exclusivamente al módulo `modules/auth/`. Requerirá conexión SSL obligatoria y manejará los datos de identidad.
2. **BusinessDB** (Puerto 5432): Dedicada al resto de los módulos operativos (`admin`, `business`, `catalog`, etc.).

Para asegurar la relación entre entidades, los módulos operativos que necesitan referenciar a un usuario no utilizan *Foreign Keys* (FK) físicas hacia la tabla de usuarios, sino que almacenan el `user_id` (UUID) de manera escalar, y la identidad se comprueba de manera *stateless* decodificando el token JWT provisto por el usuario.

## Consecuencias

### Positivas
- **Aislamiento de Seguridad Crítico:** Los datos de contraseñas y dispositivos de los usuarios quedan completamente protegidos de posibles vulnerabilidades (por ejemplo, SQL Injections) que pudieran ocurrir en los módulos operativos o en la generación de reportes analíticos. Si el BusinessDB es comprometido, las identidades permanecen seguras.
- **Independencia de Carga y Afinación (Tuning):** AuthDB recibe cargas de trabajo bajas pero requiere alta consistencia y lecturas rápidas para validación de tokens/devices. BusinessDB soporta una carga transaccional pesada (pagos, butacas, reservas) y concurrencia alta. Al estar separadas físicamente, los cuellos de botella de I/O de disco de la cartelera no afectarán el tiempo de respuesta del inicio de sesión, y viceversa.
- **Resiliencia ante Fallos Parciales:** Si la BusinessDB se cae o se reinicia por mantenimiento, el servicio de autenticación sigue operando para emitir tokens, renovar sesiones o desvincular dispositivos.

### Negativas
- **Complejidad Operativa:** Mantenemos, monitoreamos y hacemos copias de seguridad (backups) de dos servicios de bases de datos diferentes dentro del entorno en lugar de uno.
- **Incapacidad de uso de Foreign Keys Físicas:** Como no comparten el mismo motor de BD, no podemos crear restricciones referenciales directas entre `business_orders` y `auth_users`. Se requiere disciplina para que la integridad referencial dependa de la aplicación.
- **Complejidad en Queries:** No es posible hacer comandos `JOIN` entre información transaccional y perfiles de usuario. Por ejemplo, si el panel de administrador requiere cruzar compras con correos electrónicos, deberá hacer dos consultas separadas en memoria (una a AuthDB y otra a BusinessDB) o apoyarse en el token.
