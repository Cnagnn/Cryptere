<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SocialAvatarService
{
    /**
     * Download and persist social avatar image locally for a user.
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

            $user->forceFill([
                'avatar_image' => $response->body(),
                'avatar_mime_type' => $mimeType,
                'avatar_path' => null,
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
}
