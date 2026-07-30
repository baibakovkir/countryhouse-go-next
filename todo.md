# Authentication, Multi-Plot CRUD, and Frontend Validation

The core authentication and CRUD implementation exists. This checklist distinguishes implemented behavior from verification and UX work that is still outstanding.

## Current status

- [x] Authentication, user-owned plots, and full CRUD are implemented in the backend and frontend.
- [x] Frontend formatting and maintainability rules are enforced locally and in CI.
- [ ] Complete HTTP, repository, cross-user, and browser-component test coverage.
- [ ] Finish consistent blur validation, invalid-field focus, and per-action loading states.
- [ ] Exercise every acceptance criterion end to end against PostgreSQL and a production build.

## 1. Database and migration

- [x] Add `users` with normalized unique email, bcrypt password hash, and timestamps.
- [x] Add hashed opaque `sessions` with user ownership, expiry, and lookup/cleanup indexes.
- [x] Add required plot `name` and `owner_id` with ownership indexes and foreign keys.
- [x] Add and maintain missing `updated_at` fields.
- [x] Assign legacy plots to the environment-configured bootstrap owner.
- [x] Keep credentials and database connection strings out of source code.
- [x] Cascade plot deletion to its child data.
- [x] Retain expenses and clear `plot_object_id` when an object is deleted.
- [x] Provide an explicit down migration with documented production rollback constraints.
- [x] Apply every up migration to a clean PostgreSQL database in CI.

## 2. Backend authentication and authorization

- [x] Add dependency-free user/session domain types and repository interfaces.
- [x] Add register, login, logout, and current-user services.
- [x] Normalize email before storage and lookup.
- [x] Hash passwords with bcrypt and enforce its safe input length.
- [x] Generate cryptographically random tokens and persist only SHA-256 hashes.
- [x] Issue seven-day `HttpOnly`, `SameSite=Lax` cookies and support production `Secure` cookies.
- [x] Revoke sessions and clear cookies on logout.
- [x] Authenticate protected routes through middleware.
- [x] Map typed unauthorized errors to HTTP `401`.
- [x] Return generic login failures and HTTP `409` for duplicate email.
- [x] Keep health, registration, and login public while protecting application data.
- [x] Scope every data query and mutation to the authenticated owner.
- [x] Return `404` for missing and foreign-owned resources.
- [x] Validate `Origin` on authenticated state-changing requests.
- [x] Enable credentialed CORS and required HTTP methods for local development.

## 3. REST API and full CRUD

### Authentication

- [x] `POST /api/v1/auth/register` creates an account and session.
- [x] `POST /api/v1/auth/login` verifies credentials and creates a session.
- [x] `POST /api/v1/auth/logout` revokes the session and returns `204`.
- [x] `GET /api/v1/auth/me` returns the authenticated user.

### Plots and objects

- [x] List and create plots through `GET|POST /api/v1/plots`.
- [x] Read, partially update, and delete an owned plot by ID.
- [x] List and create objects within an owned plot.
- [x] Read, partially update, and delete an owned object by ID.
- [x] Reject plot resizing that would place an existing object outside its boundaries.

### Expenses and timeline

- [x] Provide collection and item CRUD routes scoped under a plot for expenses.
- [x] Preserve monetary values as decimal strings without floating-point conversion.
- [x] Validate that optional expense object references belong to the same plot.
- [x] Provide collection and item CRUD routes scoped under a plot for timeline tasks.
- [x] Preserve nullable planned budgets and `YYYY-MM-DD` dates.

### Update and error semantics

- [x] Use strict request DTOs instead of persistence types in handlers.
- [x] Distinguish omitted PATCH fields from explicit nullable values.
- [x] Load, merge, and validate complete entities during partial updates.
- [x] Return updated entities from PATCH and `204` from DELETE.
- [x] Reject unknown JSON fields, empty PATCH bodies, trailing JSON, and oversized bodies.
- [x] Preserve typed error envelopes and field-level `error.details`.
- [ ] Add explicit transactions for multi-query ownership checks and mutations where atomicity is required.

## 4. Frontend authentication and navigation

- [x] Add login and registration routes with reciprocal links.
- [x] Add the authenticated plots dashboard.
- [x] Use plot-scoped plan, expense, and timeline URLs.
- [x] Redirect unauthenticated users to login and authenticated users away from auth pages.
- [x] Keep authentication state separate from data and editor state.
- [x] Resolve unknown/authenticated/unauthenticated state through `/auth/me`.
- [x] Send `credentials: "include"` through the API client.
- [x] Preserve API error code and typed field details.
- [x] Display current-user and logout controls.
- [x] Load server data using the plot ID from the current URL.

## 5. CRUD user interface

- [x] Create, open, rename, resize, and delete plot cards.
- [x] Require destructive confirmation for plot deletion.
- [x] Keep the user on the plots dashboard after deleting a plot.
- [x] Edit and delete selected plot objects with prefilled forms.
- [x] Clear editor selection and reload server data after object deletion.
- [x] Edit and delete expenses.
- [x] Retain expenses after their linked object is deleted.
- [x] Edit and delete timeline tasks.
- [ ] Replace the shared global loading flag with per-action loading state.
- [x] Retain form values after frontend or backend validation errors.
- [x] Refresh affected server-backed state after successful mutations.

## 6. Custom frontend validation

- [x] Use dependency-free, strictly typed validators without `any`.
- [x] Return field-keyed errors and merge backend field details.
- [ ] Validate every form consistently on blur as well as submit.
- [ ] Focus the first invalid field in every form; currently this is complete only for authentication.
- [x] Trim required names, titles, categories, descriptions, and emails.
- [x] Normalize and validate email consistently with the backend.
- [x] Validate password confirmation, minimum length, and bcrypt byte length.
- [x] Validate finite positive plot dimensions.
- [x] Validate non-negative coordinates/heights and positive footprints.
- [x] Validate object footprints against plot boundaries.
- [x] Validate real `YYYY-MM-DD` dates.
- [x] Validate positive expense decimals with database-compatible precision.
- [x] Validate nullable non-negative planned budgets.
- [ ] Add an explicit frontend ISO currency validator if currency becomes user-editable.
- [x] Keep backend validation authoritative.

## 7. Automated tests

### Backend

- [ ] Cover normalization, hashing, duplicate registration, and all password boundaries together.
- [ ] Cover cookie attributes, session expiry/revocation, and invalid cookies.
- [ ] Test authentication middleware and public/protected route boundaries.
- [ ] Prove cross-user isolation for every entity.
- [ ] Cover CRUD success paths for plots, objects, expenses, and tasks.
- [ ] Cover malformed IDs, missing resources, invalid updates, and empty PATCH bodies.
- [ ] Cover resize rejection for existing objects.
- [ ] Cover plot cascades and expense unlinking after object deletion.
- [ ] Cover exact decimals and nullable update semantics.
- [ ] Add PostgreSQL repository integration tests to CI.

### Frontend

- [ ] Cover every validator boundary and simultaneous errors.
- [ ] Test backend field-detail mapping into forms.
- [ ] Test all authentication-store transitions.
- [ ] Test credentials and plot IDs in API requests.
- [ ] Test form value retention and reset behavior.
- [ ] Test confirmations, redirects, editor cleanup, and store refreshes.
- [ ] Expand geometry coverage for editing and bounds behavior.

## 8. Configuration, CI, and documentation

- [x] Document cookie and bootstrap environment variables without real secrets.
- [x] Pass authentication configuration through local and production Compose.
- [x] Keep frontend and API behind the same Caddy site without exposing production backend ports.
- [x] Run all migrations, `golangci-lint`, and race-enabled Go tests in CI.
- [x] Run frontend formatting, ESLint, Vitest, and the production build in CI.
- [x] Document authentication, API routes, bootstrap migration, and rollback behavior.
- [x] Document OAuth, email verification, password reset, account deletion, roles, and sharing as out of scope.

## 9. Frontend code quality

- [x] Add Prettier with `format` and `format:check` scripts.
- [x] Keep Prettier separate from ESLint and disable conflicting rules.
- [x] Enforce consistent type imports, braces, strict equality, complexity, depth, and function-size limits.
- [x] Split route components into plot, object, expense, and timeline feature modules.
- [x] Reduce maximum frontend source line length from thousands of characters to formatter-controlled output.
- [x] Add formatting as a required CI gate.

## Acceptance criteria

- [ ] Verify registration, session persistence, logout, and post-logout rejection end to end.
- [ ] Verify that two users cannot observe or mutate one another's data.
- [ ] Verify complete CRUD for every entity through both API and UI.
- [ ] Verify consistent frontend/backend geometry rejection.
- [ ] Verify inline Russian validation and backend field-error presentation for every form.
- [ ] Verify legacy data ownership through an upgrade migration scenario.
- [ ] Confirm every backend and frontend quality gate passes in CI.
