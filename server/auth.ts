import bcrypt from 'bcrypt';
import { storage } from './storage';
import type { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    user?: CustomUser;
  }
}

export interface CustomUser {
  id: string;
  username: string;
  email: string;
  authProvider: 'custom' | 'replit';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(username: string, email: string, password: string) {
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const existingUsername = await storage.getUserByUsername(username);
  if (existingUsername) {
    throw new Error('Username is already taken');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await storage.createUser({
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    username,
    email,
    passwordHash,
    authProvider: 'custom',
    preferences: {}
  });

  return user;
}

export async function loginUser(emailOrUsername: string, password: string) {
  // Try to find user by email or username
  let user = await storage.getUserByEmail(emailOrUsername);
  if (!user) {
    user = await storage.getUserByUsername(emailOrUsername);
  }

  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return user;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user && !req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const getCurrentUser = (req: Request): CustomUser | null => {
  // Debug logging
  console.log('getCurrentUser called:', {
    hasSession: !!req.session,
    sessionUser: !!req.session?.user,
    hasReqUser: !!req.user,
    sessionId: req.session?.id
  });

  // Check for custom auth session
  if (req.session?.user) {
    console.log('Found session user:', req.session.user.id);
    return req.session.user;
  }
  
  // Check for Replit auth
  if (req.user && (req.user as any).claims) {
    const claims = (req.user as any).claims;
    console.log('Found Replit user:', claims.sub);
    return {
      id: claims.sub,
      username: claims.email?.split('@')[0] || 'replit_user',
      email: claims.email,
      authProvider: 'replit'
    };
  }

  console.log('No user found');
  return null;
};