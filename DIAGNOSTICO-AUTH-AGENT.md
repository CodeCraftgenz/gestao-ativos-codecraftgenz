# Diagnóstico: "Falha na autenticação do agente"

**Data:** 2026-01-16
**Erro:** `AppError "Falha na autenticacao do agente"` em `POST /api/agent/heartbeat`

---

## 1. RESUMO EXECUTIVO

### Causa Raiz Identificada
**HASH MISMATCH** - O hash SHA-256 do token calculado no heartbeat não corresponde ao hash salvo durante o enrollment.

### Fluxo do Problema
```
1. Enrollment: Token gerado → Hash calculado → Salvo no banco
2. Heartbeat: Token enviado → Hash recalculado → NÃO ENCONTRA no banco
3. Resultado: 401 Unauthorized "Token revogado ou dispositivo nao encontrado"
```

### Hipóteses Principais
1. **Token sendo modificado em trânsito** (encoding, whitespace, truncamento)
2. **Race condition**: Múltiplos enrollments revogando tokens
3. **Encoding diferente** entre C# e Node.js no cálculo do SHA-256

---

## 2. ARQUITETURA DE AUTENTICAÇÃO

### Arquivos Envolvidos

| Componente | Arquivo | Responsabilidade |
|------------|---------|------------------|
| Rota | `agent.routes.ts:33` | Define middleware na rota |
| Middleware | `agentAuth.middleware.ts` | Valida JWT + hash |
| Token Gen | `token.util.ts:109-124` | Gera JWT do agente |
| Hash | `hash.util.ts:46-48` | SHA-256 do token |
| Credenciais | `agent.service.ts:271-308` | Salva hash no banco |
| C# Client | `ApiClient.cs` | Envia token no header |
| C# Storage | `LocalStorage.cs` | Persiste token localmente |

### Fluxo Detalhado

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PatioAgent    │     │    Backend      │     │     MySQL       │
│     (C#)        │     │   (Node.js)     │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ POST /enroll          │                       │
         ├──────────────────────>│                       │
         │                       │                       │
         │                       │ generateAgentAccessToken()
         │                       │ → JWT com payload:    │
         │                       │   { sub, device_id,   │
         │                       │     hostname, type }  │
         │                       │                       │
         │                       │ hashAgentToken(jwt)   │
         │                       │ → SHA256(jwt).hex()   │
         │                       │                       │
         │                       │ INSERT INTO device_credentials
         │                       ├──────────────────────>│
         │                       │                       │
         │ { agent_token: jwt }  │                       │
         │<──────────────────────┤                       │
         │                       │                       │
         │ storage.UpdateTokens(jwt)                     │
         │ [Salva em DPAPI]      │                       │
         │                       │                       │
         │ POST /heartbeat       │                       │
         │ Authorization: Bearer jwt                     │
         ├──────────────────────>│                       │
         │                       │                       │
         │                       │ extractBearerToken()  │
         │                       │ verifyAgentToken(jwt) │
         │                       │ hashAgentToken(jwt)   │
         │                       │ → SHA256(jwt).hex()   │
         │                       │                       │
         │                       │ SELECT WHERE hash = ? │
         │                       ├──────────────────────>│
         │                       │                       │
         │                       │ ❌ 0 rows             │
         │                       │<──────────────────────┤
         │                       │                       │
         │ 401 REVOKED_TOKEN     │                       │
         │<──────────────────────┤                       │
```

---

## 3. CHECKLIST DE CAUSAS COMUNS

| # | Causa | Status | Evidência |
|---|-------|--------|-----------|
| 1 | Token não está sendo enviado | ✅ OK | Log mostra `Auth header set` no agente |
| 2 | Header errado (não Bearer) | ✅ OK | Código usa `AuthenticationHeaderValue("Bearer", ...)` |
| 3 | Token expira antes do heartbeat | ✅ OK | Expiração é 30 dias (`AGENT_TOKEN_EXPIRES_IN`) |
| 4 | JWT secret diferente | ✅ OK | Mesmo `JWT_SECRET` no env do Render |
| 5 | Ambiente errado (URL) | ✅ OK | Agent aponta para URL de produção |
| 6 | Proxy removendo Authorization | ❓ INVESTIGAR | Render pode ter proxy reverso |
| 7 | Encoding diferente no hash | ⚠️ SUSPEITO | Node usa UTF-8, C# também, mas `ToHexString` pode diferir |
| 8 | Whitespace no token | ⚠️ SUSPEITO | JSON parse pode adicionar espaços |
| 9 | Token truncado | ❓ INVESTIGAR | DPAPI encryption pode ter limite |
| 10 | Race condition em re-enrollment | ⚠️ PROVÁVEL | Múltiplos enrollments revogam tokens |

---

## 4. DIAGNÓSTICO PROVÁVEL

### 4.1 Causa Mais Provável: **HASH ENCODING MISMATCH**

**Node.js:**
```javascript
// hash.util.ts:23
crypto.createHash('sha256').update(data).digest('hex')
// Resultado: "a1b2c3d4..." (lowercase)
```

**C# (adicionado para debug):**
```csharp
// ApiClient.cs:47-49
var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
return Convert.ToHexString(bytes).ToLowerInvariant();
// Resultado: "a1b2c3d4..." (deve ser igual)
```

### 4.2 Segunda Hipótese: **RACE CONDITION NO RE-ENROLLMENT**

Quando o agente recebe 401, ele faz novo enrollment que REVOGA o token atual:

```sql
-- agent.service.ts:290-293
UPDATE device_credentials
SET revoked_at = NOW(), revoke_reason = 'New token issued'
WHERE device_id = ? AND revoked_at IS NULL
```

Se o heartbeat acontece durante este processo, o token é revogado antes de ser usado.

---

## 5. CORREÇÕES IMPLEMENTADAS

### 5.1 Instrumentação Melhorada (Backend)

**Arquivo:** `agentAuth.middleware.ts`

Adicionados logs estruturados com:
- `correlationId` para rastrear requests
- `reason` específico: `missing_token`, `jwt_expired`, `jwt_invalid`, `hash_mismatch`, `token_revoked`, `device_blocked`
- Info segura do token (prefix, suffix, length, hashPrefix)
- Diagnóstico completo quando falha (lista de credenciais existentes)

### 5.2 Correlation ID (Agente C#)

**Arquivo:** `ApiClient.cs`

- Gera `X-Correlation-Id` único para cada request
- Log do hash calculado localmente para comparação
- Log seguro do token (não expõe completo)

### 5.3 Cooldown Anti-Loop (Agente)

**Arquivo:** `PatioWorker.cs`

- 2 minutos de cooldown entre enrollments
- Backoff exponencial após falhas
- 3 segundos de delay após enrollment antes do heartbeat

---

## 6. TESTES DE REPRODUÇÃO

### 6.1 Testes Manuais (curl)

```bash
# Executar bateria de testes
cd gestao-ativos-server/tests
chmod +x agent-auth-tests.sh
./agent-auth-tests.sh https://gestao-ativos-codecraftgenz.onrender.com [TOKEN_OPCIONAL]
```

### 6.2 Testes Unitários

```bash
# Rodar testes de autenticação
cd gestao-ativos-server
npx vitest run tests/agent-auth.test.ts
```

### Cenários Cobertos

| # | Cenário | Status Code Esperado |
|---|---------|---------------------|
| 1 | Sem Authorization header | 401 MISSING_TOKEN |
| 2 | Token inválido (não JWT) | 401 INVALID_TOKEN |
| 3 | Token expirado | 401 EXPIRED_TOKEN |
| 4 | Token válido mas revogado | 401 REVOKED_TOKEN |
| 5 | Device bloqueado | 403 DEVICE_BLOCKED |
| 6 | Device pendente | 401 PENDING_APPROVAL |
| 7 | Token válido | 200 |

---

## 7. PRÓXIMOS PASSOS

### Imediato (Hoje)

1. **Deploy do backend com novos logs**
   ```bash
   cd gestao-ativos-server
   git add -A
   git commit -m "fix(auth): improve agent auth logging with correlation-id"
   git push
   ```

2. **Rebuild do agente**
   ```bash
   cd PatioAgent
   dotnet publish -c Release
   ```

3. **Reinstalar agente e observar logs**
   - Verificar se o `hashPrefix` do agente bate com o do servidor
   - Usar `correlationId` para correlacionar logs

### Curto Prazo

4. **Se hash não bater:**
   - Verificar encoding UTF-8 em ambos os lados
   - Verificar se há BOM ou caracteres invisíveis
   - Comparar byte-a-byte o token original

5. **Se hash bater mas ainda falhar:**
   - Verificar se o `revoked_at` está sendo setado incorretamente
   - Adicionar transaction no enrollment para evitar race condition

### Médio Prazo

6. **Implementar refresh token automático**
   - Quando receber 401 EXPIRED_TOKEN, usar refresh token
   - Só fazer re-enrollment se refresh também falhar

7. **Retry com backoff inteligente**
   - Não fazer retry imediato em 401
   - Distinguir erros recuperáveis vs não-recuperáveis

---

## 8. ARQUIVOS MODIFICADOS

| Arquivo | Modificação |
|---------|-------------|
| `agentAuth.middleware.ts` | Logs estruturados, correlation-id, diagnóstico detalhado |
| `ApiClient.cs` | Correlation-id, log de hash local |
| `tests/agent-auth-tests.sh` | Bateria de testes curl |
| `tests/agent-auth.test.ts` | Testes unitários |

---

## 9. COMANDOS ÚTEIS

### Verificar logs do Render
```bash
# No dashboard do Render, aba Logs
# Filtrar por: "Agent auth failed" ou "correlationId"
```

### Verificar logs do agente local
```bash
# PowerShell
Get-Content "$env:LOCALAPPDATA\PatioAgent\logs\*.log" -Tail 100 -Wait
```

### Query para diagnóstico no banco
```sql
-- Ver credenciais de um device
SELECT
    dc.id,
    LEFT(dc.agent_token_hash, 16) as hash_prefix,
    dc.revoked_at,
    dc.revoke_reason,
    dc.created_at,
    dc.last_used_at
FROM device_credentials dc
JOIN devices d ON d.id = dc.device_id
WHERE d.hostname = 'JQ3G294'
ORDER BY dc.id DESC
LIMIT 10;

-- Ver devices com problemas de auth (muitas credenciais)
SELECT
    d.id,
    d.hostname,
    d.device_id,
    COUNT(dc.id) as cred_count,
    SUM(CASE WHEN dc.revoked_at IS NOT NULL THEN 1 ELSE 0 END) as revoked_count
FROM devices d
LEFT JOIN device_credentials dc ON dc.device_id = d.id
GROUP BY d.id
HAVING cred_count > 3
ORDER BY cred_count DESC;
```

---

## 10. CONCLUSÃO

O problema de autenticação é causado por uma combinação de:

1. **Hash não batendo** entre enrollment e heartbeat (causa raiz a confirmar via logs)
2. **Race condition** em re-enrollments que revogam tokens válidos

As correções implementadas adicionam a **observabilidade necessária** para identificar a causa exata e incluem **mitigações** (cooldown, backoff) para evitar loops destrutivos.

Após o deploy, os novos logs permitirão confirmar se o problema é:
- `hash_mismatch` → Problema de encoding
- `token_revoked` → Race condition
- `device_not_found` → Problema de dados
