<?php

namespace App\Http\Responses\Auth;

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

        $redirect = redirect()->intended(Fortify::redirects('register'));
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
