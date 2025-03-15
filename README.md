# npx-scope-finder

A specialized tool for finding executable (npx-compatible) packages within a specific npm scope. This tool helps you discover all packages in a scope that can be run using `npx`.

✨ **Cross-Platform Support**: Works in both Node.js and browser environments!

## Features

- 🌐 **Universal Compatibility**: Works in both Node.js and browser environments
- 🔄 **Robust Error Handling**: Built-in retry mechanism for network issues
- 🎯 **Scope-Focused**: Easily find all executable packages within your organization's scope
- 📦 **Zero Dependencies**: Uses native fetch API, no external dependencies
- ⚡ **High Performance**: Uses concurrent requests for faster results
- 🛡️ **Fault Tolerant**: Uses `Promise.allSettled` to handle partial failures gracefully
- 🔍 **Complete Data**: Includes full package metadata in the `original` property
- 💪 **Type Safety**: Full TypeScript support with detailed type definitions

## Changelog

### 1.2.0 (2024-03-15)

- ⚡ Added concurrent requests for improved performance
- 🛡️ Implemented `Promise.allSettled` for fault-tolerant package fetching
- 🔍 Added original package data in the `original` property
- 🗑️ Removed format utilities for a more streamlined API

### 1.1.0 (2024-03-15)

- ✨ Added browser support
- 🔄 Replaced npm-registry-fetch with native fetch API
- ⚡️ Improved retry mechanism with better error handling
- 🧪 Added comprehensive retry tests
- 📦 Reduced package size by removing external dependencies

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

// Basic usage - get raw package data
const packages = await npxFinder('@your-scope', {
  timeout: 10000,    // Request timeout in milliseconds (default: 10000)
  retries: 3,        // Number of retries for failed requests (default: 3)
  retryDelay: 1000   // Delay between retries in milliseconds (default: 1000)
});
console.log(`Found ${packages.length} executable packages`);

// Access package data
packages.forEach(pkg => {
  console.log(`Package: ${pkg.name}@${pkg.version}`);
  console.log(`Description: ${pkg.description || 'No description'}`);
  console.log('Executable commands:', Object.keys(pkg.bin || {}));
  
  // Access full original npm registry data
  console.log('Full package data:', pkg.original);
  
  // Access other metadata
  if (pkg.links?.repository) {
    console.log(`Repository: ${pkg.links.repository}`);
  }
  
  if (pkg.dependencies) {
    console.log('Dependencies:', Object.keys(pkg.dependencies).length);
  }
});

// Custom formatting example
packages.forEach(pkg => {
  const customFormat = `
    📦 ${pkg.name}@${pkg.version}
    ${pkg.description || 'No description'}
    Commands: ${Object.keys(pkg.bin || {}).join(', ')}
    Run with: npx ${pkg.name}
  `;
  console.log(customFormat);
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
  - `retryDelay`: Delay between retries in milliseconds (default: 1000)

#### Returns

Array of `NPMPackage` objects with the following structure:

```typescript
interface NPMPackage {
  name: string;               // Package name
  description?: string;       // Package description
  version: string;           // Latest version
  bin?: Record<string, string>; // Executable commands
  dependencies?: Record<string, string>; // Dependencies
  scripts?: Record<string, string>; // npm scripts
  keywords?: string[];       // Package keywords
  links?: {                  // Related links
    npm?: string;           // npm package page
    repository?: string;    // Code repository
    homepage?: string;      // Homepage
  };
  original?: any;            // Complete original package data from npm registry
}
```

## Example Output

Example package object:

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
  },
  original: {
    // Complete package data from npm registry
    // ...
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
