# Glass Box Pedagogical Execution Plan v5.1

> **Untuk Hermes:** TDD per task. Bite-sized commits maks 250 lines per diff.
> Patuhi protokol: test dulu → implementasi → commit → lanjut.
> Jangan skip test. Jangan gabung task.

**Branch:** `feat/labs-glass-box-v5` (udah dibuat, baseline 97 tests hijau)

---

## Ringkasan Perubahan (Arah)

1. **`resources/js/features/labs/`** — struktur baru (types, codecs, algorithms, components)
2. **`resources/js/lib/lab-simulations.ts`** — compat shim, jangan hapus dulu
3. **`resources/js/pages/labs/show.tsx`** — surgical edits untuk render state baru
4. **`config/labs.php`** — rename RSA-256 -> RSA (Demonstrasi)

---

## Prioritas Pedagogis (Tier 1-4)

### Tier 1: Kejujuran Epistemik (harus dulu)

| Task | File | Lines | Test |
|---|---|---|---|
| T1.1 | `features/labs/types.ts` | ~90 ✅ DONE | skip (static types) |
| T1.2 | `features/labs/codecs.ts` | ~200 | `__tests__/codecs.test.ts` |
| T1.3 | `features/labs/codecs.ts` (partial done) | test sudah ada | jalankan |
| T1.4 | Rename `config/labs.php` RSA-256 | edit 1 baris | - |
| T1.5 | Edit `lab-simulations.ts` signature fallback label | edit 2 baris | test adjust |

### Tier 2: Algoritma Asli + Trace

| Task | File | Lines | KAT Vector |
|---|---|---|---|
| T2.1 | `features/labs/algorithms/aes-tables.ts` | ~280 | - |
| T2.2 | `features/labs/algorithms/aes.ts` | ~280 | NIST FIPS-197 |
| T2.3 | `features/labs/algorithms/des-tables.ts` | ~300 | - |
| T2.4 | `features/labs/algorithms/des.ts` | ~280 | NIST/Stallings |
| T2.5 | `features/labs/algorithms/rsa.ts` | ~250 | round-trip property |
| T2.6 | `features/labs/algorithms/sha256.ts` | ~150 | NIST FIPS-180-4 |
| T2.7 | `features/labs/algorithms/signature.ts` | ~150 | sign+verify |
| T2.8 | `features/labs/__tests__/algorithms.test.ts` | ~280 | semua KAT |

### Tier 3: Integrasi ke lab-simulations.ts

| Task | Change |
|---|---|
| T3.1 | `runAesConcept` → panggil `aesEncryptBlock`, hasilkan `SimulationResult` dari `AesTrace` |
| T3.2 | `runDesConcept` → panggil `desEncryptBlock`, hasilkan `DesTrace` |
| T3.3 | `runRsaConcept` → tambah key gen steps, pakai BigInt |
| T3.4 | `runSignatureLab` → panggil `sha256` + RSA sign |
| T3.5 | `visualizationLensByLab` update untuk algoritma baru |
| T3.6 | Tambah step counters: total steps dari trace, bukan cap 12 |

### Tier 4: Aha Moments & UI

| Task | Component |
|---|---|
| T4.1 | `components/state-matrix-view.tsx` — grid 4×4 AES |
| T4.2 | `components/feistel-view.tsx` — L/R halves DES |
| T4.3 | `components/avalanche-demo.tsx` — side-by-side diff |
| T4.4 | `components/caesar-brute-force.tsx` — 26 candidates |
| T4.5 | `components/onboarding-panel.tsx` — "Apa ini?" + "Langkah pertama" |
| T4.6 | `components/glossary-sheet.tsx` — istilah teknis Indonesia |
| T4.7 | Update `show.tsx` render branching untuk trace |

---

## Phase 1: Foundation (mulai dari sini)

### Task 1.1 — ✅ SELESAI
`resources/js/features/labs/types.ts` sudah dibuat.

### Task 1.2 — Codec layer

**Step 1 — Test:** `features/labs/__tests__/codecs.test.ts` ✅ SUDAH DIBUAT

**Step 2 — Run test (expect fail):**
```bash
npx vitest run features/labs/__tests__/codecs.test.ts
```
Harus error `Cannot find module '../codecs'`.

**Step 3 — Implementasi** `features/labs/codecs.ts`:
```ts
import type { ParsedLabInput, RenderedLabOutput, LabFormat } from './types';

export function parseLabInput(raw: string, format: LabFormat): ParsedLabInput {
    // Implementasi untuk 8 format:
    // text: { text: raw, bytes: encoder.encode(raw), error: null }
    // ascii: encoder.encode(raw), validate 0x00-0x7F
    // utf8: encoder.encode(raw)
    // hex: regex [0-9a-fA-F], paired, reject odd length & invalid chars
    // binary: splitted by whitespace, each must be 8-bit /^[01]{8}$/
    // base64: atob, catch error
    // decimal-bytes: splitted, each 0-255
    // integer-blocks: splitted, each must be integer, stored in text
}

export function renderLabOutput(
    data: { bytes?: number[]; text?: string },
    format: LabFormat,
): RenderedLabOutput {
    // hex: lower-case grouped or continuous? prefer continuous uppercase
    // binary: 8-bit groups separated by space
    // base64: btoa
    // decimal-bytes: space-separated
    // text/integer-blocks: as-is
}

export function formatLabel(value: LabFormat): string {
    // Label Indonesia untuk UI
}

export const LAB_FORMATS: { value: LabFormat; label: string }[] = [
    { value: 'text', label: 'Teks' },
    { value: 'ascii', label: 'ASCII' },
    { value: 'utf8', label: 'UTF-8' },
    { value: 'hex', label: 'Heksadesimal' },
    { value: 'binary', label: 'Biner' },
    { value: 'base64', label: 'Base64' },
    { value: 'decimal-bytes', label: 'Byte Desimal' },
    { value: 'integer-blocks', label: 'Blok Integer' },
];
```

**Step 4 — Run test → pass:**
```bash
npx vitest run features/labs/__tests__/codecs.test.ts
```

**Step 5 — Commit:**
```bash
git add resources/js/features/labs/ && git commit -m "feat(labs): codec layer with 8 format I/O support"
```

### Task 1.3 — Rename + Edit Small Fixes

**Subtask 1.3a:** Edit `config/labs.php`:
- Line 41: `'RSA-256'` → `'RSA (Demonstrasi)'`
- Line 42: `'Visualize public-private key concepts...'` → tambah disclaimer

**Subtask 1.3b:** Edit `lab-simulations.ts`:
- `pseudoSha256` → `educationalToyHash`
- Ubah langkah-langkah yang menyebut "Round step" di AES/DES fallback jadi lebih jujur

Commit: `git commit -m "fix(labs): epistemically honest labels for AES/DES/RSA fallback"`

---

## Phase 2: Algorithms (eksekusi paralel kolom A/B/C)

### Kolom A: AES-128 (2 file, ~560 lines, split jadi 2 chunk)

**File A1: `features/labs/algorithms/aes-tables.ts`** (~280 lines)
```
- S-box (256 bytes lookup)
- Inv S-box (256 bytes lookup)
- Rcon (10 word values)
- xtime (GF multiplication helper)
- T tables (opsional, untuk MixColumns cepat)
```

**File A2: `features/labs/algorithms/aes.ts`** (~280 lines)
```
- keyExpansion (128-bit → 11 round keys)
- subWord, rotWord helpers
- addRoundKey
- subBytes / invSubBytes
- shiftRows / invShiftRows
- mixColumns / invMixColumns
- encryptBlock → AesTrace
- decryptBlock → AesTrace
```

**KAT:**
```ts
// NIST FIPS-197 Appendix B / C
const PT = hexToBytes('00112233445566778899AABBCCDDEEFF');
const KEY = hexToBytes('000102030405060708090A0B0C0D0E0F');
const CT = aesEncryptBlock(PT, KEY);
expect(bytesToHex(CT.ciphertext)).toBe('69C4E0D86A7B0430D8CDB78070B4C55A');
```

### Kolom B: DES (2 file, ~580 lines)

**File B1: `features/labs/algorithms/des-tables.ts`** (~300 lines)
```
- IP (64 entry)
- FP / IP^-1 (64 entry)
- PC-1 (56 entry, drop parity)
- PC-2 (48 entry)
- E (expansion, 32→48)
- P (permutation, 32 entry)
- S1..S8 (masing-masing 4×16, total 512 entry)
- SHIFT_SCHEDULE (16 entry: 1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1)
```

**File B2: `features/labs/algorithms/des.ts`** (~280 lines)
```
- keySchedule (64-bit key → 16 round keys 48-bit)
- feistelF (R 32-bit, key 48-bit → 32-bit)
- encryptBlock → DesTrace
- decryptBlock → DesTrace
- hexToBits / bitsToHex helpers
```

**KAT:**
```ts
// NIST FIPS-46 / Stallings
const PT = hexToBits('0123456789ABCDEF');
const KEY = hexToBits('133457799BBCDFF1');
const CT = desEncryptBlock(PT, KEY);
expect(bitsToHex(CT.ciphertext)).toBe('85E813540F0AB405');
```

### Kolom C: SHA-256 (1 file, ~200 lines)

**File C1: `features/labs/algorithms/sha256.ts`** (~200 lines)
```
- K (64 round constants)
- H (8 initial values)
- σ0, σ1, Σ0, Σ1, Ch, Maj helpers (right-rotate operations)
- pad (append 0x80, zeros, 64-bit length big-endian)
- transform (64 rounds, working variables a-h)
- sha256(message) → digest hex string
- sha256BlockTrace(message) → Sha256BlockTrace (untuk visualisasi)
```

**KAT:**
```ts
expect(sha256('')).toBe('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855');
expect(sha256('abc')).toBe('BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
```

### Kolom D: RSA + Signature (2 file, ~350 lines)

**File D1: `features/labs/algorithms/rsa.ts`**
```
- modPowBigInt(base: bigint, exp: bigint, mod: bigint): bigint
- gcdExtended(a: bigint, b: bigint): { gcd, x, y, steps }
- generateKeyPair(p: bigint, q: bigint, e: bigint): RsaKeyGenTrace
- encryptChar(m: bigint, e: bigint, n: bigint): bigint
- decryptChar(c: bigint, d: bigint, n: bigint): bigint
```

**File D2: `features/labs/algorithms/signature.ts`**
```
- signMessage(message: string, d: bigint, n: bigint): SignatureTrace
- verifySignature(message: string, sig: bigint, e: bigint, n: bigint): VerifyTrace
- Gunakan sha256 untuk digest
- Signature = digestInt^d mod n
- Verify = sig^e mod n === digestInt
```

---

## Cara Jalankan

1. **Buka Hermes di branch `feat/labs-glass-box-v5`**
2. Jalankan Phase 1 dulu: Task 1.2 (codec implementasi) + Task 1.3 (rename)
3. Kirim 3 fixer paralel:
   - Fixer A: AES tables + engine (KAT pass)
   - Fixer B: DES tables + engine (KAT pass)
   - Fixer C: SHA-256 + RSA + Signature (KAT pass)
4. Jalankan `npx vitest run --reporter verbose` — semua harus hijau
5. Jika semua pass: Phase 3 + 4 (integrasi + UI)
6. Jika ada merah: fix dulu, jangan lanjut
