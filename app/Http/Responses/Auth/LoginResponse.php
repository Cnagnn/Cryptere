<?php

namespace App\Http\Responses\Auth;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        $redirect = redirect()->intended(Fortify::redirects('login'));
        $targetUrl = $redirect->getTargetUrl();

        if ($this->shouldUseInertiaLocation($request, $targetUrl)) {
            return Inertia::location($targetUrl);
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
