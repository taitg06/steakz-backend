import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import dotenv from 'dotenv';
import { comparePassword, hashPassword } from '../utils/hash';

dotenv.config();

export const signup = async (req: Request, res: Response): Promise<any> => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ message: 'Email already taken' });

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'CUSTOMER', // Always assign customer role on signup
    },
  });

  res.status(201).json({ message: 'User created', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { identifier, password } = req.body;
  // Debug log to help trace unexpected non-JSON responses seen by the frontend
  console.log('[auth] login attempt for identifier:', identifier, 'from', req.ip);
  if (!identifier || !password) return res.status(400).json({ message: 'Identifier and password are required' });

  // Check if identifier is an email
  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
  let user;
  if (isEmail) {
    user = await prisma.user.findUnique({
      where: { email: identifier },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        branchId: true,
        createdAt: true,
        updatedAt: true
      }
    });
  } else {
    user = await prisma.user.findFirst({
      where: { name: identifier },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        branchId: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await comparePassword(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user.id, role: user.role, branchId: user.branchId },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword
  });
};