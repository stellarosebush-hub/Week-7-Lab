# Feature 3: Protected Admin Profile Editor

## Objective
Provide a staff-only section where pathologist profiles can be edited while preventing patient access.

## User Story
As office staff, I want a protected editor so I can keep provider profiles current without exposing edit controls to patients.

## Access Rules
- Public patients must not access the editor route.
- Editor access requires password entry.
- Demo password for this phase: `Office1234`.

## Security Requirements (Current Phase)
- Gate editor route behind password check.
- Keep password out of visible public UI text outside the login prompt.
- Maintain a basic authenticated session state for editor access.
- Provide logout action that clears editor session.

## Security Requirements (Production Upgrade)
- Replace static password with secure authentication.
- Store credentials securely (hashed and salted).
- Add role-based authorization and audit logging.
- Add brute-force protections and secure session expiration.

## Editable Fields
- Name
- Specialty
- Qualifications
- Bio
- Photo URL or upload reference

## Acceptance Criteria
1. Unauthenticated users are blocked from editor routes.
2. Correct password grants access to profile edit UI.
3. Incorrect password denies access and shows clear error.
4. Staff can update required profile fields and save changes.
5. Logout revokes access to the editor.

## Test Checklist
- Verify direct route access is blocked when not authenticated.
- Verify correct and incorrect password behavior.
- Verify profile updates persist according to selected storage design.
- Verify logout returns editor route to protected state.
