import clsx from 'clsx'

const TilburgContainer = ({ children, compact }) => {

    const _CLASSES = clsx('container', compact && 'container--compact');

    return (
        <div className={_CLASSES}>
            {children}
        </div>
    );
}

export default TilburgContainer;
