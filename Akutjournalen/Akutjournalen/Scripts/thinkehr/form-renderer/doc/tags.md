# Tags and annotations

This file describes form tags and annotations that are currently understood and acted upon by the thinkehr-forms4 form renderer.

## Tags

### - custom

**tag**: custom

**description**: This tag signifies that the tagged field will be rendered by a custom component. The component will
be returned by a custom function specified by the `function` annotation, and then inserted into the form in place of
the standard field.

**applies to**: any field or container

**related tags**: none

**related annotations**: function


### - multi

**tag**: multi

**description**: This tag can be used on fields that should take multiplicity into account and render in the
multiple values-supported mode. For example, fields will display 'add' and 'remove' buttons.
Fields of type `DV_CODED_TEXT` and `DV_ORDINAL` can be displayed as checkboxes instead of combo boxes or a radio button group.
To display as radios set viewConfig.field.code.presentation='radios' in form description. Checkboxes are displayed if 'multi' tag is present.
To control the number of columns for checkboxes, annotation `columns` can be used.

For containers, this tag means that multiple instances of the container are possible and that the renderer should
provide a way to add and remove them (for example, by displaying add and remove buttons).

**applies to**: any field or container

**related tags**: none

**related annotations**: columns


### - dropdownList

**tag**: dropdownList

**description**: Component has disabled filter and visible list arrow. Input list is displayed on click to component. Default for combobox fields without terminology.

**applies to**: ehrCodedTextComponent directive

**related tags**: none

**related annotations**: none


### - comboBox

**tag**: comboBox

**description**: Component has enabled filter and visible list arrow. Input list is displayed on list arrow click. Filter can be used if terminology is set.

**applies to**: ehrCodedTextComponent directive

**related tags**: none

**related annotations**: none


### - autocomplete

**tag**: comboBox

**description**: Component has enabled filter and hidden list arrow. Input list is not displayed until user starts typing. Filter can be used if terminology is set. Default if terminology is set.

**applies to**: ehrCodedTextComponent directive

**related tags**: none

**related annotations**: none


### - displayOnFocus

**tag**: displayOnFocus

**description**: Loads and displays full terminology items list by sending query with empty string. On terminology with input field items are loaded on focus.

**applies to**: ehrCodedTextComponent directive

**related tags**: none

**related annotations**: none


### - filterEnabled

**tag**: filterEnabled

**description**: User can insert text in terminology filter input field when 'true'.

**applies to**: ehrCodedTextComponent directive

**related tags**: none

**related annotations**: none


### - displayListArrow

**tag**: displayListArrow

**description**: Dropdown arrow is displayed when 'true'.

**applies to**: ehrCodedTextComponent directive

**related tags**: none

**related annotations**: none


### - hideDisabled

**tag**: hideDisabled

**description**: Hides disabled input items in three-state mode.

**applies to**: ehrBoolean directive

**related tags**: none

**related annotations**: none


### - inputLabelOnTop

**tag**: inputLabelOnTop

**description**: Displays input label on top of radio buttons.

**applies to**: ehrCodedTextRadio directive

**related tags**: none

**related annotations**: none


### - inputLabelHide

**tag**: inputLabelHide

**description**: Hides input label on radio buttons.

**applies to**: ehrCodedTextRadio directive

**related tags**: none

**related annotations**: none


### - noRender

**tag**: noRender

**description**: Disables field to be rendered but keeps model instance.

**applies to**: containers and fields

**related tags**: none

**related annotations**: none


### - viewmode

**tag**: viewmode

**description**: Sets view mode on specific field.

**applies to**: fields

**related tags**: none

**related annotations**: none


### - showRenderProgress

**tag**: showRenderProgress

**description**: Displays tab container immediately without waiting for all fields to be rendered.

**applies to**: tab containers

**related tags**: none

**related annotations**: tab


## Annotations

### - columns

**annotation**: columns

**description**: Specifies the number of columns that the supported component should render itself into. For example,
for the `multi` tag on DV_CODED_TEXT and DV_ORDINAL fields, this means the number of columns the checkboxes should
distribute themselves into.

**applies to**: DV_CODED_TEXT or DV_ORDINAL fields whose multiplicity is greater than 1

**value type**: positive integer

**related tags**: multi

**related annotations**: none


### - displayOrdinalValue

**annotation**: displayOrdinalValue

**description**: When set to true, signifies that the label of the DV_ORDINAL field should also display the field's ordinal
(numeric) value (i.e. "8 Severe pain" instead of just "Severe pain"). False by default.

**applies to**: DV_ORDINAL

**value type**: true or false

**related tags**: none

**related annotations**: none


### - function

**annotation**: function

**description**: Specifies the name of the javascript function that will be called in order to initialize the custom
component or extend built-in one. Custom component will be inserted into the form instead of the standard one if "custom" tag is present. 
Otherwise if "custom" tag is not present regular component can be extended with custom function. Any post processing and registration
of Angular scope watches can be performed in the function.

**applies to**: any field or container

**value type**: string

**related tags**: custom

**related annotations**: none

### - tab

**annotation**: tab

**description**: Specifies the container to be included in tab group. To have multiple groups under same parent container set group id as value.
Containers in same group id must be siblings, defined one after another with no other elements in between.

**applies to**: container

**value type**: string

**related tags**: none

**related annotations**: none

### - defaultTab

**annotation**: defaultTab

**description**: Specifies the default tab within tab group. This 'defaultTab' annotation should be added to single container within tab group.

**applies to**: container with tab annotation

**value type**: none

**related tags**: none

**related annotations**: tab

### - hideUnit

**annotation**: hideUnit

**description**: If set to 'true' unit label is hidden on quantity components (ehrQuantity directive).

**applies to**: ehrQuantity directive

**value type**: string

**related tags**: none

**related annotations**: none

### - placeholder

**annotation**: placeholder

**description**: Sets placeholder value for input text field.

**applies to**: all directives with text/textarea input

**value type**: string

**related tags**: none

**related annotations**: none

### - headerTemplate

**annotation**: headerTemplate

**description**: Sets kendo autocomplete component header template. Inside template string '#:currentFieldLabel#' can also be used for localized field label.

**applies to**: ehrCodedTextComponent directive

**value type**: string

**related tags**: none

**related annotations**: none

### - ignoreForContainsValue

**annotation**: ignoreForContainsValue

**description**: Causes the containsValue() model method to ignore this field (or, for containers, any of its children). containsValue() recursively determines if the field, or any of its children, contain a value. 

**applies to**: any element

**value type**: boolean (true or false)

**related tags**: none

**related annotations**: none

### - itemTemplate

**annotation**: itemTemplate

**description**: Sets kendo autocomplete component template for each item.

**applies to**: ehrCodedTextComponent directive

**value type**: string

**related tags**: none

**related annotations**: none


### - itemTemplate

**annotation**: multiDefault

**description**: Sets default values based on index when parent multi container is duplicated.

**applies to**: all components

**value type**: String with values delimited by ';'. Values with multiple properties can be delimited with '|' (quantity example: 'magnitude = 44| unit = kg').

**related tags**: multi on parent container

**related annotations**: none


### - multiPositionText

**annotation**: multiPositionText

**description**: Customizes multi position number in container's title bar. By default multi position number is appended to annotation value. Placement of number within string can also be set by "[NR]" placeholder (annotation value ex.: "symptom [NR] recorded").

**applies to**: all components

**value type**: String that will have multi position number appended. Can also include "[NR]" number placeholder like "symptom [NR] recorded"

**related tags**: multi on container

**related annotations**: none

### - vctxIsmCurrentState

**annotation**: vctxIsmCurrentState

**description**: Specifies what state to set on any underlying ISM_TRANSITION.current_state fields if anything on the parent container of the
ISM_TRANSITION container is set (containsValue() returns true).

**applies to**: ISM_TRANSITION, can be set on any container

**value type**: The code of ISM_TRANSITION.current_state acceptable values (524 - 533). 

**related tags**: none

**related annotations**: none