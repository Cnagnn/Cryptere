# Crypter API Reference

> **Version:** 1.0.0  
> **Base URL:** `https://your-domain.com`  
> **Interactive Docs:** Available at `/docs/api` (powered by [Scramble](https://scramble.dedoc.co/))

## Overview

Crypter is an e-learning platform built with Laravel + Inertia.js. Most routes return Inertia (HTML) responses for the SPA frontend. This document covers the **JSON-returning endpoints** used for AJAX interactions.

### Authentication

All endpoints (except `/health` and `/api/users/check-username`) require:
- **Session-based authentication** (Laravel Fortify)
- **Email verification** (`verified` middleware)
- CSRF token via `X-XSRF-TOKEN` header or `_token` field

### Common Error Responses

| Status | Description |
|--------|-------------|
| `401` | Unauthenticated — session expired or not logged in |
| `403` | Forbidden — user lacks permission (e.g., not enrolled, not authorized) |
| `404` | Not Found — resource does not exist |
| `419` | CSRF token mismatch |
| `422` | Validation error — see `errors` object in response |
| `429` | Too Many Requests — rate limit exceeded |

Validation error response format:
```json
{
  "message": "The answer field is required.",
  "errors": {
    "answer": ["The answer field is required."]
  }
}
```

---

## Endpoints

### Health Check

#### `GET /health`

Application health check endpoint. Returns status of database, cache, and storage subsystems. **No authentication required.**

**Rate Limit:** None

**Response `200 OK`** (all systems healthy):
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok", "latency_ms": 1.23 },
    "cache": { "status": "ok" },
    "storage": { "status": "ok" }
  },
  "timestamp": "2026-04-28T08:00:00+07:00"
}
```

**Response `503 Service Unavailable`** (degraded):
```json
{
  "status": "degraded",
  "checks": {
    "database": { "status": "error", "message": "Database connection failed" },
    "cache": { "status": "ok" },
    "storage": { "status": "ok" }
  },
  "timestamp": "2026-04-28T08:00:00+07:00"
}
```

---

### Username Availability

#### `GET /api/users/check-username`

Check if a username is available for registration. **No authentication required.**

**Rate Limit:** `10 requests/minute` (per IP — prevents enumeration attacks)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Username to check |

**Response `200 OK`:**
```json
{
  "available": true
}
```

---

### Challenge Endpoints

#### `POST /challenges/{challenge:slug}/quick-submit`

Submit an answer for speed-round challenge mode. Returns immediate JSON feedback with scoring.

**Auth:** Required (session + verified)  
**Rate Limit:** `20 requests/minute` (per user)  
**Policy:** `ChallengePolicy@submit`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `answer` | string | Yes | User's answer (max 255 chars) |
| `elapsed_ms` | integer | No | Time taken in milliseconds (0–120000) |

```json
{
  "answer": "binary search",
  "elapsed_ms": 4500
}
```

**Response `200 OK`:**
```json
{
  "challengeId": 42,
  "isCorrect": true,
  "alreadySolved": false,
  "awardedPoints": 15,
  "elapsedMs": 4500,
  "timeLimitSeconds": 20,
  "totalPoints": 1250
}
```

**Response `422 Unprocessable Entity`** (challenge unavailable):
```json
{
  "message": "This challenge is not currently available."
}
```

---

#### `POST /challenges/{challenge:slug}/quiz-submit`

Submit a single quiz question answer during a quiz session. Supports streak bonuses calculated server-side.

**Auth:** Required (session + verified)  
**Rate Limit:** `60 requests/minute` (per user — supports rapid-fire quiz mode)  
**Policy:** `ChallengePolicy@submit`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | Yes | UUID identifying the quiz session (max 36 chars) |
| `challenge_question_id` | integer | Yes | ID of the question being answered |
| `answer` | string | Yes | User's answer (max 500 chars) |
| `elapsed_ms` | integer | Yes | Time taken in milliseconds (0–120000) |
| `question_index` | integer | Yes | Zero-based index of the question in the session |

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "challenge_question_id": 15,
  "answer": "O(n log n)",
  "elapsed_ms": 3200,
  "question_index": 2
}
```

**Response `200 OK`:**
```json
{
  "isCorrect": true,
  "correctAnswer": "O(n log n)",
  "explanation": "Merge sort has a time complexity of O(n log n) in all cases.",
  "questionScore": 8,
  "streakBonus": 2,
  "totalQuestionPoints": 10
}
```

**Response `422 Unprocessable Entity`** (already completed):
```json
{
  "message": "You have already completed this challenge."
}
```

---

#### `POST /challenges/{challenge:slug}/session-summary`

Finalize a quiz session. Calculates totals, awards points and XP (first session only), and returns comprehensive session results.

**Auth:** Required (session + verified)  
**Rate Limit:** `5 requests/minute` (per user)  
**Policy:** `ChallengePolicy@submit`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | Yes | UUID of the session to finalize (max 36 chars) |

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response `200 OK`:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "totalScore": 45,
  "totalStreakBonus": 12,
  "totalPoints": 57,
  "correctCount": 8,
  "totalQuestions": 10,
  "averageElapsedMs": 3500,
  "bestStreak": 5,
  "awardedPoints": 62,
  "awardedXp": 20,
  "isPerfectScore": false,
  "isFirstSession": true,
  "userTotalPoints": 1312
}
```

**Response `404 Not Found`** (no submissions):
```json
{
  "message": "No submissions found for this session."
}
```

**Notes:**
- `awardedPoints` includes level bonus multiplier (applied via `XpService::applyLevelBonus`)
- Perfect score bonus: +50 XP, +150 points (configurable via `rewards.perfect_score_xp` / `rewards.perfect_score_points`)
- Points and XP are only awarded on the **first completed session** per challenge

---

### Course Quiz Submission

#### `POST /courses/{course:slug}/lessons/{lesson}/quiz`

Submit answers for a lesson quiz task. Validates answers server-side and returns per-question results.

**Auth:** Required (session + verified + enrolled in course)  
**Rate Limit:** `60 requests/minute` (per user)  
**Policy:** `CoursePolicy@view`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | integer | Yes | ID of the quiz task |
| `answers` | array | Yes | Array of selected option indices (0–3) |

```json
{
  "task_id": 7,
  "answers": [2, 0, 1, 3, 2]
}
```

**Response `200 OK`:**
```json
{
  "score": 4,
  "total": 5,
  "results": [
    {
      "correct": true,
      "explanation": "Arrays provide O(1) random access.",
      "remedialLessonSlug": null
    },
    {
      "correct": false,
      "explanation": "A stack follows LIFO (Last In, First Out).",
      "remedialLessonSlug": "data-structures-basics"
    },
    {
      "correct": true,
      "explanation": null,
      "remedialLessonSlug": null
    },
    {
      "correct": true,
      "explanation": "Binary search requires a sorted array.",
      "remedialLessonSlug": null
    },
    {
      "correct": true,
      "explanation": null,
      "remedialLessonSlug": null
    }
  ],
  "xp_earned": 15,
  "points_earned": 10
}
```

**Response `403 Forbidden`** (not enrolled):
```json
{
  "error": "You must be enrolled in this course to take a quiz."
}
```

**Notes:**
- XP is only awarded on the **first perfect score** (all answers correct)
- Subsequent submissions update the record but do not re-award XP
- `remedialLessonSlug` is provided for incorrect answers when a related topic exists

---

### Daily Rewards

#### `GET /daily-rewards`

Get the user's daily reward status, calendar data, and reward tiers.

**Auth:** Required (session + verified)  
**Rate Limit:** None (standard web middleware)

**Response `200 OK`:**
```json
{
  "claimed_today": false,
  "day_number": 3,
  "today_reward": {
    "xp": 15,
    "points": 30
  },
  "tiers": {
    "1": { "xp": 10, "points": 20 },
    "2": { "xp": 10, "points": 20 },
    "3": { "xp": 15, "points": 30 },
    "4": { "xp": 15, "points": 30 },
    "5": { "xp": 20, "points": 40 },
    "6": { "xp": 20, "points": 40 },
    "7": { "xp": 50, "points": 100 }
  },
  "calendar": [
    {
      "date": "2026-04-26",
      "day_number": 1,
      "xp": 10,
      "points": 20
    },
    {
      "date": "2026-04-27",
      "day_number": 2,
      "xp": 10,
      "points": 20
    }
  ],
  "current_streak": 5
}
```

---

#### `POST /daily-rewards/claim`

Claim today's daily reward. Awards XP and points based on the current day in the 7-day cycle.

**Auth:** Required (session + verified)  
**Rate Limit:** `2 requests/minute` (per user — prevents double-click spam)

**Request Body:** None required

**Response `200 OK`:**
```json
{
  "success": true,
  "day_number": 3,
  "xp_earned": 15,
  "points_earned": 30,
  "total_xp": 450,
  "total_points": 1280
}
```

**Response `409 Conflict`** (already claimed):
```json
{
  "success": false,
  "message": "You have already claimed today's reward!"
}
```

**Notes:**
- The 7-day cycle resets if the user misses a day (streak broken)
- Day 7 has the highest reward (50 XP, 100 points by default)
- After day 7, the cycle restarts at day 1

---

## Rate Limits Summary

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `GET /api/users/check-username` | 10/min | Per IP |
| `POST /challenges/*/quick-submit` | 20/min | Per user |
| `POST /challenges/*/quiz-submit` | 60/min | Per user |
| `POST /challenges/*/session-summary` | 5/min | Per user |
| `POST /courses/*/lessons/*/quiz` | 60/min | Per user |
| `POST /daily-rewards/claim` | 2/min | Per user |
| `POST /courses/*/enroll` | 10/min | Per user |
| `POST /courses/*/lessons/*/complete` | 30/min | Per user |
| General API | 60/min | Per user/IP |

When rate limited, the API returns `429 Too Many Requests` with a `Retry-After` header.

---

## WebSocket Events

### `LeaderboardUpdated`

Broadcast when a user earns XP, updating the real-time leaderboard. Controlled by the `RealtimeLeaderboard` feature flag.

**Channel:** Private (via Laravel Reverb)  
**Event Data:**
```json
{
  "timeframe": "weekly",
  "top3": [
    {
      "id": 1,
      "name": "Alice",
      "username": "alice",
      "points": 2500
    },
    {
      "id": 2,
      "name": "Bob",
      "username": "bob",
      "points": 2100
    },
    {
      "id": 3,
      "name": "Charlie",
      "username": "charlie",
      "points": 1800
    }
  ]
}
```

---

## Feature Flags

The application uses [Laravel Pennant](https://laravel.com/docs/pennant) for feature flags. Active flags are shared with the frontend via Inertia shared data under the `features` key.

| Flag | Key | Default | Description |
|------|-----|---------|-------------|
| `RealtimeLeaderboard` | `features.realtimeLeaderboard` | `true` | Controls WebSocket leaderboard broadcasts |
| `IndonesianLocale` | `features.indonesianLocale` | `false` | Controls Indonesian language support (R12) |

Frontend access (React):
```tsx
const { features } = usePage().props;

if (features.realtimeLeaderboard) {
  // Subscribe to WebSocket leaderboard updates
}
```
