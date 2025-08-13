module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
        modules: "commonjs",
      },
    ],
    "@babel/preset-typescript",
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    // Este plugin adiciona a extensão correta aos imports, resolvendo o problema.
    ["babel-plugin-add-import-extension", { extension: "cjs" }],
    [
      "babel-plugin-module-resolver",
      {
        alias: {
          // Seus aliases aqui
        },
      },
    ],
  ],
  ignore: ["**/*.d.ts"],
};
