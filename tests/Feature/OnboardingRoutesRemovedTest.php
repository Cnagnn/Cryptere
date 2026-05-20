<?php

test('onboarding endpoints are not registered', function () {
    $this->get('/onboarding')->assertNotFound();
    $this->post('/onboarding/complete')->assertNotFound();
    $this->post('/onboarding/skip')->assertNotFound();
});
