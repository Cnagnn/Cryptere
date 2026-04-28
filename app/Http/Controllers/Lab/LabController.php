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
     * Show cryptography sprint labs.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('labs/index');
    }

    public function show(Request $request, string $lab): Response
    {
        /** @var array{title: string, summary: string, group: string}|null $labDefinition */
        $labDefinition = config("labs.{$lab}");

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
