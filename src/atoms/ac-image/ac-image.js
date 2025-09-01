const AcImage = ({ file_name, id, mime_type, name, srcset, url }) => {
  return (
    <picture>
      <source srcSet={srcset} />
      <img src={url} alt='' />
    </picture>
  );
};
export default AcImage;
