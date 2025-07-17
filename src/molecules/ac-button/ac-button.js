import { VISUALS } from '@src/constants';
import clsx from 'clsx';

const AcButton = ({
  href,
  style = 'link',
  buttonType = 'primary',
  animate,
  children,
  className,
  icon,
  loading,
  sr,
  ...restProps
}) => {
  const _CLASSES = clsx(
    style === 'link' && 'utrecht-link utrecht-link--html-a',
    style === 'button' &&
      buttonType === 'primary' &&
      'utrecht-button utrecht-button--primary-action',
    style === 'button' &&
      buttonType === 'secondary' &&
      'utrecht-button utrecht-button--secondary-action',
    style === 'buttonSlim' &&
      buttonType === 'primary' &&
      'utrecht-button utrecht-button--primary-action utrecht-button--slim',
    style === 'buttonSlim' &&
      buttonType === 'secondary' &&
      'utrecht-button utrecht-button--secondary-action utrecht-button--slim',
    animate && 'ac-button--animate',
    'ac-button',
    className,
    loading && 'ac-button--loading'
  );

  return (
    <button className={_CLASSES} {...restProps}>
      {icon && (
        <span className='ac-button__icon'>
          {loading ? <VISUALS.SPINNER className='ac-button__icon--loading' /> : icon}
        </span>
      )}
      {children}

      {sr && <span className='sr-only'>{sr}</span>}
    </button>
  );
};

export default AcButton;
