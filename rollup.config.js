import { defineConfig } from "rollup";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import styles from "rollup-plugin-styles";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import importAssets from "rollup-plugin-import-assets";
import externalGlobals from "rollup-plugin-external-globals";
import svgr from "@svgr/rollup";

import alias from "@rollup/plugin-alias";
import { babel } from "@rollup/plugin-babel";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const manifest = require("./plugin.json");
const pkg = require("./package.json");

export default defineConfig({
  input: "./src/ts/index.tsx",
  plugins: [
    del({ targets: "./dist/*", force: true }),

	alias({
	  entries: [
	    {
	      find: /^mobx$/,
	      replacement: path.resolve(__dirname, "src/ts/mobx_shim.ts"),
	      // prevent aliasing mobx inside the shim itself
	      customResolver(source, importer) {
	        if (importer && importer.endsWith("src/ts/mobx_shim.ts")) {
	          return null; // let Rollup resolve real mobx
	        }
	        return null; // default resolution
	      },
	    },
	  ],
	}),

    typescript(),
    json(),
    styles(),
    svgr({ icon: true }),

    commonjs({ transformMixedEsModules: true }),
    nodeResolve({ browser: true }),

    externalGlobals({
      react: "SP_REACT",
      "react-dom": "SP_REACTDOM",
      "@decky/ui": "DFL",
      "@decky/manifest": JSON.stringify(manifest),
      "@decky/pkg": JSON.stringify(pkg),
    }),

    // Downlevel any modern syntax that Steam’s embedded CEF might not support
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".ts", ".tsx"],
      // include deps too (some deps emit ?. / ??)
      exclude: [],
      presets: [["@babel/preset-env", { targets: { chrome: "79" }, bugfixes: true }]],
    }),

    replace({
      preventAssignment: false,
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
    }),

    importAssets({
      publicPath: `http://127.0.0.1:1337/plugins/${manifest.name}/`,
    }),
  ],

  context: "window",
  external: ["react", "react-dom", "@decky/ui"],

  treeshake: {
    pureExternalImports: { pure: ["@decky/ui", "@decky/api"] },
    preset: "smallest",
  },

  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
    sourcemapPathTransform: (relativeSourcePath) =>
      relativeSourcePath.replace(/^\.\.\//, `decky://decky/plugin/${encodeURIComponent(manifest.name)}/`),
    exports: "default",
  },
});