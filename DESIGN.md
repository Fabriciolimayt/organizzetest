# Organizze Design System

## 1. Atmosphere & Identity

Organizze feels like an independent financial journal edited in real time: precise enough for serious decisions, vivid enough to make the numbers feel consequential, and human enough for daily use. The signature is **neo-editorial finance**: mineral paper, near-black green ink, oversized financial figures, electric-blue annotations, coral risk markers, and ruled ledger lines.

The memorable moment is the **editorial balance**: one monumental value crossing the page grid beside a dark monthly-decision panel. The interface must never resemble a trading terminal, crypto product, generic component gallery, or pastel wellness app. It is an authored instrument for understanding household money.

Design references: Mastercard's editorial warmth and confident financial framing, interpreted through Organizze's own color and content; StyleGallery `fixed-sidenav-shell`, `page-grid`, and `main-with-rail` patterns for spatial behavior. The advertised `redesign-skill.md`, `gpt-tasteskill.md`, and local Layer-B files were unavailable in the installed skill package, so the documented router principles and `frontend-design` guidance are the fallback.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Canvas | `--background` | `48 42% 96%` | `160 25% 7%` | Mineral paper canvas |
| Surface | `--card` | `0 0% 100%` | `150 10% 11%` | Panels, dialogs, menus |
| Surface quiet | `--muted` | `48 24% 91%` | `160 16% 13%` | Ruled areas, selected rows |
| Text primary | `--foreground` | `164 32% 10%` | `48 32% 95%` | Ink, headings, financial values |
| Text secondary | `--muted-foreground` | `164 9% 39%` | `150 7% 66%` | Metadata and supporting copy |
| Border | `--border` | `164 15% 78%` | `160 10% 24%` | Deliberate ledger rules |
| Ink green | `--primary` | `158 72% 21%` | `78 88% 66%` | Primary actions, positive guidance |
| Ink hover | `--primary-hover` | `160 78% 15%` | `78 90% 72%` | Hover and active emphasis |
| Electric blue | `--data-blue` | `224 88% 57%` | `220 92% 68%` | Income, links, analytical annotation |
| Data violet | `--data-violet` | `275 69% 50%` | `274 72% 70%` | Goals and future planning |
| Acid marker | `--marker` | `75 96% 56%` | `75 90% 58%` | Tiny highlights and status markers only |
| Warning | `--warning` | `35 92% 46%` | `39 88% 64%` | Attention and near-limit states |
| Destructive / coral | `--destructive` | `8 82% 55%` | `8 86% 67%` | Expenses at risk and destructive actions |
| Ink panel | `--ink-panel` | `164 36% 9%` | `164 36% 9%` | High-contrast decision surfaces |
| Success wash | `--success-wash` | `77 66% 86%` | `158 22% 17%` | Positive inline feedback |
| Warning wash | `--warning-wash` | `38 82% 88%` | `38 24% 18%` | Contextual warnings |

### Rules

- Ink green anchors navigation and primary commands. Electric blue and coral make the palette deliberately multi-note.
- Acid marker is used only for small highlights, never as a page background or large fill.
- Financial semantics use text, icons, and labels in addition to color.
- Category colors are limited to the documented data ramp; no arbitrary rainbow palette.
- Raw color values belong only in this file and the global token declaration.
- Both themes must meet WCAG 2.2 AA contrast requirements.

## 3. Typography

### Font Stack

- UI: `DM Sans`, `Helvetica Neue`, system sans-serif.
- Display: `Fraunces`, Georgia, serif, with a restrained optical axis.
- Financial values and metadata: `IBM Plex Mono`, system monospace.

### Scale

| Level | Size | Weight | Line height | Usage |
| --- | --- | --- | --- | --- |
| Display | `clamp(3rem, 8vw, 7.5rem)` | 600 | 0.9 | Landing and editorial balance only |
| H1 | `clamp(2rem, 4vw, 3.75rem)` | 600 | 0.98 | Page title and primary statements |
| H2 | `1.375rem` | 600 | 1.25 | Major panel title |
| H3 | `1rem` | 650 | 1.35 | Compact panel title |
| Value XL | `clamp(3rem, 8vw, 6.5rem)` | 600 | 0.9 | Editorial balance |
| Value | `1.375rem` | 650 | 1.1 | Metric values |
| Body | `0.9375rem` | 400 | 1.55 | Default product copy |
| Body small | `0.8125rem` | 450 | 1.45 | Metadata and supporting copy |
| Label | `0.75rem` | 650 | 1.3 | Controls and compact labels |

### Rules

- Fraunces owns display statements and major page headings; it never appears in dense tables.
- IBM Plex Mono owns financial values, dates, ratios, and compact metadata.
- Letter spacing is `0`; hierarchy comes from weight, size, and whitespace.
- Body text never drops below 13px.
- Long titles wrap naturally and never use viewport-scaled font sizes.

## 4. Spacing & Layout

### Spacing

The base unit is 4px. Product spacing uses `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

### Application Shell

- Desktop: fixed 232px side navigation, compact utility header, and one scrolling main region.
- Tablet: collapsed icon rail or drawer; main content remains the only scroll owner.
- Mobile: compact top header plus five-item bottom navigation; secondary destinations live in a menu sheet.
- Full-height shells use `100dvh` and `min-height: 0` on the scrolling child.
- Main content width is capped at 1280px with responsive gutters of 16px, 24px, and 32px.
- Repeated content grids use `repeat(auto-fit, minmax(min(16rem, 100%), 1fr))`.

### Page Grammar

Every product page follows: editorial header, one dominant financial statement, supporting rail or compact controls, detailed evidence, then secondary actions. Use `main-with-rail` when a decision summary meaningfully supports the main data. Pages do not begin with a uniform card grid.

## 5. Components

### App Shell

- **Structure**: fixed navigation + utility header + scrollable main + mobile bottom navigation.
- **States**: expanded, collapsed, mobile drawer, active destination.
- **Accessibility**: labeled navigation landmarks, current-page state, keyboard-reachable menu.
- **Motion**: 180ms opacity/transform transitions; reduced-motion path is immediate.

### Page Header

- **Structure**: title, one-line context, optional period control, primary action.
- **Variants**: standard, period-aware, compact mobile.
- **Layout**: cluster that wraps before actions collide with titles.

### Metric Strip

- **Structure**: label, tabular value, comparison or status.
- **Variants**: neutral, income, expense, warning.
- **States**: loading skeleton, unavailable, negative, positive.
- **Rule**: the first metric may become an editorial balance; supporting metrics sit on ruled lines, never a uniform four-card row.

### Data Panel

- **Structure**: header, optional controls, body, footer action.
- **Variants**: chart, list, table, allocation, empty.
- **Depth**: white surface, crisp border, radius 8px, no nested cards.
- **States**: loading, empty, error, filtered-empty, populated.

### Financial Row

- **Structure**: semantic icon, description, metadata, amount, optional row action.
- **Variants**: transaction, category, member, goal.
- **Accessibility**: row action has a visible label or tooltip and does not make the whole row ambiguously clickable.

### Controls

- Buttons use familiar Lucide icons where the project already depends on Lucide.
- Primary buttons are compact sage rectangles with radius 6px.
- Segmented controls represent modes; switches represent binary settings; menus represent option sets.
- Every icon-only action has a tooltip and accessible name.

### Empty and Guidance States

- **Structure**: restrained icon, direct statement, one explanatory sentence, one action.
- Guidance may use Newsreader for the statement.
- No emojis, fake data, decorative blobs, or illustrations that obscure the workflow.

### Primitive Showcase

Before product screens are migrated, the implementation must provide a temporary internal showcase covering button, input, badge, metric, data panel, financial row, empty state, navigation item, and their required states at 375px, 768px, and 1280px.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | 140ms | ease-out | Press, checkbox, compact feedback |
| Standard | 220ms | cubic-bezier(0.16, 1, 0.3, 1) | Menu, tooltip, selected state |
| Panel | 320ms | cubic-bezier(0.16, 1, 0.3, 1) | Drawer and dialog |
| Editorial reveal | 520ms | cubic-bezier(0.16, 1, 0.3, 1) | Hero copy and primary financial statement |

- Motion communicates state or spatial continuity only.
- Animate `transform` and `opacity`; avoid animated layout properties.
- Hover never becomes the only way to discover an action.
- `prefers-reduced-motion` disables non-essential transitions.
- Numeric changes follow the beui.dev `number` mechanism: interpolate from the previous value; reduced motion snaps immediately.
- Navigation follows `shared-layout-bg` conceptually through a retargetable CSS transform/opacity marker; no motion dependency is added.
- Loading uses skeletons with restrained opacity, not looping decorative motion.

## 7. Depth & Surface

The strategy is **paper, ink, and deliberate print depth**.

- Canvas, surface, and quiet surface create three levels.
- Default panels use one 1px ink-tinted border. Featured paper panels may use a 3px offset ink shadow to feel printed, never floating.
- One ink panel per viewport may invert the palette for decisions or calls to action.
- Menus and dialogs may use one diffuse shadow below 8% opacity.
- No gradients, glassmorphism, glowing borders, blurred blobs, nested cards, or soft generic elevation.
- Radius is 6px for controls and 8px for panels; pills are reserved for compact statuses.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA: 4.5:1 body contrast, 3:1 large text and UI boundaries.
- Visible focus on every interactive control.
- Minimum touch target is 44px on mobile.
- Complete keyboard access for navigation, menus, dialogs, filters, and tables.
- Financial meaning is never color-only.
- Charts provide a textual summary and accessible labels.
- Content survives 200% zoom, long Portuguese labels, empty states, and unbroken values.

### Accepted Debt

| Item | Location | Why accepted | Exit |
| --- | --- | --- | --- |
| Existing product copy may need a dedicated content pass | Legacy onboarding and diagnostic routes | This redesign prioritizes workflow clarity and visual consistency | Review copy during each route migration |
| Light theme ships first | Entire application | User selected the clear direction; dark tokens remain documented for later | Complete dark-theme visual QA in a separate pass |
