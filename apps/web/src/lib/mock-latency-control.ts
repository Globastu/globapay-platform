'use client';

/**
 * Utility for controlling MSW latency during development and testing
 */
export class MockLatencyControl {
  private static readonly STORAGE_KEY = 'msw_latency';

  /**
   * Set the latency for all MSW handlers
   * @param latencyMs Latency in milliseconds (0 to disable)
   */
  static setLatency(latencyMs: number): void {
    if (typeof window !== 'undefined') {
      if (latencyMs <= 0) {
        localStorage.removeItem(this.STORAGE_KEY);
      } else {
        localStorage.setItem(this.STORAGE_KEY, latencyMs.toString());
      }
    }
  }

  /**
   * Get the current latency setting
   * @returns Latency in milliseconds
   */
  static getLatency(): number {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    }
    return 0;
  }

  /**
   * Check if mock mode is active
   */
  static isMockMode(): boolean {
    return process.env.NEXT_PUBLIC_MOCK === '1';
  }

  /**
   * Toggle between different latency presets
   */
  static toggleLatency(): number {
    const current = this.getLatency();
    const presets = [0, 250, 500, 1000, 2000];
    const currentIndex = presets.indexOf(current);
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextLatency = presets[nextIndex] ?? 0;
    
    this.setLatency(nextLatency);
    return nextLatency;
  }

  /**
   * Add latency control to development tools
   */
  static addDevControls(): void {
    if (!this.isMockMode() || typeof window === 'undefined') {
      return;
    }

    // Add to window object for console access
    (window as any).mockLatency = {
      set: this.setLatency,
      get: this.getLatency,
      toggle: this.toggleLatency,
      presets: {
        none: () => this.setLatency(0),
        fast: () => this.setLatency(250),
        medium: () => this.setLatency(500),
        slow: () => this.setLatency(1000),
        very_slow: () => this.setLatency(2000),
      },
    };

    console.log('🎭 Mock Latency Controls Available:');
    console.log('  mockLatency.set(ms) - Set latency in milliseconds');
    console.log('  mockLatency.get() - Get current latency');
    console.log('  mockLatency.toggle() - Cycle through presets');
    console.log('  mockLatency.presets.fast() - Set to 250ms');
    console.log('  mockLatency.presets.medium() - Set to 500ms');
    console.log('  mockLatency.presets.slow() - Set to 1000ms');
  }
}