export interface NPMPackage {
  name: string; // 包名
  description?: string; // 包描述
  version: string; // 最新版本
  bin?: Record<string, string>; // 可执行文件
  dependencies?: Record<string, string>; // 依赖
  scripts?: Record<string, string>; // npm scripts
  keywords?: string[]; // 包的关键字
  links?: {             // 相关链接
    npm?: string;       // npm 包页面
    repository?: string; // 代码仓库
    homepage?: string;  // 主页
  };
}

interface SearchResponse {
  objects: Array<{
    package: {
      name: string;
      scope: string;
      version: string;
      description: string;
      keywords: string[];
      date: string;
    };
  }>;
  total: number;
  time: string;
}

interface PackageInfo {
  name: string;
  "dist-tags": {
    latest: string;
  };
  versions: {
    [version: string]: {
      name: string;
      version: string;
      description?: string;
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      keywords?: string[];
      repository?: {
        type: string;
        url: string;
      };
      homepage?: string;
    };
  };
}

export interface NpxFinderOptions {
  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;
  
  /**
   * Number of retries for failed requests
   * @default 3
   */
  retries?: number;
  
  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;
}

async function fetchWithRetry(url: string, options: NpxFinderOptions = {}): Promise<any> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
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
  if (!scope.startsWith('@')) {
    throw new Error('Scope must start with "@"');
  }

  try {
    // 使用 npm registry API 搜索包
    const searchUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(scope)}`;
    const searchResult = await fetchWithRetry(searchUrl, options);

    if (!searchResult.objects || !Array.isArray(searchResult.objects)) {
      throw new Error("Invalid search response format");
    }

    const packages: NPMPackage[] = [];

    for (const pkg of searchResult.objects) {
      try {
        const packageName = pkg.package.name;
        if (!packageName.startsWith(scope)) {
          continue;
        }

        // 获取包的详细信息
        const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
        const packageInfo = await fetchWithRetry(packageUrl, options);

        if (!packageInfo["dist-tags"] || !packageInfo.versions) {
          throw new Error("Invalid package info format");
        }

        const latestVersion = packageInfo["dist-tags"].latest;
        const latestVersionInfo = packageInfo.versions[latestVersion];

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
              repository: latestVersionInfo.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, ''),
              homepage: latestVersionInfo.homepage
            }
          });
        }
      } catch (error) {
        console.error(
          `Error fetching package details: ${pkg.package.name}`,
          error
        );
      }
    }

    return packages;
  } catch (error) {
    console.error("Error fetching npm packages:", error);
    throw error;
  }
}

function isExecutablePackage(packageInfo: any): boolean {
  return !!packageInfo.bin;
}

// Format utilities
export const format = {
  /**
   * Get basic package information
   */
  basic(pkg: NPMPackage): string {
    return [
      `Package: ${pkg.name}`,
      `Version: ${pkg.version}`,
      pkg.description && `Description: ${pkg.description}`,
      pkg.keywords?.length && `Keywords: ${pkg.keywords.join(", ")}`,
    ].filter(Boolean).join("\n");
  },

  /**
   * Get executable commands information
   */
  commands(pkg: NPMPackage): string | null {
    if (!pkg.bin) return null;
    return [
      "Executable Commands:",
      ...Object.entries(pkg.bin).map(([cmd, path]) => `  - ${cmd}: ${path}`),
    ].join("\n");
  },

  /**
   * Get usage information
   */
  usage(pkg: NPMPackage): string {
    return [
      "Usage:",
      `  npx ${pkg.name}`,
    ].join("\n");
  },

  /**
   * Get links information
   */
  links(pkg: NPMPackage): string | null {
    if (!pkg.links) return null;
    const linkEntries = Object.entries(pkg.links)
      .filter(([, url]) => url)
      .map(([type, url]) => `  - ${type.toUpperCase()}: ${url}`);
    
    return linkEntries.length ? ["Links:", ...linkEntries].join("\n") : null;
  },

  /**
   * Get dependencies information
   */
  dependencies(pkg: NPMPackage): string | null {
    if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) return null;
    return [
      "Dependencies:",
      ...Object.entries(pkg.dependencies).map(([dep, version]) => `  - ${dep}: ${version}`),
    ].join("\n");
  },

  /**
   * Get all information (legacy format)
   */
  all(pkg: NPMPackage): string {
    return [
      format.basic(pkg),
      "",
      format.commands(pkg),
      "",
      format.usage(pkg),
      "",
      format.links(pkg),
      "",
      format.dependencies(pkg),
    ].filter(Boolean).join("\n");
  }
};
