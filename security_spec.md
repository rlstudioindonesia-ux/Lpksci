# Security Specification - LPK Source Course Indonesia

## Data Invariants
1. Students can only register with valid data.
2. Only Admins can approve registrations and manage active students.
3. Students can only see their own attendance, payments, and assessments.
4. Admins can see everything.
5. LMS Lessons are readable by all authenticated users, but writable only by Admins.
6. Customization is readable by all, but writable only by Admins.
7. Logs are writable only by the system (for now allowing Admins/Authenticated users for simpler sync, but ideally restricted).

## The "Dirty Dozen" Payloads
1. Attempt to create a student registration with an ID belonging to someone else.
2. Attempt to update a registration status from "Pending" to "Approved" as a student.
3. Attempt to read someone else's payment record.
4. Attempt to delete an active student record as a teacher (if not admin).
5. Attempt to update `createdAt` field on any document.
6. Attempt to inject a 2MB string into `name` field.
7. Attempt to write to `system/customization` as a non-admin.
8. Attempt to read `logs` as a regular student.
9. Attempt to create an LMS lesson with missing title.
10. Attempt to update a terminal state (e.g., approved registration) as a regular user.
11. Attempt to set `ownerId` to a different UID during creation.
12. Attempt to write to a collection not defined in the blueprint.

## Test Runner (Simplified)
We will verify that these payloads return PERMISSION_DENIED.
