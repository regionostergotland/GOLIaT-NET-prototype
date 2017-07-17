(function ($, undefined) {
/* NumericTextBox messages */

if (kendo.ui.NumericTextBox) {
kendo.ui.NumericTextBox.prototype.options =
$.extend(true, kendo.ui.NumericTextBox.prototype.options,{
  "upArrowText": "Povečaj vrednost",
  "downArrowText": "Zmanjšaj vrednost"
});
}

})(window.kendo.jQuery);
