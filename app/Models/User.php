<?php

namespace App\Models;

use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'avatar_path', 'avatar_image', 'avatar_mime_type', 'username', 'password', 'points', 'xp', 'current_streak', 'longest_streak', 'last_active_date', 'daily_xp_earned', 'daily_goal_met_at', 'ability_estimate', 'is_admin', 'role', 'status', 'onboarding_completed_at', 'bio', 'pronoun', 'location', 'profile_visibility'])]
#[Hidden(['password', 'avatar_path', 'avatar_image', 'avatar_mime_type', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    private const MANAGEMENT_FILTERABLE_ROLES = ['admin', 'member'];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['avatar'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'points' => 'integer',
            'xp' => 'integer',
            'current_streak' => 'integer',
            'longest_streak' => 'integer',
            'last_active_date' => 'date',
            'daily_xp_earned' => 'integer',
            'daily_goal_met_at' => 'date',
            'ability_estimate' => 'float',
            'is_admin' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
            'profile_visibility' => 'string',
        ];
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    /**
     * Determine whether the user has admin access.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Determine whether the user's profile is publicly visible.
     */
    public function isProfilePublic(): bool
    {
        return $this->profile_visibility === 'public';
    }

    /**
     * Scope user listing by management search keyword.
     */
    public function scopeSearchManagement(Builder $query, string $search): Builder
    {
        $keyword = trim($search);

        if ($keyword === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($keyword): void {
            $builder
                ->where('name', 'like', "%{$keyword}%")
                ->orWhere('email', 'like', "%{$keyword}%")
                ->orWhere('username', 'like', "%{$keyword}%");
        });
    }

    /**
     * Scope user listing by management role filter.
     */
    public function scopeFilterManagementRole(Builder $query, string $role): Builder
    {
        if (! in_array($role, self::MANAGEMENT_FILTERABLE_ROLES, true)) {
            return $query;
        }

        return $query->where('role', $role);
    }

    /**
     * Get the public URL for a locally stored profile avatar.
     *
     * Prefers filesystem path (avatar_path). Falls back to BLOB (avatar_image)
     * for backward compatibility during migration. After running
     * `php artisan avatars:migrate-blobs` and the drop-column migration,
     * only avatar_path will be used.
     */
    public function getAvatarAttribute(): ?string
    {
        // Prefer filesystem-based avatar
        if (is_string($this->avatar_path) && $this->avatar_path !== '') {
            return Storage::disk('public')->url($this->avatar_path);
        }

        // Backward compat: BLOB fallback (removed after migration)
        $avatarBinary = $this->resolveAvatarBinary();

        if (is_string($avatarBinary) && $avatarBinary !== '') {
            $mime = $this->avatar_mime_type ?? 'image/png';

            return 'data:'.$mime.';base64,'.base64_encode($avatarBinary);
        }

        return null;
    }

    /**
     * Get enrollments for the user.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get courses that the user is enrolled in.
     */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'enrollments')
            ->withPivot(['progress_percentage', 'enrolled_at', 'completed_at'])
            ->withTimestamps();
    }

    /**
     * Get lesson progress rows for the user.
     */
    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    /**
     * Get the balance change history for the user.
     */
    public function balanceChanges(): HasMany
    {
        return $this->hasMany(UserBalanceChange::class);
    }

    /**
     * Get challenge submissions for the user.
     */
    public function challengeSubmissions(): HasMany
    {
        return $this->hasMany(ChallengeSubmission::class);
    }

    /**
     * Get the social accounts for the user.
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * Get the badges earned by the user.
     */
    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('earned_at')
            ->withTimestamps();
    }

    /**
     * Get the lab visits for the user.
     */
    public function labVisits(): HasMany
    {
        return $this->hasMany(LabVisit::class);
    }

    /**
     * Get the certificates for the user.
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    /**
     * Get the discussions created by the user.
     */
    public function discussions(): HasMany
    {
        return $this->hasMany(Discussion::class);
    }

    /**
     * Get the discussion replies created by the user.
     */
    public function discussionReplies(): HasMany
    {
        return $this->hasMany(DiscussionReply::class);
    }

    private function resolveAvatarBinary(): ?string
    {
        $avatarImage = $this->avatar_image;

        if (is_string($avatarImage)) {
            return $avatarImage;
        }

        if (is_resource($avatarImage)) {
            rewind($avatarImage);

            $contents = stream_get_contents($avatarImage);

            return is_string($contents) ? $contents : null;
        }

        return null;
    }
}
