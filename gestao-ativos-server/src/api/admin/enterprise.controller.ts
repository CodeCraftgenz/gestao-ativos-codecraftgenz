import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, SSOProvider, WebhookEvent } from '../../types/index.js';
import * as enterpriseService from './enterprise.service.js';

// =============================================================================
// SSO CONTROLLERS
// =============================================================================

export async function getSSOConfig(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    // Verifica se tem acesso ao recurso
    const hasAccess = await enterpriseService.hasFeature(userId, 'sso_enabled');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'SSO nao esta disponivel no seu plano. Faca upgrade para o plano Empresarial.',
      });
    }

    const config = await enterpriseService.getSSOConfig(userId);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function createSSOConfig(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'sso_enabled');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'SSO nao esta disponivel no seu plano.',
      });
    }

    const { provider, client_id, client_secret, tenant_id, domain, saml_metadata_url } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider e obrigatorio (azure_ad, google, okta, saml_generic)',
      });
    }

    const config = await enterpriseService.createSSOConfig(userId, provider as SSOProvider, {
      client_id,
      client_secret,
      tenant_id,
      domain,
      saml_metadata_url,
    });

    res.status(201).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function updateSSOConfig(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'sso_enabled');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'SSO nao esta disponivel no seu plano.',
      });
    }

    const config = await enterpriseService.updateSSOConfig(userId, req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function deleteSSOConfig(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    await enterpriseService.deleteSSOConfig(userId);
    res.json({ success: true, message: 'Configuracao SSO removida' });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// WEBHOOK CONTROLLERS
// =============================================================================

export async function getWebhooks(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'webhooks');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Webhooks nao estao disponiveis no seu plano. Faca upgrade para o plano Empresarial.',
      });
    }

    const webhooks = await enterpriseService.getWebhooks(userId);
    res.json({ success: true, data: webhooks });
  } catch (error) {
    next(error);
  }
}

export async function getWebhookById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.id);

    const hasAccess = await enterpriseService.hasFeature(userId, 'webhooks');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Webhooks nao estao disponiveis no seu plano.',
      });
    }

    const webhook = await enterpriseService.getWebhookById(userId, webhookId);
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook nao encontrado' });
    }

    res.json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
}

export async function createWebhook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'webhooks');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Webhooks nao estao disponiveis no seu plano.',
      });
    }

    const { name, url, events, secret_key, custom_headers } = req.body;

    if (!name || !url || !events) {
      return res.status(400).json({
        success: false,
        error: 'Nome, URL e eventos sao obrigatorios',
      });
    }

    const webhook = await enterpriseService.createWebhook(userId, {
      name,
      url,
      events: events as WebhookEvent[],
      secret_key,
      custom_headers,
    });

    res.status(201).json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
}

export async function updateWebhook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.id);

    const hasAccess = await enterpriseService.hasFeature(userId, 'webhooks');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Webhooks nao estao disponiveis no seu plano.',
      });
    }

    const webhook = await enterpriseService.updateWebhook(userId, webhookId, req.body);
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook nao encontrado' });
    }

    res.json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
}

export async function deleteWebhook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.id);

    await enterpriseService.deleteWebhook(userId, webhookId);
    res.json({ success: true, message: 'Webhook removido' });
  } catch (error) {
    next(error);
  }
}

export async function getWebhookLogs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;

    const hasAccess = await enterpriseService.hasFeature(userId, 'webhooks');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Webhooks nao estao disponiveis no seu plano.',
      });
    }

    const logs = await enterpriseService.getWebhookLogs(userId, webhookId, limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}

export async function testWebhook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.id);

    const hasAccess = await enterpriseService.hasFeature(userId, 'webhooks');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Webhooks nao estao disponiveis no seu plano.',
      });
    }

    const webhook = await enterpriseService.getWebhookById(userId, webhookId);
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook nao encontrado' });
    }

    // Dispara evento de teste
    await enterpriseService.triggerWebhooks(userId, 'device.online', {
      test: true,
      message: 'Este e um evento de teste do webhook',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Webhook de teste disparado' });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// BRANDING CONTROLLERS (WHITE-LABEL)
// =============================================================================

export async function getBranding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'white_label');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'White-label nao esta disponivel no seu plano. Faca upgrade para o plano Empresarial.',
      });
    }

    const branding = await enterpriseService.getBranding(userId);
    res.json({ success: true, data: branding });
  } catch (error) {
    next(error);
  }
}

export async function updateBranding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'white_label');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'White-label nao esta disponivel no seu plano.',
      });
    }

    const branding = await enterpriseService.createOrUpdateBranding(userId, req.body);
    res.json({ success: true, data: branding });
  } catch (error) {
    next(error);
  }
}

export async function deleteBranding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    await enterpriseService.deleteBranding(userId);
    res.json({ success: true, message: 'Personalizacao removida' });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// API TOKEN CONTROLLERS
// =============================================================================

export async function getApiTokens(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'api_access');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Acesso a API nao esta disponivel no seu plano. Faca upgrade para o plano Profissional ou Empresarial.',
      });
    }

    const tokens = await enterpriseService.getApiTokens(userId);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
}

export async function createApiToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const hasAccess = await enterpriseService.hasFeature(userId, 'api_access');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Acesso a API nao esta disponivel no seu plano.',
      });
    }

    const { name, scopes, rate_limit_per_minute, expires_at } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome do token e obrigatorio',
      });
    }

    // Verifica nivel de acesso para scopes
    const features = await enterpriseService.getPlanFeatures(userId);
    if (features?.api_access_level !== 'read_write' && scopes?.includes('write')) {
      return res.status(403).json({
        success: false,
        error: 'Seu plano permite apenas acesso de leitura. Faca upgrade para o Empresarial para escrita.',
      });
    }

    const result = await enterpriseService.createApiToken(userId, {
      name,
      scopes,
      rate_limit_per_minute,
      expires_at: expires_at ? new Date(expires_at) : undefined,
    });

    // Retorna o token apenas uma vez (nao sera mostrado novamente)
    res.status(201).json({
      success: true,
      data: result.token,
      plainToken: result.plainToken,
      message: 'Guarde este token em local seguro. Ele nao sera exibido novamente.',
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeApiToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const tokenId = parseInt(req.params.id);
    const { reason } = req.body;

    await enterpriseService.revokeApiToken(userId, tokenId, reason);
    res.json({ success: true, message: 'Token revogado com sucesso' });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// PLAN FEATURES CONTROLLER
// =============================================================================

export async function getPlanFeatures(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const features = await enterpriseService.getPlanFeatures(userId);
    res.json({ success: true, data: features });
  } catch (error) {
    next(error);
  }
}
