# Course UX/UI Improvements Design Specification

**Date:** 2026-05-06  
**Project:** Crypter - Laravel Learning Platform  
**Scope:** Comprehensive UX/UI improvements for course catalog, detail, video, quiz, and assessment flows

---

## Executive Summary

This specification addresses 11 critical UX/UI issues identified in the course learning experience. The improvements focus on data persistence, error recovery, accessibility, and user feedback mechanisms. Implementation follows an incremental layer-by-layer approach across 4 phases.

**Estimated Timeline:** 9-13 hours  
**Risk Level:** Low (incremental deployment)  
**Impact:** High (affects all course interactions)

---

## Problem Statement

Current course experience has several friction points:
1. No draft saving - users lose progress on network errors
2. Video restarts from beginning every time
3. Poor error recovery - users get stuck on failures
4. Minimal accessibility support
5. Confusing XP multiplier system
6. No time warnings for assessments
7. Easy accidental progress reset
8. Quiz options shuffle inconsistently

---

## Design Approach

**Strategy:** Incremental Layer-by-Layer Implementation

### Phase 1: Data Persistence Layer
Build foundation for reliable data storage and recovery.

### Phase 2: UI Enhancements  
Add visual feedback, keyboard navigation, and confirmations.

### Phase 3: Error Recovery
Implement retry mechanisms and fallback UI.

### Phase 4: Polish
Add advanced features like polling, smart timers, and accessibility.

---

## Technical Design

### 1. Data Persistence Layer

#### 1.1 Custom Hooks

**useLocalStorage Hook**

Location: resources/js/hooks/use-local-storage.ts

Purpose: Sync React state with localStorage, handle JSON serialization, and sync across tabs.

Interface:
```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void]
```

Features:
- Automatic JSON parse/stringify
- Storage event listener for cross-tab sync
- Error handling for quota exceeded
- SSR-safe (checks window availability)

**useDebouncedValue Hook**

Location: resources/js/hooks/use-debounced-value.ts

Purpose: Debounce rapid value changes to reduce API calls.

Interface:
```typescript
function useDebouncedValue<T>(value: T, delay: number): T
```

**useVideoProgress Hook**

Location: resources/js/hooks/use-video-progress.ts

Purpose: Track and restore video playback position.

Interface:
```typescript
function useVideoProgress(taskId: number): {
  position: number;
  savePosition: (seconds: number) => void;
  clearPosition: () => void;
}
```

Features:
- Auto-save every 5 seconds during playback
- Clear on task completion
- Restore on component mount

#### 1.2 Storage Keys Convention

Location: resources/js/lib/storage-keys.ts

```typescript
export const STORAGE_KEYS = {
  QUIZ_DRAFT: (taskId: number) => 'quiz-draft-\',
  ASSESSMENT_DRAFT: (assessmentId: number) => 'assessment-draft-\',
  VIDEO_POSITION: (taskId: number) => 'video-position-\',
  QUIZ_SHUFFLE_SEED: (taskId: number) => 'quiz-shuffle-\',
  HEARTBEAT_QUEUE: 'heartbeat-queue',
} as const;
```

#### 1.3 Data Structures

**QuizDraft:**
```typescript
type QuizDraft = {
  taskId: number;
  answers: number[]; // -1 = unanswered, 0-3 = option index
  timestamp: number;
  version: 1;
};
```

**AssessmentDraft:**
```typescript
type AssessmentDraft = {
  assessmentId: number;
  submissionId: number;
  answers: Record<number, {
    answer_text?: string;
    selected_option?: string;
  }>;
  timestamp: number;
  version: 1;
};
```

**VideoProgress:**
```typescript
type VideoProgress = {
  taskId: number;
  position: number; // seconds
  duration: number;
  timestamp: number;
};
```

**HeartbeatQueue:**
```typescript
type QueuedHeartbeat = {
  id: string;
  taskId: number;
  type: 'video' | 'reading';
  seconds: number;
  timestamp: number;
};
```

---

### 2. UI Enhancements

#### 2.1 Keyboard Navigation

**Quiz Options:**
- Arrow Up/Down: Navigate between options
- Number keys (1-4): Select option directly
- Enter: Confirm selection and move to next question
- Escape: Clear current selection
- Tab: Natural focus flow

**Assessment:**
- Ctrl/Cmd + S: Manual save trigger
- Ctrl/Cmd + Enter: Submit (with confirmation)
- Tab: Focus management between questions
- Escape: Close modals

Implementation:
- Create useKeyboardNavigation hook
- Add role='radio' and aria-checked to quiz options
- Implement focus trap in modals
- Add visible focus indicators (ring-2 ring-primary)

#### 2.2 Visual Feedback Components

**XP Multiplier Tooltip:**

Location: Inline in quiz result display

```tsx
<Badge variant='secondary'>
  Attempt {attemptNumber}
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className='ml-1 size-3' />
    </TooltipTrigger>
    <TooltipContent>
      <div className='space-y-1 text-xs'>
        <p>XP Rewards:</p>
        <p>• 1st attempt: 100%</p>
        <p>• 2nd attempt: 50%</p>
        <p>• 3rd attempt: 25%</p>
        <p>• 4th+ attempt: 10%</p>
      </div>
    </TooltipContent>
  </Tooltip>
</Badge>
```

**Time Warning System:**

Warnings at:
- 10 minutes: Yellow toast (dismissible)
- 5 minutes: Orange toast with optional sound
- 1 minute: Persistent red banner with countdown
- 0 seconds: Auto-submit with confirmation dialog

**Progress Indicators:**

Enhanced with smooth transitions and gradient fills:
```tsx
<Progress 
  value={progress} 
  className='transition-all duration-500'
  indicatorClassName='bg-gradient-to-r from-primary to-primary/80'
/>
```

#### 2.3 Confirmation Dialogs

**Reset Progress Confirmation:**

Location: courses/index.tsx - EnrolledCardFooter component

Requires typing 'RESET' to confirm:
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Reset Progress?</AlertDialogTitle>
      <AlertDialogDescription>
        You will lose {progressPercentage}% progress.
        Type 'RESET' to confirm.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <Input 
      placeholder='Type RESET'
      value={confirmText}
      onChange={(e) => setConfirmText(e.target.value)}
    />
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        disabled={confirmText !== 'RESET'}
      >
        Reset Progress
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 2.4 Quiz Review Screen

Location: courses/show.tsx - New QuizReviewScreen component

Shows all questions with answers before final submission:
- Question number and status (answered/unanswered)
- Question text
- Selected answer preview
- Edit button to return to specific question
- Summary of unanswered questions
- Final submit button (disabled if incomplete)

---

### 3. Error Recovery & Resilience

#### 3.1 Retry Mechanism Hook

**useRetry Hook:**

Location: resources/js/hooks/use-retry.ts

```typescript
function useRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;        // default: 3
    initialDelay?: number;      // default: 1000ms
    maxDelay?: number;          // default: 10000ms
    backoffMultiplier?: number; // default: 2
    onRetry?: (attempt: number, error: Error) => void;
  }
): {
  execute: () => Promise<T>;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}
```

Exponential backoff formula:
```
delay = min(initialDelay * (backoffMultiplier ^ attempt), maxDelay)
```

#### 3.2 Heartbeat Resilience

Enhanced heartbeat system with queue and retry:

1. **Failed Heartbeat Queue:**
   - Store failed heartbeats in localStorage
   - Aggregate by taskId and type
   - Retry every 30 seconds when online

2. **User Feedback:**
   - First failure: Warning toast (not error)
   - Show 'syncing' indicator
   - Success toast when queue clears

3. **Batch Retry:**
   - Aggregate multiple failed heartbeats
   - Send as single request with total seconds
   - Remove from queue on success

#### 3.3 Fallback UI Components

**Video Load Error:**

```tsx
{videoError && (
  <Empty className='h-[400px]'>
    <EmptyHeader>
      <AlertCircle className='size-12 text-destructive' />
    </EmptyHeader>
    <EmptyTitle>Video Failed to Load</EmptyTitle>
    <EmptyDescription>
      {videoError.message}
    </EmptyDescription>
    <div className='flex gap-2'>
      <Button onClick={retryVideo} variant='outline'>
        <RotateCcw className='mr-2 size-4' />
        Retry
      </Button>
      <Button onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
    </div>
  </Empty>
)}
```

**PDF Load Error:**

Similar pattern with retry button and error message.

**Quiz Submission Error:**

Shows error with local save confirmation and retry button.

#### 3.4 Network Status Indicator

Global component in app layout:
- Detects online/offline events
- Shows persistent alert when offline
- Toast notification on reconnection
- Indicates local data will sync

#### 3.5 Error Boundary

Location: resources/js/components/error-boundary.tsx

Catches React errors and shows recovery UI:
- Error message
- Reload page button
- Try again button (resets error state)
- Preserves user data in localStorage

---

### 4. Polish & Advanced Features

#### 4.1 Video Processing Status Polling

**useVideoProcessingStatus Hook:**

Location: resources/js/hooks/use-video-processing-status.ts

Polls /admin/courses/tasks/{taskId}/video-status every 5 seconds when status is 'processing' or 'pending'.

Stops polling when:
- Status becomes 'ready' or 'failed'
- Component unmounts

Shows progress bar with percentage.

#### 4.2 Assessment Timer with Visibility API

**useAssessmentTimer Hook:**

Location: resources/js/hooks/use-assessment-timer.ts

Features:
- Pauses timer when tab is hidden
- Resumes when tab becomes visible
- Shows toast notifications on pause/resume
- Triggers warnings at 10min, 5min, 1min
- Auto-submits at 0 seconds

**TimerWarningBanner Component:**

Persistent banner at top of screen when < 1 minute remaining.

#### 4.3 Quiz Shuffle Stability

Uses seedrandom library for deterministic shuffle:

```typescript
import seedrandom from 'seedrandom';

function shuffleWithSeed<T>(array: T[], seed: string): T[]
```

Seed format: '{taskId}-{timestamp}'
Stored in localStorage to maintain consistency across page reloads.

#### 4.4 Assessment Auto-save Optimization

**useAssessmentAutosave Hook:**

Location: resources/js/hooks/use-assessment-autosave.ts

Features:
- 2-second debounce on answer changes
- Batch saves multiple answers
- Local backup on every save
- Manual save trigger (Ctrl+S)
- Save status indicator

Shows:
- 'Saving X answers...' when in progress
- 'Saved X minutes ago' when complete
- Pending count

#### 4.5 Accessibility Enhancements

**ARIA Live Regions:**

Global AccessibilityAnnouncer component:
- Listens for custom 'announce' events
- Announces to screen readers
- Used for: lesson unlocks, quiz results, errors

**Focus Management:**
- Focus first error field on validation fail
- Return focus after modal close
- Skip links for keyboard navigation
- Proper heading hierarchy

---

## Implementation Phases

### Phase 1: Data Persistence (2-3 hours)

Files to create:
- resources/js/hooks/use-local-storage.ts
- resources/js/hooks/use-debounced-value.ts
- resources/js/hooks/use-video-progress.ts
- resources/js/lib/storage-keys.ts

Tasks:
1. Implement useLocalStorage with cross-tab sync
2. Implement useDebouncedValue
3. Implement useVideoProgress
4. Define storage keys and data structures
5. Add localStorage backup to quiz/assessment

### Phase 2: UI Enhancements (3-4 hours)

Files to modify:
- resources/js/pages/courses/show.tsx
- resources/js/pages/courses/index.tsx

Files to create:
- resources/js/hooks/use-keyboard-navigation.ts
- resources/js/components/quiz-review-screen.tsx

Tasks:
1. Add keyboard navigation to quiz options
2. Add XP multiplier tooltips
3. Implement time warning system
4. Add reset confirmation dialog
5. Create quiz review screen
6. Add progress bar enhancements

### Phase 3: Error Recovery (2-3 hours)

Files to create:
- resources/js/hooks/use-retry.ts
- resources/js/components/error-boundary.tsx
- resources/js/components/network-status-indicator.tsx

Files to modify:
- resources/js/pages/courses/show.tsx (add fallback UI)

Tasks:
1. Implement useRetry hook
2. Enhance heartbeat with queue and retry
3. Add fallback UI for video/PDF/quiz errors
4. Create network status indicator
5. Implement error boundary

### Phase 4: Polish (2-3 hours)

Files to create:
- resources/js/hooks/use-video-processing-status.ts
- resources/js/hooks/use-assessment-timer.ts
- resources/js/hooks/use-assessment-autosave.ts
- resources/js/lib/shuffle.ts
- resources/js/components/accessibility-announcer.tsx

Tasks:
1. Implement video processing polling
2. Create smart assessment timer
3. Add stable quiz shuffle
4. Optimize assessment auto-save
5. Add accessibility enhancements

---

## Testing Strategy

### Unit Tests
- Test hooks in isolation
- Test shuffle determinism
- Test retry exponential backoff
- Test debounce timing

### Integration Tests
- Test localStorage sync across tabs
- Test heartbeat queue and retry
- Test auto-save with network failures
- Test timer pause/resume

### E2E Tests (Playwright)
- Complete quiz with draft save
- Video resume from saved position
- Assessment with time warnings
- Error recovery flows
- Keyboard navigation

### Accessibility Tests
- Screen reader announcements
- Keyboard-only navigation
- Focus management
- ARIA attributes

---

## Rollback Plan

Each phase is independently deployable:

**Phase 1 Rollback:**
- Remove localStorage hooks
- Revert to original state management

**Phase 2 Rollback:**
- Remove keyboard handlers
- Hide new UI components
- Keep data persistence (safe)

**Phase 3 Rollback:**
- Remove retry logic
- Revert to original error handling
- Keep persistence and UI (safe)

**Phase 4 Rollback:**
- Disable polling
- Remove timer enhancements
- Keep all previous phases (safe)

---

## Success Metrics

### Quantitative
- Reduce quiz abandonment rate by 30%
- Reduce support tickets for 'lost progress' by 80%
- Increase assessment completion rate by 25%
- Reduce video restart rate by 60%

### Qualitative
- User feedback on draft saving
- Accessibility audit score improvement
- Error recovery success rate
- Time-to-recovery on network failures

---

## Dependencies

### NPM Packages
- seedrandom: ^3.0.5 (for stable shuffle)
- date-fns: ^3.0.0 (for time formatting)

### Existing
- Sonner (toast notifications)
- Radix UI (dialog, tooltip components)
- Lucide React (icons)
- Inertia.js (routing)

---

## Security Considerations

1. **localStorage Limits:**
   - Implement quota exceeded handling
   - Clear old drafts (> 7 days)
   - Warn user when approaching limit

2. **Data Validation:**
   - Validate localStorage data structure
   - Handle corrupted data gracefully
   - Version data structures for migration

3. **CSRF Protection:**
   - All API calls include CSRF token
   - Validate token on server

4. **XSS Prevention:**
   - Sanitize user input in drafts
   - Use React's built-in escaping

---

## Future Enhancements (Out of Scope)

1. Server-side draft storage (in addition to local)
2. Collaborative learning (see other users' progress)
3. Offline mode with service worker
4. Mobile app with native storage
5. Analytics dashboard for instructors

---

## Conclusion

This design provides a comprehensive solution to all identified UX/UI issues. The incremental approach allows for safe deployment and easy rollback. Each phase builds on the previous, creating a robust and user-friendly learning experience.

**Next Steps:**
1. Review and approve this specification
2. Create detailed implementation plan
3. Begin Phase 1 development
4. Deploy and test each phase independently

