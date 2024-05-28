import clsx from 'clsx'


const TilburgCard = ({blue = false, padding = 'default', children, image}) => {
    const _CLASSES = clsx(
        'tilburg-card',
        blue && 'tilburg-card--blue',
        padding && `tilburg-card--padding-${padding}`
    )

    return (
        <div className={_CLASSES}>
            {image &&
                <img src={image} alt="" />
            }
            <div class="tilburg-card__content">
                {children}
            </div>
        </div>
    )
}

export default TilburgCard;
