<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Services\PixabotAvatarService;
use App\Services\SocialAvatarService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(
        private readonly SocialAvatarService $socialAvatarService,
        private readonly PixabotAvatarService $pixabotAvatarService,
    ) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $input['profile_visibility'] ??= 'private';
        $input['username'] = strtolower(trim((string) ($input['username'] ?? '')));

        Validator::make($input, [
            ...$this->profileRules(),
            'username' => ['required', 'string', 'min:4', 'max:255', 'unique:users,username', 'regex:/^[a-z0-9._]+$/'],
            'password' => $this->passwordRules(),
            'terms' => ['accepted'],
        ], [
            'username.regex' => 'The username may only contain letters, numbers, dots (.), and underscores (_).',
        ])->validate();

        $hasSocialRegistrationContext = session()->has('social_user');

        $user = DB::transaction(function () use ($input): User {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'username' => $input['username'],
                'password' => $input['password'],
                'status' => 'active',
                'profile_visibility' => $input['profile_visibility'],
            ]);

            // Check if this is the only user (safe after insert)
            if (User::count() === 1) {
                $user->assignRole(User::ROLE_SUPER_ADMIN);
            } else {
                $user->assignRole(User::ROLE_USER);
            }

            return $user;
        });

        $defaultPixabotAvatarId = $this->pixabotAvatarService->randomId();

        if ($defaultPixabotAvatarId !== null) {
            $user->forceFill([
                'pixabot_avatar_id' => $defaultPixabotAvatarId,
            ])->save();
        }

        if ($hasSocialRegistrationContext) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();

            $socialData = session('social_user');
            $user->socialAccounts()->create([
                'provider' => $socialData['provider'],
                'provider_user_id' => $socialData['id'],
                'provider_email' => $socialData['email'],
                'provider_name' => $socialData['name'],
                'provider_avatar' => $socialData['avatar'],
            ]);

            $this->socialAvatarService->syncUserAvatarFromUrl($user, $socialData['avatar'] ?? null);

            session()->forget('social_user');
        }

        return $user;
    }
}
