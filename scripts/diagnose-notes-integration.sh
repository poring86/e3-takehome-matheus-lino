#!/usr/bin/env sh
set -eu

# Preserve explicit runtime overrides before loading .env
OVERRIDE_TEST_EMAIL="${TEST_EMAIL-}"
OVERRIDE_TEST_PASSWORD="${TEST_PASSWORD-}"
OVERRIDE_TEST_ORG_ID="${TEST_ORG_ID-}"

# Carregar .env se existir
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Re-apply explicit runtime overrides (if provided)
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
  echo "[ERROR] Missing required vars:$missing" >&2
  exit 1
fi

# 2. Autenticar no Supabase
AUTH_JSON=$(curl -sS -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'"}')
echo "[DEBUG] AUTH_JSON: $AUTH_JSON"
TOKEN=$(echo "$AUTH_JSON" | grep -o '"access_token":"[^"]*' | head -n1 | cut -d '"' -f4)
USER_ID=$(echo "$AUTH_JSON" | grep -o '"user_id":"[^"]*' | head -n1 | cut -d '"' -f4)
if [ -z "$USER_ID" ]; then
  USER_ID=$(echo "$AUTH_JSON" | grep -o '"id":"[^"]*' | head -n1 | cut -d '"' -f4)
fi

if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
  echo "[ERROR] Could not obtain token/user id from Supabase auth response" >&2
  exit 1
fi

echo "[INFO] TOKEN: $TOKEN"
echo "[INFO] USER_ID: $USER_ID"
echo "[INFO] ORG_ID: $TEST_ORG_ID"

# 3. Validar associação user/org
ORG_MEMBERS=$(curl -sS "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/org_members?select=id,org_id,user_id,role&user_id=eq.$USER_ID&org_id=eq.$TEST_ORG_ID" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TOKEN")
echo "[INFO] org_members para user/org: $ORG_MEMBERS"

# 4. Rodar teste de integração das notas
echo "[INFO] Rodando teste de integração das notas..."
TEST_EMAIL="$TEST_EMAIL" TEST_PASSWORD="$TEST_PASSWORD" TEST_ORG_ID="$TEST_ORG_ID" npx vitest run tests/api/notes.integration.test.ts

echo "[INFO] Script finalizado. Veja os logs acima para diagnóstico."
