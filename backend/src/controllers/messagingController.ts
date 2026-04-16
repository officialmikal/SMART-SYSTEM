
import { Request, Response } from 'express';
import { SmsLog, AuditLog } from '../models';

export const getSmsLogs = async (req: any, res: any) => {
  try {
    // Fix: Cast SmsLog to any for static findAll method
    const logs = await (SmsLog as any).findAll({
      where: { institutionId: req.institutionId },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SMS logs', error });
  }
};

export const sendBulkSms = async (req: any, res: any) => {
  const { type, recipientsCount, message, cost } = req.body;
  try {
    // Fix: Cast SmsLog to any for static create method
    const log = await (SmsLog as any).create({
      institutionId: req.institutionId,
      type,
      recipientsCount,
      message,
      status: 'Sent',
      cost,
      sentBy: req.user.name,
      providerResponse: 'Dispatched through institutional gateway.'
    });

    // Fix: Cast AuditLog to any for static create method
    await (AuditLog as any).create({
      institutionId: req.institutionId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE',
      resource: 'SMS Campaign',
      resourceId: log.id,
      oldValue: null,
      newValue: { type, recipientsCount, cost }
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Failed to record SMS campaign', error });
  }
};
