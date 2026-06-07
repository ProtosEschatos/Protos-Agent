# Design System Skill

Comprehensive design system skill that injects CSS best practices, component patterns, color theory, spacing scales, accessibility guidelines, animation patterns, and modern CSS features into the agent context.

## CSS Best Practices

### CSS Custom Properties (Variables)
Define design tokens as custom properties on `:root`:
```css
:root {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-surface: #ffffff;
  --color-surface-alt: #f9fafb;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --spacing-unit: 0.25rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Layout Patterns
- **CSS Grid** for page layouts and card grids: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
- **Flexbox** for component-level alignment and centering
- **Container queries** for component-based responsiveness
- Use `gap` instead of margin on flex/grid children
- **max-width + margin auto** for content centering (prefer `--max-content-width` token)

### Responsive Design
- Mobile-first: write base styles for mobile, use `min-width` media queries for larger breakpoints
- Breakpoints: `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl), `1536px` (2xl)
- Use `clamp()` for fluid typography: `font-size: clamp(1rem, 2.5vw, 2rem)`
- Images: `max-width: 100%; height: auto;` by default
- Test at 375px (iPhone SE), 768px (tablet), 1440px (desktop)

## Component Patterns

### Buttons
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 150ms ease;
  cursor: pointer;
  border: none;
  text-decoration: none;
}
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn-secondary { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
.btn-ghost { background: transparent; color: var(--color-text); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
/* Sizes */
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
.btn-lg { padding: 0.75rem 1.75rem; font-size: 1rem; }
```

### Cards
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.card-header { margin-bottom: 1rem; font-weight: 700; font-size: 1.125rem; }
.card-body { color: var(--color-text-muted); line-height: 1.6; }
.card-footer { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
```

### Forms
```css
.form-group { margin-bottom: 1.25rem; }
.form-label { display: block; margin-bottom: 0.375rem; font-weight: 500; font-size: 0.875rem; }
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  background: var(--color-surface);
}
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.form-error { color: #dc2626; font-size: 0.8125rem; margin-top: 0.25rem; }
```

### Modals
```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgb(0 0 0 / 0.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  animation: fadeIn 150ms ease;
}
.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 2rem;
  max-width: 500px; width: 90%;
  box-shadow: var(--shadow-lg);
  animation: slideUp 200ms ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
```

## Spacing Scale
Use a consistent 4px-based scale:
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 0.25rem (4px) | Tight inline padding, icon gaps |
| `--space-2` | 0.5rem (8px) | Inline element gaps, tight sections |
| `--space-3` | 0.75rem (12px) | Section padding (small) |
| `--space-4` | 1rem (16px) | Standard padding, card padding |
| `--space-6` | 1.5rem (24px) | Section spacing, form groups |
| `--space-8` | 2rem (32px) | Large section gaps |
| `--space-12` | 3rem (48px) | Hero section padding |
| `--space-16` | 4rem (64px) | Page section vertical spacing |

## Typography Scale
```css
--text-xs: 0.75rem;   /* 12px - captions */
--text-sm: 0.875rem;  /* 14px - body small, labels */
--text-base: 1rem;    /* 16px - body */
--text-lg: 1.125rem;  /* 18px - large body */
--text-xl: 1.25rem;   /* 20px - h4 */
--text-2xl: 1.5rem;   /* 24px - h3 */
--text-3xl: 1.875rem; /* 30px - h2 */
--text-4xl: 2.25rem;  /* 36px - h1 */
--text-5xl: 3rem;     /* 48px - hero */
```

## Color Theory
- **Primary**: Main brand color — used for buttons, links, focus rings
- **Secondary**: Complementary accent — used for secondary actions, badges
- **Neutral palette**: Grays for text hierarchy, borders, backgrounds
- **Semantic colors**: `#dc2626` (error), `#16a34a` (success), `#f59e0b` (warning), `#3b82f6` (info)
- **60-30-10 rule**: 60% neutral, 30% primary, 10% accent
- **WCAG contrast**: Body text needs 4.5:1 minimum, large text 3:1

## Accessibility (WCAG 2.1 AA)
- All interactive elements must be keyboard accessible (Tab, Enter, Escape)
- `:focus-visible` outlines on all focusable elements (never `outline: none` without replacement)
- `role`, `aria-label`, `aria-expanded`, `aria-hidden` where appropriate
- Form inputs must have associated `<label>` elements
- Images need meaningful `alt` text (or `alt=""` if decorative)
- `prefers-reduced-motion` media query to disable animations
- Semantic HTML: use `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`
- Minimum touch target 44x44px for interactive elements
- Color is never the only means of conveying information

## Animation Patterns
```css
/* Preferred: use transform and opacity (GPU-accelerated) */
.transition-standard { transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1); }
.transition-enter { transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.transition-exit { transition: all 150ms cubic-bezier(0.4, 0, 1, 1); }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### Keyframe Animations
- **fadeIn**: opacity 0→1
- **slideInUp**: translateY(20px)+opacity(0) → translateY(0)+opacity(1)
- **scaleIn**: scale(0.95)+opacity(0) → scale(1)+opacity(1)
- **pulse**: scale(1) → scale(1.05) → scale(1) — for attention
- Keep animations under 500ms; prefer 150-300ms

## Modern CSS Features

### `:has()` — Parent/ancestor selectors
```css
.card:has(img) { padding-top: 0; }
.form-group:has(.form-error) .form-input { border-color: #dc2626; }
```

### Container Queries
```css
.card-container { container-type: inline-size; }
@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 1fr 1fr; }
}
```

### `@layer` — Cascade control
```css
@layer reset, base, components, utilities;
@layer reset { /* CSS reset */ }
@layer components { /* Components */ }
```

### `color-mix()`
```css
.btn-primary:hover { background: color-mix(in srgb, var(--color-primary) 85%, black); }
```

## Tailwind CSS Reference (if applicable)
When generating Tailwind code, use:
- Spacing: `p-4` (1rem), `p-6` (1.5rem), `py-12` (3rem), `gap-4`
- Flex: `flex items-center justify-between gap-4`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Typography: `text-sm`, `text-lg`, `text-2xl`, `font-semibold`, `text-gray-600`
- Colors: `bg-blue-600 hover:bg-blue-700`, `text-gray-900`, `border-gray-200`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- Border radius: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Transitions: `transition-all duration-200 ease-in-out`
- Responsive: `md:flex-row`, `lg:grid-cols-3`, `xl:max-w-7xl`

## Design Workflow
1. **Layout first**: Structure the HTML semantically before styling
2. **Tokens**: Define CSS custom properties for colors, spacing, typography
3. **Mobile-first**: Style for the smallest viewport, then layer in breakpoints
4. **Components**: Build bottom-up — buttons → cards → sections → pages
5. **Animate last**: Add transitions and keyframes after layout and styles are solid
6. **Accessibility check**: Verify contrast, keyboard navigation, and screen reader support
7. **Test**: View at multiple breakpoints, test all interactive states (hover, focus, active, disabled)
