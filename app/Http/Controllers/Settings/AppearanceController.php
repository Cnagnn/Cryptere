<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    public function __invoke(): Response
    {
        Log::info('AppearanceController invoked', [
            'user_id' => auth()->id(),
            'component' => 'settings/appearance',
        ]);

        return Inertia::render('settings/appearance');
    }
}
