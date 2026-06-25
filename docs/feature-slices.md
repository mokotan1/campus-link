# Campus Link Feature Slices

This file breaks the 3-week MVP into feature slices small enough for one developer or one AI agent to handle at a time.

## Week 1

### Slice 1. Project Skeleton

Bounded context: Common

Goal: Create frontend and backend base projects.

Owner: Frontend + Backend

Done when:

- Next.js app runs locally.
- Spring Boot app runs locally.
- README has local run commands.

### Slice 2. Shared Domain Constants

Bounded context: Common

Goal: Define campus, role, project type, project status, and application status values.

Owner: PM + Backend + Frontend

Done when:

- Frontend and backend use the same naming.
- Dummy data uses the same values.

### Slice 3. Onboarding Basic Info

Bounded context: Profile

Goal: User enters campus, major, grade, and school email.

Owner: Frontend

Done when:

- Onboarding step 1 matches the prototype.
- Inputs are validated.

## Week 2

### Slice 4. Role Selection

Bounded context: Profile

Goal: User selects role tags and tool tags.

Owner: Frontend

Done when:

- User can select multiple roles.
- Tool input is saved in local/mock state.

### Slice 5. Portfolio Registration

Bounded context: Portfolio

Goal: User registers a portfolio item with link and role description.

Owner: Frontend + Backend

Done when:

- Portfolio form exists.
- Portfolio API contract is defined.

### Slice 6. Project Registration

Bounded context: Project

Goal: User creates a project recruitment post.

Owner: Backend + Frontend

Done when:

- Project creation API exists.
- Project registration screen exists.

### Slice 7. Project List and Filter

Bounded context: Project

Goal: User can browse and filter projects.

Owner: Frontend

Done when:

- Search, campus, role, and status filters work with dummy data.

## Week 3

### Slice 8. Apply to Project

Bounded context: Application

Goal: User sends an application to a project.

Owner: Backend + Frontend

Done when:

- Apply button creates an application.
- Application starts in pending status.

### Slice 9. Propose to Talent

Bounded context: Application

Goal: Project owner can propose collaboration to a user.

Owner: Backend + Frontend

Done when:

- Proposal action exists.
- Proposal appears in application status.

### Slice 10. Application Status Page

Bounded context: Application

Goal: User can see sent applications and received proposals.

Owner: Frontend

Done when:

- Pending, accepted, rejected, and canceled states are visible.

### Slice 11. Demo Data and QA

Bounded context: Common

Goal: Prepare demo-ready data and test the full flow.

Owner: Test/Data

Done when:

- At least 10 projects exist.
- At least 10 portfolios exist.
- Demo scenario can be completed without errors.
