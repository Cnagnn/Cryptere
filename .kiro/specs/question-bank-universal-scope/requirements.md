# Requirements Document

## Introduction

The admin Question Bank module is currently mis-scoped: it stores `bloom_level` (C1–C6) directly on each `question_bank` row, even though Bloom level is an assessment-specific cognitive classification. This couples the bank to one consumer (Assessments) and prevents the same questions from being reused neutrally by other consumers such as course Quizzes.

This feature repositions the Question Bank as a **universal, source-agnostic CRUD repository for reusable questions**. The bank stores only universal question content (title, category, type, text, options, correct answer, explanation, rubric, points, active flag, analytics). Bloom level is removed from the bank entirely and is supplied by the consumer at the moment a question is attached. For Assessments, the consumer's own `bloom_level` (already present on the `assessments` table) is snapshotted onto `assessment_questions.bloom_level` at attach time.

The intent (in the user's words): *"Saya ingin memperjelas fungsi halaman Question Bank ini adalah sebagai tempat CRUD question, jadi hilangkan Bloom Level yang berhubungan dengan assessment dan quiz. Question Bank bersifat universal — question bisa digunakan di mana saja (quiz course maupun assessment) saat dipanggil."*

**Scope:** Remove `bloom_level` from the `question_bank` table, the `QuestionBank` model, the `QuestionBankController` validation/filter/import paths, the admin Question Bank Inertia page (dialog field, table column, toolbar filter), the `QuestionBank` TypeScript type, the model factory, and tests that seed it. Drop the column and its composite indexes via migration.

**Out of scope:** The `assessments.bloom_level` column, the `assessment_questions.bloom_level` column, and the assessment authoring UI's Bloom selection are NOT modified. The assessment-attach flow continues to snapshot the assessment's own Bloom level onto each attached question.

## Glossary

- **Question_Bank**: The universal CRUD repository of reusable questions, exposed at `/admin/question-bank`. Stored in the `question_bank` database table.
- **Question_Bank_Entry**: A single row in the `question_bank` table representing one reusable question.
- **Assessment**: A graded evaluation owned by the assessments module. Each Assessment has its own `bloom_level` column on the `assessments` table.
- **Assessment_Question**: A question that has been attached to a specific Assessment, stored in the `assessment_questions` table. Has its own `bloom_level` column populated at attach time.
- **Quiz_Consumer**: Any future or existing course-side consumer (e.g., course quizzes) that may pull questions from the Question_Bank.
- **Bloom_Level**: Cognitive classification value in the set `{C1, C2, C3, C4, C5, C6}` used by assessment-related domains. After this feature, Bloom_Level is a property of the consumer (Assessment / Assessment_Question), not of the Question_Bank_Entry.
- **Universal_Field_Set**: The set of fields the Question_Bank exposes to any consumer: `id`, `title`, `category`, `question_type`, `question_text`, `options`, `correct_answer`, `explanation`, `rubric`, `points`, `is_active`, plus analytics (`times_used`, `difficulty_score`, `discrimination`) and audit (`created_by`, timestamps).
- **Admin_QB_UI**: The Inertia React page at `resources/js/pages/admin/question-bank/index.tsx`.
- **Bulk_Import**: The `POST /admin/question-bank/bulk-import` endpoint that ingests CSV or JSON files into the Question_Bank.
- **Attach_Flow**: The action in `resources/js/pages/admin/courses/assessment.tsx` that converts a Question_Bank_Entry into an Assessment_Question on a target Assessment.

## Requirements

### Requirement 1: Drop bloom_level Column from question_bank Table

**User Story:** As a database maintainer, I want the `question_bank` table to no longer carry a `bloom_level` column or any indexes referencing it, so that the schema reflects the bank's universal scope.

#### Acceptance Criteria

1. THE Migration SHALL drop the `question_bank_bloom_type_active_idx` index on `(bloom_level, question_type, is_active)` from the `question_bank` table before dropping the column.
2. THE Migration SHALL drop the composite index on `(category, bloom_level, is_active)` defined by the original create migration, before dropping the column.
3. THE Migration SHALL drop the composite index on `(question_type, bloom_level, is_active)` defined by the original create migration, before dropping the column.
4. THE Migration SHALL drop the single-column index on `bloom_level` defined by the original create migration, before dropping the column.
5. THE Migration SHALL drop the `bloom_level` column from the `question_bank` table.
6. THE Migration SHALL provide a reversible `down()` method that re-adds the `bloom_level` enum column (`C1`–`C6`, non-nullable, default `C1` for safety on rollback) and recreates each previously dropped index.
7. WHEN the migration is run on a database that already contains `question_bank` rows, THE Migration SHALL preserve every other column and every existing row.

### Requirement 2: Remove bloom_level from the QuestionBank Eloquent Model

**User Story:** As a backend developer, I want the `QuestionBank` model to expose only Universal_Field_Set attributes, so that no PHP code path can read, write, or scope by `bloom_level` on bank entries.

#### Acceptance Criteria

1. THE QuestionBank_Model SHALL omit `bloom_level` from the `#[Fillable]` attribute list.
2. THE QuestionBank_Model SHALL not declare a `scopeByBloomLevel` method.
3. THE QuestionBank_Model SHALL retain all other existing fillable fields, casts, relationships (`creator`, `assessmentQuestions`), scopes (`scopeActive`, `scopeByType`, `scopeByCategory`), and helpers (`incrementUsage`, `canDelete`).
4. IF the model factory `QuestionBankFactory` previously set `bloom_level`, THEN THE Factory SHALL no longer set or reference `bloom_level`.

### Requirement 3: Remove bloom_level from QuestionBankController Validation and Filtering

**User Story:** As an API consumer, I want the Question_Bank HTTP endpoints to neither accept nor return `bloom_level`, so that the bank's contract is unambiguously universal.

#### Acceptance Criteria

1. THE QuestionBankController SHALL omit the `bloom_level` rule from the `store()` validation array.
2. THE QuestionBankController SHALL omit the `bloom_level` rule from the `update()` validation array.
3. THE QuestionBankController SHALL not apply a `bloom_level` filter in `index()` (no `where('bloom_level', ...)` clause and no `bloom_level` key in the returned `filters` payload).
4. WHEN a client submits a `POST /admin/question-bank` request that includes a `bloom_level` field, THE QuestionBankController SHALL ignore the field and SHALL NOT persist it on the created Question_Bank_Entry (because `bloom_level` is no longer fillable and the column no longer exists).
5. WHEN a client submits a `PATCH /admin/question-bank/{id}` request that includes a `bloom_level` field, THE QuestionBankController SHALL ignore the field and SHALL NOT modify any other field's behavior.
6. WHEN a client submits a `GET /admin/question-bank?bloom_level=C3` request, THE QuestionBankController SHALL return the same result set it would return without the `bloom_level` query parameter.
7. WHEN a Question_Bank_Entry is serialized into the Inertia `questions.data` array, THE QuestionBankController SHALL NOT include a `bloom_level` key on each row.

### Requirement 4: Remove bloom_level from the Bulk_Import Path

**User Story:** As an administrator importing a CSV or JSON file of questions, I want the import to ignore any `bloom_level` column without failing, so that bank-universal imports succeed even from legacy templates.

#### Acceptance Criteria

1. THE Bulk_Import CSV path SHALL NOT pass `bloom_level` into `QuestionBank::create()`.
2. THE Bulk_Import CSV path SHALL NOT default a missing `bloom_level` column to `'C1'` or any other value.
3. THE Bulk_Import JSON path SHALL strip any `bloom_level` key from each item before persisting.
4. WHEN a CSV file containing a `bloom_level` header is uploaded, THE Bulk_Import SHALL import every otherwise-valid row without raising a database error caused by the now-missing `bloom_level` column.
5. WHEN a JSON file containing `bloom_level` keys is uploaded, THE Bulk_Import SHALL import every otherwise-valid item without raising a mass-assignment error.

### Requirement 5: Remove Bloom Level from the Admin Question Bank UI

**User Story:** As an administrator using the Question Bank page, I want no Bloom Level controls anywhere on the page, so that the UI matches the bank's universal scope.

#### Acceptance Criteria

1. THE Admin_QB_UI SHALL NOT render a `Bloom Level` Select field inside the "New question" dialog.
2. THE Admin_QB_UI SHALL NOT render a `Bloom Level` Select field inside the "Edit question" dialog.
3. THE Admin_QB_UI SHALL NOT render a `Bloom` column in the questions DataTable.
4. THE Admin_QB_UI SHALL NOT render a Bloom Level filter control in the toolbar.
5. THE Admin_QB_UI SHALL NOT include `bloom_level` as a key in the `FormState` object used by the create/edit dialog.
6. THE Admin_QB_UI SHALL NOT include `bloom_level` in the `Filters` type or in any query-string passed to `router.get`.
7. THE Admin_QB_UI SHALL NOT submit `bloom_level` in the JSON payload of `router.post(store.url(), ...)` or `router.patch(update.url({ ... }), ...)`.
8. WHERE the existing toolbar contains a search input, a Question Type filter, and a "New question" button, THE Admin_QB_UI SHALL preserve those controls unchanged.
9. THE Admin_QB_UI SHALL preserve all other existing dialog fields: `Question Type`, `Question` text, type-specific fields (options/correct answer/min/max words), `explanation`, `points`, and `is_active`.

### Requirement 6: Remove bloom_level from the QuestionBank TypeScript Type

**User Story:** As a frontend developer, I want the `QuestionBank` TypeScript type to omit `bloom_level`, so that any code attempting to read it fails at compile time rather than at runtime.

#### Acceptance Criteria

1. THE QuestionBank_TypeScript_Type SHALL NOT declare a `bloom_level` property.
2. THE QuestionBank_TypeScript_Type SHALL retain all other existing properties: `id`, `title`, `category`, `question_type`, `question_text`, `options`, `correct_answer`, `explanation`, `rubric`, `points`, `is_active`, `times_used`, `difficulty_score`, `discrimination`, `created_at`, `updated_at`.
3. THE BloomLevel TypeScript alias SHALL remain exported from `resources/js/types/assessments.ts` because it is still consumed by Assessment-related types (`AdminAssessment`, `AdminAssessmentQuestion`, `AssessmentQuestionPayload`, `AssessmentDetail`, `AnswerResult`, etc.).

### Requirement 7: Update Tests That Seed bloom_level on Question_Bank_Entry Rows

**User Story:** As a test author, I want existing tests that build `QuestionBank` fixtures to no longer pass `bloom_level`, so that the test suite continues to pass after the column is dropped.

#### Acceptance Criteria

1. THE QuestionBankTest unit test (`tests/Unit/Models/QuestionBankTest.php`) SHALL no longer pass `bloom_level` into `QuestionBank::factory()->create([...])` or `QuestionBank::factory()->make([...])` calls.
2. THE AdminCourseManagementEnhancementTest feature test (`tests/Feature/Admin/AdminCourseManagementEnhancementTest.php`) SHALL no longer pass `bloom_level` into any `QuestionBank::factory()` call.
3. WHEN the project's test suite is run via `php artisan test --compact`, THE Test_Suite SHALL pass with the same set of green tests as before this feature, excluding any test whose sole purpose was to assert `bloom_level` on Question_Bank_Entry rows.
4. IF a test specifically asserted that a Question_Bank_Entry exposes `bloom_level`, THEN THE Test SHALL be removed or rewritten to assert a Universal_Field_Set property instead.

### Requirement 8: Preserve the Assessment Attach_Flow Contract

**User Story:** As an assessment author, I want attaching a bank question to an assessment to keep producing an `assessment_questions` row whose `bloom_level` matches the parent assessment's `bloom_level`, so that assessment grading and Bloom-radar analytics continue to work unchanged.

#### Acceptance Criteria

1. WHEN a Question_Bank_Entry is attached to an Assessment via the Attach_Flow, THE Attach_Flow SHALL persist a new Assessment_Question row whose `bloom_level` equals the parent Assessment's `bloom_level`.
2. WHEN a Question_Bank_Entry is attached to an Assessment, THE Attach_Flow SHALL NOT read `bloom_level` from the Question_Bank_Entry (the bank no longer carries it).
3. THE Attach_Flow SHALL copy the Universal_Field_Set fields (`question_type`, `question_text`, `options`, `correct_answer`, `explanation`, `rubric`, `points`) from the Question_Bank_Entry onto the new Assessment_Question, exactly as before this feature.
4. THE Attach_Flow SHALL set `assessment_questions.question_bank_id` to the source Question_Bank_Entry's id, exactly as before this feature.
5. WHEN a Question_Bank_Entry is attached and then immediately read back through the assessment authoring UI, THE Assessment_Question row SHALL satisfy `assessment_question.bloom_level === assessment.bloom_level` (round-trip property: assessment Bloom is the sole source of truth at attach time).
6. IF the same Question_Bank_Entry is attached to two different Assessments with different `bloom_level` values, THEN THE Attach_Flow SHALL produce two Assessment_Question rows whose `bloom_level` values each match their respective parent Assessment.

### Requirement 9: Preserve Out-of-Scope Assessment Surfaces

**User Story:** As an assessment author, I want the assessment authoring UI, the `assessments` table, and the `assessment_questions` table to keep their existing `bloom_level` semantics, so that this feature does not regress assessment functionality.

#### Acceptance Criteria

1. THE assessments_table_schema SHALL retain its `bloom_level` column unchanged.
2. THE assessment_questions_table_schema SHALL retain its `bloom_level` column unchanged.
3. THE Assessment_Authoring_UI SHALL retain its Bloom Level selection control on the assessment form.
4. THE AdminAssessment TypeScript type SHALL retain its `bloom_level: BloomLevel` property.
5. THE AdminAssessmentQuestion TypeScript type SHALL retain its `bloom_level: BloomLevel` property.
6. WHEN any existing assessment-related test is run after this feature, THE Test SHALL pass with the same outcome it had before this feature, provided its only contact with `QuestionBank` is via factories that no longer pass `bloom_level`.

### Requirement 10: Universal Neutrality for Future Consumers

**User Story:** As a developer integrating a future Quiz_Consumer (course quizzes) with the Question_Bank, I want the bank to be neutral with respect to consumer-specific cognitive classifications, so that I can attach the same question to a course quiz without inheriting an assessment-specific Bloom level.

#### Acceptance Criteria

1. THE Question_Bank_Entry SHALL expose only Universal_Field_Set fields to any consumer.
2. WHEN a future Quiz_Consumer reads a Question_Bank_Entry, THE Question_Bank SHALL NOT require the consumer to supply or interpret a `bloom_level` value at read time.
3. WHERE a consumer needs a cognitive classification on its own attached question, THE consumer SHALL store that classification on its own attached-question table (mirroring `assessment_questions.bloom_level`).
4. THE Question_Bank API surface (HTTP endpoints under `/admin/question-bank`, the `QuestionBank` Eloquent model's public attributes, and the `QuestionBank` TypeScript type) SHALL contain zero references to `bloom_level` after this feature is shipped.
