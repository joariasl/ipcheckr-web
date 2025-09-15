// Fetch IPv4 from 1.1.1.1/cdn-cgi/trace and IPv6 from 2606:4700:4700::1111/cdn-cgi/trace using HTTP client
'use strict';

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

export async function getIPs(family = '4') {
    let ip = null;
    if (family === '4') {
        ip = await fetchIP('https://1.1.1.1/cdn-cgi/trace');
    } else if (family === '6') {
        ip = await fetchIP('https://[2606:4700:4700::1111]/cdn-cgi/trace');
    } else {
        throw new Error('Invalid family specified. Use "4" for IPv4 or "6" for IPv6.');
    }
    return ip;
}