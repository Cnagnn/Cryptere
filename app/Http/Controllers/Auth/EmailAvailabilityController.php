<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailAvailabilityController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $email = strtolower($request->string('email')->trim()->toString());

        if (strlen($email) < 5 || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['available' => false]);
        }

        $exists = User::query()
            ->where('email', $email)
            ->exists();

        usleep(random_int(50_000, 100_000));

        return response()->json(['available' => ! $exists]);
    }
}
