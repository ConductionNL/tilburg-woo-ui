import clsx from 'clsx'


const TilburgCard = ({blue = false, padding = 'default', children}) => {
    const _CLASSES = clsx(
        'tilburg-card',
        blue && 'tilburg-card--blue',
        padding && `tilburg-card--padding-${padding}`
    )

    return (
        <div className={_CLASSES}>
            {children}
        </div>
    )
}

export default TilburgCard;
