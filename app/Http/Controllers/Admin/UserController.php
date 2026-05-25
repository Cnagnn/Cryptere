<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display users management listing.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $role = User::normalizeManagementRole((string) $request->input('role', 'all'));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(10, min($perPage, 100));
        $authenticatedUserId = (int) $request->user()?->getKey();
        $superAdminCount = User::countUsersWithRole(User::ROLE_SUPER_ADMIN);

        $users = User::query()
            ->with('roles:id,name')
            ->searchManagement($search)
            ->filterManagementRole($role)
            ->orderBy('name')
            ->paginate($perPage, ['id', 'name', 'email', 'avatar_path', 'avatar_image', 'avatar_mime_type', 'pixabot_avatar_id', 'username', 'points', 'created_at'])
            ->through(function (User $user) use ($superAdminCount, $authenticatedUserId): array {
                $primaryRole = $user->primaryRoleName();
                $cannotDeleteLastSuperAdmin = $primaryRole === User::ROLE_SUPER_ADMIN && $superAdminCount <= 1;
                $cannotDeleteSelf = (int) $user->getKey() === $authenticatedUserId;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'username' => $user->username,
                    'points' => $user->points,
                    'role' => $primaryRole,
                    'created_at' => $user->created_at,
                    'can_delete' => ! $cannotDeleteLastSuperAdmin && ! $cannotDeleteSelf,
                ];
            })
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
        ]);
    }

    /**
     * Update role for a managed user.
     */
    public function update(UpdateAdminUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $role = (string) $validated['role'];

        DB::transaction(function () use ($user, $validated, $role): void {
            $user->forceFill([
                'points' => $validated['points'],
            ])->save();

            $user->syncRoles($role);
        });

        app(AuditService::class)->log($request->user(), 'updated_role', $user, ['role' => $role]);

        return back()->with('success', 'User access has been updated.');
    }

    /**
     * Delete a managed user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $isLastSuperAdmin = $user->isSuperAdmin() && User::countUsersWithRole(User::ROLE_SUPER_ADMIN) <= 1;

        if ($user->isSuperAdmin() && ! $request->user()?->isSuperAdmin()) {
            return back()->withErrors(['user' => 'Only a Super Admin can delete another Super Admin.']);
        }

        if ($isLastSuperAdmin) {
            return back()->withErrors(['user' => 'The last Super Admin account cannot be deleted.']);
        }

        if ((int) $request->user()?->getKey() === (int) $user->getKey()) {
            return back()->withErrors(['user' => 'You cannot delete your own account.']);
        }

        if ($this->userHasProtectedHistory($user)) {
            return back()->withErrors([
                'user' => __('Deactivate this user instead. The account already has learner or balance history.'),
            ]);
        }

        app(AuditService::class)->log($request->user(), 'deleted', $user);

        $user->delete();

        return back()->with('success', 'User has been deleted.');
    }

    private function userHasProtectedHistory(User $user): bool
    {
        if ($user->points > 0) {
            return true;
        }

        $historyQuery = DB::table('enrollments')
            ->selectRaw('1 as has_history')
            ->where('user_id', $user->id)
            ->unionAll(DB::table('lesson_progress')->selectRaw('1')->where('user_id', $user->id))
            ->unionAll(DB::table('task_progress')->selectRaw('1')->where('user_id', $user->id))
            ->unionAll(DB::table('quiz_submissions')->selectRaw('1')->where('user_id', $user->id))
            ->unionAll(DB::table('assessment_submissions')->selectRaw('1')->where('user_id', $user->id))
            ->unionAll(DB::table('user_balance_changes')->selectRaw('1')->where('user_id', $user->id));

        return DB::query()
            ->fromSub($historyQuery, 'protected_history')
            ->exists();
    }
}
