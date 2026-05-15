# ADR-005: Connect-RPC for inter-service contracts

- **Status:** Accepted
- **Date:** 2026-05-15
- **Owner:** Founder

## Context

Services need typed, versioned RPC. Candidates: REST + OpenAPI, gRPC, GraphQL,
Connect-RPC (connectrpc.com). The choice affects:

- Browser / extension reachability (do we expose internal RPC to clients?)
- Tooling (codegen, mocking, observability)
- Streaming needs (eventual: ELD telemetry, AI long-running tasks)

## Decision

Use **Connect-RPC** (HTTP/1.1 + HTTP/2 compatible, protobuf-based, browser-friendly)
for all internal service-to-service calls and for the gateway's internal
fan-out. Generate Go, TypeScript, and Python stubs from `packages/proto` via
Buf.

External clients (apps, extension) talk to **gateway**, which speaks Connect
to internals and exposes a small **JSON-over-HTTP** surface to browsers.
The browser SDK in `packages/sdk` wraps these JSON endpoints with typed methods.

## Alternatives considered

- **Pure REST + OpenAPI** — verbose; hand-rolling types and validation invites drift.
- **Plain gRPC** — no native browser support; grpc-web requires a proxy; tooling more fragmented.
- **GraphQL** — federation overhead unjustified at our size; auth/rate-limit logic harder per resolver.

## Consequences

### Positive
- One source of truth (proto) for Go, TS, Python contracts.
- Browser-reachable gRPC semantics via Connect.
- Buf provides linting, breaking-change detection, codegen in one tool.

### Negative
- Engineers must learn protobuf semantics (oneof, well-known types).
- Some HTTP/REST middleware doesn't apply cleanly to streaming; mitigation: keep streaming endpoints to internal use only.

## References

- https://connectrpc.com
- https://buf.build
