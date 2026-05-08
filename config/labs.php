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
        'title' => 'AES',
        'summary' => 'Explore a modern block cipher with focus on operation modes and plaintext change effects.',
        'group' => 'symmetric',
    ],

    'rsa-lab' => [
        'title' => 'RSA',
        'summary' => 'Visualize public-private key concepts with prime-number-based encryption and decryption.',
        'group' => 'asymmetric',
    ],

    'digital-signature-lab' => [
        'title' => 'Digital Signature',
        'summary' => 'Demonstrate digital signature flow for authentication, integrity, and non-repudiation.',
        'group' => 'signature',
    ],

    'lattice-cipher-lab' => [
        'title' => 'Lattice Cipher',
        'summary' => 'Explore lattice-based encryption concepts with a simplified Learning With Errors (LWE) demonstration.',
        'group' => 'post-quantum',
    ],

];
