# npx-scope-finder

A specialized tool for finding executable (npx-compatible) packages within a specific npm scope. This tool helps you discover all packages in a scope that can be run using `npx`.

## Features

- 🔄 **Robust Error Handling**: Exponential backoff retry with HTTP 429 / `Retry-After` support
- 🎯 **Scope-Focused**: Easily find all executable packages within your organization's scope
- ⚡ **High Performance**: Concurrent requests with configurable concurrency limit
- 🛡️ **Fault Tolerant**: Uses `Promise.allSettled` to handle partial failures gracefully
- 📄 **Paginated Search**: Fetches up to 1250 packages per scope (configurable `maxPages`)
- 💪 **Type Safety**: Full TypeScript support with detailed type definitions
- 📦 **Dual Format**: ESM + CJS output with corresponding `.d.mts` / `.d.cts` declarations

## Changelog

A detailed changelog is available in the [CHANGELOG.md](./CHANGELOG.md) file.

## Installation

```bash
npm install npx-scope-finder
# or
pnpm add npx-scope-finder
# or
yarn add npx-scope-finder
```

## Usage

```typescript
import { npxFinder } from 'npx-scope-finder';

// Basic usage
const packages = await npxFinder('@your-scope');
console.log(`Found ${packages.length} executable packages`);

// With options
const packages = await npxFinder('@your-scope', {
  timeout: 10000,        // Request timeout in ms (default: 10000)
  retries: 3,            // Number of retries (default: 3)
  retryDelay: 1000,      // Base delay between retries in ms (default: 1000)
  concurrency: 10,       // Max concurrent requests (default: 10)
  maxPages: 5,           // Max search pages, 250 results/page (default: 5)
  includeOriginal: true, // Include full npm registry metadata (default: false)
  logger: console,       // Logger for error messages (default: undefined = silent)
});

// Access package data
packages.forEach(pkg => {
  console.log(`Package: ${pkg.name}@${pkg.version}`);
  console.log(`Description: ${pkg.description || 'No description'}`);
  console.log('Executable commands:', Object.keys(pkg.bin || {}));

  if (pkg.links?.repository) {
    console.log(`Repository: ${pkg.links.repository}`);
  }
});
```

### Include full metadata

By default, only the latest version metadata is fetched (lightweight). Set `includeOriginal: true` to include the complete npm registry document:

```typescript
const packages = await npxFinder('@your-scope', { includeOriginal: true });

packages.forEach(pkg => {
  // Full package data from npm registry
  console.log(pkg.original?.['dist-tags']);
  console.log(Object.keys(pkg.original?.versions ?? {}));
});
```

## API

### `npxFinder(scope: string, options?: NpxFinderOptions): Promise<NPMPackage[]>`

The main function for finding executable packages in a scope.

#### Parameters

- `scope`: The npm scope to search in (e.g., '@your-scope')
- `options`: Optional configuration
  - `timeout`: Request timeout in milliseconds (default: 10000)
  - `retries`: Number of retries for failed requests (default: 3)
  - `retryDelay`: Base delay between retries in milliseconds, doubles each attempt (default: 1000)
  - `concurrency`: Maximum number of concurrent package detail requests (default: 10)
  - `maxPages`: Maximum number of search result pages, 250 results per page (default: 5)
  - `includeOriginal`: Include full npm registry metadata in `original` field (default: false)
  - `logger`: Logger object with `error` method for error messages (default: undefined, silent)

#### Returns

Array of `NPMPackage` objects with the following structure:

```typescript
interface NPMPackage {
  name: string;               // Package name
  description?: string;       // Package description
  version: string;            // Latest version
  bin?: Record<string, string>; // Executable commands
  dependencies?: Record<string, string>; // Dependencies
  scripts?: Record<string, string>; // npm scripts
  keywords?: string[];        // Package keywords
  links?: {                   // Related links
    npm?: string;             // npm package page
    repository?: string;      // Code repository
    homepage?: string;        // Homepage
  };
  original?: PackageInfo;     // Full package data (only when includeOriginal: true)
}
```

> **Type Definitions**: The `NPMPackage` interface and all other type definitions are derived from the [official npm Registry API documentation](https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md).

### Exported Types

```typescript
import {
  NPMPackage,           // Main package result type
  NpxFinderOptions,     // Options for the npxFinder function
  SearchResponse,       // Raw response from npm registry search
  PackageInfo,          // Detailed package information from npm registry
  LatestVersionInfo,    // Single version metadata
  Logger,              // Logger interface
} from 'npx-scope-finder';
```

> **Note**: The type definitions in this library are based on the official npm Registry API documentation:
> - [Package Metadata Documentation](https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md)
> - [Registry API Documentation](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md)

## Example Output

```javascript
{
  name: '@your-scope/cli-tool',
  version: '1.0.0',
  description: 'A command line tool',
  bin: {
    'your-tool': './bin/cli.js'
  },
  dependencies: {
    'commander': '^9.0.0',
    'chalk': '^5.0.0'
  },
  keywords: ['cli', 'tool', 'automation'],
  links: {
    npm: 'https://www.npmjs.com/package/@your-scope/cli-tool',
    repository: 'https://github.com/your-org/cli-tool',
    homepage: 'https://your-org.github.io/cli-tool'
  }
}
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/MyPrototypeWhat/npx-scope-finder.git
cd npx-scope-finder

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:functional  # Run functional tests
pnpm test:retry      # Run retry mechanisms tests
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
