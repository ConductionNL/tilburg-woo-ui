import clsx from 'clsx';

const TilburgFlex = ({ children, column, spacing, justifyContent, alignItems }) => {

    const _CLASSES = clsx(
        'tilburg-flex',
        column && 'tilburg-flex--column',
        spacing && `tilburg-flex--spacing-${spacing}`,
        justifyContent && `tilburg-flex--justify-content-${justifyContent}`,
        alignItems && `tilburg-flex--align-items-${alignItems}`,
    );

    return (
        <div className={_CLASSES}>
            {children}
        </div>
    );
}

export default TilburgFlex;
