# UMA Dropdown Selection + Inline Edit Pattern

## SelectItem — background-highlight instead of checkmark

`src/components/ui/Select.tsx`

`SelectItem` uses `data-[state=checked]` CSS to show the selected state as a background highlight instead of a leading checkmark icon. This eliminates the ~24 px left-padding column that was reserving space for the check icon, so option text is always flush left.

Key classes on `SelectPrimitive.Item`:
- `px-3` — uniform horizontal padding (no `pl-8` offset)
- `data-[state=checked]:bg-[var(--accent)]/12` — subtle tinted background
- `data-[state=checked]:font-semibold data-[state=checked]:text-[var(--accent)]` — accent colour + weight on selected item
- `data-[highlighted]:bg-[var(--panel-2)]` — keyboard/hover focus state unchanged

No `<Check>` icon or `ItemIndicator` wrapper is rendered. The `Check` import from `lucide-react` was removed from `Select.tsx` entirely.

## Combobox — pencil-rename already built in

`src/components/ui/Combobox.tsx`

The `Combobox` component already provides inline rename inside its dropdown via a pencil button on each suggestion row. Clicking the pencil opens an edit panel (input + Save/Remove/Cancel) without closing the popover.

Props that activate this behaviour:
- `onRenameSuggestion(from, to)` — called when the user commits a rename
- `onRemoveSuggestion(name)` — called when the user removes the entry
- `onAppendCustom(value)` — saves the current typed value to the quick-pick list

## Profile page — additional inline-rename affordance outside the dropdown

`src/app/profile/page.tsx`

For the **Regular doctor** and **Hospital / Clinic** pickers, an inline rename form appears *below* the `Combobox` when the user clicks the pencil button next to the currently-selected value.

### State

```tsx
const [editingDoctor, setEditingDoctor] = useState(false);
const [editDoctorValue, setEditDoctorValue] = useState("");
const [shakeDoctor, setShakeDoctor] = useState(false);

const [editingHospital, setEditingHospital] = useState(false);
const [editHospitalValue, setEditHospitalValue] = useState("");
const [shakeHospital, setShakeHospital] = useState(false);
```

### Save handlers

```tsx
function saveDoctorRename(e?: React.FormEvent) {
  e?.preventDefault();
  const trimmed = editDoctorValue.trim();
  if (!trimmed) {
    setShakeDoctor(true);
    setTimeout(() => setShakeDoctor(false), 300);
    return;
  }
  const prev = store.profile.primaryCareProvider ?? "";
  if (trimmed !== prev) renameDoctorSuggestion(prev, trimmed);
  setEditingDoctor(false);
}
```

Same pattern for `saveHospitalRename` / `renameFacilitySuggestion`.

### UX flow

1. Value is shown as a truncated `<span>` with a `<Pencil>` button to its right.
2. Clicking the pencil sets `editingDoctor = true` and pre-fills the draft with the current value.
3. In edit mode, a `<motion.div>` wraps the `<Input>` to animate a horizontal shake if the user tries to save an empty string.
4. `Escape` cancels without saving. `Enter` or the Save button commits.
5. On save, `renameDoctorSuggestion(prev, trimmed)` updates the quick-pick list AND `profile.primaryCareProvider` in one atomic `saveViewingStore` call.

### Empty-save shake

```tsx
<motion.div
  animate={shakeDoctor ? { x: [0, -4, 4, -2, 2, 0] } : { x: 0 }}
  transition={{ duration: 0.25 }}
>
  <Input ... />
</motion.div>
```

No new npm dependency — `framer-motion` was already installed in the project.

## Constraints

- CSS variables only; no hardcoded colours.
- Lucide React icons only (`Pencil` from `lucide-react`).
- `Button`, `Input` from `src/components/ui/`.
- Minimum tap target for the pencil button: `h-7 w-7` (acceptable in a dense form row alongside a text label).
