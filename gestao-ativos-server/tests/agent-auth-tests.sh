#!/bin/bash
# =============================================================================
# TESTES DE AUTENTICACAO DO AGENTE
# Bateria de testes para reproduzir cenarios de falha
# =============================================================================

BASE_URL="${1:-https://gestao-ativos-codecraftgenz.onrender.com}"
VALID_TOKEN="${2:-}"  # Passar token valido como segundo argumento

echo "=============================================="
echo "TESTES DE AUTENTICACAO - /api/agent/heartbeat"
echo "Base URL: $BASE_URL"
echo "=============================================="

# Funcao helper para fazer request e mostrar resultado
test_request() {
    local test_name="$1"
    local expected_status="$2"
    shift 2

    echo ""
    echo "--- TEST: $test_name ---"
    echo "Expected Status: $expected_status"

    response=$(curl -s -w "\n%{http_code}" "$@")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)

    echo "Actual Status: $status"
    echo "Response Body: $body"

    if [ "$status" = "$expected_status" ]; then
        echo "RESULT: PASS"
    else
        echo "RESULT: FAIL"
    fi
}

# =============================================================================
# CENARIO 1: Request sem token
# =============================================================================
test_request "Sem Authorization header" "401" \
    -X POST "$BASE_URL/api/agent/heartbeat" \
    -H "Content-Type: application/json" \
    -d '{"device_id":"00000000-0000-0000-0000-000000000000","timestamp":"2026-01-16T23:00:00.000Z"}'

# =============================================================================
# CENARIO 2: Token invalido (formato errado)
# =============================================================================
test_request "Token invalido (nao eh JWT)" "401" \
    -X POST "$BASE_URL/api/agent/heartbeat" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer invalidtoken123" \
    -d '{"device_id":"00000000-0000-0000-0000-000000000000","timestamp":"2026-01-16T23:00:00.000Z"}'

# =============================================================================
# CENARIO 3: Token expirado (JWT valido mas expirado)
# =============================================================================
# Este JWT foi gerado com exp no passado
EXPIRED_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImRldmljZV9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImhvc3RuYW1lIjoidGVzdCIsInR5cGUiOiJhZ2VudCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDAxfQ.invalid"

test_request "Token expirado" "401" \
    -X POST "$BASE_URL/api/agent/heartbeat" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EXPIRED_JWT" \
    -d '{"device_id":"00000000-0000-0000-0000-000000000000","timestamp":"2026-01-16T23:00:00.000Z"}'

# =============================================================================
# CENARIO 4: Token valido mas device_id nao bate
# =============================================================================
if [ -n "$VALID_TOKEN" ]; then
    test_request "Token valido com device_id errado no body" "400" \
        -X POST "$BASE_URL/api/agent/heartbeat" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -d '{"device_id":"99999999-9999-9999-9999-999999999999","timestamp":"2026-01-16T23:00:00.000Z"}'
fi

# =============================================================================
# CENARIO 5: Authorization header mal formatado
# =============================================================================
test_request "Authorization sem Bearer prefix" "401" \
    -X POST "$BASE_URL/api/agent/heartbeat" \
    -H "Content-Type: application/json" \
    -H "Authorization: $VALID_TOKEN" \
    -d '{"device_id":"00000000-0000-0000-0000-000000000000","timestamp":"2026-01-16T23:00:00.000Z"}'

# =============================================================================
# CENARIO 6: Content-Type errado
# =============================================================================
test_request "Content-Type form-urlencoded" "400" \
    -X POST "$BASE_URL/api/agent/heartbeat" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "Authorization: Bearer ${VALID_TOKEN:-dummy}" \
    -d 'device_id=00000000-0000-0000-0000-000000000000&timestamp=2026-01-16T23:00:00.000Z'

# =============================================================================
# CENARIO 7: Body vazio
# =============================================================================
test_request "Body vazio" "400" \
    -X POST "$BASE_URL/api/agent/heartbeat" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${VALID_TOKEN:-dummy}"

# =============================================================================
# CENARIO 8: Body invalido (JSON malformado)
# =============================================================================
test_request "JSON malformado" "400" \
    -X POST "$BASE_URL/api/agent/heartbeat" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${VALID_TOKEN:-dummy}" \
    -d '{invalid json}'

# =============================================================================
# CENARIO 9: Token valido (se fornecido)
# =============================================================================
if [ -n "$VALID_TOKEN" ]; then
    # Extrair device_id do token (decode JWT payload)
    PAYLOAD=$(echo "$VALID_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null || echo "")
    DEVICE_ID=$(echo "$PAYLOAD" | grep -o '"device_id":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$DEVICE_ID" ]; then
        test_request "Token valido com dados corretos" "200" \
            -X POST "$BASE_URL/api/agent/heartbeat" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $VALID_TOKEN" \
            -d "{\"device_id\":\"$DEVICE_ID\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}"
    else
        echo "Nao foi possivel extrair device_id do token"
    fi
fi

echo ""
echo "=============================================="
echo "TESTES CONCLUIDOS"
echo "=============================================="
