import { Request, Response } from 'express';
import { Payment, Student } from '../models';

// Fetch all historical payments recorded in the system
export const getPayments = async (req: any, res: any): Promise<void> => {
  try {
    // Fix: Cast Payment to any for static method findAll
    const payments = await (Payment as any).findAll({
      include: [{ model: Student, as: 'student' }],
      order: [['date', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};

// Record a new payment transaction (Manual entry for Cash/Bank/M-Pesa)
export const recordPayment = async (req: any, res: any): Promise<void> => {
  try {
    const { studentId, amount, method, transactionId, description } = req.body;

    // Fix: Cast Payment to any for static method findOne
    const existing = await (Payment as any).findOne({ where: { transactionId } });
    if (existing) {
      res.status(400).json({ message: 'Transaction ID already recorded' });
      return;
    }

    // Fix: Cast Payment to any for static method create
    const payment = await (Payment as any).create({
      studentId,
      amount: Number(amount),
      method,
      transactionId,
      description
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error recording payment', error });
  }
};

// Retrieve all payments made by a specific student
export const getStudentPayments = async (req: any, res: any): Promise<void> => {
  try {
    const { studentId } = req.params;
    // Fix: Cast Payment to any for static method findAll
    const payments = await (Payment as any).findAll({
      where: { studentId },
      order: [['date', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student payments', error });
  }
};