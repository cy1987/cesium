const path = require("path");
module.exports = {
    env: {
        node: true,
    },
    extends: [
        "plugin:vue/essential",
        "eslint:recommended",
        "@vue/typescript/recommended",
        "@vue/prettier",
        "@vue/prettier/@typescript-eslint",
    ],
    parserOptions: {
        ecmaVersion: 2020,
        parser: "@typescript-eslint/parser", // ESLint的解析器，用于解析TypeScript，从而检查和规范TypeScript代码
    },
    rules: {
        // "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
        // "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-console": "off",
        "no-debugger": "off",
        // 强制模块内的 import 排序
        "sort-imports": 0,
        // 禁止出现未使用过的变量
        "no-unused-vars": "off",
        // 要求同一个声明块中的变量按顺序排列
        "sort-vars": 0,
        // 要求操作符周围有空格
        "space-infix-ops": 2,
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "no-useless-escape": "off",
        "no-inferrable-types": [false,"ignore-params"],
        "prefer-const": "off",
        "@typescript-eslint/camelcase": ["off", { properties: "always" }],
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        // 强制在 function的左括号之前使用一致的空格
        "space-before-function-paren": 0
    },
};
