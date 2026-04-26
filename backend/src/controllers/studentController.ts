
import { Request, Response } from 'express';
import { Student, Class, AuditLog } from '../models';
import { WhereOptions } from 'sequelize';

/**
 * Fetch all students, optionally filtered by classId.
 */
export const getAllStudents = async (req: any, res: any): Promise<void> => {
  try {
    const institutionId = req.institutionId;
    const classId = req.query.classId;
    const where: WhereOptions = { institutionId };
    if (classId) (where as any).classId = Number(classId);

    // Fix: Cast Student to any for static findAll method
    const students = await (Student as any).findAll({
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
    const { 
      admissionNumber, firstName, lastName, classId, stream, gender, dob, 
      guardianPhone, guardianName, agreedFee, totalFee, paidFee, 
      transportFee, isUsingTransport, paidTransportFee, feeBalance, prepaidFee 
    } = req.body;

    // Fix: Cast Student to any for static findOne method
    const existing = await (Student as any).findOne({ where: { admissionNumber } });
    if (existing) {
      res.status(400).json({ message: 'Admission number already exists' });
      return;
    }

    // Fix: Cast Student to any for static create method
    const student = await (Student as any).create({
      institutionId: req.institutionId,
      admissionNumber,
      firstName,
      lastName,
      classId,
      stream,
      gender,
      dob: new Date(dob),
      guardianPhone,
      guardianName,
      agreedFee,
      totalFee,
      paidFee,
      transportFee,
      isUsingTransport,
      paidTransportFee,
      feeBalance,
      prepaidFee
    });

    // AUDIT LOG
    // Fix: Cast AuditLog to any for static create method
    await (AuditLog as any).create({
      institutionId: req.institutionId,
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
    const institutionId = req.institutionId;
    // Fix: Cast Student to any for static findByPk method
    const student = await (Student as any).findOne({
      where: { id: req.params.id, institutionId },
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
    const institutionId = req.institutionId;
    // Fix: Cast Student to any for static findByPk method
    const student = await (Student as any).findOne({
      where: { id: req.params.id, institutionId }
    });
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const oldValue = student.toJSON();
    await student.update(req.body);
    const newValue = student.toJSON();

    // AUDIT LOG
    // Fix: Cast AuditLog to any for static create method
    await (AuditLog as any).create({
      institutionId: req.institutionId,
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
    const institutionId = req.institutionId;
    // Fix: Cast Student to any for static findByPk method
    const student = await (Student as any).findOne({
      where: { id: req.params.id, institutionId }
    });
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const oldValue = student.toJSON();
    await student.destroy();

    // AUDIT LOG
    // Fix: Cast AuditLog to any for static create method
    await (AuditLog as any).create({
      institutionId: req.institutionId,
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
