### Generic Beheer Details Page

This document describes the Generic Beheer Details Page system. It consolidates the functionality of multiple domain-specific detail pages into a single configurable detail page, powered by the object store and small per-type configurations.

---

### What it is

- **A single details component** that can display details for many beheer domains (e.g., applicaties, diensten, organisaties, gebruiken, kwetsbaarheden, overeenkomsten, contactpersonen, voorzieningen-versie).
- **Backed by the object store** for fetching the object, its schema, and its related data (files, uses, used, logs) with proper loading and error handling.
- **Config-driven** via a per-type configuration factory, similar to the generic beheer list page and generic form modal.
- **Extensible actions** through a per-type `uniqueActions` list (e.g., publish/depublish, koppelen) and integration with the existing modal factory for additional modals.
- **Tabbed UI** that includes:
  - Bestanden: A generic files tab via `ConObjectUploadFiles`
  - Gebruikt (uses): Basic count and dynamic per-schema tabs with `BeheerTable`
  - Gebruikt door (used): Basic count and dynamic per-schema tabs with `BeheerTable`

---

### What it is not (yet)

- It does not attempt to replicate every bespoke layout or inline editor from existing pages (e.g., special description editors, organization-specific banners, version-specific tables). These remain domain-specific for now.
- It does not support per-page visual overrides via props; configuration is centralized in the config factory. (Potential improvement: add `configOverrides` prop.)
- It does not add new domain-specific modals; it only renders existing ones via the modal factory where available.
- It shows `Gebruikt/Gebruikt door` tabs in a consistent generic manner; advanced domain-specific filters or summaries are out-of-scope.

If needed, targeted enhancements can be added in the config factory with minimal changes.

---

### Files and Architecture

- Component: `@views/ac-beheer/core/components/con-generic-beheer-details-page.js`

  - Loads object and schema from the object store
  - Sets active object; the store then fetches related data: files, uses, used, logs
  - Renders a configurable header, detail grid (from schema properties), and tabs
  - Provides base actions (edit/delete) and renders per-type additional modals via `con-beheer-modal-factory.js`

- Details Config Factory: `@views/ac-beheer/core/factories/con-details-page-config-factory.js`

  - Merges canonical API config from `con-beheer-page-config-factory.js` (e.g., `registerSlug`, `schemaSlug`, `extend`)
  - Adds details-only configuration: `excludedProperties`, `getTitle(data)`, per-type `formatBySchemaOptions`, and optional `uniqueActions`
  - Keeps responsibilities per domain centralized and maintainable

- Modal Factory (existing): `@views/ac-beheer/core/factories/con-beheer-modal-factory.js`

  - The details page reuses this to render domain-specific modals (publish/depublish, koppelen, etc.)
  - Edit uses the generic form modal (`core/modals/con-generic-form-modal/con-generic-form-modal.js`), delete uses the generic delete modal

- Object Store: `@stores/object.store.js`
  - Provides `fetchObject`, `fetchSchema`, `setActiveObject`, `getRelatedData`, `getSchemaProperties`, and operation states
  - Automatically fetches `uses`, `used`, `files`, and `logs` when `setActiveObject` is called

---

### Data Flow

1. Resolve per-type config using `con-details-page-config-factory.js`, which internally merges with `con-beheer-page-config-factory.js` to obtain `registerSlug`, `schemaSlug`, and `extend`.
2. Use `object.fetchObject(registerSlug, schemaSlug, id, { _extend })` and `object.fetchSchema(schemaSlug)`.
3. When object is available, call `object.setActiveObject(registerSlug, schemaSlug, object)` to trigger related-data fetches.
4. Render:
   - Title via `config.getTitle(data)`
   - A grid of fields based on `getSchemaProperties(schemaType)` minus `excludedProperties`
   - Tabs: files, gebruikt, gebruikt door, plus dynamic schema tabs for each unique schema in uses/used
5. Actions:
   - Edit (generic form modal) and Delete (generic delete modal)
   - Additional per-type actions via `config.uniqueActions` and `con-beheer-modal-factory.js`

---

### Format-by-schema configuration

- Rendering of each field in the grid uses `con-format-by-json-schema.js` via:
  ```js
  formatBySchema(schema, data, key, config.formatBySchemaOptions);
  ```
- `formatBySchemaOptions` lives in the details page config per type and supports:
  - `include`: array of property keys to include when rendering objects
  - `exclude`: array of property keys to hide
  - `inline`: render nested properties inline (comma separated)
  - `includeUnknown`: include object properties that are not defined in the schema
  - `profile`: per-key overrides, keyed by property name, each with its own `include`, `exclude`, `inline`, `includeUnknown`, or nested `profile` to further specialize rendering

Examples per domain type (abbreviated):

- Applicaties: show organization name inline
  ```js
  formatBySchemaOptions: {
    profile: { organisatie: { include: ['naam'], includeUnknown: true, inline: true } },
  }
  ```
- Diensten: render values inline and allow unknowns
  ```js
  formatBySchemaOptions: { includeUnknown: true, inline: true }
  ```
- Gebruiken: show readable labels for `voorzieningId` and `organisatieId`
  ```js
  profile: {
    voorzieningId: { include: ['naam'], includeUnknown: true, inline: true },
    organisatieId: { include: ['naam'], includeUnknown: true, inline: true },
  }
  ```
- Organisaties: exclude `@self` and render deelnames inline with `naam`
  ```js
  exclude: ['@self'],
  includeUnknown: true,
  profile: { deelnames: { include: ['naam'], includeUnknown: true, inline: true } }
  ```
- Overeenkomsten: render `voorzieningAanbod` and `voorzieningGebruik` inline by id
  ```js
  profile: {
    voorzieningAanbod: { includeUnknown: true, include: ['id'], inline: true },
    voorzieningGebruik: { includeUnknown: true, include: ['id'], inline: true },
  }
  ```
- Voorzieningen-versie: render related provision names inline
  ```js
  include: ['id'], includeUnknown: true, inline: true,
  profile: {
    voorziening: { include: ['name'], includeUnknown: true, inline: true },
    voorzieningaanbod: { include: ['name'], includeUnknown: true, inline: true },
  }
  ```

Refer to the source for full details on option handling in `con-format-by-json-schema.js`.

---

### How to use

Render the generic details component in a route/view, passing the `type` and the `id` (from params or prop):

```jsx
import ConGenericBeheerDetailsPage from '@views/ac-beheer/core/components/con-generic-beheer-details-page';

const MyDetailsRoute = () => {
  // Suppose /beheer/applicaties/:id
  const { id } = useParams();
  return <ConGenericBeheerDetailsPage type='applicaties' id={id} />;
};
```

Supported `type` values map to config in the details config factory:

- `applicaties`
- `diensten`
- `organisaties`
- `gebruiken`
- `kwetsbaarheden`
- `overeenkomsten`
- `contactpersonen`
- `voorzieningen-versie`

The component also reads `id` from route params automatically if not provided via prop.

---

### Adding/Extending a Domain Type

Add or adjust the type in both places: canonical API config in `con-beheer-page-config-factory.js` and details-only config in `con-details-page-config-factory.js`.

```js
case 'mijn-type':
  return {
    ...beheerConfig,       // brings registerSlug, schemaSlug, extend, etc.
    ...baseDetailsConfig,  // details-only defaults
    excludedProperties: ['id'],
    getTitle: (data) => data?.naam || data?.id,
    formatBySchemaOptions: {
      includeUnknown: true,
      inline: true,
      profile: {
        mijnRelatie: { include: ['naam'], includeUnknown: true, inline: true },
      },
    },
    uniqueActions: [
      {
        key: 'publish',
        label: 'Publiceren',
        icon: VISUALS.PUBLISH,
        condition: (row) => !row?.['@self']?.published,
        action: 'publish',
      },
    ],
  };
```

If you need extra modals, ensure they exist in `con-beheer-modal-factory.js` under your `type`. The details page will render them automatically alongside the built-in edit/delete.

---

### Customizing the Details Grid

- The details grid is generated from the JSON schema via `getSchemaProperties(schemaType)`.
- To hide a field, add it to `excludedProperties` in the config for that `type`.
- Display formatting is handled by `con-format-by-json-schema.js`. If a field needs more advanced rendering, enhance that utility (kept generic for reuse), or follow up with domain-specific view logic.

---

### Actions and Modals

- Edit → `ConGenericFormModal` (driven by `con-form-modal-config-factory.js`)
- Delete → `ac-generic-beheer-delete-modal`
- Unique actions → define in config and ensure the modal exists in `con-beheer-modal-factory.js` (e.g., publish/depublish, koppelen)

When edit/delete completes successfully, the page re-fetches the object with the configured `_extend` to stay up-to-date.

---

### Internationalization Notes

- Tab labels and UI text are in Dutch, following the project’s i18n guidance.
- Schemas and API fields remain as-is; label rendering is handled by the JSON schema utilities.

---

### Known Limitations / Future Improvements

- Add `configOverrides` prop to support per-instance overrides (mirroring the list page).
- Allow domain-specific header sections (e.g., logo preview, warning banners) via config hooks.
- Provide per-schema custom table headers for uses/used in config (today uses default `BeheerTable` from metadata).
- Optional audit trail tab when relevant (store already fetches logs; not shown by default).
- Inline editors for text fields (as in some bespoke pages) are intentionally out-of-scope here.

---

### Troubleshooting

- Empty tabs for `Gebruikt`/`Gebruikt door`: ensure the backend supports `/used` and `/uses` endpoints for the object type, and that `_extend` (from the default beheer config) includes `@self.schema` where needed.
- Missing schema fields: check that `fetchSchema(schemaSlug)` succeeds and that the schema defines `properties`.
- Extra modal not opening: confirm modal is registered in `con-beheer-modal-factory.js` for your `type`, and that an action is configured in the details config.
