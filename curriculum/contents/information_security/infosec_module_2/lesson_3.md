# Risk Mitigation & Treatment

## What Do You Do With Risk?

Once you've assessed your risks, you have four options for how to handle each one. These are called **risk treatment strategies**.

---

## The Four Treatment Options

### 1. Accept
You acknowledge the risk exists and decide to live with it. This is appropriate when:
- The cost of mitigation exceeds the potential loss
- The likelihood is extremely low

> "We accept the risk of a meteorite striking our data center — no cost-effective control exists."

### 2. Avoid
You eliminate the activity that creates the risk entirely.
- Stop collecting data you don't need (removes breach risk)
- Shut down an unused service (removes attack surface)

### 3. Transfer
You shift the financial impact of the risk to another party.
- **Cyber insurance** transfers financial loss
- **Outsourcing** can transfer operational risk (but not accountability)

### 4. Reduce (Mitigate)
You apply controls to lower the likelihood or impact.
- Patching reduces likelihood of exploitation
- Backups reduce impact of ransomware
- MFA reduces likelihood of credential compromise

---

## Choosing Controls

Controls can be:
- **Preventive** — Stop the threat (firewall, MFA)
- **Detective** — Identify when it happens (IDS, logging)
- **Corrective** — Recover after it happens (backup restoration, incident response)
- **Administrative** — Policies and procedures (security training, access reviews)

---

## Residual Risk

After applying controls, some risk remains. This is **residual risk**.

```
Residual Risk = Original Risk − Risk Reduced by Controls
```

No system is perfectly secure. The goal is to reduce residual risk to within your organization's **risk appetite** — the level of risk it is willing to accept.

---

## Risk Appetite vs Risk Tolerance

| Term | Meaning |
|------|---------|
| **Risk appetite** | Broad amount of risk an organization is willing to pursue |
| **Risk tolerance** | Acceptable variation around risk appetite for a specific area |

A bank has very low risk appetite for data breaches. A startup may have higher tolerance for operational risks in exchange for speed.
