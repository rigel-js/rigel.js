import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/rigel.js",
    format: "cjs",
    exports: "default",
  },
  plugins: [
    typescript({ lib: ["es5", "es6", "es2017", "dom"], target: "es5" }),
  ],
};
