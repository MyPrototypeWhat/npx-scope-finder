import { npxFinder, format } from "./src/index";

async function test(scope: string) {
  try {
    console.log(`🔍 Searching for executable packages in ${scope}...\n`);

    const packages = await npxFinder(scope);

    console.log("packages object", packages);
    console.log(`✨ Found ${packages.length} executable packages!\n`);

    // 1. Raw data example
    console.log("📦 Raw Package Data Example:");
    console.log("-".repeat(50));
    packages.forEach((pkg) => {
      console.log(`Name: ${pkg.name}`);
      console.log(`Commands: ${Object.keys(pkg.bin || {}).join(", ")}`);
      console.log();
    });

    // 2. Using different formatters
    console.log("🎨 Different Format Examples:");
    console.log("-".repeat(50));
    const example = packages[0]; // Using first package as example
    if (example) {
      console.log("Basic Info:");
      console.log(format.basic(example));
      console.log("\nCommands:");
      console.log(format.commands(example));
      console.log("\nLinks:");
      console.log(format.links(example));
      console.log("\nDependencies:");
      console.log(format.dependencies(example));
      console.log();
    }

    // 3. Full formatted output
    console.log("📝 Full Formatted Output:");
    console.log("-".repeat(50));
    packages.forEach((pkg) => {
      console.log(format.all(pkg));
      console.log("-".repeat(50));
    });

    // 4. Custom formatting example
    console.log("🎯 Custom Format Example:");
    console.log("-".repeat(50));
    packages.forEach((pkg) => {
      const commandCount = Object.keys(pkg.bin || {}).length;
      const customFormat = `
📦 ${pkg.name}
${pkg.description ? `📝 ${pkg.description}` : ""}
🔧 ${commandCount} executable command${commandCount > 1 ? "s" : ""}
🚀 Run with: npx ${pkg.name}
${pkg.links?.repository ? `📂 Repo: ${pkg.links.repository}` : ""}
`;
      console.log(customFormat);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the test
test("@modelcontextprotocol");
