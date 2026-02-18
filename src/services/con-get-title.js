// Try to import container constants (generated at runtime)
// Fall back to hostname-based logic if not available
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to hostname-based logic');
  containerConfig = null;
}

export const getTitle = () => {
  // Use container config if available
  if (containerConfig && containerConfig.getTitle) {
    return containerConfig.getTitle();
  }

  // Fallback to hostname-based logic for production builds
  const hostname = window.location.hostname;

  switch (hostname) {
    case 'vng.opencatalogi.nl':
    case 'acceptatie.softwarecatalogus.nl':
    case 'vng.test.opencatalogi.nl':
      return 'Softwarecatalogus';
    case 'open-tilburg.accept.commonground.nu':
      return 'Open Tilburg';
    case 'open-dimpact.accept.commonground.nu':
    case 'dimpact.opencatalogi.nl':
      return 'Producten softwarecatalogus';
    case 'open-rotterdam.accept.commonground.nu':
      return 'Open Rotterdam';
    case 'open-migrato.accept.commonground.nu':
      return 'Open Migrato';
    case 'opencatalogi.nl':
    case 'developer.opencatalogi.nl':
    case 'test.opencatalogi.nl':
      return 'OpenCatalogi';
    case 'opencatalogi.open-regels.nl':
      return 'OpenRegels';
    case 'horstadmaas.accept.opencatalogi.nl':
      return 'Horst aan de Maas';
    case 'verwerkingsregister.horstaandemaas.nl':
      return 'Horst aan de Maas';
    case 'verwerkingsregister.venray.nl':
      return 'Venray';
    case 'localhost':
      return 'WATCH BUILD WORKING! 🚀';
    default:
      return 'Open Tilburg';
  }
};
