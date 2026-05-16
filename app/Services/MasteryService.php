<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class MasteryService
{
    /**
     * Hitung mastery per topik untuk user.
     * Mastery = (correct answers for topic / total attempts for topic) × 100
     *
     * @return array<string, array{topic: string, mastery: float, attempts: int, correct: int}>
     */
    public function getUserMastery(User $user): array
    {
        $challengeAttempts = DB::table('challenge_submissions')
            ->join('challenge_topic', 'challenge_submissions.challenge_id', '=', 'challenge_topic.challenge_id')
            ->join('topics', 'challenge_topic.topic_id', '=', 'topics.id')
            ->where('challenge_submissions.user_id', $user->id)
            ->selectRaw('topics.name as topic_name, COUNT(*) as attempts, SUM(CASE WHEN challenge_submissions.is_correct THEN 1 ELSE 0 END) as correct')
            ->groupBy('topics.name');

        $quizAttempts = DB::table('challenge_submissions')
            ->join('challenge_questions', 'challenge_submissions.challenge_question_id', '=', 'challenge_questions.id')
            ->join('topics', 'challenge_questions.topic_id', '=', 'topics.id')
            ->where('challenge_submissions.user_id', $user->id)
            ->selectRaw('topics.name as topic_name, COUNT(*) as attempts, SUM(CASE WHEN challenge_submissions.is_correct THEN 1 ELSE 0 END) as correct')
            ->groupBy('topics.name');

        $allAttempts = DB::query()
            ->fromSub($challengeAttempts->unionAll($quizAttempts), 'topic_attempts')
            ->selectRaw('topic_name, SUM(attempts) as attempts, SUM(correct) as correct')
            ->groupBy('topic_name')
            ->get();

        if ($allAttempts->isEmpty()) {
            return [];
        }

        return $allAttempts->map(function ($attempt): array {
            $total = (int) $attempt->attempts;
            $correct = (int) $attempt->correct;

            return [
                'topic' => $attempt->topic_name,
                'mastery' => round(($correct / $total) * 100, 1),
                'attempts' => $total,
                'correct' => $correct,
            ];
        })->toArray();
    }
}
