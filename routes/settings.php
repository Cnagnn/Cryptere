<?php

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

    /*
    |----------------------------------------------------------------------
    | Security Settings
    |----------------------------------------------------------------------
    | Routes for password management and two-factor authentication
    */
    Route::controller(SecurityController::class)->prefix('security')->name('security.')->group(function () {
        Route::get('/', 'edit')->name('edit');
    });

    Route::controller(SecurityController::class)->prefix('password')->name('password.')->group(function () {
        Route::put('/', 'update')->middleware('throttle:6,1')->name('update');
    });

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
