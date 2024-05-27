import {VISUALS} from '@constants'

const TilburgFooter = () => {
    return (
        <footer className="tilburg-footer">
            <h2 className="sr-only">Footer</h2>
            <div className="container">
                <nav className="tilburg-footer__links" aria-label="Footer menu 1">
                    <h3>Deze website</h3>
                    <ul>
                        <li>
                            <a href="/">Over Open Tilburg</a>
                        </li>
                        <li>
                            <a href="/">Contact</a>
                        </li>
                        <li>
                            <a href="/">Toegankelijkheid</a>
                        </li>
                        <li>
                            <a href="/">Uitgebreid zoeken</a>
                        </li>
                        <li>
                            <a href="/">Onderwerpen</a>
                        </li>
                    </ul>
                </nav>
                <nav className="tilburg-footer__links" aria-label="Footer menu 2">
                    <h3>Snel naar</h3>
                    <ul>
                        <li>
                            <a href="/">
                                www.tilburg.nl
                                <span class="sr-only">Opent in een nieuw tabblad</span>
                                <VISUALS.EXTERNAL_LINK/>
                            </a>
                        </li>
                        <li>
                            <a href="/">
                                Privacy
                                <span class="sr-only">Opent in een nieuw tabblad</span>
                                <VISUALS.EXTERNAL_LINK/>
                            </a>
                        </li>
                        <li>
                            <a href="/">
                                Proclaimer
                                <span class="sr-only">Opent in een nieuw tabblad</span>
                                <VISUALS.EXTERNAL_LINK/>
                            </a>
                        </li>
                        <li>
                            <a href="/">
                                Cookies
                                <span class="sr-only">Opent in een nieuw tabblad</span>
                                <VISUALS.EXTERNAL_LINK/>
                            </a>
                        </li>
                    </ul>
                </nav>
                <div class="tilburg-footer__logo">
                    <VISUALS.LOGO/>
                    <span>
                        <span>Open Tilburg</span>
                        <span>Éen plek voor alle publicaties van Gemeente Tilburg</span>
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default TilburgFooter;