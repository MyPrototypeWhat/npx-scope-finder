import type {
  NPMPackage,
  NpxFinderOptions,
  SearchResponse,
  PackageInfo
} from "./types";

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
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

  try {
    const searchUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(
      scope
    )}`;
    const searchResult = (await fetchWithRetry(
      searchUrl,
      options
    )) as SearchResponse;

    if (!searchResult.objects || !Array.isArray(searchResult.objects)) {
      throw new Error("Invalid search response format");
    }

    const scopePackages = searchResult.objects
      .filter((pkg) => pkg.package.name.startsWith(scope))
      .map((pkg) => pkg.package.name);

    if (scopePackages.length === 0) {
      return [];
    }

    const packagePromises = scopePackages.map((packageName) => {
      const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(
        packageName
      )}`;
      return fetchWithRetry(packageUrl, options).then((packageInfo) => ({
        packageName,
        packageInfo,
      }));
    });

    const results = await Promise.allSettled(packagePromises);

    const packages: NPMPackage[] = [];

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Error fetching package details:", result.reason);
        continue;
      }

      const { packageName, packageInfo } = result.value;
      const typedPackageInfo = packageInfo as PackageInfo;

      if (!typedPackageInfo["dist-tags"] || !typedPackageInfo.versions) {
        console.error("Invalid package info format:", packageName);
        continue;
      }

      const latestVersion = typedPackageInfo["dist-tags"].latest;
      const latestVersionInfo = typedPackageInfo.versions[latestVersion];

      if (isExecutablePackage(latestVersionInfo)) {
        packages.push({
          name: packageName,
          description: latestVersionInfo.description,
          version: latestVersion,
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
          original: typedPackageInfo,
        });
      }
    }

    return packages;
  } catch (error) {
    console.error("Error fetching npm packages:", error);
    throw error;
  }
}

function isExecutablePackage(
  packageInfo: PackageInfo["versions"][string]
): boolean {
  return !!packageInfo.bin;
}

export type {
  NPMPackage,
  NpxFinderOptions,
  SearchResponse,
  PackageInfo
} from "./types";
