import { AcClasses } from '@utils';

// call this to Disable
export const AcDisableScroll = () => {
  if (document && document.body) {
    const c = new AcClasses();
    c.addClass(document.body, 'ac-no-scroll');
  }
};

// call this to Enable
export const AcEnableScroll = () => {
  if (document && document.body) {
    const c = new AcClasses();
    c.removeClass(document.body, 'ac-no-scroll');
  }
};
