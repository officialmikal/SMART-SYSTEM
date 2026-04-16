
import { Request, Response } from 'express';
import { AuditLog } from '../models';

/**
 * Fetch system audit logs for the current institution only.
 */
export const getAuditLogs = async (req: any, res: any): Promise<void> => {
  try {
    // SECURITY: Only return logs matching the requester's institutionId
    // Fix: Cast AuditLog to any for static findAll method
    const logs = await (AuditLog as any).findAll({
      where: { institutionId: req.institutionId },
      order: [['createdAt', 'DESC']],
      limit: 500
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching institutional logs', error });
  }
};
