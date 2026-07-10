/**
 * supabaseStorage.js
 * ------------------
 * Server-side only helper that uploads a Buffer to Supabase Storage
 * and returns the permanent public URL.
 *
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (never exposed to clients).
 * All uploads land in the bucket defined by SUPABASE_STORAGE_BUCKET.
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

// Build the service-role Supabase client once (module singleton).
const supabaseUrl  = process.env.SUPABASE_URL;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket       = process.env.SUPABASE_STORAGE_BUCKET || 'glowexpert-storage';

if (!supabaseUrl || !serviceKey) {
  console.warn(
    '[supabaseStorage] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'File uploads will fail until these are configured.'
  );
}

// Lazy singleton – created on first use so missing env vars only fail
// at upload time, not at startup (avoids crashing tests / local dev).
let _client = null;
function getClient() {
  if (_client) return _client;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use file uploads.'
    );
  }
  _client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });
  return _client;
}

/**
 * Upload a buffer to Supabase Storage.
 *
 * @param {Buffer}  buffer      - File data from multer memoryStorage
 * @param {string}  folder      - Destination folder inside the bucket (e.g. "products", "videos")
 * @param {string}  filename    - Unique filename including extension (e.g. "1720123456-xyz.webp")
 * @param {string}  mimeType    - MIME type of the file (e.g. "image/webp")
 * @returns {Promise<string>}   - Permanent public URL of the uploaded file
 */
async function uploadToSupabase(buffer, folder, filename, mimeType) {
  const supabase    = getClient();
  const storagePath = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true          // Overwrite if filename already exists
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Build permanent public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Silently ignores errors (non-blocking cleanup).
 *
 * @param {string} publicUrl - The full public URL previously returned by uploadToSupabase
 */
async function deleteFromSupabase(publicUrl) {
  if (!publicUrl) return;
  try {
    const supabase = getClient();
    // Extract the storage path from the full URL
    // URL shape: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const marker = `/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const storagePath = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(bucket).remove([storagePath]);
  } catch (err) {
    console.warn('[supabaseStorage] deleteFromSupabase error (non-fatal):', err.message);
  }
}

module.exports = { uploadToSupabase, deleteFromSupabase };
