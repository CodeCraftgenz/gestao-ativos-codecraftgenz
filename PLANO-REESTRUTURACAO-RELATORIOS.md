# Plano de Reestruturação: Módulo de Relatórios

**Data:** 2026-01-16
**Autor:** Tech Lead / Arquiteto de Software
**Versão:** 1.0

---

## 1. RESUMO EXECUTIVO

### Contexto
O sistema de gestão de ativos está passando por uma reestruturação para garantir conformidade com LGPD. A decisão técnica e legal é **remover completamente** a coleta e exibição de:
- Inventário de Software (aplicativos instalados)
- Inventário de Hardware (modelo CPU, serial, etc.)

### Objetivo
Reestruturar o módulo de relatórios para focar em **métricas operacionais agregadas** que não exponham dados pessoais ou comportamentais individuais.

---

## 2. ANÁLISE DO ESTADO ATUAL

### 2.1 Frontend - Reports.tsx

**Relatórios Existentes:**

| ID | Nome | Categoria | Status |
|----|------|-----------|--------|
| `uptime` | Uptime dos Dispositivos | dispositivos | ✅ MANTER |
| `activity` | Atividade por Período | dispositivos | ✅ MANTER |
| `usage` | Uso de Recursos | desempenho | ⚠️ AJUSTAR |
| `idle` | Dispositivos Ociosos | desempenho | ✅ MANTER |
| `users` | Usuários por Dispositivo | usuarios | ⚠️ AJUSTAR |
| `inventory` | Inventário de Hardware | inventario | ❌ REMOVER |
| `software` | Inventário de Software | inventario | ❌ REMOVER |
| `growth` | Crescimento do Pátio | geral | ✅ MANTER |

### 2.2 Backend - admin.service.ts

**Funções de Analytics Existentes:**
- `getStats()` - ✅ OK - contagem de dispositivos
- `getHourlyActivity()` - ✅ OK - heartbeats por hora
- `getHealthSummary()` - ✅ OK - saúde agregada
- `getUsageMetrics()` - ✅ OK - métricas de ociosidade
- `getRecentActivity()` - ⚠️ AJUSTAR - remove `assigned_user`
- `getPlanUsage()` - ✅ OK - uso do plano

**Funções que acessam dados sensíveis:**
- `getDeviceById()` - Retorna `hardware`, `software`, `network`, `disks`

### 2.3 Banco de Dados

**Tabelas LGPD-Sensíveis:**
- `device_hardware` - Dados de hardware (CPU, RAM, GPU, serial)
- `device_software` - Aplicativos instalados (MUITO SENSÍVEL)
- `device_network` - MACs, IPs (parcialmente sensível)

---

## 3. RELATÓRIOS FINAIS

### 3.1 Relatórios MANTIDOS (6)

| # | ID | Nome | Descrição LGPD-Compliant | Dados Usados |
|---|-----|------|--------------------------|--------------|
| 1 | `uptime` | Uptime dos Dispositivos | Tempo online/offline agregado por período | `device_heartbeats.received_at` |
| 2 | `activity` | Atividade por Período | Heartbeats e eventos técnicos agregados | `device_heartbeats`, `device_activity_events` |
| 3 | `usage` | Uso de Recursos | MÉDIAS de CPU/RAM/Disco por período (sem processos) | `device_heartbeats.cpu_percent`, `ram_percent` |
| 4 | `idle` | Dispositivos Ociosos | Ranking por baixa atividade (heartbeat/uso) | `device_heartbeats`, score calculado |
| 5 | `users` | Sessões por Dispositivo | Quantidade de trocas de sessão (NÃO nomes) | `device_activity_events.event_type='login'` COUNT |
| 6 | `growth` | Crescimento do Pátio | Evolução do número de dispositivos | `devices.created_at` agregado |

### 3.2 Relatórios REMOVIDOS (2)

| # | ID | Nome | Motivo da Remoção |
|---|-----|------|-------------------|
| 1 | `inventory` | Inventário de Hardware | Expõe dados identificadores (serial, modelo específico) |
| 2 | `software` | Inventário de Software | **VIOLAÇÃO LGPD** - Expõe comportamento individual |

### 3.3 Categoria REMOVIDA

A categoria **"Inventário"** deve ser completamente removida do filtro de categorias.

---

## 4. AJUSTES NECESSÁRIOS

### 4.1 Frontend

#### A) Arquivo: `Reports.tsx`

**Remover do array `reportTypes`:**
```typescript
// REMOVER ESTAS ENTRADAS:
{
  id: 'inventory',
  name: 'Inventario de Hardware',
  description: 'Lista completa de hardware de todos os dispositivos',
  icon: HardDrive,
  category: 'inventario',
},
{
  id: 'software',
  name: 'Inventario de Software',
  description: 'Softwares instalados em cada dispositivo',
  icon: Monitor,
  category: 'inventario',
},
```

**Remover do array `categories`:**
```typescript
// REMOVER:
{ id: 'inventario', name: 'Inventario' },
```

**Ajustar relatório `users`:**
```typescript
{
  id: 'users',
  name: 'Sessoes por Dispositivo',  // Renomear
  description: 'Quantidade de trocas de sessao por maquina (sem identificacao de usuarios)',
  icon: Users,
  category: 'dispositivos',  // Mudar categoria
},
```

#### B) Arquivo: `Layout.tsx`

Manter item de menu "Relatórios" como está (já usa feature gate).

#### C) Remover imports não utilizados

```typescript
// Remover se não usado em outro lugar:
import { HardDrive } from 'lucide-react';
```

### 4.2 Backend

#### A) Arquivo: `admin.service.ts`

**Função `getDeviceById()` - Remover retorno de dados sensíveis:**

```typescript
// DE:
return {
  ...device,
  hardware: hardware || undefined,
  disks: disks.length > 0 ? disks : undefined,
  network: network.length > 0 ? network : undefined,
  software: software.length > 0 ? software : undefined,
};

// PARA:
return {
  ...device,
  // Hardware, software e network removidos - LGPD compliance
  disks: disks.length > 0 ? disks.map(d => ({
    drive_letter: d.drive_letter,
    disk_type: d.disk_type,
    total_gb: d.total_gb,
    free_gb: d.free_gb,
    used_percent: d.used_percent,
    // serial_number e model REMOVIDOS
  })) : undefined,
};
```

**Função `getRecentActivity()` - Remover usuário:**

```typescript
// DE:
h.logged_user as assigned_user,

// PARA:
NULL as assigned_user,  // LGPD - não expor usuário logado
```

#### B) Criar rotas de relatórios dedicadas

**Arquivo: `gestao-ativos-server/src/api/admin/reports.routes.ts` (NOVO)**

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { featureGate } from '../../middleware/featureGate.middleware.js';
import * as reportsController from './reports.controller.js';

const router = Router();

// Todas as rotas requerem auth + feature 'reports'
router.use(authMiddleware);
router.use(featureGate('reports'));

router.get('/uptime', reportsController.getUptimeReport);
router.get('/activity', reportsController.getActivityReport);
router.get('/resource-usage', reportsController.getResourceUsageReport);
router.get('/idle-devices', reportsController.getIdleDevicesReport);
router.get('/session-changes', reportsController.getSessionChangesReport);
router.get('/fleet-growth', reportsController.getFleetGrowthReport);

export default router;
```

#### C) Criar controller de relatórios

**Arquivo: `gestao-ativos-server/src/api/admin/reports.controller.ts` (NOVO)**

Implementar endpoints que retornam dados agregados com validação de período.

#### D) Criar service de relatórios

**Arquivo: `gestao-ativos-server/src/api/admin/reports.service.ts` (NOVO)**

Queries SQL que retornam APENAS dados agregados, nunca individuais.

### 4.3 Banco de Dados

#### A) NÃO REMOVER tabelas existentes

As tabelas `device_hardware`, `device_software` e `device_network` devem ser MANTIDAS no schema mas:
1. **Parar de coletar** novos dados (já feito - InventoryCollector só coleta hardware/network)
2. **Não expor** via API
3. **Programar limpeza** após período de retenção

#### B) Criar view agregada para relatórios

```sql
-- View para relatório de uptime (agregado por dia)
CREATE OR REPLACE VIEW v_device_uptime_daily AS
SELECT
  device_id,
  DATE(received_at) as metric_date,
  COUNT(*) as heartbeat_count,
  MIN(received_at) as first_seen,
  MAX(received_at) as last_seen,
  TIMESTAMPDIFF(SECOND, MIN(received_at), MAX(received_at)) as online_seconds
FROM device_heartbeats
GROUP BY device_id, DATE(received_at);

-- View para relatório de uso de recursos (médias diárias)
CREATE OR REPLACE VIEW v_device_usage_daily AS
SELECT
  device_id,
  DATE(received_at) as metric_date,
  AVG(cpu_percent) as avg_cpu,
  AVG(ram_percent) as avg_ram,
  MIN(cpu_percent) as min_cpu,
  MAX(cpu_percent) as max_cpu
FROM device_heartbeats
GROUP BY device_id, DATE(received_at);
```

---

## 5. SUGESTÃO DE UX PARA PÁGINA DE RELATÓRIOS

### 5.1 Layout Proposto

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Relatórios                                              │
│  Gere relatórios operacionais do seu pátio de máquinas     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 Período: [7 dias ▼]    🏷️ [Todos ▼] [Dispositivos]│   │
│  │                           [Desempenho] [Geral]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ ⏱️ Uptime    │ │ 📈 Atividade │ │ 💻 Recursos  │       │
│  │              │ │              │ │              │       │
│  │ Tempo online │ │ Heartbeats   │ │ CPU/RAM/Disk │       │
│  │ por período  │ │ e eventos    │ │ médios       │       │
│  │              │ │              │ │              │       │
│  │ [Visualizar] │ │ [Visualizar] │ │ [Visualizar] │       │
│  │ [Exportar ▼] │ │ [Exportar ▼] │ │ [Exportar ▼] │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ 😴 Ociosos   │ │ 🔄 Sessões   │ │ 📊 Crescimento│       │
│  │              │ │              │ │              │       │
│  │ Ranking de   │ │ Trocas de    │ │ Evolução do  │       │
│  │ baixo uso    │ │ sessão       │ │ pátio        │       │
│  │              │ │              │ │              │       │
│  │ [Visualizar] │ │ [Visualizar] │ │ [Visualizar] │       │
│  │ [Exportar ▼] │ │ [Exportar ▼] │ │ [Exportar ▼] │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Dados disponíveis por 90 dias (Plano Profissional)      │
│    Relatórios são agregados e não expõem dados individuais │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Melhorias de UX

1. **Filtro de período** - Seletor de datas com presets (7d, 15d, 30d, 90d)
2. **Estados vazios** - Mensagem clara quando não há dados no período
3. **Loading skeleton** - Indicador visual durante carregamento
4. **Exportação** - Dropdown com CSV, Excel, PDF
5. **Preview inline** - Mini-gráfico no card antes de expandir
6. **Conformidade visual** - Badge "LGPD Compliant" no rodapé

### 5.3 Modal de Visualização

Ao clicar em "Visualizar", abrir modal/drawer com:
- Gráfico principal (Recharts)
- Tabela de dados agregados
- Botão de exportação
- Filtros adicionais (filial, departamento)

---

## 6. CHECKLIST DE CONFORMIDADE LGPD

### 6.1 Dados que NÃO PODEM ser expostos

| Dado | Motivo | Ação |
|------|--------|------|
| Nome de usuário logado | Identifica pessoa | Remover de `getRecentActivity()` |
| Lista de softwares | Comportamento individual | Não coletar, não exibir |
| Serial/modelo de hardware | Identificador único | Não expor via API |
| Histórico de login por usuário | Rastreamento individual | Agregar apenas contagem |
| IP do usuário | Dado pessoal | Usar apenas para GeoIP agregado |
| MAC address | Identificador único | Não expor em relatórios |

### 6.2 Dados PERMITIDOS (agregados)

| Dado | Nível | Justificativa |
|------|-------|---------------|
| Contagem de dispositivos | Agregado | Métrica operacional |
| Uptime por dispositivo | Por máquina | Gestão de ativos (sem pessoa) |
| Média de CPU/RAM | Agregado | Capacidade e performance |
| Heartbeats por hora | Agregado | Monitoramento técnico |
| Trocas de sessão (contagem) | Por máquina | Segurança, sem identificar quem |
| Crescimento do pátio | Agregado | Planejamento estratégico |

### 6.3 Princípios Aplicados

- [x] **Minimização** - Coletar apenas o necessário
- [x] **Finalidade** - Dados apenas para gestão operacional
- [x] **Privacy by Design** - Agregação desde a coleta
- [x] **Transparência** - Informar que dados são agregados
- [x] **Segurança** - Feature gate por plano

---

## 7. PONTOS DE ATENÇÃO E RISCOS

### 7.1 Riscos Técnicos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Tabelas antigas com dados sensíveis | Vazamento se expostas | Não expor via API, programar purge |
| Logs com dados pessoais | Vazamento em debug | Sanitizar logs, usar masking |
| Cache com dados antigos | Exposição temporária | Invalidar cache após mudanças |
| Agente coletando hardware | Dados ainda chegam | OK - não expor, usar só para identificação |

### 7.2 Riscos de Negócio

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Usuários querendo inventário | Insatisfação | Comunicar mudança, oferecer alternativas |
| Perda de funcionalidade | Churn | Reforçar valor dos relatórios operacionais |
| Concorrência com inventário | Desvantagem competitiva | Posicionar como diferencial de privacidade |

### 7.3 Riscos de Compliance

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Dados antigos no banco | Multa LGPD | Criar job de limpeza periódica |
| Relatório "Usuários" ambíguo | Interpretação errada | Renomear para "Sessões" |
| Exportação CSV com dados | Vazamento externo | Garantir que CSV também é agregado |

---

## 8. PLANO DE IMPLEMENTAÇÃO

### Fase 1: Frontend (Imediato)
1. Remover relatórios de inventário de `Reports.tsx`
2. Remover categoria "Inventário"
3. Renomear "Usuários por Dispositivo" → "Sessões por Dispositivo"
4. Ajustar descrições para deixar claro que são dados agregados

### Fase 2: Backend (Curto prazo)
1. Remover retorno de `hardware`, `software` em `getDeviceById()`
2. Anonimizar `logged_user` em `getRecentActivity()`
3. Criar rotas dedicadas `/api/reports/*`
4. Implementar controllers e services de relatórios

### Fase 3: Banco de Dados (Médio prazo)
1. Criar views agregadas para relatórios
2. Criar job de purge de dados antigos
3. Documentar política de retenção

### Fase 4: Testes e Deploy
1. Testes de integração para novas rotas
2. Verificar que APIs antigas não expõem dados
3. Deploy gradual com feature flag
4. Monitorar erros e feedback

---

## 9. ARQUIVOS A MODIFICAR

### Frontend (`gestao-ativos-admin`)

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `src/pages/Reports.tsx` | Remover inventários, ajustar users | 22-88 |
| `src/types/index.ts` | Verificar tipos não usados | - |

### Backend (`gestao-ativos-server`)

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `src/api/admin/admin.service.ts` | Remover dados sensíveis | 109-158, 398-422 |
| `src/api/admin/reports.routes.ts` | CRIAR | - |
| `src/api/admin/reports.controller.ts` | CRIAR | - |
| `src/api/admin/reports.service.ts` | CRIAR | - |
| `src/api/admin/admin.routes.ts` | Importar reports routes | - |

### Banco de Dados

| Arquivo | Ação |
|---------|------|
| `scripts/migration-reports-views.sql` | CRIAR views agregadas |
| `scripts/purge-sensitive-data.sql` | CRIAR job de limpeza |

---

## 10. CONCLUSÃO

A reestruturação do módulo de relatórios é **necessária e viável**.

**Benefícios:**
- Conformidade total com LGPD
- Redução de risco jurídico
- Posicionamento como ferramenta privacy-first
- Simplificação da manutenção

**Trade-offs:**
- Perda de funcionalidade de inventário
- Necessidade de comunicar mudança aos usuários

**Recomendação:** Implementar as mudanças em fases, começando pelo frontend para remover a exposição visual imediatamente, seguido pelo backend para garantir que as APIs não retornem dados sensíveis.

---

*Documento gerado para revisão técnica e legal antes da implementação.*
