#!/bin/sh
# SKODA-104 — push the query-index config to the admin config service.
#
# Reads the admin bearer token from $SKODA_ADMIN_TOKEN (never commit it).
# GET-reads the current config first (so we don't clobber blind), PUTs the
# local query-index-config.yaml, then GET-reads again to confirm.
#
# Usage:
#   export SKODA_ADMIN_TOKEN='<admin.hlx.page token>'
#   ./tools/importer/push-query-config.sh
set -eu

ORG=skoda-storyboard
SITE=demo
CFG="$(dirname "$0")/query-index-config.yaml"
URL="https://admin.hlx.page/config/${ORG}/sites/${SITE}/content/query.yaml"
: "${SKODA_ADMIN_TOKEN:?set SKODA_ADMIN_TOKEN to the admin.hlx.page bearer token}"

echo "== current config (readback) =="
curl -sS -H "x-auth-token: ${SKODA_ADMIN_TOKEN}" "$URL" -w '\nHTTP %{http_code}\n' || true

echo "== PUT =="
# --data-binary (not --data) so the YAML newlines are preserved.
curl -sS -X PUT "$URL" \
  -H "content-type: text/yaml" \
  -H "x-auth-token: ${SKODA_ADMIN_TOKEN}" \
  --data-binary @"$CFG" -w '\nHTTP %{http_code}\n'

echo "== confirm (readback) =="
curl -sS -H "x-auth-token: ${SKODA_ADMIN_TOKEN}" "$URL" -w '\nHTTP %{http_code}\n'
