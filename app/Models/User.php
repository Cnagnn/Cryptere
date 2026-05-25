<?php

namespace App\Models;

use App\Notifications\VerifyEmailNotification;
use App\Services\PixabotAvatarService;
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
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'avatar_path', 'avatar_image', 'avatar_mime_type', 'pixabot_avatar_id', 'username', 'password', 'points', 'xp', 'current_streak', 'longest_streak', 'last_active_date', 'daily_xp_earned', 'daily_goal_met_at', 'ability_estimate', 'is_admin', 'role', 'status', 'bio', 'pronoun', 'location', 'profile_visibility'])]
#[Hidden(['password', 'avatar_path', 'avatar_image', 'avatar_mime_type', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    public const ROLE_SUPER_ADMIN = 'Super Admin';

    public const ROLE_ADMIN = 'Admin';

    public const ROLE_USER = 'User';

    public const ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN,
        self::ROLE_USER,
    ];

    public const ADMIN_ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN,
    ];

    public const PERMISSION_ACCESS_ADMIN = 'access admin';

    public const PERMISSION_MANAGE_USERS = 'manage users';

    public const PERMISSION_VIEW_UNPUBLISHED_COURSES = 'view unpublished courses';

    public const PERMISSION_MANAGE_COURSES = 'manage courses';

    public const PERMISSION_PUBLISH_COURSES = 'publish courses';

    public const PERMISSION_MANAGE_LESSONS = 'manage lessons';

    public const PERMISSION_MANAGE_TASKS = 'manage tasks';

    public const PERMISSION_VIEW_UNPUBLISHED_ASSESSMENTS = 'view unpublished assessments';

    public const PERMISSION_MANAGE_ASSESSMENTS = 'manage assessments';

    public const PERMISSION_MANAGE_ASSESSMENT_QUESTIONS = 'manage assessment questions';

    public const PERMISSION_GRADE_SUBMISSIONS = 'grade submissions';

    public const PERMISSION_MANAGE_ENROLLMENTS = 'manage enrollments';

    public const PERMISSION_MANAGE_QUESTION_BANK = 'manage question bank';

    public const PERMISSIONS = [
        self::PERMISSION_ACCESS_ADMIN,
        self::PERMISSION_MANAGE_USERS,
        self::PERMISSION_VIEW_UNPUBLISHED_COURSES,
        self::PERMISSION_MANAGE_COURSES,
        self::PERMISSION_PUBLISH_COURSES,
        self::PERMISSION_MANAGE_LESSONS,
        self::PERMISSION_MANAGE_TASKS,
        self::PERMISSION_VIEW_UNPUBLISHED_ASSESSMENTS,
        self::PERMISSION_MANAGE_ASSESSMENTS,
        self::PERMISSION_MANAGE_ASSESSMENT_QUESTIONS,
        self::PERMISSION_GRADE_SUBMISSIONS,
        self::PERMISSION_MANAGE_ENROLLMENTS,
        self::PERMISSION_MANAGE_QUESTION_BANK,
    ];

    public const ADMIN_PERMISSIONS = self::PERMISSIONS;

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
        if (! $this->exists) {
            return false;
        }

        return $this->hasAnyRole(self::ADMIN_ROLES);
    }

    /**
     * Determine whether the user can access the admin area.
     */
    public function canAccessAdmin(): bool
    {
        if (! $this->exists) {
            return $this->isAdmin();
        }

        return $this->can(self::PERMISSION_ACCESS_ADMIN);
    }

    /**
     * Determine whether the user has super admin access.
     */
    public function isSuperAdmin(): bool
    {
        if (! $this->exists) {
            return false;
        }

        return $this->hasRole(self::ROLE_SUPER_ADMIN);
    }

    /**
     * Get the user's primary role name for display and filtering.
     */
    public function primaryRoleName(): string
    {
        if (! $this->exists) {
            return self::ROLE_USER;
        }

        $role = $this->relationLoaded('roles')
            ? $this->roles->first()
            : $this->roles()->first(['name']);

        return is_string($role?->name)
            ? $role->name
            : self::ROLE_USER;
    }

    public static function normalizeRoleName(?string $role): string
    {
        return match (strtolower(trim((string) $role))) {
            'super admin', 'super-admin', 'super_admin' => self::ROLE_SUPER_ADMIN,
            'admin' => self::ROLE_ADMIN,
            'member', 'student', 'user' => self::ROLE_USER,
            default => self::ROLE_USER,
        };
    }

    public static function normalizeManagementRole(string $role): string
    {
        if ($role === 'all') {
            return 'all';
        }

        return self::normalizeRoleName($role);
    }

    public static function countUsersWithRole(string $role): int
    {
        return self::query()
            ->whereHas('roles', fn (Builder $query): Builder => $query->where('name', $role))
            ->count();
    }

    /**
     * Determine whether the user's profile is publicly visible.
     */
    public function isProfilePublic(): bool
    {
        return $this->profile_visibility === 'public';
    }

    /**
     * Store public usernames in lowercase for every write path.
     */
    public function setUsernameAttribute(?string $value): void
    {
        $this->attributes['username'] = is_string($value)
            ? strtolower(trim($value))
            : null;
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
        if (! in_array($role, self::ROLES, true)) {
            return $query;
        }

        return $query->whereHas('roles', fn (Builder $builder): Builder => $builder->where('name', $role));
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
        if ($this->hasCustomAvatar()) {
            return Storage::disk('public')->url($this->avatar_path);
        }

        $avatarBinary = $this->resolveAvatarBinary();

        if (is_string($avatarBinary) && $avatarBinary !== '' && ! $this->hasGifAvatar()) {
            $mime = $this->avatar_mime_type ?? 'image/png';

            return 'data:'.$mime.';base64,'.base64_encode($avatarBinary);
        }

        return app(PixabotAvatarService::class)->urlForUser($this);
    }

    /**
     * Determine whether the user has an uploaded custom avatar.
     */
    public function hasCustomAvatar(): bool
    {
        if (is_string($this->avatar_path) && $this->avatar_path !== '') {
            return ! str_starts_with($this->avatar_path, 'avatars/pixabots/')
                && ! $this->hasGifAvatar();
        }

        return $this->resolveAvatarBinary() !== null && ! $this->hasGifAvatar();
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

    private function hasGifAvatar(): bool
    {
        return $this->avatar_mime_type === 'image/gif'
            || (is_string($this->avatar_path) && str_ends_with(strtolower($this->avatar_path), '.gif'));
    }
}
