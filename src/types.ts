/**
 * Type definitions based on official npm Registry API documentation
 * @see https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
 * @see https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 */

/**
 * Represents an executable package found by npx-scope-finder
 * Contains selected fields from the full npm package metadata
 */
export interface NPMPackage {
  name: string;
  description?: string;
  version: string;
  bin?: Record<string, string>;
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  keywords?: string[];
  links?: {
    npm?: string;
    repository?: string;
    homepage?: string;
  };
  original?: PackageInfo;
}

/**
 * Response structure for npm registry search API
 * @see https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 */
export interface SearchResponse {
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

/**
 * Package information structure as returned by the npm registry
 * This matches the structure of the complete package metadata document
 * @see https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
 */
export interface PackageInfo {
  name: string;
  "dist-tags": {
    latest: string;
    [tag: string]: string;
  };
  versions: {
    [version: string]: {
      name: string;
      version: string;
      description?: string;
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      keywords?: string[];
      repository?: {
        type: string;
        url: string;
      };
      homepage?: string;
      author?: {
        name?: string;
        email?: string;
        url?: string;
      };
      license?: string;
      // The dist object contains tarball URL and integrity hashes
      dist: {
        shasum: string;
        tarball: string;
        integrity?: string;
        fileCount?: number;
        unpackedSize?: number;
        "npm-signature"?: string;
      };
      _id?: string;
      _npmVersion?: string;
      _npmUser?: {
        name: string;
        email: string;
      };
      maintainers?: Array<{
        name?: string;
        email?: string;
        url?: string;
      }>;
    };
  };
  time?: {
    created: string;
    modified: string;
    [version: string]: string;
  };
  readme?: string;
  _id?: string;
  _rev?: string;
}

/**
 * Configuration options for the npxFinder function
 */
export interface NpxFinderOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
} 