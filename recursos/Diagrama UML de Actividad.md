stateDiagram-v2
    [*] --> IniciarCompra
    IniciarCompra --> VerificarEdad: Selecciona Función
    
    VerificarEdad --> BloquearAcceso: Edad < 18 (403)
    VerificarEdad --> CargarMapa: Edad >= 18
    BloquearAcceso --> [*]
    
    CargarMapa --> SeleccionarButacas
    SeleccionarButacas --> ValidarDisponibilidad: Enviar POST /reserve
    
    ValidarDisponibilidad --> SeleccionarButacas: Error (Ya reservadas por otro)
    ValidarDisponibilidad --> BloquearButacas: Disponibles
    
    BloquearButacas --> IngresarPago: Reserva SETNX en Redis (10 min)
    
    IngresarPago --> ValidarLuhn
    ValidarLuhn --> IngresarPago: Luhn Inválido / Expirada
    ValidarLuhn --> ProcesarTransaccion: Datos válidos
    
    state ProcesarTransaccion {
        CrearOrden --> GenerarTickets
        GenerarTickets --> ActualizarBD
    }
    
    ProcesarTransaccion --> RevertirReserva: Error en BD (Rollback)
    RevertirReserva --> SeleccionarButacas: "Reserva Expiró/Falló"
    
    ProcesarTransaccion --> GenerarQR: Éxito (Commit)
    GenerarQR --> LiberarRedis
    LiberarRedis --> MostrarConfirmacion
    MostrarConfirmacion --> [*]