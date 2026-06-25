# Shared Local Packages (`/packages`)

Shared packages house the cross-cutting, compile-time configurations used by multiple microservices to guarantee dry contracts across the system.

## Packages Catalog

### 1. `shared-types`

- **Domain:** Global TypeScript interfaces, utility shapes, and request/response structural definitions.
- **Why:** Ensures change propagation. If a service modifies its outward contract shape, downstream clients fail during compilation instead of failing silently in production.

### 2. `shared-events`

- **Domain:** Hardened schema representations of the platform's Event Catalog.
- **Why:** Enforces deterministic contract structures for all payloads traveling across Kafka brokers. Prevents structural drift or malformed message parsing.

### 3. `shared-kafka`

- **Domain:** Wrapper layer over our client connection client (`kafkajs`).
- **Why:** Out-of-the-box resiliency patterns, connection retry strategies, structural logging injections, and unified back-off mechanisms for producers and consumers.

### 4. `shared-logger`

- **Domain:** Structured Winston/Pino logger setup.
- **Why:** Streamlines JSON logging formats with automatic tracing metadata attachment, crucial for troubleshooting distributed request flows across containers.
