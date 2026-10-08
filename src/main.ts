import './style.css'
import './navbar.css'

import { getIPs } from './httpclient'
import { StunClient } from './stunclient'

function determineIPType(ip: string): "IPv4" | "IPv6" {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

    if (ipv4Regex.test(ip)) {
        return "IPv4";
    } else if (ipv6Regex.test(ip)) {
        return "IPv6";
    } else {
        throw new Error("Invalid IP address");
    }
}

class IPAddress {
    ip: string;
    type: "IPv4" | "IPv6";

    constructor(ip: string, type?: "IPv4" | "IPv6") {
        this.ip = ip;
        this.type = type ?? determineIPType(ip);
    }
}

class IPResolution {
    ip: IPAddress;
    resolvedAt: number;
    performanceTime?: number;
    protocol: string;

    constructor(ip: IPAddress, protocol: string) {
        this.ip = ip;
        this.resolvedAt = Date.now();
        this.performanceTime = performance.now();
        this.protocol = protocol;
    }
}

class IPResolutionRecords {
    public readonly records: IPResolution[] = [];

    add(ipResolution: IPResolution) {
        this.records.push(ipResolution);
    }
}

function writeIP(ipAddress: IPAddress) {
    const ipType = ipAddress.type;
    const ipElement = document.querySelector<HTMLDivElement>(ipType === "IPv6" ? '#ipv6' : '#ipv4')!;

    const ipEl = document.createElement("span");
    ipEl.className = "ip-address copyable";
    ipEl.textContent = ipAddress.ip;
    ipElement.querySelector<HTMLSpanElement>('.ip-address')!.replaceWith(ipEl);
}

function writeResolutionRecord(ipResolution: IPResolution) {
    const ipElement = document.querySelector<HTMLDivElement>(ipResolution.ip.type === "IPv6" ? '#ipv6' : '#ipv4')!;
    const ipResolutionRecordsTable = ipElement.querySelector<HTMLTableElement>('.ip-resolution-records tbody')!;
    
    const newRecordRow = document.createElement("tr");
    if (ipResolution.protocol !== undefined) {
        const protocolCell = document.createElement("td");
        protocolCell.textContent = ipResolution.protocol;
        newRecordRow.appendChild(protocolCell);
    }
    const ipCell = document.createElement("td");
    ipCell.textContent = ipResolution.ip.ip;
    newRecordRow.appendChild(ipCell);
    if (ipResolution.performanceTime !== undefined) {
        const performanceCell = document.createElement("td");
        performanceCell.textContent = Math.round(ipResolution.performanceTime) + " ms";
        newRecordRow.appendChild(performanceCell);
    }
    ipResolutionRecordsTable.appendChild(newRecordRow);
    ipElement.querySelector<HTMLSpanElement>('.status')?.remove();
}

function processIPResolution(ipResolution: IPResolution) {
    ipResolutions.add(ipResolution);
    writeIP(ipResolution.ip);
    writeResolutionRecord(ipResolution);
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
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
`

const ipv4El = document.querySelector<HTMLDivElement>('#ipv4')!;
const ipv6El = document.querySelector<HTMLDivElement>('#ipv6')!;
ipv4El.querySelector<HTMLSpanElement>('.status')!.textContent = "Resolving...";
ipv6El.querySelector<HTMLSpanElement>('.status')!.textContent = "Resolving...";

const userAgentEl = document.querySelector<HTMLDivElement>('#user-agent')!;
userAgentEl.insertAdjacentHTML("beforeend", `<span class="user-agent copyable">${navigator.userAgent}</span>`);

const ipResolutions = new IPResolutionRecords();

var fetcher = new StunClient(
    (addrpair: { addr?: string; raddr?: string; }) => {
        if (addrpair.addr) {
            console.log("STUN IP fetching completed", performance.now());
            var ip = new IPAddress(addrpair.addr);
            var ipResolution = new IPResolution(ip, "STUN");
            processIPResolution(ipResolution);
            // if (addrpair.raddr) {
            //     var relayIp = new IPAddress(addrpair.raddr);
            //     var relayIpResolution = new IPResolution(relayIp, "STUN");
            //     processIPResolution(relayIpResolution);
            // }
        } else {
            // ipStunEl.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Not found";
        }
    },
    () => {
        console.log("STUN fetching completed")
    }
);
fetcher.start().then(() => {
    console.log("STUN IP fetching completed");
}).catch((err) => {
    console.error("Error during IP fetching:", err);
});


// Fetch IPv4 and IPv6 using HTTP client
getIPs('4').then(result => {
    if (result && result.ip) {
        console.log("IPv4 fetching completed", performance.now())
        var ip = new IPAddress(result.ip);
        var ipResolution = new IPResolution(ip, "HTTP");
        processIPResolution(ipResolution);
    } else {
        ipv4El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Not found";
        ipv4El.querySelector<HTMLSpanElement>('.status')?.remove();
    }
}).catch(err => {
    console.error("Error fetching IPv4:", err);
    if(err instanceof TypeError) {
        ipv4El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Fetch failed (likely no IPv4 connectivity)";
        ipv4El.querySelector<HTMLSpanElement>('.status')?.remove();
    }
});

getIPs('6').then(result => {
    if (result && result.ip) {
        console.log("IPv6 fetching completed", performance.now());
        var ip = new IPAddress(result.ip);
        var ipResolution = new IPResolution(ip, "HTTP");
        processIPResolution(ipResolution);
    } else {
        ipv6El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Not found";
        ipv6El.querySelector<HTMLSpanElement>('.status')?.remove();
    }
}).catch(err => {
    console.error("Error fetching IPv6:", err);
    if(err instanceof TypeError) {
        ipv6El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Fetch failed (likely no IPv6 connectivity)";
        ipv6El.querySelector<HTMLSpanElement>('.status')?.remove();
    }
});
