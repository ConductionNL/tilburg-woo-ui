import clsx from 'clsx'

const TilburgContainer = ({ children }) => {

    const _CLASSES = clsx('container')

    return (
        <div className={_CLASSES}>
            {children}
        </div>
    );
}

export default TilburgContainer;
