import React from "react";
import {LABELS, VISUALS} from "@constants";

const TilburgNavigation = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="tilburg-navigation">
            <button
                onClick={() => setIsMenuOpen(prevState => !prevState)}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
            >
                {isMenuOpen ? <VISUALS.CLOSE/> : <VISUALS.MENU/>}
                {isMenuOpen ? LABELS.CLOSE : LABELS.MENU}
            </button>
            <nav aria-label="Hoofd">
                <ul>
                    <li>
                        <a href="/">
                            <VISUALS.INFO/>
                            Over Open Tilburg
                        </a>
                    </li>
                    <li>
                        <a href="/about">
                            <VISUALS.LIST/>
                            Onderwerpen
                        </a>
                    </li>
                    <li>
                        <a href="/contact">
                            <VISUALS.CONTACT/>
                            Contact
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default TilburgNavigation;