
import { Request, Response } from 'express';
import { SmsLog, AuditLog, Institution } from '../models';
import { smsService } from '../services/smsService';

export const getSmsLogs = async (req: any, res: any) => {
  try {
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

/**
 * Fetch school-specific SMS gateway settings
 */
export const getSmsSettings = async (req: any, res: any) => {
  try {
    const inst = await (Institution as any).findByPk(req.institutionId);
    if (!inst) return res.status(404).json({ message: 'School not found' });

    res.json({
      username: inst.atUsername || '',
      apiKey: inst.atApiKey ? '***' : '', // Don't expose total key unless needed
      senderId: inst.senderId || '',
      hasCustomKeys: !!inst.atApiKey
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings', error });
  }
};

/**
 * Update school-specific SMS gateway settings
 */
export const updateSmsSettings = async (req: any, res: any) => {
  try {
    const { username, apiKey, senderId } = req.body;
    const inst = await (Institution as any).findByPk(req.institutionId);
    
    if (!inst) return res.status(404).json({ message: 'School not found' });

    const updateData: any = { atUsername: username, senderId };
    
    // Only update apiKey if a real one is provided (not masks)
    if (apiKey && apiKey !== '***') {
      updateData.atApiKey = apiKey;
    }

    await inst.update(updateData);

    await (AuditLog as any).create({
      institutionId: req.institutionId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPDATE',
      resource: 'SMS Settings',
      resourceId: inst.id,
      newValue: { username, senderId }
    });

    res.json({ message: 'Gateway settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error });
  }
};

/**
 * Dispatches bulk SMS via backend gateway
 */
export const sendBulkSms = async (req: any, res: any) => {
  const { type, recipients, message, cost } = req.body;
  // expects recipients: [{ phone: string, message: string }]
  
  try {
    const inst = await (Institution as any).findByPk(req.institutionId);
    
    // 1. Prepare credentials (Institution specific or Global fall-back)
    const customCreds = inst?.atApiKey ? { 
      username: inst.atUsername, 
      apiKey: inst.atApiKey 
    } : undefined;

    // 2. Dispatch Through Service
    let providerResponse = '';
    const phones = recipients.map((r: any) => r.phone);
    const text = recipients[0]?.message || message; // Use first recipient's message as sample for log

    try {
      const atResponse = await smsService.sendSms({
        to: phones,
        message: text,
        from: inst?.senderId || undefined
      }, customCreds);
      providerResponse = JSON.stringify(atResponse);
    } catch (atError: any) {
      providerResponse = `FAILED: ${atError.message}`;
      // We still record the attempt but mark as failed
      await (SmsLog as any).create({
        institutionId: req.institutionId,
        type,
        recipientsCount: recipients.length,
        message: text,
        status: 'Failed',
        cost: 0,
        sentBy: req.user.name,
        providerResponse
      });
      return res.status(400).json({ message: 'SMS Gateway Dispatch Failed', error: atError.message });
    }

    // 3. Persist Valid Log
    const log = await (SmsLog as any).create({
      institutionId: req.institutionId,
      type,
      recipientsCount: recipients.length,
      message: text,
      status: 'Sent',
      cost,
      sentBy: req.user.name,
      providerResponse
    });

    // 4. Record Audit Trail
    await (AuditLog as any).create({
      institutionId: req.institutionId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE',
      resource: 'SMS Campaign',
      resourceId: log.id,
      newValue: { type, recipientsCount: recipients.length, cost }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('SMS Campaign Error:', error);
    res.status(500).json({ message: 'Internal system error during dispatch', error });
  }
};
