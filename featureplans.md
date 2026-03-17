# Feature Plans Index

This file tracks all feature-level plans and implementation order.

## Planned Features

1. Service Selection
- File: `features/service-selection.md`
- Priority: High
- Dependency: None
- Outcome: Patient chooses child, stroke, or swallowing service path.

2. Pathologist Profiles Showcase
- File: `features/pathologist-profiles.md`
- Priority: High
- Dependency: Shared design system
- Outcome: Profiles display specialty and qualifications clearly.

3. Protected Admin Profile Editor
- File: `features/admin-profile-editor.md`
- Priority: High
- Dependency: Feature 2 profile data model
- Outcome: Staff-only editable profiles behind password gate.

## Delivery Order
1. Service Selection
2. Pathologist Profiles Showcase
3. Protected Admin Profile Editor

## Acceptance Gate
- Each feature file must include: scope, user stories, implementation notes, acceptance criteria, and test checklist.
- No feature is marked complete until QA verifies acceptance criteria.
