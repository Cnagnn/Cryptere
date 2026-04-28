<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('discussions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('discussable_type', 50);
            $table->unsignedBigInteger('discussable_id');
            $table->string('title');
            $table->text('body');
            $table->boolean('is_pinned')->default(false);
            $table->unsignedInteger('upvote_count')->default(0);
            $table->unsignedInteger('reply_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['discussable_type', 'discussable_id'], 'discussions_discussable_index');
            $table->index('user_id', 'discussions_user_id_index');
            $table->index('is_pinned', 'discussions_is_pinned_index');
        });

        Schema::create('discussion_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discussion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->unsignedInteger('upvote_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('discussion_id', 'discussion_replies_discussion_id_index');
        });

        Schema::create('discussion_upvotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('upvotable_type', 50);
            $table->unsignedBigInteger('upvotable_id');
            $table->timestamp('created_at')->nullable();

            $table->unique(['user_id', 'upvotable_type', 'upvotable_id'], 'discussion_upvotes_user_upvotable_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discussion_upvotes');
        Schema::dropIfExists('discussion_replies');
        Schema::dropIfExists('discussions');
    }
};
