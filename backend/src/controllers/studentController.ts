
import { Request, Response } from 'express';
import { Student, Class, AuditLog } from '../models';
import { WhereOptions } from 'sequelize';

/**
 * Fetch all students, optionally filtered by classId.
 */
export const getAllStudents = async (req: any, res: any): Promise<void> => {
  try {
    const classId = req.query.classId;
    const where: WhereOptions = {};
    if (classId) where.classId = Number(classId);

    const students = await Student.findAll({
      where,
      include: [{ model: Class, as: 'class' }]
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error });
  }
};

/**
 * Create a new student record.
 */
export const createStudent = async (req: any, res: any): Promise<void> => {
  try {
    const { admissionNumber, firstName, lastName, classId, stream, gender, dob, guardianPhone, guardianName, agreedFee } = req.body;

    const existing = await Student.findOne({ where: { admissionNumber } });
    if (existing) {
      res.status(400).json({ message: 'Admission number already exists' });
      return;
    }

    const student = await Student.create({
      admissionNumber,
      firstName,
      lastName,
      classId,
      stream,
      gender,
      dob: new Date(dob),
      guardianPhone,
      guardianName,
      agreedFee
    });

    // AUDIT LOG
    await AuditLog.create({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'CREATE',
      resource: 'Student',
      resourceId: student.id,
      oldValue: null,
      newValue: student.toJSON()
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error });
  }
};

/**
 * Fetch a single student's details.
 */
export const getStudentById = async (req: any, res: any): Promise<void> => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [{ model: Class, as: 'class' }]
    });
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error });
  }
};

/**
 * Update an existing student's information.
 */
export const updateStudent = async (req: any, res: any): Promise<void> => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const oldValue = student.toJSON();
    await student.update(req.body);
    const newValue = student.toJSON();

    // AUDIT LOG
    await AuditLog.create({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'UPDATE',
      resource: 'Student',
      resourceId: student.id,
      oldValue,
      newValue
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error });
  }
};

/**
 * Permanently delete a student record.
 */
export const deleteStudent = async (req: any, res: any): Promise<void> => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const oldValue = student.toJSON();
    await student.destroy();

    // AUDIT LOG
    await AuditLog.create({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'DELETE',
      resource: 'Student',
      resourceId: student.id,
      oldValue,
      newValue: null
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error });
  }
};
