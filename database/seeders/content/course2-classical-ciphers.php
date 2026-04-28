<?php

/**
 * Lesson content for Course 2: Applied Classical Ciphers (beginner).
 * Returns an array keyed by lesson slug.
 */
return [
    'caesar-cipher-warmup' => [
        'learning_objectives' => [
            'Explain the history and origin of the Caesar cipher',
            'Encrypt and decrypt messages using the Caesar cipher by hand',
            'Express the Caesar cipher using modular arithmetic notation',
            'Demonstrate why brute force easily breaks the Caesar cipher',
            'Implement a simple Caesar cipher in code',
        ],
        'key_concepts' => [
            'Caesar Cipher',
            'Substitution Cipher',
            'Modular Arithmetic',
            'Brute Force Attack',
            'ROT13',
            'Shift Cipher',
            'Key Space',
        ],
        'content' => <<<'MD'
# Caesar Cipher Warmup

## Introduction

The Caesar cipher is one of the oldest and simplest encryption techniques in history. Named after **Julius Caesar**, who reportedly used it to communicate with his generals, this cipher is a type of **substitution cipher** where each letter in the plaintext is replaced by a letter a fixed number of positions down the alphabet.

While trivially easy to break by modern standards, the Caesar cipher is an excellent starting point for understanding the fundamental concepts of encryption: keys, plaintext, ciphertext, and the mathematical foundations that underpin all of cryptography.

## Historical Background

According to the Roman historian **Suetonius**, Julius Caesar used a shift of 3 in his personal correspondence:

> *"If he had anything confidential to say, he wrote it in cipher, that is, by so changing the order of the letters of the alphabet, that not a word could be made out."* — Suetonius, *Life of Julius Caesar*

Caesar's nephew **Augustus** also used a cipher, though he simply shifted by one position. The technique was effective in an era when most people were illiterate and the concept of systematic codebreaking did not exist.

The Caesar cipher remained in use for centuries. As late as **1915**, the Russian military used it (and was easily broken by German cryptanalysts). Even today, **ROT13** — a Caesar cipher with a shift of 13 — is used informally on the internet to hide spoilers and puzzle answers.

## How the Caesar Cipher Works

### The Basic Concept

The Caesar cipher works by shifting each letter in the plaintext by a fixed number of positions in the alphabet. The **shift value** (also called the **key**) determines how many positions each letter moves.

**With a shift of 3:**
```
Plain:    A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
Cipher:   D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
```

The alphabet wraps around — after Z comes A.

### Step-by-Step Encryption Example

Encrypt **"HELLO WORLD"** with a shift of 3:

```
Plaintext:  H  E  L  L  O     W  O  R  L  D
Shift:     +3 +3 +3 +3 +3    +3 +3 +3 +3 +3
Ciphertext: K  H  O  O  R     Z  R  U  O  G
```

Result: **"HELLO WORLD"** becomes **"KHOOR ZRUOG"**

### Step-by-Step Decryption Example

To decrypt, shift in the **opposite direction** (subtract the key):

```
Ciphertext: K  H  O  O  R     Z  R  U  O  G
Shift:     -3 -3 -3 -3 -3    -3 -3 -3 -3 -3
Plaintext:  H  E  L  L  O     W  O  R  L  D
```

:::check
question: If you encrypt "HELLO" with a Caesar cipher shift of 3, what is the first letter of the ciphertext?
type: mcq
options: ["J", "K", "I", "G"]
answer: 1
hint: H is the 8th letter (index 7). Add 3 to get index 10, which is K.
:::

## Mathematical Notation

The Caesar cipher can be expressed using **modular arithmetic**. Assign each letter a number (A=0, B=1, ..., Z=25):

**Encryption:** E(x) = (x + k) mod 26

**Decryption:** D(x) = (x - k) mod 26

Where x is the numerical value of the letter and k is the shift key (0-25).

### Worked Example

Encrypt the letter **H** with key k = 3:

```
H = 7 (since A=0, B=1, ..., H=7)
E(7) = (7 + 3) mod 26 = 10 mod 26 = 10 = K
```

Encrypt the letter **Y** with key k = 3 (demonstrating wrap-around):

```
Y = 24
E(24) = (24 + 3) mod 26 = 27 mod 26 = 1 = B
```

## Implementation in Python

```python
def caesar_encrypt(plaintext, shift):
    """Encrypt plaintext using Caesar cipher with given shift."""
    result = []
    for char in plaintext:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            encrypted = chr((ord(char) - base + shift) % 26 + base)
            result.append(encrypted)
        else:
            result.append(char)
    return ''.join(result)

def caesar_decrypt(ciphertext, shift):
    """Decrypt ciphertext by shifting in the opposite direction."""
    return caesar_encrypt(ciphertext, -shift)

# Example usage
plaintext = "HELLO WORLD"
encrypted = caesar_encrypt(plaintext, 3)
print(f"Encrypted: {encrypted}")  # KHOOR ZRUOG

decrypted = caesar_decrypt(encrypted, 3)
print(f"Decrypted: {decrypted}")  # HELLO WORLD
```

## Implementation in JavaScript

```javascript
function caesarEncrypt(plaintext, shift) {
    return plaintext.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const base = char === char.toUpperCase()
                ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
            return String.fromCharCode(
                ((char.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base
            );
        }
        return char;
    }).join('');
}

console.log(caesarEncrypt("HELLO WORLD", 3));  // KHOOR ZRUOG
```

Note: In JavaScript we use `(... % 26 + 26) % 26` to handle negative numbers correctly.

:::check
question: How many possible keys does the Caesar cipher have (excluding shift of 0)?
type: fill_blank
answer: 25
hint: The alphabet has 26 letters, and a shift of 0 means no encryption.
:::

## Breaking the Caesar Cipher

### Brute Force Attack

The Caesar cipher has a **key space of only 25** (shifts 1-25). This makes it trivially breakable:

```python
def brute_force_caesar(ciphertext):
    """Try all 25 possible shifts."""
    for shift in range(1, 26):
        decrypted = caesar_decrypt(ciphertext, shift)
        print(f"Shift {shift:2d}: {decrypted}")

brute_force_caesar("KHOOR ZRUOG")
# Shift  3: HELLO WORLD  <-- clearly the answer
```

A human can easily spot the correct plaintext among 25 options. A computer can do it in microseconds.

### Frequency Analysis Preview

Even without brute force, the Caesar cipher is vulnerable to **frequency analysis**. Since each letter always maps to the same cipher letter, the frequency distribution of the ciphertext mirrors the plaintext — just shifted.

In English, **E** is the most common letter (~12.7%). If the most common letter in the ciphertext is **H**, then the shift is likely H - E = 3.

:::check
question: ROT13 is a special case of the Caesar cipher with a shift of 13, and applying it twice returns the original text.
type: true_false
answer: 0
hint: Since 13 + 13 = 26, and the alphabet has 26 letters, double application wraps back.
:::

## Special Case: ROT13

**ROT13** is a Caesar cipher with a shift of 13. Since 13 is exactly half of 26, applying ROT13 twice returns the original text:

```
ROT13(ROT13(text)) = text
```

This means the same function works for both encryption and decryption:

```python
def rot13(text):
    return caesar_encrypt(text, 13)

encrypted = rot13("HELLO")  # URYYB
decrypted = rot13("URYYB")  # HELLO
```

## Security Analysis

The Caesar cipher is **completely insecure** for any real-world application:

1. **Tiny key space**: Only 25 possible keys make brute force trivial
2. **Deterministic**: The same plaintext letter always produces the same ciphertext letter
3. **Preserves frequency distribution**: Vulnerable to frequency analysis
4. **No diffusion**: Changing one plaintext letter changes only one ciphertext letter
5. **No confusion**: The relationship between key and ciphertext is simple and linear

Despite these weaknesses, the Caesar cipher teaches fundamental concepts that apply to all of cryptography: the concept of a key, the relationship between encryption and decryption, key space size, and modular arithmetic.

## Summary

- The Caesar cipher shifts each letter by a fixed number of positions in the alphabet
- It was used by Julius Caesar around 100 BCE for military communications
- Mathematically: E(x) = (x + k) mod 26 and D(x) = (x - k) mod 26
- The key space is only 25, making brute force attacks trivial
- ROT13 is a special case where shift = 13
- While insecure, the Caesar cipher introduces fundamental cryptographic concepts

## References

- Singh, S. (1999). *The Code Book*. Anchor Books.
- Suetonius. *The Twelve Caesars*.
- Kahn, D. (1996). *The Codebreakers*. Scribner.
MD,
    ],

    'vigenere-with-repeating-keys' => [
        'learning_objectives' => [
            'Explain how the Vigenere cipher improves upon the Caesar cipher',
            'Encrypt and decrypt messages using the Vigenere cipher',
            'Understand why repeating keys create a vulnerability',
            'Apply the Kasiski examination to estimate key length',
            'Describe the Index of Coincidence and its role in cryptanalysis',
        ],
        'key_concepts' => [
            'Vigenere Cipher',
            'Polyalphabetic Substitution',
            'Tabula Recta',
            'Key Repetition',
            'Kasiski Examination',
            'Index of Coincidence',
        ],
        'content' => <<<'MD'
# Vigenere Cipher with Repeating Keys

## Introduction

The **Vigenere cipher** is a method of encrypting text using a series of different Caesar ciphers based on the letters of a keyword. It is a **polyalphabetic substitution cipher**, meaning that the same plaintext letter can be encrypted to different ciphertext letters depending on its position in the message.

For nearly 300 years, the Vigenere cipher was considered unbreakable, earning the nickname **"le chiffre indechiffrable"** (the indecipherable cipher). It was not until the 19th century that Charles Babbage and Friedrich Kasiski independently discovered methods to crack it.

## Historical Background

The cipher is named after **Blaise de Vigenere**, a 16th-century French diplomat, though the actual invention is attributed to **Giovan Battista Bellaso** in 1553. The cipher's reputation as unbreakable persisted until:
- **1863**: Friedrich Kasiski published a general method for breaking it
- **~1854**: Charles Babbage had independently broken it but never published
- **1920**: William Friedman developed the Index of Coincidence

## How the Vigenere Cipher Works

### The Vigenere Table (Tabula Recta)

The cipher uses a **26x26 grid** of shifted alphabets. Each row represents a Caesar cipher with a different shift. The key letter determines which row to use.

```
    A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
A | A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
B | B C D E F G H I J K L M N O P Q R S T U V W X Y Z A
C | C D E F G H I J K L M N O P Q R S T U V W X Y Z A B
...
K | K L M N O P Q R S T U V W X Y Z A B C D E F G H I J
...
Z | Z A B C D E F G H I J K L M N O P Q R S T U V W X Y
```

### Encryption Process

1. Choose a **keyword** (e.g., "KEY")
2. Repeat the keyword to match the length of the plaintext
3. For each plaintext letter, use the corresponding key letter to determine the shift

**Example: Encrypt "HELLO WORLD" with key "KEY"**

```
Plaintext:  H  E  L  L  O  W  O  R  L  D
Key:        K  E  Y  K  E  Y  K  E  Y  K
Ciphertext: R  I  J  V  S  U  Y  V  J  N
```

How each letter is computed:
- H + K: H(7) + K(10) = 17 mod 26 = R
- E + E: E(4) + E(4) = 8 mod 26 = I
- L + Y: L(11) + Y(24) = 35 mod 26 = 9 = J
- L + K: L(11) + K(10) = 21 mod 26 = V
- O + E: O(14) + E(4) = 18 mod 26 = S

### Mathematical Formulation

**Encryption:** C_i = (P_i + K_(i mod m)) mod 26

**Decryption:** P_i = (C_i - K_(i mod m)) mod 26

Where P_i is the plaintext letter, C_i is the ciphertext letter, K_j is the key letter, and m is the key length.

### Implementation in Python

```python
def vigenere_encrypt(plaintext, key):
    """Encrypt using Vigenere cipher."""
    result = []
    key = key.upper()
    key_index = 0
    for char in plaintext:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            shift = ord(key[key_index % len(key)]) - ord('A')
            encrypted = chr((ord(char) - base + shift) % 26 + base)
            result.append(encrypted)
            key_index += 1
        else:
            result.append(char)
    return ''.join(result)

def vigenere_decrypt(ciphertext, key):
    """Decrypt using Vigenere cipher."""
    result = []
    key = key.upper()
    key_index = 0
    for char in ciphertext:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            shift = ord(key[key_index % len(key)]) - ord('A')
            decrypted = chr((ord(char) - base - shift) % 26 + base)
            result.append(decrypted)
            key_index += 1
        else:
            result.append(char)
    return ''.join(result)

# Example
encrypted = vigenere_encrypt("HELLO WORLD", "KEY")
print(f"Encrypted: {encrypted}")  # RIJVS UYVJN
```

:::check
question: The Vigenere cipher is classified as which type of cipher?
type: mcq
options: ["Monoalphabetic substitution", "Polyalphabetic substitution", "Transposition", "Stream cipher"]
answer: 1
hint: It uses multiple different Caesar cipher shifts based on a keyword.
:::

## Why Repeating Keys Are Vulnerable

The Vigenere cipher's strength comes from using multiple alphabets. However, when the key is **shorter than the message**, it must be **repeated**, creating exploitable patterns.

### The Pattern Problem

With a key of length 3 (e.g., "KEY"), every 3rd letter is encrypted with the same Caesar cipher:
- Positions 0, 3, 6, 9, ... are encrypted with shift K(10)
- Positions 1, 4, 7, 10, ... are encrypted with shift E(4)
- Positions 2, 5, 8, 11, ... are encrypted with shift Y(24)

If we can determine the key length, we can split the ciphertext into groups, each encrypted with a simple Caesar cipher — and we already know how to break those!

## The Kasiski Examination

The **Kasiski examination** (published 1863) exploits the fact that repeated sequences in the plaintext, when aligned with the same portion of the key, produce repeated sequences in the ciphertext.

### How It Works

1. **Find repeated sequences** in the ciphertext (3+ characters)
2. **Calculate the distances** between the repeated sequences
3. **Find the GCD** (Greatest Common Divisor) of these distances
4. The GCD is likely the **key length** (or a multiple of it)

```python
from math import gcd
from functools import reduce

def kasiski_examination(ciphertext, min_length=3):
    """Find repeated sequences and estimate key length."""
    text = ciphertext.replace(" ", "").upper()
    distances = []
    for length in range(min_length, min(20, len(text) // 2)):
        for i in range(len(text) - length):
            sequence = text[i:i + length]
            j = text.find(sequence, i + 1)
            while j != -1:
                distances.append(j - i)
                j = text.find(sequence, j + 1)
    if not distances:
        return None
    return reduce(gcd, distances)
```

## The Index of Coincidence (IC)

The **Index of Coincidence** (Friedman, 1920) measures the probability that two randomly chosen letters from a text are the same:

```
IC = sum(n_i * (n_i - 1)) / (N * (N - 1))
```

Where n_i is the count of the i-th letter and N is the total number of letters.

**Key values:**
- English text: IC is approximately 0.0667
- Random text: IC is approximately 0.0385 (1/26)

To find the key length, split the ciphertext into groups for each candidate length. The correct key length produces groups with IC close to 0.0667.

```python
def index_of_coincidence(text):
    """Calculate the Index of Coincidence."""
    text = ''.join(c for c in text.upper() if c.isalpha())
    n = len(text)
    if n <= 1:
        return 0
    freq = [0] * 26
    for char in text:
        freq[ord(char) - ord('A')] += 1
    numerator = sum(f * (f - 1) for f in freq)
    denominator = n * (n - 1)
    return numerator / denominator if denominator > 0 else 0

def estimate_key_length(ciphertext, max_key_length=20):
    """Estimate key length using IC."""
    text = ''.join(c for c in ciphertext.upper() if c.isalpha())
    for key_len in range(1, max_key_length + 1):
        groups = ['' for _ in range(key_len)]
        for i, char in enumerate(text):
            groups[i % key_len] += char
        avg_ic = sum(index_of_coincidence(g) for g in groups) / key_len
        print(f"Key length {key_len:2d}: IC = {avg_ic:.4f}")
```

:::check
question: The Kasiski examination helps determine what aspect of the Vigenere cipher?
type: mcq
options: ["The plaintext language", "The key length", "The encryption algorithm", "The ciphertext frequency"]
answer: 1
hint: It looks for repeated sequences in the ciphertext to find patterns related to the key.
:::

## Caesar vs Vigenere Comparison

| Feature | Caesar Cipher | Vigenere Cipher |
|---------|--------------|-----------------|
| Type | Monoalphabetic | Polyalphabetic |
| Key | Single number (0-25) | Word/phrase |
| Key space | 25 | 26^m (m = key length) |
| Same letter always same cipher? | Yes | No |
| Frequency analysis | Directly applicable | Requires key length first |

## Summary

- The Vigenere cipher uses a **keyword** to apply different Caesar shifts to different positions
- It is a **polyalphabetic** cipher — the same plaintext letter can encrypt to different ciphertext letters
- When the key is shorter than the message, it **repeats**, creating exploitable patterns
- The **Kasiski examination** finds repeated ciphertext sequences to estimate key length
- The **Index of Coincidence** provides a statistical method for key length estimation
- Once the key length is known, each position can be broken as an independent Caesar cipher

## References

- Kasiski, F. W. (1863). *Die Geheimschriften und die Dechiffrir-Kunst*.
- Friedman, W. F. (1920). *The Index of Coincidence and Its Applications in Cryptanalysis*.
- Singh, S. (1999). *The Code Book*. Anchor Books.
MD,
    ],

    'frequency-analysis' => [
        'learning_objectives' => [
            'Describe the frequency distribution of letters in English text',
            'Apply frequency analysis to break a monoalphabetic substitution cipher',
            'Calculate the Index of Coincidence for a given text',
            'Explain why polyalphabetic ciphers resist simple frequency analysis',
            'Use digram and trigram analysis to refine decryption attempts',
        ],
        'key_concepts' => [
            'Frequency Analysis',
            'Letter Frequency Distribution',
            'Index of Coincidence',
            'Monoalphabetic Cipher',
            'Digrams and Trigrams',
            'ETAOIN SHRDLU',
            'Chi-Squared Statistic',
        ],
        'content' => <<<'MD'
# Frequency Analysis

## Introduction

**Frequency analysis** is one of the most powerful techniques in classical cryptanalysis. It exploits the fact that in any natural language, certain letters, pairs of letters (digrams), and triplets (trigrams) appear with predictable frequencies. By analyzing the frequency distribution of characters in ciphertext, a cryptanalyst can deduce the substitution mapping and recover the plaintext.

This technique was first described by the Arab polymath **Al-Kindi** in the 9th century in his manuscript *"On Deciphering Cryptographic Messages"* — making it one of the earliest known contributions to cryptanalysis.

## English Letter Frequencies

Through analysis of large English text corpora, the following letter frequencies have been established:

```
Letter  Frequency       Letter  Frequency
  E      12.70%           N      6.75%
  T       9.06%           S      6.33%
  A       8.17%           H      6.09%
  O       7.51%           R      5.99%
  I       6.97%           D      4.25%
```

The mnemonic **"ETAOIN SHRDLU"** captures the 12 most common letters in approximate order.

The least common letters are: **J** (0.15%), **X** (0.15%), **Q** (0.10%), **Z** (0.07%).

:::check
question: What is the most common letter in the English language?
type: fill_blank
answer: E
hint: It appears approximately 12.7% of the time in English text.
:::

## How Frequency Analysis Works

### Breaking a Monoalphabetic Substitution Cipher

In a monoalphabetic substitution cipher, each letter is consistently replaced by another letter. The substitution is fixed throughout the entire message. This means the frequency distribution of the ciphertext directly reflects the frequency distribution of the plaintext — just with different labels.

### Step-by-Step Process

**Step 1: Count letter frequencies in the ciphertext**

```python
def count_frequencies(text):
    """Count letter frequencies in text."""
    text = text.upper()
    freq = {}
    total = 0
    for char in text:
        if char.isalpha():
            freq[char] = freq.get(char, 0) + 1
            total += 1
    return {k: (v / total) * 100 for k, v in
            sorted(freq.items(), key=lambda x: -x[1])}

ciphertext = "GSVJF RMWLF GGSVI VHHLX PVGHS VMFNY VIHGS VBXZM"
frequencies = count_frequencies(ciphertext)
for letter, pct in frequencies.items():
    print(f"  {letter}: {pct:.1f}%")
```

**Step 2: Map the most frequent ciphertext letters to the most frequent English letters**

If the most common ciphertext letter is **V** (appearing ~15%), it likely maps to **E** (12.7% in English).

**Step 3: Use context and common patterns to refine**

- Look for single-letter words (likely "A" or "I")
- Look for common digrams: TH, HE, IN, ER, AN, RE
- Look for common trigrams: THE, AND, ING, HER, HAT
- Look for double letters: LL, SS, EE, OO, TT

**Step 4: Iterate and refine until the plaintext emerges**

### Worked Example

Given this ciphertext (encrypted with a simple substitution):

```
GSV JFRXP YILDM ULC QFNKH LEVI GSV OZAB WLT
```

**Step 1**: Count frequencies. G, S, V appear most often.

**Step 2**: The trigram "GSV" appears twice. The most common English trigram is "THE". So: G=T, S=H, V=E.

**Step 3**: Substituting what we know:
```
THE ?????  ????  ???  ?????  ????  THE  ????  ???
```

**Step 4**: Continue mapping. This is actually an Atbash cipher (A=Z, B=Y, etc.), and the plaintext is: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"

## Digram and Trigram Analysis

Single-letter frequency analysis is powerful but sometimes ambiguous. **Digram** (two-letter) and **trigram** (three-letter) analysis provides additional constraints:

### Most Common English Digrams
```
TH  3.56%    HE  3.07%    IN  2.43%
ER  2.05%    AN  1.99%    RE  1.85%
ON  1.76%    AT  1.49%    EN  1.45%
```

### Most Common English Trigrams
```
THE  3.51%    AND  1.59%    ING  1.15%
HER  0.82%    HAT  0.65%    HIS  0.60%
```

## The Index of Coincidence

The **Index of Coincidence** (IC), developed by William Friedman in 1920, quantifies how "non-random" a text's letter distribution is:

```
IC = sum(n_i * (n_i - 1)) / (N * (N - 1))
```

**Interpretation:**
- **English text**: IC approximately 0.0667 (letters are unevenly distributed)
- **Random text**: IC approximately 0.0385 (1/26, uniform distribution)
- **Monoalphabetic cipher**: IC approximately 0.0667 (preserves frequency distribution)
- **Polyalphabetic cipher**: IC between 0.0385 and 0.0667 (flattens distribution)

```python
def index_of_coincidence(text):
    """Calculate the Index of Coincidence."""
    text = ''.join(c for c in text.upper() if c.isalpha())
    n = len(text)
    if n <= 1:
        return 0.0
    freq = [0] * 26
    for char in text:
        freq[ord(char) - ord('A')] += 1
    ic = sum(f * (f - 1) for f in freq) / (n * (n - 1))
    return ic
```

:::check
question: In frequency analysis, the mnemonic for the 12 most common English letters is "ETAOIN SHRDLU".
type: true_false
answer: 0
hint: This ordering has been established through analysis of large English text corpora.
:::

## The Chi-Squared Statistic

The **chi-squared statistic** provides a rigorous way to compare observed frequencies with expected English frequencies:

```
chi_squared = sum((observed_i - expected_i)^2 / expected_i)
```

A **lower** chi-squared value indicates a better match to English.

```python
ENGLISH_FREQ = [
    0.0817, 0.0129, 0.0278, 0.0425, 0.1270, 0.0223,
    0.0202, 0.0609, 0.0697, 0.0015, 0.0077, 0.0403,
    0.0241, 0.0675, 0.0751, 0.0193, 0.0010, 0.0599,
    0.0633, 0.0906, 0.0276, 0.0098, 0.0236, 0.0015,
    0.0197, 0.0007
]

def chi_squared(text):
    """Calculate chi-squared against English frequencies."""
    text = ''.join(c for c in text.upper() if c.isalpha())
    n = len(text)
    if n == 0:
        return float('inf')
    freq = [0] * 26
    for char in text:
        freq[ord(char) - ord('A')] += 1
    return sum(
        (freq[i] - n * ENGLISH_FREQ[i]) ** 2 / (n * ENGLISH_FREQ[i])
        for i in range(26)
    )
```

:::check
question: What does the Index of Coincidence (IC) measure?
type: mcq
options: ["The length of the encryption key", "The probability two random letters from a text are the same", "The number of unique letters in a text", "The encryption strength of a cipher"]
answer: 1
hint: It quantifies how non-random a text's letter distribution is.
:::

## Why Polyalphabetic Ciphers Resist Frequency Analysis

Polyalphabetic ciphers like the Vigenere cipher use **multiple substitution alphabets**, which flattens the frequency distribution of the ciphertext. The letter E might be encrypted as five different letters depending on its position, making simple frequency counting ineffective.

However, as we learned in the previous lesson, if the key repeats, we can:
1. Determine the key length (Kasiski examination or IC method)
2. Split the ciphertext into groups (one per key position)
3. Apply frequency analysis to each group independently

## Practical Tips for Frequency Analysis

1. **Longer ciphertext is easier** — Short texts may not have representative frequencies
2. **Start with the most common letters** — E, T, A, O, I, N
3. **Look for patterns** — Double letters, common words, word boundaries
4. **Use digrams and trigrams** — They provide stronger constraints than single letters
5. **Be flexible** — Your first guesses may be wrong; be ready to backtrack
6. **Consider the language** — Different languages have different frequency distributions

## Summary

- Frequency analysis exploits the non-uniform distribution of letters in natural language
- In English, E (12.7%), T (9.1%), and A (8.2%) are the most common letters
- Monoalphabetic ciphers preserve frequency distributions and are vulnerable to this attack
- Digram and trigram analysis provides additional constraints for breaking ciphers
- The Index of Coincidence quantifies how non-random a text distribution is
- The chi-squared statistic provides a rigorous comparison to expected frequencies
- Polyalphabetic ciphers resist simple frequency analysis but can be broken once the key length is known

## References

- Al-Kindi (9th century). *On Deciphering Cryptographic Messages*.
- Friedman, W. F. (1920). *The Index of Coincidence*.
- Singh, S. (1999). *The Code Book*. Anchor Books.
- Stinson, D. R. (2005). *Cryptography: Theory and Practice*. CRC Press.
MD,
    ],
];
