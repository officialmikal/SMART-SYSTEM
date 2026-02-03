import { Request, Response } from 'express';
import { Exam } from '../models';

// Retrieve all exams scheduled in the system
export const getExams = async (req: any, res: any): Promise<void> => {
  try {
    // Fix: Cast Exam to any for static method findAll
    const exams = await (Exam as any).findAll({ order: [['date', 'DESC']] });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error });
  }
};

// Register a new academic examination session
export const createExam = async (req: any, res: any): Promise<void> => {
  try {
    // Fix: Cast Exam to any for static method create
    const exam = await (Exam as any).create(req.body);
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error creating exam', error });
  }
};

// Update details for an existing examination session
export const updateExam = async (req: any, res: any): Promise<void> => {
  try {
    // Fix: Cast Exam to any for static method findByPk
    const exam = await (Exam as any).findByPk(req.params.id);
    if (!exam) {
      res.status(404).json({ message: 'Exam not found' });
      return;
    }
    await exam.update(req.body);
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error updating exam', error });
  }
};

// Delete an examination session record
export const deleteExam = async (req: any, res: any): Promise<void> => {
  try {
    // Fix: Cast Exam to any for static method findByPk
    const exam = await (Exam as any).findByPk(req.params.id);
    if (!exam) {
      res.status(404).json({ message: 'Exam not found' });
      return;
    }
    await exam.destroy();
    res.json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam', error });
  }
};