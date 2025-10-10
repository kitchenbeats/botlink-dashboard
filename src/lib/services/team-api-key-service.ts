import { getDb } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'base64');
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Service to manage team API keys (encrypted E2B keys)
 */
export class TeamApiKeyService {
  /**
   * Get the API key for a team
   * @param teamId The team's UUID
   * @returns The E2B API key
   */
  static async getTeamApiKey(teamId: string): Promise<string> {
    const db = await getDb();

    console.log('[TeamApiKeyService] Fetching API key for team:', teamId);

    // Get the encrypted key directly (for now it's just base64 encoded)
    const { data, error } = await db
      .from('team_api_keys')
      .select('api_key_encrypted')
      .eq('team_id', teamId)
      .limit(1)
      .single();

    if (error) {
      console.error('[TeamApiKeyService] Error fetching API key:', error);
      throw new Error(`Failed to get team API key: ${error.message}`);
    }

    if (!data || !data.api_key_encrypted) {
      console.error('[TeamApiKeyService] No API key found for team:', teamId);
      throw new Error(`No API key found for team ${teamId}`);
    }

    // Decrypt the stored key (now stored as plain text)
    const apiKey = decrypt(data.api_key_encrypted);

    console.log('[TeamApiKeyService] Successfully retrieved API key for team:', teamId);
    console.log('[TeamApiKeyService] API key prefix:', apiKey.substring(0, 8) + '...');

    return apiKey;
  }

  /**
   * Create an API key for a team
   * @param teamId The team's UUID
   */
  static async createTeamApiKey(teamId: string): Promise<void> {
    // Use service role to bypass RLS
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate E2B API key
    const apiKeyHex = crypto.randomBytes(20).toString('hex');
    const rawApiKey = `e2b_${apiKeyHex}`;

    // Calculate SHA256 hash for the key
    const apiKeyHash = '$sha256$' + crypto.createHash('sha256')
      .update(Buffer.from(apiKeyHex, 'hex'))
      .digest('base64')
      .replace(/=+$/, '');

    // Encrypt and store the API key
    const encryptedKey = encrypt(rawApiKey);

    const { error: insertError } = await serviceClient
      .from('team_api_keys')
      .insert({
        team_id: teamId,
        api_key_encrypted: encryptedKey,
        api_key_hash: apiKeyHash,
        api_key_prefix: 'e2b_',
        api_key_length: 40,
        api_key_mask_prefix: apiKeyHex.substring(0, 2),
        api_key_mask_suffix: apiKeyHex.substring(36, 40),
      });

    if (insertError) {
      throw new Error(`Failed to insert API key: ${insertError.message}`);
    }

    console.log('[TeamApiKeyService] API key created for team:', teamId);
  }
}
