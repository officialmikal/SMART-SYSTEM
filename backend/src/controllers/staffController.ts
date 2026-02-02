
import { Request, Response } from 'express';
import { Staff } from '../models';

// Retrieve all registered staff members sorted by name
export const getAllStaff = async (req: any, res: any): Promise<void> => {
  try {
    const staff = await Staff.findAll({ order: [['name', 'ASC']] });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff', error });
  }
};

// Register a new staff member into the institutional registry
export const createStaff = async (req: any, res: any): Promise<void> => {
  try {
    const { staffId, name, email, phone, role, subjects } = req.body;
    
    const existing = await Staff.findOne({ where: { staffId } });
    if (existing) {
      res.status(400).json({ message: 'Staff ID already exists' });
      return;
    }

    const staff = await Staff.create({ staffId, name, email, phone, role, subjects });
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error creating staff', error });
  }
};

// Update an existing staff member's profile details
export const updateStaff = async (req: any, res: any): Promise<void> => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) {
      res.status(404).json({ message: 'Staff member not found' });
      return;
    }

    await staff.update(req.body);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff', error });
  }
};

// Permanently remove a staff member from the system
export const deleteStaff = async (req: any, res: any): Promise<void> => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) {
      res.status(404).json({ message: 'Staff member not found' });
      return;
    }

    await staff.destroy();
    res.json({ message: 'Staff member deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting staff', error });
  }
};
