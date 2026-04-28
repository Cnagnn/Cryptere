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
            ->select('topics.name as topic_name', 'challenge_submissions.is_correct')
            ->get();

        $quizAttempts = DB::table('challenge_submissions')
            ->join('challenge_questions', 'challenge_submissions.challenge_question_id', '=', 'challenge_questions.id')
            ->join('topics', 'challenge_questions.topic_id', '=', 'topics.id')
            ->where('challenge_submissions.user_id', $user->id)
            ->select('topics.name as topic_name', 'challenge_submissions.is_correct')
            ->get();

        $allAttempts = $challengeAttempts->concat($quizAttempts);

        if ($allAttempts->isEmpty()) {
            return [];
        }

        return $allAttempts->groupBy('topic_name')->map(function ($attempts, $topicName) {
            $total = $attempts->count();
            $correct = $attempts->where('is_correct', true)->count();

            return [
                'topic' => $topicName,
                'mastery' => round(($correct / $total) * 100, 1),
                'attempts' => $total,
                'correct' => $correct,
            ];
        })->values()->toArray();
    }
}
