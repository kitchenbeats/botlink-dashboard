const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(uuid: string | undefined | null): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  return UUID_REGEX.test(uuid);
}

export function validateUUID(uuid: string | undefined | null, paramName: string = 'ID'): string {
  if (!isValidUUID(uuid)) {
    throw new Error(`Invalid ${paramName}: must be a valid UUID`);
  }
  return uuid as string;
}
