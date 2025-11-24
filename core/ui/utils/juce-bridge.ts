/**
 * @file juce-bridge.ts
 * @brief Utilities for JUCE WebView communication
 */

/// <reference path="../types/juce.d.ts" />

import { BatchParameterUpdate } from '../types/juce';

/**
 * Check if running inside JUCE WebView
 */
export function isJUCEWebView(): boolean {
  return typeof window !== 'undefined' && typeof window.__juce__ !== 'undefined';
}

/**
 * Get JUCE backend info
 */
export function getJUCEInfo() {
  if (!isJUCEWebView()) return null;
  return window.__juce__;
}

/**
 * Send a parameter update to JUCE
 */
export function sendParameterToJUCE(paramId: string, normalizedValue: number): void {
  if (isJUCEWebView() && window.setParameter) {
    console.log(`[JUCE Bridge] Sending parameter: ${paramId} = ${normalizedValue}`);
    window.setParameter(paramId, normalizedValue);
  }
}

/**
 * Get a parameter value from JUCE
 */
export function getParameterFromJUCE(paramId: string): number | undefined {
  if (isJUCEWebView() && window.getParameter) {
    return window.getParameter(paramId);
  }
  return undefined;
}

/**
 * Send multiple parameter updates as a batch (more efficient)
 */
export function batchSendParametersToJUCE(updates: BatchParameterUpdate): void {
  if (isJUCEWebView()) {
    if (window.batchSetParameters) {
      // Use native batch function if available
      window.batchSetParameters(updates);
    } else if (window.setParameter) {
      // Fall back to individual calls
      Object.entries(updates).forEach(([paramId, value]) => {
        window.setParameter!(paramId, value);
      });
    }
  }
}

/**
 * Parameter batching helper class
 * Automatically batches parameter updates for efficiency
 */
export class JUCEParameterBatcher {
  private pendingUpdates: BatchParameterUpdate = {};
  private batchTimer: NodeJS.Timeout | null = null;
  private batchInterval: number;

  constructor(batchInterval: number = 16) {
    this.batchInterval = batchInterval;
  }

  /**
   * Queue a parameter update
   */
  setParameter(paramId: string, value: number): void {
    this.pendingUpdates[paramId] = value;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flush();
    }, this.batchInterval);
  }

  /**
   * Immediately flush pending updates
   */
  flush(): void {
    if (Object.keys(this.pendingUpdates).length > 0) {
      batchSendParametersToJUCE(this.pendingUpdates);
      this.pendingUpdates = {};
    }
    this.batchTimer = null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.flush();
  }
}
