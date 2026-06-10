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

## Forbidden
- Raw Three.js → use TresJS
- Inline CSS → use Tailwind classes + CSS variables
- VeeValidate → use Nuxt UI v3 Zod integration
- @nuxtjs/tailwindcss → Nuxt UI v3 includes Tailwind
- Font Awesome → @nuxt/icon
