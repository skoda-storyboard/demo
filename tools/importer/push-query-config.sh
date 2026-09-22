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
# Capture the GET status: on the config service PUT = *create* (201) and returns
# 409 if the resource already exists; POST = *update*. So pick the method from
# whether query.yaml is already present (404 → create, 200 → update).
GET_CODE="$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "x-auth-token: ${SKODA_ADMIN_TOKEN}" "$URL")"
curl -sS -H "x-auth-token: ${SKODA_ADMIN_TOKEN}" "$URL" -w '\nHTTP %{http_code}\n' || true

case "$GET_CODE" in
  404) METHOD=PUT;  echo "== PUT (create: query.yaml not present) ==" ;;
  200) METHOD=POST; echo "== POST (update: query.yaml already present) ==" ;;
  *)   echo "unexpected GET status $GET_CODE; aborting" >&2; exit 1 ;;
esac

# --data-binary (not --data) so the YAML newlines are preserved.
curl -sS -X "$METHOD" "$URL" \
  -H "content-type: text/yaml" \
  -H "x-auth-token: ${SKODA_ADMIN_TOKEN}" \
  --data-binary @"$CFG" -w '\nHTTP %{http_code}\n'

echo "== confirm (readback) =="
curl -sS -H "x-auth-token: ${SKODA_ADMIN_TOKEN}" "$URL" -w '\nHTTP %{http_code}\n'
