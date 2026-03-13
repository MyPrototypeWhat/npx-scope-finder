# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-03-13

### Breaking Changes
- `original` field is no longer populated by default. Use `includeOriginal: true` option to include full package metadata.

### Added
- ESM + CJS dual format output via `tsdown` (replaces `tsc` + `terser`)
- Search pagination (`size=250`, configurable `maxPages`) — large scopes no longer truncated at 20 results
- `/latest` endpoint for package metadata — fetches only the latest version instead of all versions (KB vs MB)
- Concurrency control via `p-limit` (`concurrency` option, default 10)
- Exponential backoff retry with `2^attempt` delay multiplier
- HTTP 429 handling with `Retry-After` header support
- `logger` option to replace hardcoded `console.error` (default: silent)
- `includeOriginal` option to opt-in to full package metadata
- `maxPages` option to control search pagination depth (default 5, up to 1250 packages)
- Exported `LatestVersionInfo` and `Logger` types
- Switched test framework from Mocha to Vitest

### Changed
- Package output format: `dist/index.mjs` (ESM) + `dist/index.cjs` (CJS) with corresponding `.d.mts` / `.d.cts`
- `package.json` now includes `"type": "module"` and `exports` field

### Removed
- Removed `console.error` calls — errors are now routed through the optional `logger`
- Removed `terser` and `ts-node` dev dependencies

## [1.3.0] - 2024-03-18

### Added
- Enhanced type definitions based on official npm Registry API documentation
- Added links to official npm documentation for better TypeScript integration

### Changed
- Improved project structure with separate type definitions in `types.ts`
- Updated TypeScript target to ES2020 to support `Promise.allSettled`

### Removed
- Removed code comments from compiled output for smaller bundle size
- Removed unused type definitions (`PackageSuccessResult`, `PackageErrorResult`, `PackageResult`) to reduce bundle size and improve code clarity

### Optimized
- Added code minification using terser for optimized package size
- Exported all TypeScript interfaces and types for better developer experience

## [1.2.0] - 2024-03-15

### Added
- Added concurrent requests for improved performance
- Implemented `Promise.allSettled` for fault-tolerant package fetching
- Added original package data in the `original` property

### Removed
- Removed format utilities for a more streamlined API

## [1.1.0] - 2024-03-15

### Added
- Added browser support with cross-platform compatibility
- Added comprehensive retry tests
- Added improved error handling

### Changed
- Replaced npm-registry-fetch with native fetch API
- Improved retry mechanism with better error handling

### Removed
- Reduced package size by removing external dependencies

## [1.0.0] - 2024-03-14

### Added
- Initial release
- Support for finding executable (npx-compatible) packages in a specific npm scope
- Basic retry mechanism for network resilience
- TypeScript support with type definitions
