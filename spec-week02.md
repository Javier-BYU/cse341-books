# Week 02 API Spec
  
## Books API Week 02 Spec - Version 1
 
### Feature 1: Book CRUD Operations and Author References
 
#### Goal
Update the existing Week 01 book API so book documents include a reference to an author and the API supports all CRUD operations for books. Every book route must be documented and testable in Swagger.
 
#### Data Model
Book documents will be stored in the `books` collection.
 
Required book fields:
- `id`: string, required, custom id such as `b1`
- `authorId`: string, required, references the `id` field of an author document
- `title`: string, required
- `publicationDate`: string, required
Books will continue to use custom string ids instead of MongoDB `_id` values for route parameters.
 
#### Relationship to Authors
Each book will identify its author with an `authorId` field. The value of `authorId` must match the custom `id` value of an existing author document.
 
When creating or updating a book, the API should reject the request with a `400` status code if the submitted `authorId` does not match an existing author.
 
#### Routes
 
##### GET /books
Purpose: Return all books.
 
Success:
- Status code: `200`
- Response body: an array of book objects
Errors:
- `500` if an unexpected server or database error occurs
##### GET /books/:id
Purpose: Return one book by its custom id.
 
Success:
- Status code: `200`
- Response body: the matching book object
Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs
##### POST /books
Purpose: Create a new book.
 
Request body:
 
```json
{
  "id": "b4",
  "authorId": "a1",
  "title": "Example Book Title",
  "publicationDate": "2026-01-15"
}
```
 
Success:
- Status code: `201`
- Response body: the newly created book object
Errors:
- `400` if a required field is missing
- `400` if the `id` already exists
- `400` if the `authorId` does not match an existing author
- `500` if an unexpected server or database error occurs
##### PUT /books/:id
Purpose: Update an existing book.
 
Request body:
 
```json
{
  "authorId": "a2",
  "title": "Updated Book Title",
  "publicationDate": "2026-02-20"
}
```
 
Success:
- Status code: `200`
- Response body: the updated book object
Errors:
- `400` if a required field is missing
- `400` if the `authorId` does not match an existing author
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs
##### DELETE /books/:id
Purpose: Delete an existing book.
 
Success:
- Status code: `204`
- Response body: none
Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs
#### Swagger Documentation
Swagger must document every book route.
 
#### Deployment Expectations
After implementation, the book routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every book route from the browser.
 

 
### Feature 2: Author CRUD Operations
 
#### Goal
Add an `authors` collection to the API with full CRUD operations. Authors are referenced by books through the `authorId` field. Every author route must be documented and testable in Swagger.
 
#### Data Model
Author documents will be stored in the `authors` collection.
 
Required author fields:
- `id`: string, required, custom id such as `a1`
- `name`: string, required, the author's full name
- `birthYear`: number, required, the four-digit year the author was born (for example `1965`)
Authors use custom string ids instead of MongoDB `_id` values for route parameters, the same approach used for books.
 
#### Relationship to Books
One author can have many books. Each book points to its author through `authorId`. An author cannot be deleted while any book still references it (see `DELETE /authors/:id`).
 
#### Routes
 
##### GET /authors
Purpose: Return all authors.
 
Success:
- Status code: `200`
- Response body: an array of author objects
Errors:
- `500` if an unexpected server or database error occurs
##### GET /authors/:id
Purpose: Return one author by custom id.
 
Success:
- Status code: `200`
- Response body: the matching author object
Errors:
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs
##### POST /authors
Purpose: Create a new author.
 
Request body:
 
```json
{
  "id": "a4",
  "name": "Example Author",
  "birthYear": 1970
}
```
 
Success:
- Status code: `201`
- Response body: the newly created author object
Errors:
- `400` if a required field is missing
- `400` if `birthYear` is not a number
- `400` if the `id` already exists
- `500` if an unexpected server or database error occurs
##### PUT /authors/:id
Purpose: Update an existing author.
 
Request body:
 
```json
{
  "name": "Updated Author Name",
  "birthYear": 1971
}
```
 
Success:
- Status code: `200`
- Response body: the updated author object
Errors:
- `400` if a required field is missing
- `400` if `birthYear` is not a number
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs
##### DELETE /authors/:id
Purpose: Delete an existing author.
 
Success:
- Status code: `204`
- Response body: none
Errors:
- `400` if one or more books still reference this author
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs
#### Swagger Documentation
Swagger must document every author route.
 
#### Deployment Expectations
After implementation, the author routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every author route from the browser.
 
---
 
# PART B — EVALUATION OF VERSION 1
 
Questions asked (to myself and to AI):
 
1. Are there any bugs or short-sighted decisions in this specification?
2. Are there any security considerations that are missing?
3. Are there any efficiency concerns with the current endpoint design?
4. Are any response examples or error behaviors unclear?
Summary of findings:
 
**Bugs / short-sighted decisions**
- A duplicate `id` returns `400`, but it is a conflict with existing data, so `409 Conflict` describes it better.
- Nothing says what happens when `PUT` includes an `id` in the body that differs from the one in the URL.
- Nothing prevents extra or unknown fields from being stored.
- "Required field is missing" does not cover empty strings, wrong types or wrong formats (`publicationDate` is just "a string").
- Deleting an author who has books is `400`, but it is a state conflict, so `409` fits better.
- Check-then-insert for duplicate ids has a race condition unless the database enforces uniqueness.
- `PUT` semantics are not stated (full replacement vs. partial update).
**Security**
- Input must be validated and type-checked (strings only) so objects like `{"$ne": null}` cannot reach MongoDB queries (NoSQL injection).
- No limit on request body size or string length.
- Write routes (POST/PUT/DELETE) are public; this is acceptable for the assignment but should be documented as a known limitation.
- Error responses must not leak stack traces or database details.
- MongoDB `_id` and internal fields should never be returned.
**Efficiency**
- `GET /books` and `GET /authors` return everything with no pagination.
- Looking up by custom `id`, checking author existence and checking "does this author have books" all need indexes (`id` unique on both collections, `authorId` on books).
- Existence and book-count checks should use `findOne` / `countDocuments` with a limit, not load full lists.
**Unclear responses**
- Error response body format is never defined.
- Success examples for responses are not shown.
- Swagger requirements do not say which responses and schemas must be documented.
---
 
# PART C — VERSION 2 (Implementation Checklist)
 
## Books API Week 02 Spec - Version 2
 
### Global Rules (apply to books and authors)
 
- **Content type:** all requests and responses use `application/json` (except `204`, which has no body).
- **Ids:** custom string ids. Format: books `^b[0-9]+$` (e.g. `b1`), authors `^a[0-9]+$` (e.g. `a1`). Max length 20.
- **Never expose** MongoDB `_id` or any internal field. Responses contain only the documented fields.
- **Error body format** (all `4xx` and `5xx`):
```json
{
  "error": "Short human-readable message"
}
```
 
  For validation failures, `details` is added:
 
```json
{
  "error": "Validation failed",
  "details": ["title is required", "publicationDate must be in YYYY-MM-DD format"]
}
```
 
- **500 errors** return `{ "error": "Internal server error" }` only. No stack traces or database messages are sent to the client; the real error is logged on the server.
- **Validation rules for all bodies:**
  - All strings are trimmed; empty or whitespace-only strings count as missing.
  - Values must have the documented type (a string field receiving an object, array or number is a `400`).
  - Unknown fields are rejected with `400`.
  - Request body size limit: 10 KB.
- **Status code conventions:**
  - `400` invalid input (missing/empty/wrong type/wrong format, unknown field, id mismatch, `authorId` not found)
  - `404` resource in the URL does not exist
  - `409` conflict with existing data (duplicate id, author still has books)
  - `500` unexpected server or database error
- **Database indexes:**
  - `books.id`: unique
  - `books.authorId`: non-unique (for the author-delete check and filtering)
  - `authors.id`: unique
- **PUT semantics:** `PUT` is a full replacement of the editable fields. All editable fields are required. The `id` can never change.
- **Known limitation:** write routes are not authenticated in Week 02. Authentication is out of scope for this assignment.
---
 
### Feature 1: Book CRUD Operations and Author References (V2)
 
#### Goal
Extend the Week 01 books API with a reference to an author and complete CRUD. Every book route must be documented and testable in Swagger.
 
#### Data Model
Collection: `books`
 
| Field | Type | Required | Rules |
|---|---|---|---|
| `id` | string | yes | custom id, pattern `^b[0-9]+$`, unique, immutable |
| `authorId` | string | yes | pattern `^a[0-9]+$`, must match the `id` of an existing author |
| `title` | string | yes | 1–200 characters after trimming |
| `publicationDate` | string | yes | format `YYYY-MM-DD`, must be a real calendar date |
 
Example document:
 
```json
{
  "id": "b1",
  "authorId": "a1",
  "title": "Example Book Title",
  "publicationDate": "2026-01-15"
}
```
 
#### Routes
 
##### GET /books
Purpose: Return books.
 
Optional query parameters:
- `authorId` (string): return only books by that author. If no books match, return `[]` (not `404`).
- `limit` (integer, 1–100, default 50)
- `skip` (integer, ≥ 0, default 0)
Results are sorted by `id` ascending so pagination is stable.
 
Success:
- `200` — array of book objects (possibly empty)
```json
[
  { "id": "b1", "authorId": "a1", "title": "Example Book Title", "publicationDate": "2026-01-15" }
]
```
 
Errors:
- `400` if `limit` or `skip` is invalid
- `500` unexpected error
##### GET /books/:id
Purpose: Return one book.
 
Success:
- `200` — the matching book object
Errors:
- `404` `{ "error": "Book not found" }`
- `500` unexpected error
##### POST /books
Purpose: Create a book.
 
Request body (all four fields required):
 
```json
{
  "id": "b4",
  "authorId": "a1",
  "title": "Example Book Title",
  "publicationDate": "2026-01-15"
}
```
 
Success:
- `201` — the created book object
- Header: `Location: /books/b4`
Errors:
- `400` missing, empty, wrongly typed or wrongly formatted field, or unknown field
- `400` `authorId` does not match an existing author (`{ "error": "Author not found for authorId" }`)
- `409` a book with this `id` already exists
- `500` unexpected error
The unique index on `id` is the final guard: if the database reports a duplicate key error, the API returns `409`.
 
##### PUT /books/:id
Purpose: Replace the editable fields of an existing book.
 
Request body (all three fields required; `id` must NOT be in the body, or if present must equal the URL id):
 
```json
{
  "authorId": "a2",
  "title": "Updated Book Title",
  "publicationDate": "2026-02-20"
}
```
 
Success:
- `200` — the updated book object
Errors:
- `400` missing, empty, wrongly typed or wrongly formatted field, or unknown field
- `400` body `id` differs from URL `id`
- `400` `authorId` does not match an existing author
- `404` no book with that id
- `500` unexpected error
Order of checks: validate body → check book exists (`404`) → check author exists (`400`) → update.
 
##### DELETE /books/:id
Purpose: Delete a book.
 
Success:
- `204` — no body
Errors:
- `404` no book with that id
- `500` unexpected error
Deleting a book never affects the author.
 
#### Swagger Documentation
- Every book route has a `summary`, `description`, `tags: ["Books"]`, parameter definitions (path and query), and a request body schema where applicable.
- Reusable schemas: `Book` (full object), `BookInput` (POST), `BookUpdate` (PUT), `Error`, `ValidationError`.
- Every documented response code above (success and error) appears in Swagger with its schema and at least one example.
- Request body examples in Swagger use ids that exist in the seed data so "Try it out" works without edits.
#### Deployment Expectations
Book routes work locally and on Render. The deployed `/api-docs` page lets someone test every book route from the browser, using the Render server URL (not `localhost`).
 
---
 
### Feature 2: Author CRUD Operations (V2)
 
#### Goal
Add an `authors` collection with complete CRUD. Authors are referenced by books through `authorId`. Every author route must be documented and testable in Swagger.
 
#### Data Model
Collection: `authors`
 
| Field | Type | Required | Rules |
|---|---|---|---|
| `id` | string | yes | custom id, pattern `^a[0-9]+$`, unique, immutable |
| `name` | string | yes | 1–100 characters after trimming |
| `birthYear` | integer | yes | whole number, 1 ≤ `birthYear` ≤ current year |
 
Example document:
 
```json
{
  "id": "a1",
  "name": "Example Author",
  "birthYear": 1965
}
```
 
#### Relationship to Books
One author has zero or more books. An author with at least one book cannot be deleted.
 
#### Routes
 
##### GET /authors
Purpose: Return authors.
 
Optional query parameters: `limit` (1–100, default 50), `skip` (≥ 0, default 0). Sorted by `id` ascending.
 
Success:
- `200` — array of author objects (possibly empty)
```json
[
  { "id": "a1", "name": "Example Author", "birthYear": 1965 }
]
```
 
Errors:
- `400` invalid `limit` or `skip`
- `500` unexpected error
##### GET /authors/:id
Purpose: Return one author.
 
Success:
- `200` — the matching author object
Errors:
- `404` `{ "error": "Author not found" }`
- `500` unexpected error
##### POST /authors
Purpose: Create an author.
 
Request body (all three fields required):
 
```json
{
  "id": "a4",
  "name": "Example Author",
  "birthYear": 1970
}
```
 
Success:
- `201` — the created author object
- Header: `Location: /authors/a4`
Errors:
- `400` missing, empty, wrongly typed (e.g. `birthYear` as a string), out-of-range, or unknown field
- `409` an author with this `id` already exists
- `500` unexpected error
##### PUT /authors/:id
Purpose: Replace the editable fields of an existing author.
 
Request body (both fields required; `id` must not be in the body, or must equal the URL id):
 
```json
{
  "name": "Updated Author Name",
  "birthYear": 1971
}
```
 
Success:
- `200` — the updated author object
Errors:
- `400` missing, empty, wrongly typed, out-of-range, or unknown field
- `400` body `id` differs from URL `id`
- `404` no author with that id
- `500` unexpected error
##### DELETE /authors/:id
Purpose: Delete an author who has no books.
 
Behavior when books still reference the author: the delete is **rejected** and nothing is changed (no cascade delete, no orphaned books).
 
Success:
- `204` — no body
Errors:
- `404` no author with that id
- `409` `{ "error": "Author cannot be deleted because one or more books reference it" }`
- `500` unexpected error
Implementation note: check for referencing books with `countDocuments({ authorId: id }, { limit: 1 })` (or `findOne`) before deleting; the `books.authorId` index keeps this fast.
 
#### Swagger Documentation
- Every author route has a `summary`, `description`, `tags: ["Authors"]`, parameter definitions, and request body schema where applicable.
- Reusable schemas: `Author`, `AuthorInput`, `AuthorUpdate`, plus the shared `Error` and `ValidationError`.
- Every documented response code (including `409` on `DELETE`) appears with schema and example.
- Examples use ids from the seed data.
#### Deployment Expectations
Author routes work locally and on Render. The deployed `/api-docs` page lets someone test every author route from the browser.
 
---
 
