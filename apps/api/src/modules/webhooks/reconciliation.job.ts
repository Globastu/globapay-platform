import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { ReconciliationService } from './reconciliation.service';

export interface ReconciliationJobData {
  organizationId?: string;
  fullReconciliation?: boolean;
}

export class ReconciliationJobScheduler {
  private queue: Queue;
  private worker: Worker;
  private reconciliationService: ReconciliationService;

  constructor(redis: Redis, prisma: PrismaClient) {
    this.reconciliationService = new ReconciliationService(prisma);

    // Create queue for reconciliation jobs
    this.queue = new Queue('reconciliation', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    });

    // Create worker
    this.worker = new Worker(
      'reconciliation',
      this.processReconciliationJob.bind(this),
      {
        connection: redis,
        concurrency: 1, // Run one reconciliation at a time
        limiter: {
          max: 1,
          duration: 60 * 1000, // Max 1 job per minute
        },
      }
    );

    this.setupEventHandlers();
    this.scheduleRecurringJobs();
  }

  /**
   * Schedule recurring reconciliation jobs
   */
  private async scheduleRecurringJobs(): Promise<void> {
    try {
      // Schedule main reconciliation job every 15 minutes
      await this.queue.add(
        'full-reconciliation',
        { fullReconciliation: true },
        {
          repeat: {
            pattern: '*/15 * * * *', // Every 15 minutes
          },
          jobId: 'recurring-reconciliation',
        }
      );

      // Schedule cleanup job daily at 2 AM
      await this.queue.add(
        'cleanup-stale-alerts',
        {},
        {
          repeat: {
            pattern: '0 2 * * *', // Daily at 2 AM
          },
          jobId: 'daily-cleanup',
        }
      );

      console.log('Reconciliation jobs scheduled');
    } catch (error) {
      console.error('Failed to schedule reconciliation jobs:', error);
    }
  }

  /**
   * Process reconciliation job
   */
  private async processReconciliationJob(job: Job<ReconciliationJobData>): Promise<void> {
    const { organizationId, fullReconciliation } = job.data;

    try {
      console.log(`Starting reconciliation job: ${job.name}`, job.data);

      switch (job.name) {
        case 'full-reconciliation':
          await this.runFullReconciliation(organizationId);
          break;
        
        case 'cleanup-stale-alerts':
          await this.cleanupStaleAlerts();
          break;
        
        case 'organization-reconciliation':
          if (organizationId) {
            await this.runOrganizationReconciliation(organizationId);
          }
          break;
        
        default:
          console.warn(`Unknown reconciliation job: ${job.name}`);
      }

      console.log(`Completed reconciliation job: ${job.name}`);
    } catch (error) {
      console.error(`Reconciliation job failed: ${job.name}`, error);
      throw error;
    }
  }

  /**
   * Run full reconciliation across all organizations
   */
  private async runFullReconciliation(organizationId?: string): Promise<void> {
    console.log('Running full reconciliation...');
    
    const result = await this.reconciliationService.runReconciliation();
    
    console.log('Reconciliation results:', {
      totalAlerts: result.alerts.length,
      orphanedTransactions: result.stats.orphanedTransactions,
      missingPaymentLinks: result.stats.missingPaymentLinks,
      webhookDelays: result.stats.webhookDelayAlerts,
    });

    // Log critical alerts
    const criticalAlerts = result.alerts.filter(alert => alert.severity === 'high');
    if (criticalAlerts.length > 0) {
      console.warn(`Found ${criticalAlerts.length} critical reconciliation issues:`, 
        criticalAlerts.map(alert => `${alert.type}: ${alert.title}`)
      );
    }
  }

  /**
   * Run reconciliation for specific organization
   */
  private async runOrganizationReconciliation(organizationId: string): Promise<void> {
    console.log(`Running reconciliation for organization: ${organizationId}`);
    
    // This could be extended to run organization-specific reconciliation
    await this.runFullReconciliation(organizationId);
  }

  /**
   * Clean up stale alerts
   */
  private async cleanupStaleAlerts(): Promise<void> {
    console.log('Running stale alerts cleanup...');
    
    const resolved = await this.reconciliationService.cleanupStaleAlerts();
    
    console.log(`Cleaned up ${resolved} stale alerts`);
  }

  /**
   * Trigger manual reconciliation
   */
  async triggerManualReconciliation(organizationId?: string): Promise<void> {
    await this.queue.add(
      'manual-reconciliation',
      { organizationId, fullReconciliation: true },
      {
        priority: 10, // High priority
        delay: 0, // Run immediately
      }
    );
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`Reconciliation job ${job.name} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Reconciliation job ${job?.name} failed:`, err);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`Reconciliation job ${jobId} stalled`);
    });

    this.queue.on('waiting', (jobId) => {
      console.log(`Reconciliation job ${jobId} is waiting`);
    });
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return {
      waiting: await this.queue.getWaiting(),
      active: await this.queue.getActive(),
      completed: await this.queue.getCompleted(),
      failed: await this.queue.getFailed(),
      delayed: await this.queue.getDelayed(),
    };
  }

  /**
   * Pause reconciliation jobs
   */
  async pauseJobs(): Promise<void> {
    await this.queue.pause();
    console.log('Reconciliation jobs paused');
  }

  /**
   * Resume reconciliation jobs
   */
  async resumeJobs(): Promise<void> {
    await this.queue.resume();
    console.log('Reconciliation jobs resumed');
  }

  /**
   * Clean old completed/failed jobs
   */
  async cleanJobs(): Promise<void> {
    await this.queue.clean(24 * 60 * 60 * 1000, 0, 'completed'); // 24 hours
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 0, 'failed'); // 7 days
    console.log('Reconciliation job queue cleaned');
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    console.log('Reconciliation job scheduler closed');
  }
}