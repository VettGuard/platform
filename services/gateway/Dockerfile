# GOWORK=off bypasses the workspace file so the image only needs the
# directories this service's go.mod `replace` targets.
FROM golang:1.25-alpine AS builder
ENV GOWORK=off
WORKDIR /workspace
COPY packages/proto/gen/go/ packages/proto/gen/go/
COPY services/shared/       services/shared/
COPY services/gateway/   services/gateway/
WORKDIR /workspace/services/gateway
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o /out/app ./cmd

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=builder /out/app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]
