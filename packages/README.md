# Shared Local Packages (`/packages`)

Shared packages house our cross-cutting, compile-time utilities and runtime core helpers used by multiple microservices. They guarantee strict structural data contracts and absolute DRY (Don't Repeat Yourself) design compliance across our distributed network.

## Packages Catalog

### 1. `shared-types`

- **Domain:** Global TypeScript interfaces, primitive constants, and API response/error models.
- **Why:** Drives explicit compile-time type safety. If any backend core changes an outward data contract schema shape, downstream microservice clients will immediately fail compilation instead of breaking silently at runtime in production.

### 2. `shared-events`

- **Domain:** Strongly typed schemas and message envelopes describing our platform's Event Catalog.
- **Why:** Enforces deterministic data layouts for all event messages passing through our Kafka streaming broker channels. Prevents structural drift or un-parseable messaging payloads.

### 3. `shared-kafka`

- **Domain:** Resilient abstraction wrapper engineered over our low-level message broker driver (`kafkajs`).
- **Why:** Delivers out-of-the-box structural retry pipelines, automatic cluster discovery mechanics, back-off loop limits, and unified logging profiles for all stream producers and consumers.

### 4. `shared-logger`

- **Domain:** Standardized application tracker architecture configured on top of Winston.
- **Why:** Formats output metrics into structured JSON strings directly to `stdout`. Enforces trace metadata correlation, essential for tracking down failures across microservice boundaries.

### 5. `shared-common`

- **Domain:** Shared application layer components, framework-specific Express adapters, and runtime validation modules (`zod`).
- **Why:** Eliminates duplicate request-handling code across HTTP boundaries. Instantly arms importing backend services with runtime body validation filters and absolute fault protection against stack-trace leakage.
