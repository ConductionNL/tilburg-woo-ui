import clsx from "clsx";
import {Link} from 'react-router-dom'


const TilburgLink = ({href, type = 'link', children, ...restProps}) => {

    let _CLASSES

    if (type === 'button') {
        _CLASSES = clsx('utrecht-button')
    } else if (type === 'link') {
        _CLASSES = clsx('utrecht-link utrecht-link--html-a')
    }

    return (
        <Link to={href} className={_CLASSES} {...restProps}>
            {children}
        </Link>
    )
}

export default TilburgLink
