// eslint-disable-next-line import/no-unresolved
import { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import { BEHEER_RENAMES } from '@views/ac-beheer/core/utils/beheer-renames';
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

        const relatedResults = Array.isArray(related?.results)
          ? related.results
          : [];

        const userGroups = Array.isArray(user?.userGroups)
          ? user.userGroups
              .map((g) => (typeof g === 'string' ? g : g?.name))
              .filter(Boolean)
          : [];

        const creatable = relatedResults.filter((rs) => {
          const createGroups = Array.isArray(rs?.authorization?.create)
            ? rs.authorization.create
            : [];
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
  }, [schemaRef, user?.currentUser, object]);

  const buildPreSelected = useCallback(
    (targetType, ctxId) => {
      const preSelected = {};
      if (targetType === 'applicaties') {
        if (currentType === 'organisaties') preSelected.organisatie = ctxId;
      }

      if (targetType === 'diensten') {
        if (currentType === 'applicaties') preSelected.voorziening = ctxId;
      }

      if (targetType === 'gebruiken') {
        if (currentType === 'applicaties') preSelected.voorzieningId = ctxId;
        if (currentType === 'organisaties') preSelected.organisatieId = ctxId;
      }

      if (targetType === 'voorziening-versie') {
        if (currentType === 'applicaties') preSelected.voorziening = ctxId;
        if (currentType === 'diensten') preSelected.voorzieningaanbod = ctxId;
      }

      if (targetType === 'contactpersonen') {
        if (currentType === 'organisaties') preSelected.organisatie = ctxId;
      }
      return preSelected;
    },
    [currentType]
  );

  const makeActionsForContext = useCallback(
    (ctxId) => {
      return (creatableRelated || [])
        .map((rs) => {
          const slug = rs?.slug;
          if (!slug) return null;
          const targetType = BEHEER_RENAMES[slug];
          if (!targetType) return null;

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
    },
    [creatableRelated, openDynamicCreate, buildPreSelected]
  );

  return useMemo(() => ({ makeActionsForContext }), [makeActionsForContext]);
};
