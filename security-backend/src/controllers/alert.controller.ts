
import { Request, Response, NextFunction } from 'express';
import * as AlertService from '../services/alert.service';
import * as AuditService from '../services/audit.service';
import { AlertType } from '../models/Alert';

// GET /api/v1/alerts
export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      // Should not happen if authenticateToken middleware is used correctly
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User ID not found in token.' });
    }

    // Extract pagination and filter parameters from query string
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const readStatusQuery = req.query.read as string | undefined;
    let readStatus: boolean | undefined;
    if (readStatusQuery === 'true') {
        readStatus = true;
    } else if (readStatusQuery === 'false') {
        readStatus = false;
    }

    const result = await AlertService.getUserAlerts(userId, page, limit, readStatus);

    // Log audit (optional, maybe only log failed attempts?)
    // await AuditService.logAction(userId, 'get_alerts', { page, limit, readStatus });

    return res.status(200).json({ success: true, ...result }); // Retorna dados e paginação

  } catch (error) {
    next(error);
  }
};

// POST /api/v1/alerts
// Note: This endpoint might be primarily for internal use (e.g., triggered by other services)
// or for specific user-generated alerts if applicable.
export const createAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { type, title, message, metadata } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ success: false, error: 'Bad Request', message: '"type", "title", and "message" are required.' });
    }

    // TODO: Validate 'type' against allowed AlertType values

    const newAlert = await AlertService.createAlert(userId, type as AlertType, title, message, metadata);

    // Log audit
    await AuditService.logAction(userId, 'create_alert', { alertId: newAlert.id, type: newAlert.type });

    return res.status(201).json({ success: true, data: newAlert });

  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/alerts/:id/read
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const alertId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    if (!alertId) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'Alert ID is required in the path.' });
    }

    const success = await AlertService.markAlertAsRead(userId, alertId);

    if (success) {
      // Log audit
      await AuditService.logAction(userId, 'mark_alert_read', { alertId });
      return res.status(200).json({ success: true, message: 'Alert marked as read.' });
    } else {
      // Log audit failure (optional)
      await AuditService.logAction(userId, 'mark_alert_read_fail', { alertId, reason: 'Not found or forbidden' });
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Alert not found or you do not have permission to modify it.' });
    }

  } catch (error) {
    next(error);
  }
};

