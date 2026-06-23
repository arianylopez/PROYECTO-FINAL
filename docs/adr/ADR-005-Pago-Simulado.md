# ADR-005: Pago 100% Simulado (Sin Integración con Pasarela Real)

**Estado:** Aceptada  
**Fecha:** 2026-06-23  

## Contexto
El flujo principal de negocio en la plataforma de venta de tickets CinemaPlus requiere recolectar y procesar pagos por las butacas elegidas.
En un escenario productivo real, esto obligaría a integrarnos con un Proveedor de Servicios de Pago (Payment Service Provider o PSP) como Stripe, MercadoPago, PayPal, u otros motores de pago certificados mediante APIs externas de servidor a servidor (o utilizando SDKs de frontend). 

El proyecto final de la materia posee un alcance meramente académico, enfocado en evaluar la arquitectura general del sistema (monolito modular, integración de bases de datos, asincronía, reactividad en frontend y diseño de componentes) y no en el cumplimiento real comercial.

Las opciones de implementación fueron:
1. **Integrar el modo SandBox de un PSP:** Como Stripe Test Environment, que exige registrar credenciales, manejar webhooks y diseñar el manejo de eventos asíncronos para confirmar los pagos.
2. **Construir un Payment Simulator propio en memoria.**

## Decisión
Hemos decidido implementar la Opción 2: **Un Simulador de Pagos (`PaymentSimulator`) totalmente en memoria, construido desde cero dentro de nuestro módulo Business.** 
Este simulador:
- Emplea expresiones regulares (Regex) con los Bank Identification Numbers (BINs) mundiales más comunes para **detectar visualmente el tipo de tarjeta (Visa, MasterCard, Amex, Discover)** tanto en frontend como en el backend.
- Incorpora y exige la ejecución obligatoria del **algoritmo de suma de comprobación (Checksum) Modulo 10 de Luhn** a los números proporcionados para garantizar validez matemática.
- Verifica matemáticamente la no-caducidad de la fecha de vencimiento (`MM/YY`).
- Simula tiempos de procesamiento artificialmente para probar los estados de UI (loading spinners y bloqueos de interfaz).
- Cuenta con un modo demostrativo para simulación de generación y pago por código QR.

**Regla Estricta de Persistencia:** Queda terminantemente prohibido guardar números de tarjetas de crédito o códigos valorativos completos (CVV) en la base de datos `BusinessDB`. El sistema registrará la orden únicamente guardando el `card_type` detectado y los últimos cuatro dígitos de la tarjeta (ejemplo: `last4: 1234`), que es la práctica estándar del estándar de seguridad PCI-DSS.

## Consecuencias

### Positivas
- **Inexistencia de Riesgo de Seguridad Externa:** Como los datos de tarjeta nunca abandonan nuestro entorno (no hay llamadas a terceras partes en la red) y nunca se guardan en nuestro disco, nos libramos completamente de cumplir con las costosas normativas y auditorías del estándar PCI-DSS. No requerimos resguardar información crítica en esquemas protegidos extra.
- **Foco Central en Lógica de Flujo (Business Core):** En lugar de perder valioso tiempo académico descifrando documentación técnica y gestionando el ciclo de vida complejo de los webhooks provistos por Stripe, pudimos focalizar nuestros esfuerzos en perfeccionar los bloqueos concurrentes con Redis, el rollback seguro en caso de fallas y la generación de códigos QR propios.
- **Testeo Unitario Veloz:** Los tests unitarios no dependen de respuestas intermitentes o *rate-limiting* de servicios externos en Sandbox.

### Negativas
- **No Trasladable a Producción Comercial Directa:** Aunque el flujo cumple fielmente los requerimientos, si este sistema fuera liberado comercialmente mañana para venta real de boletos, todo el módulo de `PaymentSimulator` sería completamente inservible y tendría que ser arrancado y refactorizado de raíz por una integración real con un PSP real, lo cual en un contexto de startups representaría un trabajo grande de deuda técnica a saldar.
