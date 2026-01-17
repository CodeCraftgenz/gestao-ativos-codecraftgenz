import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import * as reportsService from './reports.service.js';

// =============================================================================
// CONTROLLERS DE RELATORIOS
// =============================================================================

export async function getUptimeReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getUptimeReport(dateRange);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getActivityReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getActivityReport(dateRange);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getUsageReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getUsageReport(dateRange);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getIdleReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getIdleReport(dateRange);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getUsersReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getUsersReport(dateRange);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportsService.getInventoryReport();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getGrowthReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getGrowthReport(dateRange);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// EXPORTACAO CSV
// =============================================================================

export async function exportUptimeCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getUptimeReport(dateRange);
    const csv = reportsService.exportToCSV(report.devices, 'uptime');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="uptime-report-${dateRange}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportActivityCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getActivityReport(dateRange);
    const csv = reportsService.exportToCSV(report.dailyActivity, 'activity');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="activity-report-${dateRange}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportUsageCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getUsageReport(dateRange);
    const csv = reportsService.exportToCSV(report.devices, 'usage');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="usage-report-${dateRange}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportIdleCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getIdleReport(dateRange);
    const csv = reportsService.exportToCSV(report.devices, 'idle');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="idle-report-${dateRange}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportUsersCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getUsersReport(dateRange);
    // Flatten users array for CSV
    const flatData = report.devices.map(d => ({
      ...d,
      users: d.users.join('; '),
    }));
    const csv = reportsService.exportToCSV(flatData, 'users');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="users-report-${dateRange}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportInventoryCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportsService.getInventoryReport();
    const csv = reportsService.exportToCSV(report.devices, 'inventory');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportGrowthCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dateRange = (req.query.range as string) || '30d';
    const report = await reportsService.getGrowthReport(dateRange);
    const csv = reportsService.exportToCSV(report.monthly, 'growth');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="growth-report-${dateRange}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
