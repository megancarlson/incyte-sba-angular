
import { Component, Input, OnDestroy, OnInit} from '@angular/core';
import { LoginService } from '@sinequa/core/login';
import { AppService } from '@sinequa/core/app-utils';
import { Placement } from '@sinequa/components/utils';

@Component({
    selector: 'chat-button',
    templateUrl: './chat-button.component.html',
    styleUrls: ['./chat-button.component.scss']
})
export class ChatButtonComponent implements OnInit, OnDestroy {
    @Input() tooltip?: string = "Chat with iRIS";
    @Input() text?: string;
    @Input() icon?: string = "fas fa-robot";
    @Input() styleClass?: string = "btn-primary";
    @Input() tooltipPlacement?: Placement = "bottom";
    @Input() fallbackPlacements?: Placement[] = ["top", "bottom"];

    private intervalId: any;

    constructor(
        public loginService: LoginService,
        public appService: AppService,
    ) {}

    ngOnInit(): void {
        this.startBounce();
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    goToChat() {
        let chatUrl = this.appService.app?.data?.chatUrl ?? "https://iris-dev.incyte.com/app/kiwAI/#/";
            window.open(chatUrl, "_blank");
    }

    startBounce(): void {
        const button = document.querySelector('.chat-button');
        console.log(button);
        this.intervalId = setInterval(() =>{
            button?.classList.add('bounce');
            setTimeout(() => {
                button?.classList.remove('bounce');
            }, 1000);
        }, 10000);
    }
}
