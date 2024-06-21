import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { Record } from "@sinequa/core/web-services";
import { SearchService } from '@sinequa/components/search';
import { Filter } from "@sinequa/core/web-services";
import { PreviewService } from "@sinequa/components/preview";
import { AppService } from "@sinequa/core/app-utils";

@Component({
    selector: "preview-compound",
    templateUrl: "./preview-compound.component.html",
    styleUrls: ['./preview-compound.component.scss']
})

export class PreviewCompoundComponent implements OnInit, OnChanges{
    @Input() record: Record;

    public title: string;
    public project: string;
    public url: string;
    public meetingMinutes: any;
    public experiments: any;

    constructor(
        public searchService: SearchService,
        private previewService: PreviewService,
        public appService: AppService
      ) {}

    ngOnInit()
    {
    }
    
    ngOnChanges(SimpleChanges: SimpleChanges): void {

        this.title = this.record.title;
        this.project = this.record["projectMetadata"];
        this.url = this.record["url1"];
        let filterCompound: Filter = {field: "compoundcsv", value: this.record.title}

        //Retrieve meeting minutes mentioning this compound
        const queryForMeetingMinutes = this.searchService.makeQuery();
        queryForMeetingMinutes.name = "iris_query_test";
        queryForMeetingMinutes.text = "meeting minutes"
        queryForMeetingMinutes.pageSize = 10;

        queryForMeetingMinutes.addFilter(filterCompound);

        this.searchService.getResults(queryForMeetingMinutes).subscribe(results => {
            this.meetingMinutes = results;
        })

        //Retrieve experiments mentioning this compound
        const queryForExperiments = this.searchService.makeQuery();
        queryForExperiments.name = "iris_query_test";

        let filterSource: Filter = { operator: "or", filters: [{field: "collection", value: "/Databases/ChemCart/" }, {field: "collection", value: "/API/Benchling/" }]};
        queryForExperiments.addFilter(filterCompound);
        queryForExperiments.addFilter(filterSource);

        this.searchService.getResults(queryForExperiments).subscribe(results => {
            this.experiments = results;
        })        
    }

    protected openFullViewDocument(record:Record): void {
        this.previewService.openRoute(record, this.searchService.query);
    }

    get formatIcons(): any {
        return this.appService.app?.data?.formatIcons;
      }
}