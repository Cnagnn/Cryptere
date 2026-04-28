<?php

namespace App\Http\Controllers;

use App\Models\CtfEvent;
use App\Models\CtfFlag;
use App\Models\CtfRegistration;
use App\Models\CtfSubmission;
use App\Services\BadgeService;
use App\Services\XpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CtfController extends Controller
{
    public function __construct(
        private readonly XpService $xpService,
        private readonly BadgeService $badgeService,
    ) {}

    /**
     * List all CTF events (upcoming, active, past).
     * GET /ctf
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $events = CtfEvent::query()
            ->published()
            ->withCount(['flags', 'registrations'])
            ->orderByRaw("CASE WHEN starts_at <= NOW() AND ends_at >= NOW() THEN 0 WHEN starts_at > NOW() THEN 1 ELSE 2 END")
            ->orderBy('starts_at', 'desc')
            ->get()
            ->map(function (CtfEvent $event) use ($user) {
                $registration = $user
                    ? CtfRegistration::where('user_id', $user->id)
                        ->where('ctf_event_id', $event->id)
                        ->first()
                    : null;

                return [
                    'id' => $event->id,
                    'slug' => $event->slug,
                    'title' => $event->title,
                    'description' => $event->description,
                    'startsAt' => $event->starts_at->toISOString(),
                    'endsAt' => $event->ends_at->toISOString(),
                    'flagsCount' => $event->flags_count,
                    'participantCount' => $event->registrations_count,
                    'maxParticipants' => $event->max_participants,
                    'bonusXp' => $event->bonus_xp,
                    'isActive' => $event->isActive(),
                    'isUpcoming' => $event->isUpcoming(),
                    'hasEnded' => $event->hasEnded(),
                    'isFull' => $event->isFull(),
                    'isRegistered' => $registration !== null,
                    'userPoints' => $registration?->total_points ?? 0,
                    'userFlagsCaptured' => $registration?->flags_captured ?? 0,
                ];
            });

        return Inertia::render('ctf/index', [
            'events' => $events,
        ]);
    }

    /**
     * Show a specific CTF event with flags and leaderboard.
     * GET /ctf/{event:slug}
     */
    public function show(Request $request, CtfEvent $event): Response
    {
        $user = $request->user();

        $registration = $user
            ? CtfRegistration::where('user_id', $user->id)
                ->where('ctf_event_id', $event->id)
                ->first()
            : null;

        $flags = $event->flags()->get()->map(function (CtfFlag $flag) use ($user, $event) {
            $userSolved = false;
            $pointsEarned = 0;
            $solveCount = 0;

            if ($user) {
                $correctSubmission = CtfSubmission::where('user_id', $user->id)
                    ->where('ctf_flag_id', $flag->id)
                    ->where('is_correct', true)
                    ->first();

                $userSolved = $correctSubmission !== null;
                $pointsEarned = $correctSubmission?->points_awarded ?? 0;
            }

            // Show solve count (how many participants solved it)
            $solveCount = CtfSubmission::where('ctf_flag_id', $flag->id)
                ->where('is_correct', true)
                ->distinct('user_id')
                ->count('user_id');

            return [
                'id' => $flag->id,
                'title' => $flag->title,
                'description' => $flag->description,
                'hint' => $flag->hint,
                'points' => $flag->points,
                'difficulty' => $flag->difficulty,
                'category' => $flag->category,
                'sortOrder' => $flag->sort_order,
                'isSolved' => $userSolved,
                'pointsEarned' => $pointsEarned,
                'solveCount' => $solveCount,
            ];
        });

        // Get top 20 leaderboard entries
        $leaderboard = CtfRegistration::where('ctf_event_id', $event->id)
            ->where('total_points', '>', 0)
            ->orderByDesc('total_points')
            ->orderBy('completed_at')
            ->orderBy('updated_at')
            ->limit(20)
            ->with('user:id,name,username,avatar')
            ->get()
            ->values()
            ->map(fn (CtfRegistration $reg, int $index) => [
                'rank' => $index + 1,
                'userId' => $reg->user->id,
                'name' => $reg->user->name,
                'username' => $reg->user->username,
                'avatar' => $reg->user->avatar,
                'totalPoints' => $reg->total_points,
                'flagsCaptured' => $reg->flags_captured,
                'completedAt' => $reg->completed_at?->toISOString(),
            ]);

        return Inertia::render('ctf/show', [
            'event' => [
                'id' => $event->id,
                'slug' => $event->slug,
                'title' => $event->title,
                'description' => $event->description,
                'rules' => $event->rules,
                'startsAt' => $event->starts_at->toISOString(),
                'endsAt' => $event->ends_at->toISOString(),
                'isActive' => $event->isActive(),
                'isUpcoming' => $event->isUpcoming(),
                'hasEnded' => $event->hasEnded(),
                'maxParticipants' => $event->max_participants,
                'bonusXp' => $event->bonus_xp,
                'participantCount' => $event->registrations()->count(),
                'flagsCount' => $event->flags()->count(),
                'isFull' => $event->isFull(),
            ],
            'flags' => $flags,
            'leaderboard' => $leaderboard,
            'registration' => $registration ? [
                'isRegistered' => true,
                'totalPoints' => $registration->total_points,
                'flagsCaptured' => $registration->flags_captured,
                'completedAt' => $registration->completed_at?->toISOString(),
            ] : [
                'isRegistered' => false,
                'totalPoints' => 0,
                'flagsCaptured' => 0,
                'completedAt' => null,
            ],
        ]);
    }

    /**
     * Register for a CTF event.
     * POST /ctf/{event:slug}/register
     */
    public function register(Request $request, CtfEvent $event): RedirectResponse
    {
        $user = $request->user();

        // Check if event is published
        if (! $event->is_published) {
            abort(404);
        }

        // Check if event hasn't ended
        if ($event->hasEnded()) {
            return back()->with('error', 'This event has already ended.');
        }

        // Check if already registered
        $existing = CtfRegistration::where('user_id', $user->id)
            ->where('ctf_event_id', $event->id)
            ->exists();

        if ($existing) {
            return back()->with('info', 'You are already registered for this event.');
        }

        // Check max participants
        if ($event->isFull()) {
            return back()->with('error', 'This event is full. No more registrations are accepted.');
        }

        CtfRegistration::create([
            'user_id' => $user->id,
            'ctf_event_id' => $event->id,
            'registered_at' => now(),
        ]);

        return back()->with('success', 'Successfully registered for '.$event->title.'!');
    }

    /**
     * Submit a flag answer.
     * POST /ctf/{event:slug}/flags/{flag}/submit
     */
    public function submitFlag(Request $request, CtfEvent $event, CtfFlag $flag): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'flag' => ['required', 'string', 'max:255'],
        ]);

        // Verify flag belongs to this event
        if ($flag->ctf_event_id !== $event->id) {
            abort(404);
        }

        // Check event is published
        if (! $event->is_published) {
            abort(404);
        }

        // Check event is active
        if (! $event->isActive()) {
            $message = $event->isUpcoming()
                ? 'This event has not started yet.'
                : 'This event has already ended.';

            return response()->json([
                'is_correct' => false,
                'points_awarded' => 0,
                'message' => $message,
            ], 422);
        }

        // Check user is registered
        $registration = CtfRegistration::where('user_id', $user->id)
            ->where('ctf_event_id', $event->id)
            ->first();

        if (! $registration) {
            return response()->json([
                'is_correct' => false,
                'points_awarded' => 0,
                'message' => 'You must register for this event before submitting flags.',
            ], 403);
        }

        // Check if user already solved this flag
        $alreadySolved = CtfSubmission::where('user_id', $user->id)
            ->where('ctf_flag_id', $flag->id)
            ->where('is_correct', true)
            ->exists();

        if ($alreadySolved) {
            return response()->json([
                'is_correct' => true,
                'points_awarded' => 0,
                'message' => 'You have already captured this flag!',
            ]);
        }

        $submittedFlag = $request->input('flag');
        $isCorrect = $flag->isCorrect($submittedFlag);
        $pointsAwarded = $isCorrect ? $flag->points : 0;

        // Record the submission
        CtfSubmission::create([
            'user_id' => $user->id,
            'ctf_flag_id' => $flag->id,
            'submitted_flag' => $submittedFlag,
            'is_correct' => $isCorrect,
            'points_awarded' => $pointsAwarded,
            'submitted_at' => now(),
        ]);

        if ($isCorrect) {
            // Update registration stats
            $registration->increment('total_points', $pointsAwarded);
            $registration->increment('flags_captured');

            // Award XP and points
            $this->xpService->awardXpAndPoints($user, $pointsAwarded);

            // Check badge criteria
            $this->badgeService->checkAndAward($user, 'ctf_flag_captured');

            // Check if all flags captured → award bonus XP
            $totalFlags = $event->flags()->count();
            if ($registration->fresh()->flags_captured >= $totalFlags) {
                $registration->update(['completed_at' => now()]);
                $this->xpService->awardXp($user, $event->bonus_xp);
            }

            return response()->json([
                'is_correct' => true,
                'points_awarded' => $pointsAwarded,
                'message' => "🎉 Correct! You earned {$pointsAwarded} points!",
            ]);
        }

        return response()->json([
            'is_correct' => false,
            'points_awarded' => 0,
            'message' => 'Incorrect flag. Try again!',
        ]);
    }

    /**
     * Get event leaderboard.
     * GET /ctf/{event:slug}/leaderboard
     */
    public function leaderboard(CtfEvent $event): JsonResponse
    {
        $leaderboard = CtfRegistration::where('ctf_event_id', $event->id)
            ->where('total_points', '>', 0)
            ->orderByDesc('total_points')
            ->orderBy('completed_at')
            ->orderBy('updated_at')
            ->with('user:id,name,username,avatar')
            ->get()
            ->values()
            ->map(fn (CtfRegistration $reg, int $index) => [
                'rank' => $index + 1,
                'userId' => $reg->user->id,
                'name' => $reg->user->name,
                'username' => $reg->user->username,
                'avatar' => $reg->user->avatar,
                'totalPoints' => $reg->total_points,
                'flagsCaptured' => $reg->flags_captured,
                'completedAt' => $reg->completed_at?->toISOString(),
            ]);

        return response()->json(['leaderboard' => $leaderboard]);
    }
}
