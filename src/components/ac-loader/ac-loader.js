const AcLoader = ({ style, className }) => {
  return (
    <div
      className={`ac-loader ac-loader--primary ${className}`}
      style={{ ...style }}
    >
      <span className='ac-loader-dot'></span>
      <span className='ac-loader-dot'></span>
      <span className='ac-loader-dot'></span>
    </div>
  );
};

export default AcLoader;
