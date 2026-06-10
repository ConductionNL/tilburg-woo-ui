# Template Variables System

The template variables system allows you to dynamically insert user data and other contextual information into menu titles, page content, and other text elements using a simple `{{ variable }}` syntax.

## 🚀 **Quick Start**

### Basic Usage
```javascript
// In menu titles (automatically processed)
"Welcome {{ user.displayName }}!"

// In page content (automatically processed in rich text)
"Hello {{ user.displayName }}, you have {{ user.organisations.total }} organizations."

// In React components
import { ConTemplateText } from '@components';

<ConTemplateText text="Welcome {{ user.displayName }}!" />
```

## 📋 **Available Variables**

### User Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{ user.displayName }}` | User's display name | "John Doe" |
| `{{ user.email }}` | User's email address | "john@example.com" |
| `{{ user.phone }}` | User's phone number | "+31 6 12345678" |
| `{{ user.fullName }}` | User's full name | "John Doe" |
| `{{ user.firstName }}` | User's first name | "John" |
| `{{ user.lastName }}` | User's last name | "Doe" |
| `{{ user.initials }}` | User's initials | "J.D." |

### Authentication Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{ user.isAuthenticated }}` | Authentication status | "true" or "false" |
| `{{ user.isAdmin }}` | Admin status | "true" or "false" |
| `{{ user.groups }}` | User groups (array) | "admin,editor" |

### Organization Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{ user.organisations.active.name }}` | Active organization name | "Municipality of Tilburg" |
| `{{ user.organisations.active.id }}` | Active organization ID | "123" |
| `{{ user.organisations.total }}` | Total organizations | "3" |
| `{{ user.organisations.all.0.name }}` | First organization name | "Organization A" |

### System Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{ system.currentDate }}` | Current date (Dutch format) | "16-8-2024" |
| `{{ system.currentTime }}` | Current time (Dutch format) | "14:30:25" |
| `{{ system.currentYear }}` | Current year | "2024" |

## 🎯 **Implementation Details**

### Automatic Processing Locations

Template variables are automatically processed in:

1. **Menu Titles** - All menu items and menu names
2. **Rich Text Content** - All `AcRichText` components
3. **Page Content** - Through the sections handler

### Manual Processing

For custom components, use these utilities:

#### ConTemplateText Component
```javascript
import { ConTemplateText } from '@components';

// Simple text
<ConTemplateText text="Welcome {{ user.displayName }}!" />

// As different HTML tag
<ConTemplateText 
  text="Welcome {{ user.displayName }}!" 
  tag="h1"
  className="welcome-title"
/>

// With HTML content
<ConTemplateText 
  text="<strong>Hello {{ user.displayName }}</strong>" 
  renderAsHtml 
/>
```

#### processUserTemplate Function
```javascript
import { processUserTemplate } from '@utilities';

const MyComponent = ({ store: { user } }) => {
  const processedText = processUserTemplate("Welcome {{ user.displayName }}!", user);
  
  return <div>{processedText}</div>;
};
```

#### Higher-Order Component
```javascript
import { withTemplateProcessing } from '@utilities';
import { Heading } from '@utrecht/component-library-react';

const TemplateHeading = withTemplateProcessing(Heading, ['children']);

<TemplateHeading>Welcome {{ user.displayName }}!</TemplateHeading>
```

## 💡 **Examples**

### Menu Examples

In your CMS, create menu items with these titles:

```json
{
  "name": "Welcome {{ user.displayName }}",
  "link": "/dashboard"
}
```

```json
{
  "name": "{{ user.organisations.active.name }} Dashboard",
  "link": "/beheer"
}
```

### Page Content Examples

```html
<h1>Welcome back, {{ user.displayName }}!</h1>
<p>You are logged in as {{ user.email }} and have access to {{ user.organisations.total }} organizations.</p>

<div class="user-info">
  <h2>Your Organizations</h2>
  <p>Active: {{ user.organisations.active.name }}</p>
  <p>Total: {{ user.organisations.total }}</p>
</div>
```

### Conditional Content

```html
<div>
  {{#if user.isAdmin}}
    <p>You have administrator privileges.</p>
  {{/if}}
  
  <p>Current date: {{ system.currentDate }}</p>
</div>
```

### Complex Organization Access

```html
<h1>{{ user.organisations.active.name }} Portal</h1>
<p>Welcome {{ user.displayName }} to your organization dashboard.</p>

<!-- Access specific organization by index -->
<p>First organization: {{ user.organisations.all.0.name }}</p>
<p>Second organization: {{ user.organisations.all.1.name }}</p>
```

## ⚙️ **Advanced Usage**

### Custom Context Variables

```javascript
import { TemplateProcessor } from '@utilities';

const processor = new TemplateProcessor({
  user: userStore,
  custom: {
    siteName: "My Portal",
    version: "1.0.0"
  }
});

const result = processor.process("Welcome to {{ custom.siteName }} v{{ custom.version }}");
```

### Performance Optimization

The template processor includes caching for better performance:

```javascript
// Results are automatically cached
const processor = new TemplateProcessor(context);
const result1 = processor.process(template); // Processed
const result2 = processor.process(template); // From cache

// Clear cache when context changes
processor.updateContext(newUserData);
```

### Template Detection

```javascript
import { TemplateProcessor } from '@utilities';

// Check if text contains templates
if (TemplateProcessor.hasTemplateVariables(text)) {
  // Process only if needed
  const processed = processUserTemplate(text, user);
}

// Extract all variables from text
const variables = TemplateProcessor.extractVariables(
  "Hello {{ user.name }} from {{ user.organization.name }}"
);
// Returns: ["user.name", "user.organization.name"]
```

## 🔧 **Integration Guide**

### Adding to New Components

1. **For simple text processing:**
   ```javascript
   import { processUserTemplate } from '@utilities';
   
   const processedText = processUserTemplate(originalText, user);
   ```

2. **For React components:**
   ```javascript
   import { ConTemplateText } from '@components';
   
   <ConTemplateText text={dynamicText} />
   ```

3. **For existing components:**
   ```javascript
   import { withTemplateProcessing } from '@utilities';
   
   const EnhancedComponent = withTemplateProcessing(OriginalComponent, ['title', 'description']);
   ```

### Backend Integration

In your CMS, you can now use template variables in:

- Menu item names
- Page titles
- Page content (rich text fields)
- Form labels and descriptions
- Any text field that gets rendered in the frontend

## 🚨 **Important Notes**

1. **Security**: All HTML content is sanitized before rendering
2. **Performance**: Results are cached for better performance
3. **Fallbacks**: Missing variables are left as-is (e.g., `{{ missing.var }}`)
4. **Case Sensitive**: Variable names are case-sensitive
5. **Reactive**: Templates are re-processed when user data changes

## 🐛 **Troubleshooting**

### Common Issues

1. **Variable not found**: Check the exact variable path and spelling
2. **Not updating**: Ensure the component is wrapped with `observer` from MobX
3. **HTML not rendering**: Use `renderAsHtml` prop or `AcRichText` component
4. **Performance issues**: Check if caching is working properly

### Debug Mode

```javascript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Available user data:', user);
  console.log('Template variables found:', TemplateProcessor.extractVariables(text));
}
```

---

This template system provides a powerful way to personalize your application's content while maintaining security and performance. The system is designed to be extensible, so you can easily add new variable types and processing logic as needed.
