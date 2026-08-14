// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { VISUALS } from '@src/constants';
import clsx from 'clsx';
import { AcFlex } from '@atoms';

const AcButton = ({
  style = 'link',
  buttonType = 'primary',
  animate,
  children,
  className,
  icon,
  loading,
  sr,
  // A <button> with no type attribute is a submit button. That is the wrong
  // default for a general-purpose button: inside a form it submits on click,
  // and pressing Enter in any field activates the first one of them. Every
  // real submit in this app is a native <button type='submit'> or Utrecht's
  // PrimaryActionButton, so nothing here relies on the implicit behaviour —
  // and a caller that wants it can still pass type='submit'.
  type = 'button',
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
    // The rule wants a literal type and cannot see through a prop. The value
    // is guaranteed by the `type = 'button'` default in the signature above,
    // which is the whole point of this component: callers get a safe default
    // and can still pass type='submit' when they mean it.
    // eslint-disable-next-line react/button-has-type
    <button type={type} className={_CLASSES} {...restProps}>
      <AcFlex spacing='xs' alignItems='center' style={{ width: 'max-content' }}>
        <div className='ac-button__icon-container'>
          {icon &&
            (loading ? (
              <VISUALS.SPINNER className='ac-button__icon--loading' />
            ) : (
              icon
            ))}
        </div>

        {children}

        {sr && <span className='sr-only'>{sr}</span>}
      </AcFlex>
    </button>
  );
};

export default AcButton;
