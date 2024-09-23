import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BsFacetDate } from '@sinequa/analytics/timeline';
import { Action } from '@sinequa/components/action';
import { DEFAULT_FACET_COMPONENTS, FacetConfig,  } from '@sinequa/components/facet';
import { MetadataConfig } from '@sinequa/components/metadata';
import { Preview, PreviewHighlightColors, PreviewService } from '@sinequa/components/preview';
import { SearchService } from '@sinequa/components/search';
import { SelectionService } from '@sinequa/components/selection';
import { HelpFolderOptions } from '@sinequa/components/user-settings';
import { UIService } from '@sinequa/components/utils';
import { AppService } from '@sinequa/core/app-utils';
import { IntlService } from '@sinequa/core/intl';
import { LoginService } from '@sinequa/core/login';
import { AuditEventType, AuditWebService, Filter, Record, PrincipalWebService, CustomHighlights } from '@sinequa/core/web-services';
import { Observable, Subscription, filter, tap } from 'rxjs';
import { IncyteResult } from '@sinequa/vanilla/app/no-acl-check/incyte.types';

import { FACETS, FEATURES, FacetParams, METADATA_CONFIG, PREVIEW_HIGHLIGHTS } from '../../config';

import { ChatConfig, ChatContextAttachment } from '@sinequa/assistant/chat';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {


  // Document "opened" via a click (opens the preview facet)
  public openedDoc?: Record;
  public preview?: Preview;
  public passageId?: number;

  //variables for the assistant
  public snippetId?: number;
  public customHighlights?: CustomHighlights[];
  public chatSettingsAction: Action;
  enableSettings = false;

  // Custom action for the preview facet (open the preview route)
  public previewCustomActions: Action[];

  /**
   * Controls visibility of filters (small screen sizes)
   */
  public showFilters = this.ui.screenSizeIsGreaterOrEqual('md');
  /**
   * Controls visibility of menu (small screen sizes)
   */
  public showMenu = (this.ui.screenSizeIsGreaterOrEqual('md')) ? true : false;
  /**
   * Controls visibility of the search bar (small screen sizes)
   */
  public showSearch = true;
  /**
   * Controls visibility of the filters toggle button (small screen sizes)
   */
  public showFilterToggle = false;

  public results$: Observable<IncyteResult | undefined>;

  public readonly facetComponents = {
      ...DEFAULT_FACET_COMPONENTS,
      "date": BsFacetDate
  }

  public helpFolderOptions: HelpFolderOptions = {
    path: '/r/Incyte_Help',
    indexFile: 'olh-search.html#search',
  }

  public isDark: boolean;
  public queryName: string;
  public filters?: Filter;

  private subscription = new Subscription();

  constructor(
    private previewService: PreviewService,
    private titleService: Title,
    private intlService: IntlService,
    private appService: AppService,
    public readonly ui: UIService,
    public searchService: SearchService<IncyteResult>,
    public selectionService: SelectionService,
    public loginService: LoginService,
    public auditService: AuditWebService,
    private principalService: PrincipalWebService
  ) 
  {

    const expandAction = new Action({
      icon: "fas fa-fw fa-expand-alt",
      title: "msg#preview.expandTitle",
      action: () => {
        if (this.openedDoc) {
          this.previewService.openRoute(this.openedDoc, this.searchService.query);
        }
      }
    });

    const closeAction = new Action({
      icon: "fas fa-fw fa-times",
      title: "msg#preview.closeTitle",
      action: () => {
        this.closeDocument();
      }
    });

    this.previewCustomActions = [expandAction, closeAction];

    this.showFilters = (this.ui.screenSizeIsGreater('md'));
    this.showFilterToggle = (this.ui.screenSizeIsLessOrEqual('md'));

    // when size change, adjust _showFilters variable accordingly
    // To avoid weird behavior with the Toggle Filters button
    this.subscription.add(this.ui.resizeEvent.subscribe(_ => {
      this.showFilterToggle = (this.ui.screenSizeIsLessOrEqual('md'));
      this.showMenu = (this.ui.screenSizeIsGreaterOrEqual('md'));
      this.showSearch = (this.ui.screenSizeIsGreaterOrEqual('sm'));
      this.showFilters = (this.ui.screenSizeIsGreaterOrEqual('md'));
    }));

    this.subscription.add(this.ui.isDarkTheme$.subscribe(value => this.isDark = value))

    this.chatSettingsAction = new Action({
      icon: 'fas fa-cog',
      title: 'Settings',
      action: action => {
        action.selected = !action.selected;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Initialize the page title
   */
  /**
   * Initializes the component.
   * Sets the page title and subscribes to the search service events.
   * Updates the query name and filters when new results are received.
   * Mutates the results/records if desired and updates the page title.
   */
  ngOnInit() {
    this.titleService.setTitle(this.intlService.formatMessage("msg#search.pageTitle", { search: "" }));

    this.searchService.events
      .pipe(filter(event => event.type === "new-results"))
      .subscribe(() => {
        const { name, filters } = this.searchService.query;
        this.queryName = name
        this.filters = filters;
      });


    // mutate results/records if desired, convert to switchMap or mergeMap if additional calls need to be chained
    // consult RxJS documentation for additional functionality like combineLatest, etc.
    this.results$ = this.searchService.resultsStream
      .pipe(
        tap(results => {
          this.titleService.setTitle(this.intlService.formatMessage("msg#search.pageTitle", {search: this.searchService.query.text || ""}));
          if (!this.showResults) {
            this.openedDoc = undefined;
            this.showFilters = false;
          }
          if(results && results.records.length <= results.pageSize) {
            window.scrollTo({top: 0, behavior: 'auto'});
          }
        })
      );
  }

  /**
   * Returns the configuration of the facets displayed in the facet-multi component.
   * The configuration from the config.ts file can be overriden by configuration from
   * the app configuration on the server
   */
  public get facets(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facets as any as FacetConfig<FacetParams>[] || FACETS;
  }

  public get incyteFacetsAll(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facetsAll as any as FacetConfig<FacetParams>[];
  }
  public get incyteFacetsFileshares(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facetsFileShares as any as FacetConfig<FacetParams>[];
  }
  public get incyteFacetsChemcart(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facetsChemcart as any as FacetConfig<FacetParams>[];
  }
  public get incyteFacetsBenchling(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facetsBenchling as any as FacetConfig<FacetParams>[];
  }
  public get incyteFacetsPSILO(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facetsPSILO as any as FacetConfig<FacetParams>[];
  }
  public get incyteFacetsVeeva(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facetsVeeva as any as FacetConfig<FacetParams>[];
  }
  public get otherFacetsAll(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.otherFacetsAll as any as FacetConfig<FacetParams>[];
  }
  public get otherFacetsBuckets(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.otherFacetsBuckets as any as FacetConfig<FacetParams>[];
  }

   /**
   * Returns the configuration of the metadata displayed in the facet-preview component.
   * The configuration from the config.ts file can be overriden by configuration from
   * the app configuration on the server
   */
  public get metadata(): MetadataConfig[] {
    return this.appService.app?.data?.metadata as any as MetadataConfig[] || METADATA_CONFIG;
  }

  public get incyteChemCartMetadata(): MetadataConfig[] {
    return this.appService.app?.data?.metadataChemcart as any as MetadataConfig[];
  }

  public get incyteBenchlingMetadata(): MetadataConfig[] {
    return this.appService.app?.data?.metadataBenchling as any as MetadataConfig[];
  }

  public get incytePSILOMetadata(): MetadataConfig[] {
    return this.appService.app?.data?.metadataPSILO as any as MetadataConfig[];
  }

  public get incyteFileSharesMetadata(): MetadataConfig[] {
    return this.appService.app?.data?.metadataFileShares as any as MetadataConfig[];
  }

  public get incyteVeevaMetadata(): MetadataConfig[] {
    return this.appService.app?.data?.metadataVeeva as any as MetadataConfig[];
  }

  protected get currentSelectedTab(): string {
    return this.searchService.getCurrentTab()?.name.toLowerCase() ?? "unknown";
  }

  /**
   * Returns the list of features activated in the top right menus.
   * The configuration from the config.ts file can be overriden by configuration from
   * the app configuration on the server
   */
  public get features(): string[] {
    return this.appService.app?.data?.features as string[] || FEATURES;
  }

  public get previewHighlights(): PreviewHighlightColors[] {
    return this.appService.app?.data?.previewHighlights as any || PREVIEW_HIGHLIGHTS;
  }

  /**
   * Responds to a click on a document (setting openedDoc will open the preview facet)
   * @param record
   * @param event
   */
  onDocumentClicked(record: Record, event: Event) {
    if(!this.isClickAction(event)){
      this.openMiniPreview(record);
    }
  }

  openMiniPreview(record: Record, passageId?: number, customHighlights?: CustomHighlights[], snippetId?: number) {

    this.passageId = passageId;
    this.snippetId = snippetId;
    this.customHighlights = customHighlights;

    if (this.openedDoc !== record) {
      this.preview = undefined;
      this.openedDoc = record;
    }
    else {
      // Select the passage in the already open preview
      this.selectPassageOrSnippet();
    }

    if (this.ui.screenSizeIsLessOrEqual('md')) {
      this.showFilters = false; // Hide filters on small screens if a document gets opened
    }
  }

  onPreviewReady(preview: Preview) {
    this.preview = preview;
    this.selectPassage();
  }

  /**
   * Select the selected matchingpassage in the preview, if any
   */
  selectPassage() {
    if(this.passageId !== undefined && this.preview) {
      const passage = this.preview.data?.record.matchingpassages?.passages.find(p => p.id === this.passageId);
      if(passage) {
        this.preview.selectStart("matchingpassages", passage.rlocation[0]);
      }
    }
  }

  /**
   * Open the preview when this record has no url1
   * @param record
   * @param isLink
   */
  openPreviewIfNoUrl(record: Record, isLink: boolean) {
    if(!isLink){
      this.previewService.openRoute(record, this.searchService.query);
    }
  }

  /**
   * Responds to the preview facet being closed by a user action
   */
  closeDocument(){
    if(this.openedDoc){
      this.auditService.notify({
        type: AuditEventType.Preview_Close,
        detail: this.previewService.getAuditPreviewDetail(this.openedDoc.id, this.searchService.query, this.openedDoc, this.searchService.results?.id)
      });
      this.openedDoc = undefined;
      if(this.ui.screenSizeIsEqual('md')){
        this.showFilters = true; // Show filters on medium screen when document is closed
      }
    }
  }

  // Make sure the click is not meant to trigger an action
  private isClickAction(event: Event): boolean {
    const target = event.target as HTMLElement|null;
    return event.type !== 'click' || !!target?.matches("a, a *, input, input *, button, button *");
  }

  /**
   * Show or hide the left facet bar (small screen sizes)
   */
  toggleFilters(){
    this.showFilters = !this.showFilters;
    if(this.showFilters){ // Close document if filters are displayed
      this.openedDoc = undefined;
    }
  }


  /**
   * Show or hide the user menus (small screen sizes)
   */
  toggleMenu(){
    this.showMenu = !this.showMenu;
    this.showSearch = !this.showMenu;
  }

  /**
   * Determine whether to show or hide results
   */
  get showResults(): boolean {
    if(this.ui.screenSizeIsLessOrEqual('sm')){
      return !this.showFilters && !this.openedDoc;
    }
    return true;
  }

  /**
   * Any icons mappings overrides
   * Overrides "defaultFormatIcons" from @sinequa/components/result
   */
  get formatIcons(): any {
    return this.appService.app?.data?.formatIcons;
  }

  /**
   * Handles the click event for similar documents.
   * @param {Object} id - The ID of the document.
   */
  similarDocumentsClick({id}) {
    this.searchService.getRecords([id]).subscribe(records => {
      if (records.length > 0) {
        const record = records[0] as Record;
        this.previewService.openRoute(record, this.searchService.query);
      }
    });
  }
  /* Function that checks if a record comes from one of the File System collections. 
  Done by looking at the collection name and comparing to a reference list that is hard coded in the function code. */
  isFileSystem(record: Record): boolean {
    let collection = record.collection[0];
    if( collection.startsWith("/FileShares/") && "filePath" in record)
    {
      return true;
    }
    return false;
  }

  copyToClipboard(record: Record, event: Event) {
    event.stopPropagation();
    if("filePath" in record)
    {
      this.ui.copyToClipboard((record as any).filePath as string);
    }
  }

  openMiniPreviewWithChunks(ref: ChatContextAttachment) {
    this.openMiniPreview(ref.record, undefined,  [{
      category: "snippet",
      highlights: ref.parts,
    }], ref.$partId! - 1);
  }

  selectPassageOrSnippet() {
    if (this.preview) {
      if (this.passageId !== undefined) {
        const passage = this.preview.data?.record.matchingpassages?.passages.find(p => p.id === this.passageId);
        if(passage) {
          this.preview.selectStart("matchingpassages", passage.rlocation[0]);
        }
      }
      else if (this.snippetId !== undefined) {
        this.preview.select(`snippet_${this.snippetId}`);
      }
    }
  }

  toggleChatSettings(value: boolean) {
    this.chatSettingsAction.selected = value;
  }

  onChatConfig(config: ChatConfig) {
    this.enableSettings = this.principalService.principal!.isAdministrator || config.uiSettings.display;
  }
}
