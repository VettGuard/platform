# GOWORK=off bypasses the workspace file so the image only needs the
# directories this service actually replaces (services/shared). The
# go.mod's `replace` directive then resolves shared from /workspace.
FROM golang:1.25-alpine AS builder
ENV GOWORK=off
WORKDIR /workspace
COPY services/shared/  services/shared/
COPY services/brokers/ services/brokers/
WORKDIR /workspace/services/brokers
RUN go mod download
# Two binaries: /app is the long-running service; /migrate is a one-shot
# goose runner the deploy runbook invokes via `kubectl run` to apply
# pending schema migrations against the same image.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o /out/app     ./cmd
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o /out/migrate ./cmd/migrate

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=builder /out/app     /app
COPY --from=builder /out/migrate /migrate
EXPOSE 8086
USER nonroot:nonroot
ENTRYPOINT ["/app"]
