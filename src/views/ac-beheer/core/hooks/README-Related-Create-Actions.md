# Related Create Actions Hook <!-- omit in toc -->

## table of contents <!-- omit in toc -->

- [📋 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [🔄 Data Flow](#-data-flow)
- [🧠 Responsibilities](#-responsibilities)
- [🚀 Usage](#-usage)
  - [List Page Example](#list-page-example)
  - [Details Page Example](#details-page-example)
- [🧩 Pre-selected Field Rules](#-pre-selected-field-rules)
- [⚙️ API](#️-api)
- [🧯 Troubleshooting](#-troubleshooting)
- [📝 Best Practices](#-best-practices)
- [❓ Why are preSelected keys hardcoded?](#-why-are-preselected-keys-hardcoded)

## 📋 Overview

The Related Create Actions Hook provides a reusable way to add context-aware "Toevoegen" actions to Beheer list and details pages. It:

- Fetches related schemas for the current page's schema
- Filters by the current user's groups against each related schema's `authorization.create`
- Produces action items that open the page-local generic form modal with correct type and pre-selected values

This eliminates duplication and hardcoded actions, and consolidates logic in one place.

## 🏗️ Architecture

```
useRelatedCreateActions → Beheer pages (list/details) → BeheerModalFactory (dynamicCreate) → ConGenericFormModal → ConDynamicSchemaForm
                 ↑                                   ↓
         ObjectStore.fetchSchemaRelated()         FormModalConfigFactory
                 ↑
            UserStore.userGroups
```

- `useRelatedCreateActions` (this hook): builds actions from related schemas and user groups
- `BeheerModalFactory`: renders `dynamicCreate` generic form modal (type + preSelected)
- `ConGenericFormModal`: merges schema defaults, config.initialData, and preSelected

## 🔄 Data Flow

1. Page calls `useRelatedCreateActions({ object, user, schemaRef, currentType, openDynamicCreate })`
2. Hook fetches related schemas for `schemaRef` and filters by `authorization.create ∩ user.groups`
3. Hook returns `makeActionsForContext(ctxId)` which maps schema slugs → beheer route types and creates click handlers
4. On click, page calls `openDynamicCreate(targetType, preSelected)`
5. Modal factory passes `{ type: targetType, preSelected }` to the generic form
6. Generic form initializes with `schemaDefaults → config.initialData → preSelected → editData`

## 🧠 Responsibilities

- Encapsulate fetching and filtering of related schemas
- Map backend schema slugs to beheer route types (`BEHEER_RENAMES`)
- Compute `preSelected` values based on current page type and clicked context id
- Provide ready-to-render actions (label, icon, onClick)

## 🚀 Usage

### List Page Example

```javascript
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';

const { makeActionsForContext } = useRelatedCreateActions({
  object,             // ObjectStore
  user,               // UserStore
  schemaRef: config.schemaSlug,
  currentType: type,  // e.g., 'applicaties'
  openDynamicCreate: (targetType, preSelected) => {
    setDynamicCreateTargetType(targetType);
    setDynamicCreatePreSelected(preSelected);
    setOpenModal('dynamicCreate');
  },
});

// In row action renderer
const actions = [
  ...base,
  ...unique,
  ...makeActionsForContext(row.id),
  ...delete,
];
```

### Details Page Example

```javascript
const { makeActionsForContext } = useRelatedCreateActions({
  object,
  user,
  schemaRef: config.schemaSlug,
  currentType: type,
  openDynamicCreate: (targetType, preSelected) => {
    setDynamicCreateTargetType(targetType);
    setDynamicCreatePreSelected(preSelected);
    setOpenModal('dynamicCreate');
  },
});

const menuItems = makeActionsForContext(data.id).map(({ key, label, onClick }) => ({
  key,
  label,
  onClick,
}));
```

## 🧩 Pre-selected Field Rules

The hook calculates `preSelected` keys using API schema field names (no mappings):

- diensten (from applicaties)
  - `{ voorziening: <ctxId> }`
- gebruiken (from applicaties)
  - `{ voorzieningId: <ctxId> }`
- gebruiken (from organisaties)
  - `{ organisatie: <ctxId> }`
- contactpersonen (from organisaties)
  - `{ organisatie: <ctxId> }`

These align with the form configurations and options providers in `con-form-modal-config-factory.js`.

## ⚙️ API

```ts
useRelatedCreateActions({
  object: ObjectStore,
  user: UserStore,
  schemaRef: string | object, // schema slug/id for related lookup
  currentType: string,        // beheer route type, e.g., 'applicaties'
  openDynamicCreate: (targetType: string, preSelected: Record<string, any>) => void,
}): {
  makeActionsForContext: (ctxId: string) => Array<{
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
  }>;
}
```

- `schemaRef`: current page's schema (e.g., `'voorziening'`, `'organisatie'`)
- `currentType`: page route type used for deciding `preSelected` keys
- `openDynamicCreate`: consumer-provided handler to open the generic form modal for the target beheer type

## 🧯 Troubleshooting

- **Action shows but form is not prefilled**

  - Verify target type and field names match the form schema. Example: `gebruiken` expects `organisatie` (not `organisatieId`).
  - Confirm `dynamicCreateTargetType` and `dynamicCreatePreSelected` are set before calling `setOpenModal('dynamicCreate')`.

- **Form reopens without new values**

  - Ensure modal mounts fresh per open. If necessary, key `dynamicCreate` by target type or use a timestamp token to remount.

- **No actions appear**
  - Check `authorization.create` of related schemas and user groups. Only creatable relations are exposed.

## 📝 Best Practices

- Keep effect dependencies minimal inside the hook to avoid loops; schemaRef changes should be the main trigger
- Always prefer API schema field names in `preSelected` to avoid mapping bugs
- Use `BEHEER_RENAMES` as a thin translation layer from schema slugs to beheer route types
- Let the consumer fully control modal open/close state; the hook is stateless beyond preparing action data

## ❓ Why are preSelected keys hardcoded?

Different target schemas currently expect different field names for the same relational context. To ensure the generic form receives the right defaults, the hook sets `preSelected` with explicit keys per target type:

- diensten: expects `voorziening`
- gebruiken: expects `voorzieningId` (from applicaties) and `organisatieId` (from organisaties)
- contactpersonen: expects `organisatie`

This is intentional until schemas are aligned. Once field names are consistent (e.g., always `...Id` or always the entity name), the hardcoded mapping in the hook can be removed and replaced by a generic rule (or derived from metadata).
