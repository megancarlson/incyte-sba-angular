import { Component } from '@angular/core';
import { GlobalService } from 'src/app/global.service';

@Component({
  selector: 'doc-pager',
  templateUrl: './pager.component.html'
})
export class DocPagerComponent {

  code = `<sq-pager
    [results]="results">
</sq-pager>`;

  constructor(public globalService: GlobalService) { }

}
