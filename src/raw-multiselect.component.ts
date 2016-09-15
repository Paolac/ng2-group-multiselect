import {
  Component,
  ViewEncapsulation,
  Inject,
  ApplicationRef,
  ViewContainerRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  OnChanges,
  SimpleChange,
  HostListener
} from "@angular/core";

import {FilterPipe} from "./raw-multiselect.pipe";

let styles = `

.filter-groups {
    //width: 150px;
    text-align: left;
    color: #777;
}
.rawMSButton.filter-groups .caret{
    position: relative;
    top: 0px;
    color: #777;
}
.rawMSInput {
    border-radius: 4px;
    padding: 8px;
    background: #FFF;
    width: 100%;
}

.rawMSDropDown {
    position: absolute;
    background-color: #FFF;
    z-index: 999;
    border: 1px solid rgba(0, 0, 0, .15);
    border-radius: 4px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, .15);
    left: 61px;
}

.rawMSControllerBox, .rawMSOptionsBox {
    padding: 15px;
    margin: 0;
    width: 207px;
}

.rawMSControllerBox {
    border-bottom: 1px solid rgba(221, 221, 221, 1);
}

.rawMSGroup h4 {
    margin-right: 10px;
    min-width: 200px;
    padding: 4px;
    border-radius: 4px;
    border: 1px solid #c3c3c3;
}

h4.option {
    margin-bottom: 5px;
}

.rawMSGroup:first-of-type>h4 {
    margin-top: 0;
}

.option {
    cursor: pointer;
}


.option.listItem {
    display: inline-block;
    margin-right: 10px;
    min-width: 100%;
    padding: 4px;
}



/*Utility Classes*/

.rawMSRight {
    float: right;
}

.rawMSLeft {
    float: left;
    padding-right: 6px;
}
.option-name {
    float: left;
}
.dropdown-wrapper{
    position: relative;
    float: left;
    padding-left: 39px;
}
.clear-filter {
    cursor: pointer;
    padding-left: 10px;
    position: relative;
    top: 5px;
}
`;

let template = `
      <div class ="dropdown-wrapper">
          <button (click)="dropDownVisible=!dropDownVisible;" class="rawMSButton btn btn-default filter-groups" [class.disabled] ="!showRefine">
              <span *ngIf ="!showMutliple && (selectedItems.length !==0 || selectedItems.length >0)">{{oneSelected}}</span>
              <span *ngIf="showMutliple">{{titleMultipleSelected}}</span>
              <span *ngIf="selectedItems.length === 0 && !showMutliple ">{{title}}</span>
              <span class="caret"></span>
          </button>
          <div *ngIf="dropDownVisible && showRefine" class="rawMSDropDown">
              <div *ngIf="inbound.length > 0" class="rawMSOptionsBox">
                  <div *ngFor="let group of groups" class="rawMSGroup">
                      <h4 class="option" [ngClass]="{selected: group.rawMSSelected}" *ngIf="groups[0].name!=='rawMSPlaceHolderGroup';">{{group.rawMSName}}
                          <span class="rawMSRight" *ngIf="group.rawMSSelected" (click)="toggleSelection(group);">&#10003;</span>
                      </h4>
                      <template ngFor let-option [ngForOf]="inbound | filter:filterVal:displayKey">
                          <div *ngIf="option[groupBy] === group.rawMSName || groups[0]['displayKey']==='rawMSPlaceHolderGroup';" (click)="toggleSelection(option, $event);"
                              class="option listItem" [ngClass]="{selected: option.rawMSSelected}">
                             <span class="rawMSLeft glyphicon glyphicon-ok" *ngIf="option.rawMSSelected"></span>
                             <span class="option-name">{{option[displayKey]}}</span> 
                          </div>
                      </template>
                  </div>
              </div>
          </div>
          <span class="clear-filter" (click)="notifyClearToParent()">{{clearFiltersText}}</span>
      </div>`;

@Component({
  selector: "raw-multiselect",
  directives: [],
  // Global styles imported in the app component.
  encapsulation: ViewEncapsulation.None,
  styles: [styles],
  template: template,
  pipes: [FilterPipe]
})

export class MultiSelectComponent implements OnInit {
  @Input() inbound: Array<any>;
  @Input() displayKey: String;
  @Input() allSelected: Boolean;
  @Input() groupBy: string;
  @Input() filterTitle: any;
  @Input() multipleSelected: any;
  @Input() showRefine: boolean;
  @Input() clearFiltersTitle: string;
  @Input() clearFilterObj: any;

  @Output() outbound: EventEmitter<any> = new EventEmitter();
  @Output() clearAllFilters: EventEmitter<any> = new EventEmitter();
  @HostListener ("document:click", ["$event"]) onClick($event) {
    this.collapse($event);

  }

  groups: Array<any>;
  dropDownVisible: boolean = false;
  selectedItems: Array<any>;
  public title: string;
  public titleMultipleSelected: string;
  public clearFiltersText: string;
  public showMutliple: boolean = false;
  public oneSelected: string;
  public subscription: any;

  constructor(private _eref: ElementRef) {
    this.selectedItems = [];
  }

  getSelectedItems(): Array<any> {
    return this.selectedItems;
  }

  toggleSelection(item, event) {
    if (item.rawMSIsGroup) {
      item.rawMSSelected = !item.rawMSSelected;
      this.inbound.forEach(subItem => {
        if (subItem[this.groupBy] === item.rawMSName) {
          if (item.rawMSSelected) {
            this.selectItem(subItem);
          } else {
            this.deselectItem(subItem);
          }
        }
      });
    } else {
      if (item.rawMSSelected) {
        this.deselectItem(item);
      } else {
        this.selectItem(item);
      }
      if (this.groups.length > 0) {
        this.checkGroupSelected(item[this.groupBy]);
      }
      //event.stopPropagation();
    }
    this.notifyParent();
  }

  notifyParent() {
    this.outbound.emit(this.getSelectedItems());
  }

  checkGroupSelected(groupName) {
    let group = this.groups.filter(item => item.rawMSName === groupName)[0];
    let noCount = this.inbound.filter(item => item[this.groupBy] === groupName)
      .reduce(function (count, item) {
        return count + !item.rawMSSelected | 0;
      }, 0);
    group.rawMSSelected = noCount === 0;
  }

  selectItem(item) {
    item.rawMSSelected = true;
    this.selectedItems = [...this.selectedItems, item];

    if(this.selectedItems.length > 1){
      this.showMutliple = true;
    } else if(this.selectedItems.length === 1 ){
      this.oneSelected = this.selectedItems[0].name;
    }
  }

  deselectItem(item) {
    item.rawMSSelected = false;
    const index = this.selectedItems.indexOf(item);
    this.selectedItems = [
      ...this.selectedItems.slice(0, index),
      ...this.selectedItems.slice(index + 1)
    ];
    if (this.selectedItems.length === 1) {
      this.oneSelected = this.selectedItems[0].name;
      this.showMutliple = false;
    } else if (this.selectedItems.length === 0) {
      this.showMutliple = false;
    } else {
      this.showMutliple = true;
    }
  }
  clearFilters (){
    let that: MultiSelectComponent = this;
    this.selectedItems.forEach(function (item) {
      item.rawMSSelected = false;
      const index = that.selectedItems.indexOf(item);
      that.selectedItems = [
        ...that.selectedItems.slice(0, index),
        ...that.selectedItems.slice(index + 1)
      ];
    })
    this.showMutliple = false;
    return this.selectedItems;
  }
  notifyClearToParent () {
    this.clearFilters();
    this.clearAllFilters.emit(this.clearFilters());
  }

  selectAll() {
    this.groups.forEach(object => {
      object.rawMSSelected = true;
    });
    this.inbound.forEach(object => {
      object.rawMSSelected = true;
    });

    this.selectedItems = [...this.inbound];
    this.notifyParent();
  }

  selectNone() {
    this.groups.forEach(object => {
      object.rawMSSelected = false;
    });
    this.inbound.forEach(object => {
      object.rawMSSelected = false;
    });

    this.selectedItems = [];
    this.notifyParent();
  }

  createGroups() {
    this.groups = [];
    if (this.groupBy) {
      let groupVals = [];
      this.inbound.forEach(item => {
        if (groupVals.indexOf(item[this.groupBy].toLowerCase()) === -1) {
          groupVals.push(item[this.groupBy].toLowerCase());
        }
      });

      groupVals.forEach(group => {
        this.groups.push({ rawMSName: group, rawMSSelected: false, rawMSIsGroup: true });
      });
    } else {
      this.groups = [{ name: "rawMSPlaceHolderGroup" }];
    }
  }

  collapse(event) {
    // Checks to see if click is inside element; if not, collapse element
    if (!this._eref.nativeElement.contains(event.target)) {
        this.dropDownVisible = false;
    }
  }
   handleEvent(data) {
     switch (data.type) {
       case "clear":
         this.notifyClearToParent();
         break;
       default:
         break;
     }
   }
  ngOnInit() {
    this.createGroups();
    if (this.allSelected) {
      this.selectAll();
    }
    this.title = this.filterTitle;
    this.titleMultipleSelected = this.multipleSelected;
    this.clearFiltersText = this.clearFiltersTitle;
    this.subscription = this.clearFilterObj.notifyChildemitter.subscribe((data) => {
      this.handleEvent(data);
    });
  }

};