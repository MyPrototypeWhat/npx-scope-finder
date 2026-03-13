import { npxFinder } from "../src/index";
import { describe, it, afterEach, expect, vi } from "vitest";

const originalFetch = global.fetch;

const mockLatestResponse = {
  name: "@test/package",
  version: "1.0.0",
  description: "Test package",
  bin: {
    "test-cmd": "./bin/cli.js",
  },
  keywords: ["test"],
  repository: {
    type: "git",
    url: "git+https://github.com/test/package.git",
  },
  homepage: "https://github.com/test/package",
  dist: {
    shasum: "abc123",
    tarball: "https://registry.npmjs.org/@test/package/-/package-1.0.0.tgz",
  },
};

const mockFullMetadataResponse = {
  name: "@test/package",
  "dist-tags": {
    latest: "1.0.0",
  },
  versions: {
    "1.0.0": mockLatestResponse,
  },
};

function createSearchResponse() {
  return JSON.stringify({
    objects: [
      {
        package: {
          name: "@test/package",
          scope: "@test",
          version: "1.0.0",
          description: "Test package",
          keywords: [],
          date: new Date().toISOString(),
        },
      },
    ],
    total: 1,
  });
}

describe("Retry Tests", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should retry on network error", async () => {
    let searchAttempts = 0;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        if (searchAttempts <= 2) {
          throw new Error("Network error");
        }
        return new Response(createSearchResponse(), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify(mockLatestResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", {
      retries: 2,
      retryDelay: 50,
    });

    expect(searchAttempts).toBe(3);
  });

  it("should retry on timeout", async () => {
    let searchAttempts = 0;
    const timeoutMs = 100;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        if (searchAttempts <= 2) {
          await new Promise((resolve) => setTimeout(resolve, timeoutMs * 2));
          throw new Error("Timeout");
        }
        return new Response(createSearchResponse(), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify(mockLatestResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", {
      timeout: timeoutMs,
      retries: 2,
      retryDelay: 50,
    });

    expect(searchAttempts).toBe(3);
  });

  it("should fail after max retries", async () => {
    let searchAttempts = 0;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        throw new Error("Network error");
      }
      throw new Error("Should not reach here");
    };

    await expect(
      npxFinder("@test", {
        retries: 2,
        retryDelay: 50,
      })
    ).rejects.toThrow("Network error");

    expect(searchAttempts).toBe(3);
  });

  it("should handle HTTP errors with retry", async () => {
    let searchAttempts = 0;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        if (searchAttempts <= 2) {
          return new Response("Too Many Requests", {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(createSearchResponse(), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify(mockLatestResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", {
      retries: 2,
      retryDelay: 50,
    });

    expect(searchAttempts).toBe(3);
  });

  it("should use Retry-After header on 429", async () => {
    let searchAttempts = 0;
    const timestamps: number[] = [];

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        timestamps.push(Date.now());
        if (searchAttempts <= 1) {
          return new Response("Too Many Requests", {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "2",
            },
          });
        }
        return new Response(createSearchResponse(), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify(mockLatestResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", {
      retries: 2,
      retryDelay: 50,
    });

    expect(searchAttempts).toBe(2);
    const elapsed = timestamps[1] - timestamps[0];
    // Retry-After: 2 = 2000ms, backoff = 50 * 2^0 = 50ms, max(2000, 50) = 2000ms
    expect(elapsed).toBeGreaterThanOrEqual(1800);
  });

  it("should use exponential backoff", async () => {
    let searchAttempts = 0;
    const timestamps: number[] = [];
    const baseDelay = 100;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        timestamps.push(Date.now());
        if (searchAttempts <= 2) {
          throw new Error("Network error");
        }
        return new Response(createSearchResponse(), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify(mockLatestResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", {
      retries: 2,
      retryDelay: baseDelay,
    });

    expect(searchAttempts).toBe(3);

    const firstDelay = timestamps[1] - timestamps[0];
    expect(firstDelay).toBeGreaterThanOrEqual(baseDelay * 0.8);

    const secondDelay = timestamps[2] - timestamps[1];
    expect(secondDelay).toBeGreaterThanOrEqual(baseDelay * 2 * 0.8);
    expect(secondDelay).toBeGreaterThan(firstDelay * 1.5);
  });

  it("should fetch /latest endpoint by default", async () => {
    const fetchedUrls: string[] = [];

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      fetchedUrls.push(url);

      if (url.includes("/-/v1/search")) {
        return new Response(createSearchResponse(), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify(mockLatestResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", { retryDelay: 50 });

    const packageUrl = fetchedUrls.find((u) => !u.includes("/-/v1/search"));
    expect(packageUrl).toBeTruthy();
    expect(packageUrl!.endsWith("/latest")).toBe(true);
  });

  it("should fetch full metadata when includeOriginal=true", async () => {
    const fetchedUrls: string[] = [];

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      fetchedUrls.push(url);

      if (url.includes("/-/v1/search")) {
        return new Response(createSearchResponse(), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify(mockFullMetadataResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    const pkgs = await npxFinder("@test", {
      includeOriginal: true,
      retryDelay: 50,
    });

    const packageUrl = fetchedUrls.find((u) => !u.includes("/-/v1/search"));
    expect(packageUrl).toBeTruthy();
    expect(packageUrl!.endsWith("/latest")).toBe(false);
    expect(pkgs.length).toBeGreaterThan(0);
    expect(pkgs[0].original).toBeTruthy();
  });
});
