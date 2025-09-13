import type { PrismaClient } from '@prisma/client';
import type { TenantContext } from '../auth/types';
import type {
  Platform,
  Merchant,
  PlatformCreateRequest,
  MerchantCreateRequest,
  MerchantStatusUpdate,
  KybProvider,
  KybData,
} from './types';
import { MockKybProvider } from './kyb/mock-kyb-provider';

export class TenancyService {
  private kybProvider: KybProvider;

  constructor(private prisma: PrismaClient) {
    this.kybProvider = new MockKybProvider();
  }

  // Platform methods
  async getPlatforms(tenantContext: TenantContext): Promise<{ platforms: Platform[]; total: number }> {
    // Only platform admins can see all platforms
    if (!this.hasPermission(tenantContext, 'PLATFORM_ADMIN')) {
      throw new Error('Insufficient permissions to view platforms');
    }

    const platforms = await this.prisma.platform.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      platforms: platforms.map(this.mapPlatform),
      total: platforms.length,
    };
  }

  async createPlatform(
    data: PlatformCreateRequest,
    tenantContext: TenantContext
  ): Promise<Platform> {
    // Only platform admins can create platforms
    if (!this.hasPermission(tenantContext, 'PLATFORM_ADMIN')) {
      throw new Error('Insufficient permissions to create platforms');
    }

    const platform = await this.prisma.platform.create({
      data: {
        name: data.name,
        description: data.description,
        website: data.website,
        status: 'active',
      },
    });

    await this.createAuditLog({
      tenantContext,
      action: 'PLATFORM_CREATED',
      resourceType: 'PLATFORM',
      resourceId: platform.id,
      details: { name: platform.name },
    });

    return this.mapPlatform(platform);
  }

  // Merchant methods
  async getMerchants(
    tenantContext: TenantContext,
    platformId?: string
  ): Promise<{ merchants: Merchant[]; total: number }> {
    let whereClause: any = {};

    if (this.hasPermission(tenantContext, 'PLATFORM_ADMIN')) {
      // Platform admin sees all merchants, optionally filtered by platform
      if (platformId) {
        whereClause.platformId = platformId;
      }
    } else if (this.hasPermission(tenantContext, 'MERCHANT_ADMIN')) {
      // Merchant admin only sees their own merchant
      whereClause.id = tenantContext.merchantId;
    } else {
      throw new Error('Insufficient permissions to view merchants');
    }

    const merchants = await this.prisma.merchant.findMany({
      where: whereClause,
      include: {
        platform: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      merchants: merchants.map(this.mapMerchant),
      total: merchants.length,
    };
  }

  async getMerchantById(
    id: string,
    tenantContext: TenantContext
  ): Promise<Merchant | null> {
    // Check access permissions
    if (!this.hasPermission(tenantContext, 'PLATFORM_ADMIN') && 
        tenantContext.merchantId !== id) {
      throw new Error('Insufficient permissions to view this merchant');
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        platform: true,
      },
    });

    return merchant ? this.mapMerchant(merchant) : null;
  }

  async createMerchant(
    data: MerchantCreateRequest,
    tenantContext: TenantContext
  ): Promise<Merchant> {
    // Platform admins can create merchants for any platform
    // Merchant admins cannot create new merchants
    if (!this.hasPermission(tenantContext, 'PLATFORM_ADMIN')) {
      throw new Error('Insufficient permissions to create merchants');
    }

    // Validate platform exists if specified
    if (data.platformId) {
      const platform = await this.prisma.platform.findUnique({
        where: { id: data.platformId },
      });
      if (!platform) {
        throw new Error('Platform not found');
      }
    }

    const merchant = await this.prisma.merchant.create({
      data: {
        platformId: data.platformId,
        name: data.name,
        legalName: data.legalName,
        email: data.email,
        phone: data.phone,
        website: data.website,
        description: data.description,
        address: data.address as any,
        kybStatus: 'not_started',
        status: 'pending',
        settings: {
          currency: data.settings?.currency || 'USD',
          timezone: data.settings?.timezone || 'UTC',
          webhookUrl: data.settings?.webhookUrl,
        } as any,
      },
      include: {
        platform: true,
      },
    });

    await this.createAuditLog({
      tenantContext,
      action: 'MERCHANT_CREATED',
      resourceType: 'MERCHANT',
      resourceId: merchant.id,
      details: { name: merchant.name, email: merchant.email },
    });

    return this.mapMerchant(merchant);
  }

  async updateMerchantStatus(
    id: string,
    statusUpdate: MerchantStatusUpdate,
    tenantContext: TenantContext
  ): Promise<Merchant> {
    // Only platform admins can update merchant status
    if (!this.hasPermission(tenantContext, 'PLATFORM_ADMIN')) {
      throw new Error('Insufficient permissions to update merchant status');
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: { platform: true },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const updatedMerchant = await this.prisma.merchant.update({
      where: { id },
      data: {
        status: statusUpdate.status,
        kybStatus: statusUpdate.kybStatus,
        approvedAt: statusUpdate.status === 'active' ? new Date() : merchant.approvedAt,
        updatedAt: new Date(),
      },
      include: {
        platform: true,
      },
    });

    await this.createAuditLog({
      tenantContext,
      action: 'MERCHANT_STATUS_UPDATED',
      resourceType: 'MERCHANT',
      resourceId: id,
      details: {
        oldStatus: merchant.status,
        newStatus: statusUpdate.status,
        kybStatus: statusUpdate.kybStatus,
        reviewNotes: statusUpdate.reviewNotes,
      },
    });

    // Update merchant info with KYB provider if approved
    if (statusUpdate.status === 'active') {
      try {
        await this.kybProvider.updateMerchantInfo(id, this.mapMerchant(updatedMerchant));
      } catch (error) {
        console.error('Failed to update merchant info with KYB provider:', error);
      }
    }

    return this.mapMerchant(updatedMerchant);
  }

  // KYB methods
  async submitKyb(
    merchantId: string,
    kybData: KybData,
    tenantContext: TenantContext
  ): Promise<{ success: boolean; message: string; submissionId?: string }> {
    // Check if user can submit KYB for this merchant
    if (!this.hasPermission(tenantContext, 'PLATFORM_ADMIN') && 
        tenantContext.merchantId !== merchantId) {
      throw new Error('Insufficient permissions to submit KYB for this merchant');
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    try {
      const result = await this.kybProvider.submitKyb(merchantId, kybData);

      // Update merchant with KYB data and status
      await this.prisma.merchant.update({
        where: { id: merchantId },
        data: {
          kybStatus: result.status,
          kybData: kybData as any,
          updatedAt: new Date(),
        },
      });

      await this.createAuditLog({
        tenantContext,
        action: 'KYB_SUBMITTED',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: {
          submissionId: result.submissionId,
          status: result.status,
          businessType: kybData.businessType,
        },
      });

      return {
        success: result.success,
        message: result.message || 'KYB submission processed',
        submissionId: result.submissionId,
      };
    } catch (error) {
      await this.createAuditLog({
        tenantContext,
        action: 'KYB_SUBMISSION_FAILED',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: { error: (error as Error).message },
      });

      throw new Error('KYB submission failed: ' + (error as Error).message);
    }
  }

  async checkKybStatus(
    merchantId: string,
    submissionId: string,
    tenantContext: TenantContext
  ): Promise<{ status: string; message?: string; lastUpdated: Date }> {
    // Check permissions
    if (!this.hasPermission(tenantContext, 'PLATFORM_ADMIN') && 
        tenantContext.merchantId !== merchantId) {
      throw new Error('Insufficient permissions to check KYB status for this merchant');
    }

    try {
      const result = await this.kybProvider.checkStatus(merchantId, submissionId);

      // Update merchant status if it changed
      const merchant = await this.prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (merchant && merchant.kybStatus !== result.status) {
        await this.prisma.merchant.update({
          where: { id: merchantId },
          data: {
            kybStatus: result.status,
            updatedAt: new Date(),
          },
        });

        await this.createAuditLog({
          tenantContext,
          action: 'KYB_STATUS_UPDATED',
          resourceType: 'MERCHANT',
          resourceId: merchantId,
          details: {
            oldStatus: merchant.kybStatus,
            newStatus: result.status,
            submissionId,
          },
        });
      }

      return {
        status: result.status,
        message: result.message,
        lastUpdated: result.lastUpdated,
      };
    } catch (error) {
      throw new Error('Failed to check KYB status: ' + (error as Error).message);
    }
  }

  // Helper methods
  private hasPermission(tenantContext: TenantContext, permission: string): boolean {
    return tenantContext.permissions.includes(permission) || 
           tenantContext.permissions.includes('PLATFORM_ADMIN');
  }

  private mapPlatform(platform: any): Platform {
    return {
      id: platform.id,
      name: platform.name,
      description: platform.description,
      website: platform.website,
      status: platform.status,
      createdAt: platform.createdAt,
      updatedAt: platform.updatedAt,
    };
  }

  private mapMerchant(merchant: any): Merchant {
    return {
      id: merchant.id,
      platformId: merchant.platformId,
      name: merchant.name,
      legalName: merchant.legalName,
      email: merchant.email,
      phone: merchant.phone,
      website: merchant.website,
      description: merchant.description,
      address: merchant.address,
      kybStatus: merchant.kybStatus,
      kybData: merchant.kybData,
      status: merchant.status,
      settings: merchant.settings,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
      approvedAt: merchant.approvedAt,
    };
  }

  private async createAuditLog(params: {
    tenantContext: TenantContext;
    action: string;
    resourceType: string;
    resourceId: string;
    details: any;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: params.tenantContext.organizationId,
          userId: params.tenantContext.userId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          details: params.details,
          ipAddress: '0.0.0.0', // This should be passed from the request
          userAgent: 'API', // This should be passed from the request
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}