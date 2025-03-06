import { Storage } from '@google-cloud/storage'

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
      /\\n/g,
      '\n'
    ),
  },
})

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME)

/**
 * Upload a file to GCP Storage
 * @param fileBuffer - The file buffer to upload
 * @param destination - The destination path in the bucket
 * @param contentType - The content type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  fileBuffer: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  const file = bucket.file(destination)

  await file.save(fileBuffer, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  })

  return `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${destination}`
}

/**
 * Delete a file from GCP Storage
 * @param filePath - The path of the file in the bucket
 */
export async function deleteFile(filePath: string): Promise<void> {
  const file = bucket.file(filePath)
  await file.delete()
}

/**
 * Get a signed URL for a file (for temporary access)
 * @param filePath - The path of the file in the bucket
 * @param expiresInMinutes - How long the URL should be valid for (in minutes)
 * @returns The signed URL
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes = 15
): Promise<string> {
  const file = bucket.file(filePath)

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  })

  return url
}

export { bucket, storage }
