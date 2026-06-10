import React from 'react';
import { Link } from '@utrecht/component-library-react/dist/css-module';

/**
 * Renders an array of related objects as comma-separated clickable links
 * 
 * @param {Array} objects - Array of extended objects with @self properties
 * @returns {JSX.Element} Comma-separated list of clickable object names
 * 
 * @example
 * const relatedObjects = [
 *   { '@self': { name: 'Module A', schema: 'voorzieningmodule', id: '123' } },
 *   { '@self': { name: 'Module B', schema: 'voorzieningmodule', id: '456' } }
 * ];
 * 
 * <ConRelatedObjectsLinks objects={relatedObjects} />
 * // Renders: <Link to="/beheer/voorzieningmodule/123">Module A</Link>, <Link to="/beheer/voorzieningmodule/456">Module B</Link>
 */
const ConRelatedObjectsLinks = ({ objects = [] }) => {
  if (!Array.isArray(objects) || objects.length === 0) {
    return <span>-</span>;
  }

  // Filter out objects that don't have the required @self properties
  const validObjects = objects.filter(obj => 
    obj && 
    obj['@self'] && 
    obj['@self'].name && 
    obj['@self'].schema && 
    obj['@self'].id
  );

  if (validObjects.length === 0) {
    return <span>-</span>;
  }

  return (
    <span className="con-related-objects-links">
      {validObjects.map((obj, index) => {
        const { name, schema, id } = obj['@self'];
        const href = `/beheer/${schema}/${id}`;
        
        return (
          <React.Fragment key={`${schema}-${id}`}>
            <Link href={href} className="con-related-objects-links__link">
              {name}
            </Link>
            {index < validObjects.length - 1 && ', '}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default ConRelatedObjectsLinks;
