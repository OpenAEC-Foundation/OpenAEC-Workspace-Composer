use std::fs;
use std::path::Path;

use super::common::{self, GenerateRequest, GenerateResult};

pub fn generate(request: &GenerateRequest) -> Result<GenerateResult, String> {
    let workspace_path = Path::new(&request.path);
    let source_version = request.source_version.as_deref().unwrap_or("unknown");
    let target_version = request.target_version.as_deref().unwrap_or("unknown");
    let target_repo = request.target_repo.as_deref().unwrap_or("");

    // Create directories
    let claude_dir = workspace_path.join(".claude");
    fs::create_dir_all(&claude_dir).map_err(|e| e.to_string())?;

    let docs_dir = workspace_path.join("docs");
    let migration_plan_dir = docs_dir.join("migration-plan");
    let research_dir = docs_dir.join("research");
    let step_research_dir = research_dir.join("step-research");
    let migration_dir = workspace_path.join("migration").join("steps");
    fs::create_dir_all(&migration_plan_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&step_research_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&migration_dir).map_err(|e| e.to_string())?;

    let workspace_name = common::resolve_workspace_name(workspace_path, &request.name);
    let mut files_created: Vec<String> = Vec::new();

    // Generate .code-workspace
    let workspace_file = workspace_path.join(format!("{}.code-workspace", workspace_name));
    let workspace_content = generate_workspace_json(&workspace_name, target_repo);
    common::write_file(&workspace_file, &workspace_content, &mut files_created)?;

    // Generate settings.local.json
    let settings_file = claude_dir.join("settings.local.json");
    common::write_file(&settings_file, &common::generate_settings_json(), &mut files_created)?;

    // Generate CLAUDE.md
    let claude_md_file = workspace_path.join("CLAUDE.md");
    let claude_md = generate_claude_md(&workspace_name, source_version, target_version);
    common::write_file(&claude_md_file, &claude_md, &mut files_created)?;

    // Generate ROADMAP.md
    let roadmap_file = workspace_path.join("ROADMAP.md");
    common::write_file(&roadmap_file, &generate_roadmap(&workspace_name), &mut files_created)?;

    // Generate MIGRATION-PLAN.md
    let migration_plan_file = workspace_path.join("MIGRATION-PLAN.md");
    common::write_file(&migration_plan_file, &generate_migration_plan(&workspace_name, source_version, target_version), &mut files_created)?;

    // Generate BREAKING-CHANGES.md
    let bc_file = workspace_path.join("BREAKING-CHANGES.md");
    common::write_file(&bc_file, &generate_breaking_changes(&workspace_name, source_version, target_version), &mut files_created)?;

    // Generate ACCEPTANCE-CRITERIA.md
    let ac_file = workspace_path.join("ACCEPTANCE-CRITERIA.md");
    common::write_file(&ac_file, &generate_acceptance_criteria(&workspace_name, source_version, target_version), &mut files_created)?;

    // Generate CURRENT-STATE.md
    let cs_file = workspace_path.join("CURRENT-STATE.md");
    common::write_file(&cs_file, &generate_current_state(&workspace_name, source_version), &mut files_created)?;

    // Generate ROLLBACK-PLAN.md
    let rb_file = workspace_path.join("ROLLBACK-PLAN.md");
    common::write_file(&rb_file, &generate_rollback_plan(&workspace_name, source_version), &mut files_created)?;

    // Generate COMPATIBILITY-MATRIX.md
    let cm_file = workspace_path.join("COMPATIBILITY-MATRIX.md");
    common::write_file(&cm_file, &generate_compatibility_matrix(&workspace_name, source_version, target_version), &mut files_created)?;

    // Generate DECISIONS.md
    let decisions_file = workspace_path.join("DECISIONS.md");
    common::write_file(&decisions_file, &generate_decisions(), &mut files_created)?;

    // Generate SOURCES.md
    let sources_file = workspace_path.join("SOURCES.md");
    common::write_file(&sources_file, &generate_sources(), &mut files_created)?;

    // Generate WAY_OF_WORK.md
    let wow_file = workspace_path.join("WAY_OF_WORK.md");
    common::write_file(&wow_file, &generate_way_of_work(), &mut files_created)?;

    // Generate LESSONS.md
    let lessons_file = workspace_path.join("LESSONS.md");
    common::write_file(&lessons_file, &generate_lessons(), &mut files_created)?;

    // Generate CHANGELOG.md
    let changelog_file = workspace_path.join("CHANGELOG.md");
    common::write_file(&changelog_file, &generate_changelog(), &mut files_created)?;

    // Generate .gitignore if missing
    let gitignore_file = workspace_path.join(".gitignore");
    common::write_file_if_missing(&gitignore_file, &common::generate_gitignore(), &mut files_created)?;

    Ok(GenerateResult {
        workspace_file: workspace_file.to_string_lossy().to_string(),
        files_created,
    })
}

fn generate_workspace_json(name: &str, target_repo: &str) -> String {
    let mut folders = format!(
        r#"    {{
      "name": "{name}",
      "path": "."
    }}"#
    );

    if !target_repo.is_empty() {
        folders.push_str(&format!(
            r#",
    {{
      "name": "target-codebase",
      "path": "{target_repo}"
    }}"#
        ));
    }

    format!(
        r#"{{
  "folders": [
{folders}
  ],
  "settings": {{
    "files.associations": {{
      "CLAUDE.md": "markdown",
      "STEP.md": "markdown",
      "MIGRATION-PLAN.md": "markdown",
      "BREAKING-CHANGES.md": "markdown"
    }}
  }}
}}"#
    )
}

fn generate_claude_md(name: &str, source: &str, target: &str) -> String {
    format!(
        r#"# {name}

## Identity

Version upgrade workspace for migrating from **{source}** to **{target}**.
Built using the 7-phase Version Upgrade Workflow methodology.

## Core Files Map

| File | Domain | Purpose |
|------|--------|---------|
| ROADMAP.md | Status | Single source of truth for progress |
| MIGRATION-PLAN.md | Planning | Dependency-ordered execution plan |
| BREAKING-CHANGES.md | Research | Registry of all breaking changes |
| ACCEPTANCE-CRITERIA.md | Quality | Definition of "upgrade complete" |
| CURRENT-STATE.md | Baseline | Pre-upgrade snapshot |
| ROLLBACK-PLAN.md | Safety | Per-step rollback procedures |
| COMPATIBILITY-MATRIX.md | Scope | Version compatibility grid |
| DECISIONS.md | Architecture | Numbered migration decisions |
| SOURCES.md | References | Official migration guides |
| LESSONS.md | Knowledge | Discoveries during migration |
| WAY_OF_WORK.md | Methodology | 7-phase upgrade process |
| CHANGELOG.md | History | Version history |

## 7-Phase Methodology

1. **Bootstrap & State Assessment** — Create workspace, snapshot current state
2. **Research Breaking Changes** — Investigate all breaking changes and deprecations
3. **Migration Plan Refinement** — Dependency-ordered steps with agent prompts
4. **Component-Specific Research** — Per-step deep dives
5. **Execute Migration** — Migrate in batches with regression gates
6. **Validation & Testing** — Tests, compatibility, regression
7. **Release & Documentation** — Migration guide, changelog, release

## Protocols

### P-001: Session Start
Read ROADMAP.md, MIGRATION-PLAN.md, BREAKING-CHANGES.md, CURRENT-STATE.md,
ACCEPTANCE-CRITERIA.md, LESSONS.md, DECISIONS.md. Determine current phase
from ROADMAP.md and continue autonomously.

### P-002: Meta-Orchestrator
Main session thinks, plans, and validates. Agents execute migration steps.
Use 3-agent batches where possible with separated file scopes.

### P-003: Regression Gate
After every batch of migration steps:
1. Build succeeds
2. Test suite passes
3. No new warnings
4. Manual smoke test of key flows

### P-004: Research Protocol
Use only SOURCES.md approved sources. WebFetch for latest documentation.
Focus on: changelogs, migration guides, release notes.

### P-005: Step Standards
Every migration step follows STEP.md format:
- YAML frontmatter: name, description, type, risk, rollback, status
- Before/After code blocks
- Migration procedure (step-by-step)
- Verification checklist
- Rollback procedure

### P-006: Document Sync
Update ROADMAP.md, BREAKING-CHANGES.md, COMPATIBILITY-MATRIX.md,
LESSONS.md, DECISIONS.md, and CHANGELOG.md after every phase.

### P-007: Session End
Update ROADMAP.md with next steps. Commit all changes.

## Conventions

- Documentation: Nederlands
- Code & configs: Engels
- Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:
- Deterministic language: ALWAYS/NEVER, not suggestions
"#
    )
}

fn generate_roadmap(name: &str) -> String {
    format!(
        r#"# {name} — ROADMAP

## Phase Status

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Bootstrap & State Assessment | ⏳ In Progress | 50% |
| 2 | Research Breaking Changes | ⬜ Not Started | 0% |
| 3 | Migration Plan Refinement | ⬜ Not Started | 0% |
| 4 | Component-Specific Research | ⬜ Not Started | 0% |
| 5 | Execute Migration | ⬜ Not Started | 0% |
| 6 | Validation & Testing | ⬜ Not Started | 0% |
| 7 | Release & Documentation | ⬜ Not Started | 0% |

## Overall Progress: 7%

## Current Status

Phase 1 bootstrapped by OpenAEC Workspace Composer. Core files created.
Next: Complete current state assessment, then begin Phase 2 research.

## Next Steps

1. Complete CURRENT-STATE.md with actual codebase analysis
2. Populate SOURCES.md with official migration documentation
3. Begin Phase 2: Research Breaking Changes

## Migration Step Summary

| Category | Planned | Completed |
|----------|---------|-----------|
| config/ | 0 | 0 |
| deps/ | 0 | 0 |
| api/ | 0 | 0 |
| deprecation/ | 0 | 0 |
| feature/ | 0 | 0 |
| cleanup/ | 0 | 0 |
| **Total** | **0** | **0** |
"#
    )
}

fn generate_migration_plan(name: &str, source: &str, target: &str) -> String {
    format!(
        r#"# {name} — Migration Plan

## Status

Phase 1: Raw scope. To be refined in Phase 3.

## Upgrade Context

| Key | Value |
|-----|-------|
| Source Version | {source} |
| Target Version | {target} |
| Upgrade Type | TBD (framework-upgrade / app-release) |
| Codebase Size | TBD |
| Test Coverage | TBD |

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| TBD | | | |

## Step Inventory

_To be populated during Phase 2-3 after breaking changes research._

### config/ (Configuration Changes)

| Name | Scope | Breaking Change Ref | Complexity | Dependencies |
|------|-------|---------------------|------------|-------------|

### deps/ (Dependency Updates)

| Name | Scope | Breaking Change Ref | Complexity | Dependencies |
|------|-------|---------------------|------------|-------------|

### api/ (API Migration)

| Name | Scope | Breaking Change Ref | Complexity | Dependencies |
|------|-------|---------------------|------------|-------------|

### deprecation/ (Deprecation Replacements)

| Name | Scope | Breaking Change Ref | Complexity | Dependencies |
|------|-------|---------------------|------------|-------------|

### feature/ (New Feature Adoption)

| Name | Scope | Breaking Change Ref | Complexity | Dependencies |
|------|-------|---------------------|------------|-------------|

### cleanup/ (Post-Migration Cleanup)

| Name | Scope | Breaking Change Ref | Complexity | Dependencies |
|------|-------|---------------------|------------|-------------|

## Batch Execution Plan

_To be defined in Phase 3._

| Batch | Steps | Count | Dependencies | Regression Gate |
|-------|-------|-------|-------------|-----------------|
"#
    )
}

fn generate_breaking_changes(name: &str, source: &str, target: &str) -> String {
    format!(
        r#"# Breaking Changes Registry — {name}

## {source} to {target}

## Summary

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| API Changes | 0 | 0 | 0 | 0 | 0 |
| Config Changes | 0 | 0 | 0 | 0 | 0 |
| Dependency Changes | 0 | 0 | 0 | 0 | 0 |
| Behavior Changes | 0 | 0 | 0 | 0 | 0 |
| Removed Features | 0 | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** | **0** |

## API Changes

_To be populated during Phase 2 research._

## Config Changes

_To be populated during Phase 2 research._

## Dependency Changes

_To be populated during Phase 2 research._

## Behavior Changes

_To be populated during Phase 2 research._

## Removed Features

_To be populated during Phase 2 research._
"#
    )
}

fn generate_acceptance_criteria(name: &str, source: &str, target: &str) -> String {
    format!(
        r#"# Acceptance Criteria — {name}

## Upgrade from {source} to {target}

## Upgrade is Complete When

1. All code compiles/builds without errors on {target}
2. All existing tests pass (zero regressions)
3. No deprecated API usage remains (verified by scan)
4. All breaking changes from BREAKING-CHANGES.md are addressed
5. COMPATIBILITY-MATRIX.md shows all green
6. New features from {target} adopted where beneficial
7. Documentation updated (README, CHANGELOG)

## Step Quality Requirements

### Structure
- Every step has: STEP.md + references/ directory
- STEP.md contains: before/after code, migration procedure, verification, rollback
- YAML frontmatter required: name, description, type, risk, rollback, status

### Content
- English-only
- Deterministic language: ALWAYS / NEVER
- Every code change verified against official migration guide
- Rollback procedure for every step

## Regression Gate (after every batch)

1. Build succeeds
2. Test suite passes
3. No new warnings
4. Manual smoke test of key user flows
"#
    )
}

fn generate_current_state(name: &str, source: &str) -> String {
    format!(
        r#"# Current State Assessment — {name}

## Assessment Date

_To be completed during Phase 1._

## Technology Inventory

| Component | Version | Location |
|-----------|---------|----------|
| Primary technology | {source} | TBD |

## Dependency Tree (relevant)

| Dependency | Version | Upgrade Impact |
|-----------|---------|---------------|

## Codebase Metrics

| Metric | Value |
|--------|-------|
| Total Files | TBD |
| Lines of Code | TBD |
| Test Files | TBD |
| Test Coverage | TBD |
| API Usages | TBD |
| Deprecated API Usages | TBD |

## Known Issues with Current Version

| Issue | Severity | Motivates Upgrade? |
|-------|----------|-------------------|

## Files Using Deprecated APIs

| File | Line | Deprecated API | Replacement |
|------|------|---------------|-------------|
"#
    )
}

fn generate_rollback_plan(name: &str, source: &str) -> String {
    format!(
        r#"# Rollback Plan — {name}

## Global Rollback Strategy

If the upgrade fails after multiple batches:
1. `git log --oneline` to find the last stable commit before migration
2. `git revert --no-commit HEAD~N..HEAD` (where N = commits since migration start)
3. Or: `git checkout pre-migration-{source}` to return to pre-migration state

## Pre-Migration Tag

Before starting Phase 5, create:
```bash
git tag pre-migration-{source}
```

## Per-Batch Rollback

| Batch | Commits | Rollback Command | Verification |
|-------|---------|-----------------|--------------|

## Point of No Return

_Document the threshold after which rollback becomes impractical._
_Example: "After batch 3, the database schema has been migrated and rollback requires a database restore."_
"#
    )
}

fn generate_compatibility_matrix(name: &str, source: &str, target: &str) -> String {
    format!(
        r#"# Compatibility Matrix — {name}

## {source} to {target}

## Dependency Compatibility

| Dependency | Current Version | Required Version | Compatible Range | Action |
|-----------|----------------|-----------------|-----------------|--------|

## Feature Compatibility

| Feature | {source} | {target} | Migration Needed | Step Ref |
|---------|----------|----------|-----------------|----------|

## Runtime Compatibility

| Runtime | Min Version | Recommended | Notes |
|---------|------------|-------------|-------|

## Plugin/Extension Compatibility

| Plugin | Current | Compatible with Target | Action |
|--------|---------|----------------------|--------|
"#
    )
}

fn generate_decisions() -> String {
    r#"# Decisions

Numbered architectural and migration decisions. Immutable once recorded.

## D-001: English-Only Content
**Date**: Auto-generated
**Decision**: All migration steps and documentation are written in English.
**Rationale**: Consistency with Claude Code skill ecosystem.
**Consequences**: Non-English teams need translation for internal docs.

## D-002: MIT License
**Date**: Auto-generated
**Decision**: Project uses MIT license.
**Rationale**: Maximum compatibility with OpenAEC ecosystem.

## D-003: 7-Phase Methodology
**Date**: Auto-generated
**Decision**: Follow the 7-phase Version Upgrade Workflow methodology.
**Rationale**: Proven structure from Skill-Package-Workflow-Template, adapted for upgrades.

## D-004: ROADMAP as Single Source of Truth
**Date**: Auto-generated
**Decision**: ROADMAP.md is the ONLY place for project status.
**Rationale**: Prevents status duplication and drift.

## D-005: Pre-Migration Tag Required
**Date**: Auto-generated
**Decision**: Always create a git tag before starting Phase 5 execution.
**Rationale**: Enables global rollback to known-good state.

## D-006: Rollback Procedure Required Per Step
**Date**: Auto-generated
**Decision**: Every STEP.md must include a rollback procedure.
**Rationale**: Migration safety — every change must be reversible.

## D-007: Regression Gate After Every Batch
**Date**: Auto-generated
**Decision**: Build + tests must pass after every agent batch.
**Rationale**: Catch regressions early, before they compound.
"#
    .to_string()
}

fn generate_sources() -> String {
    r#"# Sources

Approved documentation sources for this upgrade project.

## Primary Sources

| Source | URL | Type | Last Verified |
|--------|-----|------|---------------|
| _Official migration guide_ | TBD | Migration Guide | TBD |
| _Official changelog_ | TBD | Changelog | TBD |
| _Official release notes_ | TBD | Release Notes | TBD |

## Secondary Sources

| Source | URL | Type | Last Verified |
|--------|-----|------|---------------|

## Verification Rules

1. **Primary sources only** — use official documentation, not blog posts or Stack Overflow
2. **Version-explicit** — always verify which version a source applies to
3. **WebFetch verification** — verify code examples against latest published docs
4. **Update this file** — add new sources as they are discovered during research
"#
    .to_string()
}

fn generate_way_of_work() -> String {
    r#"# Way of Work

## Overview

This project follows the **7-Phase Version Upgrade Workflow** methodology,
adapted from the OpenAEC Skill-Package-Workflow-Template.

For full methodology documentation, see: CLAUDE.md (protocols section).

## Phases

| Phase | Name | Goal |
|-------|------|------|
| 1 | Bootstrap & State Assessment | Create workspace, snapshot current state |
| 2 | Research Breaking Changes | Investigate all breaking changes |
| 3 | Migration Plan Refinement | Dependency-ordered steps with agent prompts |
| 4 | Component-Specific Research | Per-step deep dives |
| 5 | Execute Migration | Migrate in batches with regression gates |
| 6 | Validation & Testing | Tests, compatibility, regression |
| 7 | Release & Documentation | Migration guide, changelog, release |

## Step Categories

| Category | Purpose |
|----------|---------|
| config/ | Configuration file changes, settings migration |
| deps/ | Dependency version updates, lock file regeneration |
| api/ | API migration (breaking changes, new patterns) |
| deprecation/ | Replace deprecated APIs with new equivalents |
| feature/ | Adopt new features from target version |
| cleanup/ | Remove migration shims, dead code, old patterns |

## Content Standards

**MUST DO:**
- English only
- Deterministic language: ALWAYS/NEVER
- Verify all code against official docs (WebFetch)
- Document rollback for every step
- Before/after code examples

**MUST NOT DO:**
- Vague language ("you might consider")
- Assumptions without verification
- Skip rollback procedures
- Modify multiple concerns in one step

## Orchestration Model

- 3 agents per batch (optimal for Claude Code Agent tool)
- Separated file scopes (never two agents on same file)
- Regression gate after every batch
- Dependency-aware ordering
"#
    .to_string()
}

fn generate_lessons() -> String {
    r#"# Lessons Learned

Observations and findings captured during the version upgrade process.

_Lessons will be added as L-XXX entries during development._
"#
    .to_string()
}

fn generate_changelog() -> String {
    r#"# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Initial repository structure and core files (Phase 1)
- Bootstrapped by OpenAEC Workspace Composer
"#
    .to_string()
}
