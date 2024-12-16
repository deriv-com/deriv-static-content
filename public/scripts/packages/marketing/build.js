import { build } from "esbuild";
import { resolve, join } from "path";
import { rmSync, mkdirSync } from "fs";
import { globSync } from "glob";

const srcDir = resolve("src");
const distDir = resolve("dist");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const files = globSync("src/**/*.js");

if (files.length === 0) {
  console.log("No JavaScript files found in src/");
  process.exit(0);
}

Promise.all(
  files.map((file) => {
    const outputFile = join(distDir, file.replace("src/", ""));
    return build({
      entryPoints: [file],
      bundle: true,
      minify: true,
      sourcemap: true,
      outfile: outputFile,
      format: "esm",
    })
      .then(() => {
        console.log(`Built and minified: ${file} → ${outputFile}`);
      })
      .catch((err) => {
        console.error("Build failed:", err);
        process.exit(1);
      });
  })
)
  .then(() => console.log("Build completed for all JS files"))
  .catch((err) => {
    console.error("Error during build process:", err);
    process.exit(1);
  });
