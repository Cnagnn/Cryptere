# Glass Box UI Plan — Cryptere Lab Visualization

> Plan ini menentukan cara merender visualisasi state internal algoritma kriptografi
> secara transparan dari perspektif beginner-friendly DAN expert-friendly.

## Status Saat Ini

- `show.tsx` (862 baris): render `SimulationResult.steps` sebagai text + tabel 3 kolom generik
- 6 komponen visualisasi sudah dibuat (`AesStateMatrix`, `DESFeistelView`, `Sha256RoundView`, `RsaKeyGenView`, `CaesarBruteForce`, `AvalancheDemo`) — TAPI belum diintegrasikan ke `show.tsx`
- Trace data (`AesTrace`, `DesTrace`, `Sha256Trace`, `RsaKeyGenTrace`) tersedia di algorithm modules
- `SimulationResult` sekarang return `steps: string[]` + optional `trace?: AlgorithmTrace`

## Prinsip Desain

### Beginner-Friendly
- Penjelasan verbal step-by-step dalam Bahasa Indonesia
- Konsep abstrak dijelaskan dengan analogi sederhana
- Progress bar + walkthrough player untuk navigasi
- Color coding untuk membedakan komponen (e.g., S-box = merah, key = biru)

### Expert-Friendly
- State matrix per round bisa di-expand
- Hex + binary representation tersedia
- Working variables lengkap (a-h di SHA-256, L/R di DES)
- KAT (Known Answer Test) bisa diverifikasi

### Progressive Disclosure
- Default: penjelasan naratif + visualisasi high-level
- Expand: detail teknis per sub-operasi
- Toggle: beginner mode vs expert mode

---

## Komponen UI yang Perlu Dibuat/Diedit

### 1. `GlassBoxPlayer.tsx` — Walkthrough Engine (BARU)

Central component yang orchestrate semua visualisasi. Props:
```typescript
type GlassBoxPlayerProps = {
    steps: string[]; // narasi per step
    activeStepIndex: number;
    onStepChange: (index: number) => void;
    learnerMode: 'pemula' | 'mahir';
    // Optional structured traces per algorithm
    aesTrace?: AesTrace;
    desTrace?: DesTrace;
    sha256Trace?: Sha256Trace;
    rsaKeys?: RsaKeyGenTrace;
    signatureResult?: RsaSignatureResult | RsaVerifyResult;
    mode: SimulationMode; // untuk label encrypt/decrypt/sign/verify
    slug: string; // lab identifier
};
```

Fungsi:
- Render step narration panel (collapse/expand berdasarkan mode)
- Orchestrate visualisasi spesifik berdasarkan `slug`
- Progress bar + step counter
- Walkthrough auto-play dengan interval konfigurabel
- Swipe gesture support

### 2. `StepNarrator.tsx` — Penjelasan Verbal (BARU)

Render setiap step sebagai:
- Judul step (bold, 1 baris)
- Penjelasan naratif (2-3 baris, Bahasa Indonesia)
- Callout box untuk operasi matematis penting
- Tooltip/glossary link untuk istilah teknis

Contoh output:
```
🔐 Langkah 4: SubBytes (Substitusi Byte)
Plaintext byte {63} lookup di S-box → {C4}
Setiap byte diganti melalui tabel substitusi nonlinear.
→ S-box dirancang agar nonlinearity maximum untuk resistensi against differential cryptanalysis.
```

### 3. `LearnerModeToggle.tsx` — Toggle Pemula/Mahir (BARU)

Simple toggle button group dengan 2 opsi:
- **Pemula**: Expand level rendah, semua penjelasanverbose, istilah teknis di-glossary
- **Mahir**: Compact, state matrix detail, hex+binary, technical labels

### 4. `GlossaryTooltip.tsx` — Istilah Teknis (BARU)

Tooltip component yang muncul saat hover/click istilah teknis. Pakai Radix Tooltip atau Popover.

Istilah yang perlu glossari per lab:

**AES:**
- S-box, SubBytes, ShiftRows, MixColumns, AddRoundKey, KeyExpansion, Rcon, GF(2^8), State Matrix, Round Key

**DES:**
- Feistel Structure, L/R Halves, S-box, Expansion E, Permutation P, PC-1, PC-2, Parity Bits, Initial/Final Permutation

**SHA-256:**
- Merkle-Damgård construction, Message Schedule, Working Variables (a-h), Ch/Maj functions, Round Constant (K), Compression Function

**RSA:**
- Modulo, Modular Exponentiation, Euler's Totient φ(n), Extended Euclidean Algorithm, Public/Private Key, Coprime, Prime Factorization

**Signature:**
- Hash Function, Collision Resistance, Preimage Resistance, HMAC vs Signature, Authenticity, Integrity, Non-repudiation

### 5. Integrasi `show.tsx` — Render Engine (EDIT)

`show.tsx` perlu di-edit untuk:
- Import dan render `GlassBoxPlayer` + `StepNarrator`
- Branch berdasarkan `lab.slug` untuk komponen visualisasi spesifik
- Pass `aesTrace`, `desTrace`, `sha256Trace` sebagai props
- Update `translateText` untuk istilah teknis baru
- Tambah glossary entry di i18n

---

## Visualisasi Per Algoritma

### Caesar & Vigenère

**Current state:** Tabel 3 kolom generik sudah cukup. Upgrade minor:
- Tambah visualisasi tabula recta untuk Vigenère
- Tambah "Brute-force mode" button (pakai `CaesarBruteForce` component)

**Upgrade:**
```tsx
// Caesar — tambah frequency bar chart
<CaesarBruteForce ciphertext={rawResult.output} />

// Vigenère — tambah tabula recta visualization
<div className="grid grid-cols-26 gap-0.5 text-xs">
  {ALPHABET.split('').map((letter, colIdx) =>
    <div key={colIdx} className="text-center font-mono">{letter}</div>
  )}
  {ALPHABET.split('').map((rowLetter, rowIdx) =>
    ALPHABET.split('').map((colLetter, colIdx) => {
      const shift = colIdx;
      const result = shiftChar(rowLetter, shift);
      return <div key={`${rowIdx}-${colIdx}`}>{result}</div>;
    })
  )}
</div>
```

### AES

**Visualisasi yang perlu dirender:**

1. **State Matrix 4×4** — grid dengan column-major order, setiap cell:
   - Decimal value (bold)
   - Hex representation
   - Color coding: yang berubah highlight merah

2. **Per-Round State Transitions** — tampilkan 5 state per round:
   - `stateBefore` → `afterSubBytes` → `afterShiftRows` → `afterMixColumns` → `afterAddRoundKey`
   - Arrow/antara state transitions

3. **Round Key Visualization** — tampilkan 16-byte round key dengan hex

4. **S-box Lookup Demo** — untuk beginner, tampilkan:
   ```
   Input byte {63} → row=3 col=15 → S-box[3][15] = {C4}
   ```

**Pemula mode:** Tampilkan 1 round penuh dengan label SubBytes/ShiftRows/MixColumns/AddRoundKey + penjelasan.
**Mahir mode:** Tampilkan semua 10 round di grid, bisa expand per round.

```tsx
// Di dalam GlassBoxPlayer untuk aes-lab:
<div className="space-y-4">
  {/* Key Expansion Overview */}
  <Card>
    <CardHeader>
      <CardTitle>Key Expansion — 11 Round Keys</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-11 gap-1">
        {trace.keySchedule.map((rk, i) => (
          <Tooltip key={i} content={`K${i}: ${bytesToHex(rk)}`}>
            <Badge variant="outline" className="font-mono text-xs">
              K{i}
            </Badge>
          </Tooltip>
        ))}
      </div>
    </CardContent>
  </Card>

  {/* Active Round State Matrix */}
  {activeRound && (
    <div className="space-y-3">
      {/* State before this round */}
      <AesStateMatrix
        state={activeRound.stateBefore}
        highlightBytes={getChangedBytes(activeRound.stateBefore, activeRound.afterSubBytes)}
        title={`Round ${activeRound.roundIndex}: Before SubBytes`}
      />

      {/* After SubBytes — S-box substitution */}
      <AesStateMatrix
        state={activeRound.afterSubBytes}
        title="After SubBytes (S-box lookup)"
      />

      {/* After ShiftRows */}
      <AesStateMatrix
        state={activeRound.afterShiftRows}
        title="After ShiftRows (row-wise byte rotation)"
      />

      {/* After MixColumns */}
      {activeRound.roundIndex < 10 && (
        <AesStateMatrix
          state={activeRound.afterMixColumns}
          title="After MixColumns (GF(2^8) column multiplication)"
        />
      )}

      {/* After AddRoundKey */}
      <AesStateMatrix
        state={activeRound.afterAddRoundKey}
        title="After AddRoundKey (XOR with round key)"
      />

      {/* Round key detail */}
      <div className="text-xs text-muted-foreground">
        Round Key K{activeRound.roundIndex}: {bytesToHex(activeRound.roundKey)}
      </div>
    </div>
  )}
</div>
```

### DES

**Visualisasi yang perlu dirender:**

1. **Initial Permutation** — 64-bit input → 64-bit output (IP permutation table visualization)

2. **L/R Halves Split** — dua panel untuk L dan R, masing-masing 32 bit:
   ```
   L0: 1111000011001100101010101111...  R0: 1010101111000000111100110011...
   ```

3. **Per-Round Feistel Flow:**
   - L[i] = R[i-1]
   - R[i] = L[i-1] XOR f(R[i-1], K[i])
   - f-function breakdown: E → XOR → S-boxes → P

4. **F-Function Detail** — expandable panel:
   ```
   E-expansion: R[3] → [R3|R2|R1|R0|R3|R2|R1] (32→48 bits)
   XOR with K[i]: E(R) ⊕ K[i]
   S-box S1: 6 input bits → 4 output bits × 8 boxes
   Permutation P: rearrange 32 output bits
   ```

**Pemula mode:** Tampilkan L/R halves dengan animated swap per round.
**Mahir mode:** Tampilkan E-expansion, XOR, S-box lookup, P-permutation detail.

### SHA-256

**Visualisasi yang perlu dirender:**

1. **Padding Visualization** — tampilkan bit manipulation:
   ```
   Message: "abc" = 0x616263
   Padding: 0x80 + 0x00... + 64-bit length
   Padded: 61626380 00000000 ... 00000018
   ```

2. **Message Schedule W[t]** — 64-word array dengan highlight untuk W[t] yang sedang diproses

3. **Working Variables a-h** — 8 register dengan color coding:
   - Group 1 (a-d): blue/purple (compression function)
   - Group 2 (e-h): orange/red (modulo addition + key/material mixing)

4. **Per-Round Computation:**
   ```
   T1 = h + Σ1(e) + Ch(e,f,g) + K[t] + W[t]
   T2 = Σ0(a) + Maj(a,b,c)
   new{e,d,c} = {g, f, e, d, c + T1, b, a, T1 + T2}
   ```

### RSA

**Visualisasi yang perlu dirender:**

1. **Key Generation Flow** — card-based stepper:
   ```
   [p = 61] → [q = 53] → [n = p×q = 3233]
              → [φ = (p-1)(q-1) = 3120]
              → [e = 17, gcd(17, φ) = 1 ✓]
              → [d = e⁻¹ mod φ = 2753]
   ```

2. **Extended Euclidean Table** — tampilkan setiap langkah:
   ```
   ┌─────┬─────┬─────┬─────┬─────┬─────┐
   │  a  │  b  │  q  │  r  │  s  │  t  │
   ├─────┼─────┼─────┼─────┼─────┼─────┤
   │ 3120│  17│ 183│  9 │  1  │ -183│
   │   17│   9│   1│   8 │  0  │  1 │
   │    9│   8│   1│   1 │  1  │ -1  │
   │ ... │ ... │ ... │ ... │ ... │ ... │
   └─────┴─────┴─────┴─────┴─────┴─────┘
   ```

3. **Modular Exponentiation (square-and-multiply):**
   ```
   Untuk encrypt 'H' (m=72):
   72^17 mod 3233
   = 72^1 × 72^0 × 72^0 × 72^0 × 72^16
   = ...
   = 3000
   ```

### Digital Signature

**Visualisasi yang perlu dirender:**

1. **SHA-256 Hash Generation** — tampilkan:
   ```
   Message: "Hello World"
   SHA-256 digest: 0xA591A606... (64 hex chars)
   First 4 chars: "A591" → integer 42257
   ```

2. **Signing dengan Private Key:**
   ```
   signature = digest^2753 mod 3233
            = 42257^2753 mod 3233
            = 2790
   ```

3. **Verification dengan Public Key:**
   ```
   recovered_digest = 2790^17 mod 3233
                   = 42257
   recovered_digest == computed_digest?
                   = TRUE ✓
   ```

---

## Struktur File Plan

```
resources/js/features/labs/
├── components/                          (sudah ada, perlu dirender)
│   ├── AesStateMatrix.tsx
│   ├── DESFeistelView.tsx
│   ├── Sha256RoundView.tsx
│   ├── RsaKeyGenView.tsx
│   ├── CaesarBruteForce.tsx
│   └── AvalancheDemo.tsx
│
├── ui/                                  (BARU — orchestration layer)
│   ├── GlassBoxPlayer.tsx               # Main orchestrator
│   ├── StepNarrator.tsx                # Verbal explanations
│   ├── LearnerModeToggle.tsx            # Toggle pemula/mahir
│   ├── GlossaryTooltip.tsx             # Istilah teknis
│   ├── GlossarySheet.tsx               # Full glossary modal
│   ├── GlossaryContent.ts              # Semua istilah (Indonesia)
│   ├── visualization/                   # Sub-components per algorithm
│   │   ├── aes/
│   │   │   ├── AesKeyExpansion.tsx     # 11 round keys
│   │   │   ├── AesRoundDetail.tsx      # Per-round state transition
│   │   │   ├── AesSboxLookup.tsx       # S-box demo untuk pemula
│   │   │   └── AesOverview.tsx        # High-level AES overview
│   │   ├── des/
│   │   │   ├── DesInitialPermutation.tsx
│   │   │   ├── DesFeistelRound.tsx     # Per-round Feistel
│   │   │   ├── DesFFunction.tsx        # f-function detail
│   │   │   └── DesSboxTable.tsx        # Interactive S-box lookup
│   │   ├── sha256/
│   │   │   ├── Sha256Padding.tsx       # Bit-level padding
│   │   │   ├── Sha256RoundVars.tsx     # a-h working variables
│   │   │   └── Sha256Digest.tsx        # Final hash
│   │   ├── rsa/
│   │   │   ├── RsaKeyGenFlow.tsx      # p→q→n→φ→e→d
│   │   │   ├── RsaExtEuclideanTable.tsx # Extended Euclid
│   │   │   └── RsaModPowTrace.tsx      # Square-and-multiply
│   │   └── signature/
│   │       ├── SignatureHashStep.tsx   # SHA-256 generation
│   │       ├── SignatureSignStep.tsx    # Signing with private key
│   │       └── SignatureVerifyStep.tsx  # Verification
│   └── shared/
│       ├── BinaryDisplay.tsx           # Bit array renderer
│       ├── HexDisplay.tsx              # Byte array renderer
│       ├── StepBadge.tsx               # Step number + type badge
│       ├── OperationLabel.tsx          # Colored op labels
│       └── CollapsibleDetail.tsx       # Expand/collapse wrapper
│
├── __tests__/glass-box/                 # (BARU)
│   ├── GlassBoxPlayer.test.tsx
│   ├── StepNarrator.test.tsx
│   ├── GlossaryContent.test.ts
│   └── visualization/
│       ├── AesKeyExpansion.test.tsx
│       ├── DesFeistelRound.test.tsx
│       └── ...
│
└── i18n/                               # (BARU — glossary terms)
    └── glossary-id.ts                  # Istilah teknis Bahasa Indonesia
```

---

## Edit ke `show.tsx`

### Strategi: Progressive Enhancement

**TIDAK rewrite** `show.tsx` total. Lakukan surgical edits:

1. **Edit 1 — Import components baru:**
   ```tsx
   import GlassBoxPlayer from '@/features/labs/ui/GlassBoxPlayer';
   import GlossaryContent from '@/features/labs/ui/GlossaryContent';
   ```

2. **Edit 2 — Tambah state untuk learner mode:**
   ```tsx
   const [learnerMode, setLearnerMode] = useState<'pemula' | 'mahir'>('pemula');
   ```

3. **Edit 3 — Ambil trace dari rawResult:**
   ```tsx
   const aesTrace = rawResult.aesTrace;
   const desTrace = rawResult.desTrace;
   // dll
   ```

4. **Edit 4 — Ganti section "Proses Bertahap":**
   ```tsx
   <Card className="lg:col-span-8">
     {/* Learner mode toggle */}
     <LearnerModeToggle value={learnerMode} onChange={setLearnerMode} />

     {/* Glossary button */}
     <GlossarySheet glossary={GlossaryContent[lab.slug]} />

     {/* Main player */}
     <GlassBoxPlayer
       steps={translatedSteps}
       activeStepIndex={safeActiveStepIndex}
       onStepChange={setActiveStepIndex}
       learnerMode={learnerMode}
       slug={lab.slug}
       mode={mode}
       aesTrace={aesTrace}
       desTrace={desTrace}
       sha256Trace={sha256Trace}
       rsaKeys={rsaKeys}
       signatureResult={signatureResult}
     />
   </Card>
   ```

5. **Edit 5 — Update translateText:**
   Tambahkan glossary terms ke dictionary `translateText`.

---

## Learner Mode Design

### Pemula Mode (default)
- Steps di-expand semua dengan narasi verbose Bahasa Indonesia
- Visualisasi high-level (state matrix tanpa detail per-byte)
- Glossary aktif (hover tooltip untuk istilah teknis)
- Animasi transisi antar state
- Callout box untuk "Mengapa ini penting?"

### Mahir Mode
- Steps compact, teknis
- State matrix detail (decimal + hex + binary per byte)
- Extended Euclidean table lengkap untuk RSA
- Working variables a-h untuk SHA-256
- S-box table untuk DES
- KAT verification ready

### Toggle Implementation
```tsx
<ButtonGroup value={learnerMode} onChange={setLearnerMode}>
  <Button value="pemula">
    <BookOpen className="mr-2 h-4 w-4" />
    Pemula
  </Button>
  <Button value="mahir">
    <Code className="mr-2 h-4 w-4" />
    Mahir
  </Button>
</ButtonGroup>
```

---

## Progressive Disclosure Pattern

Setiap lab punya 3-level disclosure:

```
Level 1 — Overview (selalu terlihat)
  ┌──────────────────────────────────────────┐
  │  "AES-128: 16-byte block, 128-bit key  │
  │  Plaintext → [10 rounds] → Ciphertext   │
  └──────────────────────────────────────────┘

Level 2 — Per-Round (expandable)
  ┌──────────────────────────────────────────┐
  │  Round 1: S-box, Shift, Mix, AddKey     │
  │  State Matrix: [4×4 bytes]              │
  │  [▶ expand for details]                │
  └──────────────────────────────────────────┘

Level 3 — Per-Sub-operation (expert only)
  ┌──────────────────────────────────────────┐
  │  SubBytes: byte {63} → S[3][15] = {C4}  │
  │  ShiftRows: row1 << 1, row2 << 2, ...   │
  │  MixColumns: GF(2^8) multiplication       │
  └──────────────────────────────────────────┘
```

Implementasi: pakai `Collapsible` dari Radix/shadcn:
```tsx
<Collapsible open={learnerMode === 'mahir'}>
  <CollapsibleTrigger>Show expert details</CollapsibleTrigger>
  <CollapsibleContent>
    {/* Level 3 content */}
  </CollapsibleContent>
</Collapsible>
```

---

## Glossary Content (Daftar Istilah per Lab)

### AES (Indonesian)

| Key | Term | Definition | Example |
|-----|------|-------------|---------|
| s-box | S-box (Substitution Box) | Tabel lookup 256 entry yang mengganti setiap byte dengan byte lain secara nonlinear | Input {63} → S-box[63] = {C4} |
| shift-rows | ShiftRows | Operasi AES yang merotasi byte per baris state matrix: baris 0 shift 0, baris 1 shift 1, baris 2 shift 2, baris 3 shift 3 | — |
| mix-columns | MixColumns | GF(2^8) matrix multiplication untuk mencampur byte dalam setiap kolom | — |
| add-round-key | AddRoundKey | XOR state dengan round key | — |
| key-expansion | Key Expansion | Prosedur menurunkan 11 round key dari kunci utama 128-bit | — |
| rcon | Rcon (Round Constant) | Konstanta per round untuk key expansion AES | Rcon[1] = 0x01, Rcon[2] = 0x02 |
| gf-28 | GF(2^8) | Galois Field dengan 256 elemen untuk operasi MixColumns | 2 × 3 = 6 dalam GF(2^8) |
| state-matrix | State Matrix | Array 4×4 byte yang merepresentasikan blok data di AES | Baris pertama: b0,b1,b2,b3 |

### DES

| Key | Term | Definition |
|-----|------|-------------|
| feistel | Feistel Structure | Arsitektur cipher yang membagi blok menjadi L dan R, update R dengan f(R,K), swap |
| expansion-e | Expansion E | Permutasi yang memperluas 32-bit menjadi 48-bit untuk XOR dengan round key |
| s-box-des | S-box DES | 8 tabel lookup 4×16 yang merupakan satu-satunya sumber nonlinearity di DES |
| parity-bit | Parity Bit | Bit ke-8 setiap byte kunci DES untuk error detection |
| ip-fp | Initial/Final Permutation | Permutasi bit pada awal dan akhir DES (bukan bagian dari kriptografi — warisan desain) |

### SHA-256

| Key | Term | Definition |
|-----|------|-------------|
| merkle-damgard | Merkle-Damgård | Konstruksi hash yang memproses pesan per blok 512-bit dengan fungsi kompresi | — |
| compression | Compression Function | Fungsi yang mengubah 256-bit state + 512-bit message block menjadi 256-bit new state | — |
| ch-maj | Ch & Maj Functions | Ch(x,y,z) = (x∧y)⊕(¬x∧z), Maj(x,y,z) = (x∧y)⊕(x∧z)⊕(y∧z) |
| round-constant | Round Constant K[t] | Konstanta per round SHA-256 (fractional parts of cube roots of first 64 primes) |
| collision-resistance | Collision Resistance | Properti hash di mana dua input berbeda tidak bisa menghasilkan output sama | — |
| preimage | Preimage Resistance | Properti hash di mana given h, tidak bisa find m where hash(m) = h | — |

### RSA

| Key | Term | Definition |
|-----|------|-------------|
| phi | φ(n) Euler's Totient | Jumlah bilangan < n yang coprime dengan n. Untuk n=p×q, φ(n)=(p-1)(q-1) |
| coprime | Coprime / Relatively Prime | Dua bilangan yang gcd(a,b) = 1 |
| ext-euclidean | Extended Euclidean Algorithm | Algoritma untuk mencari x,y where ax+by=gcd(a,b) — dipakai untuk cari d = e⁻¹ mod φ(n) |
| modular-inverse | Modular Inverse | Bilangan x where a×x ≡ 1 (mod n) |
| square-multiply | Square-and-Multiply | Algoritma efisien untuk hitung a^e mod n dalam O(log e) bukan O(e) |
| trapdoor | Trapdoor Function | Fungsi yang mudah di satu arah tapi sulit dibalik tanpa informasi rahasia | — |

---

## Phased Implementation Plan

### Phase 1 — Foundation UI (1-2 jam)

1. Buat `LearnerModeToggle.tsx` — toggle button group
2. Buat `GlossaryContent.ts` — semua istilah per lab (data)
3. Buat `GlossarySheet.tsx` — full glossary modal
4. Buat `GlossaryTooltip.tsx` — inline tooltip
5. Buat `StepNarrator.tsx` — verbal step renderer
6. Edit `show.tsx` — tambah learner mode state + toggle

### Phase 2 — AES Visualization (2-3 jam)

1. Buat `AesKeyExpansion.tsx` — 11 round keys overview
2. Buat `AesRoundDetail.tsx` — per-round state transition
3. Buat `AesSboxLookup.tsx` — S-box demo untuk beginner
4. Buat `AesOverview.tsx` — high-level AES flow
5. Buat `GlassBoxPlayer.tsx` — orchestrator dengan AES branch
6. Edit `show.tsx` — render GlassBoxPlayer untuk aes-lab
7. Test + lint

### Phase 3 — DES Visualization (2-3 jam)

1. Buat `DesInitialPermutation.tsx`
2. Buat `DesFeistelRound.tsx` — L/R halves + f-function
3. Buat `DesFFunction.tsx` — E-expansion + XOR + S-box + P
4. Buat `DesSboxTable.tsx` — interactive S-box lookup
5. Edit `GlassBoxPlayer.tsx` — add DES branch
6. Edit `show.tsx` — render untuk des-lab
7. Test + lint

### Phase 4 — SHA-256 & RSA Visualization (2-3 jam)

1. Buat `Sha256Padding.tsx`
2. Buat `Sha256RoundVars.tsx` — a-h with color coding
3. Buat `Sha256Digest.tsx`
4. Buat `RsaKeyGenFlow.tsx` — card-based stepper
5. Buat `RsaExtEuclideanTable.tsx`
6. Buat `RsaModPowTrace.tsx`
7. Buat `SignatureHashStep.tsx`, `SignatureSignStep.tsx`, `SignatureVerifyStep.tsx`
8. Edit `GlassBoxPlayer.tsx` — add SHA-256 + RSA + Signature branches
9. Edit `show.tsx` — render untuk sha256/rsa/signature labs
10. Test + lint

### Phase 5 — Polish & Integration (1-2 jam)

1. Update `translateText` di `show.tsx` untuk glossary terms
2. Animasi transisi antar state (framer-motion sudah ada di deps)
3. Mobile responsive check
4. Accessibility (keyboard navigation, ARIA labels)
5. Full test suite
6. Smoke test manual

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| show.tsx jadi terlalu besar (862 → 1500+ lines) | Split jadi sub-components. show.tsx hanya orchestrate, bukan render semua detail |
| Glossary terms harus di-i18n Bahasa Indonesia | Buat dedicated `glossary-id.ts` file, bukan di translateText regex |
| LearnerMode state perlu persist across visits | Pakai URL param (?mode=pemula) atau localStorage |
| Animasi berat di mobile | Framer-motion already available, pakai `lazy` loading |
| Step index tidak sync dengan trace rounds | GlassBoxPlayer hitung mapping: step → round berdasarkan slug |

---

## Komponen shadcn/ui yang Dipakai

- `Card`, `CardHeader`, `CardTitle`, `CardContent` — container utama
- `Badge` — step type labels
- `Button`, `ButtonGroup` — toggle, navigation
- `Collapsible` — progressive disclosure
- `Tooltip` — glossary inline
- `Sheet` — full glossary modal
- `Progress` — sudah ada, untuk step progress
- `Table` — extended Euclidean table, S-box tables
- `Tabs` — toggle views
- `Separator` — visual divider
- `Alert` — callout untuk "Mengapa penting?"

---

## Verification Checklist

- [ ] Semua 6 lab render visualisasi yang sesuai
- [ ] Toggle pemula/mahir berfungsi dengan smooth transition
- [ ] Glossary tooltip muncul untuk istilah teknis
- [ ] Step navigation (prev/next/play) berfungsi
- [ ] Mobile responsive (min 375px width)
- [ ] Keyboard navigation (Tab, Enter, Arrow keys)
- [ ] ESLint clean
- [ ] Vitest pass
- [ ] No TypeScript errors
- [ ] KAT vectors masih pass (AES: 69C4E0D8..., DES: 85E81354..., SHA-256: 3 vectors)
- [ ] Backward compatible: existing test assertions tidak broken
