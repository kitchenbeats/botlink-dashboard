import { useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Configuration object for a shareable state parameter
 * @template T The type of the state value
 */
type StateConfig<T> = {
  /** The URL parameter key to use for this state */
  key: string;
  /** Function to parse the string value from URL into the state type */
  parser: (value: string) => T;
  /** Function to serialize the state value to string for URL sharing */
  serializer: (value: T) => string;
};

/**
 * Helper type to create a record from array of state configs
 */
type ConfigToRecord<T extends readonly StateConfig<any>[]> = {
  [K in T[number]["key"]]: ReturnType<Extract<T[number], { key: K }>["parser"]>;
};

/**
 * Helper type for the share function parameters
 */
type ShareParams<T extends readonly StateConfig<any>[]> = Partial<{
  [K in T[number]["key"]]: Parameters<
    Extract<T[number], { key: K }>["serializer"]
  >[0];
}>;

type ShareableState<TConfigs extends readonly StateConfig<any>[]> = {
  /** Array of state configurations defining how to serialize/deserialize each state */
  configs: TConfigs & { readonly length: number };
  /** Callback function that receives the parsed state from URL parameters */
  onParams: (params: Partial<ConfigToRecord<TConfigs>>) => void;
};

/**
 * Hook for creating shareable application state through URLs
 *
 * @description
 * This hook provides a complete solution for state sharing via URLs by:
 * 1. Reading and applying state from URL parameters on initial load
 * 2. Automatically cleaning up URL parameters after reading
 * 3. Providing a type-safe function to generate shareable URLs with encoded state
 *
 * It's particularly useful for:
 * - Creating shareable views (e.g., filtered/sorted tables)
 * - Implementing deep links with specific application state
 * - Enabling state transfer through URL parameters
 * - Bookmarkable application states
 *
 * @example
 * ```typescript
 * const { getShareableUrl } = useShareableState({
 *   configs: [
 *     {
 *       key: "sort",
 *       parser: (value: string) => JSON.parse(value),
 *       serializer: (value: SortingState) => JSON.stringify(value),
 *     },
 *   ] as const,
 *   onParams: ({ sort }) => {
 *     if (sort) setSorting(sort);
 *   },
 * });
 *
 * // Later: Create a shareable URL
 * const url = getShareableUrl({ sort: currentSortState });
 * ```
 *
 * @returns An object containing the getShareableUrl function for creating shareable URLs
 */
export function useShareableState<
  const TConfigs extends readonly StateConfig<any>[],
>({ configs, onParams }: ShareableState<TConfigs>) {
  const searchParams = useSearchParams();

  // Read and apply state from URL on mount
  useEffect(() => {
    const params: Partial<ConfigToRecord<TConfigs>> = {};
    let hasParams = false;

    for (const config of configs) {
      const value = searchParams.get(config.key);
      if (value) {
        hasParams = true;
        try {
          const parsedValue = config.parser(decodeURIComponent(value));
          params[config.key as keyof typeof params] = parsedValue;
        } catch (error) {
          console.debug(
            `Failed to parse value for key "${config.key}":`,
            error,
          );
        }
      }
    }

    if (hasParams) {
      onParams(params);

      // Clean up URL after reading parameters
      const newSearchParams = new URLSearchParams(searchParams.toString());
      configs.forEach((config) => newSearchParams.delete(config.key));

      // Update the URL without reloading the page
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`,
      );
    }
  }, []);

  /**
   * Creates a shareable URL with the provided state encoded in query parameters
   * @param params The state values to encode in the URL
   * @returns A URL string containing the encoded state
   */
  const getShareableUrl = useCallback(
    (params: ShareParams<TConfigs>) => {
      const url = new URL(window.location.href);

      // Preserve existing query parameters that aren't part of our configs
      const newSearchParams = new URLSearchParams(searchParams.toString());
      configs.forEach((config) => newSearchParams.delete(config.key));

      // Add our state parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          const config = configs.find((c) => c.key === key);
          if (config) {
            const serialized = config.serializer(value);
            newSearchParams.set(key, encodeURIComponent(serialized));
          }
        }
      });

      url.search = newSearchParams.toString();

      return url.toString();
    },
    [configs, searchParams],
  );

  return { getShareableUrl };
}
