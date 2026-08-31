---
name: UMA Component Map
description: Master index of every reusable component in UMA — filename, purpose, props summary, when to use, when NOT to use
type: project
---

# UMA Component Map

Read this first for any UI change. Find the right component before building a new one.

## Primitives — `src/components/ui/`

| Component | Purpose | Key props | When to use | When NOT to use |
|---|---|---|---|---|
| `Button.tsx` | Styled button with variants | `variant: "primary" \| "secondary" \| "ghost" \| "destructive"`, standard button attrs | Any clickable action | Icon-only toggles that don't match the API |
| `Input.tsx` | Styled text input | All standard `<input>` attrs | Text/number fields | Combobox/select with options |
| `Select.tsx` | Radix Select wrapper | `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` | Single-choice from a fixed list; selected state uses tinted background (no checkmark) | Multi-select; use `Combobox` instead |
| `Combobox.tsx` | Filterable multi-select | `options`, `value[]`, `onChange`, `placeholder`, `allowCustom`, `maxItems` | Multi-value tags (allergies, conditions) | Single-choice with known items |
| `Dialog.tsx` | Modal overlay | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` | Blocking user action confirmations | Non-modal sidebars; use `Sheet` instead |
| `Sheet.tsx` | Side-panel drawer | `Sheet`, `SheetContent` (`side: "left"\|"right"\|"bottom"`), `SheetHeader`, `SheetTitle` | Right/bottom-slide panels (debug, detail) | Full-page overlays |
| `DatePicker.tsx` | Calendar date picker | `value`, `onChange`, `min`, `max` | Date selection | Date+time; use `DateTimePicker` |
| `DateTimePicker.tsx` | Calendar + time picker | `value: string`, `onChange`, `min`, `max` | Datetime selection (medication reminders) | Date-only; use `DatePicker` |
| `TimePicker.tsx` | HH:MM time picker | `value`, `onChange` | Standalone time input | — |
| `Badge.tsx` | Status chip | `children`, `className` | Labels, status indicators | Large buttons |
| `Card.tsx` | Padded panel | `children`, `className` | Content grouping within bento cards | Do NOT nest Card inside BentoGrid — use `div` with CSS vars |
| `Tooltip.tsx` | Hover tooltip | Radix Tooltip primitives | Icon hints (desktop only) | Elderly-critical info — must also be visible at rest |
| `Popover.tsx` | Floating panel | Radix Popover primitives | Date pickers, contextual menus | Blocking actions — use Dialog |
| `DropdownMenu.tsx` | Contextual menu | Radix DropdownMenu primitives | Multi-action context menus | Single action (use Button instead) |
| `RecordNoticeToast.tsx` | Success/error toast | `message`, `kind: "success"\|"error"`, `onDismiss` | One-time feedback after saves | Persistent status |
| `UploadProgressSheet.tsx` | Upload progress drawer | Internal — used by GlobalUploadBadge | — | Don't use directly |
| `GlobalUploadBadge.tsx` | Floating upload indicator | No props — reads store | — | Don't duplicate |

---

## Dashboard layout — `src/components/dashboard/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `BentoGrid.tsx` | Renders one bento card wrapper | `item: BentoItem`, `editMode`, `onRemove`, `onResize`, `children` | Outer div has `overflow: hidden` for border-radius; inner content needs `overflow-y-auto` if it may overflow |
| `DashboardGrid.tsx` | Renders the full bento layout from `layout[]` | `layout`, `onLayoutChange`, `editMode`, `renderWidget(id)` | `editMode` is always `false` — never pass `true` |
| `DashboardEditToolbar.tsx` | (DISABLED) Edit mode toolbar | — | Do NOT render — edit mode is disabled |

---

## Health widgets — `src/components/health/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `BmiCard.tsx` | BMI gauge + category badge | `store: PatientStore` | Reads `bodyMetrics` from store; hidden if `heightCm` or `weightKg` absent |
| `ConcerningTile.tsx` | Single flagged item card | `kind: "lab"\|"bmi"\|"empty"`, `icon`, `label`, `value`, `date`, `status`, `rangeBar?` | Status colours via CSS vars; `kind="empty"` spans `col-span-full` |
| `DashboardHealthLogSection.tsx` | Blood pressure + side-effects log | `store: PatientStore`, `onStoreChange(s)` | Single-column layout — never add `lg:grid-cols-2` |
| `MedicationReminderRunner.tsx` | Background reminder poller | No props | Invisible runner — renders no DOM |

---

## Labs — `src/components/labs/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `HealthTrendsSection.tsx` | Full-width area chart + gauge cards for flagged labs | `labs`, `selectedMetrics`, `lexicon` | Always hero/full-width; chart height capped at 320px |
| `GaugeCard` (re-exported from HealthTrendsSection) | Circular gauge for a single lab | `label`, `value`, `unit`, `min`, `max`, `current`, `status` | Used by labs bento widget |
| `LabReadingTile.tsx` | Compact lab reading row | `lab: ExtractedLab`, `rangeInfo` | Used in detail views |

---

## Chat — `src/components/chat/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `ThreadSidebar.tsx` | Thread list with Active/Archived tabs, select mode, archive/unarchive | No props — reads from `/api/threads` | Has built-in select-all via `?idsOnly=true` |
| `UmaCharacter.tsx` | Animated UMA avatar | `state: "idle"\|"thinking"\|"speaking"` | Framer Motion — suspend on SSR |
| `ChatMarkdown.tsx` | Renders markdown in chat bubbles | `content: string` | Uses `react-markdown` + `remark-gfm` |

---

## Navigation — `src/components/nav/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `AppTopNav.tsx` | Sticky top nav with tabs + right-slot controls | `rightSlot?: ReactNode` | Tab styling uses inline active detection |
| `TidyButton.tsx` | "Tidy" AI list-cleanup button + debug panel toggle | No props | Bug icon only visible when `?debug=1` or `localStorage.uma_debug="1"` |

---

## Notifications — `src/components/notifications/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `NotificationCenter.tsx` | Bell icon + popover notification list | No props — reads from store | Single dismiss X per row (always visible); no hover-only affordances |

---

## Family — `src/components/family/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `FamilySwitcher.tsx` | Dropdown to switch active family member | No props | Wraps `setActiveFamilyMember` from store |
| `FamilyTreeView.tsx` | Visual family tree display | `links: FamilyLink[]` | Read-only display |
| `FamilyRiskRunner.tsx` | Background risk computation | No props | Invisible runner |

---

## Tidy — `src/components/tidy/`

| Component | Purpose | Key props | Gotchas |
|---|---|---|---|
| `TidyDebugSheet.tsx` | Developer debug panel for Tidy AI runs | `open`, `onClose`, `debugData: TidyDebugRun \| null` | Shows input snapshot, prompt text, applied/rejected ops; `text-xs` acceptable (dev surface) |

---

## Theme — `src/components/theme/`

| Component | Purpose | Gotchas |
|---|---|---|
| `ThemeInit.tsx` | Applies CSS vars from store on mount | Must be in root layout; no visible DOM |
| `ThemeToggle.tsx` | Dark/light toggle button | Writes to store preferences |

---

## Body — `src/components/body/`

| Component | Purpose | Gotchas |
|---|---|---|
| `BodyScrollCanvas.tsx` | Scrollable anatomical body diagram | Performance-sensitive — do not render outside its dedicated page |
| `AnatomyImageWithMagnifier.tsx` | Zoomable anatomy image | — |
| `BodySectionDock.tsx` | Floating detail panel for body sections | — |

---

## Insurance — `src/components/insurance/`

| Component | Purpose | Gotchas |
|---|---|---|
| `InsuranceSection.tsx` | Insurance data display + AI claim draft | Calls `/api/insurance/draft-claim` |

---

## Shared utilities

| Component | Purpose |
|---|---|
| `src/components/ui/cn.ts` | `cn(...classes)` — merges Tailwind class names |
| `src/components/PatientStoreBootstrap.tsx` | Syncs store from server on mount |
| `src/components/notifications/AutoModeRunner.tsx` | Background auto-mode logic |
| `src/components/nav/AppShell.tsx` | App shell wrapper (nav + content) |
| `src/components/nav/AppSideNav.tsx` | Side navigation (mobile/tablet) |
| `src/components/nav/LandingHeader.tsx` | Public landing/login header |
