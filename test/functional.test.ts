import type { NPMPackage } from "../src/index";
import { npxFinder } from "../src/index";
import { describe, it, beforeAll, expect } from "vitest";

const RETRY_OPTIONS = { retries: 5, retryDelay: 2000 };

describe("npxFinder", () => {
  const TEST_SCOPE = "@modelcontextprotocol";
  let packages: NPMPackage[];

  beforeAll(async () => {
    packages = await npxFinder(TEST_SCOPE, RETRY_OPTIONS);
  }, 120000);

  it("should find executable packages in the scope", () => {
    expect(packages.length).toBeGreaterThan(0);
  });

  it("should only return packages from the specified scope", () => {
    for (const pkg of packages) {
      expect(pkg.name.startsWith(TEST_SCOPE)).toBe(true);
    }
  });

  it("should only return packages with executable commands", () => {
    for (const pkg of packages) {
      expect(pkg.bin).toBeTruthy();
      expect(Object.keys(pkg.bin!).length).toBeGreaterThan(0);
    }
  });

  it("should include required package metadata", () => {
    for (const pkg of packages) {
      expect(pkg.name).toBeTruthy();
      expect(pkg.version).toBeTruthy();
    }
  });

  it("should NOT include original data by default", () => {
    for (const pkg of packages) {
      expect(pkg.original).toBeUndefined();
    }
  });

  it("should include original data when includeOriginal=true", async () => {
    const pkgs = await npxFinder(TEST_SCOPE, {
      ...RETRY_OPTIONS,
      includeOriginal: true,
    });
    expect(pkgs.length).toBeGreaterThan(0);
    for (const pkg of pkgs) {
      expect(pkg.original).toBeTruthy();
      expect(pkg.name).toBe(pkg.original!.name);
      expect(pkg.original!["dist-tags"]).toBeTruthy();
      expect(pkg.original!.versions).toBeTruthy();
    }
  }, 120000);

  it("should find more than 20 packages with pagination", () => {
    expect(packages.length).toBeGreaterThan(20);
  });

  it("should respect maxPages option", async () => {
    const pkgs = await npxFinder(TEST_SCOPE, {
      ...RETRY_OPTIONS,
      maxPages: 1,
    });
    expect(pkgs.length).toBeGreaterThan(0);
  }, 120000);

  it("should respect concurrency option", async () => {
    const pkgs = await npxFinder(TEST_SCOPE, {
      ...RETRY_OPTIONS,
      concurrency: 5,
    });
    expect(pkgs.length).toBeGreaterThan(0);
  }, 120000);
});
