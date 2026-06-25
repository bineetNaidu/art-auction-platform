# Applications Architecture Space (`/apps`)

This directory houses our functional microservices. Each application is an isolated, autonomous runtime unit that communicates via strict contractual interfaces.

## Applications Directory Registry

| Service Target             | Protocol         | Data Layer                     | Primary Responsibility                                                                                |
| :------------------------- | :--------------- | :----------------------------- | :---------------------------------------------------------------------------------------------------- |
| **`gateway-service`**      | REST (Public)    | None                           | Core reverse proxy, rate limiting, and centralized JWT authorization validation.                      |
| **`auth-service`**         | REST + Kafka     | PostgreSQL (`auth_db`)         | Handles user onboarding, RBAC roles, encryption, and secure token issuance.                           |
| **`artwork-service`**      | REST + Kafka     | PostgreSQL (`artwork_db`)      | Houses art asset schemas, legal verifications, and digital provenance history.                        |
| **`auction-service`**      | REST + Kafka     | PostgreSQL (`auction_db`)      | Orchestrates scheduling, operational windows, and final lifecycle states of auctions.                 |
| **`bid-service`**          | REST + Kafka     | PG (`bid_db`) + Redis          | High-frequency ledger tracking bids. Leverages Redis for instantaneous valid-highest-bid cache logic. |
| **`notification-service`** | Kafka (Consumer) | PostgreSQL (`notification_db`) | Consumes state changes to fire background alerts across user communication preferences.               |
| **`analytics-service`**    | Kafka (Consumer) | PostgreSQL (`analytics_db`)    | Aggregates decoupled events into denormalized, high-speed read projections for reporting.             |

## Structural Service Layout Rule

Every application must implement an uniform internal structure:

```text
<service-name>/
├── src/
│   ├── config/       # Environment variables validation and server specs
│   ├── database/     # Drizzle schema layouts and local migrations
│   ├── services/     # Pure business logic core
│   ├── transport/    # HTTP Controllers (REST) or Kafka Consumer/Producer handlers
│   └── app.ts        # Service initialization bootstrap
├── Dockerfile        # Container builds
├── tsconfig.json     # Specific runtime flags overrides
└── package.json      # Local microservice manifest
```
