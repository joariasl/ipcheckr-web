'use strict';

export type ConnectivityCheckType = 'navigator' | 'ping';

export interface ConnectivityCheckResult {
    type: ConnectivityCheckType;
    isHealthy: boolean;
    statusCode?: number;
    error?: string;
}

export interface ConnectivityStatusListener {
    onStatusChange: (isHealthy: boolean, result: ConnectivityCheckResult) => void;
}

export class ConnectivityService {
    private isHealthy: boolean;
    private listeners: ConnectivityStatusListener[] = [];
    private readonly pingUrl: string;
    private readonly requestTimeoutMillis = 5000;

    constructor(pingUrl: string = '/ping.json') {
        this.isHealthy = this.checkNavigatorOnLine();
        this.pingUrl = pingUrl;
        this.setupListeners();
    }

    private setupListeners() {
        // Listen to navigator.onLine events
        window.addEventListener('online', () => this.handleNavigatorStatusChange(true, 'navigator'));
        window.addEventListener('offline', () => this.handleNavigatorStatusChange(false, 'navigator'));
    }

    /**
     * Check connectivity via navigator.onLine
     */
    private handleNavigatorStatusChange(isHealthy: boolean, type: ConnectivityCheckType) {
        const result: ConnectivityCheckResult = {
            type,
            isHealthy,
        };
        this.notifyIfChanged(isHealthy, result);
        if (isHealthy) {
            this.checkConnectivity();
        }
    }

    checkNavigatorOnLine() {
        return navigator.onLine;
    }

    /**
     * Performs a HEAD request to check network connectivity
     * Returns 200 status code if connection is healthy
     */
    async checkConnectivity(): Promise<ConnectivityCheckResult> {
        try {
            const response = await fetch(this.pingUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(this.requestTimeoutMillis),
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });

            const isHealthy = response.ok && response.status === 200;
            const result: ConnectivityCheckResult = {
                type: 'ping',
                isHealthy: isHealthy,
                statusCode: response.status,
            };
            if (isHealthy) {
                console.log(`Network check passed (${response.status})`);
            } else {
                console.warn(`Network check failed with status ${response.status}`);
                result.error = `HTTP ${response.status}`;
            }
            this.notifyIfChanged(isHealthy, result);
            return result;
        } catch (error) {
            const isHealthy = false;
            const errorMessage = error instanceof Error ? error.message : String(error);

            console.error('Network connectivity check failed:', errorMessage);
            const result: ConnectivityCheckResult = {
                type: 'ping',
                isHealthy: isHealthy,
                error: errorMessage,
            };
            this.notifyIfChanged(isHealthy, result);
            return result;
        }
    }

    /**
     * Performs a periodic connectivity check
     */
    async checkConnectivityPeriodic(intervalMs: number = 30000): Promise<void> {
        setInterval(async () => {
            const result = await this.checkConnectivity();
            console.log('Periodic connectivity check:', result);
        }, intervalMs);
    }

    private notifyIfChanged(isHealthy: boolean, result: ConnectivityCheckResult) {
        if (this.getStatus() === isHealthy) {
            return;
        }

        // Update internal status
        this.setStatus(isHealthy);
        this.notifyListeners(result);
    }

    private notifyListeners(result: ConnectivityCheckResult) {
        this.listeners.forEach(listener => {
            listener.onStatusChange(result.isHealthy, result);
        });
    }

    addListener(listener: ConnectivityStatusListener) {
        this.listeners.push(listener);
    }

    removeListener(listener: ConnectivityStatusListener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    getStatus(): boolean {
        return this.isHealthy;
    }

    setStatus(status: boolean): void {
        this.isHealthy = status;
    }
}
