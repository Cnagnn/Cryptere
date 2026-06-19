# Plan: Lab Simulation Engine Upgrade v2.5 → v4.0

**Written:** 2026-06-16 | **Status:** ready | **Rating baseline:** 2.5/5 → target 4.0/5

---

## Context

Current `lab-simulations.ts` (1099 lines) powers 6 cryptography labs:
Caesar, Vigenere, AES-concept, DES-concept, RSA-concept, Digital Signature.

Key problems identified in prior audit (2.5/5 rating):
1. AES/DES are XOR toy simulations — not real algorithms
2. `pseudoSha256` is FNV-1a based, not SHA-256
3. RSA uses hardcoded toy primes (61×53) — no keygen, no real math
4. Signature lab depends on pseudoSha256
5. No real Web Crypto integration
6. Output formatting is ASCII-only for most labs, losing binary fidelity

---

## Tasks (bite-sized, ordered for incremental commits)

### Phase 1: Foundation — Real Hash + Real AES (2 tasks)

#### T1: Replace `pseudoSha256` with Web Crypto SHA-256 (async)
**File:** `resources/js/lib/lab-simulations.ts`
**Scope:** Lines 522-542 (pseudoSha256 function)
**What:**
- Keep `pseudoSha256` as a sync fallback
- Add new `sha256(input: string): Promise<string>` using `crypto.subtle.digest('SHA-256', ...)`
- Returns uppercase hex string (same interface)
- Update all consumers to `await` the result
**Test impact:** Existing tests still pass (same interface shape)
**New test:** `lab-simulations.test.ts` — add test verifying real SHA-256 matches known vector
**Lines changed:** ~30 added, ~5 modified

#### T2: Replace AES-concept with Web Crypto AES-128-CBC
**File:** `resources/js/lib/lab-simulations.ts`
**Scope:** Lines 626-733 (runAesConcept function)
**What:**
- Replace XOR byte-mixing fallback with `crypto.subtle.encrypt('AES-CBC', ...)` / `decrypt`
- Generate random IV, prepend to ciphertext
- Keep known-vector wall for educational walkthrough
- Fallback path: if Web Crypto unavailable, use existing XOR as degraded mode
- Output hex: IV + ciphertext
- Add step-by-step explanation in `steps` array (real round count, block size, mode)
**Test impact:** Known-vector test preserved; add test verifying round-trip with random key
**Lines changed:** ~80 modified, ~30 added
**Pitfall:** Web Crypto only works in secure contexts (localhost works, IP needs HTTPS). Document this.

### Phase 2: Real Asymmetric — RSA Keygen + BigInt (2 tasks)

#### T3: Add real RSA key generation (BigInt-based)
**File:** `resources/js/lib/lab-simulations.ts`
**Scope:** New function `generateRsaParams(bitLength: number): { p, q, n, e, d, phi }`
**What:**
- Use `bigint-crypto-utils` or pure JS BigInt for key generation
- Educational mode: small primes (8-16 bit) for readable output
- Keep existing toy primes (61, 53) as default for backward compat
- New keygen produces: p, q, n, e, d, phi(n), λ(n)
- Show keygen steps in simulation output
**Test impact:** Add test verifying gcd(e, phi) = 1 and d*e ≡ 1 mod phi
**Lines changed:** ~100 added

#### T4: Upgrade RSA encrypt/decrypt to BigInt
**File:** `resources/js/lib/lab-simulations.ts`
**Scope:** Lines 808-861 (runRsaConcept, modPow)
**What:**
- Replace Number-based modPow with BigInt modular exponentiation
- Support larger keys (up to 2048-bit for educational demo)
- Keep character-by-character mode for small keys (readable output)
- Add block mode for larger keys
- Export `rsaParams` from `SimulationResult` for UI display
**Types impact:** Add optional `rsaParams?` to `SimulationResult`
**Test impact:** Existing tests adapt; add tests for BigInt edge cases
**Lines changed:** ~60 modified, ~40 added

### Phase 3: Real DES + Binary Output (2 tasks)

#### T5: Replace DES-concept with Web Crypto DES (or AES as substitute)
**File:** `resources/js/lib/lab-simulations.ts`
**Scope:** Lines 735-806 (runDesConcept function)
**What:**
- Web Crypto does NOT support DES (browser policy). Use AES-128 as "modern DES" substitute
- Keep DES known-vector wall as historical note
- New flow: encrypt with AES-128-ECB (closest to DES block paradigm)
- Show 16-round Feistel visualization (educational)
- Add note explaining DES deprecation and why AES is shown
**Test impact:** DES known-vector test preserved; add test for new AES-ECB flow
**Lines changed:** ~50 modified

#### T6: Add binary output support to all labs
**File:** `resources/js/lib/lab-simulations.ts` + `resources/js/types/labs.ts`
**Scope:** `formatOutputValue()`, `SimulationResult`, output formatting
**What:**
- Add `rawBytes?: Uint8Array` to `SimulationResult`
- `formatOutputValue()` already handles hex/binary/base64/decimal — verify it works for all labs
- Ensure AES/DES output can render in all formats (not just hex)
- Fix: `formatOutputValue()` currently takes `string`, should also accept `Uint8Array`
**Test impact:** Add tests for binary output format round-trips
**Lines changed:** ~20 modified in engine, ~5 in types

### Phase 4: Signature Lab Upgrade + Polish (1 task)

#### T7: Upgrade digital signature lab to use real SHA-256
**File:** `resources/js/lib/lab-simulations.ts`
**Scope:** Lines 863-901 (runSignatureLab)
**What:**
- Use `sha256()` (from T1) instead of `pseudoSha256`
- Show real signature flow: hash → sign → verify
- Add RSA-PSS or HMAC-SHA256 demo path
- Keep fallback to pseudoSha256 for environments without Web Crypto
**Test impact:** Signature tests adapt to real hash
**Lines changed:** ~30 modified

---

## Implementation Order

```
T1 (real SHA-256) ──┬──> T3 (RSA keygen) ──> T4 (RSA BigInt)
                     │
                     ├──> T7 (signature upgrade)
                     │
                     └──> T2 (real AES) ──> T5 (DES modernize) ──> T6 (binary output)
```

Phase 1 first (T1+T2) — immediate 2.5→3.5 jump with real hash + real AES.
Phase 2 (T3+T4) — RSA becomes real crypto, not toy.
Phase 3 (T5+T6) — DES gets honest treatment, binary output completes the picture.
Phase 4 (T7) — signature lab gets the real hash it always needed.

Each task is a single commit. Tests must pass before moving to next task.

---

## Risks / Pitfalls

1. **Web Crypto availability:** Only works on localhost or HTTPS. Dev (localhost) is fine. Production (cryptere.com) needs HTTPS — already has it via Cloudflare.
2. **Async migration:** `runSimulation` becomes async. All callers (show.tsx) must `await`. This is a breaking API change — plan for it in T1.
3. **BigInt browser support:** All modern browsers support BigInt. No IE11 concern.
4. **AES-CBC IV:** Must be random and transmitted. Prepending to ciphertext is standard.
5. **DES deprecation:** Web Crypto refuses DES. Using AES-128-ECB as substitute is honest — document this in the UI.
6. **Performance:** RSA keygen at 2048-bit can take seconds in browser. Show progress indicator.
