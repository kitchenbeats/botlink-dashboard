import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { cookies } from 'next/headers'

/**
 * AES-GCM parameters
 * - 256-bit key
 * - 128-bit IV
 */
const ALGORITHM = 'aes-256-gcm'

// Cache parsed key
let encryptionKey: Buffer | null = null

/**
 * Get encryption key from environment
 * @throws {Error} If encryption key is not set
 */
function getKey(): Buffer {
  if (!encryptionKey) {
    const key = process.env.COOKIE_ENCRYPTION_KEY
    if (!key) throw new Error('COOKIE_ENCRYPTION_KEY must be set')
    encryptionKey = Buffer.from(key, 'base64')
  }
  return encryptionKey
}

/**
 * Encrypt a string using AES-256-GCM.
 */
function encrypt(value: string, secretKey: Buffer): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, secretKey, iv)

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Store iv, authTag, and encrypted data in a JSON string
  return JSON.stringify({
    iv: iv.toString('base64'),
    tag: authTag.toString('base64'),
    data: encrypted.toString('base64'),
  })
}

/**
 * Decrypt a previously encrypted string.
 */
function decrypt(encryptedJson: string, secretKey: Buffer): string {
  const { iv, tag, data } = JSON.parse(encryptedJson)

  const decipher = createDecipheriv(
    ALGORITHM,
    secretKey,
    Buffer.from(iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(tag, 'base64'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/**
 * Set an encrypted cookie.
 *
 * Usage:
 * ```ts
 * // Set environment variable:
 * // COOKIE_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
 *
 * await setEncryptedCookie('user-session', JSON.stringify({ userId: 123 }))
 * ```
 *
 * Note: If the encryption key is rotated, existing cookies will return null when
 * decrypted. Your application should handle this by reissuing cookies as needed.
 *
 * Example handling:
 * ```ts
 * async function getUserSession() {
 *   const session = await getEncryptedCookie('user-session')
 *   if (!session) {
 *     // Cookie missing or key was rotated, reissue session
 *     const newSession = await generateNewSession()
 *     await setEncryptedCookie('user-session', JSON.stringify(newSession))
 *     return newSession
 *   }
 *   return JSON.parse(session)
 * }
 * ```
 */
export async function setEncryptedCookie(
  cookieName: string,
  value: string,
  options?: Partial<{
    maxAge: number
    httpOnly: boolean
    secure: boolean
    path: string
    sameSite: boolean | 'strict' | 'lax' | 'none'
  }>
): Promise<void> {
  const encryptedValue = encrypt(value, getKey())
  const cookieStore = await cookies()

  cookieStore.set(cookieName, encryptedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    ...options,
  })
}

/**
 * Retrieve and decrypt a cookie.
 *
 * @returns Decrypted cookie value or null if cookie is missing, invalid,
 * or was encrypted with a different key
 */
export async function getEncryptedCookie(
  cookieName: string
): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(cookieName)?.value
  if (!raw) return null

  try {
    return decrypt(raw, getKey())
  } catch (error) {
    // If decryption fails (invalid or key changed), treat as invalid
    return null
  }
}
