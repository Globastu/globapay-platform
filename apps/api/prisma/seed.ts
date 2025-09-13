import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function generateShortCode(): string {
  return randomBytes(8).toString('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create Platform Organization
  const platformOrg = await prisma.organization.create({
    data: {
      name: 'Globapay Platform',
      slug: 'globapay-platform',
      type: 'PLATFORM',
      status: 'ACTIVE',
      settings: {
        webhookUrl: 'https://api.globapay.com/webhooks',
        timezone: 'UTC',
        currency: 'USD',
      },
      metadata: {
        description: 'Main platform organization',
      },
    },
  });

  console.log('✅ Created platform organization:', platformOrg.name);

  // Create Sub-Merchant under Platform
  const subMerchant = await prisma.merchant.create({
    data: {
      organizationId: platformOrg.id,
      name: 'Acme Healthcare Clinic',
      slug: 'acme-healthcare',
      status: 'ACTIVE',
      kybStatus: 'APPROVED',
      businessInfo: {
        legalName: 'Acme Healthcare Clinic LLC',
        taxId: '12-3456789',
        website: 'https://acmehealthcare.com',
        address: {
          line1: '123 Medical Center Dr',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
          country: 'US',
        },
      },
      paymentMethods: ['CARD', 'BANK_TRANSFER'],
      settings: {
        webhookUrl: 'https://acmehealthcare.com/webhooks',
        returnUrl: 'https://acmehealthcare.com/payment/success',
        cancelUrl: 'https://acmehealthcare.com/payment/cancel',
      },
      metadata: {
        industry: 'healthcare',
        onboardedBy: 'platform-admin',
      },
    },
  });

  console.log('✅ Created sub-merchant:', subMerchant.name);

  // Create Standalone Merchant Organization
  const merchantOrg = await prisma.organization.create({
    data: {
      name: 'TechFlow Solutions',
      slug: 'techflow-solutions',
      type: 'MERCHANT',
      status: 'ACTIVE',
      settings: {
        webhookUrl: 'https://techflow.com/api/webhooks',
        timezone: 'America/New_York',
        currency: 'USD',
      },
      metadata: {
        description: 'Independent merchant organization',
      },
    },
  });

  const standaloneMerchant = await prisma.merchant.create({
    data: {
      organizationId: merchantOrg.id,
      name: 'TechFlow Solutions',
      slug: 'techflow-solutions',
      status: 'ACTIVE',
      kybStatus: 'APPROVED',
      businessInfo: {
        legalName: 'TechFlow Solutions Inc',
        taxId: '98-7654321',
        website: 'https://techflow.com',
        address: {
          line1: '456 Innovation Blvd',
          line2: 'Suite 200',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      },
      paymentMethods: ['CARD', 'WALLET'],
      settings: {
        webhookUrl: 'https://techflow.com/api/webhooks',
        returnUrl: 'https://techflow.com/checkout/success',
        cancelUrl: 'https://techflow.com/checkout/cancel',
      },
      metadata: {
        industry: 'technology',
        tier: 'enterprise',
      },
    },
  });

  console.log('✅ Created standalone merchant:', standaloneMerchant.name);

  // Create System Roles for Platform
  const platformAdminRole = await prisma.role.create({
    data: {
      organizationId: platformOrg.id,
      name: 'Platform Admin',
      description: 'Full administrative access to platform',
      type: 'system',
      permissions: [
        'MERCHANTS_READ',
        'MERCHANTS_WRITE',
        'MERCHANTS_DELETE',
        'USERS_READ',
        'USERS_WRITE',
        'USERS_DELETE',
        'ORGANIZATION_READ',
        'ORGANIZATION_WRITE',
        'AUDIT_LOGS_READ',
        'REPORTS_READ',
        'REPORTS_GENERATE',
        'WEBHOOKS_READ',
        'WEBHOOKS_REPLAY',
        'API_KEYS_READ',
        'API_KEYS_WRITE',
        'API_KEYS_DELETE',
      ],
      isDefault: false,
    },
  });

  const merchantUserRole = await prisma.role.create({
    data: {
      organizationId: platformOrg.id,
      name: 'Merchant User',
      description: 'Standard merchant user access',
      type: 'system',
      permissions: [
        'PAYMENT_LINKS_READ',
        'PAYMENT_LINKS_WRITE',
        'TRANSACTIONS_READ',
        'REPORTS_READ',
      ],
      isDefault: true,
    },
  });

  // Create System Roles for Standalone Merchant
  const merchantOwnerRole = await prisma.role.create({
    data: {
      organizationId: merchantOrg.id,
      name: 'Owner',
      description: 'Full access to merchant account',
      type: 'system',
      permissions: [
        'MERCHANTS_READ',
        'MERCHANTS_WRITE',
        'USERS_READ',
        'USERS_WRITE',
        'PAYMENT_LINKS_READ',
        'PAYMENT_LINKS_WRITE',
        'PAYMENT_LINKS_DELETE',
        'TRANSACTIONS_READ',
        'TRANSACTIONS_REFUND',
        'REPORTS_READ',
        'REPORTS_GENERATE',
        'WEBHOOKS_READ',
        'API_KEYS_READ',
        'API_KEYS_WRITE',
        'AUDIT_LOGS_READ',
      ],
      isDefault: false,
    },
  });

  console.log('✅ Created system roles');

  // Create Test Users
  const platformAdmin = await prisma.user.create({
    data: {
      email: 'admin@globapay.com',
      name: 'Platform Administrator',
      status: 'ACTIVE',
      emailVerified: true,
      passwordHash: hashPassword('admin123'), // In production, use proper password hashing
      mfaEnabled: true,
      preferences: {
        timezone: 'UTC',
        dateFormat: 'yyyy-MM-dd',
        notifications: {
          email: true,
          webhook: true,
        },
      },
    },
  });

  const merchantUser = await prisma.user.create({
    data: {
      email: 'user@acmehealthcare.com',
      name: 'Dr. Sarah Johnson',
      status: 'ACTIVE',
      emailVerified: true,
      passwordHash: hashPassword('user123'),
      mfaEnabled: false,
      preferences: {
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/dd/yyyy',
        notifications: {
          email: true,
          webhook: false,
        },
      },
    },
  });

  const merchantOwner = await prisma.user.create({
    data: {
      email: 'owner@techflow.com',
      name: 'John Smith',
      status: 'ACTIVE',
      emailVerified: true,
      passwordHash: hashPassword('owner123'),
      mfaEnabled: true,
      preferences: {
        timezone: 'America/New_York',
        dateFormat: 'yyyy-MM-dd',
        notifications: {
          email: true,
          webhook: true,
        },
      },
    },
  });

  console.log('✅ Created test users');

  // Assign Users to Organizations with Roles
  await prisma.userOrgRole.create({
    data: {
      userId: platformAdmin.id,
      organizationId: platformOrg.id,
      roleId: platformAdminRole.id,
      permissions: [], // Admin has all permissions via role
    },
  });

  await prisma.userOrgRole.create({
    data: {
      userId: merchantUser.id,
      organizationId: platformOrg.id,
      roleId: merchantUserRole.id,
      permissions: [], // Standard permissions via role
    },
  });

  await prisma.userOrgRole.create({
    data: {
      userId: merchantOwner.id,
      organizationId: merchantOrg.id,
      roleId: merchantOwnerRole.id,
      permissions: [], // Owner permissions via role
    },
  });

  console.log('✅ Assigned users to organizations');

  // Create Sample Payment Links
  const paymentLink1 = await prisma.paymentLink.create({
    data: {
      merchantId: subMerchant.id,
      reference: 'INV-2024-001',
      amount: 15000, // $150.00
      currency: 'USD',
      description: 'Medical consultation payment',
      customerEmail: 'patient@example.com',
      customerName: 'Jane Doe',
      status: 'PENDING',
      shortCode: generateShortCode(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      metadata: {
        appointmentId: 'apt-123',
        doctorId: 'dr-456',
        serviceType: 'consultation',
      },
    },
  });

  const paymentLink2 = await prisma.paymentLink.create({
    data: {
      merchantId: standaloneMerchant.id,
      reference: 'ORDER-2024-042',
      amount: 299900, // $2999.00
      currency: 'USD',
      description: 'Software license annual subscription',
      customerEmail: 'customer@enterprise.com',
      customerName: 'Enterprise Corp',
      status: 'PENDING',
      shortCode: generateShortCode(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      metadata: {
        licenseType: 'enterprise',
        seats: '100',
        billingCycle: 'annual',
      },
    },
  });

  console.log('✅ Created sample payment links');

  // Create Sample Checkout Session
  const checkoutSession = await prisma.checkoutSession.create({
    data: {
      merchantId: subMerchant.id,
      paymentLinkId: paymentLink1.id,
      mode: 'HOSTED',
      amount: 15000,
      currency: 'USD',
      customer: {
        email: 'patient@example.com',
        name: 'Jane Doe',
        phone: '+1-555-0123',
      },
      paymentMethods: ['CARD'],
      status: 'OPEN',
      token: generateToken(),
      successUrl: 'https://acmehealthcare.com/payment/success',
      cancelUrl: 'https://acmehealthcare.com/payment/cancel',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      metadata: {
        source: 'payment_link',
        appointmentId: 'apt-123',
      },
    },
  });

  console.log('✅ Created sample checkout session');

  // Create Sample Transaction
  const transaction = await prisma.transaction.create({
    data: {
      merchantId: standaloneMerchant.id,
      checkoutSessionId: null,
      reference: 'TXN-2024-001',
      amount: 5000, // $50.00
      currency: 'USD',
      status: 'CAPTURED',
      paymentMethod: {
        type: 'CARD',
        details: {
          last4: '4242',
          brand: 'visa',
          country: 'US',
        },
      },
      customer: {
        email: 'test@example.com',
        name: 'Test Customer',
        phone: '+1-555-9876',
      },
      fraudScore: 15.5,
      threeDsResult: {
        status: 'AUTHENTICATED',
        version: '2.1',
      },
      fees: {
        processing: 145, // $1.45
        platform: 50, // $0.50
      },
      pspTransactionId: 'psp_1234567890',
      metadata: {
        source: 'api',
        customerIpAddress: '192.168.1.1',
      },
      processedAt: new Date(),
    },
  });

  console.log('✅ Created sample transaction');

  // Create Sample Refund
  const refund = await prisma.refund.create({
    data: {
      transactionId: transaction.id,
      merchantId: transaction.merchantId,
      amount: 2500, // $25.00 partial refund
      currency: 'USD',
      reason: 'REQUESTED_BY_CUSTOMER',
      description: 'Customer requested partial refund',
      status: 'SUCCEEDED',
      pspRefundId: 'psp_refund_9876543210',
      initiatedByType: 'MANUAL',
      initiatedByUserId: merchantOwner.id,
      metadata: {
        reason: 'Customer not satisfied with partial service',
      },
      processedAt: new Date(),
    },
  });

  console.log('✅ Created sample refund');

  // Create Sample Webhook Event
  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      type: 'PAYMENT_COMPLETED',
      source: 'PAYMENT',
      merchantId: standaloneMerchant.id,
      resourceId: transaction.id,
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        customer: transaction.customer,
      },
      status: 'DELIVERED',
      attempts: 1,
      maxAttempts: 5,
      lastAttemptAt: new Date(),
      deliveredAt: new Date(),
      webhookUrl: 'https://techflow.com/api/webhooks',
      httpStatus: 200,
      responseBody: '{"status": "ok"}',
      signature: 'sha256=abc123...',
    },
  });

  console.log('✅ Created sample webhook event');

  // Create Sample Audit Log
  const auditLog = await prisma.auditLog.create({
    data: {
      organizationId: merchantOrg.id,
      merchantId: standaloneMerchant.id,
      userId: merchantOwner.id,
      action: 'TRANSACTION_REFUND',
      resourceType: 'REFUND',
      resourceId: refund.id,
      details: {
        changes: {
          amount: refund.amount,
          reason: refund.reason,
        },
        reason: 'Customer requested partial refund',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
      },
      outcome: 'SUCCESS',
      metadata: {
        transactionId: transaction.id,
        refundId: refund.id,
      },
    },
  });

  console.log('✅ Created sample audit log');

  // === Additional Platforms and Merchants for Multi-Tenancy ===

  // Create additional platform organizations
  const techHubPlatform = await prisma.organization.create({
    data: {
      name: 'TechStart Hub',
      slug: 'techstart-hub',
      type: 'PLATFORM',
      status: 'ACTIVE',
      settings: {
        webhookUrl: 'https://api.techstarthub.com/webhooks',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
      },
      metadata: {
        description: 'Platform for technology startups and SaaS companies',
        website: 'https://techstarthub.com',
      },
    },
  });

  const ecommercePlatform = await prisma.organization.create({
    data: {
      name: 'ECommerce Central',
      slug: 'ecommerce-central',
      type: 'PLATFORM',
      status: 'ACTIVE',
      settings: {
        webhookUrl: 'https://api.ecommercecentral.com/webhooks',
        timezone: 'America/New_York',
        currency: 'USD',
      },
      metadata: {
        description: 'Multi-vendor marketplace and e-commerce platform',
        website: 'https://ecommercecentral.com',
      },
    },
  });

  console.log('✅ Created additional platform organizations');

  // Create merchants under TechStart Hub
  const cloudTechMerchant = await prisma.merchant.create({
    data: {
      organizationId: techHubPlatform.id,
      name: 'CloudTech Solutions',
      slug: 'cloudtech-solutions',
      status: 'ACTIVE',
      kybStatus: 'APPROVED',
      businessInfo: {
        legalName: 'CloudTech Solutions LLC',
        taxId: '12-3456789',
        website: 'https://cloudtech.com',
        address: {
          line1: '123 Tech Street',
          line2: 'Suite 400',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'US',
        },
        businessType: 'llc',
        incorporationDate: new Date('2023-01-15'),
      },
      paymentMethods: ['CARD', 'WALLET', 'BANK_TRANSFER'],
      settings: {
        webhookUrl: 'https://cloudtech.com/webhooks/globapay',
        returnUrl: 'https://cloudtech.com/checkout/success',
        cancelUrl: 'https://cloudtech.com/checkout/cancel',
      },
      metadata: {
        industry: 'cloud_computing',
        tier: 'growth',
        monthlyVolume: 50000,
      },
    },
  });

  const datavizMerchant = await prisma.merchant.create({
    data: {
      organizationId: techHubPlatform.id,
      name: 'DataViz Pro',
      slug: 'dataviz-pro',
      status: 'PENDING',
      kybStatus: 'UNDER_REVIEW',
      businessInfo: {
        legalName: 'DataViz Pro LLC',
        taxId: '11-2233445',
        website: 'https://datavizpro.com',
        address: {
          line1: '321 Data Drive',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
        },
        businessType: 'llc',
        incorporationDate: new Date('2023-03-10'),
      },
      paymentMethods: ['CARD'],
      settings: {
        webhookUrl: 'https://datavizpro.com/api/webhooks',
        returnUrl: 'https://datavizpro.com/success',
        cancelUrl: 'https://datavizpro.com/cancel',
      },
      metadata: {
        industry: 'data_analytics',
        tier: 'startup',
        monthlyVolume: 15000,
      },
    },
  });

  // Create merchants under ECommerce Central
  const fashionMerchant = await prisma.merchant.create({
    data: {
      organizationId: ecommercePlatform.id,
      name: 'Fashion Forward',
      slug: 'fashion-forward',
      status: 'ACTIVE',
      kybStatus: 'APPROVED',
      businessInfo: {
        legalName: 'Fashion Forward Inc.',
        taxId: '98-7654321',
        website: 'https://fashionforward.com',
        address: {
          line1: '789 Fashion Ave',
          line2: 'Floor 12',
          city: 'New York',
          state: 'NY',
          postalCode: '10018',
          country: 'US',
        },
        businessType: 'corporation',
        incorporationDate: new Date('2020-09-20'),
      },
      paymentMethods: ['CARD', 'WALLET', 'BUY_NOW_PAY_LATER'],
      settings: {
        webhookUrl: 'https://fashionforward.com/api/webhooks',
        returnUrl: 'https://fashionforward.com/checkout/success',
        cancelUrl: 'https://fashionforward.com/checkout/cancel',
      },
      metadata: {
        industry: 'fashion_retail',
        tier: 'enterprise',
        monthlyVolume: 200000,
      },
    },
  });

  const electronicsMerchant = await prisma.merchant.create({
    data: {
      organizationId: ecommercePlatform.id,
      name: 'ElectroMart',
      slug: 'electromart',
      status: 'SUSPENDED',
      kybStatus: 'ADDITIONAL_INFO_REQUIRED',
      businessInfo: {
        legalName: 'ElectroMart Corporation',
        taxId: '55-9988776',
        website: 'https://electromart.com',
        address: {
          line1: '456 Electronics Blvd',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'US',
        },
        businessType: 'corporation',
        incorporationDate: new Date('2019-11-05'),
      },
      paymentMethods: ['CARD'],
      settings: {
        webhookUrl: 'https://electromart.com/webhooks',
        returnUrl: 'https://electromart.com/success',
        cancelUrl: 'https://electromart.com/cancel',
      },
      metadata: {
        industry: 'electronics_retail',
        tier: 'growth',
        monthlyVolume: 75000,
        suspensionReason: 'Unusual transaction patterns detected',
      },
    },
  });

  // Create additional standalone merchant
  const localBakeryOrg = await prisma.organization.create({
    data: {
      name: 'Local Bakery Co',
      slug: 'local-bakery-co',
      type: 'MERCHANT',
      status: 'ACTIVE',
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
      },
      metadata: {
        description: 'Artisanal baked goods and catering services',
      },
    },
  });

  const localBakeryMerchant = await prisma.merchant.create({
    data: {
      organizationId: localBakeryOrg.id,
      name: 'Local Bakery Co',
      slug: 'local-bakery',
      status: 'PENDING',
      kybStatus: 'PENDING_DOCUMENTS',
      businessInfo: {
        legalName: 'Local Bakery Company',
        website: 'https://localbakery.com',
        address: {
          line1: '456 Baker Street',
          city: 'Portland',
          state: 'OR',
          postalCode: '97205',
          country: 'US',
        },
        businessType: 'sole_proprietorship',
      },
      paymentMethods: ['CARD'],
      settings: {
        returnUrl: 'https://localbakery.com/thankyou',
        cancelUrl: 'https://localbakery.com/cancel',
      },
      metadata: {
        industry: 'food_beverage',
        tier: 'small_business',
        monthlyVolume: 5000,
      },
    },
  });

  console.log('✅ Created additional merchants across platforms');

  // Create platform admin users for new platforms
  const techHubAdmin = await prisma.user.create({
    data: {
      organizationId: techHubPlatform.id,
      email: 'admin@techstarthub.com',
      passwordHash: hashPassword('admin123'),
      firstName: 'Tech',
      lastName: 'Admin',
      role: 'ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  const ecommerceAdmin = await prisma.user.create({
    data: {
      organizationId: ecommercePlatform.id,
      email: 'admin@ecommercecentral.com',
      passwordHash: hashPassword('admin123'),
      firstName: 'Ecommerce',
      lastName: 'Admin',
      role: 'ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  // Create merchant users
  const cloudTechUser = await prisma.user.create({
    data: {
      organizationId: techHubPlatform.id,
      merchantId: cloudTechMerchant.id,
      email: 'admin@cloudtech.com',
      passwordHash: hashPassword('user123'),
      firstName: 'John',
      lastName: 'Smith',
      role: 'USER',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  const fashionUser = await prisma.user.create({
    data: {
      organizationId: ecommercePlatform.id,
      merchantId: fashionMerchant.id,
      email: 'admin@fashionforward.com',
      passwordHash: hashPassword('user123'),
      firstName: 'Maria',
      lastName: 'Rodriguez',
      role: 'USER',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  const bakeryOwner = await prisma.user.create({
    data: {
      organizationId: localBakeryOrg.id,
      merchantId: localBakeryMerchant.id,
      email: 'owner@localbakery.com',
      passwordHash: hashPassword('owner123'),
      firstName: 'Tom',
      lastName: 'Baker',
      role: 'ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created additional platform and merchant users');

  // Create sample Platform records in new Platform table
  const platformRecords = await Promise.all([
    prisma.platform.create({
      data: {
        name: 'TechStart Hub',
        description: 'Platform for technology startups and SaaS companies',
        website: 'https://techstarthub.com',
        status: 'active',
      },
    }),
    prisma.platform.create({
      data: {
        name: 'ECommerce Central',
        description: 'Multi-vendor marketplace and e-commerce platform',
        website: 'https://ecommercecentral.com',
        status: 'active',
      },
    }),
    prisma.platform.create({
      data: {
        name: 'ServicePro Network',
        description: 'Professional services and consulting platform',
        website: 'https://servicepronet.com',
        status: 'inactive',
      },
    }),
  ]);

  console.log('✅ Created platform records');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log('- 5 Organizations (3 Platform, 2 Merchant)');
  console.log('- 7 Merchants (5 Sub-merchants, 2 Standalone)');
  console.log('- 8 Users (3 Platform Admins, 3 Merchant Users, 2 Owners)');
  console.log('- 4 Roles (Platform Admin, Merchant User, Owner)');
  console.log('- 3 Platform Records');
  console.log('- 2 Payment Links');
  console.log('- 1 Checkout Session');
  console.log('- 1 Transaction');
  console.log('- 1 Refund');
  console.log('- 1 Webhook Event');
  console.log('- 1 Audit Log');

  console.log('\n👥 Test Users:');
  console.log('- admin@globapay.com / admin123 (Platform Admin)');
  console.log('- admin@techstarthub.com / admin123 (TechStart Hub Admin)');
  console.log('- admin@ecommercecentral.com / admin123 (ECommerce Central Admin)');
  console.log('- user@acmehealthcare.com / user123 (Merchant User)');
  console.log('- admin@cloudtech.com / user123 (CloudTech User)');
  console.log('- admin@fashionforward.com / user123 (Fashion Forward User)');
  console.log('- owner@techflow.com / owner123 (TechFlow Owner)');
  console.log('- owner@localbakery.com / owner123 (Local Bakery Owner)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });