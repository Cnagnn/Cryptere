<?php

test('google oauth redirect uses auth subdomain callback uri', function (): void {
    config([
        'app.urls.auth' => 'https://auth.cryptere.com',
        'services.google.client_id' => 'google-client-id',
        'services.google.client_secret' => 'google-client-secret',
        'services.google.redirect' => '/auth/google/callback',
    ]);

    $response = $this->get(route('social.redirect', 'google'));

    $response->assertRedirect();

    expect(urldecode($response->headers->get('Location')))
        ->toContain('redirect_uri=https://auth.cryptere.com/auth/google/callback');
});
