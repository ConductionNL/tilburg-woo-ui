import clsx from "clsx";
import {Link} from 'react-router-dom'


const TilburgLink = ({href, type = 'link', children, ...restProps}) => {

    const _CLASSES = clsx(
        type === 'link' && 'utrecht-link utrecht-link--html-a',
        type === 'button' && 'utrecht-button'
    )

    return (
        <Link to={href} className={_CLASSES} {...restProps}>
            {children}
        </Link>
    )
}

export default TilburgLink
