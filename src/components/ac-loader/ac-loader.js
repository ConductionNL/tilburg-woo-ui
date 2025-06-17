const AcLoader = ({ style }) => {
  return (
    <div className='ac-loader ac-loader--primary' style={{ ...style }}>
      <span className='ac-loader-dot'></span>
      <span className='ac-loader-dot'></span>
      <span className='ac-loader-dot'></span>
    </div>
  );
};

export default AcLoader;
