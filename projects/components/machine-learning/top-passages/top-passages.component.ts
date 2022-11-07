import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from "@angular/core";
import { Record, Results } from "@sinequa/core/web-services";
import { AbstractFacet } from '@sinequa/components/facet';
import { TopPassage } from "@sinequa/core/web-services/models/top-passage";
import { BehaviorSubject } from "rxjs";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: 'sq-top-passages',
  templateUrl: 'top-passages.component.html',
  styles: [`
.card-body > div {
  cursor: pointer;
}

.sq-text-ellipsis {
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: var(--line-clamp, 3);
  -webkit-box-orient: vertical;
  white-space: normal;

  &.expanded {
    --line-clamp: 0;
  }
}

.btn-toggle {
  position: relative;
  top: .2rem;
  opacity: 1;
  width: 4%;
  color: rgba(0,0,0,.5);

  &--hidden {
    opacity: 0;
  }
}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopPassagesComponent extends AbstractFacet {
  @Input() set results(results: Results) {
    // extract top passages from Results object
    this.passages = results.topPassages?.passages || [];
    // converts columns items to sinequa Record only if record is undefined
    this.passages
      .filter(p => p.record === undefined)
      .forEach(p => p.record = p.columns?.reduce((acc, val) => ({ ...acc, ...(val.treepath ? { treepath: [val.treepath] } : val) })) as Record);

    // reset values
    this.currentPage = 0;
    this.pageNumber = this.itemsPerPage === 1 ? this.passages.length : Math.floor(this.passages.length / this.itemsPerPage) + 1;
  }
  @Input() collapsed: boolean;

  // Number of passages per page
  @Input() itemsPerPage = 3;

  // Number of lines displayed for each passages text
  @Input() lineNumber = 3;

  @Output() previewOpened = new EventEmitter<TopPassage>();
  @Output() titleClicked = new EventEmitter<{ item: TopPassage, isLink: boolean }>();

  passages: TopPassage[];
  page: number;
  pageNumber: number;
  currentPassages$: BehaviorSubject<TopPassage[]> = new BehaviorSubject<TopPassage[]>([]);
  selected: number;
  
  // Used to know if we should display the expand chevron
  MIN_HEIGHT: number;

  get currentPage() {
    return this.page;
  }

  set currentPage(page: number) {
    this.page = page;
    const index = page * this.itemsPerPage;
    this.currentPassages$.next(this.passages.slice(index, index + this.itemsPerPage));
  }

  // Get the range of passages displayed to display in the pagination
  get currentRange() {
    if (this.itemsPerPage === 1) {
      return this.currentPage + 1;
    }

    const from = this.currentPage * this.itemsPerPage + 1;
    const to = this.currentPage * this.itemsPerPage + this.itemsPerPage > this.passages.length ? this.passages.length : this.currentPage * this.itemsPerPage + this.itemsPerPage;
    return from < to ? `${from}-${to}` : String(from);
  }

  // Used to handle dynamically the lines number per passage
  @HostBinding("attr.style")
  public get valueAsStyle(): any {
    return this.sanitizer.bypassSecurityTrustStyle(`--line-clamp: ${this.lineNumber}`);
  }

  constructor(private sanitizer: DomSanitizer) {
    super();

    this.MIN_HEIGHT = this.setMinHeight();
  }

  // Expand one passage's text
  expand(passage: TopPassage) {
    if (this.selected !== passage.id) {
      this.selected = passage.id;
    } else {
      this.selected = -1;
    }
  }

  // Open the mini preview on text click
  openPreview(passage: TopPassage) {
    this.previewOpened.next(passage);
  }

  // Open the big preview on title click
  onTitleClicked(isLink: boolean, passage: TopPassage) {
    this.titleClicked.next({ item: passage, isLink });
  }

  // Calculation of a line height
  private setMinHeight(): number {
    return 24 * (this.lineNumber === 0 ? 1000 : this.lineNumber || 1);
  }
}