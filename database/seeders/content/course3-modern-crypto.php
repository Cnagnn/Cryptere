<?php

/**
 * Lesson content for Course 3: Modern Crypto Principles (intermediate).
 * Returns an array keyed by lesson slug.
 */
return [
    'hash-functions-and-digest-properties' => [
        'learning_objectives' => [
            'Define cryptographic hash functions and their essential properties',
            'Distinguish between preimage resistance, second-preimage resistance, and collision resistance',
            'Explain the avalanche effect and its importance',
            'Compare SHA-2 family members and their output sizes',
            'Identify real-world applications of hash functions',
        ],
        'key_concepts' => [
            'Cryptographic Hash Function',
            'Preimage Resistance',
            'Collision Resistance',
            'Avalanche Effect',
            'SHA-256',
            'SHA-2 Family',
            'Message Digest',
            'Password Hashing',
        ],
        'content' => <<<'MD'
# Hash Functions and Digest Properties

## Introduction

A **cryptographic hash function** is a mathematical algorithm that takes an input of any size and produces a fixed-size output (called a **digest** or **hash**). Hash functions are one of the most fundamental building blocks in modern cryptography, used in everything from password storage to blockchain technology to digital signatures.

Unlike encryption, hashing is a **one-way** process — you cannot recover the original input from the hash output. This property makes hash functions uniquely suited for verification tasks where you need to confirm data integrity without revealing the original data.

## Essential Properties of Cryptographic Hash Functions

A secure cryptographic hash function must satisfy three key properties:

### 1. Preimage Resistance (One-Way Property)

Given a hash output h, it should be computationally infeasible to find any input m such that H(m) = h.

**In plain terms:** You cannot reverse a hash to find the original input.

```python
import hashlib

# Easy: compute hash from input
message = b"Hello, World!"
hash_output = hashlib.sha256(message).hexdigest()
print(f"Hash: {hash_output}")
# a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e

# Impossible: find input from hash output
# Given the hash above, you cannot determine "Hello, World!"
```

### 2. Second-Preimage Resistance

Given an input m1, it should be computationally infeasible to find a different input m2 such that H(m1) = H(m2).

**In plain terms:** Given a specific file, you cannot create a different file with the same hash.

### 3. Collision Resistance

It should be computationally infeasible to find any two different inputs m1 and m2 such that H(m1) = H(m2).

**In plain terms:** You cannot find ANY two different inputs that produce the same hash.

Note: Collisions must exist mathematically (since the input space is infinite but the output space is finite), but finding them should be practically impossible.

**Relationship between properties:**
- Collision resistance implies second-preimage resistance
- Second-preimage resistance implies preimage resistance
- The reverse is not necessarily true

## The Avalanche Effect

A good hash function exhibits the **avalanche effect**: a tiny change in the input produces a dramatically different output. Ideally, changing a single bit in the input should flip approximately 50% of the output bits.

```python
import hashlib

msg1 = b"Hello, World!"
msg2 = b"Hello, World?"  # Changed only ! to ?

hash1 = hashlib.sha256(msg1).hexdigest()
hash2 = hashlib.sha256(msg2).hexdigest()

print(f"Input 1: Hello, World!")
print(f"Hash 1:  {hash1}")
print(f"\nInput 2: Hello, World?")
print(f"Hash 2:  {hash2}")

# The two hashes are completely different despite
# only a single character change in the input
```

## The SHA-2 Family

The **SHA-2** (Secure Hash Algorithm 2) family was designed by the NSA and published by NIST in 2001. It includes several variants:

| Algorithm | Output Size | Block Size | Rounds | Status |
|-----------|------------|------------|--------|--------|
| SHA-224 | 224 bits | 512 bits | 64 | Secure |
| SHA-256 | 256 bits | 512 bits | 64 | Secure (widely used) |
| SHA-384 | 384 bits | 1024 bits | 80 | Secure |
| SHA-512 | 512 bits | 1024 bits | 80 | Secure |

**SHA-256** is the most widely used variant, producing a 256-bit (32-byte) digest represented as a 64-character hexadecimal string.

### How SHA-256 Works (Simplified)

1. **Padding**: The message is padded to a multiple of 512 bits
2. **Parsing**: The padded message is divided into 512-bit blocks
3. **Initialization**: Eight 32-bit hash values are initialized (derived from square roots of first 8 primes)
4. **Compression**: Each block is processed through 64 rounds of mixing operations
5. **Output**: The final hash values are concatenated to produce the 256-bit digest

```python
import hashlib

# SHA-256 examples
texts = [b"", b"abc", b"Hello, World!"]

for text in texts:
    digest = hashlib.sha256(text).hexdigest()
    print(f"SHA-256('{text.decode()}') = {digest}")
```

## Deprecated Hash Functions

Not all hash functions remain secure. Several have been broken:

| Algorithm | Output | Status | Vulnerability |
|-----------|--------|--------|---------------|
| MD5 | 128 bits | **Broken** | Collision attacks (2004) |
| SHA-1 | 160 bits | **Broken** | Collision found by Google (2017) |
| SHA-256 | 256 bits | Secure | No known practical attacks |
| SHA-3 | Variable | Secure | Different design (Keccak) |

**Never use MD5 or SHA-1 for security purposes.** They are still acceptable for non-security checksums (e.g., verifying file downloads for corruption, not tampering).

## Real-World Applications

### Password Hashing

Passwords should never be stored in plain text. They are hashed with a **salt** (random data) using a specialized password hashing function:

```python
import bcrypt

password = b"MySecurePassword123"
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password, salt)

# Verification
if bcrypt.checkpw(password, hashed):
    print("Password correct!")
```

**Important:** Use dedicated password hashing functions (bcrypt, scrypt, Argon2) — NOT raw SHA-256. Password hashing functions are intentionally slow to resist brute-force attacks.

### Data Integrity Verification

```bash
# Generate hash of a file
$ sha256sum important-document.pdf
e3b0c44298fc1c149afbf4c8996fb924...  important-document.pdf

# Later, verify the file has not been modified
$ sha256sum -c checksums.txt
important-document.pdf: OK
```

### Digital Signatures

Digital signatures hash the message first, then sign the hash:
1. Compute hash: h = SHA-256(message)
2. Sign the hash: signature = Sign(private_key, h)
3. Verify: Verify(public_key, h, signature)

This is more efficient than signing the entire message directly.

### Blockchain and Proof of Work

Bitcoin uses SHA-256 extensively:
- Block header hashing for proof-of-work
- Transaction ID computation
- Merkle tree construction
- Address generation (combined with RIPEMD-160)

### HMAC (Hash-based Message Authentication Code)

HMAC combines a hash function with a secret key to provide both integrity and authentication:

```python
import hmac
import hashlib

key = b"secret-key"
message = b"Important data"

# Create HMAC
mac = hmac.new(key, message, hashlib.sha256).hexdigest()
print(f"HMAC: {mac}")

# Verify (constant-time comparison to prevent timing attacks)
expected = hmac.new(key, message, hashlib.sha256).hexdigest()
is_valid = hmac.compare_digest(mac, expected)
```

## Birthday Attack and Security Margins

The **birthday paradox** affects collision resistance. For a hash function with n-bit output:
- Preimage resistance: requires approximately 2^n operations to break
- Collision resistance: requires only approximately 2^(n/2) operations (birthday bound)

This is why SHA-256 provides:
- 256-bit preimage resistance (2^256 operations)
- 128-bit collision resistance (2^128 operations)

Both are considered computationally infeasible with current technology.

## SHA-3 and Beyond

**SHA-3** (Keccak) was selected by NIST in 2012 as an alternative to SHA-2. It uses a completely different internal structure (sponge construction) and provides a backup in case SHA-2 is ever broken.

| Feature | SHA-2 | SHA-3 |
|---------|-------|-------|
| Structure | Merkle-Damgard | Sponge |
| Design | NSA | Public competition |
| Performance | Fast on most hardware | Fast on hardware, slower in software |
| Status | Primary standard | Backup standard |

## Summary

- Cryptographic hash functions produce fixed-size outputs from arbitrary inputs
- Three essential properties: preimage resistance, second-preimage resistance, collision resistance
- The avalanche effect ensures small input changes produce dramatically different outputs
- SHA-256 is the most widely used secure hash function today
- MD5 and SHA-1 are broken and should not be used for security
- Applications include password hashing, data integrity, digital signatures, and blockchain
- Use specialized functions (bcrypt, Argon2) for password hashing, not raw SHA-256

## References

- NIST FIPS 180-4: *Secure Hash Standard (SHS)*
- NIST FIPS 202: *SHA-3 Standard*
- RFC 6234: *US Secure Hash Algorithms (SHA and SHA-based HMAC and HKDF)*
- Preneel, B. (2010). *The State of Cryptographic Hash Functions*. Springer.
MD,
    ],

    'symmetric-vs-asymmetric-encryption' => [
        'learning_objectives' => [
            'Compare symmetric and asymmetric encryption approaches',
            'Describe the four AES internal operations (SubBytes, ShiftRows, MixColumns, AddRoundKey)',
            'Explain RSA key generation, encryption, and decryption mathematically',
            'Determine when to use symmetric vs asymmetric encryption',
            'Understand hybrid encryption and why it is used in practice',
        ],
        'key_concepts' => [
            'AES (Advanced Encryption Standard)',
            'RSA Algorithm',
            'Symmetric Encryption',
            'Asymmetric Encryption',
            'Hybrid Encryption',
            'Key Exchange Problem',
            'Block Cipher Modes',
            'Public/Private Key Pair',
        ],
        'content' => <<<'MD'
# Symmetric vs Asymmetric Encryption

## Introduction

Modern cryptography relies on two fundamentally different approaches to encryption: **symmetric** (shared-key) and **asymmetric** (public-key) cryptography. Understanding when and how to use each is essential for building secure systems.

- **Symmetric encryption** uses the same key for both encryption and decryption
- **Asymmetric encryption** uses a pair of mathematically related keys: one public, one private

In practice, most systems use **hybrid encryption** — combining both approaches to get the best of both worlds.

## Symmetric Encryption: AES

### Overview

The **Advanced Encryption Standard (AES)**, also known as Rijndael, was selected by NIST in 2001 after a five-year public competition. It replaced the aging DES (Data Encryption Standard) and is now the most widely used symmetric cipher in the world.

**Key properties:**
- Block size: 128 bits (16 bytes)
- Key sizes: 128, 192, or 256 bits
- Structure: Substitution-Permutation Network (SPN)
- Rounds: 10 (AES-128), 12 (AES-192), or 14 (AES-256)

### AES Internal Operations

Each round of AES consists of four operations applied to a 4x4 byte matrix called the **state**:

#### 1. SubBytes (Substitution)

Each byte in the state is replaced using a fixed substitution table (S-box). This provides **confusion** — making the relationship between key and ciphertext complex.

```
Input byte:  0x53
S-box lookup: S[5][3] = 0xED
Output byte: 0xED
```

The S-box is designed to be resistant to linear and differential cryptanalysis.

#### 2. ShiftRows (Permutation)

Rows of the state matrix are cyclically shifted:
- Row 0: no shift
- Row 1: shift left by 1
- Row 2: shift left by 2
- Row 3: shift left by 3

```
Before:          After:
a0 a1 a2 a3     a0 a1 a2 a3
b0 b1 b2 b3     b1 b2 b3 b0
c0 c1 c2 c3     c2 c3 c0 c1
d0 d1 d2 d3     d3 d0 d1 d2
```

#### 3. MixColumns (Diffusion)

Each column is multiplied by a fixed matrix in GF(2^8). This provides **diffusion** — spreading the influence of each input byte across multiple output bytes.

#### 4. AddRoundKey (Key Mixing)

The state is XORed with a round key derived from the main key through a key schedule algorithm.

### AES in Practice

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
import os

# AES-256-GCM (authenticated encryption)
key = os.urandom(32)  # 256-bit key
nonce = os.urandom(12)  # 96-bit nonce for GCM

# Encrypt
cipher = Cipher(algorithms.AES(key), modes.GCM(nonce))
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"Secret message") + encryptor.finalize()
tag = encryptor.tag  # Authentication tag

# Decrypt
cipher = Cipher(algorithms.AES(key), modes.GCM(nonce, tag))
decryptor = cipher.decryptor()
plaintext = decryptor.update(ciphertext) + decryptor.finalize()
```

### Block Cipher Modes

AES operates on 128-bit blocks. To encrypt messages longer than one block, we need a **mode of operation**:

| Mode | Confidentiality | Integrity | Parallelizable | Recommended |
|------|----------------|-----------|----------------|-------------|
| ECB | Yes (weak) | No | Yes | **Never use** |
| CBC | Yes | No | Decrypt only | Legacy only |
| CTR | Yes | No | Yes | With HMAC |
| GCM | Yes | Yes | Yes | **Recommended** |

**AES-GCM** is the recommended mode for most applications because it provides both confidentiality and integrity (authenticated encryption).

## Asymmetric Encryption: RSA

### The Key Exchange Problem

Symmetric encryption has a fundamental challenge: how do you securely share the key with the other party? If you already have a secure channel, you do not need encryption. This is the **key exchange problem**.

Asymmetric encryption solves this by using two keys:
- **Public key**: Can be shared openly (used to encrypt)
- **Private key**: Must be kept secret (used to decrypt)

### RSA Algorithm

RSA (Rivest-Shamir-Adleman, 1977) is the most widely known asymmetric algorithm. Its security relies on the difficulty of **factoring large semiprime numbers**.

#### Key Generation

1. Choose two large prime numbers p and q (typically 1024+ bits each)
2. Compute n = p * q (the modulus)
3. Compute the totient: phi(n) = (p-1)(q-1)
4. Choose public exponent e such that 1 < e < phi(n) and gcd(e, phi(n)) = 1 (commonly e = 65537)
5. Compute private exponent d = e^(-1) mod phi(n)

**Public key:** (n, e)
**Private key:** (n, d)

#### Encryption and Decryption

```
Encryption: c = m^e mod n
Decryption: m = c^d mod n
```

Where m is the plaintext (as a number), c is the ciphertext, and all operations are modular.

#### Simplified Example (small numbers for illustration)

```python
# Key Generation (tiny example - NOT secure!)
p, q = 61, 53
n = p * q  # 3233
phi_n = (p - 1) * (q - 1)  # 3120
e = 17  # Public exponent (coprime to 3120)
d = 2753  # Private exponent (17 * 2753 mod 3120 = 1)

# Public key: (3233, 17)
# Private key: (3233, 2753)

# Encrypt the message m = 65 (letter 'A')
c = pow(65, e, n)  # 65^17 mod 3233 = 2790

# Decrypt
m = pow(2790, d, n)  # 2790^2753 mod 3233 = 65
print(f"Decrypted: {m}")  # 65 = 'A'
```

### RSA Key Sizes

| Key Size | Security Level | Status |
|----------|---------------|--------|
| 1024 bits | ~80-bit | **Deprecated** |
| 2048 bits | ~112-bit | Minimum recommended |
| 3072 bits | ~128-bit | Recommended for new systems |
| 4096 bits | ~140-bit | High security |

NIST recommends a minimum of 2048-bit RSA keys (SP 800-57).

## Symmetric vs Asymmetric: Comparison

| Feature | Symmetric (AES) | Asymmetric (RSA) |
|---------|-----------------|------------------|
| Keys | One shared key | Public + private key pair |
| Speed | Very fast | 100-1000x slower |
| Key size for 128-bit security | 128 bits | 3072 bits |
| Key distribution | Requires secure channel | Public key can be shared openly |
| Use case | Bulk data encryption | Key exchange, signatures |
| Examples | AES, ChaCha20 | RSA, ECC, DH |

## Hybrid Encryption

In practice, most systems use **hybrid encryption** to combine the advantages of both:

1. Generate a random symmetric key (session key)
2. Encrypt the data with the symmetric key (fast, efficient)
3. Encrypt the symmetric key with the recipient's public key (solves key distribution)
4. Send both the encrypted data and the encrypted session key

```python
# Hybrid encryption concept
import os
from cryptography.hazmat.primitives.asymmetric import rsa, padding as asym_padding
from cryptography.hazmat.primitives import hashes

# 1. Generate RSA key pair (recipient)
private_key = rsa.generate_private_key(
    public_exponent=65537, key_size=2048
)
public_key = private_key.public_key()

# 2. Sender: generate random AES key
aes_key = os.urandom(32)  # 256-bit AES key

# 3. Encrypt data with AES (fast)
# encrypted_data = AES_GCM_encrypt(aes_key, plaintext)

# 4. Encrypt AES key with RSA (solves key distribution)
encrypted_key = public_key.encrypt(
    aes_key,
    asym_padding.OAEP(
        mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# 5. Send: encrypted_key + encrypted_data
```

This is exactly how **TLS**, **PGP**, and most secure communication protocols work.

## When to Use Which

| Scenario | Recommendation |
|----------|---------------|
| Encrypting a file on disk | Symmetric (AES-256-GCM) |
| Sending encrypted email | Hybrid (RSA/ECDH + AES) |
| TLS/HTTPS | Hybrid (ECDHE + AES-GCM) |
| Password hashing | Neither (use bcrypt/Argon2) |
| Digital signatures | Asymmetric (RSA/ECDSA) |
| Database encryption | Symmetric (AES-256) |
| VPN tunnel | Hybrid (DH + AES/ChaCha20) |

## Summary

- **Symmetric encryption** (AES) uses one shared key, is fast, but requires secure key distribution
- **Asymmetric encryption** (RSA) uses public/private key pairs, solves key distribution, but is slow
- AES operates through four operations: SubBytes, ShiftRows, MixColumns, AddRoundKey
- RSA security relies on the difficulty of factoring large numbers
- **Hybrid encryption** combines both: asymmetric for key exchange, symmetric for data
- Use AES-GCM for authenticated encryption; never use ECB mode
- NIST recommends minimum 2048-bit RSA keys or 128-bit AES keys

## References

- NIST FIPS 197: *Advanced Encryption Standard (AES)*
- NIST SP 800-57: *Recommendation for Key Management*
- RFC 8017: *PKCS #1: RSA Cryptography Specifications*
- Daemen, J. & Rijmen, V. (2002). *The Design of Rijndael*. Springer.
MD,
    ],

    'digital-signatures-intro' => [
        'learning_objectives' => [
            'Explain how digital signatures provide authentication and non-repudiation',
            'Describe the sign-then-verify workflow using public key cryptography',
            'Compare RSA signatures with ECDSA signatures',
            'Understand the role of digital signatures in certificate signing',
            'Identify real-world applications of digital signatures',
        ],
        'key_concepts' => [
            'Digital Signature',
            'Non-repudiation',
            'RSA Signatures',
            'ECDSA',
            'EdDSA',
            'Certificate Signing',
            'Hash-then-Sign',
            'Signature Verification',
        ],
        'content' => <<<'MD'
# Digital Signatures Introduction

## Introduction

A **digital signature** is a cryptographic mechanism that provides three critical security properties:

1. **Authentication** — Proves who created or sent the message
2. **Integrity** — Proves the message has not been altered
3. **Non-repudiation** — The signer cannot deny having signed the message

Digital signatures are the electronic equivalent of handwritten signatures, but far more secure. They are used in software distribution, financial transactions, legal documents, email (S/MIME, PGP), and the entire PKI (Public Key Infrastructure) system that secures the internet.

## How Digital Signatures Work

### The Basic Workflow

Digital signatures use **asymmetric cryptography** in reverse:
- **Signing**: The sender uses their **private key** to create the signature
- **Verification**: Anyone can use the sender's **public key** to verify the signature

```
Signing (sender):
  message + private_key --> signature

Verification (anyone):
  message + signature + public_key --> valid/invalid
```

### Hash-then-Sign Paradigm

In practice, we do not sign the entire message directly (it would be too slow for large messages). Instead, we use the **hash-then-sign** approach:

1. Compute the hash of the message: h = Hash(message)
2. Sign the hash: signature = Sign(private_key, h)
3. Send: message + signature

To verify:
1. Compute the hash of the received message: h' = Hash(message)
2. Verify: Verify(public_key, h', signature) returns true/false

```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding, utils

# Generate key pair
private_key = rsa.generate_private_key(
    public_exponent=65537, key_size=2048
)
public_key = private_key.public_key()

message = b"I authorize the transfer of $1000 to account 12345"

# Sign
signature = private_key.sign(
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)

# Verify
try:
    public_key.verify(
        signature, message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    print("Signature is VALID")
except Exception:
    print("Signature is INVALID")
```

## RSA Signatures

### How RSA Signing Works

RSA signatures are essentially RSA encryption "in reverse":
- **Sign**: signature = message_hash^d mod n (using private key d)
- **Verify**: recovered_hash = signature^e mod n (using public key e)
- Compare recovered_hash with the actual hash of the message

### RSA Padding Schemes for Signatures

| Scheme | Status | Description |
|--------|--------|-------------|
| PKCS#1 v1.5 | Legacy | Deterministic, widely deployed |
| PSS (Probabilistic Signature Scheme) | **Recommended** | Randomized, provably secure |

**RSA-PSS** is recommended for new implementations (RFC 8017).

## ECDSA (Elliptic Curve Digital Signature Algorithm)

**ECDSA** provides equivalent security to RSA with much smaller key sizes:

| Security Level | RSA Key Size | ECDSA Key Size |
|---------------|-------------|----------------|
| 128-bit | 3072 bits | 256 bits |
| 192-bit | 7680 bits | 384 bits |
| 256-bit | 15360 bits | 521 bits |

### How ECDSA Works (Simplified)

1. **Key Generation**: Choose a random private key d, compute public key Q = d * G (where G is the generator point)
2. **Signing**: Generate a random nonce k, compute point R = k * G, then compute s from the message hash, k, d, and R
3. **Verification**: Using the public key Q, message hash, and signature (r, s), verify the mathematical relationship

```python
from cryptography.hazmat.primitives.asymmetric import ec

# Generate ECDSA key pair (P-256 curve)
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

message = b"Transaction: send 1 BTC to address abc123"

# Sign
signature = private_key.sign(message, ec.ECDSA(hashes.SHA256()))

# Verify
try:
    public_key.verify(signature, message, ec.ECDSA(hashes.SHA256()))
    print("ECDSA signature is VALID")
except Exception:
    print("ECDSA signature is INVALID")
```

### ECDSA Security Warning

ECDSA requires a **unique random nonce** for every signature. If the same nonce is ever reused, the private key can be recovered. This is how the PlayStation 3 signing key was compromised in 2010 — Sony used a fixed nonce.

## EdDSA (Edwards-curve Digital Signature Algorithm)

**EdDSA** (specifically **Ed25519**) is a modern alternative that avoids ECDSA's nonce vulnerability:

- Uses a **deterministic nonce** derived from the private key and message (no random number needed)
- Based on Curve25519 (designed by Daniel J. Bernstein)
- Faster than ECDSA in both signing and verification
- Used in SSH, Signal, Tor, and many modern protocols

```python
from cryptography.hazmat.primitives.asymmetric import ed25519

# Generate Ed25519 key pair
private_key = ed25519.Ed25519PrivateKey.generate()
public_key = private_key.public_key()

message = b"Signed document content"

# Sign (no hash algorithm needed - built into Ed25519)
signature = private_key.sign(message)

# Verify
try:
    public_key.verify(signature, message)
    print("Ed25519 signature is VALID")
except Exception:
    print("Ed25519 signature is INVALID")
```

## Comparison of Signature Algorithms

| Feature | RSA-PSS | ECDSA | EdDSA (Ed25519) |
|---------|---------|-------|-----------------|
| Key size (128-bit security) | 3072 bits | 256 bits | 256 bits |
| Signature size | 384 bytes | 64 bytes | 64 bytes |
| Signing speed | Slow | Medium | Fast |
| Verification speed | Fast | Medium | Fast |
| Nonce requirement | Randomized padding | Random (critical!) | Deterministic |
| Standard | RFC 8017 | FIPS 186-4 | RFC 8032 |

## Non-Repudiation

**Non-repudiation** means the signer cannot later deny having signed the message. This is possible because:

1. Only the holder of the private key can create a valid signature
2. Anyone can verify the signature using the public key
3. The signature is bound to the specific message content

This property is essential for:
- **Legal contracts**: Electronic signatures on legal documents
- **Financial transactions**: Authorizing bank transfers
- **Software distribution**: Proving code came from the legitimate developer
- **Email**: S/MIME and PGP signatures prove sender identity

## Digital Signatures in Certificate Signing

The entire PKI (Public Key Infrastructure) system relies on digital signatures:

1. A **Certificate Authority (CA)** signs certificates using its private key
2. Browsers verify certificates using the CA's public key
3. This creates a **chain of trust** from root CAs to end-entity certificates

```
Root CA (self-signed)
  |-- signs --> Intermediate CA certificate
                  |-- signs --> Website certificate (example.com)
```

## Real-World Applications

- **Git commits**: `git commit -S` signs commits with GPG/SSH keys
- **Package managers**: npm, apt, pip verify package signatures
- **Code signing**: Windows/macOS require signed drivers and apps
- **Blockchain**: Every Bitcoin/Ethereum transaction is signed with ECDSA
- **TLS certificates**: Signed by Certificate Authorities
- **PDF signing**: Adobe Acrobat supports digital signatures
- **Email**: S/MIME and PGP/GPG for signed emails

## Summary

- Digital signatures provide authentication, integrity, and non-repudiation
- The hash-then-sign paradigm is used for efficiency
- RSA-PSS is recommended for RSA signatures; PKCS#1 v1.5 is legacy
- ECDSA provides equivalent security with much smaller keys but requires careful nonce management
- EdDSA (Ed25519) is the modern choice: deterministic, fast, and secure
- Digital signatures are the foundation of PKI and certificate chains
- Non-repudiation means the signer cannot deny having signed

## References

- NIST FIPS 186-5: *Digital Signature Standard (DSS)*
- RFC 8017: *PKCS #1: RSA Cryptography Specifications*
- RFC 8032: *Edwards-Curve Digital Signature Algorithm (EdDSA)*
- RFC 6979: *Deterministic Usage of DSA and ECDSA*
- Bernstein, D. J. et al. (2012). *High-speed high-security signatures*. Journal of Cryptographic Engineering.
MD,
    ],
];
