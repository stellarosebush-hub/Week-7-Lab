# Patient Intake Website Plan

## Goal
Create a clean and modern patient intake website for an SLP office that is simple to follow for patients and easy to maintain for office staff.

## Product Scope
- Public patient flow for selecting needed service.
- Public section highlighting each speech-language pathologist with specialty and qualifications.
- Protected staff-only area for editing pathologist profiles.

## Target Stack
- React
- Vite
- Tailwind CSS

## Design Direction
- Clear hierarchy with simple headings and short descriptive text.
- Minimal steps in intake flow.
- High-contrast interactive states for obvious next actions.
- Mobile-first responsive layout.

## Functional Requirements
1. Patients can select one service path:
   - Child
   - Stroke
   - Swallowing
2. The website shows each pathologist profile with:
   - Name
   - Specialty
   - Qualifications
   - Optional short bio
3. A restricted section blocks patient access and allows editable profile management.
4. Staff access to the editor is password-protected using `Office1234` for demo/testing.

## Security Note
`Office1234` is for demo use only. Replace with secure authentication (hashed credentials, role-based access, and session controls) before production release.

## Non-Functional Requirements
- Usability: Intake selection should be understandable in under 30 seconds.
- Accessibility: Semantic markup, keyboard support, visible focus states, readable contrast.
- Performance: Fast initial load on typical clinic Wi-Fi and mobile data.
- Maintainability: Profile content should be easy to update in the admin area.

## Milestones
1. Documentation complete.
2. Public intake feature implemented.
3. Pathologist profile section implemented.
4. Admin profile editor protection implemented.
5. QA and launch checklist complete.

## Requirement Traceability
- Feature 1 details: `features/service-selection.md`
- Feature 2 details: `features/pathologist-profiles.md`
- Feature 3 details: `features/admin-profile-editor.md`
