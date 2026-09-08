# Defensive Security Operations

## From Reactive to Proactive

Most organizations start with reactive security — responding to alerts and incidents. Mature security operations also include proactive work: hunting for threats that haven't triggered alerts yet, continuously improving defenses, and managing vulnerabilities before they're exploited.

---

## The Security Operations Center (SOC)

A **SOC** is the team and facility responsible for monitoring, detecting, investigating, and responding to security events.

### SOC Tiers

| Tier | Role |
|------|------|
| **Tier 1 — Triage** | Monitor alerts, perform initial investigation, escalate |
| **Tier 2 — Investigation** | Deep-dive analysis, confirm/refute alerts, contain |
| **Tier 3 — Threat Hunting** | Proactively search for threats; no alert required |
| **Engineering** | Build and maintain detection rules, SIEM, tooling |

---

## Threat Hunting

**Threat hunting** is the proactive search for adversaries hiding in your environment — bypassing alerts that haven't been written yet.

Hunters start with a **hypothesis** based on threat intelligence:
> "We suspect attackers are using PowerShell to download malicious payloads. Let me look at all PowerShell execution events for suspicious patterns."

The hunting process:
1. Develop hypothesis (from threat intel, known TTPs)
2. Define data sources to query
3. Hunt — search logs, endpoints, network data
4. Analyze results — separate normal from abnormal
5. Document findings and create new detection rules

---

## Vulnerability Management

Vulnerabilities appear constantly — every patch Tuesday, every CVE published. Vulnerability management is the continuous process of:

1. **Discovery** — Scan your assets to find what's running
2. **Assessment** — Identify vulnerabilities in discovered assets
3. **Prioritization** — Score using CVSS + business context (EPSS for exploitability)
4. **Remediation** — Patch, mitigate, or accept (with documented risk)
5. **Verification** — Confirm the fix worked

### Patch Priority Framework
```
Critical CVE + Actively Exploited  →  Patch within 24-48 hours
Critical CVE, Not Yet Exploited    →  Patch within 7 days
High CVE                           →  Patch within 30 days
Medium/Low CVE                     →  Schedule in normal patching cycle
```

---

## Metrics That Matter

A mature security operation tracks:

| Metric | Why It Matters |
|--------|---------------|
| **Mean Time to Detect (MTTD)** | How long before you spot an incident? |
| **Mean Time to Respond (MTTR)** | How long to contain after detection? |
| **Alert-to-incident ratio** | High false positive rate = analyst fatigue |
| **Patch coverage %** | What % of critical vulns are remediated on time? |
| **Dwell time** | How long do attackers stay undetected? |

These metrics drive improvement and justify security investment to leadership.
