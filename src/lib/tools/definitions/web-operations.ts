// ============================================================================
// WEB OPERATION TOOL DEFINITIONS
// ============================================================================

import type { Tool } from '../types';

/**
 * FETCH_URL - Fetch content from a URL
 */
export const fetchUrl: Tool = {
  definition: {
    name: 'fetch_url',
    description: 'Fetch and read content from a URL. Useful for reading documentation, GitHub files, or any web content.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch (must start with http:// or https://)',
        },
      },
      required: ['url'],
    },
  },
  handler: async (input, context) => {
    try {
      const { url } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for web operations',
        };
      }

      // Use curl to fetch URL
      const command = `curl -L -s "${url}"`;
      const result = await sandbox.commands.run(command);

      if (result.exitCode !== 0) {
        return {
          success: false,
          error: `Failed to fetch URL: ${result.stderr}`,
        };
      }

      return {
        success: true,
        data: {
          url,
          content: result.stdout,
          length: result.stdout.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch URL',
      };
    }
  },
};

/**
 * SEARCH_NPM - Search npm packages and get package info
 */
export const searchNpm: Tool = {
  definition: {
    name: 'search_npm',
    description: 'Search npm registry for packages and get detailed package information including versions, dependencies, and README.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Package name to search for (e.g., "react", "next")',
        },
        exact: {
          type: 'boolean',
          description: 'If true, get exact package info. If false, search for packages.',
        },
      },
      required: ['query'],
    },
  },
  handler: async (input, context) => {
    try {
      const { query, exact = true } = input as { query: string; exact?: boolean };
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for npm operations',
        };
      }

      if (exact) {
        // Get exact package info
        const command = `curl -s https://registry.npmjs.org/${query}`;
        const result = await sandbox.commands.run(command);

        if (result.exitCode !== 0) {
          return {
            success: false,
            error: 'Package not found',
          };
        }

        const packageData = JSON.parse(result.stdout);
        const latestVersion = packageData['dist-tags']?.latest;
        const latestInfo = packageData.versions?.[latestVersion];

        return {
          success: true,
          data: {
            name: packageData.name,
            description: packageData.description,
            latestVersion,
            homepage: packageData.homepage,
            repository: packageData.repository?.url,
            keywords: packageData.keywords,
            dependencies: latestInfo?.dependencies || {},
            peerDependencies: latestInfo?.peerDependencies || {},
          },
        };
      } else {
        // Search for packages
        const command = `curl -s "https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5"`;
        const result = await sandbox.commands.run(command);

        if (result.exitCode !== 0) {
          return {
            success: false,
            error: 'Search failed',
          };
        }

        const searchResults = JSON.parse(result.stdout);

        return {
          success: true,
          data: {
            results: searchResults.objects.map((obj: { package: { name: string; version: string; description: string; keywords: string[] } }) => ({
              name: obj.package.name,
              version: obj.package.version,
              description: obj.package.description,
              keywords: obj.package.keywords,
            })),
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search npm',
      };
    }
  },
};

/**
 * READ_GITHUB_FILE - Read a file from a public GitHub repository
 */
export const readGithubFile: Tool = {
  definition: {
    name: 'read_github_file',
    description: 'Read a file from a public GitHub repository. Useful for reading examples, documentation, or source code.',
    parameters: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository in format "owner/repo" (e.g., "vercel/next.js")',
        },
        path: {
          type: 'string',
          description: 'Path to file in repository (e.g., "examples/basic/package.json")',
        },
        branch: {
          type: 'string',
          description: 'Branch name (defaults to "main")',
        },
      },
      required: ['repo', 'path'],
    },
  },
  handler: async (input, context) => {
    try {
      const { repo, path, branch = 'main' } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for GitHub operations',
        };
      }

      // Use GitHub raw content URL
      const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
      const command = `curl -L -s "${url}"`;
      const result = await sandbox.commands.run(command);

      if (result.exitCode !== 0 || result.stdout.includes('404: Not Found')) {
        return {
          success: false,
          error: 'File not found in repository',
        };
      }

      return {
        success: true,
        data: {
          repo,
          path,
          branch,
          content: result.stdout,
          url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read GitHub file',
      };
    }
  },
};

/**
 * WEB_SEARCH - Search the web for information
 * Uses DuckDuckGo's instant answer API (no API key needed)
 */
export const webSearch: Tool = {
  definition: {
    name: 'web_search',
    description: 'Search the web for information, documentation, tutorials, or solutions. Returns relevant results with URLs.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "Next.js 15 app router tutorial", "React 19 use hook")',
        },
      },
      required: ['query'],
    },
  },
  handler: async (input, context) => {
    try {
      const { query } = input as { query: string };
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for web search',
        };
      }

      // Use DuckDuckGo instant answer API
      const encodedQuery = encodeURIComponent(query);
      const command = `curl -s "https://api.duckduckgo.com/?q=${encodedQuery}&format=json"`;
      const result = await sandbox.commands.run(command);

      if (result.exitCode !== 0) {
        return {
          success: false,
          error: 'Search failed',
        };
      }

      const data = JSON.parse(result.stdout);

      // Extract useful information
      const results = {
        abstract: data.Abstract || '',
        abstractSource: data.AbstractSource || '',
        abstractURL: data.AbstractURL || '',
        relatedTopics: data.RelatedTopics?.slice(0, 5).map((topic: { Text?: string; FirstURL?: string }) => ({
          text: topic.Text || '',
          url: topic.FirstURL || '',
        })) || [],
      };

      return {
        success: true,
        data: {
          query,
          results,
          suggestion: 'Use fetch_url to read the most relevant URL from the results.',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform web search',
      };
    }
  },
};

/**
 * SEARCH_DOCS - Search common documentation sites
 * Pre-configured for Next.js, React, TypeScript, etc.
 */
export const searchDocs: Tool = {
  definition: {
    name: 'search_docs',
    description: 'Search official documentation sites for Next.js, React, TypeScript, Node.js, and more. Gets direct links to relevant docs.',
    parameters: {
      type: 'object',
      properties: {
        library: {
          type: 'string',
          description: 'Which library to search',
          enum: ['nextjs', 'react', 'typescript', 'nodejs', 'tailwind', 'vercel'],
        },
        query: {
          type: 'string',
          description: 'What to search for (e.g., "app router", "useState", "types")',
        },
      },
      required: ['library', 'query'],
    },
  },
  handler: async (input) => {
    try {
      const { library, query } = input as { library: string; query: string };

      // Map of documentation sites
      const docSites: Record<string, string> = {
        nextjs: 'https://nextjs.org/docs',
        react: 'https://react.dev',
        typescript: 'https://www.typescriptlang.org/docs',
        nodejs: 'https://nodejs.org/docs',
        tailwind: 'https://tailwindcss.com/docs',
        vercel: 'https://vercel.com/docs',
      };

      const baseUrl = docSites[library] || docSites['react'];

      return {
        success: true,
        data: {
          library,
          query,
          docUrl: baseUrl,
          searchUrl: `${baseUrl}/search?q=${encodeURIComponent(query)}`,
          suggestion: `Visit ${baseUrl} and search for "${query}". Use the fetch_url tool to read specific documentation pages.`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search docs',
      };
    }
  },
};
