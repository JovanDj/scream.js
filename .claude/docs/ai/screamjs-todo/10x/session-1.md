# Existing Capability Product Audit

## Scope

This audit checks the running SSR application, its routes, templates, controllers, tests, and database schema. It prioritizes features that can be completed from capabilities already present. It does not propose a new subsystem or framework abstraction.

## Current Product

The application currently exposes:

- Todo creation, listing, search, status filtering, sorting, pagination, editing, completion, detail, and deletion.
- Project listing, search, status filtering, sorting, pagination, detail, creation handlers, and archive/unarchive handlers.
- Tag creation, listing, sorting, pagination, deletion, and a backend action for replacing a todo's assigned tags.
- A static home page and Bootstrap-based SSR views.

The database already models more than the UI currently uses:

- Todos have `description`, `due_at`, `priority_id`, and optional `project_id`.
- Three priority values already exist: low, medium, and high.
- Projects have active and archived states.
- Todos and tags already have a many-to-many relation.

## Main Finding

Do not add a new product area yet. First turn the existing data model and handlers into one coherent todo workflow. Several features are implemented at only one layer, so users cannot complete them through the application.

## Do Now

### 1. Finish due-date support

**Value:** High  
**Effort:** Small  
**Uses:** Existing `due_at` column, create input, validation, index query, and `dueToday` filter.

The create page accepts a due date and the controller validates it, but the insert writes `due_at: null`. The edit and detail pages do not display or update it, and the existing `dueToday` filter is absent from the list UI.

Complete the existing vertical slice:

- Persist the submitted due date.
- Show and edit it.
- Add the existing `dueToday` filter to the todo index.
- Add an overdue filter only after due-date persistence works.

This is the best next step because most of the implementation already exists and the current form otherwise promises behavior it does not deliver.

### 2. Make Projects reachable and actionable

**Value:** High  
**Effort:** Small  
**Uses:** Existing project index, create template, store action, detail page, and archive/unarchive actions.

Projects are mounted and `/projects` works, but the main navigation and home page do not link to it. `project-create.scream` and the POST handler exist, but `GET /projects/create` returns 404. Archive/unarchive handlers exist, but the project detail page exposes neither action.

Complete the existing project UI:

- Add Projects to navigation and the home page.
- Add `GET /projects/create` and a Create Project link.
- Add archive/unarchive controls to project detail.

### 3. Connect todos to projects

**Value:** High  
**Effort:** Medium  
**Uses:** Existing `todos.project_id`, project index/detail, and todo create/edit forms.

Allow choosing an active project on todo create/edit, show it on todo detail/index, and list a project's todos on project detail. This makes the existing Projects area useful rather than a separate list of names.

Implement this after project navigation and creation are complete so the relation has a usable source of projects.

## Do Next

### 4. Expose existing priority support

**Value:** Medium  
**Effort:** Small to medium  
**Uses:** Existing priority table, foreign key, seed values, and current default-to-medium logic.

Todo writes already look up the medium priority, but users cannot select or see priority. Add a low/medium/high select to create/edit, display priority on list/detail, then add priority sorting or filtering if it proves useful.

### 5. Complete tag assignment in the UI

**Value:** Medium  
**Effort:** Medium  
**Uses:** Existing tags, `todo_tags`, assignment endpoint, repeated form-key parsing, and validation tests.

The backend can replace a todo's tag assignments, but no todo screen displays the available or selected tags. Add tag selection to todo edit, show tags on todo detail/index, and link a tag to a filtered todo list.

Do not add a second tagging implementation. Use the existing replacement endpoint and relation.

### 6. Use the todo description field

**Value:** Medium  
**Effort:** Small  
**Uses:** Existing non-null `description` column, currently always written as an empty string.

Add description to create/edit/detail. This is straightforward, but due dates, projects, and tags improve organization more, so description should follow them.

## Later, After Completion Work

### 7. Turn the home page into a useful summary

**Value:** Medium to high  
**Effort:** Medium  
**Uses:** Existing todo statuses, due dates, projects, and list URLs.

Once due dates and projects work end to end, replace the static home page with a small dashboard:

- Due today
- Overdue
- Open todos
- Active projects
- Links into the corresponding filtered lists

Building this now would summarize incomplete data paths, so it should not precede the underlying workflows.

### 8. Add combined todo filters

**Value:** Medium  
**Effort:** Medium  
**Uses:** Existing index-action query validation, URL generation, pagination, project relation, tag relation, status, due date, and priority.

After project, tag, due date, and priority fields are exposed, extend the current todo index rather than creating separate pages. Preserve filter state through sorting and pagination as the existing index actions already do.

## Not Recommended Yet

- Bulk actions
- Saved searches or saved views
- Recurring tasks
- Notifications or reminders
- Collaboration, accounts, or permissions
- A generic dashboard/widget framework
- New controller/action abstractions

These require new concepts and infrastructure. They are lower leverage than completing the capabilities already represented in the schema and handlers.

## Product And Runtime Defects Found During Inspection

These are not feature proposals, but they should be fixed alongside the related work:

- Todo creation validates `dueAt` but always stores `due_at: null`.
- The layout hardcodes Vite assets at port `5173`; the inspected dev process selected `5174`, so application CSS/JS requests failed.
- `/projects/create` has a template and POST action but no GET route.
- Project routes are absent from the primary navigation.
- Tag assignment and project archive actions are backend-only from a user's perspective.

## Recommended Sequence

1. Fix due-date persistence and expose Due Today.
2. Complete project navigation, creation, and archive controls.
3. Assign todos to projects and show project todos.
4. Expose priority.
5. Expose tag assignment and tag-based filtering.
6. Expose descriptions.
7. Build the home summary from those completed workflows.

Each step leaves the product in a working state and reuses current tables, routes, validation, templates, and list infrastructure.
