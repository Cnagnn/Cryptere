<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AuthorizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (User::ROLES as $roleName) {
            Role::findOrCreate($roleName);
        }

        foreach (User::PERMISSIONS as $permissionName) {
            Permission::findOrCreate($permissionName);
        }

        Role::findByName(User::ROLE_SUPER_ADMIN)->syncPermissions(User::ADMIN_PERMISSIONS);
        Role::findByName(User::ROLE_ADMIN)->syncPermissions(User::ADMIN_PERMISSIONS);
        Role::findByName(User::ROLE_USER)->syncPermissions([]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
