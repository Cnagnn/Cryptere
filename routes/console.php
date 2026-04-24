<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('app:warn-point-decay')->dailyAt('08:00');
Schedule::command('app:decay-inactive-points')->daily();

// Database backup schedule
Schedule::command('backup:clean')->dailyAt('02:00');
Schedule::command('backup:run')->dailyAt('02:15');
