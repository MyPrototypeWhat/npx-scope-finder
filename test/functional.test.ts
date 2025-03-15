import { npxFinder, NPMPackage } from "../src/index";
import { describe, it } from "mocha";
import assert from "assert";

describe("npxFinder", () => {
  // 增加超时时间，因为需要实际调用 npm registry
  const TEST_SCOPE = "@modelcontextprotocol";
  let packages: NPMPackage[];

  // 在所有测试前获取包列表
  before(async function () {
    this.timeout(30000);
    packages = await npxFinder(TEST_SCOPE);
  });

  it("should find executable packages in the scope", () => {
    assert.ok(packages.length > 0, "Should find at least one package");
  });

  it("should only return packages from the specified scope", () => {
    packages.forEach((pkg) => {
      assert.ok(
        pkg.name.startsWith(TEST_SCOPE),
        `Package ${pkg.name} should be in the ${TEST_SCOPE} scope`
      );
    });
  });

  it("should only return packages with executable commands", () => {
    packages.forEach((pkg) => {
      assert.ok(
        pkg.bin && Object.keys(pkg.bin).length > 0,
        `Package ${pkg.name} should have executable commands`
      );
    });
  });

  it("should include required package metadata", () => {
    packages.forEach((pkg) => {
      assert.ok(pkg.name, "Package should have a name");
      assert.ok(pkg.version, "Package should have a version");
      // description 是可选的，所以不测试
    });
  });

  it("should include original package data", () => {
    packages.forEach((pkg) => {
      assert.ok(pkg.original, "Package should include original data");
      assert.strictEqual(
        pkg.name,
        pkg.original.name,
        "Original data should match package name"
      );
      assert.ok(
        pkg.original["dist-tags"],
        "Original data should include dist-tags"
      );
      assert.ok(pkg.original.versions, "Original data should include versions");
    });
  });

  it("should use concurrent requests for better performance", async function () {
    this.timeout(30000);

    const startTime = Date.now();
    await npxFinder(TEST_SCOPE);
    const endTime = Date.now();

    // 注意: 这不是一个严格的测试，因为性能取决于网络状况
    // 但我们可以记录总时间以供参考
    console.log(`Fetched packages in ${endTime - startTime}ms`);
  });
});
