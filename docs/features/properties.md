# Property Management — Frontend Feature Specification

**Status:** Implemented

## Actors

- admin
- manager

The current property page checks `isAtLeastManager` for access, while destructive/admin-only behavior is still ultimately enforced by the backend. fileciteturn6file3

## Route

```text
/admin/properties
```

## Current actions

- list properties
- create property
- edit property
- delete property
- upload images
- list images
- delete images

Current property API helper:

```text
GET    /api/properties
POST   /api/properties
PATCH  /api/properties/:id
DELETE /api/properties/:id
GET    /api/properties/:id/images
POST   /api/properties/:id/images
DELETE /api/properties/:id/images/:documentId
```

The API helper uses the same-origin Next.js route handlers. fileciteturn6file17turn6file18

## Property fields

Current frontend model:

- `name`
- `address`
- `description`
- `status`: `vacant | occupied`
- `is_active`
- `manager_id`
- timestamps
- optional image URLs

Create requires name/address/status; description is optional.

## List UX

Properties are displayed in a table with:

- property name
- address
- status badge
- active badge
- actions

The current UI distinguishes Vacant and Occupied visually. fileciteturn6file3

## Image UX

The current upload component supports:

- file picker
- drag and drop
- image-only filtering
- pending file display
- existing image display
- removal of pending files
- deletion of existing images
- uploading state

Existing image deletion is handled through the document-backed image API. fileciteturn5file7turn5file14

## Acceptance criteria

- Manager/admin can load properties.
- User sees explicit loading and failure states.
- Create validates required fields before submission.
- Edit preserves unchanged values.
- Delete requires confirmation.
- Image uploads use multipart requests.
- Non-image files are not accepted by the image drop zone.
- Existing image deletion does not crash the form on API failure.
- Backend authorization failures are displayed rather than hidden.

## Tests

Maintain:

- page access/role tests
- list success/failure
- create
- edit
- delete
- image upload
- existing-image delete
- pending-file removal
- empty-image state
- API helper status handling

The current suite already contains substantial `PropertyForm` coverage. fileciteturn5file14
