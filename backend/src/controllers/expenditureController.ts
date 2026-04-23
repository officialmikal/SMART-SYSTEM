import { Request, Response } from 'express';
import { Expenditure } from '../models';

export const getExpenditures = async (req: any, res: Response): Promise<void> => {
  try {
    const institutionId = req.user?.institutionId;
    const expenditures = await (Expenditure as any).findAll({
      where: institutionId ? { institutionId } : {},
      order: [['date', 'DESC']]
    });
    res.json(expenditures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenditures', error });
  }
};

export const createExpenditure = async (req: any, res: Response): Promise<void> => {
  try {
    const institutionId = req.user?.institutionId;
    const expenditure = await (Expenditure as any).create({
      ...req.body,
      institutionId,
      approvedBy: req.user?.name || 'Authorized Staff'
    });
    res.status(201).json(expenditure);
  } catch (error) {
    res.status(500).json({ message: 'Error recording expenditure', error });
  }
};

export const updateExpenditure = async (req: any, res: Response): Promise<void> => {
  try {
    const expenditure = await (Expenditure as any).findByPk(req.params.id);
    if (!expenditure) {
      res.status(404).json({ message: 'Expenditure not found' });
      return;
    }
    await expenditure.update(req.body);
    res.json(expenditure);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expenditure', error });
  }
};

export const deleteExpenditure = async (req: any, res: Response): Promise<void> => {
  try {
    const expenditure = await (Expenditure as any).findByPk(req.params.id);
    if (!expenditure) {
      res.status(404).json({ message: 'Expenditure not found' });
      return;
    }
    await expenditure.destroy();
    res.json({ message: 'Expenditure record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expenditure', error });
  }
};
