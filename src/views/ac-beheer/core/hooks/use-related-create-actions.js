// eslint-disable-next-line import/no-unresolved
import { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import { VISUALS } from '@constants';
import { checkOrganizationPermissions } from '@utils/organization-permissions';

/**
 * Hook to build dynamic related-create actions based on schema relations and user groups
 * - Fetches related schemas for the provided schemaRef
 * - Filters by authorization.create intersecting with user's groups
 * - Returns a factory that produces action items for a given context id (row or details id)
 *
 * @param {Object} params
 * @param {Object} params.object - Object store
 * @param {Object} params.user - User store
 * @param {string|Object} params.schemaRef - Schema slug/id whose relations are used
 * @param {string} params.currentType - Current beheer route type (e.g., 'applicaties')
 * @param {(targetType: string, preSelected: Object, metadata?: Object) => void} params.openDynamicCreate - Callback to open dynamic create modal
 * @param {Object} params.currentObject - Current object for organization permission checks (optional)
 * @param {string} params.currentObjectRegister - Register slug of the current object (optional)
 * @param {string} params.currentObjectSchema - Schema slug of the current object (optional)
 */
export const useRelatedCreateActions = ({
  object,
  user,
  schemaRef,
  currentType,
  openDynamicCreate,
  currentObject = null, // Add current object for organization permission checks
  currentObjectRegister = null, // Add current object register information
  currentObjectSchema = null, // Add current object schema information
}) => {
  const [creatableRelated, setCreatableRelated] = useState([]);
  const [outgoingSchemas, setOutgoingSchemas] = useState(new Set());

  useEffect(() => {
    if (!schemaRef) return;

    const prepareRelatedActions = async () => {
      try {
        if (!user?.currentUser) {
          await user?.fetchUserProfile?.();
        }

        await object?.fetchSchemaRelated?.(schemaRef);
        const related = object?.getSchemaRelated?.(schemaRef);

        // Handle both old format (results array) and new format (incoming/outgoing)
        let relatedResults = [];
        const outgoingSlugs = new Set();
        
        if (Array.isArray(related?.results)) {
          // Old format: { results: [...] }
          relatedResults = related.results;
        } else if (related?.incoming || related?.outgoing) {
          // New format: { incoming: [...], outgoing: [...] }
          const incoming = Array.isArray(related.incoming) ? related.incoming : [];
          const outgoing = Array.isArray(related.outgoing) ? related.outgoing : [];
          
          // Track outgoing schema slugs
          outgoing.forEach(schema => {
            if (schema?.slug) outgoingSlugs.add(schema.slug);
          });
          
          relatedResults = [...incoming, ...outgoing];
        }
        
        setOutgoingSchemas(outgoingSlugs);

        const userGroups = Array.isArray(user?.userGroups)
          ? user.userGroups
              .map((g) => (typeof g === 'string' ? g : g?.name))
              .filter(Boolean)
          : [];

        // Check organization permissions for current object (needed for outgoing relationships)
        const { canEdit: canEditCurrentObject } = currentObject 
          ? checkOrganizationPermissions(user, currentObject)
          : { canEdit: true }; // Default to true if no current object provided

        const creatable = relatedResults.filter((rs) => {
          // For outgoing relationships, check if user can edit current object
          if (outgoingSlugs.has(rs?.slug) && !canEditCurrentObject) {
            return false; // Can't create outgoing relationships if can't edit current object
          }

          // If authorization is null or undefined, allow access (no restrictions)
          if (!rs?.authorization) return true;
          
          const createGroups = Array.isArray(rs?.authorization?.create)
            ? rs.authorization.create
            : [];
          
          // If no create groups specified, allow access
          if (createGroups.length === 0) return true;
          
          // Check for public access or user group match
          if (createGroups.includes('public')) return true;
          return createGroups.some((grp) => userGroups.includes(grp));
        });

        // Development debug info for related schemas
        if (process.env.NODE_ENV === 'development' && creatable.length > 0) {
          console.log('🔍 Related schemas:', {
            schemaRef,
            creatableCount: creatable.length
          });
        }
        
        setCreatableRelated(creatable);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to prepare related actions:', e);
        setCreatableRelated([]);
      }
    };

    prepareRelatedActions();
    // Only re-run when schema reference changes or current object changes (for permissions)
  }, [schemaRef, user?.currentUser, object, currentObject]);

  // Schema-driven helper to determine which field in the current object should be updated for outgoing relationships
  const getOutgoingRelationshipField = useCallback((targetType, sourceType) => {
    try {
      // Get the source schema to find properties that reference the target schema
      const sourceSchemaType = object.getSchemaType(sourceType);
      const sourceSchema = sourceSchemaType ? object.getSchema(sourceSchemaType) : null;
      
      if (!sourceSchema?.properties) {
        return null;
      }

      // Look for properties in source schema that reference the target schema
      for (const [fieldName, fieldSchema] of Object.entries(sourceSchema.properties)) {
        if (fieldSchema.$ref) {
          // Extract schema slug from $ref
          const refMatch = fieldSchema.$ref.match(/\/schemas\/([^\/]+)$/);
          const referencedSchemaSlug = refMatch?.[1];
          
          if (referencedSchemaSlug === targetType) {
            console.log(`✅ Found outgoing relationship field: ${fieldName} -> ${targetType}`);
            return fieldName;
          }
        }
        
        // Handle array items that reference the target schema
        if (fieldSchema.type === 'array' && fieldSchema.items?.$ref) {
          const refMatch = fieldSchema.items.$ref.match(/\/schemas\/([^\/]+)$/);
          const referencedSchemaSlug = refMatch?.[1];
          
          if (referencedSchemaSlug === targetType) {
            console.log(`✅ Found outgoing array relationship field: ${fieldName} -> ${targetType}`);
            return fieldName;
          }
        }
      }
    } catch (error) {
      console.error('Error finding outgoing relationship field:', error);
    }
    
    return null;
  }, [object]);

  // Schema-driven approach to build preSelected values with labels
  const buildPreSelected = useCallback(
    async (targetType, ctxId) => {
      const preSelected = {};
      const preSelectedLabels = {};
      
      try {
        // Get the target schema to analyze its properties
        const targetSchemaType = object.getSchemaType(targetType);
        let targetSchema = targetSchemaType ? object.getSchema(targetSchemaType) : null;
        
        // If schema is not loaded, try to fetch it
        if (!targetSchema) {
          console.log(`🔄 Fetching schema for ${targetType}...`);
          await object.fetchSchema(targetType);
          const updatedTargetSchemaType = object.getSchemaType(targetType);
          targetSchema = updatedTargetSchemaType ? object.getSchema(updatedTargetSchemaType) : null;
        }
        
        if (!targetSchema?.properties) {
          console.log('❌ No schema properties found for target type:', targetType);
          return { preSelected, preSelectedLabels };
        }

        // Get current schema slug for reference matching
        const currentSchemaSlug = typeof schemaRef === 'string' ? schemaRef : schemaRef?.slug;
        if (!currentSchemaSlug) {
          console.log('❌ No current schema slug found');
          return { preSelected, preSelectedLabels };
        }

        // Get current object data to extract label/name
        const currentObjectData = currentObject;
        const currentObjectLabel = currentObjectData?.naam || 
                                  currentObjectData?.name || 
                                  currentObjectData?.title || 
                                  currentObjectData?.titel || 
                                  currentObjectData?.['@self']?.name ||
                                  ctxId;

        // Look for properties in target schema that reference our current schema
        Object.entries(targetSchema.properties).forEach(([fieldName, fieldSchema]) => {
          if (fieldSchema.$ref) {
            // Extract schema slug from $ref (e.g., "#/components/schemas/voorziening" -> "voorziening")
            const refMatch = fieldSchema.$ref.match(/\/schemas\/([^\/]+)$/);
            const referencedSchemaSlug = refMatch?.[1];
            
            if (referencedSchemaSlug === currentSchemaSlug) {
              console.log(`✅ Found reference: ${fieldName} -> ${currentSchemaSlug}`);
              preSelected[fieldName] = ctxId;
              preSelectedLabels[fieldName] = currentObjectLabel;
            }
          }
          
          // Handle array items that reference our schema
          if (fieldSchema.type === 'array' && fieldSchema.items?.$ref) {
            const refMatch = fieldSchema.items.$ref.match(/\/schemas\/([^\/]+)$/);
            const referencedSchemaSlug = refMatch?.[1];
            
            if (referencedSchemaSlug === currentSchemaSlug) {
              console.log(`✅ Found array reference: ${fieldName} -> ${currentSchemaSlug}`);
              preSelected[fieldName] = [ctxId]; // Array field gets array value
              preSelectedLabels[fieldName] = [currentObjectLabel]; // Array labels
            }
          }
        });

        // Development debug for preSelected fields
        if (process.env.NODE_ENV === 'development' && Object.keys(preSelected).length > 0) {
          console.log('🎯 Pre-selected fields:', { targetType, fields: Object.keys(preSelected) });
        }

      } catch (error) {
        console.error('Error building schema-driven preSelected:', error);
        // Fallback to empty preSelected on error
      }
      
      return { preSelected, preSelectedLabels };
    },
    [schemaRef, object, currentObject]
  );

  const makeActionsForContext = useCallback(
    (ctxId) => {
      const actions = (creatableRelated || [])
        .map((rs) => {
          const slug = rs?.slug;
          if (!slug) return null;
          
          // Use the schema slug directly as the target type (no more BEHEER_RENAMES dependency)
          const targetType = slug;

          const label = `${rs?.title ?? _.startCase(slug)} toevoegen`;

          const isOutgoing = outgoingSchemas.has(slug);

          return {
            key: `create-${slug}`,
            label,
            icon: <VISUALS.PLUS />,
            onClick: async () => {
              const { preSelected, preSelectedLabels } = await buildPreSelected(targetType, ctxId);
              openDynamicCreate(targetType, preSelected, {
                isOutgoing,
                currentObjectId: ctxId,
                relationshipField: isOutgoing ? getOutgoingRelationshipField(targetType, currentType) : null,
                preSelectedLabels, // Pass the labels for optimization
                currentObjectRegister, // Pass current object register for updating
                currentObjectSchema, // Pass current object schema for updating
              });
            },
          };
        })
        .filter(Boolean);

      
      return actions;
    },
    [creatableRelated, openDynamicCreate, buildPreSelected]
  );

  return useMemo(() => ({ makeActionsForContext }), [makeActionsForContext]);
};
