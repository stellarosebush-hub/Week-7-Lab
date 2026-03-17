# Agents

This document defines who does what while building the patient intake website for the speech-language pathologist (SLP) office.

## Agent Roles

### 1) Planning Agent
- Owns scope definition and requirement traceability.
- Keeps `plan.md`, `featureplans.md`, and feature docs aligned.
- Resolves ambiguities before implementation starts.

### 2) Frontend Build Agent
- Implements the interface using React + Vite + Tailwind.
- Builds a clean and modern intake flow with clear navigation.
- Ensures responsive behavior on mobile and desktop.

### 3) Content Agent
- Drafts profile copy and service descriptions in plain language.
- Ensures each pathologist profile includes specialty and qualifications.
- Maintains consistency of tone across pages.

### 4) Security and Access Agent
- Implements and reviews protected admin-only areas.
- Adds route-level protection for profile-edit pages.
- Uses `Office1234` as a demo password only; production must replace this with secure authentication.

### 5) QA Agent
- Verifies acceptance criteria for each feature file.
- Tests usability, accessibility basics, and responsive layout.
- Logs defects and confirms fixes before release.

## Delivery Sequence
1. Finalize feature requirements.
2. Build public patient intake flow.
3. Build pathologist profile highlight section.
4. Build protected admin profile editor.
5. Run QA checklist and launch readiness review.

## Handoff Rules
- Every task should reference one feature file.
- Every feature file should contain acceptance criteria.
- Any scope change is logged in `changelog.md` and `worklog.md`.
