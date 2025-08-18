import loadable from '@loadable/component';

// Load the generic delete modal once and reuse it
const GenericDeleteModal = loadable(() =>
  import(
    '@views/ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal'
  )
);

// Load the generic publish/depublish modal once and reuse it
const GenericPublishDepublishModal = loadable(() =>
  import(
    '@views/ac-beheer/core/modals/ac-generic-beheer-publish-depublish-modal/ac-generic-beheer-publish-depublish-modal'
  )
);

// Load the generic form modal once and reuse it
const GenericFormModal = loadable(() =>
  import(
    '@views/ac-beheer/core/modals/con-generic-form-modal/con-generic-form-modal'
  )
);

/**
 * Base modal configuration that all beheer types inherit from
 */
const baseModalConfig = {
  add: GenericFormModal,
  edit: GenericFormModal,
  delete: GenericDeleteModal,
  publish: GenericPublishDepublishModal,
  depublish: GenericPublishDepublishModal,
  import: loadable(() =>
    import('@views/ac-beheer/shared/components/import-modal/ac-beheer-import-modal')
  ),
  // Generic dynamic create modal that can target another beheer type from current page
  dynamicCreate: GenericFormModal,
};

/**
 * Modal Factory for Beheer Pages
 * This factory manages the loading and rendering of modal components
 */
const BeheerModalFactory = {
  /**
   * Modal component mappings for each beheer type
   */
  modalComponents: {
    applicaties: {
      ...baseModalConfig,
    },
    diensten: {
      ...baseModalConfig,
    },
    'voorzieningen-versie': {
      ...baseModalConfig,
    },
    organisaties: {
      ...baseModalConfig,
      activate: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-organisatie/modals/ac-accept-organisation'
        )
      ),
      deactivate: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-organisatie/modals/ac-accept-organisation'
        )
      ),
      addDeelname: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-organisatie/modals/ac-add-remove-deelname'
        )
      ),
      removeDeelname: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-organisatie/modals/ac-add-remove-deelname'
        )
      ),
    },
    kwetsbaarheden: {
      ...baseModalConfig,
    },
    gebruiken: {
      ...baseModalConfig,
      koppelen: loadable(() =>
        import('@views/ac-beheer/domains/ac-gebruiken/modals/ac-gebruik-koppelen')
      ),
    },
    overeenkomsten: {
      ...baseModalConfig,
    },
    contactpersonen: {
      ...baseModalConfig,
    },
  },

  /**
   * Get modal component for a specific type and modal action
   * @param {string} type - The beheer page type
   * @param {string} modalType - The modal action type
   * @returns {Component|null} The modal component or null if not found
   */
  getModalComponent: (type, modalType) => {
    // First check if we have a specific configuration for this type
    const specificComponent = BeheerModalFactory.modalComponents[type]?.[modalType];
    if (specificComponent) {
      return specificComponent;
    }
    
    // For unknown types, fall back to base modal config if the modal type exists there
    return baseModalConfig[modalType] || null;
  },

  /**
   * Get modal props for a specific type and modal action
   * @param {string} type - The beheer page type
   * @param {string} modalType - The modal action type
   * @param {Object} params - Parameters for the modal
   * @returns {Object} Modal props
   */
  getModalProps: (type, modalType, params) => {
    const {
      singleSelectedRow,
      selectedRows,
      openModal,
      setOpenModal,
      setSingleSelectedRow,
      tableRef,
      fetchData,
      config,
    } = params;

    const baseProps = {
      showModal: openModal === modalType,
      onClose: () => {
        setOpenModal(null);
        setSingleSelectedRow(null);
      },
      onSuccess: () => {
        tableRef.current?.resetSelectedRows();
        fetchData();
      },
    };

    // Generic delete props - works for all types
    if (modalType === 'delete') {
      return {
        ...baseProps,
        objects: singleSelectedRow ? [singleSelectedRow] : selectedRows,
      };
    }

    // Generic publish/depublish props - works for all types
    if (modalType === 'publish' || modalType === 'depublish') {
      return {
        ...baseProps,
        objects: singleSelectedRow ? [singleSelectedRow] : selectedRows,
        publish: modalType === 'publish',
      };
    }

    // Generic import props - works for all types
    if (modalType === 'import') {
      return {
        ...baseProps,
        register: config.registerSlug,
        schema: config.schemaSlug,
      };
    }

    // Generic form modal props - works for add/edit across all types
    if (modalType === 'add' || modalType === 'edit') {
      // Define which types use the generic form modal
      const genericFormTypes = [
        'applicaties',
        'diensten',
        'organisaties',
        'kwetsbaarheden',
        'gebruiken',
        'overeenkomsten',
        'contactpersonen',
      ];

      // For known types, use the explicit list
      // For unknown types, assume they can use the generic form modal
      const useGenericForm = genericFormTypes.includes(type) || 
        !BeheerModalFactory.modalComponents[type];

      if (useGenericForm) {
        // Build preSelected values from params
        const preSelected = {};

        // Handle type-specific pre-selected values
        if (type === 'diensten' && params.voorzieningId) {
          preSelected.voorziening = params.voorzieningId;
        }
        if (type === 'gebruiken') {
          if (params.voorzieningId) preSelected.voorzieningId = params.voorzieningId;
          if (params.organisatieId) preSelected.organisatieId = params.organisatieId;
        }

        return {
          ...baseProps,
          type,
          data: singleSelectedRow,
          isEdit: modalType === 'edit',
          preSelected,
        };
      }
    }

    // Dynamic create modal that can target a different beheer type from the current page
    if (modalType === 'dynamicCreate') {
      const targetType = params.dynamicCreateTargetType;
      const preSelected = params.dynamicCreatePreSelected || {};
      const metadata = params.dynamicCreateMetadata || {};
      if (!targetType) {
        // No valid target type: return a non-visible modal config
        return {
          ...baseProps,
          showModal: false,
          type: null,
          data: null,
          isEdit: false,
          preSelected: {},
          metadata: {},
        };
      }
      return {
        ...baseProps,
        type: targetType,
        data: null,
        isEdit: false,
        preSelected,
        metadata,
      };
    }

    // Cross-type create modals from details pages (e.g., applicaties → gebruik/dienst/versie)
    // Removed legacy cross-type create modals (handled by dynamicCreate now)

    // Type-specific props for non-generic modals
    switch (type) {
      case 'voorzieningen-versie':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              type: 'voorzieningen-versie',
              data: singleSelectedRow,
              isEdit: modalType === 'edit',
            };
          default:
            return baseProps;
        }

      case 'organisaties':
        switch (modalType) {
          case 'addContact':
            return {
              ...baseProps,
              type: 'contactpersonen',
              data: null,
              isEdit: false,
              preSelected: { organisatie: params?.singleSelectedRow?.id },
              onSuccess: (_created) => {
                tableRef.current?.resetSelectedRows();
                setOpenModal(null);
                if (typeof fetchData === 'function') fetchData();
              },
            };
          case 'activate':
          case 'deactivate':
            return {
              ...baseProps,
              organization: singleSelectedRow,
              activate: modalType === 'activate',
            };
          case 'publish':
          case 'depublish':
            return {
              ...baseProps,
              organization: singleSelectedRow,
              publish: modalType === 'publish',
            };
          case 'addDeelname':
          case 'removeDeelname':
            return {
              ...baseProps,
              organization: singleSelectedRow,
              remove: modalType === 'removeDeelname',
            };
          default:
            return baseProps;
        }

      case 'gebruiken':
        switch (modalType) {
          case 'koppelen':
            return {
              ...baseProps,
              gebruik: singleSelectedRow,
            };
          default:
            return baseProps;
        }

      case 'contactpersonen':
        switch (modalType) {
          case 'publish':
          case 'depublish':
            return {
              ...baseProps,
              contactpersoon: singleSelectedRow,
              publish: modalType === 'publish',
            };
          default:
            return baseProps;
        }

      default:
        return baseProps;
    }
  },

  /**
   * Render all modals for a specific beheer type
   * @param {string} type - The beheer page type
   * @param {Object} params - Parameters for the modals
   * @returns {Array} Array of modal components
   */
  renderModals: (type, params) => {
    const { config } = params;
    const modals = [];

    // Always render all modals for this type, just like the original pages do
    // This ensures the modal components are always mounted and ready
    config.modals.forEach((modalType) => {
      // Guard: only render dynamicCreate when it has a valid target and is being opened
      if (
        modalType === 'dynamicCreate' &&
        (!params.dynamicCreateTargetType || params.openModal !== 'dynamicCreate')
      ) {
        return;
      }
      const ModalComponent = BeheerModalFactory.getModalComponent(type, modalType);
      if (!ModalComponent) return;

      const modalProps = BeheerModalFactory.getModalProps(type, modalType, params);

      // Pass a generic onModalMounted callback if provided (modalType gets passed back)
      if (typeof params.onModalMounted === 'function') {
        modalProps.onMounted = () => params.onModalMounted(modalType);
      }

      modals.push(<ModalComponent key={`${type}-${modalType}`} {...modalProps} />);
    });

    return modals;
  },
};

export default BeheerModalFactory;
