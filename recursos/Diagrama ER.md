erDiagram
    %% ================= AUTH DB (Instancia PostgreSQL: Puerto 5433) =================
    %% Esquemas de Seguridad y Acceso
    auth_users ||--o{ auth_devices : "tiene (máx 3)"
    auth_users ||--o{ auth_refresh_tokens : "posee"
    auth_users ||--o{ auth_oauth_accounts : "vincula"
    admin_roles ||--o{ admin_permissions : "contiene"

    auth_users {
        UUID id PK
        string name
        string email UK "Único. Anonimizado en logs"
        string password_hash "Hash Bcrypt"
        date birth_date "Validación estricta >= 18 años"
        string role "Por defecto 'user'"
        boolean is_verified
        int_array genre_preferences "IDs de géneros favoritos (Recomendaciones)"
        timestamp created_at
        timestamp updated_at
    }
    auth_devices {
        UUID id PK
        UUID user_id FK
        string device_fingerprint
        string device_name
        string ip_address
        boolean is_active "Control Límite de dispositivos"
        timestamp last_seen
        timestamp created_at
    }
    auth_refresh_tokens {
        UUID id PK
        UUID user_id FK
        string device_id FK
        string token_hash UK
        timestamp expires_at
    }
    auth_oauth_accounts {
        UUID id PK
        UUID user_id FK
        string provider "ej. Google"
        string provider_account_id
    }
    admin_roles {
        UUID id PK
        string name UK "ej. CONTENT_ADMIN, AUDIT_ADMIN"
    }
    admin_permissions {
        UUID id PK
        UUID role_id FK
        string resource "ej. movies"
        string action "ej. create, delete"
    }

    %% ================= BUSINESS DB (Instancia PostgreSQL: Puerto 5432) =================
    
    %% Relaciones - Schema: catalog
    catalog_movies ||--o{ catalog_movie_genres : "clasificada_en"
    catalog_genres ||--o{ catalog_movie_genres : "agrupa"
    catalog_movies ||--o{ catalog_screenings : "tiene_funciones"
    catalog_rooms ||--o{ catalog_screenings : "alberga"
    catalog_rooms ||--o{ catalog_seats : "contiene_butacas"
    
    %% Relaciones - Schema: business
    catalog_screenings ||--o{ business_orders : "vende"
    business_orders ||--o{ business_tickets : "incluye"
    catalog_seats ||--o{ business_tickets : "asignada_a"

    %% Entidades Schema: catalog (HU-04, HU-05)
    catalog_movies {
        UUID id PK
        string title
        text synopsis
        string director
        int duration_min
        string rating_classification "ATP, +13, +16, +18"
        date release_date
        string poster_url
        string trailer_url
        boolean is_active "Soft delete"
        UUID created_by "FK Lógica -> auth_users.id"
        timestamp created_at
        timestamp updated_at
    }
    catalog_genres {
        int id PK
        string name UK "ej. Acción, Terror"
    }
    catalog_movie_genres {
        UUID movie_id PK,FK
        int genre_id PK,FK
    }
    catalog_rooms {
        int id PK
        string name
        int capacity
        json layout_json "{rows, cols}"
    }
    catalog_seats {
        UUID id PK
        int room_id FK
        string row
        int number
        string seat_type "standard, vip, disabled"
    }
    catalog_screenings {
        UUID id PK
        UUID movie_id FK
        int room_id FK
        timestamp start_time
        decimal price
        boolean is_active
    }

    %% Entidades Schema: business (HU-10, HU-11)
    business_orders {
        UUID id PK
        UUID user_id "FK Lógica -> auth_users.id"
        UUID screening_id FK
        decimal amount
        string payment_method "tarjeta | qr"
        string card_type "VISA, MC, AMEX, DISCOVER"
        string status "completed | refund_pending"
        timestamp created_at
    }
    business_tickets {
        UUID id PK
        UUID order_id FK
        UUID seat_id FK
        string qr_code_url
    }

    %% Entidades Schema: audit (HU-04, HU-06)
    audit_logs {
        UUID id PK
        UUID admin_user_id "FK Lógica -> auth_users.id"
        string admin_role
        string action_type "CREATE, UPDATE, DELETE"
        string target_entity "ej. movies, screenings"
        UUID target_id
        json changes_json "Snapshot Before/After"
        string ip_address "Anonimizada (RGPD)"
        timestamp created_at
    }

    %% ================= UGC STORE (MongoDB: Puerto 27017) =================
    %% Representación de las Colecciones NoSQL para trazabilidad de negocio (HU-13, HU-14, HU-19)
    ugc_ratings {
        ObjectId _id PK
        UUID user_id "FK Lógica -> auth_users.id"
        UUID movie_id "FK Lógica -> catalog_movies.id"
        int score "1 a 5 estrellas"
        timestamp updated_at
    }
    ugc_reviews {
        ObjectId _id PK
        UUID user_id "FK Lógica"
        UUID movie_id "FK Lógica"
        string text "Max 500 chars"
        boolean is_visible
        timestamp created_at
    }
    ugc_watchlist {
        ObjectId _id PK
        UUID user_id "FK Lógica"
        UUID movie_id "FK Lógica"
        timestamp added_at
    }
    ugc_recommendation_feedback {
        ObjectId _id PK
        UUID user_id "FK Lógica"
        UUID movie_id "FK Lógica"
        string action "dismiss"
        timestamp created_at
    }