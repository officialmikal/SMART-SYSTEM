import { Request, Response } from 'express';
import { Mark, Student } from '../models';
import { WhereOptions } from 'sequelize';

// Helper to determine the CBC competency level from a percentage score
const calculateCBCGrade = (score: number): 'EE' | 'ME' | 'AE' | 'BE' => {
  if (score >= 80) return 'EE';
  if (score >= 60) return 'ME';
  if (score >= 40) return 'AE';
  return 'BE';
};

interface MarkEntryInput {
  studentId: string;
  score: number;
  remarks?: string;
  competency?: 'EE' | 'ME' | 'AE' | 'BE';
}

// Upsert multiple student marks for a specific exam and learning area
export const bulkUpsertMarks = async (req: any, res: any): Promise<void> => {
  try {
    const { examId, subject, entries } = req.body as { examId: string; subject: string; entries: MarkEntryInput[] };

    if (!examId || !subject || !Array.isArray(entries)) {
      res.status(400).json({ message: 'Invalid data format' });
      return;
    }

    const markPromises = entries.map(entry => {
      const score = Number(entry.score);
      // Fix: Cast Mark to any for static method upsert
      return (Mark as any).upsert({
        studentId: entry.studentId,
        examId,
        subject,
        score,
        cbcGrade: entry.competency || calculateCBCGrade(score),
        remarks: entry.remarks || null
      });
    });

    await Promise.all(markPromises);
    res.json({ message: 'Marks updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error recording marks', error });
  }
};

// Fetch results for an individual student across different exams
export const getStudentResults = async (req: any, res: any): Promise<void> => {
  try {
    const { studentId } = req.params;
    const examId = req.query.examId as string | undefined;

    const where: WhereOptions = { studentId };
    if (examId) where.examId = examId;

    // Fix: Cast Mark to any for static method findAll
    const marks = await (Mark as any).findAll({
      where,
      order: [['subject', 'ASC']]
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error });
  }
};

// Fetch all recorded marks for a specific class, filtered by exam and learning area
export const getClassResults = async (req: any, res: any): Promise<void> => {
  try {
    const examId = req.query.examId as string;
    const subject = req.query.subject as string;
    const { classId } = req.params;

    // Fix: Cast Mark to any for static method findAll
    const marks = await (Mark as any).findAll({
      where: { examId, subject },
      include: [{
        model: Student,
        as: 'student',
        where: { classId: Number(classId) }
      }]
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class results', error });
  }
};