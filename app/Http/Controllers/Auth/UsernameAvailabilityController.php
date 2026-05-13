<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsernameAvailabilityController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $username = $request->string('username')->trim()->toString();

        if (! preg_match('/^[a-zA-Z0-9._]{4,255}$/', $username)) {
            return response()->json(['available' => false]);
        }

        $exists = User::query()
            ->where('username', $username)
            ->exists();

        usleep(random_int(50_000, 100_000));

        return response()->json(['available' => ! $exists]);
    }
}
