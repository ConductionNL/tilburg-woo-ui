import clsx from 'clsx';

const TilburgCard = ({
  blue,
  searchResult,
  padding = 'default',
  children,
  image,
}) => {
  const _CLASSES = clsx(
    'tilburg-card',
    blue && 'tilburg-card--blue',
    searchResult && 'tilburg-card--search-result',
    padding && `tilburg-card--padding-${padding}`
  );

  return (
    <div className={_CLASSES}>
      {image && <img src={image} alt='' />}
      <div class='tilburg-card__content'>{children}</div>
    </div>
  );
};

export default TilburgCard;
