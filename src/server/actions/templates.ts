"use server";

import type {
  E2BTemplate,
  CreateE2BTemplateRequest,
  UpdateE2BTemplateRequest,
} from "@/lib/types/database";

const E2B_API_URL = process.env.E2B_API_URL || "https://api.ledgai.com";
const E2B_API_KEY = process.env.E2B_API_KEY;

if (!E2B_API_KEY) {
  console.warn("E2B_API_KEY not set in environment variables");
}

/**
 * List all available E2B templates
 */
export async function listTemplates(): Promise<E2BTemplate[]> {
  if (!E2B_API_KEY) {
    throw new Error("E2B_API_KEY not configured");
  }

  const response = await fetch(`${E2B_API_URL}/templates`, {
    headers: {
      Authorization: `Bearer ${E2B_API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list templates: ${error}`);
  }

  return response.json();
}

/**
 * Get a specific template by ID or alias
 */
export async function getTemplate(idOrAlias: string): Promise<E2BTemplate> {
  if (!E2B_API_KEY) {
    throw new Error("E2B_API_KEY not configured");
  }

  const response = await fetch(`${E2B_API_URL}/templates/${idOrAlias}`, {
    headers: {
      Authorization: `Bearer ${E2B_API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get template: ${error}`);
  }

  return response.json();
}

/**
 * Create a new E2B template
 */
export async function createTemplate(
  request: CreateE2BTemplateRequest
): Promise<E2BTemplate> {
  if (!E2B_API_KEY) {
    throw new Error("E2B_API_KEY not configured");
  }

  const response = await fetch(`${E2B_API_URL}/v2/templates`, {
    method: "POST",
    headers: {
      "X-API-Key": E2B_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create template: ${error}`);
  }

  return response.json();
}

/**
 * Update an existing template (public, isSystem, etc.)
 */
export async function updateTemplate(
  idOrAlias: string,
  request: UpdateE2BTemplateRequest
): Promise<E2BTemplate> {
  if (!E2B_API_KEY) {
    throw new Error("E2B_API_KEY not configured");
  }

  const response = await fetch(`${E2B_API_URL}/templates/${idOrAlias}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${E2B_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update template: ${error}`);
  }

  return response.json();
}

/**
 * Delete a template
 */
export async function deleteTemplate(idOrAlias: string): Promise<void> {
  if (!E2B_API_KEY) {
    throw new Error("E2B_API_KEY not configured");
  }

  const response = await fetch(`${E2B_API_URL}/templates/${idOrAlias}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${E2B_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete template: ${error}`);
  }
}

/**
 * List only system templates (curated by platform)
 */
export async function listSystemTemplates(): Promise<E2BTemplate[]> {
  const templates = await listTemplates();
  return templates.filter((t) => t.isSystem === true);
}

/**
 * List user-created templates (not system)
 */
export async function listUserTemplates(): Promise<E2BTemplate[]> {
  const templates = await listTemplates();
  return templates.filter((t) => t.isSystem !== true);
}
