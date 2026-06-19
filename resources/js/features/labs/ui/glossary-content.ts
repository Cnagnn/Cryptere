/**
 * Glossary Content for Cryptography Labs
 *
 * Contains searchable definitions for AES, DES, RSA, and Digital Signature labs.
 */

// AES Glossary (8 terms)
export const glossaryAES = {
    's-box': {
        term: 'S-box (Substitution Box)',
        definition:
            'Tabel lookup 256 entry yang mengganti setiap byte dengan byte lain secara nonlinear. Di AES, S-box dirancang agar resisten terhadap cryptanalysis.',
    },
    'shift-rows': {
        term: 'ShiftRows',
        definition:
            'Operasi AES yang merotasi byte per baris state matrix. Baris 1 shift 1, baris 2 shift 2, baris 3 shift 3.',
    },
    'mix-columns': {
        term: 'MixColumns',
        definition:
            'Operasi AES yang mengalirkan setiap kolom state matrix melalui GF(2^8) multiplication untuk mencampur byte dalam kolom.',
    },
    'add-round-key': {
        term: 'AddRoundKey',
        definition:
            'Operasi AES yang melakukan XOR antara state matrix dengan round key. Inilah yang mengacak data berdasarkan kunci.',
    },
    'key-expansion': {
        term: 'Key Expansion',
        definition:
            'Prosedur menurunkan 11 round key dari kunci utama 128-bit menggunakan Rcon dan GF(2^8) operations.',
    },
    'state-matrix': {
        term: 'State Matrix',
        definition:
            'Array 4x4 byte yang merepresentasikan blok 16-byte di AES. Diproses per round.',
    },
    'rcon': {
        term: 'Rcon (Round Constant)',
        definition:
            'Konstanta per round untuk key expansion AES. Rcon[i] = 2^(i-1) dalam GF(2^8).',
    },
    'gf28': {
        term: 'GF(2^8)',
        definition:
            'Galois Field dengan 256 elemen untuk operasi MixColumns AES. Memungkinkan diffusion byte antar kolom.',
    },
} as const;

// DES Glossary (6 terms)
export const glossaryDES = {
    'feistel-structure': {
        term: 'Feistel Structure',
        definition:
            'Arsitektur cipher yang membagi blok menjadi L dan R, update R dengan f(R,K), swap setiap round. Encryption=Decryption dengan kunci terbalik.',
    },
    's-box-des': {
        term: 'S-box DES',
        definition:
            '8 tabel lookup 4x16 yang merupakan satu-satunya sumber nonlinearity di DES. Setiap S-box menerima 6-bit input dan menghasilkan 4-bit output.',
    },
    'expansion-e': {
        term: 'Expansion E',
        definition:
            'Permutasi yang memperluas 32-bit menjadi 48-bit untuk XOR dengan round key. Menyebarkan bit R untuk diffusion.',
    },
    'l-r-halves': {
        term: 'L/R Halves',
        definition:
            'Blok 64-bit dipecah jadi 32-bit kiri (L) dan 32-bit kanan (R). Setiap round: L[i]=R[i-1], R[i]=L[i-1] XOR f(R[i-1], K[i]).',
    },
    'parity-bit': {
        term: 'Parity Bit',
        definition:
            'Bit ke-8 setiap byte kunci DES untuk error detection. Total efektif kunci hanya 56 bit.',
    },
    'ip-fp': {
        term: 'Initial/Final Permutation',
        definition:
            'Permutasi bit pada awal dan akhir DES. Bukan bagian kriptografis - desain warisan. Bisa dibalik tanpa kunci.',
    },
} as const;

// RSA Glossary (6 terms)
export const glossaryRSA = {
    'euler-totient': {
        term: "Euler's Totient φ(n)",
        definition:
            "Jumlah bilangan 1≤x<n yang coprime dengan n. Untuk n=p×q, φ(n)=(p-1)(q-1). Digunakan untuk hitung kunci privat d.",
    },
    'extended-euclidean': {
        term: 'Extended Euclidean Algorithm',
        definition:
            'Algoritma untuk cari x,y di mana ax+by=gcd(a,b). Dipakai untuk hitung modular inverse d = e^(-1) mod φ(n).',
    },
    'modular-inverse': {
        term: 'Modular Inverse',
        definition:
            'Bilangan x di mana a×x ≡ 1 (mod n). Dipakai untuk hitung kunci privat RSA dari kunci publik.',
    },
    'square-and-multiply': {
        term: 'Square-and-Multiply',
        definition:
            'Algoritma efisien untuk hitung a^e mod n dalam O(log e) operasi, bukan O(e). Basis binary exponentiation.',
    },
    'trapdoor': {
        term: 'Trapdoor Function',
        definition:
            'Fungsi yang mudah di satu arah tapi sulit dibalik tanpa informasi rahasia. RSA keamanan = trapdoor factorization.',
    },
    'coprime': {
        term: 'Coprime',
        definition:
            'Dua bilangan adalah coprime jika gcd(a,b)=1. RSA memilih e coprime dengan φ(n).',
    },
} as const;

// Digital Signature Glossary (5 terms)
export const glossarySignature = {
    'collision-resistance': {
        term: 'Collision Resistance',
        definition:
            'Properti hash di mana secara komputasional tidak mungkin cari m1≠m2 dengan hash(m1)=hash(m2). SHA-256 memenuhi ini (sejauh ini).',
    },
    'authenticity': {
        term: 'Authenticity',
        definition:
            'Properti signature yang membuktikan siapa yang发送消息. Hanya pemilik private key bisa membuat signature yang verify dengan public key.',
    },
    'non-repudiation': {
        term: 'Non-repudiation',
        definition:
            'Penanda tangan digital tidak bisa否认发送者. Private key holder tidak bisa klaim pesan不是他们发送的.',
    },
    'hash-function': {
        term: 'Hash Function',
        definition:
            'Fungsi satu arah yang map input arbitrary length ke output fixed length. SHA-256 output 256-bit dari input berapa pun.',
    },
    'hmac-vs-signature': {
        term: 'HMAC vs Digital Signature',
        definition:
            'HMAC pakai satu kunci secret untuk sign+verify (symmetric). Digital Signature pakai private key untuk sign, public key untuk verify (asymmetric). Lab ini demo signature, bukan HMAC.',
    },
} as const;

// Complete glossary index by lab slug
export const glossary = {
    'aes-lab': glossaryAES,
    'des-lab': glossaryDES,
    'rsa-lab': glossaryRSA,
    'digital-signature-lab': glossarySignature,
} as const;

// Type-safe glossary lookup
export type GlossarySlug = keyof typeof glossary;
