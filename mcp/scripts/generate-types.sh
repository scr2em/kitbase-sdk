#!/bin/sh
# Regenerates src/generated/api.ts from the backend OpenAPI spec.
# Kept out of package.json (which ships in the npm tarball) so the local
# backend repo path stays private. Override with KITBASE_OPENAPI_SPEC.
set -e
SPEC="${KITBASE_OPENAPI_SPEC:-../../Flyway/openapi.mcp.yaml}"
exec npx openapi-typescript "$SPEC" -o src/generated/api.ts
