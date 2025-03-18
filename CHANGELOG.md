# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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