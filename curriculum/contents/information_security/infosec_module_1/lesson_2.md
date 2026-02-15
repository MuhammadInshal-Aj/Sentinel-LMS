# 📘 Lesson 2 — The CIA Triad

> **Module:** Security Mindset & Core Principles  
> **Lesson Type:** Foundational Theory  
> **Difficulty:** Beginner

---

## 🎯 Lesson Objective

By the end of this lesson, you will:

- Define Confidentiality, Integrity, and Availability
- Recognize real-world failures of each
- Understand why balancing them is critical

---

# 🧠 Why the CIA Triad Matters

Security needs structure.

Without a framework, security becomes vague.

The CIA Triad defines the three fundamental properties that must be preserved.

It answers:

> What are we protecting, exactly?

---

# 🔐 1. Confidentiality

Confidentiality ensures that information is accessible only to authorized individuals.

---

## Real-World Example — Social Media Data Leak

A social media company stores:

- User messages
- Personal details
- Photos

Due to a misconfigured cloud database, data becomes publicly accessible.

No hacking required.

Confidentiality failed because access control failed.

---

## Additional Example

An employee sends confidential financial documents to the wrong email address.

No malware. No breach.

But confidentiality is still compromised.

---

## Core Question

Who is allowed to see this information?

---

# 🧾 2. Integrity

Integrity ensures that data remains accurate, complete, and unaltered.

---

## Real-World Example — Financial Manipulation

An attacker alters transaction amounts in a banking system.

Even if no data is stolen:

- Trust is broken
- Financial damage occurs
- Legal consequences follow

Integrity failure can be more damaging than confidentiality failure.

---

## Additional Example

A software update introduces a silent bug that corrupts stored data.

No attacker involved.

Integrity still fails.

---

## Core Question

Can this information be trusted?

---

# 🌐 3. Availability

Availability ensures that systems and data are accessible when needed.

---

## Real-World Example — DDoS Attack

An online retailer experiences a Distributed Denial-of-Service attack.

Customers cannot access the website.

Revenue drops dramatically.

No data stolen.  
No data altered.

But availability failure alone causes severe damage.

---

## Additional Example — Ransomware

Systems become encrypted.

Even if backups exist, downtime impacts operations.

Availability loss can end businesses.

---

## ⚖️ The Trade-Off Problem

Increasing one pillar often affects another.

Examples:

- Encrypt everything (Confidentiality) → may reduce performance (Availability)
- Strict validation (Integrity) → may slow workflows
- High availability (redundancy) → increases attack surface

Security is balancing these pillars based on context.

---

# 🏥 Context Example — Hospital System

In a hospital:

- Availability may be life-critical
- Integrity of medical records must be precise
- Confidentiality protects patient privacy

Which is most important?

The answer depends on the situation.

Security decisions are contextual, not absolute.

---

# 🧠 Mental Upgrade

Whenever evaluating a system, ask:

- What threatens confidentiality?
- What threatens integrity?
- What threatens availability?

Every security control exists to protect at least one of these.

---

## 🪙 Completion Rewards

- 🪙 +10 Security Tokens
- Unlocks Lesson 3

---

## 🔚 Lesson Summary

The CIA Triad defines:

- Who can access information  
- Whether information can be trusted  
- Whether information is accessible  

Every future security concept will map back to these three pillars.
