# Crypto Labs Simulation Plan 1

**Goal:** Sempurnakan labs detail untuk Caesar Cipher, Vigenere Cipher, DES, AES-128, RSA-256, dan Digital Signature agar simulasi menerima banyak format input, menghasilkan banyak format output, dan menampilkan visualisasi step-by-step yang layak untuk pemahaman learner.

**Architecture:** Keep `/labs` as an independent learner-facing product. Laravel remains the source of truth for lab catalog/routing/visit tracking, while the cryptographic simulation engine remains client-side TypeScript so users can interact instantly without creating backend crypto state. Move the current single `lab-simulations.ts` module into focused codec, algorithm, and visualization modules with deterministic tests.

## Existing Plan Boundary

This plan must not collide with existing plans in `docs/superpowers/plans`:

- `2026-05-13-auth-hardening.md`: no auth/Fortify/login/register/password reset changes.
- `2026-05-13-management-plan-1.md`: no admin CRUD, admin publish/archive, admin delete guard, or assessment authoring changes.
- `2026-05-13-learner-course-experience-plan-1.md`: no course detail, lesson/task, video/read/quiz, or Bloom assessment implementation changes.

Allowed overlap with the learner course plan:

- Labs may stop depending on the course catalog fallback in `resources/js/pages/courses/index.tsx`.
- Labs must remain under `/labs`.
- Any touch to `resources/js/pages/courses/index.tsx` must be limited to removing lab fallback coupling or preserving compatibility with the learner-course plan. Do not redesign course catalog as part of this plan.

## Current State Findings

- `config/labs.php` contains Caesar, Vigenere, AES, RSA, and Digital Signature labs. DES is missing.
- `resources/js/pages/labs/show.tsx` already has a usable lab shell with mode tabs, format selectors, output display, and step playback.
- `resources/js/lib/lab-simulations.ts` is deterministic and testable, but it is too large and mixes codecs, metadata, concept text, visualization rows, and algorithm logic.
- Supported formats are currently `ascii`, `hex`, `binary`, `base64`, and `decimal`.
- Caesar and Vigenere normalize to uppercase letters and drop non-letters, so byte-level inputs like hex/binary do not round-trip transparently.
- AES is labeled as AES but currently uses XOR byte mixing as an educational approximation, not AES-128.
- RSA currently uses small textbook values `p=61`, `q=53`, `n=3233`, not RSA-256.
- Digital Signature currently uses a pseudo hash and a simulated signature suffix, and verify mode does not accept a real signature token as input.
- `canFormatOutput()` disables output conversion for RSA and Digital Signature. The requested labs need output conversion wherever the result can be represented as bytes or structured text.
- Existing Vitest coverage is useful, but it validates the current simplified behavior rather than accurate DES/AES/RSA/signature flows.

## Brainstormed Options

**Option A: UI polish only around the current engine.**
Fastest path, but AES/RSA/signature would remain inaccurate and DES would be bolted onto a weak structure. Not recommended.

**Option B: Add real crypto library dependencies.**
This can improve correctness, but it reduces step visibility and requires dependency approval. Many production crypto APIs intentionally hide internal rounds, which conflicts with the educational visualization goal. Not recommended for this plan.

**Option C: Educational in-repo algorithm models with known vectors.**
Implement standard DES and AES-128 transformations in TypeScript with visible round/key-schedule steps, implement RSA-256 with BigInt and deterministic educational key generation, and implement Digital Signature as hash-then-RSA-sign flow. This gives the best balance of correctness, transparency, and testability. Recommended.

## Recommended Scope

Build a dedicated labs simulation layer:

- `resources/js/features/labs/codecs.ts`: parse/render ASCII, UTF-8 text, hex, binary, base64, decimal bytes, and grouped integer blocks.
- `resources/js/features/labs/types.ts`: structured simulation, step, codec, and visualization contracts.
- `resources/js/features/labs/algorithms/caesar.ts`
- `resources/js/features/labs/algorithms/vigenere.ts`
- `resources/js/features/labs/algorithms/des.ts`
- `resources/js/features/labs/algorithms/aes128.ts`
- `resources/js/features/labs/algorithms/rsa256.ts`
- `resources/js/features/labs/algorithms/digital-signature.ts`
- `resources/js/features/labs/visualization/*`: shared components for step timeline, byte grid, bit grid, state matrix, permutation table, round panels, and signature flow.
- Keep a compatibility export from `resources/js/lib/lab-simulations.ts` until `labs/show.tsx` is migrated.

## UX Workflow Target

1. Learner opens `/labs`.
2. Laravel sends lab catalog from `config/labs.php`; the page does not depend on hardcoded course catalog fallback data.
3. Learner opens `/labs/{lab}`.
4. Learner chooses mode: encrypt/decrypt, or sign/verify for Digital Signature if the UI supports lab-specific labels.
5. Learner chooses input format.
6. Input is parsed into a normalized byte or block model.
7. Algorithm runs with deterministic educational parameters.
8. Output is available in applicable output formats.
9. Visualization renders the full step sequence, with a focused current step and a compact overview.
10. Learner can step forward/backward or play the walkthrough.
11. Validation errors explain the exact format/key issue before simulation runs.

## Data Model

Create structured result types so the UI can render more than plain string steps.

```ts
export type LabMode = 'encrypt' | 'decrypt' | 'sign' | 'verify';

export type LabFormat =
    | 'text'
    | 'ascii'
    | 'utf8'
    | 'hex'
    | 'binary'
    | 'base64'
    | 'decimal-bytes'
    | 'integer-blocks'
    | 'json';

export type ParsedLabInput = {
    raw: string;
    format: LabFormat;
    bytes: number[];
    text: string;
    blocks: bigint[];
};

export type LabStepKind =
    | 'text'
    | 'bytes'
    | 'bits'
    | 'matrix'
    | 'permutation'
    | 'round'
    | 'key-schedule'
    | 'math'
    | 'signature';

export type LabStep = {
    id: string;
    title: string;
    description: string;
    kind: LabStepKind;
    input?: string;
    operation?: string;
    output?: string;
    rows?: Array<{ label: string; value: string; result?: string }>;
    matrix?: string[][];
    highlight?: Array<{ row?: number; column?: number; index?: number }>;
};

export type LabOutput = {
    label: string;
    bytes: number[];
    text: string;
    blocks: bigint[];
    json?: unknown;
    preferredFormat: LabFormat;
};

export type LabSimulationResult = {
    output: LabOutput;
    steps: LabStep[];
    warnings: string[];
};
```

## Input And Output Formats

Implement one shared codec layer before algorithm work.

Required input formats:

- `text`: user-friendly text; encoded as UTF-8 bytes.
- `ascii`: strict 0x00-0x7F bytes; rejects non-ASCII characters.
- `utf8`: explicit UTF-8 text mode; same byte encoder as `text` but with clearer label.
- `hex`: accepts grouped or ungrouped hex, rejects odd-length values.
- `binary`: accepts `01000001` groups, spaces, or grouped nibbles if unambiguous.
- `base64`: accepts padded and unpadded base64 where safe.
- `decimal-bytes`: accepts integers 0-255 separated by spaces or commas.
- `integer-blocks`: accepts RSA/DES/AES block outputs where values can exceed one byte.
- `json`: used for signature tokens and structured examples.

Required output formats:

- Same list as above where representable.
- If output is blocks or JSON, expose `integer-blocks` and `json` as first-class output formats instead of disabling output formatting.
- For byte outputs, allow switching between text/ascii/utf8/hex/binary/base64/decimal bytes.
- If output bytes are not valid text, show replacement-safe text plus a warning and keep hex as recommended.

## Algorithm Requirements

### Caesar Cipher

Target behavior:

- Support classical A-Z mode for learner clarity.
- Add byte mode so hex/binary/base64 input can be transformed without silently dropping non-letters.
- Preserve existing default example and existing route slug `caesar-cipher-lab`.
- Step visualization should show plaintext symbol, numeric value, shift, modulo result, and output symbol.

Tests:

- `HELLO` shift `3` -> `KHOOR`.
- Decrypt reverses encrypt.
- Hex input `48 45 4C 4C 4F` can output hex and text.
- Binary input round-trips through output formatter.
- Non-letter behavior is explicit: either preserved in classical mode or transformed in byte mode.

### Vigenere Cipher

Target behavior:

- Support classical keyword A-Z mode.
- Add byte mode where key bytes repeat over input bytes with modulo 256 addition/subtraction.
- Step visualization should show input value, key character/byte, shift, modulo operation, and output value.

Tests:

- `ATTACKATDAWN` with `LEMON` -> `LXFOPVEFRNHR`.
- Decrypt reverses encrypt.
- Keyword validation rejects empty key after normalization.
- Hex and binary input can render hex/binary/base64 output.

### DES

Target behavior:

- Add `des-lab` to `config/labs.php`.
- Implement DES block encryption/decryption for 64-bit blocks and 64-bit keys with parity bits.
- Use standard DES tables in `des-tables.ts`: initial permutation, final permutation, expansion permutation, P permutation, PC-1, PC-2, rotation schedule, and eight S-boxes.
- Support one-block examples first, then multi-block input with PKCS#7 padding for text mode.
- Visualization should expose:
  - plaintext block bits;
  - initial permutation;
  - split into L0/R0;
  - key schedule rounds;
  - expansion, XOR with round key, S-box substitution, P permutation;
  - L/R swap per round;
  - final permutation.
- Label DES as educational and legacy/insecure for real-world use.

Known-vector tests:

- Key `133457799BBCDFF1`, plaintext `0123456789ABCDEF`, ciphertext `85E813540F0AB405`.
- Decryption of that ciphertext returns the plaintext block.
- Step count includes initial permutation, 16 rounds, and final permutation.
- Output supports hex, binary, base64, decimal bytes, and text when printable.

### AES-128

Target behavior:

- Keep slug `aes-lab`, but update title to `AES-128`.
- Replace XOR approximation with AES-128 block model.
- Implement 128-bit key normalization. Exact 16-byte hex key is recommended; text keys are UTF-8 encoded and padded/truncated only if explicitly selected by UI.
- Support one-block examples first, then multi-block text with PKCS#7 padding.
- Visualization should expose:
  - input state matrix;
  - AddRoundKey;
  - SubBytes;
  - ShiftRows;
  - MixColumns;
  - round key schedule;
  - final round without MixColumns;
  - inverse operations in decrypt mode.
- Label block mode as educational ECB unless a future plan adds CBC/GCM. Avoid presenting it as production-safe encryption.

Known-vector tests:

- Key `000102030405060708090A0B0C0D0E0F`, plaintext `00112233445566778899AABBCCDDEEFF`, ciphertext `69C4E0D86A7B0430D8CDB78070B4C55A`.
- Decrypt reverses the known vector.
- Text input `Hello AES` can encrypt to bytes and output hex/base64/binary/decimal bytes.
- Structured steps include 10 rounds and a visible final round.

### RSA-256

Target behavior:

- Keep slug `rsa-lab`, but update title to `RSA-256`.
- Implement BigInt modular arithmetic.
- Use deterministic educational 256-bit key generation from a fixed seed or user-provided seed:
  - generate 128-bit prime candidates;
  - prove probable primality with Miller-Rabin;
  - compute `n = p * q`;
  - compute `phi = (p - 1) * (q - 1)`;
  - use `e = 65537`;
  - compute `d = modInverse(e, phi)`.
- Encrypt UTF-8 bytes as integer blocks smaller than `n`.
- Decrypt integer blocks back to bytes.
- Output can be shown as integer blocks, hex blocks, decimal bytes, base64, or text after decrypt.
- Visualization should expose:
  - key generation summary;
  - block conversion;
  - modular exponentiation by square-and-multiply;
  - ciphertext blocks;
  - inverse exponentiation in decrypt mode.
- Clearly label this as educational RSA-256 and not production-grade padding. A future hardening plan can add OAEP concept visualization.

Tests:

- Generated modulus bit length is 255 or 256 bits.
- `gcd(e, phi) === 1`.
- `modInverse(e, phi)` satisfies `(e * d) % phi === 1`.
- Encrypt/decrypt round-trip works for ASCII, UTF-8, hex, and binary inputs.
- Integer block input validation rejects blocks `>= n`.
- Steps include prime selection, public/private exponent derivation, and modular exponentiation.

### Digital Signature

Target behavior:

- Change mode labels for this lab from encrypt/decrypt to sign/verify.
- Use the RSA-256 educational key engine for signing and verification.
- Compute SHA-256 digest using Web Crypto where available; provide a deterministic TypeScript fallback only if tests/browser support require it.
- Sign mode:
  - normalize message bytes;
  - hash message;
  - convert digest to integer block(s);
  - sign with private exponent;
  - output structured signature token.
- Verify mode:
  - accept message plus signature token;
  - hash message again;
  - recover digest block using public exponent;
  - compare digest values;
  - return valid/invalid result with clear reasons.
- Output formats should include JSON token, integer blocks, hex digest, and text summary.

Tests:

- Signing the same message with the same key seed is deterministic.
- Verification succeeds for unchanged message/signature.
- Verification fails when message changes.
- Verification fails when signature block changes.
- Steps include hash, sign, transmit, recover digest, compare.

## Visual Design Requirements

Keep the existing app style and shadcn/Radix components. The page should stay tool-first, not a landing page.

Recommended component split:

- `resources/js/features/labs/lab-format-select.tsx`
- `resources/js/features/labs/lab-input-panel.tsx`
- `resources/js/features/labs/lab-output-panel.tsx`
- `resources/js/features/labs/step-timeline.tsx`
- `resources/js/features/labs/byte-grid.tsx`
- `resources/js/features/labs/bit-grid.tsx`
- `resources/js/features/labs/state-matrix.tsx`
- `resources/js/features/labs/permutation-table.tsx`
- `resources/js/features/labs/round-panel.tsx`
- `resources/js/features/labs/signature-flow.tsx`

Interaction requirements:

- Format selectors must be available for both input and output.
- Output format selector should only hide impossible formats, not disable all formatting for whole labs.
- Playback controls must work with structured steps.
- Step detail must fit on mobile without overlapping text or forcing layout jumps.
- Long binary/hex/block outputs should wrap in monospace containers with copy buttons.
- Validation warnings should be near the field they affect.
- Recommended examples should be available per lab and mode.

## Implementation Plan

### Phase 0: Safety Gate

- [ ] Read the three existing plans before implementation.
- [ ] Confirm the implementation branch touches only labs-related files unless a compatibility edit is required.
- [ ] Do not edit auth files.
- [ ] Do not edit admin management files.
- [ ] Do not edit course detail/lesson/task/assessment behavior.

Verification:

```bash
git diff --name-only
```

Expected touched areas:

- `config/labs.php`
- `app/Http/Controllers/Lab/LabController.php`
- `resources/js/pages/labs/*`
- `resources/js/types/labs.ts`
- `resources/js/lib/lab-simulations.ts`
- `resources/js/features/labs/*`
- `resources/js/lib/__tests__/lab-simulations.test.ts` or new labs tests
- `tests/e2e/labs.spec.ts`

### Phase 1: Contract And Codec Tests First

- [ ] Add unit tests for parsing and rendering every format.
- [ ] Add tests for output format switching with byte, block, and JSON outputs.
- [ ] Add tests that invalid hex/binary/base64/decimal inputs return clear errors.

Create or modify:

- `resources/js/features/labs/__tests__/codecs.test.ts`
- `resources/js/features/labs/codecs.ts`
- `resources/js/features/labs/types.ts`

Core assertions:

```ts
expect(parseLabInput('48656C6C6F', 'hex').bytes).toEqual([72, 101, 108, 108, 111]);
expect(renderLabOutput({ bytes: [72, 105] }, 'binary')).toBe('01001000 01101001');
expect(renderLabOutput({ bytes: [72, 105] }, 'base64')).toBe('SGk=');
expect(parseLabInput('300 1', 'decimal-bytes').error).toContain('0-255');
```

### Phase 2: Lab Catalog Independence

- [ ] Update `config/labs.php` to add `des-lab`.
- [ ] Update AES title to `AES-128`.
- [ ] Update RSA title to `RSA-256`.
- [ ] Make `LabController::__invoke()` pass a labs catalog built from `config/labs.php`.
- [ ] Refactor `resources/js/pages/labs/index.tsx` to render a dedicated labs catalog or a labs-only card component.
- [ ] Avoid hardcoded lab fallback inside course catalog for the labs page.

Acceptance:

- `/labs` renders all requested labs including DES.
- `/labs/des-lab` is routable.
- Course catalog behavior remains owned by the learner course plan.

### Phase 3: Simulation Runner Contract

- [ ] Add an async-compatible runner: `runLabSimulation(input): Promise<LabSimulationResult>`.
- [ ] Keep `runSimulation()` compatibility until the page is migrated.
- [ ] Map lab slug to algorithm module.
- [ ] Convert existing string steps to structured `LabStep`.
- [ ] Add warnings for educational limitations: DES legacy, AES ECB visualization, RSA without OAEP.

Acceptance:

- Existing labs still render while modules are migrated.
- Unit tests can await async digital signature simulations.

### Phase 4: Classical Cipher Upgrade

- [ ] Move Caesar into `algorithms/caesar.ts`.
- [ ] Move Vigenere into `algorithms/vigenere.ts`.
- [ ] Add classical and byte modes if the UI exposes the mode selector.
- [ ] Render per-character/per-byte operation rows.
- [ ] Preserve current expected outputs for default examples.

Acceptance:

- Existing Caesar/Vigenere tests pass with updated structured result mapping.
- New format matrix tests pass for ASCII, hex, binary, base64, and decimal bytes.

### Phase 5: DES Lab

- [ ] Create `algorithms/des-tables.ts` with standard DES tables.
- [ ] Create `algorithms/des.ts` with key schedule, Feistel function, encrypt block, decrypt block, and multi-block helpers.
- [ ] Add DES validation helpers for key and input block length.
- [ ] Add DES visual steps for permutation, key schedule, each round, and final permutation.

Acceptance:

- DES known vector passes.
- Decrypt reverses encrypt.
- The lab explains all 16 rounds without overwhelming the first viewport.

### Phase 6: AES-128 Lab

- [ ] Create `algorithms/aes128-tables.ts` for S-box, inverse S-box, and Rcon.
- [ ] Create `algorithms/aes128.ts` with key expansion, SubBytes, ShiftRows, MixColumns, AddRoundKey, inverse operations, block encrypt/decrypt, and padding helpers.
- [ ] Replace `runAesConcept()` usage with AES-128 module.
- [ ] Add matrix visualization for state before/after each operation.

Acceptance:

- AES-128 known vector passes.
- Decrypt reverses encrypt for both one-block hex and padded text input.
- Output format switching works for hex, binary, base64, and decimal bytes.

### Phase 7: RSA-256 Lab

- [ ] Create `algorithms/bigint-math.ts` for `gcd`, `egcd`, `modInverse`, `modPow`, `bitLength`, and Miller-Rabin.
- [ ] Create `algorithms/rsa256.ts`.
- [ ] Generate deterministic educational keys from a seed.
- [ ] Add block encoding/decoding helpers.
- [ ] Add square-and-multiply step traces with truncation for long exponents.

Acceptance:

- RSA key math tests pass.
- Encrypt/decrypt round-trip passes.
- Output is format-selectable as integer blocks, hex blocks, base64, and text where valid.

### Phase 8: Digital Signature Lab

- [ ] Create `algorithms/sha256.ts` wrapper around Web Crypto.
- [ ] Create `algorithms/digital-signature.ts` using RSA-256 signing/verification.
- [ ] Update UI mode labels for `digital-signature-lab` to `Sign` and `Verify`.
- [ ] Add a signature token input in verify mode.
- [ ] Render signature flow visualization.

Acceptance:

- Sign/verify success and failure tests pass.
- User can paste a signature token and verify against message input.
- Output can render JSON token, integer blocks, hex digest, and summary text.

### Phase 9: Labs Detail UI Refactor

- [ ] Split `resources/js/pages/labs/show.tsx` into page orchestration plus feature components.
- [ ] Add async simulation loading state.
- [ ] Add copy buttons for input examples and output.
- [ ] Add warning banner for educational limitations.
- [ ] Add responsive constraints for long blocks, matrices, and tables.
- [ ] Keep Wayfinder imports for route links.

Acceptance:

- No text overlaps on desktop or mobile.
- Step playback works for all requested labs.
- Validation errors do not trigger broken simulation output.

### Phase 10: E2E Smoke Coverage

- [ ] Add `tests/e2e/labs.spec.ts`.
- [ ] Visit `/labs`.
- [ ] Visit each requested lab detail route.
- [ ] Switch input format to hex and output format to binary where applicable.
- [ ] Run at least one simulation per lab.
- [ ] Assert no browser console errors.

Example route list:

- `/labs/caesar-cipher-lab`
- `/labs/vigenere-cipher-lab`
- `/labs/des-lab`
- `/labs/aes-lab`
- `/labs/rsa-lab`
- `/labs/digital-signature-lab`

### Phase 11: Final Verification

Run:

```bash
npm run test:unit -- resources/js/features/labs
npm run test:unit -- resources/js/lib/__tests__/lab-simulations.test.ts
npm run types:check
npm run lint:check
php artisan test --compact --filter=Lab
npm run e2e -- tests/e2e/labs.spec.ts --project=chromium
```

If PHP files are modified:

```bash
vendor/bin/pint --dirty --format agent
```

If route/controller changes affect Wayfinder output:

```bash
npm run types
```

## Risks And Mitigations

- **DES/AES table mistakes:** Mitigate with known NIST-style vectors and round-trip tests.
- **RSA-256 performance in browser:** Keep default message size small, truncate visualization traces, and compute only on explicit input changes with debounce if necessary.
- **Async SHA-256 changes runner shape:** Introduce async runner at the contract layer and keep compatibility wrapper during migration.
- **Course plan collision:** Keep labs catalog independent and do not refactor course catalog beyond removing labs fallback coupling if needed.
- **Output format ambiguity:** Treat byte output, block output, and JSON output as different output models rather than forcing all results into text.

## Out Of Scope

- Production-grade cryptography for securing real user data.
- Backend encryption/signature APIs.
- OAuth/auth/Fortify changes.
- Admin management CRUD or assessment authoring.
- Course lesson/task/video/read/quiz/Bloom assessment implementation.
- Adding third-party crypto dependencies unless separately approved.

## Definition Of Done

- `/labs` lists all requested labs and DES is included.
- Caesar and Vigenere support classical learning and byte-oriented format experiments.
- DES passes the standard known vector and renders 16-round visualization.
- AES lab is truly AES-128 for educational block simulations and passes the known vector.
- RSA lab uses BigInt RSA-256 educational keys and round-trips input across supported formats.
- Digital Signature lab signs and verifies real message/signature pairs using hash-then-RSA flow.
- Input and output format controls work consistently across requested labs.
- Step-by-step visualization is structured, navigable, and responsive.
- Existing auth, management, course learning, and assessment plans remain unmodified in scope.
- Unit, type, lint, PHP Lab feature tests, and labs E2E smoke tests pass.
