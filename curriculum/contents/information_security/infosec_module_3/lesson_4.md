# Security Monitoring & Logging

## You Cannot Defend What You Cannot See

Detection is the ability to recognize that something bad is happening. Without logging and monitoring, attackers can operate in your environment for months undetected. The average dwell time (time from breach to detection) has historically been over 200 days.

---

## What to Log

Not everything is worth logging — storage and analysis costs are real. Prioritize:

| Source | Why It Matters |
|--------|---------------|
| **Authentication events** | Failed logins, MFA bypasses, impossible travel |
| **Privilege escalation** | `sudo`, UAC prompts, role changes |
| **Network connections** | Outbound to unknown IPs, lateral movement |
| **DNS queries** | C2 beaconing, data exfiltration via DNS |
| **File access** | Sensitive files read/modified/deleted |
| **Process execution** | Unusual processes, LOLBins (living-off-the-land binaries) |

---

## SIEM — Security Information & Event Management

A **SIEM** aggregates logs from across your environment, normalizes them into a common format, and runs detection rules to generate alerts.

```
[Endpoints] ──┐
[Servers]   ──┤──→ [SIEM] → [Alerts] → [SOC Analyst]
[Network]   ──┤
[Cloud]     ──┘
```

SIEM capabilities:
- **Correlation** — Link events across systems (e.g., failed login + unusual file access)
- **Alerting** — Notify analysts of suspicious patterns
- **Retention** — Store logs for compliance and forensics
- **Investigation** — Search and pivot across data during incident response

Popular SIEMs: Splunk, Microsoft Sentinel, Elastic SIEM, IBM QRadar.

---

## Common Detection Use Cases

### Brute Force Attack
```
Rule: > 10 failed logins for same account within 5 minutes
→ Alert: Possible credential stuffing / brute force
```

### Lateral Movement
```
Rule: Workstation authenticating to multiple other workstations via SMB
→ Alert: Possible lateral movement / worm activity
```

### Data Exfiltration
```
Rule: Single host transferring > 500MB to external IP outside business hours
→ Alert: Possible data exfiltration
```

---

## Log Retention

Many regulations require log retention for 1–7 years. Plan your retention policy based on:
- Compliance requirements (PCI DSS, HIPAA, SOX)
- Forensic investigation needs
- Storage costs (cold storage for older logs)

---

## The Detection Gap

Logging alone is not enough — someone must review alerts. Without an analyst reviewing SIEM output, alerts pile up and attackers go unnoticed. This is why organizations build Security Operations Centers.
