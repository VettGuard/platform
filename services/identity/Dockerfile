FROM golang:1.23-alpine AS builder
WORKDIR /workspace
COPY go.work ./
COPY services/shared/   services/shared/
COPY services/identity/ services/identity/
WORKDIR /workspace/services/identity
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o /out/app ./cmd

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=builder /out/app /app
EXPOSE 8081
USER nonroot:nonroot
ENTRYPOINT ["/app"]
