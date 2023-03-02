import { Component } from '@angular/core';
import { GlobalService } from '../../../global.service';

@Component({
    selector: 'doc-facet-bar',
    templateUrl: './facet-bar.component.html'
})
export class DocFacetBarComponent {

    index = 0;

    code = `<sq-facet-bar
    [results]="results"
    [containerIndex]="index"></sq-facet-bar>`;

    code2 = `// List of facet configurations (of type list and tree)
export const allFacets: FacetConfig<FacetListParams | FacetTreeParams>[] = [
    {
        name: "facet1",
        title: "Modified",
        type: "list",
        icon: "fas fa-calendar-day",
        parameters: {
            aggregation: "Modified"
        }
    },
    {
        name: "facet2",
        title: "Tree path",
        type: "tree",
        icon: "fas fa-sitemap",
        parameters: {
            aggregation: "Treepath"
        }
    },
    {
        name: "facet3",
        title: "Person",
        type: "list",
        icon: "fas fa-user",
        parameters: {
            aggregation: "Person"
        }
    }
];

// List of default facets displayed (only facet2 is displayed here)
export const defaultFacets: FacetState[] = [
    { name: "facet1", position: 0 },
    { name: "facet2", position: 1 },
    { name: "facet3", position: 2 }
];

...

@NgModule({
    ...
    imports: [
        ...
        BsFacetModule.forRoot(allFacets, defaultFacets),
        ...`;

    constructor(public globalService: GlobalService) { }

}
