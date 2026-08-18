# PropNest Frontend — Components and UI

## 15. Component Architecture

Components are currently grouped into two broad categories.

### Layout components

Examples:

```text
AdminNav
LogoutButton
```

These compose page-level application structure and session actions.

### UI components

Examples:

```text
Button
Input
Label
Select
Dialog
Table
Alert
Card
Badge
Avatar
Tooltip
...
```

The UI layer is based largely on shadcn/Base UI primitives.

Feature-specific components such as:

```text
PropertyForm
UserForm
ImageUploadZone
```

sit alongside generic UI primitives.

This is reasonable while the project remains small.

---


## 16. Styling Architecture

Styling is based on:

- Tailwind CSS 4
- CSS variables
- shadcn/Base UI component styles
- `cn()` helper using `clsx` and `tailwind-merge`

The main stylesheet defines design tokens through CSS variables.

The frontend currently mixes:

- shared CSS variables/tokens
- utility classes
- some explicit brand colors

The PropNest brand color is currently represented directly in UI classes in places such as navigation and login.

As the application grows, those brand values should eventually be promoted into shared design tokens.

---


## 13. Property Feature

The property feature currently provides:

- list
- create
- update
- delete
- image upload
- image listing
- image deletion

Image operations are routed through the document API on the backend while the frontend presents them as property images.

Current flow:

```text
Property UI
  |
  +--> properties API
  |
  +--> image API
          |
          v
      Next.js route handler
          |
          v
      document backend endpoint
```

This is a useful example of the frontend adapting backend domain boundaries into a UI-oriented feature.

---


## 14. User Management Feature

The current admin UI includes user management and a reusable `UserForm`.

The form supports:

### Create

- full name
- username
- email
- password
- role
- active state

### Edit

Only changed fields are submitted.

For example:

```text
Existing user
   |
   | change full name only
   v
PATCH payload
{ full_name: "..." }
```

This is preferable to sending an entire resource representation for partial updates.

---


## 17. Contract Feature

The contract feature currently provides:

- list
- create
- update
- delete

A Contract associates a `Property` and a `Tenant` for a rental period. Edit-mode PATCH payloads only include changed fields, following the same partial-update pattern as Properties and Users.

The tenant field is presented as a searchable combobox filtered by tenant full name rather than a raw UUID input field, since a tenant's identifier is not something an admin user would know from memory.

---


## 18. Tenant Feature

The tenant feature currently provides:

- list
- create
- update
- delete

Tenant records are referenced by the Contract feature (via the combobox described above) but remain UI-agnostic of Lease/Billing associations — those consume Tenant references, not the reverse.

---

