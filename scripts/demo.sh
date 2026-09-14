#!/usr/bin/env bash
set -euo pipefail

API="${API:-http://localhost:4000/v1}"
UNIT_ID="${1:-}"

if [[ -z "$UNIT_ID" ]]; then
  echo "Usage: ./scripts/demo.sh <seeded-unit-id>"
  exit 1
fi

KEY="demo-$(date +%s)"

echo "1/4 Creating hold..."
HOLD=$(curl -fsS -X POST "$API/holds" -H 'content-type: application/json' -d "{\"unitId\":\"$UNIT_ID\",\"checkIn\":\"2026-10-10\",\"checkOut\":\"2026-10-13\",\"idempotencyKey\":\"$KEY\"}")
echo "$HOLD"
HOLD_ID=$(printf '%s' "$HOLD" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

echo "2/4 Retrying same hold idempotently..."
curl -fsS -X POST "$API/holds" -H 'content-type: application/json' -d "{\"unitId\":\"$UNIT_ID\",\"checkIn\":\"2026-10-10\",\"checkOut\":\"2026-10-13\",\"idempotencyKey\":\"$KEY\"}"
echo

echo "3/4 Creating booking..."
BOOKING=$(curl -fsS -X POST "$API/bookings" -H 'content-type: application/json' -d "{\"holdId\":\"$HOLD_ID\",\"guestName\":\"Alex Rivera\",\"guestEmail\":\"alex@example.com\"}")
echo "$BOOKING"
BOOKING_ID=$(printf '%s' "$BOOKING" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

echo "4/4 Confirming payment twice (second delivery should be a no-op)..."
EVENT="evt-$(date +%s)"
PAYLOAD="{\"eventId\":\"$EVENT\",\"bookingId\":\"$BOOKING_ID\",\"providerRef\":\"pay-demo\",\"status\":\"SUCCEEDED\"}"
curl -fsS -X POST "$API/payments/webhook" -H 'content-type: application/json' -d "$PAYLOAD"
echo
curl -fsS -X POST "$API/payments/webhook" -H 'content-type: application/json' -d "$PAYLOAD"
echo
