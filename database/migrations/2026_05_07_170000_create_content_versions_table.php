<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates content_versions table for tracking changes to courses, lessons, tasks, and assessments.
     * Uses polymorphic relationship to version any versionable model.
     */
    public function up(): void
    {
        Schema::create('content_versions', function (Blueprint $table) {
            $table->id();

            // Polymorphic relationship to versionable models
            $table->string('versionable_type');
            $table->unsignedBigInteger('versionable_id');

            // Version tracking
            $table->unsignedInteger('version_number');

            // Content snapshot - full state at this version
            $table->json('content_snapshot');

            // Change tracking - what fields changed from previous version
            $table->json('changed_fields')->nullable();

            // Optional human-readable summary
            $table->text('change_summary')->nullable();

            // Audit trail
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('restored_at')->nullable()->comment('When this version was restored');

            $table->timestamps();

            // Indexes for common queries
            $table->index(['versionable_type', 'versionable_id'], 'cv_type_id_idx');
            $table->index(['versionable_type', 'versionable_id', 'version_number'], 'cv_type_id_ver_idx');

            // Ensure unique version numbers per versionable entity
            $table->unique(['versionable_type', 'versionable_id', 'version_number'], 'cv_type_id_ver_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_versions');
    }
};
