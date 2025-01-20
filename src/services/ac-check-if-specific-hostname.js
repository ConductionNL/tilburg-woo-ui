export const AcCheckIfSpecificHostname = () => {
  const hostname = window.location.hostname;

  // Production
  const isSpecificHostname = ['open-dimpact.accept.commonground.nu', 'open-rotterdam.accept.commonground.nu', 'vng.opencatalogi.nl'].includes(hostname);

  // Development
  // const isSpecificHostname = ['localhost'].includes(hostname);

  return isSpecificHostname;
};
