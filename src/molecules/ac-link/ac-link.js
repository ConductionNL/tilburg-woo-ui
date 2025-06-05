import clsx from 'clsx';
import { Link } from 'react-router-dom';

const AcLink = ({
  href,
  type = 'link',
  animate = false,
  children,
  ...restProps
}) => {
  const _CLASSES = clsx(
    type === 'link' && 'utrecht-link utrecht-link--html-a',
    type === 'button' && 'utrecht-button utrecht-button--secondary-action',
    animate && 'animate'
  );

  return (
    <Link to={href} className={_CLASSES} {...restProps}>
      {children}
    </Link>
  );
};

export default AcLink;
