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
                const codeDetectionQueryIntent = event.intents.find(intent => intent.name === "codeDetectionQueryIntent");
                if(codeDetectionQueryIntent)
                {
                    if (this.processedIntents.indexOf('code' + this.searchService.query.text) < 0) 
                    {
                        this.resetProcessedIntents();
                        //Effectevely disable neural search for the current query
                        this.searchService.query.neuralSearch = false;
                        //Send an event that will toggle the neural search (the brain icon turns grey) for further searches
                        this.disableNeuralQI.next(true);
                        //Save the query in a local variable so that this code is not executed if user re-enabled neural search manually
                        this.processedIntents.push('code' + this.searchService.query.text);
                    }
                }
            }
        });
    }

    public resetProcessedIntents() {
        this.processedIntents = [];
    }
    
}
