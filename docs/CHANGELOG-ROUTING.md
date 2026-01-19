# Routing System Changelog

## [Latest] - 2025-01-19

### ✨ Added
- **New Forms Namespace**: Introduced '/forms' namespace for organized form routing
- **Multiple Form Types**: Added support for specialized form types:
  - '/forms/register' - Organization registration (duplicate of '/register')
  - '/forms/gebruik' - Usage registration form
  - '/forms/product' - Product catalog registration form  
  - '/forms/koppeling' - System integration registration form

### 🔧 Changed
- **API Endpoints**: Each form type now posts to dedicated endpoints:
  - Register: '/openregister/api/objects/vng-gemma/register'
  - Gebruik: '/openregister/api/objects/vng-gemma/gebruik' 
  - Product: '/openregister/api/objects/vng-gemma/product'
  - Koppeling: '/openregister/api/objects/vng-gemma/koppeling'

### 📁 File Structure
- **New Components**:
  - 'src/views/ac-forms/ac-forms-gebruik/ac-forms-gebruik.js'
  - 'src/views/ac-forms/ac-forms-product/ac-forms-product.js'
  - 'src/views/ac-forms/ac-forms-koppeling/ac-forms-koppeling.js'
  - 'src/views/ac-forms/index.js'

- **Updated Files**:
  - 'src/constants/routes.constants.js' - Added new route definitions
  - 'src/views/index.js' - Added new component exports

### 🎯 Technical Details
- **Route Configuration**: All routes follow the established pattern in PATHS and ROUTES objects
- **Component Architecture**: New form components follow the same structure as AcRegister
- **Code Splitting**: All new components use loadable() for optimal performance
- **Backward Compatibility**: Original '/register' route maintained for existing integrations

### 📋 Form Component Features
Each new form component includes:
- **Multi-step Process**: Step-by-step form completion with ProcessSteps component
- **Validation**: Comprehensive form validation (email, phone, website, required fields)
- **Error Handling**: Structured error display with field-specific messages
- **Loading States**: Proper loading indicators during submission
- **Success States**: Confirmation pages after successful submission
- **Logo Upload**: File upload functionality with type validation
- **Responsive Design**: Mobile-friendly form layouts

### 🔄 Migration Guide
For developers working with the routing system:

1. **Import New Components**: 
   ```javascript
   import { AcFormsGebruik, AcFormsProduct, AcFormsKoppeling, ConFormsDienst } from '@views';
   ```

2. **Route Navigation**:
   ```javascript
   // Navigate to new form routes
   navigate('/forms/gebruik');     // Usage form
   navigate('/forms/product');     // Product form  
   navigate('/forms/koppeling');   // Integration form
   ```

3. **API Integration**:
   - Each form posts to its dedicated endpoint
   - Maintain same data structure as register form
   - Handle responses consistently across all forms

### 🛠 Development Notes
- **Naming Convention**: Form components use 'AcForms{Type}' pattern
- **Directory Structure**: All forms organized under 'src/views/ac-forms/'
- **Shared Logic**: Common validation and form handling logic across components
- **Loadable Integration**: All components properly integrated with @loadable/component

### 🔍 Testing
To test the new routes:
1. Start the development server: 'yarn dev:web'
2. Navigate to the following URLs:
   - http://localhost:[port]/forms/register
   - http://localhost:[port]/forms/gebruik  
   - http://localhost:[port]/forms/product
   - http://localhost:[port]/forms/koppeling
3. Verify form functionality and API endpoint connections

### 🎯 Benefits
- **Organized Routing**: Clear namespace separation for different form types
- **Specialized Processing**: Each form type can have unique backend processing
- **Maintainability**: Easier to manage and extend different form types
- **User Experience**: Clear URL structure for different registration flows
- **API Flexibility**: Dedicated endpoints allow for specialized validation and processing

### 📚 Related Documentation
- [ROUTING-SYSTEM.md](ROUTING-SYSTEM.md) - Complete routing system documentation  
- [MENU-SYSTEM.md](MENU-SYSTEM.md) - Menu integration details
- Component READMEs in 'src/views/ac-beheer/' for related form patterns

---

## Previous Changes

### Historical Note
This is the first major routing system update. Previous routing was handled through individual route definitions without the organized forms namespace structure.
