<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cryptography Lab Catalog
    |--------------------------------------------------------------------------
    |
    | Each lab is keyed by its URL slug and defines a title, summary, and
    | group used for catalog display and routing. Add new labs here without
    | touching controller code.
    |
    */

    'caesar-cipher-lab' => [
        'title' => 'Caesar Cipher',
        'summary' => 'Visualize classic alphabet shifts to understand monoalphabetic substitution.',
        'group' => 'classical',
    ],

    'vigenere-cipher-lab' => [
        'title' => 'Vigenere Cipher',
        'summary' => 'Simulate keyword-based polyalphabetic encryption to observe dynamic shift patterns.',
        'group' => 'classical',
    ],

    'aes-lab' => [
        'title' => 'AES (Demonstrasi)',
        'summary' => 'Pelajari sandi blok modern dengan 10 putaran SubBytes, ShiftRows, MixColumns, dan AddRoundKey. Contoh edukasi, bukan implementasi produksi.',
        'group' => 'symmetric',
    ],

    'des-lab' => [
        'title' => 'DES (Demonstrasi)',
        'summary' => 'Pelajari sandi blok Feistel 64-bit dengan 16 putaran. Demonstrasi edukasi: struktur Feistel, S-box, dan key schedule. Contoh bukan implementasi produksi.',
        'group' => 'symmetric',
    ],

    'rsa-lab' => [
        'title' => 'RSA (Demonstrasi)',
        'summary' => 'Pelajari konsep kunci publik dan privat memakai bilangan prima kecil. Contoh edukasi, bukan implementasi produksi.',
        'group' => 'asymmetric',
    ],

    'digital-signature-lab' => [
        'title' => 'Digital Signature',
        'summary' => 'Demonstrate digital signature flow for authentication, integrity, and non-repudiation.',
        'group' => 'signature',
    ],

];
