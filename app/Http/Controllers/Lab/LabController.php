<?php

namespace App\Http\Controllers\Lab;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LabController extends Controller
{
    /**
     * Show cryptography sprint labs catalog.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('labs/index');
    }

    /**
     * Render a single lab. Simulasi enkripsi/dekripsi/visualisasi
     * dijalankan sepenuhnya di browser — controller hanya mengirim
     * metadata lab dan TIDAK menyentuh database.
     */
    public function show(Request $request, string $lab): Response
    {
        /** @var array{title: string, summary: string, group: string}|null $labDefinition */
        $labDefinition = config("labs.{$lab}");

        if ($labDefinition === null) {
            abort(404);
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
