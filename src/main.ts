import './style.css'
import './navbar.css'

import { getIPs } from './httpclient'
import { StunClient } from './stunclient'

function writePerformanceTime(element: HTMLSpanElement) {
    const performanceTimeEl = document.createElement("span");
    performanceTimeEl.className = "resolved-time";
    performanceTimeEl.textContent = "(Resolved in " + Math.round(performance.now()) + " ms)";
    element.insertAdjacentElement("afterend", performanceTimeEl);
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="card">
      <p id="ipstun" class="ip-card">Your STUN IP address is: <span class="ip-address"></span></p>
      <p id="ipv4" class="ip-card">Your IPv4 address is: <span class="ip-address"></span></p>
      <p id="ipv6" class="ip-card">Your IPv6 address is: <span class="ip-address"></span></p>
      <p id="user-agent" class="ip-card">User Agent: <span></span></p>
    </div>
  </div>
`

const ipStunEl = document.querySelector<HTMLParagraphElement>('#ipstun')!;
const ipv4El = document.querySelector<HTMLParagraphElement>('#ipv4')!;
const ipv6El = document.querySelector<HTMLParagraphElement>('#ipv6')!;

ipStunEl.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Fetching...";
ipv4El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Fetching...";
ipv6El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Fetching...";

const userAgentEl = document.querySelector<HTMLParagraphElement>('#user-agent')!;
userAgentEl.querySelector<HTMLSpanElement>('span')!.textContent = navigator.userAgent;

var fetcher = new StunClient(
    (addrpair: { addr?: string; raddr?: string; }) => {
        if (addrpair.addr) {
            console.log("STUN IP fetching completed", performance.now());
            ipStunEl.querySelector<HTMLSpanElement>('.ip-address')!.textContent = addrpair.addr + (addrpair.raddr?" (" + addrpair.raddr + ")":"");
            writePerformanceTime(ipStunEl.querySelector<HTMLSpanElement>('.ip-address')!);
        } else {
            ipStunEl.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Not found";
        }
    },
    () => {
        console.log("STUN fetching completed");
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
        console.log("IPv4 fetching completed", performance.now());
        ipv4El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = result.ip;
        writePerformanceTime(ipv4El.querySelector<HTMLSpanElement>('.ip-address')!);
    } else {
        ipv4El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Not found";
    }
}).catch(err => {
    console.error("Error fetching IPv4:", err);
    if(err instanceof TypeError) {
        ipv4El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Fetch failed (likely no IPv4 connectivity)";
    }
});

getIPs('6').then(result => {
    if (result && result.ip) {
        console.log("IPv6 fetching completed", performance.now());
        ipv6El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = result.ip;
        writePerformanceTime(ipv6El.querySelector<HTMLSpanElement>('.ip-address')!);
    } else {
        ipv6El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Not found";
    }
}).catch(err => {
    console.error("Error fetching IPv6:", err);
    if(err instanceof TypeError) {
        ipv6El.querySelector<HTMLSpanElement>('.ip-address')!.textContent = "Fetch failed (likely no IPv6 connectivity)";
    }
});
