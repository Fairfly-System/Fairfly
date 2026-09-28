---
trigger: model_decision
description: When Making a new Frontend Page/Component/Redesign/UI or User requests a frontend change/redesign
---

# FairFly UI/UX Design Rules

> **Visual Reference:** Use the provided FairFly dashboard/table mockup (Found in ContextFiles/Mockup.png) as the primary visual reference for layout, spacing, hierarchy, proportions, and visual language. Treat it as inspiration, not a pixel-perfect template.

IMPORTANT RULE:

When adding a new Component, Append it to component-list.md, along with its descriptions, appropriate use, props, and function.

Refer first to component-list.md to see available resources when making a new page/component/UI

Fair2/Fairfly/component-list.md

## 1. Core Style

FairFly should feel like a clean, modern SaaS product: professional, spacious, structured, and visually alive.

Prioritize:
- Clear visual hierarchy
- Generous whitespace
- Consistent spacing
- Strong typography hierarchy
- Rounded but structured surfaces
- Flat, restrained colors
- Subtle borders/shadows
- Useful imagery and graphics
- Consistency across Admin, Operator, and Client portals

Avoid visual clutter and unnecessary decoration.

## 2. Universal Design

Admin, Operator, and Client pages should feel like the same product.

Keep consistent:
- Typography
- Color palette
- Buttons
- Sidebars/navigation
- Cards
- Tables
- Forms
- Status badges
- Modals
- Icons
- Spacing
- Border radius
- Avoid Animations on Container Components

Roles may have different navigation, KPIs, charts, actions, and information, but should not use completely different visual styles.

## 3. Reusable Components

All repeated UI **must be reusable and flexible components**.

If you are building something that requires a UI, search the components first if something is already useable before deciding whether to create a new one.

Examples:
- Buttons / icon buttons
- Sidebar / navigation
- Topbar
- Cards / KPI cards
- DataTable
- Search and filter controls
- Tabs
- Status badges
- Pagination
- Dropdowns/selects
- Form fields
- Modals
- Confirmation dialogs
- Alerts/toasts
- Empty/loading/error states
- Charts
- Progress indicators

Build components once and configure them with props rather than duplicating page-specific versions.

Example:
```tsx
<DataTable
  columns={columns}
  data={services}
  searchable
  pagination
  rowActions
/>
```

## 4. Dashboard Design

Dashboards should not feel like disconnected white boxes.

Preferred structure:
1. Welcome/header
2. KPI/stat cards
3. Important charts or summaries
4. Recent activity
5. Secondary widgets/quick actions

Use contextual greetings such as:

**Welcome back, {name}!**

Follow with a short useful sentence.

Appropriate visual content is encouraged:
- Travel illustrations
- Destination images
- Maps
- Service-related graphics
- Appropriate photographs
- Decorative line-art

Use imagery to make dashboards feel alive, especially in large empty areas. Do not add graphics simply to fill space.
(If you need images, tell me, Ill generate it for you, Just tell me the prompts and the appropriatue name of the file and where it is placed)

## 5. Table/Data Pages

Do not make table pages look like a huge white rectangle on an empty background.

A typical table page should have:
- Page title
- Short description
- Appropriate header graphic/illustration when useful
- Primary action
- Search/filter controls
- Summary information when useful
- DataTable
- Pagination

The table remains the main focus.

Appropriate visual additions include:
- Travel-themed header artwork
- Empty-state illustrations
- Small decorative graphics
- Summary/status cards
- Tinted header areas
- Contextual icons
- Progress/status visualization

Avoid decoration that competes with the data.

DataTable should support configurable:
- Columns
- Sorting
- Search
- Filters
- Pagination
- Row selection/bulk actions
- Row actions
- Status badges
- Loading/empty/error states
- Responsive behavior
- Optional expandable rows

## 6. Cards

Use cards to group meaningful information such as KPIs, summaries, activity, quick actions, and service progress.

Do not turn every small piece of information into a card.

Preferred:
- Light/white surfaces
- Subtle borders
- Soft shadows
- Moderate radius
- Consistent padding

Avoid heavy shadows, glowing edges, excessive borders, and excessive decoration.

## 7. Color and Effects

Use **flat colors as much as possible**.

Primary visual direction:
- Light/white surfaces
- Dark neutral text
- Purple/indigo for primary actions
- Neutral page backgrounds
- Green = success
- Orange/yellow = warning/pending
- Red = error/destructive
- Blue = informational

### Strictly avoid
- Glowing effects
- Neon effects
- Excessive gradients
- Gradient text
- Glowing/colored shadows
- Glassmorphism everywhere

Gradients may be used sparingly when they serve a clear visual purpose.

## 8. No Emojis/Emoticons

**Do not use emojis or emoticons in the UI.**

Use proper icons instead.

Examples:
- Calendar icon instead of calendar emoji
- Check-circle icon instead of checkmark emoji
- Bell icon instead of bell emoji
- Travel/plane icon instead of plane emoji

Use the project's established icon library consistently.

## 9. Modals

### Form Modals
Form modals should be large on desktop, generally around **60–80% of viewport width**, depending on complexity.

Large forms may use:
- Two-column layouts
- Sections
- Grouped fields
- Tabs where appropriate
- Sticky footer actions when useful

Do not cram complex forms into small dialogs.

### Confirmation Modals
Simple confirmations should remain compact.

Example:
```text
Delete Workflow?

This action cannot be undone.

[Cancel] [Delete]
```

## 10. Sizing and Responsive Design

Use **REM-based sizing** for layout and components wherever practical.

Prefer:
```css
padding: 1.5rem;
gap: 1rem;
border-radius: 0.75rem;
font-size: 0.875rem;
```

Don't use inline CSS, always use a CSS file and Classes.

Use a consistent spacing scale.

At the mobile breakpoint, use media queries to adapt:
- Sidebar/navigation
- Grid columns
- Cards
- Modals
- Tables
- Forms
- Padding
- Typography

Do not simply shrink the desktop layout until it becomes unusable.

Tables should remain usable through horizontal scrolling, reduced/priority columns, expandable details, or an appropriate mobile layout.

## 11. Animation

Use animation **sparingly and intentionally**.

Do not animate every card or frequently visited element.

Good uses:
- Modal open/close
- Dropdown transitions
- Sidebar transitions
- Toasts
- Loading states
- Meaningful state changes
- Small hover/focus feedback

Avoid:
- Floating cards
- Constant motion
- Pulsing statuses
- Bouncing buttons
- Animated backgrounds
- Decorative motion everywhere

The interface should feel stable and comfortable for frequent use.

## 12. Accessibility

Maintain:
- Sufficient contrast
- Visible focus states
- Clear button labels
- Accessible labels for icon-only controls
- Proper form labels
- Status indicators that are not color-only
- Usable interactive element sizes
- Keyboard navigation
- Proper modal focus behavior
- Make the Site Semantic and SEO Friendly.
- Avoid too many Divs to avoid Performance Degradation especially on Layout Shifts
- Lazy Load Images (or Optimize Image Loading)

## 13. Final Design Rule

When adding visual effects, ask:

> **Does this improve comprehension, navigation, or the experience?**

If not, leave it out.

When a page feels too plain, prefer **meaningful hierarchy or appropriate imagery** over decorative effects.

When UI is repeated, **make it reusable**.

When choosing between flashy and professional, **choose professional**.

FairFly should ultimately feel:

**Clean + Structured + Visual + Approachable + Functional**

14. Avoid AI-Slop / Generic AI-Generated UI

FairFly should not look like a generic AI-generated SaaS dashboard.

Avoid design patterns that are visually trendy but add little functional value or make the interface feel artificial, repetitive, or over-designed.

Avoid excessive use of:
Colored left borders on cards or sections purely for decoration
Large numbers of status badges
Badges for information that does not actually represent a status/category
Excessive pill-shaped UI elements
Every piece of information being placed inside a separate card
Repetitive cards with nearly identical layouts
Excessive use of rounded containers
Decorative gradients without a functional purpose
"Dashboard soup" — many small cards, statistics, charts, and widgets competing for attention
Large decorative icons placed inside every card
Excessive use of purple/indigo accents simply because they are part of the brand palette
Overly colorful tables where every row or field has a different visual treatment
Excessive chips/tags for ordinary text values
Giant headings with very little useful information underneath
Artificial-looking empty space created to make a layout appear "premium"
Excessive use of glassmorphism, frosted panels, glowing elements, or floating UI
Unnecessary gradients, shadows, outlines, and decorative separators
UI patterns that appear to exist primarily because they are visually impressive rather than useful
Information should look like information

Do not turn ordinary data into decorative UI.

For example, avoid:

┌──────────────────────────────┐
│ █                            │
│  ●  CLIENT                   │
│     Cosmetique Asia Corp.    │
│                              │
│     [ACTIVE] [BUSINESS]      │
└──────────────────────────────┘

when a simple structured presentation would communicate the same information better.

Prefer:

Client
Cosmetique Asia Corp.

Contact Person
Ms. Marichu Kalalang

Status
Active

Use badges, cards, colored indicators, and other visual treatments only when they improve scanning, grouping, or comprehension.

Prefer hierarchy over decoration

When a page feels visually empty, first improve:

Information hierarchy
Spacing
Typography
Alignment
Grouping
Content organization
Meaningful imagery

Only then consider additional decorative elements.

Avoid "everything is a component"

Not every piece of content needs its own:

Card
Badge
Pill
Border
Icon
Background
Shadow
Container

Use plain text, headings, dividers, tables, and whitespace when they communicate information more effectively.

Avoid visual noise

A user should be able to look at a page and immediately understand:

What page they are on
What the important information is
What actions they can perform
What requires their attention
What the current state is

If every element is visually emphasized, nothing is emphasized.

Design should feel intentionally designed, not algorithmically decorated

Do not add UI elements simply because they are common in modern SaaS dashboards or because they make a screen look more "premium."

Every visual treatment should have a reason.

Ask:

Would a real product designer intentionally put this here to help the user, or is it here because AI-generated interfaces commonly use this pattern?

When in doubt, choose the simpler and more purposeful design.

FairFly should feel like a real, mature travel-management product, not a collection of trendy AI-generated UI patterns.