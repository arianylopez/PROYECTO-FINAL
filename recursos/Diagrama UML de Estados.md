stateDiagram-v2
    [*] --> Disponible : Generación Automática (Room Layout)
    
    Disponible --> ReservadoTemporal : Usuario selecciona y envía /reserve
    
    ReservadoTemporal --> Disponible : TTL Expira (10 min) en Redis
    ReservadoTemporal --> Disponible : Usuario cancela / cierra pestaña
    
    ReservadoTemporal --> Vendido : Transacción de pago completada
    
    Vendido --> ReembolsoPendiente : Admin cancela la función (is_active = false)
    
    ReembolsoPendiente --> Disponible : Operador procesa reembolso