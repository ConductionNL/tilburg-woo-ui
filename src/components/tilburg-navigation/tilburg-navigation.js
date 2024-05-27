import clsx from 'clsx'
import { VISUALS } from "@constants";

const TilburgNavigation = () => {

    const _CLASSES = clsx('tilburg-navigation')

    return (
        <nav className={_CLASSES} aria-label="Navigation">
            <ul>
                <li>
                    <a href="/">
                        <VISUALS.INFO />
                        Over Open Tilburg
                    </a>
                </li>
                <li>
                    <a href="/about">
                        <VISUALS.LIST />
                        Onderwerpen
                    </a>
                </li>
                <li>
                    <a href="/contact">
                        <VISUALS.CONTACT />
                        Contact
                    </a>
                </li>
            </ul>
        </nav>
    );
}
export default TilburgNavigation
