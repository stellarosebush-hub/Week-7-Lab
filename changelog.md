# Changelog

All notable planning and implementation changes should be documented in this file.

## 2026-03-17

### Added
- Core planning files:
  - `agents.md`
  - `plan.md`
  - `featureplans.md`
  - `worklog.md`
  - `changelog.md`
- Feature-specific planning files:
  - `features/service-selection.md`
  - `features/pathologist-profiles.md`
  - `features/admin-profile-editor.md`

### Security
- Added requirement for password-protected admin profile editor.
- Marked `Office1234` as demo password only and documented production replacement requirement.

### Added
- New application scaffold at `patient-intake-site` using React + Vite + Tailwind.
- Intake UI flow for selecting patient service type.
- Public pathologist profile showcase with specialty and qualification emphasis.
- Protected admin routes with login page and editable provider profile form.

### Changed
- Advanced project from planning-only docs to runnable frontend scaffold.

### Security
- Added route protection behavior for staff editor pages.
- Added demo password login gate using `Office1234` for prototype use only.
