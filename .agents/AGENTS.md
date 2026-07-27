# Rogue — Project Rules

## Weight Input Fields

All weight input fields (onboarding and Settings) must use `type="text" inputmode="decimal"` instead of `type="number"`. This gives the numeric keyboard on iOS while allowing control over accepted characters.

Before parsing any weight value with `parseFloat()`, replace any comma with a dot using the project's `parseWeight()` helper:

```js
function parseWeight(val) { return parseFloat((val || '').replace(',', '.')); }
```

Use `parseWeight(input.value)` instead of `parseFloat(input.value)` for **all** weight fields. This fixes decimal input on iOS devices with non-English locale settings (e.g. Slovak) where the keyboard shows a comma instead of a dot as the decimal separator.

**Integer-only fields** (reps, RIR, sets) keep `type="number" inputmode="numeric"` and continue to use `parseInt()` — no change needed for those.
