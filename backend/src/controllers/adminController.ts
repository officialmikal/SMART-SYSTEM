
import { Request, Response } from 'express';
import { AuditLog } from '../models';

/**
 * Fetch all system audit logs.
 */
export const getAuditLogs = async (req: any, res: any): Promise<void> => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 500
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error });
  }
};
