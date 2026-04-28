<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class CtfEvent extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'description',
        'rules',
        'starts_at',
        'ends_at',
        'is_published',
        'max_participants',
        'bonus_xp',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_published' => 'boolean',
            'max_participants' => 'integer',
            'bonus_xp' => 'integer',
        ];
    }

    /**
     * Get the route key name for route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Get the flags for this CTF event.
     */
    public function flags(): HasMany
    {
        return $this->hasMany(CtfFlag::class)->orderBy('sort_order');
    }

    /**
     * Get the registrations for this CTF event.
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(CtfRegistration::class);
    }

    /**
     * Get all submissions for this event through flags.
     */
    public function submissions(): HasManyThrough
    {
        return $this->hasManyThrough(CtfSubmission::class, CtfFlag::class);
    }

    /**
     * Scope to published events only.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope to active events (currently running).
     */
    public function scopeActive(Builder $query): Builder
    {
        $now = now();

        return $query->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now);
    }

    /**
     * Scope to upcoming events (not yet started).
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('starts_at', '>', now());
    }

    /**
     * Check if the event is currently active.
     */
    public function isActive(): bool
    {
        $now = now();

        return $this->starts_at <= $now && $this->ends_at >= $now;
    }

    /**
     * Check if the event has ended.
     */
    public function hasEnded(): bool
    {
        return $this->ends_at < now();
    }

    /**
     * Check if the event has not started yet.
     */
    public function isUpcoming(): bool
    {
        return $this->starts_at > now();
    }

    /**
     * Check if the event is full (max participants reached).
     */
    public function isFull(): bool
    {
        if ($this->max_participants === null) {
            return false;
        }

        return $this->registrations()->count() >= $this->max_participants;
    }
}
