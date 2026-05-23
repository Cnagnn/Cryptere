<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\File;

class PixabotAvatarService
{
    public const STATIC_PUBLIC_DIRECTORY = 'avatars/pixabots/png/480';

    public const ADMIN_PUBLIC_DIRECTORY = 'avatars/pixabots/webp/480';

    /**
     * @return array{baseUrl:string, extension:string, ids:array<int, string>}
     */
    public function options(?User $user = null): array
    {
        $format = $this->formatForUser($user);

        return [
            'baseUrl' => asset($this->directoryForFormat($format)),
            'extension' => $format,
            'ids' => $this->ids($format),
        ];
    }

    public function isValidId(?string $id, ?User $user = null): bool
    {
        if (! is_string($id) || ! preg_match('/^[a-f0-9]{4}$/i', $id)) {
            return false;
        }

        return in_array(strtolower($id), $this->ids($this->formatForUser($user)), true);
    }

    public function urlForUser(User $user): ?string
    {
        $format = $this->formatForUser($user);
        $id = $this->isValidId($user->pixabot_avatar_id, $user)
            ? strtolower((string) $user->pixabot_avatar_id)
            : $this->defaultIdForUser($user);

        return $id === null ? null : $this->url($id, $format);
    }

    public function defaultIdForUser(User $user): ?string
    {
        $ids = $this->ids($this->formatForUser($user));

        if ($ids === []) {
            return null;
        }

        $seed = (string) ($user->getKey() ?? $user->email ?? $user->name);
        $index = crc32($seed) % count($ids);

        return $ids[$index];
    }

    public function randomId(): ?string
    {
        $ids = $this->ids('png');

        if ($ids === []) {
            return null;
        }

        return $ids[array_rand($ids)];
    }

    public function url(string $id, string $format = 'png'): string
    {
        return asset($this->relativePath(strtolower($id), $format));
    }

    /**
     * @return array<int, string>
     */
    private function ids(string $format): array
    {
        static $ids = [];

        if (isset($ids[$format])) {
            return $ids[$format];
        }

        $files = File::glob(public_path($this->directoryForFormat($format).'/*.'.$format)) ?: [];

        $ids[$format] = collect($files)
            ->map(fn (string $path): string => pathinfo($path, PATHINFO_FILENAME))
            ->filter(fn (string $id): bool => preg_match('/^[a-f0-9]{4}$/i', $id) === 1)
            ->map(fn (string $id): string => strtolower($id))
            ->sort()
            ->values()
            ->all();

        return $ids[$format];
    }

    private function relativePath(string $id, string $format): string
    {
        return $this->directoryForFormat($format).'/'.$id.'.'.$format;
    }

    private function formatForUser(?User $user): string
    {
        return $user?->isAdmin() === true ? 'webp' : 'png';
    }

    private function directoryForFormat(string $format): string
    {
        return $format === 'webp'
            ? self::ADMIN_PUBLIC_DIRECTORY
            : self::STATIC_PUBLIC_DIRECTORY;
    }
}
