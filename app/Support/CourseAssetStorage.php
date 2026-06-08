<?php

namespace App\Support;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class CourseAssetStorage
{
    /**
     * Get the configured disk for course media assets.
     */
    public function diskName(): string
    {
        $disk = config('filesystems.course_assets_disk', 'public');

        return is_string($disk) && $disk !== '' ? $disk : 'public';
    }

    public function disk(?string $diskName = null): FilesystemAdapter
    {
        return Storage::disk($diskName ?? $this->diskName());
    }

    public function storeUploadedFile(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, $this->diskName());

        if (! is_string($path)) {
            throw new RuntimeException('Unable to store uploaded course asset.');
        }

        return $path;
    }

    public function url(string $path): string
    {
        return $this->disk()->url($this->normalizePath($path));
    }

    public function exists(string $path, ?string $diskName = null): bool
    {
        return $this->disk($diskName)->exists($this->normalizePath($path));
    }

    public function delete(string $path, ?string $diskName = null): bool
    {
        return $this->disk($diskName)->delete($this->normalizePath($path));
    }

    public function deleteExisting(string $path): bool
    {
        $deleted = false;

        foreach ($this->candidateDisks() as $disk) {
            if ($this->exists($path, $disk)) {
                $deleted = $this->delete($path, $disk) || $deleted;
            }
        }

        return $deleted;
    }

    public function put(string $path, mixed $contents, ?string $diskName = null): bool
    {
        return $this->disk($diskName)->put($this->normalizePath($path), $contents);
    }

    public function size(string $path, ?string $diskName = null): int
    {
        return $this->disk($diskName)->size($this->normalizePath($path));
    }

    public function readStream(string $path, ?string $diskName = null): mixed
    {
        return $this->disk($diskName)->readStream($this->normalizePath($path));
    }

    public function putLocalFile(string $path, string $localFile, ?string $diskName = null): bool
    {
        $stream = fopen($localFile, 'rb');

        if ($stream === false) {
            throw new RuntimeException("Unable to open {$localFile} for upload.");
        }

        try {
            return $this->put($path, $stream, $diskName);
        } finally {
            fclose($stream);
        }
    }

    public function copyToLocalFile(string $path, string $localFile, ?string $diskName = null): void
    {
        $source = $this->readStream($path, $diskName);

        if (! is_resource($source)) {
            throw new RuntimeException("Unable to open {$path} from storage.");
        }

        $target = fopen($localFile, 'wb');

        if ($target === false) {
            fclose($source);

            throw new RuntimeException("Unable to open {$localFile} for writing.");
        }

        try {
            stream_copy_to_stream($source, $target);
        } finally {
            fclose($source);
            fclose($target);
        }
    }

    /**
     * Resolve a storage path from either a relative path or public object URL.
     */
    public function pathFromUrl(string $url, ?string $diskName = null): ?string
    {
        $value = trim($url);

        if ($value === '' || str_starts_with($value, 'data:')) {
            return null;
        }

        if (! str_contains($value, '://') && ! str_starts_with($value, '/')) {
            return $this->normalizePath($value);
        }

        $disk = $diskName ?? $this->diskName();
        $baseUrl = $this->baseUrl($disk);

        if ($baseUrl !== null && str_starts_with($value, $baseUrl)) {
            return $this->stripBucketPrefix(
                $this->normalizePath(substr($value, strlen($baseUrl))),
                $disk,
            );
        }

        $path = parse_url($value, PHP_URL_PATH);

        if (! is_string($path) || $path === '') {
            return null;
        }

        $path = $this->normalizePath(rawurldecode($path));

        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        return $this->stripBucketPrefix($path, $disk);
    }

    /**
     * @return array{disk: string, path: string}|null
     */
    public function resolveExistingObject(string $url): ?array
    {
        foreach ($this->candidateDisks() as $disk) {
            $path = $this->pathFromUrl($url, $disk);

            if ($path !== null && $this->exists($path, $disk)) {
                return [
                    'disk' => $disk,
                    'path' => $path,
                ];
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function candidateDisks(): array
    {
        return array_values(array_unique([$this->diskName(), 'public']));
    }

    private function baseUrl(string $diskName): ?string
    {
        $configured = config("filesystems.disks.{$diskName}.url");

        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, '/');
        }

        try {
            return rtrim($this->disk($diskName)->url(''), '/');
        } catch (Throwable) {
            return null;
        }
    }

    private function normalizePath(string $path): string
    {
        return ltrim(str_replace('\\', '/', $path), '/');
    }

    private function stripBucketPrefix(string $path, string $diskName): ?string
    {
        $path = $this->normalizePath($path);

        if ($path === '') {
            return null;
        }

        $bucket = config("filesystems.disks.{$diskName}.bucket");

        if (is_string($bucket) && $bucket !== '' && str_starts_with($path, $bucket.'/')) {
            return substr($path, strlen($bucket) + 1);
        }

        return $path;
    }
}
