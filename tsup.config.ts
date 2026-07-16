import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  platform: "neutral",
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  banner: {
    js: '// linkdirecte – universal SDK (Node.js, Bun, Deno, Browsers, Workers, React Native)',
  },
});
