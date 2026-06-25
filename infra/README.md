# Infrastructure & Orchestration Strategy (`/infra`)

This layer provisions our system's localized development runtime environments via localized infrastructure configurations.

## Core Services Inventory

- **PostgreSQL Container:** One cluster hosting multiple partitioned databases (`auth_db`, `artwork_db`, `auction_db`, `bid_db`, `notification_db`, `analytics_db`).
- **Apache Kafka + Zookeeper:** Distributes high-throughput message pipelines across isolated partitions to decouple core domains.
- **Redis Cache Core:** Low-latency in-memory broker used for caching critical states and high-performance validation rules (e.g., bid processing throttling).

## Directory Scaffolding Map

```text
infra/
├── docker/
│   ├── docker-compose.infra.yml  # Local base databases, streams, caches
│   └── docker-compose.apps.yml   # Multi-service runtime containers orchestration
├── postgres/
│   └── init.sql                  # Automated script to spin up the target schema list
└── kafka/
    └── topic-provisioner.sh      # Automated orchestration scripts to map partitions/compaction
