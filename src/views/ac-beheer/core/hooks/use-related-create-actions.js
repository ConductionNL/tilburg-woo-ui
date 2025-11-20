import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import _ from 'lodash';
import { VISUALS } from '@constants';
import { checkOrganizationPermissions } from '@utils/organization-permissions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@constants/wizards.constants';
import { normalizeSchemaName } from '@src/utilities';

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
 * @param {Array<string>} params.excludeSchemas - Array of schema slugs to exclude from actions (optional)
 * @param {Array<string>} params.onlyIncludeSchemas - Array of schema slugs to include (whitelist mode - only these will show) (optional)
 * @param {Object.<string, string>} params.labelOverrides - Object mapping schema slug to custom label (optional)
 * @param {Object.<string, React.ReactNode>} params.iconOverrides - Object mapping schema slug to custom icon (optional)
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
  excludeSchemas = [], // Array of schema slugs to exclude
  onlyIncludeSchemas = null, // Array of schema slugs to include (whitelist mode)
  labelOverrides = {}, // Object mapping schema slug to custom label
  iconOverrides = {}, // Object mapping schema slug to custom icon
}) => {
  const navigate = useNavigate();
  const [creatableRelated, setCreatableRelated] = useState([]);
  const [outgoingSchemas, setOutgoingSchemas] = useState(new Set());

  // Create stable references for array/object parameters to prevent infinite loops
  const excludeSchemasString = useMemo(
    () => JSON.stringify(excludeSchemas),
    [excludeSchemas]
  );

  const onlyIncludeSchemasString = useMemo(
    () => JSON.stringify(onlyIncludeSchemas),
    [onlyIncludeSchemas]
  );

  const labelOverridesString = useMemo(
    () => JSON.stringify(labelOverrides),
    [labelOverrides]
  );

  const iconOverridesString = useMemo(
    () => JSON.stringify(iconOverrides),
    [iconOverrides]
  );

  useEffect(() => {
    if (!schemaRef) return;
    if (!user?.isAuthenticated) return;

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
          outgoing.forEach((schema) => {
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

        // Deduplicate by slug to prevent duplicate menu items
        const deduplicatedResults = relatedResults.reduce((acc, rs) => {
          if (!rs?.slug) return acc;

          // Check if we already have this slug
          const existing = acc.find((item) => item.slug === rs.slug);
          if (!existing) {
            acc.push(rs);
          }
          return acc;
        }, []);

        // Filter by user group authorization, include/exclude lists
        const creatable = deduplicatedResults.filter((rs) => {
          // Check if current user is the owner of the object
          // If currentObject is provided, check organization ownership
          const isOwner = currentObject
            ? checkOrganizationPermissions(user, currentObject).canEdit
            : true; // If no object provided, treat as owner for backward compatibility

          // For non-owners: apply whitelist if provided
          const isWhitelistMode =
            onlyIncludeSchemas !== null && Array.isArray(onlyIncludeSchemas);
          const isInWhitelist =
            isWhitelistMode && onlyIncludeSchemas.includes(rs?.slug);

          if (!isOwner && isWhitelistMode) {
            if (!isInWhitelist) {
              return false; // Not in whitelist, hide it
            }
            // If in whitelist, skip API permission checks for non-owners
            // (we explicitly want them to see this action)
          }

          // For everyone (owners and non-owners): apply exclude list
          if (excludeSchemas.includes(rs?.slug)) {
            return false;
          }

          // For non-owners with whitelisted schemas, skip API authorization checks
          if (!isOwner && isInWhitelist) {
            return true; // Explicitly allowed via whitelist
          }

          // For owners or when no whitelist: check API authorization
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
        setCreatableRelated(creatable);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to prepare related actions:', e);
        setCreatableRelated([]);
      }
    };

    prepareRelatedActions();
    // Only re-run when schema reference changes
    // Note: user and currentObject are passed directly but changes to user.activeOrganization
    // or currentObject.@self.organisation will trigger re-evaluation within the filter
  }, [
    schemaRef,
    user?.currentUser,
    user?.activeOrganization?.id,
    user?.activeOrganization?.uuid,
    object,
    excludeSchemasString,
    onlyIncludeSchemasString,
    currentObject?.['@self']?.organisation,
    currentObject?.['@self']?.organization,
  ]);

  // Schema-driven helper to determine which field in the current object should be updated for outgoing relationships
  const getOutgoingRelationshipField = useCallback(
    (targetType, sourceType) => {
      try {
        // Get the source schema to find properties that reference the target schema
        const sourceSchemaType = object.getSchemaType(sourceType);
        const sourceSchema = sourceSchemaType
          ? object.getSchema(sourceSchemaType)
          : null;

        if (!sourceSchema?.properties) {
          return null;
        }

        // Look for properties in source schema that reference the target schema
        for (const [fieldName, fieldSchema] of Object.entries(
          sourceSchema.properties
        )) {
          if (fieldSchema.$ref) {
            // Extract schema slug from $ref
            const refMatch = fieldSchema.$ref.match(/\/schemas\/([^/]+)$/);
            const referencedSchemaSlug = refMatch?.[1];

            if (referencedSchemaSlug === targetType) {
              return fieldName;
            }
          }

          // Handle array items that reference the target schema
          if (fieldSchema.type === 'array' && fieldSchema.items?.$ref) {
            const refMatch = fieldSchema.items.$ref.match(/\/schemas\/([^/]+)$/);
            const referencedSchemaSlug = refMatch?.[1];

            if (referencedSchemaSlug === targetType) {
              return fieldName;
            }
          }
        }
      } catch (error) {
        console.error('Error finding outgoing relationship field:', error);
      }

      return null;
    },
    [object]
  );

  // Schema-driven approach to build preSelected values with labels
  const buildPreSelected = useCallback(
    async (targetType, ctxId, rowCurrentObject = null) => {
      const preSelected = {};
      const preSelectedLabels = {};

      try {
        // Get the target schema to analyze its properties
        const targetSchemaType = object.getSchemaType(targetType);
        let targetSchema = targetSchemaType
          ? object.getSchema(targetSchemaType)
          : null;

        // If schema is not loaded, try to fetch it
        if (!targetSchema) {
          await object.fetchSchema(targetType);
          const updatedTargetSchemaType = object.getSchemaType(targetType);
          targetSchema = updatedTargetSchemaType
            ? object.getSchema(updatedTargetSchemaType)
            : null;
        }

        if (!targetSchema?.properties) {
          return { preSelected, preSelectedLabels };
        }

        // Get current schema slug for reference matching
        const currentSchemaSlug =
          typeof schemaRef === 'string' ? schemaRef : schemaRef?.slug;
        if (!currentSchemaSlug) {
          return { preSelected, preSelectedLabels };
        }

        // Get current object data to extract label/name (use row-specific object if provided, otherwise fallback to hook-level currentObject)
        const currentObjectData = rowCurrentObject || currentObject;
        const currentObjectLabel =
          currentObjectData?.naam ||
          currentObjectData?.name ||
          currentObjectData?.title ||
          currentObjectData?.titel ||
          currentObjectData?.['@self']?.name ||
          ctxId;

        // Look for properties in target schema that reference our current schema
        Object.entries(targetSchema.properties).forEach(
          ([fieldName, fieldSchema]) => {
            if (fieldSchema.$ref) {
              // Extract schema slug from $ref (e.g., "#/components/schemas/voorziening" -> "voorziening")
              const refMatch = fieldSchema.$ref.match(/\/schemas\/([^/]+)$/);
              const referencedSchemaSlug = refMatch?.[1];

              if (referencedSchemaSlug === currentSchemaSlug) {
                preSelected[fieldName] = ctxId;
                preSelectedLabels[fieldName] = currentObjectLabel;
              }
            }

            // Handle array items that reference our schema
            if (fieldSchema.type === 'array' && fieldSchema.items?.$ref) {
              const refMatch = fieldSchema.items.$ref.match(/\/schemas\/([^/]+)$/);
              const referencedSchemaSlug = refMatch?.[1];

              if (referencedSchemaSlug === currentSchemaSlug) {
                preSelected[fieldName] = [ctxId]; // Array field gets array value
                preSelectedLabels[fieldName] = [currentObjectLabel]; // Array labels
              }
            }
          }
        );
      } catch (error) {
        console.error('Error building schema-driven preSelected:', error);
        // Fallback to empty preSelected on error
      }

      return { preSelected, preSelectedLabels };
    },
    [schemaRef, object, currentObject]
  );

  const makeActionsForContext = useCallback(
    /**
     * @param {string} ctxId - REQUIRED - used with building actions to know what object to reference
     * @param {({ slug: string, title: string }: Schema) => boolean} filter - configurable filter function to be able to filter out unwanted actions, filtered content is a Schema object (runs on .filter())
     * @param {Object} rowCurrentObject - Optional row-specific object for permission checks (falls back to hook-level currentObject)
     * @param {string} rowCurrentObjectRegister - Optional row-specific register slug (falls back to hook-level currentObjectRegister)
     * @param {string} rowCurrentObjectSchema - Optional row-specific schema slug (falls back to hook-level currentObjectSchema)
     */
    (
      ctxId,
      filter = null,
      rowCurrentObject = null,
      rowCurrentObjectRegister = null,
      rowCurrentObjectSchema = null
    ) => {
      // Use row-specific object if provided, otherwise fallback to hook-level currentObject
      const effectiveCurrentObject = rowCurrentObject || currentObject;
      const effectiveCurrentObjectRegister =
        rowCurrentObjectRegister || currentObjectRegister;
      const effectiveCurrentObjectSchema =
        rowCurrentObjectSchema || currentObjectSchema;

      // Check organization permissions for row-specific object (needed for outgoing relationships)
      const { canEdit: canEditCurrentObject } = effectiveCurrentObject
        ? checkOrganizationPermissions(user, effectiveCurrentObject)
        : { canEdit: true }; // Default to true if no current object provided

      const filteredCreatableRelated =
        typeof filter === 'function' && Array.isArray(creatableRelated)
          ? creatableRelated.filter(filter)
          : creatableRelated;

      const actions = (filteredCreatableRelated || [])
        .map((rs) => {
          const slug = rs?.slug;
          if (!slug) return null;

          // For outgoing relationships, check if user can edit current object
          // UNLESS the schema is explicitly whitelisted for non-owners
          const isOutgoing = outgoingSchemas.has(slug);
          const isWhitelisted =
            onlyIncludeSchemas !== null &&
            Array.isArray(onlyIncludeSchemas) &&
            onlyIncludeSchemas.includes(slug);

          if (isOutgoing && !canEditCurrentObject && !isWhitelisted) {
            return null; // Can't create outgoing relationships if can't edit current object (unless whitelisted)
          }

          // Use the schema slug directly as the target type (no more BEHEER_RENAMES dependency)
          const targetType = slug;

          const baseName = rs?.title ?? _.startCase(slug);
          const defaultLabel = `${normalizeSchemaName(baseName)} toevoegen`;
          // Apply label override if provided
          const label = labelOverrides[slug] || defaultLabel;

          const wizards = Object.values(DASHBOARD_WIZARDS);
          const wizard = wizards.find((w) => w.schema === slug);
          const areThereMultipleOptions =
            wizards.filter((w) => w.schema === slug).length > 1;

          const defaultIcon = wizard ? (
            <VISUALS.WAND_SPARKLES_SOLID />
          ) : (
            <VISUALS.PLUS />
          );
          // Apply icon override if provided
          const iconElement = iconOverrides[slug] || defaultIcon;

          return {
            key: `create-${slug}`,
            schema: slug,
            label,
            icon: iconElement,
            onClick: async () => {
              // Prefer wizard when available
              if (wizard) {
                const url = getWizardUrl(wizard, !areThereMultipleOptions);
                if (url) {
                  navigate(url);
                  return;
                }
              }

              const { preSelected, preSelectedLabels } = await buildPreSelected(
                targetType,
                ctxId,
                effectiveCurrentObject
              );
              openDynamicCreate(targetType, preSelected, {
                isOutgoing,
                currentObjectId: ctxId,
                relationshipField: isOutgoing
                  ? getOutgoingRelationshipField(targetType, currentType)
                  : null,
                preSelectedLabels, // Pass the labels for optimization
                currentObjectRegister: effectiveCurrentObjectRegister, // Pass row-specific register for updating
                currentObjectSchema: effectiveCurrentObjectSchema, // Pass row-specific schema for updating
              });
            },
          };
        })
        .filter(Boolean);

      return actions;
    },
    [
      creatableRelated,
      openDynamicCreate,
      buildPreSelected,
      outgoingSchemas,
      user,
      currentObject,
      currentObjectRegister,
      currentObjectSchema,
      currentType,
      getOutgoingRelationshipField,
      navigate,
      labelOverridesString,
      iconOverridesString,
      labelOverrides,
      iconOverrides,
    ]
  );

  return useMemo(() => ({ makeActionsForContext }), [makeActionsForContext]);
};
