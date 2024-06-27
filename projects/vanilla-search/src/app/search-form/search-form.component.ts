import { Component, Input, ViewChild, OnInit } from "@angular/core";
import { SearchService } from "@sinequa/components/search";
import { Query } from "@sinequa/core/app-utils";
import { SearchFormComponent } from "@sinequa/components/search-form";
import { HelpFolderOptions } from "@sinequa/components/user-settings";
import { QueryIntentService } from "../query-intent.service";
import { Observable } from "rxjs";
import { filter } from "rxjs/operators";

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styles: [`
  :host {
    position: relative;
    display: block;
  }

  sq-autocomplete {
    & ::ng-deep .list-group-item {
      &:first-child {
        border-top: var(--bs-list-group-border-width) solid var(--bs-list-group-border-color) !important;
      }
      &:last-child {
        /* Apply margin to the last autocomplete item so that if there is none,
           no margin is applied and the autocomplete appears collapsed */
        margin-bottom: 1rem;
      }
    }
  }
  `],
})
export class AppSearchFormComponent implements OnInit{

  /** List of autocomplete sources displayed by the autocomplete */
  @Input() autocompleteSources?: string[];
  /** Route where a new search navigates to */
  @Input() searchRoute = "search";

  @ViewChild("searchForm") searchForm: SearchFormComponent;

  public helpFolderOptions: HelpFolderOptions = {
    path: '/r/Incyte_help',
    indexFile: 'olh-search.html#search',
  }

  public disableNeuralResults$: Observable<boolean>;

  constructor(
    public searchService: SearchService,
    public queryIntentService: QueryIntentService
  ) {}

  ngOnInit(): void {
    //Event triggered by query intent
    this.disableNeuralResults$ = this.queryIntentService.disableNeuralQI.asObservable();

    this.disableNeuralResults$.pipe(
      filter(result => result === true)
    ).subscribe(() => {
      if(this.searchForm.neuralSearch)
      {
        this.searchForm.toggleNeuralSearch();
      }
    });
  }

  onAutocompleteSearch(text: string, query: Query) {
    query.text = text;
    this.searchForm.applyFilters(); // Apply the autocomplete query and close the form
  }

  onAutocompleteSelect(text: string, query: Query) {
    query.text = text;
  }

}
