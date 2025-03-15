export interface NPMPackage {
  name: string; // 包名
  description?: string; // 包描述
  version: string; // 最新版本
  bin?: Record<string, string>; // 可执行文件
  dependencies?: Record<string, string>; // 依赖
  scripts?: Record<string, string>; // npm scripts
  keywords?: string[]; // 包的关键字
  links?: {
    // 相关链接
    npm?: string; // npm 包页面
    repository?: string; // 代码仓库
    homepage?: string; // 主页
  };
  original?: any; // 原始完整数据
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

type PackageSuccessResult = {
  packageName: string;
  packageInfo: any;
  success: true;
};

type PackageErrorResult = {
  packageName: string;
  error: any;
  success: false;
};

type PackageResult = PackageSuccessResult | PackageErrorResult;

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

async function fetchWithRetry(
  url: string,
  options: NpxFinderOptions = {}
): Promise<any> {
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
    // 使用 npm registry API 搜索包
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

    // 筛选出属于指定 scope 的包
    const scopePackages = searchResult.objects
      .filter((pkg) => pkg.package.name.startsWith(scope))
      .map((pkg) => pkg.package.name);

    if (scopePackages.length === 0) {
      return [];
    }

    // 并发获取包的详细信息
    const packagePromises = scopePackages.map((packageName) => {
      const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(
        packageName
      )}`;
      return fetchWithRetry(packageUrl, options).then(packageInfo => ({
        packageName,
        packageInfo
      }));
    });

    const results = await Promise.allSettled(packagePromises);

    // 处理成功获取的包信息
    const packages: NPMPackage[] = [];

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`Error fetching package details:`, result.reason);
        continue;
      }

      const { packageName, packageInfo } = result.value;

      if (!packageInfo["dist-tags"] || !packageInfo.versions) {
        console.error(`Invalid package info format: ${packageName}`);
        continue;
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
            repository: latestVersionInfo.repository?.url
              ?.replace(/^git\+/, "")
              .replace(/\.git$/, ""),
            homepage: latestVersionInfo.homepage,
          },
          original: packageInfo, // 保存原始完整数据
        });
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
