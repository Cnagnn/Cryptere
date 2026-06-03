<?php

use App\Http\Controllers\Settings\AvatarController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SocialAccountController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
|
| All settings routes are grouped under the /settings prefix for consistency.
| Routes are organized by concern (profile, security, social) with proper
| HTTP methods and authentication middleware.
*/

Route::middleware(['auth', 'verified'])->prefix('settings')->name('settings.')->group(function () {
    $redirectToProfileSettings = fn (Request $request) => redirect()->route('profile.settings', $request->user()->username);

    /*
    |----------------------------------------------------------------------
    | Profile Settings
    |----------------------------------------------------------------------
    | Routes for viewing and managing user profile information
    */
    Route::get('profile', $redirectToProfileSettings)->name('profile.edit');
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::controller(AvatarController::class)->prefix('avatar')->name('avatar.')->group(function () {
        Route::patch('pixabot', 'pixabot')->name('pixabot');
        Route::delete('/', 'destroy')->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Security Settings
    |----------------------------------------------------------------------
    | Routes for password management and two-factor authentication
    */
    Route::get('security', $redirectToProfileSettings)->name('security.edit');

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    /*
    |----------------------------------------------------------------------
    | Social Accounts
    |----------------------------------------------------------------------
    | Routes for managing connected social authentication accounts
    */
    Route::get('social-accounts', $redirectToProfileSettings)->name('social-accounts.edit');
    Route::delete('social-accounts/{socialAccount}', [SocialAccountController::class, 'destroy'])->name('social-accounts.destroy');

    Route::get('appearance', $redirectToProfileSettings)->name('appearance.edit');
});
