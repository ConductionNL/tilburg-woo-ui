import loadable from '@loadable/component';

// Load the generic delete modal once and reuse it
const GenericDeleteModal = loadable(() =>
  import(
    '@views/ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal'
  )
);

// Load the generic form modal once and reuse it
const GenericFormModal = loadable(() =>
  import('@views/ac-beheer/core/components/con-generic-form-modal.js')
);

/**
 * Base modal configuration that all beheer types inherit from
 */
const baseModalConfig = {
  delete: GenericDeleteModal,
  import: loadable(() =>
    import('@views/ac-beheer/shared/components/import-modal/ac-beheer-import-modal')
  ),
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
      add: GenericFormModal,
      edit: GenericFormModal,
      // Extra create modals shown on details page action menu
      addGebruik: GenericFormModal,
      addDienst: GenericFormModal,
      addVersion: GenericFormModal,
    },
    diensten: {
      ...baseModalConfig,
      add: GenericFormModal,
      edit: GenericFormModal,
    },
    'voorzieningen-versie': {
      ...baseModalConfig,
      add: GenericFormModal,
      edit: GenericFormModal,
    },
    organisaties: {
      ...baseModalConfig,
      add: GenericFormModal,
      edit: GenericFormModal,
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
      publish: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-organisatie/modals/ac-publish-depublish-organisation'
        )
      ),
      depublish: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-organisatie/modals/ac-publish-depublish-organisation'
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
      add: GenericFormModal,
      edit: GenericFormModal,
    },
    gebruiken: {
      ...baseModalConfig,
      add: GenericFormModal,
      edit: GenericFormModal,
      koppelen: loadable(() =>
        import('@views/ac-beheer/domains/ac-gebruiken/modals/ac-gebruik-koppelen')
      ),
    },
    overeenkomsten: {
      ...baseModalConfig,
      add: GenericFormModal,
      edit: GenericFormModal,
    },
    contactpersonen: {
      ...baseModalConfig,
      add: GenericFormModal,
      edit: GenericFormModal,
      publish: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-contactpersonen/modals/ac-publish-depublish-contactpersoon'
        )
      ),
      depublish: loadable(() =>
        import(
          '@views/ac-beheer/domains/ac-contactpersonen/modals/ac-publish-depublish-contactpersoon'
        )
      ),
    },
  },

  /**
   * Get modal component for a specific type and modal action
   * @param {string} type - The beheer page type
   * @param {string} modalType - The modal action type
   * @returns {Component|null} The modal component or null if not found
   */
  getModalComponent: (type, modalType) => {
    return BeheerModalFactory.modalComponents[type]?.[modalType] || null;
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

      if (genericFormTypes.includes(type)) {
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

    // Cross-type create modals from details pages (e.g., applicaties → gebruik/dienst/versie)
    if (type === 'applicaties') {
      switch (modalType) {
        case 'addGebruik': {
          return {
            ...baseProps,
            type: 'gebruiken',
            data: null,
            isEdit: false,
            preSelected: { voorzieningId: singleSelectedRow?.id },
            onSuccess: (created) => {
              tableRef.current?.resetSelectedRows();
              setOpenModal(null);
              if (created?.id && typeof params.navigate === 'function') {
                params.navigate(`/beheer/gebruiken/${created.id}`);
              } else if (typeof fetchData === 'function') {
                fetchData();
              }
            },
          };
        }
        case 'addDienst': {
          return {
            ...baseProps,
            type: 'diensten',
            data: null,
            isEdit: false,
            // For historical compatibility this equals previous `preSelectedVoorziening`
            preSelected: { voorziening: singleSelectedRow?.id },
            onSuccess: (created) => {
              tableRef.current?.resetSelectedRows();
              setOpenModal(null);
              if (created?.id && typeof params.navigate === 'function') {
                params.navigate(`/beheer/diensten/${created.id}`);
              } else if (typeof fetchData === 'function') {
                fetchData();
              }
            },
          };
        }
        case 'addVersion': {
          return {
            ...baseProps,
            type: 'voorzieningen-versie',
            data: null,
            isEdit: false,
            preSelected: { voorziening: singleSelectedRow?.id },
          };
        }
        default:
          break;
      }
    }

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
      const ModalComponent = BeheerModalFactory.getModalComponent(type, modalType);
      if (!ModalComponent) {
        console.warn(
          `No modal component found for type: ${type}, modal: ${modalType}`
        );
        return;
      }

      const modalProps = BeheerModalFactory.getModalProps(type, modalType, params);

      modals.push(<ModalComponent key={`${type}-${modalType}`} {...modalProps} />);
    });

    return modals;
  },
};

export default BeheerModalFactory;
