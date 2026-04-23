<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Level Thresholds
    |--------------------------------------------------------------------------
    |
    | Each level requires a minimum number of XP points. The key is the level
    | number, and the value contains the threshold and display name.
    |
    */

    'thresholds' => [
        1 => ['min_points' => 0, 'name' => 'Plaintext Novice'],
        2 => ['min_points' => 100, 'name' => 'Cipher Initiate'],
        3 => ['min_points' => 300, 'name' => 'Cipher Apprentice'],
        4 => ['min_points' => 600, 'name' => 'Key Wielder'],
        5 => ['min_points' => 1000, 'name' => 'Block Builder'],
        6 => ['min_points' => 1500, 'name' => 'Hash Hunter'],
        7 => ['min_points' => 2500, 'name' => 'Crypto Analyst'],
        8 => ['min_points' => 4000, 'name' => 'Key Master'],
        9 => ['min_points' => 6000, 'name' => 'Crypto Sage'],
        10 => ['min_points' => 10000, 'name' => 'Quantum Guardian'],
    ],

];
