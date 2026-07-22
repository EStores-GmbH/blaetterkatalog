import { ImagePage } from '../Page/ImagePage.ts';
import { Render } from '../Render/Render.ts';
import { PageCollection } from './PageCollection.ts';
import { PageFlip } from '../PageFlip.ts';
import { PageDensity } from '../Page/Page.ts';

/**
 * Сlass representing a collection of pages as images on the canvas
 */
export class ImagePageCollection extends PageCollection {
    private readonly imagesHref: string[];

    constructor(app: PageFlip, render: Render, imagesHref: string[]) {
        super(app, render);

        this.imagesHref = imagesHref;
    }

    public load(): void {
        for (const href of this.imagesHref) {
            const page = new ImagePage(this.render, href, PageDensity.SOFT);

            page.load();
            this.pages.push(page);
        }

        this.createSpread();
    }
}
