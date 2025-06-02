import clsx from 'clsx';

const ConSpinLoader = (props) => {
  return (
    <div className={clsx('spin-loader', props.className)} {...props}>
      <div className='spin-loader__circle'></div>
    </div>
  );
};

export default ConSpinLoader;
