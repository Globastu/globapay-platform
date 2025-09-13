import { createHash, randomBytes } from 'crypto';
import type { Permission } from '@prisma/client';
import type { ApiKeyPayload, AuthenticatedApiKey } from './types';
import { prisma } from '../../lib/prisma';

export class ApiKeyService {
  private static readonly KEY_PREFIX_LENGTH = 8;
  private static readonly KEY_SECRET_LENGTH = 32;

  static generateApiKey(): { key: string; prefix: string; hash: string } {
    const prefix = randomBytes(this.KEY_PREFIX_LENGTH / 2).toString('hex');
    const secret = randomBytes(this.KEY_SECRET_LENGTH).toString('hex');
    const key = `gp_${prefix}${secret}`;
    const hash = this.hashApiKey(key);
    
    return { key, prefix, hash };
  }

  private static hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async createApiKey(params: {
    name: string;
    organizationId: string;
    merchantId?: string;
    permissions: Permission[];
    expiresAt?: Date;
  }): Promise<{ apiKey: string; id: string }> {
    const { name, organizationId, merchantId, permissions, expiresAt } = params;
    
    // Generate API key
    const { key, prefix, hash } = ApiKeyService.generateApiKey();
    
    // Create record
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        name,
        organizationId,
        merchantId,
        keyHash: hash,
        keyPrefix: prefix,
        permissions,
        expiresAt,
      },
    });

    return {
      apiKey: key,
      id: apiKeyRecord.id,
    };
  }

  async verifyApiKey(key: string): Promise<AuthenticatedApiKey> {
    // Extract prefix from key
    if (!key.startsWith('gp_')) {
      throw new Error('Invalid API key format');
    }

    const withoutPrefix = key.substring(3);
    if (withoutPrefix.length < ApiKeyService.KEY_PREFIX_LENGTH) {
      throw new Error('Invalid API key format');
    }

    const prefix = withoutPrefix.substring(0, ApiKeyService.KEY_PREFIX_LENGTH);
    const hash = ApiKeyService.hashApiKey(key);

    // Find API key by prefix and hash
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyPrefix: prefix,
        keyHash: hash,
        isActive: true,
      },
      include: {
        organization: true,
        merchant: true,
      },
    });

    if (!apiKey) {
      throw new Error('Invalid API key');
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new Error('API key expired');
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        // TODO: Add IP address tracking
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      organizationId: apiKey.organizationId,
      merchantId: apiKey.merchantId || undefined,
      permissions: apiKey.permissions,
    };
  }

  async revokeApiKey(keyId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }

  async listApiKeys(organizationId: string, merchantId?: string): Promise<Array<{
    id: string;
    name: string;
    keyPrefix: string;
    permissions: Permission[];
    isActive: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
  }>> {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        organizationId,
        ...(merchantId && { merchantId }),
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map(key => ({
      ...key,
      keyPrefix: `gp_${key.keyPrefix}...`,
    }));
  }

  async rotateApiKey(keyId: string): Promise<{ apiKey: string }> {
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!existingKey) {
      throw new Error('API key not found');
    }

    // Generate new key
    const { key, prefix, hash } = ApiKeyService.generateApiKey();

    // Update existing record
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        keyHash: hash,
        keyPrefix: prefix,
        updatedAt: new Date(),
      },
    });

    return { apiKey: key };
  }

  async updateApiKeyPermissions(keyId: string, permissions: Permission[]): Promise<void> {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { permissions },
    });
  }

  async getApiKeyUsage(keyId: string, days = 30): Promise<{
    totalRequests: number;
    lastUsedAt: Date | null;
    createdAt: Date;
  }> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: {
        lastUsedAt: true,
        createdAt: true,
      },
    });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    // TODO: Implement request counting from logs/metrics
    // This would typically come from a logging/analytics system
    return {
      totalRequests: 0, // Placeholder
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
    };
  }
}