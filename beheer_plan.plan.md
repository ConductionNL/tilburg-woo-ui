# Beheer Warmup System Implementation Plan

## Overview

Transform the beheer page system from per-type fetching with small limits to a warmup-based approach that pre-fetches all object types (limit 10,000) and their schemas when entering beheer routes, then uses frontend filtering and pagination.

## Phase 1: Extract Types from MenuAPI

**Files to modify:**

- `src/stores/object.store.js` - Add utility methods for type extraction
- `src/utilities/con-normalize-link-to-schema-slug.js` - NEW: Create reverse normalization utility that maps Dutch link slugs (e.g., "applicaties") to schema slugs (e.g., "module") (the exact opposite of `src/utilities/con-normalize-schema-name.js`)

**Tasks:**

1. Create `extractBeheerTypesFromMenu()` method in ObjectStore that:

- Fetches menu list via MenuAPI
- Finds menu with `position: 7`
- Extracts `items` array from that menu
- Transforms each item's `link` property (e.g., "/beheer/applicaties") to a slug (e.g., "applicaties")
- Normalizes slugs to schema names using `normalizeSchemaName()` utility (e.g., "applicaties" => "module")
- Returns array of normalized schema types

2. Create a maintainable constant for excluded links:

- Define `BEHEER_EXCLUDED_LINKS` constant array (consider placing at top of ObjectStore or in a constants file for easy maintenance)
- Include: `/beheer`, `/beheer/my-account`, `/beheer/my-organisation`
- Use this constant to filter out menu items whose links match these excluded paths
- This makes it easy to update if excluded links change in the future

3. Handle edge cases:

- Filter out non-beheer links (links that don't start with `/beheer/`)
- Filter out excluded links using `BEHEER_EXCLUDED_LINKS` constant
- Handle missing menu or items
- Validate normalized schema names
- Handle links that don't match expected patterns

## Phase 2: Create Warmup Method in ObjectStore

**Files to modify:**

- `src/stores/object.store.js` - Add warmup method and related state

**Tasks:**

1. Add observable state for warmup tracking (per-type):

- `warmupInProgress` - object mapping type to boolean (e.g., `{ 'module': true, 'product': false }`)
- `warmupCompleted` - object mapping type to boolean
- `warmupErrors` - object mapping type to error message
- Helper methods: `isWarmupInProgress(type)`, `isWarmupCompleted(type)`, `getWarmupError(type)`

2. Create `warmupBeheerData()` method that:

- Checks if warmup data already exists by verifying collections exist in store (not session storage, since store resets on refresh)
- For each type from `extractBeheerTypesFromMenu()`, check if collection exists and has data
- Only warmup types that are missing or empty
- Sets `warmupInProgress = true` for the type that is actively warming up
- Calls `extractBeheerTypesFromMenu()` to get types
- For each type that needs warming up:
- Fetch schema using `fetchSchema()` (if not already cached)
- Fetch objects with `_limit: 10000` and `_published: 'false'` using `fetchCollection()`
- For every property where there is a `$ref` property with data, resolve that property in the data using name cache system
    - e.g.
    - Schema:
```
{
  module: {
    "description": "De specifieke applicatie die gebruikt wordt",
    "type": "object",
    "visible": true,
    "order": 20,
    "facetable": false,
    "title": "Applicatie",
    "objectConfiguration": {
      "handling": "related-object"
    },
    "$ref": "#/components/schemas/module",
    "inversedBy": "gebruik",
    "table": {
      "default": true
    }
  }
}
```

    - data:
```
{
  results: [
    {
      module: "83039237-2520-464a-947f-454193dd550a"
    }
  ]
}
```

    - in this case since the property module has a $ref with data on the schema, the module in the actual data should be resolved using the name cache system.
- Set `warmupCompleted = true` when all types are fetched
- Handle errors gracefully

3. Create helper method `resolveRefsInCollection(type)` that:

- Gets collection for type
- Gets schema for type
- Iterates through objects and their properties
- For properties with valid `$ref` in schema, uses name cache to resolve UUIDs to names
- Updates objects in store with resolved names

## Phase 3: Trigger Warmup on Beheer Routes

**Files to modify:**

- `src/views/ac-beheer/core/components/ac-beheer.js` - Add warmup trigger
- `src/views/ac-beheer/core/components/ac-dashboard.js` - Add warmup trigger

**Tasks:**

1. In `ac-beheer.js`:

- Add `useEffect` that triggers warmup when component mounts
- The warmup method itself checks if data exists in store (no need for external checks)
- Show loading state during warmup if needed (check per-type warmup states)

2. In `ac-dashboard.js`:

- Add `useEffect` that triggers warmup when component mounts
- Same approach - warmup method handles checking if data exists
- Show loading state during warmup if needed

3. Note: No session storage needed - warmup method checks MobX store collections directly to determine what needs fetching

## Phase 4: Update Beheer Pages to Use Pre-fetched Data

**Files to modify:**

- `src/views/ac-beheer/core/components/con-generic-beheer-page.js` - Switch to frontend filtering/pagination
- `src/views/ac-beheer/shared/components/con-beheer-table/con-beheer-table.js` - Update if needed

**Tasks:**

1. Modify `con-generic-beheer-page.js`:

- Remove or disable `fetchCollection` calls for initial data load
- Read data directly from ObjectStore collections (already reactive via MobX)
- Implement frontend filtering:
- Filter by search term using fuzzy search across ALL fields of objects (not just specific fields)
- Filter by other criteria (status, etc.)
- Implement frontend pagination:
- Filter data first using fuzzy search
- Then paginate filtered results (e.g., 20 items per page)
- Update URL params for page number but don't trigger API calls

2. Implement fuzzy search functionality:

- Create or use a fuzzy search utility that searches through all object properties/fields
- Search should be case-insensitive and handle partial matches
- Consider using a library like `fuse.js` or implementing a simple fuzzy matching algorithm
- Change from debounced API calls to immediate local filtering
- Keep URL search params for shareability but don't trigger fetches
- Search should work on nested properties and arrays as well

3. Ensure loading states reflect warmup status:

- Show loading if warmup is in progress
- Show data once warmup completes

## Phase 5: Name Cache Resolution Integration

**Files to modify:**

- `src/stores/object.store.js` - Enhance warmup to resolve $ref properties

**Tasks:**

1. In `resolveRefsInCollection()` method:

- Get schema properties for each type
- For each object in collection:
- Iterate through object properties
- Check if property has `$ref` in schema definition
- If value is UUID and `$ref` exists, resolve using `getNamesForSingleId()` or `getNamesForMultipleIds()`
- Replace UUID with resolved name in object
- Update objects in store with resolved values

2. Handle edge cases:

- Arrays of UUIDs
- Nested objects with references
- Missing names (fallback to UUID)

3. Batch name resolution for performance:

- Collect all UUIDs first
- Resolve in batches
- Update objects after resolution

## Phase 6: Testing and Edge Cases

**Tasks:**

1. Test warmup sequence:

- Verify all types are fetched correctly
- Verify schemas are fetched
- Verify name resolution works

2. Test frontend filtering:

- Search functionality
- Filter combinations
- Pagination on filtered results

3. Handle edge cases:

- Warmup failure (fallback to old behavior?)
- Missing menu data
- Types that don't exist
- Empty collections

4. Performance considerations:

- Ensure warmup doesn't block UI
- Consider showing progress indicator
- Verify 10,000 limit is sufficient