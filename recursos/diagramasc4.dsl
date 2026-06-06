/**
 * ============================================================
 * CINEMAPLUS — Arquitectura C4 Completa (V2.1 - RGPD & Security Focus)
 * Proyecto Final · Plataforma de Servicios Backend
 * ============================================================
 */

workspace "CinemaPlus" "Plataforma de cinema en línea — Arquitectura C4 completa. Monolito modular con módulo de recomendaciones personalizadas." {

    // =========================================================
    // MODELO
    // =========================================================
    model {

        // -----------------------------------------------------
        // ACTORES / PERSONAS
        // -----------------------------------------------------

        visitor = person "Visitante" "Usuario no autenticado que explora la cartelera y busca películas sin necesidad de crear una cuenta." {
            tags "External"
        }

        registeredUser = person "Usuario Registrado" "Usuario con cuenta activa (mayor de 18 años). Puede comprar entradas, calificar películas, administrar su watchlist y recibir recomendaciones." {
            tags "User"
        }

        adminUser = person "Administrador" "Staff interno con acceso al panel administrativo. Gestiona el catálogo de películas, funciones y salas; visualiza analytics." {
            tags "Admin"
        }

        // -----------------------------------------------------
        // SISTEMAS EXTERNOS
        // -----------------------------------------------------

        googleOAuth = softwareSystem "Google OAuth 2.0" "Proveedor de identidad externo. Permite login social con cuenta de Google mediante flujo OAuth 2.0 / OIDC." {
            tags "ExternalSystem"
        }

        emailProvider = softwareSystem "SendGrid / SMTP" "Servicio de envío de emails transaccionales. Maneja confirmaciones de compra, recordatorios de función y emails de bienvenida." {
            tags "ExternalSystem"
        }

        youtubeAPI = softwareSystem "YouTube API v3" "API externa para embeber trailers de películas en la página de detalle. Solo se usa para renderizar el reproductor iframe." {
            tags "ExternalSystem"
        }

        // -----------------------------------------------------
        // SISTEMA PRINCIPAL
        // -----------------------------------------------------

        cinemaPlus = softwareSystem "CinemaPlus" "Plataforma de cinema en línea. Monolito modular que gestiona catálogo, autenticación segura, compras y analítica RGPD compliance." {
            tags "MainSystem"

            // -------------------------------------------------
            // CONTENEDORES — C2
            // -------------------------------------------------

            // ---- FRONTENDS ----

            reactSPA = container "React SPA" "Aplicación cliente principal. Interfaz de usuario para visitantes y registrados. Rutas protegidas y validación en cliente." {
                technology "React 18 + TypeScript + Vite + Zustand + React Router"
                tags "Frontend"

                routerComp = component "App Router" "Configura el sistema de rutas. Aplica lazy loading por ruta y protege rutas privadas (ProtectedRoute)." {
                    technology "React Router v6"
                    tags "Component"
                }

                authStore = component "Auth Store" "Estado global de autenticación (Zustand). Persiste access token en memoria; refresh token en httpOnly cookie por seguridad." {
                    technology "Zustand + TypeScript"
                    tags "Component"
                }

                httpClient = component "HTTP Client (Axios)" "Cliente HTTP centralizado. Detecta 401 y ejecuta refresh automático del token. Maneja intercepción de errores de validación y seguridad." {
                    technology "Axios + TypeScript"
                    tags "Component"
                }

                catalogUI = component "Catalog UI" "Vistas de cartelera y búsqueda. Paginación y manejo de loading/empty/error states." {
                    technology "React + CSS BEM"
                    tags "Component"
                }

                movieDetailUI = component "Movie Detail UI" "Página de detalle. Muestra info, trailer y rating." {
                    technology "React + CSS BEM"
                    tags "Component"
                }

                checkoutUI = component "Checkout UI" "Flujo de compra. Selección de butacas (SeatMap SVG), pago simulado con validación lógica de expiración de tarjeta y Luhn." {
                    technology "React + react-hook-form + zod"
                    tags "Component"
                }

                recommendationsUI = component "Recommendations UI" "Sección 'Recomendadas para vos' en el home." {
                    technology "React + CSS BEM"
                    tags "Component"
                }

                ugcUI = component "UGC UI" "Componentes UGC: Ratings interactivos, ReviewForm, Watchlist." {
                    technology "React + CSS BEM"
                    tags "Component"
                }

                notificationsUI = component "Notifications UI" "NotificationBell con badge contador y toast in-app." {
                    technology "React + CSS BEM"
                    tags "Component"
                }

                adminUI = component "Admin UI" "Panel administrativo protegido por rol. CRUD y Dashboard con analíticas." {
                    technology "React + CSS BEM"
                    tags "Component"
                }
            }

            vanillaApp = container "Vanilla JS / Handlebars App" "Segunda implementación del frontend. Cubre flujos básicos comparativos." {
                technology "Vanilla JS + Handlebars + Vite + TypeScript"
                tags "Frontend"

                handlebarsRouter = component "Router Custom" "Enrutador client-side basado en History API (pushState)." {
                    technology "Vanilla JS TypeScript"
                    tags "Component"
                }

                handlebarsTemplates = component "Handlebars Templates" "Plantillas HBS compiladas en build time." {
                    technology "Handlebars + Vite"
                    tags "Component"
                }

                vanillaApiClient = component "API Client (fetch)" "Cliente HTTP nativo con fetch y header de autorización." {
                    technology "Vanilla TypeScript + fetch"
                    tags "Component"
                }

                vanillaAuthModule = component "Auth Module (Vanilla)" "Gestión de sesión en Vanilla JS. Almacena tokens en memoria." {
                    technology "Vanilla TypeScript"
                    tags "Component"
                }
            }

            // ---- REVERSE PROXY ----

            nginx = container "Nginx Gateway & Firewall" "Reverse proxy. Termina TLS. Aplica Rate Limiting, Content Security Policy (CSP), previene ataques comunes y enruta /api/*." {
                technology "Nginx 1.25 + Let's Encrypt (TLS)"
                tags "Infrastructure"
            }

            // ---- MONOLITO MODULAR ----

            monolith = container "Monolito Modular (Backend)" "Núcleo del sistema. Módulos internos desacoplados compartiendo un despliegue." {
                technology "Python 3.12 · Django 5 · FastAPI 0.111 · Flask 3"
                tags "Backend"

                // ==============================================
                // MÓDULO AUTH
                // ==============================================

                authController = component "Auth Controller" "Endpoints REST de Auth. Valida inputs estrictos de fechas (nacimiento) previniendo acceso a menores de edad." {
                    technology "FastAPI Router"
                    tags "Component" "Auth"
                }

                authService = component "Auth Service" "Lógica de negocio. Hashea con bcrypt. Valida mayoría de edad obligatoria (>18). Gestiona tokens y maneja datos PII de forma segura." {
                    technology "Python Service · python-jose · bcrypt"
                    tags "Component" "Auth"
                }

                tokenRepository = component "Token Repository" "Gestión de refresh tokens y reset password en Redis. Revoca acceso masivo si hay brechas." {
                    technology "Redis + Python"
                    tags "Component" "Auth"
                }

                authUserRepository = component "User Repository (Auth)" "CRUD de usuarios en PostgreSQL. Almacena PII cifrada (RGPD) y garantiza consistencia." {
                    technology "SQLAlchemy ORM · PostgreSQL schema:auth"
                    tags "Component" "Auth"
                }

                oauthHandler = component "OAuth Handler" "Flujo OAuth 2.0 con Google validando scopes mínimos necesarios (Principio de menor privilegio)." {
                    technology "Python · Authlib"
                    tags "Component" "Auth"
                }

                jwtMiddleware = component "JWT Middleware" "Verifica firma y expiración del access token (HS256). Extrae claims para RBAC." {
                    technology "FastAPI Dependency Injection"
                    tags "Component" "Shared"
                }

                // ==============================================
                // MÓDULO ADMIN / CATALOG
                // ==============================================

                djangoAdmin = component "Django Admin" "Panel administrativo. Protegido por JWT. Incluye bitácora de auditoría inmutable de cambios críticos." {
                    technology "Django Admin · Django 5"
                    tags "Component" "Admin"
                }

                movieAdminAPI = component "Movie Admin API" "Endpoints REST para gestión de películas vía API React." {
                    technology "Django REST Framework"
                    tags "Component" "Admin"
                }

                screeningAdminAPI = component "Screening Admin API" "Endpoints de funciones. Rechaza fechas/horas pasadas y evita solapamientos de salas por seguridad funcional." {
                    technology "Django REST Framework"
                    tags "Component" "Admin"
                }

                catalogRepository = component "Catalog Repository" "CRUD en schema catalog de PostgreSQL. Aplica soft-deletes." {
                    technology "Django ORM · PostgreSQL schema:catalog"
                    tags "Component" "Admin"
                }

                etlService = component "ETL Service" "Sincroniza PostgreSQL → Elasticsearch cada 5 minutos." {
                    technology "Python · elasticsearch-py · Celery"
                    tags "Component" "Admin"
                }

                // ==============================================
                // MÓDULO API PÚBLICA
                // ==============================================

                catalogApiController = component "Catalog API Controller" "Endpoints públicos. Optimizados para alta carga (p95 < 100 ms)." {
                    technology "FastAPI Router"
                    tags "Component" "CatalogAPI"
                }

                searchService = component "Search Service" "Lógica de búsqueda con queries Elasticsearch." {
                    technology "Python · elasticsearch-py"
                    tags "Component" "CatalogAPI"
                }

                cacheService = component "Cache Service" "Caché Redis. Invalida entradas de forma segura." {
                    technology "Python · redis-py"
                    tags "Component" "CatalogAPI"
                }

                // ==============================================
                // MÓDULO BUSINESS (Compra de Entradas)
                // ==============================================

                orderController = component "Order Controller" "Endpoints de reserva y compra de entradas." {
                    technology "FastAPI Router"
                    tags "Component" "Business"
                }

                seatReservationService = component "Seat Reservation Service" "Reservas temporales con Redis SETNX (anti-concurrencia y race conditions)." {
                    technology "Python · Redis SETNX"
                    tags "Component" "Business"
                }

                paymentSimulator = component "Payment Simulator" "Valida fechas de expiración lógicas (MM/YY no pasado), códigos CVV y algoritmo de Luhn para asegurar coherencia." {
                    technology "Python · qrcode · Luhn algorithm"
                    tags "Component" "Business"
                }

                orderService = component "Order Service" "Orquesta compra con transacción atómica en BD. Rolback automático si falla cualquier paso." {
                    technology "Python Service · SQLAlchemy"
                    tags "Component" "Business"
                }

                orderRepository = component "Order Repository" "CRUD de órdenes en schema business." {
                    technology "SQLAlchemy ORM"
                    tags "Component" "Business"
                }

                ticketQRGenerator = component "Ticket QR Generator" "Genera QR transaccional y lo persiste de forma aislada." {
                    technology "Python · qrcode · Pillow"
                    tags "Component" "Business"
                }

                // ==============================================
                // MÓDULO UGC
                // ==============================================

                ugcController = component "UGC Controller" "Endpoints UGC. Control de rate limits por usuario para mitigar SPAM." {
                    technology "FastAPI Router"
                    tags "Component" "UGC"
                }

                ugcService = component "UGC Service" "Upserts atómicos en MongoDB de ratings y reseñas." {
                    technology "Python Service"
                    tags "Component" "UGC"
                }

                kafkaProducer = component "Kafka Producer" "Envía eventos al broker. Anonimiza PII explícitamente antes de enviar data al Data Warehouse (Compliance RGPD)." {
                    technology "Python · confluent-kafka"
                    tags "Component" "UGC"
                }

                mongoRepository = component "MongoDB Repository" "Almacén NoSQL flexible para documentos de UGC." {
                    technology "Python · pymongo"
                    tags "Component" "UGC"
                }

                // ==============================================
                // MÓDULO NOTIFICATIONS
                // ==============================================

                notificationConsumer = component "Notification Consumer" "Consume topic user-events para disparar notificaciones." {
                    technology "Python · confluent-kafka Consumer"
                    tags "Component" "Notifications"
                }

                emailService = component "Email Service" "Envío de correos transaccionales sin registrar contenido sensible en logs." {
                    technology "Python · sendgrid-python"
                    tags "Component" "Notifications"
                }

                notificationService = component "Notification Service" "Persiste notificaciones in-app en Mongo." {
                    technology "Python Service"
                    tags "Component" "Notifications"
                }

                reminderScheduler = component "Reminder Scheduler" "Cron para recordatorios de funciones próximas (2h)." {
                    technology "Python · Celery beat"
                    tags "Component" "Notifications"
                }

                // ==============================================
                // MÓDULO RECOMMENDATIONS
                // ==============================================

                recommendationController = component "Recommendation Controller" "Endpoints de recomendaciones." {
                    technology "FastAPI Router"
                    tags "Component" "Recommendations"
                }

                recommendationEngine = component "Recommendation Engine" "Núcleo algorítmico basado en perfiles anónimos de comportamiento." {
                    technology "Python Service · NumPy"
                    tags "Component" "Recommendations"
                }

                recommendationCache = component "Recommendation Cache" "Redis TTL para recomendaciones recalculadas." {
                    technology "Python · redis-py"
                    tags "Component" "Recommendations"
                }

                userPreferencesRepository = component "User Preferences Repository" "Lectura segura de gustos explícitos." {
                    technology "SQLAlchemy ORM"
                    tags "Component" "Recommendations"
                }

                // ==============================================
                // SHARED / TRANSVERSAL
                // ==============================================

                structuredLogger = component "Structured Logger" "Logger central. Aplica Data Masking (oculta emails, contraseñas, IPs) para evitar fuga de PII según normativa RGPD." {
                    technology "Python · structlog"
                    tags "Component" "Shared"
                }

                metricsCollector = component "Metrics Collector" "Métricas base de sistema anónimas (Latencia, RPS)." {
                    technology "Python · prometheus-client"
                    tags "Component" "Shared"
                }
            }

            // ---- WORKERS ASYNC ----

            celeryWorker = container "Celery Worker" "Procesos asíncronos en background para ETL y envíos pesados." {
                technology "Python · Celery 5"
                tags "Worker"
            }

            kafkaConsumerWorker = container "Kafka Consumer Worker" "Escribe eventos anonimizados en ClickHouse." {
                technology "Python · confluent-kafka · ClickHouse driver"
                tags "Worker"
            }

            // ---- BASES DE DATOS ----

            postgresDB = container "PostgreSQL" "BD transaccional con Schemas separados. El Schema Auth está estrictamente aislado para proteger PII y contraseñas." {
                technology "PostgreSQL 16"
                tags "Database"
            }

            redisCache = container "Redis" "Caché, Rate Limiter y gestor de anti-concurrencia (Locks)." {
                technology "Redis 7"
                tags "Database"
            }

            elasticsearchDB = container "Elasticsearch" "Búsqueda rápida de catálogo público." {
                technology "Elasticsearch 8.x"
                tags "Database"
            }

            mongoDBStore = container "MongoDB" "Documentos UGC sin información identificativa crítica." {
                technology "MongoDB 7"
                tags "Database"
            }

            clickhouseDB = container "ClickHouse" "Data Warehouse puramente analítico con datos 100% anonimizados (RGPD compliance)." {
                technology "ClickHouse 24.x"
                tags "Database"
            }

            kafkaBroker = container "Apache Kafka" "Bus de eventos en Kraft Mode." {
                technology "Apache Kafka 3.x"
                tags "Infrastructure"
            }

        }

        // -----------------------------------------------------
        // RELACIONES — PERSONAS → SISTEMA (C1)
        // -----------------------------------------------------

        visitor -> cinemaPlus "Explora cartelera y detalle" "HTTPS"
        registeredUser -> cinemaPlus "Compra entradas, califica, administra watchlist" "HTTPS"
        adminUser -> cinemaPlus "Administra plataforma (Roles granulares)" "HTTPS"

        cinemaPlus -> googleOAuth "Autenticación social (OIDC)" "HTTPS / OAuth 2.0"
        googleOAuth -> cinemaPlus "Retorna token de identidad validado" "HTTPS / OAuth 2.0"

        cinemaPlus -> emailProvider "Envía emails transaccionales seguros" "HTTPS"
        cinemaPlus -> youtubeAPI "Embebe iframe de trailers" "HTTPS"

        // -----------------------------------------------------
        // RELACIONES — CONTENEDORES (C2)
        // -----------------------------------------------------

        visitor -> nginx "Accede a la plataforma" "HTTPS :443"
        registeredUser -> nginx "Accede a la plataforma" "HTTPS :443"
        adminUser -> nginx "Accede al panel admin" "HTTPS :443"

        nginx -> reactSPA "Sirve estáticos" "HTTP"
        nginx -> vanillaApp "Sirve estáticos" "HTTP"
        nginx -> monolith "Reverse Proxy a /api/* y /auth/* con rate limit" "HTTP :8000"

        reactSPA -> monolith "Llamadas REST JSON (tipadas)" "HTTPS"
        vanillaApp -> monolith "Llamadas REST JSON" "HTTPS"

        reactSPA -> googleOAuth "Inicia flujo OAuth" "HTTPS"
        reactSPA -> youtubeAPI "Carga reproductor" "HTTPS"

        monolith -> postgresDB "Transacciones ACID" "TCP"
        monolith -> redisCache "Locks y Cache" "TCP"
        monolith -> elasticsearchDB "Full-text search" "HTTP"
        monolith -> mongoDBStore "UGC Storage" "TCP"
        monolith -> clickhouseDB "Agregaciones analíticas" "HTTP"
        monolith -> kafkaBroker "Publica eventos domain" "TCP"

        monolith -> googleOAuth "Valida AuthCode" "HTTPS"
        monolith -> emailProvider "Dispara emails" "HTTPS"

        celeryWorker -> postgresDB "Queries para ETL" "TCP"
        celeryWorker -> elasticsearchDB "Bulk index" "HTTP"
        celeryWorker -> redisCache "Broker de Tareas" "TCP"
        celeryWorker -> emailProvider "Envío asíncrono" "HTTPS"

        kafkaConsumerWorker -> kafkaBroker "Consume user-events" "TCP"
        kafkaConsumerWorker -> clickhouseDB "Inserta batches de métricas" "HTTP"
        kafkaConsumerWorker -> mongoDBStore "Persiste Notificaciones in-app" "TCP"

        // -----------------------------------------------------
        // RELACIONES — COMPONENTES (C3)
        // -----------------------------------------------------

        routerComp -> authStore "Verifica sesión"
        routerComp -> catalogUI "Ruta /"
        routerComp -> movieDetailUI "Ruta /movies/:id"
        routerComp -> checkoutUI "Ruta /checkout"
        routerComp -> adminUI "Ruta /admin"
        routerComp -> recommendationsUI "Ruta home"
        routerComp -> ugcUI "Ruta user"
        routerComp -> notificationsUI "Global"

        httpClient -> authStore "Integra Tokens JWT"
        catalogUI -> httpClient "Fetch cartelera"
        movieDetailUI -> httpClient "Fetch detalle"
        checkoutUI -> httpClient "Process Order"
        recommendationsUI -> httpClient "Fetch Recs"
        ugcUI -> httpClient "Post Ratings"
        notificationsUI -> httpClient "Fetch Notif"
        adminUI -> httpClient "Admin requests"

        handlebarsRouter -> handlebarsTemplates "Render"
        handlebarsRouter -> vanillaApiClient "Fetch"
        vanillaApiClient -> vanillaAuthModule "Auth"

        authController -> authService "Valida"
        authService -> authUserRepository "CRUD"
        authService -> tokenRepository "Token Ops"
        authService -> oauthHandler "OIDC"
        authService -> kafkaProducer "Event: Registered"
        oauthHandler -> googleOAuth "Exchange"
        jwtMiddleware -> tokenRepository "Revocation Check"

        movieAdminAPI -> catalogRepository "CRUD"
        screeningAdminAPI -> catalogRepository "CRUD+Logic"
        djangoAdmin -> catalogRepository "Web CRUD"
        etlService -> catalogRepository "Source"
        etlService -> elasticsearchDB "Sink"

        catalogApiController -> searchService "Query"
        catalogApiController -> cacheService "Cache layer"
        searchService -> elasticsearchDB "Fetch docs"
        cacheService -> redisCache "Redis Ops"

        orderController -> seatReservationService "Locks"
        orderController -> orderService "Checkout"
        orderService -> paymentSimulator "Simulate/Validate"
        orderService -> orderRepository "ACID Insert"
        orderService -> seatReservationService "Check Locks"
        orderService -> ticketQRGenerator "QR Build"
        orderService -> kafkaProducer "Event: Ordered"
        seatReservationService -> redisCache "SETNX"
        orderRepository -> postgresDB "Write"
        ticketQRGenerator -> mongoDBStore "Store Link"

        ugcController -> ugcService "Logic"
        ugcService -> mongoRepository "Store"
        ugcService -> kafkaProducer "Event: Action"

        notificationConsumer -> kafkaBroker "Listen"
        notificationConsumer -> emailService "Email logic"
        notificationConsumer -> notificationService "InApp logic"
        notificationService -> mongoRepository "Store Notif"
        emailService -> emailProvider "Send"
        reminderScheduler -> postgresDB "Check Schedule"
        reminderScheduler -> emailService "Trigger"

        recommendationController -> recommendationEngine "Request"
        recommendationController -> recommendationCache "Cache layer"
        recommendationController -> mongoRepository "Feedback log"
        recommendationEngine -> mongoRepository "History"
        recommendationEngine -> userPreferencesRepository "Prefs"
        recommendationEngine -> searchService "Filters"
        recommendationEngine -> clickhouseDB "Trending"
        recommendationCache -> redisCache "Redis Ops"
        userPreferencesRepository -> postgresDB "Read auth.users"

    }
    // fin model

    // =========================================================
    // VISTAS Y ESTILOS
    // =========================================================
    views {

        systemContext cinemaPlus "SystemContext" {
            title "C1 · CinemaPlus — Contexto (Seguro y RGPD Compliant)"
            include *
            autoLayout lr
        }

        container cinemaPlus "Containers" {
            title "C2 · CinemaPlus — Diagrama de Contenedores"
            include *
            autoLayout lr
        }

        component reactSPA "Components_ReactSPA" {
            title "C3 · React SPA"
            include *
            autoLayout tb
        }

        component monolith "Components_Auth" {
            title "C3 · Módulo Auth — Identidad Segura"
            include authController authService tokenRepository authUserRepository oauthHandler jwtMiddleware structuredLogger metricsCollector googleOAuth redisCache postgresDB kafkaBroker kafkaProducer
            autoLayout tb
        }

        component monolith "Components_Admin" {
            title "C3 · Módulo Admin"
            include djangoAdmin movieAdminAPI screeningAdminAPI catalogRepository etlService structuredLogger postgresDB elasticsearchDB celeryWorker
            autoLayout tb
        }

        component monolith "Components_CatalogAPI" {
            title "C3 · API Pública"
            include catalogApiController searchService cacheService jwtMiddleware structuredLogger metricsCollector elasticsearchDB redisCache
            autoLayout tb
        }

        component monolith "Components_Business" {
            title "C3 · Módulo Business"
            include orderController seatReservationService paymentSimulator orderService orderRepository ticketQRGenerator jwtMiddleware structuredLogger postgresDB redisCache mongoDBStore kafkaBroker kafkaProducer
            autoLayout tb
        }

        component monolith "Components_UGC" {
            title "C3 · Módulo UGC"
            include ugcController ugcService kafkaProducer mongoRepository jwtMiddleware structuredLogger mongoDBStore kafkaBroker
            autoLayout tb
        }

        component monolith "Components_Notifications" {
            title "C3 · Módulo Notifications"
            include notificationConsumer emailService notificationService reminderScheduler mongoRepository structuredLogger kafkaBroker emailProvider mongoDBStore postgresDB
            autoLayout tb
        }

        component monolith "Components_Recommendations" {
            title "C3 · Módulo Recommendations"
            include recommendationController recommendationEngine recommendationCache userPreferencesRepository searchService mongoRepository jwtMiddleware structuredLogger redisCache mongoDBStore elasticsearchDB clickhouseDB postgresDB
            autoLayout tb
        }

        component vanillaApp "Components_VanillaApp" {
            title "C3 · Vanilla App"
            include *
            autoLayout tb
        }

        styles {
            element "Person" {
                background "#1a1a2e"
                color "#ffffff"
                fontSize 14
                shape Person
            }
            element "External" {
                background "#4a4a6a"
                color "#e0e0ff"
            }
            element "User" {
                background "#16213e"
                color "#e0e4ff"
            }
            element "Admin" {
                background "#0f3460"
                color "#ffffff"
            }
            element "MainSystem" {
                background "#e94560"
                color "#ffffff"
                shape RoundedBox
            }
            element "ExternalSystem" {
                background "#533483"
                color "#ffffff"
                shape RoundedBox
                border dashed
            }
            element "Frontend" {
                background "#1b4332"
                color "#d8f3dc"
                shape WebBrowser
            }
            element "Backend" {
                background "#1d3557"
                color "#a8dadc"
                shape RoundedBox
            }
            element "Database" {
                background "#2d3748"
                color "#e2e8f0"
                shape Cylinder
            }
            element "Worker" {
                background "#2c3e50"
                color "#ecf0f1"
                shape Hexagon
            }
            element "Infrastructure" {
                background "#3d405b"
                color "#e0e0e0"
                shape RoundedBox
            }
            element "Component" {
                background "#2a4a7f"
                color "#cfe2ff"
                shape Component
                fontSize 12
            }
            element "Auth" {
                background "#6a0572"
                color "#f8d7ff"
            }
            element "Admin" {
                background "#7f5200"
                color "#fff3cd"
            }
            element "CatalogAPI" {
                background "#004d40"
                color "#b2dfdb"
            }
            element "Business" {
                background "#1a237e"
                color "#c5cae9"
            }
            element "UGC" {
                background "#01579b"
                color "#b3e5fc"
            }
            element "Notifications" {
                background "#880e4f"
                color "#fce4ec"
            }
            element "Recommendations" {
                background "#e65100"
                color "#fff3e0"
            }
            element "Shared" {
                background "#37474f"
                color "#eceff1"
            }
            relationship "Relationship" {
                thickness 2
                color "#888888"
                dashed false
            }
        }
        theme default
    }
}