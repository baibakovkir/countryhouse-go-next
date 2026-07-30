# Authentication, Multi-Plot CRUD, and Frontend Validation

This roadmap turns the current single-plot, create/list MVP into an authenticated application where every user owns multiple plots and can manage all plot-related data.

## Implementation status

- [x] Database ownership migration, legacy bootstrap owner, users, and hashed sessions implemented.
- [x] Cookie authentication, origin checks, credentialed CORS, and owner isolation implemented.
- [x] Full plot, object, expense, and timeline CRUD implemented in the API and UI.
- [x] Plot-scoped navigation, auth state, inline field errors, and dependency-free validators implemented.
- [x] Compose, environment examples, CI migration handling, and README updated.
- [x] Go race tests/vet, frontend tests/lint/build, and clean-database SQL migration validation pass.
- [ ] Expand automated HTTP, repository, and browser-component coverage listed below as ongoing hardening.

The detailed checklist below remains as an audit trail; unchecked testing items describe additional coverage rather than missing core product behavior.

## 1. Database and migration

- [ ] Add a `users` table with UUID primary key, normalized unique email, bcrypt password hash, and timestamps.
- [ ] Add a `sessions` table with UUID primary key, user reference, hashed opaque token, expiry, creation timestamp, and indexes for token lookup and expiry cleanup.
- [ ] Add a required `name` and `owner_id` to `plots`; index the owner relationship and enforce ownership with a foreign key.
- [ ] Add `updated_at` to expenses and timeline tasks; ensure update queries maintain `updated_at` on every mutable entity.
- [ ] Preserve existing installations by assigning legacy plots to a bootstrap user configured with `BOOTSTRAP_EMAIL` and `BOOTSTRAP_PASSWORD`.
- [ ] Never place bootstrap credentials or database connection strings in source code, images, or committed environment files.
- [ ] Keep plot deletion cascading to objects, expenses, and tasks.
- [ ] Keep object deletion non-destructive for expense history by setting related `plot_object_id` values to `NULL`.
- [ ] Add down migrations where safely possible and document that production rollback must remain compatible with migrated data.
- [ ] Update CI migration validation to apply every migration to a clean PostgreSQL database.

## 2. Backend authentication and authorization

- [ ] Add domain types and small repository interfaces for users and sessions without external dependencies in the domain layer.
- [ ] Add registration, login, logout, and current-user application services.
- [ ] Normalize email addresses before storage and lookup.
- [ ] Hash passwords with bcrypt and reject passwords that cannot be represented safely by bcrypt.
- [ ] Generate session tokens with a cryptographically secure random source and store only their hashes in PostgreSQL.
- [ ] Issue the raw session token in an `HttpOnly`, `SameSite=Lax` cookie with a seven-day expiry; set `Secure` in production.
- [ ] Delete/revoke the active session on logout and clear the browser cookie.
- [ ] Add authentication middleware that resolves the current user and rejects missing, expired, or revoked sessions.
- [ ] Add an `unauthorized` typed domain error and map it to HTTP `401`.
- [ ] Return a generic message for invalid login credentials and HTTP `409` for an already registered email.
- [ ] Keep `/healthz`, registration, and login public; require authentication for every plot, object, expense, and timeline endpoint.
- [ ] Scope every repository query and mutation to the authenticated owner.
- [ ] Return `404` when a requested resource does not exist or belongs to another user, avoiding ownership disclosure.
- [ ] Validate the `Origin` header on state-changing cookie-authenticated requests.
- [ ] Enable credentialed CORS for the configured development frontend origin and allow `GET`, `POST`, `PATCH`, `DELETE`, and `OPTIONS`.

## 3. REST API and full CRUD

### Authentication

- [ ] `POST /api/v1/auth/register` — create an account, create a session, set the cookie, and return the user.
- [ ] `POST /api/v1/auth/login` — verify credentials, create a session, set the cookie, and return the user.
- [ ] `POST /api/v1/auth/logout` — revoke the current session, clear the cookie, and return `204`.
- [ ] `GET /api/v1/auth/me` — return the authenticated user.

### Plots

- [ ] `GET /api/v1/plots` — list plots owned by the current user.
- [ ] `POST /api/v1/plots` — create a named plot owned by the current user.
- [ ] `GET /api/v1/plots/{plotId}` — return one owned plot with its objects.
- [ ] `PATCH /api/v1/plots/{plotId}` — rename or resize an owned plot.
- [ ] `DELETE /api/v1/plots/{plotId}` — delete an owned plot and its child data, returning `204`.

### Plot objects

- [ ] `GET /api/v1/plots/{plotId}/objects` — list objects for an owned plot.
- [ ] `POST /api/v1/plots/{plotId}/objects` — create an object using metric coordinates.
- [ ] `GET /api/v1/plots/{plotId}/objects/{objectId}` — return one owned object.
- [ ] `PATCH /api/v1/plots/{plotId}/objects/{objectId}` — update type, name, coordinates, or dimensions.
- [ ] `DELETE /api/v1/plots/{plotId}/objects/{objectId}` — delete the object and unlink retained expenses, returning `204`.

### Expenses

- [ ] Add collection and item routes below `/api/v1/plots/{plotId}/expenses` for `GET`, `POST`, `PATCH`, and `DELETE`.
- [ ] Preserve money as a decimal string in HTTP, Go, and PostgreSQL; never convert it through floating-point values.
- [ ] Confirm an optional `plotObjectId` belongs to the same owned plot on create and update.

### Timeline tasks

- [ ] Add collection and item routes below `/api/v1/plots/{plotId}/timeline/tasks` for `GET`, `POST`, `PATCH`, and `DELETE`.
- [ ] Preserve optional planned budget as a decimal string and continue using `YYYY-MM-DD` dates.

### Update and error semantics

- [ ] Define strictly typed request DTOs; do not expose repository or persistence types directly from handlers.
- [ ] Implement partial `PATCH` requests with pointer/optional fields so omitted values differ from explicit empty or null values.
- [ ] Load and merge the stored entity before validating the complete updated result.
- [ ] Reject plot resizing when any existing object would fall outside the new boundaries.
- [ ] Return the updated representation from successful `PATCH` requests and `204` from successful deletes.
- [ ] Continue rejecting unknown JSON fields and oversized request bodies.
- [ ] Preserve the existing error envelope and include field-level errors in `error.details`.
- [ ] Use transactions where ownership checks and mutations must be atomic.

## 4. Frontend authentication and navigation

- [ ] Add `/login` and `/register` pages with links between them.
- [ ] Add `/plots` as the authenticated dashboard for creating, listing, opening, editing, and deleting plots.
- [ ] Use plot-scoped routes: `/plots/{plotId}/plan`, `/plots/{plotId}/expenses`, and `/plots/{plotId}/timeline`.
- [ ] Redirect unauthenticated users to `/login` and authenticated users away from login/register pages to `/plots`.
- [ ] Add an auth Zustand store separate from server plot data and local editor state.
- [ ] Load `/auth/me` when the application initializes and represent unknown, authenticated, and unauthenticated states explicitly.
- [ ] Update the API client to send `credentials: "include"` on every request.
- [ ] Extend `ApiError` to retain the error code and typed field details returned by the backend.
- [ ] Add current-user and logout controls to the application navigation.
- [ ] Remove the implicit global/current plot assumption from the data store; key loads and mutations by the plot ID in the URL.

## 5. CRUD user interface

- [ ] Add plot cards with open, rename/resize, and delete actions.
- [ ] Require explicit confirmation before deleting a plot and explain that its objects, expenses, and tasks will also be removed.
- [ ] Redirect to `/plots` and clear plot-specific state after deleting the currently open plot.
- [ ] Add a prefilled edit form for the selected plot object and a confirmed delete action.
- [ ] Clear `selectedObjectId` after deleting an object and reload the canvas from server data.
- [ ] Add edit and confirmed delete controls to each expense entry.
- [ ] Preserve expense history after object deletion and display an unlinked expense as a general expense.
- [ ] Add edit and confirmed delete controls to each timeline task.
- [ ] Disable only the form/action currently submitting instead of blocking unrelated page interactions.
- [ ] Retain entered values after frontend or backend validation failures.
- [ ] Refresh or update the relevant Zustand collection after each successful mutation so server data remains the source of truth.

## 6. Custom frontend validation

- [ ] Implement dependency-free, strictly typed validation utilities; do not use `any` or rely solely on browser validation attributes.
- [ ] Return field-keyed validation results that can be merged with backend `error.details`.
- [ ] Validate on blur and again on submit.
- [ ] Display concise Russian errors next to their fields and focus the first invalid field after submission.
- [ ] Trim required names, titles, categories, and emails before validation and submission.
- [ ] Normalize email consistently with the backend and validate its basic structure and length.
- [ ] Validate password confirmation, minimum password strength, and bcrypt-compatible UTF-8 byte length.
- [ ] Validate plot width and length as finite positive numbers.
- [ ] Validate object coordinates and height as finite non-negative numbers and footprint dimensions as finite positive numbers.
- [ ] Validate that object footprints remain inside the current plot for both create and edit forms.
- [ ] Validate required dates as real `YYYY-MM-DD` calendar dates.
- [ ] Validate expense amounts as positive decimals with no more than 12 integer digits and two fractional digits.
- [ ] Validate optional task budgets as non-negative decimals with the same precision rules.
- [ ] Keep currency typed and validated as a three-letter uppercase ISO code while the current UI defaults it to `RUB`.
- [ ] Keep backend domain validation authoritative and aligned with all frontend rules.

## 7. Tests

### Backend

- [ ] Test registration normalization, password hashing, duplicate email handling, and invalid passwords.
- [ ] Test session creation, token hashing, cookie attributes, expiry, logout revocation, and invalid cookies.
- [ ] Test authentication middleware and public/protected route boundaries.
- [ ] Test that users can never read, update, or delete another user's plots or child records.
- [ ] Test plot, object, expense, and task create/read/update/delete success paths.
- [ ] Test missing resources, malformed IDs, invalid partial updates, and empty patch bodies.
- [ ] Test plot resize rejection when an object would become out of bounds.
- [ ] Test plot cascade deletion and expense unlinking after object deletion.
- [ ] Test exact decimal money behavior and nullable expense-object/task-budget updates.
- [ ] Run repository/integration tests against PostgreSQL in CI.

### Frontend

- [ ] Add Vitest coverage for every custom validator boundary and multiple simultaneous field errors.
- [ ] Test backend field-detail mapping into form errors.
- [ ] Test auth-store initialization, login, registration, logout, and unauthorized transitions.
- [ ] Test that API requests include credentials and use the plot ID from the current route.
- [ ] Test create/edit forms retaining values on failure and resetting only after success.
- [ ] Test delete confirmation, plot redirects, object selection cleanup, and store refreshes.
- [ ] Keep existing geometry tests and add edit/bounds cases where transformation behavior is affected.

## 8. Configuration, CI, and documentation

- [ ] Add documented cookie security and bootstrap-owner environment variables to `.env.example` and `.env.production.example` without real secrets.
- [ ] Pass required authentication configuration through local and production Compose services.
- [ ] Confirm Caddy keeps frontend and API on the same public site and forwards cookies without exposing backend ports.
- [ ] Update the GitHub Actions backend job to run migrations, `golangci-lint`, and `go test -race -v ./...`.
- [ ] Keep the frontend job running `npm ci`, ESLint, Vitest, and the production Next.js build.
- [ ] Update README setup, API routes, authentication behavior, bootstrap migration procedure, and deployment/rollback notes.
- [ ] Document that OAuth, email verification, password reset, account deletion, roles, and plot sharing are outside this iteration.

## Acceptance criteria

- [ ] A new user can register, stay signed in through refreshes, log out, and cannot access protected data afterward.
- [ ] Two users can each own multiple plots and cannot observe or mutate one another's records.
- [ ] Every plot, object, expense, and timeline task supports create, read, edit, and delete from both API and UI.
- [ ] Plot and object geometry remains in meters and invalid/out-of-bounds updates are rejected consistently on frontend and backend.
- [ ] All forms show inline Russian validation errors before sending invalid data and correctly display backend field errors.
- [ ] Existing plot data is retained under the configured bootstrap owner after migration.
- [ ] Backend tests, lint, frontend tests, lint, build, and migration validation all pass in CI.
