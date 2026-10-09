'use strict';

import { IPAddress } from './ip-address';

export class IPResolution {
    readonly ip: IPAddress;
    readonly resolvedAt: number;
    readonly performanceTime: number;
    readonly protocol: string;

    constructor(ip: IPAddress, protocol: string) {
        this.ip = ip;
        this.resolvedAt = Date.now();
        this.performanceTime = performance.now();
        this.protocol = protocol;
    }
}
