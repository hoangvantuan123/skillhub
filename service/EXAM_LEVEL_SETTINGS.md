# Exam-level settings

Menu: Đào tạo → Thiết lập cơ chế thi (/manage/levels). This is separate from question blueprint composition (/manage/blueprints), and competency levels L0–L3 are separate from question difficulty.

Confirmed user rule (2026-10-17): after L0 pass and L1 pass, failing a later L0 attempt preserves the earned L1. The failed attempt remains a separate outcome. The configured default is preserve. A learner can continue to L2 when the prerequisite has already been earned. Critical questions are defined by the exam blueprint, not configured a second time per level: a failure on a required critical question fails that attempt even if the total score reaches the threshold.

Each level has code/label, threshold percentage, maximum attempts per evaluation cycle (0 unlimited), retry cooldown. L1/L2/L3 require all lower levels. Percentage is earned weighted points / maximum weighted points * 100; comparison uses unrounded values. Initial 75% thresholds are editable starting values, not a claim about an external certification standard. CriticalFailed in the preview means the count of required critical questions failed under the blueprint settings.

The policy editor saves immutable versions to skillhub_level_policies, checks expected_version to prevent overwriting concurrent edits, and audits each save. Current/history qualifications must never be regraded simply because an administrator edits a policy. Module permission: exam_levels:view/update. The API validates sessions and permissions for all settings and preview operations.

POST /api/auth/level_config; /level_save {payload:{policy,expected_version}}; /level_simulate {payload:{policy,attempts}}. The latter is admin-only preview and cannot award a level. Attempts in preview have level/score/max_score/critical_failed/at; chronological timestamps are mandatory. Limits/cooldowns are evaluated within the supplied scenario (one evaluation cycle).

The engine also exposes explicit alternative policies for deliberate administrative configuration: suspend (retain historical highest but suspend active credit until the failed earned level is revalidated), recalculate (revoke the failed level and dependent credits; preserve historical highest for audit). Preserve is the user-selected default. These alternatives do not affect real records because no actual qualification ledger is connected yet.

Integration boundary: the current attempt/question/grading frontend still uses mock APIs. The backend policy store, validator and preview evaluator are real. Production qualification award must be called by trusted backend grading with a pinned policy version and blueprint snapshot, idempotent finalized attempt, eligibility/cycle checks, persisted immutable outcomes and qualification ledger. No public endpoint accepts frontend scores as real achievements. The new screen intentionally says configuration and simulation; it is not a completed real exam engine.

Tests cover L0 pass→L1 pass→L0 fail keeping L1 and eligibility for L2, critical failure, threshold boundary, prerequisite gates, limits, cooldown, policy validation, wrong dates/scores, alternative policy behavior, backend authorization and optimistic version rejection. UI preview uses in-memory fixtures at /tests/ui/levels-preview.html; actual Go/DB tests exercise the backend independently.
