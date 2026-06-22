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
        'title' => 'AES-128',
        'summary' => 'Kalkulator kriptografi AES-128: input plaintext dan kunci, sistem menghasilkan ciphertext dan sebaliknya. Visualisasi 10 putaran SubBytes, ShiftRows, MixColumns, dan AddRoundKey.',
        'group' => 'symmetric',
    ],

    'des-lab' => [
        'title' => 'DES',
        'summary' => 'Kalkulator kriptografi DES: input plaintext ASCII dan kunci 8 karakter, sistem otomatis mengubah ke ciphertext atau sebaliknya. Visualisasi 16 putaran Feistel.',
        'group' => 'symmetric',
    ],

    'rsa-lab' => [
        'title' => 'RSA',
        'summary' => 'Kalkulator kriptografi RSA: enkripsi dan dekripsi berbasis kunci publik-privat dengan bilangan prima. Visualisasi pembangkitan kunci dan operasi modular.',
        'group' => 'asymmetric',
    ],

    'digital-signature-lab' => [
        'title' => 'Digital Signature',
        'summary' => 'Kalkulator tanda tangan digital RSA: tandatangani pesan dengan SHA-256 dan kunci privat, verifikasi dengan kunci publik. Visualisasi alur penandatanganan dan verifikasi.',
        'group' => 'signature',
    ],

];
