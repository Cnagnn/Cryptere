<?php

/**
 * Lesson content for Course 5: Network Security Essentials (advanced).
 * Returns an array keyed by lesson slug.
 */
return [
    'tls-handshake' => [
        'learning_objectives' => [
            'Describe the TLS 1.3 handshake process step by step',
            'Explain cipher suites and their components',
            'Understand ECDHE key exchange and forward secrecy',
            'Compare TLS 1.3 with TLS 1.2 improvements',
            'Explain 0-RTT resumption and its security trade-offs',
        ],
        'key_concepts' => [
            'TLS 1.3',
            'Handshake Protocol',
            'Cipher Suite',
            'ECDHE Key Exchange',
            'Forward Secrecy',
            '0-RTT Resumption',
            'Certificate Verification',
            'AEAD Encryption',
        ],
        'content' => <<<'MD'
# TLS Handshake Deep Dive

## Introduction

**Transport Layer Security (TLS)** is the cryptographic protocol that secures virtually all internet communication. Every time you see the padlock icon in your browser, TLS is protecting your connection. **TLS 1.3** (RFC 8446, published August 2018) represents a major overhaul of the protocol, reducing handshake latency, removing insecure legacy features, and simplifying the design.

Understanding the TLS handshake is essential for anyone working in network security, web development, or system administration. This lesson covers the TLS 1.3 handshake in detail, including key exchange, cipher suites, and the improvements over TLS 1.2.

## TLS 1.3 Handshake Overview

The TLS 1.3 handshake completes in just **1 round trip (1-RTT)**, compared to 2 round trips in TLS 1.2:

```
Client                                           Server

ClientHello
  + key_share
  + supported_versions
  + signature_algorithms        -------->
                                                 ServerHello
                                                   + key_share
                                                 EncryptedExtensions
                                                 Certificate
                                                 CertificateVerify
                                <--------        Finished
Finished                        -------->
[Application Data]              <------->        [Application Data]
```

**Total: 1 round trip before application data can flow.**

## Step-by-Step Handshake

### Step 1: ClientHello

The client initiates the connection by sending:

- **Supported TLS versions**: Indicates TLS 1.3 support
- **Cipher suites**: List of supported AEAD algorithms
- **Key shares**: Pre-computed ECDHE public keys (for one or more groups)
- **Signature algorithms**: Supported certificate signature types
- **Random**: 32 bytes of random data

```
ClientHello:
  Protocol Version: TLS 1.3
  Random: 0x7a8b9c...  (32 bytes)
  Cipher Suites:
    - TLS_AES_256_GCM_SHA384
    - TLS_AES_128_GCM_SHA256
    - TLS_CHACHA20_POLY1305_SHA256
  Key Share:
    - Group: x25519
    - Public Key: 0x3a4b5c...  (32 bytes)
  Supported Versions: TLS 1.3
  Signature Algorithms: ecdsa_secp256r1_sha256, rsa_pss_rsae_sha256
```

### Step 2: ServerHello

The server responds with its choices:

- **Selected cipher suite**: One from the client's list
- **Key share**: Server's ECDHE public key (same group as client)
- **Selected version**: TLS 1.3

At this point, both sides can compute the **shared secret** using ECDHE.

### Step 3: Server Encrypted Messages

After the ServerHello, all subsequent server messages are **encrypted** using keys derived from the shared secret:

- **EncryptedExtensions**: Additional server parameters
- **Certificate**: Server's X.509 certificate chain
- **CertificateVerify**: Digital signature proving the server owns the private key
- **Finished**: HMAC over the entire handshake transcript

### Step 4: Client Finished

The client verifies the server's certificate and signature, then sends its own Finished message. Application data can now flow in both directions.

:::check
question: How many round trips does the TLS 1.3 handshake require before application data can flow?
type: mcq
options: ["0 round trips", "1 round trip", "2 round trips", "3 round trips"]
answer: 1
hint: TLS 1.3 reduced the handshake from 2-RTT (in TLS 1.2) to a faster process.
:::

## Key Exchange: ECDHE

TLS 1.3 exclusively uses **Ephemeral Elliptic Curve Diffie-Hellman (ECDHE)** for key exchange:

```
Client                              Server
  Generate private key: a             Generate private key: b
  Compute public key: A = a*G        Compute public key: B = b*G
  Send A  ----------------------->
          <-----------------------   Send B
  Compute shared secret: S = a*B    Compute shared secret: S = b*A
  (a*B = a*b*G = b*a*G = b*A)      Both arrive at the same point!
```

### Forward Secrecy

Because ECDHE uses **ephemeral** (temporary) keys for each session, TLS 1.3 provides **perfect forward secrecy**:

- Even if the server's long-term private key is compromised later, past sessions cannot be decrypted
- Each session uses unique keys that are discarded after use
- An attacker who records encrypted traffic today cannot decrypt it in the future

This is a major improvement over TLS 1.2's RSA key exchange mode, which did NOT provide forward secrecy.

## Cipher Suites in TLS 1.3

TLS 1.3 dramatically simplified cipher suites. Only **five** are defined:

| Cipher Suite | Encryption | Hash |
|-------------|-----------|------|
| TLS_AES_128_GCM_SHA256 | AES-128-GCM | SHA-256 |
| TLS_AES_256_GCM_SHA384 | AES-256-GCM | SHA-384 |
| TLS_CHACHA20_POLY1305_SHA256 | ChaCha20-Poly1305 | SHA-256 |
| TLS_AES_128_CCM_SHA256 | AES-128-CCM | SHA-256 |
| TLS_AES_128_CCM_8_SHA256 | AES-128-CCM (8-byte tag) | SHA-256 |

All use **AEAD** (Authenticated Encryption with Associated Data) — providing both confidentiality and integrity in a single operation.

### Removed from TLS 1.3

The following insecure or problematic features were removed:
- RSA key exchange (no forward secrecy)
- Static DH key exchange
- CBC mode ciphers (vulnerable to padding oracle attacks)
- RC4, DES, 3DES
- MD5 and SHA-1 for signatures
- Compression (CRIME attack)
- Renegotiation

## 0-RTT Resumption

TLS 1.3 supports **0-RTT (zero round trip time)** resumption for returning clients:

```
Client                                           Server
ClientHello
  + early_data (encrypted with PSK)
  + key_share
  + pre_shared_key              -------->
                                                 ServerHello
                                <--------        Finished
Finished                        -------->
[Application Data]              <------->        [Application Data]
```

The client can send application data in the **very first message**, eliminating the round-trip latency entirely.

### 0-RTT Security Trade-offs

0-RTT data is vulnerable to **replay attacks**:
- An attacker can capture and resend the 0-RTT data
- The server may process the same request twice
- Only safe for **idempotent** operations (GET requests, not POST)

Mitigations:
- Servers should only accept 0-RTT for safe, idempotent requests
- Single-use session tickets
- Strike registers to detect replays

:::check
question: What does "forward secrecy" mean in the context of TLS?
type: mcq
options: ["Future messages are encrypted", "Compromising the server's long-term key cannot decrypt past sessions", "The connection is faster", "The certificate is valid for future dates"]
answer: 1
hint: ECDHE generates unique session keys, so even if the private key is later compromised, past traffic remains safe.
:::

## TLS 1.3 vs TLS 1.2 Comparison

| Feature | TLS 1.2 | TLS 1.3 |
|---------|---------|---------|
| Handshake round trips | 2-RTT | 1-RTT (0-RTT for resumption) |
| Key exchange | RSA, DHE, ECDHE | ECDHE only |
| Cipher suites | 300+ | 5 |
| Forward secrecy | Optional | Mandatory |
| Encryption starts | After 2nd round trip | After 1st round trip |
| Vulnerable modes | CBC, RC4 | None (AEAD only) |
| Certificate encryption | No (sent in clear) | Yes (encrypted) |
| 0-RTT resumption | No | Yes |

## Key Derivation in TLS 1.3

TLS 1.3 uses **HKDF** (HMAC-based Key Derivation Function, RFC 5869) to derive all keys from the shared secret:

```
ECDHE Shared Secret
        |
        v
  HKDF-Extract (with handshake hash)
        |
        v
  Handshake Secret
        |
        +---> HKDF-Expand --> client_handshake_traffic_secret
        |
        +---> HKDF-Expand --> server_handshake_traffic_secret
        |
        v
  HKDF-Extract
        |
        v
  Master Secret
        |
        +---> HKDF-Expand --> client_application_traffic_secret
        |
        +---> HKDF-Expand --> server_application_traffic_secret
```

## Practical: Inspecting TLS Handshakes

You can observe TLS handshakes using command-line tools:

```bash
# Using openssl to connect and show handshake details
openssl s_client -connect example.com:443 -tls1_3

# Using curl with verbose output
curl -v https://example.com 2>&1 | grep -i "tls\|ssl\|cipher"

# Using Wireshark filter for TLS handshakes
# Display filter: tls.handshake.type == 1 (ClientHello)
```

## Summary

- TLS 1.3 completes the handshake in **1 round trip** (vs 2 in TLS 1.2)
- **ECDHE** is the only key exchange method, providing mandatory forward secrecy
- Only **AEAD** cipher suites are allowed (AES-GCM, ChaCha20-Poly1305)
- The server certificate is now **encrypted** during the handshake
- **0-RTT resumption** allows data in the first message but has replay risks
- TLS 1.3 removed all known-insecure features from TLS 1.2
- HKDF is used for all key derivation from the shared secret

## References

- RFC 8446: *The Transport Layer Security (TLS) Protocol Version 1.3*
- RFC 5869: *HMAC-based Extract-and-Expand Key Derivation Function (HKDF)*
- RFC 8448: *Example Handshake Traces for TLS 1.3*
- Rescorla, E. (2018). *The Transport Layer Security (TLS) Protocol Version 1.3*.
MD,
    ],

    'certificate-authorities' => [
        'learning_objectives' => [
            'Explain the PKI hierarchy and the role of Certificate Authorities',
            'Describe the X.509 certificate structure and its fields',
            'Understand certificate chain validation from leaf to root',
            'Compare OCSP and CRL for certificate revocation checking',
            'Explain how Let\'s Encrypt has democratized TLS certificates',
        ],
        'key_concepts' => [
            'Certificate Authority (CA)',
            'PKI Hierarchy',
            'X.509 Certificate',
            'Certificate Chain',
            'Root CA',
            'Intermediate CA',
            'OCSP',
            'CRL',
            'Let\'s Encrypt',
            'ACME Protocol',
        ],
        'content' => <<<'MD'
# Certificate Authorities

## Introduction

**Certificate Authorities (CAs)** are the trust anchors of the internet's security infrastructure. They form the backbone of the **Public Key Infrastructure (PKI)** — the system that allows your browser to verify that a website is who it claims to be. Without CAs, there would be no way to distinguish a legitimate bank website from a phishing site, even with encryption.

This lesson explores how CAs work, the structure of X.509 certificates, chain validation, revocation mechanisms, and how Let's Encrypt has transformed the certificate landscape.

## The PKI Hierarchy

### The Trust Problem

When you connect to https://bank.com, how do you know the public key you receive actually belongs to the bank and not an attacker? This is the **key authentication problem**.

The solution is a **hierarchical trust model**:

```
Root CA (self-signed, pre-installed in OS/browser)
    |
    +-- signs --> Intermediate CA certificate
                      |
                      +-- signs --> End-entity certificate (bank.com)
```

### Root Certificate Authorities

**Root CAs** are the ultimate trust anchors:
- Their certificates are **self-signed** (they sign their own certificates)
- They are **pre-installed** in operating systems and browsers (the "trust store")
- There are approximately 100-150 trusted root CAs globally
- Examples: DigiCert, Let's Encrypt (ISRG Root), GlobalSign, Sectigo

### Intermediate Certificate Authorities

**Intermediate CAs** sit between root CAs and end-entity certificates:
- Their certificates are signed by a root CA (or another intermediate)
- They issue end-entity certificates to websites
- If compromised, only the intermediate needs to be revoked (not the root)
- This provides **defense in depth** — root CA private keys can be kept offline

### End-Entity Certificates

**End-entity certificates** (also called "leaf certificates") are issued to specific domains:
- Signed by an intermediate CA
- Contain the domain name, public key, validity period, and other metadata
- Used by web servers to prove their identity during TLS handshakes

## X.509 Certificate Structure

The **X.509** standard (ITU-T, RFC 5280) defines the format for digital certificates:

```
Certificate:
    Version: v3
    Serial Number: 0x0A:01:41:42:00:00:01:53:85:73:6A:0B:85:EC:A7:08
    Signature Algorithm: sha256WithRSAEncryption
    Issuer: C=US, O=Let's Encrypt, CN=R3
    Validity:
        Not Before: Jan 1 00:00:00 2024 GMT
        Not After:  Apr 1 00:00:00 2024 GMT
    Subject: CN=www.example.com
    Subject Public Key Info:
        Algorithm: id-ecPublicKey (P-256)
        Public Key: 04:3a:4b:5c...
    Extensions:
        Subject Alternative Name:
            DNS: www.example.com
            DNS: example.com
        Key Usage: Digital Signature
        Extended Key Usage: TLS Web Server Authentication
        Authority Key Identifier: 14:2E:B3:17:...
        Certificate Policies: 2.23.140.1.2.1 (DV)
        CRL Distribution Points: http://r3.o.lencr.org
        OCSP: http://r3.i.lencr.org
    Signature: 3a:4b:5c:6d:...
```

### Key Fields Explained

| Field | Purpose |
|-------|---------|
| **Serial Number** | Unique identifier for this certificate |
| **Issuer** | The CA that signed this certificate |
| **Validity** | Not Before / Not After dates |
| **Subject** | The entity this certificate identifies |
| **Public Key** | The subject's public key |
| **SAN** | Subject Alternative Names (all valid domains) |
| **Key Usage** | What the key can be used for |
| **Signature** | The CA's digital signature over all fields |

### Certificate Types

| Type | Validation Level | What's Verified | Visual Indicator |
|------|-----------------|-----------------|------------------|
| **DV** (Domain Validation) | Low | Domain ownership only | Padlock |
| **OV** (Organization Validation) | Medium | Domain + organization identity | Padlock |
| **EV** (Extended Validation) | High | Domain + legal entity + physical address | Padlock (formerly green bar) |

:::check
question: What entity signs a website's TLS certificate to establish trust?
type: mcq
options: ["The website owner", "The web browser", "A Certificate Authority (CA)", "The DNS server"]
answer: 2
hint: This trusted third party verifies the identity of the certificate holder.
:::

## Certificate Chain Validation

When a browser receives a certificate, it must validate the entire **chain of trust**:

```
1. Receive server certificate (leaf)
2. Check: Is the leaf certificate valid? (dates, domain match, not revoked)
3. Find the issuer's certificate (intermediate CA)
4. Check: Does the intermediate's signature on the leaf verify?
5. Find the intermediate's issuer (root CA or another intermediate)
6. Repeat until reaching a trusted root CA
7. Check: Is the root CA in the trust store?
```

### Validation Checks at Each Level

1. **Signature verification**: The parent's public key verifies the child's signature
2. **Validity period**: Current time is between Not Before and Not After
3. **Revocation status**: Certificate has not been revoked (OCSP/CRL)
4. **Name constraints**: The CA is authorized to issue for this domain
5. **Key usage**: The certificate is being used for its intended purpose
6. **Path length**: Basic constraints limit chain depth

```python
# Conceptual chain validation
def validate_chain(leaf_cert, trust_store):
    """Validate a certificate chain."""
    current = leaf_cert

    while True:
        # Check validity period
        if not current.is_within_validity_period():
            return False, "Certificate expired"

        # Check revocation
        if is_revoked(current):
            return False, "Certificate revoked"

        # Find issuer
        issuer = find_issuer(current)

        # Verify signature
        if not issuer.public_key.verify(current.signature):
            return False, "Invalid signature"

        # Check if issuer is a trusted root
        if issuer in trust_store:
            return True, "Chain valid"

        current = issuer
```

## Certificate Revocation

Certificates sometimes need to be revoked before their expiration date (e.g., if the private key is compromised). Two mechanisms exist:

### CRL (Certificate Revocation List)

A **CRL** is a signed list of revoked certificate serial numbers, published periodically by the CA:

```
CRL:
  Issuer: CN=R3, O=Let's Encrypt
  Last Update: 2024-01-15
  Next Update: 2024-01-22
  Revoked Certificates:
    Serial: 0x0A01...  Revocation Date: 2024-01-10
    Serial: 0x0B02...  Revocation Date: 2024-01-12
    ...
```

**Disadvantages:**
- CRLs can be very large (millions of entries)
- Clients must download the entire list
- Updates are periodic (not real-time)

### OCSP (Online Certificate Status Protocol)

**OCSP** allows real-time revocation checking by querying the CA:

```
Client --> OCSP Responder: "Is certificate 0x0A01... still valid?"
OCSP Responder --> Client: "Good" (signed response)
```

**Advantages over CRL:**
- Real-time status
- Small response size
- No need to download entire revocation list

**Disadvantages:**
- Privacy concern: CA knows which sites you visit
- Availability: If OCSP responder is down, what happens?

### OCSP Stapling

**OCSP stapling** solves the privacy and availability issues:
- The **server** periodically fetches its own OCSP response from the CA
- The server includes ("staples") this signed response in the TLS handshake
- The client verifies the stapled response without contacting the CA

This is the recommended approach and is supported by all modern web servers.

:::check
question: OCSP stapling allows the server to provide certificate revocation status directly to the client, reducing privacy concerns.
type: true_false
answer: 0
hint: With OCSP stapling, the server fetches the OCSP response and includes it in the TLS handshake.
:::

## Let's Encrypt and the ACME Protocol

### The Problem Before Let's Encrypt

Before 2015, TLS certificates were:
- Expensive ($50-$300+ per year)
- Manually issued (days of waiting)
- Complex to install
- Result: Only ~40% of web traffic was encrypted

### Let's Encrypt Revolution

**Let's Encrypt** (launched 2015, operated by ISRG) provides:
- **Free** DV certificates
- **Automated** issuance and renewal via the ACME protocol
- **90-day validity** (encourages automation)
- **Open**: All issued certificates are logged in Certificate Transparency

As of 2024, Let's Encrypt has issued over **3 billion certificates** and secures over 300 million websites.

### The ACME Protocol (RFC 8555)

**ACME** (Automatic Certificate Management Environment) automates certificate issuance:

```
1. Client generates key pair
2. Client requests certificate for domain.com
3. CA provides a challenge (prove domain ownership):
   - HTTP-01: Place a file at http://domain.com/.well-known/acme-challenge/TOKEN
   - DNS-01: Create a TXT record _acme-challenge.domain.com
4. Client completes the challenge
5. CA verifies the challenge
6. CA issues the signed certificate
7. Client installs the certificate
```

```bash
# Using certbot (Let's Encrypt client)
sudo certbot --nginx -d example.com -d www.example.com

# Auto-renewal (runs twice daily via systemd/cron)
sudo certbot renew
```

## Certificate Transparency (CT)

**Certificate Transparency** (RFC 6962) is a system of public, append-only logs that record all issued certificates:

- CAs must submit certificates to CT logs before issuance
- Anyone can monitor CT logs for unauthorized certificates
- Browsers require CT compliance for EV certificates
- Helps detect rogue or compromised CAs

You can search CT logs at: https://crt.sh/

## Summary

- **Certificate Authorities** form a hierarchical trust system (Root > Intermediate > Leaf)
- **X.509 certificates** contain the subject's public key, identity, validity period, and CA signature
- **Chain validation** verifies signatures from leaf to a trusted root CA
- **CRL** and **OCSP** provide certificate revocation checking; OCSP stapling is preferred
- **Let's Encrypt** democratized TLS with free, automated certificates via the ACME protocol
- **Certificate Transparency** provides public accountability for certificate issuance

## References

- RFC 5280: *Internet X.509 PKI Certificate and CRL Profile*
- RFC 6960: *Online Certificate Status Protocol (OCSP)*
- RFC 8555: *Automatic Certificate Management Environment (ACME)*
- RFC 6962: *Certificate Transparency*
- Let's Encrypt Documentation: https://letsencrypt.org/docs/
MD,
    ],

    'zero-knowledge-proofs' => [
        'learning_objectives' => [
            'Define zero-knowledge proofs and their three properties',
            'Distinguish between interactive and non-interactive ZKPs',
            'Explain the Schnorr identification protocol as a ZKP example',
            'Compare zk-SNARKs and zk-STARKs at a high level',
            'Identify real-world applications of zero-knowledge proofs',
        ],
        'key_concepts' => [
            'Zero-Knowledge Proof',
            'Completeness',
            'Soundness',
            'Zero-Knowledge Property',
            'Interactive Proof',
            'Non-Interactive Proof',
            'Schnorr Protocol',
            'zk-SNARKs',
            'zk-STARKs',
            'Fiat-Shamir Heuristic',
        ],
        'content' => <<<'MD'
# Zero-Knowledge Proofs

## Introduction

A **zero-knowledge proof (ZKP)** is a cryptographic protocol that allows one party (the **prover**) to convince another party (the **verifier**) that a statement is true, without revealing any information beyond the validity of the statement itself.

This seemingly paradoxical concept — proving you know something without revealing what you know — is one of the most powerful ideas in modern cryptography. ZKPs were introduced by **Shafi Goldwasser**, **Silvio Micali**, and **Charles Rackoff** in their groundbreaking 1985 paper "The Knowledge Complexity of Interactive Proof Systems."

## The Three Properties of Zero-Knowledge Proofs

A valid zero-knowledge proof must satisfy three properties:

### 1. Completeness

If the statement is true and both parties follow the protocol honestly, the verifier will be convinced.

**Formally:** If the prover knows the secret, they can always convince the verifier.

### 2. Soundness

If the statement is false, no cheating prover can convince the verifier (except with negligible probability).

**Formally:** A dishonest prover cannot fool the verifier into accepting a false statement.

### 3. Zero-Knowledge

If the statement is true, the verifier learns nothing beyond the fact that the statement is true. The verifier gains no additional information about the secret itself.

**Formally:** The verifier's "view" of the protocol can be simulated without access to the prover's secret.

## Intuitive Example: The Ali Baba Cave

The classic analogy for ZKPs is the **Ali Baba cave** (proposed by Quisquater et al., 1989):

```
        Entrance
           |
           |
     +-----+-----+
     |           |
     |           |
  Path A      Path B
     |           |
     |           |
     +-----+-----+
           |
      Magic Door
    (requires secret
     word to open)
```

**The protocol:**
1. Peggy (prover) enters the cave and takes either path A or B (Victor does not see which)
2. Victor (verifier) stands at the entrance and shouts "Come out path A!" or "Come out path B!"
3. If Peggy knows the secret word, she can always come out the requested path (opening the door if needed)
4. If Peggy does NOT know the secret, she can only comply 50% of the time

After 20 rounds, the probability of a cheating Peggy succeeding is (1/2)^20 = 0.000001 — essentially impossible.

**Key insight:** Victor is convinced Peggy knows the secret, but he learns nothing about what the secret word actually is.

:::check
question: Which of the following is NOT one of the three properties of zero-knowledge proofs?
type: mcq
options: ["Completeness", "Soundness", "Confidentiality", "Zero-knowledge"]
answer: 2
hint: The three properties are about proving truth, preventing lies, and revealing nothing extra.
:::

## Interactive Zero-Knowledge Proofs

### The Schnorr Identification Protocol

The **Schnorr protocol** is a classic interactive ZKP for proving knowledge of a discrete logarithm. It is used in many authentication systems.

**Setup:**
- Public parameters: prime p, generator g, public key y = g^x mod p
- Prover knows: secret key x
- Goal: Prove knowledge of x without revealing it

**Protocol:**

```
Prover                                    Verifier
  |                                         |
  | 1. Choose random r                      |
  |    Compute t = g^r mod p                |
  |    Send t (commitment)                  |
  | ---------------------------------------->
  |                                         |
  |                    2. Choose random c    |
  |                       (challenge)       |
  | <----------------------------------------
  |                                         |
  | 3. Compute s = r + c*x (mod q)         |
  |    Send s (response)                    |
  | ---------------------------------------->
  |                                         |
  |              4. Verify: g^s = t * y^c   |
  |                 (mod p)                 |
```

**Why it works:**
- **Completeness:** g^s = g^(r + cx) = g^r * g^(cx) = t * y^c (always passes)
- **Soundness:** Without knowing x, the prover cannot compute s = r + cx
- **Zero-knowledge:** The transcript (t, c, s) can be simulated without knowing x

```python
# Schnorr Protocol (simplified demonstration)
import random

# Setup (small numbers for illustration)
p = 23  # prime
g = 5   # generator
x = 7   # secret key (prover knows this)
y = pow(g, x, p)  # public key = 5^7 mod 23 = 17

# Step 1: Prover commits
r = random.randint(1, p - 2)  # random nonce
t = pow(g, r, p)  # commitment

# Step 2: Verifier challenges
c = random.randint(1, p - 2)  # random challenge

# Step 3: Prover responds
q = p - 1  # order of the group (simplified)
s = (r + c * x) % q  # response

# Step 4: Verifier checks
lhs = pow(g, s, p)
rhs = (t * pow(y, c, p)) % p
assert lhs == rhs, "Verification failed!"
print(f"Verification passed! (g^s = {lhs}, t*y^c = {rhs})")
```

## Non-Interactive Zero-Knowledge Proofs (NIZK)

Interactive proofs require back-and-forth communication. **Non-interactive** proofs allow the prover to generate a proof that anyone can verify without interaction.

### The Fiat-Shamir Heuristic

The **Fiat-Shamir heuristic** (1986) transforms an interactive proof into a non-interactive one by replacing the verifier's random challenge with a **hash of the commitment**:

```
Interactive:
  Prover sends t --> Verifier sends random c --> Prover sends s

Non-interactive (Fiat-Shamir):
  c = Hash(t || message)  (prover computes challenge themselves)
  Proof = (t, s)          (anyone can verify)
```

This is how **Schnorr signatures** work — they are non-interactive Schnorr proofs made possible by the Fiat-Shamir transform.

## zk-SNARKs

**zk-SNARKs** (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) are a powerful class of ZKPs with remarkable properties:

- **Zero-Knowledge**: Reveals nothing beyond the statement's validity
- **Succinct**: Proofs are very small (a few hundred bytes) regardless of computation size
- **Non-Interactive**: No back-and-forth communication needed
- **Arguments of Knowledge**: Prove knowledge of a witness (secret input)

### How zk-SNARKs Work (High Level)

1. **Computation as a circuit**: The statement to prove is expressed as an arithmetic circuit
2. **Circuit to constraints**: The circuit is converted to a system of polynomial constraints (R1CS)
3. **Polynomial commitment**: The prover commits to polynomials that satisfy the constraints
4. **Proof generation**: Using a trusted setup, the prover generates a compact proof
5. **Verification**: The verifier checks the proof in constant time

### Trusted Setup

zk-SNARKs require a **trusted setup ceremony** that generates public parameters:
- If the setup is compromised, fake proofs can be created
- Multi-party computation (MPC) ceremonies distribute trust
- The "toxic waste" (secret randomness) must be destroyed

### Applications of zk-SNARKs

- **Zcash**: Private cryptocurrency transactions (shielded transfers)
- **zkRollups**: Ethereum scaling solutions (zkSync, StarkNet, Polygon zkEVM)
- **Identity verification**: Prove you are over 18 without revealing your age
- **Compliance**: Prove a transaction is legal without revealing details

:::check
question: What does the 'S' in zk-SNARKs stand for?
type: fill_blank
answer: Succinct
hint: It refers to the fact that the proofs are very small and quick to verify.
:::

## zk-STARKs

**zk-STARKs** (Zero-Knowledge Scalable Transparent Arguments of Knowledge) are an alternative to zk-SNARKs:

| Feature | zk-SNARKs | zk-STARKs |
|---------|-----------|-----------|
| Trusted setup | Required | **Not required** (transparent) |
| Proof size | ~200 bytes | ~50-100 KB |
| Verification time | Constant | O(log^2 n) |
| Quantum resistance | No | **Yes** (hash-based) |
| Prover time | Faster | Slower |
| Maturity | More mature | Newer |

### Key Advantages of zk-STARKs

1. **No trusted setup**: Eliminates the risk of compromised parameters
2. **Quantum-resistant**: Based on hash functions, not elliptic curves
3. **Scalable**: Prover time scales quasi-linearly with computation size

### Applications of zk-STARKs

- **StarkNet**: Ethereum L2 scaling solution by StarkWare
- **Cairo**: Programming language for writing STARK-provable programs
- **dYdX**: Decentralized exchange using STARKs for trade verification

## Real-World Applications of ZKPs

### Privacy-Preserving Cryptocurrencies

**Zcash** uses zk-SNARKs to enable fully private transactions:
- Sender, receiver, and amount are all hidden
- The network can still verify that no coins are created from nothing
- Users choose between transparent and shielded transactions

### Identity and Authentication

- **Prove age** without revealing birthdate
- **Prove citizenship** without revealing passport number
- **Prove creditworthiness** without revealing income details
- **Prove membership** in a group without revealing which member you are

### Blockchain Scaling (zkRollups)

zkRollups batch hundreds of transactions off-chain and submit a single ZKP to the main chain:
- Ethereum processes ~15 transactions/second on L1
- zkRollups can process 2000+ transactions/second
- The ZKP proves all transactions were valid without re-executing them

### Voting Systems

ZKPs can enable verifiable elections where:
- Each voter can verify their vote was counted
- No one can determine how any individual voted
- The total count is provably correct

## Summary

- Zero-knowledge proofs allow proving a statement without revealing the underlying secret
- Three properties: **completeness** (honest prover convinces), **soundness** (cheater cannot fool), **zero-knowledge** (nothing leaked)
- The **Schnorr protocol** is a classic interactive ZKP for discrete logarithm knowledge
- The **Fiat-Shamir heuristic** converts interactive proofs to non-interactive ones
- **zk-SNARKs** provide succinct proofs but require a trusted setup
- **zk-STARKs** are transparent (no trusted setup) and quantum-resistant but have larger proofs
- Applications include private cryptocurrencies, identity verification, blockchain scaling, and voting

## References

- Goldwasser, S., Micali, S., & Rackoff, C. (1985). *The Knowledge Complexity of Interactive Proof Systems*.
- Schnorr, C. P. (1991). *Efficient Signature Generation by Smart Cards*. Journal of Cryptology.
- Ben-Sasson, E. et al. (2014). *Succinct Non-Interactive Zero Knowledge for a von Neumann Architecture* (zk-SNARKs).
- Ben-Sasson, E. et al. (2018). *Scalable, Transparent, and Post-Quantum Secure Computational Integrity* (zk-STARKs).
- Zcash Protocol Specification: https://zips.z.cash/protocol/protocol.pdf
MD,
    ],
];
