import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import * as adminService from './admin.service.js';
import { runLGPDCleanup, getLGPDStatus, exportLGPDData } from '../../jobs/lgpd-cleanup.job.js';

export async function getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getDevices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      filial_id: req.query.filial_id ? parseInt(req.query.filial_id as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await adminService.getDevices(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getPendingDevices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const devices = await adminService.getPendingDevices();
    res.json({ success: true, data: devices });
  } catch (error) {
    next(error);
  }
}

export async function getDeviceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const device = await adminService.getDeviceById(id);
    res.json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
}

export async function approveDevice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    await adminService.approveDevice(id, userId);
    res.json({ success: true, message: 'Dispositivo aprovado com sucesso' });
  } catch (error) {
    next(error);
  }
}

export async function blockDevice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Motivo do bloqueio e obrigatorio' });
    }

    await adminService.blockDevice(id, userId, reason);
    res.json({ success: true, message: 'Dispositivo bloqueado com sucesso' });
  } catch (error) {
    next(error);
  }
}

export async function unblockDevice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    await adminService.unblockDevice(id);
    res.json({ success: true, message: 'Dispositivo desbloqueado com sucesso' });
  } catch (error) {
    next(error);
  }
}

export async function sendCommand(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const deviceId = parseInt(req.params.id);
    const userId = req.user!.id;
    const { type, payload } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: 'Tipo do comando e obrigatorio' });
    }

    const commandId = await adminService.sendCommand(deviceId, userId, type, payload);
    res.json({ success: true, data: { commandId }, message: 'Comando enviado com sucesso' });
  } catch (error) {
    next(error);
  }
}

// Busca dispositivo por Service Tag
export async function getDeviceByServiceTag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { serviceTag } = req.params;

    if (!serviceTag) {
      return res.status(400).json({ success: false, error: 'Service Tag e obrigatoria' });
    }

    const device = await adminService.getDeviceByServiceTag(serviceTag);
    res.json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
}

// Registra dispositivo por Service Tag (pre-registro)
export async function registerByServiceTag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { serviceTag, description, filial_id } = req.body;
    const userId = req.user!.id;

    if (!serviceTag) {
      return res.status(400).json({ success: false, error: 'Service Tag e obrigatoria' });
    }

    const result = await adminService.registerByServiceTag(serviceTag, description, filial_id, userId);
    res.json({ success: true, data: result, message: 'Dispositivo pre-registrado com sucesso' });
  } catch (error) {
    next(error);
  }
}

// Lista dispositivos pre-registrados (aguardando enrollment)
export async function getPreRegisteredDevices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const devices = await adminService.getPreRegisteredDevices();
    res.json({ success: true, data: devices });
  } catch (error) {
    next(error);
  }
}

// Dashboard Analytics - metricas agregadas para graficos
export async function getDashboardAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const analytics = await adminService.getDashboardAnalytics(userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
}

// LGPD - Status da limpeza automatica
export async function getLGPDCleanupStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const status = await getLGPDStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
}

// LGPD - Executar limpeza manual
export async function executeLGPDCleanup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await runLGPDCleanup();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// LGPD - Exportar dados para portabilidade
export async function exportLGPDDataEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await exportLGPDData();

    // Define headers para download de arquivo JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lgpd-export-${new Date().toISOString().split('T')[0]}.json"`);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// PLANOS E SUBSCRIPTIONS
// ============================================================================

// Lista todos os planos ativos
export async function getPlans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const plans = await adminService.getPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
}

// Busca plano por ID
export async function getPlanById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const plan = await adminService.getPlanById(id);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
}

// Busca subscription do usuario logado
export async function getMySubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const subscription = await adminService.getUserSubscription(userId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
}

// Atualiza plano do usuario (upgrade/downgrade)
export async function updateMyPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ success: false, error: 'ID do plano e obrigatorio' });
    }

    await adminService.updateUserPlan(userId, plan_id);
    const subscription = await adminService.getUserSubscription(userId);
    res.json({ success: true, data: subscription, message: 'Plano atualizado com sucesso' });
  } catch (error) {
    next(error);
  }
}

// Cancela subscription do usuario
export async function cancelMySubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const subscription = await adminService.getUserSubscription(userId);

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Nenhuma subscription encontrada' });
    }

    await adminService.cancelSubscription(subscription.id);
    res.json({ success: true, message: 'Subscription cancelada com sucesso' });
  } catch (error) {
    next(error);
  }
}
