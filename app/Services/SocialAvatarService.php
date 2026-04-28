<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SocialAvatarService
{
    /**
     * Download and persist social avatar image to filesystem for a user.
     *
     * Previously stored as BLOB in the users table — now uses filesystem storage
     * for better performance and scalability.
     */
    public function syncUserAvatarFromUrl(User $user, ?string $avatarUrl): void
    {
        if (! is_string($avatarUrl) || trim($avatarUrl) === '') {
            return;
        }

        try {
            $response = Http::timeout(10)->get($avatarUrl);

            if (! $response->successful() || $response->body() === '') {
                return;
            }

            $mimeType = $this->resolveMimeType(
                $response->header('Content-Type') ?? '',
                $avatarUrl,
            );

            $extension = $this->mimeToExtension($mimeType);
            $filename = "avatars/{$user->id}/avatar.{$extension}";

            Storage::disk('public')->put($filename, $response->body());

            $user->forceFill([
                'avatar_path' => $filename,
            ])->save();
        } catch (\Throwable) {
            // Social login must continue even if avatar download fails.
        }
    }

    private function resolveMimeType(string $contentType, string $avatarUrl): string
    {
        $contentType = Str::lower(trim(explode(';', $contentType)[0]));

        if (Str::startsWith($contentType, 'image/')) {
            return $contentType;
        }

        $pathExtension = pathinfo(parse_url($avatarUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION);

        $map = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
        ];

        if (is_string($pathExtension) && $pathExtension !== '') {
            return $map[Str::lower($pathExtension)] ?? 'image/jpeg';
        }

        return 'image/jpeg';
    }

    private function mimeToExtension(string $mimeType): string
    {
        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
            default => 'png',
        };
    }
}
