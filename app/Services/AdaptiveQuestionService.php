<?php

namespace App\Services;

use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class AdaptiveQuestionService
{
    /**
     * Select questions adaptively for a lesson quiz.
     *
     * Simpler version: match difficulty to user's mastery level for the topic.
     *
     * @return Collection<int, QuizQuestion>
     */
    public function selectQuestionsForQuiz(
        User $user,
        LessonTask $task,
        int $count
    ): Collection {
        $allQuestions = $task->quizQuestions()->get();

        // If pool is small enough, return all
        if ($allQuestions->count() <= $count) {
            return $allQuestions;
        }

        // Check if any questions have adaptive data
        $hasAdaptiveData = $allQuestions->contains(fn (QuizQuestion $q) => $q->times_shown > 0 || $q->difficulty_score !== 0.5
        );

        if (! $hasAdaptiveData) {
            return $allQuestions->shuffle()->take($count);
        }

        $targetDifficulty = $this->getTargetDifficulty($user);

        // Sort by proximity to target difficulty and take the closest
        return $allQuestions
            ->sortBy(fn (QuizQuestion $q) => abs($q->difficulty_score - $targetDifficulty))
            ->take($count)
            ->values();
    }

    /**
     * Update question statistics after an answer.
     *
     * Increments times_shown, times_correct (if correct).
     * Recalculates difficulty_score based on historical success rate.
     */
    public function updateQuestionStats(
        Model $question,
        bool $isCorrect
    ): void {
        if (! ($question instanceof QuizQuestion)) {
            return;
        }

        $timesShown = ($question->times_shown ?? 0) + 1;
        $timesCorrect = ($question->times_correct ?? 0) + ($isCorrect ? 1 : 0);
        $difficultyScore = $question->difficulty_score;

        if ($timesShown >= 3) {
            $successRate = $timesCorrect / $timesShown;
            $difficultyScore = max(0.05, min(0.95, round(1.0 - $successRate, 4)));
        }

        $question->newQuery()
            ->whereKey($question->getKey())
            ->update([
                'times_shown' => $timesShown,
                'times_correct' => $timesCorrect,
                'difficulty_score' => $difficultyScore,
            ]);

        $question->forceFill([
            'times_shown' => $timesShown,
            'times_correct' => $timesCorrect,
            'difficulty_score' => $difficultyScore,
        ])->syncOriginal();
    }

    /**
     * Update user's ability estimate after a session.
     *
     * Uses exponential moving average of recent performance.
     * ability = 0.7 * old_ability + 0.3 * session_performance
     */
    public function updateUserAbility(User $user, float $sessionAccuracy): void
    {
        $oldAbility = $user->ability_estimate ?? 0.5;
        $sessionPerformance = max(0.0, min(1.0, $sessionAccuracy));

        $newAbility = (0.7 * $oldAbility) + (0.3 * $sessionPerformance);
        $newAbility = round(max(0.0, min(1.0, $newAbility)), 4);

        $user->update(['ability_estimate' => $newAbility]);
    }

    /**
     * Calculate the optimal next difficulty based on current ability.
     *
     * Targets ~70% success rate (Zone of Proximal Development).
     * This means the target difficulty should be slightly below the user's ability.
     */
    public function getTargetDifficulty(User $user): float
    {
        $ability = $user->ability_estimate ?? 0.5;

        // Target difficulty slightly above current ability for ~70% success
        // The offset creates the "zone of proximal development"
        $target = $ability + 0.05;

        return max(0.0, min(1.0, round($target, 4)));
    }

    /**
     * Adjust time limit based on user's historical response speed.
     *
     * Faster users get slightly less time, slower users get more.
     * Range: 0.7x to 1.5x of base time limit.
     */
    public function getAdjustedTimeLimit(User $user, int $baseTimeLimitSeconds): int
    {
        $ability = $user->ability_estimate ?? 0.5;

        // Higher ability → slightly less time (more challenging)
        // Lower ability → more time (more supportive)
        // ability 0.0 → 1.5x, ability 0.5 → 1.0x, ability 1.0 → 0.7x
        $multiplier = 1.5 - ($ability * 0.8);
        $multiplier = max(0.7, min(1.5, $multiplier));

        return (int) round($baseTimeLimitSeconds * $multiplier);
    }
}
