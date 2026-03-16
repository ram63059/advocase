# Stage 19: Design System

## Goal
Define the complete visual language for Advocase — colors, typography, spacing, component variants, and shadcn/ui configuration. Every component built throughout all stages must follow this spec.

---

## Color Palette

### CSS Variables (`app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand */
    --color-navy: 26 26 46;          /* #1A1A2E */
    --color-indigo: 79 70 229;       /* #4F46E5 */

    /* Semantic */
    --color-success: 16 185 129;     /* #10B981 */
    --color-warning: 245 158 11;     /* #F59E0B */
    --color-danger: 239 68 68;       /* #EF4444 */
    --color-info: 59 130 246;        /* #3B82F6 */

    /* Layout */
    --background: 248 250 252;       /* #F8FAFC */
    --surface: 255 255 255;          /* #FFFFFF */
    --border: 226 232 240;           /* #E2E8F0 */

    /* Text */
    --text-primary: 30 41 59;        /* #1E293B slate-800 */
    --text-muted: 100 116 139;       /* #64748B slate-500 */
    --text-light: 148 163 184;       /* #94A3B8 slate-400 */

    /* shadcn CSS vars */
    --radius: 0.5rem;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 238 83% 66%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --input: 214.3 31.8% 91.4%;
    --ring: 238 83% 66%;
  }

  .dark {
    --background: 17 24 39;
    --surface: 31 41 55;
    --border: 55 65 81;
    --text-primary: 241 245 249;
    --text-muted: 148 163 184;

    /* shadcn dark vars */
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 238 83% 66%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  body {
    @apply bg-slate-50 text-slate-800 antialiased;
  }

  h1 { @apply text-2xl font-semibold tracking-tight; }
  h2 { @apply text-xl font-semibold; }
  h3 { @apply text-base font-semibold; }
}
```

---

## Typography

| Element | Class | Size | Weight |
|---------|-------|------|--------|
| Page Title | `text-2xl font-semibold` | 24px | 600 |
| Section Title | `text-xl font-semibold` | 20px | 600 |
| Card Title | `text-base font-semibold` | 16px | 600 |
| Body | `text-sm` | 14px | 400 |
| Small/Muted | `text-xs text-muted-foreground` | 12px | 400 |
| Case Number | `font-mono text-sm` | 14px | 400 |
| Stat Number | `text-3xl font-bold` | 30px | 700 |

**Fonts:** Inter (body), JetBrains Mono (case numbers/CNR)

---

## Spacing System

Base unit: 4px (Tailwind default)
- `p-4` = 16px padding (standard card/section)
- `gap-4` = 16px gap (standard grid)
- `gap-6` = 24px gap (section separation)
- `space-y-6` = 24px vertical stack (page sections)

---

## Shadows

Only 2 levels used:
- `shadow-sm` — cards, inputs
- `shadow-md` — dropdowns, floating panels

Never use `shadow-lg` or `shadow-xl`.

---

## Border Radius

- `rounded-lg` — cards, modals, sheets (8px)
- `rounded-md` — buttons, inputs, badges (6px)
- `rounded-full` — avatars, status dots

---

## Case Status Badge Colors

```typescript
// components/cases/CaseStatusBadge.tsx
const statusConfig = {
  running: { label: 'Running', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  decided: { label: 'Decided', className: 'bg-green-50 text-green-700 border-green-200' },
  abandoned: { label: 'Abandoned', className: 'bg-slate-50 text-slate-600 border-slate-200' },
}
```

## Priority Badge Colors (Tasks)

```typescript
const priorityConfig = {
  high:   { label: 'High',   className: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low:    { label: 'Low',    className: 'bg-green-50 text-green-700 border-green-200' },
}
```

## Court Type Colors

```typescript
const courtTypeConfig = {
  district: { label: 'District', color: '#6366f1' },
  hc:       { label: 'High Court', color: '#0ea5e9' },
  sc:       { label: 'Supreme Court', color: '#f59e0b' },
  drt:      { label: 'DRT', color: '#10b981' },
  nclt:     { label: 'NCLT', color: '#8b5cf6' },
  consumer: { label: 'Consumer', color: '#ef4444' },
  other:    { label: 'Other', color: '#64748b' },
}
```

---

## Component Variants

### StatCard
```typescript
// components/dashboard/StatCard.tsx
interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  color: 'blue' | 'amber' | 'orange' | 'red' | 'green'
  href: string
  description?: string
}
// Renders: clickable card with large number, label, icon
// Hover: subtle shadow increase, cursor pointer
```

### PageHeader
```typescript
// components/shared/PageHeader.tsx
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode  // buttons on the right
  breadcrumb?: { label: string; href: string }[]
}
```

### EmptyState
```typescript
// components/shared/EmptyState.tsx
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: () => void }
}
// Full-width centered block, no border
```

### LoadingSkeleton
```typescript
// Use shadcn Skeleton component
// CaseCard skeleton: 3 lines (header, body, footer)
// StatCard skeleton: number block + label block
// Table skeleton: header row + 5 body rows
```

---

## Sidebar Design

```
Width: 240px (expanded) / 64px (collapsed on mobile)
Background: white (#FFFFFF)
Border: right border-r border-slate-200

Top: Logo (40px height) + "Advocase" text
Nav items: 48px height each
  - Icon (20px, Lucide)
  - Label
  - Active: bg-indigo-50 text-indigo-700 font-medium
  - Hover: bg-slate-50
  - Indicator: left border-l-2 border-indigo-600 when active

Bottom: User avatar + name + settings gear icon
```

### Navigation Items (max 6)
1. Dashboard (LayoutDashboard icon)
2. Cases (Briefcase icon)
3. Calendar (CalendarDays icon)
4. Clients (Users icon)
5. Tasks (CheckSquare icon) — badge with pending count
6. Search (Search icon) — doubles as reports

### Secondary nav (collapse under ⋮ or gear icon)
- Reminders
- Admin (Team, Fields)
- Settings

---

## Mobile Layout

- Sidebar becomes a bottom tab bar (5 items max)
- Cards stack vertically
- Tables → cards on mobile
- Sheets slide from bottom (not side)
- All tap targets: minimum 44px height

---

## Icon Usage (Lucide React)

All icons at size 20px (`size={20}`) unless:
- Sidebar icons: 20px
- Action buttons: 16px
- Stat cards: 24px
- Empty state illustration: 48px (custom SVG)

Common icons:
```
Briefcase      → Cases
Users          → Clients
CalendarDays   → Calendar
CheckSquare    → Tasks
Bell           → Reminders
Search         → Search
Settings       → Settings
Plus           → Add action
Filter         → Filters
Download       → Export
Upload         → Import
RefreshCw      → Sync
Star           → Important
ChevronRight   → Navigate
MoreHorizontal → More actions
Trash2         → Delete
Pencil         → Edit
Eye            → View
Link           → Link case
FileText       → Document
Receipt        → Fee/Invoice
Scale          → Law/Case type indicator
```

---

## Animation & Transitions

Keep animations subtle and fast:
- Hover transitions: `transition-colors duration-150`
- Sheet/Dialog enter: default shadcn animations (150ms)
- Toast: slide in from top-right
- Skeleton loading: shadcn pulse animation
- No page transitions (instant navigation)

---

## Form Design Rules

1. Label above input (never floating/placeholder-as-label)
2. Error message in red below input (12px)
3. Required fields marked with `*` in label
4. Input height: 40px (`h-10`)
5. Textarea min-height: 80px
6. Submit button: full-width on mobile, auto-width on desktop
7. Cancel/secondary button: outlined variant
8. Destructive action button: destructive variant (red)

---

## Data Table Design

```
Header: bg-slate-50, sticky top, text-xs font-medium uppercase text-muted-foreground
Row height: 52px
Row hover: bg-slate-50/50
Borders: only horizontal (border-b)
Selected row: bg-indigo-50
Actions column: always last, right-aligned, show on row hover
Pagination: bottom, centered, "Previous / 1 2 3 / Next"
```

---

## Sheet (Slide-over) Design Rules

- Width: 480px on desktop, full-width on mobile
- Always has: title, close button (X top-right), form/content, footer with primary + cancel
- Never use Dialog (modal) for forms — always Sheet
- Only use Dialog for confirmation prompts

---

## Verification Checklist
- [ ] `globals.css` has all CSS variables defined
- [ ] Tailwind config has brand colors and fonts
- [ ] shadcn components installed and styled
- [ ] Status badge renders correctly for all 3 statuses
- [ ] Priority badge renders correctly for all 3 priorities
- [ ] Sidebar renders with correct active states
- [ ] Mobile bottom nav works at 375px
- [ ] All forms follow label-above-input pattern
- [ ] No heavy shadows or large border radii used
