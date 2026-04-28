<?php

namespace App\Http\Controllers;

use App\Models\Discussion;
use App\Models\DiscussionReply;
use App\Models\DiscussionUpvote;
use App\Services\BadgeService;
use App\Services\XpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DiscussionController extends Controller
{
    public function __construct(
        private readonly XpService $xpService,
        private readonly BadgeService $badgeService,
    ) {}

    /**
     * List discussions for a lesson or challenge.
     * GET /discussions?type=lesson&id=5
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(['lesson', 'challenge'])],
            'id' => ['required', 'integer', 'min:1'],
        ]);

        $discussions = Discussion::query()
            ->where('discussable_type', $validated['type'])
            ->where('discussable_id', $validated['id'])
            ->with(['user:id,name,username,avatar_path'])
            ->withCount('replies')
            ->orderByDesc('is_pinned')
            ->orderByDesc('upvote_count')
            ->orderByDesc('created_at')
            ->paginate(15);

        // Append avatar accessor for each user
        $discussions->getCollection()->transform(function (Discussion $discussion) {
            if ($discussion->user) {
                $discussion->user->append('avatar');
            }

            return $discussion;
        });

        return response()->json($discussions);
    }

    /**
     * Create a new discussion thread.
     * POST /discussions
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(['lesson', 'challenge'])],
            'id' => ['required', 'integer', 'min:1'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:10000'],
        ]);

        $user = $request->user();

        $discussion = $user->discussions()->create([
            'discussable_type' => $validated['type'],
            'discussable_id' => $validated['id'],
            'title' => strip_tags($validated['title']),
            'body' => strip_tags($validated['body']),
        ]);

        $xpAwarded = 0;

        // Award XP for first discussion post ever
        if ($user->discussions()->count() === 1) {
            $xpAwarded = $this->xpService->awardXp(
                $user,
                (int) config('rewards.discussion_first_post_xp', 5),
            );

            // Check for community-starter badge
            $this->badgeService->checkAndAward($user, 'first_discussion');
        }

        $discussion->load('user:id,name,username,avatar_path');
        $discussion->user?->append('avatar');

        return response()->json([
            'success' => true,
            'discussion' => $discussion,
            'xp_awarded' => $xpAwarded,
        ], 201);
    }

    /**
     * Get a single discussion with its replies.
     * GET /discussions/{discussion}
     */
    public function show(Discussion $discussion): JsonResponse
    {
        $discussion->load([
            'user:id,name,username,avatar_path',
            'replies' => fn ($query) => $query->orderBy('created_at'),
            'replies.user:id,name,username,avatar_path',
        ]);

        $discussion->user?->append('avatar');
        $discussion->replies->each(function (DiscussionReply $reply): void {
            $reply->user?->append('avatar');
        });

        return response()->json($discussion);
    }

    /**
     * Add a reply to a discussion.
     * POST /discussions/{discussion}/replies
     */
    public function reply(Request $request, Discussion $discussion): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
        ]);

        $user = $request->user();

        $reply = DB::transaction(function () use ($discussion, $user, $validated) {
            $reply = $discussion->replies()->create([
                'user_id' => $user->id,
                'body' => strip_tags($validated['body']),
            ]);

            $discussion->increment('reply_count');

            return $reply;
        });

        $xpAwarded = 0;

        // Award XP for first reply ever
        if ($user->discussionReplies()->count() === 1) {
            $xpAwarded = $this->xpService->awardXp(
                $user,
                (int) config('rewards.discussion_first_reply_xp', 3),
            );
        }

        $reply->load('user:id,name,username,avatar_path');
        $reply->user?->append('avatar');

        return response()->json([
            'success' => true,
            'reply' => $reply,
            'xp_awarded' => $xpAwarded,
        ], 201);
    }

    /**
     * Toggle upvote on a discussion or reply.
     * POST /discussions/upvote
     */
    public function upvote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(['discussion', 'reply'])],
            'id' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $type = $validated['type'];
        $id = $validated['id'];

        $existing = DiscussionUpvote::query()
            ->where('user_id', $user->id)
            ->where('upvotable_type', $type)
            ->where('upvotable_id', $id)
            ->first();

        if ($existing) {
            // Remove upvote
            $existing->delete();

            if ($type === 'discussion') {
                Discussion::where('id', $id)->decrement('upvote_count');
            } else {
                DiscussionReply::where('id', $id)->decrement('upvote_count');
            }

            return response()->json([
                'success' => true,
                'upvoted' => false,
            ]);
        }

        // Add upvote
        DiscussionUpvote::create([
            'user_id' => $user->id,
            'upvotable_type' => $type,
            'upvotable_id' => $id,
        ]);

        if ($type === 'discussion') {
            Discussion::where('id', $id)->increment('upvote_count');
        } else {
            DiscussionReply::where('id', $id)->increment('upvote_count');
        }

        return response()->json([
            'success' => true,
            'upvoted' => true,
        ]);
    }

    /**
     * Pin/unpin a discussion (admin only).
     * PATCH /discussions/{discussion}/pin
     */
    public function togglePin(Discussion $discussion): JsonResponse
    {
        $discussion->update(['is_pinned' => ! $discussion->is_pinned]);

        return response()->json([
            'success' => true,
            'is_pinned' => $discussion->is_pinned,
        ]);
    }

    /**
     * Delete a discussion (admin or author).
     * DELETE /discussions/{discussion}
     */
    public function destroy(Request $request, Discussion $discussion): JsonResponse
    {
        $user = $request->user();

        if ($discussion->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403, 'You are not authorized to delete this discussion.');
        }

        $discussion->delete();

        return response()->json(['success' => true]);
    }
}
