import { createHmac, timingSafeEqual } from 'crypto';
import type { WebhookProvider } from '../types';

export abstract class BaseWebhookProvider implements WebhookProvider {
  abstract name: string;
  
  /**
   * Verify HMAC signature
   */
  protected verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: string = 'sha256',
    prefix: string = ''
  ): boolean {
    try {
      const expectedSignature = createHmac(algorithm, secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      const expectedWithPrefix = prefix ? `${prefix}${expectedSignature}` : expectedSignature;
      
      // Use timing-safe comparison to prevent timing attacks
      return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedWithPrefix)
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Extract timestamp from signature for replay attack protection
   */
  protected extractTimestamp(signature: string): number | null {
    // Many providers include timestamp in signature (e.g., Stripe: t=1234567890,v1=signature)
    const timestampMatch = signature.match(/t=(\d+)/);
    return timestampMatch ? parseInt(timestampMatch[1], 10) : null;
  }

  /**
   * Check if timestamp is within acceptable window (default: 5 minutes)
   */
  protected isTimestampValid(timestamp: number, windowSeconds: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - timestamp) <= windowSeconds;
  }

  abstract verifySignature(payload: string, signature: string, secret: string): boolean;
  abstract extractDedupeKey(payload: Record<string, any>): string;
  abstract getEventType(payload: Record<string, any>): string;
}