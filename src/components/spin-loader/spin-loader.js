import clsx from 'clsx';

const SpinLoader = (props) => {
  return (
    <div className={clsx('spin-loader', props.className)} {...props}>
      <div className='spin-loader__circle'></div>
    </div>
  );
};

export default SpinLoader;
