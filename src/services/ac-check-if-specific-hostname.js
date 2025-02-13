export const AcCheckIfSpecificHostname = () => {
  const hostname = window.location.hostname;

  // Production
  const isSpecificHostname = [
    'open-dimpact.accept.commonground.nu',
    'dimpact.opencatalogi.nl',
    'open-rotterdam.accept.commonground.nu',
    'vng.opencatalogi.nl',
    'opencatalogi.nl',
    'open-migrato.accept.commonground.nu',
  ].includes(hostname);

  // Development
  // const isSpecificHostname = ['localhost'].includes(hostname);

  return isSpecificHostname;
};
