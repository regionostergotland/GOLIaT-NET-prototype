# 1.0.58 ( 2017-1-19)

## Fixes and Updates

- runVisitors method fixed

# 1.0.56 ( 2017-1-18)

## Fixes and Updates

- radio clear button position

# 1.0.55 ( 2017-1-18)

## Fixes and Updates

- radio clear button position

# 1.0.54 ( 2017-1-16)

## Fixes and Updates

- display tabs on next selection when rendering canceled

# 1.0.53 ( 2017-1-13)

## Fixes and Updates

- showRenderProgress tag to display rendering of tab items
- ehrPlaceholder fix

# 1.0.52 ( 2017-1-12)

## Fixes and Updates

- tabs rendering fix for any hidden elements

# 1.0.51 ( 2017-1-12)

## Fixes and Updates

- tabs rendering timeout fix

# 1.0.50 ( 2017-1-12)

## Fixes and Updates

- tabs rendering notification

# 1.0.49 ( 2017-1-9)

## Fixes and Updates

- DV_CODED_TEXT checkboxes presentation can clear value
- placeholder annotation for text/textarea inputs

# 1.0.48 ( 2017-1-9)

## Fixes and Updates

- listOpen always false on DV_ORDINAL
- updated custom function examples
- coded text placeholder fix

# 1.0.47 ( 2016-12-1)

## Fixes and Updates

- "ehr-form-rendered" event emitted when DV_CODEDTEXT presentation is radios or checkboxes fix

# 1.0.45 ( 2016-11-25)

## Fixes and Updates

- "ehr-form-rendered" event emitted on model update

# 1.0.44 ( 2016-11-24)

## New features

- "ehr-form-rendered" event with formId emitted from form's scope

# 1.0.43 ( 2016-11-23)

## New features

- "noRender" tag disables field to be rendered but keeps model instance
- "viewmode" tag to enable view mode on specific field

## Fixes and Updates

- viewmode can be set on field level in form description

# 1.0.42 ( 2016-11-17)

## Fixes and Updates

- hasValue method on models
- viewmode type "values" that hides fields with no value

# 1.0.41 ( 2016-11-15)

## Fixes and Updates

- tabbing to readonly dropdown field does not open list options
- dropdown list open action is not clearing its value when labels have multiple languages

# 1.0.40 ( 2016-11-14)

## Fixes and Updates

- updated coded text component styles when readOnly value changes
- added sl-SI translations for count Kendo component

# 1.0.39 ( 2016-11-14)

## Fixes and Updates

- external terminology / hide spinner if terminology methods not defined

# 1.0.38 ( 2016-11-10)

## Fixes and Updates

- larger margin on radio/checkbox button groups

# 1.0.37 ( 2016-11-09)

## Fixes and Updates

- prepareValueModel() now runs visitors on original value model instead
of a copy

# 1.0.36 ( 2016-11-08)

## Fixes and Updates

- fix for vctxIsmCurrentState ISM_TRANSITION handling, it now bases its
logic upon the containing ACTION members rather than containing 
container members

# 1.0.35 ( 2016-11-07 )

## New features
- support for ISM_TRANSITION current state setting via 
vctxIsmCurrentState annotation.

## Fixes and Updates
- calculated radio group column margin
- dropdown style update
- containsValue() for DV_PROPORTION will now return true only if
both the numeration and denominator are non-null


# 1.0.34 ( 2016-10-24 )

## Fixes and Updates

- added containsValue() to model API. It determines if the model, or any
of its children, contain a value.
- added the ignoreForContainsValue annotation, which, when present on a model,
will make containsValue() ignore that model and all of its children.

# 1.0.33 ( 2016-10-17 )

## Fixes and Updates

- tabs can be selected from form root custom function

# 1.0.32 ( 2016-10-12 )

## New features

- terminology list on DV_TEXT

# 1.0.31 ( 2016-10-07 )

## Fixes and Updates

- style updates on container bar

# 1.0.30 ( 2016-09-16 )

## Fixes and Updates

- style updates on coded text and input field

# 1.0.29 ( 2016-09-15 )

## New features

- formApi.selectTabByModel method in custom function api for selecting tab
- formApi.getFormElement for getting form's DOM element

## Fixes and Updates

- grayed out radio labels on disabled, more margin between radios

# 1.0.28 ( 2016-09-13 )

## Fixes and Updates

- label can be hidden on custom component
- generic field with custom function will not be added to values object
- removed arrow sprite on containers
- added visual distinction to disabled coded text dropdown

# 1.0.27 ( 2016-09-12 )

## New features

- new formApi methods 'getAfterInputsHolder', 'getBeforeInputsHolder', 'getFieldContentHolder', 'addHtmlAfterInputs', 'addHtmlBeforeInputs', 'getFieldInputsHolderCompiled', 'getLabelHolderCompiled', 'getElementCompiled'.

# 1.0.25 ( 2016-09-8 )

## New features

- new custom function formApi 'getAfterContentPlaceholder', 'getBeforeContentPlaceholder' methods to get placeholder elements

# 1.0.24 ( 2016-09-1 )

## New features

- labels can be positioned above radio buttons with 'inputLabelOnTop' tag
- labels can be hidden for radio buttons with 'inputLabelHide' tag

# 1.0.22 ( 2016-08-25)

## Fixes and Updates

- Wrapped models now treat their wrapper as their parent. As a result, the getRootModel() method now works properly, as does the
finding and setting of externalContext on the formApi.

# 1.0.21 ( 2016-08-18 )

## Fixes and Updates

- multi position label can be customized with "multiPositionText" annotation. By default multi position number is appended to annotation value.
    Placement of number can also be set by placing "[NR]" within annotation string (annotation value ex.: "symptom [NR] recorded").

# 1.0.20 ( 2016-08-8 )

## Fixes and Updates

- multi position label can be hidden with selector

# 1.0.19 ( 2016-08-8 )

## Fixes and Updates

- add/remove multi container buttons hidden in view mode

# 1.0.18 ( 2016-08-5 )

## Fixes and Updates

- coded text component - style update

# 1.0.17 ( 2016-08-4 )

## Fixes and Updates

- coded text component - style update

# 1.0.16 ( 2016-08-3 )

## Fixes and Updates

- coded text component - height style update

# 1.0.15 ( 2016-08-3 )

## Fixes and Updates

- coded text component - height style update
- no error is thrown if no custom function is found

# 1.0.12 ( 2016-08-02 )

## New features

- custom function resolver method or namespace can be defined on context object

## Fixes and Updates

- new field size (xlarge) so medium is smaller
- EhrContext on ehrForm scope is extended by model's context

# 1.0.11 ( 2016-07-21 )

## Fixes and Updates

- form design updates - narrower numeric inputs, smaller padding

# 1.0.10 ( 2016-07-21 )

## Fixes and Updates

- support for multiple forms on same page

# 1.0.9 ( 2016-07-20 )

## Fixes and Updates

- fixed count input display on blur when it initializes hidden from dependencies
- fixed generic field's "ParentRef is not array" warning

# 1.0.8 ( 2016-07-14 )

## New features

- view mode of form renderer displays only input values
- defaultTab annotation for setting initial tab focus for tab group

# 1.0.7 ( 2016-07-11 )

## New features

- disable whole form when root form definition model is read only

## Fixes and Updates

- fixed css for read only containers

# 1.0.6 ( 2016-06-16 )

## Fixes and Updates

- multiDefault attribute implemented on all components
- min, max functionality for single multi fields and containers

# 1.0.5 ( 2016-06-10 )

## New features

- multiDefault attribute for multi container index default values

## Fixes and Updates

- fixed DV_MULTIMEDIA property name
- rendering multi containers based on min value

# 1.0.4 ( 2016-05-16 )

## Fixes and Updates

- fixed max digest loops exception in case of deep form hierarchy

# 1.0.3 ( 2016-05-16 )

## New features

- 'hideDisabled' three-state boolean field tag

# 1.0.2 ( 2016-05-11 )

## Fixes and Updates

- upgraded to Angular 1.5.5

# 1.0.1 ( 2016-04-22 )

## New features

- basic support for DV_PARSABLE

# 1.0.0 ( 2016-04-14 )

## New features

- basic skeleton and form selector dist app html/js

## Fixes and Updates

- date component's display pattern from current locale
- removed IE9 dist app

# 0.94.7 ( 2016-04-14 )

## New features

- basic skeleton and form selector dist app html/js

## Fixes and Updates

- date component's display pattern from current locale
- removed IE9 dist app

# 0.94.5 ( 2016-04-12 )

## New features

- free layout component for creating custom form layouts

## Fixes and Updates

- tabs render faster after first selection

# 0.94.4 ( 2016-04-07 )

## New features

- container tabs with 'tab' annotation

# 0.94.3 ( 2016-04-06 )

## Fixes and Updates

- removed unused fonts from kendo-common in style themes
- added error log if custom function not defined on path

# 0.94.2 ( 2016-04-06 )

## Fixes and Updates

- removed FontAwesome font library
- removed GoogleFonts external dependency
- removed textures directory reference in parent-theme css (still used by kendo-common css)

# 0.94.1 ( 2016-04-05 )

## New features

- new methods on component's scope to easily add new elements before/after label or value: 'appendLabelStart', 'appendLabelEnd', 'appendContentStart', 'appendContentEnd'
- DV_CODEDTEXT multi field validates against configured min/max number of selections

## Fixes and Updates

- EhrContext is unique for each form

# 0.94.00 ( 2016-03-24 )

## New features

- single multi components for all types

## Fixes and Updates

- exclusions custom function update for custom labels, default value
- hide label
- case-insensitive dependencies value comparison

# 0.93.21 ( 2016-03-07 )

## Fixes and Updates

- fixed selected terminology label display

# 0.93.20 (2016-02-09)

## Fixes and Updates

- fixed kendoui path in dist example
- fixed Firefox date parsing for optional selections

# 0.93.18 (2016-02-05)

## New features

- date patterns for optional and forbidden date value part

# 0.93.17 (2016-01-22)

## Fixes and Updates

- fixed layout of column aligned fields

# 0.93.16 (2015-12-03)

## Fixes and Updates

- terminology component initial value KendoUI fix

# 0.93.15 (2015-11-20)

## New features

- ehrform css template files are seaprated from kendo themes - styles they now include form base, kendo common, ehrform kendo theme

# 0.93.14 (2015-11-20)

## New features

## Fixes and Updates

- custom function custom component fix

# 0.93.13 (2015-11-19)

## New features

## Fixes and Updates

- bundling only selected Kendo UI components used in form renderer

# 0.93.12 (2015-11-10)

## New features

- terminology DV_CODED_TEXT component supports 'multi' tag
- added 'displayOnFocus' tag to terminology component

# 0.93.10 (2015-11-2)

## Fixes and Updates

- Terminology input filed reads placeholder from 'placeholder' annotation or 'placeholder.terminology' dictionary value
- Terminology autocomplete KendoUI component can get header and item templates from 'headerTemplate' and 'itemTemplate' annotation values

# 0.93.9 (2015-10-30)

## Fixes and Updates

- Removed debugger statements from code.
- Reworked getter-setters to support undefined values, which Angular sends if the user removes value from a field. Should resolve a number of minor internal
issues, especially with validation, reduce the number of $digest cycles and solve THINKEHR-1281 and HSL-13.


# 0.93.8 (2015-10-23)

## Fixes and Updates

- Generating and sanitizing ng-form names, as they need to be valid javascript identifiers.
- Fixed it so that dependencies get processed when models get added and removed (THINKEHR-1280)

# 0.93.7 (2015-10-20)

## New features


## Fixes and Updates

- custom function for coded text terminology component

# 0.93.6 (2015-10-20)

## New features

- coded text terminology component

## Fixes and Updates



# 0.93.4 (2015-10-13)

## New features


## Fixes and Updates

- kendo radio/checkbox label positioned "relative" to prevent jumping when it receives focus
- Relative position radio button and checkbox containers to get around kendo hidden component scrolling problem, see THINKEHR-1234.
- fixed compound teminology field group if inside multi container

# 0.93.3 (2015-10-2)

## New features

- dependencies can reset and clear containers

## Fixes and Updates

- fixed "fill all" button in compound_fields_terminology_custom_function
- hide/show works on container duplicates
- disabled container border radius fix

# 0.93.2 (2015-10-01)

## New features

- support for dependencies "reset" value
- added resetValue() method to all model classes
- ehrQuantity directive checks 'hideUnit' annotation and if 'true' hides unit label (does not work with dropdown unit fields).
- new DV_TEXT feature for displaying text options from template as radio buttons or combobox
- formApi helper method to find models by tag name (findModelWithTag, findModelsWithTag)
- support for GENERIC_FIELD type that does not register its value to "value model" so its value is not persisted
- added findModelsWithTag, getElementByModelId, getElementByPathId to formApi that is received in custom function

## Fixes and Updates

- init value displayed on ehr-quantity directive
- parsing time on ehr-time directive includes second precision
- can set template values to "Compound Fields Terminology Custom Function" from annotation values: 'headerTemplate', 'itemTitleTemplate', 'itemBodyTemplate'
- hiding ehr-container from viewConfig
- Proper support for adding/removing values in multi coded text from code.
- custom function execution fixed on ehrCodedText and ehrOrdinal

# 0.93.1 (2015-09-21)

## New features

## Fixes and Updates

- moved from KendoUI Pro to KendoUI Core open source version
- ie9 date field fix and duration layout fix

# 0.92.0 (2015-09-15)

## New features

## Fixes and Updates

- upgraded to Angular 1.4.5

# 0.91.0 (2015-09-11)

## New features

- supported 'set' and 'clear' functionality for dependencies
- added applyValue() to models for setting particular model's value type (ex. applyValue(2,'magnitude') or if model has default value type applyValue(2) )

## Fixes and Updates

- supported clearValue() on all templates

# 0.90.0 (2015-09-08)

## New features
- Special build of dist-app for IE9

# 0.20.8 (2015-09-03)

## New features
- IE9 renderer fix

## Fixes and Updates
- Cleaned up the build and release process. All dist apps are built from single index.html file.

# 0.20.5 (2015-09-02)

## Fixes and Updates
- Cleaned up the build and release process.

# 0.20.4 (2015-09-02)

## New features
- New thinkmed-theme.
- Exclusion function demo.

## Fixes and Updates
- Pass proper element to custom function in containers.
- Created console-dev.html, console-dist-app.html, console-dist-app-private.html and console-dist-app-form-selector.html in top dir and added 'build' blocks so .css and .js source files are concatenated and can be updated with Chrome Workspace
- 'dist-app' directory has open source karma js components and can be distributed freely while 'dist-app-private' directory includes karma PRO source code and is for internal use
- 'dist-app' index.html file has hardcoded form description setting while form-selector.html displays checkbox at the top to load form description
- Grunt 'http' task runs server and opens console-dev.html
- Grunt 'http:dist-app' and 'http:dist-app-private' build dist files and load form description with distributed files
- Deprecated 'console-app' - now console-dist-app.html specifies source files and previous console-app/index.html is built into 'dist-app' dir
- dist/thinkehr-forms4-dist.js, dist/thinkehr-component-lib.js files and theme directories are renamed to last version from version.md
- dist .js and .css files are minified
- All files needed for the theme are collected to its own directory and only one .css file is needed in html
- Package script updated for new format
- Parent theme fix
- 'mandatory-field-label' CSS class added to labels in templates if field is mandatory and '*' is displayed with CSS so it can be overridden in themes
- 'multiplicity-label' and  'show-multiplicity' CSS class added to template labels with multiplicity string - can be hidden with theme
- added helper methods for simpler custom functions - example in ehrComponentsLib.bmiSimple custom function
- 'func-not-defined' class added to custom function error if custom function is not defined
- 'dist-app' also includes custom function examples under /dist-app-assets - 'bmi-calc-icon_cf.js' is example for extending existing component, 'bmi-simple_cf.js' only calculates value on existing component, 'coded-text-to-table_cf.js' is a custom component
- added helper methods to custom function execution. Now custom function can add element to form without deferred.resolve() call - just return {element:customElement} object from custom function itself. When custom function needs deferred initialization return false from custom function and later call deferred.resolve({...}) to add element to form.
- Changed TextFieldModel to inherit from DirectValueModel.

## Library upgrades  

- Upgraded kendoui open source to core.2015.2.805
- Relative position radio button and checkbox containers to get around kendo hidden component scrolling problem, see THINKEHR-1234.

# 0.11.5 (2015-10-07)

## Fixes and Updates
- Relative position radio button and checkbox containers to get around kendo hidden component scrolling problem, see THINKEHR-1234.

# 0.11.4 (2015-09-29)

## New features
- Exclusion function demo.

## Fixes and Updates
- Pass proper element to custom function in containers.
- Proper support for adding/removing values in multi coded text from code.

# 0.11.2 (2015-08-25)

## New features
- Support for external context, which is then available inside custom function's apiService. See thinkehr.f4.setExernalContext(model, context).

# 0.11.1 (2015-07-28)

## Fixes and Updates

- Package script updated for new format.

# 0.11.0 (2015-07-28)

## New features
- standard components can be extended in custom function if "function" annotation is present without "custom" tag
- New theme support ("parent")

## Fixes and Updates
- rearranged files so "style" dir is now central part of style related files
- Grunt compiles style templates to dist dir

## Fixes and Updates
- Added getMultiplicityString method to model's viewConfig

# 0.10.3 (2015-06-22)

## New features
- New field: DV_URI ( directives, validation and dependencies).
- New field: DV_EHR_URI (directives, validation and dependencies).

## Fixes and Updates
- New pattern validation and error message
- multiple dependency definitions for same fieldId are collected to single fieldId definition

# 0.10.2 (2015-06-10)

## New features
- New field: DV_DURATION (full support, including validation and dependencies).

## Fixes and Updates
- Disabled container's components will now have their tabIndex set to -1 even when the condition to disable the container is true at the start.
- Dictionary will now return the default value when key is missing in existing localization file.


# 0.10.1 (2015-05-28)

## Fixes and Updates
- Proper support for show and hide actions when the target is a container.
- Proper support for enable and disable actions when the target is a container. The container will now have a semi-transparent glass pane over itself when
 disabled. It will prevent user from entering any input. See `.ehr-glass-panel` rules in `ehr-form-default-css` to customize the pane appearance and correct
 margins and such.
- Updated the console app to work with dependencies.
- Fixed a minor bug with how the dependency tree determines DV_TEXT value.


# 0.10.0 (2015-05-26)

## New features
- Dependency support for all currently supported fields and all their operators and conditions, and the following actions: show, hide, enable, disable.
- Added several utility functions for date and timezone manipulations to model.

## Fixes and Updates
- ProportionFieldModel.denominatorValue() will now properly set and return the fixed denominator, even if it's not specified as the default value.
- ViewConfig.getField(type) is now smarter about how to figure out which field to return (possibly this change is required due to changes in 
description format). 

## Library upgrades
- Upgraded angularjs to 1.3.15
- Upgraded kendoui to pro.2015.1.429


# 0.9.5 (2015-05-28)

# Fixes and Updates
- Integrated bug-fixes regarding proportion fixed denominator and field view config from 0.10.x.

# 0.9.4 (2015-05-15)

## New features
- Added support for custom functions on containers

# 0.9.3 (2015-03-16)

## New features
- Added README.md and CHANGELOG.md
- Added the console example app to the distribution
