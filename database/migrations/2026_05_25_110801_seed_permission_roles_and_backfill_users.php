<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const GUARD = 'web';

    private const ROLE_SUPER_ADMIN = 'Super Admin';

    private const ROLE_ADMIN = 'Admin';

    private const ROLE_USER = 'User';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $roles = $this->ensureRolesExist();
        $firstUserId = DB::table('users')->min('id');

        DB::table('users')
            ->select(['id', 'role', 'is_admin'])
            ->orderBy('id')
            ->lazyById()
            ->each(function (object $user) use ($firstUserId, $roles): void {
                $roleName = $this->roleNameForUser($user, $firstUserId);

                DB::table('model_has_roles')->updateOrInsert([
                    'role_id' => $roles[$roleName],
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $user->id,
                ]);

                $updates = [];

                if (Schema::hasColumn('users', 'role')) {
                    $updates['role'] = $roleName;
                }

                if (Schema::hasColumn('users', 'is_admin')) {
                    $updates['is_admin'] = in_array($roleName, [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN], true);
                }

                if ($updates !== []) {
                    DB::table('users')->where('id', $user->id)->update($updates);
                }
            });

        $this->clearPermissionCache();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $roleIds = DB::table('roles')
            ->where('guard_name', self::GUARD)
            ->whereIn('name', $this->roleNames())
            ->pluck('id');

        DB::table('model_has_roles')
            ->where('model_type', 'App\\Models\\User')
            ->whereIn('role_id', $roleIds)
            ->delete();

        DB::table('roles')
            ->where('guard_name', self::GUARD)
            ->whereIn('name', $this->roleNames())
            ->delete();

        $this->clearPermissionCache();
    }

    /**
     * @return array<string, int>
     */
    private function ensureRolesExist(): array
    {
        $now = Carbon::now();

        foreach ($this->roleNames() as $roleName) {
            DB::table('roles')->updateOrInsert(
                ['name' => $roleName, 'guard_name' => self::GUARD],
                ['created_at' => $now, 'updated_at' => $now],
            );
        }

        return DB::table('roles')
            ->where('guard_name', self::GUARD)
            ->whereIn('name', $this->roleNames())
            ->pluck('id', 'name')
            ->map(fn (mixed $id): int => (int) $id)
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function roleNames(): array
    {
        return [
            self::ROLE_SUPER_ADMIN,
            self::ROLE_ADMIN,
            self::ROLE_USER,
        ];
    }

    private function roleNameForUser(object $user, mixed $firstUserId): string
    {
        if ($firstUserId !== null && (int) $user->id === (int) $firstUserId) {
            return self::ROLE_SUPER_ADMIN;
        }

        $legacyRole = strtolower(trim((string) ($user->role ?? '')));

        if ((bool) ($user->is_admin ?? false) || $legacyRole === 'admin') {
            return self::ROLE_ADMIN;
        }

        return self::ROLE_USER;
    }

    private function clearPermissionCache(): void
    {
        app('cache')
            ->store(config('permission.cache.store') !== 'default' ? config('permission.cache.store') : null)
            ->forget(config('permission.cache.key'));
    }
};
