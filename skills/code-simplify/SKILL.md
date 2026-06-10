# Code Simplification Skill

> Load this skill when tasked with refactoring, simplifying, or cleaning up code. Focus: reduce complexity while maintaining functionality.

## Simplification Principles

1. **Remove dead code** — unused imports, variables, functions, commented-out blocks
2. **Reduce nesting** — early returns, extract functions, flatten conditionals
3. **Single responsibility** — each function/component does one thing
4. **DRY without over-engineering** — extract repeated patterns but don't create abstractions for 2 occurrences
5. **Consistent patterns** — match existing project conventions (don't introduce new patterns)
6. **Type safety** — use TypeScript properly, avoid `any`, prefer inferred types

## Before/After Pattern
```
## Simplification: [filename]
### Before: (problem — what made it complex)
### After: (solution — what was simplified)
### Lines: N → M (reduction)
### Behavior: identical ✅
```

## Project Conventions (Nuxt 4 + Vue 3)
- Composition API `<script setup lang="ts">`
- Composables for reusable logic (`app/composables/`)
- Pinia stores for global state (`app/stores/`)
- Nuxt auto-imports (no manual `import { ref } from 'vue'`)
- CSS variables for theme colors (no hardcoded hex)
