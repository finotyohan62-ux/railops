# Supabase State Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh RailOps security documentation with a dated, read-only snapshot of the real Supabase RLS/advisor state without changing runtime code, data, schema, permissions, or business rules.

**Architecture:** Treat Supabase as an observed external state only. Record verified RLS/policy counts and Security Advisor deltas in the existing baseline, then verify the branch remains isolated from `main` and append the run to the worklog.

**Tech Stack:** GitHub documentation, Supabase read-only SQL and Security Advisor.

**Spec:** User maintenance instructions for `security/v150b2b-rls-ready`.

## Global Constraints

- Work only on `security/v150b2b-rls-ready`; keep `main` untouched and do not merge.
- Do not enable strict RLS or make destructive data/schema/security changes.
- Do not alter Import, Multi-chantier, weekly verification purge, business rules, or permissions.
- Stop any item that needs a product/security decision or user test.

---

### Task 1: Refresh the observed Supabase security snapshot

**Files:**
- Modify: `docs/security-advisor-baseline.md`
- Modify: `docs/worklog-railops.md`

**Interfaces:**
- Consumes: current Supabase project state and Security Advisor output.
- Produces: dated documentation only; no runtime or database behavior changes.

- [ ] **Step 1: Re-read the current branch state and Supabase RLS/advisor state.**

Run read-only GitHub compare/PR checks and Supabase catalog/advisor checks. Expected: no writes to Supabase and branch remains unmerged.

- [ ] **Step 2: Append a dated comparative snapshot to the baseline.**

Document only observed facts: RLS enabled/policy counts for core tables, current no-policy advisor items, SECURITY DEFINER warnings remaining, and leaked-password protection warning remaining. Explicitly state that no migration attribution is inferred.

- [ ] **Step 3: Verify the documentation change.**

Re-fetch `docs/security-advisor-baseline.md` from the branch and confirm the new dated section is present and `main` is unchanged.

- [ ] **Step 4: Append the run to the worklog.**

Record the documentation commit, read-only verification, branch divergence snapshot, and that no Supabase/runtime/business behavior changed.

- [ ] **Step 5: Verify the final branch state.**

Re-fetch the worklog and PR/compare state; confirm the PR is still draft/unmerged and only documentation changed during this pass.