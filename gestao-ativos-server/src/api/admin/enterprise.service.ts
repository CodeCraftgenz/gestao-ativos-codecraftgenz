import { pool } from '../../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  SSOConfig,
  SSOProvider,
  WebhookConfig,
  WebhookEvent,
  WebhookLog,
  OrganizationBranding,
  ApiToken,
  PlanFeatures,
} from '../../types/index.js';
import crypto from 'crypto';

// =============================================================================
// SSO CONFIG SERVICE
// =============================================================================

export async function getSSOConfig(userId: number): Promise<SSOConfig | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM sso_configs WHERE user_id = ?`,
    [userId]
  );
  return rows.length > 0 ? (rows[0] as SSOConfig) : null;
}

export async function createSSOConfig(
  userId: number,
  provider: SSOProvider,
  config: {
    client_id?: string;
    client_secret?: string;
    tenant_id?: string;
    domain?: string;
    saml_metadata_url?: string;
    saml_entity_id?: string;
    saml_sso_url?: string;
    saml_certificate?: string;
  }
): Promise<SSOConfig> {
  // Encrypta o client_secret se fornecido
  const encryptedSecret = config.client_secret
    ? encryptSecret(config.client_secret)
    : null;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO sso_configs
      (user_id, provider, client_id, client_secret_encrypted, tenant_id, domain,
       saml_metadata_url, saml_entity_id, saml_sso_url, saml_certificate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      provider,
      config.client_id || null,
      encryptedSecret,
      config.tenant_id || null,
      config.domain || null,
      config.saml_metadata_url || null,
      config.saml_entity_id || null,
      config.saml_sso_url || null,
      config.saml_certificate || null,
    ]
  );

  return (await getSSOConfig(userId))!;
}

export async function updateSSOConfig(
  userId: number,
  updates: Partial<{
    provider: SSOProvider;
    client_id: string;
    client_secret: string;
    tenant_id: string;
    domain: string;
    saml_metadata_url: string;
    saml_entity_id: string;
    saml_sso_url: string;
    saml_certificate: string;
    is_enabled: boolean;
  }>
): Promise<SSOConfig | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.provider !== undefined) {
    fields.push('provider = ?');
    values.push(updates.provider);
  }
  if (updates.client_id !== undefined) {
    fields.push('client_id = ?');
    values.push(updates.client_id);
  }
  if (updates.client_secret !== undefined) {
    fields.push('client_secret_encrypted = ?');
    values.push(encryptSecret(updates.client_secret));
  }
  if (updates.tenant_id !== undefined) {
    fields.push('tenant_id = ?');
    values.push(updates.tenant_id);
  }
  if (updates.domain !== undefined) {
    fields.push('domain = ?');
    values.push(updates.domain);
  }
  if (updates.saml_metadata_url !== undefined) {
    fields.push('saml_metadata_url = ?');
    values.push(updates.saml_metadata_url);
  }
  if (updates.saml_entity_id !== undefined) {
    fields.push('saml_entity_id = ?');
    values.push(updates.saml_entity_id);
  }
  if (updates.saml_sso_url !== undefined) {
    fields.push('saml_sso_url = ?');
    values.push(updates.saml_sso_url);
  }
  if (updates.saml_certificate !== undefined) {
    fields.push('saml_certificate = ?');
    values.push(updates.saml_certificate);
  }
  if (updates.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(updates.is_enabled);
  }

  if (fields.length === 0) return getSSOConfig(userId);

  values.push(userId);
  await pool.query(`UPDATE sso_configs SET ${fields.join(', ')} WHERE user_id = ?`, values);

  return getSSOConfig(userId);
}

export async function deleteSSOConfig(userId: number): Promise<void> {
  await pool.query(`DELETE FROM sso_configs WHERE user_id = ?`, [userId]);
}

// =============================================================================
// WEBHOOK SERVICE
// =============================================================================

export async function getWebhooks(userId: number): Promise<WebhookConfig[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM webhook_configs WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    ...row,
    events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
    custom_headers: row.custom_headers
      ? typeof row.custom_headers === 'string'
        ? JSON.parse(row.custom_headers)
        : row.custom_headers
      : null,
  })) as WebhookConfig[];
}

export async function getWebhookById(
  userId: number,
  webhookId: number
): Promise<WebhookConfig | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM webhook_configs WHERE id = ? AND user_id = ?`,
    [webhookId, userId]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
    custom_headers: row.custom_headers
      ? typeof row.custom_headers === 'string'
        ? JSON.parse(row.custom_headers)
        : row.custom_headers
      : null,
  } as WebhookConfig;
}

export async function createWebhook(
  userId: number,
  data: {
    name: string;
    url: string;
    events: WebhookEvent[];
    secret_key?: string;
    custom_headers?: Record<string, string>;
  }
): Promise<WebhookConfig> {
  const secretKey = data.secret_key || generateWebhookSecret();

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO webhook_configs (user_id, name, url, secret_key, events, custom_headers)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.name,
      data.url,
      secretKey,
      JSON.stringify(data.events),
      data.custom_headers ? JSON.stringify(data.custom_headers) : null,
    ]
  );

  return (await getWebhookById(userId, result.insertId))!;
}

export async function updateWebhook(
  userId: number,
  webhookId: number,
  updates: Partial<{
    name: string;
    url: string;
    events: WebhookEvent[];
    secret_key: string;
    custom_headers: Record<string, string>;
    is_enabled: boolean;
  }>
): Promise<WebhookConfig | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.url !== undefined) {
    fields.push('url = ?');
    values.push(updates.url);
  }
  if (updates.events !== undefined) {
    fields.push('events = ?');
    values.push(JSON.stringify(updates.events));
  }
  if (updates.secret_key !== undefined) {
    fields.push('secret_key = ?');
    values.push(updates.secret_key);
  }
  if (updates.custom_headers !== undefined) {
    fields.push('custom_headers = ?');
    values.push(JSON.stringify(updates.custom_headers));
  }
  if (updates.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(updates.is_enabled);
  }

  if (fields.length === 0) return getWebhookById(userId, webhookId);

  values.push(webhookId, userId);
  await pool.query(
    `UPDATE webhook_configs SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  return getWebhookById(userId, webhookId);
}

export async function deleteWebhook(userId: number, webhookId: number): Promise<void> {
  await pool.query(`DELETE FROM webhook_configs WHERE id = ? AND user_id = ?`, [
    webhookId,
    userId,
  ]);
}

export async function getWebhookLogs(
  userId: number,
  webhookId: number,
  limit: number = 50
): Promise<WebhookLog[]> {
  // Verifica se o webhook pertence ao usuario
  const webhook = await getWebhookById(userId, webhookId);
  if (!webhook) return [];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM webhook_logs WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?`,
    [webhookId, limit]
  );

  return rows.map((row) => ({
    ...row,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
  })) as WebhookLog[];
}

// Funcao para disparar webhooks (sera chamada de outros services)
export async function triggerWebhooks(
  userId: number,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const webhooks = await getWebhooks(userId);
  const activeWebhooks = webhooks.filter(
    (w) => w.is_enabled && w.events.includes(event)
  );

  for (const webhook of activeWebhooks) {
    // Dispara em background (nao bloqueia)
    triggerSingleWebhook(webhook, event, payload).catch((err) =>
      console.error(`Webhook ${webhook.id} falhou:`, err)
    );
  }
}

async function triggerSingleWebhook(
  webhook: WebhookConfig,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const startTime = Date.now();
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  // Cria assinatura HMAC
  const signature = webhook.secret_key
    ? crypto.createHmac('sha256', webhook.secret_key).update(body).digest('hex')
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': event,
    'X-Webhook-Timestamp': new Date().toISOString(),
    ...(signature && { 'X-Webhook-Signature': `sha256=${signature}` }),
    ...(webhook.custom_headers || {}),
  };

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    statusCode = response.status;
    responseBody = await response.text().catch(() => null);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  const responseTimeMs = Date.now() - startTime;
  const isSuccess = statusCode !== null && statusCode >= 200 && statusCode < 300;

  // Atualiza estatisticas do webhook
  await pool.query(
    `UPDATE webhook_configs
     SET last_triggered_at = NOW(),
         last_status_code = ?,
         total_calls = total_calls + 1,
         total_failures = total_failures + ?
     WHERE id = ?`,
    [statusCode, isSuccess ? 0 : 1, webhook.id]
  );

  // Salva log
  await pool.query(
    `INSERT INTO webhook_logs (webhook_id, event_type, payload, status_code, response_body, response_time_ms, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      webhook.id,
      event,
      body,
      statusCode,
      responseBody?.substring(0, 1000), // Limita tamanho
      responseTimeMs,
      errorMessage,
    ]
  );
}

// =============================================================================
// BRANDING SERVICE (WHITE-LABEL)
// =============================================================================

export async function getBranding(userId: number): Promise<OrganizationBranding | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM organization_branding WHERE user_id = ?`,
    [userId]
  );
  return rows.length > 0 ? (rows[0] as OrganizationBranding) : null;
}

export async function createOrUpdateBranding(
  userId: number,
  data: Partial<{
    company_name: string;
    logo_url: string;
    logo_light_url: string;
    favicon_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    login_title: string;
    login_subtitle: string;
    footer_text: string;
    custom_domain: string;
    is_enabled: boolean;
  }>
): Promise<OrganizationBranding> {
  const existing = await getBranding(userId);

  if (existing) {
    const fields: string[] = [];
    const values: unknown[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE organization_branding SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );
    }
  } else {
    await pool.query(
      `INSERT INTO organization_branding
        (user_id, company_name, logo_url, logo_light_url, favicon_url,
         primary_color, secondary_color, accent_color, login_title, login_subtitle,
         footer_text, custom_domain, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.company_name || null,
        data.logo_url || null,
        data.logo_light_url || null,
        data.favicon_url || null,
        data.primary_color || '#3B82F6',
        data.secondary_color || '#1E40AF',
        data.accent_color || '#10B981',
        data.login_title || null,
        data.login_subtitle || null,
        data.footer_text || null,
        data.custom_domain || null,
        data.is_enabled || false,
      ]
    );
  }

  return (await getBranding(userId))!;
}

export async function deleteBranding(userId: number): Promise<void> {
  await pool.query(`DELETE FROM organization_branding WHERE user_id = ?`, [userId]);
}

// =============================================================================
// API TOKEN SERVICE
// =============================================================================

export async function getApiTokens(userId: number): Promise<ApiToken[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, name, token_prefix, scopes, rate_limit_per_minute,
            last_used_at, total_requests, expires_at, revoked_at, revoke_reason, created_at
     FROM api_tokens
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    ...row,
    scopes: typeof row.scopes === 'string' ? JSON.parse(row.scopes) : row.scopes,
  })) as ApiToken[];
}

export async function createApiToken(
  userId: number,
  data: {
    name: string;
    scopes?: string[];
    rate_limit_per_minute?: number;
    expires_at?: Date;
  }
): Promise<{ token: ApiToken; plainToken: string }> {
  // Gera token aleatorio
  const plainToken = `pat_${crypto.randomBytes(32).toString('hex')}`;
  const tokenHash = hashToken(plainToken);
  const tokenPrefix = plainToken.substring(0, 10);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO api_tokens (user_id, name, token_hash, token_prefix, scopes, rate_limit_per_minute, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.name,
      tokenHash,
      tokenPrefix,
      JSON.stringify(data.scopes || ['read']),
      data.rate_limit_per_minute || 60,
      data.expires_at || null,
    ]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM api_tokens WHERE id = ?`,
    [result.insertId]
  );

  const token = {
    ...rows[0],
    scopes: typeof rows[0].scopes === 'string' ? JSON.parse(rows[0].scopes) : rows[0].scopes,
  } as ApiToken;

  return { token, plainToken };
}

export async function revokeApiToken(
  userId: number,
  tokenId: number,
  reason?: string
): Promise<void> {
  await pool.query(
    `UPDATE api_tokens
     SET revoked_at = NOW(), revoke_reason = ?
     WHERE id = ? AND user_id = ?`,
    [reason || 'Revogado pelo usuario', tokenId, userId]
  );
}

export async function validateApiToken(
  plainToken: string
): Promise<{ valid: boolean; userId?: number; scopes?: string[] }> {
  const tokenHash = hashToken(plainToken);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, scopes, expires_at, revoked_at
     FROM api_tokens
     WHERE token_hash = ?`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return { valid: false };
  }

  const token = rows[0];

  // Verifica se foi revogado
  if (token.revoked_at) {
    return { valid: false };
  }

  // Verifica se expirou
  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    return { valid: false };
  }

  // Atualiza estatisticas
  await pool.query(
    `UPDATE api_tokens SET last_used_at = NOW(), total_requests = total_requests + 1 WHERE id = ?`,
    [token.id]
  );

  return {
    valid: true,
    userId: token.user_id,
    scopes: typeof token.scopes === 'string' ? JSON.parse(token.scopes) : token.scopes,
  };
}

// =============================================================================
// PLAN FEATURES SERVICE
// =============================================================================

export async function getPlanFeatures(userId: number): Promise<PlanFeatures | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.features, p.data_retention_days, p.max_devices
     FROM subscriptions s
     JOIN plans p ON s.plan_id = p.id
     WHERE s.user_id = ? AND s.status = 'active'
     ORDER BY s.started_at DESC
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    // Retorna features do plano gratuito
    return {
      max_devices: 5,
      data_retention_days: 7,
      // Features basicas
      reports: false,
      alerts: false,
      geoip: false,
      remote_access: false,
      // Features avancadas
      api_access: false,
      audit_logs: false,
      audit_log_export: false,
      shadow_it_alert: false,
      // Features enterprise
      webhooks: false,
      sso_enabled: false,
      white_label: false,
      msi_installer: false,
      priority_support: false,
    };
  }

  const row = rows[0];
  if (row.features) {
    return typeof row.features === 'string' ? JSON.parse(row.features) : row.features;
  }

  // Fallback para planos sem JSON features
  return {
    max_devices: row.max_devices,
    data_retention_days: row.data_retention_days,
    // Features basicas
    reports: true,
    alerts: true,
    geoip: true,
    remote_access: true,
    // Features avancadas
    api_access: false,
    audit_logs: false,
    audit_log_export: false,
    shadow_it_alert: false,
    // Features enterprise
    webhooks: false,
    sso_enabled: false,
    white_label: false,
    msi_installer: false,
    priority_support: false,
  };
}

export async function hasFeature(userId: number, feature: keyof PlanFeatures): Promise<boolean> {
  const features = await getPlanFeatures(userId);
  if (!features) return false;

  const value = features[feature];
  return typeof value === 'boolean' ? value : value !== undefined && value !== null;
}

// =============================================================================
// HELPERS
// =============================================================================

function encryptSecret(secret: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-32bytes!!';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
