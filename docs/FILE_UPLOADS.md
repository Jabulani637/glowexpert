# File Uploads

Uploads are handled using `multer`.

## Storage
- Upload destination used in admin products router:
  - `backend/src/uploads/` via `path.join(__dirname, '..', 'uploads')`

## Multer Limits
- `fileSize`: 5 MB per file
- `fileFilter`: only accepts mimetypes starting with `image/`

## Upload Fields
Admin products endpoints accept:
- `images` field with `upload.array('images', 10)`

Controller behavior
- Primary image becomes `image_url`
- Gallery array becomes `gallery_urls`
- When receiving `attributes` and `gallery_urls` as strings (common in FormData), the controller attempts JSON parsing.

## Static Serving
Backend serves uploads:
- `GET /uploads/<filename>`

via:
- `app.use('/uploads', express.static(uploadsDir))`


