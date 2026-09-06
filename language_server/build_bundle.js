import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist_sea/clyde.js",
    platform: "node",
    target: "node26",
    format: "cjs",
    sourcemap: true,
    minify: true,
  })
  .catch(() => process.exit(1));
