# Beheer System Folder Structure

This document describes the improved folder structure for the beheer (management) system.

## Overview

The beheer system has been reorganized into a cleaner, more maintainable structure with clear separation of concerns:

```
src/views/ac-beheer/
├── core/                    # Generic beheer system components
│   ├── components/         # Reusable beheer components
│   ├── factories/          # Factory classes
│   ├── modals/            # Generic modals
│   └── utils/             # Beheer utilities
├── domains/                # Domain-specific pages
│   ├── ac-applicaties/
│   ├── ac-contactpersonen/
│   ├── ac-dienst/
│   ├── ac-gebruiken/
│   ├── ac-kwetsbaarheid/
│   ├── ac-organisatie/
│   ├── ac-overeenkomsten/
│   └── ac-voorzieningen-versie/
├── shared/                 # Shared components across domains
│   ├── components/
│   ├── modals/
│   └── utils/
└── index.js               # Main exports
```

## Structure Details

### Core System (`core/`)

Contains the generic beheer system that can be used across all domains:

- **components/**: Generic beheer components like `ConGenericBeheerPage`, `ConGenericFormModal`
- **factories/**: Factory classes for creating configurations and modals
- **modals/**: Generic modal components like delete confirmations
- **utils/**: Utility functions and constants specific to beheer

### Domains (`domains/`)

Each domain represents a specific business entity with its own pages and modals:

- **ac-applicaties/**: Application management
- **ac-contactpersonen/**: Contact person management  
- **ac-dienst/**: Service management
- **ac-gebruiken/**: Usage management
- **ac-kwetsbaarheid/**: Vulnerability management
- **ac-organisatie/**: Organization management
- **ac-overeenkomsten/**: Agreement management
- **ac-voorzieningen-versie/**: Provision version management

Each domain follows the same structure:
```
domain-name/
├── pages/          # Detail pages
├── modals/         # Domain-specific modals
└── components/     # Domain-specific components
```

### Shared Components (`shared/`)

Components that are used across multiple domains:

- **components/**: Reusable components like tables, action menus, upload components
- **modals/**: Shared modal components
- **utils/**: Shared utility functions

## Import Patterns

All imports now use full paths instead of relative paths:

```javascript
// ✅ Good - Full paths
import ConActionMenu from '@src/views/ac-beheer/shared/components/con-action-menu';
import { BASE_URL } from '@src/views/ac-beheer/core/utils/constants';

// ❌ Bad - Relative paths (old way)
import ConActionMenu from '../../con-action-menu';
import { BASE_URL } from '../constants';
```

## Benefits

1. **Clear Separation**: Core system vs domain-specific vs shared components
2. **Full Path Imports**: No more confusing relative imports
3. **Better Maintainability**: Easier to find and modify components
4. **Scalability**: Easy to add new domains or components
5. **Consistency**: Standardized structure across all domains

## Migration Notes

- All relative imports have been updated to use full paths
- Components are now organized by their purpose (core, shared, domain-specific)
- Factory classes are centralized in the core system
- Shared components are easily accessible across all domains
