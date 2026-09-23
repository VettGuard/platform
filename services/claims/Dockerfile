# Two binaries: /app (long-running service) + /migrate (goose runner).
# GOWORK=off bypasses the workspace file so the image only needs the
# directories this service's go.mod `replace` targets.
FROM golang:1.25-alpine AS builder
ENV GOWORK=off
WORKDIR /workspace
COPY services/shared/ services/shared/
COPY services/claims/ services/claims/
WORKDIR /workspace/services/claims
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o /out/app     ./cmd
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o /out/migrate ./cmd/migrate

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=builder /out/app     /app
COPY --from=builder /out/migrate /migrate
EXPOSE 8087
USER nonroot:nonroot
ENTRYPOINT ["/app"]
