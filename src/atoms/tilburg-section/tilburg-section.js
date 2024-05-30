import clsx from "clsx";

const TilburgSection = ({ spacing = false, className, children }) => {

    const _CLASSES = clsx(
        'tilburg-section',
        { 'spacing': spacing },
        className
    );

    return (
        <section className={_CLASSES}>
            {children}
        </section>
    );
};

export default TilburgSection;