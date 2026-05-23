<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\File;

class PixabotAvatarService
{
    public const PUBLIC_DIRECTORY = 'avatars/pixabots/webp/480';

    /**
     * @return array{baseUrl:string, ids:array<int, string>}
     */
    public function options(): array
    {
        return [
            'baseUrl' => asset(self::PUBLIC_DIRECTORY),
            'ids' => $this->ids(),
        ];
    }

    public function isValidId(?string $id): bool
    {
        if (! is_string($id) || ! preg_match('/^[a-f0-9]{4}$/i', $id)) {
            return false;
        }

        return in_array(strtolower($id), $this->ids(), true);
    }

    public function urlForUser(User $user): ?string
    {
        $id = $this->isValidId($user->pixabot_avatar_id)
            ? strtolower((string) $user->pixabot_avatar_id)
            : $this->defaultIdForUser($user);

        return $id === null ? null : $this->url($id);
    }

    public function defaultIdForUser(User $user): ?string
    {
        $ids = $this->ids();

        if ($ids === []) {
            return null;
        }

        $seed = (string) ($user->getKey() ?? $user->email ?? $user->name);
        $index = crc32($seed) % count($ids);

        return $ids[$index];
    }

    public function randomId(): ?string
    {
        $ids = $this->ids();

        if ($ids === []) {
            return null;
        }

        return $ids[array_rand($ids)];
    }

    public function url(string $id): string
    {
        return asset($this->relativePath(strtolower($id)));
    }

    /**
     * @return array<int, string>
     */
    private function ids(): array
    {
        static $ids = null;

        if ($ids !== null) {
            return $ids;
        }

        $files = File::glob(public_path(self::PUBLIC_DIRECTORY.'/*.webp')) ?: [];

        $ids = collect($files)
            ->map(fn (string $path): string => pathinfo($path, PATHINFO_FILENAME))
            ->filter(fn (string $id): bool => preg_match('/^[a-f0-9]{4}$/i', $id) === 1)
            ->map(fn (string $id): string => strtolower($id))
            ->sort()
            ->values()
            ->all();

        return $ids;
    }

    private function relativePath(string $id): string
    {
        return self::PUBLIC_DIRECTORY.'/'.$id.'.webp';
    }
}
