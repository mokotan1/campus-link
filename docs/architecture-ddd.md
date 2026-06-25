# Campus Link DDD Architecture

## 1. Architecture Goal

Campus Link will be developed with domain-driven design principles so that each developer or AI agent can work on one feature at a time without touching unrelated areas.

The project should avoid feature work that spreads across the whole codebase. Every task should be expressed as a small vertical slice:

- one user goal
- one bounded context
- one API group
- one frontend route or component group
- one test target

## 2. Bounded Contexts

### Identity

Purpose: handle account identity and school verification.

Main concepts:

- User
- SchoolEmail
- Campus
- Major
- VerificationStatus

Responsibilities:

- sign up
- login
- school email verification
- campus and major validation

Does not own:

- portfolio works
- project recruitment
- applications

### Profile

Purpose: describe who the user is for collaboration.

Main concepts:

- Profile
- RoleTag
- ToolTag
- Availability
- CollaborationPreference

Responsibilities:

- onboarding data
- role selection
- tool selection
- collaboration status

Does not own:

- uploaded portfolio media
- project membership decisions

### Portfolio

Purpose: prove the user's capability through work samples.

Main concepts:

- PortfolioItem
- ExternalLink
- WorkRole
- MediaAsset

Responsibilities:

- portfolio item creation
- external link registration
- work-role description
- portfolio list/detail

Does not own:

- user authentication
- project recruitment

### Project

Purpose: represent a team or project looking for collaborators.

Main concepts:

- Project
- RequiredRole
- ProjectStatus
- ProjectType
- ProjectTag

Responsibilities:

- project creation
- project list/search/filter
- project detail
- recruitment status

Does not own:

- user profile editing
- application status decisions outside project context

### Application

Purpose: manage collaboration requests between users and projects.

Main concepts:

- Application
- Proposal
- ApplicationStatus
- ApplicationMessage

Responsibilities:

- apply to project
- propose collaboration to user
- accept/reject/cancel
- application status list

Does not own:

- project editing
- portfolio editing

## 3. Feature Work Rule

Every AI/developer task must follow this rule:

> Work on one feature inside one bounded context unless the task explicitly defines a cross-context integration.

Good task examples:

- Implement project list API.
- Implement onboarding role selection page.
- Implement portfolio item creation form.
- Implement application status enum and repository.

Bad task examples:

- Build all user features.
- Make the whole backend.
- Connect every page to the database.
- Refactor frontend and backend together.

## 4. Backend Package Guideline

Spring Boot packages should be organized by domain first, not by technical layer first.

Recommended package shape:

```txt
com.campuslink
  identity
    domain
    application
    infrastructure
    presentation
  profile
    domain
    application
    infrastructure
    presentation
  portfolio
    domain
    application
    infrastructure
    presentation
  project
    domain
    application
    infrastructure
    presentation
  application
    domain
    application
    infrastructure
    presentation
  common
```

Layer meaning:

- domain: entities, value objects, enums, domain rules
- application: use cases and service orchestration
- infrastructure: database, storage, external service implementations
- presentation: REST controllers and request/response DTOs

## 5. Frontend Folder Guideline

Next.js should use feature-based folders where possible.

Recommended shape:

```txt
src
  app
    onboarding
    projects
    portfolios
    applications
    my
  features
    onboarding
    projects
    portfolios
    applications
    profile
  shared
    components
    lib
    types
    constants
```

Feature folder meaning:

- app: route structure
- features: domain-specific UI, hooks, API clients
- shared: reusable UI and utilities with no domain ownership

## 6. API Group Guideline

REST APIs should follow bounded contexts.

```txt
/api/auth
/api/profiles
/api/portfolios
/api/projects
/api/applications
/api/proposals
```

Avoid generic APIs like:

```txt
/api/data
/api/manage
/api/common
```

## 7. Definition of Done

A feature is done only when it includes:

- user-facing behavior
- API contract if backend is involved
- validation rule
- success and failure cases
- at least one test or checklist item
- README or spec update when behavior changes

## 8. AI Task Template

Each AI task should be written like this:

```txt
Feature:
Bounded context:
User goal:
Files allowed:
Files not allowed:
Inputs:
Outputs:
Acceptance criteria:
Test/check method:
```

Example:

```txt
Feature: Project list filter
Bounded context: Project
User goal: Users can filter projects by campus, role, and status.
Files allowed: frontend project list files, project API files
Files not allowed: auth, portfolio, application status
Inputs: campus, requiredRole, status
Outputs: filtered project list
Acceptance criteria: changing a filter updates the visible list
Test/check method: run frontend page and test three filter combinations
```

## 9. First Implementation Order

1. Project skeleton
2. Shared constants for campus, role, project status
3. Identity minimal login/signup UI
4. Profile onboarding
5. Portfolio registration
6. Project registration/list/detail
7. Application/proposal flow
8. Application status page
