<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;
use Symfony\Component\HttpFoundation\Response;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 201);
        }

        // Social users have email_verified_at set during register, so they
        // skip the /verify gate and go straight to the configured app home
        // (typically https://app.cryptere.com/dashboard). Manual registrants
        // still need to verify their email first.
        //
        // We use Fortify::redirects() (not config('fortify.home')) because it
        // reads config('fortify.redirects.register') first, which lets tests
        // and runtime customize the destination without rebuilding the cached
        // fortify.home value.
        $targetUrl = $request->user()->hasVerifiedEmail()
            ? Fortify::redirects('register')
            : route('verification.notice');

        $redirect = redirect()->intended($targetUrl);

        // When the form was submitted via Inertia (XHR fetch from React),
        // a plain 302 redirect to a different host is silently dropped by
        // the browser/Inertia client and the user is stuck on the register
        // page. Inertia::location() responds with 409 + X-Inertia-Location
        // header, which Inertia interprets as "do a hard window.location
        // navigation" — required for cross-subdomain redirects from
        // auth.cryptere.com → app.cryptere.com.
        if ($this->shouldUseInertiaLocation($request, $redirect->getTargetUrl())) {
            return Inertia::location($redirect->getTargetUrl());
        }

        return $redirect;
    }

    private function shouldUseInertiaLocation(Request $request, string $targetUrl): bool
    {
        $targetHost = parse_url($targetUrl, PHP_URL_HOST);

        return $request->headers->has('X-Inertia')
            && is_string($targetHost)
            && $targetHost !== $request->getHost();
    }
}
