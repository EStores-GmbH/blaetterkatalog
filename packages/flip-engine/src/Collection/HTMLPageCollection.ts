import { HTMLPage } from '../Page/HTMLPage.ts';
import { Render } from '../Render/Render.ts';
import { PageCollection } from './PageCollection.ts';
import { PageFlip } from '../PageFlip.ts';
import { PageDensity } from '../Page/Page.ts';

/**
 * Сlass representing a collection of pages as HTML Element
 */
export class HTMLPageCollection extends PageCollection {
    private readonly element: HTMLElement;
    private readonly pagesElement: NodeListOf<HTMLElement> | HTMLElement[];

    constructor(
        app: PageFlip,
        render: Render,
        element: HTMLElement,
        items: NodeListOf<HTMLElement> | HTMLElement[]
    ) {
        super(app, render);

        this.element = element;
        this.pagesElement = items;
    }

    public load(): void {
        for (const pageElement of this.pagesElement) {
            const page = new HTMLPage(
                this.render,
                pageElement,
                pageElement.dataset['density'] === 'hard' ? PageDensity.HARD : PageDensity.SOFT
            );

            page.load();
            this.pages.push(page);
        }

        this.createSpread();
    }
}
