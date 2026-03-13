import pLimit from "p-limit";
import type {
  NPMPackage,
  NpxFinderOptions,
  SearchResponse,
  PackageInfo,
  LatestVersionInfo,
  Logger,
} from "./types";

class RetryableError extends Error {
  retryAfter?: number;
  constructor(message: string, retryAfter?: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}

async function fetchWithRetry(
  url: string,
  options: NpxFinderOptions = {}
): Promise<unknown> {
  const { timeout = 10000, retries = 3, retryDelay = 1000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const retryAfter =
          response.status === 429
            ? parseRetryAfter(response.headers.get("Retry-After"))
            : undefined;
        throw new RetryableError(
          `HTTP error! status: ${response.status}`,
          retryAfter
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const backoff = retryDelay * Math.pow(2, attempt);
        const delay =
          error instanceof RetryableError &&
          error.retryAfter != null &&
          error.retryAfter > 0
            ? Math.max(error.retryAfter * 1000, backoff)
            : backoff;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value == null) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}

function buildNpmPackage(
  packageName: string,
  latestVersionInfo: LatestVersionInfo,
  original?: PackageInfo
): NPMPackage {
  return {
    name: packageName,
    description: latestVersionInfo.description,
    version: latestVersionInfo.version,
    bin: latestVersionInfo.bin,
    dependencies: latestVersionInfo.dependencies,
    scripts: latestVersionInfo.scripts,
    keywords: latestVersionInfo.keywords,
    links: {
      npm: `https://www.npmjs.com/package/${packageName}`,
      repository: latestVersionInfo.repository?.url
        ?.replace(/^git\+/, "")
        .replace(/\.git$/, ""),
      homepage: latestVersionInfo.homepage,
    },
    original,
  };
}

/**
 * Find all executable (npx-compatible) packages within a specific npm scope
 * @param scope The npm scope to search in (e.g., '@your-scope')
 * @param options Optional configuration options
 * @returns Promise<NPMPackage[]> Array of found packages
 * @throws Error if the scope is invalid or if there's an error fetching packages
 */
export async function npxFinder(
  scope: string,
  options: NpxFinderOptions = {}
): Promise<NPMPackage[]> {
  if (!scope.startsWith("@")) {
    throw new Error('Scope must start with "@"');
  }

  const {
    concurrency = 10,
    maxPages = 5,
    includeOriginal = false,
    logger,
  } = options;

  const limit = pLimit(concurrency);
  const pageSize = 250;

  // Paginated search
  const scopePackages: string[] = [];
  let from = 0;

  for (let page = 0; page < maxPages; page++) {
    const searchUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(
      scope
    )}&size=${pageSize}&from=${from}`;
    const searchResult = (await fetchWithRetry(
      searchUrl,
      options
    )) as SearchResponse;

    if (!searchResult.objects || !Array.isArray(searchResult.objects)) {
      throw new Error("Invalid search response format");
    }

    const pagePackages = searchResult.objects
      .filter((pkg) => pkg.package.name.startsWith(scope))
      .map((pkg) => pkg.package.name);

    scopePackages.push(...pagePackages);
    from += searchResult.objects.length;

    if (from >= searchResult.total || searchResult.objects.length < pageSize) {
      break;
    }
  }

  if (scopePackages.length === 0) {
    return [];
  }

  // Fetch package details with concurrency control
  const packagePromises = scopePackages.map((packageName) =>
    limit(async () => {
      if (includeOriginal) {
        // Full metadata
        const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(
          packageName
        )}`;
        const packageInfo = (await fetchWithRetry(
          packageUrl,
          options
        )) as PackageInfo;
        return { packageName, packageInfo, isFullMetadata: true as const };
      } else {
        // Latest version only
        const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(
          packageName
        )}/latest`;
        const versionInfo = (await fetchWithRetry(
          packageUrl,
          options
        )) as LatestVersionInfo;
        return { packageName, versionInfo, isFullMetadata: false as const };
      }
    })
  );

  const results = await Promise.allSettled(packagePromises);

  const packages: NPMPackage[] = [];

  for (const result of results) {
    if (result.status === "rejected") {
      logger?.error("Error fetching package details:", result.reason);
      continue;
    }

    const value = result.value;

    if (value.isFullMetadata) {
      const { packageName, packageInfo } = value;
      if (!packageInfo["dist-tags"] || !packageInfo.versions) {
        logger?.error("Invalid package info format:", packageName);
        continue;
      }
      const latestVersion = packageInfo["dist-tags"].latest;
      const latestVersionInfo = packageInfo.versions[latestVersion];
      if (isExecutablePackage(latestVersionInfo)) {
        packages.push(
          buildNpmPackage(packageName, latestVersionInfo, packageInfo)
        );
      }
    } else {
      const { packageName, versionInfo } = value;
      if (!versionInfo || !versionInfo.version) {
        logger?.error("Invalid package info format:", packageName);
        continue;
      }
      if (isExecutablePackage(versionInfo)) {
        packages.push(buildNpmPackage(packageName, versionInfo));
      }
    }
  }

  return packages;
}

function isExecutablePackage(packageInfo: LatestVersionInfo): boolean {
  return !!packageInfo.bin;
}

export type {
  NPMPackage,
  NpxFinderOptions,
  SearchResponse,
  PackageInfo,
  LatestVersionInfo,
  Logger,
} from "./types";
