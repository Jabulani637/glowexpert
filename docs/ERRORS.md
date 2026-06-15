# Error Handling (Observed)

There is no single global error handler in the inspected code; errors are returned by controllers/validation.

Common response patterns

## Zod validation failures
Routes using Zod `safeParse` return:
- `422`:
```json
{ "message": "Validation failed", "errors": { /* flattened zod errors */ } }
```

## Authentication failures
- `401` Invalid credentials
- `403` Account locked or admin access required

JWT-protected route errors depend on middleware implementation.

## Not found
- `404` JSON bodies like `{ "message": "Product not found" }`

## No content
- `204` for successful deletes (often with `res.status(204).send()`)

## Service unavailable
- `503` for database connection issues during login.


