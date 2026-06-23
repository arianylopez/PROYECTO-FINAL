workspace "CinemaPlus" "Arquitectura de la plataforma CinemaPlus" {

    model {
        // Actores
        visitor = person "Visitante" "Usuario no autenticado explorando la cartelera."
        user = person "Usuario Registrado" "Cliente con cuenta, mayor de 18 años, que compra entradas y califica."
        admin = person "Administrador" "Personal del cine (Content Admin, Operational Admin, etc)."

        // Sistemas externos
        googleOAuth = softwareSystem "Google OAuth" "Proveedor de identidad externo para Single Sign-On."

        // Sistema Principal
        cinemaPlus = softwareSystem "CinemaPlus Platform" "Plataforma de venta de entradas de cine, cartelera y recomendaciones." {
            
            // Contenedores Frontend
            frontendReact = container "Frontend React (SPA)" "Aplicación principal para usuarios y admins." "React 18, TypeScript, Vite" "Web Browser"
            frontendVanilla = container "Frontend Vanilla JS" "Aplicación secundaria comparativa." "Vanilla JS, Handlebars" "Web Browser"

            // Proxy
            nginx = container "Nginx Reverse Proxy" "Enruta tráfico al backend y sirve estáticos en producción." "Nginx"

            // Bases de Datos y Cache
            authDb = container "AuthDB" "Almacena identidades, usuarios, dispositivos y roles." "PostgreSQL 16 (Port 5433, SSL)" "Database"
            businessDb = container "BusinessDB" "Almacena películas, funciones, salas y órdenes." "PostgreSQL 16 (Port 5432)" "Database"
            redis = container "Redis Cache & Locks" "Caché de catálogo, TTL de reservas (SETNX) y sesiones." "Redis 7" "Cache"
            elastic = container "Elasticsearch" "Motor de búsqueda full-text para la cartelera." "Elasticsearch 8" "Search Engine"
            mongo = container "UGC Store" "Almacena calificaciones, reseñas y watchlist." "MongoDB 7" "NoSQL Database"
            clickhouse = container "Analítica" "Almacena métricas de ventas y vistas." "ClickHouse 24" "Data Warehouse"

            // Workers
            celeryWorker = container "Celery ETL Worker" "Sincroniza datos de PostgreSQL a Elasticsearch." "Python, Celery"
            kafkaBroker = container "Kafka Transport" "Bus de eventos para UGC y analíticas." "Apache Kafka 3"

            // Backend Monolito Modular
            backend = container "Monolito Modular Backend" "Provee la lógica de negocio a través de APIs." "Python 3.12 (FastAPI + Django)" {
                
                // Módulos
                authModule = component "Módulo Auth" "Gestiona JWT, OAuth y dispositivos." "FastAPI"
                adminModule = component "Módulo Admin" "Panel CRUD para el catálogo y salas." "Django 5"
                catalogApiModule = component "Módulo Catalog API" "API pública asíncrona optimizada para lectura." "FastAPI"
                businessModule = component "Módulo Business" "Reserva de butacas y simulador de pagos." "FastAPI"
                ugcModule = component "Módulo UGC" "User Generated Content (Ratings, Reviews)." "FastAPI"
                recsModule = component "Módulo Recomendaciones" "Motor de recomendaciones personalizadas." "FastAPI"
                sharedModule = component "Módulo Shared" "Middlewares, validación JWT, Logging Estructurado." "Python"
            }
        }

        // Relaciones Nivel Contexto (C1)
        visitor -> cinemaPlus "Explora cartelera y busca películas"
        user -> cinemaPlus "Compra entradas, ve historial y califica"
        admin -> cinemaPlus "Administra películas, salas y funciones"
        cinemaPlus -> googleOAuth "Autentica usuarios vía OAuth2"

        // Relaciones Nivel Contenedores (C2)
        visitor -> frontendReact "Navega UI"
        user -> frontendReact "Interactúa"
        admin -> frontendReact "Gestiona (si implementado) o Django Admin"
        visitor -> frontendVanilla "Navega UI"

        frontendReact -> nginx "Peticiones HTTPS/JSON"
        frontendVanilla -> nginx "Peticiones HTTPS/JSON"

        nginx -> backend "Proxy pass /api/*"

        backend -> authDb "Lee/Escribe identidades (SSL)"
        backend -> businessDb "Lee/Escribe catálogo y órdenes"
        backend -> redis "Cachea y aplica locks (SETNX)"
        backend -> elastic "Consulta catálogo rápido"
        backend -> mongo "Lee/Escribe reseñas y calificaciones"
        backend -> kafkaBroker "Publica eventos UGC/Orders"

        celeryWorker -> businessDb "Extrae datos actualizados"
        celeryWorker -> elastic "Indexa películas"
        
        kafkaBroker -> clickhouse "Ingesta eventos analíticos"

        // Relaciones Nivel Componentes (C3) dentro del Backend
        frontendReact -> authModule "POST /auth/login"
        frontendReact -> catalogApiModule "GET /catalog/movies"
        frontendReact -> adminModule "Gestión Django Admin"
        frontendReact -> businessModule "POST /screenings/reserve"
        frontendReact -> ugcModule "POST /ugc/ratings"
        frontendReact -> recsModule "GET /recommendations/me"

        authModule -> sharedModule "Usa utilidades"
        catalogApiModule -> sharedModule "Usa utilidades"
        businessModule -> sharedModule "Usa utilidades"
        ugcModule -> sharedModule "Usa utilidades"
        recsModule -> sharedModule "Usa utilidades"

        authModule -> authDb "Valida/Inserta usuarios"
        authModule -> redis "Almacena refresh tokens"

        adminModule -> businessDb "CRUD Catálogo/Salas"
        
        catalogApiModule -> elastic "Búsqueda Full-text"
        catalogApiModule -> redis "Cache-aside (5 min)"

        businessModule -> businessDb "Inserta Orders/Items"
        businessModule -> redis "Locks SETNX 10 min"
        businessModule -> kafkaBroker "Publica OrderCompleted"

        ugcModule -> mongo "Upsert Ratings/Reviews"
        ugcModule -> kafkaBroker "Publica UGC events"

        recsModule -> mongo "Lee Ratings/Watchlist"
        recsModule -> clickhouse "Lee Top Trending"
        recsModule -> redis "Cache personalizado"
    }

    views {
        systemContext cinemaPlus "Contexto" {
            include *
            autoLayout
        }

        container cinemaPlus "Contenedores" {
            include *
            autoLayout
        }

        component backend "Componentes" {
            include *
            autoLayout
        }

        styles {
            element "Person" {
                background #08427b
                color #ffffff
                shape Person
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
            element "Database" {
                shape Cylinder
            }
            element "Cache" {
                shape Cylinder
            }
        }
    }
}
