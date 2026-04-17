#!/usr/bin/env sh
set -eu

# Preserve explicit runtime overrides before loading .env
OVERRIDE_TEST_EMAIL="${TEST_EMAIL-}"
OVERRIDE_TEST_PASSWORD="${TEST_PASSWORD-}"
OVERRIDE_TEST_ORG_ID="${TEST_ORG_ID-}"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

[ -n "$OVERRIDE_TEST_EMAIL" ] && TEST_EMAIL="$OVERRIDE_TEST_EMAIL"
[ -n "$OVERRIDE_TEST_PASSWORD" ] && TEST_PASSWORD="$OVERRIDE_TEST_PASSWORD"
[ -n "$OVERRIDE_TEST_ORG_ID" ] && TEST_ORG_ID="$OVERRIDE_TEST_ORG_ID"

required_vars="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY TEST_EMAIL TEST_PASSWORD TEST_ORG_ID"
missing=""

for var in $required_vars; do
  eval "value=\${$var-}"
  if [ -z "$value" ]; then
    missing="$missing $var"
  fi
done

if [ -n "$missing" ]; then
  echo "Missing required vars for smoke test:$missing" >&2
  exit 1
fi

APP_BASE_URL="${TEST_APP_BASE_URL:-http://localhost:${APP_PORT:-3001}}"

AUTH_JSON=$(curl -sS -X POST "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")
TOKEN=$(echo "$AUTH_JSON" | grep -o '"access_token":"[^"]*' | head -n1 | cut -d '"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Auth failed in smoke test" >&2
  echo "$AUTH_JSON" >&2
  exit 1
fi

STATUS=$(curl -sS -o /tmp/smoke_post_note.json -w '%{http_code}' \
  "${APP_BASE_URL}/api/notes?orgId=${TEST_ORG_ID}" \
  -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"smoke-notes-create","content":"smoke","visibility":"private"}')

if [ "$STATUS" -ne 201 ]; then
  echo "Smoke notes create failed with status $STATUS" >&2
  cat /tmp/smoke_post_note.json >&2
  exit 1
fi

echo "Smoke notes create passed (201)."
cat /tmp/smoke_post_note.json
