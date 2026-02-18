
import { Request, Response } from 'express';
import { SmsLog, AuditLog } from '../models';

export const getSmsLogs = async (req: any, res: any) => {
  try {
    const logs = await SmsLog.findAll({
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
    const log = await SmsLog.create({
      institutionId: req.institutionId,
      type,
      recipientsCount,
      message,
      status: 'Sent',
      cost,
      sentBy: req.user.name,
      providerResponse: 'Dispatched through institutional gateway.'
    });

    await AuditLog.create({
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
