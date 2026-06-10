# Generic Beheer Publish/Depublish Modal

A reusable modal component to publish or depublish one or multiple objects, using `@self` metadata for display and the ObjectStore for actions.

## Usage

```jsx
import ConGenericBeheerPublishDepublishModal from '@views/ac-beheer/core/modals/ac-generic-beheer-publish-depublish-modal/ac-generic-beheer-publish-depublish-modal';

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);
  const [objects, setObjects] = useState([]);

  return (
    <>
      <ConGenericBeheerPublishDepublishModal
        objects={objects}
        publish={true}
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => console.log('Published/Depublished successfully')}
      />
    </>
  );
};
```

## Props

- `objects` (array): Array of objects with `@self` metadata
- `publish` (boolean): If `true`, publish; if `false`, depublish
- `showModal` (boolean): Controls modal visibility
- `onClose` (function): Called when modal is closed
- `onSuccess` (function): Called when operation has at least one success

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

- **Generic**: Works with any object type that has proper metadata
- **Multiple object support**: Can handle single or multiple objects
- **Clear UX**: Displays name(s) based on `@self` metadata
- **Store integration**: Uses `object.massPublishObjects` and `object.massDepublishObjects`
