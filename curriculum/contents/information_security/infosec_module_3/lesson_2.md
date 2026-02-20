# Identity & Access Management

## Identity Is the New Perimeter

In cloud and remote-work environments, there is no physical perimeter. Your identity infrastructure is your security boundary. Get it wrong and every other control is undermined.

---

## AAA Framework

| Component | Question | Example |
|-----------|----------|---------|
| **Authentication** | Who are you? | Username + password, biometric, certificate |
| **Authorization** | What can you do? | Role-based permissions |
| **Accounting** | What did you do? | Audit logs, session records |

---

## Authentication Factors

Authentication factors are categorized into:

- **Something you know** — Password, PIN
- **Something you have** — Hardware token, authenticator app, smart card
- **Something you are** — Fingerprint, face recognition
- **Somewhere you are** — Location-based (less common alone)

**Multi-Factor Authentication (MFA)** combines two or more factors. A password + authenticator app (TOTP) blocks ~99% of automated credential attacks even when the password is stolen.

---

## Access Control Models

### Role-Based Access Control (RBAC)
Permissions are assigned to roles, and users are assigned roles.

```
User → Role → Permissions
Alice → HR_Manager → [read:payroll, edit:employees]
```

### Attribute-Based Access Control (ABAC)
Permissions are granted based on attributes: user department, time of day, device compliance status.

### Principle of Least Privilege (PoLP)
Every user and system should have only the minimum access necessary to perform their function.

> A developer should not have admin access to the production database just because it's convenient.

---

## Privileged Access Management (PAM)

Admin and privileged accounts are prime targets. PAM solutions:
- Vault credentials — admins request access rather than holding it
- Record privileged sessions for audit
- Enforce just-in-time access — elevate privileges only when needed, for limited time

---

## Common IAM Failures

| Failure | Risk |
|---------|------|
| Shared accounts | No accountability, can't audit who did what |
| No MFA on admin accounts | Single credential compromise = full system access |
| Over-provisioned accounts | Broad blast radius when account is compromised |
| Stale accounts | Ex-employee accounts as persistent backdoors |
