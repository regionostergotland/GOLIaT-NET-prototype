/**
 * Created by matjazhi on 27.7.2015.
 */
if (!window.ehrComponentsLib)window.ehrComponentsLib = {};
window.ehrComponentsLib.DatastoreFilterQuery = function () {
};
window.ehrComponentsLib.DatastoreFilterQuery.prototype.query = function (uri, filterModel, onResultCallback, onErrorCallback) {
    if (!uri) {
        console.log("INFO DatastoreFilterQuery.query no uri value");
        onResultCallback(null)
    }
    var options = {
        data: filterModel,
        success: function (result) {
            onResultCallback(result);
        },
        error: onErrorCallback
    };
    $.ajax(uri, options);
};


var ehrAngularModule = angular.module('thinkehrForms4');
ehrAngularModule.factory('datastoreFilterQueryService', function () {
    return new window.ehrComponentsLib.DatastoreFilterQuery();
    /*return {
     query: function (uri, filterModel, onResultCallback) {

     //var uri = '//parent.marand.si/parent/terminology-adapter/rest/terminology/codesystem/HipArthroplastyComponent/entities/query';
     var resPromise = $http.get(uri, {params: filterModel}).then(function (resultObj) {
     return resultObj.data
     });
     if(onResultCallback){
     resPromise.then(function (res) {
     onResultCallback(res)
     })
     }else{
     return resPromise
     }
     }
     };*/
});


window.ehrComponentsLib.DatastoreFilterTestQuery = function () {
};
window.ehrComponentsLib.DatastoreFilterTestQuery.prototype.query = function (uri, filterModel, onResultCallback) {
    var _addToFilteredDataRecursive = function (keyHierarchy, filterModel, item, addToFilteredData) {
        if (keyHierarchy.length < 1) {
            return true;
        }
        var checkCurrKey = keyHierarchy.splice(0, 1)[0];
        var checkNext = false;
        if (filterModel[checkCurrKey]) {
            if (item[checkCurrKey]) {
                if (item[checkCurrKey].toLowerCase().indexOf(filterModel[checkCurrKey].toLowerCase()) > -1) {
                    checkNext = true;
                }
            }
        } else {
            checkNext = true;
        }
        if (checkNext) {
            if (!addToFilteredData[checkCurrKey]) {
                addToFilteredData[checkCurrKey] = {}
            }
            addToFilteredData[checkCurrKey][item[checkCurrKey]] = item;
        }
        return checkNext ? _addToFilteredDataRecursive(keyHierarchy, filterModel, item, addToFilteredData) : false;
    };

    var _data = [
        {id: 1, country: "Albania", city: "albC1"},
        {id: 2, country: "Albania", city: "albC2"},
        {id: 3, country: "Albania", city: "albC3"},
        {id: 4, country: "Bilbao", city: "bilC1"},
        {id: 5, country: "Bilbao", city: "bilC2"},
        {id: 6, country: "Bilbao", city: "bilC3"},
        {id: 7, country: "Bilbao", city: "bilC4"},
        {id: 8, country: "Costa Rica", city: "costa rica C1"},
        {id: 9, country: "Costa Rica", city: "costa rica C2"},
        {id: 10, country: "Costa Rica", city: "a1costa rica C2"},
        {id: 11, country: "Costa Rica", city: "costa rica C3"}
    ];


    var keyHierarchy = ['country', 'city'];
    var filteredData = {};
    _data.forEach(function (item) {
        _addToFilteredDataRecursive(keyHierarchy.slice(), filterModel, item, filteredData);
    }, this);
    var filteredDataByKey = {};
    for (var key in filterModel) {
        var currKeyArr = [];
        for (var keyVal in filteredData[key]) {
            //!!
            currKeyArr.push(filteredData[key][keyVal]);
        }
        filteredDataByKey[key] = currKeyArr;
    }

    onResultCallback(filteredDataByKey);
};/* Concatenated */
/**
 * Created by matjazhi on 24.7.2015.
 */
if (!window.ehrComponentsLib)window.ehrComponentsLib = {};
window.ehrComponentsLib.CompoundAutocompleteFieldGroup = function (datastore) {
    this.components = [];
    this.datastore = datastore;
    this._datastoreUri = null;
};

window.ehrComponentsLib.CompoundAutocompleteFieldGroup.prototype.registerCompoundField = function (key, fieldComponent, setValueFn) {
    this.components.push({key: key, fieldComponent: fieldComponent, setValue: setValueFn});
};

window.ehrComponentsLib.CompoundAutocompleteFieldGroup.prototype.updateFieldsDatasource = function (forFieldId) {
    var filterModel = {};
    var forAutocompleteComponent;

    var areObjectPropValuesEqual = function (filterModel, currItem) {
        for (var p in filterModel) {
            if (!filterModel.hasOwnProperty(p)) continue;
            if (filterModel[p] === currItem[p]) continue;
            return false;
        }
        return true;
    };
    var removeMatchedPropItems = function (filterModel, queryResultArr) {
        var removeFromArr = queryResultArr.slice();
        for (var i = removeFromArr.length - 1; i > -1; i--) {
            var currItem = removeFromArr[i];
            if (areObjectPropValuesEqual(filterModel, currItem)) {
                removeFromArr.splice(i, 1);
            }
        }
        return removeFromArr;
    };

    this.components.forEach(function (compDef) {
        filterModel[compDef.key] = compDef.fieldComponent.value().trim();
        if (compDef.key == forFieldId)forAutocompleteComponent = compDef.fieldComponent
    });
    if (forAutocompleteComponent) {
        this.datastore.query(this._datastoreUri, filterModel, function (queryResultArr) {
            queryResultArr = removeMatchedPropItems(filterModel, queryResultArr);
            var currValue = forAutocompleteComponent.value();
            var dataSource = new kendo.data.DataSource({
                data: queryResultArr
            });
            forAutocompleteComponent.setDataSource(dataSource);
            forAutocompleteComponent.value(currValue);
            forAutocompleteComponent.search(currValue);
            //console.log("on data len=", queryResultArr.length);
        });
        return true;
    }

    return false;
};

window.ehrComponentsLib.CompoundAutocompleteFieldGroup.prototype.setCompoundFieldValues = function (item) {
    this.components.forEach(function (compDef) {
        compDef.setValue(item[compDef.key]);
    })
};

window.ehrComponentsLib.CompoundAutocompleteFieldGroup.prototype.allFieldsEmpty = function () {
    var currVal;
    for (var i = 0; i < this.components.length; i++) {
        currVal = this.components[i].fieldComponent.value();
        if (currVal != null && currVal != '')return false;
    }
    return true;
};

window.ehrComponentsLib.CompoundAutocompleteFieldGroup.prototype.setDatastoreUri = function (datastoreUri) {
    if (!datastoreUri) {
        console.log("INFO CompoundAutocompleteFieldGroup setting empty datastoreUri current datastoreUri=", this._datastoreUri);
        return;
    }
    this._datastoreUri = datastoreUri;
};

window.ehrComponentsLib.CompoundAutocompleteFieldGroup.groupsManager = new function () {
    var compoundGroups = [];

    this.getFieldGroupById = function (groupId, datastore, underParentContainer) {
        groupId = groupId.toString();

        for (var i = 0; i < compoundGroups.length; i++) {
            if(compoundGroups[i].groupId==groupId && compoundGroups[i].underParentMultiContainer===underParentContainer) {
                return compoundGroups[i].autocompleteFieldGroup;
            }
        }
        var newGroup = {
            autocompleteFieldGroup: new window.ehrComponentsLib.CompoundAutocompleteFieldGroup(datastore),
            groupId: groupId,
            underParentMultiContainer: underParentContainer
        };
        compoundGroups.push(newGroup);

        return newGroup.autocompleteFieldGroup;
    }

};


var ehrAngularModule = angular.module('thinkehrForms4');

ehrAngularModule.factory('compoundFieldGroupService', function () {
    return {
        getFieldGroupById: window.ehrComponentsLib.CompoundAutocompleteFieldGroup.groupsManager.getFieldGroupById
    }
});
/* Concatenated */
//definition of ThinkEHR custom function for compound autocomplete fields
if (!window.ehrComponentsLib)window.ehrComponentsLib = {};
window.ehrComponentsLib.compoundAutocompleteFieldCustomFunction = (function (datastore) {

    /*var CompoundAutocompleteFieldGroup = function () {
        this.components = [];
    };

    CompoundAutocompleteFieldGroup.prototype.registerCompoundField = function (key, fieldComponent, setValueFn) {
        this.components.push({key: key, fieldComponent: fieldComponent, setValue: setValueFn});
    };


    CompoundAutocompleteFieldGroup.prototype.updateFieldsDatasource = function (forFieldId) {
        var filterModel = {};
        var forAutocompleteComponent;

        var areObjectPropValuesEqual=function(filterModel, currItem) {
            for ( var p in filterModel ) {
                if ( ! filterModel.hasOwnProperty( p ) ) continue;
                if( filterModel[p] === currItem[p] ) continue;
                return false;
            }
            return true;
        };
        var removeMatchedPropItems = function (filterModel, queryResultArr){
            var removeFromArr = queryResultArr.slice();
            for (var i = removeFromArr.length-1; i>-1; i--) {
                var currItem = removeFromArr[i];
                if(areObjectPropValuesEqual(filterModel,currItem)) {
                    removeFromArr.splice( i, 1 );
                }
            }
            return removeFromArr;
        };

        this.components.forEach(function (compDef) {
            filterModel[compDef.key] = compDef.fieldComponent.value().trim();
            if (compDef.key == forFieldId)forAutocompleteComponent = compDef.fieldComponent
        });
        if (forAutocompleteComponent) {
            var onQueryResult = function (queryResultArr) {
                queryResultArr=removeMatchedPropItems(filterModel,queryResultArr);
                var currValue = forAutocompleteComponent.value();
                var dataSource = new kendo.data.DataSource({
                    data: queryResultArr
                });
                forAutocompleteComponent.setDataSource(dataSource);
                forAutocompleteComponent.value(currValue);
                forAutocompleteComponent.search(currValue);
                console.log("on data len=", queryResultArr.length)
            };
            datastore.query(filterModel, onQueryResult);
            return true
        }

        return false;
    };

    CompoundAutocompleteFieldGroup.prototype.setCompoundFieldValues = function (item) {
        this.components.forEach(function (compDef) {
            compDef.setValue(item[compDef.key]);
        })
    };

    CompoundAutocompleteFieldGroup.prototype.allFieldsEmpty = function () {
        var currVal;
        for (var i = 0; i < this.components.length; i++) {
            currVal = this.components[i].fieldComponent.value();
            if (currVal != null && currVal != '')return false;
        }
        return true;
    };

    CompoundAutocompleteFieldGroup.groupsManager = new function () {
        var compoundGroups = {};
        this.getFieldGroupById = function (groupId) {
            groupId = groupId.toString();
            if (!compoundGroups[groupId]) {
                compoundGroups[groupId] = new CompoundAutocompleteFieldGroup();
            }
            return compoundGroups[groupId];
        }

     };*/

    var thinkEHRCustomFunctionToExecute = function (initService) {

        throw new Error("ehrComponentsLib.compoundAutocompleteFieldCustomFunction is deprecated use ehrComponentsLib.compoundAutocompleteFieldCustomFunctionNgExt");
        var deferred = initService.deferred;
        var model = initService.model;
        //setTimeout(function () {

        if ($("#autocomplete-component-style", document.head).length < 1) {
            $(document.head).append("<style id='autocomplete-component-style'> " +
                ".info { display: block; line-height: 22px; padding: 0 5px 5px 0; color: #36558e; } #shipping { width: 482px; height: 152px; padding: 110px 0 0 30px; background: url('../content/web/autocomplete/shipping.png') transparent no-repeat 0 0; margin: 100px auto; } .k-autocomplete { width: 250px; vertical-align: middle; } .hint { line-height: 22px; color: #aaa; font-style: italic; font-size: .9em; color: #7496d4; } " +
                ".compound-list-btn { display:inline-block; border: solid 1px #ccc; cursor: pointer; border-radius: 5px; padding: 5px; margin: 5px; text-align: center; }" +
                ".compound-list-btn:hover{color:#fff; background-color:#999}" +
                "</style>");
        }
        var el = jQuery("<div class='compound-autocomplete-field'><input class='autocomplete-field' /></div>");

        //create AutoComplete UI component

        var annotationsDataFieldName = 'compoundDataKey';
        var annotationsFieldGroupIdName = 'compoundGroupId';
        var annotationsDatastoreUriName = 'datastoreUri';

        var fieldsGroup, annDataFieldNameValue;

        if (model.getViewConfig().annotations.compoundDataKey) {
            var annGroupId = model.getViewConfig().annotations[annotationsFieldGroupIdName];
            if (annGroupId == null)annGroupId = '';
            fieldsGroup = window.ehrComponentsLib.CompoundAutocompleteFieldGroup.groupsManager.getFieldGroupById(annGroupId, datastore);
            var datastoreUri = model.getViewConfig().annotations[annotationsDatastoreUriName];
            fieldsGroup.setDatastoreUri(datastoreUri);
            annDataFieldNameValue = model.getViewConfig().annotations[annotationsDataFieldName];
        }

        var $autocompleteField = $(".autocomplete-field", el);

        var setViewEventHandlers = function (event) {
            var kendoAutocompleteComponent = event.sender;
            $('.compound-fields-fill', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                ev.preventDefault();
                kendoAutocompleteComponent.close();
                fillCompoundFieldsFromItemIndex($(this.parentElement).data("index"));
            });
            $('.compound-field-clear', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                ev.preventDefault();
                setValueFunction('');
                fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
            });
            $('.compound-fields-clear', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                ev.preventDefault();
                fieldsGroup.setCompoundFieldValues({});
                fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                updatePopupControlsDisplay(kendoAutocompleteComponent)
            });
        };
        var headerTemplStr =  model.getViewConfig().annotations.headerTemplate?model.getViewConfig().annotations.headerTemplate:'<div style="font-weight: bold; text-align: center; "><span class="compound-field-clear compound-list-btn">clear #: currentFieldLabel #</span> <span class="compound-fields-clear compound-list-btn">clear all</span></div>';
        var itemTitleTemplate = model.getViewConfig().annotations.itemTitleTemplate?model.getViewConfig().annotations.itemTitleTemplate:'<span class="k-state-default" style="font-weight: bold;">#:data.' + annDataFieldNameValue + '#</span>';
        var itemTextTemplate = model.getViewConfig().annotations.itemBodyTemplate?model.getViewConfig().annotations.itemBodyTemplate:'<div class="compound-fields-fill compound-list-btn"> #:data.code#, #:data.part#, #:data.manufacturer#, #:data.material# </div> ';
        var bodyTemplateStr = itemTitleTemplate+ itemTextTemplate;

        var localizedName = model.getLocalizedName();
        var kendoAutocompleteComponent = $autocompleteField.kendoAutoComplete({
            filter: "contains",//"startswith",
            placeholder: 'Select '+ localizedName+" ...",
            separator: "",
            highlightFirst: false,
            minLength: 0,
            headerTemplate:kendo.template(headerTemplStr)({currentFieldLabel:localizedName}),
            template: kendo.template(bodyTemplateStr),
            dataTextField: annDataFieldNameValue,
            dataBound: setViewEventHandlers,
            valuePrimitive: true,
            height:'350'
        }).data("kendoAutoComplete");

        var fillCompoundFieldsFromItemIndex = function ( itemIndex) {
            var selectedItem = kendoAutocompleteComponent.dataSource.at( itemIndex);
            if (selectedItem) {
                fieldsGroup.setCompoundFieldValues(selectedItem);
            }
        };

        var setValueFunction = function (value) {
            if(value==null)value = '';
            initService.withinAngular(function () {
                model.textValue(value);
            });
        };

        var updatePopupControlsDisplay = function (kendoAutocompleteComponent) {
            var popupElement = kendoAutocompleteComponent.list;
            var allFieldsEmpty = fieldsGroup.allFieldsEmpty();
            allFieldsEmpty ? $('.compound-fields-clear', popupElement).hide() : $('.compound-fields-clear', popupElement).show();
            allFieldsEmpty || (kendoAutocompleteComponent.value() == null || kendoAutocompleteComponent.value() == '' ) ? $('.compound-field-clear', popupElement).hide() : $('.compound-field-clear', popupElement).show();
        };

        if (annDataFieldNameValue) {
            fieldsGroup.registerCompoundField(annDataFieldNameValue, kendoAutocompleteComponent, setValueFunction);
        }

        kendoAutocompleteComponent.bind("change", function () {
            setValueFunction(kendoAutocompleteComponent.value());
        });

        kendoAutocompleteComponent.bind("open", function () {
            updatePopupControlsDisplay(kendoAutocompleteComponent);
        });

        $autocompleteField.on("focus", function () {
            fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
        });
        $autocompleteField.on("input", function () {
            var newVal = $(this).val();
            fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
            if (newVal == '')kendoAutocompleteComponent.search('');
            setValueFunction(newVal);
        });

        var onModelValueUpdated = function (model) {
            kendoAutocompleteComponent.value(model.textValue());
            updatePopupControlsDisplay(kendoAutocompleteComponent);
        };

        //onModelValueUpdated(model);

        initService.watchExpression(function () {
            return model.textValue();
        }, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                onModelValueUpdated(model);
            }
        });

        // Resolve inside angular because we're in a asynchronous callback outside angular
        // Otherwise this wrapping is unnecessary.
        //initService.rootScope.$apply(function () {

        deferred.resolve(
            {
                element: el,
                onDestroy: function (element, $scope) {
                    console.log("Custom element destroy called", element, $scope);
                },
                onModelRefresh: function (model) {
                    onModelValueUpdated(model);
                }
            }
        );
        //});
        //}, 150);


    };

    return thinkEHRCustomFunctionToExecute;

}(new window.ehrComponentsLib.DatastoreFilterQuery()));/* Concatenated */
//definition of ThinkEHR custom function for compound autocomplete fields
if (!window.ehrComponentsLib)window.ehrComponentsLib = {};
window.ehrComponentsLib.compoundAutocompleteFieldCustomFunctionNg = (function () {

    var thinkEHRCustomFunctionToExecute = function (initService) {
        throw new Error("ehrComponentsLib.compoundAutocompleteFieldCustomFunctionNg is deprecated use ehrComponentsLib.compoundAutocompleteFieldCustomFunctionNgExt");
        //setTimeout(function () {


        // Resolve inside angular because we're in a asynchronous callback outside angular
        // Otherwise this wrapping is unnecessary.
        //initService.rootScope.$apply(function () {

        //initService.scope.ehrComponentModel=initService.model;
        var template = "<ehr-compound-autocomplete-group-item></ehr-compound-autocomplete-group-item>";
        var appendElementToView = initService.compile(template)(initService.scope);

        initService.deferred.resolve(
            {
                element: appendElementToView,
                onDestroy: function (element, $scope) {
                    console.log("Custom element destroy called", element, $scope);
                },
                onModelRefresh: function (model) {
                }
            }
        );
        //});
        //}, 150);

    };

    return thinkEHRCustomFunctionToExecute

}());


var ehrAngularModule = angular.module('thinkehrForms4');
ehrAngularModule.directive("ehrCompoundAutocompleteGroupItem", function (compoundFieldGroupService, datastoreFilterQueryService) {

        if ($("#autocomplete-component-style", document.head).length < 1) {
            $(document.head).append("<style id='autocomplete-component-style'> " +
                ".info { display: block; line-height: 22px; padding: 0 5px 5px 0; color: #36558e; } #shipping { width: 482px; height: 152px; padding: 110px 0 0 30px; background: url('../content/web/autocomplete/shipping.png') transparent no-repeat 0 0; margin: 100px auto; } .k-autocomplete { width: 250px; vertical-align: middle; } .hint { line-height: 22px; color: #aaa; font-style: italic; font-size: .9em; color: #7496d4; } " +
                ".compound-list-btn { display:inline-block; border: solid 1px #ccc; cursor: pointer; border-radius: 5px; padding: 5px; margin: 5px; text-align: center; }" +
                ".compound-list-btn:hover{color:#fff; background-color:#999}" +
                "</style>");
        }

        return {
            restrict: "E",
            template: "<div class='compound-autocomplete-field'><input class='autocomplete-field' /></div>",
            scope: true,
            link: function (scope, iElement, iAttrs, controller, transcludeFn) {
                var ehrModel = scope.model.getDelegateModel();
                //create AutoComplete UI component

                var annotationsDataFieldName = 'compoundDataKey';
                var annotationsFieldGroupIdName = 'compoundGroupId';
                var annotationsDatastoreUriName = 'datastoreUri';

                var fieldsGroup, annDataFieldNameValue;

                if (ehrModel.getViewConfig().annotations.compoundDataKey) {
                    var annGroupId = ehrModel.getViewConfig().annotations[annotationsFieldGroupIdName];
                    if (annGroupId == null)annGroupId = '';
                    fieldsGroup = compoundFieldGroupService.getFieldGroupById(annGroupId, datastoreFilterQueryService);
                    var datastoreUri = ehrModel.getViewConfig().annotations[annotationsDatastoreUriName];
                    fieldsGroup.setDatastoreUri(datastoreUri);
                    annDataFieldNameValue = ehrModel.getViewConfig().annotations[annotationsDataFieldName];
                }

                var $autocompleteField = $(".autocomplete-field", iElement);

                var setViewEventHandlers = function (event) {
                    var kendoAutocompleteComponent = event.sender;
                    $('.compound-fields-fill', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                        ev.preventDefault();
                        kendoAutocompleteComponent.close();
                        fillCompoundFieldsFromItemIndex($(this.parentElement).data("index"));
                    });
                    $('.compound-field-clear', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                        ev.preventDefault();
                        setValueFunction('');
                        fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                    });
                    $('.compound-fields-clear', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                        ev.preventDefault();
                        fieldsGroup.setCompoundFieldValues({});
                        fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                        updatePopupControlsDisplay(kendoAutocompleteComponent)
                    });
                };

                var localizedName = ehrModel.getLocalizedName();
                var headerTemplStr =  ehrModel.getViewConfig().annotations.headerTemplate?ehrModel.getViewConfig().annotations.headerTemplate:'<div style="font-weight: bold; text-align: center; "><span class="compound-field-clear compound-list-btn">clear #: currentFieldLabel #</span> <span class="compound-fields-clear compound-list-btn">clear all</span></div>';
                var itemTitleTemplate = ehrModel.getViewConfig().annotations.itemTitleTemplate?ehrModel.getViewConfig().annotations.itemTitleTemplate:'<span class="k-state-default" style="font-weight: bold;">#:data.' + annDataFieldNameValue + '#</span>';
                var itemTextTemplate = ehrModel.getViewConfig().annotations.itemBodyTemplate?ehrModel.getViewConfig().annotations.itemBodyTemplate:'<div class="compound-fields-fill compound-list-btn"> #:data.code#, #:data.part#, #:data.manufacturer#, #:data.material# </div> ';
                var bodyTemplateStr = itemTitleTemplate+ itemTextTemplate;
                var kendoAutocompleteComponent = $autocompleteField.kendoAutoComplete({
                    filter: "contains",//"startswith",
                    placeholder: 'Select ' + localizedName + " ...",
                    separator: "",
                    highlightFirst: false,
                    minLength: 0,
                    headerTemplate: kendo.template(headerTemplStr)({currentFieldLabel: localizedName}),
                    template: kendo.template(bodyTemplateStr),
                    dataTextField: annDataFieldNameValue,
                    dataBound: setViewEventHandlers,
                    valuePrimitive: true,
                    height: '350'
                }).data("kendoAutoComplete");

                var fillCompoundFieldsFromItemIndex = function (itemIndex) {
                    var selectedItem = kendoAutocompleteComponent.dataSource.at(itemIndex);
                    if (selectedItem) {
                        fieldsGroup.setCompoundFieldValues(selectedItem);
                    }
                };

                var setValueFunction = function (value) {
                    if (value == null)value = '';
                    scope.$apply(function () {
                        ehrModel.textValue(value);
                    });
                };

                var updatePopupControlsDisplay = function (kendoAutocompleteComponent) {
                    var popupElement = kendoAutocompleteComponent.list;
                    var allFieldsEmpty = fieldsGroup.allFieldsEmpty();
                    allFieldsEmpty ? $('.compound-fields-clear', popupElement).hide() : $('.compound-fields-clear', popupElement).show();
                    allFieldsEmpty || (kendoAutocompleteComponent.value() == null || kendoAutocompleteComponent.value() == '' ) ? $('.compound-field-clear', popupElement).hide() : $('.compound-field-clear', popupElement).show();
                };

                if (annDataFieldNameValue) {
                    fieldsGroup.registerCompoundField(annDataFieldNameValue, kendoAutocompleteComponent, setValueFunction);
                }

                kendoAutocompleteComponent.bind("change", function () {
                    setValueFunction(kendoAutocompleteComponent.value());
                });

                kendoAutocompleteComponent.bind("open", function () {
                    updatePopupControlsDisplay(kendoAutocompleteComponent);
                });

                $autocompleteField.on("focus", function () {
                    fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                });

                $autocompleteField.on("input", function () {
                    var newVal = $(this).val();
                    fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                    if (newVal == '')kendoAutocompleteComponent.search('');
                    setValueFunction(newVal);
                });

                scope.$watch(function () {
                    return ehrModel.textValue();
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        kendoAutocompleteComponent.value(newValue);
                        updatePopupControlsDisplay(kendoAutocompleteComponent);
                    }
                });
            }
        }
    }
);/* Concatenated */
//definition of ThinkEHR custom function for compound autocomplete fields
if (!window.ehrComponentsLib) window.ehrComponentsLib = {};
window.ehrComponentsLib.compoundAutocompleteFieldCustomFunctionNgExt = (function () {

    var thinkEHRCustomFunctionToExecute = function (formApi) {
        var ehrTFElement = formApi.element;

        var inputEl = $("input", ehrTFElement);
        setTimeout(function () {
            var inputEl1 = $("input", ehrTFElement);
            inputEl1.attr("ehr-compound-field-input-extension", "");
            formApi.scope._formApi = formApi;
            formApi.compile(inputEl1)(formApi.scope);
        })

    };
    return thinkEHRCustomFunctionToExecute;

}());
var ehrAngularModule = angular.module('thinkehrForms4');

ehrAngularModule.directive("ehrCompoundFieldInputExtension", function (compoundFieldGroupService, datastoreFilterQueryService) {

        if ($("#autocomplete-component-style", document.head).length < 1) {
            $(document.head).append("<style id='autocomplete-component-style'> " +
                ".info { display: block; line-height: 22px; padding: 0 5px 5px 0; color: #36558e; } #shipping { width: 482px; height: 152px; padding: 110px 0 0 30px; background: url('../content/web/autocomplete/shipping.png') transparent no-repeat 0 0; margin: 100px auto; } .k-autocomplete { width: 250px; vertical-align: middle; } .hint { line-height: 22px; color: #aaa; font-style: italic; font-size: .9em; color: #7496d4; } " +
                ".compound-list-btn { display:inline-block; border: solid 1px #ccc; cursor: pointer; border-radius: 5px; padding: 5px; margin: 5px; text-align: center; }" +
                ".compound-list-btn:hover{color:#fff; background-color:#999}" +
                "</style>");
        }

        return {
            restrict: "A",
            scope: true,
            link: function (scope, iElement, iAttrs, controller, transcludeFn) {
                var ehrModel = scope.model;
                //create AutoComplete UI component
                var annotationsDataFieldName = 'compoundDataKey';
                var annotationsFieldGroupIdName = 'compoundGroupId';
                var annotationsDatastoreUriName = 'datastoreUri';

                var fieldsGroup, annDataFieldNameValue;

                if (ehrModel.getViewConfig().annotations.compoundDataKey) {
                    var annGroupId = ehrModel.getViewConfig().annotations[annotationsFieldGroupIdName];
                    if (annGroupId == null) {
                        annGroupId = '';
                    }
                    var parentContainer;
                    if (annGroupId) {
                        parentContainer = scope._formApi.findModelWithTag(annGroupId);
                    }
                    fieldsGroup = compoundFieldGroupService.getFieldGroupById(annGroupId, datastoreFilterQueryService, parentContainer);
                    var datastoreUri = ehrModel.getViewConfig().annotations[annotationsDatastoreUriName];
                    fieldsGroup.setDatastoreUri(datastoreUri);
                    annDataFieldNameValue = ehrModel.getViewConfig().annotations[annotationsDataFieldName];
                }

                var $autocompleteField = $(iElement);

                var setViewEventHandlers = function (event) {
                    var kendoAutocompleteComponent = event.sender;
                    $('.compound-fields-fill', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                        ev.preventDefault();
                        kendoAutocompleteComponent.close();
                        fillCompoundFieldsFromItemIndex($(this.parentElement).data("offset-index"));
                    });
                    $('.compound-field-clear', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                        ev.preventDefault();
                        setValueFunction('');
                        fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                    });
                    $('.compound-fields-clear', kendoAutocompleteComponent.list.element).off('click').on('click', function (ev) {
                        ev.preventDefault();
                        fieldsGroup.setCompoundFieldValues({});
                        fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                        updatePopupControlsDisplay(kendoAutocompleteComponent);
                    });
                };

                var localizedName = ehrModel.getLocalizedName();
                var headerTemplStr = ehrModel.getViewConfig().annotations.headerTemplate ? ehrModel.getViewConfig().annotations.headerTemplate : '<div style="font-weight: bold; text-align: center; "><span class="compound-field-clear compound-list-btn">clear #: currentFieldLabel #</span> <span class="compound-fields-clear compound-list-btn">clear all</span></div>';
                var itemTitleTemplate = ehrModel.getViewConfig().annotations.itemTitleTemplate ? ehrModel.getViewConfig().annotations.itemTitleTemplate : '<span class="k-state-default" style="font-weight: bold;">#:data.' + annDataFieldNameValue + '#</span>';
                var itemTextTemplate = ehrModel.getViewConfig().annotations.itemBodyTemplate ? ehrModel.getViewConfig().annotations.itemBodyTemplate : '<div class="compound-fields-fill compound-list-btn"> #:data.code#, #:data.part#, #:data.manufacturer#, #:data.material# </div> ';
                var bodyTemplateStr = itemTitleTemplate + itemTextTemplate;

                var kendoAutocompleteComponent = $autocompleteField.kendoAutoComplete({
                    filter: "contains",//"startswith",
                    placeholder: 'Select ' + localizedName + " ...",
                    separator: "",
                    highlightFirst: false,
                    minLength: 0,
                    headerTemplate: kendo.template(headerTemplStr)({currentFieldLabel: localizedName}),
                    template: kendo.template(bodyTemplateStr),
                    noDataTemplate: "no data",
                    dataTextField: annDataFieldNameValue,
                    dataBound: setViewEventHandlers,
                    valuePrimitive: true,
                    height: '450'
                }).data("kendoAutoComplete");

                var fillCompoundFieldsFromItemIndex = function (itemIndex) {
                    var selectedItem = kendoAutocompleteComponent.dataSource.at(itemIndex);
                    if (selectedItem) {
                        fieldsGroup.setCompoundFieldValues(selectedItem);
                    }
                };

                var setValueFunction = function (value) {
                    if (value == null) value = '';
                    scope.$apply(function () {
                        ehrModel.textValue(value);
                    });
                };

                var updatePopupControlsDisplay = function (kendoAutocompleteComponent) {
                    var popupElement = kendoAutocompleteComponent.list;
                    var allFieldsEmpty = fieldsGroup.allFieldsEmpty();

                    allFieldsEmpty ? $('.compound-fields-clear', popupElement).hide() : $('.compound-fields-clear', popupElement).show();
                    allFieldsEmpty || (kendoAutocompleteComponent.value() == null || kendoAutocompleteComponent.value() == '' ) ? $('.compound-field-clear', popupElement).hide() : $('.compound-field-clear', popupElement).show();
                };

                if (annDataFieldNameValue) {
                    fieldsGroup.registerCompoundField(annDataFieldNameValue, kendoAutocompleteComponent, setValueFunction);
                }

                kendoAutocompleteComponent.bind("change", function () {
                    setValueFunction(kendoAutocompleteComponent.value());
                });

                kendoAutocompleteComponent.bind("open", function () {
                    updatePopupControlsDisplay(kendoAutocompleteComponent);
                });

                $autocompleteField.on("focus", function () {
                    fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                });

                $autocompleteField.on("input", function () {
                    var newVal = $(this).val();
                    fieldsGroup.updateFieldsDatasource(annDataFieldNameValue);
                    if (newVal == '') kendoAutocompleteComponent.search('');
                    setValueFunction(newVal);
                });

                scope.$watch(function () {
                    return ehrModel.textValue();
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        kendoAutocompleteComponent.value(newValue);

                        updatePopupControlsDisplay(kendoAutocompleteComponent);
                    }
                });
            }
        }
    }
);

module.exports = {
    ehrComponentsLib: window.ehrComponentsLib
};