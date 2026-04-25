<?php

/*
|--------------------------------------------------------------------------
| Gamification Reward Constants
|--------------------------------------------------------------------------
|
| Centralized bonus amounts for all XP and point rewards. Adjust these
| values to tune the gamification economy without touching service code.
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | First Login Bonus
    |--------------------------------------------------------------------------
    |
    | One-time XP award when a user logs in for the very first time
    | (last_active_date is null).
    |
    */
    'first_login_xp' => 50,

    /*
    |--------------------------------------------------------------------------
    | Course Completion Bonus
    |--------------------------------------------------------------------------
    |
    | XP and points awarded when a user completes 100% of a course.
    |
    */
    'course_completion_xp' => 100,
    'course_completion_points' => 20,

    /*
    |--------------------------------------------------------------------------
    | Perfect Score Bonus
    |--------------------------------------------------------------------------
    |
    | Extra XP and points awarded when a user answers every question
    | correctly in a quiz session (first attempt only).
    |
    */
    'perfect_score_xp' => 50,
    'perfect_score_points' => 15,

    /*
    |--------------------------------------------------------------------------
    | First Blood Bonus
    |--------------------------------------------------------------------------
    |
    | Extra XP awarded on top of BASE_CHALLENGE_XP when a user solves
    | a challenge correctly for the first time.
    |
    */
    'first_blood_xp' => 25,

    /*
    |--------------------------------------------------------------------------
    | Weekly Active Bonus
    |--------------------------------------------------------------------------
    |
    | XP awarded when a user's daily streak reaches exactly 7 days.
    |
    */
    'weekly_active_xp' => 30,

    /*
    |--------------------------------------------------------------------------
    | Comeback Bonus
    |--------------------------------------------------------------------------
    |
    | XP awarded when a user returns after being inactive for the
    | specified number of days or more.
    |
    */
    'comeback_xp' => 40,
    'comeback_gap_days' => 7,

    /*
    |--------------------------------------------------------------------------
    | Level-Up Points Reward
    |--------------------------------------------------------------------------
    |
    | Bonus points awarded per level when a user levels up.
    | Formula: new_level × level_up_points_per_level
    |
    */
    'level_up_points_per_level' => 5,

    /*
    |--------------------------------------------------------------------------
    | Daily Goal
    |--------------------------------------------------------------------------
    |
    | Target XP to earn per day. When met, a bonus XP reward is granted.
    |
    */
    'daily_goal_target_xp' => 100,
    'daily_goal_bonus_xp' => 20,

    /*
    |--------------------------------------------------------------------------
    | Point Decay
    |--------------------------------------------------------------------------
    |
    | After the specified inactive days, points decay by the given
    | percentage daily, down to a minimum floor.
    |
    */
    'decay_inactive_days' => 14,
    'decay_percent' => 1,
    'decay_min_points' => 10,

    /*
    |--------------------------------------------------------------------------
    | Lesson Completion XP
    |--------------------------------------------------------------------------
    |
    | XP awarded when a user completes a single lesson (replaces per-lesson
    | xp_reward column — every lesson now awards the same flat amount).
    |
    */
    'lesson_completion_xp' => 30,

    /*
    |--------------------------------------------------------------------------
    | Quiz Task XP
    |--------------------------------------------------------------------------
    |
    | XP awarded when a user completes a quiz-type lesson task.
    |
    */
    'quiz_task_xp' => 20,

    /*
    |--------------------------------------------------------------------------
    | Challenge Rewards
    |--------------------------------------------------------------------------
    |
    | Base points and XP for standalone / speed-round challenges.
    |
    */
    'challenge_base_points' => 15,
    'challenge_base_xp' => 15,
    'challenge_first_blood_xp' => 10,
    'challenge_speed_min_points' => 3,
    'challenge_speed_floor_ratio' => 0.25,

    /*
    |--------------------------------------------------------------------------
    | Challenge Quiz Session
    |--------------------------------------------------------------------------
    |
    | XP awarded for completing a quiz-mode challenge session, and the
    | default max points per question when the DB column is null.
    |
    */
    'challenge_quiz_session_xp' => 20,
    'challenge_quiz_max_points_per_question' => 10,

    /*
    |--------------------------------------------------------------------------
    | Challenge Streak Bonus
    |--------------------------------------------------------------------------
    |
    | Bonus points added per consecutive correct answer in quiz mode.
    | Index = consecutive correct count (0-1 → 0, 2 → 2, 3 → 4, 4 → 6, 5+ → 10).
    |
    */
    'challenge_streak_bonus' => [0, 0, 2, 4, 6, 10],

];
