# Network Security Architecture

## The Perimeter Is Dead — Long Live Defense in Depth

Traditional security assumed a hard perimeter: trust everything inside, block everything outside. Modern networks — with cloud, remote work, and mobile devices — shattered that model. Today, we design for the assumption that attackers are already inside.

---

## Core Concepts

### Network Segmentation

Segmentation divides a network into isolated zones so that a compromise in one zone cannot easily spread to others.

```
[Internet] → [Firewall] → [DMZ] → [Internal Firewall] → [Internal LAN]
                                         ↓
                                   [Servers / DB Zone]
```

**DMZ (Demilitarized Zone):** A buffer network between the public internet and internal systems. Public-facing services (web servers, mail) live here. A breach in the DMZ should not give access to internal systems.

### Zero Trust Architecture

> "Never trust, always verify."

Zero Trust assumes no user, device, or network location is inherently trusted — even inside the corporate network. Every access request must be authenticated, authorized, and continuously validated.

Key Zero Trust principles:
1. Verify explicitly — authenticate and authorize every request
2. Least privilege access — grant only what is needed
3. Assume breach — design as if compromise has already occurred

---

## Firewall Types

| Type | What It Inspects |
|------|-----------------|
| **Packet filter** | Source/destination IP and port |
| **Stateful** | Connection state (tracks sessions) |
| **Application (Layer 7)** | Application protocols and content |
| **Next-Gen (NGFW)** | Deep inspection, IPS, user identity |

---

## Least Privilege in Network Design

Apply least privilege to network access:
- Servers should only talk to services they need
- Workstations should not communicate directly with each other
- Admin interfaces must be restricted to management networks

This limits **lateral movement** — an attacker's ability to spread from one compromised system to others.
