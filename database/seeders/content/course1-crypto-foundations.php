<?php

/**
 * Lesson content for Course 1: Crypto Foundations (beginner).
 * Returns an array keyed by lesson slug.
 */
return [
    'why-cryptography-matters' => [
        'learning_objectives' => [
            'Explain why cryptography is essential in the digital age',
            'Identify the three pillars of the CIA triad',
            'Describe at least three real-world applications of cryptography',
            'Understand the financial and social impact of data breaches',
            'Recognize the role of cryptography in everyday digital interactions',
        ],
        'key_concepts' => [
            'CIA Triad',
            'Encryption',
            'Data Breach',
            'HTTPS/TLS',
            'End-to-End Encryption',
            'Plaintext vs Ciphertext',
            'Authentication',
        ],
        'content' => <<<'MD'
# Why Cryptography Matters

## Introduction

Cryptography is the science and art of securing communication and data from unauthorized access. The word itself comes from the Greek words *kryptós* (hidden) and *graphein* (to write). While cryptography has existed for thousands of years — from ancient Egyptian hieroglyphs to Roman military ciphers — its importance has never been greater than in today's digital world.

Every time you send a message on WhatsApp, make an online purchase, or log into your bank account, cryptography is working behind the scenes to protect your data. Without it, the modern internet as we know it simply could not exist.

## The Digital Age Challenge

We live in an era where data is the new currency. Consider these staggering statistics:

- **4.9 billion** internet users worldwide generate approximately **2.5 quintillion bytes** of data every day
- The average person has **100+ online accounts** requiring authentication
- Global e-commerce transactions exceed **$5.7 trillion** annually
- Over **300 billion emails** are sent daily

All of this data travels across networks that are inherently insecure. The internet was originally designed for open communication between trusted academic institutions — not for secure financial transactions or private messaging. This fundamental design gap is what cryptography fills.

### The Threat Landscape

Without cryptography, anyone with access to the network between you and your destination could:

1. **Read your messages** — emails, chats, and documents would be transmitted as plain text
2. **Steal your credentials** — passwords and session tokens would be visible to eavesdroppers
3. **Modify data in transit** — an attacker could alter a bank transfer amount or change medical records
4. **Impersonate others** — there would be no way to verify that a website or person is who they claim to be

## Real-World Applications of Cryptography

### HTTPS and Web Security

When you see the padlock icon in your browser's address bar, you are using **HTTPS** (HTTP Secure), which relies on the **TLS** (Transport Layer Security) protocol. TLS uses a combination of:

- **Asymmetric encryption** for the initial key exchange (typically ECDHE)
- **Symmetric encryption** for bulk data transfer (typically AES-256-GCM)
- **Digital certificates** to verify the identity of the server

Without HTTPS, every website you visit would transmit your data — including passwords, credit card numbers, and personal information — in plain text that anyone on the same network could read.

```
# What an attacker sees WITHOUT encryption
GET /login HTTP/1.1
Host: mybank.com
username=alice&password=MyS3cretP@ss!

# What an attacker sees WITH TLS encryption
\x17\x03\x03\x00\x1f\x8b\x08\x00\x00\x00...
(unintelligible encrypted bytes)
```

### End-to-End Encryption (E2EE)

Applications like **Signal**, **WhatsApp**, and **iMessage** use end-to-end encryption, meaning that only the sender and recipient can read the messages. Not even the service provider can decrypt them.

The Signal Protocol, used by both Signal and WhatsApp, employs:
- **X3DH** (Extended Triple Diffie-Hellman) for initial key agreement
- **Double Ratchet Algorithm** for ongoing message encryption with forward secrecy
- **AES-256** and **HMAC-SHA256** for message encryption and authentication

### Password Storage

When you create an account on a well-designed website, your password is never stored in plain text. Instead, it goes through a **cryptographic hash function** combined with a unique **salt**:

```python
import bcrypt

# Hashing a password (what the server stores)
password = b"MyS3cretP@ss!"
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password, salt)
# Result: $2b$12$LJ3m4ys3Gql0tOYaHxPAHeG0...

# Verifying a password (during login)
bcrypt.checkpw(password, hashed)  # Returns True
```

### Digital Signatures and Software Integrity

Every time you update your operating system or install software, **digital signatures** verify that the code has not been tampered with. Package managers like `apt`, `npm`, and `pip` all use cryptographic signatures to ensure software integrity.

### Cryptocurrency and Blockchain

Bitcoin, Ethereum, and other cryptocurrencies are built entirely on cryptographic primitives:
- **SHA-256** hash functions for proof-of-work mining
- **ECDSA** (Elliptic Curve Digital Signature Algorithm) for transaction signing
- **Merkle trees** for efficient transaction verification

## The Cost of Getting It Wrong

When cryptography fails or is improperly implemented, the consequences can be devastating:

| Incident | Year | Impact |
|----------|------|--------|
| Equifax Data Breach | 2017 | 147 million records exposed, $700M settlement |
| Yahoo Data Breach | 2013-2014 | 3 billion accounts compromised |
| SolarWinds Attack | 2020 | 18,000+ organizations compromised |
| Heartbleed (OpenSSL) | 2014 | Millions of servers vulnerable |
| Colonial Pipeline | 2021 | $4.4M ransom, fuel supply disruption |

According to IBM's 2023 Cost of a Data Breach Report, the **average cost of a data breach is $4.45 million**, with healthcare breaches averaging **$10.93 million**.

## Key Cryptographic Concepts

### Plaintext and Ciphertext

- **Plaintext**: The original, readable data (also called cleartext)
- **Ciphertext**: The encrypted, unreadable output
- **Encryption**: The process of converting plaintext to ciphertext
- **Decryption**: The reverse process of converting ciphertext back to plaintext

### The CIA Triad

The foundation of information security rests on three pillars:

1. **Confidentiality** — Ensuring only authorized parties can access the data
   - Achieved through: encryption, access controls, data classification
   - Example: Only you and your doctor can read your medical records

2. **Integrity** — Ensuring data has not been altered or tampered with
   - Achieved through: hash functions, digital signatures, checksums
   - Example: Verifying that a downloaded file matches its published hash

3. **Availability** — Ensuring data and systems are accessible when needed
   - Achieved through: redundancy, DDoS protection, backup systems
   - Example: Your bank's website remains accessible during peak hours

### Symmetric vs Asymmetric Encryption (Preview)

- **Symmetric encryption**: Uses the same key for encryption and decryption (e.g., AES). Fast and efficient but requires secure key sharing.
- **Asymmetric encryption**: Uses a pair of keys — public and private (e.g., RSA, ECC). Solves the key distribution problem but is slower.

## Historical Context

Cryptography has a rich history spanning millennia:

- **~1900 BCE**: Ancient Egyptian scribes used non-standard hieroglyphs
- **~100 BCE**: Julius Caesar used substitution ciphers
- **9th century**: Al-Kindi described frequency analysis
- **1553**: Bellaso invented the Vigenere cipher
- **1918**: Arthur Scherbius patented the Enigma machine
- **1976**: Diffie and Hellman published "New Directions in Cryptography"
- **1977**: RSA algorithm published by Rivest, Shamir, and Adleman
- **2001**: AES selected as the new encryption standard by NIST
- **2018**: TLS 1.3 published as RFC 8446

## Why You Should Care

Cryptography is not just for security professionals. Understanding the basics helps you:

- **Make informed decisions** about which apps and services to trust
- **Recognize phishing and fraud** attempts that exploit cryptographic weaknesses
- **Protect your personal data** by choosing strong passwords and enabling 2FA
- **Understand news** about data breaches, government surveillance, and privacy debates
- **Build secure applications** if you are a developer

As Bruce Schneier, a renowned cryptographer, famously said: *"Cryptography is the essential building block of independence for organizations on the Internet."*

## Summary

- Cryptography protects data in transit and at rest, enabling secure digital communication
- The **CIA triad** (Confidentiality, Integrity, Availability) forms the foundation of information security
- Real-world applications include HTTPS, end-to-end encryption, password hashing, digital signatures, and blockchain
- Data breaches cost organizations millions of dollars and affect billions of users
- Understanding cryptography is essential for everyone in the digital age

## References

- NIST SP 800-175B: *Guideline for Using Cryptographic Standards*
- IBM Security: *Cost of a Data Breach Report 2023*
- RFC 8446: *The Transport Layer Security (TLS) Protocol Version 1.3*
- Schneier, B. (2015). *Applied Cryptography*. Wiley.
MD,
    ],

    'confidentiality-vs-integrity' => [
        'learning_objectives' => [
            'Differentiate between confidentiality and integrity in information security',
            'Explain each pillar of the CIA triad with real-world examples',
            'Identify appropriate cryptographic tools for each security goal',
            'Understand how availability completes the security triad',
            'Analyze scenarios to determine which CIA property is at risk',
        ],
        'key_concepts' => [
            'Confidentiality',
            'Integrity',
            'Availability',
            'CIA Triad',
            'Hash Functions',
            'Access Control',
            'Non-repudiation',
            'Authenticated Encryption',
        ],
        'content' => <<<'MD'
# Confidentiality vs Integrity

## Introduction

In the previous lesson, we introduced the CIA triad as the foundation of information security. Now we will dive deep into each pillar, with particular focus on understanding the critical difference between **confidentiality** and **integrity** — two concepts that beginners often confuse.

While both are essential for security, they protect against fundamentally different threats. Confidentiality prevents unauthorized *reading* of data, while integrity prevents unauthorized *modification* of data.

## The CIA Triad in Depth

### Confidentiality

**Confidentiality** ensures that information is accessible only to those authorized to view it. It protects against unauthorized disclosure of data.

#### How Confidentiality Is Achieved

1. **Encryption** — The primary tool for confidentiality
   - **Symmetric encryption** (AES-256): Fast, used for bulk data
   - **Asymmetric encryption** (RSA, ECC): Used for key exchange and small data
   - **Hybrid encryption**: Combines both (used in TLS, PGP)

2. **Access Controls**
   - Role-Based Access Control (RBAC)
   - Mandatory Access Control (MAC)
   - Discretionary Access Control (DAC)

3. **Data Classification**
   - Public, Internal, Confidential, Restricted
   - Government: Unclassified, Confidential, Secret, Top Secret

#### Real-World Confidentiality Examples

- **Medical records (HIPAA)**: Only authorized healthcare providers can access patient data. A hospital encrypts its database so that even if the storage media is stolen, the records remain unreadable.
- **Military communications**: Classified information is encrypted with government-approved algorithms. Access requires appropriate security clearance.
- **Banking transactions**: When you check your bank balance online, TLS encryption ensures that no one on the network can see your account details.

```python
# Confidentiality example: Encrypting a message with AES
from cryptography.fernet import Fernet

key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt (only key holder can read)
plaintext = b"Patient diagnosis: Type 2 Diabetes"
ciphertext = cipher.encrypt(plaintext)
print(f"Encrypted: {ciphertext[:50]}...")

# Decrypt (only with the correct key)
decrypted = cipher.decrypt(ciphertext)
print(f"Decrypted: {decrypted}")
```

#### Confidentiality Threats

| Threat | Description | Mitigation |
|--------|-------------|------------|
| Eavesdropping | Intercepting network traffic | TLS/SSL encryption |
| Data theft | Stealing storage devices | Full-disk encryption |
| Social engineering | Tricking users into revealing data | Security awareness training |
| Insider threats | Authorized users misusing access | Least privilege, monitoring |

### Integrity

**Integrity** ensures that data has not been altered, corrupted, or tampered with — either in transit or at rest. It guarantees that what you receive is exactly what was sent.

#### How Integrity Is Achieved

1. **Cryptographic Hash Functions** — SHA-256, SHA-3, BLAKE2
2. **Message Authentication Codes (MACs)** — HMAC-SHA256 combines a secret key with a hash
3. **Digital Signatures** — RSA signatures, ECDSA, EdDSA
4. **Checksums and CRCs** — Simpler but not cryptographically secure

#### Real-World Integrity Examples

- **Software downloads**: When you download Linux, you verify the SHA-256 hash to ensure the file was not corrupted or tampered with.

```bash
# Integrity verification: checking a file hash
$ sha256sum ubuntu-24.04-desktop-amd64.iso
a1b2c3d4e5f6...  ubuntu-24.04-desktop-amd64.iso
# Compare with the published hash on the official website
```

- **Banking transactions**: Integrity mechanisms ensure that no one can change a $100 transfer to $10,000 in transit.
- **Blockchain**: Every block contains the hash of the previous block, creating an immutable chain.
- **Git version control**: Every commit is identified by a SHA-1 hash, ensuring history cannot be silently altered.

```python
# Integrity example: Using HMAC to verify message integrity
import hmac
import hashlib

secret_key = b"shared-secret-key"
message = b"Transfer $100 to account 12345"

# Create HMAC (sender side)
mac = hmac.new(secret_key, message, hashlib.sha256).hexdigest()

# Verify HMAC (receiver side)
received_message = b"Transfer $100 to account 12345"
expected_mac = hmac.new(secret_key, received_message, hashlib.sha256).hexdigest()

if hmac.compare_digest(mac, expected_mac):
    print("Integrity verified: message not tampered with")
else:
    print("Integrity violation: message was modified!")
```

### Availability

**Availability** ensures that systems and data are accessible to authorized users when needed.

- **Redundancy**: Multiple servers, data centers, and network paths
- **DDoS protection**: Rate limiting, traffic filtering, CDNs
- **Backup and recovery**: Regular backups with tested restoration procedures
- **Fault tolerance**: Systems designed to continue operating despite failures

## Confidentiality vs Integrity: Key Differences

| Aspect | Confidentiality | Integrity |
|--------|----------------|-----------|
| **Goal** | Prevent unauthorized reading | Prevent unauthorized modification |
| **Primary tools** | Encryption (AES, RSA) | Hash functions, MACs, signatures |
| **Threat** | Eavesdropping, data theft | Tampering, corruption |
| **Question answered** | "Can anyone else read this?" | "Has this been changed?" |

### Important Distinction

**Encryption alone does NOT guarantee integrity.** Consider this scenario:

1. Alice encrypts a message and sends it to Bob
2. An attacker intercepts the ciphertext
3. The attacker flips some bits in the ciphertext (without knowing the plaintext)
4. Bob decrypts the modified ciphertext and gets garbled or altered plaintext

This is why modern encryption modes like **AES-GCM** (Galois/Counter Mode) provide **both** confidentiality AND integrity through **authenticated encryption**. Older modes like AES-CBC provide only confidentiality.

```
# Authenticated Encryption (AES-GCM) provides BOTH:
# - Confidentiality (encryption)
# - Integrity (authentication tag)

# Unauthenticated Encryption (AES-CBC) provides ONLY:
# - Confidentiality — vulnerable to bit-flipping attacks
```

## Beyond the CIA Triad

Modern security also considers:

- **Non-repudiation**: The sender cannot deny having sent a message (digital signatures)
- **Authentication**: Verifying the identity of a user or system
- **Authorization**: Determining what an authenticated user is allowed to do
- **Accountability**: Maintaining audit trails of who did what and when

## Practical Scenario Analysis

**Scenario 1**: A hacker intercepts your email but cannot read it because it is encrypted.
- **Confidentiality** is maintained.

**Scenario 2**: A hacker modifies a financial transaction amount during transmission.
- **Integrity** is violated.

**Scenario 3**: A DDoS attack takes down an online banking website.
- **Availability** is violated.

**Scenario 4**: A hacker both reads AND modifies your medical records.
- Both **confidentiality** AND **integrity** are violated.

## Summary

- **Confidentiality** protects data from unauthorized reading — primarily achieved through encryption
- **Integrity** protects data from unauthorized modification — achieved through hash functions, MACs, and digital signatures
- **Availability** ensures systems remain accessible — achieved through redundancy and resilience
- Encryption alone does NOT guarantee integrity; use authenticated encryption (AES-GCM) for both
- Always analyze which CIA properties are at risk when evaluating a security scenario

## References

- NIST SP 800-12 Rev. 1: *An Introduction to Information Security*
- NIST SP 800-175B: *Guideline for Using Cryptographic Standards*
- ISO/IEC 27001: *Information Security Management Systems*
- Stallings, W. (2022). *Cryptography and Network Security*. Pearson.
MD,
    ],

    'threat-modeling-basics' => [
        'learning_objectives' => [
            'Define threat modeling and explain its purpose in security design',
            'Apply the STRIDE framework to categorize security threats',
            'Create a basic threat model for a simple application',
            'Identify common threat categories and their mitigations',
            'Understand the relationship between threats, vulnerabilities, and risks',
        ],
        'key_concepts' => [
            'STRIDE Framework',
            'Threat Modeling',
            'Attack Surface',
            'Trust Boundary',
            'Risk Assessment',
            'Spoofing',
            'Tampering',
            'Information Disclosure',
            'Denial of Service',
            'Elevation of Privilege',
        ],
        'content' => <<<'MD'
# Threat Modeling Basics

## Introduction

Threat modeling is a structured approach to identifying, quantifying, and addressing security threats to a system. Rather than waiting for attacks to happen and reacting, threat modeling is a **proactive** process that helps you think like an attacker *before* writing a single line of code.

As Adam Shostack puts it: "Threat modeling is the process of using models to find security problems." It answers four fundamental questions:

1. **What are we building?** — Understanding the system architecture
2. **What can go wrong?** — Identifying potential threats
3. **What are we going to do about it?** — Defining mitigations
4. **Did we do a good job?** — Validating the analysis

## Why Threat Modeling Matters

Consider building a house. You would not start construction without blueprints, and you would not skip the structural engineering analysis. Similarly, building software without threat modeling means you are hoping security issues will not arise — a strategy that consistently fails.

**Benefits of threat modeling:**
- Identifies security issues early when they are cheapest to fix
- Provides a systematic approach rather than ad-hoc security reviews
- Creates documentation that helps new team members understand security decisions
- Prioritizes security investments based on actual risk

## The STRIDE Framework

**STRIDE** is a threat classification model developed by Microsoft in 1999. It categorizes threats into six types, each violating a specific security property:

| STRIDE Category | Security Property Violated | Description |
|----------------|---------------------------|-------------|
| **S**poofing | Authentication | Pretending to be someone else |
| **T**ampering | Integrity | Modifying data without authorization |
| **R**epudiation | Non-repudiation | Denying having performed an action |
| **I**nformation Disclosure | Confidentiality | Exposing data to unauthorized parties |
| **D**enial of Service | Availability | Making a system unavailable |
| **E**levation of Privilege | Authorization | Gaining unauthorized access |

### Spoofing

Spoofing occurs when an attacker pretends to be another user, system, or component.

**Examples:**
- IP spoofing: Forging the source IP address in network packets
- Email spoofing: Sending emails with a forged "From" address
- DNS spoofing: Redirecting domain name lookups to malicious servers

**Mitigations:** Strong authentication (MFA), digital certificates, SPF/DKIM/DMARC for email

### Tampering

Tampering involves unauthorized modification of data, whether in transit or at rest.

**Examples:**
- Man-in-the-middle attacks: Modifying data as it passes through the network
- SQL injection: Altering database queries to modify or extract data
- Parameter manipulation: Changing hidden form fields or URL parameters

**Mitigations:** Cryptographic hash functions, digital signatures, TLS, input validation

### Repudiation

Repudiation threats occur when a user can deny performing an action with no way to prove otherwise.

**Examples:**
- A user claims they never placed an online order
- An administrator denies deleting critical files

**Mitigations:** Digital signatures, comprehensive audit logging, timestamps

### Information Disclosure

Information disclosure occurs when data is exposed to unauthorized parties.

**Examples:**
- Data breaches: Unauthorized access to databases
- Verbose error messages revealing system internals
- Side-channel attacks extracting information from timing or power consumption

**Mitigations:** Encryption at rest and in transit, access controls, minimal error messages

### Denial of Service (DoS)

DoS attacks aim to make a system unavailable to legitimate users.

**Examples:**
- DDoS attacks: Overwhelming a server with traffic
- Resource exhaustion: Consuming all available memory or CPU
- Ransomware: Encrypting data and demanding payment

**Mitigations:** Rate limiting, CDN/DDoS protection, auto-scaling, regular backups

### Elevation of Privilege

Elevation of privilege occurs when an attacker gains higher access levels than authorized.

**Examples:**
- Buffer overflow exploits executing arbitrary code with system privileges
- Broken access control accessing admin endpoints without authorization

**Mitigations:** Principle of least privilege, input validation, security patching, sandboxing

## Building a Threat Model: Step by Step

Let us walk through creating a threat model for a simple **web-based password manager**.

### Step 1: Diagram the System

```
+----------+     HTTPS      +--------------+     TLS      +----------+
|  Browser | <------------> |  Web Server  | <----------> | Database |
|  (User)  |                |  (API/Auth)  |              | (Vault)  |
+----------+                +--------------+              +----------+
                                   |
                                   | HTTPS
                                   v
                            +--------------+
                            | Third-Party  |
                            | Auth (OAuth) |
                            +--------------+
```

### Step 2: Identify Trust Boundaries

Trust boundaries are points where data crosses between different trust levels:

1. **Browser to Web Server**: Data crosses the internet (untrusted network)
2. **Web Server to Database**: Data crosses from application tier to data tier
3. **Web Server to OAuth Provider**: Data crosses to an external service

### Step 3: Apply STRIDE to Each Component

| Component | Threat | STRIDE | Risk | Mitigation |
|-----------|--------|--------|------|------------|
| Browser | Session hijacking | Spoofing | High | Secure cookies, HTTPS-only |
| Browser | XSS attack | Tampering | High | CSP headers, input sanitization |
| Web Server | Brute force login | Spoofing | Medium | Rate limiting, account lockout |
| Web Server | SQL injection | Tampering | Critical | Parameterized queries, ORM |
| Database | Data breach | Info Disclosure | Critical | Encryption at rest (AES-256) |
| Database | Ransomware | DoS | High | Regular backups, access controls |
| API | Privilege escalation | EoP | High | RBAC, input validation |

### Step 4: Prioritize and Mitigate

Use a risk matrix to prioritize threats. Focus on **Critical** and **High** risks first.

```
Impact
  High   | Medium |  High  | Critical
  Medium |  Low   | Medium |  High
  Low    |  Low   |  Low   |  Medium
         +--------+--------+---------
           Low     Medium    High
                Likelihood
```

## Other Threat Modeling Frameworks

### DREAD (Risk Rating)
Rates threats on five dimensions: **D**amage potential, **R**eproducibility, **E**xploitability, **A**ffected users, **D**iscoverability. Each scored 1-10.

### PASTA (Process for Attack Simulation and Threat Analysis)
A seven-stage, risk-centric methodology covering objectives, technical scope, decomposition, threat analysis, vulnerability analysis, attack modeling, and risk/impact analysis.

### Attack Trees
A hierarchical model where the root node is the attacker's goal, and child nodes represent different ways to achieve it:

```
              [Steal User Passwords]
              /          |          \
    [Phishing]    [SQL Injection]   [Brute Force]
    /       \          |              |
[Email]  [SMS]   [Union-based]   [Dictionary]
```

## Common Mistakes in Threat Modeling

1. **Only modeling external threats** — Insider threats are often more dangerous
2. **Ignoring the supply chain** — Third-party libraries introduce risk
3. **One-time exercise** — Threat models should be updated as the system evolves
4. **Too abstract** — Models should be specific enough to drive actionable mitigations
5. **Ignoring physical security** — Server room access, USB ports, social engineering

## Summary

- Threat modeling is a **proactive** approach to identifying security issues before exploitation
- The **STRIDE** framework categorizes threats into six types: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege
- Each STRIDE category maps to a specific security property
- Building a threat model involves: diagramming the system, identifying trust boundaries, applying STRIDE, and prioritizing mitigations
- Other frameworks include DREAD, PASTA, and Attack Trees
- Threat modeling should be an ongoing process, not a one-time exercise

## References

- Shostack, A. (2014). *Threat Modeling: Designing for Security*. Wiley.
- Microsoft SDL Threat Modeling Tool
- OWASP Threat Modeling: https://owasp.org/www-community/Threat_Modeling
- NIST SP 800-154: *Guide to Data-Centric System Threat Modeling*
MD,
    ],
];
