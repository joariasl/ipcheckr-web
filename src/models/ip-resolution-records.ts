'use strict';

import { IPResolution } from './ip-resolution';

export class IPResolutionRecords {
    readonly records: IPResolution[] = [];

    add(ipResolution: IPResolution) {
        this.records.push(ipResolution);
    }
}
