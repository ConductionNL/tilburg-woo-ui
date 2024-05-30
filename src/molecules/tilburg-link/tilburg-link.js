import { Link as UtrechtLink } from '@utrecht/component-library-react/dist/css-module'
import { Link } from 'react-router-dom'
import { VISUALS } from '@constants'


const TilburgLink = ({label, href, ...restProps}) => {
    return (
        <Link to={href}>
            <UtrechtLink {...restProps}>
                {label}
                <VISUALS.ARROW_RIGHT />
            </UtrechtLink>
        </Link>
    )
}

export default TilburgLink
