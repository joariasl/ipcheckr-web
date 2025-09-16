import './style.css'
import './navbar.css'

import { getIPs } from './httpclient'
import { StunClient } from './stunclient'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="card">
      <p class="ip-card">Your STUN IP address is: <span id="ipstun" class="ip-address"></span></p>
      <p class="ip-card">Your IPv4 address is: <span id="ipv4" class="ip-address"></span></p>
      <p class="ip-card">Your IPv6 address is: <span id="ipv6" class="ip-address"></span></p>
      <p class="ip-card">User Agent: <span id="user-agent"></span></p>
    </div>
  </div>
`

const ipStunEl = document.querySelector<HTMLSpanElement>('#ipstun')!;
const ipv4El = document.querySelector<HTMLSpanElement>('#ipv4')!;
const ipv6El = document.querySelector<HTMLSpanElement>('#ipv6')!;

var fetcher = new StunClient(
    (addrpair: { addr?: string; raddr?: string; }) => {
        if (addrpair.addr) {
            console.log("STUN IP fetching completed", performance.now());
            ipStunEl.textContent = addrpair.addr + (addrpair.raddr?" (" + addrpair.raddr + ")":"");
        } else {
            ipStunEl.textContent = "Not found";
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
        ipv4El.textContent = result.ip;
    } else {
        ipv4El.textContent = "Not found";
    }
}).catch(err => {
    console.error("Error fetching IPv4:", err);
    if(err instanceof TypeError) {
        ipv4El.textContent = "Fetch failed (likely no IPv4 connectivity)";
    }
});

getIPs('6').then(result => {
    if (result && result.ip) {
        console.log("IPv6 fetching completed", performance.now());
        ipv6El.textContent = result.ip;
    } else {
        ipv6El.textContent = "Not found";
    }
}).catch(err => {
    console.error("Error fetching IPv6:", err);
    if(err instanceof TypeError) {
        ipv6El.textContent = "Fetch failed (likely no IPv6 connectivity)";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    ipStunEl.textContent = "Fetching...";
    ipv4El.textContent = "Fetching...";
    ipv6El.textContent = "Fetching...";
    document.querySelector<HTMLSpanElement>('#user-agent')!.textContent = navigator.userAgent;
});