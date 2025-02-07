/// <reference types="chrome"/>
// import posthog from 'posthog-js';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export function initAnalytics() {
  // Temporarily disabled until PostHog is set up
  console.log('Analytics initialization skipped');
  /*
  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      persistence: 'memory'
    });
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
  */
}

export function trackEvent(name: string, properties: Record<string, unknown> = {}) {
  // Temporarily log to console instead of PostHog
  console.log('Analytics Event:', {
    name,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    }
  });
  /*
  try {
    const manifest = chrome.runtime.getManifest();
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        version: manifest.version,
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString()
      }
    };

    posthog.capture(event.name, event.properties);
  } catch (error) {
    console.error('Analytics error:', error);
  }
  */
} 