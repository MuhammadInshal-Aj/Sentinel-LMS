# Incident Response Planning

## When Controls Fail

No matter how strong your defenses, incidents happen. Incident response (IR) is the structured approach to handling security events — minimizing damage, recovering quickly, and learning to improve.

> "It's not a matter of if you will be breached, but when."

---

## The Six Phases of Incident Response

### 1. Preparation
Build your IR capability before an incident occurs:
- Establish a Computer Security Incident Response Team (CSIRT)
- Write playbooks for common scenarios
- Set up tools: SIEM, forensics toolkit, communication channels
- Train staff and run tabletop exercises

### 2. Identification
Detect and confirm that an incident has occurred:
- Investigate alerts (not every alert is a real incident)
- Classify severity: P1 (critical) to P4 (low)
- Declare an incident formally when confirmed

### 3. Containment
Stop the spread without destroying evidence:
- **Short-term:** Isolate affected systems (network block, disable account)
- **Long-term:** Remove attacker foothold while maintaining forensic integrity
- Communicate status to stakeholders

### 4. Eradication
Remove the threat from your environment:
- Delete malware, close backdoors
- Patch the exploited vulnerability
- Reset compromised credentials

### 5. Recovery
Restore systems to normal operation:
- Restore from clean backups
- Monitor closely for signs of re-compromise
- Validate systems before returning to production

### 6. Lessons Learned
Improve from the experience:
- Conduct a post-incident review (within 2 weeks)
- Document timeline, root cause, what worked, what didn't
- Update playbooks, controls, and training

---

## Incident Response Playbooks

A **playbook** is a pre-written procedure for a specific incident type. Common playbooks:
- Phishing / Business Email Compromise
- Ransomware
- Data breach / unauthorized data access
- Insider threat
- DDoS

Playbooks reduce decision fatigue during high-pressure incidents.

---

## Communication During Incidents

| Audience | What They Need |
|----------|---------------|
| **Executive team** | Business impact, timeline, decisions needed |
| **Legal / compliance** | Breach notification obligations |
| **IT team** | Technical containment and recovery steps |
| **End users** | What to do (or not do) right now |
| **Regulators / customers** | Notifications per legal requirements |
