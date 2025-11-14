/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GraphService } from "./GraphService";
import { OfficeGraphAuthProvider } from "../provider/OfficeGraphAuthProvider";

/**
 * Central GraphService manager to prevent multiple authentication requests
 * and ensure consistent Graph API access across the application
 */
class GraphServiceManager {
  private static instance: GraphServiceManager | null = null;
  private graphService: GraphService | null = null;
  private authProvider: OfficeGraphAuthProvider | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GraphServiceManager {
    if (!GraphServiceManager.instance) {
      GraphServiceManager.instance = new GraphServiceManager();
    }
    return GraphServiceManager.instance;
  }

  /**
   * Get initialized GraphService instance
   * Handles authentication and initialization only once
   */
  async getGraphService(): Promise<GraphService> {
    if (this.graphService && this.authProvider) {
      return this.graphService;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      await this.initializationPromise;
      if (this.graphService) {
        return this.graphService;
      }
    }

    // Start initialization
    this.initializationPromise = this.initialize();
    await this.initializationPromise;

    if (!this.graphService) {
      throw new Error("Failed to initialize GraphService");
    }

    return this.graphService;
  }

  private async initialize(): Promise<void> {
    console.log("🔧 Initializing GraphService manager...");

    this.authProvider = new OfficeGraphAuthProvider();
    this.graphService = new GraphService(this.authProvider);

    // Pre-authenticate to catch auth issues early
    console.log("🔑 Pre-authenticating Graph API...");
    await this.authProvider.getAccessToken();
    console.log("✅ GraphService manager ready");
  }

  /**
   * Reset the manager (useful for testing or re-authentication)
   */
  reset(): void {
    console.log("🔄 Resetting GraphService manager");
    this.graphService = null;
    this.authProvider = null;
    this.initializationPromise = null;
  }

  /**
   * Check if GraphService is ready without triggering initialization
   */
  isReady(): boolean {
    return !!this.graphService && !!this.authProvider;
  }
}

export const graphServiceManager = GraphServiceManager.getInstance();
