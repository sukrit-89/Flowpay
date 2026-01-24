# Yieldra Design System

## Overview

A premium, minimalist design system built on the principles of clarity, restraint, and timeless elegance. The system emphasizes professional aesthetics, accessibility, and intentional use of space and color.

---

## Color Palette

### Primary Surfaces

- **White**: `#ffffff` - Primary surfaces, cards, modals
- **Slate 50**: `#fafbfc` - Subtle backgrounds
- **Slate 100**: `#f3f4f6` - Secondary backgrounds

### Content & Text

- **Slate 900**: `#111827` - Primary text, headings
- **Slate 600**: `#4b5563` - Secondary text, descriptions
- **Slate 500**: `#6b7280` - Tertiary text, muted content

### Accent Color: Muted Emerald

- **Emerald 600**: `#16a34a` - Primary action, call-to-action
- **Emerald 700**: `#15803d` - Hover states
- **Emerald 50**: `#f0fdf4` - Accent backgrounds
- **Emerald 100**: `#dcfce7` - Status indicators

### Status Colors

- **Success**: Emerald 600
- **Warning**: Amber 500 (`#f59e0b`)
- **Error**: Rose 600 (`#e11d48`)
- **Info**: Cyan 600 (`#0891b2`)

### Borders

- **Primary**: Slate 200 (`#e5e7eb`)
- **Secondary**: Slate 300 (`#d1d5db`)
- **Subtle**: Slate 100 (`#f3f4f6`)

---

## Typography

### Font Family

- **Primary**: Inter (system fallback to sans-serif)
- **Line Height**: 1.5 base, tight for headings

### Scale

| Role  | Size | Weight         | Line Height |
| ----- | ---- | -------------- | ----------- |
| H1    | 48px | Bold (700)     | 48px        |
| H2    | 36px | Bold (700)     | 40px        |
| H3    | 30px | Bold (700)     | 36px        |
| H4    | 24px | Semibold (600) | 32px        |
| H5    | 20px | Semibold (600) | 28px        |
| H6    | 18px | Semibold (600) | 28px        |
| Body  | 16px | Normal (400)   | 24px        |
| Small | 14px | Normal (400)   | 20px        |
| Xs    | 12px | Normal (400)   | 16px        |

### Usage

- **Headings**: Use for page titles and major sections. Tight letter-spacing (-0.01 to -0.02em)
- **Body**: Default text. Good contrast and readability
- **Labels**: Small, uppercase, medium weight for form fields
- **Captions**: Extra small, muted, for secondary info

---

## Spacing Scale

| Token | Value |
| ----- | ----- |
| 0     | 0     |
| 1     | 4px   |
| 2     | 8px   |
| 3     | 12px  |
| 4     | 16px  |
| 5     | 20px  |
| 6     | 24px  |
| 8     | 32px  |
| 10    | 40px  |
| 12    | 48px  |
| 16    | 64px  |
| 20    | 80px  |
| 24    | 96px  |

### Application

- **Padding**: Cards = 24px, Sections = 32px+
- **Gaps**: Between elements = 16px-24px
- **Margins**: Vertical rhythm = 24px between sections

---

## Border Radius

| Token   | Value  |
| ------- | ------ |
| sm      | 4px    |
| DEFAULT | 6px    |
| md      | 8px    |
| lg      | 12px   |
| xl      | 16px   |
| 2xl     | 20px   |
| full    | 9999px |

**Usage**: Cards and inputs = 6-8px, Badges = full, Buttons = 6-12px

---

## Shadows

| Type     | Usage                                        |
| -------- | -------------------------------------------- |
| xs       | Subtle elevation, small interactive elements |
| sm       | Cards at rest, button states                 |
| md       | Cards on hover, modals at rest               |
| lg       | Modals with emphasis, floating elements      |
| elevated | Maximum depth, overlays                      |

**Principle**: Shadows are subtle and refined. Never use neon or harsh shadows.

---

## Component Styles

### Buttons

**Primary (btn-primary)**

- Background: Emerald 600
- Text: White
- Hover: Emerald 700
- Active: Emerald 800
- Use: Main actions, CTAs

**Secondary (btn-secondary)**

- Background: Slate 100
- Text: Slate 900
- Hover: Slate 200
- Use: Secondary actions

**Tertiary (btn-tertiary)**

- Background: Transparent with border
- Border: Slate 300
- Text: Slate 600
- Hover: Slate 50 background
- Use: Less prominent actions

**Ghost (btn-ghost)**

- Background: Transparent
- Text: Slate 600
- Hover: Slate 100
- Use: Minimal, link-like actions

### Cards

- Background: White
- Border: Slate 200 (1px)
- Padding: 24px
- Radius: 8px
- Shadow: sm
- On Hover (interactive): shadow-md, slight scale increase

### Form Inputs

- Background: White
- Border: Slate 300
- Radius: 6px
- Padding: 8-12px
- Focus: Ring emerald 500 (2px offset 0)
- Placeholder: Slate 500
- Disabled: Background slate 100, cursor not-allowed

### Badges

- Padding: 2.5px 10px
- Radius: full
- Font Size: 12px
- Font Weight: 500

Status variants:

- Primary: Emerald 100 background, Emerald 800 text
- Success: Same as primary
- Warning: Amber 100, Amber 800
- Error: Rose 100, Rose 800

---

## Animations & Transitions

### Duration Scale

- **Fast**: 150ms (micro-interactions, hovers)
- **Base**: 200ms (standard state changes)
- **Slow**: 300ms (page transitions, complex animations)

### Easing

- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)` - Smooth, professional
- Avoid: Linear, ease-in, ease-out for general use

### Patterns

**Entrance**

- Fade in: opacity 0 → 1 (200-300ms)
- Slide up: translateY(12px) → 0 (200-300ms)
- Scale in: scale(0.95) → 1 (200ms)

**Hover States**

- Subtle scale: 1 → 1.01-1.02
- Light shadow increase
- Color transitions

**Exit**

- Quick fade: 100-150ms
- Optional slide out

---

## Layout Patterns

### Containers

- **Max Width**: 1280px (7xl)
- **Padding**: 24px horizontal
- **Responsive**: Full width on mobile, constrained on desktop

### Sections

- **Vertical Padding**: 48px-80px (py-12 to py-20)
- **Top/Bottom Spacing**: Consistent rhythm

### Grids

- **Desktop**: 4-column for stats/features, 2-column for detailed cards
- **Tablet**: 2-column layouts
- **Mobile**: 1-column, full width

---

## Accessibility

### Contrast

- Text on backgrounds: Minimum 4.5:1 contrast ratio
- Focus indicators: Always visible, emerald ring

### Interactive Elements

- **Minimum size**: 44x44px for touch targets
- **Focus states**: Clear, outlined ring
- **Hover states**: Visible without color alone

### Typography

- Headings properly nested (h1 → h2 → h3)
- Sufficient line height (1.5 minimum)
- Readable font sizes (16px minimum for body)

---

## Design Principles

1. **Restraint**: Use color sparingly. White space is a design element.
2. **Clarity**: Every element has a purpose. Avoid decoration.
3. **Intentionality**: Spacing, sizing, and colors are deliberate.
4. **Timelessness**: Avoid trendy patterns. Classic aesthetics endure.
5. **Professional**: Suitable for enterprise and fintech applications.
6. **Human-Centered**: Comfortable, readable, and accessible.

---

## Usage Guidelines

### Do's

✅ Use the spacing scale consistently
✅ Apply shadows subtly
✅ Maintain sufficient contrast
✅ Use emerald accent sparingly for primary actions
✅ Group related content with consistent spacing
✅ Use meaningful interactions, not flashy ones

### Don'ts

❌ Mix color palettes or add gradients unnecessarily
❌ Use harsh shadows or glows
❌ Create perfectly symmetrical layouts everywhere
❌ Add animations for decoration
❌ Over-saturate with accent colors
❌ Use thick borders or high contrast without purpose

---

## Component Library

All components are defined in `src/index.css` under `@layer components`:

- `.card` - Base card style
- `.card-interactive` - Hoverable card
- `.btn`, `.btn-primary`, `.btn-secondary`, etc. - Button variants
- `.input` - Form input
- `.label` - Form label
- `.badge` - Status badges
- `.container-max` - Max-width container
- `.section` - Vertical section padding
- `.divider` - Subtle line separators

---

## Customization

The design system is built with Tailwind CSS and CSS variables. To customize:

1. **Colors**: Update CSS variables in `:root` in `src/index.css`
2. **Spacing**: Modify `tailwind.config.js` extend.spacing
3. **Shadows**: Update boxShadow in config
4. **Components**: Extend `@layer components` in `src/index.css`

All customizations maintain the system's principles of restraint and professionalism.
