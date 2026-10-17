import tseslint from 'typescript-eslint'

export default [
  { ignores: ['**/node_modules/**', '**/lib/**', '**/.tmp/**', '**/.abzu/**', '.trellis/**', 'tools/**', 'scripts/evaluation/**'] },
  // Y10(批F):接入 typescript-eslint recommended 基线(原 6 条保留见下)。
  ...tseslint.configs.recommended,
  {
    files: ['packages/**/*.{ts,tsx,mjs}', 'scripts/**/*.mjs'],
    languageOptions: { parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-debugger': 'error', 'no-constant-binary-expression': 'error', 'no-dupe-args': 'error', 'no-unreachable': 'error', 'no-sparse-arrays': 'error', 'no-unsafe-finally': 'error',
      // Y10:未用变量按错误清零;参数/变量以 _ 前缀显式表示有意忽略(含解构丢弃)。
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Y10:测试面暂缓 no-explicit-any(桩/双跑返回形状宽松,逐处收型是后续投资);
  // 产线代码(src)按 recommended 全量执行。
  {
    files: ['packages/**/tests/**/*.{ts,tsx,mjs}', 'packages/**/tests/**/*.mjs'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  // Y13(批F):typed-lint 试点——projectService 供类型(仅 src;tests 不在任何 tsconfig 内),
  // 只开三条低噪高值规则:浮空 Promise、误用 Promise(当值/条件)、await 非可等待。
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
]
