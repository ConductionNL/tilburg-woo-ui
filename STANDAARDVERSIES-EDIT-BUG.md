# Standaardversies Not Showing as Checked When Editing Application

## Problem
When editing an application, the standaardversies that were previously selected don't show as checked in the form, even though they are being saved correctly and displayed on the frontend.

## Root Cause
The initialization logic for `selectedExtraStandards` in `ac-forms-applicatie.js` (lines 880-1028) has the following issues:

1. **Missing Dependencies**: The useEffect that initializes `selectedExtraStandards` from existing data explicitly removed `applicatie.compliancy` and `applicatie.standaardVersies` from its dependencies:

```javascript
// Line 1021-1028
}, [
  standaardenOptions,
  standaardenversiesOptions,
  referentieComponentenWithStandards,
  // Removed applicatie.compliancy, applicatie.standaardVersies, applicatie.standaardversies
  // from dependencies to prevent re-running when compliance checkboxes are toggled
]);
```

2. **Race Condition**: When editing, the `applicatie` object is loaded asynchronously, but the initialization effect only runs when `standaardenOptions` and `standaardenversiesOptions` change, not when the actual application data arrives.

3. **Guard Check Issue**: The effect has this guard:
```javascript
if (selectedExtraStandardsInitializedRef.current) return;
```

This prevents re-initialization even if the application data wasn't available during the first run.

## Data Flow

### When Creating (Works)
1. `applicatie` starts empty
2. User selects standaardversies → updates `selectedExtraStandards`
3. Checkboxes toggle → updates `applicatie.standaardVersies` and `applicatie.compliancy`
4. Everything stays in sync

### When Editing (Broken)
1. `applicatie` loads asynchronously with existing `standaardVersies` and `compliancy`
2. Initialization effect runs before `applicatie` data is available
3. Effect finds no data to initialize from
4. `selectedExtraStandardsInitializedRef.current` is set to `true`
5. When `applicatie` data finally arrives, effect doesn't re-run (guard prevents it)
6. Result: `selectedExtraStandards` stays empty, checkboxes appear unchecked

## Solution

### Option 1: Add applicatie data to dependencies (with smart guard)
```javascript
useEffect(() => {
  if (standaardenversiesOptions.length === 0) return;
  if (standaardenOptions.length === 0) return;
  
  // Get existing data
  const existingCompliancy = applicatie.compliancy || [];
  const existingStandaardVersies = applicatie.standaardVersies || [];
  
  // Only initialize if we have existing data and haven't initialized yet
  if (
    (existingCompliancy.length > 0 || existingStandaardVersies.length > 0) &&
    !selectedExtraStandardsInitializedRef.current
  ) {
    // ... initialization logic ...
    selectedExtraStandardsInitializedRef.current = true;
  }
}, [
  standaardenOptions,
  standaardenversiesOptions,
  referentieComponentenWithStandards,
  applicatie.compliancy, // Add back
  applicatie.standaardVersies, // Add back
]);
```

### Option 2: Reset initialization flag when editing (Better)
```javascript
// Reset the initialization flag when entering edit mode with data
useEffect(() => {
  if (isEditMode && applicatie.id && (applicatie.compliancy?.length > 0 || applicatie.standaardVersies?.length > 0)) {
    selectedExtraStandardsInitializedRef.current = false;
  }
}, [isEditMode, applicatie.id]);
```

## Implementation ✅ COMPLETED

Implemented a smarter guard in the initialization useEffect (lines 880-1028):

### Changes Made:

**File**: `src/views/ac-forms/ac-forms-applicatie/ac-forms-applicatie.js`

**1. Updated Guard Logic** (lines 905-920):
```javascript
// If no existing data, mark as initialized and return
if (allVersieIds.size === 0) {
  if (!selectedExtraStandardsInitializedRef.current) {
    selectedExtraStandardsInitializedRef.current = true;
  }
  return;
}

// If already initialized and selectedExtraStandards matches existing data, skip
if (selectedExtraStandardsInitializedRef.current) {
  const currentExtraIds = new Set(
    selectedExtraStandards.map((s) => String(s.value))
  );
  // Check if the sets are identical
  if (
    currentExtraIds.size === allVersieIds.size &&
    [...allVersieIds].every((id) => currentExtraIds.has(id))
  ) {
    return; // Already correctly initialized
  }
  // If data changed (e.g., when switching to edit mode), allow re-initialization
}
```

**2. Added Dependencies** (lines 1021-1027):
```javascript
}, [
  standaardenOptions,
  standaardenversiesOptions,
  referentieComponentenWithStandards,
  applicatie.compliancy, // Added: reinitialize when editing
  applicatie.standaardVersies, // Added: reinitialize when editing
  selectedExtraStandards, // Added: check if already correct
]);
```

### How It Works Now:

1. **On Create**: Effect runs, finds no data, marks as initialized
2. **On Edit**: 
   - Effect runs when `applicatie` data loads
   - Checks if `selectedExtraStandards` already matches the saved data
   - If not matching, re-initializes from `applicatie.compliancy` and `applicatie.standaardVersies`
   - Prevents unnecessary re-runs when data is already correct
3. **On Checkbox Toggle**: 
   - Effect checks if current state matches saved data
   - If already matching, returns early (no unnecessary work)
   - Smart guard prevents infinite loops

### Result:
- ✅ Previously selected standaardversies now show as checked when editing
- ✅ No unnecessary re-initializations
- ✅ No infinite loops from dependencies
- ✅ Works for both create and edit modes
