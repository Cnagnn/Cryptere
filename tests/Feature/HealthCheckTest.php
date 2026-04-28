<?php

test('health check returns healthy status', function () {
    $response = $this->getJson('/health');

    $response->assertOk()
        ->assertJsonStructure([
            'status',
            'checks' => [
                'database' => ['status'],
                'cache' => ['status'],
                'storage' => ['status'],
            ],
            'timestamp',
        ])
        ->assertJsonPath('status', 'healthy')
        ->assertJsonPath('checks.database.status', 'ok')
        ->assertJsonPath('checks.cache.status', 'ok')
        ->assertJsonPath('checks.storage.status', 'ok');
});

test('health check includes database latency', function () {
    $response = $this->getJson('/health');

    $response->assertOk();

    $data = $response->json();
    expect($data['checks']['database'])->toHaveKey('latency_ms');
    expect($data['checks']['database']['latency_ms'])->toBeFloat()->toBeGreaterThan(0);
});

test('health check returns valid timestamp', function () {
    $response = $this->getJson('/health');

    $response->assertOk();

    $data = $response->json();
    expect($data['timestamp'])->toBeString();
    expect(strtotime($data['timestamp']))->not->toBeFalse();
});

test('health check is accessible without authentication', function () {
    $response = $this->getJson('/health');

    $response->assertOk();
});
