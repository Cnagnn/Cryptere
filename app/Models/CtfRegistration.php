<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CtfRegistration extends Model
{
    protected $fillable = [
        'user_id',
        'ctf_event_id',
        'registered_at',
        'total_points',
        'flags_captured',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'completed_at' => 'datetime',
            'total_points' => 'integer',
            'flags_captured' => 'integer',
        ];
    }

    /**
     * Get the user for this registration.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the CTF event for this registration.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(CtfEvent::class, 'ctf_event_id');
    }
}
