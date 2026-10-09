'use strict';

import type { IPResolution } from '../models/ip-resolution';
import type { IPAddress, IPFamily } from '../models/ip-address';

export class IPCheckerView {
    private readonly root: HTMLDivElement;

    constructor(root: HTMLDivElement) {
        this.root = root;
    }

    render() {
        this.root.innerHTML = `
          <div>
            <h1>Your public IP</h1>
            <div class="card">
              <div id="ipv4" class="info-card ip-card">
                <div class="info-header">
                    <h2>IPv4</h2>
                    <span class="status"></span>
                </div>
                <span class="ip-address">-- -- -- --</span>
                <table class="ip-resolution-records"><tbody></tbody></table>
              </div>
              <div id="ipv6" class="info-card ip-card">
                <div class="info-header">
                    <h2>IPv6</h2>
                    <span class="status"></span>
                </div>
                <span class="ip-address">-- -- -- -- -- --</span>
                <table class="ip-resolution-records"><tbody></tbody></table>
              </div>
              <div id="user-agent" class="info-card">
                <div class="info-header">
                    <h2>User Agent</h2>
                </div>
              </div>
            </div>
          </div>
        `;
    }

    showUserAgent() {
        const userAgentElement = this.root.querySelector<HTMLDivElement>('#user-agent')!;
        const userAgentSpan = document.createElement('span');
        userAgentSpan.className = 'user-agent copyable';
        userAgentSpan.textContent = navigator.userAgent;
        userAgentElement.append(userAgentSpan);
    }

    showResolving() {
        for (const family of ['IPv4', 'IPv6'] as const) {
            this.familyElement(family).querySelector<HTMLSpanElement>('.status')!.textContent = 'Resolving...';
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

        const ipCell = document.createElement('td');
        ipCell.textContent = resolution.ip.ip;
        row.append(ipCell);

        const performanceCell = document.createElement('td');
        performanceCell.textContent = `${Math.round(resolution.performanceTime)} ms`;
        row.append(performanceCell);

        familyElement.querySelector<HTMLTableSectionElement>('.ip-resolution-records tbody')!.append(row);
        familyElement.querySelector<HTMLSpanElement>('.status')?.remove();
    }

    showNotFound(family: IPFamily) {
        this.showError(family, 'Not found');
    }

    showFetchFailure(family: IPFamily) {
        this.showError(family, `Fetch failed (likely no ${family} connectivity)`);
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
        familyElement.querySelector<HTMLSpanElement>('.status')?.remove();
    }

    private familyElement(family: IPFamily) {
        return this.root.querySelector<HTMLDivElement>(family === 'IPv4' ? '#ipv4' : '#ipv6')!;
    }
}
