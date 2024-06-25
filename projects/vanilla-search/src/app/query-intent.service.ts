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
                const incyteQueryIntent = event.intents.find(intent => intent.name === "codeDetectionQueryIntent");
                if(incyteQueryIntent)
                {
                    // Option #1 - Disable neural search
                    // if (this.processedIntents.indexOf('code' + this.searchService.query.text) < 0) 
                    // {
                    //     this.resetProcessedIntents();
                    //     this.disableNeuralQI.next(true);
                    //     this.processedIntents.push('code' + this.searchService.query.text);
                    // }
                    
                    //Option #2 - Add search operators to filter passages
                    if(this.searchService.query.text != null && this.searchService.query.text?.indexOf("+") === -1)
                    {
                        event.intents.forEach(intent => {
                            intent.globalEntities?.forEach(entity => {
                                this.searchService.query.text = this.searchService.query.text?.replace(entity["surface"], "+(" + entity["surface"] + ")");

                            })
                        })
                        this.searchService.search();
                    }
                }
                else
                {
                    // this.disableNeuralQI.next(false);
                }
            }
        });
    }

    public resetProcessedIntents() {
        this.processedIntents = [];
    }
    
}
