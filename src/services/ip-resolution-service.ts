'use strict';

import { getIPs } from '../clients/httpclient';
import { IPAddress } from '../models/ip-address';
import type { IPFamily } from '../models/ip-address';
import { IPResolution } from '../models/ip-resolution';
import { IPResolutionRecords } from '../models/ip-resolution-records';
import { StunClient } from '../clients/stunclient';

interface IPResolutionServiceOptions {
    onResolution: (resolution: IPResolution) => void;
    onNotFound: (family: IPFamily, protocol: 'STUN' | 'HTTP') => void;
    onFetchFailure: (family: IPFamily, protocol: 'STUN' | 'HTTP') => void;
    onWarning: (family: IPFamily, protocol: 'STUN' | 'HTTP') => void;
}

export class IPResolutionService {
    private readonly options: IPResolutionServiceOptions;

    constructor(options: IPResolutionServiceOptions) {
        this.options = options;
    }

    start() {
        void this.resolveStun();
        void this.resolveHttp('IPv4');
        void this.resolveHttp('IPv6');
    }

    private async resolveStun() {
        const stunIPs = new IPResolutionRecords();
        try {
            const stunClient = new StunClient(
                (addrpair) => {
                    if (!addrpair.addr) return;

                    console.log('STUN IP address found', addrpair.addr, performance.now());
                    const ipAddress = new IPAddress(addrpair.addr);
                    const ipResolution = new IPResolution(ipAddress, 'STUN');
                    stunIPs.add(ipResolution);
                    this.options.onResolution(ipResolution);
                },
                () => {
                    console.log('STUN fetching completed');
                    for (const family of ['IPv4', 'IPv6'] as const) {
                        if (!stunIPs.records.some(record => record.ip.type === family)) {
                            this.options.onNotFound(family, 'STUN');
                        }
                    }
                },
            );

            await stunClient.start();
            console.log('STUN IP fetching completed');
        } catch (error) {
            console.error('Error during STUN fetching:', error);
        }
    }

    private async resolveHttp(family: IPFamily) {
        const warningTimer = setTimeout(() => {
            this.options.onWarning(family, 'HTTP');
        }, 3000);
        
        try {
            const result = await getIPs(family);
            if (result?.ip) {
                console.log(`HTTP ${family} fetching completed`, performance.now());
                this.options.onResolution(new IPResolution(new IPAddress(result.ip), 'HTTP'));
            } else {
                this.options.onNotFound(family, 'HTTP');
            }
        } catch (error) {
            console.error(`Error fetching HTTP ${family}:`, error);
            if (error instanceof TypeError) {
                this.options.onFetchFailure(family, 'HTTP');
                this.options.onNotFound(family, 'HTTP');
            }
        } finally {
            clearTimeout(warningTimer);
        }
    }
}
