<?php

namespace Database\Seeders;

use App\Models\StoryChapter;
use App\Services\StoryService;
use Illuminate\Database\Seeder;

class StoryChapterSeeder extends Seeder
{
    /**
     * Seed the story chapter definitions for the Crypto Agent narrative.
     */
    public function run(): void
    {
        $chapters = [
            // ── Prologue ──
            [
                'slug' => 'the-recruitment',
                'title' => 'The Recruitment',
                'chapter_number' => 0,
                'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
                'unlock_value' => '1',
                'icon' => 'mail',
                'narrative' => <<<'MD'
## Prologue: The Recruitment

The message arrived at 03:47 AM — a single encrypted file buried inside what appeared to be routine network traffic. Most people would have missed it entirely. But you're not most people.

You'd been tinkering with ciphers since you were fourteen, breaking substitution puzzles in the school newspaper and writing your own encryption scripts for fun. Your professors called it a gift. Your classmates called it obsession. You called it *Tuesday*.

The file resisted your first three decryption attempts. RSA padding? No. AES-CBC? Close, but no. It wasn't until you noticed the repeating key pattern — a telltale signature of a **Vigenère cipher** layered over a modern encoding scheme — that the message finally yielded:

```
AGENT CANDIDATE IDENTIFIED.
CLASSIFICATION: SIGMA-7
REPORT TO THE CIPHER BUREAU.
COORDINATES ENCLOSED.
— V.
```

The Cipher Bureau. You'd heard whispers about them in cryptography forums — a shadow organization that operates at the intersection of mathematics and national security. They don't recruit through job postings. They recruit through *puzzles*.

The coordinates led to an unmarked building in the financial district. No signs. No reception desk. Just a steel door with a keypad that accepted a 256-bit code derived from the original message.

Inside, a woman in a dark suit extended her hand. "Welcome, Agent. I'm your handler. You may call me **Vigenère** — it's a codename, naturally. We've been watching your work for some time."

She slid a dossier across the table. "The world's digital infrastructure is under threat. Encrypted communications compromised. Financial systems targeted. We need people who understand cryptography not as theory, but as a *weapon and a shield*."

She paused. "Your training begins now."

**Your journey as a Crypto Agent has begun.**
MD,
            ],

            // ── Act 1: Classical Foundations ──
            [
                'slug' => 'first-assignment',
                'title' => 'First Assignment',
                'chapter_number' => 1,
                'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
                'unlock_value' => 'crypto-foundations',
                'icon' => 'briefcase',
                'narrative' => <<<'MD'
## Chapter 1: First Assignment

Agent Vigenère led you through a maze of corridors deep beneath the Bureau's headquarters. Fluorescent lights hummed overhead as you passed doors marked with classification levels you'd never seen before.

"We intercepted a series of communications last week," she explained, her heels clicking against the polished concrete floor. "Enemy operatives are using what appears to be a hybrid cipher system — classical techniques wrapped in modern encoding. Our automated systems can't crack them."

She stopped at a reinforced door and pressed her palm against a biometric scanner. The lock disengaged with a satisfying *thunk*.

Inside, screens lined every wall, each displaying fragments of intercepted messages. Strings of seemingly random characters scrolled endlessly.

"This is **Operation Rosetta**," Vigenère continued. "The intercepted messages use a combination of Caesar shifts, transposition patterns, and frequency-masked substitutions. Basic techniques — but layered cleverly enough to fool our AI."

She turned to face you. "That's why we need a human cryptanalyst. Someone who understands the *foundations*."

You studied the first intercept. The letter frequency distribution was off — too flat for English, but not random enough for strong encryption. A classic sign of **polyalphabetic substitution**.

Within hours, you'd identified the key length using Kasiski examination and reconstructed the keyword: **SHADOW**. The messages revealed coordinates, dates, and a chilling phrase repeated in every communication:

*"The network is already compromised."*

Vigenère read your analysis and nodded slowly. "Excellent work, Agent. You've confirmed what we feared — this is bigger than isolated chatter. There's a coordinated operation underway."

She placed a new badge on the table — **Field Agent, Cryptanalysis Division**.

"You've earned this. But the real work is just beginning."

**Promotion: Field Agent — Cryptanalysis Division**
MD,
            ],

            [
                'slug' => 'the-cipher-room',
                'title' => 'The Cipher Room',
                'chapter_number' => 2,
                'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
                'unlock_value' => 'applied-classical-ciphers',
                'icon' => 'key',
                'narrative' => <<<'MD'
## Chapter 2: The Cipher Room

The intercepted messages painted a disturbing picture. Behind the classical ciphers lay references to modern infrastructure — power grids, banking networks, satellite communications. Someone was using old-school cryptography as a smokescreen for a very modern threat.

"You cracked the outer layer," Vigenère said, leading you to a new section of the Bureau. "But the inner messages reference encryption protocols that go far beyond Caesar and Vigenère. We need you to level up."

She stopped before a massive vault door etched with mathematical symbols — Euler's identity, the RSA equation, elliptic curve parameters.

"Welcome to **The Cipher Room**."

The door swung open to reveal the Bureau's most advanced cryptographic laboratory. Workstations equipped with custom hardware lined the room. Whiteboards covered in equations filled every available wall space. In the center, a holographic display projected real-time encrypted traffic from around the globe.

"This is where our agents train and experiment," Vigenère explained. "Every classical cipher ever documented is cataloged here, along with tools to analyze, break, and reconstruct them. Rail fences, Playfair matrices, Enigma rotors — they're all here."

An older agent with silver hair looked up from his workstation. "Ah, the new recruit. I'm **Agent Alberti**. I maintain the historical archives." He gestured to a wall of antique cipher machines. "People think classical cryptography is obsolete. They're wrong. Understanding *how* these systems fail teaches you *why* modern systems succeed."

He handed you a worn leather journal. "My personal notes on every classical cipher break I've performed in forty years of service. Consider it a gift."

You spent weeks in the Cipher Room, mastering transposition techniques, breaking Playfair ciphers by hand, and understanding the mathematical elegance behind Enigma's rotors. Each broken cipher revealed another piece of the enemy's communication network.

The pattern was clear: the adversary was testing defenses, probing for weaknesses in systems that still relied on outdated cryptographic primitives.

"You've mastered the classical arsenal," Vigenère said. "Now it's time to face the modern battlefield."

**Access Granted: The Cipher Room — Advanced Cryptographic Laboratory**
MD,
            ],

            // ── Act 2: Modern Arsenal ──
            [
                'slug' => 'digital-weapons',
                'title' => 'Digital Weapons',
                'chapter_number' => 3,
                'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
                'unlock_value' => 'modern-crypto-principles',
                'icon' => 'shield',
                'narrative' => <<<'MD'
## Chapter 3: Digital Weapons

The alarm pierced through the Bureau at 06:00 sharp. Red lights bathed the corridors as agents scrambled to their stations. This was no drill.

"We have a **Code Crimson**," Vigenère announced over the secure channel. "Critical infrastructure attack detected. Power grid control systems in three major cities are reporting anomalous encrypted traffic. Someone is injecting commands into the SCADA networks."

You rushed to the operations center. Screens displayed network topology maps with angry red nodes pulsing across the eastern seaboard. The attack was sophisticated — encrypted command packets that mimicked legitimate traffic, signed with forged certificates.

"They're using **AES-256 in CTR mode** with a compromised key schedule," the lead analyst reported. "We can see the traffic, but we can't distinguish attack commands from legitimate ones without breaking their encryption layer."

Vigenère turned to you. "This is why you're here, Agent. You've been assigned to the **Digital Defense Unit**. Your mission: analyze the encryption scheme, identify the vulnerability in their key derivation, and develop a countermeasure."

The next seventy-two hours were the most intense of your career. You traced the attack's encryption to a flawed implementation of **PBKDF2** — the attackers had used insufficient iterations, making their derived keys vulnerable to a targeted brute-force attack. Combined with a **padding oracle** vulnerability in their CBC fallback mode, you found the crack in their armor.

Working with the DDU team, you developed a real-time decryption filter that could identify and neutralize malicious commands before they reached the power grid controllers. The filter used **HMAC verification** to authenticate legitimate traffic and quarantine anything that failed the integrity check.

By hour sixty-eight, the attack was contained. The power grids stabilized. Three cities never knew how close they came to a blackout.

"Outstanding work," Vigenère said, exhaustion evident in her voice. "You didn't just stop an attack — you built a defense system we can deploy permanently."

**Assignment: Digital Defense Unit — Modern Cryptographic Operations**
MD,
            ],

            [
                'slug' => 'the-blockchain-trail',
                'title' => 'The Blockchain Trail',
                'chapter_number' => 4,
                'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
                'unlock_value' => 'blockchain-cryptography',
                'icon' => 'link',
                'narrative' => <<<'MD'
## Chapter 4: The Blockchain Trail

The infrastructure attack was neutralized, but the Bureau's investigation was far from over. The attackers had been funded — and the money trail led somewhere unexpected.

"We traced the payment channels," said **Agent Merkle**, the Bureau's blockchain forensics specialist. She pulled up a visualization on the main screen — a sprawling web of cryptocurrency transactions spanning dozens of wallets across multiple chains.

"They're using a sophisticated **mixing protocol** to launder funds through decentralized exchanges. Standard chain analysis can't follow the trail because they're exploiting **zero-knowledge proofs** to mask transaction amounts."

She looked at you. "But you understand the math behind these systems now. We need you to find the flaw."

You dove into the blockchain data. The mixing protocol was clever — it used **Pedersen commitments** to hide transaction values and **ring signatures** to obscure sender identities. On the surface, it was cryptographically sound.

But you noticed something. The implementation of their **elliptic curve operations** had a subtle bug — they were reusing nonces in their ECDSA signatures. A classic mistake that had brought down systems before.

"If they reuse nonces, we can extract their private keys using the **lattice reduction technique**," you explained to Agent Merkle. "Once we have the keys, we can trace every transaction they've ever made."

Over the next week, you and Merkle built a custom analysis tool. Using the extracted keys, you unraveled the entire financial network — shell companies, compromised exchange accounts, and a chain of **Merkle tree** manipulations designed to forge transaction proofs.

The evidence was irrefutable. The Bureau's legal team secured warrants, and coordinated raids across four countries seized over $200 million in stolen cryptocurrency.

"You followed the math where others saw only noise," Merkle said, genuine admiration in her voice. "The blockchain doesn't lie — but it takes someone who understands **ECC, hash functions, and commitment schemes** to read it properly."

**Operation Complete: Blockchain Forensics — Financial Network Dismantled**
MD,
            ],

            // ── Act 3: The Final Mission ──
            [
                'slug' => 'operation-zero-trust',
                'title' => 'Operation Zero Trust',
                'chapter_number' => 5,
                'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
                'unlock_value' => 'network-security-essentials',
                'icon' => 'lock',
                'narrative' => <<<'MD'
## Chapter 5: Operation Zero Trust

The raids had crippled the enemy's financial network, but intelligence reports revealed something far more alarming: the attacks were just a distraction. The real target was the global **Public Key Infrastructure** itself.

"They've compromised three root Certificate Authorities," Vigenère said, her face grave. "If they issue fraudulent certificates, they can perform man-in-the-middle attacks on *any* TLS connection worldwide. Banking, healthcare, government — everything becomes vulnerable."

This was the Bureau's worst nightmare. The entire trust model of the internet depended on PKI integrity.

"We're launching **Operation Zero Trust**," Vigenère continued. "You'll lead the technical team. Your mission: identify the compromised CAs, revoke the fraudulent certificates, and deploy a new verification protocol before the attackers can exploit their position."

You assembled the best agents the Bureau had: Merkle for blockchain-based certificate transparency, Alberti for cryptographic protocol design, and a new recruit — **Agent Diffie** — an expert in key exchange protocols.

The operation unfolded in three phases.

**Phase 1: Detection.** Using **Certificate Transparency logs** and custom monitoring tools, your team identified 847 fraudulent certificates issued across the compromised CAs. Each one was a potential weapon.

**Phase 2: Containment.** Working with browser vendors and operating system maintainers, you coordinated the largest certificate revocation event in history. Your team implemented **OCSP stapling** improvements that reduced revocation check latency from seconds to milliseconds.

**Phase 3: Reconstruction.** This was your masterpiece. You designed a **zero-knowledge proof-based certificate validation system** that didn't rely on trusting any single CA. Instead, it used a distributed network of validators — each one verifying certificates using **multi-party computation** without revealing their individual trust assessments.

The new protocol, codenamed **AEGIS**, was deployed across critical infrastructure within 48 hours. The attackers' compromised certificates became worthless overnight.

"You didn't just stop an attack," Vigenère said at the debriefing. "You fundamentally improved how the internet establishes trust."

She placed a new insignia on the table — a shield with an embedded key, the symbol of the Bureau's highest operational rank.

"Congratulations, **Senior Crypto Agent**. You've earned it."

**Promotion: Senior Crypto Agent — Operation Zero Trust Complete**
MD,
            ],

            // ── Bonus Chapters ──
            [
                'slug' => 'the-speed-demon-files',
                'title' => 'The Speed Demon Files',
                'chapter_number' => 6,
                'unlock_type' => StoryChapter::UNLOCK_BADGE_EARNED,
                'unlock_value' => 'speed-demon',
                'icon' => 'zap',
                'narrative' => <<<'MD'
## Chapter 6: The Speed Demon Files

A classified folder appeared on your desk one morning, stamped with a lightning bolt insignia and the words **"EYES ONLY — SPEED DEMON CLEARANCE"**.

Inside, you found the Bureau's most closely guarded performance records — the **Speed Demon Files**. A registry of agents whose reaction times and analytical speed exceeded all known benchmarks.

The first entry dated back to 1943: **Agent Turing**, who reportedly broke an Enigma variant in under four minutes during a live field operation. The margin notes read: *"Fastest cryptanalysis under combat conditions ever recorded."*

The list continued through the decades. **Agent Shannon** (1952) — decoded a Soviet cipher during a 90-second elevator ride. **Agent Rivest** (1977) — factored a 64-bit semiprime mentally while waiting for coffee. **Agent Zimmermann** (1991) — wrote a complete encryption protocol during a single transatlantic flight.

And now, at the bottom of the list, a new entry:

**Your name. Today's date.**

*"Challenge solution delivered in under 5 seconds. Fastest recorded response in the current operational period."*

A handwritten note from Vigenère was clipped to the page:

*"Speed isn't just about being fast — it's about pattern recognition so deep that the answer arrives before the conscious mind finishes reading the question. You've developed that instinct. The Bureau's fastest agents share one trait: they don't just know cryptography. They feel it."*

*"Welcome to the Speed Demon registry, Agent."*

You closed the folder and smiled. Some legacies are measured in milliseconds.

**Classified Access: Speed Demon Registry — Elite Performance Division**
MD,
            ],

            [
                'slug' => 'the-streak-protocol',
                'title' => 'The Streak Protocol',
                'chapter_number' => 7,
                'unlock_type' => StoryChapter::UNLOCK_BADGE_EARNED,
                'unlock_value' => 'streak-30',
                'icon' => 'flame',
                'narrative' => <<<'MD'
## Chapter 7: The Streak Protocol

Thirty consecutive days. Not a single day missed.

When you badged into the Bureau on Day 30, the security system didn't just beep — it played a three-note chime you'd never heard before. The turnstile display flashed: **STREAK PROTOCOL ACTIVATED**.

Agent Vigenère was waiting in the corridor. "Follow me," she said, with a rare hint of a smile.

She led you to a section of the Bureau you'd never accessed before — **Sub-Level Omega**. The elevator required a retinal scan, a voice passphrase, and a cryptographic challenge that changed every six hours.

"The Streak Protocol is our oldest tradition," Vigenère explained as the elevator descended. "It dates back to the Bureau's founding. The principle is simple: consistency is the most powerful force in cryptography — and in life."

Sub-Level Omega housed the Bureau's **Continuity Archives** — records of every agent who had maintained an unbroken training streak of 30 days or more. The walls were lined with portraits and plaques.

"Every breakthrough in the Bureau's history," Vigenère said, gesturing to the archives, "was made by an agent on an active streak. Not because streaks are magic — but because the discipline required to show up every single day rewires how you think."

She handed you a new access card — matte black with a single flame emblem.

"This grants you **Omega Clearance**. You can access advanced training simulations, classified research papers, and the Bureau's private cryptographic library. Resources reserved for agents who've proven they have the dedication to use them wisely."

She paused at the door. "Thirty days is impressive, Agent. But the real question is: can you keep going?"

You looked at the card in your hand. The flame emblem seemed to glow.

Challenge accepted.

**Clearance Upgraded: Streak Protocol — Omega Level Access**
MD,
            ],

            [
                'slug' => 'lab-masters-archive',
                'title' => "Lab Master's Archive",
                'chapter_number' => 8,
                'unlock_type' => StoryChapter::UNLOCK_BADGE_EARNED,
                'unlock_value' => 'lab-explorer-6',
                'icon' => 'archive',
                'narrative' => <<<'MD'
## Chapter 8: Lab Master's Archive

You'd visited every lab in the Bureau — all six of them. The Caesar Cipher simulator. The Frequency Analysis workbench. The RSA key generation suite. The Hash Function collision detector. The Digital Signature verifier. The Blockchain transaction visualizer.

Each lab had taught you something different. Not just the mechanics of cryptographic algorithms, but the *intuition* behind them — why certain approaches work, how vulnerabilities emerge, and what makes a system truly secure.

When you completed your sixth lab visit, a notification appeared on your workstation:

```
LAB MASTER STATUS ACHIEVED
ARCHIVE ACCESS GRANTED
REPORT TO RESEARCH WING — ROOM 404
```

Room 404 was legendary among Bureau agents. Officially, it didn't exist — the room number was a deliberate joke by the Bureau's founders. But behind its unmarked door lay the **Lab Master's Archive**: a collection of advanced cryptographic research that represented decades of the Bureau's most innovative work.

**Agent Alberti** was the Archive's curator. He greeted you with a knowing nod.

"Only agents who've experienced every lab earn access here," he said. "Theory without practice is philosophy. Practice without breadth is tunnel vision. But an agent who's worked across *all* domains? That's a cryptographer."

The Archive contained treasures:

- **Unpublished papers** on post-quantum cryptographic schemes still years from public release
- **Simulation environments** for testing cryptographic protocols against adversarial AI
- **Historical case studies** of every major cipher break in the Bureau's history, annotated by the agents who performed them
- **A quantum computing sandbox** for experimenting with Shor's algorithm and Grover's search

"This knowledge is your reward for curiosity," Alberti said. "Most agents specialize. You explored. That makes you dangerous — in the best possible way."

**Archive Unlocked: Lab Master's Research Collection — Full Spectrum Access**
MD,
            ],

            [
                'slug' => 'the-grandmasters-legacy',
                'title' => "The Grandmaster's Legacy",
                'chapter_number' => 9,
                'unlock_type' => StoryChapter::UNLOCK_LEVEL_REACHED,
                'unlock_value' => '25',
                'icon' => 'crown',
                'narrative' => <<<'MD'
## Chapter 9: The Grandmaster's Legacy

Level 25. A milestone that fewer than one percent of Bureau agents ever reach.

When your XP counter ticked past the threshold, every screen in the Bureau flickered for exactly one second — a tradition, you'd later learn, that dated back to the organization's founding.

Vigenère appeared at your workstation within minutes. "It's time," she said simply.

She led you to a part of the Bureau you'd never seen — a private study behind the Director's office. The room was small, warm, and lined floor-to-ceiling with books. A single desk sat in the center, covered in handwritten notes and mathematical proofs.

"This was the office of **The Grandmaster**," Vigenère said quietly. "The Bureau's founder. Real name classified — even I don't know it. What I know is that this person single-handedly designed the cryptographic protocols that protected allied communications during three separate global conflicts."

She gestured to the desk. "These are the Grandmaster's personal notes. Unpublished. Undigitized. Available only to agents who reach Level 25."

You sat down and began reading. The handwriting was precise, almost architectural. The notes covered everything from the mathematical foundations of information theory to practical field techniques for secure communication under surveillance.

But it was the final entry that stopped you cold:

*"Cryptography is not about secrets. It is about trust. Every algorithm, every protocol, every key exchange is ultimately an answer to the same question: How do we establish trust in a world where deception is always possible?"*

*"The answer is not found in mathematics alone. It is found in the people who wield it — their discipline, their ethics, their relentless pursuit of understanding."*

*"If you are reading this, you have proven yourself worthy of that pursuit. The Bureau's legacy is now yours to carry forward."*

You closed the notebook carefully. The weight of responsibility settled on your shoulders — not as a burden, but as a purpose.

**Legacy Unlocked: The Grandmaster's Personal Archives — Level 25 Distinction**
MD,
            ],

            [
                'slug' => 'epilogue-the-next-generation',
                'title' => 'Epilogue: The Next Generation',
                'chapter_number' => 10,
                'unlock_type' => StoryChapter::UNLOCK_LEVEL_REACHED,
                'unlock_value' => '50',
                'icon' => 'star',
                'narrative' => <<<'MD'
## Epilogue: The Next Generation

Level 50. The pinnacle.

No fanfare this time. No flickering screens. Just a quiet knock on your office door — yes, *your* office now, in the senior wing of the Bureau — and Vigenère stepping inside with two cups of coffee.

"I remember when you first walked through our doors," she said, settling into the chair across from your desk. "A talented amateur with good instincts and no idea what you were getting into."

She sipped her coffee. "Now look at you. Senior Crypto Agent. Operation leader. The agent who redesigned our PKI infrastructure, dismantled a criminal financial network, and defended critical infrastructure against state-level attacks."

She set down her cup. "Which is why I'm here. I'm retiring, Agent."

The words hung in the air.

"The Bureau needs new leadership. Not just technical expertise — we have plenty of that. We need someone who understands that cryptography is about *people*. Someone who can teach the next generation not just how to break ciphers, but *why* it matters."

She slid a folder across the desk. Inside was a list of names — new recruits, each one identified the same way you had been: through a puzzle, an encrypted message, a test of curiosity and persistence.

"These are your candidates," Vigenère said. "Your first class of recruits. They're raw, talented, and completely unprepared for what's coming."

She stood and extended her hand. "The Bureau is yours now, **Director**."

You looked at the list of names. Each one represented a journey about to begin — the same journey you'd taken from that first encrypted message to this moment.

You picked up a pen and began writing their first assignment: a mysterious encrypted file, buried in routine network traffic, containing an invitation to join The Cipher Bureau.

The cycle continues.

*"In cryptography, as in life, the end of one message is always the beginning of another."*
— The Grandmaster

**THE END... or is it?**

**Final Rank: Director of The Cipher Bureau — Level 50 Achieved**
MD,
            ],

            // ── Post-Quantum Chapter ──
            [
                'slug' => 'quantum-frontier',
                'title' => 'The Quantum Frontier',
                'chapter_number' => 11,
                'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
                'unlock_value' => 'post-quantum-cryptography',
                'icon' => 'atom',
                'narrative' => <<<'MD'
## Chapter 11: The Quantum Frontier

The alert came not as a siren, but as a silence. Every quantum-monitoring sensor in the Bureau went dark for exactly 3.7 seconds — then rebooted with data that made your blood run cold.

"We've detected coherent qubit operations at scale," Agent Diffie reported, his voice carefully controlled. "A state-sponsored lab has achieved 4,000 logical qubits with error correction. They're not publishing. They're not announcing. They're *using* it."

Vigenère — now serving as your senior advisor — pulled up the threat assessment. "If they can run Shor's algorithm at this scale, every RSA and ECC key on the planet is compromised. Every TLS certificate. Every digital signature. Every encrypted communication from the last thirty years."

The room fell silent. This was **Q-Day** — the moment the Bureau had been preparing for since you first learned about lattice-based cryptography.

But you were ready.

"Activate **Protocol Lattice Shield**," you ordered. The protocol you'd designed months ago — a comprehensive migration plan built on NIST's FIPS 203, 204, and 205 standards.

Phase one deployed within hours: hybrid key exchange using **X25519 + ML-KEM-768** across all Bureau communications. Your crypto-agile architecture made the switch seamless — a configuration change, not a rewrite.

Phase two followed: **ML-DSA (Dilithium)** signatures replaced ECDSA across the Bureau's certificate infrastructure. As a backup, critical systems also deployed **SLH-DSA (SPHINCS+)** signatures — because you understood that defense in depth meant not relying on a single mathematical assumption.

Phase three was the masterstroke: you activated the Bureau's **Harvest-Now-Decrypt-Later countermeasure** — retroactively re-encrypting archived communications with post-quantum algorithms, neutralizing years of potential adversary collection.

Within 72 hours, the Bureau's entire infrastructure was quantum-resistant. Other agencies scrambled. Governments panicked. But the Cipher Bureau stood firm.

"You didn't just prepare for the quantum era," Vigenère said, a rare note of awe in her voice. "You *defined* how the world will survive it."

She placed a crystalline badge on your desk — a lattice structure refracting light into impossible patterns.

"**Quantum Sentinel**. The first agent to earn this designation. The Bureau's shield against the quantum storm."

You looked at the lattice badge and smiled. The math had always been beautiful. Now it was saving the world.

**Designation Earned: Quantum Sentinel — Post-Quantum Cryptography Master**
MD,
            ],
        ];

        foreach ($chapters as $chapter) {
            StoryChapter::query()->updateOrCreate(
                ['slug' => $chapter['slug']],
                $chapter,
            );
        }

        StoryService::clearCache();
    }
}
