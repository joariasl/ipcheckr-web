// Fetch IPv4 from 1.1.1.1/cdn-cgi/trace and IPv6 from 2606:4700:4700::1111/cdn-cgi/trace using HTTP client
'use strict';

import type { IPFamily } from '../models/ip-address';

const traceUrls: Record<IPFamily, string> = {
    IPv4: 'https://1.1.1.1/cdn-cgi/trace',
    IPv6: 'https://[2606:4700:4700::1111]/cdn-cgi/trace',
};

export async function fetchIP(url: string): Promise<{ ip: string; loc: string; uag: string; } | null> {
    try {
        let result = {
            ip: "",
            loc: "",
            uag: "",
        };
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('ip=')) {
                result.ip = line.substring(3).trim();
            } else if (line.startsWith('loc=')) {
                result.loc = line.substring(4).trim();
            } else if (line.startsWith('uag=')) {
                result.uag = line.substring(4).trim();
            }
        }
        if(result.ip) {
            return result;
        } else {
            throw new Error('IP not found in response');
        }
    } catch (error) {
        console.error('Error fetching IP from', url, error);
        if(error instanceof TypeError) {
            throw error; // Propagar TypeError para manejo específico
        }
        return null;
    }
}

export async function getIPs(family: IPFamily) {
    return fetchIP(traceUrls[family]);
}