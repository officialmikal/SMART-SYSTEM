
import { Request, Response } from 'express';
import { Payment, Student } from '../models';

// Fetch all historical payments recorded in the system
export const getPayments = async (req: any, res: any): Promise<void> => {
  try {
    const payments = await Payment.findAll({
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

    const existing = await Payment.findOne({ where: { transactionId } });
    if (existing) {
      res.status(400).json({ message: 'Transaction ID already recorded' });
      return;
    }

    const payment = await Payment.create({
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
    const payments = await Payment.findAll({
      where: { studentId },
      order: [['date', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student payments', error });
  }
};
