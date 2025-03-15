import { npxFinder } from "../src/index";
import assert from "assert";
import { describe, it, afterEach } from "mocha";

// 保存原始的 fetch 函数
const originalFetch = global.fetch;

// 模拟成功的包响应
const mockPackageResponse = {
  name: "@test/package",
  "dist-tags": {
    latest: "1.0.0",
  },
  versions: {
    "1.0.0": {
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
    },
  },
};

describe("Retry Tests", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should retry on network error", async () => {
    let searchAttempts = 0;

    // Mock fetch to fail twice then succeed
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        if (searchAttempts <= 2) {
          throw new Error("Network error");
        }
        return new Response(
          JSON.stringify({
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
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(JSON.stringify(mockPackageResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", {
      retries: 2,
      retryDelay: 50,
    });

    assert.strictEqual(
      searchAttempts,
      3,
      "Search should have been attempted 3 times"
    );
  });

  it("should retry on timeout", async () => {
    let searchAttempts = 0;
    const timeoutMs = 100;

    // Mock fetch to timeout twice then succeed
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        if (searchAttempts <= 2) {
          await new Promise((resolve) => setTimeout(resolve, timeoutMs * 2));
          throw new Error("Timeout");
        }
        return new Response(
          JSON.stringify({
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
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(JSON.stringify(mockPackageResponse), {
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

    assert.strictEqual(
      searchAttempts,
      3,
      "Search should have been attempted 3 times"
    );
  });

  it("should fail after max retries", async () => {
    let searchAttempts = 0;

    // Mock fetch to always fail
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes("/-/v1/search")) {
        searchAttempts++;
        throw new Error("Network error");
      }
      throw new Error("Should not reach here");
    };

    try {
      await npxFinder("@test", {
        retries: 2,
        retryDelay: 50,
      });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.strictEqual(
        searchAttempts,
        3,
        "Search should have been attempted 3 times"
      );
      assert.ok(error instanceof Error);
      assert.strictEqual(error.message, "Network error");
    }
  });

  it("should handle HTTP errors", async () => {
    let searchAttempts = 0;

    // Mock fetch to return 429 (Too Many Requests) twice then succeed
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
        return new Response(
          JSON.stringify({
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
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(JSON.stringify(mockPackageResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    await npxFinder("@test", {
      retries: 2,
      retryDelay: 50,
    });

    assert.strictEqual(
      searchAttempts,
      3,
      "Search should have been attempted 3 times"
    );
  });
});
