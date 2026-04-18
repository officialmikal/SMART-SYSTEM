
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, AuditLog } from '../models';
import { Op } from 'sequelize';

/**
 * Fetch all users for the current institution.
 */
export const getAllUsers = async (req: any, res: any): Promise<void> => {
  try {
    const institutionId = req.institutionId;
    
    // Fix: Cast User to any for static findAll method
    const users = await (User as any).findAll({
      where: { institutionId },
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching school personnel', error });
  }
};

/**
 * Create a new user within the institution scope.
 */
export const createUser = async (req: any, res: any): Promise<void> => {
  try {
    const { name, email, role, password } = req.body;
    const institutionId = req.institutionId;

    // Validate email uniqueness
    const existing = await (User as any).findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(400).json({ message: 'A user with this email already exists in the system.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'elimusmart123', salt);

    const user = await (User as any).create({
      institutionId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      active: true
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    // AUDIT LOG
    await (AuditLog as any).create({
      institutionId,
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'CREATE',
      resource: 'User',
      resourceId: user.id,
      newValue: userResponse
    });

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Identity orchestration failed.', error });
  }
};

/**
 * Update user details (restricted to same institution).
 */
export const updateUser = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const institutionId = req.institutionId;
    const { name, email, role, active } = req.body;

    const user = await (User as any).findOne({ where: { id, institutionId } });
    if (!user) {
      res.status(404).json({ message: 'User not found in your institution directory.' });
      return;
    }

    const oldValue = user.toJSON();
    delete oldValue.password;

    await user.update({ name, email, role, active });
    
    const newValue = user.toJSON();
    delete newValue.password;

    // AUDIT LOG
    await (AuditLog as any).create({
      institutionId,
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'UPDATE',
      resource: 'User',
      resourceId: user.id,
      oldValue,
      newValue
    });

    res.json(newValue);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user records.', error });
  }
};

/**
 * Administrative password reset.
 */
export const resetUserPassword = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const institutionId = req.institutionId;

    const user = await (User as any).findOne({ where: { id, institutionId } });
    if (!user) {
      res.status(404).json({ message: 'Target identity not found.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    // AUDIT LOG
    await (AuditLog as any).create({
      institutionId,
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'UPDATE',
      resource: 'UserCredentials',
      resourceId: user.id,
      newValue: { status: 'administrative_password_reset' }
    });

    res.json({ message: 'Credentials rotated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Credential rotation failed.', error });
  }
};

/**
 * Delete a user (restricted to same institution).
 */
export const deleteUser = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const institutionId = req.institutionId;

    if (id === req.user.id) {
      res.status(400).json({ message: 'System Integrity Error: You cannot delete your own account.' });
      return;
    }

    const user = await (User as any).findOne({ where: { id, institutionId } });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const oldValue = user.toJSON();
    delete oldValue.password;

    await user.destroy();

    // AUDIT LOG
    await (AuditLog as any).create({
      institutionId,
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'DELETE',
      resource: 'User',
      resourceId: id,
      oldValue
    });

    res.json({ message: 'Identity purged from system records.' });
  } catch (error) {
    res.status(500).json({ message: 'Purge operation failed.', error });
  }
};
