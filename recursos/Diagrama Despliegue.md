graph TD
    %% Definición de la Nube / Red
    subgraph AWS_Cloud ["AWS Cloud (Producción)"]
        
        subgraph VPC ["Virtual Private Cloud (VPC) - Subred Pública"]
            Nginx["Nginx Reverse Proxy & Firewall (Puerto 443)"]
        end

        subgraph Private_Subnet ["Subred Privada (Instancias EC2 / Contenedores)"]
            React["Contenedor: React SPA (Frontend)"]
            Monolith["Contenedor: Monolito Backend (Puerto 8000)"]
            Workers["Contenedor: Celery & Kafka Workers"]
        end

        subgraph RDS_Managed ["Amazon RDS (Bases de Datos Relacionales)"]
            AuthDB[("AuthDB - PostgreSQL 16 (Puerto 5433) <br/> Volumen Cifrado")]
            BizDB[("BusinessDB - PostgreSQL 16 (Puerto 5432)")]
        end

        subgraph Data_Services ["Servicios de Datos y Caché (Instancias Propias/Gestionadas)"]
            Redis[("Redis 7 (Puerto 6379)")]
            Mongo[("MongoDB 7 (Puerto 27017)")]
            Elastic[("Elasticsearch 8 (Puerto 9200)")]
            ClickHouse[("ClickHouse 24 (Puerto 8123)")]
            Kafka{{"Apache Kafka 3 (Puerto 9092)"}}
        end

    end

    %% Flujo de Usuarios Externos
    Internet((Usuarios / Internet)) -->|Tráfico HTTPS| Nginx

    %% Ruteo Interno Proxy -> App
    Nginx -->|Sirve estáticos| React
    Nginx -->|Proxy_pass HTTP| Monolith

    %% Conexiones del Monolito a Datos
    Monolith -->|TCP / SSL| AuthDB
    Monolith -->|TCP| BizDB
    Monolith -->|TCP| Redis
    Monolith -->|TCP| Mongo
    Monolith -->|HTTP API| Elastic
    Monolith -->|HTTP API| ClickHouse
    Monolith -->|TCP Pub/Sub| Kafka

    %% Conexiones de los Workers
    Workers -->|Lectura ETL| BizDB
    Workers -->|Escritura Bulk| Elastic
    Workers -->|Consume Eventos| Kafka
    Workers -->|Agrega Métricas| ClickHouse
    Workers -->|Broker Tareas| Redis

    %% Estilos básicos para identificar componentes
    classDef database fill:#2d3748,stroke:#4a5568,color:#fff;
    classDef proxy fill:#2b6cb0,stroke:#2c5282,color:#fff;
    classDef app fill:#2f855a,stroke:#276749,color:#fff;
    classDef broker fill:#c05621,stroke:#9c4221,color:#fff;

    class AuthDB,BizDB,Redis,Mongo,Elastic,ClickHouse database;
    class Nginx proxy;
    class React,Monolith,Workers app;
    class Kafka broker;