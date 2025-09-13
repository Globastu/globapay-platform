import type { FastifyInstance } from 'fastify';
import type { JwtPayload, AuthenticatedUser, LoginCredentials, LoginResponse } from './types';
import { prisma } from '../../lib/prisma';
import { compare } from 'bcryptjs';

export class JwtService {
  constructor(private fastify: FastifyInstance) {}

  async createTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Get user with organization and role details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            role: true,
            organization: true,
          },
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      throw new Error('User not found or not associated with any organization');
    }

    // For now, use the first organization (in real app, might need to handle multiple)
    const userOrg = user.organizations[0];
    if (!userOrg) {
      throw new Error('User not associated with any organization');
    }

    const payload: JwtPayload = {
      userId: user.id,
      organizationId: userOrg.organizationId,
      roleId: userOrg.roleId,
      permissions: [...userOrg.role.permissions, ...userOrg.permissions],
    };

    // Create access token (short-lived)
    const accessToken = this.fastify.jwt.sign(payload, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m' 
    });

    // Create refresh token (long-lived)
    const refreshToken = this.fastify.jwt.sign(
      { userId: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password, mfaToken } = credentials;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: {
            role: true,
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Check MFA if enabled
    if (user.mfaEnabled && !mfaToken) {
      throw new Error('MFA token required');
    }

    if (user.mfaEnabled && mfaToken) {
      // TODO: Implement TOTP verification
      // For now, accept any 6-digit token
      if (!/^\d{6}$/.test(mfaToken)) {
        throw new Error('Invalid MFA token');
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        // TODO: Add IP address tracking
      },
    });

    // Create tokens
    const { accessToken, refreshToken } = await this.createTokens(user.id);

    // Get user organization details
    const userOrg = user.organizations[0];
    if (!userOrg) {
      throw new Error('User not associated with any organization');
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: userOrg.organizationId,
        permissions: [...userOrg.role.permissions, ...userOrg.permissions],
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = this.fastify.jwt.verify<{ userId: string; type: string }>(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User no longer active');
      }

      // Create new access token
      const { accessToken } = await this.createTokens(decoded.userId);
      
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = this.fastify.jwt.verify<JwtPayload>(token);
      
      // Get fresh user data to ensure still active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          organizations: {
            where: { organizationId: payload.organizationId },
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User not found or inactive');
      }

      const userOrg = user.organizations[0];
      if (!userOrg) {
        throw new Error('User organization not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: payload.organizationId,
        roleId: payload.roleId,
        permissions: payload.permissions,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async logout(userId: string): Promise<void> {
    // TODO: Implement token blacklisting if needed
    // For now, tokens will expire naturally
  }
}