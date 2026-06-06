sequenceDiagram
    autonumber
    actor U as Usuario Registrado
    participant F as Frontend (React)
    participant API as RecController (FastAPI)
    participant Mongo as UGC Store (Mongo)
    participant Redis as Redis (Cache)

    U->>F: Clic en "X" (Descartar película)
    F->>F: Optimistic UI (Oculta tarjeta)
    F->>API: POST /recommendations/feedback {movie_id, action: "dismiss"}
    API->>Mongo: INSERT feedback {user_id, movie_id, dismiss}
    Mongo-->>API: Acknowledged
    API->>Redis: DEL recs:{user_id} (Invalida caché)
    Redis-->>API: Deleted
    API-->>F: 201 Created