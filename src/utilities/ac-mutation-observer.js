const MutationObserverInstance =
  window.MutationObserver ||
  window.WebKitMutationObserver ||
  window.MozMutationObserver;

export const AcMutationObserver = (elem, config, callback = () => {}) => {
  const instance = new MutationObserverInstance((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        if (mutation.attributeName === 'class') {
          if (callback) callback();
        }
      }
    });
  });

  instance.observe(elem, config);

  return instance;
};
