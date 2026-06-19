# Crypto Labs Glass-Box v5 — Honest Implementation Plan

> **For Hermes:** Use TDD per task. Bite-sized commits. Stop at end of each Day for review.

**Goal:** Bawa 6 lab kriptografi `/labs` ke akurasi defendable (KAT match), transparansi glass-box per-step yang sungguhan, dan beginner-friendly UX dengan onboarding eksplisit.

**Why this is a re-plan, not v4 execution:**
- Plan v4 (`lab-engine-upgrade-v4.md`) memakai Web Crypto API → itu **black-box**, tidak glass-box. AES-CBC dari `crypto.subtle.encrypt` tidak menampilkan SubBytes/ShiftRows/MixColumns per round. Bertentangan dengan goal TA.
- v4 mengusulkan "DES = AES-128-ECB sebagai substitusi" → secara akademik lebih buruk dari XOR sekarang. DES harus DES atau dihapus jujur.
- v4 tidak menyertakan kebutuhan onboarding pendatang-baru yang user minta eksplisit.
- Lattice sudah dihapus (commit 39685af), v4 referensi 6 lab sudah benar minus catan ini.

**Architecture:** Educational in-repo TS implementation dengan exposed internal state. Tidak ada dependency crypto library — karena library production sengaja sembunyikan rounds (alasan keamanan), kita butuh kebalikannya untuk pengajaran. Pakai BigInt browser-native untuk RSA, pakai Web Crypto **hanya** untuk SHA-256 (karena hash tidak punya "rounds" yang perlu divisualkan untuk learner — bisa ditambah nanti).

**Tech Stack:** TypeScript, BigInt, Vitest, React, Tailwind, shadcn/ui.

**Timeline:** 13 hari kerja fokus. Bisa di-pause antar fase.

---

## Onboarding Requirement (NEW — driven by user)

Setiap lab harus punya elemen ini di UI:

1. **"Apa ini?" panel** — 2-3 kalimat: algoritma apa, kategorinya apa, kapan dipakai sejarahnya, kenapa penting.
2. **"Langkah pertama" panel** — instruksi eksplisit: "Coba klik tombol [Contoh] dulu, lalu tekan Play untuk lihat algoritma jalan."
3. **Tooltip per-input** — apa itu plaintext, apa itu key, apa itu mode encrypt vs decrypt, dengan contoh.
4. **Glossary istilah** — modal/sheet dengan istilah teknis (S-box, round, key schedule, modulus, dll) yang muncul di lab tsb.
5. **Step description** — setiap step di timeline punya penjelasan plain-Indonesian: "Apa yang terjadi", "Kenapa", "Apa input dan output step ini".
6. **Tombol [Reset], [Contoh], [Acak]** — 3 cara cepat untuk mulai eksplorasi tanpa harus mengerti format input.
7. **"Mode pemula vs mahir"** — toggle. Pemula: parameter kecil, visualisasi penuh, banyak penjelasan. Mahir: parameter realistis, visualisasi compact.

---

## Files Likely To Change

```
Created:
  resources/js/features/labs/types.ts                       (structured step types)
  resources/js/features/labs/codecs.ts                      (multi-format I/O)
  resources/js/features/labs/algorithms/caesar.ts
  resources/js/features/labs/algorithms/vigenere.ts
  resources/js/features/labs/algorithms/aes128.ts
  resources/js/features/labs/algorithms/aes128-tables.ts    (S-box, Rcon)
  resources/js/features/labs/algorithms/des.ts
  resources/js/features/labs/algorithms/des-tables.ts       (IP, FP, PC1, PC2, S-boxes, etc.)
  resources/js/features/labs/algorithms/rsa.ts              (BigInt)
  resources/js/features/labs/algorithms/bigint-math.ts      (gcd, egcd, modInverse, modPow, Miller-Rabin)
  resources/js/features/labs/algorithms/sha256.ts           (Web Crypto wrapper)
  resources/js/features/labs/algorithms/digital-signature.ts
  resources/js/features/labs/components/onboarding-panel.tsx
  resources/js/features/labs/components/glossary-sheet.tsx
  resources/js/features/labs/components/state-matrix-view.tsx
  resources/js/features/labs/components/feistel-round-view.tsx
  resources/js/features/labs/components/key-schedule-view.tsx
  resources/js/features/labs/components/byte-grid.tsx
  resources/js/features/labs/components/avalanche-demo.tsx
  resources/js/features/labs/glossary-content.ts            (istilah Indonesia)
  resources/js/features/labs/__tests__/*.test.ts            (KAT + property tests)

Modified:
  resources/js/lib/lab-simulations.ts                       (compat shim, eventual delete)
  resources/js/pages/labs/show.tsx                          (use new feature modules)
  resources/js/types/labs.ts                                (extend SimulationResult)
  config/labs.php                                           (titles: "AES-128", "RSA Edukatif")
  PROJECT_CONTEXT.md                                        (update glass-box claim)

Untouched (out of scope):
  app/Http/Controllers/* (kecuali kalau seedling perlu)
  database/*
  Auth, admin, course modules
```

---

## Definition Of Done (Definisi Selesai)

- [ ] AES-128: NIST FIPS-197 KAT pass + per-round state matrix viewable
- [ ] DES: Stallings test vector pass + per-round L/R viewable
- [ ] RSA: visible key generation + Miller-Rabin step + encrypt/decrypt round-trip (100 random inputs)
- [ ] Signature: SHA-256 asli + RSA sign + verify menerima signature input + tamper detection
- [ ] Caesar + Vigenere: byte mode + property test (encrypt∘decrypt=identity)
- [ ] Setiap lab punya 7 elemen onboarding di atas
- [ ] Avalanche demo tersedia untuk AES dan DES
- [ ] PROJECT_CONTEXT.md + plan menyebut glass-box dengan klaim jujur
- [ ] Vitest pass + Pest pass + ESLint clean + tsc clean + build sukses
- [ ] Setiap fase di-commit dengan message yang jelas


---

## Phase 0 — Safety Gate (½ hari, sebelum nulis kode)

### T0.1 — Branch + Baseline Snapshot
- Buat branch `feat/labs-glass-box-v5` dari `main`.
- Run baseline tests: `npm run test:unit && php artisan test --compact` → simpan output ke `.hermes/plans/baseline-v5.txt`.
- Verifikasi: semua test hijau sebelum mulai. Kalau ada yang merah, fix dulu di main, jangan mulai dari basis broken.

### T0.2 — Audit Out-Of-Scope
- Konfirmasi tidak ada PR/branch lain yang sedang sentuh `resources/js/lib/lab-simulations.ts`, `resources/js/pages/labs/`, atau `config/labs.php`.
- Cek `git log --since='1 week ago' -- resources/js/pages/labs/` → kalau ada kerja paralel, koordinasi dulu.

### T0.3 — TA Document Sync
- Buka `ta-elearning-kriptografi.txt`. Tandai pasal yang perlu direvisi paralel:
  - Bab I: rumusan masalah (drop klaim "implementasi penuh AES-128 produksi")
  - Bab II: landasan teori (sebut KAT/FIPS-197 sebagai bukti correctness)
  - Bab III: metodologi (sebut TDD + KAT validation)
  - Bab IV: skenario pengujian (tambah NIST/Stallings vector verification)
- Saya draft revisi setiap selesai fase, Anda finalize.

**End-of-Phase 0 commit:** `chore(labs): baseline snapshot + safety gate for v5 rewrite`

---

## Phase 1 — Foundation Layer (Day 1)

### T1.1 — Define structured types
**File:** `resources/js/features/labs/types.ts` (NEW)

**Step 1 — Write test first**

```ts
// resources/js/features/labs/__tests__/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type { LabStep, LabSimulationResult, LabFormat, ParsedLabInput } from '../types';

describe('lab types', () => {
  it('LabStep allows matrix kind with 2D string array', () => {
    const step: LabStep = {
      id: 's1', title: 'AddRoundKey', description: 'XOR state with round key',
      kind: 'state-matrix', matrix: [['1f','2a'],['3b','4c']],
    };
    expectTypeOf(step.matrix).toEqualTypeOf<string[][] | undefined>();
  });
  it('LabSimulationResult carries warnings array', () => {
    const r: LabSimulationResult = {
      output: { label:'ct', bytes:[1], text:'a', preferredFormat:'hex' },
      steps: [], warnings: [],
    };
    expectTypeOf(r.warnings).toEqualTypeOf<string[]>();
  });
});
```

**Step 2 — Run → expect TS error karena types belum ada**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep types.test
```

**Step 3 — Implement minimal types** (lihat scope `LabStep` di plan v4 lama, tambah `description`, `inputLabel`, `outputLabel` per step untuk onboarding)

**Step 4 — Run test → pass**

**Step 5 — Commit:** `feat(labs): structured types for glass-box simulation`

### T1.2 — Codec layer (parse/render 8 formats)
**File:** `resources/js/features/labs/codecs.ts` (NEW)

8 format: `text`, `ascii`, `utf8`, `hex`, `binary`, `base64`, `decimal-bytes`, `integer-blocks`.

**TDD per-format:**

```ts
// __tests__/codecs.test.ts
it('parses hex with spaces and odd-length rejection', () => {
  expect(parseLabInput('48 65 6C 6C 6F', 'hex').bytes).toEqual([72,101,108,108,111]);
  expect(parseLabInput('48F', 'hex').error).toMatch(/even/);
});
it('renders bytes to binary as 8-bit groups', () => {
  expect(renderLabOutput({bytes:[0x48,0x69]}, 'binary')).toBe('01001000 01101001');
});
it('round-trips ascii→hex→ascii', () => {
  const parsed = parseLabInput('Hello', 'ascii');
  const rendered = renderLabOutput({bytes: parsed.bytes}, 'hex');
  const reparsed = parseLabInput(rendered, 'hex');
  expect(new TextDecoder().decode(Uint8Array.from(reparsed.bytes))).toBe('Hello');
});
```

**Acceptance:**
- 100 random byte arrays round-trip lewat semua 8 format.
- Invalid input return `error` string yang jelas, tidak throw.
- `decimal-bytes` reject value >255 dan negative.

**Commit:** `feat(labs): codec layer with 8 format round-trip support`

### T1.3 — Onboarding component scaffolds
**Files:**
- `resources/js/features/labs/components/onboarding-panel.tsx` — "Apa ini?" + "Langkah pertama"
- `resources/js/features/labs/components/glossary-sheet.tsx` — Sheet/Modal dengan glossary
- `resources/js/features/labs/glossary-content.ts` — istilah per-lab dalam Indonesia

**Onboarding panel props:**
```ts
type OnboardingPanelProps = {
  whatIsIt: string;          // 2-3 kalimat
  whyImportant: string;
  firstSteps: string[];      // ["Klik [Contoh]", "Tekan Play", ...]
  glossaryKeys: string[];    // untuk highlight istilah di panel
};
```

**Test (smoke + a11y):**
```tsx
it('renders all sections', () => {
  render(<OnboardingPanel whatIsIt="..." whyImportant="..." firstSteps={['x','y']} glossaryKeys={[]} />);
  expect(screen.getByText(/apa ini/i)).toBeInTheDocument();
  expect(screen.getByText(/langkah pertama/i)).toBeInTheDocument();
});
```

**Commit:** `feat(labs): onboarding panel + glossary sheet scaffolds`

**End-of-Day 1:** push branch, pause untuk review.

