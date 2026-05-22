<?php

use App\Http\Controllers\Settings\AppearanceController;
use App\Http\Controllers\Settings\AvatarController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\SocialAccountController;
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
    /*
    |----------------------------------------------------------------------
    | Profile Settings
    |----------------------------------------------------------------------
    | Routes for viewing and managing user profile information
    */
    Route::controller(ProfileController::class)->prefix('profile')->name('profile.')->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::delete('/', 'destroy')->name('destroy');
    });

    Route::controller(AvatarController::class)->prefix('avatar')->name('avatar.')->group(function () {
        Route::patch('/', 'update')->name('update');
        Route::patch('pixabot', 'pixabot')->name('pixabot');
        Route::delete('/', 'destroy')->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Security Settings
    |----------------------------------------------------------------------
    | Routes for password management and two-factor authentication
    */
    Route::controller(SecurityController::class)->prefix('security')->name('security.')->group(function () {
        Route::get('/', 'edit')->name('edit');
    });

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    /*
    |----------------------------------------------------------------------
    | Social Accounts
    |----------------------------------------------------------------------
    | Routes for managing connected social authentication accounts
    */
    Route::controller(SocialAccountController::class)->prefix('social-accounts')->name('social-accounts.')->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::delete('{socialAccount}', 'destroy')->name('destroy');
    });

    Route::get('appearance', AppearanceController::class)->name('appearance.edit');
});

/*
|--------------------------------------------------------------------------
| Legacy Redirects
|--------------------------------------------------------------------------
| Maintain backward compatibility with deprecated routes
*/
Route::middleware(['auth', 'verified'])->group(function () {
    // Old admin profile path redirects to new settings location
    Route::redirect('profile/admin', 'settings/profile/', 301);
});
