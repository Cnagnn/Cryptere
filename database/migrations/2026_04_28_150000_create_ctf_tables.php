<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ctf_events', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('title');
            $table->text('description');
            $table->text('rules')->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_published')->default(false);
            $table->unsignedInteger('max_participants')->nullable();
            $table->unsignedInteger('bonus_xp')->default(100);
            $table->timestamps();

            $table->index('starts_at', 'ctf_events_starts_at_index');
            $table->index('ends_at', 'ctf_events_ends_at_index');
            $table->index('is_published', 'ctf_events_is_published_index');
        });

        Schema::create('ctf_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ctf_event_id')->constrained('ctf_events')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->text('hint')->nullable();
            $table->string('flag_value');
            $table->unsignedInteger('points')->default(100);
            $table->string('difficulty', 20)->default('medium');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('category', 50)->nullable();
            $table->timestamps();

            $table->index(['ctf_event_id', 'sort_order'], 'ctf_flags_event_sort_index');
        });

        Schema::create('ctf_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ctf_flag_id')->constrained('ctf_flags')->cascadeOnDelete();
            $table->string('submitted_flag');
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('points_awarded')->default(0);
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->index(['user_id', 'ctf_flag_id'], 'ctf_submissions_user_flag_index');
            $table->index('is_correct', 'ctf_submissions_is_correct_index');
        });

        Schema::create('ctf_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ctf_event_id')->constrained('ctf_events')->cascadeOnDelete();
            $table->timestamp('registered_at');
            $table->unsignedInteger('total_points')->default(0);
            $table->unsignedInteger('flags_captured')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'ctf_event_id'], 'ctf_registrations_user_event_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ctf_registrations');
        Schema::dropIfExists('ctf_submissions');
        Schema::dropIfExists('ctf_flags');
        Schema::dropIfExists('ctf_events');
    }
};
