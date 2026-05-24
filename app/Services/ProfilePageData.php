<?php

namespace App\Services;

use App\Models\User;

class ProfilePageData
{
    /**
     * Build the shared profile payload used by public and edit views.
     *
     * @return array<string, mixed>
     */
    public function profileUser(User $user, bool $isOwner): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $isOwner ? $user->email : null,
            'avatar' => $user->avatar,
            'has_custom_avatar' => $user->hasCustomAvatar(),
            'pixabot_avatar_id' => $user->pixabot_avatar_id,
            'bio' => $user->bio,
            'pronoun' => $user->pronoun,
            'location' => $user->location,
            'profile_visibility' => $user->profile_visibility,
            'xp' => $user->xp,
            'points' => $user->points,
            'current_streak' => $user->current_streak,
            'longest_streak' => $user->longest_streak,
            'created_at' => $user->created_at,
        ];
    }

    /**
     * Build the shared badge payload.
     *
     * @return array<int, array<string, mixed>>
     */
    public function badges(User $user): array
    {
        return $user->badges()
            ->select(['badges.id', 'badges.slug', 'badges.name', 'badges.description', 'badges.icon', 'badges.category', 'badges.tier'])
            ->orderByPivot('earned_at', 'desc')
            ->get()
            ->map(static fn ($badge): array => [
                'id' => $badge->id,
                'slug' => $badge->slug,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon,
                'category' => $badge->category,
                'tier' => $badge->tier,
                'earned_at' => $badge->pivot->earned_at,
            ])->all();
    }

    /**
     * Build the private profile payload shown to non-owners.
     *
     * @return array<string, string|null>
     */
    public function privateProfile(User $user): array
    {
        return [
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar,
        ];
    }
}
