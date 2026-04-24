<?php

namespace App\Http\Controllers\Lab;

use App\Http\Controllers\Controller;
use App\Models\LabVisit;
use App\Services\BadgeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LabController extends Controller
{
    public function __construct(
        private readonly BadgeService $badgeService,
    ) {}

    /**
     * @return array<string, array{title: string, summary: string, group: string}>
     */
    private static function labs(): array
    {
        return [
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
            'sha-lab' => [
                'title' => 'SHA',
                'summary' => 'Simulate one-way hashing to inspect avalanche effects and data integrity.',
                'group' => 'hashing',
            ],
            'digital-signature-lab' => [
                'title' => 'Digital Signature',
                'summary' => 'Demonstrate digital signature flow for authentication, integrity, and non-repudiation.',
                'group' => 'signature',
            ],
        ];
    }

    /**
     * Show cryptography sprint labs.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('labs/index');
    }

    public function show(Request $request, string $lab): Response
    {
        $labDefinition = self::labs()[$lab] ?? null;

        if ($labDefinition === null) {
            abort(404);
        }

        $user = $request->user();

        if ($user !== null) {
            $visit = LabVisit::query()->firstOrNew([
                'user_id' => $user->id,
                'lab_slug' => $lab,
            ]);

            if (! $visit->exists) {
                $visit->visit_count = 1;
                $visit->first_visited_at = now();
            } else {
                $visit->visit_count++;
            }

            $visit->last_visited_at = now();
            $visit->save();

            $this->badgeService->checkAndAward($user, 'labs_visited');
        }

        return Inertia::render('labs/show', [
            'lab' => [
                'slug' => $lab,
                'title' => $labDefinition['title'],
                'summary' => $labDefinition['summary'],
                'group' => $labDefinition['group'],
            ],
        ]);
    }
}
