# Generic Form Modal System Documentation

## 📋 **Overview**

The Generic Form Modal System provides a unified, configuration-driven approach to creating form modals across the application. Instead of building separate form components for each entity type, you define configurations that describe how forms should behave.

## 🏗️ **Architecture**

```
FormModalConfigFactory  →  ConGenericFormModal  →  ConDynamicSchemaForm
        ↓                           ↓                        ↓
   Configuration            Form Logic               UI Rendering
```

- **FormModalConfigFactory**: Defines form behavior and data sources
- **ConGenericFormModal**: Handles form state, API calls, and user interactions
- **ConDynamicSchemaForm**: Renders the actual form fields based on schema
- **BeheerPageConfigFactory**: Provides API endpoints and schema information

## 🚀 **Key Features**

### ✅ **What It Can Do**

- **Schema-based forms**: Automatically generates forms from API schemas
- **API-powered dropdowns**: Fetches dropdown options from any API endpoint
- **Dynamic field dependencies**: Fields that change based on other field values
- **Field visibility control**: Show/hide fields based on conditions
- **Custom field components**: Use specialized components for specific fields
- **Field mappings**: Transform data between API format and form format
- **Automatic validation**: Built-in validation based on schema
- **Loading states**: Shows spinners while fetching data or submitting
- **Error handling**: Graceful error handling for API failures
- **Success feedback**: Shows success messages and auto-closes modals

### 🔧 **Integration Benefits**

- **DRY principle**: One form component handles all entity types
- **Consistent UX**: All forms behave the same way
- **Leverages existing systems**: Uses object store and beheer page configs
- **Type safety**: Based on actual API schemas
- **Easy maintenance**: Changes in one place affect all forms

## 📖 **How to Use**

### 1. **Basic Usage**

```javascript
import ConGenericFormModal from './con-generic-form-modal';

// In your component
<ConGenericFormModal
  type='applicaties' // Form type (must exist in config factory)
  data={selectedItem} // Data to edit (null for new items)
  isEdit={true} // Edit mode vs create mode
  showModal={showModal} // Controls modal visibility
  onClose={() => setShowModal(false)}
  onSuccess={() => refetchData()}
  preSelected={{ voorziening: 'some-id' }} // Pre-fill specific fields
/>;
```

### 2. **Adding a New Form Type**

To add support for a new entity type:

1. **Add to FormModalConfigFactory**:

```javascript
// In con-form-modal-config-factory.js
case 'my-new-entity':
  return {
    ...baseConfig,
    // Initial data is automatically generated from schema properties
    // Only specify custom overrides if needed
    initialData: {
      // Only add custom defaults that differ from schema
      // status: 'draft', // Example override
    },
    optionsProviders: {
      // Define dropdown options here
    },
    fieldConfigs: {
      // Control field visibility/behavior here
    },
    transformSubmitData: (data) => {
      // Transform data before API submission
      return {
        ...data,
        // Any custom transformations
      };
    },
  };
```

2. **Add to BeheerModalFactory** (if used with beheer pages):

```javascript
// In con-beheer-modal-factory.js
'my-new-entity': {
  ...baseModalConfig,
  add: GenericFormModal,
  edit: GenericFormModal,
},
```

3. **Ensure BeheerPageConfig exists** (for API endpoints):

```javascript
// Must exist in con-beheer-page-config-factory.js
case 'my-new-entity':
  return {
    ...baseConfig,
    schemaSlug: 'my-entity',      // API schema name
    registerSlug: 'my-register',  // API register name
    // ... other beheer config
  };
```

## 🎛️ **Configuration Options**

### **Core Configuration Structure**

```javascript
{
  // Inherited from beheer page config
  beheerConfig: BeheerPageConfigFactory.createConfig(type),
  schemaType: beheerConfig.schemaSlug,

  // Form-specific configuration
  initialData: {},              // Default form values (overrides for schema defaults)
  optionsProviders: {},        // Dropdown options configuration
  fieldConfigs: {},            // Field visibility/behavior rules
  customComponents: {},        // Custom field components
  transformSubmitData: (data) => data,  // Data transformation before submit
  additionalEffects: [],       // Complex field dependencies
  customValidation: null,      // Custom validation logic
}
```

### **initialData**

The system automatically generates initial data from the API schema properties. You only need to specify custom defaults or overrides:

```javascript
// Initial data is automatically generated from schema properties
// The system creates appropriate defaults based on field types:
// - string fields get ''
// - number fields get 0
// - boolean fields get false
// - array fields get []
// - object fields get {}
// - Schema default values are used when available

initialData: {
  // Only specify custom overrides here
  organisatie: 'ce0391a9-2006-426c-88cd-adedc10579b7', // Custom hardcoded value
  voorkeuren: { taal: 'NL-nl', thema: 'licht' }, // Custom nested object default
}
```

**How it works:**

1. **Schema-based generation**: Initial data is automatically created from schema properties
2. **Default value priority**: If a schema property has a `default` value, it's used
3. **Type-based defaults**: Otherwise, appropriate defaults are generated based on the field type
4. **Config overrides**: Any values in `initialData` override the schema-generated defaults
5. **Edit mode**: When editing, actual data values override both schema and config defaults

### **fieldMappings (Deprecated)**

⚠️ **Field mappings are no longer used or needed.** The system now uses API schema field names directly throughout the form, which is much simpler and more maintainable.

**What we used to do (old approach):**

```javascript
// OLD - No longer needed
fieldMappings: {
  'naam': 'name',           // Map Dutch API field to English internal field
  'beschrijving': 'description',
}
```

**What we do now (current approach):**

- Use API field names directly (`naam`, `beschrijving`, etc.)
- No mapping logic needed
- Forms automatically work with schema field names
- Much simpler and less error-prone

## 🎯 **Dropdown Options Configuration**

The most powerful feature is the flexible options provider system:

### **1. Static Options (Function-based)**

```javascript
optionsProviders: {
  status: () => [
    { label: 'Actief', value: 'active' },
    { label: 'Inactief', value: 'inactive' },
    { label: 'Concept', value: 'draft' },
  ],

  priority: () => [
    { label: 'Hoog', value: 'high' },
    { label: 'Normaal', value: 'normal' },
    { label: 'Laag', value: 'low' },
  ],
}
```

### **2. API-based Options (Collection type)**

Fetch options from any API endpoint:

```javascript
optionsProviders: {
  // Basic API fetch
  voorziening: {
    type: 'collection',
    register: 'voorzieningen',     // API register
    schema: 'voorziening',         // API schema
    labelField: 'naam',            // Field to use as display text
    valueField: 'id',              // Field to use as option value
  },

  // With query parameters
  referentieComponenten: {
    type: 'collection',
    register: 'vng-gemma',
    schema: 'element',
    params: {
      'properties.value': 'Referentiecomponent',
      _limit: 1000,
      _sort: 'name',
    },
    labelField: 'name',
    valueField: 'identifier',
  },

  // With function-based labels
  contact: {
    type: 'collection',
    register: 'voorzieningen',
    schema: 'contactpersoon',
    labelField: (item) => {
      const nameParts = [
        item.voornaam,
        item.tussenvoegsel,
        item.achternaam
      ].filter(Boolean);
      return nameParts.join(' ');
    },
    valueField: 'username',
  },

  // With client-side filtering
  leveranciers: {
    type: 'collection',
    register: 'voorzieningen',
    schema: 'organisatie',
    filter: (item, formData) => {
      // Only show organizations of type 'leverancier'
      return item.type?.toLowerCase() === 'leverancier';
    },
    labelField: (item) => `${item.naam} (${item.kvkNummer})`,
    valueField: 'id',
  },
}
```

### **3. Dynamic/Dependent Options**

Options that change based on other form fields:

```javascript
optionsProviders: {
  versieId: {
    type: 'dynamic',
    dependsOn: 'voorzieningId',  // This field depends on voorzieningId
  },
},

additionalEffects: [
  {
    dependencies: ['voorzieningId'],
    effect: async (formData, { objectStore, setOptions, setOptionsLoading }) => {
      // Clear options if no voorziening selected
      if (!formData.voorzieningId) {
        setOptions('versieId', []);
        return;
      }

      // Show loading state
      setOptionsLoading('versieId', true);

      try {
        // Fetch versions for the selected voorziening using object store
        await objectStore.fetchCollection('voorzieningen', 'voorzieningversie', {
          voorziening: formData.voorzieningId
        });

        const versieType = objectStore.getTypeFromRegisterAndSchema('voorzieningen', 'voorzieningversie');
        const versieCollection = objectStore.getCollection(versieType);
        const results = versieCollection.results || [];

        const options = results.map(item => ({
          label: `${item.versienummer} (${item.status})`,
          value: item.id,
        }));

        setOptions('versieId', options);
      } catch (error) {
        console.error('Error fetching versions:', error);
        setOptions('versieId', []);
      } finally {
        setOptionsLoading('versieId', false);
      }
    }
  }
]
```

## 🎨 **Field Configuration**

Control field behavior and visibility:

### **Basic Field Controls**

```javascript
fieldConfigs: {
  // Hide fields completely
  id: { visible: false },
  internalNotes: { visible: false },

  // Conditional visibility
  kvkNummer: {
    visible: (formData, isEdit) => formData.type === 'leverancier'
  },

  // Disable fields
  organisatie: {
    visible: true,
    disabled: true,  // Always disabled
  },

  // Conditional disabled state
  versieId: {
    visible: true,
    disabled: (formData) => !formData.voorzieningId,
  },

  // Conditional required state
  telefoonnummer: {
    visible: true,
    required: (formData) => formData.aanspreekPunt === true,
  },
}
```

### **Advanced Field Configuration**

```javascript
fieldConfigs: {
  // Multiple conditions
  advancedSettings: {
    visible: (formData, isEdit) => {
      return isEdit && formData.type === 'admin' && formData.level > 5;
    },
  },

  // Complex business logic
  budget: {
    visible: (formData) => formData.projectType === 'commercial',
    required: (formData) => formData.projectType === 'commercial',
    disabled: (formData) => formData.status === 'approved',
  },
}
```

## 🧩 **Custom Components**

Use specialized components for specific field types:

```javascript
customComponents: {
  logo: LogoUploadField,           // File upload component
  dateRange: DateRangePickerField, // Custom date range picker
  richText: RichTextEditorField,   // WYSIWYG editor
  colorPicker: ColorPickerField,   // Color selection
}
```

**Creating a Custom Component**:

```javascript
const CustomFieldComponent = ({
  fieldConfig,
  value,
  onChange,
  validation,
  propertyName,
}) => {
  return (
    <div>
      <label>{fieldConfig.label}</label>
      <input
        type='text'
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        // Add your custom logic here
      />
      {validation.required && !value && (
        <span className='error'>This field is required</span>
      )}
    </div>
  );
};
```

## 🔄 **Data Transformation**

Transform data before submitting to API:

```javascript
transformSubmitData: (data) => {
  return {
    // Map internal field names back to API field names
    naam: data.name,
    beschrijving: data.description,
    categorie: data.category,

    // Transform arrays to comma-separated strings
    tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags,

    // Add computed fields
    laatsteWijziging: new Date().toISOString(),

    // Nested object transformations
    instellingen: {
      thema: data.theme,
      notificaties: data.notifications,
    },

    // Remove internal-only fields
    // (Don't include 'tempId' or other form-only fields)
  };
};
```

## 📚 **Common Use Cases**

### **1. Simple CRUD Form**

```javascript
case 'products':
  return {
    ...baseConfig,
    // Initial data automatically generated from schema
    // No need to specify basic fields - they come from schema default values
    initialData: {},
    optionsProviders: {
      category: {
        type: 'collection',
        register: 'catalog',
        schema: 'category',
        labelField: 'name',
        valueField: 'id',
      },
    },
  };
```

### **2. Form with Pre-selected Values**

```javascript
// Usage
<ConGenericFormModal
  type='orders'
  preSelected={{
    customerId: selectedCustomer.id,
    status: 'pending',
  }}
  // ... other props
/>
```

### **3. Master-Detail Relationship**

```javascript
case 'order-items':
  return {
    ...baseConfig,
    // Initial data automatically generated from schema
    // Override specific defaults only when needed
    initialData: {
      quantity: 1, // Custom default (if schema doesn't specify this)
    },
    optionsProviders: {
      productId: {
        type: 'collection',
        register: 'catalog',
        schema: 'product',
        filter: (item) => item.active === true,
        labelField: (item) => `${item.name} - €${item.price}`,
        valueField: 'id',
      },
    },
    fieldConfigs: {
      orderId: { visible: false }, // Hidden, set via preSelected
    },
  };
```

### **4. Multi-step Dependencies**

```javascript
case 'vehicle-registration':
  return {
    ...baseConfig,
    initialData: {
      brand: '',
      model: '',
      variant: '',
    },
    optionsProviders: {
      brand: {
        type: 'collection',
        register: 'vehicles',
        schema: 'brand',
        labelField: 'name',
        valueField: 'id',
      },
      model: { type: 'dynamic', dependsOn: 'brand' },
      variant: { type: 'dynamic', dependsOn: 'model' },
    },
    additionalEffects: [
      {
        dependencies: ['brand'],
        effect: async (formData, { objectStore, setOptions, setOptionsLoading }) => {
          if (!formData.brand) {
            setOptions('model', []);
            setOptions('variant', []); // Clear dependent field too
            return;
          }

          setOptionsLoading('model', true);
          try {
            await objectStore.fetchCollection('vehicles', 'model', {
              brand: formData.brand
            });

            const modelType = objectStore.getTypeFromRegisterAndSchema('vehicles', 'model');
            const modelCollection = objectStore.getCollection(modelType);
            const results = modelCollection.results || [];

            setOptions('model', results.map(item => ({
              label: item.name,
              value: item.id,
            })));
          } finally {
            setOptionsLoading('model', false);
          }
        }
      },
      {
        dependencies: ['model'],
        effect: async (formData, { objectStore, setOptions, setOptionsLoading }) => {
          if (!formData.model) {
            setOptions('variant', []);
            return;
          }

          setOptionsLoading('variant', true);
          try {
            await objectStore.fetchCollection('vehicles', 'variant', {
              model: formData.model
            });

            const variantType = objectStore.getTypeFromRegisterAndSchema('vehicles', 'variant');
            const variantCollection = objectStore.getCollection(variantType);
            const results = variantCollection.results || [];

            setOptions('variant', results.map(item => ({
              label: `${item.name} (${item.engine})`,
              value: item.id,
            })));
          } finally {
            setOptionsLoading('variant', false);
          }
        }
      }
    ],
  };
```

## 🎭 **Advanced Use Cases**

### **1. Conditional Field Groups**

```javascript
fieldConfigs: {
  // Personal details - only for individual customers
  firstName: {
    visible: (formData) => formData.customerType === 'individual'
  },
  lastName: {
    visible: (formData) => formData.customerType === 'individual'
  },
  dateOfBirth: {
    visible: (formData) => formData.customerType === 'individual'
  },

  // Company details - only for business customers
  companyName: {
    visible: (formData) => formData.customerType === 'business'
  },
  kvkNumber: {
    visible: (formData) => formData.customerType === 'business'
  },
  vatNumber: {
    visible: (formData) => formData.customerType === 'business'
  },
}
```

### **2. Complex Data Filtering**

```javascript
optionsProviders: {
  availableSlots: {
    type: 'collection',
    register: 'appointments',
    schema: 'slot',
    filter: (slot, formData) => {
      // Only show slots that are:
      // 1. Available
      // 2. On the selected date
      // 3. For the selected service type
      // 4. Match duration requirements

      if (!slot.available) return false;

      if (formData.appointmentDate) {
        const slotDate = new Date(slot.datetime).toDateString();
        const selectedDate = new Date(formData.appointmentDate).toDateString();
        if (slotDate !== selectedDate) return false;
      }

      if (formData.serviceType) {
        if (!slot.allowedServices.includes(formData.serviceType)) return false;
      }

      if (formData.duration) {
        if (slot.duration < formData.duration) return false;
      }

      return true;
    },
    labelField: (slot) => {
      const time = new Date(slot.datetime).toLocaleTimeString();
      return `${time} (${slot.duration} min)`;
    },
    valueField: 'id',
  },
}
```

### **3. Custom Validation**

```javascript
customValidation: (formData) => {
  const errors = {};

  // Custom business rule: end date must be after start date
  if (formData.startDate && formData.endDate) {
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
  }

  // Custom business rule: budget must be within project limits
  if (formData.budget && formData.projectType) {
    const maxBudget = {
      small: 10000,
      medium: 50000,
      large: 200000,
    };

    if (formData.budget > maxBudget[formData.projectType]) {
      errors.budget = `Budget cannot exceed €${
        maxBudget[formData.projectType]
      } for ${formData.projectType} projects`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

### **4. Complex Data Transformation**

```javascript
transformSubmitData: (data) => {
  return {
    // Basic field mapping
    naam: data.name,
    beschrijving: data.description,

    // Array handling
    tags: Array.isArray(data.tags)
      ? data.tags
      : data.tags.split(',').map((t) => t.trim()),

    // Date formatting
    geboortedatum: data.birthDate ? new Date(data.birthDate).toISOString() : null,

    // Nested object construction
    adres: {
      straat: data.street,
      huisnummer: data.houseNumber,
      postcode: data.zipCode,
      plaats: data.city,
      land: data.country || 'NL',
    },

    // Conditional fields
    ...(data.customerType === 'business' && {
      bedrijfsgegevens: {
        kvkNummer: data.kvkNumber,
        btwNummer: data.vatNumber,
        rechtsvorm: data.legalForm,
      },
    }),

    // Computed fields
    volledigeNaam:
      data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`.trim()
        : data.companyName,

    // Status tracking
    laatsteWijziging: new Date().toISOString(),
    gewijzigdDoor: 'current-user-id', // You'd get this from auth context
  };
};
```

## 🐛 **Troubleshooting**

### **Common Issues**

**1. Dropdown is empty**

- Check if the API endpoint exists and returns data
- Verify `register` and `schema` values match your API
- Check browser network tab for failed requests
- Ensure `labelField` and `valueField` exist on returned objects

**2. Field mappings not working**

- Verify field names in `fieldMappings` match schema exactly
- Check if `transformSubmitData` is correctly mapping fields back
- Use browser dev tools to inspect form data vs submitted data

**3. Fields not showing/hiding correctly**

- Test field visibility functions with sample data
- Check if conditions are too strict or have typos
- Verify `formData` contains expected values

**4. Dynamic options not updating**

- Ensure dependency field names match exactly
- Check if `additionalEffects` dependencies array is correct
- Verify API endpoints in dynamic effects exist and work

**5. Form validation failing**

- Check if required fields are properly configured in schema
- Verify custom validation logic doesn't have errors
- Ensure all required options providers are loading successfully

### **Debugging Tips**

**1. Enable debug logging**:

```javascript
// In your form config
additionalEffects: [
  {
    dependencies: ['fieldName'],
    effect: async (formData, { objectStore, setOptions, setOptionsLoading }) => {
      console.log('Effect triggered with:', formData);
      console.log('Object store available:', !!objectStore);
      console.log(
        'Object store methods:',
        Object.getOwnPropertyNames(Object.getPrototypeOf(objectStore))
      );
      // ... your effect logic
    },
  },
];
```

**2. Inspect form state**:

```javascript
// Add temporary effect to log all form changes
{
  dependencies: ['*'], // React to any change
  effect: (formData) => {
    console.log('Current form data:', formData);
  }
}
```

**3. Test option providers in isolation**:

```javascript
// Test your option provider configuration
const testConfig = FormModalConfigFactory.createConfig('your-type');
console.log('Options providers:', testConfig.optionsProviders);
```

## 📝 **Best Practices**

### **Configuration Organization**

1. **Keep related options together**:

```javascript
// Good: group related fields
optionsProviders: {
  // Address-related options
  country: { type: 'collection', /* ... */ },
  province: { type: 'dynamic', dependsOn: 'country' },
  city: { type: 'dynamic', dependsOn: 'province' },

  // Product-related options
  category: { type: 'collection', /* ... */ },
  subcategory: { type: 'dynamic', dependsOn: 'category' },
}
```

2. **Use descriptive field names**:

```javascript
// Good
initialData: {
  customerFirstName: '',
  customerLastName: '',
  deliveryAddress: '',
}

// Avoid
initialData: {
  fn: '',
  ln: '',
  addr: '',
}
```

3. **Handle edge cases**:

```javascript
// Always handle missing data gracefully
labelField: (item) => {
  return item.name || item.title || item.id || 'Unknown';
},

filter: (item, formData) => {
  // Handle null/undefined safely
  return item?.status === 'active' &&
         formData?.userLevel >= (item?.requiredLevel || 0);
}
```

### **Performance Optimization**

1. **Limit API calls**:

```javascript
// Use pagination for large datasets
params: {
  _limit: 100,
  _sort: 'name',
}
```

2. **Cache frequently used options**:

```javascript
// For static reference data, consider caching
// (This would require extending the system)
```

3. **Debounce dependent effects**:

```javascript
// For expensive operations, consider debouncing
// (This would require extending the additionalEffects system)
```

## 🎓 **Summary**

The Generic Form Modal System provides a powerful, flexible way to create forms that:

- **Just work** - Automatically handle common patterns and generate initial data from schemas
- **Scale easily** - Add new forms with minimal code (often just option providers)
- **Stay consistent** - Same UX across all forms with schema-driven defaults
- **Self-maintaining** - Initial data stays in sync with API schema changes
- **Handle complexity** - Support advanced use cases when needed
- **Integrate seamlessly** - Work with existing object store and API patterns

**Key Benefits of Schema-based Initial Data:**

- ✅ **No manual maintenance** - Initial data automatically updates with schema changes
- ✅ **Type safety** - Proper defaults based on actual field types
- ✅ **Uses schema defaults** - Respects default values defined in your API schema
- ✅ **Selective overrides** - Only specify custom defaults when truly needed

**Key Benefits of Removing Field Mappings:**

- ✅ **Simplified codebase** - No complex field name mapping logic
- ✅ **Fewer bugs** - Eliminates mapping errors and inconsistencies
- ✅ **Better maintainability** - API field names used consistently throughout
- ✅ **Easier debugging** - Form data matches API data exactly
- ✅ **Less configuration** - No need to maintain field mapping dictionaries

**Key Benefits of Using Object Store Instead of Nextcloud Hook:**

- ✅ **Centralized API management** - All API calls go through the object store
- ✅ **Automatic caching** - Object store handles caching and state management
- ✅ **Better error handling** - Consistent error handling across the application
- ✅ **Simplified dependencies** - No need to import additional hooks
- ✅ **Type safety** - Object store methods provide better type checking

The key is starting simple and adding complexity only when needed. Most forms now require only `optionsProviders` configuration!
