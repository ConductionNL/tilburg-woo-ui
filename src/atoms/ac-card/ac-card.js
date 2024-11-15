import clsx from 'clsx';

const AcCard = ({
  blue,
  category,
  searchResult,
  padding = 'default',
  children,
  image,
  skeleton,
  spaceBetween = false,
}) => {
  const _CLASSES = clsx(
    'ac-card',
    blue && 'ac-card--blue',
    category && 'ac-card--category',
    searchResult && 'ac-card--search-result',
    padding && `ac-card--padding-${padding}`,
    skeleton && 'ac-card--skeleton',
    spaceBetween && 'ac-card--space-between'
  );

  return (
    <div className={_CLASSES}>
      {image && <img src={image} alt='' />}
      <div class='ac-card__content'>{children}</div>
    </div>
  );
};

export default AcCard;
