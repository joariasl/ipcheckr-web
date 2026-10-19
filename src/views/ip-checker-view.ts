'use strict';

import type { IPResolution } from '../models/ip-resolution';
import type { IPAddress, IPFamily } from '../models/ip-address';
import rawAppTemplate from '../templates/app.html?raw';

const appTemplate = document.createElement('template');
appTemplate.innerHTML = rawAppTemplate;

export class IPCheckerView {
    private readonly root: HTMLDivElement;

    constructor(root: HTMLDivElement) {
        this.root = root;
    }

    render() {
        this.root.replaceChildren(appTemplate.content.cloneNode(true));
    }

    showUserAgent() {
        const userAgentElement = this.root.querySelector<HTMLElement>('#user-agent')!;
        const userAgentSpan = document.createElement('span');
        userAgentSpan.className = 'user-agent copyable';
        userAgentSpan.textContent = navigator.userAgent;
        userAgentElement.append(userAgentSpan);
    }

    showResolving() {
        for (const family of ['IPv4', 'IPv6'] as const) {
            const progressElement = document.createElement('progress');
            progressElement.textContent = 'Resolving...'
            this.familyElement(family).querySelector<HTMLSpanElement>('.status')!.replaceChildren(progressElement);
        }
    }

    showIP(ipAddress: IPAddress) {
        const familyElement = this.familyElement(ipAddress.type);
        const ipElement = document.createElement('span');
        ipElement.className = 'ip-address copyable';
        ipElement.textContent = ipAddress.ip;
        familyElement.querySelector<HTMLSpanElement>('.ip-address')!.replaceWith(ipElement);
        familyElement.querySelector<HTMLSpanElement>('.ip-error')?.remove();
    }

    showResolution(resolution: IPResolution) {
        const familyElement = this.familyElement(resolution.ip.type);
        const row = document.createElement('tr');
        const protocolCell = document.createElement('td');
        protocolCell.textContent = resolution.protocol;
        row.append(protocolCell);

        const ipElement = document.createElement('span');
        ipElement.className = 'ip-address copyable';
        ipElement.textContent = resolution.ip.ip;
        const ipCell = document.createElement('td');
        ipCell.append(ipElement);
        row.append(ipCell);

        const performanceCell = document.createElement('td');
        performanceCell.textContent = `${Math.round(resolution.performanceTime)} ms`;
        row.append(performanceCell);

        familyElement.querySelector<HTMLTableSectionElement>('.ip-resolution-records tbody')!.append(row);
        familyElement.querySelector<HTMLSpanElement>('.status')?.remove();
    }

    showNotFound(family: IPFamily, protocol: 'STUN' | 'HTTP') {
        const familyElement = this.familyElement(family);
        familyElement.querySelector<HTMLSpanElement>('.status')?.remove();

        const row = document.createElement('tr');
        const protocolCell = document.createElement('td');
        protocolCell.textContent = protocol;
        row.append(protocolCell);

        const ipElement = document.createElement('span');
        ipElement.textContent = 'Not found';
        const ipCell = document.createElement('td');
        ipCell.append(ipElement);
        row.append(ipCell);

        const performanceCell = document.createElement('td');
        row.append(performanceCell);

        familyElement.querySelector<HTMLTableSectionElement>('.ip-resolution-records tbody')!.append(row);
    }

    showFetchFailure(family: IPFamily) {
        this.showError(family, `Fetch failed (likely no ${family} connectivity)`);
        const familyElement = this.familyElement(family);
        familyElement.querySelector<HTMLSpanElement>('.status')?.remove();
    }

    showWarning(family: IPFamily) {
        this.showError(family, `Resolution is taking longer than expected (likely no ${family} connectivity)`);
    }

    private showError(family: IPFamily, message: string) {
        const familyElement = this.familyElement(family);
        const ipElement = familyElement.querySelector<HTMLSpanElement>('.ip-address')!;
        ipElement.hidden = true;

        familyElement.querySelector<HTMLSpanElement>('.ip-error')?.remove();
        const errorElement = document.createElement('span');
        errorElement.className = 'ip-error';
        errorElement.setAttribute('role', 'alert');
        errorElement.textContent = message;
        ipElement.after(errorElement);
    }

    private familyElement(family: IPFamily) {
        return this.root.querySelector<HTMLElement>(family === 'IPv4' ? '#ipv4' : '#ipv6')!;
    }
}
