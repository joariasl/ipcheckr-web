'use strict';

import type { IPResolution } from './models/ip-resolution';
import { IPResolutionRecords } from './models/ip-resolution-records';
import { IPResolutionService } from './services/ip-resolution-service';
import { ConnectivityService } from './services/connectivity-service';
import { IPCheckerView } from './views/ip-checker-view';

export class App {
    private readonly view: IPCheckerView;
    private readonly resolutions: IPResolutionRecords;
    private readonly resolver: IPResolutionService;
    private readonly connectivity: ConnectivityService;

    constructor(rootElement: HTMLDivElement) {
        this.view = new IPCheckerView(rootElement);
        this.resolutions = new IPResolutionRecords();
        this.connectivity = new ConnectivityService();
        this.resolver = new IPResolutionService({
            onResolution: (resolution) => this.handleResolution(resolution),
            onNotFound: (family, protocol) => this.view.showNotFound(family, protocol),
            onFetchFailure: (family) => this.view.showFetchFailure(family),
            onWarning: (family) => this.view.showWarning(family),
        });
    }

    /**
     * Initialize and start the application
     */
    async start(): Promise<void> {
        this.renderInitialView();
        this.setupConnectivityHandling();
        await this.performInitialCheck();
        this.startPeriodicChecks();
        this.resolver.start();
    }

    /**
     * Render the initial view state
     */
    private renderInitialView(): void {
        this.view.render();
        this.view.showUserAgent();
        this.view.showResolving();
        this.view.updateConnectionStatus(this.connectivity.getStatus());
    }

    /**
     * Setup connectivity change handling
     */
    private setupConnectivityHandling(): void {
        this.connectivity.addListener({
            onStatusChange: (isHealthy) => this.handleConnectivityChange(isHealthy),
        });
    }

    /**
     * Perform initial network connectivity check
     */
    private async performInitialCheck(): Promise<void> {
        const result = await this.connectivity.checkConnectivity();
        console.log('Initial network connectivity check:', result);
    }

    /**
     * Start periodic connectivity checks
     */
    private startPeriodicChecks(): void {
        void this.connectivity.checkConnectivityPeriodic(30000);
    }

    /**
     * Handle connectivity status changes
     */
    private handleConnectivityChange(isHealthy: boolean): void {
        this.view.updateConnectionStatus(isHealthy);

        // Only restart IP resolution when connectivity is restored
        if (isHealthy) {
            this.restartIPResolution();
        }
    }

    /**
     * Restart IP resolution with a clean state
     */
    private restartIPResolution(): void {
        this.resolutions.clear();
        this.view.resetIPDisplay();
        this.view.showResolving();
        this.resolver.start();
    }

    /**
     * Handle IP resolution results
     */
    private handleResolution(resolution: IPResolution): void {
        this.view.showIP(resolution.ip);
        this.view.showResolution(resolution);
        this.resolutions.add(resolution);
    }
}
