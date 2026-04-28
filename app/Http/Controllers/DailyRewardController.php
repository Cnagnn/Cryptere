<?php

namespace App\Http\Controllers;

use App\Models\DailyReward;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailyRewardController extends Controller
{
    /**
     * Get the user's daily reward status and calendar data.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();

        // Get this month's claimed rewards for the calendar
        $monthRewards = $user->dailyRewards()
            ->whereMonth('claimed_date', $today->month)
            ->whereYear('claimed_date', $today->year)
            ->orderBy('claimed_date')
            ->get(['claimed_date', 'day_number', 'xp_earned', 'points_earned']);

        // Check if today's reward has been claimed
        $claimedToday = $user->dailyRewards()
            ->where('claimed_date', $today->toDateString())
            ->exists();

        // Calculate current streak day number
        $dayNumber = $this->calculateDayNumber($user->id);

        // Get reward tiers
        $tiers = config('rewards.daily_rewards', []);
        $todayReward = $tiers[$dayNumber] ?? $tiers[1];

        return response()->json([
            'claimed_today' => $claimedToday,
            'day_number' => $dayNumber,
            'today_reward' => $todayReward,
            'tiers' => $tiers,
            'calendar' => $monthRewards->map(fn (DailyReward $r) => [
                'date' => $r->claimed_date->toDateString(),
                'day_number' => $r->day_number,
                'xp' => $r->xp_earned,
                'points' => $r->points_earned,
            ]),
            'current_streak' => $user->current_streak,
        ]);
    }

    /**
     * Claim today's daily reward.
     */
    public function claim(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();

        // Prevent double-claiming
        $alreadyClaimed = $user->dailyRewards()
            ->where('claimed_date', $today->toDateString())
            ->exists();

        if ($alreadyClaimed) {
            return response()->json([
                'success' => false,
                'message' => 'You have already claimed today\'s reward!',
            ], 409);
        }

        $dayNumber = $this->calculateDayNumber($user->id);
        $tiers = config('rewards.daily_rewards', []);
        $reward = $tiers[$dayNumber] ?? $tiers[1];

        $xp = $reward['xp'];
        $points = $reward['points'];

        // Create the reward record
        $dailyReward = $user->dailyRewards()->create([
            'claimed_date' => $today->toDateString(),
            'day_number' => $dayNumber,
            'xp_earned' => $xp,
            'points_earned' => $points,
        ]);

        // Award XP and points to the user
        $user->increment('xp', $xp);
        $user->increment('points', $points);

        return response()->json([
            'success' => true,
            'day_number' => $dayNumber,
            'xp_earned' => $xp,
            'points_earned' => $points,
            'total_xp' => $user->fresh()->xp,
            'total_points' => $user->fresh()->points,
        ]);
    }

    /**
     * Calculate which day number in the 7-day cycle the user is on.
     */
    private function calculateDayNumber(int $userId): int
    {
        $yesterday = Carbon::yesterday();

        $lastClaim = DailyReward::where('user_id', $userId)
            ->orderByDesc('claimed_date')
            ->first();

        if (! $lastClaim) {
            return 1;
        }

        // If last claim was yesterday, continue the streak
        if ($lastClaim->claimed_date->isSameDay($yesterday)) {
            $nextDay = $lastClaim->day_number + 1;

            return $nextDay > 7 ? 1 : $nextDay;
        }

        // If last claim was today (already claimed), return current day
        if ($lastClaim->claimed_date->isToday()) {
            return $lastClaim->day_number;
        }

        // Streak broken — reset to day 1
        return 1;
    }
}
