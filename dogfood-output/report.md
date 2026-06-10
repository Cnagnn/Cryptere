# Cryptere Dogfood QA Report

Tanggal: 2026-06-10
Target: production deployment
Scope: landing (`cryptere.com`), auth (`auth.cryptere.com`), app boundary (`app.cryptere.com`), OAuth redirects, asset delivery, headers/cache/security baseline.

## Executive Summary

Production deployment sudah **hidup dan mayoritas sehat**:

- `https://cryptere.com` → 200 OK, landing tampil normal.
- `https://auth.cryptere.com/login` → 200 OK, form login tampil normal.
- `https://app.cryptere.com/dashboard` → 302 redirect ke `https://auth.cryptere.com/login`, sesuai ekspektasi user belum login.
- Asset Vite CSS/JS → 200 OK, `Cache-Control: public, max-age=31536000, immutable`.
- Tidak ditemukan JavaScript console error pada halaman landing, login, register, dan invalid login flow.
- OAuth Google/GitHub redirect menghasilkan 302 ke provider dengan redirect URI production yang benar.

Issue ditemukan: **2 Low/Medium UX-content issue**, tidak memblokir deploy.

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 1 |

## Summary Table

| ID | Severity | Category | Title | Status |
|---|---|---|---|---|
| QA-001 | Medium | Functional/Content | Link Ketentuan Layanan dan Kebijakan Privasi mengarah ke halaman register | Open |
| QA-002 | Low | Content/Localization | Pesan error login invalid masih bahasa Inggris | Open |

---

## QA-001 — Link Ketentuan Layanan dan Kebijakan Privasi mengarah ke halaman register

**Severity:** Medium  
**Category:** Functional / Content  
**URL:** `https://auth.cryptere.com/register`

### Deskripsi
Pada form daftar, link **Ketentuan Layanan** dan **Kebijakan Privasi** terlihat sebagai link legal, tetapi DOM menunjukkan keduanya mengarah ke halaman register yang sama:

```json
[
  {"text":"Ketentuan Layanan","href":"https://auth.cryptere.com/register"},
  {"text":"Kebijakan Privasi","href":"https://auth.cryptere.com/register"}
]
```

### Steps to Reproduce
1. Buka `https://auth.cryptere.com/register`.
2. Inspect link di bagian checkbox persetujuan.
3. Klik `Ketentuan Layanan` atau `Kebijakan Privasi`.

### Expected
- `Ketentuan Layanan` menuju halaman terms, misalnya `/terms` atau `/terms-of-service`.
- `Kebijakan Privasi` menuju halaman privacy, misalnya `/privacy` atau `/privacy-policy`.

### Actual
Kedua link tetap menuju `https://auth.cryptere.com/register`.

### Dampak
User tidak bisa membaca dokumen legal sebelum mendaftar. Ini bisa menjadi masalah UX dan compliance.

---

## QA-002 — Pesan error login invalid masih bahasa Inggris

**Severity:** Low  
**Category:** Content / Localization  
**URL:** `https://auth.cryptere.com/login`

### Deskripsi
UI login berbahasa Indonesia (`Masuk`, `Kata Sandi`, `Tetap masuk`), tetapi ketika login gagal, pesan validasi tampil bahasa Inggris:

```text
These credentials do not match our records.
```

### Steps to Reproduce
1. Buka `https://auth.cryptere.com/login`.
2. Isi email/username dengan `qa-invalid@example.com`.
3. Isi password dengan `wrong-password`.
4. Klik `Masuk`.

### Expected
Pesan error dalam Bahasa Indonesia, contoh:

```text
Email/username atau kata sandi tidak sesuai.
```

### Actual
Pesan error tampil dalam Bahasa Inggris.

### Dampak
Tidak memblokir login, tetapi konsistensi bahasa kurang baik untuk target user Indonesia.

---

## Checks Performed

### HTTP/Header Checks

- `https://cryptere.com` → `200 OK`
- `https://auth.cryptere.com/login` → `200 OK`
- `https://app.cryptere.com/dashboard` → `302 Found` ke `https://auth.cryptere.com/login`, lalu `200 OK`
- `https://cryptere.com/login` → `301 Moved Permanently` ke `https://auth.cryptere.com/login`
- `https://app.cryptere.com` → `302 Found` ke `https://auth.cryptere.com/login`
- `https://auth.cryptere.com/auth/google/redirect` → `302 Found` ke Google OAuth dengan redirect URI `https://auth.cryptere.com/auth/google/callback`
- `https://auth.cryptere.com/auth/github/redirect` → `302 Found` ke GitHub OAuth dengan redirect URI `https://auth.cryptere.com/auth/github/callback`
- `https://auth.cryptere.com/forgot-password` → `200 OK`

### Asset Checks

- CSS asset `app-BtP-TF3u.css` → `200 OK`, immutable cache.
- JS asset `app-DgWDwvjs.js` → `200 OK`, immutable cache.

### Browser Console Checks

Tidak ada JS console error pada:

- Landing page
- Login page
- Register page
- Invalid login flow
- App dashboard redirect flow

### Security/Header Baseline

Header yang terlihat baik:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP tidak terlihat mengizinkan localhost/Vite dev origin.
- Session cookie memakai `domain=.cryptere.com`, `secure`, `httponly` untuk session.

## Notes / Blockers

- QA ini tidak melakukan login dengan akun valid karena credentials test tidak disediakan.
- QA ini tidak membuat akun baru sungguhan untuk menghindari side effect production tanpa izin eksplisit.
- Credentials production sempat dipaste di chat sebelumnya; setelah deployment stabil, lakukan rotasi password/secret.
