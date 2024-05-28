import { Link } from '@utrecht/component-library-react/dist/css-module'
import { VISUALS } from '@constants'


const TilburgLink = ({label, href, ...restProps}) => {
    return (
        <Link href={href} {...restProps}>
            {label}
            <VISUALS.ARROW_RIGHT />
        </Link>
    )
}

export default TilburgLink
