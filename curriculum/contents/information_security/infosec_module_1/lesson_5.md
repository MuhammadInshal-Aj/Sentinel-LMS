# 📘 Lesson 5 — Access Control & Least Privilege

> **Module:** Security Mindset & Core Principles  
> **Lesson Type:** Applied Security Architecture  
> **Difficulty:** Beginner → Intermediate

---

## 🎯 Lesson Objective

By the end of this lesson, you will be able to:

* Define access control and explain why it is foundational to security  
* Differentiate authentication, authorization, and accounting  
* Understand access control models (DAC, MAC, RBAC, ABAC)  
* Apply the Principle of Least Privilege in real environments  
* Recognize how poor access design leads to breaches  

---

# 🔐 1. What Is Access Control?

Access control is the mechanism that determines:

> **Who can access what resource, under which conditions, and with what level of permission.**

Without proper access control, all other security controls collapse.

Even if data is encrypted, if the wrong user has the key — security fails.

---

# 🧩 2. The AAA Model

Access control systems are built around three pillars:

## 🔹 Authentication — “Who are you?”
Verifying identity.

Examples:
- Password login
- Biometric scan
- Multi-Factor Authentication (MFA)
- Smart cards

Authentication proves identity — it does not grant permission.

---

## 🔹 Authorization — “What are you allowed to do?”
Determines permissions after identity is verified.

Examples:
- Read-only access
- Admin privileges
- Database write access

Authorization defines capability boundaries.

---

## 🔹 Accounting (Auditing) — “What did you do?”
Tracks activity for monitoring and investigation.

Examples:
- Login logs
- File modification logs
- Privilege escalation tracking

Accounting ensures traceability and non-repudiation.

---

# 🏗 3. Access Control Models

Organizations implement different control models depending on security requirements.

---

## 🔹 Discretionary Access Control (DAC)

The resource owner decides access permissions.

Example:
- A user shares a file with specific coworkers.

Advantages:
- Flexible
- Easy to manage in small environments

Weakness:
- Hard to enforce security policy at scale

---

## 🔹 Mandatory Access Control (MAC)

Access decisions are enforced by a central authority using classification labels.

Example:
- Military systems (Top Secret, Secret, Confidential)

Users cannot override permissions.

Strong security, low flexibility.

---

## 🔹 Role-Based Access Control (RBAC)

Access is assigned based on job roles.

Example:
- HR Role → Access to employee data
- IT Role → Server management
- Student Role → Course materials only

RBAC reduces complexity in large organizations.

---

## 🔹 Attribute-Based Access Control (ABAC)

Access decisions use multiple attributes:

- User attributes (department, clearance)
- Resource attributes (sensitivity level)
- Environment attributes (time, location)

Example:
> “Allow access only if user is Finance, accessing during business hours, from corporate IP.”

Highly dynamic and powerful.

---

# 🧠 4. Principle of Least Privilege (PoLP)

> Every user, system, and process should have only the minimum access necessary to perform its function.

Nothing more.

---

## Why It Matters

Most breaches escalate because attackers gain excessive permissions.

If a compromised account has admin rights, the damage multiplies.

If it only has limited rights, the blast radius is reduced.

---

## Real-World Breach Pattern

1. Phishing compromises employee account  
2. Account has unnecessary admin privileges  
3. Attacker moves laterally  
4. Data exfiltration occurs  

The root issue is often **excess privilege**, not lack of firewall.

---

# 🛡 5. Privileged Access Management (PAM)

High-level accounts require stricter control:

- Admin accounts
- Database root users
- Cloud super-admin roles

Best practices include:

- Separate admin and user accounts  
- Time-based privileged access  
- MFA enforced for all privileged roles  
- Session monitoring  

---

# 🌍 6. Access Control in Modern Environments

## 🔹 Cloud Environments

Identity becomes the new perimeter.

Access is managed via:

- IAM policies
- Security groups
- API permission scopes

Misconfigured cloud permissions are one of the most common breach causes.

---

## 🔹 Zero Trust Model

Zero Trust assumes:

> “Never trust, always verify.”

Even internal network users must authenticate and be authorized continuously.

Access is dynamic, not location-based.

---

# 🔎 7. Common Access Control Mistakes

- Shared accounts  
- No password rotation  
- Orphaned accounts (ex-employees still active)  
- Overly broad admin rights  
- No logging  

Each of these creates hidden attack paths.

---

# 🧪 8. Applied Thinking — Case Scenario

### Scenario:

A university LMS system contains:

- Student grades
- Financial records
- Course materials
- Admin dashboards

Design proper access:

| Role | Permissions |
|------|-------------|
| Student | View own grades, access enrolled courses |
| Instructor | Edit course materials, view assigned student grades |
| Admin | Manage users and system settings |

Now apply Least Privilege:

- Students cannot access other students' grades  
- Instructors cannot modify system-level settings  
- Admin actions are logged and monitored  

---

# 🧠 Reflection Questions

1. What would happen if every user had admin access?  
2. Which model fits a university best — RBAC or ABAC? Why?  
3. How does Least Privilege limit ransomware damage?  

---

# 🔚 Lesson Summary

Access control is the enforcement engine of security.

Authentication confirms identity.  
Authorization defines permissions.  
Accounting ensures accountability.

The Principle of Least Privilege reduces attack impact and prevents escalation.

Modern security treats identity as the primary control surface.

---

## 🪙 Completion Rewards

- 🪙 **+12 Security Tokens**  
- Unlocks **Lesson 6 — Risk Management & Threat Modeling**
