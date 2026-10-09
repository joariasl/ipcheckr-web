'use strict';

import { getIPs } from '../clients/httpclient';
import { IPAddress } from '../models/ip-address';
import type { IPFamily } from '../models/ip-address';
import { IPResolution } from '../models/ip-resolution';
import { StunClient } from '../clients/stunclient';

interface IPResolutionServiceOptions {
    onResolution: (resolution: IPResolution) => void;
    onNotFound: (family: IPFamily) => void;
    onFetchFailure: (family: IPFamily) => void;
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
        try {
            const stunClient = new StunClient(
                (addrpair) => {
                    if (!addrpair.addr) return;

                    console.log('STUN IP fetching completed', performance.now());
                    this.options.onResolution(new IPResolution(new IPAddress(addrpair.addr), 'STUN'));
                },
                () => console.log('STUN fetching completed'),
            );

            await stunClient.start();
            console.log('STUN IP fetching completed');
        } catch (error) {
            console.error('Error during STUN fetching:', error);
        }
    }

    private async resolveHttp(family: IPFamily) {
        try {
            const result = await getIPs(family);
            if (result?.ip) {
                console.log(`${family} fetching completed`, performance.now());
                this.options.onResolution(new IPResolution(new IPAddress(result.ip), 'HTTP'));
            } else {
                this.options.onNotFound(family);
            }
        } catch (error) {
            console.error(`Error fetching ${family}:`, error);
            if (error instanceof TypeError) {
                this.options.onFetchFailure(family);
            }
        }
    }
}
