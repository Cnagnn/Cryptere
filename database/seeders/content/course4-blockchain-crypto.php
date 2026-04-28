<?php

/**
 * Lesson content for Course 4: Blockchain Cryptography (intermediate).
 * Returns an array keyed by lesson slug.
 */
return [
    'merkle-trees' => [
        'learning_objectives' => [
            'Explain the structure and construction of a Merkle tree',
            'Describe how Merkle proofs enable efficient data verification',
            'Understand the role of Merkle roots in Bitcoin block headers',
            'Implement a simple Merkle tree in code',
            'Explain Simplified Payment Verification (SPV) using Merkle proofs',
        ],
        'key_concepts' => [
            'Merkle Tree',
            'Hash Tree',
            'Merkle Root',
            'Merkle Proof',
            'Proof of Inclusion',
            'Bitcoin Block Header',
            'Simplified Payment Verification',
        ],
        'content' => <<<'MD'
# Merkle Trees

## Introduction

A **Merkle tree** (also called a **hash tree**) is a data structure in which every leaf node contains the hash of a data block, and every non-leaf node contains the hash of its child nodes. Named after computer scientist **Ralph Merkle**, who patented the concept in 1979, Merkle trees are fundamental to blockchain technology, distributed systems, and data integrity verification.

The key insight of Merkle trees is that they allow efficient and secure verification of large data structures. You can prove that a specific piece of data is part of a dataset by providing only a small number of hashes — without downloading the entire dataset.

## Structure of a Merkle Tree

### Building a Merkle Tree

Consider four data blocks: D0, D1, D2, D3.

```
                    Merkle Root
                   /            \
              H(01)              H(23)
             /     \            /     \
          H(D0)   H(D1)     H(D2)   H(D3)
           |       |         |       |
          D0      D1        D2      D3
```

**Construction process:**

1. **Leaf level**: Hash each data block individually
   - H(D0) = SHA-256(D0)
   - H(D1) = SHA-256(D1)
   - H(D2) = SHA-256(D2)
   - H(D3) = SHA-256(D3)

2. **Internal nodes**: Hash pairs of child hashes
   - H(01) = SHA-256(H(D0) + H(D1))
   - H(23) = SHA-256(H(D2) + H(D3))

3. **Root**: Hash the top pair
   - Merkle Root = SHA-256(H(01) + H(23))

### Handling Odd Numbers of Nodes

If there is an odd number of nodes at any level, the last node is **duplicated** to create a pair:

```
                    Root
                   /    \
              H(01)      H(22)    <-- H2 duplicated
             /     \        |
          H(D0)   H(D1)   H(D2)
```

## Implementation in Python

```python
import hashlib

def sha256(data):
    """Compute SHA-256 hash."""
    if isinstance(data, str):
        data = data.encode()
    return hashlib.sha256(data).hexdigest()

def build_merkle_tree(data_blocks):
    """Build a Merkle tree and return the root hash."""
    if not data_blocks:
        return None

    # Hash all leaf nodes
    current_level = [sha256(block) for block in data_blocks]

    while len(current_level) > 1:
        next_level = []
        # If odd number, duplicate the last element
        if len(current_level) % 2 == 1:
            current_level.append(current_level[-1])

        for i in range(0, len(current_level), 2):
            combined = current_level[i] + current_level[i + 1]
            next_level.append(sha256(combined))

        current_level = next_level

    return current_level[0]  # Merkle root

# Example
transactions = ["Alice->Bob:5BTC", "Bob->Carol:2BTC",
                "Dave->Eve:1BTC", "Eve->Alice:3BTC"]
root = build_merkle_tree(transactions)
print(f"Merkle Root: {root}")
```

:::check
question: In a Merkle tree, what does the root hash represent?
type: mcq
options: ["The hash of the first transaction", "A summary hash of all data in the tree", "The block number", "The miner's signature"]
answer: 1
hint: The root is computed by hashing pairs of child hashes all the way up the tree.
:::

## Merkle Proofs (Proof of Inclusion)

A **Merkle proof** allows you to verify that a specific data block is included in the tree without having all the data. You only need:
- The data block in question
- The **sibling hashes** along the path from the leaf to the root
- The Merkle root

### How Merkle Proofs Work

To prove that D1 is in the tree:

```
                    Merkle Root (known)
                   /            \
              H(01)              [H(23)]  <-- provided
             /     \
          [H(D0)]   H(D1)    <-- H(D0) provided, H(D1) computed
                     |
                    D1        <-- data to verify
```

**Proof consists of:** [H(D0), H(23)] — just 2 hashes!

**Verification steps:**
1. Compute H(D1) = SHA-256(D1)
2. Compute H(01) = SHA-256(H(D0) + H(D1))
3. Compute Root = SHA-256(H(01) + H(23))
4. Compare with the known Merkle root

```python
def verify_merkle_proof(data, proof, root, index):
    """Verify a Merkle proof."""
    current_hash = sha256(data)

    for sibling_hash, is_left in proof:
        if is_left:
            current_hash = sha256(sibling_hash + current_hash)
        else:
            current_hash = sha256(current_hash + sibling_hash)

    return current_hash == root
```

### Efficiency

For a tree with N leaves:
- **Proof size**: O(log N) hashes
- **Verification time**: O(log N) hash computations

For Bitcoin with ~2000 transactions per block:
- Only ~11 hashes needed to verify any transaction (log2(2000) is approximately 11)
- Instead of downloading all 2000 transactions

:::check
question: For a Merkle tree with 1000 leaves, how many hashes are needed in a Merkle proof?
type: mcq
options: ["1000", "500", "About 10", "1"]
answer: 2
hint: Merkle proofs have O(log N) complexity. log2(1000) ≈ 10.
:::

## Merkle Trees in Bitcoin

### Block Header Structure

Every Bitcoin block header contains a **Merkle root** that summarizes all transactions in the block:

```
Block Header (80 bytes):
+------------------+
| Version          |  4 bytes
| Previous Hash    | 32 bytes
| Merkle Root      | 32 bytes  <-- summarizes all transactions
| Timestamp        |  4 bytes
| Difficulty Target|  4 bytes
| Nonce            |  4 bytes
+------------------+
```

The Merkle root is computed from all transactions in the block:

```
                         Merkle Root
                        /           \
                   H(AB)             H(CD)
                  /     \           /     \
              H(Tx_A)  H(Tx_B)  H(Tx_C)  H(Tx_D)
```

### Why Bitcoin Uses Merkle Trees

1. **Efficient verification**: SPV nodes can verify transactions without downloading the full block
2. **Tamper detection**: Changing any transaction changes the Merkle root
3. **Compact proofs**: Only O(log N) hashes needed for verification
4. **Block integrity**: The Merkle root in the header commits to all transactions

## Simplified Payment Verification (SPV)

**SPV** (described in the Bitcoin whitepaper, Section 8) allows lightweight clients to verify transactions without running a full node:

1. The SPV client downloads only **block headers** (80 bytes each, ~4.2 MB/year)
2. To verify a transaction, it requests a **Merkle proof** from a full node
3. It verifies the proof against the Merkle root in the block header
4. It checks that the block header is part of the longest chain

```
Full Node: stores all blocks and transactions (~500+ GB)
SPV Node:  stores only block headers (~60 MB)

SPV verification:
1. Get block header (contains Merkle root)
2. Request Merkle proof for transaction
3. Verify: transaction hash + proof = Merkle root
4. Confirm block is in the longest chain
```

This enables mobile wallets and lightweight clients to verify their own transactions without trusting a third party.

## Merkle Trees Beyond Bitcoin

### Ethereum: Merkle Patricia Tries

Ethereum uses a more complex variant called **Merkle Patricia Tries** that supports key-value lookups. Each Ethereum block header contains three Merkle roots:
- **State root**: All account balances and contract storage
- **Transaction root**: All transactions in the block
- **Receipt root**: All transaction receipts (logs, gas used)

### Git Version Control

Git uses Merkle trees (specifically, a Merkle DAG) to track file changes:
- Each file is hashed (blob)
- Directories are hashed (tree objects)
- Commits reference tree objects
- Any change propagates up through the hash chain

### IPFS (InterPlanetary File System)

IPFS uses Merkle DAGs for content-addressed storage:
- Files are split into chunks
- Each chunk is hashed
- Chunks are organized into a Merkle DAG
- The root hash serves as the content identifier (CID)

### Certificate Transparency

Google's Certificate Transparency project uses Merkle trees to create an append-only log of all issued TLS certificates, allowing anyone to verify that a certificate was legitimately issued.

## Properties of Merkle Trees

| Property | Description |
|----------|-------------|
| **Tamper-evident** | Any change to data changes the root hash |
| **Efficient proofs** | O(log N) proof size and verification time |
| **Deterministic** | Same data always produces the same tree |
| **Incremental updates** | Adding data requires only O(log N) recomputation |

## Summary

- A Merkle tree is a hash tree where each non-leaf node is the hash of its children
- The **Merkle root** is a single hash that summarizes all data in the tree
- **Merkle proofs** allow efficient verification with only O(log N) hashes
- Bitcoin uses Merkle trees to summarize transactions in each block header
- **SPV** enables lightweight clients to verify transactions without full blockchain data
- Merkle trees are also used in Ethereum, Git, IPFS, and Certificate Transparency

## References

- Merkle, R. C. (1979). *A Digital Signature Based on a Conventional Encryption Function*.
- Nakamoto, S. (2008). *Bitcoin: A Peer-to-Peer Electronic Cash System*. Section 7-8.
- Ethereum Yellow Paper: *Merkle Patricia Tries*.
MD,
    ],

    'proof-of-work' => [
        'learning_objectives' => [
            'Explain the proof-of-work consensus mechanism',
            'Describe the mining puzzle and the role of the nonce',
            'Understand difficulty adjustment and its purpose',
            'Compare Proof of Work with Proof of Stake',
            'Analyze the energy considerations of PoW mining',
        ],
        'key_concepts' => [
            'Proof of Work',
            'Mining Puzzle',
            'Nonce',
            'Difficulty Target',
            'Difficulty Adjustment',
            'Hashrate',
            'Proof of Stake',
            'Consensus Mechanism',
        ],
        'content' => <<<'MD'
# Proof of Work

## Introduction

**Proof of Work (PoW)** is a consensus mechanism that requires participants to expend computational effort to validate transactions and create new blocks. First conceptualized by Cynthia Dwork and Moni Naor in 1993 to combat email spam, and later implemented by **Hashcash** (Adam Back, 1997), PoW became famous as the consensus mechanism powering **Bitcoin** (Satoshi Nakamoto, 2008).

The fundamental idea is simple: make it computationally expensive to create a block, but easy to verify that the work was done. This asymmetry — hard to produce, easy to verify — is the foundation of blockchain security.

## The Mining Puzzle

### How It Works

The PoW mining puzzle requires finding a value (called a **nonce**) such that the hash of the block header is below a certain **target** value:

```
Find nonce such that:
  SHA-256(SHA-256(block_header + nonce)) < target
```

Since hash functions are unpredictable, the only way to find a valid nonce is **trial and error** — trying billions of different values until one produces a hash below the target.

### The Block Header

The block header contains:
```
+------------------+
| Version          |  4 bytes
| Previous Hash    | 32 bytes
| Merkle Root      | 32 bytes
| Timestamp        |  4 bytes
| Difficulty Bits  |  4 bytes
| Nonce            |  4 bytes  <-- this is what miners vary
+------------------+
Total: 80 bytes
```

### Mining Example

```python
import hashlib
import time

def mine_block(data, difficulty):
    """Simple proof-of-work mining simulation."""
    target = '0' * difficulty  # Target: hash must start with N zeros
    nonce = 0
    start_time = time.time()

    while True:
        text = f"{data}{nonce}"
        hash_result = hashlib.sha256(text.encode()).hexdigest()

        if hash_result.startswith(target):
            elapsed = time.time() - start_time
            print(f"Block mined!")
            print(f"  Nonce: {nonce}")
            print(f"  Hash:  {hash_result}")
            print(f"  Time:  {elapsed:.2f}s")
            print(f"  Attempts: {nonce + 1}")
            return nonce, hash_result

        nonce += 1

# Mine with increasing difficulty
mine_block("Block #1: Alice pays Bob 5 BTC", difficulty=4)
# Difficulty 4: hash must start with "0000"
# Typically requires ~65,000 attempts
```

:::check
question: In Proof of Work mining, what value do miners repeatedly change to find a valid block hash?
type: fill_blank
answer: nonce
hint: It's a number included in the block header that miners increment through trial and error.
:::

### Why Double SHA-256?

Bitcoin uses **double SHA-256** (SHA-256 applied twice) for mining. This was a design choice by Satoshi Nakamoto, likely to protect against **length extension attacks** that affect single SHA-256.

## Difficulty and Target

### The Difficulty Target

The **target** is a 256-bit number. A valid block hash must be numerically less than the target. A lower target means higher difficulty.

```
Easy target (high number):
  00000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF

Hard target (low number):
  0000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
```

The more leading zeros required, the harder the puzzle.

### Difficulty Adjustment

Bitcoin adjusts difficulty every **2016 blocks** (approximately every 2 weeks) to maintain an average block time of **10 minutes**:

```
new_difficulty = old_difficulty * (2016 * 10 minutes) / actual_time

If blocks came too fast: difficulty increases
If blocks came too slow: difficulty decreases
```

This self-regulating mechanism ensures that:
- Block production remains steady regardless of total hashrate
- The network adapts to miners joining or leaving
- The supply schedule (block rewards) stays predictable

### Current Bitcoin Mining Scale

As of recent data:
- Network hashrate: ~500+ EH/s (exahashes per second)
- That is 500,000,000,000,000,000,000 SHA-256 computations per second
- Average time to find a block: ~10 minutes
- Current difficulty requires approximately 70+ leading zero bits

## The Role of PoW in Consensus

### Why PoW Works

1. **Sybil resistance**: Creating fake identities does not help — only computational power matters
2. **Costly to attack**: To rewrite history, an attacker needs >50% of the network's hashrate
3. **Easy to verify**: Anyone can verify a block's hash in microseconds
4. **Probabilistic finality**: The deeper a block is buried, the harder it is to reverse

### The 51% Attack

If an attacker controls more than 50% of the network's hashrate, they could theoretically:
- **Double-spend**: Reverse their own transactions
- **Censor transactions**: Refuse to include certain transactions
- **NOT**: Steal coins, change block rewards, or create coins from nothing

The cost of a 51% attack on Bitcoin is estimated at millions of dollars per hour in electricity and hardware costs, making it economically irrational.

## Energy Considerations

### The Energy Debate

PoW mining consumes significant energy:
- Bitcoin's annual energy consumption is estimated at ~100-150 TWh
- Comparable to the energy consumption of some small countries
- This is by design — energy expenditure is what makes the network secure

### Arguments For PoW Energy Use

- Secures a trillion-dollar network without trusted third parties
- Incentivizes renewable energy development (miners seek cheapest power)
- Much of the energy comes from stranded or otherwise wasted sources
- Energy use is proportional to the value being secured

### Arguments Against PoW Energy Use

- Environmental impact of carbon-intensive mining operations
- Energy could be used for other purposes
- Alternative consensus mechanisms achieve similar security with less energy
- E-waste from specialized mining hardware (ASICs)

:::check
question: Bitcoin adjusts its mining difficulty every 2016 blocks to maintain an average block time of approximately how many minutes?
type: fill_blank
answer: 10
hint: This is roughly every two weeks at the target rate.
:::

## Proof of Work vs Proof of Stake

| Feature | Proof of Work (PoW) | Proof of Stake (PoS) |
|---------|--------------------|--------------------|
| **Resource** | Computational power | Staked cryptocurrency |
| **Energy use** | Very high | Very low |
| **Hardware** | Specialized ASICs | Standard computers |
| **Security model** | Cost of electricity | Cost of capital |
| **Attack cost** | Buy/rent hashpower | Buy 33-51% of stake |
| **Finality** | Probabilistic | Can be deterministic |
| **Examples** | Bitcoin, Litecoin | Ethereum 2.0, Cardano |
| **Decentralization** | Mining pools concentrate power | Wealth concentration risk |

### Ethereum's Transition (The Merge)

In September 2022, Ethereum transitioned from PoW to PoS ("The Merge"), reducing its energy consumption by approximately **99.95%**. This was one of the largest infrastructure changes in blockchain history.

## Other PoW Variants

### Memory-Hard PoW

Some cryptocurrencies use **memory-hard** hash functions to resist ASIC mining:
- **Scrypt** (Litecoin): Requires significant memory
- **Ethash** (old Ethereum): Memory-hard, designed for GPU mining
- **RandomX** (Monero): Optimized for CPU mining

### Proof of Useful Work

Research projects explore PoW where the computation serves a useful purpose:
- **Primecoin**: Finds prime number chains
- **Folding@home**: Protein folding simulations (not blockchain, but similar concept)

## Summary

- Proof of Work requires miners to find a nonce that produces a hash below a target value
- The mining puzzle is hard to solve but easy to verify (asymmetric)
- Difficulty adjusts every 2016 blocks in Bitcoin to maintain ~10 minute block times
- PoW provides Sybil resistance and makes blockchain history expensive to rewrite
- Energy consumption is significant but is the source of network security
- Proof of Stake is an alternative that uses staked capital instead of computation
- Ethereum transitioned from PoW to PoS in 2022, reducing energy use by 99.95%

## References

- Nakamoto, S. (2008). *Bitcoin: A Peer-to-Peer Electronic Cash System*.
- Back, A. (2002). *Hashcash - A Denial of Service Counter-Measure*.
- Dwork, C. & Naor, M. (1993). *Pricing via Processing or Combatting Junk Mail*.
- Cambridge Bitcoin Electricity Consumption Index (CBECI).
MD,
    ],

    'elliptic-curve-basics' => [
        'learning_objectives' => [
            'Understand the basic mathematics of elliptic curves',
            'Explain point addition and scalar multiplication on elliptic curves',
            'Describe the secp256k1 curve used in Bitcoin and Ethereum',
            'Understand why ECC provides equivalent security with smaller keys than RSA',
            'Explain how elliptic curves are used for key derivation in cryptocurrencies',
        ],
        'key_concepts' => [
            'Elliptic Curve Cryptography',
            'Point Addition',
            'Scalar Multiplication',
            'secp256k1',
            'ECDLP',
            'Key Derivation',
            'Finite Field',
            'Generator Point',
        ],
        'content' => <<<'MD'
# Elliptic Curve Basics

## Introduction

**Elliptic Curve Cryptography (ECC)** is a modern approach to public-key cryptography based on the algebraic structure of elliptic curves over finite fields. Introduced independently by **Neal Koblitz** and **Victor Miller** in 1985, ECC provides the same level of security as RSA but with **dramatically smaller key sizes**.

ECC is the cryptographic backbone of Bitcoin, Ethereum, and most modern secure communication protocols. Understanding its basics is essential for anyone working with blockchain technology or modern security systems.

## What Is an Elliptic Curve?

### The Mathematical Definition

An elliptic curve is defined by the equation (in Weierstrass form):

```
y^2 = x^3 + ax + b
```

Where the discriminant (4a^3 + 27b^2) is not equal to zero (this ensures the curve has no singularities).

### Visual Intuition

Over the real numbers, elliptic curves look like smooth, symmetric curves:

```
For y^2 = x^3 - 3x + 5:

    y
    |        *
    |      *   *
    |    *       *
    |   *         *
----+--*-----------*-----> x
    |   *         *
    |    *       *
    |      *   *
    |        *
```

The curve is symmetric about the x-axis. Every point (x, y) on the curve has a mirror point (x, -y).

### Elliptic Curves Over Finite Fields

For cryptography, we use elliptic curves over **finite fields** (modular arithmetic), not real numbers:

```
y^2 = x^3 + ax + b  (mod p)
```

Where p is a large prime number. The points on the curve form a finite set, and all arithmetic is done modulo p.

## Point Operations

### Point Addition

Given two points P and Q on the curve, we can define a third point R = P + Q:

1. Draw a line through P and Q
2. The line intersects the curve at a third point
3. Reflect that point across the x-axis to get R

```
Geometrically:
    |     P *
    |        \
    |         \
    |          * (intersection)
    |          |
    |          * R = P + Q (reflected)
    |         /
    |        /
    |     Q *
```

**Algebraically (over a finite field):**

```
If P = (x1, y1) and Q = (x2, y2), and P != Q:

  slope = (y2 - y1) * inverse(x2 - x1) mod p
  x3 = slope^2 - x1 - x2 mod p
  y3 = slope * (x1 - x3) - y1 mod p
  R = (x3, y3)
```

### Point Doubling

When P = Q (adding a point to itself), we use the tangent line:

```
slope = (3 * x1^2 + a) * inverse(2 * y1) mod p
x3 = slope^2 - 2 * x1 mod p
y3 = slope * (x1 - x3) - y1 mod p
```

### The Point at Infinity

The **point at infinity** (denoted O or the "zero point") serves as the identity element:
- P + O = P (for any point P)
- P + (-P) = O (a point plus its inverse equals infinity)

:::check
question: Elliptic Curve Cryptography provides the same security as RSA with much smaller key sizes.
type: true_false
answer: 0
hint: A 256-bit ECC key provides roughly the same security as a 3072-bit RSA key.
:::

## Scalar Multiplication

**Scalar multiplication** is the key operation in ECC. Given a point G and an integer k:

```
k * G = G + G + G + ... + G  (k times)
```

This is computed efficiently using the **double-and-add** algorithm:

```python
def scalar_multiply(k, point, curve):
    """Compute k * point using double-and-add."""
    result = POINT_AT_INFINITY
    addend = point

    while k > 0:
        if k & 1:  # If the current bit is 1
            result = point_add(result, addend, curve)
        addend = point_double(addend, curve)
        k >>= 1

    return result
```

This runs in O(log k) time, making it efficient even for very large k.

### The Elliptic Curve Discrete Logarithm Problem (ECDLP)

The security of ECC relies on the **ECDLP**:

```
Given: G (generator point) and Q = k * G (public key)
Find:  k (private key)

This is computationally infeasible for large k.
```

**Forward direction** (computing Q from k and G): Easy — O(log k) operations
**Reverse direction** (finding k from Q and G): Infeasible — no known efficient algorithm

This one-way property is what makes ECC secure.

:::check
question: What is the name of the hard mathematical problem that ECC security relies on?
type: mcq
options: ["Integer factorization", "Discrete logarithm", "Elliptic Curve Discrete Logarithm Problem (ECDLP)", "Traveling salesman problem"]
answer: 2
hint: It involves finding the scalar k given the points G and Q = k * G on an elliptic curve.
:::

## The secp256k1 Curve

**secp256k1** is the specific elliptic curve used by Bitcoin and Ethereum. It is defined by:

```
Curve equation: y^2 = x^3 + 7  (a = 0, b = 7)
Prime field:    p = 2^256 - 2^32 - 977
Order:          n = FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFE
                    BAAEDCE6 AF48A03B BFD25E8C D0364141
Generator point G:
  x = 79BE667E F9DCBBAC 55A06295 CE870B07
      029BFCDB 2DCE28D9 59F2815B 16F81798
  y = 483ADA77 26A3C465 5DA4FBFC 0E1108A8
      FD17B448 A6855419 9C47D08F FB10D4B8
```

### Why secp256k1?

- **Efficiency**: The specific parameters allow for optimized computation
- **No suspicious constants**: Unlike NIST curves (P-256), secp256k1 parameters are derived from simple values, reducing concerns about backdoors
- **Koblitz curve**: The a=0 parameter enables faster computation
- **Widely audited**: Extensive use in Bitcoin has led to thorough security analysis

## Key Generation in Cryptocurrencies

### Bitcoin/Ethereum Key Derivation

```
1. Generate random 256-bit private key: k
2. Compute public key: Q = k * G (on secp256k1)
3. Derive address from public key (hash + encoding)
```

```python
# Conceptual key generation (simplified)
import secrets

# 1. Generate private key (random 256-bit integer)
private_key = secrets.randbelow(
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
)

# 2. Compute public key: Q = private_key * G
# (requires elliptic curve library)
# public_key = scalar_multiply(private_key, G, secp256k1)

# 3. Bitcoin address derivation:
# address = Base58Check(RIPEMD160(SHA256(public_key)))

# 4. Ethereum address derivation:
# address = "0x" + Keccak256(public_key)[12:]
```

### Security of the Private Key

A 256-bit private key has 2^256 possible values. To put this in perspective:
- There are approximately 2^80 atoms in the observable universe
- 2^256 is approximately 10^77
- Brute-forcing a 256-bit key is physically impossible with current or foreseeable technology

## ECC vs RSA: Key Size Comparison

| Security Level | RSA Key Size | ECC Key Size | Ratio |
|---------------|-------------|-------------|-------|
| 80-bit | 1024 bits | 160 bits | 6:1 |
| 112-bit | 2048 bits | 224 bits | 9:1 |
| 128-bit | 3072 bits | 256 bits | 12:1 |
| 192-bit | 7680 bits | 384 bits | 20:1 |
| 256-bit | 15360 bits | 521 bits | 30:1 |

ECC achieves the same security with keys that are **10-30x smaller** than RSA, resulting in:
- Faster key generation
- Faster signing and verification
- Smaller signatures and certificates
- Less bandwidth and storage

## Common Elliptic Curves

| Curve | Key Size | Used By | Standard |
|-------|----------|---------|----------|
| secp256k1 | 256 bits | Bitcoin, Ethereum | SEC 2 |
| P-256 (secp256r1) | 256 bits | TLS, government | NIST |
| P-384 | 384 bits | High-security TLS | NIST |
| Curve25519 | 256 bits | Signal, SSH, TLS 1.3 | RFC 7748 |
| Ed25519 | 256 bits | SSH, Tor, Signal | RFC 8032 |

## Summary

- Elliptic curves are defined by y^2 = x^3 + ax + b over finite fields
- **Point addition** and **scalar multiplication** are the fundamental operations
- The **ECDLP** (finding k from k*G) is computationally infeasible — this is the security basis
- **secp256k1** is the curve used by Bitcoin and Ethereum (y^2 = x^3 + 7)
- ECC provides equivalent security to RSA with 10-30x smaller key sizes
- Key generation: private key (random number) leads to public key (point on curve) leads to address
- Other important curves include P-256, Curve25519, and Ed25519

## References

- Koblitz, N. (1987). *Elliptic Curve Cryptosystems*. Mathematics of Computation.
- Miller, V. (1985). *Use of Elliptic Curves in Cryptography*. CRYPTO.
- SEC 2: *Recommended Elliptic Curve Domain Parameters*.
- NIST FIPS 186-5: *Digital Signature Standard*.
- Bernstein, D. J. (2006). *Curve25519: New Diffie-Hellman Speed Records*.
MD,
    ],
];
