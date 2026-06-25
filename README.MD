# Distributed Art Auction Platform

A highly scalable, production-grade microservices system designed with Node.js, TypeScript, Express, and an event-driven infrastructure powered by Apache Kafka, Redis, and PostgreSQL.

## System Architecture Blueprint

The system is built on four core design pillars:

1. **API Gateway Pattern:** The `gateway-service` acts as a single reverse-proxy entry point for clients, managing routing, payload aggregation, and JWT authorization checks.
2. **Database-per-Service:** True bounded contexts are enforced. Cross-database queries are strictly forbidden. Storage details are entirely private to their respective domain services.
3. **Command/Event Separation (CQRS Style):** State updates or strict mutations occur via synchronous REST endpoints (Commands). Side-effects, fan-out updates, downstream workflows, and read projections are handled via asynchronous pub/sub messaging (Events).
4. **Partition-Key Ordering:** To eliminate race conditions in rapid bidding, the system routes all auction and bid updates using the specific `auctionId` as the Kafka message key. This guarantees that events for an auction are processed sequentially on a single dedicated broker partition.

## Directory Structure

```text
art-auction-platform/
├── apps/              # Autonomous microservices (deployable units)
├── packages/          # Distributed shared modules (local npm workspaces)
├── infra/             # Core orchestrations (Docker, configurations, initialization)
└── package.json       # Workspace root definitions
