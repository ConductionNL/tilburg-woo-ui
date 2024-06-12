import clsx from 'clsx';

const TilburgCard = ({
  blue,
  category,
  searchResult,
  padding = 'default',
  children,
  image,
  skeleton,
}) => {
  const _CLASSES = clsx(
    'tilburg-card',
    blue && 'tilburg-card--blue',
    category && 'tilburg-card--category',
    searchResult && 'tilburg-card--search-result',
    padding && `tilburg-card--padding-${padding}`,
    skeleton && 'tilburg-card--skeleton'
  );

  return (
    <div className={_CLASSES}>
      {image && <img src={image} alt='' />}
      <div class='tilburg-card__content'>{children}</div>
    </div>
  );
};

export default TilburgCard;
