# Lyra UI — Component Authoring Guidelines

> **Reference this document every time you create or modify a component.**
> These are the canonical patterns for the lyra-ui library. Deviating from them requires explicit team approval.

---

## Table of Contents

1. [Use Lyra components as designed — never hard-code](#1-use-lyra-components-as-designed--never-hard-code)
2. [Cross-repo sync rule](#2-cross-repo-sync-rule)
3. [Composition over reimplementation](#3-composition-over-reimplementation)
4. [Controlled components](#4-controlled-components)
5. [Z-index hierarchy](#5-z-index-hierarchy)
6. [Icons](#6-icons)
7. [File naming & location](#7-file-naming--location)
8. [Component structure](#8-component-structure)
9. [TypeScript conventions](#9-typescript-conventions)
10. [Variants with CVA](#10-variants-with-cva)
11. [Tailwind & theming](#11-tailwind--theming)
12. [Storybook stories](#12-storybook-stories)
13. [Index exports](#13-index-exports)
14. [Checklist](#14-new-component-checklist)
15. [Debugging: diagnose rendering before behavior](#15-debugging-diagnose-rendering-before-behavior)
16. [Tooltip placement](#16-tooltip-placement)
17. [Portals still bubble through the React tree](#17-portals-still-bubble-through-the-react-tree)

---

## 1. Use Lyra components as designed — never hard-code

**Use lyra-ui components exactly as they're built, no matter what a design mockup, screenshot, or existing code shows. Never hard-code a value that a real component already computes correctly on its own.**

A design image or screenshot is a target for what the *finished, correctly-wired* component should look like — it is never license to hard-code text, styling, formatting, or behavior that fights a component's own built-in logic just to match a static picture. If a component's actual behavior doesn't match what a design shows, that is a signal to ask whether the design is stale or the component genuinely needs a new capability — it is not a reason to paper over the mismatch with a hard-coded value.

**Hard-coding is only acceptable in exactly two cases:**

1. **The user explicitly asked for that specific hard-coded value or behavior**, or
2. **No lyra-ui component exists yet for this need, and one will be built to replace the placeholder later** — in that case, mark it clearly as temporary (e.g. `// TODO: replace with <FutureComponent> once it exists`) so it isn't mistaken for the intended final state.

Outside of those two cases, treat a hard-coded value sitting next to a real component as a bug, not a style choice.

### What this looks like in practice

- **Don't override a component's own computed defaults with a fixed string.** If a component already derives a sensible placeholder, label, or formatted value from its own state, passing a static override defeats the reason that logic exists.
- **Don't hand-roll markup that duplicates an existing component.** A star icon + button + tooltip, a phone field, a dropdown, a tooltip-triggered flyout — if lyra-ui already has it, compose it (see §3, Composition over reimplementation, for how to find and reuse the right component).
- **Don't reach for a raw Tailwind value, hex color, or one-off style** where an existing lyra token or component prop already covers it (see §11, Tailwind & theming).

### Recent incidents this rule would have prevented

- `CreateNew`'s dial-pad field was given a hard-coded `placeholder="Enter phone number"`, which silently overrode `PhoneInput`'s own correct per-country example placeholder (`"(555) 555-5555"` for the US, `"76 123 45 67"` for Switzerland, etc.) — the real component already did the right thing; the override actively made it worse.
- Several places (`ContactRow`'s favorite star, `AgentProfile`'s status-favorite toggle) hand-rolled their own `<button>` + `Star` icon + `Tooltip` combination instead of using the shared `FavoriteButton` atom that already existed for exactly this.

**When in doubt: trust the component, don't hard-code around it.**

---

## 2. Cross-repo sync rule

**Any component change in `lyra-ui` must be mirrored in `lyra-ux-templates`, and vice versa.**

If you fix or update a component in `lyra-ux-templates`, apply the identical structural change to the source component in `lyra-ui`. The template project is the live consumer — it must never drift from the library.

---

## 3. Composition over reimplementation

**Before writing any new UI logic, check whether an existing lyra-ui component already provides it.**

If a higher-level component needs a dropdown, trigger, input, panel, or any other interactive element — import and compose the existing lyra-ui primitive. Never re-implement behaviour that already exists in the library.

### Examples

| You need | Use | Do not create |
|---|---|---|
| A dropdown attached to a trigger | `Menu` or `Popover` + `PopoverContent` | A custom `<ul>` dropdown |
| A text field | `Input` | A raw `<input>` with manual styling |
| A select / combobox | `Select` + `Menu` (or Radix `Select`) | A new dropdown+input hybrid from scratch |
| A panel over the page header (hover/pin, left or right) | `SidePanel` + `PanelHeader`/`PanelFooter` | A custom modal-like div with its own header |
| An inline panel below the page header (click-triggered, left or right) | `InteriorPanel` + `PanelHeader`/`PanelFooter` | A custom modal-like div with its own header |
| A chip / badge | `Chip` | An inline-styled `<span>` |
| An icon button | `ActionIconButton` or `Button` with icon size | A bare `<button>` with a Lucide icon |

### Panels

There are exactly two panel types in the design system, and they are two
separate components — not one component switching on a `variant` prop (an
earlier unified `Panel` with `variant="side" | "interior"` caused enough
confusion between the two behaviors that it was split back apart; don't
reintroduce it):

| | `SidePanel` | `InteriorPanel` |
|---|---|---|
| Position | Over the page header | Below the page header, inline in the main container |
| Opens via | Hover (consumer wires `onMouseEnter`/`onMouseLeave` + external `open` state) | Click / trigger elsewhere in the main container |
| Pin/unpin | Yes — `pinned` + `onPinToggle`. **Defaults to unpinned (`pinned={false}`).** Only start one pinned when a specific prototype calls for it. | No pin concept — always inline |
| Side | `side="left"` / `side="right"` (required to be explicit at each call site — don't rely on the default when the surrounding layout implies a specific side) | `side="left"` / `side="right"` (same) |
| Narrow-container behavior | N/A | Becomes an absolute overlay below ~1050px of its parent container's width, instead of squeezing the main content column further |

Both share the same sub-parts (`PanelHeader`, `PanelContent`, `PanelFooter`,
`PanelPinButton` for `SidePanel`) and the same internal drag-resize hook
(`use-panel-drag-resize.ts`) — reuse those instead of hand-rolling
resize/pin logic again.

`Draggable`/`DraggablePanel` (float/dockable shells like the AI panel or
notifications dropdown) are a **different, unrelated concept** — don't
confuse either of them with `SidePanel`/`InteriorPanel`.

### Using Menu in non-menu contexts (combobox, listbox, autocomplete)

`Menu` defaults to `role="menu"` / `role="menuitem"`, which is correct for action menus. When you need a dropdown that is semantically a selection list (combobox, autocomplete, multi-select), use the override props instead of reimplementing the item rows:

```tsx
<Menu
  menuRole="listbox"
  itemRole="option"
  items={options.map(o => ({ id: o.value, label: o.label, selected: o.value === current, onClick: () => select(o) }))}
/>
```

**Shadow clipping rule:** never place `overflow-y-auto` / `overflow-hidden` on a *parent* of `Menu` — it will clip `Menu`'s `shadow-lg`. Apply `overflow-y-auto max-h-[Npx]` directly to `Menu` via its `className` prop so the element controls its own overflow without cutting its own shadow:

```tsx
// ✅ overflow on Menu itself — shadow is safe
<Menu className="max-h-60 overflow-y-auto" ... />

// ❌ overflow on a parent — clips Menu's shadow
<div className="max-h-60 overflow-y-auto">
  <Menu ... />
</div>
```

### Menu / Popover width scale (canonical reference)

`Menu` itself has no fixed width — only a `min-w-[200px]` floor, sizing to content above that. When a component wraps `Menu` (or another item-list dropdown) in a `Popover`/`PopoverPrimitive.Content` that needs a *fixed* width rather than content-sizing, pick from this scale instead of choosing an arbitrary pixel value:

| Size | Width | Use | Example |
|---|---|---|---|
| `sm` | 200 px (`Menu`'s own `min-w-[200px]` default) | Simple item-only menus, no header or search row | `channel-row.tsx` kebab menu, `agent-notifications.tsx` |
| `md` | 256 px (`w-64`) | A small header/search/filter row above the list | `agent-profile.tsx` status picker |
| `lg` | 320 px (`w-[320px]`) | A title header + close button, or richer items with icons | `create-new.tsx` |

This scale applies to `Menu`/`Popover`-based item-list panels specifically — calendar/time pickers (`date-picker.tsx`, `time-picker.tsx`) and trigger-matched dropdowns (`autocomplete.tsx`, `phone-input.tsx`, which intentionally size to `var(--radix-popover-trigger-width)`) have their own width drivers and are exempt. Do not invent a new fixed width for a `Menu`/`Popover` combo without checking this table first — this is exactly the kind of raw-Tailwind-value drift the "Important Patterns" section of `PROJECT_SUMMARY.md` already warns about (see the `h-3.5` vs `h-3` badge-sizing incident).

### How to check what exists

1. Search `src/index.ts` — every public component is listed there.
2. Browse Storybook — categories `Atoms`, `UI`, and `Templates` cover the full component surface.
3. If something close-but-not-quite exists, **extend it via props** (new variant, new size, new slot) rather than duplicating it.

### When a brand-new primitive is genuinely needed

Only create a net-new component when:
- No existing component covers the use case even with additional props, and
- The component will be reused in at least two distinct contexts.

In all other cases, prefer composition.

---

## 4. Controlled components

**Every interactive component must be fully controlled — it owns no internal state for its primary value.**

A controlled component receives its current value as a prop and reports changes via a callback. The *caller* owns the state. This is what makes components composable: a single source of truth, predictable re-renders, and zero hidden state surprises when a component is embedded inside a larger one.

### The pattern

```tsx
// ✅ Controlled — caller owns state
interface MyComponentProps {
  value: string;           // current value comes in
  onChange: (v: string) => void;  // change goes out
}

// In the consumer (story, page, parent component):
const [value, setValue] = useState("default");
<MyComponent value={value} onChange={setValue} />
```

```tsx
// ❌ Uncontrolled — component hides state internally
const MyComponent = () => {
  const [value, setValue] = useState("default"); // ← caller can never see or drive this
  ...
};
```

### Why this matters in composite components

When a controlled component is embedded inside a larger one (e.g. `AgentProfile` inside `AgentNextGen`), the parent must:

1. Declare state for every value the child manages.
2. Pass that state as props.
3. Wire the child's callback back to the state setter.

If any of these steps are skipped, the child's interactions fire into a void — the UI accepts the click but the display never updates.

```tsx
// ✅ Fully wired — status updates are visible
const [status, setStatus] = useState<AgentStatus>("available");
<AgentProfile status={status} onStatusChange={setStatus} />

// ❌ Prop hardcoded — onStatusChange either missing or ignored
<AgentProfile status="available" />
```

### Rules

- **Never hold the primary value in local state.** Use local state only for purely UI concerns (hover, focus, open/closed of a subordinate overlay) that the parent has no reason to control.
- **Every value prop must have a corresponding callback prop** (`value` → `onChange`, `status` → `onStatusChange`, `open` → `onOpenChange`, etc.).
- **Stories and composite components must wire every callback to state.** A story that ignores a callback is incomplete — it creates a false impression that the component does not respond to interaction.
- **Composite story components must use `useState` for every interactive child.** Do not pass static values for props that are meant to change at runtime.

### Accepted exceptions

| Case | Rule |
|---|---|
| Transient UI state (tooltip open, dropdown open, hover highlight) | May be internal — caller rarely needs to drive it |
| Derived / computed display values (formatted labels, counts) | Computed from controlled props, no separate state needed |
| Animation state | Always internal |

---

## 5. Z-index hierarchy

All overlapping layers in Lyra UI follow a fixed z-index scale. **Never use an arbitrary z-index outside this table** — doing so breaks the guaranteed stacking order for every component rendered in the same viewport.

| Layer | z-index | Components |
|---|---|---|
| Base content | `0` – `49` | Normal document flow, sticky headers |
| Overlays & dropdowns | `9999` | Portal wrappers (e.g. `NotificationsBell` panel portal) |
| Tooltips | `10000` | `Tooltip` (`TooltipPrimitive.Content`) |
| Priority menus | `10001` | `AgentProfile` status menu — always the topmost interactive layer |
| Tooltips nested inside a priority menu | `10002` | `AgentProfile`'s favorite-star, agent-leg, and connected-apps-badge tooltips — must clear their own `z-[10001]` parent panel |
| Popovers nested inside another popover | `10003` | `CreateNew`'s per-row channel flyout (Outbound picker); `PhoneInput`'s country dropdown when used inside `CreateNew` (dialpad group and drill-down screen 1, via its `dropdownClassName` prop) — both must clear their own `z-[9999]` parent panel |

### Rules

- **Portal wrappers** that use `ReactDOM.createPortal` or `position: fixed` must use `z-index: 9999` (Tailwind: `z-[9999]`).
- **Tooltips** must use `z-[10000]` so they always clear portal wrappers. The Lyra `Tooltip` component already enforces this — do not override it lower.
- **The agent status menu** uses `z-[10001]` and must remain the highest interactive layer. Never add a new component at `z-[10001]` or above without updating this table.
- **A tooltip nested inside the agent status menu is a special case:** the default `z-[10000]` tooltip stacking level sits *below* the menu's own `z-[10001]` panel, so a tooltip triggered by something inside that menu (e.g. hovering the favorite-star button) renders behind its own parent and is invisible even though it's technically open. Pass `className="z-[10002]"` to `<Tooltip>` for any tooltip that lives inside the agent status menu (or any future `z-[10001]`-level component) so it clears its own container. Do not raise the shared `Tooltip` component's own default — override per-instance via `className` only where the tooltip's trigger genuinely lives inside a `z-[10001]` layer.
- **The same problem applies to a `Popover` nested inside another `Popover`** — e.g. a per-row hover flyout inside an already-open picker panel. The default `Popover` z-index (`z-50`, see below) sits well below its own parent's `z-[9999]`, so pass `className="z-[10003]"` to the nested instance. General rule: whenever you nest one overlay-ish component inside another, check this table and give the nested one the next unused integer above its own parent's tier — don't assume defaults compose correctly just because each component works fine in isolation.
- **This isn't limited to components literally named `Popover`.** Anything with its own internal Radix Popover/Popper (a searchable dropdown, a country selector, a color picker, etc.) has the exact same failure mode when it's nested inside something else's `z-[9999]` panel — `PhoneInput`'s country dropdown is a concrete example: it hardcodes `z-50` internally for its normal-flow case, so it needed a dedicated `dropdownClassName` prop (not just `className`, which targets the field shell instead) so a consumer like `CreateNew` can raise it to `z-[10003]` when nesting it. When adding a new overlay-ish component, ask "can this be nested inside another popover/menu?" — if yes, expose a way to override its overlay's z-index rather than assuming it'll only ever be used at the top level.
- **Why `z-50` breaks in portals:** Tailwind's `z-50` is z-index 50, which loses to any stacking context created by a `z-[9999]` portal container rendered later in the DOM. Always use the scale above for any component that renders outside normal document flow.

### Adding a new layer

If a new component genuinely needs to appear above the current ceiling:

1. Add it to the table above with the next integer.
2. Update the relevant component's z-index class.
3. Verify that tooltips and the agent status menu still render above it.

---

## 6. Icons

**Always use [Lucide React](https://lucide.dev/icons/) for icons.** Before adding any icon, verify the exact icon name exists in Lucide — do not guess or approximate.

### Standard icon props

All Lucide icons must use the following defaults unless the surrounding context explicitly dictates otherwise (e.g. a compact list item):

```tsx
<MyIcon className="h-6 w-6" strokeWidth={1.4} />
```

| Prop | Value | Rationale |
|---|---|---|
| `className` | `h-6 w-6` (24 px) | Consistent optical size across the UI |
| `strokeWidth` | `1.4` | Matches Lyra's visual weight — lighter than Lucide's default of 2 |

### Exceptions

| Context | Size | Notes |
|---|---|---|
| Compact menu / list item icons | `h-4 w-4` (16 px) | Keep stroke at `1.4` |
| Inline body text icons | `h-4 w-4` (16 px) | Keep stroke at `1.4` |
| Large empty-state illustrations | `h-8 w-8` or larger | Keep stroke at `1` or `1.4` |

### Rules

- **Never use raw SVG** for icons that exist in Lucide — import from `lucide-react` instead.
- **Never hard-code icon colours** with hex/rgb — always use a lyra token class (e.g. `text-lyra-fg-secondary`).
- **Always confirm the Lucide icon name** before writing code. Icon names are kebab-case on the Lucide website but PascalCase as React imports (e.g. `link-2-off` → `Link2Off`).

---

## 7. File naming & location

| Artifact | Convention | Example |
|---|---|---|
| Component source | `kebab-case.tsx` | `panel-header.tsx` |
| Story file | `PascalCase.stories.tsx` | `PanelHeader.stories.tsx` |
| Story directory | `src/components/__stories__/` | — |
| Utility file | `kebab-case.ts` | `utils.ts` |

Never create a per-component `index.ts`. All exports are centralised in `src/index.ts`.

---

## 8. Component structure

Every component follows this structure in order:

```tsx
// 1. React import
import * as React from "react";

// 2. Third-party imports (cva, lucide icons, radix primitives, etc.)
import { cva, type VariantProps } from "class-variance-authority";

// 3. Internal imports (cn utility, other lyra components)
import { cn } from "../lib/utils";

// 4. CVA variant definition (if applicable)
const myComponentVariants = cva("base-classes", {
  variants: { ... },
  defaultVariants: { ... },
});

// 5. Props interface
export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  // Additional props
}

// 6. Component (always forwardRef)
const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(myComponentVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

// 7. displayName (required)
MyComponent.displayName = "MyComponent";

// 8. Named exports
export { MyComponent, myComponentVariants };
export type { MyComponentProps };
```

### Rules

- **Always use `React.forwardRef`** — every component must forward its ref to the underlying DOM element.
- **Always set `displayName`** — required for Storybook and React DevTools.
- **Never use default exports** — named exports only.
- **Spread `...props`** onto the root element so consumers can pass arbitrary HTML attributes.
- **Accept `className`** and merge it last via `cn()` so consumers can override styles.

---

## 9. TypeScript conventions

### Naming

| Thing | Convention | Example |
|---|---|---|
| Props interface | `{ComponentName}Props` | `ChipProps`, `PanelProps` |
| CVA variants constant | `{componentName}Variants` | `buttonVariants`, `chipVariants` |
| Union type (color, variant, etc.) | descriptive PascalCase | `ChipColor`, `ChipVariant`, `PanelSide` |

### Union types over enums

Use union types, not TypeScript enums:

```tsx
// ✅ correct
export type ChipColor = "slate" | "red" | "orange" | "yellow" | "lime" | "green" | "teal" | "blue" | "purple" | "pink";

// ❌ wrong
export enum ChipColor { Slate = "slate", ... }
```

### Props interface extension pattern

```tsx
// Extends the matching HTML element's attributes + CVA VariantProps
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // any additional props
}
```

Use the most specific HTML element type available (`HTMLButtonElement`, `HTMLSpanElement`, `HTMLDivElement`, etc.).

---

## 10. Variants with CVA

Use `class-variance-authority` for any component with visual variants or size scales.

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const chipVariants = cva(
  // Base classes — shared by all variants
  "inline-flex items-center h-6 px-2 rounded-lyra-md lyra-body-md-emphasis",
  {
    variants: {
      variant: {
        subtle: "...",
        solid: "...",
      },
      // add more axes (size, shape, etc.) as needed
    },
    defaultVariants: {
      variant: "subtle",
    },
  }
);
```

### Button / icon-button size scale (canonical reference)

| Size | Height | Padding | Use |
|---|---|---|---|
| `sm` | 24 px (`h-6`) | `px-2.5` | Compact / dense UIs |
| `default` / `md` | 32 px (`h-8`) | `px-3` | Alias for `md` |
| `lg` | 36 px (`h-9`) | `px-4` | **Default size** |
| `xl` | 40 px (`h-10`) | `px-5` | Primary CTAs |

`defaultVariants.size` is `"lg"`. Do not change this without a design review.

---

## 11. Tailwind & theming

### Use `cn()` for all class merging

```tsx
import { cn } from "../lib/utils";

// cn() = clsx + twMerge — handles conditional classes and overrides cleanly
<div className={cn("base classes", condition && "conditional class", className)} />
```

### Lyra design tokens

Always use lyra CSS variable tokens via Tailwind utility classes rather than arbitrary values.

**Text / foreground**
- `text-lyra-fg-default` — primary body text
- `text-lyra-fg-secondary` — secondary / muted text
- `text-lyra-fg-action` — interactive / link text
- `text-lyra-fg-on-primary` — text on filled/dark surfaces

**Backgrounds**
- `bg-lyra-bg-surface-base` — default surface (cards, panels)
- `bg-lyra-bg-surface-container-subtle` — slightly elevated container
- `bg-lyra-bg-surface-shell` — outer shell / page background
- `bg-lyra-bg-surface-overlay` — modals, dropdowns
- `bg-lyra-bg-control` — form control fills

**Borders**
- `border-lyra-border-subtle` — light separator
- `border-lyra-border-default` — standard border
- `border-lyra-border-focus` — keyboard focus ring
- `border-lyra-border-active` — active / selected state

**Border radius**
- `rounded-lyra-sm` — buttons, inputs
- `rounded-lyra-md` — chips, tags, badges
- `rounded-lyra-lg` — cards, panels, modals

**Typography utility classes** (apply directly as class names)
- `lyra-heading-lg`, `lyra-heading-md`, `lyra-heading-sm`
- `lyra-body-md`, `lyra-body-sm`
- `lyra-body-md-emphasis`, `lyra-body-sm-emphasis`
- `lyra-label`

**Status / accent colors** (used in inline styles for dynamic colour axes)
```tsx
style={{
  backgroundColor: `var(--lyra-color-accent-${color}-soft)`,
  color: `var(--lyra-color-accent-${color}-strong)`,
}}
```

### Dark mode

Dark mode is handled at the token level via `[data-theme="dark"]` selectors on a parent element. Components should never hard-code light/dark-specific values — always use lyra tokens so dark mode works automatically.

### ResizeObserver pattern (container-aware components)

When a component needs to react to its own width (not the viewport), use a stable `useCallback` ref to avoid disconnecting the observer on re-renders:

```tsx
const stableRef = useCallback((el: HTMLDivElement | null) => {
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => {
    setWidth(entry.contentRect.width);
  });
  ro.observe(el);
  // no cleanup needed — el is stable
}, []); // empty deps = stable identity

// + useLayoutEffect for initial synchronous measurement
useLayoutEffect(() => {
  if (measureRef.current) {
    setWidth(measureRef.current.getBoundingClientRect().width);
  }
}, []);
```

### CSS container-query pattern (lighter-weight alternative)

For a component whose "react to my own width" need is just "show/hide or restructure some CSS past a fixed breakpoint" (not "measure the exact pixel width in JS"), a plain CSS container query is simpler than `ResizeObserver` and needs no state at all: put `container-type: inline-size` on the wrapper, then `@container (max-width: Npx) { ... }` rules on the children. See `.lyra-container-grid-wrap`, `.lyra-metric-row-wrap`, `.lyra-channel-tab-list-wrap`, and `.lyra-tab-overflow-wrap` in `lyra-tokens.css` for four examples of this. As with every CSS variable/class, add the rule to **both** `lyra-tokens.css` and `storybook.css` (kept in sync, per the Cross-repo sync rule above).

**`TabList`'s `overflowMenu` prop is the standing default for any new tab bar.** When adding a new `<TabList>` anywhere in this repo or a consuming app (`agent-next-gen-v1`, `lyra-ux-templates`), pass `overflowMenu` unless that specific tab bar already has its own different, narrower collapse strategy — the only current exception is `ChannelTab`'s record-header conversation bar (`channel-row.tsx`), which sheds each tab's own text at 480px/320px via `.lyra-channel-tab-list-wrap` instead of moving tabs into a menu; turning `overflowMenu` on there too would fire at 991px and pre-empt that narrower, purpose-built behavior before it ever got a chance to run. Every other tab bar — settings pages, record detail panels, anything using plain `Tab`s — should get `overflowMenu` by default, the same way a new modal defaults to `Container variant="modal"` rather than a hand-rolled div.

---

## 12. Storybook stories

### File location

```
src/components/__stories__/MyComponent.stories.tsx
```

### Title format

```
"Category/ComponentName"
```

Common categories: `Atoms`, `Atoms/Container`, `UI`, `Templates`.

### Meta boilerplate

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MyComponent } from "../my-component";

const meta: Meta<typeof MyComponent> = {
  title: "Atoms/MyComponent",
  component: MyComponent,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["subtle", "solid"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    disabled: { control: "boolean" },
    // suppress internal/unneeded props
    asChild: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof MyComponent>;
```

### Story rules

- **Always export a `Default` story** — the baseline single-instance view.
- **Export an `AllVariants` story** — renders every variant/size combination in a grid for visual regression.
- **Use stateful wrapper components for stories with hooks** — never put `useState`/`useEffect`/`useCallback` directly in a `render` function; extract them into a named React component inside the story file to avoid "Maximum call stack" errors from Storybook's argTypes serialisation.

```tsx
// ✅ correct — hooks live in a real component
function ToolbarDemo(props: ToolbarDemoProps) {
  const [open, setOpen] = useState(false);
  return <MyComponent open={open} onToggle={() => setOpen(v => !v)} {...props} />;
}

export const Interactive: Story = {
  render: (args) => <ToolbarDemo {...args} />,
};

// ❌ wrong — hooks in render fn
export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false); // will cause infinite loop
    return <MyComponent open={open} {...args} />;
  },
};
```

- **Panel sub-components** (`Panel/Interior`, `Panel/Side`) live under `Atoms/Container`, not as separate top-level stories.
- **Delete obsolete stories** when a component is renamed or consolidated — do not leave orphaned story files.

### Controls guidance

| Prop type | Control |
|---|---|
| Union string | `"select"` with `options` array |
| Boolean | `"boolean"` |
| Free string | `"text"` |
| Number | `"number"` |
| React node / function | `{ table: { disable: true } }` |

---

## 13. Index exports

All exports live in `src/index.ts`. Never create per-component `index.ts` files.

### Pattern

```ts
// Component + variants (if CVA)
export { MyComponent, myComponentVariants } from "./components/my-component";

// All public types on a separate line
export type { MyComponentProps, MyVariantType } from "./components/my-component";
```

### Grouping

Use section comments to keep the file navigable:

```ts
/* ── Components ── */
/* ── Spinner ── */
/* ── Popover ── */
/* ── Utilities ── */
```

Add new exports in the most logical existing section, or create a new section with the same comment style.

---

## 14. New component checklist

Work through this list top-to-bottom before marking a component done.

```
[ ] Checked src/index.ts and Storybook — no existing component covers this use case
[ ] No hard-coded value overrides a real component's own correct behavior just to match a mockup (§1)
[ ] File named kebab-case.tsx in src/components/
[ ] Uses React.forwardRef
[ ] displayName set
[ ] Props interface named {ComponentName}Props, extends correct HTML attributes
[ ] Union types used (not enums) for variant/color/size axes
[ ] CVA used for any variant logic; defaultVariants set
[ ] cn() used for all class merging; className accepted and applied last
[ ] Only lyra-* tokens used for colour, spacing, radius, and typography
[ ] No hard-coded hex/rgb values (use CSS variables for dynamic colour axes)
[ ] Named exports only (no default export)
[ ] Exported from src/index.ts (component + variants + all types)
[ ] Every interactive value prop has a matching callback prop (controlled pattern)
[ ] Any z-index used follows the hierarchy table in §5 (portals: 9999, tooltips: 10000, agent status: 10001)
[ ] Story file at src/components/__stories__/{ComponentName}.stories.tsx
[ ] Story title follows "Category/ComponentName" format
[ ] Default story added
[ ] AllVariants story added
[ ] Stateful demo uses a wrapper component (not hooks in render fn)
[ ] Every interactive prop wired to useState in stories (no hardcoded values for runtime-changing props)
[ ] Composite stories (component used inside a larger component) wire all child callbacks to state
[ ] Mirrored in lyra-ux-templates if change affects an existing template component
[ ] If debugging "doesn't appear/show up," ruled out rendering causes (§15) before touching event/state logic
[ ] Any new Tooltip usage has its placement checked against the component's actual layout context, not left at a reflexive default (§16)
[ ] Any new portal-rendering component (Popover-like, custom flyout, etc.) stops pointer/focus events from bubbling past its own content root, so it can't be wrapped by a Tooltip or similar hover-triggered wrapper without misfiring it (§17)
```

---

## 15. Debugging: diagnose rendering before behavior

When a bug report says something "doesn't appear," "doesn't show up," or "isn't visible" — including on hover, focus, or click — treat that as a *rendering* bug until proven otherwise, not a *behavior* bug. These are different failure classes with different fixes, and diagnosing the wrong one burns significant time chasing event handlers, hook state, and timing races on a component that was already mounted and open the whole time, just invisible.

This rule exists because of a real incident: a tooltip nested inside `AgentProfile`'s status menu was reported as "not appearing on hover." The investigation went straight to event/timing logic — Radix `Tooltip` trigger composition, `asChild` prop merging, a mount-guard delay — and found and fixed a real (but secondary) timing race. The tooltip still didn't appear. The actual cause was two lines away the whole time: the tooltip's `z-[10000]` was lower than its own parent panel's `z-[10001]` (see §5), so it was opening correctly and rendering behind its own container on every single hover. That fact was checkable in seconds by comparing two class names against the table in §5 — no live testing required — but wasn't checked until after a much more expensive investigation had already run.

**Check in this order:**

1. **Is the element actually in the DOM when the bug happens?** If yes, this is a rendering/visibility problem, not a logic problem — go straight to step 2 and do not start reading event-handler or hook code yet.
2. **Is it hidden by stacking order?** Compare the z-index in play against the hierarchy table in §5. Two elements portaled to the same container (e.g. `document.body`) stack by z-index number, not DOM order or mount time — a component can be fully open and still paint underneath an opaque sibling with a higher z-index. This is easiest to miss when a component is nested *inside* a higher-stacked parent (e.g. a tooltip triggered by something inside a `z-[10001]` menu): the child's own default z-index can be lower than the very parent it's rendered inside, which silently swallows it. See §5's rule on tooltips nested inside a priority menu for the concrete fix pattern (override the nested instance's z-index via `className`, don't change the shared component's default).
3. **Is it clipped by overflow?** An ancestor with `overflow-hidden` or `overflow-auto` will clip anything inside it that isn't portaled out.
4. **Is it hidden by CSS rather than by not being triggered?** `opacity-0`, `visibility: hidden`, `display: none`, inherited `pointer-events-none`, or a Tailwind named-group mismatch (`group/name` on the ancestor vs. a differently-named `group-hover/other:` on the child) can all make a correctly-triggered, fully-functional element invisible or unclickable.
5. **Only once 1–4 are ruled out** — the element genuinely never mounts, or the state that should open it never flips — move on to event handlers, hook state, and timing (delays, guards, race conditions). That's a real class of bug too, just a more expensive one to diagnose, so it belongs after the cheap static checks, not before them.

---

## 16. Tooltip placement

`placement` is not a cosmetic default to leave alone — it must open *into* available space, away from whatever edge or rail the trigger sits closest to. Picking a direction without checking the trigger's actual position causes the tooltip to fight for room against the edge, get flipped by `avoidCollisions` in a way that reads backwards, or open toward a boundary with no space at all.

**When asked to add a tooltip to a component:**

1. **If the component's position in the larger layout is genuinely ambiguous** from the request alone (e.g. a standalone component with no fixed home, or one used in multiple very different layout contexts), ask which direction it should open before implementing.
2. **Otherwise, infer it.** Look at how the component is actually composed in its own stories and real usage — a left nav rail, a top header, a bottom bar, a right-aligned panel — and pick the direction that opens away from that edge, not toward it.

**Default placement by layout context:**

| Trigger lives in... | Use `placement=` |
|---|---|
| A left rail / left nav (e.g. a collapsed icon button in `LeftNav`) | `"right"` |
| A right-aligned panel or right rail | `"left"` |
| A top app header / top bar | `"bottom"` |
| A bottom bar / footer | `"top"` |
| Inline in body content with no strong directional context | `"top"` (the `Tooltip` component's own default) |

Don't reach for `"bottom"` (or any single direction) as a reflexive default for every new tooltip. That's exactly what happened when a tooltip was first added to `CreateNew`'s icon-button trigger: it was given `placement="bottom"` without checking where `CreateNew` actually lives (a collapsed left nav rail, per its own stories), so it opened top/bottom against the rail's edge instead of out into the page. The fix was `placement="right"` — check the surrounding layout before choosing, every time.

---

## 17. Portals still bubble through the React tree

Any time a `Tooltip` (or anything else with hover/focus-triggered open logic) wraps a `Popover`, `Menu` submenu, or other portal-rendering component **from the outside**, hovering or focusing something *inside* that portal's content can incorrectly re-trigger the outer wrapper. The fix belongs on the portal-rendering component itself (stop propagation at its content root), not on every individual place that happens to wrap one in a Tooltip.

**Why this happens:** React re-dispatches synthetic events up the *React* fiber tree, not the DOM tree. A component rendered via `ReactDOM.createPortal` (which `Popover`, `Menu` submenus, and `Tooltip` itself all use) is physically mounted elsewhere in the DOM — but for event bubbling purposes, React still treats it as a normal descendant of wherever it's declared in JSX. So in a composition like:

```tsx
<Tooltip content="New Outbound" placement="right">
  <span className="inline-flex">
    <Popover content={<Menu items={...} />}>
      <button>+</button>
    </Popover>
  </span>
</Tooltip>
```

`Popover`'s content is portaled to `document.body`, nowhere near the `<span>` in the DOM — but it's still a React child of that `<span>`, which is exactly the element `Tooltip`'s `Trigger` clones its hover/focus handlers onto (`asChild`). Radix `Tooltip.Trigger` opens on `onPointerMove` / `onPointerDown` / `onFocus` and closes on `onPointerLeave` / `onBlur`. Hovering a menu item deep inside the popover panel fires a native `pointermove`, which React's synthetic system bubbles all the way up through the React tree — Menu item → Menu → popover content → `Popover` → `span` — reopening (or closing) a tooltip that has nothing to do with what the user is actually pointing at.

**This was a real, shipped bug:** hovering the "Outbound" row inside `CreateNew`'s popover (opened from the collapsed icon-button trigger) re-displayed that same icon button's own "New Outbound" tooltip, even though the cursor was nowhere near the button. The same composition pattern is used by `AgentProfile`'s avatar trigger and any other icon-button-with-popover-and-tooltip, so this wasn't a one-off — it affected every component built this way.

**The fix (already applied in `popover.tsx`):** stop the relevant synthetic events from propagating past `PopoverPrimitive.Content`'s own root, so nothing that happens inside a popover's panel can reach an ancestor outside it:

```tsx
const stopSyntheticBubble = (e: React.SyntheticEvent) => e.stopPropagation();
// ...on PopoverPrimitive.Content:
onPointerMove={stopSyntheticBubble}
onPointerDown={stopSyntheticBubble}
onPointerLeave={stopSyntheticBubble}
onFocus={stopSyntheticBubble}
onBlur={stopSyntheticBubble}
```

This is safe: Radix's own outside-click/focus-trap detection is implemented via native document-level listeners, not React bubbling, so it's unaffected. `onClick` is deliberately left alone — Radix's composed `onClick` handler on `Tooltip.Trigger` only *closes* the tooltip, and letting that bubble is harmless.

**Rule:** any new component that renders content via a portal (a new `Popover`-like primitive, a custom flyout, etc.) needs this same containment at its content root — don't rely on every consumer remembering not to wrap it in a Tooltip carelessly. If you're building something that *could* reasonably be wrapped by a Tooltip or similar hover-triggered wrapper from the outside, stop the bubbling at the source.
