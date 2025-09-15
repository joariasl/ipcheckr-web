'use strict';

const iceServers = [
    {
        urls: [
            'stun:stun.cloudflare.com:3478',
        ]
    },
];

export class StunClient {
    addrCallback: (addrpair: { addr?: string; }) => void;
    completionCallback: () => void;
    pc: RTCPeerConnection | null;
    dc: RTCDataChannel | null;

    constructor(addrCallback: (addrpair: { addr?: string; raddr?: string; }) => void, completionCallback: () => void) {
        this.addrCallback = addrCallback;
        this.completionCallback = completionCallback;
        this.pc = null;
        this.dc = null;
    }

    async start() {
        return new Promise<void>((resolve) => {
            this.pc = new RTCPeerConnection({
                iceServers: iceServers,
            });

            this.dc = this.pc.createDataChannel('');

            this.pc.addEventListener('icecandidate', (e) => {
                if (!e.candidate) {
                    console.log('ICE gathering completed');
                    if (this.completionCallback) {
                        this.completionCallback();
                    }
                    resolve();
                    this.cleanup();
                    return;
                }

                let addrpair = {
                    addr: "",// Mapped address
                    port: "",// Mapped port
                    raddr: "",// Local address
                    rport: "", // Local port
                };
                const candidate = e.candidate;
                console.log('Candidate:', candidate);
                if (candidate.address) {
                    if (candidate.type === "srflx") {
                        addrpair.addr = candidate.address;
                        addrpair.port = String(candidate.port);
                        if (candidate.relatedAddress) {
                            addrpair.raddr = candidate.relatedAddress;
                            addrpair.rport = String(candidate.relatedPort);
                        }
                    }
                } else {
                    // Fallback for browsers that don't support candidate.address
                    const c = e.candidate.candidate;

                    // https://tools.ietf.org/id/draft-ietf-mmusic-ice-sip-sdp-14.html#rfc.section.5.1
                    // index 0 is "a=candidate:number"
                    // index 1 is component id
                    // index 2 is transport ("udp" or "tcp")
                    // index 3 is priority
                    // index 4 is the address we want
                    // index 5 is the port
                    // index 6 is always "typ"
                    // index 7 is the address type (host vs srflx). srflx is what the STUN server reported
                    // index 8 might be "raddr"
                    // index 9 will be the related address is index 8 was "raddr"
                    // everything else is extensions
                    let parts = c.split(" ");
                    if ((parts[7] === "srflx") && parts[4]) {
                        addrpair.addr = parts[4];
                        addrpair.port = parts[5];
                        if ((parts[8] == "raddr") && parts[9]) {
                            addrpair.raddr = parts[9];
                            addrpair.rport = parts[11];
                        }
                    }
                }

                // if webrtc address privacy is on, then the related address
                // will be "0.0.0.0" or "::". So let's just hide that
                if ((addrpair.raddr == "0.0.0.0") || (addrpair.raddr == "::")) {
                    addrpair.raddr = "";
                    addrpair.rport = "";
                }

                if (addrpair.addr) {
                    console.log("Found IP:", addrpair.addr, addrpair.port, "(", addrpair.raddr, addrpair.rport, ")");
                    if (this.addrCallback) {
                        this.addrCallback(addrpair);
                    }
                }
            });

            this.pc.addEventListener('icegatheringstatechange', () => {
                if (this.pc && this.pc.iceGatheringState === 'complete') {
                    console.log('ICE gathering state is complete');
                }
            });

            // this.pc.addEventListener('icecandidateerror', (e) => {
            //     // Útil para logging; no abortamos de inmediato.
            //     // console.warn('ICE/STUN error', e);
            // });

            (async () => {
                if (this.pc) {
                    const offer = await this.pc.createOffer();
                    await this.pc.setLocalDescription(offer);
                }
            })();
        });
    }

    cleanup() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        if (this.dc) {
            this.dc.close();
            this.dc = null;
        }
    }
}