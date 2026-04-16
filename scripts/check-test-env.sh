#!/usr/bin/env sh
set -eu

if [ -f .env.test ]; then
  set -a
  . ./.env.test
  set +a
fi

required_vars="TEST_EMAIL TEST_PASSWORD TEST_ORG_ID TEST_NOTE_ID TEST_USER1_EMAIL TEST_USER1_PASSWORD TEST_USER2_EMAIL TEST_USER2_PASSWORD"
missing=""

for var in $required_vars; do
  eval "value=\${$var-}"
  if [ -z "$value" ]; then
    missing="$missing $var"
  fi
done

if [ -n "$missing" ]; then
  echo "Missing required test env vars:$missing" >&2
  echo "Tip: copy .env.test.example to .env.test and fill all values." >&2
  exit 1
fi

echo "All required test env vars are set."
