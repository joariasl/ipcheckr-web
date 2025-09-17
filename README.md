# ipcheckr

An Open Source public IPv4 and IPv6 Web + JavaScript viewer designed to be simple and fast.

Key features:

- Implements Session Traversal Utilities for NAT (STUN) [RFC 5389](https://www.rfc-editor.org/rfc/rfc5389) (2008) standard based client through UDP to be fast
- IPv4 and IPv6 compatible
- Through CDN to warranty network speed
- Small and simple when you only need reveal your public IPs

## Why this project?

To create a public IP checker compatible with IPv6 and IPv4, built on the philosophy that IPv6 comes first.

Fast. Free. Trusted. No tracking cookies[^1]. No ads.

And because it’s open source, anyone can see exactly how it works.

[^1]: May set cookies of categories `Strictly Necessary, Functional, Performance, and Targeting`.

## How this works

Unlike typical IP-checking websites, this project is a lightweight HTML + JavaScript client app.

It relies on a combination of Session Traversal Utilities for NAT (STUN) [RFC 5389](https://www.rfc-editor.org/rfc/rfc5389) and CDN HTTP(S) to resolve your public IP directly in the browser — without heavy backends or tracking.

This approach makes it:

- Fast: minimal latency, results are resolved on the client side, using the nearest CDN edge location.
- Private: no need to send extra data to third-party servers.
- Reliable: works seamlessly for both IPv4 and IPv6.
