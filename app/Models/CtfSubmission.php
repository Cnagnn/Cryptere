<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CtfSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'ctf_flag_id',
        'submitted_flag',
        'is_correct',
        'points_awarded',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'points_awarded' => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Get the user who made this submission.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the flag this submission is for.
     */
    public function flag(): BelongsTo
    {
        return $this->belongsTo(CtfFlag::class, 'ctf_flag_id');
    }
}
