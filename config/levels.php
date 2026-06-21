<?php

/*
|--------------------------------------------------------------------------
| Level Thresholds (50 levels — exponential curve)
|--------------------------------------------------------------------------
|
| Each level requires a minimum XP. The curve uses:
|   min_xp = floor(50 × 1.12^(level − 1))
|
| With lesson XP = 30 and quiz XP = 20, a casual
| user earning ~70 XP/day reaches level 10 in ~2 sessions, level 20 in
| ~1 week, and level 50 in ~6 months.
|
| bonus_percent: each level grants 0.2% bonus to point earnings.
|   Level 10 → 2%, Level 25 → 5%, Level 50 → 10%.
|
*/

return [

    'thresholds' => [
        1 => ['min_xp' => 0,      'bonus_percent' => 0.2],
        2 => ['min_xp' => 50,     'bonus_percent' => 0.4],
        3 => ['min_xp' => 63,     'bonus_percent' => 0.6],
        4 => ['min_xp' => 70,     'bonus_percent' => 0.8],
        5 => ['min_xp' => 79,     'bonus_percent' => 1.0],
        6 => ['min_xp' => 88,     'bonus_percent' => 1.2],
        7 => ['min_xp' => 99,     'bonus_percent' => 1.4],
        8 => ['min_xp' => 110,    'bonus_percent' => 1.6],
        9 => ['min_xp' => 124,    'bonus_percent' => 1.8],
        10 => ['min_xp' => 139,    'bonus_percent' => 2.0],
        11 => ['min_xp' => 155,    'bonus_percent' => 2.2],
        12 => ['min_xp' => 174,    'bonus_percent' => 2.4],
        13 => ['min_xp' => 195,    'bonus_percent' => 2.6],
        14 => ['min_xp' => 218,    'bonus_percent' => 2.8],
        15 => ['min_xp' => 244,    'bonus_percent' => 3.0],
        16 => ['min_xp' => 274,    'bonus_percent' => 3.2],
        17 => ['min_xp' => 306,    'bonus_percent' => 3.4],
        18 => ['min_xp' => 343,    'bonus_percent' => 3.6],
        19 => ['min_xp' => 384,    'bonus_percent' => 3.8],
        20 => ['min_xp' => 430,    'bonus_percent' => 4.0],
        21 => ['min_xp' => 482,    'bonus_percent' => 4.2],
        22 => ['min_xp' => 540,    'bonus_percent' => 4.4],
        23 => ['min_xp' => 604,    'bonus_percent' => 4.6],
        24 => ['min_xp' => 677,    'bonus_percent' => 4.8],
        25 => ['min_xp' => 758,    'bonus_percent' => 5.0],
        26 => ['min_xp' => 849,    'bonus_percent' => 5.2],
        27 => ['min_xp' => 950,    'bonus_percent' => 5.4],
        28 => ['min_xp' => 1064,   'bonus_percent' => 5.6],
        29 => ['min_xp' => 1192,   'bonus_percent' => 5.8],
        30 => ['min_xp' => 1335,   'bonus_percent' => 6.0],
        31 => ['min_xp' => 1495,   'bonus_percent' => 6.2],
        32 => ['min_xp' => 1674,   'bonus_percent' => 6.4],
        33 => ['min_xp' => 1875,   'bonus_percent' => 6.6],
        34 => ['min_xp' => 2100,   'bonus_percent' => 6.8],
        35 => ['min_xp' => 2352,   'bonus_percent' => 7.0],
        36 => ['min_xp' => 2634,   'bonus_percent' => 7.2],
        37 => ['min_xp' => 2950,   'bonus_percent' => 7.4],
        38 => ['min_xp' => 3304,   'bonus_percent' => 7.6],
        39 => ['min_xp' => 3701,   'bonus_percent' => 7.8],
        40 => ['min_xp' => 4145,   'bonus_percent' => 8.0],
        41 => ['min_xp' => 4642,   'bonus_percent' => 8.2],
        42 => ['min_xp' => 5199,   'bonus_percent' => 8.4],
        43 => ['min_xp' => 5823,   'bonus_percent' => 8.6],
        44 => ['min_xp' => 6522,   'bonus_percent' => 8.8],
        45 => ['min_xp' => 7304,   'bonus_percent' => 9.0],
        46 => ['min_xp' => 8181,   'bonus_percent' => 9.2],
        47 => ['min_xp' => 9163,   'bonus_percent' => 9.4],
        48 => ['min_xp' => 10262,  'bonus_percent' => 9.6],
        49 => ['min_xp' => 11494,  'bonus_percent' => 9.8],
        50 => ['min_xp' => 12873,  'bonus_percent' => 10.0],
    ],

];
