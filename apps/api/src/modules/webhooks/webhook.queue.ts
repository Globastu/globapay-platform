import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { WebhookService } from './webhook.service';
import { PrismaClient } from '@prisma/client';

export interface WebhookJobData {
  eventId: string;
  attempt: number;
  maxAttempts: number;
}

export class WebhookQueue {
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;
  private webhookService: WebhookService;

  constructor(
    redis: Redis,
    prisma: PrismaClient
  ) {
    this.redis = redis;
    this.webhookService = new WebhookService(prisma, redis);

    // Create queue with exponential backoff configuration
    this.queue = new Queue('webhook-processing', {
      connection: redis,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      },
    });

    // Create worker to process jobs
    this.worker = new Worker(
      'webhook-processing',
      this.processWebhookJob.bind(this),
      {
        connection: redis,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 100, // Max 100 jobs per duration
          duration: 60 * 1000, // 1 minute
        },
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Add webhook event to processing queue
   */
  async addWebhookJob(
    eventId: string, 
    delay: number = 0,
    priority: number = 0
  ): Promise<void> {
    const jobData: WebhookJobData = {
      eventId,
      attempt: 1,
      maxAttempts: 5,
    };

    await this.queue.add(
      'process-webhook',
      jobData,
      {
        delay,
        priority,
        jobId: `webhook-${eventId}`, // Unique job ID for idempotency
      }
    );
  }

  /**
   * Process webhook job
   */
  private async processWebhookJob(job: Job<WebhookJobData>): Promise<void> {
    const { eventId, attempt } = job.data;

    try {
      console.log(`Processing webhook job ${eventId}, attempt ${attempt}`);

      const prisma = new PrismaClient();
      const event = await prisma.webhookEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error(`Webhook event ${eventId} not found`);
      }

      // Skip if already processed
      if (event.processed) {
        console.log(`Webhook ${eventId} already processed, skipping`);
        return;
      }

      // Update processing attempts
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processingAttempts: attempt,
          lastProcessedAt: new Date(),
        },
      });

      // Process the webhook
      const result = await this.webhookService.processWebhookEvent(event, event.payload);

      // Update event with result
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processed: result.success,
          failureReason: result.error || null,
          updatedAt: new Date(),
        },
      });

      if (!result.success && result.shouldRetry) {
        throw new Error(result.error || 'Processing failed');
      }

      console.log(`Webhook ${eventId} processed successfully`);

    } catch (error) {
      console.error(`Webhook processing failed for ${eventId}:`, error);
      throw error; // Let BullMQ handle retries
    }
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`Webhook job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Webhook job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err);
      
      // Move to DLQ if max attempts reached
      if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
        this.moveToDLQ(job);
      }
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`Webhook job ${jobId} stalled`);
    });

    this.queue.on('waiting', (jobId) => {
      console.log(`Webhook job ${jobId} is waiting`);
    });

    this.queue.on('active', (job) => {
      console.log(`Webhook job ${job.id} is now active`);
    });
  }

  /**
   * Move failed job to Dead Letter Queue
   */
  private async moveToDLQ(job: Job): Promise<void> {
    try {
      const dlqKey = 'webhook-dlq';
      const jobData = {
        ...job.data,
        originalJobId: job.id,
        failedAt: new Date().toISOString(),
        attempts: job.attemptsMade,
        lastError: job.failedReason,
      };

      await this.redis.lpush(dlqKey, JSON.stringify(jobData));
      await this.redis.expire(dlqKey, 7 * 24 * 60 * 60); // Expire DLQ entries after 7 days

      console.log(`Moved webhook job ${job.id} to DLQ`);
    } catch (error) {
      console.error(`Failed to move job ${job.id} to DLQ:`, error);
    }
  }

  /**
   * Get DLQ entries
   */
  async getDLQEntries(limit: number = 50): Promise<any[]> {
    try {
      const entries = await this.redis.lrange('webhook-dlq', 0, limit - 1);
      return entries.map(entry => JSON.parse(entry));
    } catch (error) {
      console.error('Failed to get DLQ entries:', error);
      return [];
    }
  }

  /**
   * Retry job from DLQ
   */
  async retryFromDLQ(jobData: any): Promise<void> {
    try {
      await this.addWebhookJob(jobData.eventId, 0, 10); // High priority for retries
      
      // Remove from DLQ
      await this.redis.lrem('webhook-dlq', 1, JSON.stringify(jobData));
      
      console.log(`Retrying webhook job ${jobData.eventId} from DLQ`);
    } catch (error) {
      console.error(`Failed to retry job from DLQ:`, error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
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
   * Pause queue processing
   */
  async pauseQueue(): Promise<void> {
    await this.queue.pause();
    console.log('Webhook queue paused');
  }

  /**
   * Resume queue processing
   */
  async resumeQueue(): Promise<void> {
    await this.queue.resume();
    console.log('Webhook queue resumed');
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(): Promise<void> {
    // Clean completed jobs older than 24 hours
    await this.queue.clean(24 * 60 * 60 * 1000, 0, 'completed');
    
    // Clean failed jobs older than 7 days
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 0, 'failed');
    
    console.log('Webhook queue cleaned');
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    console.log('Webhook queue closed');
  }
}