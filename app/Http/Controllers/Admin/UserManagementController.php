<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Display users management listing.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $role = (string) $request->input('role', 'all');
        $authenticatedUserId = (int) $request->user()?->getKey();
        $adminCount = User::query()->where('role', 'admin')->count();

        $users = User::query()
            ->searchManagement($search)
            ->filterManagementRole($role)
            ->orderBy('name')
            ->paginate(10, ['id', 'name', 'email', 'avatar_path', 'avatar_image', 'avatar_mime_type', 'username', 'points', 'role', 'created_at'])
            ->through(function (User $user) use ($adminCount, $authenticatedUserId): array {
                $cannotDeleteLastAdmin = $user->role === 'admin' && $adminCount <= 1;
                $cannotDeleteSelf = (int) $user->getKey() === $authenticatedUserId;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'username' => $user->username,
                    'points' => $user->points,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                    'can_delete' => ! $cannotDeleteLastAdmin && ! $cannotDeleteSelf,
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

        $user->update([
            ...$validated,
            'is_admin' => $validated['role'] === 'admin',
        ]);

        return back()->with('success', 'User access has been updated.');
    }

    /**
     * Soft delete a managed user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $isLastAdmin = $user->role === 'admin' && User::query()->where('role', 'admin')->count() <= 1;

        if ($isLastAdmin) {
            return back()->with('error', 'The last admin account cannot be deleted.');
        }

        if ((int) $request->user()?->getKey() === (int) $user->getKey()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'User has been deleted.');
    }
}
