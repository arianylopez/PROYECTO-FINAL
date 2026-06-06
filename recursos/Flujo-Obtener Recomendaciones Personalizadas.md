sequenceDiagram
    autonumber
    actor U as Usuario Registrado
    participant F as Frontend (React)
    participant API as RecController (FastAPI)
    participant Redis as Redis (Cache)
    participant Engine as RecEngine (NumPy)
    participant Mongo as UGC Store (Mongo)
    participant ES as Search (Elasticsearch)
    participant CH as Analytics (ClickHouse)

    U->>F: Accede al Home
    F->>API: GET /recommendations/me (JWT)
    API->>Redis: GET recs:{user_id}
    
    alt Cache Hit
        Redis-->>API: JSON Recomendaciones
    else Cache Miss
        Redis-->>API: null
        API->>Engine: get_personalized(user_id)
        Engine->>Mongo: Find ratings >= 4 & watchlist
        Mongo-->>Engine: Historial del usuario
        
        alt Usuario tiene historial
            Engine->>ES: Query movies by Top Genres (must_not: vistos/descartados)
            ES-->>Engine: Lista de Películas
            Engine->>Engine: Generar 'reason' (ej: "Porque te gusta Terror")
        else Usuario sin historial (Fallback)
            Engine->>CH: Query top 10 movies (last 7 days)
            CH-->>Engine: Películas en tendencia
            Engine->>Engine: Generar 'reason' ("Tendencia esta semana")
        end
        
        Engine-->>API: Recomendaciones Calculadas
        API->>Redis: SETEX recs:{user_id} 600 JSON
    end
    
    API-->>F: 200 OK (Lista Recomendaciones)
    F-->>U: Renderiza Carrusel Personalizado