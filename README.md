# npx-scope-finder

A specialized tool for finding executable (npx-compatible) packages within a specific npm scope. This tool helps you discover all packages in a scope that can be run using `npx`.

## Installation

```bash
npm install npx-scope-finder
```

## Usage

```typescript
import { npxFinder, format } from 'npx-scope-finder';

// Basic usage - get raw package data
const packages = await npxFinder('@your-scope');
console.log(`Found ${packages.length} executable packages`);

// Access raw data directly
packages.forEach(pkg => {
  console.log(`Package: ${pkg.name}`);
  console.log('Executable commands:', Object.keys(pkg.bin || {}));
});

// Use format utilities as needed
packages.forEach(pkg => {
  // Format specific sections
  console.log(format.basic(pkg));     // Basic info
  console.log(format.commands(pkg));  // Commands
  console.log(format.usage(pkg));     // Usage
  console.log(format.links(pkg));     // Links
  
  // Or get all information in standard format
  console.log(format.all(pkg));
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
- `options`: Optional npm-registry-fetch options
  - `timeout`: Request timeout in milliseconds (default: 10000)
  - `fetchRetries`: Number of retries for failed requests (default: 3)
  - ...plus all options from npm-registry-fetch

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
}
```

### Format Utilities

`format` object provides utilities for formatting package information:

- `format.basic(pkg)`: Basic package information (name, version, description, keywords)
- `format.commands(pkg)`: Executable commands information
- `format.usage(pkg)`: Usage instructions
- `format.links(pkg)`: Related links
- `format.dependencies(pkg)`: Package dependencies
- `format.all(pkg)`: All information in standard format

Each format function returns either a formatted string or null if no relevant information is available.

## Example Output

Using `format.all()`:

```
Package: @your-scope/cli-tool
Version: 1.0.0
Description: A command line tool
Keywords: cli, tool, automation

Executable Commands:
  - your-tool: ./bin/cli.js

Usage:
  npx @your-scope/cli-tool

Links:
  - NPM: https://www.npmjs.com/package/@your-scope/cli-tool
  - REPOSITORY: https://github.com/your-org/cli-tool
  - HOMEPAGE: https://your-org.github.io/cli-tool

Dependencies:
  - commander: ^9.0.0
  - chalk: ^5.0.0
```

## Why use this package?

- **Raw Data Access**: Get direct access to package data for custom processing
- **Flexible Formatting**: Use built-in format utilities or create your own
- **Scope-focused**: Easily find all executable packages within your organization's scope
- **npx-ready**: Only shows packages that can be run with npx
- **Type Safety**: Full TypeScript support with detailed type definitions

## License

MIT 