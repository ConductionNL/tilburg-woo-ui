const AcImage = ({
  srcset,
  url,
}) => {
  return (
    <picture>
      <source srcSet={srcset} />
      <img src={url} alt='' />
    </picture>
  );
};
export default AcImage;
