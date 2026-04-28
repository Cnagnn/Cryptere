<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('onboarding', [
            'userName' => $user->name,
            'userEmail' => $user->email,
            'hasAvatar' => $user->avatar !== null,
        ]);
    }

    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'learning_goal' => ['nullable', 'string', 'max:255'],
            'experience_level' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'interests' => ['nullable', 'array', 'max:5'],
            'interests.*' => ['string', 'max:100'],
        ]);

        $user->update([
            'onboarding_completed_at' => now(),
        ]);

        return redirect()->route('dashboard')->with('toast', [
            'type' => 'success',
            'message' => 'Welcome aboard! Let\'s start learning. 🚀',
        ]);
    }

    public function skip(Request $request): RedirectResponse
    {
        $request->user()->update([
            'onboarding_completed_at' => now(),
        ]);

        return redirect()->route('dashboard');
    }
}
