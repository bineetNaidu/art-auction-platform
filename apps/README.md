# Applications Architecture Space (`/apps`)

This directory houses our functional, deployable microservices. Each application operates as an isolated, autonomous bounded context that interacts using standardized contractual models.

## Core Architectural Policies

1. **Edge Router Enforcement:** Clients _never_ hit internal backend services directly. All traffic flows through the `gateway-service` on port `3000`.
2. **API Version Mapping:** The gateway captures public traffic under the `/api/v1/` prefix, strips the prefix via path rewriting, and proxies requests cleanly down to internal boundaries.
3. **Identity Propagation:** Protected routes require an asymmetric Authorization Bearer JWT. The gateway decodes this token and injects a verified JSON string into the `x-user-payload` transport header before forwarding it downstream.
4. **Uniform Payload Contracts:** Every operational service handles response structures exclusively using the generic `ApiResponse<T>` layout envelope to maintain absolute frontend ecosystem compatibility.

## Applications Directory & Port Registry

| Service Name               | Network Protocol      | Port   | Data Layer                     | Core Architectural Responsibility                                                                                      |
| :------------------------- | :-------------------- | :----- | :----------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **`gateway-service`**      | Public REST           | `3000` | None                           | Reverse proxies routes, rewrites incoming `/api/v1/` prefixes, and performs centralized cryptographic token clearance. |
| **`auth-service`**         | Internal REST + Kafka | `3001` | PostgreSQL (`auth_db`)         | Houses user credentials, maps security roles, and fires `user.created` async events.                                   |
| **`artwork-service`**      | Internal REST + Kafka | `3002` | PostgreSQL (`artwork_db`)      | Manages art catalog details and emits `artwork.created` provenance events.                                             |
| **`auction-service`**      | Internal REST + Kafka | `3003` | PostgreSQL (`auction_db`)      | Coordinates scheduling windows, tracks current top prices, and governs auction lifecycles.                             |
| **`bid-service`**          | Internal REST + Kafka | `3004` | PG (`bid_db`) + Redis          | Runs microsecond-level bid validations against an in-memory Redis cache before writing to an immutable ledger.         |
| **`notification-service`** | Kafka Consumer        | _None_ | PostgreSQL (`notification_db`) | Background daemon worker that processes asynchronous event payloads into deliverable alert records.                    |
| **`analytics-service`**    | Internal REST + Kafka | `3005` | PostgreSQL (`analytics_db`)    | Aggregates decoupled events into highly responsive, pre-computed material views for fast dashboard access.             |

## Uniform Internal Application Layout

To ensure code maintainability across distributed teams, each microservice implements a standard functional flat structure:

```text
<service-name>/
├── src/
│   ├── config.ts     # Validates and maps environment parameters
│   ├── db.ts         # Establishes driver pools and automates boot schema creation
│   ├── schema.ts     # Drizzle ORM layout rules for the service's private tables
│   ├── controller.ts # Implements business logic and handles route execution
│   └── index.ts      # Instantiates servers, registers brokers, and mounts paths
├── Dockerfile        # Standard container assembly blueprint
├── tsconfig.json     # Service-specific compilation flags
└── package.json      # Local dependency declarations and run-scripts
```
