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

    // Update Student record balances
    const student = await (Student as any).findByPk(studentId);
    if (student) {
      // Find category from description or request body if provided
      const category = req.body.category || 'TUITION';
      
      if (category === 'TRANSPORT') {
        const newPaidTransport = (student.paidTransportFee || 0) + Number(amount);
        await student.update({ paidTransportFee: newPaidTransport });
      } else {
        const newPaidFee = (student.paidFee || 0) + Number(amount);
        await student.update({ paidFee: newPaidFee });
      }
      
      // Recalculate balances (this logic should ideally be centralized but for now we follow the existing pattern)
      const totalExpected = (student.agreedFee ?? 0) + (student.isUsingTransport ? (student.transportFee || 0) : 0);
      const totalPaid = (student.paidFee || 0) + (student.paidTransportFee || 0);
      const balance = Math.max(0, totalExpected - totalPaid);
      const prepaid = totalPaid > totalExpected ? totalPaid - totalExpected : 0;
      
      await student.update({ feeBalance: balance, prepaidFee: prepaid });
    }

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