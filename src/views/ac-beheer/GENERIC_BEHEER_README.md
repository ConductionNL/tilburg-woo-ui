# Generic Beheer System

This document explains the generic beheer system that has been created to replace the individual beheer pages with a single, configurable solution.

## Overview

The generic beheer system consists of several key components:

1. **ConGenericBeheerPage** - The main generic component that handles all beheer page functionality
2. **BeheerPageConfigFactory** - Factory that creates configuration objects for different beheer types
3. **BeheerModalFactory** - Factory that manages modal components for different beheer types
4. **FilterDrawerFactory** - Factory that manages filter drawer components
5. **ConBeheerPageWrapper** - Simple wrapper component for easy usage

## Architecture

### Factory Pattern

The system uses a factory pattern to manage different configurations and components:

- **Configuration Factory**: Defines schemas, headers, actions, and other page-specific settings
- **Modal Factory**: Manages modal components and their props for different beheer types
- **Filter Factory**: Handles custom filter drawers (like the organisatie filter with beoordeling)

### Key Features

1. **Unified Pagination**: All pages use the same `usePaginationLimit` hook with type-specific keys
2. **Dynamic Headers**: Headers are generated from schema with custom overrides
3. **Custom Actions**: Each beheer type can define unique action buttons
4. **Modal Management**: Automatic modal loading and prop management
5. **Filter Support**: Support for custom filter drawers (like organisatie's beoordeling filter)
6. **Status Icons**: Support for status indicators (like organisatie's publish status)

## Usage

### Basic Usage

```javascript
import ConBeheerPageWrapper from './con-beheer-page-wrapper';

const MyBeheerPage = () => {
  return <ConBeheerPageWrapper type='applicaties' />;
};
```

### With Custom Configuration

```javascript
import ConGenericBeheerPage from './con-generic-beheer-page';

const MyCustomBeheerPage = () => {
  const customConfig = {
    title: 'Custom Title',
    customHeaders: {
      // Custom header overrides
    },
    uniqueActions: [
      // Custom actions
    ],
  };

  return <ConGenericBeheerPage type='applicaties' configOverrides={customConfig} />;
};
```

## Supported Beheer Types

The system currently supports the following beheer types:

1. **applicaties** - Application management
2. **diensten** - Service management
3. **voorzieningen-versie** - Service version management
4. **organisaties** - Organization management (with custom filter)
5. **kwetsbaarheden** - Vulnerability management
6. **gebruiken** - Usage management
7. **overeenkomsten** - Agreement management
8. **contactpersonen** - Contact person management

## Configuration

### Base Configuration

Each beheer type has a base configuration that includes:

```javascript
{
  registerSlug: 'voorzieningen',
  schemaSlug: 'voorziening',
  paginationKey: 'applicaties',
  title: 'Beheer Applicaties',
  routeType: 'applicaties',
  defaultHeaders: ['naam', 'referentieComponenten', 'standaarden', 'categorie', 'links'],
  customHeaders: {
    // Custom header overrides
  },
  modals: ['add', 'edit', 'delete', 'import'],
  uniqueActions: [
    // Custom action buttons
  ],
  statusIcon: {
    // Status icon configuration
  },
}
```

### Custom Headers

Custom headers allow you to override how specific data is displayed:

```javascript
customHeaders: {
  standaarden: {
    id: 'standaarden',
    label: 'Standaarden',
    key: 'standaarden',
    customContent: (row) => {
      if (row?.standaarden && typeof row?.standaarden === 'string') {
        return <AcColumn key={row.id}>Data invalid</AcColumn>;
      }
      return (
        <AcColumn key={row.id}>
          {row?.standaarden?.map((standaard) => standaard.naam).join(', ')}
        </AcColumn>
      );
    },
  },
}
```

### Unique Actions

Unique actions allow you to add custom action buttons for specific beheer types:

```javascript
uniqueActions: [
  {
    key: 'activate',
    label: 'Activeren',
    icon: <VISUALS.CHECK />,
    condition: (row) => row.beoordeling?.toLowerCase?.() !== 'actief',
    action: 'activate',
  },
  {
    key: 'publish',
    label: 'Publiceren',
    icon: <VISUALS.PUBLISH />,
    condition: (row) =>
      !row['@self'].published && row?.beoordeling?.toLowerCase?.() !== 'concept',
    action: 'publish',
  },
];
```

### Status Icons

Status icons allow you to add visual indicators:

```javascript
statusIcon: {
  customContent: (row) => (
    <div className='ac-beheer-organisaties-name-container'>
      <div
        className='ac-beheer-organisaties-name-container__icon'
        data-tooltip-id={TOOLTIP_ID}
        data-tooltip-content={
          row['@self'].published ? 'Gepubliceerd' : 'Niet gepubliceerd'
        }
      >
        {row['@self'].published ? (
          <VISUALS.CIRCLE_CHECK className='ac-beheer-publish-icon__check' />
        ) : (
          <VISUALS.CIRCLE_EXCLAMATION className='ac-beheer-publish-icon__exclamation' />
        )}
      </div>
    </div>
  ),
  customHeader: (
    <div className='ac-beheer-organisaties-name-container__icon'></div>
  ),
}
```

## Modal System

The modal system automatically handles:

1. **Component Loading**: Modals are loaded dynamically using `@loadable/component`
2. **Prop Management**: Modal props are automatically generated based on type and action
3. **State Management**: Modal state is managed by the generic component

### Adding New Modals

To add a new modal for a beheer type:

1. Add the modal component to `BeheerModalFactory.modalComponents`
2. Add the modal type to the configuration's `modals` array
3. Add prop generation logic to `BeheerModalFactory.getModalProps`

## Filter System

The filter system supports:

1. **Standard Filters**: Default column filtering
2. **Custom Filters**: Special filters like organisatie's beoordeling filter

### Adding Custom Filters

To add a custom filter:

1. Create a custom filter drawer component
2. Add it to `FilterDrawerFactory.filterDrawerComponents`
3. Add prop generation logic to `FilterDrawerFactory.getFilterDrawerProps`

## Migration Guide

### From Individual Pages to Generic

To migrate an existing beheer page:

1. **Identify Configuration**: Extract the configuration from the existing page
2. **Add to Factory**: Add the configuration to `BeheerPageConfigFactory`
3. **Add Modals**: Add modal components to `BeheerModalFactory`
4. **Add Filters**: Add custom filters to `FilterDrawerFactory` if needed
5. **Replace Component**: Replace the existing component with `ConBeheerPageWrapper`

### Example Migration

**Before (Individual Page)**:

```javascript
// 413 lines of code with lots of duplication
const AcBeheerApplicaties = () => {
  // ... lots of boilerplate code
};
```

**After (Generic Page)**:

```javascript
// 8 lines of code
const AcBeheerApplicaties = () => {
  return <ConBeheerPageWrapper type='applicaties' />;
};
```

## Benefits

1. **Reduced Code Duplication**: 90%+ reduction in boilerplate code
2. **Consistent Behavior**: All pages behave consistently
3. **Easy Maintenance**: Changes to common functionality only need to be made in one place
4. **Type Safety**: Configuration-based approach reduces errors
5. **Extensibility**: Easy to add new beheer types or modify existing ones

## Future Enhancements

1. **TypeScript Support**: Add TypeScript for better type safety
2. **Advanced Filtering**: Support for more complex filtering scenarios
3. **Bulk Operations**: Support for bulk operations across multiple rows
4. **Real-time Updates**: Support for real-time data updates
5. **Advanced Sorting**: Support for complex sorting scenarios

## Troubleshooting

### Common Issues

1. **Modal Not Loading**: Check that the modal component is properly imported in `BeheerModalFactory`
2. **Headers Not Showing**: Check that the header ID is in the `defaultHeaders` array
3. **Actions Not Working**: Check that the action is properly defined in `uniqueActions`
4. **Filter Not Working**: Check that the filter drawer is properly configured in `FilterDrawerFactory`

### Debug Mode

To enable debug mode, add `console.log` statements in the configuration factory:

```javascript
console.log('Config for type:', type, config);
```

This will help identify configuration issues.
