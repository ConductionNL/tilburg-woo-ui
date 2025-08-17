// eslint-disable-next-line import/no-unresolved
import { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import { VISUALS } from '@constants';

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
 * @param {(targetType: string, preSelected: Object) => void} params.openDynamicCreate - Callback to open dynamic create modal
 */
export const useRelatedCreateActions = ({
  object,
  user,
  schemaRef,
  currentType,
  openDynamicCreate,
}) => {
  const [creatableRelated, setCreatableRelated] = useState([]);

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
        if (Array.isArray(related?.results)) {
          // Old format: { results: [...] }
          relatedResults = related.results;
        } else if (related?.incoming || related?.outgoing) {
          // New format: { incoming: [...], outgoing: [...] }
          const incoming = Array.isArray(related.incoming) ? related.incoming : [];
          const outgoing = Array.isArray(related.outgoing) ? related.outgoing : [];
          relatedResults = [...incoming, ...outgoing];
        }

        const userGroups = Array.isArray(user?.userGroups)
          ? user.userGroups
              .map((g) => (typeof g === 'string' ? g : g?.name))
              .filter(Boolean)
          : [];

        const creatable = relatedResults.filter((rs) => {
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

        console.log('🔍 Related schemas debug:', {
          schemaRef,
          apiResponse: related,
          incomingCount: related?.incoming?.length || 0,
          outgoingCount: related?.outgoing?.length || 0,
          totalRelatedResults: relatedResults.length,
          userGroups,
          creatable: creatable.length,
          creatableSchemas: creatable.map(rs => ({ slug: rs.slug, title: rs.title, auth: rs.authorization }))
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
  }, [schemaRef, user?.currentUser, object]);

  const buildPreSelected = useCallback(
    (targetType, ctxId) => {
      const preSelected = {};
      
      // Use schema slugs directly instead of renamed types
      if (targetType === 'voorziening') {
        if (currentType === 'organisatie') preSelected.organisatie = ctxId;
      }

      if (targetType === 'voorzieningaanbod') {
        if (currentType === 'voorziening') preSelected.voorziening = ctxId;
      }

      if (targetType === 'voorzieninggebruik') {
        if (currentType === 'voorziening') preSelected.voorzieningId = ctxId;
        if (currentType === 'organisatie') preSelected.organisatieId = ctxId;
      }

      if (targetType === 'voorzieningversie') {
        if (currentType === 'voorziening') preSelected.voorziening = ctxId;
        if (currentType === 'voorzieningaanbod') preSelected.voorzieningaanbod = ctxId;
      }

      if (targetType === 'contactpersoon') {
        if (currentType === 'organisatie') preSelected.organisatie = ctxId;
      }

      if (targetType === 'moduleversie') {
        if (currentType === 'voorzieningmodule') preSelected.module = ctxId;
      }

      if (targetType === 'voorziening') {
        if (currentType === 'voorzieningmodule') preSelected.omvat = ctxId;
      }
      
      return preSelected;
    },
    [currentType]
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

          return {
            key: `create-${slug}`,
            label,
            icon: <VISUALS.PLUS />,
            onClick: () =>
              openDynamicCreate(targetType, buildPreSelected(targetType, ctxId)),
          };
        })
        .filter(Boolean);
        
      console.log('🎯 makeActionsForContext:', { 
        ctxId, 
        creatableRelatedCount: creatableRelated?.length || 0,
        actionsCount: actions.length,
        actions: actions.map(a => ({ key: a.key, label: a.label }))
      });
      
      return actions;
    },
    [creatableRelated, openDynamicCreate, buildPreSelected]
  );

  return useMemo(() => ({ makeActionsForContext }), [makeActionsForContext]);
};
