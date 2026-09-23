// Package openapi serves a minimal OpenAPI 3.1 document describing the
// gateway's REST surface. The Connect-RPC surface is documented by the
// proto files in packages/proto/v1 and is best consumed by generated
// clients, so this doc focuses on health + the AI REST endpoints.
//
// A richer OpenAPI generated from .proto via grpc-gateway is a Sprint 3
// improvement.
package openapi

import (
	"encoding/json"
	"net/http"
)

const docJSON = `{
  "openapi": "3.1.0",
  "info": {
    "title": "VettGuard Gateway",
    "version": "0.0.1",
    "description": "External HTTP edge for VettGuard. Connect-RPC services are mounted under /vettguard.v1.<Service>/<Method>; see packages/proto for contract details."
  },
  "servers": [
    {"url": "https://api.vettguard.com", "description": "production"},
    {"url": "https://api-staging.vettguard.com", "description": "staging"},
    {"url": "http://localhost:8080", "description": "local"}
  ],
  "paths": {
    "/healthz": {"get": {"summary": "Liveness probe", "responses": {"200": {"description": "OK"}}}},
    "/readyz":  {"get": {"summary": "Readiness probe", "responses": {"200": {"description": "OK"}, "503": {"description": "not ready"}}}},
    "/v1/health": {"get": {"summary": "Gateway info", "responses": {"200": {"description": "OK"}}}},
    "/v1/ai/echo": {
      "post": {
        "summary": "Round-trip a message to Claude",
        "security": [{"bearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EchoRequest"}}}},
        "responses": {"200": {"description": "OK", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EchoResponse"}}}}, "429": {"description": "rate limit or budget exceeded"}}
      }
    },
    "/v1/ai/classify-document": {
      "post": {
        "summary": "Classify a document by URL (Phase 2 will OCR)",
        "security": [{"bearerAuth": []}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ClassifyRequest"}}}},
        "responses": {"200": {"description": "OK", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ClassifyResponse"}}}}, "502": {"description": "malformed classifier output"}}
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT (Ed25519)"}
    },
    "schemas": {
      "EchoRequest":  {"type": "object", "required": ["message","ctx"], "properties": {"message": {"type": "string"}, "model": {"type": "string", "enum": ["claude-haiku-4-5","claude-sonnet-4-6","claude-opus-4-7"]}, "ctx": {"$ref": "#/components/schemas/TenantContext"}}},
      "EchoResponse": {"type": "object", "properties": {"reply": {"type": "string"}, "usage": {"$ref": "#/components/schemas/TokenUsage"}, "trace_id": {"type": "string"}}},
      "ClassifyRequest":  {"type": "object", "required": ["blob_url","ctx"], "properties": {"blob_url": {"type": "string"}, "ctx": {"$ref": "#/components/schemas/TenantContext"}}},
      "ClassifyResponse": {"type": "object", "properties": {"type": {"type": "string"}, "confidence": {"type": "number"}, "usage": {"$ref": "#/components/schemas/TokenUsage"}}},
      "TenantContext": {"type": "object", "required": ["tenant_id"], "properties": {"tenant_id": {"type": "string", "format": "uuid"}, "user_id": {"type": "string", "format": "uuid"}, "request_id": {"type": "string"}, "trace_id": {"type": "string"}}},
      "TokenUsage": {"type": "object", "properties": {"input_tokens": {"type": "integer"}, "output_tokens": {"type": "integer"}, "cache_read_input_tokens": {"type": "integer"}, "cache_creation_input_tokens": {"type": "integer"}}}
    }
  }
}`

// Handler serves the OpenAPI 3.1 spec. Light JSON validation at init time
// keeps prod from shipping a broken doc.
func Handler() http.HandlerFunc {
	var sink map[string]any
	if err := json.Unmarshal([]byte(docJSON), &sink); err != nil {
		panic("openapi: embedded doc is invalid JSON: " + err.Error())
	}
	return func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(docJSON))
	}
}
