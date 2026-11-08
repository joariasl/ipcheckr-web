'use strict';

const iceServers = [
    {
        urls: [
            'stun:stun.cloudflare.com:3478',
        ]
    },
];

const rtcConfig: RTCConfiguration = {
    iceServers: iceServers,
};

export class StunClient {
    private addrCallback: (addrpair: { addr?: string; }) => void;
    private completionCallback: () => void;
    private pc: RTCPeerConnection | null = null;
    private dc: RTCDataChannel | null = null;

    constructor(addrCallback: (addrpair: { addr?: string; raddr?: string; }) => void, completionCallback: () => void) {
        this.addrCallback = addrCallback;
        this.completionCallback = completionCallback;
    }

    private setupListeners(pc: RTCPeerConnection): void {
        pc.addEventListener('icegatheringstatechange', () => {
            console.log('ICE gathering state changed:', pc.iceGatheringState);
            if (pc.iceGatheringState === 'complete') {
                console.log('ICE gathering state is complete');
            }
        });

        pc.addEventListener('iceconnectionstatechange', () => {
            console.log('ICE connection state changed:', pc.iceConnectionState);
        });

        // pc.addEventListener('icecandidateerror', (e) => {
        //     // Útil para logging; no abortamos de inmediato.
        //     // console.warn('ICE/STUN error', e);
        // });
    }

    async start() {
        const timeoutMillis = 10000;
        this.cleanup();
        this.pc = new RTCPeerConnection(rtcConfig);
        this.setupListeners(this.pc);

        return new Promise<void>((resolve, reject) => {
            let completed = false;
            const clearTimeoutAndCleanup = () => {
                clearTimeout(timeout);
                this.cleanup();
            };
            const timeout = setTimeout(() => {
                if (completed) {
                    return;
                }
                completed = true;
                this.cleanup();
                if (this.completionCallback) {
                    this.completionCallback();
                }
                reject(new Error('STUN client timed out'));
            }, timeoutMillis);

            try {
                this.dc = this.pc.createDataChannel('');
            } catch (error) {
                clearTimeoutAndCleanup();
                reject(error);
                return;
            }

            this.pc.addEventListener('icecandidate', (e: RTCPeerConnectionIceEvent) => {
                // If e.candidate is null, it means ICE gathering is complete.
                // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/icecandidate_event#description
                // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/icecandidate_event#indicating_that_ice_gathering_is_complete
                if (!e.candidate) {
                    if (completed) {
                        return;
                    }
                    completed = true;
                    console.log('ICE gathering completed');
                    if (this.completionCallback) {
                        this.completionCallback();
                    }
                    clearTimeoutAndCleanup();
                    resolve();
                    return;
                }

                let addrpair = {
                    addr: "",// Mapped address
                    port: "",// Mapped port
                    raddr: "",// Local address
                    rport: "", // Local port
                };
                // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnectionIceEvent/candidate
                const candidate = e.candidate;
                console.log('Candidate:', candidate);
                // https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate
                // https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate/address
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
                    // Fallback for browsers that don't provide candidate.address directly
                    // https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate/candidate
                    // https://developer.mozilla.org/en-US/docs/Glossary/SDP
                    // https://datatracker.ietf.org/doc/html/rfc5245#section-15.1
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

            (async () => {
                if (this.pc) {
                    try {
                        const offer = await this.pc.createOffer();
                        await this.pc.setLocalDescription(offer);
                    } catch (error) {
                        clearTimeoutAndCleanup();
                        reject(error);
                    }
                }
            })();
        });
    }

    cleanup() {
        if (this.pc) {
            this.pc.close();
        }
        if (this.dc) {
            this.dc.close();
            this.dc = null;
        }
    }
}