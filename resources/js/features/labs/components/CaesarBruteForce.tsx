/**
 * Caesar Cipher Brute Force Visualization
 *
 * Shows all 26 possible Caesar cipher decryptions with
 * dictionary-based highlighting for likely plaintext.
 */

import { cn } from '@/lib/utils';

interface CaesarBruteForceProps {
    ciphertext: string;
}

// Simple Indonesian word list for dictionary attack
const INDONESIAN_WORDS = new Set([
    'DAN', 'DARI', 'YANG', 'DALAM', 'UNTUK', 'DENGAN', 'PADA', 'ADALAH', 'INI', 'TIDAK',
    'ADA', 'ATAU', 'KE', 'DI', 'KE', 'YA', 'OLEH', 'DENGAN', 'KAN', 'LAH', 'PUN',
    'SAYA', 'ANDA', 'KAMI', 'MEROKOK', 'ADALAH', 'BUKAN', 'TENTU', 'SAAT', 'TELAH',
    'SEDANG', 'KARENA', 'JADI', 'NAMUN', 'SETELAH', 'BAhwa', 'BAGAIMANA', 'MENGAPA',
]);

interface Candidate {
    shift: number;
    plaintext: string;
    matchedWords: string[];
    isLikely: boolean;
}

function caesarDecrypt(ciphertext: string, shift: number): string {
    const result: string[] = [];

    for (const char of ciphertext) {
        if (char >= 'A' && char <= 'Z') {
            // Shift back (decrypt)
            const code = char.charCodeAt(0) - 65;
            const decrypted = ((code - shift + 26) % 26) + 65;
            result.push(String.fromCharCode(decrypted));
        } else if (char >= 'a' && char <= 'z') {
            const code = char.charCodeAt(0) - 97;
            const decrypted = ((code - shift + 26) % 26) + 97;
            result.push(String.fromCharCode(decrypted));
        } else {
            result.push(char);
        }
    }

    return result.join('');
}

function findMatchedWords(text: string): string[] {
    const words = text.toUpperCase().split(/\s+/);
    const matched: string[] = [];

    for (const word of words) {
        if (INDONESIAN_WORDS.has(word)) {
            matched.push(word);
        }
    }

    return matched;
}

function analyzeCandidates(ciphertext: string): Candidate[] {
    const upper = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
    const candidates: Candidate[] = [];

    for (let shift = 0; shift < 26; shift++) {
        const plaintext = caesarDecrypt(upper, shift);
        const matchedWords = findMatchedWords(plaintext);
        const isLikely = matchedWords.length >= 2;

        candidates.push({
            shift,
            plaintext: caesarDecrypt(ciphertext, shift),
            matchedWords,
            isLikely,
        });
    }

    return candidates;
}

export default function CaesarBruteForce({
    ciphertext,
}: CaesarBruteForceProps) {
    const candidates = analyzeCandidates(ciphertext);
    const likelyCandidates = candidates.filter((c) => c.isLikely);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                    Brute Force Attack (26 Keys)
                </h4>
                {likelyCandidates.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {likelyCandidates.length} likely plaintext found
                    </span>
                )}
            </div>

            {/* Ciphertext display */}
            <div className="text-xs text-muted-foreground">
                Ciphertext: <span className="font-mono">{ciphertext.toUpperCase()}</span>
            </div>

            {/* Candidates grid */}
            <div className="grid gap-1 max-h-64 overflow-y-auto">
                {candidates.map(({ shift, plaintext, matchedWords, isLikely }) => (
                    <div
                        key={shift}
                        className={cn(
                            'flex items-center gap-3 p-2 rounded text-xs transition-colors',
                            isLikely
                                ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                                : 'bg-muted/30 border border-transparent hover:border-muted',
                        )}
                    >
                        {/* Shift indicator */}
                        <span className="w-8 shrink-0 text-center font-mono font-medium">
                            -{shift}
                        </span>

                        {/* Plaintext */}
                        <span
                            className={cn(
                                'flex-1 font-mono',
                                isLikely ? 'text-green-700 dark:text-green-300' : 'text-foreground',
                            )}
                        >
                            {plaintext}
                        </span>

                        {/* Matched words badge */}
                        {matchedWords.length > 0 && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                                {matchedWords.join(', ')}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="text-[10px] text-muted-foreground">
                Highlighted candidates have ≥2 Indonesian words matched
            </div>
        </div>
    );
}
