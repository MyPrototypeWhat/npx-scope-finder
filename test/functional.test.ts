import { npxFinder, format, NPMPackage } from "../src/index";
import { describe, it } from 'mocha';
import assert from 'assert';

describe('npxFinder', () => {
  // 增加超时时间，因为需要实际调用 npm registry
  const TEST_SCOPE = '@modelcontextprotocol';
  let packages: NPMPackage[];

  // 在所有测试前获取包列表
  before(async function() {
    this.timeout(30000);
    packages = await npxFinder(TEST_SCOPE);
  });

  it('should find executable packages in the scope', () => {
    assert.ok(packages.length > 0, 'Should find at least one package');
  });

  it('should only return packages from the specified scope', () => {
    packages.forEach(pkg => {
      assert.ok(pkg.name.startsWith(TEST_SCOPE), `Package ${pkg.name} should be in the ${TEST_SCOPE} scope`);
    });
  });

  it('should only return packages with executable commands', () => {
    packages.forEach(pkg => {
      assert.ok(pkg.bin && Object.keys(pkg.bin).length > 0, `Package ${pkg.name} should have executable commands`);
    });
  });

  it('should include required package metadata', () => {
    packages.forEach(pkg => {
      assert.ok(pkg.name, 'Package should have a name');
      assert.ok(pkg.version, 'Package should have a version');
      // description 是可选的，所以不测试
    });
  });
});

describe('format utilities', () => {
  const mockPackage: NPMPackage = {
    name: '@test/package',
    version: '1.0.0',
    description: 'Test package description',
    bin: {
      'test-cmd': './bin/cli.js'
    },
    dependencies: {
      'dep1': '^1.0.0',
      'dep2': '^2.0.0'
    },
    keywords: ['test', 'mock'],
    links: {
      npm: 'https://www.npmjs.com/package/@test/package',
      repository: 'https://github.com/test/package',
      homepage: 'https://test.com'
    }
  };

  describe('basic()', () => {
    it('should format basic package information correctly', () => {
      const result = format.basic(mockPackage);
      assert.ok(result.includes(mockPackage.name), 'Should include package name');
      assert.ok(result.includes(mockPackage.version), 'Should include version');
      assert.ok(result.includes(mockPackage.description!), 'Should include description');
      assert.ok(result.includes(mockPackage.keywords!.join(', ')), 'Should include keywords');
    });
  });

  describe('commands()', () => {
    it('should format executable commands correctly', () => {
      const result = format.commands(mockPackage);
      assert.ok(result?.includes('Executable Commands:'), 'Should have header');
      assert.ok(result?.includes('test-cmd'), 'Should include command name');
      assert.ok(result?.includes('./bin/cli.js'), 'Should include command path');
    });

    it('should return null for packages without commands', () => {
      const pkgWithoutBin = { ...mockPackage, bin: undefined };
      assert.strictEqual(format.commands(pkgWithoutBin), null);
    });
  });

  describe('usage()', () => {
    it('should format usage information correctly', () => {
      const result = format.usage(mockPackage);
      assert.ok(result.includes('Usage:'), 'Should have header');
      assert.ok(result.includes(`npx ${mockPackage.name}`), 'Should include npx command');
    });
  });

  describe('links()', () => {
    it('should format links correctly', () => {
      const result = format.links(mockPackage);
      assert.ok(result?.includes('Links:'), 'Should have header');
      assert.ok(result?.includes(mockPackage.links!.npm!), 'Should include npm link');
      assert.ok(result?.includes(mockPackage.links!.repository!), 'Should include repository link');
      assert.ok(result?.includes(mockPackage.links!.homepage!), 'Should include homepage link');
    });

    it('should return null for packages without links', () => {
      const pkgWithoutLinks = { ...mockPackage, links: undefined };
      assert.strictEqual(format.links(pkgWithoutLinks), null);
    });
  });

  describe('dependencies()', () => {
    it('should format dependencies correctly', () => {
      const result = format.dependencies(mockPackage);
      assert.ok(result?.includes('Dependencies:'), 'Should have header');
      Object.entries(mockPackage.dependencies!).forEach(([dep, version]) => {
        assert.ok(result?.includes(`${dep}: ${version}`), `Should include dependency ${dep}`);
      });
    });

    it('should return null for packages without dependencies', () => {
      const pkgWithoutDeps = { ...mockPackage, dependencies: undefined };
      assert.strictEqual(format.dependencies(pkgWithoutDeps), null);
    });
  });

  describe('all()', () => {
    it('should combine all format utilities correctly', () => {
      const result = format.all(mockPackage);
      assert.ok(result.includes(format.basic(mockPackage)), 'Should include basic info');
      assert.ok(result.includes(format.commands(mockPackage)!), 'Should include commands');
      assert.ok(result.includes(format.usage(mockPackage)), 'Should include usage');
      assert.ok(result.includes(format.links(mockPackage)!), 'Should include links');
      assert.ok(result.includes(format.dependencies(mockPackage)!), 'Should include dependencies');
    });
  });
}); 