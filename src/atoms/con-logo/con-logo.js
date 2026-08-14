import * as React from 'react';
import clsx from 'clsx';

const ConLogo = ({
  onClick,
  layoutClassName,
  variant = 'header',
  label = 'Naar de homepage',
}) => {
  const className = clsx('con-logo-container', variant, [
    onClick && 'clickable',
    layoutClassName && layoutClassName,
  ]);

  // The logo carries no text of its own; it is a CSS background image. Without
  // an onClick it is decorative and stays a plain div. With one it is a real
  // control, so it has to be a button — focusable, keyboard-operable, and
  // named, since there is no content for a screen reader to announce.
  if (!onClick) {
    return <div className={className} />;
  }

  return (
    <button
      type='button'
      className={className}
      onClick={onClick}
      aria-label={label}
    />
  );
};

export default ConLogo;
