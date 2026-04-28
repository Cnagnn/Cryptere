<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    public function log(User $admin, string $action, Model $target, array $payload = []): void
    {
        AuditLog::create([
            'user_id' => $admin->id,
            'action' => $action,
            'target_type' => class_basename($target),
            'target_id' => $target->getKey(),
            'payload' => $payload ?: null,
        ]);
    }
}
