<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CtfFlag extends Model
{
    protected $fillable = [
        'ctf_event_id',
        'title',
        'description',
        'hint',
        'flag_value',
        'points',
        'difficulty',
        'sort_order',
        'category',
    ];

    protected $hidden = ['flag_value'];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the CTF event this flag belongs to.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(CtfEvent::class, 'ctf_event_id');
    }

    /**
     * Get submissions for this flag.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(CtfSubmission::class);
    }

    /**
     * Check if the given answer is correct (case-insensitive, trimmed).
     */
    public function isCorrect(string $answer): bool
    {
        return mb_strtolower(trim($answer)) === mb_strtolower(trim($this->flag_value));
    }
}
