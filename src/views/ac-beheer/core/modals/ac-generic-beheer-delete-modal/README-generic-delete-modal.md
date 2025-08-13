# Generic Beheer Delete Modal

A reusable delete modal component that can handle any object type by extracting metadata from the `@self` property.

## Usage

```jsx
import ConGenericBeheerDeleteModal from '@views/ac-beheer/ac-generic-delete-modal/ac-beheer-delete-modal';

// Example usage
const MyComponent = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [objectsToDelete, setObjectsToDelete] = useState([]);

  const handleDeleteSuccess = () => {
    // Refresh data or navigate away
    console.log('Objects deleted successfully');
  };

  return (
    <>
      {/* Your other components */}

      <ConGenericBeheerDeleteModal
        objects={objectsToDelete}
        showModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};
```

## Props

- `objects` (array): Array of objects with `@self` metadata
- `showModal` (boolean): Controls modal visibility
- `onClose` (function): Called when modal is closed
- `onSuccess` (function): Called when deletion is successful

## Object Structure

Objects must have a `@self` property with the following structure:

```javascript
{
  id: "123",
  "@self": {
    register: { id: "voorzieningen" },
    schema: {
      id: "voorziening",
      title: "Voorziening"
    },
    name: "My Object Name"
  }
}
```

## Features

- **Dynamic endpoint building**: Automatically constructs the API endpoint from object metadata
- **Flexible naming**: Uses schema title or name from metadata for display
- **Multiple object support**: Can delete single or multiple objects
- **Error handling**: Graceful error handling with console logging
- **Generic design**: Works with any object type that has proper metadata
