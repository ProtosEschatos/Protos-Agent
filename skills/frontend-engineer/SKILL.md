# Frontend Engineer Skill

> Load this skill for UI/UX implementation, component development, layout design, or visual polish in Vue 3 / Nuxt 4 + Tailwind.

## Component Patterns

1. **SFC structure**: `<script setup lang="ts">` → `<template>` → `<style scoped>`
2. **Nuxt UI v3**: use `UButton`, `UCard`, `UModal`, `UInput`, etc. before custom implementations
3. **CSS variables**: `var(--primary)`, `var(--bg)`, etc. from theme system
4. **Responsive first**: mobile (375px+) → tablet (768px) → desktop (1024px+)
5. **Animations**: `@vueuse/motion` for simple, GSAP in `.client.ts` plugins for complex
6. **Accessibility**: semantic HTML, focus-visible, prefers-reduced-motion

## Theme System
| Mode | Primary | Secondary | Accent | Background |
|------|---------|-----------|--------|------------|
| Night | `#6366f1` | `#06b6d4` | `#f59e0b` | `#0a0a1a` |
| Day | `#f43f5e` | `#06b6d4` | `#f97316` | `#fdf2f8` |
| Profi | `#dc2626` | `#d4af37` | `#991b1b` | `#000000` |

## Guidelines
- Prefer TresJS over direct Three.js
- Use Tailwind classes + CSS variables over inline styles
- Nuxt UI v3 built-in Zod validation over VeeValidate
- Nuxt UI v3 includes Tailwind v4 (no separate @nuxtjs/tailwindcss)
- @nuxt/icon over Font Awesome
