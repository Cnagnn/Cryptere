# Glass Box UI — Perfected Plan

## Revisi Berdasarkan Kritik

### Apa yang Salah dari Plan Lama
1. ❌ 17+ komponen baru (over-engineering)
2. ❌ Edit langsung show.tsx tanpa arsitektur data
3. ❌ Effort underestimate (10 jam → реально 20+ jam)
4. ❌ Tidak specify bagaimana trace data sampai komponen
5. ❌ Glossary per istilah-too-much (tooltip interrupt flow)
6. ❌ show.tsx 862 baris + open heart surgery

### Apa yang Dipertahankan
1. ✅ Progressive disclosure (3 level)
2. ✅ Learner mode toggle
3. ✅ Phase-by-phase approach
4. ✅ Shadcn components yang sudah ada
5. ✅ Pakai komponen yang sudah dibuat (AesStateMatrix, dll)

---

## Arsitektur Final

```
┌─────────────────────────────────────────────────┐
│              show.tsx (container, 862 baris)         │
│  ❌ JANGAN edit kecuali 3 perubahan kecil          │
│  1. Import GlassBoxLab                           │
│  2. Render <GlassBoxLab slug={lab.slug} .../>    │
│  3. Pass props dari existing state                 │
└──────────────────┬──────────────────────────────┘
                   │ props
                   ▼
┌─────────────────────────────────────────────────┐
│  features/labs/pages/GlassBoxLab.tsx (BARU)       │
│  ~150 baris — HANYA orchestrator, TIDAK render  │
│                                                 │
│  - LearnerMode toggle (state)                   │
│  - Glossary sheet (trigger)                     │
│  - Step navigation (prev/next/play)            │
│  - Render AlgoVisualizer by slug               │
└──────────────────┬─────────────────────────────┘
                   │ slug + trace props
          ┌────────┼────────┬─────────┬────────┐
          ▼        ▼        ▼         ▼         ▼
    ┌─────────┐┌────────┐┌────────┐┌────────┐┌────────┐
    │AesPanel││DesPanel││RsaPanel││SigPanel││VigPanel│
    │(1 comp)││(1 comp)││(1 comp)││(1 comp)││(1 comp)│
    └─────────┘└────────┘└────────┘└────────┘└────────┘
```

**CATATAN:** Caesar dan Vigenère tidak butuh panel khusus — existing table cukup di-enhance.

### Prinsip YAGNI

| Lab | Komponen Baru | Yang Sudah Ada |
|-----|--------------|----------------|
| Caesar | 0 | Tabel 3 kolom + BruteForce panel |
| Vigenère | 0 | Tabel 3 kolom + frequency hint |
| AES | `AesPanel` (1 file) | `AesStateMatrix` |
| DES | `DesPanel` (1 file) | `DESFeistelView` |
| RSA | `RsaPanel` (1 file) | Steps yang sudah ada |
| Signature | `SignaturePanel` (1 file) | Steps yang sudah ada |

**Total: 4 komponen baru**, bukan 17+. Masing-masing ~100-150 baris.

---

## Arsitektur Data

### Extend SimulationResult

```typescript
// resources/js/types/labs.ts — edit sedikit

export type SimulationResult = {
    outputLabel: string;
    output: string;
    steps: string[];
    // NEW: Optional structured trace for visualization
    trace?: {
        aes?: import('@/features/labs/algorithms/aes').AesTrace;
        des?: import('@/features/labs/algorithms/des').DesTrace;
        sha256?: import('@/features/labs/algorithms/sha256').Sha256Trace;
        rsaKeys?: import('@/features/labs/algorithms/rsa').RsaKeyGenTrace;
        signature?: import('@/features/labs/algorithms/rsa').RsaSignatureResult | import('@/features/labs/algorithms/rsa').RsaVerifyResult;
    };
};
```

**Impact:** Ubah 4 fungsi di `lab-simulations.ts` untuk attach trace ke return value. Ini backward compatible — `trace` optional, existing code tidak break.

### Data Flow

```
lab-simulations.ts                          GlassBoxLab.tsx
───────────────────                       ─────────────────
runAesConcept()                            <GlassBoxLab
  └─ aesEncryptBlock()                     ├─ learnerMode
  └─ return {                             ├─ steps[]
        output,                            ├─ trace={aes: AesTrace}
        steps[],    ── pass ──►           ├─ slug
        trace: AesTrace                   └─ render AesPanel(trace, steps)
     }                                     ├─ navigate prev/next
```

Tidak ada state management baru di React. `GlassBoxLab` terima `trace` sebagai prop dari `show.tsx`.

---

## Learner Mode: Simplified

### State

```typescript
type LearnerMode = 'pemula' | 'mahir';

// Di GlassBoxLab props
interface GlassBoxLabProps {
    slug: string;
    steps: string[];
    trace?: SimulationResult['trace'];
    activeStep: number;
    onStepChange: (n: number) => void;
    learnerMode: LearnerMode;
    onModeChange: (m: LearnerMode) => void;
    labMode: SimulationMode; // encrypt/decrypt/sign/verify
}
```

### Toggle (Tiny)

```tsx
// Di GlassBoxLab
<div className="flex items-center gap-2 mb-3">
    <span className="text-sm text-muted-foreground">
        {learnerMode === 'pemula' ? '📘 Pemula' : '⚙️ Mahir'}
    </span>
    <Switch
        checked={learnerMode === 'mahir'}
        onCheckedChange={(v) => onModeChange(v ? 'mahir' : 'pemula')}
    />
</div>
```

BUKAN ButtonGroup atau ToggleGroup. SWITCH. Lebih clean.

### Progressive Disclosure: Simplified

Untuk AES, 3 mode tampilan:

```
PEMULA (default):
  ┌────────────────────────────────────────┐
  │ Round 1 dari 10                         │
  │ ┌──────────────────────────────────┐    │
  │ │ State Matrix (4×4, current round) │    │
  │ └──────────────────────────────────┘    │
  │ SubBytes → ShiftRows → MixColumns → AddKey │
  │ [detail: apa itu S-box? penjelasan]       │
  │                      [Lanjut →]           │
  └────────────────────────────────────────┘

MAHIR:
  ┌────────────────────────────────────────┐
  │ Semua 10 Round (compact)                │
  │ K0 K1 K2 K3 K4 K5 K6 K7 K8 K9 K10  │
  │ [expand round N] [KAT: verifikasi?]    │
  │ Rounds: 1 2 3 4 5 6 7 8 9 10       │
  │ [expand individual round]               │
  └────────────────────────────────────────┘
```

BUKAN 3 level disclosure. CUKUP 2 mode: `pemula` (1 round focus) vs `mahir` (overview + expand).

---

## 4 Panel Komponen

### 1. AesPanel.tsx (~150 baris)

```tsx
export default function AesPanel({
    trace, steps, learnerMode, activeStep
}: { trace: AesTrace, steps: string[], learnerMode, activeStep }) {

    const currentRound = trace.rounds[activeStep] ?? trace.rounds[0];
    const mode = learnerMode;

    if (mode === 'pemula') {
        return (
            <div className="space-y-4">
                {/* fokus 1 round */}
                <div className="text-sm text-muted-foreground">
                    Round {currentRound.roundIndex} dari 10
                </div>

                <AesStateMatrix state={currentRound.stateBefore} />

                <div className="text-sm space-y-1">
                    <p><strong>SubBytes:</strong> Byte {currentRound.stateBefore[0]} → S-box lookup → {currentRound.afterSubBytes[0]}</p>
                    <p><strong>ShiftRows:</strong> Rotate row-wise</p>
                    <p><strong>MixColumns:</strong> GF(2^8) multiplication per column</p>
                    <p><strong>AddRoundKey:</strong> XOR dengan round key</p>
                </div>

                <AesStateMatrix state={currentRound.afterAddRoundKey}
                    title="State setelah AddRoundKey" />
            </div>
        );
    }

    // mahir: grid semua 10 round, expandable
    return (
        <div className="space-y-3">
            {/* Overview: 10 round keys */}
            <div className="flex flex-wrap gap-1">
                {trace.rounds.map((r, i) => (
                    <Badge
                        key={i}
                        variant={i === activeStep ? 'default' : 'outline'}
                        className="cursor-pointer font-mono text-xs"
                        onClick={() => onStepChange(i)}
                    >
                        R{r.roundIndex}
                    </Badge>
                ))}
            </div>

            {/* Expanded round detail */}
            <Collapsible open={true}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                        Round {currentRound.roundIndex} detail
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3">
                    <AesStateMatrix state={currentRound.stateBefore} />
                    <AesStateMatrix state={currentRound.afterSubBytes}
                        title="After SubBytes" />
                    <AesStateMatrix state={currentRound.afterShiftRows}
                        title="After ShiftRows" />
                    <AesStateMatrix state={currentRound.afterMixColumns}
                        title="After MixColumns" />
                    <AesStateMatrix state={currentRound.afterAddRoundKey}
                        title="After AddRoundKey" />
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
```

### 2. DesPanel.tsx (~150 baris)

```tsx
export default function DesPanel({ trace, steps, learnerMode, activeStep }: Props) {
    const currentRound = trace.rounds[activeStep] ?? trace.rounds[0];

    if (learnerMode === 'pemula') {
        return (
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Round {currentRound.roundIndex} dari 16
                </p>
                {/* L/R halves visualization */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <div className="text-xs font-medium">L{currentRound.roundIndex}</div>
                        <Badge variant="outline" className="font-mono text-xs break-all">
                            {bitsToHex(currentRound.newL)}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs font-medium">R{currentRound.roundIndex}</div>
                        <Badge variant="outline" className="font-mono text-xs break-all">
                            {bitsToHex(currentRound.newR)}
                        </Badge>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    F-function: expand R → XOR key → S-boxes → permute
                </div>
            </div>
        );
    }

    // mahir: expandable per round
    return (
        <div className="space-y-3">
            <DESFeistelView
                L={currentRound.L}
                R={currentRound.R}
                expandedR={currentRound.expandedR}
                sboxOutput={currentRound.sboxOutput}
                roundKey={currentRound.roundKey}
            />
        </div>
    );
}
```

### 3. RsaPanel.tsx (~120 baris)

```tsx
export default function RsaPanel({
    trace, steps, learnerMode
}: { trace: RsaKeyGenTrace, steps: string[] }) {
    return (
        <div className="space-y-4">
            {/* Key Generation Flow */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold">Key Generation</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline">p = {trace.p.toString()}</Badge>
                    <Badge variant="outline">q = {trace.q.toString()}</Badge>
                    <Badge variant="outline">n = {trace.n.toString()}</Badge>
                    <Badge variant="outline">φ(n) = {trace.phi.toString()}</Badge>
                    <Badge>e = {trace.e.toString()}</Badge>
                    <Badge>d = {trace.d.toString()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                    n = p × q, φ(n) = (p-1)(q-1), d = e⁻¹ mod φ(n)
                </p>
            </div>

            {/* Encrypt steps */}
            {steps.slice(7).map((step) => (
                <p key={step} className="text-xs">{step}</p>
            ))}
        </div>
    );
}
```

### 4. SignaturePanel.tsx (~120 baris)

```tsx
export default function SignaturePanel({
    trace, steps, learnerMode, mode
}: { trace: RsaSignatureResult | RsaVerifyResult, steps: string[], learnerMode, mode }) {
    const isSign = mode === 'encrypt';
    const result = trace;

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <div className="text-xs font-medium">
                    {isSign ? 'Signing Process' : 'Verification Process'}
                </div>
                <div className="space-y-1 text-xs">
                    <p>
                        <span className="text-muted-foreground">Hash (SHA-256):</span>{' '}
                        {result.digestHex.slice(0, 32)}...
                    </p>
                    {isSign && 'signatureInt' in result && (
                        <p>
                            <span className="text-muted-foreground">Sign:</span>{' '}
                            digest^2753 mod 3233 = {result.signatureInt.toString()}
                        </p>
                    )}
                    {!isSign && 'isValid' in result && (
                        <p className={result.isValid ? 'text-green-600' : 'text-red-600'}>
                            {result.isValid ? '✓ Valid' : '✗ Invalid'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
```

---

## Glossary: Simplified

### Bukan Tooltip Per-Istilah

Glossary adalah **Sheet** (modal) yang searchable. Buka dari button di header, bukan hover.

```tsx
// Di GlassBoxLab
<Button variant="outline" size="sm" asChild>
    <Sheet>
        <SheetTrigger>📖 Istilah</SheetTrigger>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Istilah Kriptografi</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-10rem)]">
                <Command>
                    <CommandInput placeholder="Cari istilah..." />
                    <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        {Object.entries(glossaryContent[slug]).map(([key, item]) => (
                            <CommandItem key={key} value={key}>
                                <div>
                                    <div className="font-medium">{item.term}</div>
                                    <div className="text-xs text-muted-foreground">{item.definition}</div>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </ScrollArea>
        </SheetContent>
    </Sheet>
</Button>
```

### Glossary Content

1 file data per lab (dict, bukan komponen):

```typescript
// resources/js/features/labs/ui/glossary-content.ts

export const glossaryAES = {
    's-box': {
        term: 'S-box (Substitution Box)',
        definition: 'Tabel lookup 256 entry yang mengganti setiap byte dengan byte lain secara nonlinear. Di AES, S-box dirancang agar resisten terhadap cryptanalysis.',
    },
    'shift-rows': {
        term: 'ShiftRows',
        definition: 'Operasi AES yang merotasi byte per baris state matrix: baris 1 shift 1, baris 2 shift 2, baris 3 shift 3.',
    },
    // ...
} as const;
```

Glossary content ada di 1 file. Bukan 40 istilah terpisah. Cukup 8-10 istilah penting per lab.

---

## Glossary Content Per Lab

### AES (8 istilah)
1. S-box (Substitution Box)
2. ShiftRows
3. MixColumns
4. AddRoundKey
5. Key Expansion
6. Rcon
7. GF(2^8)
8. State Matrix

### DES (6 istilah)
1. Feistel Structure
2. S-box
3. Expansion E
4. Parity Bit
5. IP/FP
6. Round Key

### SHA-256 (6 istilah)
1. Hash Function
2. Merkle-Damgård
3. Compression Function
4. Working Variables (a-h)
5. Collision Resistance
6. Preimage Resistance

### RSA (6 istilah)
1. Modulo
2. Euler's Totient φ(n)
3. Extended Euclidean Algorithm
4. Modular Inverse
5. Square-and-Multiply
6. Trapdoor Function

### Signature (5 istilah)
1. Hash Function
2. Collision Resistance
3. Authenticity
4. Non-repudiation
5. Digital Signature vs HMAC

---

## Edit ke show.tsx (HANYA 3 Perubahan)

### Perubahan 1 — Import

```tsx
// Tambahkan di imports
import GlassBoxLab from '@/features/labs/pages/GlassBoxLab';
```

### Perubahan 2 — State

```tsx
// Di dalam LabsShow component
const [learnerMode, setLearnerMode] = useState<'pemula' | 'mahir'>('pemula');

// pass trace dari rawResult (extends SimulationResult)
const aesTrace = (rawResult as SimulationResult & { trace?: SimulationResult['trace'] }).trace?.aes;
const desTrace = (rawResult as any).trace?.des;
const rsaTrace = (rawResult as any).trace?.rsaKeys;
const sigTrace = (rawResult as any).trace?.signature;
```

### Perubahan 3 — Render

```tsx
{/* GANTI section "Proses Bertahap" yang lama: */}

<GlassBoxLab
    slug={lab.slug}
    steps={translatedSteps}
    activeStep={safeActiveStepIndex}
    onStepChange={setActiveStepIndex}
    learnerMode={learnerMode}
    onModeChange={setLearnerMode}
    labMode={mode}
    trace={{
        aes: aesTrace,
        des: desTrace,
        rsaKeys: rsaTrace,
        signature: sigTrace,
    }}
/>
```

### Semua perubahan lain di show.tsx: NONE.

---

## GlossariumLab.tsx — Component

```tsx
// resources/js/features/labs/pages/GlassBoxLab.tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Progress,
} from '@/components/ui/progress';
import AesStateMatrix from '@/features/labs/components/AesStateMatrix';
import DESFeistelView from '@/features/labs/components/DESFeistelView';
import { glossaryAES, glossaryDES, glossaryRSA, glossarySignature } from '@/features/labs/ui/glossary-content';

const GLOSSARY_BY_SLUG = {
    'aes-lab': glossaryAES,
    'des-lab': glossaryDES,
    'rsa-lab': glossaryRSA,
    'digital-signature-lab': glossarySignature,
};

export default function GlassBoxLab(props: GlassBoxLabProps) {
    const {
        slug,
        steps,
        activeStep,
        onStepChange,
        learnerMode,
        onModeChange,
        labMode,
        trace,
    } = props;

    const glossary = GLOSSARY_BY_SLUG[slug] ?? {};
    const totalSteps = steps.length;
    const progress = totalSteps <= 1 ? 100 : ((activeStep + 1) / totalSteps) * 100;

    return (
        <Card className="flex flex-col min-h-[28rem]">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={learnerMode === 'mahir'}
                            onCheckedChange={(v) => onModeChange(v ? 'mahir' : 'pemula')}
                        />
                        <span className="text-sm text-muted-foreground">
                            {learnerMode === 'pemula' ? '📘 Pemula' : '⚙️ Mahir'}
                        </span>
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm">
                                📖 Istilah
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-80">
                            <SheetHeader>
                                <SheetTitle>Istilah Kriptografi</SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-10rem)]">
                                <Command className="rounded-lg border">
                                    <CommandInput placeholder="Cari istilah..." />
                                    <CommandList>
                                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                        {Object.entries(glossary).map(([key, item]) => (
                                            <CommandItem key={key} value={key}>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-sm">
                                                        {item.term}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.definition}
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandList>
                                </Command>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                {/* Progress bar */}
                <Progress value={progress} />

                {/* Step content */}
                <div className="rounded-lg border bg-muted/30 p-4 min-h-20 flex-1">
                    <p className="text-sm leading-relaxed">
                        {steps[activeStep]}
                    </p>
                </div>

                {/* Algorithm-specific visualization */}
                {slug === 'aes-lab' && trace?.aes && (
                    <AesPanel
                        trace={trace.aes}
                        steps={steps}
                        learnerMode={learnerMode}
                        activeStep={activeStep}
                    />
                )}
                {slug === 'des-lab' && trace?.des && (
                    <DesPanel
                        trace={trace.des}
                        steps={steps}
                        learnerMode={learnerMode}
                        activeStep={activeStep}
                    />
                )}
                {slug === 'rsa-lab' && trace?.rsaKeys && (
                    <RsaPanel
                        trace={trace.rsaKeys}
                        steps={steps}
                        learnerMode={learnerMode}
                    />
                )}
                {slug === 'digital-signature-lab' && trace?.signature && (
                    <SignaturePanel
                        trace={trace.signature}
                        steps={steps}
                        learnerMode={learnerMode}
                        labMode={labMode}
                    />
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={activeStep === 0}
                        onClick={() => onStepChange(Math.max(0, activeStep - 1)}
                    >
                        ← Sebelumnya
                    </Button>
                    <Badge variant="outline" className="tabular-nums">
                        {activeStep + 1}/{totalSteps}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={activeStep >= totalSteps - 1}
                        onClick={() => onStepChange(Math.min(totalSteps - 1, activeStep + 1)}
                    >
                        Selanjutnya →
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
```

---

## Phased Implementation

### Phase 1: Data Layer (1-2 jam)
1. Extend `SimulationResult` di `types/labs.ts` dengan optional `trace`
2. Attach trace di 4 fungsi `lab-simulations.ts` (`runAesConcept`, `runDesConcept`, `runRsaConcept`, `runSignatureLab`)
3. Test: existing tests pass + trace object verify
4. Commit: `feat(labs): attach structured traces to SimulationResult`

### Phase 2: Wrapper + AES (2-3 jam)
1. Buat `glossary-content.ts` (data glossary AES)
2. Buat `GlassBoxLab.tsx` orchestrator (150 baris)
3. Buat `AesPanel.tsx` (150 baris)
4. Edit `show.tsx` (3 perubahan kecil)
5. Test: render verify + learner mode toggle
6. Commit: `feat(labs): GlassBoxLab wrapper + AES visualization`

### Phase 3: DES + RSA + Signature (3-4 jam)
1. Tambah glossary DES + RSA + Signature
2. Buat `DesPanel.tsx` (150 baris)
3. Buat `RsaPanel.tsx` (120 baris)
4. Buat `SignaturePanel.tsx` (120 baris)
5. Test: semua panel render
6. Commit: `feat(labs): DES + RSA + Signature visualization panels`

### Phase 4: Caesar + Vigenère Enhancement (1 jam)
1. Tambah glossary Caesar + Vigenère
2. Enhance existing table dengan frequency hint (Caesar)
3. Enhance Vigenère table dengan shift visualization
4. Test
5. Commit: `feat(labs): Caesar brute-force + Vigenere frequency hint`

### Phase 5: Polish + A11y + Tests (2 jam)
1. Keyboard navigation (ArrowLeft/ArrowRight)
2. ARIA labels
3. Smoke test per panel
4. ESLint + Vitest
5. Commit: `fix(labs): a11y + keyboard nav + tests`

---

## Effort Realistis

| Phase | Komponen | Effort |
|-------|----------|--------|
| 1 | Data layer (attach traces) | 1-2 jam |
| 2 | GlassBoxLab + AES panel + glossary | 2-3 jam |
| 3 | DES + RSA + Signature panels | 3-4 jam |
| 4 | Caesar + Vigenère enhancement | 1 jam |
| 5 | Polish + a11y + tests | 2 jam |
| **Total** | | **9-12 jam** |

Lebih realistis dari plan lama (15-20 jam). 4 komponen visualisasi baru (bukan 17).

---

## Verification Checklist

- [ ] Phase 1: `runSimulation('aes-lab')` return object dengan `trace.aes` property
- [ ] Phase 1: Existing tests (67 tests) pass — backward compatible
- [ ] Phase 2: Toggle learner mode switch berfungsi di GlassBoxLab
- [ ] Phase 2: AES panel render state matrix untuk round aktif
- [ ] Phase 2: Glossary sheet searchable
- [ ] Phase 3: DES panel render L/R halves per round
- [ ] Phase 3: RSA panel render key generation flow
- [ ] Phase 3: Signature panel render hash → sign → verify flow
- [ ] Phase 4: Caesar brute-force panel (26 candidates)
- [ ] Phase 5: Keyboard navigation (← → Arrow keys)
- [ ] Phase 5: ESLint clean, Vitest pass
- [ ] NIST KAT vectors still pass (AES: 69C4E0D8..., DES: 85E81354..., SHA-256: 3 vectors)

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| `SimulationResult.trace` breaking existing code | `trace` optional, existing consumers tidak aware |
| Learner mode state perlu global? | local useState di GlassBoxLab, tidak global |
| Glossary content perlu i18n? | Bahasa Indonesia aja untuk sekarang, bilingual bisa phase berikutnya |
| Backward compat lab-simulations tests | trace optional, tests existing pass tanpa trace |
| Mobile layout untuk 4×4 matrix | Responsive grid: grid-cols-2 di mobile, grid-cols-4 di desktop |
