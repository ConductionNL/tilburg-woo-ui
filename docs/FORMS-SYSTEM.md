# Forms System Documentation

## Overview

The Tilburg WOO UI application features a comprehensive forms system that allows users to register different types of entities through dedicated form interfaces. Each form type has its own API endpoint and specialized processing workflow.

## Form Types

### 1. Organization Registration (/forms/register)

**Purpose**: Register new organizations in the system  
**Component**: `AcRegister` (shared with legacy /register route)  
**API Endpoint**: `/openregister/api/objects/vng-gemma/register`

**Form Fields**:
- Organization name, website, links
- Contact person details (name, email, phone, function)
- Organization type (Leverancier, Gemeente, Samenwerking, Community)
- Logo upload, OIN, CBS, KvK number
- Description and summary

### 2. Usage Registration (/forms/gebruik)

**Purpose**: Register usage of products/services  
**Component**: `AcFormsGebruik`  
**API Endpoint**: `/openregister/api/objects/vng-gemma/gebruik`

**Specialized for**: Tracking how organizations use specific products or services in the catalog.

### 3. Product Registration (/forms/product)

**Purpose**: Register new products in the catalog  
**Component**: `AcFormsProduct`  
**API Endpoint**: `/openregister/api/objects/vng-gemma/product`

**Specialized for**: Adding new software products, services, or solutions to the catalog.

### 4. Integration Registration (/forms/koppeling)

**Purpose**: Register system integrations/connections  
**Component**: `AcFormsKoppeling`  
**API Endpoint**: `/openregister/api/objects/vng-gemma/koppeling`

**Specialized for**: Documenting technical integrations between systems.

## Form Architecture

### Common Structure

All forms follow the same architectural pattern for consistency:

```javascript
const FormComponent = () => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [organization, setOrganization] = useState({...});
  
  // Form Steps
  const [confirmationCheckbox, setConfirmationCheckbox] = useState({
    privacy: false,
    terms: false,
  });

  // Validation Functions
  const validateWebsite = useCallback((website) => {...});
  const validatePhone = useCallback((phone) => {...});

  // Submission Handler
  const handleRegister = async () => {
    // POST to form-specific endpoint
    const response = await fetch(`${BASE_URL}/openregister/api/objects/vng-gemma/{type}`);
  };

  // Multi-step UI with ProcessSteps component
  return (
    <ProcessSteps steps={[...]} />
    // Form content based on currentStep
  );
};
```

### Step-by-Step Process

Each form implements a 3-step process:

1. **Step 1: Basic Information**
   - Core entity details
   - Contact information
   - Required field validation

2. **Step 2: Detailed Description**
   - Extended description/summary
   - Additional context fields
   - Optional supplementary information

3. **Step 3: Confirmation**
   - Privacy policy acceptance
   - Terms and conditions agreement
   - Final submission

### Validation System

#### Field Validation Rules

**Email Validation**:
```javascript
const validateEmail = (email) => {
  return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
};
```

**Phone Validation** (using libphonenumber-js):
```javascript
const validatePhone = (phone) => {
  const trimmed = phone.replace(/\s+/g, '');
  if (trimmed.startsWith('+')) {
    return isValidPhoneNumber(trimmed);
  }
  if (trimmed.startsWith('06')) {
    return isValidPhoneNumber(trimmed, 'NL');
  }
  return false;
};
```

**Website Validation**:
```javascript
const validateWebsite = (website) => {
  const urlPattern = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?$/;
  return urlPattern.test(website);
};
```

#### Form State Validation

Each step has specific validation requirements:
```javascript
const isFormValid = useMemo(() => {
  const isStep1Valid = organization.name.trim() && 
                      organization.contactPersons[0].firstName.trim() &&
                      validateEmail(organization.contactPersons[0].email) &&
                      validateWebsite(organization.website) &&
                      validatePhone(organization.contactPersons[0].phone);
  
  const isStep2Valid = organization.summary.trim();
  const isStep3Valid = confirmationCheckbox.privacy && confirmationCheckbox.terms;

  switch (currentStep) {
    case 0: return isStep1Valid;
    case 1: return isStep2Valid;
    case 2: return isStep3Valid;
    default: return false;
  }
}, [organization, currentStep, confirmationCheckbox]);
```

## UI Components

### ProcessSteps Integration

All forms use the `@gemeente-denhaag/components-react` ProcessSteps component:

```javascript
<ProcessSteps
  steps={[
    { status: currentStep >= 0 ? 'current' : 'incomplete', title: 'Step Title 1' },
    { status: currentStep >= 1 ? 'current' : 'incomplete', title: 'Step Title 2' },
    { status: currentStep >= 2 ? 'current' : 'incomplete', title: 'Step Title 3' },
  ]}
/>
```

### Form Navigation

Consistent navigation pattern across all forms:
```javascript
<div className="ac-register-form-actions">
  {currentStep > 0 && (
    <AcButton style="secondary" onClick={() => setCurrentStep(currentStep - 1)}>
      Vorige
    </AcButton>
  )}
  
  {currentStep < 2 ? (
    <AcButton 
      style="primary" 
      onClick={() => setCurrentStep(currentStep + 1)}
      disabled={!isFormValid || loading}
    >
      Volgende
    </AcButton>
  ) : (
    <AcButton 
      style="primary" 
      onClick={handleRegister}
      disabled={!isFormValid || loading}
    >
      {loading ? 'Bezig met verzenden...' : 'Form Type Aanmelden'}
    </AcButton>
  )}
</div>
```

### Error Handling

Structured error display with field-specific messages:
```javascript
{registerCallBack === 'error' && error.message && (
  <Alert type="error">
    <Paragraph>{error.message}</Paragraph>
    {error.errors && (
      <UnorderedList>
        {Object.entries(error.errors).map(([field, messages]) => (
          <UnorderedListItem key={field}>
            <strong>{field}:</strong> {Array.isArray(messages) ? messages.join(', ') : messages}
          </UnorderedListItem>
        ))}
      </UnorderedList>
    )}
  </Alert>
)}
```

### Success States

Confirmation pages after successful submission:
```javascript
if (registerCallBack === 'success') {
  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap="lg">
          <Heading1>{Form Type} Aanmelding Gelukt!</Heading1>
          <Alert type="ok">
            <Paragraph>
              Uw {form type} aanmelding is succesvol ingediend. 
              U ontvangt binnenkort een bevestiging via e-mail.
            </Paragraph>
          </Alert>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
}
```

## File Upload System

### Logo Upload

Forms support logo file uploads with validation:

```javascript
const acceptedLogoFileTypes = [
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'image/webp',
  'image/svg+xml',
];

const handleLogoFileSelect = useCallback((selectedFile) => {
  if (!selectedFile || !acceptedLogoFileTypes.includes(selectedFile.type)) {
    return;
  }
  
  setLogoFile(selectedFile);
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const logoDataUrl = event.target.result;
    setLogoDataUrl(logoDataUrl);
    setOrganization((prev) => ({
      ...prev,
      logo: logoDataUrl,
    }));
  };
  
  reader.readAsDataURL(selectedFile);
}, [acceptedLogoFileTypes]);
```

## API Integration

### Data Transformation

Before sending to API, form data is transformed:

```javascript
const organizationData = {
  naam: organization.name,
  website: organization.website,
  links: organization.links,
  oin: organization.oin,
  cbs: organization.cbs,
  telefoonnummer: organization.phone,
  rol: organization.role,
  beschrijvingKort: organization.summary,
  logo: logoDataUrl,
  contactpersonen: [
    {
      voornaam: organization.contactPersons[0].firstName,
      tussenvoegsel: organization.contactPersons[0].middleName,
      achternaam: organization.contactPersons[0].lastName,
      telefoonnummer: organization.contactPersons[0].phone,
      'e-mailadres': organization.contactPersons[0].email,
      functie: organization.contactPersons[0].function,
    },
  ],
  type: organization.organizationType,
  kvkNummer: organization.kvkNumber,
  'e-mailadres': organization.email,
};
```

### Response Handling

Consistent response processing:
```javascript
if (response.ok) {
  const data = await response.json();
  
  if (data.status === 'error') {
    setRegisterCallBack('error');
    setError({ message: data.message, errors: data.errors });
  } else {
    setRegisterCallBack('success');
  }
} else {
  setRegisterCallBack('error');
  setError({
    message: 'Er is een fout opgetreden bij het registreren.',
    errors: null,
  });
}
```

## Styling

### SCSS Structure

Forms use consistent styling classes:
```scss
.ac-register-form-content {
  // Main form content area
}

.ac-register-form-actions {
  // Navigation buttons area
}

.ac-register-review {
  // Review/summary sections
}
```

### Dynamic Form Layout System

The application features a flexible form layout system that automatically arranges form fields in responsive grids:

#### Layout Classes

**Container Classes**:
```scss
.con-dynamic-form-container {
  display: flex !important;
  flex-direction: column !important;
  gap: 1.5rem !important;
}

.con-form-fields-container {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 1rem !important;
}
```

**Field Wrapper Classes**:
```scss
.con-form-field-wrapper {
  flex-basis: calc(50% - 0.5rem) !important;
  min-width: 0 !important;
}
```

**Field Size Classes**:
```scss
.field-size-half {
  // Takes 50% width on desktop, 100% on mobile
  flex-basis: calc(50% - 0.5rem) !important;
}

.field-size-full {
  // Takes 100% width on all screen sizes
  flex-basis: 100% !important;
}

.field-height-double {
  // Double height for textarea/markdown fields
  min-height: 200px !important;
}
```

#### Automatic Field Sizing

The form system automatically determines field sizes based on field type and format:

```javascript
const getFieldSizeClass = (path, propertySchema, fieldConfig) => {
  // User-defined size overrides
  if (fieldConfig.size === 'full') return 'field-size-full';
  if (fieldConfig.size === 'half') return 'field-size-half';
  
  // Automatic sizing based on field type
  const format = propertySchema.format;
  const component = fieldConfig.component;
  
  // Markdown fields get full width + double height
  if (component === 'WysiwygMarkdown' || format === 'markdown') {
    return 'field-size-full field-height-double';
  }
  
  // Default: half width, normal height
  return 'field-size-half';
};
```

#### Field Configuration Options

Field configurations can include a `size` property to override automatic sizing:

```javascript
/**
 * @typedef {Object} FieldConfig
 * @property {string} label - Field display label
 * @property {string} component - Component type to render
 * @property {Object} schema - JSON schema for validation
 * @property {'half'|'full'} [size] - Override automatic field sizing
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [disabled] - Whether field is disabled
 */

const fieldConfigs = {
  'description': {
    label: 'Beschrijving',
    component: 'WysiwygMarkdown',
    size: 'full', // Force full width
    schema: { type: 'string', format: 'markdown' }
  },
  'email': {
    label: 'E-mailadres', 
    component: 'AcFormField',
    size: 'half', // Force half width
    schema: { type: 'string', format: 'email' }
  }
};
```

#### Responsive Breakpoints

The layout system includes responsive breakpoints for optimal mobile experience:

```scss
// Tablet breakpoint
@media (max-width: 768px) {
  .field-size-half {
    flex-basis: 100% !important;
  }
}

// Mobile breakpoint  
@media (max-width: 480px) {
  .con-form-fields-container {
    gap: 0.75rem !important;
  }
  
  .field-height-double {
    min-height: 150px !important;
  }
}
```

#### Multi-Select Field Optimization

Special handling for ReactSelect components to ensure consistent height:

```scss
.ac-beheer-select {
  .react-select__control {
    min-height: 40px !important;
  }
  
  .react-select__control--is-multi {
    max-height: 120px !important;
    overflow-y: auto !important;
  }
  
  .react-select__multi-value {
    margin: 2px !important;
  }
}
```

#### WYSIWYG Markdown Editor

The form system supports user-friendly WYSIWYG markdown editing:

```javascript
// Field configuration for markdown
if (format === 'markdown' || format === 'html') {
  schemaConfig = {
    ...baseConfig,
    type: 'text',
    component: 'WysiwygMarkdown', // Uses @uiw/react-md-editor
    isMarkdown: format === 'markdown',
  };
}
```

The markdown editor includes:
- Live preview capabilities
- Toolbar with common formatting options
- Full-width, double-height sizing
- Light theme integration

### Component Integration

Forms integrate with the established design system:
- NLDS design tokens for colors and spacing
- Utrecht component library for form elements
- Atomic design pattern for component structure
- Responsive design for mobile compatibility
- Flexible form layout system for optimal field arrangement

## Development Guidelines

### Adding New Form Types

To add a new form type:

1. **Create Component**:
   ```javascript
   // src/views/ac-forms/ac-forms-{type}/ac-forms-{type}.js
   const AcForms{Type} = () => {
     // Follow established pattern
   };
   ```

2. **Add Route**:
   ```javascript
   // src/constants/routes.constants.js
   FORMS_{TYPE}: '/forms/{type}',
   ```

3. **Configure API**:
   ```javascript
   // Change endpoint in handleRegister
   `${BASE_URL}/openregister/api/objects/vng-gemma/{type}`
   ```

4. **Export Component**:
   ```javascript
   // src/views/index.js
   export { default as AcForms{Type} } from './ac-forms/ac-forms-{type}/ac-forms-{type}';
   ```

### Best Practices

1. **Consistency**: Follow the established pattern for all form components
2. **Validation**: Implement proper client-side validation for all fields
3. **Error Handling**: Provide clear, actionable error messages
4. **Accessibility**: Ensure forms are accessible with proper ARIA labels
5. **Performance**: Use debouncing for real-time validation
6. **Mobile**: Test forms on mobile devices for responsive behavior

### Testing

Form testing checklist:
- [ ] All validation rules work correctly
- [ ] Error messages are clear and helpful
- [ ] Success states display properly
- [ ] File upload works with proper validation
- [ ] API integration functions correctly
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

## API Endpoints Reference

| Form Type | URL | Endpoint | Purpose |
|-----------|-----|----------|---------|
| Register | /forms/register | /openregister/api/objects/vng-gemma/register | Organization registration |
| Gebruik | /forms/gebruik | /openregister/api/objects/vng-gemma/gebruik | Usage registration |
| Product | /forms/product | /openregister/api/objects/vng-gemma/product | Product registration |
| Koppeling | /forms/koppeling | /openregister/api/objects/vng-gemma/koppeling | Integration registration |

## Troubleshooting

### Common Issues

**Form Not Submitting**:
1. Check validation rules are satisfied
2. Verify API endpoint is accessible
3. Check browser console for JavaScript errors
4. Ensure required fields are filled

**Validation Errors**:
1. Check email format is correct
2. Verify phone number format (Dutch numbers)
3. Ensure website URL is valid
4. Check required fields are not empty

**File Upload Issues**:
1. Verify file type is supported
2. Check file size limits
3. Ensure proper file selection handling

**API Integration Problems**:
1. Verify endpoint URLs are correct
2. Check request headers and data format
3. Examine API response structure
4. Test with network debugging tools

### Debug Mode

Enable additional logging by checking the browser console. Each form logs:
- Validation states
- API requests and responses  
- Error conditions
- Form state changes

## Future Enhancements

Potential improvements:
1. **Auto-save**: Save form progress automatically
2. **Multi-language**: Support for multiple languages
3. **Advanced Validation**: Real-time server-side validation
4. **File Management**: Better file upload handling
5. **Form Analytics**: Track completion rates and common errors
6. **Template System**: Reusable form templates for different entity types
