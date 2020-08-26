import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

import {IntlModule} from "@sinequa/core/intl";
import {ValidationModule} from "@sinequa/core/validation";

import {UtilsModule} from "@sinequa/components/utils";
import {BsSelectionModule} from "@sinequa/components/selection";
import {BsModalModule} from "@sinequa/components/modal";
import {BsActionModule} from "@sinequa/components/action";
import {BsAutocompleteModule} from "@sinequa/components/autocomplete";

import {BsLabelsActionItem} from "./labels-action-item/labels-action-item";
import {BsRenameLabel} from "./rename-label/rename-label";
import {BsLabelsMenuComponent} from "./labels-menu/labels-menu.component";

import {LabelsModule} from "../labels.module";
import {LABELS_COMPONENTS, LabelsComponents} from "../labels.service";
import { BsLabelsItemsComponent } from './labels-items.component';
import { BsDeleteLabel } from './delete-label/delete-label';

export const defaultLabelComponents: LabelsComponents = {
    labelActionItem: BsLabelsActionItem,
    renameModal: BsRenameLabel,
    deleteModal: BsDeleteLabel
};

@NgModule({
    imports: [
        FormsModule, ReactiveFormsModule,
        CommonModule,

        IntlModule,
        ValidationModule,

        UtilsModule,
        BsSelectionModule,
        BsModalModule,
        BsAutocompleteModule,
        LabelsModule,
        BsActionModule
    ],
    declarations: [
        BsLabelsActionItem, BsRenameLabel, BsLabelsMenuComponent, BsLabelsItemsComponent, BsDeleteLabel
    ],
    exports: [
        BsLabelsActionItem, BsRenameLabel, BsLabelsMenuComponent, BsLabelsItemsComponent, BsDeleteLabel
    ],
    providers: [
        {provide: LABELS_COMPONENTS, useValue: defaultLabelComponents},
    ]
})
export class BsLabelsModule {
}
