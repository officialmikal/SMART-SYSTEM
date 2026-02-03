import { Request, Response } from 'express';
import { Attendance, Student } from '../models';

interface AttendanceRecordInput {
  studentId: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
}

// Bulk update or create attendance records for multiple students on a specific date
export const bulkRecordAttendance = async (req: any, res: any): Promise<void> => {
  try {
    const { date, records } = req.body as { date: string; records: AttendanceRecordInput[] };

    if (!date || !records || !Array.isArray(records)) {
      res.status(400).json({ message: 'Invalid data format' });
      return;
    }

    const attendancePromises = records.map(record => 
      // Fix: Cast Attendance to any for static method upsert
      (Attendance as any).upsert({
        studentId: record.studentId,
        date,
        status: record.status,
        remarks: record.remarks || null
      })
    );

    await Promise.all(attendancePromises);
    res.json({ message: 'Attendance records updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error recording attendance', error });
  }
};

// Retrieve historical attendance records for an individual student
export const getStudentAttendance = async (req: any, res: any): Promise<void> => {
  try {
    const { studentId } = req.params;
    // Fix: Cast Attendance to any for static method findAll
    const history = await (Attendance as any).findAll({
      where: { studentId },
      order: [['date', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error });
  }
};

// Get the attendance status of all students in a class for a given date
export const getClassAttendance = async (req: any, res: any): Promise<void> => {
  try {
    const { classId } = req.params;
    const date = req.query.date as string;

    // Fix: Cast Attendance to any for static method findAll
    const history = await (Attendance as any).findAll({
      where: { date },
      include: [{
        model: Student,
        as: 'student',
        where: { classId: Number(classId) }
      }]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class attendance', error });
  }
};