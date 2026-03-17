# Feature 1: Service Selection

## Objective
Allow a patient to quickly select the service type they need before continuing intake.

## Service Options
- Child
- Stroke
- Swallowing

## User Story
As a patient or caregiver, I want to select the service I need so I can be guided to the most relevant intake path.

## UI Requirements
- Present three clear service cards or buttons.
- Only one selection can be active at a time.
- Active selection state must be visually distinct.
- A clear Next button remains disabled until a service is selected.

## Data Requirements
- Field: `serviceType`
- Accepted values: `child`, `stroke`, `swallowing`
- Required: Yes

## Validation Rules
- User cannot continue without selecting one option.
- Submitted value must match one of the three accepted values.

## Acceptance Criteria
1. User sees all three service options.
2. User can select only one option at a time.
3. Next action is unavailable until a selection is made.
4. Stored value is one of: child, stroke, swallowing.

## Test Checklist
- Verify each option can be selected.
- Verify toggling from one option to another updates state correctly.
- Verify keyboard navigation and focus visibility.
- Verify mobile and desktop layouts remain clear and readable.
