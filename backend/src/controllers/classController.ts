
import { Request, Response } from 'express';
import { Class, Fee } from '../models';

// Retrieve a list of all classes and their associated fee structures
export const getClasses = async (req: any, res: any): Promise<void> => {
  try {
    const classes = await Class.findAll({
      include: [{ model: Fee, as: 'feeStructure' }]
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes', error });
  }
};

// Create a new school class with an optional initial fee amount
export const createClass = async (req: any, res: any): Promise<void> => {
  try {
    const { name, amount } = req.body;
    const newClass = await Class.create({ name });
    
    if (amount) {
      await Fee.create({ classId: newClass.id, amount: Number(amount) });
    }

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: 'Error creating class', error });
  }
};

// Update or set the fee amount for a specific class level
export const updateClassFee = async (req: any, res: any): Promise<void> => {
  try {
    const { classId } = req.params;
    const { amount } = req.body;

    let fee = await Fee.findOne({ where: { classId: Number(classId) } });
    if (fee) {
      await fee.update({ amount: Number(amount) });
    } else {
      fee = await Fee.create({ classId: Number(classId), amount: Number(amount) });
    }

    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Error updating fee structure', error });
  }
};
