import { SearchService } from "@sinequa/components/search";
import { Injectable } from "@angular/core";
import { ReplaySubject } from "rxjs";

@Injectable({providedIn: 'root'})
export class QueryIntentService {
    public disableNeuralQI = new ReplaySubject<boolean>(1);

    protected processedIntents: string[] = [];

    constructor(
        public searchService: SearchService
    ){
        this.init();
    }

    init() {
        this.searchService.events.subscribe(event => {
            if(event.type === 'new-query-intents') {
                if(event.intents.find(intent => intent.name === 'codeDetectionQueryIntent'))
                {
                    if (this.processedIntents.indexOf('code' + this.searchService.query.text) < 0)
                    {
                        this.resetProcessedIntents();
                        this.disableNeuralQI.next(true);
                        this.processedIntents.push('code' + this.searchService.query.text);
                    }
                }
            }
        })
    }

    public resetProcessedIntents() {
        this.processedIntents = [];
    }
    
}