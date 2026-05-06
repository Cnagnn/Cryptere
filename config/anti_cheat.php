<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Video Anti-Cheat
    |--------------------------------------------------------------------------
    |
    | Minimum accumulated watch seconds (via heartbeat) before a video task
    | can be marked as complete. The frontend sends heartbeats every 30s.
    |
    */

    'video_min_seconds' => (int) env('ANTI_CHEAT_VIDEO_MIN_SECONDS', 30),

    /*
    |--------------------------------------------------------------------------
    | Reading/PDF Anti-Cheat
    |--------------------------------------------------------------------------
    |
    | Minimum accumulated reading seconds before a reading/PDF task can be
    | marked as complete. The frontend sends heartbeats every 15s.
    |
    */

    'reading_min_seconds' => (int) env('ANTI_CHEAT_READING_MIN_SECONDS', 15),

    /*
    |--------------------------------------------------------------------------
    | Minimum Elapsed Time
    |--------------------------------------------------------------------------
    |
    | Minimum real-world seconds between started_at and completion attempt.
    | Prevents instant completion even if heartbeats are spoofed.
    |
    */

    'min_elapsed_seconds' => (int) env('ANTI_CHEAT_MIN_ELAPSED_SECONDS', 10),

    /*
    |--------------------------------------------------------------------------
    | Heartbeat Interval (Frontend Reference)
    |--------------------------------------------------------------------------
    |
    | How often the frontend should send heartbeat pings (in seconds).
    | This is a reference value — actual enforcement is server-side.
    |
    */

    'heartbeat_interval_video' => 30,
    'heartbeat_interval_reading' => 15,

];
