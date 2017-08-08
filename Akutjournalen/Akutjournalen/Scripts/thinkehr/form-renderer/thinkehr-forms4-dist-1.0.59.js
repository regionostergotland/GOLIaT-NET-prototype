if (!thinkehr) {
    var thinkehr = {};
}
if (!thinkehr.f4) {
    thinkehr.f4 = {
        "version": "1.0.59"
    };
    thinkehr.f4.PREFIX = "ehr-";
}

if (!thinkehr.f4.util) {
    thinkehr.f4.util = {};
}

if (!thinkehr.f4.ng) {
    thinkehr.f4.ng = {};
}

if (!thinkehr.f4.ng.CTRL_NAME) {
    thinkehr.f4.ng.CTRL_NAME = thinkehr.f4.PREFIX + "FormCtrl";
}
/* Concatenated */
/**
 * @author matijak
 * @since 6.8.2014
 */

// Namespace definitions

(function namespace() {

    // This code is a sub-classing routine from the JavaScript Ninja book, Chapter 6, listing 21

    //noinspection JSCheckFunctionSignatures
    var initializing = false,
        superPattern =  // Determine if functions can be serialized
            /xyz/.test(function () {
                //noinspection BadExpressionStatementJS,JSUnresolvedVariable
                xyz;
            }) ? /\b_super\b/ : /.*/;       //#1

    // Creates a new Class that inherits from this class
    Object._extendM = function (properties) {                           //#2
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;                                              //#3
        var proto = new this();                                           //#3
        initializing = false;                                             //#3

        // Copy the properties over onto the new prototype
        for (var name in properties) {                                    //#4
            // Check if we're overwriting an existing function
            //noinspection JSUnfilteredForInLoop
            proto[name] = typeof properties[name] == "function" &&
                typeof _super[name] == "function" &&
                superPattern.test(properties[name]) ?
                (function (name, fn) {                                        //#5
                    return function () {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        //noinspection JSUnfilteredForInLoop
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, properties[name]) :
                properties[name];
        }

        // The dummy class constructor
        function Class() {                                                   //#6
            // All construction is actually done in the init method
            //noinspection JSUnresolvedVariable
            if (!initializing && this.init) { //noinspection JSUnresolvedVariable
                this.init.apply(this, arguments);
            }
        }

        // Populate our constructed prototype object
        Class.prototype = proto;                                             //#7

        // Enforce the constructor to be what we expect
        Class.constructor = Class;                                           //#8

        // And make this class extension-capable
        Class._extendM = arguments.callee;                                   //#9

        return Class;
    };


    // enumerations
    thinkehr.f4.enumeration = function (namesToValues) {
        // Constructor, just throws an error since enumerations can't be instantiated
        var enumeration = function () {
            throw "Can't instantiate enumerations";
        };

        var proto = enumeration.prototype = {
            constructor: enumeration,

            toString: function () {
                return this.name;
            },

            toJSON: function () {
                return this.name;
            },

            valueOf: function () {
                return this.value;
            }
        };

        enumeration.values = [];

        for (var name in namesToValues) {
            var e = {};
            for (var prop in proto) {
                //noinspection JSUnfilteredForInLoop
                e[prop] = proto[prop];
            }
            e.name = name;
            //noinspection JSUnfilteredForInLoop
            e.value = namesToValues[name];
            //noinspection JSUnfilteredForInLoop
            enumeration[name] = e;
            enumeration.values.push(e);
        }

        enumeration.foreach = function (f, c) {
            for (var i = 0; i < this.values.length; i++) {
                f.call(c, this.values[i]);
            }
        };

        enumeration.fromString = function (str) {
            if (!str) {
                return null;
            }

            var strLc = str.toLowerCase();

            for (var i = 0; i < this.values.length; i++) {
                var e = this.values[i];
                if (strLc === e.name.toLowerCase()) {
                    return e;
                }
            }

            return str;
        };

        return enumeration;
    };

    // extend
    thinkehr.f4._extend = function (from, to) {
        for (var prop in from) {
            if (from.hasOwnProperty(prop)) {
                to[prop] = from[prop];
            }
        }
    };


    // ViewConfig making------------------------------------------------------------------------------------------------------------------------

    function _parseSizeViewConfig(viewConfig, sizeJson) {
        var size = new thinkehr.f4.Size({viewConfig: viewConfig});
        for (var prop in sizeJson) {
            if (sizeJson.hasOwnProperty(prop)) {
                if (prop === "field") {
                    size.setField(thinkehr.f4.FieldSize.fromString(sizeJson[prop]));
                } else if (prop === "label") {
                    var lbl = parseInt(sizeJson[prop]);
                    size.setLabel(isNaN(lbl) ? thinkehr.f4.LabelSize.fromString(sizeJson[prop]) : lbl);
                } else {
                    size[prop] = sizeJson[prop];
                }
            }
        }

        return size;
    }

    function _parseLayoutViewConfig(viewConfig, layoutJson) {
        var layout = new thinkehr.f4.Layout({viewConfig: viewConfig});
        for (var prop in layoutJson) {
            if (layoutJson.hasOwnProperty(prop)) {
                if (prop === "field") {
                    if (layoutJson[prop]["align"]) {
                        layout.setFieldHorizontalAlignment(thinkehr.f4.FieldHorizontalAlignment.fromString(layoutJson[prop]["align"]));
                    }
                    if (layoutJson[prop]["valign"]) {
                        layout.setFieldVerticalAlignment(thinkehr.f4.FieldVerticalAlignment.fromString(layoutJson[prop]["valign"]));
                    }
                    _addPropsToObject(layoutJson[prop], layout, "field", ["align", "valign"]);
                } else if (prop === "label") {
                    if (layoutJson[prop]["align"]) {
                        layout.setLabelHorizontalAlignment(thinkehr.f4.LabelHorizontalAlignment.fromString(layoutJson[prop]["align"]));
                    }
                    if (layoutJson[prop]["valign"]) {
                        layout.setLabelVerticalAlignment(thinkehr.f4.LabelVerticalAlignment.fromString(layoutJson[prop]["valign"]));
                    }
                    _addPropsToObject(layoutJson[prop], layout, "label", ["align", "valign"]);
                } else {
                    layout[prop] = layoutJson[prop];
                }
            }
        }

        return layout;
    }

    function _parseLabelViewConfig(viewConfig, labelJson) {
        var label = new thinkehr.f4.Label({viewConfig: viewConfig});
        thinkehr.f4._extend(labelJson, label);

        return label;
    }

    function _parseFieldViewConfig(viewConfig, fieldJson) {
        var fieldObject = {};
        for (var fieldInputKey in fieldJson) {
            if (fieldJson.hasOwnProperty(fieldInputKey)) {
                if (isObject(fieldJson[fieldInputKey])) {
                    var field = new thinkehr.f4.Field({viewConfig: viewConfig});
                    var fieldInput = fieldJson[fieldInputKey];
                    thinkehr.f4._extend(fieldInput, field);

                    if (fieldInput.presentation) {
                        field.setPresentation(thinkehr.f4.FieldPresentation.fromString(fieldInput.presentation));
                    }

                    if (fieldInput.columns) {
                        var columns = parseInt(fieldInput.columns);
                        if (!isNaN(columns)) {
                            field.setColumns(columns);
                        }
                    }

                    if (fieldInput.lines) {
                        var lines = parseInt(fieldInput.lines);
                        if (!isNaN(lines)) {
                            field.setLines(lines);
                        }
                    }

                    fieldObject[fieldInputKey] = field;
                } else {
                    fieldObject[fieldInputKey] = fieldJson[fieldInputKey];
                }
            }
        }

        return fieldObject;
    }

    function _parseAdvancedViewConfig(viewConfig, advancedJson) {
        _addPropsToObject(advancedJson, viewConfig, "advanced", ["hidden", "readonly", "viewmode"]);

        if (advancedJson.hidden) {
            viewConfig.setHidden(advancedJson.hidden);
        }

        if (advancedJson.readonly) {
            viewConfig.setReadOnly(advancedJson.readonly);
        }

        if (advancedJson.viewmode) {
            viewConfig.setViewMode(advancedJson.viewmode);
        }

        return null;
    }

    function _parseMultiplicityViewConfig(viewConfig, multiplicityJson) {
        _addPropsToObject(multiplicityJson, viewConfig, "multiplicity", ["min", "max"]);

        if (multiplicityJson.min) {
            var min = parseInt(multiplicityJson.min);
            viewConfig.setMin(isNaN(min) ? multiplicityJson.min : min);
        }

        if (multiplicityJson.max) {
            var max = parseInt(multiplicityJson.max);
            viewConfig.setMax(isNaN(max) ? multiplicityJson.max : max);
        }

        return null;
    }

    function _addPropsToObject(from, to, toPropertyName, skip) {
        var added = 0;
        var tmpAdd = {};
        for (var prop in from) {
            if (from.hasOwnProperty(prop) && skip.indexOf(prop) < 0) {
                tmpAdd[prop] = from[prop];
                added++;
            }
        }

        if (added > 0) {
            to[toPropertyName] = tmpAdd;
        }
    }

    var _knownViewConfigProps = {
        "size": _parseSizeViewConfig,
        "layout": _parseLayoutViewConfig,
        "label": _parseLabelViewConfig,
        "field": _parseFieldViewConfig,
        "advanced": _parseAdvancedViewConfig,
        "multiplicity": _parseMultiplicityViewConfig
    };


    function parseViewConfig(viewConfigPlain) {

        var vc = new thinkehr.f4.ViewConfig();

        for (var prop in viewConfigPlain) {
            if (viewConfigPlain.hasOwnProperty(prop)) {
                var makerFunction = _knownViewConfigProps[prop];
                if (makerFunction) {
                    var propToAdd = makerFunction(vc, viewConfigPlain[prop]);
                    if (propToAdd) {
                        vc[prop] = propToAdd;
                    }
                }
                else {
                    vc[prop] = viewConfigPlain[prop];
                }
            }
        }

        return vc;
    }

    //--------------Parsing-------------------------------------------------------------------------------------------------------------------------------------

    function parseFormDescription(context, formDescription, values, dependencies) {
        var rootRmType = thinkehr.f4.RmType.fromString(formDescription.rmType);

        if (rootRmType !== thinkehr.f4.RmType.FORM_DEFINITION) {
            throw new Error("Root element is not form definition"); // Using this syntax cause of Jasmine
        }

        var rootObj = new thinkehr.f4.FormRootModel(formDescription);
        rootObj.setDescEl(formDescription);
        if (rootObj.children !== undefined) {
            delete  rootObj.children;
        }
        if (context) {
            rootObj.setContext(context);
        }
        _parseViewConfig(rootObj, formDescription);
        if (formDescription.children) {
            for (var i = 0; i < formDescription.children.length; i++) {
                _recursivelyParseDescription(rootObj, formDescription.children[i]);
            }
        }
        if (!values) {
            values = {};
        }
        rootObj.setValueNodeRef(values);
        _parseValues(rootObj, values, values);
        if (dependencies) {
            var ast = parseDependencies(rootObj, dependencies);
            rootObj.setDependencyNode(ast);

        }
        return rootObj;
    }

    function parseFormDescriptionSnippet(snippet, values, context) {
        var model = _recursivelyParseDescription(null, snippet, context);

        if (model) {
            if (!values) {
                values = {};
            }
            _parseValues(model, values, values);
        }

        return model;
    }

    function _recursivelyParseDescription(parentModel, descEl, context) {
        var model = _parseRmClassCreateObj(descEl);
        if(context && thinkehr.f4.util.isObject( context ) && model && model.setContext) {
            model.setContext(context);
        }

        var parseChildren = function (model, descEl) {
            if (descEl.children) {
                for (var i = 0; i < descEl.children.length; i++) {
                    _recursivelyParseDescription(model, descEl.children[i]);
                }
            }
        };

        if (model != null) {
            _parseViewConfig(model, descEl);
            var isCustomFnCustomComponent = model.isCustomFunctionCustomComponent(parentModel ? parentModel.getContext():null);

            if (parentModel && !isCustomFnCustomComponent) {
                parentModel.insertChildModelAfterLastOfSamePath(model, true);
            }

            _parseInputs(model, descEl);
            _checkMinAndMax(model); // Goddamn it why can't this be consistently an integer?
            if(!isCustomFnCustomComponent) {
                parseChildren(model, descEl);
            }

            if(isCustomFnCustomComponent){
                model = _createCustomModel(model, descEl);
                if(parentModel){
                    parentModel.insertChildModelAfterLastOfSamePath(model, true);
                }
                parseChildren(model, descEl);
            }

        } else {
            var custFnStr=_getAnnotation(descEl, "function");
            var hasCustomTag=_hasTag(descEl, "custom");
            if (thinkehr.f4.isCustomFunctionCustomComponent(custFnStr, hasCustomTag, parentModel.getContext())) {
                model = _createCustomModel(null, descEl);
                console.warn("Creating custom model without backing model, just descriptin for ", model.getPath());
            } else {
                console.warn("Skipping model creation for element: ", descEl);
            }
        }

        return model;
    }

    function _hasTag(descEl, tag) {
        return descEl.viewConfig && descEl.viewConfig.tags && descEl.viewConfig.tags.indexOf(tag) >= 0;
    }

    function _getAnnotation(descEl, annotation) {
        if (descEl.viewConfig && descEl.viewConfig.annotations && descEl.viewConfig.annotations[annotation] != undefined) {
            return descEl.viewConfig.annotations[annotation];
        } else {
            return null;
        }
    }

    function _checkMinAndMax(model) {
        if (model.min !== undefined && model.min !== null && !thinkehr.f4.util.isInteger(model.min)) {
            model.min = parseInt(model.min);
        }

        if (model.max !== undefined && model.max !== null && !thinkehr.f4.util.isInteger(model.max)) {
            model.max = parseInt(model.max);
        }
    }

    var getModelClassFromRmType = function (descEl) {
        if(descEl.rmType === thinkehr.f4.RmType.DV_TEXT.name && descEl.viewConfig && descEl.viewConfig.datasource && descEl.viewConfig.datasource.loadRemote) {
            descEl.rmType = thinkehr.f4.RmType.DV_CODED_TEXT.name;
            descEl.inputs = [
                {
                    "suffix": "code",
                    "type": "TEXT",
                    "terminology": descEl.viewConfig.datasource.loadRemoteUrl
                },
                {
                    "suffix": "value",
                    "type": "TEXT",
                    "terminology": descEl.viewConfig.datasource.loadRemoteUrl
                }
            ];
            descEl.viewConfig.field = {
                "code": {
                    "presentation": "textfield"
                },
                "value": {
                    "presentation": "textfield"
                }
            };
        }
        return thinkehr.f4._rmTypeToClassMap[descEl.rmType];
    };

    function _parseRmClassCreateObj(descEl) {
        var cl = getModelClassFromRmType(descEl);
        var rmType;
        var isGenericField=false;
        if (!cl) {
            if (_isContainerDesc(descEl)) {
                cl = thinkehr.f4.RmContainerModel;
                rmType = thinkehr.f4.RmType.fromString(descEl.rmType);
            } else if(_getGenericDescFieldClass(descEl)){
                cl=_getGenericDescFieldClass(descEl);
                isGenericField = true;
            } else  {
                console.warn("Unknown rmType: ", descEl.rmType, " skipping model creation");
                return null;
            }
        } else {
            rmType = null;
        }

        var obj = new cl(descEl);
        obj.setDescEl(descEl);
        if (rmType) {
            obj.setRmType(rmType);
        }

        obj.setIsGenericField(isGenericField);

        if (obj.children !== undefined) {
            delete obj.children;
        }

        return obj;
    }

    function _createCustomModel(delegateModel, descEl) {
        var haveDelegate = delegateModel != null;
        var model = new thinkehr.f4.CustomModel();
        model.setDelegateModel(haveDelegate ? delegateModel : descEl);
        model.setViewConfig(new thinkehr.f4.ViewConfig({model: model}));

        var func;
        if (haveDelegate) {
            func = delegateModel.getCustomFunction(); //delegateModel.annotationValue("function");
        } else {
            func = descEl.getCustomFunction ? descEl.getCustomFunction() : _getAnnotation(descEl, "function");
        }
        if (!func) {
            console.error("No initialization function specified for custom component " + model.getPath());
        }

        model.setCustomFunction(func);

        return model;
    }

    function _getGenericDescFieldClass(descEl) {
        return thinkehr.f4.RmType.fromString(descEl.rmType) === thinkehr.f4.RmType.GENERIC_FIELD && descEl.viewConfig && descEl.viewConfig.field && descEl.viewConfig.field.type ? thinkehr.f4._rmTypeToClassMap[descEl.viewConfig.field.type] : null;
    }

    function _isContainerDesc(descEl) {
        return descEl.children !== undefined && thinkehr.f4.util.isArray(descEl.children) && descEl.rmType;
    }

    function _parseViewConfig(model, descEl) {
        var vc;
        if (descEl.viewConfig) {
            vc = parseViewConfig(descEl.viewConfig);
        } else {
            vc = new thinkehr.f4.ViewConfig();
        }
        model.setViewConfig(vc);
        vc.setModel(model);

        return vc;
    }

    function parseInputItems(rawInputArr) {
        var parsedInputItems = [];
        if (rawInputArr) {
            for (var j = 0; j < rawInputArr.length; j++) {
                var inputItem = rawInputArr[j];
                var inputItemObj = new thinkehr.f4.InputItem(inputItem);
                if (inputItem.validation) {
                    inputItemObj.setValidation(new thinkehr.f4.Validation(inputItem.validation));
                }
                parsedInputItems.push(inputItemObj)
            }
        }
        return parsedInputItems;
    }

    function _parseInputs(model, descEl) {
        if (descEl.inputs && model instanceof thinkehr.f4.NodeModel) {
            model.setInputs([]);
            for (var i = 0; i < descEl.inputs.length; i++) {
                var input = descEl.inputs[i];
                var inputObj = new thinkehr.f4.Input(input);
                inputObj.setList([]);
                inputObj.setContext(model.getContext());
                inputObj.setType(thinkehr.f4.InputType.fromString(input.type));

                model.addInput(inputObj);
                parseInputItems(input.list).forEach(function (inputItem) {
                    inputObj.addItem(inputItem, true);
                });
            }
        }
    }

    function _parseValues(model, values, rootValues) {
        var models = [];
        _getModelsRecursively(model, models);
        for (var i = 0; i < models.length; i++) {
            var m = models[i];
            var path = m.getPath();
            if (path != null && m.isAttachableToValueNode() && m.getRmType() !== thinkehr.f4.RmType.FORM_DEFINITION) {
                var segments = path.split("/");
                if( (m.getDelegateModel && m.getDelegateModel() && !m.getDelegateModel().getIsGenericField()) || (!m.getIsGenericField() && (m.getDelegateModel==null || !m.getDelegateModel()) ) ){
                    _attachValueToModels(m, segments, 0, values, rootValues);
                }
            }
        }
    }

    function recursivelyForChildModels(model, func) {
        for (var i = 0; i < model.getChildCount(); i++) {
            var childModel = model.getChildModel(i);
            func(childModel);
            recursivelyForChildModels(childModel, func);
        }
    }

    function _getPathChildIndex(model) {
        if (model.getParentModel() && model.getPath()) {
            var allChildrenWithPath = model.getParentModel().findChildrenWithPath(model.getPath());
            return allChildrenWithPath.indexOf(model);
        }

        return -1;
    }

    function _markModelForDeletion(model) {
        model.__markedForDeletion = true;
        recursivelyForChildModels(model, function (childModel) {
            childModel.__markedForDeletion = true;
        });
        model.removeFromParent();
    }

    function _attachValueToModels(model, segments, segmentIndex, values, rootValues) {
        if (!values || segmentIndex >= segments.length || model.__markedForDeletion === true) {
            return;
        }

        var segment = segments[segmentIndex];

        var lastSegment = segments.length === segmentIndex + 1;
        var segmentPath = _segmentsToPath(segments, segmentIndex);

        var addedSegment = false;
        var pathChildIndex = -1;
        if (values[segment] === undefined) {
            pathChildIndex = _getPathChildIndex(model);
            if (pathChildIndex > 0) {
                _markModelForDeletion(model);
            } else {
                values[segment] = values === rootValues ? {} : [];
                addedSegment = true;
            }
        }

        if (values[segment] !== undefined) {
            var node = values[segment];

            var val;
            var valRef;
            var parentValRef;

            if (!lastSegment) {
                var ancestorForSegment = model.findAncestorWithPath(segmentPath);
                // We've already handled any splits further up the tree
                if (ancestorForSegment) {
                    _attachValueToModels(model, segments, segmentIndex + 1, ancestorForSegment.getValueNodeRef(), rootValues);
                    return;
                }

                val = null;
                parentValRef = null;
                if (thinkehr.f4.util.isArray(node)) {
                    if (node.length > 1) {
                        console.warn("A split occurred in the model at", segmentPath, " will only use last value from the array for " +
                            "further processing");
                    }
                    if (addedSegment) {
                        valRef = {};
                        node.push(valRef);
                    } else {
                        valRef = node.length === 0 ? null : node[node.length - 1];
                    }
                } else {
                    valRef = node;
                }
            } else {
                // We are at our model

                if (pathChildIndex < 0) {
                    pathChildIndex = _getPathChildIndex(model);
                }

                if (pathChildIndex > 0) {
                    if (!thinkehr.f4.util.isArray(node) || pathChildIndex >= node.length) {
                        _markModelForDeletion(model);
                    } else {
                        parentValRef = node;
                        valRef = node[pathChildIndex];
                        val = node[pathChildIndex];
                    }
                } else if (thinkehr.f4.util.isArray(node)) {

                    if (node.length === 0 && (!model.isMulti() || !model.isValueModel())) {
                        val = null;
                        if (addedSegment && !model.isValueModel()) {
                            valRef = {};
                            node.push(valRef);
                        } else {
                            valRef = null;
                        }
                        parentValRef = node;
                    } else if (node.length === 1 && (!model.isMulti() || !model.isValueModel())) {
                        val = node[0];
                        valRef = node[0];
                        parentValRef = node;
                    } else {
                        var doSplit;
                        if (!model.isMulti()) {
                            console.warn("Multiple values received for non-multi model", segmentPath, ", will only use the last one.");
                            val = node[node.length - 1];
                            valRef = val;
                            parentValRef = node;
                            doSplit = false;
                        } else {
                            val = node;
                            valRef = node;
                            parentValRef = values;
                            doSplit = true;
                        }

                        // Do the splits
                        if (doSplit && !model.isValueModel() && !addedSegment) {

                            if (segmentPath != model.getPath()) {
                                // Should never happen, this is a programmer assertion
                                throw new Error("Segment path not the same as model path when we want to possibly split the model. Coding error?");
                            }
                            var parentModel = model.getParentModel();
                            for (var i = 1; i < valRef.length; i++) {
                                // Do we already have our child?
                                var childModel = parentModel.findChildWithPath(segmentPath, i);
                                if (!childModel) {
                                    _recursivelyParseDescription(parentModel, model.getDescEl());
                                    childModel = parentModel.findChildWithPath(segmentPath, i);
                                    if (!childModel) {
                                        throw Error("Could not create child model for", model.getPath(), "."); // Should REALLY never happen
                                    }
                                }

                                childModel.setValueNodeRef(valRef[i]);
                                childModel.setValueNodeParentRef(valRef);

                                var subModels = [];
                                _getModelsRecursively(childModel, subModels);
                                subModels.shift(); // Remove the childModel itself, since it's already been handled
                                for (var j = 0; j < subModels.length; j++) {
                                    var subModel = subModels[j];
                                    if (subModel.getPath() != null) {
                                        var subModelSegments = subModel.getPath().split("/");
                                        _attachValueToModels(subModel, subModelSegments, 0, rootValues, rootValues);
                                    }
                                }
                            }

                            // This is for the first element, they will be set below
                            parentValRef = valRef;
                            valRef = valRef[0];
                        } // splits
                    } // array with multiple elements

                } // is array ends here
                else {
                    // object
                    val = node;
                    valRef = node;
                    parentValRef = values;
                }

                model.setValueNodeRef(valRef);
                model.setValueNodeParentRef(parentValRef);
                if (model.isValueModel()) {
                    model.setValue(val);
                    model._setSkipDefaultValue(false);
                }

                if (!parentValRef && model.__markedForDeletion !== true) {
                    console.warn("Parent value reference is null for", model, ". Is this legal?");
                }

                if (model.getRmType() === thinkehr.f4.RmType.CUSTOM && model.getDelegateModel() && model.getDelegateModel().getRmType !== undefined) {
                    var dm = model.getDelegateModel();
                    dm.setValueNodeParentRef(parentValRef);
                    dm.setValueNodeRef(valRef);
                    if (dm.isValueModel()) {
                        dm.setValue(val);
                        dm._setSkipDefaultValue(false);
                    }
                }

            } // is last segment

            _attachValueToModels(model, segments, segmentIndex + 1, valRef, rootValues);

        } // we have some values
    }

    function _segmentsToPath(segments, lastIndex) {
        var index = lastIndex === undefined ? segments.length : lastIndex + 1;
        var sliced = segments.slice(0, index);
        return sliced.join("/");
    }

    function refreshValues(model, values) {
        if (model.getRmType() === thinkehr.f4.RmType.FORM_DEFINITION) {
            model.setValueNodeRef(values);
        }
        _parseValues(model, values, values);

        model._triggerModelRefreshed();
        recursivelyForChildModels(model, function (m) {
            m._triggerModelRefreshed();
        })
    }

    function _getModelsRecursively(model, flatArray) {
        flatArray.push(model);
        for (var i = 0; i < model.getChildCount(); i++) {
            var childModel = model.getChildModel(i);
            _getModelsRecursively(childModel, flatArray);
        }
    }

    function _findDependencyDef(formId, deps) {

        for (var i = 0; i < deps.length; i++) {
            var f = deps[i];
            if (f.field == formId) {
                return f;
            }
        }

    }

    function isCustomFunctionCustomComponent(customFunctionString, hasCustomTagValue, context){
        if(!customFunctionString)return false;
        var customFnRef=null;
        try{
            customFnRef = resolveCustomFunctionFromString(customFunctionString, context);
        }catch(e){
            console.error("Custom function on path '" + customFunctionString + "' is not defined.");
        }
        
        if(customFnRef && customFnRef instanceof Function) {
            return hasCustomTagValue
        }else if(customFnRef && typeof customFnRef === 'object'){
            if(customFnRef && customFnRef.function!=null){
                return customFnRef.customComponent==null?hasCustomTagValue:customFnRef.customComponent==true
            }
        }
        return false
    }

    function resolveCustomFunctionFromString(customFnString, ehrContext) {
        if(!customFnString) {
            return null;
        }
        var customFnRef = null;

        if(!customFnRef && ehrContext  && ehrContext.namespaceResolver) {
            // check on context.namespaceResolver
            var cfPackagePath = ehrContext.namespaceResolver(customFnString);
            try{
                customFnRef = eval(cfPackagePath + '.' + [customFnString]);
            }catch(e){}
        }

        if(!customFnRef && ehrContext && ehrContext.namespace) {
            // check on context.namespace
            try{
                customFnRef = eval(ehrContext.namespace + '.' + [customFnString]);
            }catch(e){}
        }

        if(!customFnRef) {
            // evaluate string
            try{
                customFnRef = eval(customFnString);
            }catch(e){}
        }
        return customFnRef;
    }

    function getCustomFunctionReference(customFunctionString, ehrContext){
        var customFnRef = resolveCustomFunctionFromString(customFunctionString, ehrContext);

        if(customFnRef && customFnRef instanceof Function) {
            return customFnRef
        }else if(customFnRef && typeof customFnRef === 'object'){
            if(customFnRef && customFnRef.function!=null){
                return customFnRef.function
            }
        }
        return null
    }

    function duplicateModel(model, insertAfterModel) {
        var values = {};
        var rm = model.getRootModel();
        var context = rm ? rm.getContext() : null;
        var newModel = parseFormDescriptionSnippet(model.getDescEl(), values, context);

        rm = model.getRootModel();
        if (rm && rm.getRmType() === thinkehr.f4.RmType.FORM_DEFINITION) {
            var ast = rm.getDependencyNode();
            if (ast && ast.fields().length > 0) {
                var depsJson = ast.getRawDesc();
                var cm = [];
                _getModelsRecursively(newModel, cm);
                cm.forEach(function (m) {
                    var fieldJson = _findDependencyDef(m.getPath(), depsJson);
                    if (fieldJson) {
                        parseDependencyField(ast, fieldJson, m);
                    }
                });
            }

            if (ast && ast.fields().length > 0) {
                getThenStatementsWithModelPath(ast, model.getPath()).forEach(function (thenStatement) {
                    thenStatement.addTarget(newModel);
                })

            }
        }

        if (insertAfterModel) {
            var parent = model.getParentModel();
            var index;
            if (parent) {
                index = parent.getChildModels().indexOf(insertAfterModel);
                if (parent) {
                    if (index >= 0) {
                        parent.insertChildModelAt(index + 1, newModel);
                    }
                }
            }

            var parentValRef = model.getValueNodeParentRef();
            if (parentValRef && thinkehr.f4.util.isArray(parentValRef)) {
                newModel.setValueNodeParentRef(parentValRef);
                if (index === undefined || index < 0) {
                    parentValRef.push(newModel.getValueNodeRef());
                } else {
                    parentValRef.splice(index + 1, 0, newModel.getValueNodeRef());
                }
            }

        }

        return newModel;
    }

    function destroyModel(model) {
        model.removeFromParent();

        var parentValRef = model.getValueNodeParentRef();
        var valRef = model.getValueNodeRef();
        if (parentValRef && valRef) {
            if (thinkehr.f4.util.isArray(parentValRef)) {
                var index = parentValRef.indexOf(valRef);
                if (index >= 0) {
                    parentValRef.splice(index, 1);
                }
            }
        }
    }

    function setExternalContext(model, context) {
        if (model.getRmType() !== thinkehr.f4.RmType.FORM_DEFINITION) {
            throw new Error("External context can only be attached to the root form model");
        }

        model._externalContext = context;
    }

    // Dependency parsing

    var _depOperators = {
        "lt": {
            "op": "lt",
            "label": "<",
            "opType": "bin",
            "partial": false,
            "types": ["DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_DURATION", "DV_INTEGER", "DV_COUNT", "DV_PROPORTION"]
        },
        "gt": {
            "op": "gt",
            "label": ">",
            "opType": "bin",
            "partial": false,
            "types": ["DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_DURATION", "DV_INTEGER", "DV_COUNT", "DV_PROPORTION", "DV_EHR_URI"]
        },
        "le": {
            "op": "le",
            "label": "<=",
            "opType": "bin",
            "partial": false,
            "types": ["DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_DURATION", "DV_INTEGER", "DV_COUNT", "DV_PROPORTION"]
        },
        "ge": {
            "op": "ge",
            "label": ">=",
            "opType": "bin",
            "partial": false,
            "types": ["DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_DURATION", "DV_INTEGER", "DV_COUNT", "DV_PROPORTION"]
        },
        "eq": {
            "op": "eq",
            "label": "=",
            "opType": "bin",
            "partial": false,
            "types": ["DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_DURATION", "DV_INTEGER", "DV_COUNT", "DV_PROPORTION"]
        },
        "ne": {
            "op": "ne",
            "label": "!=",
            "opType": "bin",
            "partial": false,
            "types": ["DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_DURATION", "DV_INTEGER", "DV_COUNT", "DV_PROPORTION"]
        },
        "empty": {
            "op": "empty",
            "label": "empty",
            "opType": "un",
            "partial": false,
            "types": ["DV_TEXT", "DV_URI", "DV_MULTIMEDIA", "DV_EHR_URI", "DV_CODED_TEXT", "DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_DURATION", "DV_INTEGER", "DV_COUNT", "DV_ORDINAL",
                "DV_PROPORTION", "DV_BOOLEAN"]
        },
        "notempty": {
            "op": "notempty",
            "label": "not empty",
            "opType": "un",
            "partial": false,
            "types": ["DV_TEXT", "DV_URI", "DV_MULTIMEDIA", "DV_EHR_URI", "DV_CODED_TEXT", "DV_ORDINAL", "DV_DURATION", "DV_DATE", "DV_TIME", "DV_DATE_TIME", "DV_QUANTITY", "DV_COUNT"]
        },
        "equals": {
            "op": "equals",
            "label": "equals",
            "opType": "bin",
            "partial": false,
            "types": ["DV_TEXT", "DV_URI", "DV_MULTIMEDIA", "DV_EHR_URI", "DV_CODED_TEXT", "DV_ORDINAL"]
        },
        "notequals": {
            "op": "notequals",
            "label": "not equals",
            "opType": "bin",
            "partial": false,
            "types": ["DV_TEXT", "DV_URI", "DV_MULTIMEDIA", "DV_EHR_URI", "DV_CODED_TEXT", "DV_ORDINAL"]
        },
        "contains": {
            "op": "contains",
            "label": "contains",
            "opType": "bin",
            "partial": true,
            "types": ["DV_TEXT", "DV_URI", "DV_MULTIMEDIA", "DV_EHR_URI", "DV_CODED_TEXT", "DV_ORDINAL"]
        },
        "startswith": {
            "op": "startswith",
            "label": "starts with",
            "opType": "bin",
            "partial": true,
            "types": ["DV_TEXT", "DV_URI", "DV_MULTIMEDIA", "DV_EHR_URI", "DV_CODED_TEXT", "DV_ORDINAL"]
        },
        "endswith": {
            "op": "endswith",
            "label": "ends with",
            "opType": "bin",
            "partial": true,
            "types": ["DV_TEXT", "DV_URI", "DV_MULTIMEDIA", "DV_EHR_URI", "DV_CODED_TEXT", "DV_ORDINAL"]
        },
        "is": {
            "op": "is",
            "label": "is",
            "opType": "bin",
            "partial": false,
            "types": ["DV_BOOLEAN"]
        },
        "isnot": {
            "op": "isnot",
            "label": "is not",
            "opType": "bin",
            "partial": false,
            "types": ["DV_BOOLEAN"]
        }
    };

    var ALL_TRUE_EVAL_ARRAY = 'allTrue';
    var ANY_TRUE_EVAL_ARRAY = 'anyTrue';

    var getOperatorFunctionOnArray = function (evalArrayValuesAsTrue, operatorFunction) {

        return function(lHValuesArray, rHValuesArr){
            var allEvaluationsTrue = evalArrayValuesAsTrue == ALL_TRUE_EVAL_ARRAY;
            var evaluationResult;

            var evaluateWithRHValuesArr = function (lrValue, rVArray) {
                var ret = false;
                if (rVArray && rVArray.length) {
                    for (var j = 0; j < rVArray.length; j++) {
                        ret=operatorFunction.call(null, lrValue, rVArray[j]);
                        if(ret==true) {
                            break;
                        }
                    }
                } else {
                    ret= operatorFunction.call(null, lrValue);
                }
                return ret;
            };

            for (var i = 0; i < lHValuesArray.length; i++) {

                evaluationResult = evaluateWithRHValuesArr(lHValuesArray[i], rHValuesArr);
                if(!allEvaluationsTrue && evaluationResult==true) {
                    return evaluationResult;
                }
                if(allEvaluationsTrue===true && evaluationResult!=true) {
                    return evaluationResult;
                }
            }

            return evaluationResult;
        }

    };

    var addDependencyOperatorFn = function (operatorFunctionsObject, operatorFnKey, operatorFn, evalArrayConst) {
        _operatorFunctions[operatorFnKey] = {};
        _operatorFunctions[operatorFnKey].operFn = operatorFn;
        _operatorFunctions[operatorFnKey].arrayOperFn = getOperatorFunctionOnArray(evalArrayConst, _operatorFunctions[operatorFnKey].operFn);
    };

/* operator functions */
    var _operatorFunctions = {};

    addDependencyOperatorFn(_operatorFunctions,
        "lt",
        function (o1, o2) {
            if (o1 === null || o1 === undefined) {
                return false;
            }
            return o1 < o2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "lt/DV_QUANTITY",
        function (o1, o2) {
            if( o1===null || o1===undefined || !o1.unit ){
                return false;
            }
            return o1.unit==o2.unit && _operatorFunctions["lt"].operFn.call(null, o1.magnitude, o2.magnitude);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "lt/DV_DATE",
        function (d1, d2) {
            if (d1 === null || d1 === undefined) {
                return false;
            }
            return +d1 < +d2;
        },
        ANY_TRUE_EVAL_ARRAY);
    
    addDependencyOperatorFn(_operatorFunctions,
        "lt/DV_TIME",
        function (t1, t2) {
            return _operatorFunctions["lt/DV_DATE"].operFn.call(null, t1, t2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "lt/DV_DATE_TIME",
        function (dt1, dt2) {
            return _operatorFunctions["lt/DV_DATE"].operFn.call(null, dt1, dt2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "gt",
        function (o1, o2) {
            if (o1 === null || o1 === undefined) {
                return false;
            }
            return o1 > o2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "gt/DV_QUANTITY",
        function (o1, o2) {
            if( o1===null || o1===undefined || !o1.unit ){
                return false;
            }
            return o1.unit==o2.unit && _operatorFunctions["gt"].operFn.call(null, o1.magnitude, o2.magnitude);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "gt/DV_DATE",
        function (d1, d2) {
            if (d1 === null || d1 === undefined) {
                return false;
            }
            return +d1 > +d2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "gt/DV_TIME",
        function (t1, t2) {
            return _operatorFunctions["gt/DV_DATE"].operFn.call(null, t1, t2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "gt/DV_DATE_TIME",
        function (dt1, dt2) {
            return _operatorFunctions["gt/DV_DATE"].operFn.call(null, dt1, dt2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "gt/DV_EHR_URI",
        function (dt1, dt2) {
            return _operatorFunctions["startswith"].operFn.call(null, dt1, dt2) && dt1.length > dt2.length;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "le",
        function (o1, o2) {
            if (o1 === null || o1 === undefined) {
                return false;
            }
            return o1 <= o2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "le/DV_QUANTITY",
        function (o1, o2) {
            if( o1===null || o1===undefined || !o1.unit ){
                return false;
            }
            return o1.unit==o2.unit && _operatorFunctions["le"].operFn.call(null, o1.magnitude, o2.magnitude);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "le/DV_DATE",
        function (d1, d2) {
            if (d1 === null || d1 === undefined) {
                return false;
            }
            return +d1 <= +d2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "le/DV_TIME",
        function (t1, t2) {
            return _operatorFunctions["le/DV_DATE"].operFn.call(null, t1, t2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "le/DV_DATE_TIME",
        function (dt1, dt2) {
            return _operatorFunctions["le/DV_DATE"].operFn.call(null, dt1, dt2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ge",
        function (o1, o2) {
            if (o1 === null || o1 === undefined) {
                return false;
            }
            return o1 >= o2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ge/DV_QUANTITY",
        function (o1, o2) {
            if( o1===null || o1===undefined || !o1.unit ){
                return false;
            }
            return o1.unit==o2.unit && _operatorFunctions["ge"].operFn.call(null, o1.magnitude, o2.magnitude);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ge/DV_DATE",
        function (d1, d2) {
            if (d1 === null || d1 === undefined) {
                return false;
            }
            return +d1 >= +d2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ge/DV_TIME",
        function (t1, t2) {
            return _operatorFunctions["ge/DV_DATE"].operFn.call(null, t1, t2);

        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ge/DV_DATE_TIME",
        function (dt1, dt2) {
            return _operatorFunctions["ge/DV_DATE"].operFn.call(null, dt1, dt2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "eq",
        function (o1, o2) {
            return o1 == o2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "eq/DV_QUANTITY",
        function (o1, o2) {
            if( o1==o2 ){
                return true;
            }
            return o1.unit==o2.unit && _operatorFunctions["eq"].operFn.call(null, o1.magnitude, o2.magnitude);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "eq/DV_DATE",
        function (d1, d2) {
            if (d1 === null || d1 === undefined) {
                return false;
            }
            return +d1 == +d2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "eq/DV_TIME",
        function (t1, t2) {
            return _operatorFunctions["eq/DV_DATE"].operFn.call(null, t1, t2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "eq/DV_DATE_TIME",
        function (dt1, dt2) {
            return _operatorFunctions["eq/DV_DATE"].operFn.call(null, dt1, dt2);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ne",
        function (o1, o2) {
            return o1 != o2;
        },
        ALL_TRUE_EVAL_ARRAY);


    addDependencyOperatorFn(_operatorFunctions,
        "ne/DV_QUANTITY",
        function (o1, o2) {
            return o1.unit!=o2.unit || _operatorFunctions["ne"].operFn.call(null, o1.magnitude, o2.magnitude);
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ne/DV_DATE",
        function (d1, d2) {
            if (d1 === null || d1 === undefined) {
                return d2 !== null || d2 !== undefined;
            }
            return +d1 != +d2;
        },
        ALL_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ne/DV_TIME",
        function (t1, t2) {
            return _operatorFunctions["ne/DV_DATE"].operFn.call(null, t1, t2);
        },
        ALL_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "ne/DV_DATE_TIME",
        function (dt1, dt2) {
            return _operatorFunctions["ne/DV_DATE"].operFn.call(null, dt1, dt2);
        },
        ALL_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "empty",
        function (o) {
            var und = o === null || o === undefined;
            if (!und) {
                if (thinkehr.f4.util.isString(o) || thinkehr.f4.util.isArray(o)) {
                    return o.length === 0;
                }
            }
            return und;
        },
        ALL_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "empty/DV_QUANTITY",
        function (o) {

            var isLhsEmpty = function (val) {
                return !val;
            };

            var isMagnitudeEmpty = function (val) {
                return !thinkehr.f4.util.isNumber(val.magnitude);
            };

            var isUnitEmpty = function (val) {
                return !thinkehr.f4.util.isString(val.unit) || val.unit.length === 0;
            };

            return isLhsEmpty(o) || isMagnitudeEmpty(o) || isUnitEmpty(o) || _operatorFunctions["empty"].operFn.call(null, o.magnitude.toString());
        },
        ALL_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "notempty",
        function (o) {
            var def = o !== null && o !== undefined;
            if (def) {
                if (thinkehr.f4.util.isString(o) || thinkehr.f4.util.isArray(o)) {
                    return o.length > 0;
                }
            }
            return def;
        },
        ALL_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "notempty/DV_QUANTITY",
        function (o) {
            return !_operatorFunctions["empty/DV_QUANTITY"].operFn.call(null, o);
        },
        ALL_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "equals",
        function (o1, o2) {
            if(thinkehr.f4.util.isString(o1) && thinkehr.f4.util.isString(o2)) {
                o1 = o1.toLowerCase();
                o2 = o2.toLowerCase();
            }
            return o1 === o2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "notequals",
        function (o1, o2) {
            if(thinkehr.f4.util.isString(o1) && thinkehr.f4.util.isString(o2)) {
                o1 = o1.toLowerCase();
                o2 = o2.toLowerCase();
            }
            return o1 !== o2;
        },
        ALL_TRUE_EVAL_ARRAY);
    
    addDependencyOperatorFn(_operatorFunctions,
        "startswith",
        function (o1, o2) {
            if(thinkehr.f4.util.isString(o1) && thinkehr.f4.util.isString(o2)) {
                o1 = o1.toLowerCase();
                o2 = o2.toLowerCase();
            }
            return o1 && o1.indexOf(o2) === 0;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "endswith",
        function (o1, o2) {
            if (o1) {
                if(thinkehr.f4.util.isString(o1) && thinkehr.f4.util.isString(o2)) {
                    o1 = o1.toLowerCase();
                    o2 = o2.toLowerCase();
                }

                var index = o1.indexOf(o2);
                if (index >= 0) {
                    return index + o2.length === o1.length;
                }
            }
            return false;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "contains",
        function (o1, o2) {
            if(thinkehr.f4.util.isString(o1) && thinkehr.f4.util.isString(o2)) {
                o1 = o1.toLowerCase();
                o2 = o2.toLowerCase();
            }
            return o1 && o1.indexOf(o2) >= 0;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "is",
        function (o1, o2) {
            return o1 === o2;
        },
        ANY_TRUE_EVAL_ARRAY);

    addDependencyOperatorFn(_operatorFunctions,
        "isnot",
        function (o1, o2) {
            return o1 !== o2;
        },
        ALL_TRUE_EVAL_ARRAY);

    function _getArrayOperatorFunction(operator, rmType) {
        var key = operator.op + "/" + rmType;
        var fnHostObj = _operatorFunctions[key] || _operatorFunctions[operator.op];
        return fnHostObj.arrayOperFn;
    }

    var _lhsFunctions = {
        "DV_QUANTITY": function (model) {
            return function() {
                return {
                    magnitude: model.magnitudeValue(undefined, undefined),
                    unit: model.unitValue(undefined, undefined)
                }
            }
        },

        "DV_CODED_TEXT": function (model) {
            return function() {
                return {
                    code: model.codeValue(),
                    value: model.labelValue()
                }
            }
        },

        "DV_TEXT": function (model) {
            return function () {
                return model.textValue(undefined, undefined);
            }
        },

        "DV_MULTIMEDIA": function (model) {
            return function () {
                return model.uriValue(undefined, undefined);
            }
        },

        "DV_ORDINAL": function (model) {
            return function () {
                return {
                    code: model.codeValue(),
                    value: model.labelValue()
                }
            }
        },

        "DV_PROPORTION": function (model) {
            return function () {
                return {
                    numerator: model.numeratorValue(undefined, undefined),
                    denominator: model.denominatorValue(undefined, undefined)
                }
            }
        },

        "DV_COUNT": function (model) {
            return function () {
                return model.countValue(undefined, undefined);
            }
        },

        "DV_BOOLEAN": function (model) {
            return function () {
                return model.booleanValue();
            }
        },

        "DV_DATE": function (model) {
            return function () {
                return model.dateObjectValue(undefined, undefined);
            }
        },

        "DV_TIME": function (model) {
            return function () {
                return model.timeObjectValue(undefined, undefined);
            }
        },

        "DV_DATE_TIME": function (model) {
            return function () {
                return model.dateTimeObjectValue(undefined, undefined);
            }
        },

        "DV_DURATION": function (model) {
            return function () {
                return model.durationValue(undefined, undefined);
            }
        },

        "DV_URI": function (model) {
            return function () {
                return model.uriValue(undefined, undefined);
            }
        },


        "DV_EHR_URI": function (model) {
            return function () {
                return model.ehrUriValue(undefined, undefined);
            }
        },

        "_default": function (model) {
            return function() {
                return model.getValue();
            }
        }
    };

    function _getLhsComparisonFunction(operator, rmType, model) {
        var key = operator.op + "/" + rmType;
        var lhsFunc = _lhsFunctions[key] || _lhsFunctions[rmType] || _lhsFunctions["_default"];
        if (lhsFunc) {
            return lhsFunc.call(null, model);
        } else {
            return undefined;
        }
    }

    var _literalFactories = {
        "DV_QUANTITY": function (operator, value) {
            return new thinkehr.f4.AstQuantityLiteral({
                magnitudeLiteral: new thinkehr.f4.AstNumericLiteral({value: value.magnitude}),
                unitLiteral: new thinkehr.f4.AstStringLiteral({value: value.unit})
            });
        },
        "DV_CODED_TEXT": function (operator, value) {
            return new thinkehr.f4.AstCodedTextLiteral({
                codeLiteral: new thinkehr.f4.AstStringLiteral({value: value.code}),
                valueLiteral: new thinkehr.f4.AstStringLiteral({value: value.value})
            });
        },
        "DV_ORDINAL": function (operator, value) {
            return _literalFactories["DV_CODED_TEXT"].call(null, operator, value);
        },
        "DV_PROPORTION": function (operator, value) {
            return new thinkehr.f4.AstProportionLiteral({
                numeratorLiteral: new thinkehr.f4.AstNumericLiteral({value: value.numerator}),
                denominatorLiteral: new thinkehr.f4.AstNumericLiteral({value: value.denominator})
            });
        },
        "DV_DATE": function (operator, value) {
            return new thinkehr.f4.AstDateLiteral({value: value.value});
        },
        "DV_TIME": function (operator, value) {
            return new thinkehr.f4.AstTimeLiteral({value: value.value});
        },
        "DV_DATE_TIME": function (operator, value) {
            return new thinkehr.f4.AstDateTimeLiteral({value: value.value});
        },
        "DV_DURATION": function (operator, value) {
            return new thinkehr.f4.AstDurationLiteral({value: value});
        },
        "_string": function (operator, value) {
            return new thinkehr.f4.AstStringLiteral({value: value});
        },
        "_numeric": function (operator, value) {
            return new thinkehr.f4.AstNumericLiteral({value: value});
        },
        "_default": function (operator, value) {
            if (thinkehr.f4.util.isString(value)) {
                return new thinkehr.f4.AstStringLiteral({value: value});
            } else if (thinkehr.f4.util.isNumber(value)) {
                return new thinkehr.f4.AstNumericLiteral({value: value});
            } else if (thinkehr.f4.util.isObject(value) && value.value !== undefined) {
                var val = value.value;
                if (thinkehr.f4.util.isString(val)) {
                    return new thinkehr.f4.AstStringLiteral({value: val});
                } else if (thinkehr.f4.util.isNumber(val)) {
                    return new thinkehr.f4.AstNumericLiteral({value: val});
                } else {
                    return new thinkehr.f4.AstLiteral({value: val});
                }
            } else {
                return new thinkehr.f4.AstLiteral({value: value});
            }
        }
    };

    function _getRhsComparisonLiteralFactory(operator, rmType) {
        var key = operator.op + "/" + rmType;
        return _literalFactories[key] || _literalFactories[rmType] || _literalFactories["_default"];
    }

    var _conditionExpressionClasses = {
        "[un]DV_QUANTITY": "thinkehr.f4.AstUnaryQuantityExpression",
        "[bin]DV_QUANTITY": "thinkehr.f4.AstBinaryQuantityExpression",
        "DV_QUANTITY": "thinkehr.f4.AstBinaryQuantityExpression",
        "[un]DV_CODED_TEXT": "thinkehr.f4.AstUnaryCodedTextExpression",
        "[bin]DV_CODED_TEXT": "thinkehr.f4.AstBinaryCodedTextExpression",
        "DV_CODED_TEXT": "thinkehr.f4.AstBinaryCodedTextExpression",
        "[un]DV_ORDINAL": "thinkehr.f4.AstUnaryCodedTextExpression",
        "[bin]DV_ORDINAL": "thinkehr.f4.AstBinaryCodedTextExpression",
        "DV_ORDINAL": "thinkehr.f4.AstBinaryCodedTextExpression",
        "[un]DV_PROPORTION": "thinkehr.f4.AstUnaryProportionExpression",
        "[bin]DV_PROPORTION": "thinkehr.f4.AstBinaryProportionExpression",
        "DV_PROPORTION": "thinkehr.f4.AstBinaryProportionExpression",
        "[bin]DV_DATE_TIME": "thinkehr.f4.AstBinaryDateExpression",
        "[bin]DV_DATE": "thinkehr.f4.AstBinaryDateExpression",
        "[bin]DV_TIME": "thinkehr.f4.AstBinaryDateExpression",
        "[un]DV_DURATION": "thinkehr.f4.AstUnaryDurationExpression",
        "[bin]DV_DURATION": "thinkehr.f4.AstBinaryDurationExpression",
        "DV_DURATION": "thinkehr.f4.AstBinaryDurationExpression"
    };

    function _getConditionExpressionClass(operator, rmType) {
        var key = operator.op + "/" + rmType;
        var ce = _conditionExpressionClasses[key] || _conditionExpressionClasses["[" + operator.opType + "]" + rmType] || _conditionExpressionClasses[rmType];
        if (ce) {
            return eval(ce);
        } else {
            return operator.opType === "bin" ? thinkehr.f4.AstBinaryExpression : thinkehr.f4.AstUnaryExpression;
        }
    }

    var _actionStatementClasses = {
        "show": "thinkehr.f4.AstShowAction",
        "hide": "thinkehr.f4.AstHideAction",
        "enable": "thinkehr.f4.AstEnableAction",
        "disable": "thinkehr.f4.AstDisableAction",
        "set": "thinkehr.f4.AstSetAction",
        "clear": "thinkehr.f4.AstClearAction",
        "reset": "thinkehr.f4.AstResetAction"
    };

    function _getActionStatementClass(action, targetRmType) {
        var key = action.action + "/" + targetRmType;
        var aSt = _actionStatementClasses[key] || _actionStatementClasses[action.action];
        if (aSt) {
            return eval(aSt);
        } else {
            return thinkehr.f4.AstNoopStatement;
        }
    }

    function _collectFieldDependencies(deps) {
        var collectedDeps = [];
        //collect conditions for the same fieldId that are defined separately
        for (var i = 0; i < deps.length; i++) {
            var currDepConfig = deps[i];
            var cleanDepConfig = _findDependencyDef(currDepConfig.field, collectedDeps);
            if(cleanDepConfig){
                cleanDepConfig.conditions = cleanDepConfig.conditions.concat(currDepConfig.conditions.slice());
            }else{
                collectedDeps.push(currDepConfig);
            }
        }
        return collectedDeps;
    }

    function parseDependencies(rootModel, deps) {
        deps = _collectFieldDependencies(deps);
        var ast = new thinkehr.f4.Ast({
            rawDesc: deps
        });


        if (thinkehr.f4.util.isArray(deps)) {
            deps.forEach(function (fieldJson) {
                var fieldId = fieldJson.field;
                var models = rootModel.findSuccessorsWithPath(fieldId);
                if (models.length > 0) {
                    models.forEach(function(model) {
                        parseDependencyField(ast, fieldJson, model);
                    });
                } else {
                    console.warn("Could not find model for", fieldId, "skipping dependency creation for it.");
                }

            });
        }

        return ast;
    }

    function getThenStatementsWithModelPath(ast, modelPath){
        var fields = ast.fields();
        var thenStatementsWithModelPath = [];
        if(fields) {
            fields.forEach(function (currField) {
                currField.conditions().forEach(function (currCond) {
                    if (currCond.thenStatement && currCond.thenStatement.elements) {
                        currCond.thenStatement.elements().forEach(function (currThenStatement) {
                            currThenStatement.getTargets().forEach(function (actionTarget) {
                                if (actionTarget.getPath() === modelPath) {
                                    thenStatementsWithModelPath.push(currThenStatement)
                                }
                            });
                        });
                    }
                });
            });
        }
        return thenStatementsWithModelPath;
    }

    function parseDependencyField(ast, fieldJson, model) {
        var fieldId = fieldJson.field;

        var astField = new thinkehr.f4.AstField({
                rawDesc: fieldJson,
                field: fieldId
            });

        if (astField.getFieldId() === null || astField.getFieldId() === "") {
            throw new Error("Could not determine dependency field id", fieldJson);
        }

        if (thinkehr.f4.util.isArray(fieldJson.conditions)) {
            var rmType = model.getRmType().toString();
            fieldJson.conditions.forEach(function (condition) {
                var astCondition = _depCondition(fieldId, condition, rmType, model);
                if (astCondition) {
                    astField.conditions(astCondition);
                }
            });

            if (astField.conditions().length > 0) {
                ast.fields(astField);
                model.setDependencyNode(astField);
            }
        }

        return astField;
    }

    function _depCondition(fieldId, condition, rmType, model) {
        var op = _depOperator(fieldId, condition, rmType);
        if (op) {
            var lhsFunc = _getLhsComparisonFunction(op.operator, rmType, model);
            if (!lhsFunc) {
                console.warn("Could not find lhs comparison function for operator", op.operator, "and RM type", rmType, ", skipping condition creation.");
                return null;
            }
            var lhsFunctionExpr = new thinkehr.f4.AstFunctionExpression({func: lhsFunc});
            var astCondExprClass = _getConditionExpressionClass(op.operator, rmType);
            var astCondExpr = new astCondExprClass({
                lhsOperand: lhsFunctionExpr,
                operatorFunc: op.operatorFunction,
                operatorDef: op.operator,
                lhsIsMulti: model.isMulti()
            });

            if (astCondExpr.isBinary()) {
                var rhsLitFact = _getRhsComparisonLiteralFactory(op.operator, rmType);
                var rhsLit = rhsLitFact.call(null, op.operator, condition.value);
                if (!rhsLit) {
                    console.warn("Could not create rhs literal for operator", op.operator, "and RM type", rmType,
                        "and value", condition.value, ", skipping condition creation.");
                    return null;
                }
                rhsLit.setRawDesc(condition.value);
                astCondExpr.setRhsOperand(rhsLit);
            }

            var thenStatement = _depActions(condition.actions, model);

            return new thinkehr.f4.AstCondition({
                rawDesc: condition,
                expression: astCondExpr,
                thenStatement: thenStatement
            });

        } else {
            return null;
        }
    }

    function _depOperator(fieldId, condition, rmType) {
        var op = _depOperators[condition.operator];
        if (!op) {
            console.warn("Unknown or missing operator", condition.operator, "skipping dependency condition creation for", fieldId);
            return null;
        }

        if (op.types.indexOf(rmType) < 0) {
            console.warn("Operator", op.op, "not supported for RM type", rmType, "skipping condition creation for", fieldId);
            return null;
        }

        var opFunc = _getArrayOperatorFunction(op, rmType);
        if (!opFunc) {
            console.warn("No operator function defined for operator", op.op, "skipping condition creation for", fieldId);
            return null;
        }

        return {
            operator: op,
            operatorFunction: opFunc
        };
    }

    function _depActions(actions, model) {
        if (thinkehr.f4.util.isArray(actions) && actions.length > 0) {

            var actionsSt = new thinkehr.f4.AstActionsStatement({rawDesc: actions});

            actions.forEach(function(action) {
                var targetModel = model.findClosestWithPath(action.target);
                if (targetModel) {
                    var targetRmType = targetModel.getRmType().toString();
                    var actClass = _getActionStatementClass(action, targetRmType);

                    var actSt = new actClass({
                        rawDesc: action,
                        name: action.action
                    });
                    actSt.addTarget(targetModel);

                    actionsSt.actions(actSt);

                } else {
                    console.warn("Could not find target model for", action, ", skipping this action.");
                }
            });

            return actionsSt.actions().length > 0 ? actionsSt : new thinkehr.f4.AstNoopStatement();

        } else {
            return new thinkehr.f4.AstNoopStatement();
        }
    }

    //  Util
    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    function isObject(o) {
        return Object.prototype.toString.call(o) === '[object Object]';
    }

    function isString(o) {
        return Object.prototype.toString.call(o) === '[object String]';
    }

    function isDate(o) {
        return Object.prototype.toString.call(o) === '[object Date]' && !isNaN( o.getTime() );
    }

    function isInteger(o) {
        return (o === parseInt(o));
    }

    function isNumber(o) {
        return !isNaN(parseFloat(o)) && isFinite(o);
    }

    function isFunction(f) {
        var getType = {};
        return f && getType.toString.call(f) === '[object Function]';
    }

    function isValueNonEmpty(value) {

        if (value !== null && value !== undefined) {
            if (thinkehr.f4.util.isString(value) || thinkehr.f4.util.isArray(value)) {
                return value.length > 0;
            } else if (thinkehr.f4.util.isObject(value)) {
                var propCount = thinkehr.f4.util.countProperties(value);
                if (propCount === 0) {
                    return false;
                } else {
                    var keys = Object.keys(value);
                    for (var i = 0; i < keys.length; i++) {
                        var cvChild = isValueNonEmpty(value[keys[i]]);
                        if (cvChild === true) {
                            return true;
                        }
                    }

                    return false;
                }
            } else {
                return true;
            }
        }

        return false;
    }

    function deepClone(o) {
        return JSON.parse(JSON.stringify(o));
    }

    function copyArrayShallow(arr) {
        var na = new Array(arr.length);
        var i = arr.length;
        while(i--) {
            na[i] = arr[i];
        }
        return na;
    }

    function countProperties(o) {
        if (Object.keys) {
            return Object.keys(o).length;
        } else {
            var count = 0;
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    count++;
                }
            }

            return count;
        }
    }

    function getNthProperty(o, n) {
        if (Object.keys) {
            return o[Object.keys(o)[n]];
        } else {
            var count = 0;
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    if (count++ === n) {
                        return k;
                    }
                }
            }

            return null;
        }
    }

    function guid(separatorParam) {
        var separator = separatorParam ? separatorParam : '-';
        var maskStr = 'xxxxxxxx'+separator+'xxxx'+separator+'4xxx'+separator+'yxxx'+separator+'xxxxxxxxxxxx';
        return maskStr.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function toDate(o) {
        if (isString(o)) {
            var retDate = o.length > 0 ? new Date(o) : null;
            return retDate && isDate(retDate) ? retDate : null;
        }

        return o;
    }

    function toTime(o) {
        if (isString(o)) {
            if (o.length > 0) {

                var tv = "1970-01-02T" + o;
                var retDate = new Date(tv);

                return retDate && isDate(retDate) ? retDate :null;
            } else {
                return null;
            }
        }

        return o;
    }

    function toLocalTimezoneOffsetISOString (isoDateString) {
        if(isString(isoDateString)) {

            var isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
            var timeDelimiter = isoDateString.indexOf("T");
            if (timeDelimiter > 0) {
                var timezoneDelimiterIndex = isoDateString.indexOf("+");
                if (timezoneDelimiterIndex < 0) {

                    //find any characters after T delimiter
                    var anyCharsAfterTimeDelimiter = isoDateString.match(/(\D*)/g).map(function (itm, i) {
                            return itm.length && itm.match(/[^0-9\d\s\.:-]/) ? i : null
                        }).filter(function (itm) {
                            return itm > timeDelimiter
                        }).length > 0;
                    if (!anyCharsAfterTimeDelimiter) {
                        // add time value, remove millis
                        while (isoDateString.substring(timeDelimiter + 1).split(":").length <= 2) {
                            isoDateString += ':00';
                        }
                        var millisDelimiter = isoDateString.indexOf('.');
                        if (millisDelimiter > 0) {
                            isoDateString = isoDateString.substring(0, millisDelimiter);
                        }
                    }
                    if(isoDateString.search(isoDateRegex)!=0){
                        var dateStrPartSplit = isoDateString.substring(0, timeDelimiter).split('-');
                        var timeStrPartSplit = isoDateString.substring(timeDelimiter + 1).split(':');
                        var toDoubleDigit = function (val) {
                            if (val.length < 2) {
                                return ("00" + val).slice(-2);
                            }
                            return val
                        };
                        dateStrPartSplit=dateStrPartSplit.map(toDoubleDigit).join('-');
                        timeStrPartSplit = timeStrPartSplit.map(toDoubleDigit).join(':');
                        isoDateString=dateStrPartSplit+'T'+timeStrPartSplit
                    }
                }
            }

            if (isoDateString.search(isoDateRegex) == 0) {
                var pad = function (num) {
                        var norm = Math.abs(Math.floor(num));
                        return (norm < 10 ? '0' : '') + norm;
                    },
                    tzo = -(new Date(isoDateString)).getTimezoneOffset(),
                    sign = tzo >= 0 ? '+' : '-';
                return isoDateString+ '.000' + sign + pad(tzo / 60) + ':' + pad(tzo % 60);
            } else {
                return isoDateString;
            }
        }
        return isoDateString;
    }

    function toDateApplyTzDiff(o) {

        var d;
        if (isString(o)) {
            d = o.length > 0 ? new Date(o) : null;
        } else if (isDate(o)) {
            d = o;
        }

        if (d) {
            var curDate = new Date();
            var offsetMs = curDate.getTimezoneOffset() * 60 * 1000;
            var dMs = d.getTime();
            var modifiedTs = dMs + offsetMs;
            d = new Date();
            d.setTime(modifiedTs);

            return d;
        }

        return o;
    }

    function toUtcDate(o) {
        if (isDate(o)) {
            var offsetMs = o.getTimezoneOffset() * 60 * 1000;
            if (offsetMs === 0) {
                return o;
            } else {
                var d = new Date();
                d.setTime(o.getTime() + offsetMs);
                return d;
            }
        }

        return o;
    }

    function dateFromISO(s){
        var testIso = '2011-11-24T09:00:27';
        // Chrome
        var diso= Date.parse(testIso);
        if(diso===1322118027000) return function (s) {
            return new Date(Date.parse(s));
        };
        // JS 1.8 gecko
        var noOffset = function (s) {
            var day = s.slice(0, -5).split(/\D/).map(function (itm) {
                return parseInt(itm, 10) || 0;
            });
            day[1] -= 1;
            day = new Date(Date.UTC.apply(Date, day));
            var offsetString = s.slice(-5);
            var offset = parseInt(offsetString, 10) / 100;
            if (offsetString.slice(0, 1) == "+") offset *= -1;
            day.setHours(day.getHours() + offset);
            return day.getTime();
        };
        if (noOffset(testIso)===1322118027000) {
            return noOffset;
        }
        var ret = function (s) { // kennebec@SO + QTax@SO
            var day, tz,
//        rx = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d{4}))?$/,
                rx = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):?(\d\d))?$/,

                p = rx.exec(s) || [];
            if (p[1]) {
                day = p[1].split(/\D/).map(function (itm) {
                    return parseInt(itm, 10) || 0;
                });
                day[1] -= 1;
                day = new Date(Date.UTC.apply(Date, day));
                if (!day.getDate()) return NaN;
                if (p[5]) {
                    tz = parseInt(p[5], 10) / 100 * 60;
                    if (p[6]) tz += parseInt(p[6], 10);
                    if (p[4] == "+") tz *= -1;
                    if (tz) day.setUTCMinutes(day.getUTCMinutes() + tz);
                }
                return day;
            }
            return NaN;
        };
        return ret(s)
    }

    function isSameTimezone(d1, d2) {
        if (isDate(d1) && isDate(d2)) {
            return d1.getTimezoneOffset() === d2.getTimezoneOffset();
        }

        return false;
    }

    function sanitizeName(name) {
        return name.replace(/[\/:-]/g, "_");
    }

    // Periods
    (function (nezasa, undefined) {

        // create sub packages
        if (!nezasa.iso8601) nezasa.iso8601 = {};
        if (!nezasa.iso8601.Period) nezasa.iso8601.Period = {};

        //---- public properties

        nezasa.iso8601.version = '0.2';

        //---- public methods

        nezasa.iso8601.Period.parse = function (period, distributeOverflow) {
            return parsePeriodString(period, distributeOverflow);
        };

        nezasa.iso8601.Period.parseToTotalSeconds = function (period) {

            var multiplicators = [
                31104000 /* year   (360*24*60*60) */,
                2592000  /* month  (30*24*60*60) */,
                604800   /* week   (24*60*60*7) */,
                86400    /* day    (24*60*60) */,
                3600     /* hour   (60*60) */,
                60       /* minute (60) */,
                1        /* second (1) */];
            var durationPerUnit = parsePeriodString(period);
            var durationInSeconds = 0;

            for (var i = 0; i < durationPerUnit.length; i++) {
                var dpu = durationPerUnit[i];
                if (!isNumber(dpu)) {
                    dpu = 0;
                }
                durationInSeconds += durationPerUnit[i] * multiplicators[i];
            }

            return durationInSeconds;
        };


        nezasa.iso8601.Period.isValid = function (period) {
            try {
                parsePeriodString(period);
                return true;
            } catch (e) {
                return false;
            }
        };

        nezasa.iso8601.Period.periodToString = function (periodArray) {
            if (!thinkehr.f4.util.isArray(periodArray) || periodArray.length !== 7) {
                return null;
            } else {
                var periodMarkers = ["Y", "M", "W", "D", "H", "M", "S"];

                var ps = "P";
                var hasDatePd = false;
                var hasTimePd = false;

                periodArray.forEach(function (p, i) {
                    if (i === 4) {
                        ps += "T";
                    }

                    if (p !== 0 && p !== null) {
                        ps += (p + periodMarkers[i]);
                        if (!hasDatePd) {
                            hasDatePd = i <= 3;
                        }
                        if (!hasTimePd) {
                            hasTimePd = i >= 4;
                        }
                    }
                });

                if (!hasDatePd && !hasTimePd) {
                    ps = null;
                } else if (!hasTimePd) {
                    ps = ps.substring(0, ps.length - 1);
                }

                return ps;
            }
        };

        //---- private methods

        /**
         * Parses a ISO8601 period string.
         * @param period iso8601 period string
         * @param _distributeOverflow if 'true', the unit overflows are merge into the next higher units.
         */
        function parsePeriodString(period, _distributeOverflow) {

            // regex splits as follows
            // grp0 omitted as it is equal to the sample
            //
            // | sample            | grp1   | grp2 | grp3 | grp4 | grp5 | grp6       | grp7 | grp8 | grp9 |
            // --------------------------------------------------------------------------------------------
            // | P1Y2M3W           | 1Y2M3W | 1Y   | 2M   | 3W   | 4D   | T12H30M17S | 12H  | 30M  | 17S  |
            // | P3Y6M4DT12H30M17S | 3Y6M4D | 3Y   | 6M   |      | 4D   | T12H30M17S | 12H  | 30M  | 17S  |
            // | P1M               | 1M     |      | 1M   |      |      |            |      |      |      |
            // | PT1M              | 3Y6M4D |      |      |      |      | T1M        |      | 1M   |      |
            // --------------------------------------------------------------------------------------------

            var distributeOverflow = (_distributeOverflow) ? _distributeOverflow : false;
            var valueIndexes = [2, 3, 4, 5, 7, 8, 9];
            var duration = [0, 0, 0, 0, 0, 0, 0];
            var overflowLimits = [0, 12, 4, 7, 24, 60, 60];
            var struct;

            // upcase the string just in case people don't follow the letter of the law
            if (period === null || period === undefined) {
                return [null, null, null, null, null, null, null];
            }
            period = period.toUpperCase();

            // input validation
            if (!period){
                return duration;
            }
            else if (typeof period !== "string") throw new Error("Invalid iso8601 period string '" + period + "'");

            // parse the string
            if (struct = /^P((\d+Y)?(\d+M)?(\d+W)?(\d+D)?)?(T(\d+H)?(\d+M)?(\d+S)?)?$/.exec(period)) {

                // remove letters, replace by 0 if not defined
                for (var i = 0; i < valueIndexes.length; i++) {
                    var structIndex = valueIndexes[i];
                    duration[i] = struct[structIndex] ? +struct[structIndex].replace(/[A-Za-z]+/g, '') : 0;
                }
            }
            else {
                throw new Error("String '" + period + "' is not a valid ISO8601 period.");
            }

            if (distributeOverflow) {
                // note: stop at 1 to ignore overflow of years
                for (i = duration.length - 1; i > 0; i--) {
                    if (duration[i] >= overflowLimits[i]) {
                        duration[i - 1] = duration[i - 1] + Math.floor(duration[i] / overflowLimits[i]);
                        duration[i] = duration[i] % overflowLimits[i];
                    }
                }
            }

            return duration;
        }

    }(window.nezasaEhr = window.nezasaEhr || {}));

    thinkehr.f4.util.isArray = isArray;
    thinkehr.f4.util.isObject = isObject;
    thinkehr.f4.util.isString = isString;
    thinkehr.f4.util.isDate = isDate;
    thinkehr.f4.util.isNumber = isNumber;
    thinkehr.f4.util.isInteger = isInteger;
    thinkehr.f4.util.isFunction = isFunction;
    thinkehr.f4.util.isValueNonEmpty = isValueNonEmpty;
    thinkehr.f4.util.deepClone = deepClone;
    thinkehr.f4.util.countProperties = countProperties;
    thinkehr.f4.util.getNthProperty = getNthProperty;
    thinkehr.f4.util.guid = guid;
    thinkehr.f4.util.toDate = toDate;
    thinkehr.f4.util.toTime = toTime;
    thinkehr.f4.util.toLocalTimezoneOffsetISOString = toLocalTimezoneOffsetISOString;
    thinkehr.f4.util.toDateApplyTzDiff = toDateApplyTzDiff;
    thinkehr.f4.util.toUtcDate = toUtcDate;
    thinkehr.f4.util.dateFromISO = dateFromISO;
    thinkehr.f4.util.isSameTimezone = isSameTimezone;
    thinkehr.f4.util.sanitizeName = sanitizeName;
    thinkehr.f4.util.copyArrayShallow = copyArrayShallow;

    // Exports
    thinkehr.f4.parseViewConfig = parseViewConfig;
    thinkehr.f4.parseFormDescription = parseFormDescription;
    thinkehr.f4.parseFormDescriptionSnippet = parseFormDescriptionSnippet;
    thinkehr.f4.parseDependencies = parseDependencies;
    thinkehr.f4.parseDependencyField = parseDependencyField;
    thinkehr.f4.parseInputItems = parseInputItems;
    thinkehr.f4.getThenStatementsWithModelPath = getThenStatementsWithModelPath;
    thinkehr.f4.duplicateModel = duplicateModel;
    thinkehr.f4.destroyModel = destroyModel;
    thinkehr.f4.refreshValues = refreshValues;
    thinkehr.f4.recursivelyForChildModels = recursivelyForChildModels;
    thinkehr.f4.isCustomFunctionCustomComponent = isCustomFunctionCustomComponent;
    thinkehr.f4.getCustomFunctionReference = getCustomFunctionReference;
    thinkehr.f4.setExternalContext = setExternalContext;
    thinkehr.f4.getDependancyOperatorFunction=_getArrayOperatorFunction
})();

//---Enumerations-----------------------------------------------------------------------------------------------------------------------------------------------

// RM Types enumeration
thinkehr.f4.RmType = thinkehr.f4.enumeration({
    FORM_DEFINITION: 0,
    GENERIC_FIELDSET: 1,
    DV_QUANTITY: 2,
    DV_CODED_TEXT: 3,
    DV_TEXT: 4,
    DV_PROPORTION: 5,
    DV_BOOLEAN: 6,
    DV_DATE: 7,
    DV_TIME: 8,
    DV_DATE_TIME: 9,
    DV_ORDINAL: 10,
    DV_COUNT: 11,
    DV_DURATION: 12,
    DV_URI: 13,
    DV_EHR_URI: 14,
    GENERIC_FIELD:15,
    DV_MULTIMEDIA: 16,
    DV_PARSABLE:17,
    OBSERVATION: 1001,
    EVENT: 1002,
    COMPOSITION: 1003,
    SECTION: 1004,
    EVALUATION: 1005,
    INSTRUCTION: 1006,
    ACTION: 1007,
    ISM_TRANSITION: 1008,
    CUSTOM: 10000
});

// FieldSize
thinkehr.f4.FieldSize = thinkehr.f4.enumeration({
    INHERIT: 0,
    SMALL: 1,
    MEDIUM: 2,
    LARGE: 3
});

thinkehr.f4.LabelSize = thinkehr.f4.enumeration({
    INHERIT: 0
});

// Field alignment
thinkehr.f4.FieldHorizontalAlignment = thinkehr.f4.enumeration({
    INHERIT: 0,
    LEFT: 1,
    CENTER: 2,
    RIGHT: 3
});

thinkehr.f4.FieldVerticalAlignment = thinkehr.f4.enumeration({
    INHERIT: 0,
    TOP: 1,
    MIDDLE: 2,
    BOTTOM: 3
});

// Label alignment
thinkehr.f4.LabelHorizontalAlignment = thinkehr.f4.enumeration({
    INHERIT: 0,
    TOP: 1,
    LEFT: 2,
    RIGHT: 3
});

thinkehr.f4.LabelVerticalAlignment = thinkehr.f4.enumeration({
    INHERIT: 0,
    TOP: 1,
    MIDDLE: 2,
    BOTTOM: 3
});

thinkehr.f4.InputType = thinkehr.f4.enumeration({
    DECIMAL: 0,
    CODED_TEXT: 1,
    TEXT: 2,
    INTEGER: 3,
    BOOLEAN: 4,
    DATE: 5,
    TIME: 6,
    DATETIME: 7
});

thinkehr.f4.FieldPresentation = thinkehr.f4.enumeration({
    COMBOBOX: 0,
    RADIOS: 1,
    TEXTFIELD: 2,
    TEXTAREA: 3
});

//---Model Properties--------------------------------------------------------------------------------------------------------------------------------------------

thinkehr.f4.Object = Object._extendM({
    init: function (properties) {
        if (properties) {
            for (var prop in properties) {
                if (properties.hasOwnProperty(prop)) {
                    this[prop] = properties[prop];
                }
            }
        }
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Object";
    }
});

thinkehr.f4.ViewConfig = thinkehr.f4.Object._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.model === undefined) {
            this.model = null;
        }
        if (this.label === undefined) {
            this.label = null;
        }
        if (this.size === undefined) {
            this.size = null;
        }
        if (this.layout === undefined) {
            this.layout = null;
        }
        if (this.field === undefined) {
            this.field = {};
        }
        if (this.hidden === undefined) {
            this.hidden = false;
        }
        if (this.readonly === undefined) {
            this.readonly = false;
        }
        if (this.viewmode === undefined) {
            this.viewmode = false;
        }
        if (this.min === undefined) {
            this.min = null;
        }
        if (this.max === undefined) {
            this.max = null
        }
        if (this.tags === undefined) {
            this.tags = [];
        }
        if (this.annotations === undefined) {
            this.annotations = {};
        }
        if (this.datasource === undefined) {
            this.datasource = {};
        }
        if (this._multiplicityStr === undefined) {
            this._multiplicityStr = null;
        }
    },

    getModel: function () {
        return this.model;
    },

    setModel: function (model) {
        this.model = model;
    },

    getLabel: function () {
        return this.label;
    },

    setLabel: function (label) {
        this.label = label;
    },

    getSize: function (hierarchy) {
        return this._getHierarchicalViewConfigProperty(hierarchy, "size", this.getSize)
    },

    setSize: function (size) {
        this.size = size;
    },

    getLayout: function (hierarchy) {
        return this._getHierarchicalViewConfigProperty(hierarchy, "layout", this.getLayout);
    },

    setLayout: function (layout) {
        this.layout = layout;
    },

    getField: function (forInput) {
        var f;
        if (forInput !== undefined) {
            f = this.field[forInput];
            if (!f) {
                f = null;
            }
        } else {
            var keyCount = thinkehr.f4.util.countProperties(this.field);
            f = keyCount === 1 ? thinkehr.f4.util.getNthProperty(this.field, 0) : null;
            if (!f && this.field.input) {
                f = this.field.input;
            }
        }

        return f;
    },

    setField: function (field) {
        this.field = field;
    },

    getFields: function () {
        return this.field;
    },

    isHidden: function () {
        return this.hidden;
    },

    setHidden: function (hidden) {
        this.hidden = hidden;
    },

    isReadOnly: function () {
        return this.readonly;
    },

    setReadOnly: function (readonly) {
        this.readonly = readonly;
    },

    isViewMode: function () {
        return !!this.viewmode || this.hasTag('viewmode');
    },

    getViewMode: function () {
        return this.viewmode;
    },

    setViewMode: function (viewmode) {
        this.viewmode = viewmode;
    },

    isLabelHidden: function () {
        if(this.size && this.size.label!=null) {
            var valInt = parseInt(this.size.label);
            return !isNaN(valInt) && valInt==-1 ;
        }
        return false;
    },

    getMin: function (hierarchy) {
        return this._getModelPropertyIfNotOwn(hierarchy, "min", "getMin");
    },

    setMin: function (min) {
        this.min = min;
    },

    getMax: function (hierarchy) {
        return this._getModelPropertyIfNotOwn(hierarchy, "max", "getMax");
    },

    setMax: function (max) {
        this.max = max;
    },

    getMultiplicityString: function () {
        if (!this._multiplicityStr) {
            var min = this.min, max = this.max;

            if (min == undefined || min < 0) min = "*";
            if (max == undefined || max < 0) max = "*";

            this._multiplicityStr = "[" + min + ".." + max + "]";
        }

        return this._multiplicityStr;
    },

    getTerminology: function () {
        if(this.datasource && this.datasource.loadRemote==true) {
            return this.datasource.loadRemoteUrl;
        }
        return null;
    },

    getTerminologyResolver: function(){
        if(this.datasource ) {
            return this.datasource.terminology;
        }
        return null;
    },

    getTags: function() {
        return this.tags;
    },

    hasTag: function(tag) {
        return this.tags.indexOf(tag) >= 0;
    },

    getAnnotations: function () {
        return this.annotations;
    },

    hasAnnotation: function (key) {
        return this.annotations[key] !== undefined;
    },

    annotationValue: function (key) {
        return this.annotations[key];
    },

    _getModelPropertyIfNotOwn: function (hierarchy, property, getterProperty) {
        if (hierarchy === false || this[property] != null) {
            return this[property];
        }

        if (this.model && this.model[getterProperty]) {
            return this.model[getterProperty].call(this.model);
        }

        return null;
    },

    _getHierarchicalViewConfigProperty: function (hierarchy, property, getter) {
        if (hierarchy === false || this[property] != null) {
            return this[property];
        }
        if (this.model != null && this.model.getParentModel()) {
            return getter.call(this.model.getParentModel().getViewConfig(), true);
        }

        return null;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.ViewConfig";
    }
});

thinkehr.f4.ViewConfigProperty = thinkehr.f4.Object._extendM({
    init: function (properties) {
        this._super(properties);
        if (this.viewConfig === undefined) {
            this.viewConfig = null;
        }
    },

    getViewConfig: function () {
        return this.viewConfig;
    },
    setViewConfig: function (viewConfig) {
        this.viewConfig = viewConfig;
    },

    /**
     * Calls a hierarchical property, sort of reflectively up the chain.
     *
     */
    _getHierarchicalProperty: function (hierarchy, propKey, inheritValue, fieldGetter, containingObjGetterProp) {
        if (hierarchy === false || (this[propKey] && this[propKey] != inheritValue)) {
            return this[propKey];
        }

        var containingObjGetter = this._getParentViewConfig() ? this._getParentViewConfig()[containingObjGetterProp] : null;
        if (containingObjGetter && containingObjGetter.call(this._getParentViewConfig(), true)) {
            return fieldGetter.call(containingObjGetter.call(this._getParentViewConfig(), true), true);
        }

        return this[propKey];
    },

    _getParentViewConfig: function () {
        if (this.viewConfig.getModel() && this.viewConfig.getModel().getParentModel() &&
            this.viewConfig.getModel().getParentModel() instanceof thinkehr.f4.FormObjectModel) {
            return this.viewConfig.getModel().getParentModel().getViewConfig();
        }

        return null;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.ViewConfigProperty";
    }
});

thinkehr.f4.Size = thinkehr.f4.ViewConfigProperty._extendM({
    init: function (properties) {
        this._super(properties);
        if (this.field === undefined) {
            this.field = null;
        }
        if (this.label === undefined) {
            this.label = null;
        }
    },

    getField: function (hierarchy) {
        return this._getHierarchicalProperty(hierarchy, "field", thinkehr.f4.FieldSize.INHERIT, this.getField, "getSize");
    },

    setField: function (field) {
        this.field = field;
    },

    getLabel: function (hierarchy) {
        return this._getHierarchicalProperty(hierarchy, "label", thinkehr.f4.LabelSize.INHERIT, this.getLabel, "getSize");
    },

    setLabel: function (label) {
        this.label = label;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Size/ViewConfigProperty";
    }
});

thinkehr.f4.Layout = thinkehr.f4.ViewConfigProperty._extendM({
    init: function (properties) {
        this._super(properties);
        if (this.viewConfig === undefined) {
            this.viewConfig = null;
        }
        if (this.fieldHorizontalAlignment === undefined) {
            this.fieldHorizontalAlignment = null;
        }
        if (this.fieldVerticalAlignment === undefined) {
            this.fieldVerticalAlignment = null;
        }
        if (this.labelHorizontalAlignment === undefined) {
            this.labelHorizontalAlignment = null;
        }
        if (this.labelVerticalAlignment === undefined) {
            this.labelVerticalAlignment = null;
        }
    },

    getFieldHorizontalAlignment: function (hierarchy) {
        return this._getHierarchicalProperty(
            hierarchy,
            "fieldHorizontalAlignment",
            thinkehr.f4.FieldHorizontalAlignment.INHERIT,
            this.getFieldHorizontalAlignment,
            "getLayout"
        );
    },

    setFieldHorizontalAlignment: function (alignment) {
        this.fieldHorizontalAlignment = alignment;
    },

    getFieldVerticalAlignment: function (hierarchy) {
        return this._getHierarchicalProperty(
            hierarchy,
            "fieldVerticalAlignment",
            thinkehr.f4.FieldVerticalAlignment.INHERIT,
            this.getFieldVerticalAlignment,
            "getLayout"
        );
    },

    setFieldVerticalAlignment: function (alignment) {
        this.fieldVerticalAlignment = alignment;
    },

    getLabelHorizontalAlignment: function (hierarchy) {
        return this._getHierarchicalProperty(
            hierarchy,
            "labelHorizontalAlignment",
            thinkehr.f4.LabelHorizontalAlignment.INHERIT,
            this.getLabelHorizontalAlignment,
            "getLayout"
        );
    },

    setLabelHorizontalAlignment: function (alignment) {
        this.labelHorizontalAlignment = alignment;
    },

    getLabelVerticalAlignment: function (hierarchy) {
        return this._getHierarchicalProperty(
            hierarchy,
            "labelVerticalAlignment",
            thinkehr.f4.LabelVerticalAlignment.INHERIT,
            this.getLabelVerticalAlignment,
            "getLayout"
        );
    },

    setLabelVerticalAlignment: function (alignment) {
        this.labelVerticalAlignment = alignment;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Layout/ViewConfigProperty";
    }
});

thinkehr.f4.Label = thinkehr.f4.ViewConfigProperty._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.custom === undefined) {
            this.custom = false;
        }

        if (this.value === undefined) {
            this.value = null;
        }

        if (this.useLocalizations === undefined) {
            this.useLocalizations = false;
        }

        if (this.localizationsList === undefined) {
            this.localizationsList = {};
        }
    },

    isCustom: function () {
        return this.custom;
    },

    setCustom: function (custom) {
        this.custom = custom;
    },

    getValue: function () {
        return this.value;
    },

    setValue: function (value) {
        this.value = value;
    },

    isUseLocalizations: function () {
        return this.useLocalizations;
    },

    setUseLocalizations: function (useLocalizations) {
        this.useLocalizations = useLocalizations;
    },

    getLocalization: function (locale) {
        var l = this.localizationsList[locale];
        return l ? l : null;
    },

    setLocalizations: function (localizationsList) {
        this.localizationsList = localizationsList;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Label/ViewConfigProperty";
    }
});

thinkehr.f4.Field = thinkehr.f4.ViewConfigProperty._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.presentation === undefined) {
            this.presentation = null;
        }
        if (this.columns === undefined) {
            this.columns = null;
        }
        if (this.lines === undefined) {
            this.lines = null;
        }
    },

    getPresentation: function () {
        return this.presentation;
    },

    setPresentation: function (presentation) {
        this.presentation = presentation;
    },

    getColumns: function () {
        return this.columns;
    },

    setColumns: function (columns) {
        this.columns = columns;
    },

    getLines: function () {
        return this.lines;
    },

    setLines: function (lines) {
        this.lines = lines;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Field/ViewConfigProperty";
    }
});

thinkehr.f4.Input = thinkehr.f4.Object._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.suffix === undefined) {
            this.suffix = null;
        }

        if (this.type === undefined) {
            this.type = null;
        }

        if (this.list === undefined) {
            this.list = [];
        }

        if (this.validation === undefined) {
            this.validation = null;
        }

        if (this.listOpen === undefined) {
            this.listOpen = false;
        }

        if (this.defaultValue === undefined) {
            this.defaultValue = null;
        }

        if (this.defaultInputItem === undefined) {
            this.defaultInputItem = null;
        }

        if (this.terminology === undefined) {
            this.terminology = null;
        }

        if (this.context === undefined) {
            this.context = null;
        }

        if (this.inputForModel === undefined) {
            this.inputForModel = null;
        }

        if(this.terminologyListCache === undefined) {
            this.terminologyListCache = {};
        }

        this._lastTerminologySearchStrId = null;

    },

    getSuffix: function () {
        return this.suffix;
    },

    setSuffix: function (suffix) {
        this.suffix = suffix;
    },

    setInputForModel: function (model) {
        this.inputForModel = model;
    },

    getType: function () {
        return this.type;
    },

    setType: function (type) {
        this.type = type;
    },

    getTerminologyItemsWithLabel: function (qryParam, callbackFn ) {
        var qryString;
        if(thinkehr.f4.util.isObject(qryParam)){
            if( qryParam.all==true){
                qryString = '';
            }
            if(qryParam.query!=null) {
                qryString = qryParam.query;
            }
            if(qryParam.force==true) {
                this._lastTerminologySearchStrId=null;
            }
        }else{
            qryString = qryParam;
        }
        
        var newLabelStrId = this._createLastTermStringId(qryString);
        var terminologyStr = this.getTerminology();
        if(terminologyStr && this._lastTerminologySearchStrId!== newLabelStrId) {
            var resolverFn = this._getTerminologyResolverFn();

            if(!resolverFn && this.getContext().getTerminologyList && this.getContext().getTerminologyList instanceof Function) {
               resolverFn = this.getContext().getTerminologyList;
            }

            this._lastTerminologySearchStrId = newLabelStrId;
            this.setList([]);
            if(!resolverFn){
                console.warn("'getTerminologyList' method not defined on form context object neither terminology resolver on field.");
                callbackFn(this.getList(), qryParam);
                return;
            }

            var reqLang = this.getContext().language;
            resolverFn(terminologyStr, qryParam,  reqLang, function (terminologyResultArr, resLanguage) {
                var lang = resLanguage || reqLang;
                if(terminologyResultArr && terminologyResultArr.length) {
                    terminologyResultArr=thinkehr.f4.Input._toLabelValuePropsArr(terminologyResultArr, lang, terminologyStr);
                    this.setList(thinkehr.f4.parseInputItems(terminologyResultArr),true);
                }
                if(callbackFn){
                    callbackFn(this.getList(), qryParam);
                }
            }.bind(this), false);
            return
        }else if(callbackFn){
                callbackFn(this.getList(),qryParam);
        }
    },
    
    _getTerminologyResolverFn:function(){
        var resolverFn = null;
        if(this.inputForModel.getViewConfig().getTerminologyResolver()){
            try{
                resolverFn = eval(this.inputForModel.getViewConfig().getTerminologyResolver());
                if(!(resolverFn instanceof Function)) {
                    resolverFn = null;
                }
            }catch (e){}
        }
        return resolverFn;
    },


    getList: function () {
        return this.list;
    },

    getTerminologyListCache: function () {
        if(!this.terminologyListCache[this.getTerminology()]) {
            this.terminologyListCache[this.getTerminology()] = {};
        }
        return this.terminologyListCache[this.getTerminology()];
    },

    setList: function (list, skipLoadFromTerminology) {
        list.forEach(function (inputItem) {
            this._connectItemToTerminology(inputItem, skipLoadFromTerminology);
        }, this);
        this.list = list;
    },

    getItem: function (index) {
        return index >= 0 && index < this.list.length ? this.list[index] : null;
    },

    addItem: function (item, skipLoadFromTerminology) {
        this._connectItemToTerminology(item, skipLoadFromTerminology);
        this.list.push(item);
    },

    hasItems: function () {
        return this.list.length > 0;
    },

    getValidation: function () {
        return this.validation;
    },

    setValidation: function (validation) {
        this.validation = validation;
    },

    isListOpen: function () {
        return this.listOpen;
    },

    setListOpen: function (listOpen) {
        this.listOpen = listOpen;
    },

    getDefaultValue: function () {
        return this.defaultValue;
    },

    _createTerminologyItem: function (value, skipTerminologyLoad, createWithDefaultValues) {
        if(value && this.getTerminology()){
            var termItem = thinkehr.f4.parseInputItems([{
                value: value,
                label: createWithDefaultValues && createWithDefaultValues.label ? createWithDefaultValues.label : 'value (' + value + ')',
                localizedLabels: createWithDefaultValues && createWithDefaultValues.localizedLabels ? createWithDefaultValues.localizedLabels : {}
            }])[0];
            this._connectItemToTerminology(termItem, skipTerminologyLoad);
            return termItem;
        }
    },

    getDefaultInputItem: function (createWithDefaultValues) {
        var defValue = this.getDefaultValue();
        if(!this.defaultInputItem && defValue) {
            this.defaultInputItem = this.findInputItemByValue(defValue, true);
            if(!this.defaultInputItem && this.getTerminology()) {
                this.defaultInputItem=this._createTerminologyItem(defValue, false, createWithDefaultValues);
            }
        }
        return this.defaultInputItem;
    },
    
    findInputItemByValue: function (value, skipDefault, createWithDefaultValues) {
        var listArr = this.getList();
        for (var i = 0; i < listArr.length; i++) {
            if (listArr[i].value === value) {
                return listArr[i];
            }
        }

        if(value && this.getTerminology()){

            var retItem = this.getTerminologyListCache()[value];
            if(!retItem) {
                retItem = this._createTerminologyItem(value, false, createWithDefaultValues);
                this.addItem(retItem);
            }
            return retItem;
        }

        if(!skipDefault){
            var defaultItem = this.getDefaultInputItem();
            if(defaultItem && defaultItem.value===value){
                return defaultItem;
            }
        }

        return null;
    },

    setDefaultValue: function (defaultValue) {
        var newDefaultInputItem = this.findInputItemByValue(defaultValue, true);
        if(newDefaultInputItem) {
            this.defaultValue = defaultValue;
            this.defaultInputItem = newDefaultInputItem;
        }
    },

    getContext: function () {
        return this.context;
    },

    getTerminology: function () {
        return this.terminology;
    },

    setTerminology: function (terminology, reloadLastSearch) {
        var update = this.terminology != terminology;
        if(update) {
            this.terminology=terminology;
            if(reloadLastSearch) {
                this.reloadListFromTerminology();
            }else{
                this.setList([]);
            }
        }
    },

    setContext: function (context, skipLoadFromTerminology) {
        var update = false;
        if (!skipLoadFromTerminology && this.context && context.language && this.context.language != context.language) {
            update = true;
        }
        this.context = context;
        if (update) {
            this.reloadListFromTerminology();
        }
        this.getList().forEach(function (item) {
            item.setContext(this.getContext(), false);
        }, this);
    },

    reloadListFromTerminology: function () {
        var lastQueryStr = this._getLastTermQryString(this._lastTerminologySearchStrId);
        if (lastQueryStr) {
            this.getTerminologyItemsWithLabel(lastQueryStr, null);
        }
    },

    _createLastTermStringId:function (labelString) {
        var language = this.getContext()?this.getContext().language:'noLang';
        return labelString + '~' + language + '~' + this.getTerminology();
    },

    _tokenizeLastTermStringId:function (lastTermLabelStr) {
        return lastTermLabelStr?lastTermLabelStr.split('~'):null;
    },

    _getLastTermQryString:function (lastTermLabelStr) {
        var splArr = this._tokenizeLastTermStringId(lastTermLabelStr);
        if(splArr) {
            splArr.splice(splArr.length - 2, 2);
            return splArr.join("");
        }
        return null;
    },

    _connectItemToTerminology:function (inputItem, skipLoadFromTerminology) {
        if(this.getTerminology()) {
            inputItem.setTerminologyResolverFn(this._getTerminologyResolverFn());
            inputItem.setContext(this.getContext(), true);
            inputItem.setTerminology(this.getTerminology(),skipLoadFromTerminology);
            var cachedInputItem = this.getTerminologyListCache()[inputItem.value];
            if(!cachedInputItem){
                this.getTerminologyListCache()[inputItem.value] = inputItem;
            }else{
                if(cachedInputItem.onUpdateCallback) {
                    cachedInputItem.applyValuesFrom(inputItem);
                    cachedInputItem.onUpdateCallback.call(undefined, cachedInputItem);
                }
            }
        }
    },

/*
 * @Override
 */
    toString: function () {
        return "thinkehr.f4.Input";
    }
});

thinkehr.f4.Input._toLabelValuePropsArr = function (codeDescPropsArr, lang, fromTerminologyStr) {
    var ret = [];
    for (var i = 0; i < codeDescPropsArr.length; i++) {
        ret.push(thinkehr.f4.InputItem._toLabelValuePropsItem(codeDescPropsArr[i], lang, fromTerminologyStr));
    }
    return ret;
};

thinkehr.f4.Input.loadItemFromTerminology = function (codeValue, callbackFn, language, terminologyCodeSystem, context, resolverFn) {
    if (terminologyCodeSystem && context) {
        var reqLang = language || context.language;
        if(!resolverFn && context && context.getTerminologyItem && context.getTerminologyItem instanceof Function) {
            resolverFn = context.getTerminologyItem;
        }
        if (resolverFn) {
            resolverFn(terminologyCodeSystem, codeValue, reqLang, function (resItem) {
                thinkehr.f4.InputItem._toLabelValuePropsItem(resItem, reqLang, terminologyCodeSystem);
                if (callbackFn) {
                    callbackFn(resItem);
                }
            }, true);
            return true;
        } else {
            console.warn("'getTerminologyItem' method not defined on form context object");
        }
    }
    if (callbackFn) {
        callbackFn(null);
    }
    return false;
};

thinkehr.f4.InputItem = thinkehr.f4.Object._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.value === undefined) {
            this.value = null;
        }

        if (this.label === undefined) {
            this.label = null;
        }

        if (this.validation === undefined) {
            this.validation = null;
        }

        if (this.localizedLabels === undefined) {
            this.localizedLabels = {};
        }
        if (this.onUpdateCallback === undefined) {
            this.onUpdateCallback = null;
        }
        if (this.terminology === undefined) {
            this.terminology = null;
        }
        if (this.context === undefined) {
            this.context = null;
        }
        if (this.status === undefined) {
            this.status = null;
        }
        if (this.parentInput === undefined) {
            this.parentInput = null;
        }
        this._loadTerminologyRequestIdsInProgress = null;
        this._stashedLabelValue = '';
    },

    getValue: function () {
        return this.value;
    },

    setValue: function (value) {
        this.value = value;
    },

    getLabel: function (locale) {
        if (locale) {
            var l = this.localizedLabels ? this.localizedLabels[locale] : null;
            if(locale && l==null ){
                this.updateFromTerminology(locale);
            }
            return l ? l : this.label;
        }

        return this.label;
    },

    setLabel: function (label) {
        this.label = label;
    },

    getValidation: function () {
        return this.validation;
    },

    setValidation: function (validation) {
        this.validation = validation;
    },

    setLocalizedLabels: function (localizedLabels) {
        this.localizedLabels = localizedLabels;
    },

    setLocalizedLabel: function (language, value) {
        if(language){
            if(!this.localizedLabels){
                this.setLocalizedLabels({});
            }
            this.localizedLabels[language]=value;
        }

    },

    setOnUpdateCallback: function (onUpdateCallback) {
        this.onUpdateCallback = onUpdateCallback;
    },

    getTerminologyResolverFn: function () {
        return this.terminologyResolverFn;
    },

    setTerminologyResolverFn: function (resolverFn) {
        this.terminologyResolverFn = resolverFn;
    },

    getTerminology: function () {
        return this.terminology;
    },

    setTerminology: function (terminologyStr, skipTerminologyUpdate) {
        var update = this.terminology!=terminologyStr;
        this.terminology = terminologyStr;
        if(update && !skipTerminologyUpdate) {
            this.setLocalizedLabels({});
            this.updateFromTerminology();
        }
    },

    getContext: function () {
        return this.context;
    },

    setContext: function (context, skipLoadFromTerminology) {
        this.context = context;
        if(!skipLoadFromTerminology) {
            this.updateFromTerminology();
        }
    },

    applyValuesFrom: function(inputItemObj){
        if(inputItemObj) {
            this.label = inputItemObj.label;
            this.validation = inputItemObj.validation;
            if(inputItemObj.localizedLabels){
                for(var langProp in inputItemObj.localizedLabels) {
                    if(inputItemObj.localizedLabels.hasOwnProperty(langProp)) {
                        this.localizedLabels[langProp] = inputItemObj.localizedLabels[langProp];
                    }
                }
            }
            if(this.onUpdateCallback) {
                this.onUpdateCallback.call(undefined, this);
            }
        }
    },

    updateFromTerminology: function (language) {
        if(!language) {
            language=this.getContext().language
        }
        var terminologyCodeSystem = this.getTerminology();
        if(terminologyCodeSystem) {
            var createRequestIdString = function (terminologyCodeSystem, currVal, reqLang) {
                return terminologyCodeSystem + ':' + currVal + ':' + reqLang;
            };
            var context = this.getContext();
            var currVal = this.getValue();
            var loadTermId = createRequestIdString(terminologyCodeSystem, currVal, language);
            if (this.localizedLabels[language] == null && this._loadTerminologyRequestIdsInProgress != loadTermId){

                var resolveFn = this.getTerminologyResolverFn();

                var requestMade = thinkehr.f4.Input.loadItemFromTerminology(currVal, function (terminologyItem) {
                    var notFound = terminologyItem == null;
                    if(!terminologyItem) {
                        terminologyItem = {};
                        terminologyItem.localizedLabels = {};
                        var currentLocalizedLabel;
                        for (var lang in this.localizedLabels) {
                            if(this.localizedLabels.hasOwnProperty(lang) && lang!=language) {
                                currentLocalizedLabel = this.localizedLabels[lang];
                                if(currentLocalizedLabel.indexOf(thinkehr.f4.InputItem._getNotFoundLabel(lang, currVal))<0){
                                    currentLocalizedLabel = thinkehr.f4.InputItem._getNotFoundLabel(lang, currVal);
                                        currentLocalizedLabel=this._stashedLabelValue ? currentLocalizedLabel+ ' | ' + this._stashedLabelValue : currentLocalizedLabel;
                                }
                                terminologyItem.localizedLabels[lang] = currentLocalizedLabel;
                            }
                        }

                        currentLocalizedLabel = this.localizedLabels[language];
                        if(currentLocalizedLabel && currentLocalizedLabel.indexOf(thinkehr.f4.InputItem._getNotFoundLabel(language, currVal))<0){
                            currentLocalizedLabel = thinkehr.f4.InputItem._getNotFoundLabel(language, currVal);
                            currentLocalizedLabel=this._stashedLabelValue ? currentLocalizedLabel+ ' | ' + this._stashedLabelValue : currentLocalizedLabel;
                        }
                        terminologyItem.localizedLabels[language] = currentLocalizedLabel;

                        terminologyItem.label = terminologyItem.localizedLabels[language];
                    }

                    if (terminologyItem) {
                        this.applyValuesFrom(terminologyItem);
                        this.status = notFound ? thinkehr.f4.InputItem.STATUS_NOT_FOUND : null;
                    }
                }.bind(this), language, terminologyCodeSystem, context, resolveFn);

                if (requestMade) {
                    this._stashedLabelValue =  this.label;
                    this._loadTerminologyRequestIdsInProgress = loadTermId;
                    this.setLocalizedLabel(language, this.label);
                    this.status = thinkehr.f4.InputItem.STATUS_LOADING;
                }
            }
        }
    },

        /*
         * @Override
         */
    toString: function () {
        return "thinkehr.f4.InputItem";
    }
});

thinkehr.f4.InputItem.STATUS_LOADING = 'loading';

thinkehr.f4.InputItem.STATUS_NOT_FOUND= 'notfound';

thinkehr.f4.InputItem._toLabelValuePropsItem = function (codeDescPropsItem, lang, fromTerminologyStr) {
    if(codeDescPropsItem) {
        if(!codeDescPropsItem.localizedLabels ){
            codeDescPropsItem.localizedLabels = {};
        }
        if(lang && !codeDescPropsItem.localizedLabels[lang]){
            codeDescPropsItem.localizedLabels[lang] = codeDescPropsItem.description;
        }
        codeDescPropsItem.label = codeDescPropsItem.description;
        codeDescPropsItem.value = codeDescPropsItem.code;
        if(fromTerminologyStr){
            codeDescPropsItem.terminology=fromTerminologyStr
        }
        delete codeDescPropsItem.description;
        delete codeDescPropsItem.code;
    }
    return codeDescPropsItem;
};

thinkehr.f4.InputItem.OTHER_VALUE = '__other__';

thinkehr.f4.InputItem._getOtherLabel = function (language) {
    var loadingStr = thinkehr.f4.dict.tr("other", language);
    if (!loadingStr) {
        loadingStr = 'Other';
    }
    return loadingStr;
};

thinkehr.f4.InputItem._getNotFoundLabel = function (language, codeValue) {
    var notFound = thinkehr.f4.dict.tr("notFound", language);
    if (!notFound) {
        notFound = 'Not found';
    }
    return notFound+' ('+codeValue+')';
};

thinkehr.f4.Validation = thinkehr.f4.Object._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.precision === undefined) {
            this.precision = null;
        }
    },

    getPrecision: function () {
        return this.precision;
    },

    setPrecision: function (precision) {
        this.precision = precision;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Validation";
    }
});

//-Models------------------------------------------------------------------------------------------------------------------------------------------------------

thinkehr.f4.Model = thinkehr.f4.Object._extendM({

    init: function (properties) {
        this._super(properties);

        this.parentModel = null;
        this.childModels = [];

        if (this.descEl === undefined) {
            this.descEl = null;
        }

        if (this.wrappingModel === undefined) {
            this.wrappingModel = null;
        }
    },

    getChildModels: function () {
        return this.childModels;
    },

    getChildModel: function (i) {
        return this.childModels[i];
    },

    getChildCount: function () {
        return this.childModels.length;
    },

    getChildModelsMatching: function (func) {
        var models = [];
        for (var i = 0; i < this.childModels.length; i++) {
            var model = this.childModels[i];
            if (func(model)) {
                models.push(model);
            }
        }

        return models;
    },

    addChildModel: function (model) {
        model.setParentModel(this);
        this.childModels.push(model);
    },

    insertChildModelAt: function (index, model) {
        model.setParentModel(this);
        this.childModels.splice(index, 0, model);
    },

    removeChildModel: function (model) {
        var index = this.childModels.indexOf(model);
        if (index >= 0) {
            this.childModels.splice(index, 1);
        }
    },

    removeFromParent: function () {
        if (this.getParentModel()) {
            this.getParentModel().removeChildModel(this);
        }
    },

    getParentModel: function () {
        return this.parentModel;
    },

    getParentOrWrapperModel: function() {
        var pm = this.getParentModel();
        if (!pm && this.isWrapped()) {
            pm = this.getWrappingModel();
        }

        return pm;
    },

    setParentModel: function (model) {
        this.parentModel = model;
    },

    getRootModel: function () {
        var m = this;

        while (m.getParentOrWrapperModel()) {
            m = m.getParentOrWrapperModel();
        }

        return m;
    },

    accept: function(visitor) {
        var stop = visitor.visit(this);

        if (stop !== true) {
            var continueProcessing = true;
            for (var i = 0; continueProcessing && i < this.getChildCount(); i++) {
                var child = this.getChildModel(i);
                var childStop = child.accept(visitor);
                if (childStop === true) {
                    continueProcessing = false;
                    stop = true;
                }
            }
        }

        visitor.afterVisit(this);

        return stop;
    },

    getDescEl: function () {
        return this.descEl;
    },

    setDescEl: function (descEl) {
        this.descEl = descEl;
    },

    getWrappingModel: function() {
        return this.wrappingModel;
    },

    setWrappingModel: function(wrappingModel) {
        this.wrappingModel = wrappingModel;
    },

    isWrapped: function() {
        return this.wrappingModel !== null && this.wrappingModel !== undefined;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Model";
    }
});

thinkehr.f4.FormObjectModel = thinkehr.f4.Model._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.formId === undefined) {
            this.formId = null;
        }
        if (this.name === undefined) {
            this.name = null;
        }
        if (this.viewConfig === undefined) {
            this.viewConfig = null;
        } else if (this.viewConfig instanceof thinkehr.f4.ViewConfig) {
            this.viewConfig.setModel(this);
        }
        if (this.valueNodeRef === undefined) {
            this.valueNodeRef = null;
        }
        if (this.valueNodeParentRef === undefined) {
            this.valueNodeParentRef = null;
        }
        if (this.dependencyNode === undefined) {
            this.dependencyNode = null;
        }
        if (this._childPathIdMap === undefined) {
            this._childPathIdMap = {};
        }
        if (this._context === undefined) {
            this.context = null;
        }
        if (this._elementName === undefined) {
            this._elementName = null;
        }
        if (this.__onModelRefreshed === undefined) {
            this.__onModelRefreshed = [];
        }
        if (this._customFunctionName === undefined) {
            this._customFunctionName = null;
        }
        if (this.isGenericField === undefined) {
            this.isGenericField = false;
        }
    },

    getFormId: function () {
        return this.formId;
    },

    setFormId: function (id) {
        this.formId = id;
    },

    getName: function () {
        return this.name;
    },

    setName: function (name) {
        this.name = name;
    },

    getViewConfig: function () {
        return this.viewConfig;
    },

    setViewConfig: function (viewConfig) {
        this.viewConfig = viewConfig;
        if (viewConfig) {
            viewConfig.setModel(this);
        }
    },

    getRmType: function () {
        return null;
    },

    getIsGenericField: function () {
        return this.isGenericField
    },

    setIsGenericField: function (value) {
        this.isGenericField = value;
    },

    getPath: function () {
        return this.formId;
    },

    isValueModel: function () {
        return false;
    },

    isAttachableToValueNode: function () {
        return true;
    },

    getValueNodeRef: function () {
        return this.valueNodeRef;
    },

    setValueNodeRef: function (valueNodeRef) {
        this.valueNodeRef = valueNodeRef;
    },

    getValueNodeParentRef: function () {
        return this.valueNodeParentRef;
    },

    setValueNodeParentRef: function (valueNodeParentRef) {
        this.valueNodeParentRef = valueNodeParentRef;
    },
    //TODO is there any other getter for this??
    getValueNodeParentRefPropertyName: function () {
        var pathArr = this.getFormId().split('/');
        return pathArr[pathArr.length-1];
    },

    getContext: function () {
        if (this._context) {
            return this._context;
        } else {
            var pm = this.getParentModel();
            if (pm && pm.getContext) {
                return this.getParentModel().getContext();
            }

            return null;
        }
    },

    setContext: function (context) {
        this._context = context;
    },

    isContainer: function () {
        return false;
    },

    labelFor: function (language) {

        var lbl;
        if (this.getViewConfig() && this.getViewConfig().getLabel()) {

            var labelConfig = this.getViewConfig().getLabel();
            if (labelConfig.isCustom()) {
                if (labelConfig.isUseLocalizations()) {
                    lbl = labelConfig.getLocalization(language);
                }
                if (!lbl) {
                    lbl = labelConfig.getValue();
                }
            } else if (labelConfig.isUseLocalizations()) {
                lbl = labelConfig.getLocalization(language);
            }
        }

        if (!lbl) {
            if(!lbl && (!labelConfig || !labelConfig.isCustom())) {
                lbl = this.getLocalizedName(language);
            }
            if(!lbl) {
                lbl=this.getLocalizedName();
                if (!lbl) {
                    lbl = this.getName();
                }
            }
        }

        return lbl;
    },

    getContainerChildModels: function (withModelPath) {
        return this.getChildModelsMatching(function (model) {
            var isContainer=model.isContainer();
            if(withModelPath) {
                return isContainer && model.getPath() === withModelPath;
            }
            return isContainer;
        });
    },

    /* Override */
    addChildModel: function (model) {
        this._super(model);
        this._increaseChildPathIdIndexFor(model);
        this.processDependenciesFromRoot();
    },

    /* Override */
    insertChildModelAt: function (index, model) {
        this._super(index, model);
        this._increaseChildPathIdIndexFor(model);
        this.processDependenciesFromRoot();
    },

    insertChildModelAfterLastOfSamePath: function (model, insertAsLastIfNotFound) {
        var lastChildIndex = -1;
        for (var i = 0; i < this.getChildCount(); i++) {
            var child = this.getChildModel(i);
            if (child.getPath() === model.getPath()) {
                lastChildIndex = i;
            }
        }

        if (lastChildIndex >= 0) {
            this.insertChildModelAt(lastChildIndex + 1, model);
        } else if (insertAsLastIfNotFound) {
            this.addChildModel(model);
        }

    },

    /* Override */
    removeChildModel: function (model) {
        this._super(model);
        this.processDependenciesFromRoot();
    },

    /* Override */
    removeFromParent: function () {
        var pm = this.getParentModel();
        if (pm) {
            this._super();
            this.processDependenciesFromRoot();
        }
    },

    _increaseChildPathIdIndexFor: function (model) {
        var path = model.getPath() ? model.getPath() : "none";
        if (this._childPathIdMap[path] !== undefined) {
            this._childPathIdMap[path] += 1;
        } else {
            this._childPathIdMap[path] = 0;
        }

        var idIndex = this._childPathIdMap[path];
        model._childPathIdIndex = idIndex;

        return idIndex;
    },

    getUniqueId: function () {
        if (!this.childPathId) {
            if (!this.getPath()) {
                this.childPathId = null;
            } else {
                var index = this._childPathIdIndex === undefined ? 0 : this._childPathIdIndex;
                var modelPath = this.getPath();
                var p = modelPath + ":" + index;
                var parent = this.getParentModel();
                while (parent != null) {
                    if (!parent.getPath() || parent.getRmType() === thinkehr.f4.RmType.FORM_DEFINITION) {
                        parent = null;
                    } else {
                        index = parent._childPathIdIndex === undefined ? 0 : parent._childPathIdIndex;
                        var parentPath = parent.getPath();
                        if (p.indexOf(parentPath) == 0) {
                            var parentPart = p.substring(0, parentPath.length);
                            p = parentPart + ":" + index + p.substr(parentPath.length);
                        } else {
                            p = parentPath + ":" + index + "/" + p;
                        }
                        parent = parent.getParentModel();
                    }
                }

                this.childPathId = p;
            }
        }

        return this.childPathId;
    },

    getSanitizedUniqueId: function() {
        var uniqueId = this.getUniqueId();

        if (!uniqueId) {
            return null;
        }

        return thinkehr.f4.util.sanitizeName(uniqueId);
    },

    getTags: function() {
        return this.getViewConfig().getTags();
    },

    hasTag: function(tag) {
        /*TODO is this viable fix?*/
        var viewConfig = this.getViewConfig();
        return viewConfig?viewConfig.hasTag(tag):false;
        //return this.getViewConfig().hasTag(tag);
    },

    getAnnotations: function () {
        return this.getViewConfig().getAnnotations();
    },

    hasAnnotation: function (key) {
        return this.getViewConfig().hasAnnotation(key);
    },

    annotationValue: function (key) {
        return this.getViewConfig().annotationValue(key);
    },

    getElementName: function () {
        if (!this._elementName) {
            var sUid = this.getSanitizedUniqueId();
            this._elementName = sUid ? sUid : thinkehr.f4.util.guid();
        }

        return this._elementName;
    },

    setElementName: function (elementName) {
        this._elementName = elementName;
    },

    getElementNameChain: function () {
        var chain = [this.getElementName()];
        var pm = this.getParentModel();
        while (pm) {
            if (pm.isContainer() && pm.getRmType() !== thinkehr.f4.RmType.FORM_DEFINITION && pm.getElementName()) {
                chain.splice(0, 0, pm.getElementName());
            }

            pm = pm.getParentModel();
        }

        return chain;
    },

    getDependencyNode: function () {
        return this.dependencyNode;
    },

    setDependencyNode: function (dependencyNode) {
        this.dependencyNode = dependencyNode;
    },

    processDependenciesFromRoot: function() {
        var rm = this.getRootModel();
        if (rm) {
            var dn = rm.getDependencyNode();
            if (dn) {
                dn.process({});
            }
        }
    },

    findAncestorWithPath: function (path) {
        var pm = this.getParentModel();
        while (pm) {
            if (pm.getPath() === path) {
                return pm;
            }

            pm = pm.getParentModel();
        }

        return null;
    },

    //TODO write tests
    findMultiAncestor: function (includeCurrent) {
        var pm = includeCurrent? this:this.getParentModel();
        while (pm) {
            if (pm.isMulti && pm.isMulti()) {
                return pm;
            }

            pm = pm.getParentModel();
        }

        return null;
    },

    //TODO write tests
    findAncestorContainer: function (includeCurrent) {
        var pm = includeCurrent? this:this.getParentModel();
        while (pm) {
            if (pm.isContainer && pm.isContainer()) {
                return pm;
            }

            pm = pm.getParentModel();
        }

        return null;
    },

    findChildWithPath: function (path, index) {
        if (this.getChildCount() > 0) {
            var ic = 0;
            for (var i = 0; i < this.getChildCount(); i++) {
                var childModel = this.getChildModel(i);
                if (childModel.getPath() === path) {
                    if (index === undefined) {
                        return childModel;
                    } else {
                        if (ic++ === index) {
                            return childModel;
                        }
                    }
                }
            }
        }

        return null;
    },

    findChildrenWithPath: function (path) {
        var children = [];
        for (var i = 0; i < this.getChildCount(); i++) {
            var childModel = this.getChildModel(i);
            if (childModel.getPath() === path) {
                children.push(childModel);
            }
        }

        return children;
    },

    findSuccessorWithPredicate: function (predicateFn) {
        for (var i = 0; i < this.getChildCount(); i++) {
            var childModel = this.getChildModel(i);
            var predicateFnRes = predicateFn(childModel);
            if ( !!predicateFnRes ){
                return childModel;
            } else if(predicateFnRes!==false) {
                var cm = childModel.findSuccessorWithPredicate(predicateFn);
                if (cm != null) {
                    return cm;
                }
            }
        }

        return null;
    },

    findSuccessorWithPath: function (path) {
        for (var i = 0; i < this.getChildCount(); i++) {
            var childModel = this.getChildModel(i);
            if (childModel.getPath() === path) {
                return childModel;
            } else {
                var cm = childModel.findSuccessorWithPath(path);
                if (cm != null) {
                    return cm;
                }
            }
        }

        return null;
    },

    findSuccessorWithTag: function (tag) {
        for (var i = 0; i < this.getChildCount(); i++) {
            var childModel = this.getChildModel(i);
            if (childModel.hasTag(tag)) {
                return childModel;
            } else {
                var cm = childModel.findSuccessorWithTag(tag);
                if (cm != null) {
                    return cm;
                }
            }
        }

        return null;
    },

    findSuccessorsWithPath: function (path) {
        var result = [];

        this._findSuccessorsWithPathRecursive(path, result);

        return result;
    },

    _findSuccessorsWithPathRecursive: function (path, result) {
        for (var i = 0; i < this.getChildCount(); i++) {
            var childModel = this.getChildModel(i);
            if (childModel.getPath() === path) {
                result.push(childModel);
            }

            childModel._findSuccessorsWithPathRecursive(path, result);
        }
    },

    findSuccessorsWithTag: function (tag) {
        var result = [];

        this._findSuccessorsWithTagRecursive(tag, result);

        return result;
    },

    _findSuccessorsWithTagRecursive: function (tag, result) {
        for (var i = 0; i < this.getChildCount(); i++) {
            var childModel = this.getChildModel(i);
            if (childModel.hasTag(tag)) {
                result.push(childModel);
            }

            childModel._findSuccessorsWithTagRecursive(tag, result);
        }
    },

    findAncestorWithTag: function (tag, includeCurrent) {
        var currModel = includeCurrent ? this : this.getParentModel();

        while (currModel) {
            if(currModel.hasTag(tag)){
                return currModel
            }

            currModel = currModel.getParentModel();
        }

        return null;
    },

    findClosestWithPath: function (path) {
        var m = this;

        while (m) {
            var s = m.findSuccessorWithPath(path);
            if (s) {
                return s;
            }

            m = m.getParentModel();
        }

        return null;
    },

    findAncestorWithRmType: function (rmTypeEnum, includeCurrent) {
        var currModel = includeCurrent ? this : this.getParentModel();

        while (currModel) {
            if(currModel.getRmType()===rmTypeEnum){
                return currModel
            }

            currModel = currModel.getParentModel();
        }

        return null;
    },

    findAncestorWithAnnotation: function (key, value, includeCurrent) {
        var currModel = includeCurrent ? this : this.getParentModel();

        while (currModel) {
            if(value==null) {
                if(currModel.hasAnnotation(key)){
                    return currModel;
                }
            }else {
                if(currModel.annotationValue(key)===value) {
                    return currModel;
                }
            }

            currModel = currModel.getParentModel();
        }

        return null;
    },

    hasAnyKendoComponent: function () {
        return !!this.findSuccessorWithPredicate(function (currModel) {
                var rmType = currModel.getRmType();
                if (currModel.isContainer() || currModel.getIsGenericField() || currModel.getViewConfig().isHidden()) {
                    if (currModel.hasAnnotation('tab')) {
                        return false
                    }
                    return null;
                }

                var typeHasKendoComponent = (rmType !== thinkehr.f4.RmType.DV_TEXT
                    && rmType !== thinkehr.f4.RmType.DV_BOOLEAN
                    && rmType !== thinkehr.f4.RmType.DV_URI
                    && rmType !== thinkehr.f4.RmType.DV_EHR_URI
                    && rmType !== thinkehr.f4.RmType.CUSTOM
                );
                var field = currModel.getViewConfig().getField();
                var presentat = field && field.getPresentation ? field.getPresentation() : null;
                if (typeHasKendoComponent === true && ( rmType === thinkehr.f4.RmType.DV_CODED_TEXT || rmType === thinkehr.f4.RmType.DV_ORDINAL) ){

                    if (presentat && (rmType === thinkehr.f4.RmType.DV_CODED_TEXT || rmType === thinkehr.f4.RmType.DV_ORDINAL)) {
                        typeHasKendoComponent = presentat !== thinkehr.f4.FieldPresentation.RADIOS;
                    }
                } else if (typeHasKendoComponent === false) {
                    if (rmType === thinkehr.f4.RmType.DV_TEXT || (presentat && (presentat == thinkehr.f4.FieldPresentation.TEXTFIELD || presentat == thinkehr.f4.FieldPresentation.TEXTAREA))) {
                        var input = currModel.getInputFor("textValues");
                        typeHasKendoComponent = input && (presentat===thinkehr.f4.FieldPresentation.COMBOBOX) ? input.getList().length > 0 : false;
                    }
                }

                return typeHasKendoComponent;
            }
        );
    },

    onModelRefreshed: function (f) {
        this.__onModelRefreshed.push(f);
    },

    removeOnModelRefreshed: function (f) {
        this.__onModelRefreshed.splice(this.__onModelRefreshed.indexOf(f), 1);
    },

    _triggerModelRefreshed: function () {
        for (var i = 0; i < this.__onModelRefreshed.length; i++) {
            var f = this.__onModelRefreshed[i];
            f(this);
        }
    },

    getCustomFunction: function () {
        if (!this._customFunctionName && this.hasAnnotation("function")) {
            this._customFunctionName = this.annotationValue("function");
        }
        return this._customFunctionName;
    },

    isCustomFunctionCustomComponent: function (context) {
        return thinkehr.f4.isCustomFunctionCustomComponent(this.getCustomFunction(), this.hasTag('custom'), context || this.getContext());
    },

    setCustomFunction: function (globalCustomFuncName) {
        this._customFunctionName = globalCustomFuncName;
    },

    containsValue: function () {

        if (this.annotationValue("ignoreForContainsValue") === 'true') {
            return false;
        }

        function isSuitable(model) {
            return !model.isContainer() && model.getRmType() !== thinkehr.f4.RmType.FORM_DEFINITION && model.getValue !== undefined;
        }

        // console.debug("Contains value ", this.getRmType(), ": ", isSuitable(this) && thinkehr.f4.util.isValueNonEmpty(this.getValue()), ": ", this);

        if (isSuitable(this) && thinkehr.f4.util.isValueNonEmpty(this.getValue())) {
            return true;
        }

        for (var i = 0; i < this.getChildCount(); i++) {
            var model = this.getChildModel(i);
            if (model.containsValue() === true) {
                return true;
            }
        }

        return false;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.FormObjectModel";
    }
});

thinkehr.f4.FormRootModel = thinkehr.f4.FormObjectModel._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    getContext: function () {
        return this._context;
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.FORM_DEFINITION;
    },

    /*
     * @Override
     */
    getUniqueId: function () {
        return null;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.FormRootModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.FormRepeatableElementModel = thinkehr.f4.FormObjectModel._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.localizedName === undefined) {
            this.localizedName = null;
        }
        if (this.localizedNames === undefined) {
            this.localizedNames = {};
        }
        if (this.min === undefined) {
            this.min = 0;
        }
        if (this.max === undefined) {
            this.max = null;
        }
        if (this.parent === undefined) {
            this.parent = null;
        }
    },

    getLocalizedName: function (locale) {
        if (locale) {
            var n = this.localizedNames[locale];
            return n ? n : null;
        }

        return this.localizedName;
    },

    setLocalizedName: function (localizedName) {
        this.localizedName = localizedName;
    },

    setLocalizedNames: function (localizedNames) {
        this.localizedNames = localizedNames;
    },

    getMin: function () {
        return this.min;
    },

    setMin: function (min) {
        this.min = min;
    },

    getMax: function () {
        return this.max;
    },

    setMax: function (max) {
        this.max = max;
    },

    isMulti: function () {
        return this.hasTag("multi") && this.max && (this.max > 1 || this.max < 0);
    },

    getMultiIndex : function (searchFirstMultiAncestor) {
        var containersInParent = this.getParentModel().getContainerChildModels(this.getPath());
        if(containersInParent && containersInParent.length) {
            return containersInParent.indexOf(this);
        }
        if(searchFirstMultiAncestor) {
            var firstMultiAncestor = this.findMultiAncestor();
            if(firstMultiAncestor) {
                return firstMultiAncestor.getMultiIndex(false);
            }
        }
        return null;
    },

    isRequired: function () {
        return this.min !== undefined && this.min > 0;
    },

    clearValue: function () {
      if(this.isContainer()) {
          this.getChildModels().forEach(function (chModel) {
              chModel.clearValue();
          });
      }
    },

    resetValue: function () {
      if(this.isContainer()) {
          this.getParentModel().getContainerChildModels(this.getPath()).forEach(function (multiItem) {
              if (multiItem !== this) {
                  thinkehr.f4.destroyModel(multiItem);
              }
          }.bind(this));
          this.getChildModels().forEach(function (chModel) {
              chModel.resetValue();
          });
      }
    },

    isContainer: function () {
        return false;
    },
    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.FormRepeatableElementModel";
    }
});

thinkehr.f4.AbstractContainerModel = thinkehr.f4.FormRepeatableElementModel._extendM({
    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    isContainer: function () {
        return true;
    },

    getElementName: function () {
        if (!this._elementName) {
            this._elementName = this.getNamePrefix() + thinkehr.f4.util.guid("_");
            this._elementName = this.getNamePrefix() + thinkehr.f4.util.guid("_");
        }

        return this._elementName;
    },

    getNamePrefix: function() {
        return "container_"
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AbstractContainerModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.GenericFieldsetModel = thinkehr.f4.AbstractContainerModel._extendM({
    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.GENERIC_FIELDSET;
    },

    /*
     * @Override
     */
    isAttachableToValueNode: function () {
        return false;
    },

    /*
     * @Override
     */
    getNamePrefix: function() {
        return "cnt_gen_"
    },

    /*
     * @Override
     */
    isMulti: function () {
        return false;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.GenericFieldsetModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.RmContainerModel = thinkehr.f4.AbstractContainerModel._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.rmType === undefined) {
            this.rmType = null;
        }
    },

    /*
     * @Override
     */
    getRmType: function () {
        return this.rmType;
    },

    setRmType: function (rmType) {
        this.rmType = rmType;
    },

    /*
     * @Override
     */
    getNamePrefix: function() {
        return "cnt_rm_"
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.RmContainerModel/" + this.getName() + "/" + this.getRmType();
    }
});

thinkehr.f4.NodeModel = thinkehr.f4.FormRepeatableElementModel._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.nodeId === undefined) {
            this.nodeId = null;
        }

        if (this.aqlPath === undefined) {
            this.aqlPath = null;
        }

        if (this.inputs === undefined) {
            this.inputs = [];
        }

        if (this.value === undefined) {
            this.value = null;
        }

        if (this.valueTypes === undefined) {
            this.valueTypes = [];
        }

        this._MULTI_ARR_PARAM = undefined;
        this._isDefaultValue = false;
    },

    getNodeId: function () {
        return this.nodeId;
    },

    setNodeId: function (nodeId) {
        this.nodeId = nodeId;
    },

    getAqlPath: function () {
        return this.aqlPath;
    },

    setAqlPath: function (aqlPath) {
        this.aqlPath = aqlPath;
    },

    getInputs: function () {
        return this.inputs;
    },

    getInput: function (index) {
        return index >= 0 && index < this.inputs.length ? this.inputs[index] : null;
    },

    getInputFor: function (suffix) {
        for (var i = 0; i < this.inputs.length; i++) {
            var input = this.inputs[i];
            if (input.getSuffix() === suffix) {
                return input;
            }
        }

        return null;
    },

    getInputByType: function (type) {
        for (var i = 0; i < this.inputs.length; i++) {
            var input = this.inputs[i];
            if (input.getType() === type) {
                return input;
            }
        }

        return null;
    },

    setInputs: function (inputs) {
        this.inputs = inputs;
    },

    addInput: function (input) {
        input.setInputForModel(this);
        if(this.getViewConfig().getTerminology()) {
            input.setTerminology(this.getViewConfig().getTerminology());
        }
        this.inputs.push(input);
    },

    /*
     * Override
     */
    isValueModel: function () {
        return true;
    },

    //TODO getValue does not set default values
    getValue: function (property, multiIndex) {
        var valsArr = this._getValuesArray();

        if ( valsArr ) {
            if( (arguments.length>1 && multiIndex===this._MULTI_ARR_PARAM) || (arguments.length<2 && this.isMulti()) ){
                return valsArr.map(function (multiVal) {
                    return property ? multiVal[property] : multiVal;
                });
            }else if(!multiIndex){
                multiIndex = 0;
            }
            if( valsArr.length>0 && valsArr[multiIndex]!=null) {
                var retVal;
                if(property) {
                    retVal = valsArr[multiIndex][property];
                    if(retVal===undefined) {
                        property = '|' + property;
                        retVal=valsArr[multiIndex][property];
                    }
                }else{
                    retVal=valsArr[multiIndex]
                }
                return retVal !== undefined ? retVal : null;
            }
        }

        return null;
    },

    setValue: function (value, multiIndex, propertyName) {
        var retValue = null;
        if(multiIndex===undefined) {
            if(value!=null && !thinkehr.f4.util.isArray(value)) {
                value = [value];
            }
            this._setValuesArray(value);
            retValue=this._getValuesArray();
        }else{
            var valuesArr = this._getValuesArray();
            if(propertyName===undefined){
                if(value===null){
                    valuesArr.splice(multiIndex, 1);
                }else{
                    valuesArr[multiIndex] = value;
                }
                retValue = valuesArr;
            }else {
                if(propertyName==null && value===null) {
                    valuesArr.splice(valuesArr.indexOf(valuesArr[multiIndex]), 1);
                }else if(propertyName!=null){
                    if(valuesArr[multiIndex]==null) {
                        valuesArr[multiIndex] = {};
                    }
                    valuesArr[multiIndex][propertyName] = value;
                }else{
                    valuesArr[multiIndex] = value;
                }
                retValue=valuesArr
            }
            this._setOnAllValuesArray(valuesArr);
        }
        this._setSkipDefaultValue(true, multiIndex);
        return multiIndex!=null ? retValue[multiIndex]:retValue;
    },

    clearValue: function () {
        this._setValuesArray([]);
        this._setIsDefaultValue(false);
     },

    _setSkipDefaultValue:function(val, multiIndex){
        this._skipDefaultValue = val;
    },

    _applyValueFromObject: function (value) {
        if(thinkehr.f4.util.isObject(value)) {
            for (var prop in value) {
                if(value.hasOwnProperty(prop)) {
                    this.applyValue(value[prop], prop);
                }
            }
            return true;
        }
        return false;
    },

    applyValue: function (value, valTypeStr, multiIndex) {
        throw new Error("'applyValue' method not implemented on " + this.toString());
    },

    resetValue: function () {
        throw new Error("'resetValue' method not implemented on " + this.toString());
    },

    setValueProp: function (value, valuePropertyName, multiIndex) {
        if(!this.isMulti() && multiIndex==null) {
            multiIndex = 0;
        }else if(this.isMulti() && multiIndex==null && (!thinkehr.f4.util.isArray(value) && valuePropertyName!=null) ){
            throw new Error("multiIndex parameter is required on isMulti()==true models")
        }
        var currValAtIndex=this.getValue(this._MULTI_ARR_PARAM, multiIndex);

        if(!currValAtIndex && value!=null){
            var val = {};
            this.setValue( val, multiIndex );
            currValAtIndex = [val];
        }
        if(currValAtIndex) {
            if(!thinkehr.f4.util.isArray(currValAtIndex)){
                currValAtIndex = [currValAtIndex];
            }
            currValAtIndex.forEach(function () {
                this.setValue(value, multiIndex, valuePropertyName);
            },this);
        }
    },

    clearValueProp: function (valuePropertyName, multiIndex) {
        if(!this.isMulti() && multiIndex==null) {
            multiIndex = 0;
        }else if(this.isMulti() && multiIndex===undefined) {
            throw new Error("multiIndex parameter must be null or integer on isMulti() model")
        }

        if(multiIndex===null) {
            this._getValuesArray().length = 0;
        }else if(multiIndex!=null){
            this.setValueProp(null, valuePropertyName, multiIndex);
        }
        else{
            throw new Error("multiIndex param must be defined");
        }
        this._setIsDefaultValue(false);
    },

    getMultiContainerDefaultValue: function () {
        var parentModel = this.getParentModel();
        if(parentModel && parentModel.isMulti && parentModel.isMulti()) {
            var multiDefAnnVal = this.getViewConfig().annotationValue('multiDefault');
            if(multiDefAnnVal) {
                var vals = multiDefAnnVal.split(';');
                var retVal = vals[parentModel.getMultiIndex()];
                return retVal!=null?retVal.trim():undefined;
            }
        }
        return undefined;
    },

    isDefaultValue:function () {
        return this._isDefaultValue;
    },

    hasValue:function(){
        throw new Error("Must be implementated on field model.");
    },

    _hasValue:function (val, _isValueEmptyFn) {
        if(thinkehr.f4.util.isArray(val)){
            if(val.length){
                return !val.every(function (arrVal) {
                    return _isValueEmptyFn(arrVal);
                }.bind(this));
            }
            return false;
        }else{
            return !(_isValueEmptyFn(val));
        }
    },

    _isValueEmpty:function (val) {
        return (val == null || val === '');
    },

    _setIsDefaultValue:function (val) {
        this._isDefaultValue=val;
    },

    _getPropertyValueFromMultiDefaultString:function(multiDefaultValue, propName, skipGenericValue){
        if(multiDefaultValue.indexOf('|')<0 && multiDefaultValue.indexOf('=')<0 && !skipGenericValue) {
            return multiDefaultValue;
        }
        var keyValsStrArr = multiDefaultValue.split('|');
        for(var i=0; i<keyValsStrArr.length; i++) {
            var keyVal = keyValsStrArr[i].split('=');
            if(keyVal[0].trim()==propName) {
                return keyVal[1];
            }
        }
        return undefined;
    },

    _getMultiIndexArgs: function (arg, propertyName) {
        var retArgs = [];
        if(arg.length>1) {
            retArgs =  [undefined, arg[1]];
        }
        if(propertyName){
            if(!retArgs){
                retArgs = [];
            }
            retArgs[0]=propertyName;
        }

        return retArgs;
    },

    _getValuesArray: function () {
        var valuesArr = this.getValueNodeParentRef();
        if(valuesArr==null && ( this.isGenericField || this.isCustomFunctionCustomComponent() )){
            valuesArr = this.value;
            if(!valuesArr) {
                valuesArr = [];
            }
        }
        if(!this.isMulti()){
            if ( valuesArr!=null ) {
                if(!thinkehr.f4.util.isArray(valuesArr)) {
                    if(this.isGenericField || this.isCustomFunctionCustomComponent()) {
                        valuesArr = [valuesArr];
                    }else{
                        console.warn("ParentRef is not array!", valuesArr);
                    }
                }
            }
        }else{
            if(!thinkehr.f4.util.isArray(valuesArr)) {
                valuesArr = valuesArr[this.getValueNodeParentRefPropertyName()];
            }
        }

        return valuesArr;
    },

    _setValuesArray:function(newValuesArr){
        var currValsArr = this._getValuesArray();

        if(!currValsArr) {
            console.warn("No values arr=",currValsArr);
        }else{

            if(newValuesArr) {
                newValuesArr = thinkehr.f4.util.copyArrayShallow(newValuesArr);
                currValsArr.length = 0;
                if (newValuesArr.length) {
                    var i = newValuesArr.length;
                    while (i--) {
                        currValsArr[i] = newValuesArr[i];
                    }
                }
                this._setOnAllValuesArray(currValsArr);
            }
        }
    },

    _setOnAllValuesArray:function(arr){
        this.value = arr;
        this.setValueNodeRef(arr);
    },

    _setFloatValueIfString: function(val, multiIndex, propName){
        if(val!=null && thinkehr.f4.util.isString(val)) {
            if(multiIndex == null ) {
                multiIndex = 0;
            }
            var floatVal = parseFloat(val);
            if(isNaN(floatVal)){
                floatVal = null;
            }
            this.setValueProp(floatVal, propName, multiIndex);
            return this.getValue.apply(this, this._getMultiIndexArgs(arguments, propName));
        }
        return val;
    },

    _getDefaultMultiIndex:function(multiIndex){
        if(multiIndex!=null) {
            return multiIndex;
        }
        return this.isMulti()? 0 : undefined;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.NodeModel";
    }
});

thinkehr.f4.DirectValueModel = thinkehr.f4.NodeModel._extendM({
    init: function (properties, valueFuncName) {
        this._super(properties);
        this._skipDefaultValue = false;
        this._valueFuncName = valueFuncName;
    },

    _MULTI_ARR_PARAM:undefined,

    valueGetterSetter: function (value, multiIndex, settingDefaultValue) {
        if (arguments.length > 0 && value!==this._MULTI_ARR_PARAM) {
                //TODO use setValue ??
            this._setValuesArray(this.transformValue(value, this._getValuesArray(), multiIndex));
            this._skipDefaultValue = true;
            this._setIsDefaultValue(false);
            return this.getValue.apply(this, this._getMultiIndexArgs(arguments));

        }else if ((this.getValue() == null || this.getValue().length<1) && this.defaultValue() && !this._skipDefaultValue) {
            this.valueGetterSetter(JSON.parse(JSON.stringify(this.defaultValue())), this._MULTI_ARR_PARAM, true);
            this._setIsDefaultValue(true);
            return this.getValue.apply(this, this._getMultiIndexArgs(arguments));
        }
        return this.getValue.apply(this, this._getMultiIndexArgs(arguments));
    },

    _sanitizeArrayValue: function (retArr) {
        if(retArr.length==1 && (retArr[0]==null || retArr[0].toString().length<1 )) {
            retArr.length=0;
        }
        return retArr;
    },

    transformValue: function (newValue, currValueArr, multiIndex) {
        //update values in array and return updated array
        var retArr = currValueArr ? currValueArr : [];

        if(!thinkehr.f4.util.isArray(retArr)) {
            retArr = [retArr];
        }

        if(newValue!==undefined){
            //if multiIndex parameter explicitly set to _MULTI_ARR_PARAM - set whole array
            if(arguments.length==3 && multiIndex===this._MULTI_ARR_PARAM){
                //explicitly reset whole arr - remove first and reset
                retArr.length = 0;
                if(thinkehr.f4.util.isArray(newValue)){
                    //fill the array with values
                    for (var i = 0; i < newValue.length; i++) {
                        retArr[i]=newValue[i];
                    }
                    return this._sanitizeArrayValue(retArr);
                }else{
                    //set index - will set [0] with value
                    multiIndex = 0;
                }
            }else if(multiIndex == null) {
                //set value on specific index - was not provided - setting to 0
                multiIndex = 0;
            }

            if(newValue!=null) {
                if((newValue==null || newValue.toString().length<1 ) && multiIndex==0 && retArr.length<2 ) {
                    //empty value - clear array
                    retArr.length=0;
                }else{
                    if(isNaN(parseFloat(multiIndex))) {
                        console.warn("multi index not number=", multiIndex);
                    }
                    //set index value
                    retArr[multiIndex] = newValue;
                }
            }else{
                // value was null - remove at index
                retArr.splice(multiIndex, 1);
            }
        }

        return this._sanitizeArrayValue(retArr);
    },

    getDefaultInput: function () {
        return null;
    },

    setValue: function (val, multiIndex) {
        this._super(this.transformValue(val, this.getValue(), this._MULTI_ARR_PARAM), multiIndex );
    },

    defaultValue: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            this.getDefaultInput().setDefaultValue(dv);
        }else {
            dv = this.getDefaultInput().getDefaultValue();
        }

        if ((thinkehr.f4.util.isString(dv) && dv.length > 0) || thinkehr.f4.util.isArray(dv)) {
            return dv;
        }
        return null;
    },

    /*
     * @Override
     */
    clearValue: function () {
        this.setValue(null);
        this._skipDefaultValue = true;
    },

    hasValue:function(){
        return this._hasValue(this.valueGetterSetter(), this._isValueEmpty);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.DirectValueModel/" + this._valueFuncName;
    }
});

thinkehr.f4.QuantityFieldModel = thinkehr.f4.NodeModel._extendM({
    init: function (properties) {
        this._super(properties);
        this._skipDefaultValueMagnitude = false;
        this._skipDefaultValueUnit = [];
    },

    _getSkipDefaultValueUnit:function(multiInd){
        if(multiInd==null) {
            multiInd = 0;
        }
        return this._skipDefaultValueUnit[multiInd];
    },

    _setSkipDefaultValueUnit:function(val, multiInd){
        if(multiInd==null) {
            multiInd = 0;
        }
        this._skipDefaultValueUnit[multiInd]=val;
    },
    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_QUANTITY;
    },

    magnitudeValue: function (value, multiIndex, setEmptyValue) {
        var val = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|magnitude'));

        if (value===this._MULTI_ARR_PARAM) {
            var defMagValue = this._setDefaultMagnitudeValue(val, multiIndex, false);
            if(defMagValue!=null){
                return defMagValue;
            }
        }else{
            this._setIsDefaultValue(false);
            var actualValue = value && thinkehr.f4.util.isString(value) ? parseFloat(value) : value;
            if (!setEmptyValue && (actualValue === null || value === "" || actualValue === undefined)) {
                this.clearMagnitudeValue(multiIndex);
                this._skipDefaultValueMagnitude=true;
                return null;
            } else {
                var currUnitVal = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|unit'));
                this._setDefaultUnitValue(currUnitVal, multiIndex, true);
                this._skipDefaultValueMagnitude=true;
                this.setValueProp(actualValue, '|magnitude', multiIndex);
                return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|magnitude'));
            }
        }
        return this._setFloatValueIfString(val, multiIndex, '|magnitude');
    },

    defaultValueMagnitude: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            dv = this._getPropertyValueFromMultiDefaultString(dv, 'magnitude', false);
            if(dv){
                this.getInputFor("magnitude").setDefaultValue(dv);
            }
        }
        if(dv==null){
            dv = this.getInputFor("magnitude").getDefaultValue();
        }

        if (thinkehr.f4.util.isString(dv)) {
            return dv.length > 0 ? parseFloat(dv) : null;
        } else if (dv !== null && dv !== undefined) {
            return dv;
        }

        return null;
    },

    _setDefaultMagnitudeValue:function(currValue, multiIndex, skipDefaultUnitValue){
        if ((currValue == null || currValue.length<1) && !this._skipDefaultValueMagnitude) {
            var mv = this.defaultValueMagnitude();
                if (mv !== null && mv !== undefined) {
                    this._skipDefaultValueMagnitude=true;
                    var defMultiInd = multiIndex != null ? multiIndex : 0;
                    if(!this.isMulti()){
                        arguments[1] = defMultiInd;
                    }
                    if(!skipDefaultUnitValue) {
                        var uv = this.defaultValueUnit();
                        if (uv) {
                            this.unitValue(uv, defMultiInd);
                        }
                    }

                    this.magnitudeValue(mv, defMultiInd);
                    this._setIsDefaultValue(true);
                    return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|magnitude'));
                }
        }
        return null;
    },

    unitValue: function (value, multiIndex, setEmptyValue) {
        var val = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|unit'));

        if (value===this._MULTI_ARR_PARAM) {
            //var defUnitValue=this._setDefaultUnitValue(val, multiIndex);
            var defUnitValue=this._setDefaultUnitValue(val, multiIndex, true);
            if(defUnitValue!=null) {
                return defUnitValue;
            }

        }else{
            this._setIsDefaultValue(false);
            if (!setEmptyValue && (value === null || value === "" || value === undefined)) {
                this.clearUnitValue(multiIndex);
                this._setSkipDefaultValueUnit(true,multiIndex);
                return null;
            } else {
                var currMagVal = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|magnitude'));
                this.setValueProp(value, '|unit', multiIndex);
                this._setDefaultMagnitudeValue(currMagVal, multiIndex, true);
                this._setSkipDefaultValueUnit(true,multiIndex);
                return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|unit'));
            }

        }
        return val;
    },

    _setDefaultUnitValue:function(val, multiIndex, skipDefaultMagnitudeValue){
        if ((val == null || val.length<1) && !this._getSkipDefaultValueUnit(multiIndex)) {
            var uv = this.defaultValueUnit();
                if (uv !== null && uv !== undefined) {
                    this._setSkipDefaultValueUnit(true, multiIndex);
                    var defMultiInd = multiIndex != null ? multiIndex : 0;
                    this.unitValue(uv, defMultiInd);
                    this._setIsDefaultValue(true);
                    if (!skipDefaultMagnitudeValue) {
                        var mv = this.defaultValueMagnitude();
                        if (mv) {
                            this.magnitudeValue(mv, defMultiInd);
                            this._setIsDefaultValue(true);
                        }
                    }

                    return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|unit'));
                }
        }
        return null;
    },

    defaultValueUnit: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            dv = this._getPropertyValueFromMultiDefaultString(dv, 'unit', true);
            if(dv) {
                this.getInputFor("unit").setDefaultValue(dv);
            }
        }
        if(dv==null){
            dv = this.getInputFor("unit").getDefaultValue();
        }

        return thinkehr.f4.util.isString(dv) && dv.length > 0 ? dv : null;
    },

    _getValidationPropertyForUnit: function (unit, functionProperty) {
        var u = unit !== undefined ? unit : this.unitValue();
        if (u == null) {
            console.warn("Unit parameter must be passed in!");
            return null;
        }

        var isInt = thinkehr.f4.util.isInteger(unit);
        var l = this.getInputFor("unit").getList();
        for (var i = 0; i < l.length; i++) {
            var item = l[i];

            if ((isInt && u == i) || item.getValue() === u) {
                if (item.getValidation() && item.getValidation()[functionProperty] !== undefined) {
                    if (thinkehr.f4.util.isFunction(item.getValidation()[functionProperty])) {
                        return item.getValidation()[functionProperty].call(item.getValidation())
                    } else {
                        return item.getValidation()[functionProperty]
                    }
                }

                return null;

            }
        }

        return null;
    },

    getPrecisionForUnit: function (unit) {
        if (unit == null) {
            throw new Error("getPrecisionForUnit() - unit parameter is required!");
            return null;
        }
        return this._getValidationPropertyForUnit(unit, "getPrecision");
    },

    getRangeForUnit: function (unit) {
        return this._getValidationPropertyForUnit(unit, "range");
    },

    getMinValueForUnit: function (unit) {
        var range = this.getRangeForUnit(unit);
        if (range && range.min !== undefined) {
            var rangeMin = parseFloat(range.min);
            var minOp = range.minOp ? range.minOp : ">=";

            return {min: rangeMin, minOp: minOp}
        }

        return null;
    },

    getMaxValueForUnit: function (unit) {
        var range = this.getRangeForUnit(unit);
        if (range && range.max !== undefined) {
            var rangeMax = parseFloat(range.max);
            var maxOp = range.maxOp ? range.maxOp : "<=";

            return {max: rangeMax, maxOp: maxOp}
        }

        return null;
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='magnitude' || valueType=='value' ) {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.magnitudeValue(value, multiIndex);
            }else if(valueType=='unit'){
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.unitValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    /*
     * @Override
     */
    resetValue: function (multiIndex) {
        this.clearValue();
        var mInd = this._getDefaultMultiIndex(multiIndex);
        this.unitValue(this.defaultValueUnit(), mInd, true);
        this.magnitudeValue(this.defaultValueMagnitude(), mInd, true);
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    clearValue: function () {
        this.removeValue( null);
    },

    clearUnitValue: function (multiIndex) {
        this.clearValueProp('|unit', multiIndex);
    },
    clearMagnitudeValue: function (multiIndex) {
        this.clearValueProp('|magnitude', multiIndex);
    },

    removeValue: function (multiIndex) {
        this.clearValueProp(this._MULTI_ARR_PARAM, multiIndex);
    },

    /*
     * @Override
     */
    containsValue: function() {
        return thinkehr.f4.util.isValueNonEmpty(this.magnitudeValue()) && thinkehr.f4.util.isValueNonEmpty(this.unitValue());
    },

    hasValue:function(){
        return this._hasValue(this.magnitudeValue(), this._isValueEmpty);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.QuantityFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.CodeValueBasedFieldModel = thinkehr.f4.NodeModel._extendM({
    init: function (properties) {
        this._super(properties);
        this._skipDefaultValue = false;
        if(this.eventListeners == null) {
            this.eventListeners = {};
        }
    },

    codeValue: function (value, language) {
        var val = this.getValue();
        if(value!=null && thinkehr.f4.util.isString(value)){
            value = value.trim();
        }
        if (arguments.length > 0) {
            if (!this.isMulti()) {
                this._deleteOtherProperty();
            }

            if (value === null || value === "" || value === undefined) {
                this.clearValue();
                return null;
            } else {
                val=this.addValue(value, language);
            }
        } else if (this.isMulti()) {
            var codeValues = [];
            this._getValuesArray().forEach(function (v) {
                var currMultiItemCode = v["|code"];
                /* labels for multi are generated so view will update with bindings to labelValue() or each InputItem*/
                if(currMultiItemCode!=null){
                    codeValues.push(currMultiItemCode);
                }
            }, this);

            if(!this._skipDefaultValue && !codeValues.length) {
                var defaultValueCode = this.defaultValueCode();

                if(defaultValueCode) {
                    defaultValueCode.forEach(function (codeVal) {
                        this.codeValue(codeVal, language);
                    }, this);
                    var retCodeVal = this.codeValue();
                    this._setIsDefaultValue(true);
                    return retCodeVal;
                }
            }

            return codeValues;
        } else if (val == null ) {
            if (val == null && this.defaultValueCode) {
                var defaultValueCode2 = this.defaultValueCode();
                var dvCode;
                if( defaultValueCode2 && !this._skipDefaultValue ) {
                    dvCode = defaultValueCode2[0];
                }

                if (dvCode) {
                    var retCodeVal1 = this.codeValue(dvCode, language);
                    this._setIsDefaultValue(true);
                    return retCodeVal1;
                }
            }

            return null;
        }

        return val["|code"]?val["|code"]:null;
    },

    labelValue: function (language, labelValueFormat ) {
        if (this.isMulti()) {
            var cvm = this.codeValue();
            //TODO optimize by caching array locally
            var lv = cvm.map(function (c) {
                var item = this.findInputItemByCode(c, language);
                if (item) {
                    var labelValue = language !== undefined ? item.getLabel(language) : item.getLabel();
                    if (!labelValue) {
                        labelValue = item.getLabel();
                    }
                    return labelValueFormat ? { label:labelValue, value:item.value, status:item.status} : labelValue;
                }else{
                    var foreignItem = this.findValueObjectByCode(c);
                    var lbl='('+c+') '+(foreignItem.value?foreignItem.value:'');
                    if(!foreignItem){
                        lbl='('+c+') not found'
                    }
                    return labelValueFormat? {label:lbl, value:c, status:thinkehr.f4.InputItem.STATUS_NOT_FOUND}:lbl
                }
            }.bind(this));
            lv = lv.filter(function (itm) {
                return itm != null;
            });
            var ovm = labelValueFormat && this.otherValue()!=null ? { label:this.otherValue(), value:thinkehr.f4.InputItem.OTHER_VALUE} : this.otherValue();
            if (thinkehr.f4.util.isString(ovm) || (ovm && ovm.value==thinkehr.f4.InputItem.OTHER_VALUE)) {
                lv.push(ovm);
            }
            return lv;

        } else {
            var ov = labelValueFormat ? { label:this.otherValue(), value:thinkehr.f4.InputItem.OTHER_VALUE} : this.otherValue();
            if (thinkehr.f4.util.isString(ov)) {
                return ov;
            } else {
                var cv = this.codeValue();
                if(cv){
                    var item = this.findInputItemByCode(cv, language);
                    var itemStatus;
                    if(item) {
                        var labelValue = language !== undefined ? item.getLabel(language) : item.getLabel();
                        if (labelValue==null) {
                            labelValue = item.getLabel();
                        }
                        if(labelValue!=null){
                            this.getValue()["|value"]= labelValue;
                        }
                        itemStatus = item.status;
                    }
                }
                var labelVal = cv ? this.getValue()["|value"] : null;
                var ret = labelValueFormat ? { label: labelVal, value:cv, status:itemStatus } : labelVal;
                return cv ? ret : null;
            }
        }
    },

    setLabelValue : function (code, value, valueObject) {
        if(!valueObject || valueObject['|code']!=code) {
            valueObject = this.findValueObjectByCode(code);
        }

        if(valueObject) {
            valueObject["|value"] = value;
            return true;
        }
        return false;
    },

    defaultValueCode: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            this._getCodeInput().setDefaultValue(dv);
        }else {
            dv = this._getCodeInput().getDefaultValue();
        }
        if(thinkehr.f4.util.isString(dv) && dv.length > 0){
            dv=dv.split(';').map(function(codeVal){
                return codeVal.trim();
            })
        }
        if(dv && thinkehr.f4.util.isArray(dv)){
            return dv;
        }
        return  null;
    },

    otherValue: function (value) {
        if (!this.isListOpen()) {
            return null;
        }

        var val = this.getValue();

        // Getter
        if (arguments.length === 0) {
            if (!val) {
                return null;
            }
            else if (this.isMulti()) {
                var ov = this.findOtherValueObject();
                return ov ? ov["|other"] : null;
            } else {
                return val["|other"] ? val["|other"] : null;
            }
        } else {
            // Setter

            if (!this.isMulti()) {
                this.clearValue();
            }

            if (value === null || value === "" || value === undefined) {
                if (this.isMulti()) {
                    this.removeOtherValue();
                } else {
                    this.clearValue();
                }

                return null;
            } else {
                if (this.isMulti()) {
                    var otherVal = this.findOtherValueObject();
                    if (otherVal) {
                        otherVal["|other"] = value;
                    } else {
                        otherVal = this.addOtherValue(value);
                    }

                    this._setIsDefaultValue(false);
                    return otherVal["|other"];
                } else {
                    var otherValObj = this.findOtherValueObject();
                    if(!otherValObj){
                        otherValObj=this.setValue(value, this._getValuesArray().length, '|other');
                    }else{
                        otherValObj["|other"] = value;
                    }
                    this._setIsDefaultValue(false);
                    return otherValObj;
                }
            }
        }
    },

    findInputItemByCode: function (code, updateInLanguage) {
        var valObj = this.findValueObjectByCode(code);
        var withDefaultValues;
        if(valObj) {
            withDefaultValues = {label: valObj['|value'] , localizedLabels: {}};
            withDefaultValues.localizedLabels[updateInLanguage] = withDefaultValues.label;
        }
        var item = this._getCodeInput().findInputItemByValue(code, false, withDefaultValues);
        if(item) {
            item.setOnUpdateCallback(function (inputItem) {
                this._setValueFromInputItem( inputItem, updateInLanguage);

            }.bind(this));
        }
        return item;
    },

    findValueObjectByCode: function (code) {
        var searchInArr = this._getValuesArray();

        if(searchInArr) {
            for (var i = 0; i < searchInArr.length; i++) {
                var val = searchInArr[i];
                if (val["|code"] == code) {
                    return val;
                }
            }
        }
        return null;
    },

    findOtherValueObject: function () {
        var valArray = this._getValuesArray();
        for (var i = 0; i < valArray.length; i++) {
            var val = valArray[i];
            if (val["|other"]) {
                return val;
            }
        }

        return null;
    },
    addValue: function (code, language) {

        this._skipDefaultValue = true;
        this._setIsDefaultValue(false);
        var val = this.findValueObjectByCode(code);
        if (val) {
            return val;
        }

        var atMultiIndex = this.isMulti() ? this._getValuesArray().length : 0;
        val=this.setValue(code, atMultiIndex, "|code");

        var item = this.findInputItemByCode(code, language);

        if (item) {
            this._setValueFromInputItem(item, language);
            this._updateOtherFields(val, item);
        }

        this._resetOtherFields(val);

        return val;
    },

    removeValue: function (code) {
        var valObj = this.findValueObjectByCode(code);
        if (valObj) {
            var valArray = this._getValuesArray();
            var index = valArray.indexOf(valObj);
            valArray.splice(index, 1);
        }

        this._skipDefaultValue = true;
        this._setIsDefaultValue(false);

        return valObj;
    },

    addOtherValue: function (value) {
        var val = {
            "|other": value
        };

        var valArray = this._getValuesArray();
        valArray.push(val);
        if (!this.getValue()) {
            this.setValue(valArray);
        }

        return val;
    },

    removeOtherValue: function () {
        var valObj = this.findOtherValueObject();
        if (valObj) {
            var valArray = this._getValuesArray();
            var index = valArray.indexOf(valObj);
            valArray.splice(index, 1);
        }
        this._skipDefaultValue = true;
        this._setIsDefaultValue(false);
        return valObj;
    },

    isListOpen: function () {
        return this._getCodeInput().isListOpen();
    },

    addTerminologyItemUpdateListener: function (eventHandler) {
        if(!this.eventListeners['terminologyItemUpdate']){
            this.eventListeners['terminologyItemUpdate'] = [];
        }
        if(this.eventListeners['terminologyItemUpdate'].indexOf(eventHandler)===-1) {
            this.eventListeners['terminologyItemUpdate'].push(eventHandler);
        }
    },

    _dispatchEvent: function (eventName, eventValue) {
        if(this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(function (evHandler) {
                evHandler.call(null,{event:eventName, value:eventValue})
            })
        }
    },

    _setValueFromInputItem : function (inputItem, language) {

        var labelValue = language !== undefined ? inputItem.getLabel(language) : inputItem.getLabel();
        if (!labelValue) {
            labelValue = inputItem.getLabel();
        }
        if(this.setLabelValue(inputItem.value,labelValue)){
            this._dispatchEvent('terminologyItemUpdate', inputItem);
        }
    },

    _getCodeInput: function () {
        return this.getInputFor("code");
    },

    _updateOtherFields: function (val, item) {
        // For override
    },

    _resetOtherFields: function (val) {
        // For override
    },

    _deleteOtherProperty: function () {
        var val = this.getValue();
        if (val) {
            if (val["|other"] !== undefined) {
                delete val["|other"];
            }
        }
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.clearValue();
        var defaultValueCodesArr = this.defaultValueCode();
        if(!defaultValueCodesArr || !defaultValueCodesArr.length) {
            defaultValueCodesArr = [null];
        }
        defaultValueCodesArr.forEach(function (codeVal) {
            this.codeValue(codeVal);
        }, this);
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value' || valueType=='code' ) {
                this.codeValue(value);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    /*
     * @Override
     */
    clearValue: function () {
        this._setValuesArray([]);
        this._skipDefaultValue = true;
        this._setIsDefaultValue(false);
    },

    hasValue:function(){
        return this._hasValue(this.codeValue(), this._isValueEmpty);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.CodeValueBasedFieldModel";
    }
});

thinkehr.f4.CodedTextFieldModel = thinkehr.f4.CodeValueBasedFieldModel._extendM({
    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_CODED_TEXT;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.CodedTextFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.OrdinalFieldModel = thinkehr.f4.CodeValueBasedFieldModel._extendM({
    init: function (properties) {
        this._super(properties);
    },

    isListOpen:function(){
        return false
    },

    /*
     * @Override
     */
    _getCodeInput: function () {
        return this.getInput(0);
    },

    /*
     * @Override
     */
    _updateOtherFields: function (val, item) {
        val["|ordinal"] = item["ordinal"];
    },

    /*
     * @Override
     */
    addValue: function (code, language) {
        var val = this._super(code, language);

        if (val) {
            var item = this.findInputItemByCode(code, language);
            if (item) {
                val["|ordinal"] = item.ordinal;
            }
        }
        return val;
    },

    /*
     * @Override
     */
    getInputFor: function (suffix) {
        return suffix == "code" ? this.getInput(0) : this._super(suffix);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_ORDINAL;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.OrdinalFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.TextFieldModel = thinkehr.f4.DirectValueModel._extendM({
    init: function (properties) {
        this._super(properties);
        if(this._otherValue===undefined){
            this._otherValue=null;
        }
    },

    textValue: function (value, multiIndex) {
        return this.valueGetterSetter.apply(this, arguments);
    },

    getDefaultInput: function () {
        return this.getInputByType(thinkehr.f4.InputType.TEXT);
    },

    isListOpen: function () {
        return this.getInputFor('textValues').isListOpen();
    },

    /*
     * @Override
     */
    getInputFor: function (suffix) {
        return suffix == "textValues" ? this.getInput(0) : this._super(suffix);
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.textValue(this.defaultValue());
        this._setIsDefaultValue( true );
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value') {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.textValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_TEXT;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.TextFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.ProportionFieldModel = thinkehr.f4.NodeModel._extendM({
    init: function (properties) {
        this._super(properties);
    },

    numeratorValue: function (value, multiIndex, setEmptyValue) {
        var val = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|numerator'));

            if(value===this._MULTI_ARR_PARAM){
                if ((val == null || val.length<1) && this.defaultValueNumerator() && !this._skipDefaultValue) {

                    var nv = this.defaultValueNumerator();
                    if (nv !== null && nv !== undefined) {

                        var defMultiInd = multiIndex != null ? multiIndex : 0;
                        var dv = this.defaultValueDenominator(defMultiInd);
                        if (dv) {
                            this.denominatorValue(dv, defMultiInd);
                        }

                        this.numeratorValue(nv, defMultiInd);
                        this._setIsDefaultValue(true);
                        return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|numerator'));
                    }

                    return null;
                }
            }else{
                this._skipDefaultValue = true;
                this._setIsDefaultValue(false);
                var actualValue = value && thinkehr.f4.util.isString(value) ? parseFloat(value) : value;
                if (!setEmptyValue && ( actualValue === null || value === "" || value === undefined )) {
                    this.clearNumeratorValue(multiIndex);
                    return null;
                } else {
                    this.setValueProp(actualValue, '|numerator', multiIndex);
                    var fd=this._getFixedDenominator(multiIndex);
                    if( fd!=null ) {
                        this.setValueProp(fd, '|denominator', multiIndex);
                    }
                    return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|numerator'));
                }
            }

        return this._setFloatValueIfString(val, multiIndex, '|numerator');
    },

    defaultValueNumerator: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            if(dv.indexOf('/')>0) {
                dv=dv.split('/')[0];
            }else {
                dv = this._getPropertyValueFromMultiDefaultString(dv, 'numerator', false);
            }
            this.getInputFor("numerator").setDefaultValue(dv);
        }else {
            dv = this.getInputFor("numerator").getDefaultValue();
        }

        if (thinkehr.f4.util.isString(dv)) {
            return dv.length > 0 ? parseFloat(dv) : null;
        } else if (dv !== null && dv !== undefined) {
            return dv;
        }

        return null;
    },

    denominatorValue: function (value, multiIndex) {
        var val = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|denominator'));

        if(value===this._MULTI_ARR_PARAM){
            var defMultiInd = multiIndex != null ? multiIndex : 0;
            if((val == null|| val.length<1) && this.defaultValueDenominator(defMultiInd) && !this._skipDefaultValue) {
                var dv = this.defaultValueDenominator(defMultiInd);
                if (dv !== null && dv !== undefined) {
                    var nv = this.defaultValueNumerator();
                    if (nv) {
                        this.numeratorValue(nv, defMultiInd);
                    }

                    this.denominatorValue(dv, defMultiInd);
                    this._setIsDefaultValue(true);
                    return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|denominator'));
                }

                return null;
            }
            }else{
                var fd=this._getFixedDenominator(multiIndex);
                if( fd!=null ) {
                    value = fd;
                }
                this._skipDefaultValue = true;
                this._setIsDefaultValue(false);
                var actualValue = value && thinkehr.f4.util.isString(value) ? parseFloat(value) : value;
                if ( actualValue === null || value === "" || value === undefined ) {
                    this.clearDenominatorValue(multiIndex);
                    return null;
                } else {
                    this.setValueProp(parseFloat(value), '|denominator', multiIndex);
                    return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|denominator'));
                }
            }

        return this._setFloatValueIfString(val, multiIndex, '|denominator');
    },

    defaultValueDenominator: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            if(dv.indexOf('/')>0) {
                dv=dv.split('/')[1];
            }else {
                dv = this._getPropertyValueFromMultiDefaultString(dv, 'denominator', true);
            }
            if(dv==null) {
                dv = 100;
            }
            this.getInputFor("denominator").setDefaultValue(dv);
        }else {
            dv = this.getInputFor("denominator").getDefaultValue();
        }
        if (thinkehr.f4.util.isString(dv)) {
            return dv.length > 0 ? parseFloat(dv) : null;
        } else if (dv !== null && dv !== undefined) {
            return dv;
        } else {
            return this._getFixedDenominator();
        }
        return null;
    },

    _getFixedDenominator: function () {
        var minDn = this.getMinValueForDenominator();
        var maxDn = this.getMaxValueForDenominator();

        if (maxDn !== null && minDn !== undefined && maxDn !== undefined && minDn === maxDn) {
            var fd = parseFloat(minDn);
            return fd;
        }

        return null;
    },

    _getRangeNumericProperty: function (validation, property) {
        if (validation && validation.range && validation.range[property] !== undefined) {
            return parseFloat(validation.range[property]);
        }

        return null;
    },

    _getRangeStringProperty: function (validation, property) {
        if (validation && validation.range && thinkehr.f4.util.isString(validation.range[property])) {
            return validation.range[property];
        }

        return null;
    },

    getMinValueForNumerator: function () {
        return this._getRangeNumericProperty(this.getInputFor("numerator").getValidation(), "min");
    },

    getMaxValueForNumerator: function () {
        return this._getRangeNumericProperty(this.getInputFor("numerator").getValidation(), "max");
    },

    getMinValueForDenominator: function () {
        return this._getRangeNumericProperty(this.getInputFor("denominator").getValidation(), "min");
    },

    getMaxValueForDenominator: function () {
        return this._getRangeNumericProperty(this.getInputFor("denominator").getValidation(), "max");
    },

    getMinOperatorForNumerator: function () {
        return this._getRangeStringProperty(this.getInputFor("numerator").getValidation(), "minOp");
    },

    getMaxOperatorForNumerator: function () {
        return this._getRangeStringProperty(this.getInputFor("numerator").getValidation(), "maxOp");
    },

    getMinOperatorForDenominator: function () {
        return this._getRangeStringProperty(this.getInputFor("denominator").getValidation(), "minOp");
    },

    getMaxOperatorForDenominator: function () {
        return this._getRangeStringProperty(this.getInputFor("denominator").getValidation(), "maxOp");
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_PROPORTION;
    },

    /*
     * @Override
     */
    resetValue: function (multiIndex) {
        if(multiIndex===undefined && this.isMulti()) {
            multiIndex = null;
        }
        this.removeValue(multiIndex);
        var mInd = this._getDefaultMultiIndex(multiIndex);
        this.denominatorValue(this.defaultValueDenominator(mInd),mInd);
        this.numeratorValue(this.defaultValueNumerator(),mInd);
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType=='numerator') {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.numeratorValue(value, multiIndex);
            }else if(valueType=='denominator'){
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.denominatorValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearDenominatorValue: function (multiIndex) {
        this.clearValueProp('|denominator', multiIndex);
    },

    clearNumeratorValue: function (multiIndex) {
        this.clearValueProp('|numerator', multiIndex);
    },

    removeValue: function (multiIndex) {
        this.clearValueProp(this._MULTI_ARR_PARAM, multiIndex);
    },

    clearValue: function (multiIndex) {
            this.clearNumeratorValue(multiIndex);
            this.clearDenominatorValue(multiIndex);
    },

    /*
     * @Override
     */
    containsValue: function() {
        return thinkehr.f4.util.isValueNonEmpty(this.numeratorValue()) && thinkehr.f4.util.isValueNonEmpty(this.denominatorValue());
    },


    hasValue:function(){
            return  this._hasValue(this.denominatorValue(), this._isValueEmpty) && this._hasValue(this.numeratorValue(), this._isValueEmpty);
    },


    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.ProportionFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.MultimediaFieldModel = thinkehr.f4.NodeModel._extendM({
    init: function (properties) {
        this._super(properties);
        this._skipDefaultMimeTypeValue = false;
        this._skipDefaultValue = false;
    },

    uriValue: function (value, multiIndex) {
        var val = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|uri'));

            if(value===this._MULTI_ARR_PARAM){
                if ((val == null || val.length<1) && this.defaultValueUri() && !this._skipDefaultValue) {
                    var dUri = this.defaultValueUri();
                    if (dUri !== null && dUri !== undefined) {

                        var defMultiInd = multiIndex != null ? multiIndex : 0;
                        this.uriValue(dUri, defMultiInd);
                        this._setIsDefaultValue(true);
                        return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|uri'));
                    }

                    return null;
                }
            }else{
                this._skipDefaultValue = true;
                this._setIsDefaultValue(false);
                if (value === null ) {
                    this.clearUriValue(multiIndex);
                    return null;
                } else {
                    this.setValueProp(value, '|uri', multiIndex);
                    return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|uri'));
                }
            }

        return val;
    },

    defaultValueUri: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            dv = this._getPropertyValueFromMultiDefaultString(dv, 'uri', false);
            this.getInputByType(thinkehr.f4.InputType.TEXT).setDefaultValue(dv);
        }else{
            dv = this.getInputByType(thinkehr.f4.InputType.TEXT).getDefaultValue();
        }

        if (dv !== null && dv !== undefined) {
            return dv;
        }

        return null;
    },

    mimeTypeValue: function (value, multiIndex) {
        var val = this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|mimetype'));
        if(value===this._MULTI_ARR_PARAM){
            if ((val == null || val.length<1) && this.defaultValueMimeType() && !this._skipDefaultMimeTypeValue) {
                var dMimeTy = this.defaultValueMimeType();
                if (dMimeTy !== null && dMimeTy !== undefined) {

                    var defMultiInd = multiIndex != null ? multiIndex : 0;
                    this.mimeTypeValue(dMimeTy, defMultiInd);
                    this._setIsDefaultValue(true);
                    return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|mimetype'));
                }

                return null;
            }
        }else{

            this._skipDefaultMimeTypeValue = true;
            this._setIsDefaultValue(false);
            if (value === null ) {
                this.clearMimeTypeValue(multiIndex);
                return null;
            } else {
                this.setValueProp(value, '|mimetype', multiIndex);
                return this.getValue.apply(this, this._getMultiIndexArgs(arguments, '|mimetype'));
            }
        }

        return val;
    },

    defaultValueMimeType:function(){
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            dv = this._getPropertyValueFromMultiDefaultString(dv, 'mimetype', true);
            //TODO get mimetype input and get uri input by suffix - it is not present at the moment
            //this.getInputByType(thinkehr.f4.InputType.TEXT).setDefaultValue(dv);
        }else{
            //TODO get mimetype input and get uri input by suffix - it is not present at the moment
            //dv = this.getInputByType(thinkehr.f4.InputType.TEXT).getDefaultValue();
        }

        if (dv !== null && dv !== undefined) {
            return dv;
        }

        return null;
    },

    clearValue: function (multiIndex) {
        this.clearUriValue(multiIndex);
        this.clearMimeTypeValue(multiIndex);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_MULTIMEDIA;
    },

    /*
     * @Override
     */
    resetValue: function (multiIndex) {
        if(multiIndex===undefined && this.isMulti()) {
            multiIndex = null;
        }
        this.removeValue(multiIndex);
        var mInd = multiIndex != null ? multiIndex : 0;
        this.uriValue(this.defaultValueUri(mInd),mInd);
        this.mimeTypeValue(null,mInd);
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value' || valueType=='uri') {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.uriValue(value, multiIndex);
            }else if(valueType=='mimetype'){
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.mimeTypeValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearUriValue: function (multiIndex) {
        this.clearValueProp('|uri', multiIndex);
    },

    clearMimeTypeValue: function (multiIndex) {
        this.clearValueProp('|mimetype', multiIndex);
    },

    removeValue: function (multiIndex) {
        this.clearValueProp(this._MULTI_ARR_PARAM, multiIndex);
    },

    hasValue:function(){
        return this._hasValue(this.uriValue(), this._isValueEmpty);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.MultimediaFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.BooleanFieldModel = thinkehr.f4.NodeModel._extendM({
    init: function (properties) {
        this._super(properties);
        this._skipDefaultValue = false;
    },

    setValue:function(value){
        this.booleanValue(value);
    },

    booleanValue: function (value) {

        if (arguments.length > 0) {

            this.value = value;
            var parentRef = this.getValueNodeParentRef();
            if(parentRef) {
                if (parentRef.length > 0) {
                    if (value !== null && value !== undefined) {
                        parentRef[0] = this.value;
                        this._skipDefaultValue = false;
                    } else {
                        parentRef.shift();
                        this._skipDefaultValue = true;
                    }
                } else if (value !== null && value !== undefined) {
                    parentRef.push(this.value);
                    this._skipDefaultValue = false;
                }
            }
            this._setIsDefaultValue(false);
        }
        else if ((this.value == null || this.value === "") && !this._skipDefaultValue) {
            var val = this.defaultValueBoolean();
            if (val === null) {
                if (!this.isThreeState()) {
                    this._setIsDefaultValue(true);
                    return this.booleanValue(false);
                }
            } else {
                this._setIsDefaultValue(true);
                return this.booleanValue(val);
            }
        }

        return this.value;
    },

    defaultValueBoolean: function () {
        var val;
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            if(dv==='null'){
                dv = null;
            }
            this.getInputByType(thinkehr.f4.InputType.BOOLEAN).setDefaultValue(dv);
        }else{
            dv = this.getInputByType(thinkehr.f4.InputType.BOOLEAN).getDefaultValue();
        }
        if (dv !== null && dv !== undefined) {
            var isStr = thinkehr.f4.util.isString(dv);
            if ((dv !== undefined && !isStr) || (isStr && dv.length > 0)) {
                val = isStr ? dv === "true" : dv;
            } else if (!this.isThreeState()) {
                val = false;
            } else {
                val = null;
            }
        } else if (this.isThreeState()) {
            val = null;
        } else {
            val = false;
        }

        if (this.allowedValues().indexOf(val) < 0) {
            val = !val;
        }

        return val;
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_BOOLEAN;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.booleanValue(this.defaultValueBoolean())
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value') {
                this.booleanValue(value);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearBooleanValue: function () {
        var parentRef = this.getValueNodeParentRef();
        if (parentRef && parentRef.length > 0) {
            if (this.isThreeState()) {
                parentRef.shift();
                this.value = null;
            } else {
                this.value = false;
                parentRef[0] = this.value;
            }
        }

        this._skipDefaultValue = true;
    },

    isThreeState: function() {
        return this.getViewConfig().getField() && this.getViewConfig().getField().threeState;
    },

    allowedValues: function () {
        if (!this._allowedValues) {
            this._allowedValues = [];

            var input = this.getInput(0);
            if (input.hasItems()) {
                for (var i = 0; i < input.getList().length; i++) {
                    var item = input.getItem(i);
                    var val = item.value;
                    if (val !== undefined) {
                        if (thinkehr.f4.util.isString(val)) {
                            if (val === "true") {
                                this._allowedValues.push(true);
                            } else if (val === "false") {
                                this._allowedValues.push(false);
                            }
                        } else {
                            this._allowedValues.push()
                        }
                    }
                }
            } else {
                this._allowedValues.push(true, false);
            }

            if (this.isThreeState()) {
                this._allowedValues.push(null);
            }
        }

        return this._allowedValues;
    },

    _isValueEmpty: function(booleanValue){

        if(this.isThreeState()){
            return booleanValue==undefined || booleanValue=='';
        }else if(booleanValue===false || booleanValue === true) {
            return false;
        }
        return true;
    },

    hasValue:function(){
        return this._hasValue(this.booleanValue(), this._isValueEmpty.bind(this));
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.BooleanFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.DateFieldModel = thinkehr.f4.DirectValueModel._extendM({
    init: function (properties) {
        this._super(properties, "dateValue");
    },

    dateValue: function (value, multiIndex) {
        return this.valueGetterSetter.apply(this, arguments);
    },

    dateObjectValue: function () {
        return thinkehr.f4.util.toDate(this.dateValue());
    },

    /*
     * @Override
     */
    getDefaultInput: function () {
        return this.getInputByType(thinkehr.f4.InputType.DATE);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_DATE;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.dateValue(this.defaultValue());
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value' ) {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.dateValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearDateValue: function () {
        this.clearValue();
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.DateFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.TimeFieldModel = thinkehr.f4.DirectValueModel._extendM({
    init: function (properties) {
        this._super(properties, "timeValue");
    },

    timeValue: function (value, multiIndex) {
        return this.valueGetterSetter.apply(this, arguments);
    },

    timeObjectValue: function (multiIndex) {
        return thinkehr.f4.util.toTime(this.timeValue(undefined, multiIndex));
    },

    /*
     * @Override
     */
    getDefaultInput: function () {
        return this.getInputByType(thinkehr.f4.InputType.TIME);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_TIME;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.timeValue(this.defaultValue());
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value' ) {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.timeValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearTimeValue: function () {
        this.clearValue();
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.TimeFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.DateTimeFieldModel = thinkehr.f4.DirectValueModel._extendM({
    init: function (properties) {
        this._super(properties, "dateTimeValue");
    },

    dateTimeValue: function (value, multiIndex) {
        if(arguments[0]) {
            arguments[0] = thinkehr.f4.util.toLocalTimezoneOffsetISOString(value);
        }
        return this.valueGetterSetter.apply(this, arguments);
    },

    dateTimeObjectValue: function (multiIndex) {
        return thinkehr.f4.util.toDate(this.dateTimeValue(undefined, multiIndex));
    },

    /*
     * @Override
     */
    getDefaultInput: function () {
        return this.getInputByType(thinkehr.f4.InputType.DATETIME);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_DATE_TIME;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.dateTimeValue(this.defaultValue());
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value' ) {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.dateTimeValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearDateTimeValue: function () {
        this.clearValue();
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.DateTimeFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.CountFieldModel = thinkehr.f4.DirectValueModel._extendM({
    init: function (properties) {
        this._super(properties, "countValue");
    },

    countValue: function (value, multiIndex) {

        if(value!=null){
            var val=parseFloat(arguments[0]);
            if(isNaN(arguments[0])) {
                throw new Error("countValue ("+arguments[0]+") is not number ");
            }else{
                arguments[0] = val;
            }
        }
        return this.valueGetterSetter.apply(this, arguments);
    },

    /*
     * @Override
     */
    defaultValue: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            this.getDefaultInput().setDefaultValue(dv);
        }else{
            dv = this.getDefaultInput().getDefaultValue();
        }
        if (thinkehr.f4.util.isString(dv)) {
            return dv.length > 0 ? parseInt(dv) : null;
        } else if (dv !== null && dv !== undefined) {
            return dv;
        }

        return null;
    },

    /*
     * @Override
     */
    getDefaultInput: function () {
        return this.getInputByType(thinkehr.f4.InputType.INTEGER);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_COUNT;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.countValue(this.defaultValue());
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value' ) {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.countValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearCountValue: function () {
        this.clearValue();
    },

    hasValue:function(){
        return this._hasValue(this.countValue(), this._isValueEmpty);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.CountFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.DurationFieldModel = thinkehr.f4.DirectValueModel._extendM({
    init: function (properties) {
        this._super(properties, "durationValue");
        this.periodsMultiArray = [[null, null, null, null, null, null, null]];
        var self = this;
        setTimeout(function(){
            var valsArr = self._getValuesArray();
            if (valsArr) {
                if(!thinkehr.f4.util.isArray(valsArr)){
                    throw new Error("_getValuesArray must return array")
                }
                var multiValsArr = valsArr.map(function (valStr) {
                    return nezasaEhr.iso8601.Period.parse(valStr);
                });
                self._syncPeriodArray(multiValsArr);
            }
        },0);

        this.fieldNames = ["year", "month", "week", "day", "hour", "minute", "second"];
    },

    durationValue: function (value, multiIndex) {
        if(multiIndex===null){
            multiIndex = 0;
        }
        var prevVal = this.getValue(undefined, multiIndex);
        var strVal=this.valueGetterSetter.apply(this, arguments);
        if (arguments.length > 0 || strVal !== prevVal) {

            var multiValsArr = this.valueGetterSetter(undefined, undefined).map(function (valStr) {
                return nezasaEhr.iso8601.Period.parse(valStr);
            });
            this._syncPeriodArray(multiValsArr);
        }
        return strVal;
    },

    _syncPeriodArray: function (paNewMultiArr) {

        var setValuesOnMultiArray = function (srcArr, targetArr) {
            srcArr.forEach(function (p, i) {
                var pVal = targetArr[i];
                if (!(pVal === null && p === 0)) {
                    targetArr[i] = p === 0 ? null : p;
                }
            });
        };

        if( paNewMultiArr && thinkehr.f4.util.isArray(paNewMultiArr) && paNewMultiArr.length && !thinkehr.f4.util.isArray(paNewMultiArr[0] ) ){
            throw new Error ("paMulti is not multi array")
        }

        var tpaMulti = this.periodsMultiArray;
        if(paNewMultiArr.length<1) {
            paNewMultiArr = [[null, null, null, null, null, null, null]];
        }
        var newMultiLocalArr = thinkehr.f4.util.deepClone(paNewMultiArr);

        for (var mInd = tpaMulti.length-1; mInd >-1 ; mInd--) {
            var newMultiLocalDur = newMultiLocalArr.splice(mInd,1)[0];
            var multiArrDur = tpaMulti[mInd];
            if(newMultiLocalDur) {
                setValuesOnMultiArray(newMultiLocalDur, multiArrDur);
            }else{
                tpaMulti.splice(mInd, 1);
            }
        }
        if(newMultiLocalArr.length){
            for (var j = 0; j < newMultiLocalArr.length; j++) {
                var newMultiLocDur = newMultiLocalArr[j];
                var multiDurArr = [];
                tpaMulti.push(multiDurArr);
                setValuesOnMultiArray(newMultiLocDur, multiDurArr);
            }
        }
    },

    _durationArrayValue: function (multiIndex, index, value) {
        var v;
        multiIndex = multiIndex != null ? multiIndex : 0;
        if (arguments.length <= 2) {
            v = this.periodsMultiArray[multiIndex]?this.periodsMultiArray[multiIndex][index]:null;
        } else {
            if (thinkehr.f4.util.isInteger(value)) {
                v = value;
            } else if (thinkehr.f4.util.isString(value)) {
                v = parseInt(value);
            } else if (value === undefined) {
                value = null;
            } else {
                v = value;
            }

            var potentialArray = thinkehr.f4.util.deepClone(this.periodsMultiArray);
            potentialArray[multiIndex][index] = v;
            var potentialStrVal = nezasaEhr.iso8601.Period.periodToString(potentialArray[multiIndex]);

            if (nezasaEhr.iso8601.Period.isValid(potentialStrVal)) {
                this.periodsMultiArray[multiIndex][index] = v;
                if(potentialStrVal===null){
                    potentialStrVal = '';
                }
                this.valueGetterSetter(potentialStrVal, multiIndex);
            } else {
                throw new Error("Invalid duration period: '", v, "'");
            }
        }

        return v;
    },

    yearsValue: function (value, multiIndex) {
        var args = [multiIndex, 0];
        if(arguments.length && value!==undefined) {
            args.push(value);
        }
        return this._durationArrayValue.apply(this, args);
    },

    monthsValue: function (value, multiIndex) {
        var args = [multiIndex, 1];
        if(arguments.length && value!==undefined) {
            args.push(value);
        }
        return this._durationArrayValue.apply(this, args);
    },

    weeksValue: function (value, multiIndex) {
        var args = [multiIndex, 2];
        if(arguments.length && value!==undefined) {
            args.push(value);
        }
        return this._durationArrayValue.apply(this, args);
    },

    daysValue: function (value, multiIndex) {
        var args = [multiIndex, 3];
        if(arguments.length && value!==undefined) {
            args.push(value);
        }
        return this._durationArrayValue.apply(this, args);
    },

    hoursValue: function (value, multiIndex) {
        var args = [multiIndex, 4];
        if(arguments.length && value!==undefined) {
            args.push(value);
        }
        return this._durationArrayValue.apply(this, args);
    },

    minutesValue: function (value, multiIndex) {
        var args = [multiIndex, 5];
        if(arguments.length && value!==undefined) {
            args.push(value);
        }
        return this._durationArrayValue.apply(this, args);
    },

    secondsValue: function (value, multiIndex) {
        var args = [multiIndex, 6];
        if(arguments.length && value!==undefined) {
            args.push(value);
        }
        return this._durationArrayValue.apply(this, args);
    },

    /*
     * @Override
     */
    defaultValue: function () {
        var dv = this.getMultiContainerDefaultValue();
        if(dv!=null) {
            return dv;
        }else {
            var dvf = this.defaultValueFor;
            var t = this;
            var dva = [dvf.call(t, "year"), dvf.call(t, "month"), dvf.call(t, "week"), dvf.call(t, "day"), dvf.call(t, "hour"),
                dvf.call(t, "minute"), dvf.call(t, "second")];

            return nezasaEhr.iso8601.Period.periodToString(dva);
        }
    },

    defaultValueFor: function (suffix) {
        var input = this.getInputFor(suffix);
        if (input) {
            var dv = input.getDefaultValue();
            if (dv !== undefined && dv !== null) {
                return dv;
            }
        }
        return null;
    },

    /*
     * @Override
     */
    setValue: function (value) {
        this._super(value);
        var newMultiArr;
        if (value === null) {
            newMultiArr = [[null, null, null, null, null, null, null]];
        } else if (thinkehr.f4.util.isString(value)) {
            newMultiArr = [nezasaEhr.iso8601.Period.parse(value)];
        }else if(thinkehr.f4.util.isArray(value)) {
            newMultiArr = this.getValue().map(function (valStr) {
                return nezasaEhr.iso8601.Period.parse(valStr);
            });
        }
        this._setIsDefaultValue(false);
        if(newMultiArr) {
            this._syncPeriodArray(newMultiArr);
        }
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_DURATION;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.setValue(this.defaultValue());
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value, valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            var args = [].splice.call(arguments,0);
            args.splice(1, 1);
            args[1] = this._getDefaultMultiIndex(args[1]);
            switch (valueType) {
                case 'year':
                    this.yearsValue.apply(this, args);//value, multiIndex);
                    break;
                case 'month':
                    this.monthsValue.apply(this, args);
                    break;
                case 'week':
                    this.weeksValue.apply(this, args);
                    break;
                case 'day':
                    this.daysValue.apply(this, args);
                    break;
                case 'hour':
                    this.hoursValue.apply(this, args);
                    break;
                case 'minute':
                    this.minutesValue.apply(this, args);
                    break;
                case 'second':
                    this.secondsValue.apply(this, args);
                    break;
                default:
                    console.warn("Setting non-existent value type (" + valueType + ") with value=" + value + " on RM type (" + this.toString() + ")");
                    break;
            }
        }
    },

    clearValue: function () {
        this._super();
        this.periodsMultiArray = [[null, null, null, null, null, null, null]];
        this._setIsDefaultValue(false);
    },

    clearDurationValue: function () {
        this.clearValue();
    },

    columns: function (columns) {
        if (columns === undefined) {
            if (this._columns === undefined) {
                var maxCols = this.getInputs().length;
                var f = this.getViewConfig().getFields();
                var c = f && f.columns ? parseInt(f.columns) : maxCols;
                this._columns = c <= maxCols ? c : maxCols;
            }
        } else {
            this._columns = columns;
        }

        return this._columns;
    },

    isFieldDisabled: function (suffix) {
        var f = this.getViewConfig().getField(suffix);
        return f && f.disabled === true;
    },

    isFieldHidden: function (suffix) {
        var f = this.getViewConfig().getField(suffix);
        return f && f.hidden === true;
    },

    isFieldRequired: function (multiIndex) {
        return this.isRequired() && !this.durationValue(undefined, multiIndex);
    },

    getFieldName: function (index) {
        return this.fieldNames[index];
    },

    getFieldNames: function () {
        return this.fieldNames;
    },

    _getValidation: function (suffix) {
        var input = this.getInputFor(suffix);
        return input ? input.getValidation() : null;
    },

    _getRange: function (suffix) {
        var vd = this._getValidation(suffix);
        return vd && vd.range ? vd.range : null;
    },

    minValueFor: function (suffix) {
        var range = this._getRange(suffix);
        return range && range.min ? range.min : null;
    },

    minOperatorFor: function (suffix) {
        var range = this._getRange(suffix);
        return range && range.minOp ? range.minOp : null;
    },

    maxValueFor: function (suffix) {
        var range = this._getRange(suffix);
        return range && range.max ? range.max : null;
    },

    maxOperatorFor: function (suffix) {
        var range = this._getRange(suffix);
        return range && range.maxOp ? range.maxOp : null;
    },

    hasValidation: function () {
        if (this.isRequired()) {
            return true;
        }

        var inputs = this.getInputs();
        for (var i = 0; i < inputs.length; i++) {
            var v = inputs[i].getValidation();
            if (v && v.range && (v.range.min !== undefined || v.range.max !== undefined)) {
                return true;
            }
        }

        return false;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.DurationFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.UriFieldModel = thinkehr.f4.DirectValueModel._extendM({
    init: function (properties) {
        this._super(properties, "uriValue");
    },

    uriValue: function (value, multiIndex) {
        return this.valueGetterSetter.apply(this, arguments);
    },

    /*
     * @Override
     */
    getDefaultInput: function () {
        return this.getInputByType(thinkehr.f4.InputType.TEXT);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_URI;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.uriValue(this.defaultValue());
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value,valueType, multiIndex) {
        if(!this._applyValueFromObject(value)){
            if(valueType==null || valueType=='value' ) {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.uriValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearUriValue: function () {
        this.clearValue();
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.UriFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }
});

thinkehr.f4.EhrUriFieldModel = thinkehr.f4.UriFieldModel._extendM({
    init: function (properties) {
        this._super(properties, "ehrUriValue");
        this._ehrUriRegEx=new RegExp(/^ehr:\/\/\S+$/i);
    },

    ehrUriValue: function (value, multiIndex) {
        return this.valueGetterSetter.apply(this, arguments);
    },

    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.DV_EHR_URI;
    },

    /*
     * @Override
     */
    resetValue: function () {
        this.ehrUriValue(this.defaultValue());
        this._setIsDefaultValue(true);
    },

    /*
     * @Override
     */
    applyValue: function (value,valueType, multiIndex) {
        if(!this._applyValueFromObject(value) ){
            if(valueType==null || valueType=='value' ) {
                multiIndex = this._getDefaultMultiIndex(multiIndex);
                this.ehrUriValue(value, multiIndex);
            }else{
                console.warn("Setting non-existent value type ("+valueType+") with value="+value+" on RM type ("+this.toString()+")")
            }
        }
    },

    clearEhrUriValue: function () {
        this.clearValue();
    },

    getEhrUriPattern: function () {
        return this._ehrUriRegEx;
    },

    getPatternValidExample: function () {
      return 'ehr://uri/value';
    },
    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.EhrUriFieldModel/" + this.getName() + "/" + this.getRmType().toString();
    }

});

thinkehr.f4.CustomModel = thinkehr.f4.NodeModel._extendM({
    init: function (properties) {
        this._super(properties);

        if (this.delegateModel === undefined) {
            this.delegateModel = null;
        }
        this._configureWrapperModel(this.delegateModel);

        if (this.func === undefined) {
            this.func = null;
        }
    },

    getDelegateModel: function () {
        return this.delegateModel;
    },

    setDelegateModel: function (delegateModel) {
        this.delegateModel = delegateModel;
        this._configureWrapperModel(delegateModel);
    },

    getPath: function () {
        var path = this._super();
        if (!path) {
            path = this.delegateModel.formId;
        }

        return path;
    },

    _configureWrapperModel: function(wrapperModel) {
        if (wrapperModel) {
            wrapperModel.setWrappingModel(this);
        }
    },


    /*
     * @Override
     */
    getRmType: function () {
        return thinkehr.f4.RmType.CUSTOM;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.CustomModel/" + this._valueFuncName;
    }
});

// A map of rmType string to class mappings

thinkehr.f4._rmTypeToClassMap = {
    "FORM_DEFINITION": thinkehr.f4.FormRootModel,
    "GENERIC_FIELDSET": thinkehr.f4.GenericFieldsetModel,
    "DV_QUANTITY": thinkehr.f4.QuantityFieldModel,
    "DV_CODED_TEXT": thinkehr.f4.CodedTextFieldModel,
    "DV_TEXT": thinkehr.f4.TextFieldModel,
    "DV_PARSABLE": thinkehr.f4.TextFieldModel,
    "DV_PROPORTION": thinkehr.f4.ProportionFieldModel,
    "DV_MULTIMEDIA": thinkehr.f4.MultimediaFieldModel,
    "DV_BOOLEAN": thinkehr.f4.BooleanFieldModel,
    "DV_DATE": thinkehr.f4.DateFieldModel,
    "DV_TIME": thinkehr.f4.TimeFieldModel,
    "DV_DATE_TIME": thinkehr.f4.DateTimeFieldModel,
    "DV_ORDINAL": thinkehr.f4.OrdinalFieldModel,
    "DV_COUNT": thinkehr.f4.CountFieldModel,
    "DV_DURATION": thinkehr.f4.DurationFieldModel,
    "DV_URI": thinkehr.f4.UriFieldModel,
    "DV_EHR_URI": thinkehr.f4.EhrUriFieldModel
};

//--Dependencies------------------------------------------------------------------------------------------------------------------------------------------------

thinkehr.f4.AstVisitor = thinkehr.f4.Object._extendM({
    init: function (properties) {
        this._super(properties);
    },

    /**
     * For override
     * @param astNode The node to visit.
     */
    visit: function (astNode) {
        if (astNode) {
            return true;
        }
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstVisitor";
    }
});

//noinspection JSUnusedLocalSymbols
thinkehr.f4.AstNode = thinkehr.f4.Object._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.rawDesc === undefined) {
            this.rawDesc = null;
        }
    },

    process: function (context) {
        var val = this.evaluate();
        var nextNode = this.next(val);
        if (nextNode) {
            nextNode.process(context)
        }
    },

    evaluate: function () {
        return null;
    },

    next: function (evaluatedValue) {
        return null;
    },

    accept: function (visitor) {
        return visitor.visit(this);
    },

    getRawDesc: function () {
        return this.rawDesc;
    },

    setRawDesc: function (rawDesc) {
        this.rawDesc = rawDesc;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstNode";
    }
});

thinkehr.f4.AstCollectionNode = thinkehr.f4.AstNode._extendM({

    init: function (properties) {
        this._super(properties);
        if (this.collection === undefined) {
            this.collection = [];
        }
    },

    elements: function (elementToAdd) {
        if (elementToAdd !== undefined) {
            this.collection.push(elementToAdd);
        }

        return this.collection;
    },

    /*
     * @Override
     */
    process: function (context) {
        var val = this.evaluate();
        var nextNode = this.next(val);
        while (nextNode) {
            nextNode.process(context);
            nextNode = this.next(val);
        }
    },

    /*
     * @Override
     */
    evaluate: function () {
        return this.collection.slice();
    },

    /*
     * @Override
     */
    next: function (collectionObj) {
        return collectionObj.shift();
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstCollectionNode";
    }
});

thinkehr.f4.Ast = thinkehr.f4.AstCollectionNode._extendM({

    init: function (properties) {
        this._super(properties);
    },

    fields: function (field) {
        return this.elements(field);
    },

    getField: function (fieldId) {
        if(fieldId) {
            var fields = this.fields();
            for (var i = 0; i < fields.length; i++) {
                if(fields[i].getFieldId()==fieldId)return fields[i]
            }
        }

        return null
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Ast";
    }
});

thinkehr.f4.AstField = thinkehr.f4.AstCollectionNode._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.field === undefined) {
            this.field = null;
        }
    },

    getFieldId: function () {
        return this.field;
    },

    setFieldId: function (fieldId) {
        this.field = fieldId;
    },

    conditions: function (condition) {
        return this.elements(condition);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstField";
    }
});

thinkehr.f4.AstCondition = thinkehr.f4.AstNode._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.expression === undefined) {
            this.expression = null;
        }

        if (this.thenStatement === undefined) {
            this.thenStatement = null;
        }
    },

    getExpression: function () {
        return this.expression;
    },

    setExpression: function (expression) {
        this.expression = expression;
    },

    getThenStatement: function () {
        return this.thenStatement;
    },

    setThenStatement: function (statement) {
        this.thenStatement = statement;
    },

    /*
     * @Override
     */
    evaluate: function () {
        return this.expression.evaluate() === true;
    },

    /*
     * @Override
     */
    next: function (val) {
        if (val === true) {
            return this.thenStatement;
        }
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstCondition";
    }
});

/*
 * For override only
 */
thinkehr.f4.AstExpression = thinkehr.f4.AstNode._extendM({

    init: function (properties) {
        this._super(properties);
    },

    isBinary: function() {
        return false;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstExpression";
    }
});

thinkehr.f4.AstFunctionExpression = thinkehr.f4.AstExpression._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.func === undefined) {
            this.func = function () {
            };
        }
    },

    getFunction: function () {
        return this.func;
    },

    setFunction: function (func) {
        this.func = func;
    },

    evaluate: function () {
        return this.getFunction().call(null);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstFunctionExpression";
    }
});

//noinspection JSUnusedLocalSymbols
thinkehr.f4.AstOperatorExpression = thinkehr.f4.AstExpression._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.operatorFunc === undefined) {
            this.operatorFunc = null;
        }

        if (this.lhsOperand === undefined) {
            this.lhsOperand = null;
        }
        if (this.lhsIsMulti === undefined) {
            this.lhsIsMulti = null;
        }
    },

    getOperatorFunc: function () {
        return this.operatorFunc;
    },

    setOperatorFunc: function (operatorFunc) {
        this.operatorFunc = operatorFunc;
    },

    getLhsOperand: function () {
        return this.lhsOperand;
    },

    setLhsOperand: function (lhsOperand) {
        this.lhsOperand = lhsOperand;
    },

    setLhsIsMulti: function (value) {
        this.lhsIsMulti = value;
    },
    getLhsIsMulti: function () {
        return this.lhsIsMulti;
    },
    getLhsValuesArr:function(){
        var lhsVal = this.getLhsOperand().evaluate();
        if(!thinkehr.f4.util.isArray(lhsVal)){
            lhsVal=[lhsVal];
        }else if(!lhsVal) {
            lhsVal = [];
        }
        return lhsVal;
    },
    /*
     * @Override
     */
    next: function (val) {
        return null;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstOperatorExpression";
    }
});

thinkehr.f4.AstUnaryExpression = thinkehr.f4.AstOperatorExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {
        var lhs = this.getLhsValuesArr();
        if(!lhs.length) {
            lhs.push(null);
        }
        return this.getOperatorFunc().call(null, lhs );
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstUnaryExpression";
    }
});

thinkehr.f4.AstBinaryExpression = thinkehr.f4.AstOperatorExpression._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.rhsOperand === undefined) {
            this.rhsOperand = null;
        }
    },

    getRhsOperand: function () {
        return this.rhsOperand;
    },

    setRhsOperand: function (rhsOperand) {
        this.rhsOperand = rhsOperand;
    },

    getRhsValuesArr:function(){
        var rhsVal = this.getRhsOperand().evaluate();
        if(!thinkehr.f4.util.isArray(rhsVal)){
            rhsVal=[rhsVal];
        }else if(!rhsVal || rhsVal.length==0) {
            rhsVal = [null];
        }
        return rhsVal;
    },
    /*
     * Override
     */
    isBinary: function() {
        return true;
    },

    /*
     * @Override
     */
    evaluate: function () {
        var lhs = this.getLhsValuesArr();
        if(!lhs.length) {
            lhs.push(null);
        }
        var rhs = this.getRhsValuesArr();
        return this.getOperatorFunc().call(null, lhs, rhs);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstBinaryExpression";
    }
});

thinkehr.f4.AstBinaryQuantityExpression = thinkehr.f4.AstBinaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {
        var lhs = thinkehr.f4.AstBinaryQuantityExpression.toAstQuantObj( this.getLhsOperand().evaluate());

        var rhs = this.getRhsValuesArr();
        return this.getOperatorFunc().call(null, lhs, rhs);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstBinaryQuantityExpression";
    }
});

thinkehr.f4.AstBinaryQuantityExpression.toAstQuantObj = function (magUnitObjArr) {
    if (!magUnitObjArr || !magUnitObjArr.magnitude || !magUnitObjArr.magnitude.length) {
        magUnitObjArr=[{magnitude: null, unit: null}];

    } else {
        magUnitObjArr = magUnitObjArr.magnitude.map(function (magVal, i) {
            return {magnitude: magVal, unit: magUnitObjArr.unit[i]};
        });
    }
    return magUnitObjArr;
};

thinkehr.f4.AstUnaryQuantityExpression = thinkehr.f4.AstUnaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {
        var lhs = thinkehr.f4.AstBinaryQuantityExpression.toAstQuantObj( this.getLhsOperand().evaluate());
        return this.getOperatorFunc().call(null, lhs);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstUnaryQuantityExpression";
    }
});

thinkehr.f4.AstBinaryCodedTextExpression = thinkehr.f4.AstBinaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {
        var lhs = this.getLhsValuesArr();
        if(!this.getLhsIsMulti()) {
            lhs=thinkehr.f4.AstBinaryCodedTextExpression.toAstCodedObj(lhs);
        }
        var rhs = this.getRhsValuesArr();//this.getRhsOperand().evaluate();

        var lhsVal;
        var rhsVal;
        var collectProp = function (propName) {
            return function (val) {
                return val[propName];
            };
        };
        if (this.operatorDef && (this.operatorDef.op === "equals" || this.operatorDef.op === "notequals")) {
            if(!this.getLhsIsMulti()) {
                lhsVal = lhs.map(collectProp('code'));
                rhsVal = rhs.map(collectProp('code'));
            }else{
                lhsVal = lhs[0] && lhs[0].code ? lhs[0].code:lhs.code;
                rhsVal = rhs.map(collectProp('code'));
            }
        } else {
            if(!this.getLhsIsMulti()) {
                lhsVal = lhs.map(collectProp('value'));
                rhsVal = rhs.map(collectProp('value'));
            }else{
                lhsVal = lhs[0] && lhs[0].value ? lhs[0].value:lhs.value;
                rhsVal = rhs.map(collectProp('value'));
            }
        }
        if(!lhsVal || !lhsVal.length) {
            lhsVal = [null];
        }

        return this.getOperatorFunc().call(null, lhsVal, rhsVal);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstBinaryCodedTextExpression";
    }
});

thinkehr.f4.AstBinaryCodedTextExpression.toAstCodedObj = function (codeValModelArr) {
    if(!codeValModelArr) {
        codeValModelArr = [];
    }
    if ( !codeValModelArr.length) {
        codeValModelArr.push({code: null, value: null});
    } else {
        codeValModelArr = codeValModelArr.map(function (val) {
            return {code: val['code'] || val['|code'], value: val['value'] || val['|value']};
        });
    }
    return codeValModelArr;
};

thinkehr.f4.AstUnaryCodedTextExpression = thinkehr.f4.AstUnaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {
        var lhs = this.getLhsValuesArr();
        if(!this.getLhsIsMulti()) {
            lhs=thinkehr.f4.AstBinaryCodedTextExpression.toAstCodedObj(lhs);
            var lhsVals = lhs.map(function (lhs) {
                var lhsVal;
                if (lhs.code) {
                    lhsVal = lhs.code;
                } else {
                    lhsVal = lhs.value ? lhs.value : null;
                }
                return lhsVal;
            });
        }else{
            lhsVals = lhs[0] && lhs[0].code ? lhs[0].code:lhs.code;
        }
        if(!lhsVals || !lhsVals.length) {
            lhsVals = [null];
        }
        return this.getOperatorFunc().call(null, lhsVals);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstUnaryCodedTextExpression";
    }
});

thinkehr.f4.AstBinaryProportionExpression = thinkehr.f4.AstBinaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {

        var rhs = this.getRhsValuesArr();
        if (!rhs
            || !rhs.length
            || !rhs.filter(function(rhsItem){
                return thinkehr.f4.util.isNumber(rhsItem.numerator) && thinkehr.f4.util.isNumber(rhsItem.denominator);
                }).length) {
            return false;
        }

        var lhs =  this.getLhsOperand().evaluate();

        if (!lhs
            || !lhs.numerator.length
            || !lhs.numerator.filter(function(numVal){
                return thinkehr.f4.util.isNumber(numVal);
            }).length ) {
            return false;
        }

        var lhsVals = lhs.numerator.map(function(numVal, i){
            return numVal / lhs.denominator[i];
        });
        //var lhsVal = lhs.numerator / lhs.denominator;
        var rhsVals = rhs.map(function (rhsPropObj) {
            return rhsPropObj.numerator / rhsPropObj.denominator;
        });

        return this.getOperatorFunc().call(null, lhsVals, rhsVals);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstBinaryProportionExpression";
    }
});

thinkehr.f4.AstUnaryProportionExpression = thinkehr.f4.AstUnaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {

        var lhs = this.getLhsOperand().evaluate();

        var lhsVals = lhs.numerator.map(function(numVal, i){
            var denVal = lhs.denominator[i];
            if(thinkehr.f4.util.isNumber(numVal) && thinkehr.f4.util.isNumber(denVal) ){
                var calc = numVal / denVal;
                return isNaN(calc) ? null:calc;
            }
            return null;
        });
        if(!lhsVals.length) {
            lhsVals = [null];
        }

        return this.getOperatorFunc().call(null, lhsVals);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstUnaryProportionExpression";
    }
});

thinkehr.f4.AstBinaryDateExpression = thinkehr.f4.AstBinaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    _valuesToUTCTimestamp: function (stringValsArr) {
        var currDate;
        return stringValsArr.map(function (currVal) {
            if (!thinkehr.f4.util.isDate(currVal)) {
                /*currDate = thinkehr.f4.util.toDate(currVal);
                if(!thinkehr.f4.util.isDate(currDate)) {
                    currDate = thinkehr.f4.util.toTime(currVal);
                }
                if(!thinkehr.f4.util.isDate(currDate)) {
                    return null;
                }else if(!thinkehr.f4.util.isDate(currDate)){
                    currDate = new Date(currDate);
                }*/
                currDate = new Date(thinkehr.f4.util.toLocalTimezoneOffsetISOString(currVal));
                if(!thinkehr.f4.util.isDate(currDate)) {
                    currDate = thinkehr.f4.util.toTime(currVal);
                }
            }else{
                currDate = currVal;
            }
            //return thinkehr.f4.util.toUtcDate(currDate).getTime();
            //return thinkehr.f4.util.toDateApplyTzDiff(currDate).getTime();
            return currDate ? currDate.getTime() : null;
        });
    },

    getRhsValuesArr:function(){
        var stringVals=this._super();
        //console.log("LHS ARR=",this._valuesToUTCTimestamp(stringVals).map(function(it){return (new Date(it).toUTCString())}));
        //return this._valuesToUTCTimestamp(stringVals);
        return stringVals.map(function (d) {
            return d.getTime();
        });
    },

    getLhsValuesArr:function(){
        var stringVals=this._super();
        //console.log("LHS ARR=",this._valuesToUTCTimestamp(stringVals).map(function(it){return (new Date(it).toUTCString())}));
        return this._valuesToUTCTimestamp(stringVals);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstBinaryDateExpression";
    }
});

thinkehr.f4.AstBinaryDurationExpression = thinkehr.f4.AstBinaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {

        var rhsVal = this.getRhsValuesArr();

        var lhs = this.getLhsValuesArr();
        var lhsVals = lhs.map(function (durVal) {
            return nezasaEhr.iso8601.Period.parseToTotalSeconds(durVal);
        });

        if(!lhsVals.length){
            lhsVals.push(null);
        }
        return this.getOperatorFunc().call(null, lhsVals, rhsVal);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstBinaryDurationExpression";
    }
});

thinkehr.f4.AstUnaryDurationExpression = thinkehr.f4.AstUnaryExpression._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    evaluate: function () {

        var lhs = this.getLhsValuesArr();
        var lhsVals = lhs.map(function (durVal) {
            var toSecs = nezasaEhr.iso8601.Period.parseToTotalSeconds(durVal);
            return toSecs<1 ? null:toSecs;
        });
        if(!lhsVals.length){
            lhsVals.push(null);
        }

        return this.getOperatorFunc().call(null, lhsVals);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstUnaryDurationExpression";
    }
});

//noinspection JSUnusedLocalSymbols
thinkehr.f4.AstLiteral = thinkehr.f4.AstExpression._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.value === undefined) {
            this.value = null;
        }
    },

    getValue: function () {
        return this.value;
    },

    setValue: function (value) {
        this.value = value;
    },

    /*
     * @Override
     */
    evaluate: function () {
        return this.getValue();
    },

    /*
     * @Override
     */
    next: function (val) {
        return null;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstLiteral";
    }
});

thinkehr.f4.AstNumericLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstNumericLiteral";
    }
});

thinkehr.f4.AstStringLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstStringLiteral";
    }
});

thinkehr.f4.AstDateLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);

        this.setValue(thinkehr.f4.util.toDate(this.getValue()));
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstDateLiteral";
    }
});

thinkehr.f4.AstTimeLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);

        this.setValue(thinkehr.f4.util.toTime(this.getValue()));
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstTimeLiteral";
    }
});

thinkehr.f4.AstDateTimeLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);
        this.setValue(new Date(thinkehr.f4.util.toLocalTimezoneOffsetISOString(this.getValue())));
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstDateTimeLiteral";
    }
});

thinkehr.f4.AstQuantityLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.magnitudeLiteral === undefined) {
            this.magnitudeLiteral = null;
        }

        if (this.unitLiteral === undefined) {
            this.unitLiteral = null;
        }
    },

    /*
     * @Override
     */
    getValue: function () {
        return {
            magnitude: this.getMagnitudeLiteral().evaluate(),
            unit: this.getUnitLiteral().evaluate()
        };
    },

    getMagnitudeLiteral: function () {
        return this.magnitudeLiteral;
    },

    setMagnitudeLiteral: function (magnitudeLiteral) {
        this.magnitudeLiteral = magnitudeLiteral;
    },

    getUnitLiteral: function () {
        return this.unitLiteral;
    },

    setUnitLiteral: function (unitLiteral) {
        this.unitLiteral = unitLiteral;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstQuantityLiteral";
    }
});

thinkehr.f4.AstCodedTextLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.codeLiteral === undefined) {
            this.codeLiteral = null;
        }

        if (this.valueLiteral === undefined) {
            this.valueLiteral = null;
        }
    },

    /*
     * @Override
     */
    getValue: function () {
        return {
            code: this.getCodeLiteral().evaluate(),
            value: this.getValueLiteral().evaluate()
        };
    },

    getCodeLiteral: function () {
        return this.codeLiteral;
    },

    setCodeLiteral: function (codeLiteral) {
        this.codeLiteral = codeLiteral;
    },

    getValueLiteral: function () {
        return this.valueLiteral;
    },

    setValueLiteral: function (valueLiteral) {
        this.valueLiteral = valueLiteral;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstCodedTextLiteral";
    }
});

thinkehr.f4.AstProportionLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.numeratorLiteral === undefined) {
            this.numeratorLiteral = null;
        }

        if (this.denominatorLiteral === undefined) {
            this.denominatorLiteral = null;
        }
    },

    /*
     * @Override
     */
    getValue: function () {
        return {
            numerator: this.getNumeratorLiteral().evaluate(),
            denominator: this.getDenominatorLiteral().evaluate()
        };
    },

    getNumeratorLiteral: function () {
        return this.numeratorLiteral;
    },

    setNumeratorLiteral: function (numeratorLiteral) {
        this.numeratorLiteral = numeratorLiteral;
    },

    getDenominatorLiteral: function () {
        return this.denominatorLiteral;
    },

    setDenominatorLiteral: function (denominatorLiteral) {
        this.denominatorLiteral = denominatorLiteral;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstProportionLiteral";
    }
});

thinkehr.f4.AstDurationLiteral = thinkehr.f4.AstLiteral._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.totalSecondsLiteral === undefined) {
            var val = 0;
            if (this.value) {
                var multiplicators = {
                    "year": 31104000,
                    "month": 2592000,
                    "week": 604800,
                    "day": 86400,
                    "hour": 3600,
                    "minute": 60,
                    "second": 1
                };

                Object.keys(this.value).forEach(function (key) {
                    var units = parseInt(this.value[key]);
                    if (!thinkehr.f4.util.isInteger(units)) {
                        units = 0;
                    }
                    var unitDuration = multiplicators[key] || 0;

                    val += units * unitDuration;

                }.bind(this));
            }
            this.totalSecondsLiteral = new thinkehr.f4.AstNumericLiteral({value: val});
        }
    },

    /*
     * @Override
     */
    getValue: function () {
        return this.totalSecondsLiteral.evaluate();
    },

    getTotalSecondsLiteral: function () {
        return this.totalSecondsLiteral;
    },

    setTotalSecondsLiteral: function (totalSecondsLiteral) {
        this.totalSecondsLiteral = totalSecondsLiteral;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstDurationLiteral";
    }
});

/*
 * For override only
 */
thinkehr.f4.AstStatement = thinkehr.f4.AstNode._extendM({

    init: function (properties) {
        this._super(properties);
    },


    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstStatement";
    }
});

thinkehr.f4.AstNoopStatement = thinkehr.f4.AstStatement._extendM({

    init: function (properties) {
        this._super(properties);
    },

    /*
     * @Override
     */
    process: function (context) {
        // Do nothing
    },

    /*
     * @Override
     */
    evaluate: function (context) {
        // Do nothing
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstNoopStatement";
    }
});

thinkehr.f4.AstActionsStatement = thinkehr.f4.AstCollectionNode._extendM({

    init: function (properties) {
        this._super(properties);
    },

    actions: function (action) {
        return this.elements(action);
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstActionsStatement";
    }
});

thinkehr.f4.AstActionStatement = thinkehr.f4.AstStatement._extendM({

    init: function (properties) {
        this._super(properties);

        if (this.name === undefined) {
            this.name = null;
        }

        if (this.targets === undefined) {
            this.targets = [];
        }

        if (this.actionFunc === undefined) {
            this.actionFunc = function () {
            };
        }
    },

    getName: function () {
        return this.name;
    },

    setName: function (name) {
        this.name = name;
    },

    getTargets: function () {
        return this.targets;
    },

    addTarget: function (target) {
        this.targets.push(target);
    },

    getActionFunc: function () {
        return this.actionFunc;
    },

    setActionFunc: function (actionFunc) {
        this.actionFunc = actionFunc;
    },

    /*
     * @Override
     */
    evaluate: function () {
        var ta = this.getTargets();
        var res = [];
        ta.forEach(function (target) {
            var fr = this.getActionFunc().call(null, target);
            if (fr !== undefined) {
                res.push(fr);
            }
        }.bind(this));

        return res;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstActionStatement";
    }
});

thinkehr.f4.AstShowAction = thinkehr.f4.AstActionStatement._extendM({

    init: function (properties) {
        this._super(properties);
        this.setName("show");
        this.setActionFunc(function(target) {
            if (target.getViewConfig().isHidden()) {
                target.getViewConfig().setHidden(false);
            }
        });
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstShowAction";
    }
});

thinkehr.f4.AstHideAction = thinkehr.f4.AstActionStatement._extendM({

    init: function (properties) {
        this._super(properties);
        this.setName("hide");
        this.setActionFunc(function(target) {
            if (!target.getViewConfig().isHidden()) {
                target.getViewConfig().setHidden(true);
            }
        });
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstHideAction";
    }

});

thinkehr.f4.AstEnableAction = thinkehr.f4.AstActionStatement._extendM({

    init: function (properties) {
        this._super(properties);
        this.setName("enable");
        this.setActionFunc(function (target) {
            if (target.getViewConfig().isReadOnly()) {
                target.getViewConfig().setReadOnly(false);
            }
        });
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstEnableAction";
    }
});

thinkehr.f4.AstDisableAction = thinkehr.f4.AstActionStatement._extendM({

    init: function (properties) {
        this._super(properties);
        this.setName("disable");
        this.setActionFunc(function (target) {
            if (!target.getViewConfig().isReadOnly()) {
                target.getViewConfig().setReadOnly(true);
            }
        });
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstEnableAction";
    }
});

thinkehr.f4.AstSetAction = thinkehr.f4.AstActionStatement._extendM({

    init: function (properties) {
        this._super(properties);
        this.setName("set");
        this.setActionFunc(function (target) {
            target.applyValue(properties.rawDesc.value);
        });
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstSetAction";
    }
});

thinkehr.f4.AstClearAction = thinkehr.f4.AstActionStatement._extendM({

    init: function (properties) {
        this._super(properties);
        this.setName("clear");

        this.setActionFunc(function (target) {
                target.clearValue(null);
        });
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstClearAction";
    }
});

thinkehr.f4.AstResetAction = thinkehr.f4.AstActionStatement._extendM({

    init: function (properties) {
        this._super(properties);
        this.setName("reset");

        this.setActionFunc(function (target) {
                target.resetValue();
        });
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.AstResetAction";
    }
});

thinkehr.f4.Visitor = thinkehr.f4.Object._extendM({

    init: function(properties) {
        this._super(properties);
        if (this.context === undefined || this.context === null) {
            this.context = {};
        }
    },

    getContext: function() {
        return this.context;
    },

    /*
     * For override
     */
    visit: function(model) {

    },

    /*
     * For override
     */
    afterVisit: function(model) {

    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.Visitor";
    }
});

thinkehr.f4.StackContext = thinkehr.f4.Object._extendM({

    init: function(properties) {
        this._super(properties);
        if (!thinkehr.f4.util.isArray(this._ctxStack)) {
            this._ctxStack = [];
        }

    },

    _peek: function() {
        return this._ctxStack.length > 0 ? this._ctxStack[0] : undefined;
    },

    push: function(node, value) {
        var stackObj = {
            node: node,
            value: value
        };

        return this._ctxStack.unshift(stackObj);
    },

    pop: function() {
        var popped = this._ctxStack.shift();
        if (popped !== undefined) {
            return popped.value;
        }

        return undefined;
    },

    popConditionally: function(node) {
        var top = this._peek();
        if (top && node === top.node) {
            return this._ctxStack.shift().value;
        }

        return undefined;
    },

    get: function(prop) {

        for (var i = 0; i < this._ctxStack.length; i++) {
            var ctxVal = this._ctxStack[i].value;

            if (ctxVal.hasOwnProperty(prop)) {
                return ctxVal[prop];
            }
        }

        return undefined;
    },

    /*
     * @Override
     */
    toString: function () {
        return "thinkehr.f4.StackContext";
    }
});

thinkehr.f4.VCTX_ISM_CURRENT_STATE = "vctxIsmCurrentState";

thinkehr.f4.IsmTransitionVisitor = thinkehr.f4.Visitor._extendM({
    init: function(properties) {
        this._super(properties);
        this.context = new thinkehr.f4.StackContext();
    },

    /*
     * @Override
     */
    visit: function(model) {
        var csVal = model.annotationValue(thinkehr.f4.VCTX_ISM_CURRENT_STATE);
        if (thinkehr.f4.util.isString(csVal)) {
            this.getContext().push(model, { "ismCurrentState": csVal  });
        }

        if (model.getRmType() === thinkehr.f4.RmType.ISM_TRANSITION) {
            var ismState = this.getContext().get("ismCurrentState");


            if (thinkehr.f4.util.isValueNonEmpty(ismState)) {
                var stateToSet = ismState;
                var parent = model.getParentModel();

                var containsValue;
                var needToVisitSubModels;
                var actionPath;
                if (parent.getRmType() === thinkehr.f4.RmType.ACTION) {
                    containsValue = parent.containsValue();
                    needToVisitSubModels = containsValue !== true;
                    actionPath = parent.getPath();
                } else {
                    actionPath = this.findActionPath(model);
                    needToVisitSubModels = true;
                    containsValue = false;
                }

                if (needToVisitSubModels) {
                    var itemVisitor = new thinkehr.f4.ActionIsmItemVisitor({
                        context: {
                            path: actionPath,
                            exemptions: [actionPath + "/ism_transition"]
                        }
                    });

                    containsValue = model.getRootModel().accept(itemVisitor);

                }

                if (!containsValue) {
                    stateToSet = null;
                }

                var csFormId = model.getPath() + "/current_state";
                var csModel = model.findChildWithPath(csFormId);
                if (csModel) {
                    csModel.codeValue(stateToSet);
                } else {
                    console.warn("ISM_TRANSITION child current_state not found");
                }

            }
        }

        return false;
    },

    /*
     * @Override
     */
    afterVisit: function(model) {
        this.getContext().popConditionally(model);
    },

    findActionPath: function(ismTransitionModel) {
        var segments = ismTransitionModel.getPath().split("/");
        var len = segments.length;

        if (segments[len - 1] === "ism_transition") {
            var actionPath = "";
            for (var i = 0; i < segments.length - 1; i++) {
                if (i > 0) {
                    actionPath += "/";
                }
                actionPath += segments[i];
            }

            return actionPath;
        }

        return null;
    }
});

thinkehr.f4.ActionIsmItemVisitor = thinkehr.f4.Visitor._extendM({
    init: function (properties) {
        this._super(properties);
        if (!thinkehr.f4.util.isArray(this.context.exemptions)) {
            this.context.exemptions = [];
        }
    },

    visit: function(model) {
        var c = this.getContext();
        var modelPath = model.getPath();
        if (modelPath.indexOf(c.path) === 0) {

            for (var i = 0; i < c.exemptions.length; i++) {
                var exemption = c.exemptions[i];
                if (modelPath.indexOf(exemption) === 0) {
                    return false;
                }
            }

            var cv = model.containsValue();
            if (cv === true) {
                this.getContext().model = model;
            }

            return cv;
        }

        return false;
    }
});


/* Concatenated */
if (!thinkehr.f4.dict) {
    thinkehr.f4.dict = {

        translations: {},

        tr: function (key, language) {
            var defDictStr = "default";
            if(!language){
                language = defDictStr;
            }
            var langObj = thinkehr.f4.dict.translations[language];
            if (!langObj || !langObj[key]) {
                langObj = thinkehr.f4.dict.translations[defDictStr];
            }

            return langObj && langObj[key] ? langObj[key] : null;
        },

        msg: function (key, language, supplantArgs) {
            var text = this.tr(key, language);

            if (!text) {
                return text;
            }

            return text.replace(/{([^{}]*)}/g,
                function (a, b) {
                    var r = supplantArgs[b];
                    return typeof r === 'string' || typeof r === 'number' ? r : a;
                }
            );
        }
    };
}
/* Concatenated */
thinkehr.f4.dict.translations.default = {
    "duration.year": "Years",
    "duration.year.ph": "yr",
    "duration.month": "Months",
    "duration.month.ph": "mo",
    "duration.week": "Weeks",
    "duration.week.ph": "w",
    "duration.day": "Days",
    "duration.day.ph": "day",
    "duration.hour": "Hours",
    "duration.hour.ph": "hr",
    "duration.minute": "Minutes",
    "duration.minute.ph": "min",
    "duration.second": "Seconds",
    "duration.second.ph": "sec",

    "other": "Other",
    "loading": "Loading",
    "notFound": "Not found",
    "tabRendering":" Rendering in progress ...",

    "validation.required": "Required field",
    "validation.min": "Min. value {minOp} {min}",
    "validation.min.duration": "{field} min val. {minOp} {min}",
    "validation.max": "Max. value {maxOp} {max}",
    "validation.max.duration": "{field} max val. {maxOp} {max}",
    "validation.numberOfSelectionsInvalid": "Number of options between {numberOfSelectionsMin} and {numberOfSelectionsMax}",
    "validation.pattern": "Example: {patternValidExample}",
    "validation.terminologyCodeNotFound": "Terminology code {codeValue} is not valid.",
    "validation.dateOptional.closeSelection": "skip optional selection",
    "validation.dateOptional.requiredSelection": "required selection",
    "validation.dateInvalidPattern": "Date pattern not valid: {datePattern}",
    "validation.minItemsRequired": "Minimum {requiredDeltaNr} item(s) required.",
    "validation.minItemsRequiredAddPlaceholder": "selection required",
    "validation.maxItemsLimitText": "Maximum number of items selected.",

    "model.notFound.byTag": "Model not found by '{queryStr}' tag.",
    "model.notFound.byPath": "Model not found by '{queryStr}' path.",

    "placeholder.terminology": "Type and select."
};
/* Concatenated */
thinkehr.f4.dict.translations.sl = {
    "duration.year": "leta",
    "duration.year.ph": "let",
    "duration.month": "mes.",
    "duration.month.ph": "mes",
    "duration.week": "ted.",
    "duration.week.ph": "ted",
    "duration.day": "dn.",
    "duration.day.ph": "dn",
    "duration.hour": "ure",
    "duration.hour.ph": "ure",
    "duration.minute": "min",
    "duration.minute.ph": "min",
    "duration.second": "sek.",
    "duration.second.ph": "sek",
    "other": "Drugo",
    "loading": "Prenašam",
    "notFound": "Ne obstaja",
    "tabRendering":"Prikazovanje v teku ...",

    "validation.required": "Obvezno polje",
    "validation.min": "Najm. vred. {minOp} {min}",
    "validation.min.duration": "{field} {minOp} {min}",
    "validation.max": "Najv. vred. {maxOp} {max}",
    "validation.max.duration": "{field} {maxOp} {max}",
    "validation.numberOfSelectionsInvalid": "Izberite med {numberOfSelectionsMin} in {numberOfSelectionsMax} možnosti.",
    "validation.pattern": "Vzorec: {patternValidExample}",
    "validation.terminologyCodeNotFound": "Neveljavna koda terminologije {codeValue}.",
    "validation.dateOptional.closeSelection": "zapri poljubno izbiro",
    "validation.dateOptional.requiredSelection": "zahtevana izbira",
    "validation.dateInvalidPattern": "Datum neveljaven: {datePattern}",
    "validation.minItemsRequired": "Izberi še {requiredDeltaNr}.",
    "validation.minItemsRequiredAddPlaceholder": "zahtevana izbira",
    "validation.maxItemsLimitText": "Doseženo število izbranih elementov.",
    
    "model.notFound.byTag": "Model z oznako \'{queryStr}\' ne obstaja.",
    "model.notFound.byPath": "Model s potjo \'{queryStr}\' ne obstaja.",

    "placeholder.terminology": "Iskanje po terminologiji."
};
/* Concatenated */
angular.module('ehr-forms4-templates', ['thinkehr/f4/templates/ehr-boolean.html', 'thinkehr/f4/templates/ehr-coded-text-checkboxes.html', 'thinkehr/f4/templates/ehr-coded-text-combo_deprecated.html', 'thinkehr/f4/templates/ehr-coded-text-component.html', 'thinkehr/f4/templates/ehr-coded-text-radio.html', 'thinkehr/f4/templates/ehr-coded-text.html', 'thinkehr/f4/templates/ehr-component-element-switch.html', 'thinkehr/f4/templates/ehr-count.html', 'thinkehr/f4/templates/ehr-custom.html', 'thinkehr/f4/templates/ehr-date-time.html', 'thinkehr/f4/templates/ehr-date.html', 'thinkehr/f4/templates/ehr-duration-validation-field.html', 'thinkehr/f4/templates/ehr-duration-validation-required.html', 'thinkehr/f4/templates/ehr-duration.html', 'thinkehr/f4/templates/ehr-ehr-uri-text-area.html', 'thinkehr/f4/templates/ehr-ehr-uri-text-field.html', 'thinkehr/f4/templates/ehr-ehr-uri.html', 'thinkehr/f4/templates/ehr-form.html', 'thinkehr/f4/templates/ehr-free-layout-component.html', 'thinkehr/f4/templates/ehr-label.html', 'thinkehr/f4/templates/ehr-multimedia-field.html', 'thinkehr/f4/templates/ehr-multimedia.html', 'thinkehr/f4/templates/ehr-other-input.html', 'thinkehr/f4/templates/ehr-proportion.html', 'thinkehr/f4/templates/ehr-quantity.html', 'thinkehr/f4/templates/ehr-single-field-multi-controls.html', 'thinkehr/f4/templates/ehr-tab-container-title.html', 'thinkehr/f4/templates/ehr-text-area.html', 'thinkehr/f4/templates/ehr-text-field.html', 'thinkehr/f4/templates/ehr-text-values-combo.html', 'thinkehr/f4/templates/ehr-text-values-radio.html', 'thinkehr/f4/templates/ehr-text.html', 'thinkehr/f4/templates/ehr-time.html', 'thinkehr/f4/templates/ehr-unknown.html', 'thinkehr/f4/templates/ehr-uri-text-area.html', 'thinkehr/f4/templates/ehr-uri-text-field.html', 'thinkehr/f4/templates/ehr-uri.html', 'thinkehr/f4/templates/ehr-validation-msg.html']);

angular.module("thinkehr/f4/templates/ehr-boolean.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-boolean.html",
    "<div\n" +
    "        class=\"ehr-boolean ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"EhrLayoutHelper.computeEhrLineClass(model)\">\n" +
    "\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div class=\"ehr-relative\">\n" +
    "                <input\n" +
    "                        type=\"checkbox\"\n" +
    "                        name=\"{{::booleanName()}}\"\n" +
    "                        id=\"{{::booleanName()}}_id\"\n" +
    "                        class=\"ehr-checkbox k-checkbox\"\n" +
    "                        ng-model=\"booleanValue\"\n" +
    "                        ng-model-options=\"{ getterSetter: true }\"\n" +
    "                        ng-disabled=\"twoStateReadOnly()\"\n" +
    "                        ng-class=\"computeFieldClass()\"\n" +
    "                        ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                        ng-if=\"!model.isThreeState()\"\n" +
    "                        >\n" +
    "                <label class=\"k-checkbox-label\" ng-if=\"!model.isThreeState()\" for=\"{{::booleanName()}}_id\"></label>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"ehr-radio-button-group\" ng-if=\"model.isThreeState()\" ng-hide=\"model.getViewConfig().isHidden() || (trueReadOnly() && hideReadOnlyInputs) ||  ( isViewMode() && booleanValue()!==true )\">\n" +
    "            <div class=\"ehr-radio-button-column ehr-boolean-three-state-true-column\"\n" +
    "                 ng-style=\"columnStyle()\"\n" +
    "                 ng-class=\"computeFieldClass()\"\n" +
    "                    >\n" +
    "                <label class=\"ehr-radio-label last-in-column\">\n" +
    "                    <input\n" +
    "                            type=\"radio\"\n" +
    "                            class=\"ehr-radio ehr-boolean-three-state ehr-boolean-true k-radio\"\n" +
    "                            name=\"ehr-rb-group-{{::booleanName()}}\"\n" +
    "                            id=\"{{::booleanName()}}_true_id\"\n" +
    "                            ng-disabled=\"trueReadOnly()\"\n" +
    "                            ng-model=\"booleanValue\"\n" +
    "                            ng-model-options=\"{ getterSetter: true }\"\n" +
    "                            ng-value=\"true\"\n" +
    "                            >\n" +
    "                    <label ng-class=\"{'k-radio-label':!(isViewMode && isViewMode())}\" for=\"{{::booleanName()}}_true_id\"><span class=\"k-icon k-i-tick\"></span></label>\n" +
    "\n" +
    "                </label>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"ehr-radio-button-group\" ng-if=\"model.isThreeState()\" ng-hide=\"model.getViewConfig().isHidden() || (falseReadOnly() && hideReadOnlyInputs) ||  ( isViewMode() && booleanValue()!==false )\">\n" +
    "            <div class=\"ehr-radio-button-column ehr-boolean-three-state-false-column\"\n" +
    "                 ng-style=\"columnStyle()\"\n" +
    "                 ng-class=\"computeFieldClass()\"\n" +
    "                    >\n" +
    "                <label class=\"ehr-radio-label last-in-column\">\n" +
    "                    <input\n" +
    "                            type=\"radio\"\n" +
    "                            class=\"ehr-radio ehr-boolean-three-state ehr-boolean-false k-radio\"\n" +
    "                            name=\"ehr-rb-group-{{::booleanName()}}\"\n" +
    "                            id=\"{{::booleanName()}}_false_id\"\n" +
    "                            ng-disabled=\"falseReadOnly()\"\n" +
    "                            ng-model=\"booleanValue\"\n" +
    "                            ng-model-options=\"{ getterSetter: true }\"\n" +
    "                            ng-value=\"false\"\n" +
    "                            >\n" +
    "                    <label ng-class=\"{'k-radio-label':!(isViewMode && isViewMode())}\" for=\"{{::booleanName()}}_false_id\"><span class=\"k-icon k-i-close\"></span></label>\n" +
    "                </label>\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"ehr-radio-button-group\" ng-if=\"model.isThreeState()\" ng-hide=\"model.getViewConfig().isHidden() || (nullReadOnly() && hideReadOnlyInputs) ||  ( isViewMode() && booleanValue()!==null )\">\n" +
    "            <div class=\"ehr-radio-button-column ehr-boolean-three-state-null-column\"\n" +
    "                 ng-style=\"columnStyle()\"\n" +
    "                 ng-class=\"computeFieldClass()\"\n" +
    "                    >\n" +
    "                <label class=\"ehr-radio-label last-in-column\">\n" +
    "                    <input\n" +
    "                            type=\"radio\"\n" +
    "                            class=\"ehr-radio ehr-boolean-three-state ehr-boolean-null k-radio\"\n" +
    "                            name=\"ehr-rb-group-{{::booleanName()}}\"\n" +
    "                            id=\"{{::booleanName()}}_null_id\"\n" +
    "                            ng-disabled=\"nullReadOnly() || (isViewMode && isViewMode())\"\n" +
    "                            ng-model=\"booleanValue\"\n" +
    "                            ng-model-options=\"{ getterSetter: true }\"\n" +
    "                            ng-value=\"null\"\n" +
    "                            >\n" +
    "                    <label ng-class=\"{'k-radio-label':!(isViewMode && isViewMode())}\" for=\"{{::booleanName()}}_null_id\"><span class=\"k-icon k-i-cancel\"></span></label>\n" +
    "                </label>\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-coded-text-checkboxes.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-coded-text-checkboxes.html",
    "<div ng-form=\"{{::codedTextFormGroupName()}}\" class=\"ehr-checkbox-group\" ng-hide=\"model.getViewConfig().isHidden()\" ehr-coded-text-checkboxes-min-max-validator>\n" +
    "\n" +
    "    <div class=\"ehr-checkbox-column\"\n" +
    "         ng-repeat=\"col in columns\"\n" +
    "         ng-style=\"::elementStyle()\"\n" +
    "         ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "         ng-hide=\"(isViewMode && isViewMode()) && !anySelectedInColumn(col)\"\n" +
    "            >\n" +
    "\n" +
    "        <label class=\"ehr-checkbox-label\" ng-repeat=\"itemIndex in col\" ng-class=\"::EhrLayoutHelper.computeLastColumnClass($last, listOpen())\">\n" +
    "            <input\n" +
    "                    type=\"checkbox\"\n" +
    "                    name=\"{{::multiCodedTextNameFor(itemIndex)}}\"\n" +
    "                    id=\"{{::multiCodedTextIdFor(itemIndex)}}\"\n" +
    "                    class=\"ehr-checkbox k-checkbox hide-in-ehr-view-mode\"\n" +
    "                    ng-model=\"multiValues[list()[itemIndex].getValue()].checked\"\n" +
    "                    ng-disabled=\"model.getViewConfig().isReadOnly() || (isViewMode && isViewMode())\"\n" +
    "                    ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                    ng-true-value=\"true\"\n" +
    "                    ng-false-value=\"false\"\n" +
    "                    ng-change=\"valueToggled(list()[itemIndex].getValue())\"\n" +
    "                    ng-click=\"cbClicked()\"\n" +
    "                    ng-blur=\"cbBlurred()\"\n" +
    "                    >\n" +
    "\n" +
    "            <label ng-class=\"{'k-checkbox-label':!(isViewMode && isViewMode())}\" for=\"{{::multiCodedTextIdFor(itemIndex)}}\" ng-bind=\"::labelText(list()[itemIndex])\"\n" +
    "                   ng-hide=\"(isViewMode && isViewMode() && (!multiValues[list()[itemIndex].getValue()].checked))\"></label>\n" +
    "        </label>\n" +
    "    </div>\n" +
    "\n" +
    "    <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "\n" +
    "    <ehr-other-input ng-if=\"::listOpen()\" class=\"ehr-other-include\"></ehr-other-input>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-coded-text-combo_deprecated.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-coded-text-combo_deprecated.html",
    "<!--<select kendo-combo-box class=\"ehr-combo\" ng-model=\"codeValue\" ng-model-options=\"{ getterSetter: true }\"-->\n" +
    "<!--ng-options=\"item.getValue() as item.getLabel() for item in model.getInputFor('code').getList()\">-->\n" +
    "<!--<option value=\"\">&nbsp;</option>-->\n" +
    "<!--</select>-->\n" +
    "\n" +
    "<select\n" +
    "        kendo-combo-box=\"{{::kendoName()}}\"\n" +
    "        name=\"{{::codedTextName()}}\"\n" +
    "        class=\"ehr-combo\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "        ng-model=\"codeValue\"\n" +
    "        ng-model-options=\"{ getterSetter: true }\"\n" +
    "        k-filter=\"'contains'\"\n" +
    "        k-change=\"codeChanged\"\n" +
    "        ng-required=\"::model.isRequired()\"\n" +
    "        >\n" +
    "    <option value=\"\"></option>\n" +
    "        <option ng-repeat=\"item in ::list()\" value=\"{{::item.getValue()}}\" ng-bind=\"::labelText(item)\"></option>\n" +
    "    <option value=\"__other__\" ng-if=\"::listOpen()\">{{::EhrDictionary.text('other')}}&nbsp;&gt;&gt;</option>\n" +
    "</select>\n" +
    "list={{list().length}}\n" +
    "cv={{codeValue()}}\n" +
    "\n" +
    "<input\n" +
    "        ng-if=\"::listOpen()\"\n" +
    "        name=\"{{::otherFieldName()}}\"\n" +
    "        type=\"text\"\n" +
    "        class=\"ehr-text-input field other k-textbox\"\n" +
    "        ng-model=\"otherValue\"\n" +
    "        ng-model-options=\"{ getterSetter: true, debounce: 100 }\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"model.getViewConfig().isHidden() || !otherSelected()\"\n" +
    "        ng-required=\"otherRequired()\"\n" +
    "        >\n" +
    "<ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "<span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-coded-text-component.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-coded-text-component.html",
    "<!--<select kendo-combo-box class=\"ehr-combo\" ng-model=\"codeValue\" ng-model-options=\"{ getterSetter: true }\"-->\n" +
    "<!--ng-options=\"item.getValue() as item.getLabel() for item in model.getInputFor('code').getList()\">-->\n" +
    "<!--<option value=\"\">&nbsp;</option>-->\n" +
    "<!--</select>-->\n" +
    "<div ng-if=\"isMulti() && (multiValuesArr.length || minMultiNrDelta(true).length)\" class=\"k-multiselect-wrap k-floatwrap selected-multi-items-holder hide-in-ehr-view-mode\" unselectable=\"on\">\n" +
    "    <ul role=\"listbox\" unselectable=\"on\" class=\"k-reset\">\n" +
    "        <li ng-repeat=\"codeVal in multiValuesArr\" class=\"k-button selected-multi-item\" unselectable=\"on\" ng-class=\"{'item-status-not-found':codeVal.status==inputItemStatus.notFound, 'item-status-loading':codeVal.status==inputItemStatus.loading}\"><span ng-show=\"codeVal.status==inputItemStatus.loading\" class=\"k-icon k-loading\"></span> <span unselectable=\"on\" class=\"label\">{{codeVal.label}}</span><span unselectable=\"on\" class=\"k-select\" ng-show=\"!model.getViewConfig().isReadOnly()\"><span unselectable=\"on\" class=\"k-icon k-i-close\" ng-click=\"removeCodeValue(codeVal.value)\">delete</span></span></li>\n" +
    "        <li ng-repeat=\"selectItem in minMultiNrDelta(true) track by $index\" class=\"k-button min-required-item-placeholder\" unselectable=\"on\" ng-click=\"displayFullItemsList()\"><span unselectable=\"on\" class=\"label\">{{EhrDictionary.messageFormat(\"validation.minItemsRequiredAddPlaceholder\", {}, EhrContext.language)}}</span></li>\n" +
    "    </ul>\n" +
    "</div>\n" +
    "<span ng-show=\"addMultiItemEnabled()\" class=\"autocomplete-input-wrap hide-in-ehr-view-mode k-dropdown-wrap k-state-default position-relative\" ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\">\n" +
    "    <span>\n" +
    "        <span ng-class=\"{'no-opacity':!filterEnabled}\" class=\"input-w ehr-coded-text-input-w\">\n" +
    "            <input kendo-auto-complete=\"{{::kendoName()}}\"\n" +
    "                   name=\"{{::codedTextName()}}\"\n" +
    "                   class=\"ehr-autocomplete ehr-text-input field\"\n" +
    "                   ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                   ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                   ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                   k-data-source=\"listDSArray\"\n" +
    "                   ng-required=\"codeValueRequired()\"\n" +
    "                   filter=\"'contains'\"\n" +
    "                   k-filtering=\"onFilter\"\n" +
    "                   k-select=\"'onSelect'\"\n" +
    "                   k-open=\"'onOpen'\"\n" +
    "                   k-close=\"onClose\"\n" +
    "                   k-change=\"onChanged\"\n" +
    "                   k-options=\"::getKendoAutocompleteOptions()\"\n" +
    "                   separator=\"''\"\n" +
    "                   highlight-first=\"false\"\n" +
    "                   min-length=\"0\"\n" +
    "                   data-text-field=\"'label'\"\n" +
    "                   value-primitive=\"true\"\n" +
    "                   ng-blur=\"hasFocus=false;onBlur($event)\"\n" +
    "                   ng-focus=\"hasFocus=true\"\n" +
    "                   ehr-terminology-code-exists-validator=\"\"\n" +
    "                   ehr-coded-text-multi-min-items-validator=\"minValueRequired()\"\n" +
    "                   ng-model=\"_terminologyValidationCodeValue\"\n" +
    "                   ng-model-options=\"{ updateOn: '' }\"\n" +
    "                   ehr-placeholder=\"{{::getInputPlaceholder()}}\"\n" +
    "            >\n" +
    "        </span>\n" +
    "        <span ng-show=\"!filterEnabled\" ng-class=\"{'ng-invalid-background':hasErrorMessage, 'input-background':!hasErrorMessage}\"\n" +
    "              class=\"label-on-input-disabled ehr-autocomplete ehr-text-input field truncate-text k-autocomplete\">\n" +
    "            <span class=\"k-input\">{{inputLabelValue}}</span>\n" +
    "        </span>\n" +
    "\n" +
    "        <span ng-show=\"!filterEnabled\" ng-click=\"model.getViewConfig().isReadOnly()?null:displayFullItemsList()\" class=\"click-overlay ehr-autocomplete ehr-text-input field\"\n" +
    "              ng-class=\"{'cursor-disabled':model.getViewConfig().isReadOnly()}\"></span>\n" +
    "    </span>\n" +
    "\n" +
    "    <span tabindex=\"-1\" unselectable=\"on\" class=\"k-select\" ng-show=\"displayListArrow && !_lastFilterString\" ng-click=\"model.getViewConfig().isReadOnly()?null:displayFullItemsList()\"\n" +
    "            ng-class=\"{'cursor-disabled':model.getViewConfig().isReadOnly()}\">\n" +
    "        <span unselectable=\"on\" class=\"k-icon k-i-arrow-s\" role=\"button\" tabindex=\"-1\">select</span>\n" +
    "    </span>\n" +
    "    <span class=\"k-icon k-loading k-select\" ng-show=\"isTerminologyLoading\"></span>\n" +
    "</span>\n" +
    "\n" +
    "<span class=\"show-in-ehr-view-mode\">\n" +
    "    <span ng-repeat=\"label in toLabelValuesArr()\" class=\"ehr-view-mode-value\">{{label}}</span>\n" +
    "</span>\n" +
    "<span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "<div ng-show=\"!addMultiItemEnabled()\" class=\"hide-in-ehr-view-mode max-items-message\">{{EhrDictionary.messageFormat(\"validation.maxItemsLimitText\", {}, EhrContext.language)}}</div>\n" +
    "<div ng-hide=\"!addMultiItemEnabled() && !otherValue()\" class=\"hide-in-ehr-view-mode list-open-wrap\">\n" +
    "    <span ng-show=\"listOpen() && isMulti()\"> {{getOtherLabel()}}:</span>\n" +
    "    <input\n" +
    "        ng-if=\"listOpen()\"\n" +
    "        name=\"{{::otherFieldName()}}\"\n" +
    "        type=\"text\"\n" +
    "        class=\"ehr-text-input field other k-textbox\"\n" +
    "        ng-model=\"otherValue\"\n" +
    "        ng-model-options=\"{ getterSetter: true, debounce: 100 , allowInvalid:true}\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"model.getViewConfig().isHidden() || (!isMulti() && !otherSelected())\"\n" +
    "        ng-required=\"otherRequired()\"\n" +
    "        ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"\n" +
    "        >\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-coded-text-radio.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-coded-text-radio.html",
    "<div class=\"ehr-radio-button-group\" ng-hide=\"model.getViewConfig().isHidden()\">\n" +
    "    <div class=\"ehr-radio-clear-holder\"\n" +
    "         ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "         ng-hide=\"(!codeValue())||(isViewMode && isViewMode()) || model.getViewConfig().isReadOnly()\"\n" +
    "    >\n" +
    "        <a style=\"cursor: pointer;\" ng-click=\"codeValue(null)\" title=\"clear\"><span class=\"k-icon k-i-cancel\"></span></a>\n" +
    "    </div>\n" +
    "    <div class=\"ehr-radio-button-column\"\n" +
    "         ng-repeat=\"col in columns\"\n" +
    "         ng-style=\"::elementStyle()\"\n" +
    "         ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "         ng-hide=\"(isViewMode && isViewMode()) && !anySelectedInColumn(col)\"\n" +
    "            >\n" +
    "        <label class=\"ehr-radio-label\" ng-repeat=\"itemIndex in col\" ng-class=\"{'last-in-column':$last && !listOpen(),'input-label-on-top':model.hasTag('inputLabelOnTop'), 'hide-label':model.hasTag('inputLabelHide')}\">\n" +
    "            <span ng-if=\"model.hasTag('inputLabelHide') && model.hasTag('inputLabelOnTop')\" style=\"opacity:0; height: 0px; display: block;\">{{labelText(list()[itemIndex])}}</span>\n" +
    "            <input\n" +
    "                    type=\"radio\"\n" +
    "                    class=\"ehr-radio k-radio hide-in-ehr-view-mode\"\n" +
    "                    name=\"ehr_rb_group_{{::codedTextName()}}\"\n" +
    "                    id=\"{{::codedTextName()}}_{{list()[itemIndex].getValue()}}_id\"\n" +
    "                    ng-disabled=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-model=\"codeValue\"\n" +
    "                    ng-model-options=\"{ getterSetter: true }\"\n" +
    "                    ng-value=\"::list()[itemIndex].getValue()\"\n" +
    "                    ng-required=\"radioRequired()\"\n" +
    "                    ng-click=\"rbClicked()\"\n" +
    "                    ng-blur=\"rbBlurred()\"\n" +
    "                    >\n" +
    "            <label ng-class=\"{'k-radio-label':!(isViewMode && isViewMode())}\" for=\"{{::codedTextName()}}_{{list()[itemIndex].getValue()}}_id\"\n" +
    "                   ng-bind=\"::labelText(list()[itemIndex], model.hasTag('inputLabelHide'))\" ng-hide=\"(isViewMode && isViewMode() && (list()[itemIndex].getValue()!=codeValue()))\"></label>\n" +
    "        </label>\n" +
    "    </div>\n" +
    "\n" +
    "    <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "\n" +
    "    <ehr-other-input ng-if=\"::listOpen()\" class=\"ehr-other-include\" ng-hide=\"(isViewMode && isViewMode()) && !otherValue()\"></ehr-other-input>\n" +
    "\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-coded-text.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-coded-text.html",
    "<div\n" +
    "        class=\"ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"computeLineClass()\">\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <ehr-coded-text-checkboxes ng-if=\"isCheckboxes() && !isTerminology()\"></ehr-coded-text-checkboxes>\n" +
    "            <span ng-show=\"(isCheckboxes() || isRadios()) && isTerminology()\">Checkboxes and radios not yet implemented for terminology.</span>\n" +
    "            <!--<ehr-coded-text-combo ng-if=\"isCombo()\"></ehr-coded-text-combo>-->\n" +
    "            <ehr-coded-text-radio ng-if=\"isRadios()\"></ehr-coded-text-radio>\n" +
    "            <ehr-coded-text-component ng-if=\"!isRadios() && !isCheckboxes()\"></ehr-coded-text-component>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-component-element-switch.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-component-element-switch.html",
    "<div ehr-component-placeholders ng-if=\"::(!model.isContainer() && !model.getViewConfig().hasTag('noRender'))\" ng-switch on=\"::model.getRmType().toString()\" ng-if=\"::!model.getViewConfig().hasTag('noRender')\">\n" +
    "    <ehr-coded-text id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                    ng-switch-when=\"DV_CODED_TEXT\"></ehr-coded-text>\n" +
    "    <ehr-quantity id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                  ng-switch-when=\"DV_QUANTITY\"></ehr-quantity>\n" +
    "    <ehr-text id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\" ng-switch-when=\"DV_TEXT\"></ehr-text>\n" +
    "\n" +
    "    <ehr-uri id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "             ng-switch-when=\"DV_URI\"></ehr-uri>\n" +
    "   <ehr-ehr-uri id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "             ng-switch-when=\"DV_EHR_URI\"></ehr-ehr-uri>\n" +
    "   <ehr-multimedia id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "             ng-switch-when=\"DV_MULTIMEDIA\"></ehr-multimedia>\n" +
    "    <ehr-proportion id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                    ng-switch-when=\"DV_PROPORTION\"></ehr-proportion>\n" +
    "    <ehr-date id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "              ng-switch-when=\"DV_DATE\"></ehr-date>\n" +
    "    <ehr-time id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "              ng-switch-when=\"DV_TIME\"></ehr-time>\n" +
    "    <ehr-date-time id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                   ng-switch-when=\"DV_DATE_TIME\"></ehr-date-time>\n" +
    "    <ehr-boolean id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                 ng-switch-when=\"DV_BOOLEAN\"></ehr-boolean>\n" +
    "    <ehr-ordinal id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                 ng-switch-when=\"DV_ORDINAL\"></ehr-ordinal>\n" +
    "    <ehr-count id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "               ng-switch-when=\"DV_COUNT\"></ehr-count>\n" +
    "    <ehr-duration id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                  ng-switch-when=\"DV_DURATION\"></ehr-duration>\n" +
    "    <ehr-custom id=\"{{::model.getUniqueId()}}\" data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::customName()}}\"\n" +
    "                ng-switch-when=\"CUSTOM\"></ehr-custom>\n" +
    "    <ehr-unknown data-ehr-path=\"{{::model.getPath()}}\" data-ehr-name=\"{{::model.getName()}}\" ng-switch-default></ehr-unknown>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-count.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-count.html",
    "<div\n" +
    "        class=\"ehr-count ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"countValue\">\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div ehr-count-field  ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\" class=\"input-wrap\">\n" +
    "                <input\n" +
    "                        kendo-numeric-text-box=\"{{::kendoName()}}\"\n" +
    "                        type=\"number\"\n" +
    "                        name=\"{{::countName()}}\"\n" +
    "                        class=\"ehr-count-input hide-in-ehr-view-mode\"\n" +
    "                        ng-model=\"countFieldValue\"\n" +
    "                        ng-model-options=\"{ getterSetter: true, updateOn: 'default blur', debounce: {'default': 100, 'blur': 0}, allowInvalid: true}\"\n" +
    "                        k-options=\"countOptions\"\n" +
    "                        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "                        ng-required=\"::model.isRequired()\"\n" +
    "                        ehr-ng-min=\"::minValue\"\n" +
    "                        ehr-ng-min-op=\"'>='\"\n" +
    "                        ehr-ng-min-listen=\"false\"\n" +
    "                        ehr-ng-max=\"::maxValue\"\n" +
    "                        ehr-ng-max-op=\"'<='\"\n" +
    "                        ehr-ng-max-listen=\"false\"\n" +
    "                        >\n" +
    "\n" +
    "                <span class=\"show-in-ehr-view-mode\">{{countFieldValue()}}</span>\n" +
    "                <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "                <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-custom.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-custom.html",
    "<div\n" +
    "        class=\"ehr-custom ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::customName()}}\"\n" +
    "        ng-hide=\"model.getDelegateModel().getViewConfig().isHidden()\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model.getDelegateModel())\">\n" +
    "\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"EhrLayoutHelper.computeEhrLabelContentClass(model.getDelegateModel())\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.getDelegateModel().isRequired()}\"><span class=\"ehr-label-text\"> {{model.getDelegateModel().labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "\n" +
    "    <div class=\"ehr-field-content custom\"></div>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-date-time.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-date-time.html",
    "<div class=\"ehr-date-time ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"dateTimeValue\">\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div ehr-date-time-field  ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\" class=\"input-wrap\">\n" +
    "            <input\n" +
    "                    ehr-date-time-formatter=\"\"\n" +
    "                    kendo-date-time-picker=\"{{::kendoName()}}\"\n" +
    "                    type=\"datetime-local\"\n" +
    "                    name=\"{{::dateTimeName()}}\"\n" +
    "                    class=\"ehr-date-time-input hide-in-ehr-view-mode\"\n" +
    "                    k-ng-model=\"dateTimeObject\"\n" +
    "                    ng-model=\"_dateTimeObject\"\n" +
    "                    ng-model-options=\"{ debounce: 100, allowInvalid: true }\"\n" +
    "                    k-options=\"dateTimeOptions\"\n" +
    "                    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                    ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                    ng-required=\"::model.isRequired()\"\n" +
    "                    >\n" +
    "            <span class=\"show-in-ehr-view-mode\">{{toUIFormattedDateTime(_dateTimeObject)}}</span>\n" +
    "            <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "            <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-date.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-date.html",
    "<div\n" +
    "        class=\"ehr-date ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"dateValue\">\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div ehr-date-field  ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\" class=\"input-wrap\">\n" +
    "            <input\n" +
    "                    ehr-date-formatter=\"\"\n" +
    "                    kendo-date-picker=\"{{::kendoName()}}\"\n" +
    "                    type=\"date\"\n" +
    "                    name=\"{{::dateName()}}\"\n" +
    "                    class=\"ehr-date-input hide-in-ehr-view-mode\"\n" +
    "                    k-ng-model=\"dateObject\"\n" +
    "                    ng-model=\"_dateObject\"\n" +
    "                    ng-model-options=\"{ debounce: 100, allowInvalid: true }\"\n" +
    "                    k-options=\"dateOptions\"\n" +
    "                    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                    ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                    ng-required=\"::model.isRequired()\"\n" +
    "                    ehr-date-pattern-validator=\"\"\n" +
    "                    >\n" +
    "            <span class=\"show-in-ehr-view-mode\">{{toUIFormattedDate(_dateObject)}}</span>\n" +
    "            <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "            <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-duration-validation-field.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-duration-validation-field.html",
    "<span ng-message=\"min\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.min.duration\", {\n" +
    "        \"field\": fieldLabel(input.getSuffix()),\n" +
    "        \"min\": minValueFor(input.getSuffix()),\n" +
    "        \"minOp\": minOperatorFor(input.getSuffix())},\n" +
    "        EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"max\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.max.duration\", {\n" +
    "        \"field\": fieldLabel(input.getSuffix()),\n" +
    "        \"max\": maxValueFor(input.getSuffix()),\n" +
    "        \"maxOp\": maxOperatorFor(input.getSuffix())},\n" +
    "        EhrContext.language)}}\n" +
    "</span>");
}]);

angular.module("thinkehr/f4/templates/ehr-duration-validation-required.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-duration-validation-required.html",
    "<span ng-message=\"required\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{::EhrDictionary.text(\"validation.required\")}}\n" +
    "</span>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-duration.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-duration.html",
    "<div\n" +
    "        class=\"ehr-duration ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"durationValue\"\n" +
    "        >\n" +
    "\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-duration-row\" ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div ehr-duration-field  ehr-single-field-multi-item=\"\" ng-repeat=\"durVal in singleFieldMultiValuesList track by $index\">\n" +
    "            <div class=\"ehr-field-content\" ng-class=\" ::EhrLayoutHelper.computeFieldClass(model)\">\n" +
    "\n" +
    "                    <div class=\"ehr-column-wrapper\" ng-repeat=\"col in ::columns()\" ng-class=\" ::EhrLayoutHelper.computeFieldClass(model)\">\n" +
    "                        <div class=\"ehr-duration-column\">\n" +
    "                            <!-- TODO change how hidden works if only hidden rows in column - it still displays the column gap -->\n" +
    "                            <div class=\"ehr-row-wrapper\" ng-repeat=\"input in col\" ng-hide=\"model.isFieldHidden(input.getSuffix())\">\n" +
    "                                <div class=\"ehr-duration-input-label-wrapper\">\n" +
    "                                    <label class=\"ehr-duration-field-label ehr-infield-label\">{{::fieldLabel(input.getSuffix())}}</label>\n" +
    "                                    <ehr-label-gap></ehr-label-gap>\n" +
    "\n" +
    "                                    <div class=\"kendo-input-wrapper\">\n" +
    "                                        <!-- This one is necessary due to some kendo bug that stretches the input field to two lines if the parent container is flex -->\n" +
    "                                        <input\n" +
    "                                                kendo-numeric-text-box=\"{{::kendoName()}}_{{::input.getSuffix()}}\"\n" +
    "                                                type=\"number\"\n" +
    "                                                name=\"{{::durationName(input.getSuffix())}}\"\n" +
    "                                                class=\"ehr-duration-input hide-in-ehr-view-mode\"\n" +
    "                                                k-options=\"durationOptions\"\n" +
    "                                                k-placeholder=\"fieldPlaceholder(input.getSuffix())\"\n" +
    "                                                ng-class=\"::durationInputClass(input.getSuffix())\"\n" +
    "                                                ng-model=\"durationFieldInputValue[input.getSuffix()]\"\n" +
    "                                                ng-model-options=\"{ getterSetter: true, updateOn: 'default blur', debounce: {'default': 100, 'blur': 0}, allowInvalid: true}\"\n" +
    "                                                ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                                                ng-disabled=\"model.isFieldDisabled(input.getSuffix())\"\n" +
    "                                                ng-required=\"model.isFieldRequired(currMultiIndex)\"\n" +
    "                                                ehr-ng-min=\"::minValueFor(input.getSuffix())\"\n" +
    "                                                ehr-ng-min-op=\"::minOperatorFor(input.getSuffix())\"\n" +
    "                                                ehr-ng-max=\"::maxValueFor(input.getSuffix())\"\n" +
    "                                                ehr-ng-max-op=\"::maxOperatorFor(input.getSuffix())\"\n" +
    "                                                >\n" +
    "                                    </div>\n" +
    "                                    <span class=\"show-in-ehr-view-mode\">{{durationFieldInputValue[input.getSuffix()]()}}</span>\n" +
    "                                </div>\n" +
    "                                <div class=\"ehr-error-wrapper\" ng-if=\"showErrorMessageField(input.getSuffix())\">\n" +
    "                                    <ehr-row-gap></ehr-row-gap>\n" +
    "                                    <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessageField(input.getSuffix())\">\n" +
    "                                        <span ng-messages-include=\"thinkehr/f4/templates/ehr-duration-validation-field.html\"></span>\n" +
    "                                    </span>\n" +
    "                                </div>\n" +
    "                                <ehr-row-gap last=\"$last\"></ehr-row-gap>\n" +
    "                            </div>\n" +
    "\n" +
    "                        </div>\n" +
    "                        <ehr-column-gap last=\"$last\" ng-hide=\"isHiddenColumn(col)\"></ehr-column-gap>\n" +
    "                    </div>\n" +
    "                <!--<span class=\"show-in-ehr-view-mode\">\n" +
    "                    <span  ng-repeat=\"col in ::columns()\">\n" +
    "                        <span  ng-repeat=\"input in col\" ng-show=\"durationFieldInputValue[input.getSuffix()]()>0\">\n" +
    "                            {{durationFieldInputValue[input.getSuffix()]()}} {{::fieldLabel(input.getSuffix())}}\n" +
    "                            <div class=\"ehr-error-wrapper\" ng-if=\"showErrorMessageField(input.getSuffix())\">\n" +
    "                                <ehr-row-gap></ehr-row-gap>\n" +
    "                                <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessageField(input.getSuffix())\">\n" +
    "                                    <span ng-messages-include=\"thinkehr/f4/templates/ehr-duration-validation-field.html\"></span>\n" +
    "                                </span>\n" +
    "                            </div>\n" +
    "                        </span>\n" +
    "                    </span>\n" +
    "\n" +
    "                </span>-->\n" +
    "\n" +
    "                <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "\n" +
    "                <div class=\"ehr-error-wrapper\" ng-if=\"showErrorMessageRequired()\">\n" +
    "                    <ehr-label-gap></ehr-label-gap>\n" +
    "                    <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessageRequired()\">\n" +
    "                        <span ng-messages-include=\"thinkehr/f4/templates/ehr-duration-validation-required.html\"></span>\n" +
    "                    </span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-ehr-uri-text-area.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-ehr-uri-text-area.html",
    "<div class=\"input-wrap\">\n" +
    "        <textarea\n" +
    "        class=\"ehr-text-input  ehr-uri-text-area area k-textbox hide-in-ehr-view-mode\"\n" +
    "        name=\"{{getFieldName()}}\"\n" +
    "        rows=\"{{::rows()}}\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-model=\"ehrUriFieldValue\"\n" +
    "        ng-model-options=\"{ getterSetter: true, allowInvalid: true}\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "        ng-required=\"::model.isRequired()\"\n" +
    "        ng-pattern=\"::model.getEhrUriPattern()\"\n" +
    "        ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"></textarea>\n" +
    "\n" +
    "        <span class=\"show-in-ehr-view-mode\">{{ehrUriFieldValue()}}</span>\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-ehr-uri-text-field.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-ehr-uri-text-field.html",
    "<div class=\"input-wrap\">\n" +
    "        <input\n" +
    "        type=\"text\"\n" +
    "        name=\"{{getFieldName()}}\"\n" +
    "        class=\"ehr-text-input ehr-uri-text-field field k-textbox hide-in-ehr-view-mode\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-model=\"ehrUriFieldValue\" ng-model-options=\"{ getterSetter: true, allowInvalid: true }\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "        ng-required=\"::model.isRequired()\"\n" +
    "        ng-pattern=\"::model.getEhrUriPattern()\"\n" +
    "        ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"\n" +
    "        />\n" +
    "        <span class=\"show-in-ehr-view-mode\">{{ehrUriFieldValue()}}</span>\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-ehr-uri.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-ehr-uri.html",
    "<div\n" +
    "        class=\"ehr-text ehr-uri ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"ehrUriValue\"\n" +
    "        >\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <!--<textarea ng-model=\"textValue\" ng-model-options=\"{ getterSetter: true }\" rows=\"1\" cols=\"30\"></textarea>-->\n" +
    "            <ehr-ehr-uri-text-field ng-if=\"::isTextField()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-ehr-uri-text-field>\n" +
    "            <ehr-ehr-uri-text-area ng-if=\"::isTextArea()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-ehr-uri-text-area>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-form.html",
    "<form ng-cloak class=\"ehr-form\" name=\"{{formName()}}\" novalidate=\"novalidate\" ng-submit=\"validateEhrForm($event)\">\n" +
    "    <div frang-tree ng-if=\"!freeLayout\">\n" +
    "        <div ehr-tab-container-level class=\"ehr-disable-possible\" ng-class=\"formContainerClass()\">\n" +
    "            <div class=\"ehr-glass-panel ehr-form-glass-panel\"></div>\n" +
    "            <div frang-tree-repeat=\"model in model.childModels\">\n" +
    "\n" +
    "                <ehr-container class=\"\" ehr-component-placeholders ng-if=\"( (model.isContainer() && !isTabContainer(model) && !model.getViewConfig().hasTag('noRender')) || ( isTabContainer(model) && getTabObj(model)==tabGroupSelection[getTabObj(model).tabGroupId] ) || ehrFormCtrl.getWasTabSelected(model.getPath()) )\"  ng-hide=\"model.getViewConfig().isHidden() || ( isTabContainer(model) && getTabObj(model)!=tabGroupSelection[getTabObj(model).tabGroupId] )\" ng-class=\"{'no-border':model.getViewConfig().advanced.hideFrame}\">\n" +
    "\n" +
    "                    <div class=\"ehr-container ehr-disable-possible\" data-ehr-path=\"{{::model.getPath()}}\" id=\"{{::model.getUniqueId()}}\"\n" +
    "                         data-ehr-name=\"{{::model.getName()}}\"\n" +
    "                         ng-form=\"{{::model.getElementName()}}\"\n" +
    "                         ng-hide=\"model.getViewConfig().isHidden()\" ng-class=\"containerClass()\">\n" +
    "                        <div class=\"ehr-glass-panel\"></div>\n" +
    "                        <div class=\"ehr-container-bar k-header\" ng-init=\"showControls(true)\" ng-hide=\"'{{::model.getRmType()}}'=='GENERIC_COMPOSITE_FIELD' || model.getViewConfig().advanced.hideFrame\">\n" +
    "\n" +
    "                            <span class=\"label-start-position-holder\">\n" +
    "                                <i class=\"fa fa-angle-down k-sprite expand-arrow-icon\"></i>\n" +
    "                            </span>\n" +
    "\n" +
    "                            <span class=\"ehr-container-label\">\n" +
    "                                <span ng-if=\"!suppressLabel && !_isTabContainer\" class=\"ehr-label-text\">{{::model.labelFor(EhrContext.language)}}</span>\n" +
    "                                <ehr-tab-container-title ehr-context=\"EhrContext\" ng-if=\"_isTabContainer\" ng-repeat=\"tabObj in getTabGroupArrForModel(model) track by $index\" tab-obj=\"tabObj\" ng-class=\"{selected:isTabObjSelected(tabObj)}\"></ehr-tab-container-title>\n" +
    "                                <span ng-if=\"::supportsMulti() && !_isTabContainer\" ng-show=\"showControls()\" class=\"multi-container-position-label\">{{getMultiNumberText(getMultiIndex()+1)}}</span>\n" +
    "                                <span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional() && !_isTabContainer} \"> {{::model.getViewConfig().getMultiplicityString()}}</span>\n" +
    "                            </span>\n" +
    "\n" +
    "                            <span class=\"label-end-position-holder\">\n" +
    "                                <div class=\"ehr-container-controls hide-in-ehr-view-mode\" ng-if=\"::supportsMulti() && !_isTabContainer\" ng-show=\"showControls()\">\n" +
    "                                    <button kendo-button type=\"button\" class=\"ehr-duplicate-container-btn\" ng-click=\"duplicateContainer()\" ng-disabled=\"!duplicationEnabled()\">+</button>\n" +
    "                                    <button kendo-button type=\"button\" class=\"ehr-remove-container-btn\" ng-click=\"removeContainer()\" ng-disabled=\"!removalEnabled()\">-</button>\n" +
    "                                </div>\n" +
    "                            </span>\n" +
    "\n" +
    "                        </div>\n" +
    "                        <div ng-show=\"!!hiddenContainerContentStyle\" class=\"container-render-progress\">{{renderProgressText}}</div>\n" +
    "                        <div ehr-tab-container-level ng-style=\"hiddenContainerContentStyle\">\n" +
    "                            <div frang-tree-insert-children=\"model.childModels\"  ng-if=\"model.childModels && model.childModels.length > 0\"></div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </ehr-container>\n" +
    "                <ehr-component-element-switch></ehr-component-element-switch>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <!--<ehr-recursive-element ng-if=\"!freeLayout\"></ehr-recursive-element>-->\n" +
    "</form>");
}]);

angular.module("thinkehr/f4/templates/ehr-free-layout-component.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-free-layout-component.html",
    "<div ng-if=\"model!=null\" class=\"ehr-free-layout-component\" data-ehr-path=\"{{::model.getPath()}}\" id=\"{{::model.getUniqueId()}}\"\n" +
    "     data-ehr-name=\"{{::model.getName()}}\"\n" +
    "     ng-form=\"{{::model.getElementName()}}\"\n" +
    "     ng-hide=\"model.getViewConfig().isHidden()\" ng-class=\"containerClass()\">\n" +
    "    <ehr-component-element-switch></ehr-component-element-switch>\n" +
    "</div>\n" +
    "<div class=\"free-layout-model-not-found\" ng-if=\"!model && modelNotFoundDictCode\">{{EhrDictionary.messageFormat(modelNotFoundDictCode, {queryStr:modelQueryStr}, EhrContext.language)}}</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-label.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-label.html",
    "<label class=\"ehr-label\" ng-transclude></label>");
}]);

angular.module("thinkehr/f4/templates/ehr-multimedia-field.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-multimedia-field.html",
    "<div class=\"input-wrap\">\n" +
    "        <div class=\"media-content\" ng-switch=\"getMediaType()\">\n" +
    "                <a ng-switch-when=\"MEDIA_TYPE_IMAGE\" ng-href=\"{{uriValue() | trustUrl}}\" target=\"_blank\">\n" +
    "                    <img class=\"image-media\" ng-src=\"{{uriValue()}}\"/>\n" +
    "                </a>\n" +
    "                <video ng-switch-when=\"MEDIA_TYPE_VIDEO\" class=\"video-media\" controls>\n" +
    "                        <source ng-src=\"{{uriValue() | trustUrl}}\" type=\"{{getMimeType(uriValue())}}\">\n" +
    "                        Your browser does not support the video tag.\n" +
    "                </video>\n" +
    "                <audio ng-switch-when=\"MEDIA_TYPE_AUDIO\" class=\"audio-media\" controls>\n" +
    "                        <source ng-src=\"{{uriValue() | trustUrl}}\" type=\"{{getMimeType(uriValue())}}\">\n" +
    "                        Your browser does not support the audio element.\n" +
    "                </audio>\n" +
    "                <div ng-sitch-default class=\"no-media\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <input\n" +
    "        type=\"text\"\n" +
    "        name=\"{{::uriName()}}\"\n" +
    "        class=\"ehr-text-input ehr-multimedia-input field k-textbox hide-in-ehr-view-mode\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-model=\"uriValue\" ng-model-options=\"{ getterSetter: true, allowInvalid: true }\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "        ng-required=\"::model.isRequired()\"\n" +
    "        ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"\n" +
    "        />\n" +
    "\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "\n" +
    "        <div class=\"mime-edit-toggle hide-in-ehr-view-mode\" ng-click=\"_view._editMime=!_view._editMime\" ng-hide=\"getFileSuffix(uriValue())\">mime: <span ng-hide=\"_view._editMime\">{{mimeTypeValue()}}</span></div>\n" +
    "\n" +
    "        <input\n" +
    "        type=\"text\"\n" +
    "        name=\"{{::mimeTypeName()}}\"\n" +
    "        class=\"ehr-text-input ehr-multimedia-mime-type-input field k-textbox hide-in-ehr-view-mode\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"model.getViewConfig().isHidden() || !_view._editMime || getFileSuffix(uriValue())\"\n" +
    "        ng-model=\"mimeTypeValue\" ng-model-options=\"{ getterSetter: true, allowInvalid: true }\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "        />\n" +
    "\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-multimedia.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-multimedia.html",
    "<div\n" +
    "        class=\"ehr-multimedia ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"uriValue\"\n" +
    "        >\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <ehr-multimedia-field ehr-single-field-multi-item=\"\" ng-repeat=\"multimF in singleFieldMultiValuesList track by $index\"></ehr-multimedia-field>\n" +
    "            <div class=\"multimedia-upload\"></div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-other-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-other-input.html",
    "<div class=\"ehr-other\" ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\">\n" +
    "    <label class=\"ehr-text-other-span\">\n" +
    "        <span class=\"ehr-other-label hide-in-ehr-view-mode\">{{::EhrDictionary.text(\"other\")}}:</span>\n" +
    "        <input\n" +
    "                type=\"text\"\n" +
    "                name=\"{{::otherFieldName()}}\"\n" +
    "                class=\"ehr-text-input field other k-textbox hide-in-ehr-view-mode\"\n" +
    "                ng-model=\"otherValue\"\n" +
    "                ng-model-options=\"{ getterSetter: true, debounce: 100, allowInvalid:true }\"\n" +
    "                ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                ng-required=\"otherRequired()\"\n" +
    "                ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"\n" +
    "                />\n" +
    "\n" +
    "        <span class=\"show-in-ehr-view-mode\">{{otherValue()}}</span>\n" +
    "    </label>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-proportion.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-proportion.html",
    "<div\n" +
    "        class=\"ehr-proportion ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"proportionValue\">\n" +
    "\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div ehr-proportion-field  ehr-single-field-multi-item=\"\" ng-repeat=\"propVal in singleFieldMultiValuesList track by $index\" class=\"input-wrap\">\n" +
    "            <!--k-rebind=\"magnitudeOptions\" Add this option for rebinding if kendo ever fixes the bug with TypeError on rebind -->\n" +
    "            <!-- Then disable the precision watcher in the controller -->\n" +
    "            <input\n" +
    "                    ehr-number-formatter=\"decimal\"\n" +
    "                    kendo-numeric-text-box=\"{{::kendoNumName()}}\"\n" +
    "                    name=\"{{::numeratorName()}}\"\n" +
    "                    type=\"number\"\n" +
    "                    k-options=\"numeratorOptions\"\n" +
    "                    class=\"ehr-number ehr-proportion ehr-numerator hide-in-ehr-view-mode\"\n" +
    "                    ng-class=\"::computeFieldClass()\"\n" +
    "                    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-model=\"numeratorValue\"\n" +
    "                    ng-model-options=\"{ getterSetter: true, updateOn: 'default blur', debounce: {'default': 100, 'blur': 0}, allowInvalid: true}\"\n" +
    "                    ng-required=\"::model.isRequired()\"\n" +
    "                    ehr-ng-min=\"::numeratorMinValue\"\n" +
    "                    ehr-ng-min-op=\"::numeratorMinValueOp\"\n" +
    "                    ehr-ng-min-listen=\"false\"\n" +
    "                    ehr-ng-max=\"::numeratorMaxValue\"\n" +
    "                    ehr-ng-max-op=\"::numeratorMaxValueOp\"\n" +
    "                    ehr-ng-max-listen=\"false\"\n" +
    "                    >\n" +
    "            <span class=\"show-in-ehr-view-mode\">{{numeratorValue()}}</span>\n" +
    "            <span class=\"ehr-proportion-separator\" ng-if=\"::!fixedDenominator()\">&nbsp;/&nbsp;</span>\n" +
    "            <!-- Has to be ng-show, because ng-if causes problems with model binding, probably kendo-related -->\n" +
    "            <input\n" +
    "                    ehr-number-formatter=\"decimal\"\n" +
    "                    kendo-numeric-text-box=\"{{::kendoDenName()}}\"\n" +
    "                    name=\"{{::denominatorName()}}\"\n" +
    "                    type=\"number\"\n" +
    "                    k-options=\"denominatorOptions\"\n" +
    "                    class=\"ehr-number ehr-proportion ehr-denominator hide-in-ehr-view-mode\"\n" +
    "                    ng-class=\"::computeFieldClass()\"\n" +
    "                    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-model=\"denominatorValue\"\n" +
    "                    ng-model-options=\"{ getterSetter: true, updateOn: 'default blur', debounce: {'default': 100, 'blur': 0}, allowInvalid: true}\"\n" +
    "                    ng-show=\"::!fixedDenominator()\"\n" +
    "                    ng-required=\"::denominatorRequired()\"\n" +
    "                    ehr-ng-min=\"::denominatorMinValue\"\n" +
    "                    ehr-ng-min-op=\"::denominatorMinValueOp\"\n" +
    "                    ehr-ng-min-listen=\"false\"\n" +
    "                    ehr-ng-max=\"::denominatorMaxValue\"\n" +
    "                    ehr-ng-max-op=\"::denominatorMaxValueOp\"\n" +
    "                    ehr-ng-max-listen=\"false\"\n" +
    "                    >\n" +
    "            <span class=\"show-in-ehr-view-mode\">{{denominatorValue()}}</span>\n" +
    "            <span class=\"ehr-percentage-sign\" ng-if=\"::percentage()\">&nbsp;&#37;</span>\n" +
    "\n" +
    "            <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "            <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-quantity.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-quantity.html",
    "<div\n" +
    "        class=\"ehr-quantity ehr-line field-size-small\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"quantityValue\">\n" +
    "\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div ehr-quantity-field  ehr-single-field-multi-item=\"\" ng-repeat=\"propVal in singleFieldMultiValuesList track by $index\" class=\"input-wrap\">\n" +
    "            <!--k-rebind=\"magnitudeOptions\" Add this option for rebinding if kendo ever fixes the bug with TypeError on rebind -->\n" +
    "            <!-- Then disable the precision watcher in the controller -->\n" +
    "            <input\n" +
    "                    ehr-number-formatter=\"decimal\"\n" +
    "                    kendo-numeric-text-box=\"{{::kendoMagName()}}\"\n" +
    "                    type=\"number\"\n" +
    "                    name=\"{{::magnitudeName()}}\"\n" +
    "                    k-options=\"magnitudeOptions\"\n" +
    "                    class=\"ehr-number ehr-magnitude hide-in-ehr-view-mode\"\n" +
    "                    ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-model=\"magnitudeFieldValue\"\n" +
    "                    ng-model-options=\"{ getterSetter: true, updateOn: 'default blur', debounce: {'default': 100, 'blur': 0}, allowInvalid: true}\"\n" +
    "                    ng-required=\"::model.isRequired()\"\n" +
    "                    ehr-ng-min=\"minValue\"\n" +
    "                    ehr-ng-min-op=\"minValueOp\"\n" +
    "                    ehr-ng-max=\"maxValue\"\n" +
    "                    ehr-ng-max-op=\"maxValueOp\"\n" +
    "                    />\n" +
    "\n" +
    "            <select\n" +
    "                    kendo-combo-box=\"{{::kendoUnitName()}}\"\n" +
    "                    name=\"{{::unitName()}}\"\n" +
    "                    class=\"ehr-combo ehr-unit hide-in-ehr-view-mode\"\n" +
    "                    ng-if=\"isComboUnit()\"\n" +
    "                    ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-model=\"unitFieldValue\"\n" +
    "                    ng-model-options=\"{ getterSetter: true }\"\n" +
    "                    k-filter=\"'contains'\"\n" +
    "                    k-change=\"unitChanged\"\n" +
    "                    ng-required=\"unitRequired()\"\n" +
    "                    >\n" +
    "                <option value=\"\"></option>\n" +
    "                <option ng-repeat=\"item in ::list()\" value=\"{{::item.getValue()}}\" ng-bind=\"item.getLabel()\"></option>\n" +
    "            </select>\n" +
    "\n" +
    "            <div class=\"ehr-radio-button-group hide-in-ehr-view-mode\" ng-if=\"isRadiosUnit()\">\n" +
    "                <div class=\"ehr-radio-button-column\"\n" +
    "                     ng-repeat=\"unit in ::list()\"\n" +
    "                     ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\">\n" +
    "                    <label class=\"ehr-radio-label last-in-column\">\n" +
    "                    <input\n" +
    "                                type=\"radio\"\n" +
    "                                class=\"ehr-radio ehr-unit k-radio\"\n" +
    "                                name=\"{{::unitRbGroupName()}}\"\n" +
    "                                id=\"{{::model.getUniqueId()}}_{{unit.getValue()}}_id\"\n" +
    "                                ng-disabled=\"model.getViewConfig().isReadOnly()\"\n" +
    "                                ng-model=\"unitFieldValue\"\n" +
    "                                ng-model-options=\"{ getterSetter: true }\"\n" +
    "                                ng-value=\"::unit.getValue()\"\n" +
    "                                ng-required=\"::model.isRequired()\"\n" +
    "                            >\n" +
    "                        <label class=\"k-radio-label\" for=\"{{::model.getUniqueId()}}_{{unit.getValue()}}_id\" ng-bind=\"::unit.getLabel()\"></label>\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <span class=\"ehr-unit-label ehr-unit hide-in-ehr-view-mode\" ng-if=\"::isLabelUnit()\" ng-bind=\"::list()[0].getLabel()\" ng-hide=\"::hideUnit()\"></span>\n" +
    "\n" +
    "            <span class=\"show-in-ehr-view-mode\">{{magnitudeFieldValue()}}</span>\n" +
    "            <span class=\"show-in-ehr-view-mode\">{{unitFieldValue()}}</span>\n" +
    "            <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "            <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-single-field-multi-controls.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-single-field-multi-controls.html",
    "<span ng-show=\"isMulti() && !model.getViewConfig().isReadOnly()\" class=\"single-field-multi-buttons hide-in-ehr-view-mode\">\n" +
    "    <span>\n" +
    "        <button ng-disabled=\"!(addMultiFieldEnabled() && ( $parent.$last && (singleFieldMultiValuesList.length && !anyTextValueEmpty())) )\" ng-click=\"addMultiField()\" class=\"single-field-multi-button single-field-multi-add\">+</button>\n" +
    "        <button ng-disabled=\"!(removeMultiFieldEnabled() && (!$parent.$first || (singleFieldMultiValuesList.length>1)) )\" ng-click=\"removeMultiField()\" class=\"single-field-multi-button single-field-multi-remove\">-</button>\n" +
    "    </span>\n" +
    "</span>");
}]);

angular.module("thinkehr/f4/templates/ehr-tab-container-title.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-tab-container-title.html",
    "<a class=\"ehr-tab-title\" ng-click=\"tabsCtrl.selectTab(tabObj)\">{{label}}</a>\n" +
    "\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-text-area.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-text-area.html",
    "<div class=\"input-wrap\">\n" +
    "        <textarea\n" +
    "                class=\"ehr-text-input area k-textbox hide-in-ehr-view-mode\"\n" +
    "                name=\"{{getFieldName()}}\"\n" +
    "                rows=\"{{::rows()}}\"\n" +
    "                ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "                ng-model=\"textFieldValue\"\n" +
    "                ng-model-options=\"{ getterSetter: true, allowInvalid: true }\"\n" +
    "                ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                ng-required=\"::model.isRequired()\"\n" +
    "                ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"></textarea>\n" +
    "        <span class=\"show-in-ehr-view-mode\">{{textFieldValue()}}</span>\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-text-field.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-text-field.html",
    "<div class=\"input-wrap\">\n" +
    "        <input\n" +
    "        type=\"text\"\n" +
    "        name=\"{{getFieldName()}}\"\n" +
    "        class=\"ehr-text-input field k-textbox hide-in-ehr-view-mode\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "        ng-model=\"textFieldValue\"\n" +
    "        ng-model-options=\"{ getterSetter: true, allowInvalid: true }\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "        ng-required=\"::model.isRequired()\"\n" +
    "        ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"\n" +
    "        />\n" +
    "        <span class=\"show-in-ehr-view-mode\">{{textFieldValue()}}</span>\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-text-values-combo.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-text-values-combo.html",
    "<!--<select kendo-combo-box class=\"ehr-combo\" ng-model=\"codeValue\" ng-model-options=\"{ getterSetter: true }\"-->\n" +
    "<!--ng-options=\"item.getValue() as item.getLabel() for item in model.getInputFor('code').getList()\">-->\n" +
    "<!--<option value=\"\">&nbsp;</option>-->\n" +
    "<!--</select>-->\n" +
    "<div class=\"input-wrap\">\n" +
    "        <select\n" +
    "                kendo-combo-box=\"{{::kendoName()}}\"\n" +
    "                name=\"{{::textValuesName()}}_{{multiController.getMultiIndex()}}\"\n" +
    "                class=\"ehr-combo hide-in-ehr-view-mode\"\n" +
    "                ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                ng-model=\"textFieldValue\"\n" +
    "                ng-model-options=\"{ getterSetter: true }\"\n" +
    "                k-filter=\"'contains'\"\n" +
    "                k-change=\"textChanged\"\n" +
    "                ng-required=\"::model.isRequired()\"\n" +
    "                >\n" +
    "            <option value=\"\"></option>\n" +
    "            <option ng-repeat=\"item in ::list()\" value=\"{{::item.getValue()}}\" ng-bind=\"::labelText(item)\"></option>\n" +
    "            <option value=\"__other__\" ng-if=\"::listOpen()\">{{::EhrDictionary.text('other')}}&nbsp;&gt;&gt;</option>\n" +
    "        </select>\n" +
    "        <!--<input\n" +
    "                ng-if=\"::listOpen()\"\n" +
    "                name=\"{{::otherFieldName()}}\"\n" +
    "                type=\"text\"\n" +
    "                class=\"ehr-text-input field other k-textbox\"\n" +
    "                ng-model=\"otherValue\"\n" +
    "                ng-model-options=\"{ getterSetter: true, debounce: 100 }\"\n" +
    "                ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                ng-hide=\"model.getViewConfig().isHidden() || !otherSelected()\"\n" +
    "                ng-required=\"otherRequired()\"\n" +
    "                >-->\n" +
    "        <span class=\"show-in-ehr-view-mode\">{{textFieldValue()}}</span>\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "        <ehr-other-input ng-if=\"::listOpen()\" ng-hide=\"model.getViewConfig().isHidden() || !otherSelected()\" class=\"ehr-other-include hide-in-ehr-view-mode\"></ehr-other-input>\n" +
    "\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-text-values-radio.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-text-values-radio.html",
    "<div class=\"input-wrap\">\n" +
    "    <div class=\"ehr-radio-button-group\" ng-hide=\"model.getViewConfig().isHidden()\">\n" +
    "        <div class=\"ehr-radio-button-column\"\n" +
    "             ng-repeat=\"col in columns\"\n" +
    "             ng-style=\"::elementStyle()\"\n" +
    "             ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "             ng-hide=\"(isViewMode && isViewMode()) && !anySelectedInColumn(col)\"\n" +
    "        >\n" +
    "\n" +
    "            <label class=\"ehr-radio-label\" ng-repeat=\"itemIndex in col\" ng-class=\"::EhrLayoutHelper.computeLastColumnClass($last, listOpen())\">\n" +
    "                <input\n" +
    "                    type=\"radio\"\n" +
    "                    class=\"ehr-radio k-radio hide-in-ehr-view-mode\"\n" +
    "                    name=\"ehr_rb_group_{{::textValuesName()}}_{{multiController.getMultiIndex()}}\"\n" +
    "                    id=\"{{::textValuesName()}}_{{multiController.getMultiIndex()}}_{{list()[itemIndex].getValue()}}_id\"\n" +
    "                    ng-disabled=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-model=\"textFieldValue\"\n" +
    "                    ng-model-options=\"{ getterSetter: true }\"\n" +
    "                    ng-value=\"::list()[itemIndex].getValue()\"\n" +
    "                    ng-required=\"radioRequired()\"\n" +
    "                    ng-click=\"rbClicked()\"\n" +
    "                    ng-blur=\"rbBlurred()\"\n" +
    "                    >\n" +
    "\n" +
    "                <label ng-class=\"{'k-radio-label':!(isViewMode && isViewMode())}\" for=\"{{::textValuesName()}}_{{multiController.getMultiIndex()}}_{{list()[itemIndex].getValue()}}_id\" ng-bind=\"::labelText(list()[itemIndex])\"\n" +
    "                       ng-hide=\"(isViewMode && isViewMode() && (list()[itemIndex].getValue()!=textFieldValue()))\"></label>\n" +
    "            </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "        <ehr-other-input ng-if=\"::listOpen()\" class=\"ehr-other-include\" ng-hide=\"(isViewMode && isViewMode()) && !otherValue()\"></ehr-other-input>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-text.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-text.html",
    "<div\n" +
    "        class=\"ehr-text ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"textValue\"\n" +
    "        >\n" +
    "\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <ehr-text-field ng-if=\"showTextField()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-text-field>\n" +
    "            <ehr-text-area ng-if=\"showTextArea()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-text-area>\n" +
    "            <ehr-text-values-combo ng-if=\"::isCombo()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-text-values-combo>\n" +
    "            <ehr-text-values-radio ng-if=\"::isRadios()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-text-values-radio>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-time.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-time.html",
    "<div\n" +
    "        class=\"ehr-time ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"timeValue\">\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <div ehr-time-field  ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\" class=\"input-wrap\">\n" +
    "            <input\n" +
    "                    ehr-time-formatter=\"\"\n" +
    "                    kendo-time-picker=\"{{::kendoName()}}\"\n" +
    "                    type=\"time\"\n" +
    "                    name=\"{{::timeName()}}\"\n" +
    "                    class=\"ehr-time-input hide-in-ehr-view-mode\"\n" +
    "                    k-ng-model=\"timeObject\"\n" +
    "                    ng-model=\"_timeObject\"\n" +
    "                    ng-model-options=\"{ debounce: 100, allowInvalid: true }\"\n" +
    "                    k-options=\"timeOptions\"\n" +
    "                    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "                    ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "                    ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "                    ng-required=\"::model.isRequired()\"\n" +
    "                    >\n" +
    "            <span class=\"show-in-ehr-view-mode\">{{toUIFormattedTime(_timeObject)}}</span>\n" +
    "            <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "            <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-unknown.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-unknown.html",
    "<span class=\"ehr-unknown\">Unknown EHR element: {{::model.getName()}}.</span>");
}]);

angular.module("thinkehr/f4/templates/ehr-uri-text-area.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-uri-text-area.html",
    "<div class=\"input-wrap\">\n" +
    "        <textarea\n" +
    "        class=\"ehr-text-input  ehr-uri-text-area area k-textbox hide-in-ehr-view-mode\"\n" +
    "        name=\"{{getFieldName()}}\"\n" +
    "        rows=\"{{::rows()}}\"\n" +
    "        ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "        ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "        ng-model=\"uriFieldValue\"\n" +
    "        ng-model-options=\"{ getterSetter: true, allowInvalid: true }\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "        ng-required=\"::model.isRequired()\"\n" +
    "        ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"></textarea>\n" +
    "        <span class=\"show-in-ehr-view-mode\">{{uriFieldValue()}}</span>\n" +
    "        <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "        <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-uri-text-field.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-uri-text-field.html",
    "<div class=\"input-wrap\">\n" +
    "    <input\n" +
    "    type=\"text\"\n" +
    "    name=\"{{getFieldName()}}\"\n" +
    "    class=\"ehr-text-input ehr-uri-text-field field k-textbox hide-in-ehr-view-mode\"\n" +
    "    ng-readonly=\"model.getViewConfig().isReadOnly()\"\n" +
    "    ng-hide=\"model.getViewConfig().isHidden()\"\n" +
    "    ng-model=\"uriFieldValue\" ng-model-options=\"{ getterSetter: true, allowInvalid: true }\"\n" +
    "    ng-class=\"::EhrLayoutHelper.computeFieldClass(model)\"\n" +
    "    ng-required=\"::model.isRequired()\"\n" +
    "    ehr-placeholder=\"{{model.annotationValue('placeholder')}}\"\n" +
    "    />\n" +
    "    <span class=\"show-in-ehr-view-mode\">{{uriFieldValue()}}</span>\n" +
    "    <ehr-single-field-multi-controls></ehr-single-field-multi-controls>\n" +
    "    <span class=\"ehr-validation-error-msg\" ng-messages=\"showErrorMessage()\"><span ng-messages-include=\"thinkehr/f4/templates/ehr-validation-msg.html\"></span></span>\n" +
    "</div>");
}]);

angular.module("thinkehr/f4/templates/ehr-uri.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-uri.html",
    "<div\n" +
    "        class=\"ehr-text ehr-uri ehr-line\"\n" +
    "        data-ehr-path=\"{{::model.getPath()}}\"\n" +
    "        data-ehr-name=\"{{::model.getName()}}\"\n" +
    "        ng-hide=\"EhrLayoutHelper.isFieldHidden(this)\"\n" +
    "        ng-class=\"::EhrLayoutHelper.computeEhrLineClass(model)\"\n" +
    "        ehr-single-field-multi-holder=\"uriValue\"\n" +
    "        >\n" +
    "    <ehr-label class=\"ehr-label-content\" ng-class=\"::EhrLayoutHelper.computeEhrLabelContentClass(model)\">\n" +
    "        <span class=\"label-start-position-holder\"></span>\n" +
    "        <span ng-if=\"!suppressLabel\" ng-class=\"{'mandatory-field-label': model.isRequired()}\"><span class=\"ehr-label-text\"> {{model.labelFor(EhrContext.language)}}</span><span class=\"multiplicity-label\" ng-class=\"{'show-multiplicity': !model.isRequired() && !model.isOptional()}\"> {{::model.getViewConfig().getMultiplicityString()}}</span>:</span>\n" +
    "        <span class=\"label-end-position-holder\"></span>\n" +
    "    </ehr-label>\n" +
    "    <div class=\"ehr-field-content\">\n" +
    "\n" +
    "        <div class=\"content-start-position-holder\"></div>\n" +
    "        <div class=\"field-content-holder\">\n" +
    "            <!--<textarea ng-model=\"textValue\" ng-model-options=\"{ getterSetter: true }\" rows=\"1\" cols=\"30\"></textarea>-->\n" +
    "            <ehr-uri-text-field ng-if=\"::isTextField()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-uri-text-field>\n" +
    "            <ehr-uri-text-area ng-if=\"::isTextArea()\" ehr-single-field-multi-item=\"\" ng-repeat=\"textVal in singleFieldMultiValuesList track by $index\"></ehr-uri-text-area>\n" +
    "        </div>\n" +
    "        <div class=\"content-end-position-holder\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("thinkehr/f4/templates/ehr-validation-msg.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("thinkehr/f4/templates/ehr-validation-msg.html",
    "<span ng-message=\"required\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{::EhrDictionary.text(\"validation.required\", EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"min\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.min\", {\"min\": minValue, \"minOp\": minValueOp}, EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"max\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.max\", {\"max\": maxValue, \"maxOp\": maxValueOp}, EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"numberOfSelectionsInvalid\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.numberOfSelectionsInvalid\", {\"numberOfSelectionsMin\": numberOfSelectionsMin, \"numberOfSelectionsMax\": numberOfSelectionsMax}, EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"pattern\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.pattern\", {\"patternValidExample\": patternValidExample}, EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"terminologyCodeExistsValidator\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.terminologyCodeNotFound\", {\"codeValue\": validatedCodeValue}, EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"ehrDatePatternValidator\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.dateInvalidPattern\", {\"datePattern\": datePattern}, EhrContext.language)}}\n" +
    "</span>\n" +
    "<span ng-message=\"ehrCodedTextMultiMinItemsValidator\" class=\"k-widget k-tooltip k-tooltip-validation k-invalid-msg\">\n" +
    "    <span class=\"k-icon k-warning\"></span>\n" +
    "    {{EhrDictionary.messageFormat(\"validation.minItemsRequired\", {\"requiredDeltaNr\": minMultiNrDelta()}, EhrContext.language)}}\n" +
    "</span>\n" +
    "");
}]);
/* Concatenated */
(function ns() {
    if (!thinkehr.f4.ng._ehrTemplatesDefined) {
        thinkehr.f4.ng._ehrTemplatesDefined = true;
    }
})();/* Concatenated */
(function namespace() {

    function _recursionHelperService() {
        return angular.module('EhrRecursionHelper', []).factory('EhrRecursionHelper', ['$compile', function ($compile) {
            return {
                /*
                 * Manually compiles the element, fixing the recursion loop.
                 * @param element
                 * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
                 * @returns An object containing the linking functions.
                 */
                compile: function (element, link) {
                    // Normalize the link parameter
                    if (angular.isFunction(link)) {
                        link = {post: link};
                    }

                    // Break the recursion loop by removing the contents
                    var contents = element.contents().remove();
                    var compiledContents;
                    return {
                        pre: (link && link.pre) ? link.pre : null,
                        /*
                         * Compiles and re-adds the contents
                         */
                        post: function (scope, element) {
                            // Compile the contents
                            if (!compiledContents) {
                                compiledContents = $compile(contents);
                            }
                            // Re-add the compiled contents to the element
                            compiledContents(scope, function (clone) {
                                element.append(clone);
                            });

                            // Call the post-linking function, if any
                            if (link && link.post) {
                                link.post.apply(null, arguments);
                            }
                        }
                    };
                }
            };
        }]);
    }

    function _createContext(source, dest) {
        var ehrContext = angular.extend(dest, source);
        var locale;
        if (ehrContext.language) {
            locale = ehrContext.language;
            if (ehrContext.territory) {
                locale += "-" + ehrContext.territory.toUpperCase();
            }
        } else {
            locale = null;
        }

        ehrContext.locale = locale;

        return ehrContext;
    }


    function createFormModule(formName, formVersion, formModel, context, fixedName) {
        _recursionHelperService();

        // Define this empty module if the template module has not been produced and included by grunt
        if (!thinkehr.f4.ng._ehrTemplatesDefined) {
            console.warn("ehr-forms4-templates, defining empty module");
            angular.module("ehr-forms4-templates", []);
            thinkehr.f4.ng._ehrTemplatesDefined = true;
        }

        var moduleName = fixedName ? fixedName : thinkehr.f4.PREFIX + formName + ":" + formVersion;
        var module = angular.module(moduleName, ["ngMessages", "EhrRecursionHelper", "ehr-forms4-templates", "kendo.directives"]);

        module.factory("EhrNgUtil", [function () {
            return {
                isEmpty: function (value) {
                    return angular.isUndefined(value) || value === '' || value === null || value !== value;
                }
            };
        }]);

        module.factory("EhrSaveHelper", [function () {
            return {
                prepareValueModel: function (valueModel, ehrContext, rootModel) {
                    this.runVisitors(valueModel, ehrContext, rootModel);

                    var clonedModel = angular.copy(valueModel);
                    this.createSaveContext(ehrContext, clonedModel);

                    return clonedModel;
                },

                createSaveContext: function (context, valueModel) {
                    if (!valueModel.ctx) {
                        valueModel.ctx = {};
                    }

                    var ctx = context || {};

                    if (ctx.language) {
                        valueModel.ctx.language = ctx.language;
                    }

                    if (ctx.territory) {
                        valueModel.ctx.territory = ctx.territory;
                    }

                    return valueModel.ctx;
                },

                runVisitors: function (valueModel, ehrContext, rootModel) {
                    var ismVisitor = new thinkehr.f4.IsmTransitionVisitor();
                    rootModel.accept(ismVisitor);
                }
            }
        }]);

        module.factory("EhrLayoutHelper", ["lowercaseFilter", function (lowercaseFilter) {
            return {
                fieldSizeClass: function (model) {

                    if (model.getViewConfig().getSize() && model.getViewConfig().getSize().getField()) {
                        var fs = model.getViewConfig().getSize().getField();
                        if (fs != thinkehr.f4.FieldSize.INHERIT) {
                            return "field-size-" + lowercaseFilter(fs.toString());
                        }
                    }
                    return null;
                },

                fieldHorizontalAlignClass: function (model) {
                    if (model.getViewConfig().getLayout() && model.getViewConfig().getLayout().getFieldHorizontalAlignment()) {
                        var fha = model.getViewConfig().getLayout().getFieldHorizontalAlignment();
                        if (fha != thinkehr.f4.FieldHorizontalAlignment.INHERIT) {
                            return "field-horizontal-align-" + lowercaseFilter(fha.toString());
                        }
                    }
                },

                fieldVerticalAlignClass: function (model) {
                    if (model.getViewConfig().getLayout() && model.getViewConfig().getLayout().getFieldVerticalAlignment()) {
                        var fva = model.getViewConfig().getLayout().getFieldVerticalAlignment();
                        if (fva != thinkehr.f4.FieldVerticalAlignment.INHERIT) {
                            return "field-vertical-align-" + lowercaseFilter(fva.toString());
                        }
                    }
                },

                labelHorizontalAlignClass: function (model) {
                    if (model.getViewConfig().getLayout() && model.getViewConfig().getLayout().getLabelHorizontalAlignment()) {
                        var lha = model.getViewConfig().getLayout().getLabelHorizontalAlignment();
                        if (lha != thinkehr.f4.LabelHorizontalAlignment.INHERIT) {
                            return "label-horizontal-align-" + lowercaseFilter(lha.toString());
                        }
                    }
                },

                labelVerticalAlignClass: function (model) {
                    if (model.getViewConfig().getLayout() && model.getViewConfig().getLayout().getLabelVerticalAlignment()) {
                        var lva = model.getViewConfig().getLayout().getLabelVerticalAlignment();
                        if (lva != thinkehr.f4.LabelVerticalAlignment.INHERIT) {
                            return "label-vertical-align-" + lowercaseFilter(lva.toString());
                        }
                    }
                },

                computeFieldClass: function (model) {
                    var c = [];
                    // Will add others
                    var fsc = this.fieldSizeClass(model);
                    if (fsc) {
                        c.push(fsc);
                    }

                    return c;
                },

                computeEhrLineClass: function (model) {
                    var c = [];

                    var fha = this.fieldHorizontalAlignClass(model);
                    if (fha) {
                        c.push(fha);
                    }

                    var fva = this.fieldVerticalAlignClass(model);
                    if (fva) {
                        c.push(fva);
                    }

                    var lha = this.labelHorizontalAlignClass(model);
                    if (lha === "label-horizontal-align-top") {
                        c.push("line-top-to-bottom");
                    }

                    if (model.getViewConfig().isViewMode()) {
                        c.push('ehr-view-mode');
                    }

                    return c;
                },

                computeEhrLabelContentClass: function (model) {
                    var c = [];
                    // Will add others
                    var lha = this.labelHorizontalAlignClass(model);
                    if (lha) {
                        c.push(lha);
                    }

                    var lva = this.labelVerticalAlignClass(model);
                    if (lva) {
                        c.push(lva);
                    }

                    return c;
                },

                distributeColumns: function (columns, elements) {
                    var totalCols = elements < columns ? elements : columns;
                    var cols = [];

                    for (var i = 0; i < totalCols; i++) {
                        cols.push([]);
                    }

                    for (i = 0; i < elements; i++) {
                        var colIndex = i % totalCols;
                        cols[colIndex].push(i);
                    }

                    return cols;

                },

                columnWidthPercentage: function (viewConfig, columns) {
                    var vc = viewConfig;
                    if (vc.getSize() && vc.getSize().getField() === thinkehr.f4.FieldSize.LARGE) {
                        return Math.floor((100 / columns) - 1).toString() + "%";
                    }

                    return "auto";
                },

                computeLastColumnClass: function (last, listOpen) {
                    var c = [];
                    if (last && !listOpen) {
                        c.push("last-in-column");
                    }

                    return c;
                },

                getTextareaRows: function ($scope) {
                    if ($scope.model.getViewConfig().getField()) {
                        var field = $scope.model.getViewConfig().getField();

                        return field.getLines() ? field.getLines() : $scope.rowsDefault;
                    }

                    return $scope.rowsDefault;
                },

                getFormId: function ($scope) {
                    if ($scope && $scope.formName) {
                        return $scope.formName();
                    }
                    return '';
                },

                isFieldHidden: function ($scope) {
                    if ($scope) {
                        var isHiddenConfig = $scope.model.getViewConfig().isHidden();
                        if ($scope.isValuesViewMode && $scope.isValuesViewMode()) {
                            return !$scope.model.hasValue() || isHiddenConfig;
                        }
                        return isHiddenConfig;
                    }
                }
            }
        }]);

        module.factory("EhrDictionary", ["numberFilter", function (numberFilter) {
            return {
                text: function (key, language) {
                    var lang = language !== undefined ? language : '';

                    return thinkehr.f4.dict.tr(key, lang);
                }
                ,

                message: function (key, interpolationArgs, language) {
                    if (language == null) {
                        language = '';
                    }
                    return thinkehr.f4.dict.msg(key, language, interpolationArgs);
                },

                messageFormat: function (key, interpolationArgs, language) {
                    if (interpolationArgs) {
                        Object.keys(interpolationArgs).forEach(function (arg) {
                            var value = interpolationArgs[arg];
                            if (angular.isNumber(value)) {
                                interpolationArgs[arg] = numberFilter(value);
                            }
                        });
                    }

                    return this.message(key, interpolationArgs, language);
                }
            };
        }]);

        module.factory("EhrLocalizationHelper", ["$window", "$locale", function ($window, $locale) {
            return {
                browserDecimalSeparator: function () {
                    var n = 1.1;
                    n = n.toLocaleString().substring(1, 2);
                    return n;
                },

                kendoCulture: function (locale) {
                    if ($window.kendo && $window.kendo.cultures && $window.kendo.cultures[locale]) {
                        return $window.kendo.cultures[locale]
                    }

                    return null;
                },

                angularLocale: function (locale) {
                    var lcLocale = locale.toLowerCase();
                    if ($locale && $locale.id === lcLocale) {
                        return $locale;
                    }

                    return null;
                },

                decimalSeparator: function (locale) {
                    if (!locale) {
                        return this.browserDecimalSeparator();
                    }

                    // Check kendo
                    var sep;
                    var kendoCulture = this.kendoCulture(locale);
                    if (kendoCulture) {
                        sep = kendoCulture["numberFormat"]["."];
                    }

                    // If not kendo, then check angular
                    if (!sep) {
                        var ngLocale = this.angularLocale(locale);
                        if (ngLocale) {
                            sep = ngLocale["NUMBER_FORMATS"]["DECIMAL_SEP"];
                        }
                    }

                    // If angular has not set it, take browser's default
                    if (!sep) {
                        sep = this.browserDecimalSeparator();
                    }

                    return sep;
                },

                isDecimalSeparatorComma: function (locale) {
                    return this.decimalSeparator(locale) === ",";
                },

                _calendarProperty: function (locale, kendoProperty, angularProperty) {
                    if (!locale) {
                        return null;
                    }

                    var format;
                    var kendoCulture = this.kendoCulture(locale);
                    if (kendoCulture) {
                        format = kendoCulture.calendars.standard.patterns[kendoProperty];
                    }

                    if (!format) {
                        var ngLocale = this.angularLocale(locale);
                        if (ngLocale) {
                            format = ngLocale["DATETIME_FORMATS"][angularProperty];
                        }
                    }

                    return format;
                },

                dateFormat: function (locale) {
                    return this._calendarProperty(locale, "d", "shortDate");
                },

                timeFormat: function (locale) {
                    return this._calendarProperty(locale, "t", "shortTime");
                },

                dateTimeFormat: function (locale) {
                    return this._calendarProperty(locale, "F", "short");
                },

                supportedTimeFormats: ["HH:mm:ss.sss", "HH:mm:ss", "HH:mm"],

                outputTimeFormat: "HH:mm:ss.sss",

                supportedDateTimeFormats: function (locale) {
                    return [
                        this._calendarProperty(locale, "g", "short"),
                        this._calendarProperty(locale, "G", "medium"),
                        this._calendarProperty(locale, "F", "medium")
                    ];
                },

                outputDateTimeFormat: "yyyy-MM-ddTHH:mm:ss.sssZ",

                toDate: function (strDate) {
                    if (strDate && strDate.length > 0) {
                        return $window.kendo.parseDate(strDate);
                    } else {
                        return null;
                    }
                },

                toTime: function (tv) {
                    if (tv && tv.length > 0) {
                        var d;
                        var millisDelimiter = tv.indexOf(".");
                        if (millisDelimiter > 0) {
                            tv = tv.substring(0, millisDelimiter);
                        }
                        if ($window.kendo) {
                            d = $window.kendo.parseDate(tv, this.supportedTimeFormats);
                        } else {
                            d = thinkehr.f4.util.toTime(tv);
                        }

                        return d;
                    } else {
                        return null;
                    }
                },

                generateKendoName: function (prefix, $scope, genFunction, propertyName, fnName) {
                    var pn = propertyName ? propertyName : "_kendoName";
                    if ($scope && angular.isDefined($scope[pn])) {
                        return $scope[pn];
                    }

                    var kendoName = (prefix + "_" + thinkehr.f4.util.guid()).replace(/\-/g, "_");
                    if ($scope) {
                        $scope[pn] = kendoName;

                        if (genFunction !== false) {
                            var fn = fnName || "kendoName";
                            $scope[fn] = function () {
                                return $scope[pn];
                            }
                        }
                    }

                    return kendoName;
                }
            }
        }]);

        module.factory("EhrApiServiceFactory", ["$rootScope", "$compile", "$q", function ($rootScope, $compile, $q) {
            return {

                setupCustomFunction: function ($scope, model, element) {
                    var self = this;
                    if (!$scope) {
                        console.warn("ERROR no scope for custom function on element=", element);
                        return
                    }

                    if (model) {
                        this.executeCustomFunction(model, $scope, element, null);
                    }

                    $scope.$watch("model", function (newValue, oldValue) {
                        if (newValue && newValue !== oldValue) {
                            self.executeCustomFunction(newValue, $scope, element, null);
                        }
                    });
                },

                executeCustomFunction: function (model, $scope, element, customFunctionName) {
                    var self = this;
                    var returnDeferred = $q.defer();
                    var fncAnnVal = !customFunctionName && model && model.hasAnnotation("function") ? model.annotationValue("function") : customFunctionName;
                    if (fncAnnVal) {
                        var deferredCustomFnExecution = $q.defer();
                        var watchConfig = {
                            watchExpressions: [],
                            initialized: false
                        };

                        try {
                            var formApi = self.create(deferredCustomFnExecution, model, $scope, watchConfig, $compile, element);
                            var customFnRef = thinkehr.f4.getCustomFunctionReference(fncAnnVal, $scope.EhrContext);
                            //var customFnResult = eval((fncAnnVal + "(formApi)"));
                            if (customFnRef == null) {
                                console.error(fncAnnVal + " custom function not defined.");
                            } else {
                                var customFnResult = customFnRef.call(customFnRef, formApi);
                                if (customFnResult !== false) {
                                    deferredCustomFnExecution.resolve(customFnResult)
                                }
                            }
                            //eval(fncAnnVal + ("(formApi)"));
                            watchConfig.initialized = true;
                        } catch (ex) {
                            console.error("Init function eval error", ex);
                            if (eval(fncAnnVal) == null) {
                                returnDeferred.reject({
                                    errorId: 3,
                                    message: "Custom function '" + fncAnnVal + "' not defined.",
                                    data: ex
                                });
                            } else {
                                returnDeferred.reject({
                                    errorId: 0,
                                    message: "Error evaluating initialization function " + fncAnnVal + ". See console.",
                                    data: ex
                                });
                            }
                        }
                        deferredCustomFnExecution.promise.then(
                            function (resultObject) {
                                self.processInitResult(resultObject, model, $scope, watchConfig);
                                returnDeferred.resolve(resultObject ? resultObject.element : null);
                            },

                            function (failObject) {
                                returnDeferred.reject({
                                    errorId: 1,
                                    message: "Initialization has been rejected: " + failObject,
                                    data: failObject
                                });
                                console.error("Init rejected: ", failObject);
                            }
                        );
                    } else {
                        returnDeferred.reject({
                            errorId: 2,
                            message: "EhrApiServiceFactory.executeCustomFunction called without function name to execute.",
                            data: null
                        });
                    }
                    return returnDeferred.promise
                },

                create: function (deferred, model, scope, watchConfig, $compile, element) {
                    var rootModel = model.getRootModel();
                    if (rootModel && rootModel.getRmType() === thinkehr.f4.RmType.FORM_DEFINITION) {
                        var externalContext = rootModel._externalContext;
                    }

                    return thinkehr.f4.ng.getFormApiObject(deferred, model, scope, $rootScope, $compile, element, externalContext, watchConfig, $q);
                },

                processInitResult: function (resultObject, model, scope, watchConfig) {
                    if (resultObject) {
                        var el = resultObject.element;
                        if (el) {
                            el.on("$destroy", function () {
                                scope.$destroy();
                            });
                        }
                        if (resultObject.onDestroy) {
                            scope.$on("$destroy", function () {
                                resultObject.onDestroy(resultObject.element, scope);
                            });
                        }
                        if (resultObject.onModelRefresh && model.getRmType !== undefined) {
                            scope.model.onModelRefreshed(function () {
                                resultObject.onModelRefresh(model);
                            });
                        }
                    }


                    watchConfig.watchExpressions.forEach(function (wf) {
                        scope.$watch(wf[0], wf[1], wf[2]);
                    });
                }
            };
        }]);

        module.factory("EhrValidationHelper", ["$timeout", "EhrJQueryHelper", function ($timeout, EhrJQueryHelper) {
            return {
                ehrFormInput: function ($scope, nameChainRef, inputProperty) {
                    var ip = inputProperty ? inputProperty : "_formInput";
                    if (!$scope[ip]) {
                        var model = $scope.model;
                        if (model && model.isValueModel() && $scope.ehrForm) {
                            var ehrForm = $scope.ehrForm();
                            if (ehrForm) {

                                var form = ehrForm;

                                for (var i = 0; i < nameChainRef.length; i++) {
                                    var subFormName = nameChainRef[i];
                                    form = form[subFormName];
                                    if (!form) {
                                        form = null;
                                        break;
                                    }
                                }

                                $scope[ip] = form !== ehrForm ? form : null;
                            }
                        }
                    }

                    return $scope[ip];
                },

                showErrorMessage: function ($scope, formInput) {

                    if ($scope.showErrorMessages !== "false") {
                        if (formInput && formInput.$error) {
                            var touched = formInput.$dirty || formInput.$touched;
                            if (touched) {
                                return formInput.$error;
                            } else {
                                var form = $scope.ehrForm();
                                if (form && form.$submitted) {
                                    return formInput.$error;
                                }
                            }
                        }
                    }
                },

                registerFormInputOnScope: function ($scope, nameChain, property) {
                    var self = this;
                    $scope.ehrFormInput = function () {
                        return self.ehrFormInput($scope, nameChain, property);
                    };

                    $scope.showErrorMessage = function () {
                        return self.showErrorMessage($scope, $scope.ehrFormInput());
                    };
                },

                registerCompoundFormInputsOnScope: function ($scope, nameChains) {
                    var self = this;
                    $scope._inputAttempts = 0;
                    $scope.ehrFormInputs = function () {
                        if (!$scope._haveFormInputs) {
                            if (!$scope._formInputs) {
                                $scope._formInputs = {
                                    haveAllInputs: false,
                                    inputs: [],
                                    missingInputs: []
                                };

                                nameChains.forEach(function (nameChain, index) {
                                    var formInput = self.ehrFormInput($scope, nameChain);
                                    delete $scope["_formInput"];

                                    $scope._formInputs.inputs.push(formInput);
                                    if (!formInput) {
                                        $scope._formInputs.missingInputs.push({inputName: nameChain, index: index});
                                    }
                                });
                            } else {
                                $scope._formInputs.missingInputs.forEach(function (pair, index, array) {
                                    var formInput = self.ehrFormInput($scope, pair.inputName);
                                    delete $scope["_formInput"];

                                    if (formInput) {
                                        $scope._formInputs.inputs[pair.index] = formInput;
                                        array.splice(index, 1);
                                    }
                                });
                            }

                            $scope._formInputs.haveAllInputs = $scope._formInputs.missingInputs.length === 0;
                            $scope._haveFormInputs = $scope._formInputs.haveAllInputs;
                        }

                        return $scope._formInputs.inputs;
                    };

                    $scope.showErrorMessage = function () {
                        if ($scope.showErrorMessages !== "false") {
                            var inputs = $scope.ehrFormInputs();
                            var touched = false;
                            var errors = [];
                            inputs.filter(function (input) {
                                return input != null;
                            }).forEach(function (input) {
                                if (input.$error && thinkehr.f4.util.countProperties(input.$error) > 0) {
                                    errors.push(input.$error);
                                }
                                if (!touched) {
                                    touched = input.$dirty || input.$touched;
                                }
                            });

                            if (errors.length > 0) {
                                if (!touched) {
                                    var form = $scope.ehrForm();
                                    if (form && form.$submitted) {
                                        return errors[0];
                                    }
                                } else {
                                    return errors[0];
                                }
                            }
                        }

                        return null;
                    };
                },

                registerCompoundFormInputsModifyChains: function ($scope, lastChainElementMods) {
                    var elementChain = $scope.model.getElementNameChain();

                    var nameChains = lastChainElementMods.map(function (lastElement) {
                        var chain = angular.copy(elementChain);
                        chain[chain.length - 1] = lastElement;

                        return chain;
                    });

                    this.registerCompoundFormInputsOnScope($scope, nameChains);
                },

                validationFlagValue: function ($scope, index, flagName) {
                    if ($scope.ehrFormInputs !== undefined) {
                        var inputs = $scope.ehrFormInputs();

                        if (inputs.length > index && inputs[index]) {
                            return inputs[index][flagName];
                        }
                    } else if (index === 0 && $scope.ehrFormInput) {
                        var input = $scope.ehrFormInput();
                        if (input) {
                            return input[flagName];
                        }
                    }
                    return undefined;
                },

                syncNgClasses: function ($scope, element, inputIndices, selectors) {
                    var ii;
                    if (thinkehr.f4.util.isInteger(inputIndices)) {
                        ii = [];
                        for (var j = 0; j < inputIndices; j++) {
                            ii[j] = j;
                        }
                    } else {
                        ii = inputIndices;
                    }


                    var fs = ii.map(function (i) {
                        var self = this;
                        var f1 = function (scope) {
                            return self.validationFlagValue(scope, i, "$valid");
                        };

                        var f2 = function (scope) {
                            return self.validationFlagValue(scope, i, "$dirty");
                        };

                        var f3 = function (scope) {
                            return self.validationFlagValue(scope, i, "$touched");
                        };

                        var f4 = function (scope) {
                            return scope.model.getViewConfig().isHidden();
                        };

                        var f5 = function (scope) {
                            return scope.model.getViewConfig().isReadOnly();
                        };

                        return [f1, f2, f3, f4, f5];
                    }, this);

                    fs.forEach(function (f, index) {
                        $scope.$watchGroup(f, function () {
                            // Will run on next $digest
                            setTimeout(function () {
                                var numberInput = $(element).find(selectors[index]);
                                // First one is the actual visible input, second one is the hidden model one
                                if (numberInput.length == 2) {
                                    EhrJQueryHelper.syncAngularClasses(numberInput[1], numberInput[0]);
                                }
                            });
                        });
                    });
                },

                replaceLastElement: function (array, replaceWith) {
                    array[array.length - 1] = replaceWith;
                    return array;
                }
            };
        }]);

        module.factory("EhrJQueryHelper", [function () {
            return {

                getElementClasses: function (element) {
                    var cls = $(element).attr("class");
                    if (cls) {
                        var ar = $(element).attr("class").split(' ');
                        if (!angular.isArray(ar)) {
                            ar = [];
                        }
                    } else {
                        ar = [];
                    }

                    return ar;
                },

                getAngularClasses: function (element) {
                    return this.getElementClasses(element).filter(function (e) {
                        return e.indexOf("ng-") === 0;
                    });
                },

                removeAllAngularClasses: function (element) {
                    var angClasses = this.getAngularClasses(element);

                    var angClStr = angClasses.join(' ');

                    $(element).removeClass(angClStr);

                    return angClasses;
                },

                syncAngularClasses: function (srcElement, targetElement) {
                    this.removeAllAngularClasses(targetElement);

                    var angClasses = this.getAngularClasses(srcElement);
                    var angClStr = angClasses.join(' ');
                    $(targetElement).addClass(angClStr);

                    return angClasses;
                }
            };
        }]);

        module.factory("EhrDepsHelper", [function () {
            var depsHlp = {
                processModelDeps: function ($scope, watchFn, isCollection, objEquality) {
                    if ($scope.model.getDependencyNode()) {
                        var fn = isCollection === true ? $scope.$watchCollection : $scope.$watch;
                        fn.call($scope, watchFn, this.processDepsFn($scope), objEquality);
                    }
                },

                processDepsFn: function ($scope) {
                    return function (newValue, oldValue) {
                        var dn = $scope.model.getDependencyNode();
                        var nv = depsHlp.extractDepsValue(newValue);
                        var ov = depsHlp.extractDepsValue(oldValue);
                        if (dn && ( nv !== ov || depsHlp.isDepsInitialCall(newValue, oldValue) )) {
                            dn.process({});
                        }
                    }
                },

                depsValueFactory: function (value) {
                    return {_dependenciesValue: value};
                },

                extractDepsValue: function (value) {
                    if (this.isDepsValueObject(value)) {
                        return value._dependenciesValue;
                    }
                    return value;
                },

                isDepsValueObject: function (value) {
                    return thinkehr.f4.util.isObject(value) && value.hasOwnProperty("_dependenciesValue");
                },
                isDepsInitialCall: function (newValue, oldValue) {
                    return depsHlp.isDepsValueObject(newValue) && newValue === oldValue;
                }
            };
            return depsHlp;
        }]);

        module.directive("ehrForm", ["$log", "$rootScope", "$q", "EhrLayoutHelper", "EhrDictionary", "EhrApiServiceFactory",
            function ($log, $rootScope, $q, EhrLayoutHelper, EhrDictionary, EhrApiServiceFactory) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-form.html",
                    transclude: true,
                    replace: false,
                    scope: {
                        model: "=",
                        ehrContext: "=",
                        formId: "@",
                        showErrorMessages: "@",
                        freeLayout: '@'
                    },
                    controller: function ($scope) {
                        var _formName = null;

                        var sanitizeFormId = function (formIdParam) {
                            var sanitizedFormId = null;
                            if (formIdParam) {
                                sanitizedFormId = formIdParam.replace(/[^\w]/gi, '').replace('_', '');
                            }
                            if (!sanitizedFormId) {
                                sanitizedFormId = 'uid' + thinkehr.f4.util.guid('_');
                            }
                            return sanitizedFormId
                        };

                        var selectedTabs = {};
                        var openedTabs = {};
                        $scope.selectedTabCount = {};

                        this.setSelectTabModelPathId = function (tabsParentContainerPathId, tabGroupId, tabModelPathId) {
                            if (!selectedTabs[tabsParentContainerPathId]) {
                                selectedTabs[tabsParentContainerPathId] = {};
                            }
                            if(!$scope.selectedTabCount[tabModelPathId]){
                                $scope.selectedTabCount[tabModelPathId] = 0;
                            }
                            $scope.selectedTabCount[tabModelPathId]++;
                            selectedTabs[tabsParentContainerPathId][tabGroupId] = tabModelPathId;
                        };

                        this.getSelectedTabModelPathId = function (tabsParentContainerPathId, tabGroupId) {
                            return selectedTabs[tabsParentContainerPathId] ? selectedTabs[tabsParentContainerPathId][tabGroupId] : null;
                        };

                        this.setWasTabSelected = function (tabModelPathId) {
                            openedTabs[tabModelPathId] = true;
                        };

                        this.getWasTabSelected = function (tabModelPathId) {
                            return openedTabs[tabModelPathId];
                        };

                        if (!$scope.model) {
                            $scope.model = formModel;
                        }

                        var formModelCtx = $scope.model && $scope.model.getContext ? angular.copy($scope.model.getContext()) : null;

                        $scope.$watch('ehrContext',function (ehrContext) {
                            if (ehrContext) {
                                $scope.EhrContext = _createContext(ehrContext, formModelCtx || {});
                            } else {
                                $scope.EhrContext = $scope.EhrContext || {};
                                if (formModelCtx) {
                                    $scope.EhrContext = angular.extend($scope.EhrContext, formModelCtx);
                                }
                            }
                        });

                        $scope.EhrLayoutHelper = EhrLayoutHelper;
                        $scope.EhrDictionary = EhrDictionary;

                        $scope.formName = function () {
                            if ($scope.formId && $scope.formId != _formName) {
                                $scope.formId = sanitizeFormId($scope.formId);
                                _formName = $scope.formId;
                            } else if (!_formName) {
                                _formName = 'uid' + thinkehr.f4.util.guid('_');
                                $scope.model.setElementName(_formName);
                            }
                            return _formName;
                        };

                        $scope.ehrForm = function () {
                            return $scope[$scope.formName()];
                        };

                        $scope.validateEhrForm = function ($event) {
                            $event.preventDefault();
                            $scope.ehrForm().$setSubmitted();
                        };

                        $scope.$watch("formId", function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                $scope.formId = sanitizeFormId(newValue);
                            }
                        });

                        $scope.formContainerClass = function () {
                            var classArr = [];
                            if ($scope.model && $scope.model.getViewConfig().isReadOnly()) {
                                classArr.push("ehr-disabled");
                            } else {
                                classArr.push("ehr-enabled");
                            }
                            if ($scope.isViewMode()) {
                                classArr.push("ehr-view-mode");
                                if ($scope.isValuesViewMode()) {
                                    classArr.push("ehr-view-mode-values-only");
                                }
                            }

                            return classArr.length ? classArr.join(" ") : '';
                        };

                        $scope.isViewMode = function () {
                            return $scope.model && $scope.model.getViewConfig().isViewMode();
                        };

                        $scope.isValuesViewMode = function () {
                            return $scope.model && $scope.model.getViewConfig().getViewMode() == "values";
                        };

                    },

                    link: function (scope, element, attr, ctrl, transclude) {
                        scope.ehrFormCtrl = ctrl;

                        var transcludedFreeLayoutScopes = [];

                        transclude(scope, function (clone, trScope) {
                            scope.freeLayout = !!clone.length;
                            if (scope.freeLayout) {
                                transcludedFreeLayoutScopes.push(trScope);
                                element.append(clone);
                            }
                        });

                        var stopCurrEhrFormValidWatch = null;
                        var unsubscribeKendoRenderedEventFn = undefined;

                        scope.emitNoKendoRenderedEvent = function () {
                            setTimeout(function () {
                                scope.$emit("ehr-form-rendered", scope.formId);
                            });
                        };

                        var checkAndDispatchRenderEvent = function () {
                            var foundAnyKendoComponent = !!scope.model.hasAnyKendoComponent();

                            if (foundAnyKendoComponent && !unsubscribeKendoRenderedEventFn) {
                                unsubscribeKendoRenderedEventFn = scope.$on("kendoRendered", function (e) {
                                    scope.$emit("ehr-form-rendered", scope.formId);
                                    unsubscribeKendoRenderedEventFn();
                                    unsubscribeKendoRenderedEventFn = null;
                                });
                            } else if (!foundAnyKendoComponent) {
                                scope.emitNoKendoRenderedEvent();
                            }
                        };

                        scope.$watch("model", function (newValue, oldValue) {
                            if (newValue) {
                                checkAndDispatchRenderEvent();

                                transcludedFreeLayoutScopes.forEach(function (trFLScope) {
                                    trFLScope.$broadcast("onEhrModelRootChange", newValue);
                                });
                                var ast = scope.model.getDependencyNode();
                                if (ast) {
                                    ast.process({});
                                }
                            }
                        });

                        scope.$watch("EhrContext", function (newValue, oldValue) {
                            transcludedFreeLayoutScopes.forEach(function (trFLScope) {
                                trFLScope.$broadcast("onEhrContextChange", newValue);
                            });
                        });

                        scope.$watch("EhrDictionary", function (newValue, oldValue) {
                            transcludedFreeLayoutScopes.forEach(function (trFLScope) {
                                trFLScope.$broadcast("onEhrDictionaryChange", newValue);
                            });
                        });

                        scope.$watch(
                            function () {
                                return scope.ehrForm();
                            },
                            function (newValue, oldValue) {

                                if (newValue && newValue !== oldValue) {
                                    if (stopCurrEhrFormValidWatch) {
                                        stopCurrEhrFormValidWatch();
                                    }
                                    stopCurrEhrFormValidWatch = scope.$watch(
                                        function () {
                                            return newValue.$valid;
                                        },
                                        function (newValue, oldValue) {
                                            scope.$emit("ehrFormValidityChange", {
                                                formName: scope.formName(),
                                                form: scope.ehrForm(),
                                                newValue: newValue,
                                                oldValue: oldValue
                                            });
                                        }
                                    );
                                } else if (!newValue) {
                                    if (stopCurrEhrFormValidWatch) {
                                        stopCurrEhrFormValidWatch();
                                    }
                                }
                            }
                        );

                        element.on("$destroy", function () { // Why doesn't destroy get called by itself when element is removed? Maybe just a test problem.
                            console.info("Form element destroyed.");
                            scope.$destroy();
                        });

                        scope.$on("$destroy", function () {
                            scope.model = null;
                            scope.EhrContext = null;
                            scope.EhrLayoutHelper = null;
                            scope.EhrDictionary = null;
                            if (angular.isDefined(scope.ehrContext)) {
                                scope.ehrContext = null;
                            }
                        });

                        if (!scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction(scope, scope.model, element);
                    }
                };
            }]);

        module.directive("ehrFreeLayoutComponent", [function () {
            return {
                restrict: "E",
                templateUrl: "thinkehr/f4/templates/ehr-free-layout-component.html",
                scope: true,
                require: ['^^ehrForm'],
                link: function (scope, element, attr) {
                    scope.modelNotFoundDictCode = null;
                    scope.modelQueryStr = null;

                    var findComponentModel = function (rootModel, path, tag) {
                        var retModel = null;
                        if (rootModel) {
                            if (path) {
                                retModel = rootModel.findSuccessorWithPath(path);
                                if (!retModel) {
                                    console.warn("Can not find model for ehr path=", path);
                                    scope.modelNotFoundDictCode = "model.notFound.byPath"
                                    scope.modelQueryStr = path;
                                }
                            }
                            if (tag) {
                                retModel = rootModel.findSuccessorWithTag(tag);
                                if (!retModel) {
                                    console.warn("Can not find model for tag=", tag);
                                    scope.modelNotFoundDictCode = "model.notFound.byTag";
                                    scope.modelQueryStr = tag;
                                }
                            }
                        }
                        if (retModel) {
                            scope.modelNotFoundDictCode = null;
                            scope.modelQueryStr = null;
                        }
                        return retModel;
                    };

                    if (attr.ehrTag) {
                        scope.ehrTag = attr.ehrTag;
                    }

                    if (attr.ehrPath) {
                        scope.ehrPath = attr.ehrPath;
                    }

                    scope.$watch('ehrContext', function (newVal) {
                        scope.EhrContext = newVal;
                    });

                    scope.$watch('ehrDictionary', function (newVal) {
                        scope.EhrDictionary = newVal;
                    });

                    scope.$watch('ehrPath', function (newVal) {
                        if (scope.ehrModelRoot && newVal) {
                            scope.model = findComponentModel(scope.ehrModelRoot, newVal);
                        } else {
                            scope.model = null;
                        }
                    });

                    scope.$watch('ehrTag', function (newVal) {
                        if (scope.ehrModelRoot && newVal) {
                            scope.model = findComponentModel(scope.ehrModelRoot, null, newVal);
                        } else {
                            scope.model = null;
                        }

                    });

                    scope.$watch('ehrModelRoot', function (newVal) {
                        if (scope.ehrPath) {
                            scope.model = findComponentModel(newVal, scope.ehrPath);
                        }
                        if (scope.ehrTag) {
                            scope.model = findComponentModel(newVal, null, scope.ehrTag);
                        }
                    });

                    scope.$on('onEhrModelRootChange', function (ev, newVal) {
                        scope.ehrModelRoot = newVal;
                    });

                    scope.$on('onEhrContextChange', function (ev, newVal) {
                        scope.ehrContext = newVal;
                    });

                    scope.$on('onEhrDictionaryChange', function (ev, newVal) {
                        scope.ehrDictionary = newVal;
                    });
                }
            };
        }]);

        module.directive("ehrContainer", ["$timeout", "EhrRecursionHelper", "EhrApiServiceFactory", function ($timeout, EhrRecursionHelper, EhrApiServiceFactory) {
            return {
                restrict: "EA",
                scope: true,
                require: ['ehrContainer', '^frangTree'],
                controller: function ($scope) {

                    $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();
                    $scope._showControls = false;
                    $scope.hiddenContainerContentStyle = null;
                    $scope.renderProgressText = " Rendering in progress...";

                    if ($scope.EhrDictionary) {
                        var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                        $scope.renderProgressText = $scope.EhrDictionary.text('tabRendering', language) || $scope.renderProgressText;
                    }

                    $scope.supportsMulti = function () {
                        return $scope.model.isContainer() && $scope.model.isMulti() && $scope.model.isAttachableToValueNode();
                    };

                    $scope.duplicateContainer = function (nrOfCopies) {
                        if (!nrOfCopies) {
                            nrOfCopies = 1;
                        }
                        for (var i = 0; i < nrOfCopies; i++) {
                            thinkehr.f4.duplicateModel($scope.model, $scope.model);
                        }
                    };

                    $scope.getMultiIndex = function () {
                        return $scope.model.getMultiIndex(false);
                    };

                    $scope.removeContainer = function () {
                        thinkehr.f4.destroyModel($scope.model);
                    };

                    $scope.showControls = function (showControls) {
                        if (showControls !== undefined) {
                            $scope._showControls = showControls;
                        }

                        return $scope._showControls;
                    };

                    $scope.duplicationEnabled = function () {
                        if ($scope.supportsMulti()) {
                            var model = $scope.model;
                            var max = model.getViewConfig().getMax();
                            if (max < 0) {
                                return true;
                            }
                            var count = $scope.getMultiSiblingsCount();

                            return count < max;
                        }

                        return false;
                    };

                    $scope.getMultiSiblingsCount = function () {
                        var parent = $scope.model.getParentModel();
                        var count = parent ? parent.findChildrenWithPath($scope.model.getPath()).length : 1;
                        return count;
                    };

                    $scope.removalEnabled = function () {
                        if ($scope.supportsMulti()) {
                            var model = $scope.model;
                            var min = model.getViewConfig().getMin();
                            if (min < 1) {
                                min = 1;
                            }
                            var count = $scope.getMultiSiblingsCount();

                            return count > min;
                        }

                        return false;
                    };

                    $scope.containerClass = function () {

                        if ($scope.model.getViewConfig().isReadOnly()) {
                            return "ehr-disabled";
                        } else {
                            return "ehr-enabled";
                        }
                    };


                },
                compile: function (element) {

                    return EhrRecursionHelper.compile(element, function (scope, iElement, attrs, controllers) {

                        var showContainerContent = function () {
                            scope.hiddenContainerContentStyle = null;
                            try {
                                scope.$digest()
                            } catch (e) {
                            }
                        };

                        var hideContainerContent = function () {
                            scope.hiddenContainerContentStyle = {opacity: 0, 'pointer-events': 'none'};
                            var displayNotification = scope.renderProgressText;
                            scope.renderProgressText = '';
                            setTimeout(function () {
                                scope.$apply(function () {
                                    scope.renderProgressText = displayNotification;
                                });
                            }, 1000);
                        };

                        var hideTabFieldsRenderProgressUntillComplete = function () {
                            var foundAnyKendoComponent = !!scope.model.hasAnyKendoComponent();
                            if (foundAnyKendoComponent) {
                                scope.$on("kendoRendered", function (e) {
                                    showContainerContent();
                                });
                                hideContainerContent();
                            }
                        };

                        if (scope.isTabContainer(scope.model) && !scope.model.hasTag('showRenderProgress')) {
                            hideTabFieldsRenderProgressUntillComplete();
                        }

                        if (!scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction(scope, scope.model, iElement);

                        function applyTabIndex(val) {
                            var children = $(iElement).find("input,select,textarea,button,datalist");
                            var tabIndex = val === true ? "-1" : "0";
                            angular.forEach(children, function (c) {
                                $(c).attr("tabIndex", tabIndex);
                            });
                        }

                        if (scope.model.getViewConfig().isReadOnly()) {
                            $timeout(function () {
                                applyTabIndex(true);
                            });
                        }

                        scope.$watch(
                            function () {
                                return scope.model.getViewConfig().isReadOnly();
                            },
                            function (newValue, oldValue) {
                                if (newValue !== oldValue) {
                                    applyTabIndex(newValue);
                                }
                            }
                        );

                        if (scope.isTabContainer) {
                            scope.$watch(
                                "model",
                                function (newValue) {
                                    if (newValue != null) {
                                        scope._isTabContainer = scope.isTabContainer(newValue);
                                    }
                                }
                            );

                            scope.$watch(function(){
                                var tabObj = scope.getTabObj(scope.model);
                                if(tabObj){
                                    return tabObj!=scope.tabGroupSelection[tabObj.tabGroupId];
                                }
                                return false;
                            }, function(isCurrentTab, oldVal){
                                var selectedTabCount = scope.selectedTabCount[scope.model.getPath()]?scope.selectedTabCount[scope.model.getPath()]:0;
                                if(selectedTabCount>1){
                                    showContainerContent();
                                }
                            });
                        }

                        var deltaToMinRequired = scope.supportsMulti() ? scope.model.getViewConfig().getMin() - scope.getMultiSiblingsCount() : 0;

                        if (deltaToMinRequired > 0) {
                            scope.duplicateContainer(deltaToMinRequired, true);
                        }
                    });
                }
            };
        }]);

        module.directive("ehrTabContainerLevel", function () {
            return {
                restrict: "EA",
                scope: true,
                require: ['ehrTabContainerLevel', '^^?ehrForm'],
                controller: function ($scope) {
                    this.selectTab = $scope.selectTab = function (tabObj) {
                        if (tabObj) {
                            $scope.tabGroupSelection[tabObj.tabGroupId] = tabObj;
                            if ($scope.ehrFormCtrl) {
                                $scope.ehrFormCtrl.setSelectTabModelPathId(tabObj.model.getPath(), tabObj.tabGroupId, tabObj.model.getPath());
                            }
                        }
                    };

                },
                link: function (scope, element, attr, controller) {

                    scope.ehrFormCtrl = controller[1];
                    var tabsCtrl = controller[0];
                    var allTabs = [];
                    scope.tabContainerSiblings;

                    scope.selectTabByModel = function (model) {
                        var tabObj = scope.getTabObj(model);
                        if (tabObj) {
                            tabsCtrl.selectTab(tabObj);
                        }
                    };

                    scope.$watch('model', function (newVal) {
                        if (newVal) {
                            scope.tabContainerSiblings = newVal.childModels;
                        } else {
                            scope.tabContainerSiblings = [];
                        }
                    });

                    scope.$watch('tabContainerSiblings', function (newVal) {
                        scope.tabContainerSiblings = newVal;
                        scope.tabGroups = {};
                        allTabs = [];
                        scope.tabGroupSelection = {};
                        if (scope.tabContainerSiblings) {

                            var tabAnnotationName = "tab";
                            var defaultTabAnnotationName = "defaultTab";
                            allTabs = scope.tabContainerSiblings
                                .filter(function (chModel) {
                                    return chModel.hasAnnotation(tabAnnotationName);
                                })
                                .map(function (tabModel) {
                                    var isDefaultTab = tabModel.hasAnnotation(defaultTabAnnotationName);
                                    return {
                                        model: tabModel,
                                        pathId: tabModel.getPath(),
                                        tabGroupId: tabModel.annotationValue(tabAnnotationName),
                                        isDefault: isDefaultTab
                                    };
                                });

                            allTabs.forEach(function (tabObj) {
                                if (!scope.tabGroups[tabObj.tabGroupId]) {
                                    scope.tabGroups[tabObj.tabGroupId] = [];
                                }
                                scope.tabGroups[tabObj.tabGroupId].push(tabObj);
                            });


                            initSelectedTabs(scope.tabGroups);

                        }
                    });

                    var initSelectedTabs = function (tabGroups) {
                        for (var groupId in tabGroups) {

                            var selectTabObj = tabGroups[groupId].filter(function (tabObj) {
                                return tabObj.isDefault;
                            })[0];

                            if (!selectTabObj) {
                                selectTabObj = tabGroups[groupId][0];
                            }
                            var cachedSelectedModelPathId = scope.ehrFormCtrl ? scope.ehrFormCtrl.getSelectedTabModelPathId(scope.model.getPath(), groupId) : null;
                            if (cachedSelectedModelPathId) {
                                var selTO = tabGroups[groupId].filter(function (tabObj) {
                                    return tabObj.model.getPath() == cachedSelectedModelPathId;
                                });
                                if (selTO.length) {
                                    selectTabObj = selTO[0];
                                }
                            }
                            tabsCtrl.selectTab(selectTabObj);
                        }
                    };

                    scope.getTabObj = function (model) {
                        var pathId = model.getPath();
                        return allTabs.filter(function (tabObj) {
                            return tabObj.pathId == pathId;
                        })[0];
                    };

                    scope.isTabContainer = function (model) {
                        return !!scope.getTabObj(model);
                    };

                    scope.getTabGroupArrForModel = function (model) {
                        if (model) {
                            var tabObj = scope.getTabObj(model);
                            if (tabObj) {
                                return scope.tabGroups[tabObj.tabGroupId];
                            }
                        }
                        return [];
                    };

                    scope.isTabObjSelected = function (tabObj) {
                        var ret = scope.tabGroupSelection[tabObj.tabGroupId] === tabObj;
                        if (ret) {
                            scope.ehrFormCtrl.setWasTabSelected(tabObj.model.getPath());
                        }
                        return ret;
                    }
                }
            };
        });

        module.directive("ehrTabContainerTitle", function () {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-tab-container-title.html",
                scope: {
                    tabObj: '=',
                    ehrContext: '='
                },
                require: ['^^ehrTabContainerLevel'],
                link: function (scope, element, attr, controllerArr) {

                    scope.tabsCtrl = controllerArr[0];

                    scope.$watch('tabObj', function (newVal) {
                        scope.label = newVal ? newVal.model.labelFor(scope.ehrContext.language) : '';
                    });

                }
            };
        });

        module.directive("ehrComponentElementSwitch", function () {
            return {
                restrict: "E",
                templateUrl: "thinkehr/f4/templates/ehr-component-element-switch.html"
            };
        });

        module.directive("ehrOtherInput", function () {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-other-input.html"
            };
        });

        module.directive("ehrComponentPlaceholders", function () {
            return {
                restrict: "A",
                scope: false,
                link: function (scope, element) {
                    scope.appendToPositionHolder = function (appendElement, placementConst) {
                        switch (placementConst) {
                            case thinkehr.f4.ng.componentPlacement.POSITION_LABEL_START:
                                $($(".label-start-position-holder", element).get(0)).append(appendElement);
                                break;
                            case thinkehr.f4.ng.componentPlacement.POSITION_LABEL_END:
                                $($(".label-end-position-holder", element).get(0)).append(appendElement);
                                break;
                            case thinkehr.f4.ng.componentPlacement.POSITION_CONTENT_START:
                                $(".content-start-position-holder", element).append(appendElement);
                                break;
                            case thinkehr.f4.ng.componentPlacement.POSITION_CONTENT_END:
                                $(".content-end-position-holder", element).append(appendElement);
                                break;
                        }
                    };

                    scope.appendLabelStart = function (appendElement) {
                        return scope.appendToPositionHolder(appendElement, thinkehr.f4.ng.componentPlacement.POSITION_LABEL_START);
                    };

                    scope.appendLabelEnd = function (appendElement) {
                        return scope.appendToPositionHolder(appendElement, thinkehr.f4.ng.componentPlacement.POSITION_LABEL_END);
                    };

                    scope.appendContentStart = function (appendElement) {
                        return scope.appendToPositionHolder(appendElement, thinkehr.f4.ng.componentPlacement.POSITION_CONTENT_START);
                    };

                    scope.appendContentEnd = function (appendElement) {
                        return scope.appendToPositionHolder(appendElement, thinkehr.f4.ng.componentPlacement.POSITION_CONTENT_END);
                    };

                    scope.getMultiNumberText = function (currMultiPositionNr) {
                        var annVal = scope.model.annotationValue("multiPositionText");
                        if (annVal) {
                            if (annVal.indexOf("[NR]") > 0) {
                                annVal = annVal.replace("[NR]", currMultiPositionNr);
                            } else {
                                annVal = annVal + ' ' + currMultiPositionNr;
                            }
                        } else {
                            annVal = '(' + currMultiPositionNr + ')';
                        }
                        return annVal;
                    }

                }
            };
        });

        module.directive("ehrUnknown", function () {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-unknown.html",
                scope: true,
                controller: function ($scope) {
                }
            };
        });

        module.directive("ehrLabel", function () {
            return {
                restrict: "E",
                templateUrl: "thinkehr/f4/templates/ehr-label.html",
                transclude: true,
                scope: true,
                controller: function ($scope, $element, $attrs) {

                }
            };
        });

        var _ehrListValuesController = function ($scope, EhrContext, EhrLayoutHelper) {
            $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

            $scope.presentation = function () {
                throw new Error("Must override.");
            };

            $scope.otherValue = function (value) {
                return $scope.model.otherValue.apply($scope.model, arguments);
            };

            $scope.list = function () {
                throw new Error("Must override.");
            };

            $scope.otherFieldName = function () {
                throw new Error("Must override.");
            };

            $scope.computeLineClass = function () {
                throw new Error("Must override.");
            };

            $scope.isMulti = function () {
                if ($scope._isMulti == null) {
                    $scope._isMulti = $scope.model.isMulti();
                }
                return $scope._isMulti;
            };

            $scope.isCombo = function () {
                return ($scope.presentation() === thinkehr.f4.FieldPresentation.COMBOBOX && (!$scope.model.getInputFor("code") || !$scope.model.getInputFor("code").terminology)) || ($scope.presentation() === thinkehr.f4.FieldPresentation.TEXTFIELD && $scope.list().length > 0);
            };

            $scope.isRadios = function () {
                return !$scope.isMulti() && $scope.presentation() === thinkehr.f4.FieldPresentation.RADIOS;
            };

            $scope.isCheckboxes = function () {
                return $scope.presentation() === thinkehr.f4.FieldPresentation.RADIOS && $scope.isMulti();
            };

            $scope.getTerminology = function () {
                return $scope.presentation() === thinkehr.f4.FieldPresentation.COMBOBOX && $scope.model.getInputFor("code") && $scope.model.getInputFor("code").getTerminology();
            };

            $scope.listOpen = function () {
                return $scope.model.isListOpen();
            };

            $scope.labelText = function (item) {
                return item.getLabel(EhrContext.language);
            };

            $scope.otherField = function () {
                return $scope.model.getViewConfig().getField("other");
            };

            $scope.codeInput = function () {
                return $scope.model.getInputFor("code");
            };
        };

        var _ehrCodedTextController = function ($scope, EhrContext, EhrLayoutHelper) {
            _ehrListValuesController($scope, EhrContext, EhrLayoutHelper);

            $scope.codeValue = function (value) {
                return arguments.length === 0 ? $scope.model.codeValue() : $scope.model.codeValue(value, EhrContext.language);
            };

            $scope.presentation = function () {
                var present = null;
                if ($scope.codeField() && $scope.codeField().getPresentation()) {
                    present = $scope.codeField().getPresentation();
                }
                var acceptedPresentations = [thinkehr.f4.FieldPresentation.COMBOBOX, thinkehr.f4.FieldPresentation.RADIOS];
                if (acceptedPresentations.indexOf(present) < 0) {
                    present = thinkehr.f4.FieldPresentation.COMBOBOX;
                }
                return present;
            };

            $scope.list = function () {
                return $scope.model.getInputFor("code").getList();
            };

            var uniqueId = $scope.model.getSanitizedUniqueId();
            $scope._codedTextName = EhrLayoutHelper.getFormId($scope) + "_coded_text_" + uniqueId;
            $scope._otherFieldName = EhrLayoutHelper.getFormId($scope) + "_coded_text_other_" + uniqueId;

            $scope.codedTextName = function () {
                return $scope._codedTextName;
            };

            $scope.otherFieldName = function () {
                return $scope._otherFieldName;
            };

            $scope.computeLineClass = function () {
                if (!$scope._ctLineClass) {
                    $scope._ctLineClass = EhrLayoutHelper.computeEhrLineClass($scope.model);
                    if ($scope.model.getRmType() === thinkehr.f4.RmType.DV_CODED_TEXT) {
                        $scope._ctLineClass.push("ehr-coded-text");
                    } else if ($scope.model.getRmType() === thinkehr.f4.RmType.DV_ORDINAL) {
                        $scope._ctLineClass.push("ehr-ordinal");
                    }
                }

                var indexOfReadOnly = $scope._ctLineClass.indexOf("ehr-read-only");
                var readOnly = $scope.model.getViewConfig().isReadOnly();
                if (readOnly && indexOfReadOnly < 0) {
                    $scope._ctLineClass.push("ehr-read-only");
                } else if (!readOnly && indexOfReadOnly > -1) {
                    $scope._ctLineClass.splice(indexOfReadOnly, 1);
                }
                return $scope._ctLineClass;
            };

            $scope.codeField = function () {
                return $scope.model.getViewConfig().getField("code");
            };

        };

        module.directive("ehrCodedText", ["EhrLayoutHelper", "EhrApiServiceFactory", "$timeout", function (EhrLayoutHelper, EhrApiServiceFactory, $timeout) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-coded-text.html",
                scope: true,
                controller: function ($scope) {
                    _ehrCodedTextController($scope, $scope.EhrContext, EhrLayoutHelper);

                    $scope.multiCodedTextName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_multi_coded_text_" + $scope.model.getSanitizedUniqueId();
                    };
                },
                link: function (scope, element) {
                    $timeout(function () {
                        if (!scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction(scope, scope.model, element);
                    }, 0);
                }
            };
        }]);

        module.directive("ehrOrdinal", ["EhrLayoutHelper", "EhrLocalizationHelper", "EhrApiServiceFactory", "$timeout", function (EhrLayoutHelper, EhrLocalizationHelper, EhrApiServiceFactory, $timeout) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-coded-text.html",
                scope: true,
                controller: function ($scope) {
                    _ehrCodedTextController($scope, $scope.EhrContext, EhrLayoutHelper);

                    EhrLocalizationHelper.generateKendoName("ordinal", $scope);

                    $scope.codedTextName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ordinal_" + $scope.model.getSanitizedUniqueId();
                    };

                    $scope.ordinalName = function () {
                        return $scope.codedTextName();
                    };

                    $scope.multiCodedTextName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_multi_ordinal_" + $scope.model.getSanitizedUniqueId();
                    };

                    $scope.displayOrdinalValue = function () {
                        return $scope.model.annotationValue("displayOrdinalValue") === "true";
                    };

                    $scope.labelText = function (item, hideLabel) {
                        if (hideLabel) {
                            return '';
                        }
                        var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                        return $scope.displayOrdinalValue() ? item.ordinal + " " + item.getLabel(language) : item.getLabel(language);
                    };

                    $scope.codeField = function () {
                        return $scope.model.getViewConfig().getField();
                    };
                },
                link: function (scope, element) {
                    $timeout(function () {
                        if (!scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction(scope, scope.model, element);
                    }, 0)
                }
            };
        }]);

        module.directive("ehrCodedTextComponent", ["EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper", '$timeout',
            function (EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper, $timeout) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-coded-text-component.html",
                    scope: true,
                    require: ['ehrCodedTextComponent'],
                    controller: function ($scope) {
                        var ctrl = this;
                        EhrLocalizationHelper.generateKendoName("coded_text", $scope);
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();
                        $scope._otherSelected = $scope.otherValue() != null;
                        $scope.listDSArray = [];
                        $scope._lastFilterString = null;
                        $scope._lastSelectedString = null;
                        $scope.hasFocus = false;
                        $scope.hasErrorMessage = false;
                        $scope.inputLabelValue = '';
                        $scope.multiValuesArr = [];
                        $scope.isTerminologyLoading = false;
                        $scope.inputItemStatus = {
                            loading: thinkehr.f4.InputItem.STATUS_LOADING,
                            notFound: thinkehr.f4.InputItem.STATUS_NOT_FOUND
                        };

                        var ehrLanguage = $scope.EhrContext ? $scope.EhrContext.language : '';

                        var isDropdownList = $scope.model.hasTag('dropdownlist') || $scope.model.hasTag('dropdownList');
                        var isComboBox = $scope.model.hasTag('combobox') || $scope.model.hasTag('comboBox');
                        var isAutocomplete = $scope.model.hasTag('autocomplete') || $scope.model.hasTag('autoComplete');

                        if (isDropdownList) {
                            $scope.filterEnabled = false;
                            $scope.displayOnFocus = true;
                            $scope.displayListArrow = true;
                        } else if (isComboBox) {
                            $scope.filterEnabled = true;
                            $scope.displayOnFocus = false;
                            $scope.displayListArrow = true;
                        } else if (isAutocomplete) {
                            $scope.filterEnabled = true;
                            $scope.displayOnFocus = false;
                            $scope.displayListArrow = false;
                        } else {
                            $scope.filterEnabled = ( $scope.model.hasTag('filterEnabled') || ($scope.model.getInputFor("code") && $scope.model.getInputFor("code").getTerminology()) );
                            $scope.displayOnFocus = $scope.model.hasTag('displayOnFocus') || !$scope.filterEnabled;
                            $scope.displayListArrow = $scope.model.hasTag('displayListArrow') || $scope.displayOnFocus;
                        }

                        if ($scope.displayOnFocus) {
                            $scope.$watch('hasFocus', function (newVal, oldVal) {
                                if (newVal !== oldVal && newVal == true) {
                                    $scope.displayFullItemsList();
                                }
                            });
                        }

                        $scope.addMultiItemEnabled = function () {
                            if ($scope.isMulti()) {
                                var itemsLen = $scope.multiValuesArr ? $scope.multiValuesArr.length : 0;
                                return $scope.model.getMax() == -1 || itemsLen < $scope.model.getMax();
                            }
                            return true;
                        };

                        $scope.minMultiNrDelta = function (createArray) {
                            var retDelta = 0;
                            if ($scope.isMulti()) {
                                var selectedNr = $scope.multiValuesArr ? $scope.multiValuesArr.length : 0;
                                var delta = $scope.model.getMin() - selectedNr;
                                retDelta = delta < 0 ? 0 : delta;
                            }
                            return createArray ? new Array(retDelta) : retDelta;
                        };

                        $scope.$watch(function () {
                            return $scope.showErrorMessage();
                        }, function (msgsObject) {
                            if (msgsObject) {
                                $scope.hasErrorMessage = Object.keys(msgsObject).length > 0;
                            } else {
                                $scope.hasErrorMessage = false;
                            }
                        }, true);

                        $scope.model.addTerminologyItemUpdateListener(function (ev) {
                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            try {
                                //timeout to prevent handler called when digest already in progress
                                setTimeout(function () {
                                    /*//$scope.$apply(function () {
                                     updateLabelFromModel($scope.model.labelValue(language, true));
                                     });*/
                                    updateLabelFromModel($scope.model.labelValue(language, true));
                                    $scope.$digest();
                                }, 0);
                            } catch (e) {
                                updateLabelFromModel($scope.model.labelValue(language, true));
                            }
                        });

                        $scope.getOtherLabel = function () {
                            if ($scope.EhrDictionary) {
                                var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                                return $scope.EhrDictionary.text('other', language);
                            } else {
                                console.warn("$scope.EhrDictionary not defined", this);
                            }
                        };

                        $scope.getInputPlaceholder = function () {
                            var placeholderStr = $scope.model.annotationValue('placeholder');
                            if (placeholderStr == null) {
                                if ($scope.EhrDictionary) {
                                    var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                                    placeholderStr = $scope.getTerminology() ? $scope.EhrDictionary.text('placeholder.terminology', language) : "";
                                } else {
                                    console.warn("$scope.EhrDictionary not defined", this);
                                }
                            }
                            return placeholderStr || "";
                        };

                        $scope.getKendoAutocompleteOptions = function () {
                            var headerTemplString = $scope.model.annotationValue("headerTemplate");
                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            var headerTemplate = headerTemplString ? kendo.template(headerTemplString)({currentFieldLabel: $scope.model.getLocalizedName(language)}) : null;
                            return {
                                headerTemplate: headerTemplate,
                                template: $scope.model.annotationValue("itemTemplate"),
                                ignoreCase: false
                            };
                        };

                        this.setInputLabelValue = function (kendoAutocomplete, labelValue) {
                            kendoAutocomplete.value(labelValue);
                            $scope.inputLabelValue = labelValue;
                        };

                        var updateLabelFromModel = function (labelValueObj) {
                            if (!$scope.hasFocus || (!$scope.isMulti() )) {
                                var kendoAutocomplete = $scope[$scope.kendoName()];
                                if (kendoAutocomplete) {
                                    if ($scope.isMulti()) {
                                        ctrl.setInputLabelValue(kendoAutocomplete, "");
                                    } else {
                                        if (!$scope.otherSelected()) {
                                            var modelLabel = $scope.model.labelValue(ehrLanguage);
                                            ctrl.setInputLabelValue(kendoAutocomplete, modelLabel || '');
                                        } else {
                                            ctrl.setInputLabelValue(kendoAutocomplete, $scope.getOtherLabel() + ' >>');
                                        }
                                    }
                                } else if (!$scope.isMulti()) {
                                    $scope.$watch($scope.kendoName(), function (kendoAutocomplete, oldVal) {
                                        if (kendoAutocomplete !== oldVal) {
                                            if (!$scope.otherSelected()) {
                                                var modelLabel = $scope.model.labelValue(ehrLanguage);
                                                ctrl.setInputLabelValue(kendoAutocomplete, modelLabel || '');
                                            } else {
                                                ctrl.setInputLabelValue(kendoAutocomplete, $scope.getOtherLabel() + ' >>');
                                            }
                                        }
                                    })
                                }
                            }

                            if ($scope.isMulti()) {
                                if (!labelValueObj) {
                                    labelValueObj = $scope.model.labelValue(ehrLanguage, true);
                                }
                                $scope.multiValuesArr = labelValueObj;
                            }
                        };

                        $scope.toLabelValuesArr = function () {
                            var labelsArr = [];
                            if ($scope.isMulti()) {
                                labelsArr = $scope.multiValuesArr.map(function (lblObj) {
                                    return lblObj.label;
                                });
                            } else {
                                var labelValue = $scope.model.labelValue(ehrLanguage, false);
                                labelsArr = labelValue ? [labelValue] : [];
                            }
                            return labelsArr;
                        };

                        $scope.$watch(function () {
                            return $scope._otherSelected;
                        }, function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                updateLabelFromModel();
                            }
                        });

                        $scope.$watch(function () {
                            return $scope.otherValue();
                        }, function (newValue) {
                            //$scope._otherSelected = newValue !== undefined && $scope.codeValue()==thinkehr.f4.InputItem.OTHER_VALUE;
                            $scope.otherSelected(newValue !== undefined && $scope.codeValue() == thinkehr.f4.InputItem.OTHER_VALUE);
                        });


                        var language = $scope.EhrContext ? $scope.EhrContext.language : '';
                        if (!$scope.isMulti()) {
                            $scope.$watch(function () {
                                return $scope.model.labelValue(language);
                            }, function (newVal, oldVal) {
                                updateLabelFromModel();
                            });
                        } else {
                            $scope.$watch(function () {
                                return $scope.model.labelValue(language, true);
                            }, function (newVal, oldVal) {
                                if (newVal !== oldVal) {
                                    updateLabelFromModel(newVal);
                                }
                            }, true);

                        }
                        $scope.model.onModelRefreshed(function () {
                            updateLabelFromModel();
                        });
                        $timeout(function () {
                            //kando is not ready yet - hence the timeout

                            updateLabelFromModel();
                        }, 100);


                        $scope.$watch('EhrContext.language', function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                $scope.listDSArray = itemsToDSArray($scope.codeInput().getList(), $scope._lastFilterString);
                            }
                        });

                        $scope.list = function () {
                            return $scope.listDSArray;
                        };

                        $scope.clearListKeepSelected = function () {
                            if (!$scope.isMulti()) {
                                var selectedItem = $scope.codeInput().findInputItemByValue($scope.codeValue());
                                var newList = [];
                                if (selectedItem) {
                                    newList.push(selectedItem);
                                }
                                $scope.codeInput().setList(newList, true);
                            } else {
                                $scope.codeInput().setList([], true);
                            }

                        };

                        $scope.otherSelected = function (selected) {
                            if (selected !== undefined) {
                                $scope._otherSelected = selected;
                            }
                            return $scope._otherSelected;
                        };

                        $scope.minValueRequired = function () {
                            return $scope.isMulti() && $scope.model.isRequired();
                        }

                        $scope.codeValueRequired = function () {
                            if (!$scope.isMulti()) {
                                return !$scope.model.codeValue() && $scope.model.isRequired() && !$scope.otherSelected();
                            } else {
                                if ($scope.model.isRequired()) {
                                    return !($scope.otherValue() || $scope.codeValue().length)
                                }
                                return false;
                            }

                        };

                        $scope.otherRequired = function () {
                            if ($scope.isMulti()) {
                                return $scope.codeValueRequired();
                            } else {
                                return $scope.model.isRequired() && $scope.otherSelected();
                            }
                        };

                        $scope.codeValue = function (value) {
                            if (value === thinkehr.f4.InputItem.OTHER_VALUE) {
                                $scope.otherSelected(true);
                                $scope.otherValue("");
                                return thinkehr.f4.InputItem.OTHER_VALUE;
                            } else if (arguments.length === 0 && $scope.otherSelected() && !$scope.isMulti()) {
                                return thinkehr.f4.InputItem.OTHER_VALUE;
                            } else if (arguments.length > 0 || value === undefined) {
                                $scope.otherSelected(false);
                            }

                            if ($scope.isMulti() && arguments.length !== 0 && value) {
                                $scope.model.codeValue(value);
                            }

                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            var ret = arguments.length === 0 || $scope.isMulti() ? $scope.model.codeValue() : $scope.model.codeValue(value, language);
                            if (arguments.length) {
                                var kendoAutocomplete = $scope[$scope.kendoName()];
                                if (kendoAutocomplete && $scope.hasFocus) {
                                    kendoAutocomplete.select(null);
                                    var kendoVal = $scope.isMulti() ? '' : $scope.model.labelValue(language);
                                    ctrl.setInputLabelValue(kendoAutocomplete, kendoVal);
                                }
                            }
                            //console.log("CVALUE called",ret);
                            return ret;
                        };

                        $scope.removeCodeValue = function (codeValue) {
                            var formInputs = $scope.ehrFormInputs ? $scope.ehrFormInputs() : [];
                            if (codeValue == thinkehr.f4.InputItem.OTHER_VALUE) {
                                $scope.model.removeOtherValue();
                            } else {
                                $scope.model.removeValue(codeValue);
                                $scope.listDSArray = itemsToDSArray($scope.codeInput().getList(), $scope._lastFilterString);
                                if (!formInputs.length) {
                                    formInputs.push($scope.ehrFormInput());
                                }
                            }

                            formInputs.forEach(function (input) {
                                input.$setTouched();
                                input.$setDirty();
                            });
                        };


                        $scope.$watch(function () {
                            return $scope.codeInput().getList();
                        }, function (newValue) {

                            $scope.listDSArray = itemsToDSArray(newValue, $scope._lastFilterString);
                            //Kendo sets data later so timeout is needed
                            $timeout(function () {
                                resetAutocompleteFilter();
                            });
                        });

                        var getSelectedItemsIndexInArray = function (itemsList) {
                            var selectedIndexes = [];
                            if ($scope.isMulti()) {
                                var selectedArr = $scope.codeValue();
                                for (var i = 0; i < itemsList.length; i++) {
                                    var itm = itemsList[i];
                                    if (selectedArr.indexOf(itm.value) > -1) {
                                        selectedIndexes.push(i);
                                    }
                                }
                            }
                            return selectedIndexes;
                        };

                        var itemsToDSArray = function (modelList, filterStr) {
                            var updatedList = null;
                            if (modelList) {
                                updatedList = [];
                                modelList.forEach(function (listItem) {
                                    updatedList.push({value: listItem.getValue(), label: $scope.labelText(listItem)});
                                });
                            }

                            if (!updatedList) {
                                updatedList = [];
                            }

                            if ($scope.listOpen() && !$scope.isMulti()) {
                                updatedList.unshift({
                                    value: thinkehr.f4.InputItem.OTHER_VALUE,
                                    label: $scope.getOtherLabel() + ' >>'
                                });
                            }
                            updatedList.unshift({value: '', label: ''});
                            if (filterStr == null) {
                                filterStr = '';
                            }
                            /*var itemsFilterConfig = {
                             "logic": "and",
                             "filters": [
                             {
                             "value": filterStr,
                             "operator": "contains",
                             "field": "label",
                             "ignoreCase": true
                             }
                             ]
                             };*/

                            removeSelectedItemsFromList(updatedList);
                            var ds = new kendo.data.DataSource({
                                data: updatedList,
                                serverFiltering: true,
                                serverPaging: true,
                                serverGrouping: true,
                                serverSorting: true,
                                serverAggregates: true
                                //,filter: itemsFilterConfig
                            });
                            ds.filter(filterStr);
                            return ds;
                        };

                        function removeSelectedItemsFromList(itemsList) {
                            getSelectedItemsIndexInArray(itemsList).reverse().forEach(function (index) {
                                itemsList.splice(index, 1);
                            });
                        }

                        $scope.onChanged = function (e) {
                            var kendoAutocomplete = e.sender;
                            var codeVal = null;
                            var labelVal = null;
                            var selectedItems = kendoAutocomplete.listView.selectedDataItems();
                            if (selectedItems && selectedItems.length == 1) {
                                codeVal = selectedItems && selectedItems.length ? selectedItems[0].value : null;
                            } else if (selectedItems.length > 1) {
                                console.warn("Kendo autocomplete has " + selectedItems.length + " selected items!")
                            } else {
                                return;
                            }
                            //console.log("CHANGED",codeVal, labelVal);
                            /*$scope.$apply(function () {
                             if (codeVal) {
                             var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                             $scope.codeValue(codeVal, language);
                             } else {
                             $scope.codeValue(null);
                             }

                             $scope.listDSArray = itemsToDSArray($scope.codeInput().getList(), $scope._lastFilterString);
                             });*/
                            var updateScope = function () {
                                if (codeVal) {
                                    var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                                    $scope.codeValue(codeVal, language);
                                } else {
                                    $scope.codeValue(null);
                                }

                                $scope.listDSArray = itemsToDSArray($scope.codeInput().getList(), $scope._lastFilterString);
                            };
                            updateScope();
                            $scope.$digest();

                        };

                        $scope.onBlur = function (e) {
                            //console.log("BLUR");
                            if ($scope.getTerminology()) {
                                $scope.clearListKeepSelected();
                                //clearListKeepSelected async. updates $scope.listDSArray and it can take longer so updateLabelFromModel is wrapped inside timeout
                                $timeout(function () {
                                    updateLabelFromModel();
                                    $scope._lastFilterString = null;
                                });
                            }
                        };

                        $scope.onClose = function (e) {
                            //console.log("CLOSE");
                            //if selecting same item onChanged is not fired so reselect it here
                            if (e) {
                                var selectedItems = e.sender.listView.selectedDataItems();
                                if (selectedItems && selectedItems.length) {
                                    $scope.onChanged(e);
                                }
                            }
                            $scope.$apply(function () {
                                updateLabelFromModel();
                                $scope._lastFilterString = '';
                            });
                        };


                        var resetAutocompleteFilter = function () {
                            if ($scope.getTerminology()) {
                                var kendoAutocomplete = $scope[$scope.kendoName()];
                                if (kendoAutocomplete && $scope.hasFocus) {
                                    kendoAutocomplete.search($scope._lastFilterString);
                                }
                            }

                        };
                    },

                    link: function ($scope, element, attr, controllers) {
                        var ctrl = controllers[0];
                        var _defaultFilterString = "";

                        $scope.setDefaultFilterString = function (filterStr) {
                            _defaultFilterString = filterStr ? filterStr : "";
                        };

                        $scope.displayFullItemsList = function () {
                            if ($scope.model.getViewConfig().isReadOnly()) {
                                return;
                            }
                            if (!$scope.hasFocus) {
                                $('.ehr-autocomplete.ehr-text-input', element).focus();
                            }
                            $scope.codeInput().getTerminologyItemsWithLabel({
                                query: _defaultFilterString,
                                force: true
                            }, function () {
                                $timeout(function () {
                                    var kendoAutoCompleteComp = $scope[$scope.kendoName()];
                                    kendoAutoCompleteComp.search(_defaultFilterString);
                                });
                            });
                        };

                        $scope.onFilter = function (e) {
                            var filterString = e.filter.value.trim();
                            if (!filterString) {
                                filterString = _defaultFilterString;
                            }
                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            if ($scope.getTerminology()) {
                                //TODO remove string check - create codeValue check instead
                                if (!$scope.isMulti() && $scope.model.labelValue(language) && filterString && $scope.model.labelValue(language).trim() != filterString.trim()) {
                                    $scope.model.clearValue();
                                    //reset value only on kendo input
                                    $timeout(function () {
                                        var kendoAutocomplete = $scope[$scope.kendoName()];
                                        ctrl.setInputLabelValue(kendoAutocomplete, filterString);
                                    })
                                } else if (!$scope.isMulti() && !filterString) {
                                    $scope.model.clearValue();
                                }
                                if (filterString != null) {
                                    var selectedLabel = $scope.model.labelValue(language);
                                    var filterStringAlreadySelected = selectedLabel ? selectedLabel == filterString : false;

                                    if (filterString !== $scope._lastFilterString && !filterStringAlreadySelected) {
                                        $scope.isTerminologyLoading = true;
                                        $scope._lastFilterString = filterString;
                                        $scope.codeInput().getTerminologyItemsWithLabel({
                                            query: filterString,
                                            force: true
                                        }, function (resArr, resForFilterString) {
                                            $scope.isTerminologyLoading = false;
                                            try {
                                                //timeout to prevent handler called when digest already in progress
                                                setTimeout(function () {
                                                    $scope.$digest();
                                                }, 0);
                                            } catch (e) {
                                            }
                                        });
                                    }
                                }
                            } else {
                                if (!$scope.isMulti()) {
                                    var modelLabelVal = $scope.model.labelValue(language);
                                    var doLabelsMatch = (modelLabelVal && filterString != modelLabelVal);
                                    if (!filterString || doLabelsMatch) {
                                        $scope.model.clearValue();
                                    }
                                    if (filterString != modelLabelVal) {
                                        $timeout(function () {
                                            var kendoAutocomplete = $scope[$scope.kendoName()];
                                            ctrl.setInputLabelValue(kendoAutocomplete, filterString);
                                        }, 0);
                                    }
                                }
                            }
                        };

                        EhrDepsHelper.processModelDeps($scope, function () {
                            var codeValues = $scope.codeValue();
                            if (thinkehr.f4.util.isArray(codeValues)) {
                                codeValues = codeValues.join(',');
                            }
                            codeValues += $scope.otherValue();
                            return EhrDepsHelper.depsValueFactory(codeValues);
                        }, false, true);

                        $scope.hasValidation = function () {
                            return true;
                        };

                        if ($scope.hasValidation()) {
                            if (!$scope.listOpen()) {
                                EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                    $scope.codedTextName()));
                            } else {
                                EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, [$scope.codedTextName(), $scope.otherFieldName()]);
                            }
                        }
                    }
                };
            }]);

        module.directive("ehrCodedTextRadio", ["EhrLayoutHelper", "EhrValidationHelper", "EhrDepsHelper", "EhrApiServiceFactory",
            function (EhrLayoutHelper, EhrValidationHelper, EhrDepsHelper, EhrApiServiceFactory) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-coded-text-radio.html",
                    scope: true,
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.codeValue = function (value) {
                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            return arguments.length === 0 ? $scope.model.codeValue() : $scope.model.codeValue(value, language);
                        };

                        // This is an immediately executed function that assigns to an integer property because the distributeColumns() function returns a
                        // different instance of an array every time, which CAN cause a $digest cycle loop
                        $scope.columns = function () {
                            var model = $scope.model;
                            var cols = 1;
                            var codeFieldSettings = $scope.codeField();
                            if (codeFieldSettings && codeFieldSettings.getPresentation() === thinkehr.f4.FieldPresentation.RADIOS) {
                                cols = codeFieldSettings.getColumns();
                            }

                            if (cols < 1) {
                                cols = 1;
                            }

                            var elements = model.getInputFor("code").getList().length;
                            return EhrLayoutHelper.distributeColumns(cols, elements);
                        }();

                        $scope.columnWidthPercentage = function () {

                            return EhrLayoutHelper.columnWidthPercentage($scope.model.getViewConfig(), $scope.columns.length);
                        };

                        $scope.elementStyle = function () {
                            var colWidthPer = $scope.columnWidthPercentage();
                            if (colWidthPer != "auto") {
                                var widthRelativeNr = parseInt(colWidthPer);
                                if (!isNaN(widthRelativeNr)) {
                                    var marginRightNr = 10;
                                    colWidthPer = (widthRelativeNr - marginRightNr) + '%';

                                    return {
                                        width: colWidthPer,
                                        "margin-right": marginRightNr + '%'
                                    }
                                }
                                return {
                                    width: colWidthPer
                                };
                            }
                            return {};
                        };

                        $scope.anySelectedInColumn = function (columnItems) {
                            return columnItems.some(function (itemIndex) {
                                return $scope.list()[itemIndex].getValue() == $scope.codeValue();
                            });
                        }
                    },

                    link: function ($scope, element) {

                        EhrDepsHelper.processModelDeps($scope, function () {
                            var codeValues = $scope.codeValue();
                            if (thinkehr.f4.util.isArray(codeValues)) {
                                codeValues = codeValues.join(',');
                            }
                            codeValues += $scope.otherValue();
                            return EhrDepsHelper.depsValueFactory(codeValues);
                        }, false, true);

                        $scope.hasValidation = function () {
                            return $scope.model.isRequired();
                        };

                        if ($scope.hasValidation()) {
                            if (!$scope.listOpen()) {

                                EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                    "ehr_rb_group_" + $scope.codedTextName()));
                                $scope.radioRequired = function () {
                                    return $scope.model.isRequired();
                                };
                                $scope.otherRequired = function () {
                                    return false;
                                };
                            } else {
                                EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, ["ehr_rb_group_" + $scope.codedTextName(), $scope.otherFieldName()]);
                                $scope.radioRequired = function () {
                                    if ($scope.model.isRequired()) {
                                        var ov = $scope.otherValue();
                                        return !ov || ov.length == 0;
                                    }

                                    return false;
                                };

                                $scope.otherRequired = function () {
                                    if ($scope.model.isRequired()) {
                                        var cv = $scope.codeValue();
                                        return !cv || cv.length == 0;
                                    }

                                    return false;
                                };
                            }

                            $scope._onRbFormInput = function (f) {
                                var ehrFormInput = $scope.ehrFormInput ? $scope.ehrFormInput() : $scope.ehrFormInputs ? $scope.ehrFormInputs()[0] : null;
                                if (ehrFormInput) {
                                    f.call(null, ehrFormInput);
                                }
                            };

                            $scope._onOtherFormInput = function (f) {
                                if ($scope.listOpen()) {
                                    var ehrOtherInput = $scope.ehrFormInputs()[1];
                                    if (ehrOtherInput) {
                                        f.call(null, ehrOtherInput);
                                    }
                                }
                            };

                            $scope.rbClicked = function () {
                                if (angular.isUndefined($scope._dirty)) {
                                    var rbs = $(element).find("input[type='radio'].ehr-radio");
                                    $(rbs).removeClass("ng-pristine");
                                    $(rbs).addClass("ng-dirty");
                                    $scope._dirty = true;
                                    $scope._onRbFormInput(function (formInput) {
                                        formInput.$setDirty();
                                    });
                                    $scope._onOtherFormInput(function (otherInput) {
                                        if (!otherInput.$dirty) {
                                            otherInput.$setDirty();
                                        }
                                    });
                                }
                            };

                            $scope.rbBlurred = function () {
                                if (angular.isUndefined($scope._touched)) {
                                    var rbs = $(element).find("input[type='radio'].ehr-radio");
                                    $(rbs).removeClass("ng-untouched");
                                    $(rbs).addClass("ng-touched");
                                    $scope._touched = true;
                                    $scope._onRbFormInput(function (formInput) {
                                        formInput.$setTouched();
                                    });
                                    $scope._onOtherFormInput(function (otherInput) {
                                        if (!otherInput.$touched) {
                                            otherInput.$setTouched();
                                        }
                                    });
                                }
                            };

                            if ($scope.listOpen()) {
                                $scope.$watchGroup(
                                    [
                                        function (scope) {
                                            var ehrOtherInput = scope.ehrFormInputs()[1];
                                            if (ehrOtherInput) {
                                                return ehrOtherInput.$dirty;
                                            }

                                            return null;
                                        },
                                        function (scope) {
                                            var ehrOtherInput = scope.ehrFormInputs()[1];
                                            if (ehrOtherInput) {
                                                return ehrOtherInput.$touched;
                                            }

                                            return null;
                                        }
                                    ],
                                    function (newValue) {
                                        if (newValue[0]) {
                                            $scope._onOtherFormInput(function () {
                                                $scope.rbClicked();
                                            });
                                        }
                                        if (newValue[1]) {
                                            $scope._onOtherFormInput(function () {
                                                $scope.rbBlurred();
                                            });
                                        }
                                    }
                                );
                            }
                        }
                    }
                };
            }]);

        module.directive("ehrCodedTextCheckboxes", ["EhrLayoutHelper", "EhrValidationHelper", "EhrApiServiceFactory",
            function (EhrLayoutHelper, EhrValidationHelper, EhrApiServiceFactory) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-coded-text-checkboxes.html",
                    scope: true,
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.codeValue = function (value) {
                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            return arguments.length === 0 ? $scope.model.codeValue() : $scope.model.codeValue(value, language);
                        };

                        $scope.multiCodedTextNameFor = function (itemIndex) {
                            return $scope.multiCodedTextName() + "_" + $scope.list()[itemIndex].getValue();
                        };

                        $scope.multiCodedTextIdFor = function (itemIndex) {
                            return $scope.multiCodedTextNameFor(itemIndex) + "_id";
                        };

                        $scope.codedTextFormGroupName = function () {
                            if (!$scope._codedTextFormGroupName) {
                                $scope._codedTextFormGroupName = "ehr_coded_text_form_group_" + thinkehr.f4.util.guid("_");
                            }

                            return $scope._codedTextFormGroupName;
                        };

                        // This is an immediately executed function that assigns to an integer property because the distributeColumns() function returns a
                        // different instance of an array every time, which CAN cause a $digest cycle loop
                        $scope.columns = function () {
                            var model = $scope.model;
                            var cols = 1;

                            var codeFieldSettings = $scope.codeField();
                            if (codeFieldSettings && codeFieldSettings.getPresentation() === thinkehr.f4.FieldPresentation.RADIOS) {
                                cols = codeFieldSettings.getColumns();
                            }

                            if (model.hasAnnotation("columns")) {
                                cols = parseInt(model.annotationValue("columns"));
                            }

                            if (cols < 1) {
                                cols = 1;
                            }

                            if (!angular.isNumber(cols) || cols < 1) {
                                cols = 1;
                            }

                            var elements = model.getInputFor("code").getList().length;

                            return EhrLayoutHelper.distributeColumns(cols, elements);
                        }();

                        $scope.columnWidthPercentage = function () {
                            return EhrLayoutHelper.columnWidthPercentage($scope.model.getViewConfig(), $scope.columns.length);
                        };

                        $scope.elementStyle = function () {
                            var colWidthPer = $scope.columnWidthPercentage();
                            if (colWidthPer != "auto") {
                                var widthRelativeNr = parseInt(colWidthPer);
                                if (!isNaN(widthRelativeNr)) {
                                    var marginRightNr = 10;
                                    colWidthPer = (widthRelativeNr - marginRightNr) + '%';

                                    return {
                                        width: colWidthPer,
                                        "margin-right": marginRightNr + '%'
                                    }
                                }
                                return {
                                    width: colWidthPer
                                };
                            }
                            return {};
                        };

                        $scope.multiValues = {};

                        this.generateMultiValueArray = function () {
                            for (var prop in $scope.multiValues) {
                                if ($scope.multiValues.hasOwnProperty(prop)) {
                                    delete $scope.multiValues[prop];
                                }
                            }

                            var codeValuesSelected = $scope.model.codeValue();
                            for (var i = 0; i < $scope.list().length; i++) {
                                var item = $scope.list()[i];
                                $scope.multiValues[item.getValue()] = {
                                    checked: (codeValuesSelected.indexOf(item.getValue()) > -1),
                                    index: i
                                };
                            }
                        };

                        this.generateMultiValueArray();

                        $scope.valueToggled = function (code) {
                            var valObject = $scope.model.findValueObjectByCode(code);
                            if (valObject) {
                                $scope.model.removeValue(code);
                            } else {
                                var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                                $scope.model.addValue(code, language);
                            }
                        };

                        var ctrl = this;
                        $scope.model.onModelRefreshed(function () {
                            ctrl.generateMultiValueArray();
                        });

                        $scope.$watchCollection(function () {
                            return $scope.codeValue();
                        }, function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                ctrl.generateMultiValueArray(true);
                            }
                        });
                        $scope.hasSelectionsNrValidation = function () {
                            var max = $scope.model.getMax();
                            var ret = (max != null && max > 0);
                            if (ret === false) {
                                var min = $scope.model.getMin();
                                ret = (min != null && min > 0);
                            }
                            return ret;
                        };

                        $scope.anySelectedInColumn = function (column) {
                            return column.some(function (itemIndex) {
                                return $scope.multiValues[$scope.list()[itemIndex].getValue()].checked;
                            });
                        }
                    },

                    link: function ($scope) {

                        $scope.checkBoxGroupRequired = function () {
                            return $scope.model.isRequired();
                        };

                        $scope.hasValidation = function () {
                            return $scope.checkBoxGroupRequired() || $scope.hasSelectionsNrValidation();
                        };

                        $scope._cbAction = function () {
                            if ($scope.hasValidation()) {
                                var fgInput = $scope.ehrCbFormGroupInput();
                                if (fgInput && !fgInput.$dirty) {
                                    fgInput.$setDirty();
                                }
                            }
                        };

                        $scope.cbClicked = function () {
                            $scope._cbAction();
                        };

                        $scope.cbBlurred = function () {
                            // Need to set dirty here instead of $touched, since ng-form doesn't support the $touched flag
                            $scope._cbAction();
                        };

                        if ($scope.hasValidation()) {

                            $scope.ehrCbFormGroupInput = function () {
                                EhrValidationHelper.ehrFormInput($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                    $scope.codedTextFormGroupName()), "_formCbGroupInput");
                                return $scope["_formCbGroupInput"];
                            };

                            $scope.showErrorMessage = function () {
                                return EhrValidationHelper.showErrorMessage($scope, $scope.ehrCbFormGroupInput());
                            };

                            $scope.checkBoxGroupValid = function () {
                                return $scope.ehrCbFormGroupInput().$valid;
                            };

                            if ($scope.listOpen()) {
                                var chain = $scope.model.getElementNameChain();
                                chain.pop();
                                chain.push($scope.codedTextFormGroupName());
                                chain.push($scope.otherFieldName());

                                EhrValidationHelper.ehrFormInput($scope, chain, "_formCbGroupOtherInput");

                                $scope.ehrCbFormGroupOtherInput = function () {
                                    return $scope["_formCbGroupOtherInput"] || EhrValidationHelper.ehrFormInput($scope, chain, "_formCbGroupOtherInput");
                                };

                                $scope.$watchGroup(
                                    [
                                        function (scope) {
                                            var i = scope.ehrCbFormGroupOtherInput();
                                            return i ? i.$touched : null;
                                        },
                                        function (scope) {
                                            var i = scope.ehrCbFormGroupOtherInput();
                                            return i ? i.$dirty : null;
                                        }
                                    ],
                                    function (newValue) {
                                        if (newValue[0] || newValue[1]) {
                                            $scope.ehrCbFormGroupInput().$setDirty();
                                        }
                                    }
                                );
                            }

                            if ($scope.checkBoxGroupRequired()) {
                                $scope._haveSelection = function () {
                                    var val = $scope.model.getValue();
                                    var valLen = angular.isArray(val) ? val.length : 0;
                                    return valLen > 0;
                                };

                                var validityValue = $scope._haveSelection();

                                $scope.ehrCbFormGroupInput().$setValidity("required", validityValue);

                                $scope.$watch(
                                    $scope._haveSelection,
                                    function (newValue) {
                                        $scope.ehrCbFormGroupInput().$setValidity("required", newValue);
                                    }
                                );

                                if ($scope.listOpen()) {
                                    $scope.otherRequired = function () {
                                        return !$scope._haveSelection();
                                    }
                                }
                            }

                            if ($scope.hasSelectionsNrValidation() && $scope.ehrCbFormGroupInput()) {
                                var isSelectionsNrValid = function () {
                                    var selectedLen = $scope.codeValue().length;
                                    if ($scope.listOpen() && !!$scope.otherValue()) {
                                        selectedLen++;
                                    }
                                    $scope.numberOfSelectionsMin = $scope.model.getMin() || 0;
                                    $scope.numberOfSelectionsMax = $scope.model.getMax();
                                    var ret = $scope.numberOfSelectionsMax < 1 || selectedLen <= $scope.numberOfSelectionsMax;
                                    if (ret === true) {
                                        ret = $scope.numberOfSelectionsMin <= selectedLen;
                                    }
                                    return ret;
                                };

                                $scope.ehrCbFormGroupInput().$setValidity("numberOfSelectionsInvalid", isSelectionsNrValid());


                                $scope.$watch(
                                    function () {
                                        return isSelectionsNrValid();
                                    },
                                    function (newValue) {
                                        $scope.ehrCbFormGroupInput().$setValidity("numberOfSelectionsInvalid", newValue);
                                    }
                                );
                            }
                        }
                    }
                };
            }]);

        module.directive('ehrNgMin', ["EhrNgUtil", function (EhrNgUtil) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elem, attr, ngModelController) {

                    var ehrNgMin = scope.$eval(attr["ehrNgMin"]);
                    var min = angular.isDefined(ehrNgMin) ? ehrNgMin : null;
                    var minOp = scope.$eval(attr["ehrNgMinOp"]) || ">=";
                    var listen = angular.isDefined(attr["ehrNgMinListen"]) ? scope.$eval(attr["ehrNgMinListen"]) : true;

                    scope.$watch(attr["ehrNgMin"], function () {
                        ngModelController.$setViewValue(ngModelController.$viewValue);
                    });

                    if (listen) {
                        scope.$watch("minValue", function (newValue, oldValue) {
                            if (newValue !== oldValue) {

                                min = newValue;
                                if (min !== null) {
                                    minValidator(ngModelController.$modelValue);
                                }
                            }
                        });

                        scope.$watch("minValueOp", function (newValue, oldValue) {
                            if (newValue !== oldValue) {

                                minOp = newValue;
                                if (min !== null) {
                                    minValidator(ngModelController.$modelValue);
                                }
                            }
                        });
                    }

                    if (min !== null) {
                        var minValidator = function (value) {
                            if (!EhrNgUtil.isEmpty(value)) {

                                var cmpResult;
                                if (minOp === ">=") {
                                    cmpResult = value >= min;
                                } else if (minOp === ">") {
                                    cmpResult = value > min;
                                } else if (minOp === "<=") {
                                    cmpResult = value <= min;
                                } else if (minOp === "<") {
                                    cmpResult = value < min;
                                } else if (minOp === "=" || minOp === "==") {
                                    cmpResult = value == min;
                                } else {
                                    console.warn("Unknown min operator", minOp);
                                    cmpResult = false;
                                }

                                ngModelController.$setValidity('min', cmpResult);
                                return cmpResult || ngModelController.$options["allowInvalid"] ? value : undefined;
                            } else {
                                ngModelController.$setValidity('min', true);
                                return value;
                            }
                        };


                        ngModelController.$parsers.push(minValidator);
                        ngModelController.$formatters.push(minValidator);
                    }
                }
            };
        }]);

        module.directive('ehrNgMax', ["EhrNgUtil", function (EhrNgUtil) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elem, attr, ngModelController) {

                    var ehrNgMax = scope.$eval(attr["ehrNgMax"]);
                    var max = angular.isDefined(ehrNgMax) ? ehrNgMax : null;
                    var maxOp = scope.$eval(attr["ehrNgMaxOp"]) || "<=";
                    var listen = angular.isDefined(attr["ehrNgMaxListen"]) ? scope.$eval(attr["ehrNgMaxListen"]) : true;

                    scope.$watch(attr["ehrNgMax"], function () {
                        ngModelController.$setViewValue(ngModelController.$viewValue);
                    });

                    if (listen) {
                        scope.$watch("maxValue", function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                max = newValue;
                                if (max !== null) {
                                    maxValidator(ngModelController.$modelValue);
                                }
                            }
                        });

                        scope.$watch("maxValueOp", function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                maxOp = newValue;
                                if (max !== null) {
                                    maxValidator(ngModelController.$modelValue);
                                }
                            }
                        });
                    }

                    if (max !== null) {
                        var maxValidator = function (value) {
                            if (!EhrNgUtil.isEmpty(value)) {

                                var cmpResult;
                                if (maxOp === "<=") {
                                    cmpResult = value <= max;
                                } else if (maxOp === "<") {
                                    cmpResult = value < max;
                                } else if (maxOp === ">=") {
                                    cmpResult = value >= max;
                                } else if (maxOp === ">") {
                                    cmpResult = value > max;
                                } else if (maxOp === "=" || maxOp === "==") {
                                    cmpResult = value == max;
                                } else {
                                    console.warn("Unknown max operator", maxOp);
                                    cmpResult = false;
                                }

                                ngModelController.$setValidity('max', cmpResult);
                                return cmpResult || ngModelController.$options["allowInvalid"] ? value : undefined;
                            } else {
                                ngModelController.$setValidity('max', true);
                                return value;
                            }
                        };

                        ngModelController.$parsers.push(maxValidator);
                        ngModelController.$formatters.push(maxValidator);
                    }
                }
            };
        }]);

        module.directive('ehrTerminologyCodeExistsValidator', ["EhrNgUtil", "$http", '$q', '$timeout', function (EhrNgUtil, $http, $q, $timeout) {
            return {
                restrict: 'A',
                require: ['ehrTerminologyCodeExistsValidator', 'ngModel'],
                controller: function ($scope) {
                    var checkedCodeResults = {};
                    var codeLoadingDefers = {};

                    var ctrl = this;

                    var loadFromTerminologyService = function (codeVal) {
                        $scope.validatedCodeValue = codeVal;
                        if (codeLoadingDefers[codeVal].length == 1) {
                            $scope.EhrContext.getTerminologyItem($scope.codeInput().getTerminology(), codeVal, null, function (resItem) {
                                if (resItem && resItem.code == codeVal) {
                                    checkedCodeResults[codeVal] = true;
                                    codeLoadingDefers[codeVal].forEach(function (defr) {
                                        defr.resolve();
                                    });

                                } else {
                                    checkedCodeResults[codeVal] = false;
                                    codeLoadingDefers[codeVal].forEach(function (defr) {
                                        ctrl.toDirty();
                                        defr.reject();
                                    });
                                }
                            }.bind(this));
                        }
                    };

                    this.checkIfExists = function (code, deferred) {

                        if (checkedCodeResults[code] != null) {
                            if (checkedCodeResults[code]) {
                                deferred.resolve();
                            } else {
                                ctrl.toDirty();
                                deferred.reject();
                            }
                        } else {
                            if (!codeLoadingDefers[code]) {
                                codeLoadingDefers[code] = [];
                            }
                            codeLoadingDefers[code].push(deferred);
                            loadFromTerminologyService(code);
                        }
                    };


                },
                link: function (scope, elem, attr, ctrlArr) {
                    var thisCtrl = ctrlArr[0];
                    var ngModel = ctrlArr[1];

                    thisCtrl.toDirty = function () {
                        $timeout(function () {
                            ngModel.$setDirty();
                        });
                    };

                    if (scope.getTerminology()) {
                        if (!scope.isMulti()) {

                            scope.$watch(function () {
                                return scope.model.codeValue();
                            }, function (newVal, oldVal) {
                                if (newVal !== oldVal) {
                                    ngModel.$validate();
                                }
                            });

                            ngModel.$asyncValidators.terminologyCodeExistsValidator = function () {

                                var deferred = $q.defer();
                                if (scope.otherSelected()) {
                                    deferred.resolve();
                                } else {
                                    var codeVal = scope.codeValue();
                                    console.log("CHECK=",codeVal)
                                    if (scope.EhrContext.getTerminologyItem && codeVal && scope.codeInput().getTerminology()) {
                                        thisCtrl.checkIfExists(codeVal, deferred);
                                    } else {
                                        if (!codeVal) {
                                            deferred.resolve();
                                        } else if (!scope.EhrContext.getTerminologyItem) {
                                            thisCtrl.toDirty();
                                            deferred.reject();
                                        } else if (!scope.codeInput().getTerminology()) {
                                            thisCtrl.toDirty();
                                            deferred.reject();
                                        } else {
                                            deferred.resolve();
                                        }

                                    }
                                }

                                return deferred.promise;
                            };
                        } else {
                            scope.$watch(function () {
                                return scope.multiValuesArr;
                            }, function (newVal, oldVal) {
                                if (newVal !== oldVal) {
                                    ngModel.$validate();
                                }
                            });

                            ngModel.$asyncValidators.terminologyCodeExistsValidator = function () {
                                var deferred = $q.defer();
                                scope.validatedCodeValue = '';
                                scope.multiValuesArr.forEach(function (labelVal) {
                                    if (labelVal.status) {
                                        if (scope.validatedCodeValue) {
                                            scope.validatedCodeValue += ', '
                                        }
                                        scope.validatedCodeValue += labelVal.value;
                                    }
                                });
                                scope.validatedCodeValue ? deferred.reject() : deferred.resolve();
                                return deferred.promise;
                            };
                        }
                    } else {
                        if (!scope.isMulti()) {

                            scope.$watch(function () {
                                return scope.model.codeValue();
                            }, function (newVal, oldVal) {
                                if (newVal != null) {
                                    ngModel.$validate();

                                }
                            }, true);

                            ngModel.$asyncValidators.terminologyCodeExistsValidator = function () {
                                var deferred = $q.defer();
                                scope.validatedCodeValue = '';
                                if (!scope.model.findInputItemByCode(scope.model.codeValue(), null)) {
                                    scope.validatedCodeValue = scope.model.codeValue();
                                }
                                if (scope.validatedCodeValue) {
                                    $timeout(function () {
                                        thisCtrl.toDirty();
                                    });
                                    deferred.reject()
                                } else {
                                    deferred.resolve();
                                }
                                return deferred.promise;
                            };
                        } else {
                            scope.$watch(function () {
                                return scope.multiValuesArr;
                            }, function (newVal, oldVal) {
                                if (newVal !== oldVal) {
                                    ngModel.$validate();
                                }
                            });

                            ngModel.$asyncValidators.terminologyCodeExistsValidator = function () {
                                var deferred = $q.defer();
                                scope.validatedCodeValue = '';
                                scope.multiValuesArr.forEach(function (labelVal) {
                                    if (labelVal.status == thinkehr.f4.InputItem.STATUS_NOT_FOUND) {
                                        if (scope.validatedCodeValue) {
                                            scope.validatedCodeValue += ', '
                                        }
                                        scope.validatedCodeValue += labelVal.value;
                                    }
                                });
                                if (scope.validatedCodeValue) {
                                    thisCtrl.toDirty();
                                    deferred.reject();
                                } else {
                                    deferred.resolve();
                                }
                                return deferred.promise;
                            };
                        }
                    }
                }
            }
        }]);

        module.directive('ehrDatePatternValidator', ["EhrNgUtil", function (EhrNgUtil) {
            return {
                restrict: 'A',
                require: ['ngModel', '^^ehrDateField'],
                controller: function ($scope) {

                },
                link: function (scope, elem, attr, ctrlArr) {
                    var ngModel = ctrlArr[0];
                    scope.$watch(function () {
                        return scope.multiItemCtrl.ehrSingleFieldMultiItemValue();
                    }, function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            ngModel.$validate();
                        }
                    });

                    ngModel.$validators.ehrDatePatternValidator = function (modelVal, viewVal) {
                        var datePattern = scope._validationObj ? scope._validationObj.pattern : null;
                        if (datePattern) {
                            var currDateValue = scope.multiItemCtrl.ehrSingleFieldMultiItemValue();
                            if (currDateValue) {
                                var useMarkerInd = scope.dateValidationPattern.getMinimumDatePatternIndex(datePattern);
                                return currDateValue.split('-').length >= useMarkerInd;
                            }
                        }
                        return true;
                    }
                }
            };
        }]);

        module.directive('ehrCodedTextMultiMinItemsValidator', ["$parse", function ($parse) {
            return {
                restrict: 'A',
                require: ['ngModel'],
                controller: function ($scope) {

                },
                link: function (scope, elem, attr, ctrlArr) {
                    var ngModel = ctrlArr[0];
                    var evalFn = $parse(attr.ehrCodedTextMultiMinItemsValidator);
                    if (evalFn(scope) == true) {
                        scope.$watch(function () {
                            return scope.minMultiNrDelta();
                        }, function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                ngModel.$validate();
                            }
                        });

                        ngModel.$validators.ehrCodedTextMultiMinItemsValidator = function (modelVal, viewVal) {
                            return scope.minMultiNrDelta() == 0;
                        }
                    }
                }
            };
        }]);

        module.directive("ehrNumberFormatter", ["EhrLocalizationHelper", function (EhrLocalizationHelper) {
            return {
                restrict: "A",
                scope: false,
                require: "ngModel",
                link: function ($scope, element, attrs, ngModelCtrl) {

                    var locale = $scope.EhrContext.locale;

                    ngModelCtrl.$formatters.splice(0, 1, function (modelValue) {

                        if (angular.isString(modelValue)) {
                            return parseFloat(modelValue);
                        }

                        return modelValue;
                    });

                    ngModelCtrl.$parsers.splice(0, 0, function (viewValue) {

                        if (angular.isString(viewValue)) {
                            var vv = EhrLocalizationHelper.isDecimalSeparatorComma(locale) ? viewValue.replace(/,/g, ".") : viewValue;
                            return attrs["ehrNumberFormatter"] !== "integer" ? parseFloat(vv) : parseInt(vv);
                        }

                        return viewValue;
                    });
                }
            };
        }]);

        module.directive("ehrDateFormatter", ["$window", "dateFilter", "EhrLocalizationHelper",
            function ($window, dateFilter, EhrLocalizationHelper) {
                return {
                    restrict: "A",
                    scope: false,
                    require: "ngModel",

                    link: function ($scope, element, attrs, ngModelCtrl) {

                        ngModelCtrl.$parsers.splice(0, 0, function (viewValue) {
                            if (angular.isString(viewValue)) {
                                var df = EhrLocalizationHelper.dateFormat($scope.EhrContext.locale);

                                var date;
                                if ($window.kendo) {
                                    date = $window.kendo.parseDate(viewValue, df);
                                    if (!date && df) { // Lets just try everything on the current kendo locale then
                                        date = $window.kendo.parseDate(viewValue);
                                    }
                                } else {
                                    try {
                                        date = EhrLocalizationHelper.toDate(viewValue);
                                    } catch (e) {
                                        console.warn("Error while parsing date, returning viewValue", e);
                                        date = null;
                                    }
                                }

                                return date ? dateFilter(date, "yyyy-MM-dd") : viewValue;
                            }

                            return viewValue;
                        });
                    }
                };
            }]);

        module.directive("ehrTimeFormatter", ["$window", "dateFilter", "EhrLocalizationHelper",
            function ($window, dateFilter, EhrLocalizationHelper) {
                return {
                    restrict: "A",
                    scope: false,
                    require: "ngModel",

                    link: function ($scope, element, attrs, ngModelCtrl) {

                        ngModelCtrl.$parsers.splice(0, 0, function (viewValue) {
                            if (angular.isString(viewValue)) {
                                var tf = [EhrLocalizationHelper.timeFormat($scope.EhrContext.locale)];
                                tf = tf.concat(EhrLocalizationHelper.supportedTimeFormats);

                                var date;
                                if ($window.kendo) {
                                    date = $window.kendo.parseDate(viewValue, tf);
                                } else {
                                    try {
                                        date = EhrLocalizationHelper.toTime(viewValue);
                                    } catch (e) {
                                        console.warn("Error while parsing time, returning viewValue", e);
                                        date = null;
                                    }
                                }

                                return date ? dateFilter(date, "HH:mm:ss.sss") : viewValue;
                            }

                            return viewValue;
                        });
                    }
                };
            }]);

        module.directive("ehrDateTimeFormatter", ["$window", "dateFilter", "EhrLocalizationHelper",
            function ($window, dateFilter, EhrLocalizationHelper) {
                return {
                    restrict: "A",
                    scope: false,
                    require: "ngModel",

                    link: function ($scope, element, attrs, ngModelCtrl) {

                        ngModelCtrl.$parsers.splice(0, 0, function (viewValue) {
                            if (angular.isString(viewValue)) {
                                var date;
                                if ($window.kendo) {
                                    date = $window.kendo.parseDate(viewValue, EhrLocalizationHelper.supportedDateTimeFormats($scope.EhrContext.locale));
                                    if (!date) {
                                        date = $window.kendo.parseDate(viewValue); // try anything with current kendo locale
                                    }
                                } else {
                                    try {
                                        date = EhrLocalizationHelper.toDate(viewValue);
                                    } catch (e) {
                                        console.warn("Error while parsing date, returning viewValue", e);
                                        date = null;
                                    }
                                }

                                return date ? dateFilter(date, "yyyy-MM-ddTHH:mm:ss.sss") : viewValue;
                            }

                            return viewValue;
                        });
                    }
                };
            }]);

        var _ehrTextController = function ($scope, EhrContext, EhrLayoutHelper) {
            _ehrListValuesController($scope, EhrContext, EhrLayoutHelper);

            $scope.textValue = function (value, multiIndex) {
                return $scope.model.textValue.apply($scope.model, arguments);
            };

            $scope.presentation = function () {
                if ($scope.textValuesField() && thinkehr.f4.util.isObject($scope.textValuesField())) {
                    var presentation = $scope.textValuesField().getPresentation();
                    return presentation ? presentation : thinkehr.f4.FieldPresentation.COMBOBOX;
                }

                return thinkehr.f4.FieldPresentation.TEXTFIELD;
            };

            $scope.list = function () {
                return $scope.model.getInputFor('textValues').getList();
            };

            var uniqueId = $scope.model.getSanitizedUniqueId();
            $scope._textValuesName = EhrLayoutHelper.getFormId($scope) + "_text_values_" + uniqueId;
            $scope._otherFieldName = EhrLayoutHelper.getFormId($scope) + "_text_values_other_" + uniqueId;

            $scope.textValuesName = function () {
                return $scope._textValuesName;
            };

            $scope.otherFieldName = function () {
                return $scope._otherFieldName;
            };

            $scope.computeLineClass = function () {
                if (!$scope._ctLineClass) {
                    $scope._ctLineClass = EhrLayoutHelper.computeEhrLineClass($scope.model);
                    if ($scope.model.getRmType() === thinkehr.f4.RmType.DV_TEXT) {
                        $scope._ctLineClass.push("ehr-text-values");
                    }
                }

                return $scope._ctLineClass;
            };

            $scope.textValuesField = function () {
                return $scope.model.viewConfig.getField();
            };

        };

        module.directive("ehrText", ["EhrApiServiceFactory", "EhrLayoutHelper", function (EhrApiServiceFactory, EhrLayoutHelper) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-text.html",
                scope: true,
                controller: function ($scope) {
                    _ehrTextController($scope, $scope.EhrContext, EhrLayoutHelper);
                    $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();
                    $scope._listValuesCache = {};

                    $scope.field = function () {
                        return $scope.model.getViewConfig().getField();
                    };

                    $scope.isTextField = function () {
                        return !$scope.field() || !thinkehr.f4.util.isObject($scope.field()) || $scope.field().getPresentation() !== thinkehr.f4.FieldPresentation.TEXTAREA;
                    };

                    $scope.isTextArea = function () {
                        return $scope.field() && thinkehr.f4.util.isObject($scope.field()) && $scope.field().getPresentation() === thinkehr.f4.FieldPresentation.TEXTAREA;
                    };

                    $scope.showTextField = function () {
                        return $scope.isTextField() && !$scope.isCombo() && !$scope.isRadios()
                    };

                    $scope.showTextArea = function () {
                        return $scope.isTextArea() && !$scope.isCombo() && !$scope.isRadios()
                    };

                    $scope.$watch(function () {
                        return $scope.list();
                    }, function (newVal) {
                        setListValuesCache(newVal);
                    }, true);

                    var setListValuesCache = function (listArr) {
                        $scope._listValuesCache = {};
                        if (listArr) {
                            listArr.forEach(function (listItem) {
                                $scope._listValuesCache[listItem.value] = true;
                            });
                        }
                    };
                },
                link: function ($scope, element) {
                    if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                }
            };
        }]);

        module.directive("ehrTextField", ["EhrValidationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper", function (EhrValidationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {

            return {
                restrict: "EA",
                require: 'ehrSingleFieldMultiItem',
                templateUrl: "thinkehr/f4/templates/ehr-text-field.html",
                scope: true,
                link: function ($scope, element, attrs, controllers) {

                    var _sanitizedUniqueId = $scope.model.getSanitizedUniqueId();
                    var currMultiIndex = controllers.getMultiIndex();

                    $scope.getFieldName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ehr_textfield" + _sanitizedUniqueId + '_' + currMultiIndex;
                    };

                    $scope.textFieldValue = function (value) {
                        return $scope.textValue(value, currMultiIndex);
                    };
                    EhrDepsHelper.processModelDeps($scope, function () {
                        return EhrDepsHelper.depsValueFactory($scope.textFieldValue());
                    }, false, true);

                    $scope.hasValidation = function () {
                        return $scope.model.isRequired();
                    };

                    if ($scope.hasValidation()) {
                        EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                            $scope.getFieldName()));
                    }
                }
            };
        }]);

        module.directive("ehrTextArea", ["EhrValidationHelper", "EhrDepsHelper", "EhrLayoutHelper", "EhrApiServiceFactory", function (EhrValidationHelper, EhrDepsHelper, EhrLayoutHelper, EhrApiServiceFactory) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-text-area.html",
                scope: true,
                require: 'ehrSingleFieldMultiItem',

                link: function ($scope, element, attrsj, controllers) {

                    var _sanitizedUniqueId = $scope.model.getSanitizedUniqueId();
                    var currMultiIndex = controllers.getMultiIndex();

                    $scope.getFieldName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ehr_textarea" + _sanitizedUniqueId + '_' + currMultiIndex;
                    };

                    $scope.textFieldValue = function (value) {
                        return $scope.textValue(value, currMultiIndex);
                    };
                    $scope.rowsDefault = 4;

                    $scope.rows = function () {
                        return EhrLayoutHelper.getTextareaRows($scope);
                    };

                    EhrDepsHelper.processModelDeps($scope, function () {
                        return EhrDepsHelper.depsValueFactory($scope.textFieldValue());
                    }, false, true);

                    $scope.hasValidation = function () {
                        return $scope.model.isRequired();
                    };

                    if ($scope.hasValidation()) {
                        EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                            $scope.getFieldName()));
                    }
                }
            };
        }]);

        module.directive("ehrTextValuesCombo", ["EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function (EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-text-values-combo.html",
                    scope: true,
                    require: ['ehrTextValuesCombo', 'ehrSingleFieldMultiItem'],
                    controller: function ($scope) {
                        EhrLocalizationHelper.generateKendoName("text_values", $scope);

                        $scope.otherSelected = function () {
                            return $scope.listOpen() && !$scope._listValuesCache[$scope.otherValue()];
                        };

                        $scope.otherRequired = function () {
                            return $scope.model.isRequired() && $scope.otherSelected();
                        };

                    },

                    link: function ($scope, element, attr, controllers) {
                        $scope.multiController = controllers[1];

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory($scope.textFieldValue() + $scope.otherValue());
                        }, false, true);

                        $scope.otherValue = function (value) {
                            return $scope.textValue(value, $scope.multiController.getMultiIndex());
                        };

                        $scope.textFieldValue = function (value) {
                            var ret = null;
                            if (value === thinkehr.f4.InputItem.OTHER_VALUE) {
                                $scope.otherValue("");
                                ret = thinkehr.f4.InputItem.OTHER_VALUE;
                            } else if (arguments.length === 0 && $scope.otherSelected()) {
                                ret = thinkehr.f4.InputItem.OTHER_VALUE;
                            } else {
                                if (value === null) {
                                    value = '';
                                }
                                ret = $scope.textValue(value, controllers[1].getMultiIndex());
                            }
                            setTimeout(function () {
                                if (ret === thinkehr.f4.InputItem.OTHER_VALUE) {
                                    var kendoComp = $scope[$scope.kendoName()];
                                    if (kendoComp) {
                                        var dataArr = kendoComp.dataSource.data();
                                        for (var i = 0; i < dataArr.length; i++) {
                                            if (dataArr[i].value === thinkehr.f4.InputItem.OTHER_VALUE) {
                                                kendoComp.select(i);
                                                kendoComp.value(dataArr[i].text);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }, 0);
                            return ret;
                        };

                        $scope.textChanged = function (e) {
                            var comboBox = e.sender;
                            if (comboBox && comboBox.value() && comboBox.selectedIndex < 0) {
                                // Need apply here cause this is a kendoui-callback
                                $scope.$apply(function () {
                                    $scope.textFieldValue('');
                                });
                            } else if (comboBox && !comboBox.value() && comboBox.selectedIndex > -1) {
                                // if "" option is selected kendo does not invoke textFieldValue getter/setter
                                $scope.$apply(function () {
                                    $scope.textFieldValue('');
                                });
                            }
                        };

                        $scope.hasValidation = function () {
                            return $scope.model.isRequired();
                        };

                        if ($scope.hasValidation()) {
                            if (!$scope.listOpen()) {
                                EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                    $scope.textValuesName()));
                            } else {
                                EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, [$scope.textValuesName(), $scope.otherFieldName()]);
                            }
                        }
                    }
                };
            }]);

        module.directive("ehrTextValuesRadio", ["EhrLayoutHelper", "EhrValidationHelper", "EhrDepsHelper", "EhrApiServiceFactory",
            function (EhrLayoutHelper, EhrValidationHelper, EhrDepsHelper, EhrApiServiceFactory) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-text-values-radio.html",
                    scope: true,
                    require: ['ehrTextValuesRadio', 'ehrSingleFieldMultiItem'],
                    controller: function ($scope) {

                        // This is an immediately executed function that assigns to an integer property because the distributeColumns() function returns a
                        // different instance of an array every time, which CAN cause a $digest cycle loop
                        $scope.columns = function () {
                            var model = $scope.model;
                            var cols = 1;
                            var textValuesFieldSettings = $scope.textValuesField();
                            if (textValuesFieldSettings && textValuesFieldSettings.getPresentation() === thinkehr.f4.FieldPresentation.RADIOS) {
                                cols = textValuesFieldSettings.getColumns();
                            }

                            if (cols < 1) {
                                cols = 1;
                            }
                            var elements = model.getInputFor("textValues").getList().length;
                            return EhrLayoutHelper.distributeColumns(cols, elements);
                        }();

                        $scope.columnWidthPercentage = function () {

                            return EhrLayoutHelper.columnWidthPercentage($scope.model.getViewConfig(), $scope.columns.length);
                        };

                        $scope.elementStyle = function () {
                            var colWidthPer = $scope.columnWidthPercentage();
                            if (colWidthPer != "auto") {
                                var widthRelativeNr = parseInt(colWidthPer);
                                if (!isNaN(widthRelativeNr)) {
                                    var marginRightNr = 10;
                                    colWidthPer = (widthRelativeNr - marginRightNr) + '%';

                                    return {
                                        width: colWidthPer,
                                        "margin-right": marginRightNr + '%'
                                    }
                                }
                                return {
                                    width: colWidthPer
                                };
                            }
                            return {};
                        };

                        $scope.anySelectedInColumn = function (columnItems) {
                            return columnItems.some(function (itemIndex) {
                                return $scope.list()[itemIndex].getValue() == $scope.textFieldValue();
                            });
                        };

                    },

                    link: function ($scope, element, attr, controllers) {
                        $scope.multiController = controllers[1];

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory($scope.textFieldValue() + $scope.otherValue());
                        }, false, true);

                        $scope.otherValue = function (value) {
                            return $scope.textValue(value, $scope.multiController.getMultiIndex());
                        };

                        $scope.textFieldValue = function (value) {
                            return $scope.textValue(value, $scope.multiController.getMultiIndex());
                        };

                        $scope.hasValidation = function () {
                            return $scope.model.isRequired();
                        };

                        if ($scope.hasValidation()) {
                            if (!$scope.listOpen()) {

                                EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                    "ehr_rb_group_" + $scope.textValuesName()));
                                $scope.radioRequired = function () {
                                    return $scope.model.isRequired();
                                };
                                $scope.otherRequired = function () {
                                    return false;
                                };
                            } else {
                                EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, ["ehr_rb_group_" + $scope.textValuesName(), $scope.otherFieldName()]);
                                $scope.radioRequired = function () {
                                    if ($scope.model.isRequired()) {
                                        var ov = $scope.otherValue();
                                        return !ov || ov.length == 0;
                                    }

                                    return false;
                                };


                                $scope.otherRequired = function () {
                                    if ($scope.model.isRequired()) {
                                        var cv = $scope.textValue(undefined, $scope.multiController.getMultiIndex());
                                        return !cv || cv.length == 0;
                                    }

                                    return false;
                                };
                            }

                            $scope._onRbFormInput = function (f) {
                                var ehrFormInput = $scope.ehrFormInput ? $scope.ehrFormInput() : $scope.ehrFormInputs ? $scope.ehrFormInputs()[0] : null;
                                if (ehrFormInput) {
                                    f.call(null, ehrFormInput);
                                }
                            };

                            $scope._onOtherFormInput = function (f) {
                                if ($scope.listOpen()) {
                                    var ehrOtherInput = $scope.ehrFormInputs()[1];
                                    if (ehrOtherInput) {
                                        f.call(null, ehrOtherInput);
                                    }
                                }
                            };

                            $scope.rbClicked = function () {
                                if (angular.isUndefined($scope._dirty)) {
                                    var rbs = $(element).find("input[type='radio'].ehr-radio");
                                    $(rbs).removeClass("ng-pristine");
                                    $(rbs).addClass("ng-dirty");
                                    $scope._dirty = true;
                                    $scope._onRbFormInput(function (formInput) {
                                        formInput.$setDirty();
                                    });
                                    $scope._onOtherFormInput(function (otherInput) {
                                        if (!otherInput.$dirty) {
                                            otherInput.$setDirty();
                                        }
                                    });
                                }
                            };

                            $scope.rbBlurred = function () {
                                if (angular.isUndefined($scope._touched)) {
                                    var rbs = $(element).find("input[type='radio'].ehr-radio");
                                    $(rbs).removeClass("ng-untouched");
                                    $(rbs).addClass("ng-touched");
                                    $scope._touched = true;
                                    $scope._onRbFormInput(function (formInput) {
                                        formInput.$setTouched();
                                    });
                                    $scope._onOtherFormInput(function (otherInput) {
                                        if (!otherInput.$touched) {
                                            otherInput.$setTouched();
                                        }
                                    });
                                }
                            };

                            if ($scope.listOpen()) {
                                $scope.$watchGroup(
                                    [
                                        function (scope) {
                                            var ehrOtherInput = scope.ehrFormInputs()[1];
                                            if (ehrOtherInput) {
                                                return ehrOtherInput.$dirty;
                                            }

                                            return null;
                                        },
                                        function (scope) {
                                            var ehrOtherInput = scope.ehrFormInputs()[1];
                                            if (ehrOtherInput) {
                                                return ehrOtherInput.$touched;
                                            }

                                            return null;
                                        }
                                    ],
                                    function (newValue) {
                                        if (newValue[0]) {
                                            $scope._onOtherFormInput(function () {
                                                $scope.rbClicked();
                                            });
                                        }
                                        if (newValue[1]) {
                                            $scope._onOtherFormInput(function () {
                                                $scope.rbBlurred();
                                            });
                                        }
                                    }
                                );
                            }
                        }
                    }
                };
            }]);

        module.directive("ehrUri", ["EhrApiServiceFactory", "EhrLayoutHelper", function (EhrApiServiceFactory, EhrLayoutHelper) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-uri.html",
                scope: true,
                controller: function ($scope) {

                    $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();
                    $scope.uriValue = function (value, multiIndex) {
                        return $scope.model.uriValue.apply($scope.model, arguments);
                    };

                    $scope.field = function () {
                        return $scope.model.getViewConfig().getField();
                    };

                    $scope.isTextField = function () {
                        return !$scope.field() || !thinkehr.f4.util.isObject($scope.field()) || $scope.field().getPresentation() !== thinkehr.f4.FieldPresentation.TEXTAREA;
                    };

                    $scope.isTextArea = function () {
                        return $scope.field() && thinkehr.f4.util.isObject($scope.field()) && $scope.field().getPresentation() === thinkehr.f4.FieldPresentation.TEXTAREA;
                    }
                },
                link: function (scope, element) {
                    if (!scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction(scope, scope.model, element);
                }
            };
        }]);

        module.directive("ehrUriTextField", ["EhrValidationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper", function (EhrValidationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-uri-text-field.html",
                scope: true,
                require: 'ehrSingleFieldMultiItem',

                link: function ($scope, element, attr, controllers) {

                    var _sanitizedUniqueId = $scope.model.getSanitizedUniqueId();
                    var currMultiIndex = controllers.getMultiIndex();

                    $scope.getFieldName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ehr_uri_textfield" + _sanitizedUniqueId + '_' + currMultiIndex;
                    };

                    EhrDepsHelper.processModelDeps($scope, function () {
                        return EhrDepsHelper.depsValueFactory($scope.uriFieldValue());
                    }, false, true);


                    $scope.uriFieldValue = function (value) {
                        return $scope.uriValue(value, currMultiIndex);
                    };

                    $scope.hasValidation = function () {
                        return $scope.model.isRequired();
                    };

                    if ($scope.hasValidation()) {
                        EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                            $scope.getFieldName()));
                    }
                }
            };
        }]);

        module.directive("ehrUriTextArea", ["EhrValidationHelper", "EhrDepsHelper", "EhrLayoutHelper", "EhrApiServiceFactory", function (EhrValidationHelper, EhrDepsHelper, EhrLayoutHelper, EhrApiServiceFactory) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-uri-text-area.html",
                scope: true,
                require: ["ehrUriTextArea", "ehrSingleFieldMultiItem"],
                controller: function ($scope) {
                    $scope.rowsDefault = 4;

                    $scope.rows = function () {
                        return EhrLayoutHelper.getTextareaRows($scope);
                    };
                },

                link: function ($scope, element, attr, controllers) {
                    var _sanitizedUniqueId = $scope.model.getSanitizedUniqueId();
                    var currMultiIndex = controllers[1].getMultiIndex();

                    $scope.getFieldName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ehr_uri_textarea" + _sanitizedUniqueId + '_' + currMultiIndex;
                    };

                    EhrDepsHelper.processModelDeps($scope, function () {
                        return EhrDepsHelper.depsValueFactory($scope.uriFieldValue());
                    }, false, true);

                    $scope.uriFieldValue = function (value) {
                        return $scope.uriValue(value, currMultiIndex);
                    };

                    $scope.hasValidation = function () {
                        return $scope.model.isRequired();
                    };

                    if ($scope.hasValidation()) {
                        EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                            $scope.getFieldName()));
                    }
                }
            };
        }]);

        module.directive("ehrEhrUri", ["EhrApiServiceFactory", "EhrLayoutHelper", function (EhrApiServiceFactory, EhrLayoutHelper) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-ehr-uri.html",
                scope: true,
                controller: function ($scope) {
                    $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                    $scope.ehrUriValue = function (value, multiIndex) {
                        return $scope.model.ehrUriValue.apply($scope.model, arguments);
                    };

                    $scope.field = function () {
                        return $scope.model.getViewConfig().getField();
                    };

                    $scope.isTextField = function () {
                        return !$scope.field() || !thinkehr.f4.util.isObject($scope.field()) || $scope.field().getPresentation() !== thinkehr.f4.FieldPresentation.TEXTAREA;
                    };

                    $scope.isTextArea = function () {
                        return $scope.field() && thinkehr.f4.util.isObject($scope.field()) && $scope.field().getPresentation() === thinkehr.f4.FieldPresentation.TEXTAREA;
                    }
                },
                link: function (scope, element) {
                    if (!scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction(scope, scope.model, element);
                }
            };
        }]);

        module.directive("ehrEhrUriTextField", ["EhrValidationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper", function (EhrValidationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-ehr-uri-text-field.html",
                scope: true,
                require: ["ehrEhrUriTextField", "ehrSingleFieldMultiItem"],
                controller: function ($scope) {

                    $scope.patternValidExample = $scope.model.getPatternValidExample();
                },

                link: function ($scope, element, attr, controllers) {
                    var _sanitizedUniqueId = $scope.model.getSanitizedUniqueId();
                    var currMultiIndex = controllers[1].getMultiIndex();

                    $scope.getFieldName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ehr_ehr_uri_textfield" + _sanitizedUniqueId + '_' + currMultiIndex;
                    };

                    /*EhrDepsHelper.processModelDeps($scope, function () {
                     return $scope.ehrUriFieldValue();
                     });*/

                    EhrDepsHelper.processModelDeps($scope, function () {
                        return EhrDepsHelper.depsValueFactory($scope.ehrUriFieldValue());
                    }, false, true);

                    $scope.ehrUriFieldValue = function (value) {
                        return $scope.ehrUriValue(value, currMultiIndex);
                    };

                    $scope.hasValidation = function () {
                        return true;
                    };

                    if ($scope.hasValidation()) {
                        EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                            $scope.getFieldName()));
                    }
                }
            };
        }]);

        module.directive("ehrEhrUriTextArea", ["EhrValidationHelper", "EhrDepsHelper", "EhrLayoutHelper", "EhrApiServiceFactory", function (EhrValidationHelper, EhrDepsHelper, EhrLayoutHelper, EhrApiServiceFactory) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-ehr-uri-text-area.html",
                scope: true,
                require: ['ehrEhrUriTextArea', 'ehrSingleFieldMultiItem'],
                controller: function ($scope) {
                    $scope.rowsDefault = 4;

                    $scope.rows = function () {
                        return EhrLayoutHelper.getTextareaRows($scope);
                    };

                    $scope.patternValidExample = $scope.model.getPatternValidExample();
                },

                link: function ($scope, element, attr, controllers) {

                    var _sanitizedUniqueId = $scope.model.getSanitizedUniqueId();
                    var currMultiIndex = controllers[1].getMultiIndex();

                    $scope.getFieldName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ehr_ehr_uri_textarea" + _sanitizedUniqueId + '_' + currMultiIndex;
                    };

                    EhrDepsHelper.processModelDeps($scope, function () {
                        return EhrDepsHelper.depsValueFactory($scope.ehrUriFieldValue());
                    }, false, true);

                    $scope.ehrUriFieldValue = function (value) {
                        return $scope.ehrUriValue(value, controllers[1].getMultiIndex());
                    };

                    $scope.hasValidation = function () {
                        return true;
                    };

                    if ($scope.hasValidation()) {
                        EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                            $scope.getFieldName()));
                    }
                }
            };
        }]);

        module.directive("ehrProportion", ["EhrLayoutHelper", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory",
            function (EhrLayoutHelper, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-proportion.html",
                    scope: true,
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        /*EhrLocalizationHelper.generateKendoName("numerator_proportion", $scope, true, "_kendoNumName", "kendoNumName");
                         EhrLocalizationHelper.generateKendoName("denominator_proportion", $scope, true, "_kendoDenName", "kendoDenName");*/
                        /*

                         $scope.isMulti = function () {
                         return $scope.model.isMulti();
                         };
                         */

                        $scope.proportionValue = function () {
                            if (arguments.length == 2 && arguments[0] == '' && arguments[1] >= 0) {
                                return $scope.model.numeratorValue('', arguments[1], true);
                            }
                            if (arguments.length == 2 && arguments[0] === null && arguments[1] >= 0) {
                                return $scope.model.removeValue(arguments[1]);
                            }
                            return $scope.model.getValue();
                        };

                        /*$scope.numeratorValue = function (value) {
                         return $scope.model.numeratorValue.apply($scope.model, arguments);
                         };

                         $scope.denominatorValue = function (value) {
                         return $scope.model.denominatorValue.apply($scope.model, arguments);
                         };*/

                        $scope._precision = function (input) {

                            if (input.getType() === thinkehr.f4.InputType.DECIMAL) {
                                if (input.getValidation()) {
                                    var p = input.getValidation().precision;
                                    return p ? p.max : 3;
                                } else {
                                    return 3;
                                }
                            } else {
                                return 0;
                            }
                        };

                        $scope.numeratorPrecision = $scope._precision($scope.model.getInputFor("numerator"));
                        $scope.numeratorFormat = "n" + $scope.numeratorPrecision;
                        $scope.numeratorStep = 1 / Math.pow(10, $scope.numeratorPrecision);

                        $scope.denominatorPrecision = $scope._precision($scope.model.getInputFor("denominator"));
                        $scope.denominatorFormat = "n" + $scope.denominatorPrecision;
                        $scope.denominatorStep = 1 / Math.pow(10, $scope.denominatorPrecision);


                        /*$scope.numeratorName = function () {
                         return "numerator_proportion_" + $scope.model.getSanitizedUniqueId();
                         };

                         $scope.denominatorName = function () {
                         return "denominator_proportion_" + $scope.model.getSanitizedUniqueId();
                         };*/

                        $scope.numeratorOptions = {
                            culture: $scope.EhrContext.locale,
                            decimals: $scope.numeratorPrecision,
                            format: $scope.numeratorFormat,
                            step: $scope.numeratorStep
                        };

                        $scope.denominatorOptions = {
                            culture: $scope.EhrContext.locale,
                            decimals: $scope.denominatorPrecision,
                            format: $scope.denominatorFormat,
                            step: $scope.denominatorStep
                        };

                        $scope.percentage = function () {
                            var denominatorInput = $scope.model.getInputFor("denominator");
                            if (denominatorInput.getValidation()) {
                                var v = denominatorInput.getValidation();
                                return (v.range && v.range.min == 100.0 && v.range.max == 100.0);
                            }

                            return false;
                        };

                        $scope.fixedDenominator = function () {
                            var denominatorInput = $scope.model.getInputFor("denominator");
                            if (denominatorInput.getValidation()) {
                                var v = denominatorInput.getValidation();
                                return (v.range && v.range.min !== undefined && v.range.min == v.range.max);
                            }

                            return false;
                        };

                        $scope.numeratorMinValue = $scope.model.getMinValueForNumerator();
                        $scope.numeratorMinValueOp = $scope.model.getMinOperatorForNumerator() || ">=";
                        $scope.numeratorMaxValue = $scope.model.getMaxValueForNumerator();
                        $scope.numeratorMaxValueOp = $scope.model.getMaxOperatorForNumerator() || "<=";
                        $scope.denominatorMinValue = $scope.model.getMinValueForDenominator();
                        $scope.denominatorMinValueOp = $scope.model.getMinOperatorForDenominator() || ">=";
                        $scope.denominatorMaxValue = $scope.model.getMaxValueForDenominator();
                        $scope.denominatorMaxValueOp = $scope.model.getMaxOperatorForDenominator() || "<=";

                        $scope.computeFieldClass = function () {
                            if (!$scope.fieldClass) {
                                var cl = EhrLayoutHelper.computeFieldClass($scope.model);
                                if ($scope.percentage()) {
                                    cl.push("ehr-percentage");
                                    cl.push("ehr-fixed-denominator")
                                } else if ($scope.fixedDenominator()) {
                                    cl.push("ehr-fixed-denominator");
                                }

                                $scope.fieldClass = cl;
                            }

                            return $scope.fieldClass;
                        };

                        $scope.numeratorField = function () {
                            return $scope.model.getViewConfig().getField("numerator");
                        };

                        $scope.denominatorField = function () {
                            return $scope.model.getViewConfig().getField("denominator");
                        };

                        $scope.denominatorRequired = function () {
                            return $scope.model.isRequired() && !$scope.fixedDenominator();
                        }
                    },

                    link: function ($scope, element) {

                        /*EhrDepsHelper.processModelDeps($scope, function () {
                         return [$scope.numeratorValue(), $scope.denominatorValue()];
                         }, true);*/

                        $scope.hasValidation = function () {
                            var hv = $scope.model.isRequired() || angular.isNumber($scope.numeratorMinValue) || angular.isNumber($scope.numeratorMaxValue);
                            if (!hv) {
                                hv = $scope.fixedDenominator() && (angular.isNumber($scope.denominatorMinValue) || angular.isNumber($scope.denominatorMaxValue));
                            }

                            return hv;
                        };

                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrProportionField", ["EhrLayoutHelper", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory",
            function (EhrLayoutHelper, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory) {
                return {
                    restrict: "A",
                    template: "",
                    require: ['ehrSingleFieldMultiItem', '^^ehrProportion'],
                    scope: true,
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        EhrLocalizationHelper.generateKendoName("numerator_proportion", $scope, true, "_kendoNumName", "kendoNumName");
                        EhrLocalizationHelper.generateKendoName("denominator_proportion", $scope, true, "_kendoDenName", "kendoDenName");

                    },

                    link: function ($scope, element, attrs, controllers) {
                        var multiItemCtrl = controllers[0];
                        var currMultiIndex = multiItemCtrl.getMultiIndex();

                        $scope.numeratorValue = function (value) {
                            return $scope.model.numeratorValue.apply($scope.model, [value, currMultiIndex]);
                        };

                        $scope.denominatorValue = function (value) {
                            return $scope.model.denominatorValue.apply($scope.model, [value, currMultiIndex]);
                        };

                        $scope.numeratorName = function () {
                            return EhrLayoutHelper.getFormId($scope) + "_numerator_proportion_" + $scope.model.getSanitizedUniqueId() + '_' + currMultiIndex;
                        };

                        $scope.denominatorName = function () {
                            return EhrLayoutHelper.getFormId($scope) + "_denominator_proportion_" + $scope.model.getSanitizedUniqueId() + '_' + currMultiIndex;
                        };

                        $scope.model.onModelRefreshed(function () {
                            $scope.numerator = $scope.numeratorValue();
                            $scope.denominator = $scope.denominatorValue();
                        });

                        EhrDepsHelper.processModelDeps($scope, function () {
                            var numeratorValue = $scope.numeratorValue();
                            if (numeratorValue == null) {
                                numeratorValue = '';
                            }
                            var denominatorValue = $scope.denominatorValue();
                            if (denominatorValue == null) {
                                denominatorValue = '';
                            }
                            return EhrDepsHelper.depsValueFactory(numeratorValue.toString() + denominatorValue.toString());
                        }, false, true);

                        EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, [$scope.numeratorName(), $scope.denominatorName()]);
                        if ($scope.ehrFormInputs().length > 0) {
                            EhrValidationHelper.syncNgClasses(
                                $scope, element, [0, 1], ["input.ehr-number.ehr-proportion.ehr-numerator", "input.ehr-number.ehr-proportion.ehr-denominator"]);
                        }

                        if ($scope.hasValidation()) {
                            function _rangePropertyWatcher(scope, inputIndex, property) {
                                var numInput = scope.ehrFormInputs()[inputIndex];
                                if (numInput && numInput.$error && angular.isDefined(numInput.$error[property])) {
                                    return numInput.$error[property];
                                }

                                return null;
                            }

                            $scope.$watchGroup(
                                [
                                    function (scope) {
                                        return _rangePropertyWatcher(scope, 0, "min");
                                    },
                                    function (scope) {
                                        return _rangePropertyWatcher(scope, 1, "min");
                                    },
                                    function (scope) {
                                        return _rangePropertyWatcher(scope, 0, "max");
                                    },
                                    function (scope) {
                                        return _rangePropertyWatcher(scope, 1, "max");
                                    }
                                ],
                                function (newValue, oldValue, scope) {
                                    if (newValue[0]) { // min
                                        scope.minValue = scope.numeratorMinValue;
                                        scope.minValueOp = scope.numeratorMinValueOp;
                                    } else if (newValue[1]) {
                                        scope.minValue = scope.denominatorMinValue;
                                        scope.minValueOp = scope.denominatorMinValueOp;
                                    } else {
                                        scope.minValue = null;
                                        scope.minValueOp = null;
                                    }

                                    if (newValue[2]) { // max
                                        scope.maxValue = scope.numeratorMaxValue;
                                        scope.maxValueOp = scope.numeratorMaxValueOp;
                                    } else if (newValue[3]) {
                                        scope.maxValue = scope.denominatorMaxValue;
                                        scope.maxValueOp = scope.denominatorMaxValueOp;
                                    } else {
                                        scope.maxValue = null;
                                        scope.maxValueOp = null;
                                    }
                                }
                            );
                        }
                    }
                };
            }]);

        module.directive("ehrMultimedia", ["EhrLayoutHelper", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory",
            function (EhrLayoutHelper, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-multimedia.html",
                    scope: true,
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.uriValue = function () {
                            if (arguments.length == 2 && arguments[0] == '' && arguments[1] >= 0) {
                                return $scope.model.uriValue('', arguments[1], true);
                            }
                            if (arguments.length == 2 && arguments[0] === null && arguments[1] >= 0) {
                                return $scope.model.removeValue(arguments[1]);
                            }
                            return $scope.model.getValue();
                        };

                        $scope.getMimeTypeInTags = function (mimeTypesArr) {
                            return mimeTypesArr.filter(function (mtyp) {
                                return $scope.model.getViewConfig().hasTag(mtyp) ? mtyp : false;
                            })[0];
                        }

                    },

                    link: function ($scope, element) {

                        $scope.hasValidation = function () {
                            return $scope.model.isRequired();
                        };

                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrMultimediaField", ["EhrLayoutHelper", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "$sce",
            function (EhrLayoutHelper, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, $sce) {
                return {
                    restrict: "E",
                    templateUrl: "thinkehr/f4/templates/ehr-multimedia-field.html",
                    require: ['ehrSingleFieldMultiItem', '^^ehrMultimedia'],
                    scope: true,
                    controller: function ($scope) {
                        $scope.MEDIA_TYPE_IMAGE = "MEDIA_TYPE_IMAGE";
                        $scope.MEDIA_TYPE_AUDIO = "MEDIA_TYPE_AUDIO";
                        $scope.MEDIA_TYPE_VIDEO = "MEDIA_TYPE_VIDEO";
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        EhrLocalizationHelper.generateKendoName("multimedia_uri", $scope, true, "_kendoNumName", "kendoNumName");

                    },

                    link: function ($scope, element, attrs, controllers) {
                        var multiItemCtrl = controllers[0];
                        var currMultiIndex = multiItemCtrl.getMultiIndex();

                        $scope.uriValue = function (value) {
                            if (value != null && $scope.getFileSuffix(value)) {
                                $scope.mimeTypeValue(getMimeTypeFromFilePath(value))
                            }
                            var retVal = $scope.model.uriValue.apply($scope.model, [value, currMultiIndex]);
                            return retVal;
                        };

                        $scope.mimeTypeValue = function (value) {
                            return $scope.model.mimeTypeValue.apply($scope.model, [value, currMultiIndex]);
                        };

                        $scope.uriName = function () {
                            return EhrLayoutHelper.getFormId($scope) + "_multimedia_uri" + $scope.model.getSanitizedUniqueId() + '_' + currMultiIndex;
                        };

                        $scope.mimeTypeName = function () {
                            return EhrLayoutHelper.getFormId($scope) + "_multimedia_mime_type" + $scope.model.getSanitizedUniqueId() + '_' + currMultiIndex;
                        };

                        $scope.imageFileSuffixes = {
                            jpg: "image/jpeg",
                            jpeg: "image/jpeg",
                            gif: "image/gif",
                            png: "image/png"
                        };
                        $scope.videoFileSuffixes = {mp4: "video/mp4"};
                        $scope.audioFileSuffixes = {mp3: "audio/mpeg"};

                        $scope.getFileSuffix = function (uriValuePath) {
                            if (uriValuePath && uriValuePath.lastIndexOf) {
                                var suffixStart = uriValuePath.lastIndexOf('.');
                                if (suffixStart > 0) {
                                    var retSuff = uriValuePath.substring(suffixStart + 1).trim().toLowerCase();
                                    if (retSuff.length > 2 && retSuff.length < 5) {
                                        return retSuff;
                                    }
                                }
                            }
                            return null;
                        };

                        $scope.getMediaType = function () {
                            var uri = $scope.uriValue();
                            if ($scope.isImageType(uri)) {
                                return $scope.MEDIA_TYPE_IMAGE;
                            }
                            if ($scope.isAudioType(uri)) {
                                return $scope.MEDIA_TYPE_AUDIO;
                            }
                            if ($scope.isVideoType(uri)) {
                                return $scope.MEDIA_TYPE_VIDEO;
                            }
                            return null;
                        };

                        var collectMimeTypesToArr = function () {
                            var typesArr = [];
                            for (var i = 0; i < arguments.length; i++) {
                                var fileSuffixObj = arguments[i];
                                for (var suffix in fileSuffixObj) {
                                    typesArr.push(fileSuffixObj[suffix]);
                                }
                            }
                            return typesArr;
                        };

                        var getMimeTypeFromFilePath = function (filePath) {
                            var suff = $scope.getFileSuffix(filePath);
                            if (suff) {
                                var typesArr = [$scope.imageFileSuffixes, $scope.videoFileSuffixes, $scope.audioFileSuffixes];
                                for (var i = 0; i < typesArr.length; i++) {
                                    var typeSuffObj = typesArr[i];
                                    for (var fileTypeSuff in typeSuffObj) {
                                        if (fileTypeSuff == suff) {
                                            return typeSuffObj[fileTypeSuff];
                                        }
                                    }
                                }
                            }
                            return null;
                        };

                        $scope.getMimeType = function (filePath) {
                            if (filePath) {
                                var ret = getMimeTypeFromFilePath(filePath);

                                if (!ret) {
                                    ret = $scope.mimeTypeValue();
                                }

                                if (!ret) {
                                    $scope.getMimeTypeInTags(collectMimeTypesToArr($scope.imageFileSuffixes, $scope.audioFileSuffixes, $scope.videoFileSuffixes));
                                }
                                return ret;
                            }
                            return null;
                        };

                        var isMimeTypeInFileSuffixes = function (mimeType, fileSuffObj) {
                            if (mimeType) {
                                for (var suff in fileSuffObj) {
                                    if (fileSuffObj[suff] == mimeType) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        };

                        $scope.isImageType = function (filePath) {
                            var mime = $scope.getMimeType(filePath);
                            return isMimeTypeInFileSuffixes(mime, $scope.imageFileSuffixes);
                        };

                        $scope.isAudioType = function (filePath) {
                            var mime = $scope.getMimeType(filePath);
                            return isMimeTypeInFileSuffixes(mime, $scope.audioFileSuffixes);
                        };

                        $scope.isVideoType = function (filePath) {
                            var mime = $scope.getMimeType(filePath);
                            return isMimeTypeInFileSuffixes(mime, $scope.videoFileSuffixes);
                        };

                        $scope.model.onModelRefreshed(function () {
                            $scope.uriVal = $scope.uriValue();
                            $scope.mimeTypeVal = $scope.mimeTypeValue();
                        });

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory($scope.uriValue());
                        }, false, true);

                        if ($scope.hasValidation()) {
                            EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, [$scope.uriName()]);
                        }
                    }
                };
            }]);

        module.directive("ehrBoolean", ["EhrLayoutHelper", "EhrDepsHelper", "EhrApiServiceFactory", function (EhrLayoutHelper, EhrDepsHelper, EhrApiServiceFactory) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-boolean.html",
                scope: true,
                controller: function ($scope) {

                    $scope.hideReadOnlyInputs = $scope.model.hasTag("hideDisabled");

                    $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                    $scope.booleanName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_boolean_" + $scope.model.getSanitizedUniqueId();
                    };

                    $scope.booleanValue = function (value) {
                        return $scope.model.booleanValue.apply($scope.model, arguments);
                    };

                    $scope.computeFieldClass = function () {
                        if (!$scope.fieldClass) {
                            var cl = EhrLayoutHelper.computeFieldClass($scope.model);
                            if ($scope.model.isThreeState()) {
                                cl.push("ehr-boolean-three-state");
                            } else {
                                cl.push("ehr-checkbox-two-state");
                            }

                            $scope.fieldClass = cl;
                        }

                        return $scope.fieldClass;
                    };

                    $scope.twoStateReadOnly = function () {
                        return $scope.model.getViewConfig().isReadOnly() || $scope.model.allowedValues().length < 2 || ($scope.isViewMode && $scope.isViewMode());
                    };

                    $scope.trueAllowed = function () {
                        return $scope.model.allowedValues().indexOf(true) >= 0;
                    };

                    $scope.falseAllowed = function () {
                        return $scope.model.allowedValues().indexOf(false) >= 0;
                    };

                    $scope.nullAllowed = function () {
                        return $scope.model.allowedValues().indexOf(null) >= 0;
                    };

                    $scope.trueReadOnly = function () {
                        return $scope.model.getViewConfig().isReadOnly() || !$scope.trueAllowed() || ($scope.isViewMode && $scope.isViewMode());
                    };

                    $scope.falseReadOnly = function () {
                        return $scope.model.getViewConfig().isReadOnly() || !$scope.falseAllowed() || ($scope.isViewMode && $scope.isViewMode());
                    };

                    $scope.nullReadOnly = function () {
                        return $scope.model.getViewConfig().isReadOnly() || !$scope.nullAllowed() || ($scope.isViewMode && $scope.isViewMode());
                    };

                    $scope.columnWidthPercentage = function () {

                        return EhrLayoutHelper.columnWidthPercentage($scope.model.getViewConfig(), 3);
                    };

                    $scope.columnStyle = function () {
                        if (!$scope._colStyle) {
                            var colWidthPer = $scope.columnWidthPercentage();
                            if (colWidthPer != "auto") {
                                $scope._colStyle = {
                                    width: colWidthPer
                                };
                            }
                            else {
                                $scope._colStyle = {};
                            }
                        }

                        return $scope._colStyle;
                    };
                },

                link: function ($scope, element) {

                    EhrDepsHelper.processModelDeps($scope, function () {
                        return EhrDepsHelper.depsValueFactory($scope.booleanValue());
                    }, false, true);

                    if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    // Requires no 'required' validation since constrained values are already properly handled
                }


            };
        }]);

        module.directive("ehrDate", ["$timeout", "dateFilter", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, dateFilter, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-date.html",
                    scope: true,
                    controller: function ($scope) {

                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.dateValue = function (value, multiIndex) {
                            return $scope.model.dateValue.apply($scope.model, arguments);
                        };
                    },

                    link: function ($scope, element) {

                        $scope._validationObj = $scope.model.getInputByType(thinkehr.f4.InputType.DATE).getValidation() || {};
                        $scope.datePattern = $scope._validationObj.pattern;
                        $scope.hasValidation = function () {
                            return $scope.model.isRequired() || $scope._validationObj.pattern;
                        };

                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrDateField", ["$timeout", "dateFilter", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, dateFilter, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "A",
                    templateUrl: "",
                    scope: true,
                    require: ['ehrDateField', 'ehrSingleFieldMultiItem', '^^ehrDate'],
                    controller: function ($scope) {
                        this.multiItemCtrl = null;
                        this.onModelRefreshed = function () {
                            $scope.updateDateObject(this.multiItemCtrl.ehrSingleFieldMultiItemValue());
                        }
                    },
                    link: function ($scope, element, attrs, controllers) {
                        var selfCtrl = controllers[0];
                        var multiItemCtrl = controllers[1];
                        selfCtrl.multiItemCtrl = multiItemCtrl;
                        $scope.multiItemCtrl = multiItemCtrl;

                        $scope.model.onModelRefreshed(function () {
                            selfCtrl.onModelRefreshed()
                        });

                        var dateValidationPattern = {
                            FORBIDDEN_MARKER: 'xx',
                            OPTIONAL_MARKER: '??',
                            timeFrameOrder: ['DECADE', 'YEAR', 'MONTH', 'DAY'],
                            timeframeFormatOrder: ['decade', 'yyyy', 'MM', 'dd'],

                            getIndexInTimeFrameOrder: function (timeFrame) {
                                if (timeFrame) {
                                    return this.timeFrameOrder.indexOf(timeFrame.toUpperCase());
                                }
                                return null;
                            },

                            compareTimeFrame: function (timeFrame1, timeFrame2) {
                                if (timeFrame1 && timeFrame2) {
                                    if (timeFrame1 == timeFrame2) {
                                        return 0;
                                    }
                                    return this.getIndexInTimeFrameOrder(timeFrame2) - this.getIndexInTimeFrameOrder(timeFrame1);
                                }
                                return null;
                            },

                            indexOfTimeFrameMarker: function (pattern, markerString) {
                                if (pattern) {
                                    var pattLC = pattern.toLowerCase();
                                    if (pattLC.indexOf(markerString)) {
                                        var pattSplit = pattLC.split('-').indexOf(markerString);
                                        if (pattSplit > -1) {
                                            return pattSplit;
                                        }
                                    }
                                }
                                return null;
                            },
                            getMinimumDatePatternIndex: function (validationPattern) {
                                var forbiddenMarkerInd = this.indexOfTimeFrameMarker(validationPattern, this.FORBIDDEN_MARKER);
                                var optionalMarkerIndex = this.indexOfTimeFrameMarker(validationPattern, this.OPTIONAL_MARKER);
                                var useMarkerInd;
                                if ((forbiddenMarkerInd && forbiddenMarkerInd < optionalMarkerIndex) || !optionalMarkerIndex) {
                                    useMarkerInd = forbiddenMarkerInd;
                                } else {
                                    useMarkerInd = optionalMarkerIndex;
                                }
                                return useMarkerInd;
                            }, getDateStart: function (validationPattern) {
                                var retVal;
                                if (validationPattern) {
                                    var useMarkerInd = this.getMinimumDatePatternIndex(validationPattern);

                                    retVal = useMarkerInd != null && useMarkerInd > -1 ? this.timeFrameOrder[useMarkerInd - 1].toLowerCase() : null;
                                }
                                return retVal ? retVal : 'month';
                            },
                            getDateDepth: function (validationPattern) {
                                var retVal;
                                if (validationPattern) {
                                    var forbiddenTimeFrameIndex = this.indexOfTimeFrameMarker(validationPattern, this.FORBIDDEN_MARKER) - 1;
                                    retVal = forbiddenTimeFrameIndex != null && this.timeFrameOrder[forbiddenTimeFrameIndex] != null ? this.timeFrameOrder[forbiddenTimeFrameIndex].toLowerCase() : null;
                                }
                                return retVal ? retVal : 'month';
                            },
                            getDateValuePatternFormat: function (validationObjPattern, marker) {
                                var retVal;
                                if (validationObjPattern) {
                                    var forbiddenTimeFrameIndex = this.indexOfTimeFrameMarker(validationObjPattern, marker);
                                    if (forbiddenTimeFrameIndex != null) {
                                        var formatArr = this.timeframeFormatOrder.slice(1, forbiddenTimeFrameIndex + 1);
                                        if (formatArr.length > 0) {
                                            retVal = formatArr.length > 1 ? formatArr.join('-') : formatArr[0];
                                        }
                                    }
                                }
                                return retVal;
                            },
                            getDateValueFormatForDepth: function (timeFrame) {
                                var toInd = this.getIndexInTimeFrameOrder(timeFrame);
                                if (toInd < 1) {
                                    toInd = 1;
                                }
                                return this.timeframeFormatOrder.slice(1, toInd + 1).join('-');
                            },

                            trimToMaxDateValueFormat: function (dateValue) {
                                var maxFormat = this.getDateValuePatternFormat($scope._validationObj.pattern, this.FORBIDDEN_MARKER);
                                if (maxFormat && dateValue) {
                                    var maxFSplitArr = maxFormat.split('-');

                                    var valSplitArr = dateValue.split('-');
                                    if (maxFSplitArr.length < valSplitArr.length) {
                                        return valSplitArr.splice(0, maxFSplitArr.length).join('-');
                                    }
                                }
                                return dateValue;
                            },
                            getDateUIPatternFormatFromDateValueFormat: function (dateValueFormat) {
                                var currCulture = EhrLocalizationHelper.kendoCulture($scope.EhrContext.locale);
                                if (currCulture) {
                                    var cultureCalendarConf = currCulture.calendar ? currCulture.calendar : currCulture.calendars.standard;
                                    var datePattern = cultureCalendarConf.patterns.d;
                                    var separator = cultureCalendarConf['/'];
                                    var retVal = datePattern;
                                    if (dateValueFormat) {
                                        dateValueFormat = this.trimToMaxDateValueFormat(dateValueFormat);
                                        if (dateValueFormat) {
                                            var valPattern_lc = dateValueFormat.toLowerCase();

                                            if (valPattern_lc) {
                                                if (datePattern && separator) {
                                                    //modify date pattern for current locale
                                                    var pattArr = datePattern.split(separator);
                                                    pattArr = pattArr.filter(function (pattItm) {
                                                        return valPattern_lc.indexOf(pattItm.toLowerCase()) > -1;
                                                    });
                                                    retVal = pattArr.join(separator);
                                                }
                                            }
                                        }
                                    }
                                    return retVal;
                                }
                            }
                        };

                        $scope.dateValidationPattern = dateValidationPattern;
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.selectedDateDepth = null;
                        $scope.selectedDateDepthOptional = null;
                        $scope.selectedDateValueFormat = null;
                        $scope.selectedDateUIFormat = dateValidationPattern.getDateUIPatternFormatFromDateValueFormat($scope._validationObj.pattern);
                        $scope._listenersSet = false;
                        $scope.selectedDateValue = '';

                        function updateDateValueFormats(dateValue) {
                            if (dateValue) {
                                dateValue = dateValidationPattern.trimToMaxDateValueFormat(dateValue);
                                $scope.selectedDateValueFormat = dateValue.split('-').map(function (val, i) {
                                    return dateValidationPattern.timeframeFormatOrder[i + 1];
                                }).join('-');
                                $scope.selectedDateUIFormat = dateValidationPattern.getDateUIPatternFormatFromDateValueFormat($scope.selectedDateValueFormat);

                                while ((dateValue.match(/-/g) || []).length < 2) {
                                    dateValue += '-01';
                                }
                            }
                            return dateValue;
                        }

                        $scope.updateDateObject = function (dateValue) {
                            $scope._dateObject = EhrLocalizationHelper.toDate(dateValue);
                            if (dateValue) {
                                //sets value format to dateValue so months or days don't get added in scope.$watch("dateObject"...)
                                dateValue = updateDateValueFormats(dateValue);
                                var kendoComp = $scope[$scope.kendoName()];
                                $scope._dateObject = EhrLocalizationHelper.toDate(dateValue);
                                if (kendoComp) {
                                    kendoComp.setOptions({format: $scope.selectedDateUIFormat});
                                }
                            }

                            $timeout(function () {
                                $scope.dateObject = $scope._dateObject;
                            }, 50);
                        };

                        EhrLocalizationHelper.generateKendoName("date", $scope);

                        $scope.dateName = function () {
                            return EhrLayoutHelper.getFormId($scope) + "_date_" + $scope.model.getSanitizedUniqueId() + '_' + multiItemCtrl.getMultiIndex();
                        };

                        $scope.$watch(function () {
                            return multiItemCtrl.ehrSingleFieldMultiItemValue();
                        }, function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                $scope.updateDateObject(newVal);
                            }
                        });

                        selfCtrl.onModelRefreshed();

                        $scope.toFormattedDate = function (dateObj) {
                            if (dateObj) {
                                var pattern = $scope.selectedDateValueFormat || dateValidationPattern.getDateValuePatternFormat($scope._validationObj.pattern, dateValidationPattern.FORBIDDEN_MARKER) || "yyyy-MM-dd";
                                return dateFilter(dateObj, pattern);
                            }
                            return '';
                        };

                        $scope.toUIFormattedDate = function (dateObj) {
                            if (dateObj) {
                                var pattern = $scope.selectedDateUIFormat || EhrLocalizationHelper.dateFormat($scope.EhrContext.locale) || "yyyy-MM-dd";
                                return dateFilter(dateObj, pattern);
                            }
                            return '';
                        };

                        $scope.$watch("dateObject", function (newVal, oldVal) {

                            if (newVal !== oldVal) {
                                var strDate;
                                if (!newVal) {
                                    strDate = '';
                                } else {
                                    /*var pattern = $scope.selectedDateValueFormat || dateValidationPattern.getDateValuePatternFormat($scope._validationObj.pattern, dateValidationPattern.FORBIDDEN_MARKER) || "yyyy-MM-dd";
                                     strDate = dateFilter(newVal, pattern);*/
                                    strDate = $scope.toFormattedDate(newVal);
                                    //console.log("dateObject NEW val=", strDate, pattern, $scope.selectedDateValueFormat );
                                }

                                if (multiItemCtrl.ehrSingleFieldMultiItemValue() != strDate) {
                                    multiItemCtrl.ehrSingleFieldMultiItemValue(strDate);
                                }
                            }
                        });

                        var lastRequiredTFrame = dateValidationPattern.indexOfTimeFrameMarker($scope._validationObj.pattern, dateValidationPattern.OPTIONAL_MARKER);
                        var forbiddenMarker = dateValidationPattern.indexOfTimeFrameMarker($scope._validationObj.pattern, dateValidationPattern.FORBIDDEN_MARKER);

                        if (lastRequiredTFrame || forbiddenMarker) {

                            $scope.$watch($scope.kendoName(), function (kendoDatePicker) {
                                if (kendoDatePicker && kendoDatePicker.dateView && kendoDatePicker.dateView.popup) {

                                    var $kendoPopupEl = $(kendoDatePicker.dateView.popup.element);

                                    kendoDatePicker.bind("open", function (e) {
                                        if ($kendoPopupEl.find('.k-footer a').length) {
                                            $kendoPopupEl.find('.k-footer .ehr-date-footer').unwrap();
                                        }

                                        var updateSelectedDateDepth = function (ev) {
                                            var finalDepth = dateValidationPattern.getDateDepth($scope._validationObj.pattern);

                                            function getUIDepthFromTitle(selectedDateDepthHeaderString) {
                                                var digitString = selectedDateDepthHeaderString.replace(/\D/g, '#');
                                                var digitStringArr = digitString.split("#");
                                                var toIntArr = digitStringArr.map(function (currStr) {
                                                    return parseInt(currStr);
                                                });
                                                if (digitStringArr.length == 1 && !isNaN(toIntArr[0])) {
                                                    //year selected - displaying month selection
                                                    return dateValidationPattern.timeFrameOrder[1];
                                                } else if (digitStringArr.length == 2) {
                                                    if (!isNaN(toIntArr[0]) && !isNaN(toIntArr[1])) {
                                                        if (toIntArr[1] - toIntArr[0] < 10) {
                                                            //decade selected - displaying year selection
                                                            return dateValidationPattern.timeFrameOrder[0];
                                                        } else {
                                                            //century selected - displaying decade selection
                                                            return 'CENTURY';
                                                        }
                                                    }
                                                } else if (digitStringArr.length > 2) {
                                                    //month selected - displaying day selection
                                                    return dateValidationPattern.timeFrameOrder[2];
                                                }
                                                return null;
                                            }

                                            function getSelectedData(selectedUIEl) {
                                                var selectedYear, selectedMonth, selectedDay;
                                                if (selectedUIEl) {
                                                    selectedUIEl = $(selectedUIEl);
                                                    var selectedData = selectedUIEl.data('value');
                                                    if (!selectedData && !selectedUIEl.is('A')) {
                                                        selectedData = selectedUIEl.find('a').data('value');
                                                    }
                                                    var selectedDataArr = selectedData ? selectedData.replace(/\D/g, '#').split("#") : null;
                                                    selectedYear = selectedDataArr && selectedDataArr[0] != null ? selectedDataArr[0].toString() : null;
                                                    selectedMonth = selectedDataArr && selectedDataArr[1] != null ? (parseInt(selectedDataArr[1]) + 1).toString() : null;
                                                    selectedDay = selectedDataArr && selectedDataArr[2] != null ? (parseInt(selectedDataArr[2])).toString() : null;
                                                }
                                                return [selectedYear, selectedMonth, selectedDay];
                                            }

                                            $scope.$apply(function () {

                                                if (!ev || $(ev.target).closest('table').length || $(ev.target).closest('.k-header').length) {

                                                    var selectedDateDepthTitleString = kendoDatePicker.dateView.popup.element.find('.k-header .k-nav-fast').text();
                                                    var selectedYearMonthDayArr = ev ? getSelectedData(ev.target) : [null, null, null];
                                                    var oldDateDepth = $scope.selectedDateDepth;
                                                    $scope.selectedDateDepth = getUIDepthFromTitle(selectedDateDepthTitleString);

                                                    var newDateValueString = selectedYearMonthDayArr.filter(function (val) {
                                                        return !!val;
                                                    }).map(function (val1) {
                                                        return val1.length < 2 ? ("0" + val1).slice(-2) : val1;
                                                    }).join('-');

                                                    var trimValueToFormat = function (valueFormat, value) {
                                                        var res = dateFilter(new Date(value), valueFormat);
                                                        return res;
                                                    };

                                                    var newDateValue = null;

                                                    if (newDateValueString && dateValidationPattern.getIndexInTimeFrameOrder(oldDateDepth) >= 0) {
                                                        var depthFromat = null;
                                                        var selectionAtFinalDepth = dateValidationPattern.compareTimeFrame(oldDateDepth, finalDepth) == 0;
                                                        if (selectionAtFinalDepth) {
                                                            depthFromat = dateValidationPattern.getDateValueFormatForDepth(dateValidationPattern.timeFrameOrder[dateValidationPattern.getIndexInTimeFrameOrder(finalDepth) + 1]);
                                                        } else {
                                                            depthFromat = dateValidationPattern.getDateValueFormatForDepth($scope.selectedDateDepth);
                                                        }
                                                        newDateValue = trimValueToFormat(depthFromat, newDateValueString);

                                                    }

                                                    $scope.selectedDateValue = newDateValue;
                                                    if (selectionAtFinalDepth) {
                                                        $scope.updateDateObject($scope.selectedDateValue);
                                                    }
                                                }
                                            });
                                        };
                                        if (!$scope._listenersSet) {
                                            $scope._listenersSet = true;
                                            $kendoPopupEl.find('.k-header .k-nav-fast').click(updateSelectedDateDepth);
                                            $kendoPopupEl.find('.k-calendar').click(updateSelectedDateDepth);
                                            kendoDatePicker.bind("close", function (ev) {
                                                $scope.$apply(function () {
                                                    if ($scope.selectedDateValue) {
                                                        $timeout(function () {
                                                            $scope.updateDateObject($scope.selectedDateValue);
                                                        });
                                                    }
                                                });
                                            });
                                        }
                                        updateSelectedDateDepth();
                                        updateFooterUI($scope.selectedDateDepthOptional);
                                    });
                                }

                                $scope.$watch("selectedDateDepth", function (val) {
                                    val = val == null ? '' : val;

                                    var kendoComponent = $scope[$scope.kendoName()];
                                    if (kendoComponent && kendoComponent.dateView.popup) {
                                        var selectedDepthIndex = dateValidationPattern.getIndexInTimeFrameOrder(val);
                                        var indexOfTimeFrameMarker = dateValidationPattern.indexOfTimeFrameMarker($scope._validationObj.pattern, dateValidationPattern.OPTIONAL_MARKER);
                                        if (indexOfTimeFrameMarker != null) {
                                            $scope.selectedDateDepthOptional = selectedDepthIndex >= indexOfTimeFrameMarker;
                                        } else {
                                            $scope.selectedDateDepthOptional = false;
                                        }

                                    } else {
                                        $scope.selectedDateDepthOptional = false;
                                    }
                                });

                                $scope.$watch("selectedDateDepthOptional", function (val) {
                                    updateFooterUI(val);
                                });

                                function updateFooterUI(isDepthOptional) {
                                    var footerText = '';
                                    var kendoComponent = $scope[$scope.kendoName()];
                                    if (kendoComponent) {
                                        var datePickerElement = kendoComponent.dateView.popup.element;
                                        var $coloseIcon = $(datePickerElement).find('.ehr-optional-date-close');
                                        var $widget = $(datePickerElement).find(".k-widget.k-calendar");
                                        var $footerTextEl = $(datePickerElement).find(".k-footer .ehr-text-holder");
                                        var $footerBtn = $(datePickerElement).find(".k-footer .ehr-date-footer");
                                        $footerBtn.show();

                                        var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                                        if (isDepthOptional) {
                                            footerText = ' ' + $scope.EhrDictionary.text('validation.dateOptional.closeSelection', language) + ' ';
                                            $coloseIcon.show();
                                            $widget.removeClass('ng-invalid-background');
                                            $footerBtn.click(function (ev) {
                                                ev.stopPropagation();
                                                kendoComponent.close();
                                            }).css('cursor', "pointer")
                                        } else {
                                            footerText = ' ' + $scope.EhrDictionary.text('validation.dateOptional.requiredSelection', language) + ' ';
                                            $coloseIcon.hide();
                                            $widget.addClass('ng-invalid-background');
                                            $footerBtn.off("click").css('cursor', "default");
                                        }
                                        $footerTextEl.text(footerText);
                                    }
                                }

                            })
                        }

                        $scope.dateOptions = {
                            culture: $scope.EhrContext.locale,
                            start: dateValidationPattern.getDateStart($scope._validationObj.pattern),
                            depth: dateValidationPattern.getDateDepth($scope._validationObj.pattern),
                            format: $scope.selectedDateUIFormat,
                            footer: kendo.template($("<div><p class='ehr-date-footer' style='display: none'><span class='ehr-text-holder'></span> <span class='ehr-optional-date-close'><i class='fa fa-2x fa-check red'></i></span></p></div>").html())
                        };

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory(multiItemCtrl.ehrSingleFieldMultiItemValue());
                        }, false, true);

                        if ($scope.hasValidation()) {
                            EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                $scope.dateName()));
                        }
                    }
                }
            }]);

        module.directive("ehrTime", ["$timeout", "dateFilter", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, dateFilter, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-time.html",
                    scope: true,
                    controller: function ($scope) {

                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();
                        $scope.interval = 30;
                        $scope.format = undefined;

                        $scope.timeValue = function (value, multiIndex) {
                            return $scope.model.timeValue.apply($scope.model, arguments);
                            //return arguments.length === 0 ? $scope.model.timeValue() : $scope.model.timeValue(value, multiIndex);
                        };

                        $scope.timeOptions = {
                            culture: $scope.EhrContext.locale,
                            format: $scope.format,
                            parseFormats: EhrLocalizationHelper.supportedTimeFormats,
                            interval: $scope.interval
                        };
                        if (!$scope.format) {
                            delete $scope.timeOptions.format;
                        }

                    },

                    link: function ($scope, element) {
                        /*EhrDepsHelper.processModelDeps($scope, function () {
                         return $scope.timeValue();
                         });
                         */
                        $scope.hasValidation = function () {
                            return $scope.model.isRequired();
                        };

                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrTimeField", ["$timeout", "dateFilter", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, dateFilter, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "A",
                    templateUrl: "",
                    scope: true,
                    require: ['ehrTimeField', 'ehrSingleFieldMultiItem', '^^ehrTime'],
                    controller: function ($scope) {
                        this.multiItemCtrl = null;
                        this.onModelRefreshed = function () {
                            $scope.updateTimeObject(this.multiItemCtrl.ehrSingleFieldMultiItemValue());
                        }
                    },
                    link: function ($scope, element, attrs, controllers) {
                        var selfCtrl = controllers[0];
                        var multiItemCtrl = controllers[1];
                        selfCtrl.multiItemCtrl = multiItemCtrl;
                        /*var parentController = controllers[2];
                         parentController.addOnModelRefreshedFn(function () {
                         selfCtrl.onModelRefreshed();
                         });
                         */
                        $scope.model.onModelRefreshed(function () {
                            selfCtrl.onModelRefreshed();
                        });

                        $scope.updateTimeObject = function (timeValue) {
                            $scope._timeObject = EhrLocalizationHelper.toTime(timeValue);

                            $timeout(function () {
                                $scope.timeObject = $scope._timeObject;
                            }, 50);
                        };

                        EhrLocalizationHelper.generateKendoName("time", $scope);

                        $scope.timeName = function () {
                            return EhrLayoutHelper.getFormId($scope) + "_time_" + $scope.model.getSanitizedUniqueId() + '_' + multiItemCtrl.getMultiIndex();
                        };

                        $scope.$watch(function () {
                            return multiItemCtrl.ehrSingleFieldMultiItemValue();
                        }, function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                $scope.updateTimeObject(newVal);
                            }
                        });
                        selfCtrl.onModelRefreshed();

                        $scope.toFormattedTime = function (dateObj) {
                            if (dateObj) {
                                return dateFilter(dateObj, EhrLocalizationHelper.outputTimeFormat);
                            }
                            return '';
                        };

                        $scope.toUIFormattedTime = function (dateObj) {
                            if (dateObj) {
                                var pattern = $scope.format || EhrLocalizationHelper.timeFormat($scope.EhrContext.locale) || 'HH:mm';
                                return dateFilter(dateObj, pattern);
                            }
                            return '';
                        };

                        $scope.$watch("timeObject", function (newVal, oldVal) {
                            if (newVal != oldVal) {
                                var strTime;
                                if (!newVal) {
                                    strTime = '';
                                } else {
                                    strTime = $scope.toFormattedTime(newVal);
                                }
                                if (multiItemCtrl.ehrSingleFieldMultiItemValue() != strTime) {
                                    multiItemCtrl.ehrSingleFieldMultiItemValue(strTime);
                                }
                            }
                        });

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory(multiItemCtrl.ehrSingleFieldMultiItemValue());
                        }, false, true);


                        if ($scope.hasValidation()) {
                            EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                $scope.timeName()));
                        }
                    }
                };
            }]);

        module.directive("ehrDateTime", ["$timeout", "dateFilter", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, dateFilter, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-date-time.html",
                    scope: true,
                    controller: function ($scope) {

                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();
                        $scope.interval = 30;
                        $scope.timeFormat = undefined;

                        $scope.dateTimeValue = function (value, multiIndex) {
                            return $scope.model.dateTimeValue.apply($scope.model, arguments);
                        };

                        $scope.dateTimeOptions = {
                            culture: $scope.EhrContext.locale,
                            timeFormat: $scope.timeFormat,
                            interval: $scope.interval,
                            start: "month",
                            depth: "month"
                        };

                        if (!$scope.format) {
                            delete $scope.dateTimeOptions.timeFormat;
                        }
                    },

                    link: function ($scope, element) {
                        /*EhrDepsHelper.processModelDeps($scope, function () {
                         return $scope.dateTimeValue();
                         });*/

                        $scope.hasValidation = function () {
                            return $scope.model.isRequired();
                        };

                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrDateTimeField", ["$timeout", "dateFilter", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, dateFilter, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "A",
                    templateUrl: "",
                    scope: true,
                    require: ['ehrDateTimeField', 'ehrSingleFieldMultiItem', '^^ehrDateTime'],
                    controller: function ($scope) {
                        this.multiItemCtrl = null;
                        this.onModelRefreshed = function () {
                            $scope.updateDateTimeObject(this.multiItemCtrl.ehrSingleFieldMultiItemValue());
                        }
                    },
                    link: function ($scope, element, attrs, controllers) {
                        var selfCtrl = controllers[0];
                        var multiItemCtrl = controllers[1];
                        selfCtrl.multiItemCtrl = multiItemCtrl;
                        /*var parentController = controllers[2];
                         parentController.addOnModelRefreshedFn(function () {
                         selfCtrl.onModelRefreshed();
                         });
                         */
                        $scope.model.onModelRefreshed(function () {
                            selfCtrl.onModelRefreshed();
                        });

                        $scope.updateDateTimeObject = function (dateTimeValue) {
                            $scope._dateTimeObject = EhrLocalizationHelper.toDate(dateTimeValue);
                            $timeout(function () {
                                $scope.dateTimeObject = $scope._dateTimeObject;
                            }, 50);
                        };

                        EhrLocalizationHelper.generateKendoName("date_time", $scope);

                        $scope.dateTimeName = function () {
                            return EhrLayoutHelper.getFormId($scope) + "_date_time_" + $scope.model.getSanitizedUniqueId() + '_' + multiItemCtrl.getMultiIndex();
                        };

                        $scope.$watch(function () {
                            return multiItemCtrl.ehrSingleFieldMultiItemValue();
                        }, function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                $scope.updateDateTimeObject(newVal);
                            }
                        });

                        selfCtrl.onModelRefreshed();

                        $scope.toFormattedDateTime = function (dateObj) {
                            if (dateObj) {
                                return dateFilter(dateObj, "yyyy-MM-ddTHH:mm:ss.sssZ");
                            }
                            return '';
                        };

                        $scope.toUIFormattedDateTime = function (dateObj) {
                            if (dateObj) {
                                var pattern = $scope.dateTimeOptions.timeFormat || EhrLocalizationHelper.supportedDateTimeFormats($scope.EhrContext.locale)[0] || 'yyyy-MM-dd HH:mm';
                                return dateFilter(dateObj, pattern);
                            }
                            return '';
                        };

                        $scope.$watch("dateTimeObject", function (newVal, oldVal) {
                            if (newVal != oldVal) {
                                var strDateTime;
                                if (!newVal) {
                                    strDateTime = '';
                                } else {
                                    strDateTime = $scope.toFormattedDateTime(newVal);
                                }

                                if (multiItemCtrl.ehrSingleFieldMultiItemValue() != strDateTime) {
                                    multiItemCtrl.ehrSingleFieldMultiItemValue(strDateTime);
                                }
                            }
                        });

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory(multiItemCtrl.ehrSingleFieldMultiItemValue());
                        }, false, true);

                        if ($scope.hasValidation()) {
                            EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(),
                                $scope.dateTimeName()));
                        }
                    }
                };
            }]);

        module.directive("ehrCount", ["$timeout", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-count.html",
                    scope: true,
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.countValue = function (value, multiIndex) {
                            return $scope.model.countValue.apply($scope.model, arguments);
                        };

                        $scope.countOptions = {
                            culture: $scope.EhrContext.locale,
                            decimals: 0,
                            format: "n0",
                            step: 1
                        };

                        var inputByType = $scope.model.getInputByType(thinkehr.f4.InputType.INTEGER);
                        $scope._validation = inputByType?inputByType.getValidation():null;
                        if ($scope._validation && $scope._validation.range) {
                            var range = $scope._validation.range;
                            $scope._range = range;

                            if (angular.isDefined(range.min)) {
                                $scope.minValue = angular.isString(range.min) ? parseInt(range.min) : range.min;
                                $scope.minValueOp = ">=";

                            } else {
                                $scope.minValue = null;
                            }

                            if (angular.isDefined(range.max)) {
                                $scope.maxValue = angular.isString(range.max) ? parseInt(range.max) : range.max;
                                $scope.maxValueOp = "<=";
                            } else {
                                $scope.maxValue = null;
                            }
                        }

                    },

                    link: function ($scope, element) {

                        /*EhrDepsHelper.processModelDeps($scope, function () {
                         return $scope.countValue();
                         });
                         */
                        $scope.hasValidation = function () {
                            return $scope.model.isRequired() || angular.isNumber($scope.minValue) || angular.isNumber($scope.maxValue);
                        };

                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrCountField", ["$timeout", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "A",
                    template: "",
                    scope: true,
                    require: ['ehrSingleFieldMultiItem', '^^ehrCount'],
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        EhrLocalizationHelper.generateKendoName("count", $scope);

                        var inputByType = $scope.model.getInputByType(thinkehr.f4.InputType.INTEGER);
                        $scope._validation = inputByType?inputByType.getValidation():null;
                        if ($scope._validation && $scope._validation.range) {
                            var range = $scope._validation.range;
                            $scope._range = range;

                            if (angular.isDefined(range.min)) {
                                $scope.minValue = angular.isString(range.min) ? parseInt(range.min) : range.min;
                                $scope.minValueOp = ">=";

                            } else {
                                $scope.minValue = null;
                            }

                            if (angular.isDefined(range.max)) {
                                $scope.maxValue = angular.isString(range.max) ? parseInt(range.max) : range.max;
                                $scope.maxValueOp = "<=";
                            } else {
                                $scope.maxValue = null;
                            }
                        }

                    },

                    link: function ($scope, element, attr, controllers) {
                        var multiItemCtrl = controllers[0];

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory($scope.countFieldValue());
                        }, false, true);


                        $scope.countName = function () {
                            if (!$scope._countName) {
                                $scope._countName = EhrLayoutHelper.getFormId($scope) + "_count_" + $scope.model.getSanitizedUniqueId() + '_' + multiItemCtrl.getMultiIndex();
                            }
                            return $scope._countName;
                        };

                        $scope.countFieldValue = function (value) {
                            if (arguments.length !== 0 && ( (value && isNaN(parseFloat(value)) ) || (value == null) )) {
                                if (value === undefined) {
                                    value = '-';
                                } else {
                                    value = '';
                                }
                            }
                            var ehrSingleFieldMultiItemValue = multiItemCtrl.ehrSingleFieldMultiItemValue.apply(multiItemCtrl, arguments);

                            return !ehrSingleFieldMultiItemValue && isNaN(parseFloat(ehrSingleFieldMultiItemValue)) ? null : ehrSingleFieldMultiItemValue;
                        };

                        var formInputRegistered = false;
                        var regFormInput = function () {
                            if (formInputRegistered) {
                                return;
                            }
                            formInputRegistered = true;
                            EhrValidationHelper.registerFormInputOnScope($scope, EhrValidationHelper.replaceLastElement($scope.model.getElementNameChain(), $scope.countName()));

                            if ($scope.ehrFormInput()) {
                                EhrValidationHelper.syncNgClasses($scope, element, [0], ["input.ehr-count-input"]);
                            }
                        };

                        var kendoComp = $scope[$scope.kendoName()];
                        if (kendoComp) {
                            regFormInput();
                        } else {
                            $scope.$watch(function (val) {
                                if (val) {
                                    regFormInput();
                                }
                            })
                        }

                    }
                };
            }]);

        module.directive("ehrQuantity", ["$timeout", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-quantity.html",
                    scope: true,

                    controller: function ($scope) {

                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.quantityValue = function () {
                            if (arguments.length == 2 && arguments[0] == '' && arguments[1] >= 0) {
                                return $scope.model.magnitudeValue('', arguments[1], true);
                            }
                            if (arguments.length == 2 && arguments[0] === null && arguments[1] >= 0) {
                                return $scope.model.removeValue(arguments[1]);
                            }
                            return $scope.model.getValue();
                        };

                        $scope.hideUnit = function () {
                            return $scope.model.annotationValue('hideUnit') == 'true';
                        };

                        $scope.list = function () {
                            return $scope.model.getInputFor("unit").getList();
                        };

                        $scope.presentation = function () {
                            if ($scope.unitField() && $scope.unitField().getPresentation()) {
                                return $scope.unitField().getPresentation();
                            }

                            return thinkehr.f4.FieldPresentation.COMBOBOX;
                        };

                        $scope.isLabelUnit = function () {
                            return $scope.list().length === 1;
                        };

                        $scope.isComboUnit = function () {
                            return !$scope.isLabelUnit() && $scope.presentation() === thinkehr.f4.FieldPresentation.COMBOBOX;
                        };

                        $scope.isRadiosUnit = function () {
                            return !$scope.isLabelUnit() && $scope.presentation() === thinkehr.f4.FieldPresentation.RADIOS;
                        };

                        $scope.unitField = function () {
                            return $scope.model.getViewConfig().getField("unit");
                        };

                        $scope.magnitudeField = function () {
                            return $scope.model.getViewConfig().getField("magnitude");
                        };

                    },

                    link: function ($scope, element) {

                        $scope.hasValidation = function () {
                            if ($scope.model.isRequired()) {
                                return true;
                            }

                            var unitInput = $scope.model.getInputFor("unit");
                            for (var i = 0; i < unitInput.getList().length; i++) {
                                if ($scope.model.getRangeForUnit(i)) {
                                    return true;
                                }
                            }

                            return false;
                        };
                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrQuantityField", ["$timeout", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrApiServiceFactory", "EhrLayoutHelper",
            function ($timeout, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrApiServiceFactory, EhrLayoutHelper) {
                return {
                    restrict: "A",
                    templateUrl: "",
                    scope: true,
                    require: ['ehrSingleFieldMultiItem', '^^ehrQuantity', 'ehrQuantityField'],
                    controller: function ($scope) {
                        this.multiItemCtrl = null;
                        //$scope.suppressLabel = false;

                        EhrLocalizationHelper.generateKendoName("magnitude_quantity", $scope, true, "_kendoMagName", "kendoMagName");
                        EhrLocalizationHelper.generateKendoName("unit_quantity", $scope, true, "_kendoUnitName", "kendoUnitName");

                        $scope.precision = function () {
                            var precision = $scope.model.getPrecisionForUnit(0);
                            if (precision == null) {
                                return 2;
                            }

                            return precision.max;
                        }();

                        $scope.format = function () {
                            return "n" + $scope.precision;
                        }();

                        $scope.step = function () {
                            return 1 / Math.pow(10, $scope.precision);
                        }();

                        this._minValue = function (unit) {
                            var minValue = $scope.model.getMinValueForUnit(unit);
                            //TODO should be minValue!=null - in case of 0 ??
                            if (minValue) {
                                $scope._minValueObj = minValue;

                                return minValue.min;
                            }

                            return null;
                        };

                        this._maxValue = function (unit) {
                            var maxValue = $scope.model.getMaxValueForUnit(unit);
                            if (maxValue) {
                                $scope._maxValueObj = maxValue;
                                return maxValue.max;
                            }

                            return null;
                        };

                        var minValue = this._minValue(0);
                        var maxValue = this._maxValue(0);
                        $scope.magnitudeOptions = {
                            culture: $scope.EhrContext.locale,
                            decimals: $scope.precision,
                            format: $scope.format,
                            step: $scope.step
                        };

                        if (angular.isNumber(minValue)) {
                            $scope.minValue = minValue;
                            $scope.minValueOp = $scope._minValueObj.minOp || ">=";
                        }

                        if (angular.isNumber(maxValue)) {
                            $scope.maxValue = maxValue;
                            $scope.maxValueOp = $scope._maxValueObj.maxOp || "<=";
                        }

                        // Disable this once option rebinding works properly on input field via k-options and k-rebind. See
                        // ehr-quantity.html input field
                        $scope.$watch("precision", function (newVal, oldVal) {
                            // Have to this in jQuery since simply binding it via k-decimals and k-format does not auto-update
                            if (newVal !== oldVal) {
                                var input = $scope[$scope.kendoMagName()];

                                if (input) {
                                    input.options.decimals = $scope.precision;
                                    input.options.format = $scope.format;
                                    input.options.culture = $scope.EhrContext.locale;
                                    input.step($scope.step);

                                    // Switch focuses so that the UI gets updated. Will run on next $digest
                                    $timeout(function () {
                                        var input = $scope[$scope.kendoMagName()];
                                        if (input) {
                                            input.focus();
                                        }

                                        var select = $scope[$scope.kendoUnitName()];
                                        if (select) {
                                            select.focus();
                                        } else {
                                            select = $("ehr-form form ehr-quantity select[name='" + $scope.unitName() + "'].ehr-combo");
                                            if (select.length > 0) {
                                                var s = $(select).data("kendoComboBox");
                                                s.focus();
                                            }
                                        }
                                    });
                                }
                            }
                        });

                        if ($scope.isLabelUnit()) {
                            $timeout(function () {
                                $scope.unitFieldValue($scope.list()[0].getLabel());
                            });
                        }
                    },

                    link: function ($scope, element, attrs, controllers) {
                        var multiItemCtrl = controllers[0];
                        var currMultiIndex = multiItemCtrl.getMultiIndex();
                        var ctrl = controllers[2];

                        $scope.unitFieldValue = function (value) {
                            var val = $scope.model.unitValue.apply($scope.model, [value, currMultiIndex]);
                            if (arguments.length > 0) {
                                var u = val != null && val !== undefined ? val : 0;
                                var precision = $scope.model.getPrecisionForUnit(u);
                                if (precision == null) {
                                    $scope.precision = 2;
                                } else {
                                    $scope.precision = precision.max;
                                }

                                $scope.format = "n" + $scope.precision;
                                $scope.step = 1 / Math.pow(10, $scope.precision);

                                $scope.magnitudeOptions.decimals = $scope.precision;
                                $scope.magnitudeOptions.format = $scope.format;
                                $scope.magnitudeOptions.step = $scope.step;

                                var minValue = ctrl._minValue(u);
                                if (angular.isNumber(minValue)) {
                                    $scope.minValue = minValue;
                                    $scope.minValueOp = $scope._minValueObj.minOp ? $scope._minValueObj.minOp : ">=";
                                }

                                var maxValue = ctrl._maxValue(u);
                                if (angular.isNumber(maxValue)) {
                                    $scope.maxValue = maxValue;
                                    $scope.maxValueOp = $scope._maxValueObj.maxOp ? $scope._maxValueObj.maxOp : "<=";
                                }
                            }

                            return val;
                        };

                        $scope.magnitudeFieldValue = function (value) {
                            var val = $scope.model.magnitudeValue.apply($scope.model, [value, currMultiIndex]);
                            return val;
                        };

                        $scope._uniqueId = $scope.model.getSanitizedUniqueId() + '_' + currMultiIndex;

                        $scope.magnitudeName = function () {
                            if (!$scope._magnitudeName) {
                                $scope._magnitudeName = EhrLayoutHelper.getFormId($scope) + "_magnitude_quantity_" + $scope._uniqueId;
                            }

                            return $scope._magnitudeName;
                        };

                        $scope.unitName = function () {
                            if (!$scope._unitName) {
                                $scope._unitName = EhrLayoutHelper.getFormId($scope) + "_unit_quantity_" + $scope._uniqueId;
                            }

                            return $scope._unitName;
                        };

                        $scope.unitChanged = function (e) {
                            var comboBox = e.sender;
                            if (comboBox && comboBox.value() && comboBox.selectedIndex < 0) {
                                // Need apply here cause this is a kendoui-callback
                                /*$scope.$apply(function () {
                                 $scope.unitFieldValue(null);
                                 })*/
                                $scope.unitFieldValue(null);
                                $scope.$digest();
                            }
                        };


                        $scope.unitRbGroupName = function () {
                            if (!$scope._unitRbGroupName) {
                                $scope._unitRbGroupName = "ehr_rb_group_" + $scope.unitName();
                            }

                            return $scope._unitRbGroupName;
                        };

                        //TODO is onModelRefreshed callback needed since ng-model is set to magnitudeFieldValue() getterSetter?
                        $scope.model.onModelRefreshed(function () {
                            $scope.magnitude = $scope.magnitudeFieldValue();

                        });

                        $scope.unitRequired = function () {

                            var req = $scope.model.isRequired();
                            return req;
                        };

                        EhrDepsHelper.processModelDeps($scope, function () {
                            var magnitudeFieldValue = $scope.magnitudeFieldValue();
                            if (magnitudeFieldValue == null) {
                                magnitudeFieldValue = '';
                            }
                            return EhrDepsHelper.depsValueFactory(magnitudeFieldValue.toString() + $scope.unitFieldValue());
                        }, false, true);

                        var unitName = $scope.isComboUnit() ? $scope.unitName() : $scope.unitRbGroupName();
                        EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, [$scope.magnitudeName(), unitName]);
                        if ($scope.ehrFormInputs().length > 0) {
                            EhrValidationHelper.syncNgClasses($scope, element, [0], ["input.ehr-number"]);
                        }
                    }
                };
            }]);

        module.directive("ehrDuration", ["$timeout", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrLayoutHelper", "EhrNgUtil", "EhrApiServiceFactory",
            function ($timeout, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrLayoutHelper, EhrNgUtil, EhrApiServiceFactory) {
                return {

                    restrict: "EA",
                    templateUrl: "thinkehr/f4/templates/ehr-duration.html",
                    scope: true,
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        $scope.durationValue = function (value) {
                            return $scope.model.durationValue.apply($scope.model, arguments);
                        };

                        $scope.durationOptions = {
                            culture: $scope.EhrContext.locale,
                            decimals: 0,
                            format: "n0",
                            step: 1
                        };

                        $scope.fieldLabel = function (suffix) {
                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            return thinkehr.f4.dict.tr("duration." + suffix, language);
                        };

                        $scope.fieldPlaceholder = function (suffix) {
                            var language = $scope.EhrContext ? $scope.EhrContext.language : null;
                            return thinkehr.f4.dict.tr("duration." + suffix + ".ph", language);
                        };

                        $scope.durationInputClass = function (suffix) {
                            var c = EhrLayoutHelper.computeFieldClass($scope.model);
                            c.push("ehr-duration-" + suffix);
                            return c;
                        };

                        $scope.isHiddenColumn = function (column) {
                            for (var i = 0; i < column.length; i++) {
                                var input = column[i];
                                if (!$scope.model.isFieldHidden(input.getSuffix())) {
                                    return false;
                                }
                            }

                            return true;
                        };

                        $scope.minValueFor = function (suffix) {
                            return $scope.model.minValueFor(suffix);
                        };

                        $scope.minOperatorFor = function (suffix) {
                            return $scope.model.minOperatorFor(suffix);
                        };

                        $scope.maxValueFor = function (suffix) {
                            return $scope.model.maxValueFor(suffix);
                        };

                        $scope.maxOperatorFor = function (suffix) {
                            return $scope.model.maxOperatorFor(suffix);
                        };
                    },

                    link: function ($scope, element) {

                        $scope.$watch("model", function (newModel) {
                            if (newModel) {
                                newModel.durationValue();
                            }
                        });

                        $scope.hasValidation = function () {
                            return $scope.model.hasValidation();
                        };
                        if (!$scope.disableCustomFunction) EhrApiServiceFactory.setupCustomFunction($scope, $scope.model, element);
                    }
                };
            }]);

        module.directive("ehrDurationField", ["$timeout", "EhrValidationHelper", "EhrLocalizationHelper", "EhrDepsHelper", "EhrLayoutHelper", "EhrNgUtil", "EhrApiServiceFactory",
            function ($timeout, EhrValidationHelper, EhrLocalizationHelper, EhrDepsHelper, EhrLayoutHelper, EhrNgUtil, EhrApiServiceFactory) {
                return {
                    restrict: "A",
                    template: "",
                    scope: true,
                    require: ['ehrSingleFieldMultiItem', '^^ehrDuration'],
                    controller: function ($scope) {
                        $scope.suppressLabel = $scope.model.getViewConfig().isLabelHidden();

                        EhrLocalizationHelper.generateKendoName("duration", $scope);

                        /*$scope.durationValue = function (value) {
                         return $scope.model.durationValue.apply($scope.model, arguments);
                         };*/
                    },

                    link: function ($scope, element, attrs, controllers) {
                        var multiItemCtrl = controllers[0];
                        var currMultiIndex = multiItemCtrl.getMultiIndex();
                        $scope.currMultiIndex = currMultiIndex;

                        $scope.durationFieldValue = function (value) {
                            return multiItemCtrl.ehrSingleFieldMultiItemValue.apply(multiItemCtrl, arguments);
                        };
                        $scope.durationFieldValue();

                        $scope.durationName = function (suffix) {
                            var dn = EhrLayoutHelper.getFormId($scope) + "_duration_" + $scope.model.getSanitizedUniqueId() + '_' + currMultiIndex;
                            if (angular.isDefined(suffix)) {
                                dn += ("_" + suffix);
                            }
                            return dn;
                        };

                        $scope.durationFieldInputValue = {
                            "year": function (value) {
                                return $scope.model.yearsValue(value, currMultiIndex);
                            },
                            "month": function (value) {
                                return $scope.model.monthsValue(value, currMultiIndex);
                            },
                            "week": function (value) {
                                return $scope.model.weeksValue(value, currMultiIndex);
                            },
                            "day": function (value) {
                                return $scope.model.daysValue(value, currMultiIndex);
                            },
                            "hour": function (value) {
                                return $scope.model.hoursValue(value, currMultiIndex);
                            },
                            "minute": function (value) {
                                return $scope.model.minutesValue(value, currMultiIndex);
                            },
                            "second": function (value) {
                                return $scope.model.secondsValue(value, currMultiIndex);
                            }
                        };

                        var _inputs = [];

                        function _inputFor(suffix) {
                            var input = $scope.model.getInputFor(suffix);
                            if (input) {
                                _inputs.push(input);
                            }
                        }

                        $scope.durationInputs = function () {
                            if (_inputs.length === 0) {
                                angular.forEach($scope.model.getFieldNames(), function (fieldName) {
                                    _inputFor(fieldName);
                                });
                            }

                            return _inputs;
                        };

                        $scope.columns = function () {
                            if (!$scope._columns) {
                                $scope._columns = [];
                                var di = $scope.durationInputs();
                                var cc = EhrLayoutHelper.distributeColumns($scope.model.columns(), di.length);
                                angular.forEach(cc, function (c) {
                                    var col = [];
                                    angular.forEach(c, function (ci) {
                                        col.push(di[ci]);
                                    });
                                    $scope._columns.push(col);

                                });
                            }

                            return $scope._columns;
                        };

                        var inputs = $scope.durationInputs();
                        var inputNames = [];
                        var inputSelectors = [];
                        angular.forEach(inputs, function (input) {
                            inputNames.push($scope.durationName(input.getSuffix()));
                            inputSelectors.push("input.ehr-duration-input.ehr-duration-" + input.getSuffix());
                        });

                        EhrValidationHelper.registerCompoundFormInputsModifyChains($scope, inputNames);

                        var iwDeReg = $scope.$watchCollection(function () {
                            return $scope.ehrFormInputs()
                        }, function (formInputs) {
                            if (formInputs.indexOf(null) < 0) { // all present

                                if (formInputs.length > 0) {
                                    EhrValidationHelper.syncNgClasses($scope, element, formInputs.length, inputSelectors);
                                }

                                iwDeReg.call(null);
                                if ($scope.hasValidation()) {
                                    $scope.$watch(
                                        function () {
                                            return $scope.durationValue();
                                        },
                                        function (newValue) {
                                            angular.forEach($scope.ehrFormInputs(), function (fi) {
                                                if (fi) {
                                                    if (newValue && thinkehr.f4.util.isArray(newValue)) {
                                                        newValue = newValue[currMultiIndex];
                                                    }
                                                    if (!EhrNgUtil.isEmpty(newValue)) {
                                                        if (EhrNgUtil.isEmpty(fi.$modelValue)) {
                                                            var validation = fi._ehrModelValidation;
                                                            if (!validation) {
                                                                var input = findInputByName(fi.$name);
                                                                validation = input ? input.getValidation() || {} : {};
                                                                fi._ehrModelValidation = validation;
                                                            }
                                                            if (validation.range && validation.range.min) {
                                                                fi.$setValidity("min", false);
                                                            }
                                                        }
                                                    } else {
                                                        fi.$setValidity("min", true);
                                                    }
                                                }
                                            });
                                        },
                                        true
                                    );
                                }
                            }
                        });

                        $scope.showErrorMessageRequired = function () {
                            var error = $scope.showErrorMessage();
                            if (error && error.required) {
                                return error;
                            }

                            return null;
                        };

                        $scope.showErrorMessageField = function (suffix) {

                            var dn = $scope.durationName(suffix);

                            var inputs = $scope.ehrFormInputs();

                            for (var i = 0; i < inputs.length; i++) {
                                var input = inputs[i];
                                if (input && input.$name === dn) {
                                    var touched = input.$dirty || input.$touched;
                                    if (!touched) {
                                        var form = $scope.ehrForm();
                                        if (form && form.$submitted) {
                                            touched = true;
                                        }
                                    }
                                    if (touched && input.$error && (input.$error.min || input.$error.max)) {
                                        return input.$error;
                                    } else {
                                        return null;
                                    }
                                }

                            }

                            return null;
                        };

                        function findInputByName($name) {
                            var inputs = $scope.durationInputs();
                            for (var i = 0; i < inputs.length; i++) {
                                var input = inputs[i];
                                var dn = $scope.durationName(input.getSuffix());
                                if (dn === $name) {
                                    return input;
                                }
                            }

                            return null;
                        }

                        EhrDepsHelper.processModelDeps($scope, function () {
                            return EhrDepsHelper.depsValueFactory($scope.durationFieldValue());
                        }, false, true);
                    }
                };
            }]);

        module.directive("ehrCustom", ["$q", "EhrApiServiceFactory", "EhrLayoutHelper", function ($q, EhrApiServiceFactory, EhrLayoutHelper) {
            return {
                restrict: "EA",
                templateUrl: "thinkehr/f4/templates/ehr-custom.html",
                scope: true,
                require: ['ehrCustom', '^^?ehrForm'],
                controller: function ($scope) {
                    $scope.customName = function () {
                        return EhrLayoutHelper.getFormId($scope) + "_ehr_custom_" + $scope.model.getSanitizedUniqueId();
                    };
                },
                link: function ($scope, $element, attrs, controllers) {
                    $scope.ehrFormCtrl = controllers[1];

                    var contentEl = $element.find(".ehr-field-content.custom");
                    var funcName = $scope.model.getCustomFunction();
                    if (!funcName) {
                        contentEl.append('<span class="ehr-custom-error no-init">No initialization function specified for this custom component.</span>');
                    }
                    var delegateModel = $scope.model.getDelegateModel();
                    $scope.suppressLabel = delegateModel.getViewConfig().isLabelHidden();

                    var exeCFPromise = EhrApiServiceFactory.executeCustomFunction(delegateModel, $scope, null, funcName);
                    exeCFPromise.then(
                        function (newCustomElement) {
                            contentEl.append(newCustomElement);
                        },

                        function (errorObj) {
                            var $messageEl = $('<span class="ehr-custom-error"><span class="ehr-custom-error-icon"></span> <span class="ehr-custom-error-text">Error with initializing custom function.</span></span>');
                            var $errorTextEl = $($('.ehr-custom-error-text', $messageEl));
                            contentEl.append($messageEl);
                            if (errorObj.message) {
                                switch (errorObj.errorId) {
                                    case 2:
                                        $errorTextEl.text("No initialization function specified for this custom component");
                                        break;
                                    default :
                                        $errorTextEl.text(errorObj.message);
                                        break;
                                }
                            }
                            if (errorObj.errorId != null) {
                                switch (errorObj.errorId) {
                                    case 0:
                                        $messageEl.addClass("eval");
                                        break;
                                    case 1:
                                        $messageEl.addClass("reject");
                                        break;
                                    case 2:
                                        $messageEl.addClass("no-func-name");
                                        break;
                                    case 3:
                                        $messageEl.addClass("eval func-not-defined");
                                        break;
                                }
                            }
                        }
                    );
                }
            };
        }]);

        module.directive("ehrPlaceholder", [function () {
            // custom placeholder directive - default directive throws template parse error when interpolating
            return {
                restrict: "A",
                scope: false,
                link: function (scope, element, attrs) {
                    var plValue = '';
                    if (attrs.ehrPlaceholder) {
                        plValue = attrs.ehrPlaceholder;
                    }

                    element.placeholder = plValue;
                    $(element).attr("placeholder", plValue);
                }
            };
        }]);

        module.directive("ehrColumnGap", [function () {
            return {
                restrict: "E",
                template: '',
                scope: {
                    last: "=",
                    observe: "="
                },
                link: function ($scope, element) {

                    function setClassName(last) {
                        if (last === true) {
                            element[0].className += " last";
                        } else {
                            element[0].className = "ng-isolate-scope";
                        }
                    }

                    if ($scope.last === true) {
                        setClassName(true);
                    }

                    if ($scope.observe === true) {
                        $scope.$watch("last", function (newValue, oldValue) {
                            if (oldValue !== newValue) {
                                setClassName(newValue);
                            }
                        });
                    }
                }
            };
        }]);

        module.directive("ehrRowGap", [function () {
            return {
                restrict: "E",
                template: '',
                scope: {
                    last: "=",
                    observe: "="
                },
                link: function ($scope, element) {

                    function setClassName(last) {
                        if (last === true) {
                            element[0].className += " last";
                        } else {
                            element[0].className = "ng-isolate-scope";
                        }
                    }

                    if ($scope.last === true) {
                        setClassName(true);
                    }

                    if ($scope.observe === true) {
                        $scope.$watch("last", function (newValue, oldValue) {
                            if (oldValue !== newValue) {
                                setClassName(newValue);
                            }
                        });
                    }
                }
            };
        }]);

        module.directive("ehrLabelGap", [function () {
            return {
                restrict: "E",
                template: '',
                scope: {}
            };
        }]);

        module.directive("ehrSingleFieldMultiHolder", [function () {
            return {
                restrict: "A",
                template: '',
                controller: function ($scope) {
                    this.getMultiArrayValueFn = null;

                    this.removeMultiFieldEnabled = function () {
                        return $scope.singleFieldMultiValuesList.length > $scope.model.getMin();
                    };

                    this.addMultiFieldEnabled = function () {
                        return $scope.singleFieldMultiValuesList.length < $scope.model.getMax() || $scope.model.getMax() == -1;
                    };

                },
                compile: function () {
                    return {
                        pre: function (scope) {
                        },
                        post: function ($scope, element, attr, controller) {
                            controller.getMultiArrayValueFn = $scope[attr.ehrSingleFieldMultiHolder];
                            if (!attr.ehrSingleFieldMultiHolder) {
                                console.error("attr.ehrSingleFieldMultiHolder not defined")
                            } else if (!controller.getMultiArrayValueFn) {
                                console.error("Multi arr value with name=" + attr.ehrSingleFieldMultiHolder + " not found on scope!")
                            }

                            $scope.singleFieldMultiValuesList = [];

                            if ($scope.isMulti == null) {
                                $scope.isMulti = function () {
                                    return $scope.model.isMulti();
                                };
                            }

                            if ($scope.isMulti()) {
                                $scope.$watch(function () {
                                    return controller.getMultiArrayValueFn();
                                }, function (newVal, oldVal) {
                                    var min = $scope.model.getMin() || 1;

                                    if (!newVal) {
                                        newVal = [];
                                    }
                                    $scope.singleFieldMultiValuesList = newVal;
                                    var delta = min - newVal.length;
                                    if (delta > 0) {
                                        for (var i = 0; i < delta; i++) {
                                            newVal.push('');
                                        }
                                    }
                                }, true);
                            } else {
                                var modelVal = controller.getMultiArrayValueFn();
                                if (modelVal && !thinkehr.f4.util.isArray(modelVal)) {
                                    modelVal = [modelVal];
                                } else {
                                    modelVal = [{}];
                                }

                                $scope.singleFieldMultiValuesList = modelVal;
                            }
                        }
                    };
                }
            }
        }]);

        module.directive("ehrSingleFieldMultiItem", [function () {
            return {
                restrict: "A",
                template: '',
                priority: 1,
                require: ['ehrSingleFieldMultiItem', '^^ehrSingleFieldMultiHolder'],

                controller: function ($scope, $filter) {
                    this.ehrSingleFieldMultiHolderController = null;

                    this.addMultiField = function () {
                        this.ehrSingleFieldMultiHolderController.getMultiArrayValueFn('', $scope.singleFieldMultiValuesList.length);
                    };

                    this.removeMultiField = function () {
                        this.ehrSingleFieldMultiHolderController.getMultiArrayValueFn(null, this.getMultiIndex());
                    };

                    this.anyTextValueEmpty = function () {
                        return $filter('filter')($scope.singleFieldMultiValuesList, function (value) {
                                return value == null || (!thinkehr.f4.util.isString(value) && !thinkehr.f4.util.isObject(value) && isNaN(value)) || value.toString().length < 1;
                            }).length > 0;
                    };

                    this.getMultiIndex = function () {
                        if ($scope.$parent.$index === undefined) {
                            console.warn("$scope.$parent is not ngFqor directive.");
                        }
                        return $scope.$parent.$index
                    };

                    this.ehrSingleFieldMultiItemValue = function (value, modelPropertyName) {
                        var multiInd = $scope.$index;
                        return this.ehrSingleFieldMultiHolderController.getMultiArrayValueFn(value, multiInd, modelPropertyName);
                    };
                },
                compile: function () {
                    return {
                        pre: function (scope, element, attr, controllers) {
                            controllers[0].ehrSingleFieldMultiHolderController = controllers[1];
                            var singleFieldGetterSetterName = attr.ehrSingleFieldMultiItem;
                            if (singleFieldGetterSetterName) {
                                scope[singleFieldGetterSetterName] = controllers[0].ehrSingleFieldMultiItemValue;
                            }
                        }
                    }
                }
            };
        }]);

        module.directive("ehrSingleFieldMultiControls", [function () {
            return {
                restrict: "E",
                require: ['^^ehrSingleFieldMultiItem', '^^ehrSingleFieldMultiHolder'],
                templateUrl: 'thinkehr/f4/templates/ehr-single-field-multi-controls.html',
                link: function ($scope, element, attr, ctrls) {
                    var ehrSingleFieldMultiItemCtrl = ctrls[0];
                    var ehrSingleFieldMultiHolder = ctrls[1];
                    $scope.removeMultiField = function () {
                        if ($scope.removeMultiFieldEnabled()) {
                            return ehrSingleFieldMultiItemCtrl.removeMultiField();
                        } else {
                            console.warn("Disabled removing multi field.");
                        }
                    };

                    $scope.anyTextValueEmpty = function () {
                        return ehrSingleFieldMultiItemCtrl.anyTextValueEmpty();
                    };

                    $scope.addMultiField = function () {
                        if ($scope.addMultiFieldEnabled()) {
                            return ehrSingleFieldMultiItemCtrl.addMultiField();
                        } else {
                            console.warn("Disabled adding multi field.");
                        }
                    };

                    $scope.removeMultiFieldEnabled = function () {
                        return ehrSingleFieldMultiHolder.removeMultiFieldEnabled();
                    };

                    $scope.addMultiFieldEnabled = function () {
                        return ehrSingleFieldMultiHolder.addMultiFieldEnabled();
                    };
                }
            };
        }]);

        module.filter('trustUrl', function ($sce) {
            return function (url) {
                return $sce.trustAsResourceUrl(url);
            };
        });


        // Main directive, that just publish a controller
        module.directive('frangTree', function ($parse, $animate) {
            return {
                restrict: 'EA',
                controller: function ($scope, $element) {
                    this.insertChildren = null;
                    this.init = function (insertChildren) {
                        this.insertChildren = insertChildren;
                    };
                }
            };
        });

        module.directive('frangTreeRepeat', function ($parse, $animate) {

            // ---------- Some necessary internal functions from angular.js ----------

            function hashKey(obj) {
                var objType = typeof obj,
                    key;

                if (objType == 'object' && obj !== null) {
                    if (typeof (key = obj.$$hashKey) == 'function') {
                        // must invoke on object to keep the right this
                        key = obj.$$hashKey();
                    } else if (key === undefined) {
                        key = obj.$$hashKey = nextUid();
                    }
                } else {
                    key = obj;
                }

                return objType + ':' + key;
            }

            function isArrayLike(obj) {
                if (obj == null || isWindow(obj)) {
                    return false;
                }

                var length = obj.length;

                if (obj.nodeType === 1 && length) {
                    return true;
                }

                return isString(obj) || isArray(obj) || length === 0 ||
                    typeof length === 'number' && length > 0 && (length - 1) in obj;
            }

            function isWindow(obj) {
                return obj && obj.document && obj.location && obj.alert && obj.setInterval;
            }

            function isString(value) {
                return typeof value == 'string';
            }

            function isArray(value) {
                return toString.apply(value) == '[object Array]';
            }

            var uid = ['0', '0', '0'];

            function nextUid() {
                var index = uid.length;
                var digit;

                while (index) {
                    index--;
                    digit = uid[index].charCodeAt(0);
                    if (digit == 57 /*'9'*/) {
                        uid[index] = 'A';
                        return uid.join('');
                    }
                    if (digit == 90  /*'Z'*/) {
                        uid[index] = '0';
                    } else {
                        uid[index] = String.fromCharCode(digit + 1);
                        return uid.join('');
                    }
                }
                uid.unshift('0');
                return uid.join('');
            }

            function assertNotHasOwnProperty(name, context) {
                if (name === 'hasOwnProperty') {
                    throw ngMinErr('badname', "hasOwnProperty is not a valid {0} name", context);
                }
            }

            var jqLite = angular.element;
            var forEach = angular.forEach;

            function minErr(module) {
                return function () {
                    var code = arguments[0],
                        prefix = '[' + (module ? module + ':' : '') + code + '] ',
                        template = arguments[1],
                        templateArgs = arguments,
                        stringify = function (obj) {
                            if (isFunction(obj)) {
                                return obj.toString().replace(/ \{[\s\S]*$/, '');
                            } else if (isUndefined(obj)) {
                                return 'undefined';
                            } else if (!isString(obj)) {
                                return JSON.stringify(obj);
                            }
                            return obj;
                        },
                        message, i;

                    message = prefix + template.replace(/\{\d+\}/g, function (match) {
                            var index = +match.slice(1, -1), arg;

                            if (index + 2 < templateArgs.length) {
                                arg = templateArgs[index + 2];
                                if (isFunction(arg)) {
                                    return arg.toString().replace(/ ?\{[\s\S]*$/, '');
                                } else if (isUndefined(arg)) {
                                    return 'undefined';
                                } else if (!isString(arg)) {
                                    return toJson(arg);
                                }
                                return arg;
                            }
                            return match;
                        });

                    message = message + '\nhttp://errors.angularjs.org/' + version.full + '/' +
                        (module ? module + '/' : '') + code;
                    for (i = 2; i < arguments.length; i++) {
                        message = message + (i == 2 ? '?' : '&') + 'p' + (i - 2) + '=' +
                            encodeURIComponent(stringify(arguments[i]));
                    }

                    return new Error(message);
                };
            }


            // ---------- Some initializations at the beginning of ngRepeat factory ----------

            var NG_REMOVED = '$$NG_REMOVED';
            var ngRepeatMinErr = minErr('ngRepeat');
            var ngMinErr = minErr('ng');
            var toString = Object.prototype.toString;
            var isFunction = angular.isFunction;
            var isUndefined = angular.isUndefined;
            var toJson = angular.toJson;

            // ---------- Internal function at the end of ngRepeat factory ----------

            function getBlockElements(block) {
                if (block.startNode === block.endNode) {
                    return jqLite(block.startNode);
                }

                var element = block.startNode;
                var elements = [element];

                do {
                    element = element.nextSibling;
                    if (!element) break;
                    elements.push(element);
                } while (element !== block.endNode);

                return jqLite(elements);
            }


            // ---------- Add watch, extracted into a function to call it not only on the element but also on its children ----------

            function addRepeatWatch($scope, $element, _lastBlockMap, valueIdentifier, keyIdentifier,
                                    rhs, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn, linker, expression) {
                var lastBlockMap = _lastBlockMap;

                //watch props
                $scope.$watchCollection(rhs, function ngRepeatAction(collection) {
                    var index, length,
                        previousNode = $element[0],     // current position of the node
                        nextNode,
                        // Same as lastBlockMap but it has the current state. It will become the
                        // lastBlockMap on the next iteration.
                        nextBlockMap = {},
                        arrayLength,
                        childScope,
                        key, value, // key/value of iteration
                        trackById,
                        trackByIdFn,
                        collectionKeys,
                        block,       // last object information {scope, element, id}
                        nextBlockOrder = [],
                        elementsToRemove;


                    if (isArrayLike(collection)) {
                        collectionKeys = collection;
                        trackByIdFn = trackByIdExpFn || trackByIdArrayFn;
                    } else {
                        trackByIdFn = trackByIdExpFn || trackByIdObjFn;
                        // if object, extract keys, sort them and use to determine order of iteration over obj props
                        collectionKeys = [];
                        for (key in collection) {
                            if (collection.hasOwnProperty(key) && key.charAt(0) != '$') {
                                collectionKeys.push(key);
                            }
                        }
                        collectionKeys.sort();
                    }

                    arrayLength = collectionKeys.length;

                    // locate existing items
                    length = nextBlockOrder.length = collectionKeys.length;
                    for (index = 0; index < length; index++) {
                        key = (collection === collectionKeys) ? index : collectionKeys[index];
                        value = collection[key];
                        trackById = trackByIdFn(key, value, index);
                        assertNotHasOwnProperty(trackById, '`track by` id');
                        if (lastBlockMap.hasOwnProperty(trackById)) {
                            block = lastBlockMap[trackById]
                            delete lastBlockMap[trackById];
                            nextBlockMap[trackById] = block;
                            nextBlockOrder[index] = block;
                        } else if (nextBlockMap.hasOwnProperty(trackById)) {
                            // restore lastBlockMap
                            forEach(nextBlockOrder, function (block) {
                                if (block && block.startNode) lastBlockMap[block.id] = block;
                            });
                            // This is a duplicate and we need to throw an error
                            throw ngRepeatMinErr('dupes', "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys. Repeater: {0}, Duplicate key: {1}",
                                expression, trackById);
                        } else {
                            // new never before seen block
                            nextBlockOrder[index] = {id: trackById};
                            nextBlockMap[trackById] = false;
                        }
                    }

                    // remove existing items
                    for (key in lastBlockMap) {
                        // lastBlockMap is our own object so we don't need to use special hasOwnPropertyFn
                        if (lastBlockMap.hasOwnProperty(key)) {
                            block = lastBlockMap[key];
                            elementsToRemove = getBlockElements(block);
                            $animate.leave(elementsToRemove);
                            forEach(elementsToRemove, function (element) {
                                element[NG_REMOVED] = true;
                            });
                            block.scope.$destroy();
                        }
                    }

                    // we are not using forEach for perf reasons (trying to avoid #call)
                    for (index = 0, length = collectionKeys.length; index < length; index++) {
                        key = (collection === collectionKeys) ? index : collectionKeys[index];
                        value = collection[key];
                        block = nextBlockOrder[index];
                        if (nextBlockOrder[index - 1]) previousNode = nextBlockOrder[index - 1].endNode;

                        if (block.startNode) {
                            // if we have already seen this object, then we need to reuse the
                            // associated scope/element
                            childScope = block.scope;

                            nextNode = previousNode;
                            do {
                                nextNode = nextNode.nextSibling;
                            } while (nextNode && nextNode[NG_REMOVED]);

                            if (block.startNode == nextNode) {
                                // do nothing
                            } else {
                                // existing item which got moved
                                $animate.move(getBlockElements(block), null, jqLite(previousNode));
                            }
                            previousNode = block.endNode;
                        } else {
                            // new item which we don't know about
                            childScope = $scope.$new();
                        }

                        childScope[valueIdentifier] = value;
                        if (keyIdentifier) childScope[keyIdentifier] = key;
                        childScope.$index = index;
                        childScope.$first = (index === 0);
                        childScope.$last = (index === (arrayLength - 1));
                        childScope.$middle = !(childScope.$first || childScope.$last);
                        childScope.$odd = !(childScope.$even = index % 2 == 0);

                        if (!block.startNode) {
                            linker(childScope, function (clone) {
                                clone[clone.length++] = document.createComment(' end ngRepeat: ' + expression + ' ');
                                $animate.enter(clone, null, jqLite(previousNode));
                                previousNode = clone;
                                block.scope = childScope;
                                block.startNode = previousNode && previousNode.endNode ? previousNode.endNode : clone[0];
                                block.endNode = clone[clone.length - 1];
                                nextBlockMap[block.id] = block;
                            });
                        }
                    }
                    lastBlockMap = nextBlockMap;
                });
            }


            return {
                restrict: 'A',
                transclude: 'element',
                priority: 1000,
                terminal: true,
                require: '^frangTree',
                compile: function (element, attr, linker) {
                    return function ($scope, $element, $attr, ctrl) {
                        var expression = $attr.frangTreeRepeat;
                        var match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*(\s+track\s+by\s+(.+)\s*)?$/),
                            trackByExp, trackByExpGetter, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn,
                            lhs, rhs, valueIdentifier, keyIdentifier,
                            hashFnLocals = {$id: hashKey};

                        if (!match) {
                            throw ngRepeatMinErr('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.",
                                expression);
                        }

                        lhs = match[1];
                        rhs = match[2];
                        trackByExp = match[4];

                        if (trackByExp) {
                            trackByExpGetter = $parse(trackByExp);
                            trackByIdExpFn = function (key, value, index) {
                                // assign key, value, and $index to the locals so that they can be used in hash functions
                                if (keyIdentifier) hashFnLocals[keyIdentifier] = key;
                                hashFnLocals[valueIdentifier] = value;
                                hashFnLocals.$index = index;
                                return trackByExpGetter($scope, hashFnLocals);
                            };
                        } else {
                            trackByIdArrayFn = function (key, value) {
                                return hashKey(value);
                            }
                            trackByIdObjFn = function (key) {
                                return key;
                            }
                        }

                        match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);
                        if (!match) {
                            throw ngRepeatMinErr('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.",
                                lhs);
                        }
                        valueIdentifier = match[3] || match[1];
                        keyIdentifier = match[2];

                        // Store a list of elements from previous run. This is a hash where key is the item from the
                        // iterator, and the value is objects with following properties.
                        //   - scope: bound scope
                        //   - element: previous element.
                        //   - index: position
                        var lastBlockMap = {};


                        addRepeatWatch($scope, $element, /*lastBlockMap*/ {}, valueIdentifier, keyIdentifier,
                            rhs, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn, linker, expression);

                        ctrl.init(function ($scope, $element, collection) {
                            addRepeatWatch($scope, $element, /*lastBlockMap*/ {}, valueIdentifier, keyIdentifier,
                                collection, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn, linker, expression)
                        });
                    };

                }
            };
        });

        module.directive('frangTreeInsertChildren', function () {
            return {
                restrict: 'EA',
                require: '^frangTree',
                link: function (scope, element, attrs, ctrl) {
                    var comment = document.createComment('treeRepeat');
                    element.append(comment);

                    ctrl.insertChildren(scope, angular.element(comment), attrs.frangTreeInsertChildren);
                }
            };
        });

        return module;
    }


    // Fixed bootstrap
    createFormModule("fixed-angular-form", "0.0.0", null, null, "thinkehrForms4");

    function bootstrapModule(module, el) {
        angular.element(document).ready(function () {
            angular.bootstrap(el, [module.name]);
            console.info("Bootstrapped angular form module", module.name, ".");
        });

        return module;
    }


    // Exports
    thinkehr.f4.ng.createFormModule = createFormModule;
    thinkehr.f4.ng.bootstrapModule = bootstrapModule;
    thinkehr.f4.ng.createContextLocale = _createContext;

    thinkehr.f4.ng.getElementByModelId = function (model, underElement) {
        if (model) {
            if (!underElement) {
                underElement = document.body;
            }
            return $('[id="' + model.getUniqueId() + '"]', underElement);
        }
        return null;
    };

    thinkehr.f4.ng.getElementByPathIdString = function (modelPathId, underElement) {
        return $('[data-ehr-path="' + modelPathId + '"]', underElement);
    };

    thinkehr.f4.ng.getElementByPathId = function (model, underElement) {
        if (!underElement) {
            underElement = document.body;
        }
        var pathId = thinkehr.f4.util.isString(model) ? model : model.getPath();
        return thinkehr.f4.ng.getElementByPathIdString(pathId, underElement);
    };

    thinkehr.f4.ng.componentPlacement = {
        POSITION_LABEL_START: "labelStart",
        POSITION_LABEL_END: "labelEnd",
        POSITION_CONTENT_START: "contentStart",
        POSITION_CONTENT_END: "contentEnd"
    };

    thinkehr.f4.ng.getFormApiObject = function (deferred, model, scope, $rootScope, $compile, element, externalContext, watchConfig, $q) {
        return {
            deferred: deferred,
            model: model,
            scope: scope,
            rootScope: $rootScope,
            compile: $compile,
            element: element,
            externalContext: externalContext,

            withinAngular: function (f) {
                $rootScope.$apply(f);
            },

            watchExpression: function (funcExpression, callback, deep) {
                if (watchConfig.initialized) {
                    scope.$watch(funcExpression, callback, deep);
                } else {
                    watchConfig.watchExpressions.push([funcExpression, callback, deep]);
                }
            },


            onValueUpdate: function (model, valueFnStr, callbackFn, callbackPropName, callbackContext) {
                if (!model)return;

                var modelPropWatch = function () {
                    return model[valueFnStr]()
                };
                var listenerFn = function (newVal, oldVal) {
                    if (newVal != oldVal) {

                        var cbObj = null;
                        if (callbackPropName) {
                            cbObj = {};
                            cbObj[callbackPropName] = newVal
                        } else {
                            cbObj = newVal
                        }
                        if (!callbackContext) {
                            callbackFn(cbObj)
                        } else {
                            callbackFn.apply(callbackContext, [cbObj])
                        }

                    }
                };
                if (watchConfig.initialized) {
                    scope.$watch(modelPropWatch, listenerFn);
                } else {
                    watchConfig.watchExpressions.push([modelPropWatch, listenerFn]);
                }
            },

            findModelWithTag: function (tagName, searchFromRootOnly, disableAnnTagNamesFromRoot) {
                if (this.model.getViewConfig().hasAnnotation(tagName)) {
                    //this model has custom annotation - use its value as search tagName
                    tagName = this.model.getViewConfig().annotationValue(tagName);
                    if (!disableAnnTagNamesFromRoot) {
                        searchFromRootOnly = true;
                    }
                }

                if (!searchFromRootOnly) {
                    var searchFromModel = this.model.findAncestorContainer(true);
                    if (searchFromModel) {
                        var modelWithTagWithinFieldset = searchFromModel.findSuccessorWithTag(tagName);
                        if (modelWithTagWithinFieldset) {
                            return modelWithTagWithinFieldset;
                        }
                    }
                    var ancestorModelWithTag = this.model.findAncestorWithTag(tagName, true);
                    if (ancestorModelWithTag) {
                        return ancestorModelWithTag;
                    }
                }

                return this.scope.model.getRootModel().findSuccessorWithTag(tagName);
            },

            findModelsWithTag: function (tagName, searchFromRootOnly, disableAnnTagNamesFromRoot) {
                if (this.model.getViewConfig().hasAnnotation(tagName)) {
                    //this model has custom annotation - use its value as search tagName
                    tagName = this.model.getViewConfig().annotationValue(tagName);
                    if (!disableAnnTagNamesFromRoot) {
                        searchFromRootOnly = true;
                    }
                }

                if (!searchFromRootOnly) {
                    var searchFromModel = this.model.findAncestorContainer(true);
                    if (searchFromModel) {
                        var modelWithTagWithinFieldset = searchFromModel.findSuccessorsWithTag(tagName);
                        if (modelWithTagWithinFieldset) {
                            return modelWithTagWithinFieldset;
                        }
                    }
                    var ancestorModelWithTag = this.model.findAncestorWithTag(tagName, true);
                    if (ancestorModelWithTag) {

                        return ancestorModelWithTag;
                    }
                }

                return this.scope.model.getRootModel().findSuccessorsWithTag(tagName);
            },

            getElementByModelId: thinkehr.f4.ng.getElementByModelId,

            getElementByPathId: thinkehr.f4.ng.getElementByPathIdString,

            getAfterInputsHolder: function () {
                return this._getElementsByClassName("content-end-position-holder")[0];
            },

            getBeforeInputsHolder: function () {
                return this._getElementsByClassName("content-start-position-holder")[0];
            },

            getFieldContentHolder: function () {
                return this._getElementsByClassName("ehr-field-content")[0];
            },

            _getElementsByClassName: function (className) {
                return this.element ? this.element[0].getElementsByClassName(className) : null;
            },

            addHtmlAfterInputs: function (ngTemplateString, optionalNewScope) {
                var appendTo = this.getAfterInputsHolder();
                if (appendTo) {
                    optionalNewScope = optionalNewScope ? optionalNewScope : this.scope;
                    var newElement = this.compile(ngTemplateString)(optionalNewScope)[0];
                    appendTo.appendChild(newElement);
                    return newElement;
                }
                return null;
            },

            addHtmlBeforeInputs: function (ngTemplateString, optionalNewScope) {
                var appendTo = this.getBeforeInputsHolder();
                if (appendTo) {
                    optionalNewScope = optionalNewScope ? optionalNewScope : this.scope;
                    var newElement = this.compile(ngTemplateString)(optionalNewScope)[0];
                    appendTo.appendChild(newElement);
                    return newElement;
                }
                return null;
            },

            getFieldInputsHolderCompiled: function () {
                return this._getElementAfterCompilation('field-content-holder');
            },

            getLabelHolderCompiled: function () {
                return this._getElementAfterCompilation('ehr-label-content');
            },

            getElementCompiled: function () {
                return this._getElementAfterCompilation();
            },

            _getElementAfterCompilation: function (className) {
                var resDefer = $q.defer();
                setTimeout(function () {
                    var retElement = className ? this._getElementsByClassName(className)[0] : this.element[0];
                    resDefer.resolve(retElement);
                }.bind(this));
                return resDefer.promise;
            },

            getFormElement: function () {
                return $("[name='" + this.scope.formName() + "']").get(0);
            },

            selectTabByModel: function (tabModel, dontSelectParentTabs) {
                tabModel = tabModel.findAncestorWithAnnotation('tab', null, true);

                var tabGroupHolderModel = tabModel.getParentModel();
                this.scope.ehrFormCtrl.setSelectTabModelPathId(tabGroupHolderModel.getPath(), tabModel.annotationValue('tab'), tabModel.getPath());
                var formEl = this.getFormElement();
                for (var i = 0; i < tabGroupHolderModel.getChildCount(); i++) {
                    var childModel = tabGroupHolderModel.getChildModel(i);
                    if (childModel.hasAnnotation('tab')) {
                        var tabEl = this.getElementByModelId(childModel, formEl);
                        if (tabEl.length && tabEl.scope) {
                            tabEl.scope().selectTab(tabEl.scope().getTabObj(tabModel));
                            break;
                        }
                    }
                }

                if (dontSelectParentTabs !== true) {
                    var parentTab = tabGroupHolderModel.findAncestorWithAnnotation('tab', null, true);
                    if (parentTab) {
                        this.selectTabByModel(parentTab, dontSelectParentTabs);
                    }
                }
            }
        }
    };
})();

// module.exports = {
    // thinkehrForms4: "thinkehrForms4",
    // thinkehr: thinkehr
// };