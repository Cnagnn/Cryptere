<?php

namespace App\Http\Responses\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;

class NeutralPasswordResetLinkResponse implements FailedPasswordResetLinkRequestResponse, SuccessfulPasswordResetLinkRequestResponse
{
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        $message = 'Jika email terdaftar, tautan reset kata sandi akan dikirim.';

        return $request->wantsJson()
            ? response()->json(['message' => $message])
            : back()->with('status', $message);
    }
}
