const expoConfig = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      ".expo/**",
      "coverage/**",
      "node_modules/**",
      "lib/wearables/index.ts",
      "lib/wearables/healthkit.ts",
      "lib/wearables/health-connect.ts",
    ],
  },
]);
