(function(f, define){
    define([], f);
})(function(){

var __meta__ = {
    id: "core",
    name: "Core",
    category: "framework",
    description: "The core of the Kendo framework."
};

/*jshint eqnull: true, loopfunc: true, evil: true, boss: true, freeze: false*/
(function($, window, undefined) {
    var kendo = window.kendo = window.kendo || { cultures: {} },
        extend = $.extend,
        each = $.each,
        isArray = $.isArray,
        proxy = $.proxy,
        noop = $.noop,
        math = Math,
        Template,
        JSON = window.JSON || {},
        support = {},
        percentRegExp = /%/,
        formatRegExp = /\{(\d+)(:[^\}]+)?\}/g,
        boxShadowRegExp = /(\d+(?:\.?)\d*)px\s*(\d+(?:\.?)\d*)px\s*(\d+(?:\.?)\d*)px\s*(\d+)?/i,
        numberRegExp = /^(\+|-?)\d+(\.?)\d*$/,
        FUNCTION = "function",
        STRING = "string",
        NUMBER = "number",
        OBJECT = "object",
        NULL = "null",
        BOOLEAN = "boolean",
        UNDEFINED = "undefined",
        getterCache = {},
        setterCache = {},
        slice = [].slice,
        globalize = window.Globalize;

    kendo.version = "$KENDO_VERSION";

    function Class() {}

    Class.extend = function(proto) {
        var base = function() {},
            member,
            that = this,
            subclass = proto && proto.init ? proto.init : function () {
                that.apply(this, arguments);
            },
            fn;

        base.prototype = that.prototype;
        fn = subclass.fn = subclass.prototype = new base();

        for (member in proto) {
            if (proto[member] != null && proto[member].constructor === Object) {
                // Merge object members
                fn[member] = extend(true, {}, base.prototype[member], proto[member]);
            } else {
                fn[member] = proto[member];
            }
        }

        fn.constructor = subclass;
        subclass.extend = that.extend;

        return subclass;
    };

    Class.prototype._initOptions = function(options) {
        this.options = deepExtend({}, this.options, options);
    };

    var isFunction = kendo.isFunction = function(fn) {
        return typeof fn === "function";
    };

    var preventDefault = function() {
        this._defaultPrevented = true;
    };

    var isDefaultPrevented = function() {
        return this._defaultPrevented === true;
    };

    var Observable = Class.extend({
        init: function() {
            this._events = {};
        },

        bind: function(eventName, handlers, one) {
            var that = this,
                idx,
                eventNames = typeof eventName === STRING ? [eventName] : eventName,
                length,
                original,
                handler,
                handlersIsFunction = typeof handlers === FUNCTION,
                events;

            if (handlers === undefined) {
                for (idx in eventName) {
                    that.bind(idx, eventName[idx]);
                }
                return that;
            }

            for (idx = 0, length = eventNames.length; idx < length; idx++) {
                eventName = eventNames[idx];

                handler = handlersIsFunction ? handlers : handlers[eventName];

                if (handler) {
                    if (one) {
                        original = handler;
                        handler = function() {
                            that.unbind(eventName, handler);
                            original.apply(that, arguments);
                        };
                        handler.original = original;
                    }
                    events = that._events[eventName] = that._events[eventName] || [];
                    events.push(handler);
                }
            }

            return that;
        },

        one: function(eventNames, handlers) {
            return this.bind(eventNames, handlers, true);
        },

        first: function(eventName, handlers) {
            var that = this,
                idx,
                eventNames = typeof eventName === STRING ? [eventName] : eventName,
                length,
                handler,
                handlersIsFunction = typeof handlers === FUNCTION,
                events;

            for (idx = 0, length = eventNames.length; idx < length; idx++) {
                eventName = eventNames[idx];

                handler = handlersIsFunction ? handlers : handlers[eventName];

                if (handler) {
                    events = that._events[eventName] = that._events[eventName] || [];
                    events.unshift(handler);
                }
            }

            return that;
        },

        trigger: function(eventName, e) {
            var that = this,
                events = that._events[eventName],
                idx,
                length;

            if (events) {
                e = e || {};

                e.sender = that;

                e._defaultPrevented = false;

                e.preventDefault = preventDefault;

                e.isDefaultPrevented = isDefaultPrevented;

                events = events.slice();

                for (idx = 0, length = events.length; idx < length; idx++) {
                    events[idx].call(that, e);
                }

                return e._defaultPrevented === true;
            }

            return false;
        },

        unbind: function(eventName, handler) {
            var that = this,
                events = that._events[eventName],
                idx;

            if (eventName === undefined) {
                that._events = {};
            } else if (events) {
                if (handler) {
                    for (idx = events.length - 1; idx >= 0; idx--) {
                        if (events[idx] === handler || events[idx].original === handler) {
                            events.splice(idx, 1);
                        }
                    }
                } else {
                    that._events[eventName] = [];
                }
            }

            return that;
        }
    });


     function compilePart(part, stringPart) {
         if (stringPart) {
             return "'" +
                 part.split("'").join("\\'")
                     .split('\\"').join('\\\\\\"')
                     .replace(/\n/g, "\\n")
                     .replace(/\r/g, "\\r")
                     .replace(/\t/g, "\\t") + "'";
         } else {
             var first = part.charAt(0),
                 rest = part.substring(1);

             if (first === "=") {
                 return "+(" + rest + ")+";
             } else if (first === ":") {
                 return "+$kendoHtmlEncode(" + rest + ")+";
             } else {
                 return ";" + part + ";$kendoOutput+=";
             }
         }
     }

    var argumentNameRegExp = /^\w+/,
        encodeRegExp = /\$\{([^}]*)\}/g,
        escapedCurlyRegExp = /\\\}/g,
        curlyRegExp = /__CURLY__/g,
        escapedSharpRegExp = /\\#/g,
        sharpRegExp = /__SHARP__/g,
        zeros = ["", "0", "00", "000", "0000"];

    Template = {
        paramName: "data", // name of the parameter of the generated template
        useWithBlock: true, // whether to wrap the template in a with() block
        render: function(template, data) {
            var idx,
                length,
                html = "";

            for (idx = 0, length = data.length; idx < length; idx++) {
                html += template(data[idx]);
            }

            return html;
        },
        compile: function(template, options) {
            var settings = extend({}, this, options),
                paramName = settings.paramName,
                argumentName = paramName.match(argumentNameRegExp)[0],
                useWithBlock = settings.useWithBlock,
                functionBody = "var $kendoOutput, $kendoHtmlEncode = kendo.htmlEncode;",
                fn,
                parts,
                idx;

            if (isFunction(template)) {
                return template;
            }

            functionBody += useWithBlock ? "with(" + paramName + "){" : "";

            functionBody += "$kendoOutput=";

            parts = template
                .replace(escapedCurlyRegExp, "__CURLY__")
                .replace(encodeRegExp, "#=$kendoHtmlEncode($1)#")
                .replace(curlyRegExp, "}")
                .replace(escapedSharpRegExp, "__SHARP__")
                .split("#");

            for (idx = 0; idx < parts.length; idx ++) {
                functionBody += compilePart(parts[idx], idx % 2 === 0);
            }

            functionBody += useWithBlock ? ";}" : ";";

            functionBody += "return $kendoOutput;";

            functionBody = functionBody.replace(sharpRegExp, "#");

            try {
                fn = new Function(argumentName, functionBody);
                fn._slotCount = Math.floor(parts.length / 2);
                return fn;
            } catch(e) {
                throw new Error(kendo.format("Invalid template:'{0}' Generated code:'{1}'", template, functionBody));
            }
        }
    };

function pad(number, digits, end) {
    number = number + "";
    digits = digits || 2;
    end = digits - number.length;

    if (end) {
        return zeros[digits].substring(0, end) + number;
    }

    return number;
}

    //JSON stringify
(function() {
    var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"" : '\\"',
            "\\": "\\\\"
        },
        rep,
        toString = {}.toString;


    if (typeof Date.prototype.toJSON !== FUNCTION) {

        Date.prototype.toJSON = function () {
            var that = this;

            return isFinite(that.valueOf()) ?
                pad(that.getUTCFullYear(), 4) + "-" +
                pad(that.getUTCMonth() + 1)   + "-" +
                pad(that.getUTCDate())        + "T" +
                pad(that.getUTCHours())       + ":" +
                pad(that.getUTCMinutes())     + ":" +
                pad(that.getUTCSeconds())     + "Z" : null;
        };

        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function () {
            return this.valueOf();
        };
    }

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? "\"" + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === STRING ? c :
                "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + "\"" : "\"" + string + "\"";
    }

    function str(key, holder) {
        var i,
            k,
            v,
            length,
            mind = gap,
            partial,
            value = holder[key],
            type;

        if (value && typeof value === OBJECT && typeof value.toJSON === FUNCTION) {
            value = value.toJSON(key);
        }

        if (typeof rep === FUNCTION) {
            value = rep.call(holder, key, value);
        }

        type = typeof value;
        if (type === STRING) {
            return quote(value);
        } else if (type === NUMBER) {
            return isFinite(value) ? String(value) : NULL;
        } else if (type === BOOLEAN || type === NULL) {
            return String(value);
        } else if (type === OBJECT) {
            if (!value) {
                return NULL;
            }
            gap += indent;
            partial = [];
            if (toString.apply(value) === "[object Array]") {
                length = value.length;
                for (i = 0; i < length; i++) {
                    partial[i] = str(i, value) || NULL;
                }
                v = partial.length === 0 ? "[]" : gap ?
                    "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" :
                    "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }
            if (rep && typeof rep === OBJECT) {
                length = rep.length;
                for (i = 0; i < length; i++) {
                    if (typeof rep[i] === STRING) {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            } else {
                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            }

            v = partial.length === 0 ? "{}" : gap ?
                "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" :
                "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

    if (typeof JSON.stringify !== FUNCTION) {
        JSON.stringify = function (value, replacer, space) {
            var i;
            gap = "";
            indent = "";

            if (typeof space === NUMBER) {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

            } else if (typeof space === STRING) {
                indent = space;
            }

            rep = replacer;
            if (replacer && typeof replacer !== FUNCTION && (typeof replacer !== OBJECT || typeof replacer.length !== NUMBER)) {
                throw new Error("JSON.stringify");
            }

            return str("", {"": value});
        };
    }
})();

// Date and Number formatting
(function() {
    var dateFormatRegExp = /dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|HH|H|hh|h|mm|m|fff|ff|f|tt|ss|s|zzz|zz|z|"[^"]*"|'[^']*'/g,
        standardFormatRegExp =  /^(n|c|p|e)(\d*)$/i,
        literalRegExp = /(\\.)|(['][^']*[']?)|(["][^"]*["]?)/g,
        commaRegExp = /\,/g,
        EMPTY = "",
        POINT = ".",
        COMMA = ",",
        SHARP = "#",
        ZERO = "0",
        PLACEHOLDER = "??",
        EN = "en-US",
        objectToString = {}.toString;

    //cultures
    kendo.cultures["en-US"] = {
        name: EN,
        numberFormat: {
            pattern: ["-n"],
            decimals: 2,
            ",": ",",
            ".": ".",
            groupSize: [3],
            percent: {
                pattern: ["-n %", "n %"],
                decimals: 2,
                ",": ",",
                ".": ".",
                groupSize: [3],
                symbol: "%"
            },
            currency: {
                pattern: ["($n)", "$n"],
                decimals: 2,
                ",": ",",
                ".": ".",
                groupSize: [3],
                symbol: "$"
            }
        },
        calendars: {
            standard: {
                days: {
                    names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    namesAbbr: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                    namesShort: [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ]
                },
                months: {
                    names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                    namesAbbr: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                },
                AM: [ "AM", "am", "AM" ],
                PM: [ "PM", "pm", "PM" ],
                patterns: {
                    d: "M/d/yyyy",
                    D: "dddd, MMMM dd, yyyy",
                    F: "dddd, MMMM dd, yyyy h:mm:ss tt",
                    g: "M/d/yyyy h:mm tt",
                    G: "M/d/yyyy h:mm:ss tt",
                    m: "MMMM dd",
                    M: "MMMM dd",
                    s: "yyyy'-'MM'-'ddTHH':'mm':'ss",
                    t: "h:mm tt",
                    T: "h:mm:ss tt",
                    u: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'",
                    y: "MMMM, yyyy",
                    Y: "MMMM, yyyy"
                },
                "/": "/",
                ":": ":",
                firstDay: 0,
                twoDigitYearMax: 2029
            }
        }
    };


     function findCulture(culture) {
        if (culture) {
            if (culture.numberFormat) {
                return culture;
            }

            if (typeof culture === STRING) {
                var cultures = kendo.cultures;
                return cultures[culture] || cultures[culture.split("-")[0]] || null;
            }

            return null;
        }

        return null;
    }

    function getCulture(culture) {
        if (culture) {
            culture = findCulture(culture);
        }

        return culture || kendo.cultures.current;
    }

    function expandNumberFormat(numberFormat) {
        numberFormat.groupSizes = numberFormat.groupSize;
        numberFormat.percent.groupSizes = numberFormat.percent.groupSize;
        numberFormat.currency.groupSizes = numberFormat.currency.groupSize;
    }

    kendo.culture = function(cultureName) {
        var cultures = kendo.cultures, culture;

        if (cultureName !== undefined) {
            culture = findCulture(cultureName) || cultures[EN];
            culture.calendar = culture.calendars.standard;
            cultures.current = culture;

            if (globalize && !globalize.load) {
                expandNumberFormat(culture.numberFormat);
            }

        } else {
            return cultures.current;
        }
    };

    kendo.findCulture = findCulture;
    kendo.getCulture = getCulture;

    //set current culture to en-US.
    kendo.culture(EN);

    function formatDate(date, format, culture) {
        culture = getCulture(culture);

        var calendar = culture.calendars.standard,
            days = calendar.days,
            months = calendar.months;

        format = calendar.patterns[format] || format;

        return format.replace(dateFormatRegExp, function (match) {
            var minutes;
            var result;
            var sign;

            if (match === "d") {
                result = date.getDate();
            } else if (match === "dd") {
                result = pad(date.getDate());
            } else if (match === "ddd") {
                result = days.namesAbbr[date.getDay()];
            } else if (match === "dddd") {
                result = days.names[date.getDay()];
            } else if (match === "M") {
                result = date.getMonth() + 1;
            } else if (match === "MM") {
                result = pad(date.getMonth() + 1);
            } else if (match === "MMM") {
                result = months.namesAbbr[date.getMonth()];
            } else if (match === "MMMM") {
                result = months.names[date.getMonth()];
            } else if (match === "yy") {
                result = pad(date.getFullYear() % 100);
            } else if (match === "yyyy") {
                result = pad(date.getFullYear(), 4);
            } else if (match === "h" ) {
                result = date.getHours() % 12 || 12;
            } else if (match === "hh") {
                result = pad(date.getHours() % 12 || 12);
            } else if (match === "H") {
                result = date.getHours();
            } else if (match === "HH") {
                result = pad(date.getHours());
            } else if (match === "m") {
                result = date.getMinutes();
            } else if (match === "mm") {
                result = pad(date.getMinutes());
            } else if (match === "s") {
                result = date.getSeconds();
            } else if (match === "ss") {
                result = pad(date.getSeconds());
            } else if (match === "f") {
                result = math.floor(date.getMilliseconds() / 100);
            } else if (match === "ff") {
                result = date.getMilliseconds();
                if (result > 99) {
                    result = math.floor(result / 10);
                }
                result = pad(result);
            } else if (match === "fff") {
                result = pad(date.getMilliseconds(), 3);
            } else if (match === "tt") {
                result = date.getHours() < 12 ? calendar.AM[0] : calendar.PM[0];
            } else if (match === "zzz") {
                minutes = date.getTimezoneOffset();
                sign = minutes < 0;

                result = math.abs(minutes / 60).toString().split(".")[0];
                minutes = math.abs(minutes) - (result * 60);

                result = (sign ? "+" : "-") + pad(result);
                result += ":" + pad(minutes);
            } else if (match === "zz" || match === "z") {
                result = date.getTimezoneOffset() / 60;
                sign = result < 0;

                result = math.abs(result).toString().split(".")[0];
                result = (sign ? "+" : "-") + (match === "zz" ? pad(result) : result);
            }

            return result !== undefined ? result : match.slice(1, match.length - 1);
        });
    }

    //number formatting
    function formatNumber(number, format, culture) {
        culture = getCulture(culture);

        var numberFormat = culture.numberFormat,
            groupSize = numberFormat.groupSize[0],
            groupSeparator = numberFormat[COMMA],
            decimal = numberFormat[POINT],
            precision = numberFormat.decimals,
            pattern = numberFormat.pattern[0],
            literals = [],
            symbol,
            isCurrency, isPercent,
            customPrecision,
            formatAndPrecision,
            negative = number < 0,
            integer,
            fraction,
            integerLength,
            fractionLength,
            replacement = EMPTY,
            value = EMPTY,
            idx,
            length,
            ch,
            hasGroup,
            hasNegativeFormat,
            decimalIndex,
            sharpIndex,
            zeroIndex,
            hasZero, hasSharp,
            percentIndex,
            currencyIndex,
            startZeroIndex,
            start = -1,
            end;

        //return empty string if no number
        if (number === undefined) {
            return EMPTY;
        }

        if (!isFinite(number)) {
            return number;
        }

        //if no format then return number.toString() or number.toLocaleString() if culture.name is not defined
        if (!format) {
            return culture.name.length ? number.toLocaleString() : number.toString();
        }

        formatAndPrecision = standardFormatRegExp.exec(format);

        // standard formatting
        if (formatAndPrecision) {
            format = formatAndPrecision[1].toLowerCase();

            isCurrency = format === "c";
            isPercent = format === "p";

            if (isCurrency || isPercent) {
                //get specific number format information if format is currency or percent
                numberFormat = isCurrency ? numberFormat.currency : numberFormat.percent;
                groupSize = numberFormat.groupSize[0];
                groupSeparator = numberFormat[COMMA];
                decimal = numberFormat[POINT];
                precision = numberFormat.decimals;
                symbol = numberFormat.symbol;
                pattern = numberFormat.pattern[negative ? 0 : 1];
            }

            customPrecision = formatAndPrecision[2];

            if (customPrecision) {
                precision = +customPrecision;
            }

            //return number in exponential format
            if (format === "e") {
                return customPrecision ? number.toExponential(precision) : number.toExponential(); // toExponential() and toExponential(undefined) differ in FF #653438.
            }

            // multiply if format is percent
            if (isPercent) {
                number *= 100;
            }

            number = round(number, precision);
            negative = number < 0;
            number = number.split(POINT);

            integer = number[0];
            fraction = number[1];

            //exclude "-" if number is negative.
            if (negative) {
                integer = integer.substring(1);
            }

            value = integer;
            integerLength = integer.length;

            //add group separator to the number if it is longer enough
            if (integerLength >= groupSize) {
                value = EMPTY;
                for (idx = 0; idx < integerLength; idx++) {
                    if (idx > 0 && (integerLength - idx) % groupSize === 0) {
                        value += groupSeparator;
                    }
                    value += integer.charAt(idx);
                }
            }

            if (fraction) {
                value += decimal + fraction;
            }

            if (format === "n" && !negative) {
                return value;
            }

            number = EMPTY;

            for (idx = 0, length = pattern.length; idx < length; idx++) {
                ch = pattern.charAt(idx);

                if (ch === "n") {
                    number += value;
                } else if (ch === "$" || ch === "%") {
                    number += symbol;
                } else {
                    number += ch;
                }
            }

            return number;
        }

        //custom formatting
        //
        //separate format by sections.

        //make number positive
        if (negative) {
            number = -number;
        }

        if (format.indexOf("'") > -1 || format.indexOf("\"") > -1 || format.indexOf("\\") > -1) {
            format = format.replace(literalRegExp, function (match) {
                var quoteChar = match.charAt(0).replace("\\", ""),
                    literal = match.slice(1).replace(quoteChar, "");

                literals.push(literal);

                return PLACEHOLDER;
            });
        }

        format = format.split(";");
        if (negative && format[1]) {
            //get negative format
            format = format[1];
            hasNegativeFormat = true;
        } else if (number === 0) {
            //format for zeros
            format = format[2] || format[0];
            if (format.indexOf(SHARP) == -1 && format.indexOf(ZERO) == -1) {
                //return format if it is string constant.
                return format;
            }
        } else {
            format = format[0];
        }

        percentIndex = format.indexOf("%");
        currencyIndex = format.indexOf("$");

        isPercent = percentIndex != -1;
        isCurrency = currencyIndex != -1;

        //multiply number if the format has percent
        if (isPercent) {
            number *= 100;
        }

        if (isCurrency && format[currencyIndex - 1] === "\\") {
            format = format.split("\\").join("");
            isCurrency = false;
        }

        if (isCurrency || isPercent) {
            //get specific number format information if format is currency or percent
            numberFormat = isCurrency ? numberFormat.currency : numberFormat.percent;
            groupSize = numberFormat.groupSize[0];
            groupSeparator = numberFormat[COMMA];
            decimal = numberFormat[POINT];
            precision = numberFormat.decimals;
            symbol = numberFormat.symbol;
        }

        hasGroup = format.indexOf(COMMA) > -1;
        if (hasGroup) {
            format = format.replace(commaRegExp, EMPTY);
        }

        decimalIndex = format.indexOf(POINT);
        length = format.length;

        if (decimalIndex != -1) {
            fraction = number.toString().split("e");
            if (fraction[1]) {
                fraction = round(number, Math.abs(fraction[1]));
            } else {
                fraction = fraction[0];
            }
            fraction = fraction.split(POINT)[1] || EMPTY;
            zeroIndex = format.lastIndexOf(ZERO) - decimalIndex;
            sharpIndex = format.lastIndexOf(SHARP) - decimalIndex;
            hasZero = zeroIndex > -1;
            hasSharp = sharpIndex > -1;
            idx = fraction.length;

            if (!hasZero && !hasSharp) {
                format = format.substring(0, decimalIndex) + format.substring(decimalIndex + 1);
                length = format.length;
                decimalIndex = -1;
                idx = 0;
            } if (hasZero && zeroIndex > sharpIndex) {
                idx = zeroIndex;
            } else if (sharpIndex > zeroIndex) {
                if (hasSharp && idx > sharpIndex) {
                    idx = sharpIndex;
                } else if (hasZero && idx < zeroIndex) {
                    idx = zeroIndex;
                }
            }

            if (idx > -1) {
                number = round(number, idx);
            }
        } else {
            number = round(number);
        }

        sharpIndex = format.indexOf(SHARP);
        startZeroIndex = zeroIndex = format.indexOf(ZERO);

        //define the index of the first digit placeholder
        if (sharpIndex == -1 && zeroIndex != -1) {
            start = zeroIndex;
        } else if (sharpIndex != -1 && zeroIndex == -1) {
            start = sharpIndex;
        } else {
            start = sharpIndex > zeroIndex ? zeroIndex : sharpIndex;
        }

        sharpIndex = format.lastIndexOf(SHARP);
        zeroIndex = format.lastIndexOf(ZERO);

        //define the index of the last digit placeholder
        if (sharpIndex == -1 && zeroIndex != -1) {
            end = zeroIndex;
        } else if (sharpIndex != -1 && zeroIndex == -1) {
            end = sharpIndex;
        } else {
            end = sharpIndex > zeroIndex ? sharpIndex : zeroIndex;
        }

        if (start == length) {
            end = start;
        }

        if (start != -1) {
            value = number.toString().split(POINT);
            integer = value[0];
            fraction = value[1] || EMPTY;

            integerLength = integer.length;
            fractionLength = fraction.length;

            if (negative && (number * -1) >= 0) {
                negative = false;
            }

            //add group separator to the number if it is longer enough
            if (hasGroup) {
                if (integerLength === groupSize && integerLength < decimalIndex - startZeroIndex) {
                    integer = groupSeparator + integer;
                } else if (integerLength > groupSize) {
                    value = EMPTY;
                    for (idx = 0; idx < integerLength; idx++) {
                        if (idx > 0 && (integerLength - idx) % groupSize === 0) {
                            value += groupSeparator;
                        }
                        value += integer.charAt(idx);
                    }

                    integer = value;
                }
            }

            number = format.substring(0, start);

            if (negative && !hasNegativeFormat) {
                number += "-";
            }

            for (idx = start; idx < length; idx++) {
                ch = format.charAt(idx);

                if (decimalIndex == -1) {
                    if (end - idx < integerLength) {
                        number += integer;
                        break;
                    }
                } else {
                    if (zeroIndex != -1 && zeroIndex < idx) {
                        replacement = EMPTY;
                    }

                    if ((decimalIndex - idx) <= integerLength && decimalIndex - idx > -1) {
                        number += integer;
                        idx = decimalIndex;
                    }

                    if (decimalIndex === idx) {
                        number += (fraction ? decimal : EMPTY) + fraction;
                        idx += end - decimalIndex + 1;
                        continue;
                    }
                }

                if (ch === ZERO) {
                    number += ch;
                    replacement = ch;
                } else if (ch === SHARP) {
                    number += replacement;
                }
            }

            if (end >= start) {
                number += format.substring(end + 1);
            }

            //replace symbol placeholders
            if (isCurrency || isPercent) {
                value = EMPTY;
                for (idx = 0, length = number.length; idx < length; idx++) {
                    ch = number.charAt(idx);
                    value += (ch === "$" || ch === "%") ? symbol : ch;
                }
                number = value;
            }

            length = literals.length;

            if (length) {
                for (idx = 0; idx < length; idx++) {
                    number = number.replace(PLACEHOLDER, literals[idx]);
                }
            }
        }

        return number;
    }

    var round = function(value, precision) {
        precision = precision || 0;

        value = value.toString().split('e');
        value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + precision) : precision)));

        value = value.toString().split('e');
        value = +(value[0] + 'e' + (value[1] ? (+value[1] - precision) : -precision));

        return value.toFixed(precision);
    };

    var toString = function(value, fmt, culture) {
        if (fmt) {
            if (objectToString.call(value) === "[object Date]") {
                return formatDate(value, fmt, culture);
            } else if (typeof value === NUMBER) {
                return formatNumber(value, fmt, culture);
            }
        }

        return value !== undefined ? value : "";
    };

    if (globalize && !globalize.load) {
        toString = function(value, format, culture) {
            if ($.isPlainObject(culture)) {
                culture = culture.name;
            }

            return globalize.format(value, format, culture);
        };
    }

    kendo.format = function(fmt) {
        var values = arguments;

        return fmt.replace(formatRegExp, function(match, index, placeholderFormat) {
            var value = values[parseInt(index, 10) + 1];

            return toString(value, placeholderFormat ? placeholderFormat.substring(1) : "");
        });
    };

    kendo._extractFormat = function (format) {
        if (format.slice(0,3) === "{0:") {
            format = format.slice(3, format.length - 1);
        }

        return format;
    };

    kendo._activeElement = function() {
        try {
            return document.activeElement;
        } catch(e) {
            return document.documentElement.activeElement;
        }
    };

    kendo._round = round;
    kendo.toString = toString;
})();


(function() {
    var nonBreakingSpaceRegExp = /\u00A0/g,
        exponentRegExp = /[eE][\-+]?[0-9]+/,
        shortTimeZoneRegExp = /[+|\-]\d{1,2}/,
        longTimeZoneRegExp = /[+|\-]\d{1,2}:?\d{2}/,
        dateRegExp = /^\/Date\((.*?)\)\/$/,
        offsetRegExp = /[+-]\d*/,
        formatsSequence = ["G", "g", "d", "F", "D", "y", "m", "T", "t"],
        numberRegExp = {
            2: /^\d{1,2}/,
            3: /^\d{1,3}/,
            4: /^\d{4}/
        },
        objectToString = {}.toString;

    function outOfRange(value, start, end) {
        return !(value >= start && value <= end);
    }

    function designatorPredicate(designator) {
        return designator.charAt(0);
    }

    function mapDesignators(designators) {
        return $.map(designators, designatorPredicate);
    }

    //if date's day is different than the typed one - adjust
    function adjustDST(date, hours) {
        if (!hours && date.getHours() === 23) {
            date.setHours(date.getHours() + 2);
        }
    }

    function lowerArray(data) {
        var idx = 0,
            length = data.length,
            array = [];

        for (; idx < length; idx++) {
            array[idx] = (data[idx] + "").toLowerCase();
        }

        return array;
    }

    function lowerLocalInfo(localInfo) {
        var newLocalInfo = {}, property;

        for (property in localInfo) {
            newLocalInfo[property] = lowerArray(localInfo[property]);
        }

        return newLocalInfo;
    }

    function parseExact(value, format, culture) {
        if (!value) {
            return null;
        }

        var lookAhead = function (match) {
                var i = 0;
                while (format[idx] === match) {
                    i++;
                    idx++;
                }
                if (i > 0) {
                    idx -= 1;
                }
                return i;
            },
            getNumber = function(size) {
                var rg = numberRegExp[size] || new RegExp('^\\d{1,' + size + '}'),
                    match = value.substr(valueIdx, size).match(rg);

                if (match) {
                    match = match[0];
                    valueIdx += match.length;
                    return parseInt(match, 10);
                }
                return null;
            },
            getIndexByName = function (names, lower) {
                var i = 0,
                    length = names.length,
                    name, nameLength,
                    subValue;

                for (; i < length; i++) {
                    name = names[i];
                    nameLength = name.length;
                    subValue = value.substr(valueIdx, nameLength);

                    if (lower) {
                        subValue = subValue.toLowerCase();
                    }

                    if (subValue == name) {
                        valueIdx += nameLength;
                        return i + 1;
                    }
                }
                return null;
            },
            checkLiteral = function() {
                var result = false;
                if (value.charAt(valueIdx) === format[idx]) {
                    valueIdx++;
                    result = true;
                }
                return result;
            },
            calendar = culture.calendars.standard,
            year = null,
            month = null,
            day = null,
            hours = null,
            minutes = null,
            seconds = null,
            milliseconds = null,
            idx = 0,
            valueIdx = 0,
            literal = false,
            date = new Date(),
            twoDigitYearMax = calendar.twoDigitYearMax || 2029,
            defaultYear = date.getFullYear(),
            ch, count, length, pattern,
            pmHour, UTC, matches,
            amDesignators, pmDesignators,
            hoursOffset, minutesOffset,
            hasTime, match;

        if (!format) {
            format = "d"; //shord date format
        }

        //if format is part of the patterns get real format
        pattern = calendar.patterns[format];
        if (pattern) {
            format = pattern;
        }

        format = format.split("");
        length = format.length;

        for (; idx < length; idx++) {
            ch = format[idx];

            if (literal) {
                if (ch === "'") {
                    literal = false;
                } else {
                    checkLiteral();
                }
            } else {
                if (ch === "d") {
                    count = lookAhead("d");
                    if (!calendar._lowerDays) {
                        calendar._lowerDays = lowerLocalInfo(calendar.days);
                    }

                    if (day !== null && count > 2) {
                        continue;
                    }

                    day = count < 3 ? getNumber(2) : getIndexByName(calendar._lowerDays[count == 3 ? "namesAbbr" : "names"], true);

                    if (day === null || outOfRange(day, 1, 31)) {
                        return null;
                    }
                } else if (ch === "M") {
                    count = lookAhead("M");
                    if (!calendar._lowerMonths) {
                        calendar._lowerMonths = lowerLocalInfo(calendar.months);
                    }
                    month = count < 3 ? getNumber(2) : getIndexByName(calendar._lowerMonths[count == 3 ? 'namesAbbr' : 'names'], true);

                    if (month === null || outOfRange(month, 1, 12)) {
                        return null;
                    }
                    month -= 1; //because month is zero based
                } else if (ch === "y") {
                    count = lookAhead("y");
                    year = getNumber(count);

                    if (year === null) {
                        return null;
                    }

                    if (count == 2) {
                        if (typeof twoDigitYearMax === "string") {
                            twoDigitYearMax = defaultYear + parseInt(twoDigitYearMax, 10);
                        }

                        year = (defaultYear - defaultYear % 100) + year;
                        if (year > twoDigitYearMax) {
                            year -= 100;
                        }
                    }
                } else if (ch === "h" ) {
                    lookAhead("h");
                    hours = getNumber(2);
                    if (hours == 12) {
                        hours = 0;
                    }
                    if (hours === null || outOfRange(hours, 0, 11)) {
                        return null;
                    }
                } else if (ch === "H") {
                    lookAhead("H");
                    hours = getNumber(2);
                    if (hours === null || outOfRange(hours, 0, 23)) {
                        return null;
                    }
                } else if (ch === "m") {
                    lookAhead("m");
                    minutes = getNumber(2);
                    if (minutes === null || outOfRange(minutes, 0, 59)) {
                        return null;
                    }
                } else if (ch === "s") {
                    lookAhead("s");
                    seconds = getNumber(2);
                    if (seconds === null || outOfRange(seconds, 0, 59)) {
                        return null;
                    }
                } else if (ch === "f") {
                    count = lookAhead("f");

                    match = value.substr(valueIdx, count).match(numberRegExp[3]);
                    milliseconds = getNumber(count);

                    if (milliseconds !== null) {
                        match = match[0].length;

                        if (match < 3) {
                            milliseconds *= Math.pow(10, (3 - match));
                        }

                        if (count > 3) {
                            milliseconds = parseInt(milliseconds.toString().substring(0, 3), 10);
                        }
                    }

                    if (milliseconds === null || outOfRange(milliseconds, 0, 999)) {
                        return null;
                    }

                } else if (ch === "t") {
                    count = lookAhead("t");
                    amDesignators = calendar.AM;
                    pmDesignators = calendar.PM;

                    if (count === 1) {
                        amDesignators = mapDesignators(amDesignators);
                        pmDesignators = mapDesignators(pmDesignators);
                    }

                    pmHour = getIndexByName(pmDesignators);
                    if (!pmHour && !getIndexByName(amDesignators)) {
                        return null;
                    }
                }
                else if (ch === "z") {
                    UTC = true;
                    count = lookAhead("z");

                    if (value.substr(valueIdx, 1) === "Z") {
                        checkLiteral();
                        continue;
                    }

                    matches = value.substr(valueIdx, 6)
                                   .match(count > 2 ? longTimeZoneRegExp : shortTimeZoneRegExp);

                    if (!matches) {
                        return null;
                    }

                    matches = matches[0].split(":");

                    hoursOffset = matches[0];
                    minutesOffset = matches[1];

                    if (!minutesOffset && hoursOffset.length > 3) { //(+|-)[hh][mm] format is used
                        valueIdx = hoursOffset.length - 2;
                        minutesOffset = hoursOffset.substring(valueIdx);
                        hoursOffset = hoursOffset.substring(0, valueIdx);
                    }

                    hoursOffset = parseInt(hoursOffset, 10);
                    if (outOfRange(hoursOffset, -12, 13)) {
                        return null;
                    }

                    if (count > 2) {
                        minutesOffset = parseInt(minutesOffset, 10);
                        if (isNaN(minutesOffset) || outOfRange(minutesOffset, 0, 59)) {
                            return null;
                        }
                    }
                } else if (ch === "'") {
                    literal = true;
                    checkLiteral();
                } else if (!checkLiteral()) {
                    return null;
                }
            }
        }

        hasTime = hours !== null || minutes !== null || seconds || null;

        if (year === null && month === null && day === null && hasTime) {
            year = defaultYear;
            month = date.getMonth();
            day = date.getDate();
        } else {
            if (year === null) {
                year = defaultYear;
            }

            if (day === null) {
                day = 1;
            }
        }

        if (pmHour && hours < 12) {
            hours += 12;
        }

        if (UTC) {
            if (hoursOffset) {
                hours += -hoursOffset;
            }

            if (minutesOffset) {
                minutes += -minutesOffset;
            }

            value = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
        } else {
            value = new Date(year, month, day, hours, minutes, seconds, milliseconds);
            adjustDST(value, hours);
        }

        if (year < 100) {
            value.setFullYear(year);
        }

        if (value.getDate() !== day && UTC === undefined) {
            return null;
        }

        return value;
    }

    function parseMicrosoftFormatOffset(offset) {
        var sign = offset.substr(0, 1) === "-" ? -1 : 1;

        offset = offset.substring(1);
        offset = (parseInt(offset.substr(0, 2), 10) * 60) + parseInt(offset.substring(2), 10);

        return sign * offset;
    }

    kendo.parseDate = function(value, formats, culture) {
        if (objectToString.call(value) === "[object Date]") {
            return value;
        }

        var idx = 0;
        var date = null;
        var length, patterns;
        var tzoffset;
        var sign;

        if (value && value.indexOf("/D") === 0) {
            date = dateRegExp.exec(value);
            if (date) {
                date = date[1];
                tzoffset = offsetRegExp.exec(date.substring(1));

                date = new Date(parseInt(date, 10));

                if (tzoffset) {
                    tzoffset = parseMicrosoftFormatOffset(tzoffset[0]);
                    date = kendo.timezone.apply(date, 0);
                    date = kendo.timezone.convert(date, 0, -1 * tzoffset);
                }

                return date;
            }
        }

        culture = kendo.getCulture(culture);

        if (!formats) {
            formats = [];
            patterns = culture.calendar.patterns;
            length = formatsSequence.length;

            for (; idx < length; idx++) {
                formats[idx] = patterns[formatsSequence[idx]];
            }

            idx = 0;

            formats = [
                "yyyy/MM/dd HH:mm:ss",
                "yyyy/MM/dd HH:mm",
                "yyyy/MM/dd",
                "ddd MMM dd yyyy HH:mm:ss",
                "yyyy-MM-ddTHH:mm:ss.fffffffzzz",
                "yyyy-MM-ddTHH:mm:ss.fffzzz",
                "yyyy-MM-ddTHH:mm:sszzz",
                "yyyy-MM-ddTHH:mm:ss.fffffff",
                "yyyy-MM-ddTHH:mm:ss.fff",
                "yyyy-MM-ddTHH:mmzzz",
                "yyyy-MM-ddTHH:mmzz",
                "yyyy-MM-ddTHH:mm:ss",
                "yyyy-MM-ddTHH:mm",
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd HH:mm",
                "yyyy-MM-dd",
                "HH:mm:ss",
                "HH:mm"
            ].concat(formats);
        }

        formats = isArray(formats) ? formats: [formats];
        length = formats.length;

        for (; idx < length; idx++) {
            date = parseExact(value, formats[idx], culture);
            if (date) {
                return date;
            }
        }

        return date;
    };

    kendo.parseInt = function(value, culture) {
        var result = kendo.parseFloat(value, culture);
        if (result) {
            result = result | 0;
        }
        return result;
    };

    kendo.parseFloat = function(value, culture, format) {
        if (!value && value !== 0) {
           return null;
        }

        if (typeof value === NUMBER) {
           return value;
        }

        value = value.toString();
        culture = kendo.getCulture(culture);

        var number = culture.numberFormat,
            percent = number.percent,
            currency = number.currency,
            symbol = currency.symbol,
            percentSymbol = percent.symbol,
            negative = value.indexOf("-"),
            parts, isPercent;

        //handle exponential number
        if (exponentRegExp.test(value)) {
            value = parseFloat(value.replace(number["."], "."));
            if (isNaN(value)) {
                value = null;
            }
            return value;
        }

        if (negative > 0) {
            return null;
        } else {
            negative = negative > -1;
        }

        if (value.indexOf(symbol) > -1 || (format && format.toLowerCase().indexOf("c") > -1)) {
            number = currency;
            parts = number.pattern[0].replace("$", symbol).split("n");
            if (value.indexOf(parts[0]) > -1 && value.indexOf(parts[1]) > -1) {
                value = value.replace(parts[0], "").replace(parts[1], "");
                negative = true;
            }
        } else if (value.indexOf(percentSymbol) > -1) {
            isPercent = true;
            number = percent;
            symbol = percentSymbol;
        }

        value = value.replace("-", "")
                     .replace(symbol, "")
                     .replace(nonBreakingSpaceRegExp, " ")
                     .split(number[","].replace(nonBreakingSpaceRegExp, " ")).join("")
                     .replace(number["."], ".");

        value = parseFloat(value);

        if (isNaN(value)) {
            value = null;
        } else if (negative) {
            value *= -1;
        }

        if (value && isPercent) {
            value /= 100;
        }

        return value;
    };

    if (globalize && !globalize.load) {
        kendo.parseDate = function (value, format, culture) {
            if (objectToString.call(value) === "[object Date]") {
                return value;
            }

            return globalize.parseDate(value, format, culture);
        };

        kendo.parseFloat = function (value, culture) {
            if (typeof value === NUMBER) {
                return value;
            }

            if (value === undefined || value === null) {
               return null;
            }

            if ($.isPlainObject(culture)) {
                culture = culture.name;
            }

            value = globalize.parseFloat(value, culture);

            return isNaN(value) ? null : value;
        };
    }
})();

    function getShadows(element) {
        var shadow = element.css(kendo.support.transitions.css + "box-shadow") || element.css("box-shadow"),
            radius = shadow ? shadow.match(boxShadowRegExp) || [ 0, 0, 0, 0, 0 ] : [ 0, 0, 0, 0, 0 ],
            blur = math.max((+radius[3]), +(radius[4] || 0));

        return {
            left: (-radius[1]) + blur,
            right: (+radius[1]) + blur,
            bottom: (+radius[2]) + blur
        };
    }

    function wrap(element, autosize) {
        var browser = support.browser,
            percentage,
            isRtl = element.css("direction") == "rtl";

        if (!element.parent().hasClass("k-animation-container")) {
            var shadows = getShadows(element),
                width = element[0].style.width,
                height = element[0].style.height,
                percentWidth = percentRegExp.test(width),
                percentHeight = percentRegExp.test(height);

            if (browser.opera) { // Box shadow can't be retrieved in Opera
                shadows.left = shadows.right = shadows.bottom = 5;
            }

            percentage = percentWidth || percentHeight;

            if (!percentWidth && (!autosize || (autosize && width))) { width = element.outerWidth(); }
            if (!percentHeight && (!autosize || (autosize && height))) { height = element.outerHeight(); }

            element.wrap(
                         $("<div/>")
                         .addClass("k-animation-container")
                         .css({
                             width: width,
                             height: height,
                             marginLeft: shadows.left * (isRtl ? 1 : -1),
                             paddingLeft: shadows.left,
                             paddingRight: shadows.right,
                             paddingBottom: shadows.bottom
                         }));

            if (percentage) {
                element.css({
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    mozBoxSizing: "border-box",
                    webkitBoxSizing: "border-box"
                });
            }
        } else {
            var wrapper = element.parent(".k-animation-container"),
                wrapperStyle = wrapper[0].style;

            if (wrapper.is(":hidden")) {
                wrapper.show();
            }

            percentage = percentRegExp.test(wrapperStyle.width) || percentRegExp.test(wrapperStyle.height);

            if (!percentage) {
                wrapper.css({
                    width: element.outerWidth(),
                    height: element.outerHeight(),
                    boxSizing: "content-box",
                    mozBoxSizing: "content-box",
                    webkitBoxSizing: "content-box"
                });
            }
        }

        if (browser.msie && math.floor(browser.version) <= 7) {
            element.css({ zoom: 1 });
            element.children(".k-menu").width(element.width());
        }

        return element.parent();
    }

    function deepExtend(destination) {
        var i = 1,
            length = arguments.length;

        for (i = 1; i < length; i++) {
            deepExtendOne(destination, arguments[i]);
        }

        return destination;
    }

    function deepExtendOne(destination, source) {
        var ObservableArray = kendo.data.ObservableArray,
            LazyObservableArray = kendo.data.LazyObservableArray,
            DataSource = kendo.data.DataSource,
            HierarchicalDataSource = kendo.data.HierarchicalDataSource,
            property,
            propValue,
            propType,
            propInit,
            destProp;

        for (property in source) {
            propValue = source[property];
            propType = typeof propValue;

            if (propType === OBJECT && propValue !== null) {
                propInit = propValue.constructor;
            } else {
                propInit = null;
            }

            if (propInit &&
                propInit !== Array && propInit !== ObservableArray && propInit !== LazyObservableArray &&
                propInit !== DataSource && propInit !== HierarchicalDataSource) {

                if (propValue instanceof Date) {
                    destination[property] = new Date(propValue.getTime());
                } else if (isFunction(propValue.clone)) {
                    destination[property] = propValue.clone();
                } else {
                    destProp = destination[property];
                    if (typeof (destProp) === OBJECT) {
                        destination[property] = destProp || {};
                    } else {
                        destination[property] = {};
                    }
                    deepExtendOne(destination[property], propValue);
                }
            } else if (propType !== UNDEFINED) {
                destination[property] = propValue;
            }
        }

        return destination;
    }

    function testRx(agent, rxs, dflt) {
        for (var rx in rxs) {
            if (rxs.hasOwnProperty(rx) && rxs[rx].test(agent)) {
                return rx;
            }
        }
        return dflt !== undefined ? dflt : agent;
    }

    function toHyphens(str) {
        return str.replace(/([a-z][A-Z])/g, function (g) {
            return g.charAt(0) + '-' + g.charAt(1).toLowerCase();
        });
    }

    function toCamelCase(str) {
        return str.replace(/\-(\w)/g, function (strMatch, g1) {
            return g1.toUpperCase();
        });
    }

    function getComputedStyles(element, properties) {
        var styles = {}, computedStyle;

        if (document.defaultView && document.defaultView.getComputedStyle) {
            computedStyle = document.defaultView.getComputedStyle(element, "");

            if (properties) {
                $.each(properties, function(idx, value) {
                    styles[value] = computedStyle.getPropertyValue(value);
                });
            }
        } else {
            computedStyle = element.currentStyle;

            if (properties) {
                $.each(properties, function(idx, value) {
                    styles[value] = computedStyle[toCamelCase(value)];
                });
            }
        }

        if (!kendo.size(styles)) {
            styles = computedStyle;
        }

        return styles;
    }

    (function () {
        support._scrollbar = undefined;

        support.scrollbar = function (refresh) {
            if (!isNaN(support._scrollbar) && !refresh) {
                return support._scrollbar;
            } else {
                var div = document.createElement("div"),
                    result;

                div.style.cssText = "overflow:scroll;overflow-x:hidden;zoom:1;clear:both;display:block";
                div.innerHTML = "&nbsp;";
                document.body.appendChild(div);

                support._scrollbar = result = div.offsetWidth - div.scrollWidth;

                document.body.removeChild(div);

                return result;
            }
        };

        support.isRtl = function(element) {
            return $(element).closest(".k-rtl").length > 0;
        };

        var table = document.createElement("table");

        // Internet Explorer does not support setting the innerHTML of TBODY and TABLE elements
        try {
            table.innerHTML = "<tr><td></td></tr>";

            support.tbodyInnerHtml = true;
        } catch (e) {
            support.tbodyInnerHtml = false;
        }

        support.touch = "ontouchstart" in window;
        support.msPointers = window.MSPointerEvent;
        support.pointers = window.PointerEvent;

        var transitions = support.transitions = false,
            transforms = support.transforms = false,
            elementProto = "HTMLElement" in window ? HTMLElement.prototype : [];

        support.hasHW3D = ("WebKitCSSMatrix" in window && "m11" in new window.WebKitCSSMatrix()) || "MozPerspective" in document.documentElement.style || "msPerspective" in document.documentElement.style;

        each([ "Moz", "webkit", "O", "ms" ], function () {
            var prefix = this.toString(),
                hasTransitions = typeof table.style[prefix + "Transition"] === STRING;

            if (hasTransitions || typeof table.style[prefix + "Transform"] === STRING) {
                var lowPrefix = prefix.toLowerCase();

                transforms = {
                    css: (lowPrefix != "ms") ? "-" + lowPrefix + "-" : "",
                    prefix: prefix,
                    event: (lowPrefix === "o" || lowPrefix === "webkit") ? lowPrefix : ""
                };

                if (hasTransitions) {
                    transitions = transforms;
                    transitions.event = transitions.event ? transitions.event + "TransitionEnd" : "transitionend";
                }

                return false;
            }
        });

        table = null;

        support.transforms = transforms;
        support.transitions = transitions;

        support.devicePixelRatio = window.devicePixelRatio === undefined ? 1 : window.devicePixelRatio;

        try {
            support.screenWidth = window.outerWidth || window.screen ? window.screen.availWidth : window.innerWidth;
            support.screenHeight = window.outerHeight || window.screen ? window.screen.availHeight : window.innerHeight;
        } catch(e) {
            //window.outerWidth throws error when in IE showModalDialog.
            support.screenWidth = window.screen.availWidth;
            support.screenHeight = window.screen.availHeight;
        }

        support.detectOS = function (ua) {
            var os = false, minorVersion, match = [],
                notAndroidPhone = !/mobile safari/i.test(ua),
                agentRxs = {
                    wp: /(Windows Phone(?: OS)?)\s(\d+)\.(\d+(\.\d+)?)/,
                    fire: /(Silk)\/(\d+)\.(\d+(\.\d+)?)/,
                    android: /(Android|Android.*(?:Opera|Firefox).*?\/)\s*(\d+)\.(\d+(\.\d+)?)/,
                    iphone: /(iPhone|iPod).*OS\s+(\d+)[\._]([\d\._]+)/,
                    ipad: /(iPad).*OS\s+(\d+)[\._]([\d_]+)/,
                    meego: /(MeeGo).+NokiaBrowser\/(\d+)\.([\d\._]+)/,
                    webos: /(webOS)\/(\d+)\.(\d+(\.\d+)?)/,
                    blackberry: /(BlackBerry|BB10).*?Version\/(\d+)\.(\d+(\.\d+)?)/,
                    playbook: /(PlayBook).*?Tablet\s*OS\s*(\d+)\.(\d+(\.\d+)?)/,
                    windows: /(MSIE)\s+(\d+)\.(\d+(\.\d+)?)/,
                    tizen: /(tizen).*?Version\/(\d+)\.(\d+(\.\d+)?)/i,
                    sailfish: /(sailfish).*rv:(\d+)\.(\d+(\.\d+)?).*firefox/i,
                    ffos: /(Mobile).*rv:(\d+)\.(\d+(\.\d+)?).*Firefox/
                },
                osRxs = {
                    ios: /^i(phone|pad|pod)$/i,
                    android: /^android|fire$/i,
                    blackberry: /^blackberry|playbook/i,
                    windows: /windows/,
                    wp: /wp/,
                    flat: /sailfish|ffos|tizen/i,
                    meego: /meego/
                },
                formFactorRxs = {
                    tablet: /playbook|ipad|fire/i
                },
                browserRxs = {
                    omini: /Opera\sMini/i,
                    omobile: /Opera\sMobi/i,
                    firefox: /Firefox|Fennec/i,
                    mobilesafari: /version\/.*safari/i,
                    ie: /MSIE|Windows\sPhone/i,
                    chrome: /chrome|crios/i,
                    webkit: /webkit/i
                };

            for (var agent in agentRxs) {
                if (agentRxs.hasOwnProperty(agent)) {
                    match = ua.match(agentRxs[agent]);
                    if (match) {
                        if (agent == "windows" && "plugins" in navigator) { return false; } // Break if not Metro/Mobile Windows

                        os = {};
                        os.device = agent;
                        os.tablet = testRx(agent, formFactorRxs, false);
                        os.browser = testRx(ua, browserRxs, "default");
                        os.name = testRx(agent, osRxs);
                        os[os.name] = true;
                        os.majorVersion = match[2];
                        os.minorVersion = match[3].replace("_", ".");
                        minorVersion = os.minorVersion.replace(".", "").substr(0, 2);
                        os.flatVersion = os.majorVersion + minorVersion + (new Array(3 - (minorVersion.length < 3 ? minorVersion.length : 2)).join("0"));
                        os.cordova = typeof window.PhoneGap !== UNDEFINED || typeof window.cordova !== UNDEFINED; // Use file protocol to detect appModes.
                        os.appMode = window.navigator.standalone || (/file|local|wmapp/).test(window.location.protocol) || os.cordova; // Use file protocol to detect appModes.

                        if (os.android && (support.devicePixelRatio < 1.5 && os.flatVersion < 400 || notAndroidPhone) && (support.screenWidth > 800 || support.screenHeight > 800)) {
                            os.tablet = agent;
                        }

                        break;
                    }
                }
            }
            return os;
        };

        var mobileOS = support.mobileOS = support.detectOS(navigator.userAgent);

        support.wpDevicePixelRatio = mobileOS.wp ? screen.width / 320 : 0;
        support.kineticScrollNeeded = mobileOS && (support.touch || support.msPointers || support.pointers);

        support.hasNativeScrolling = false;

        if (mobileOS.ios || (mobileOS.android && mobileOS.majorVersion > 2) || mobileOS.wp) {
            support.hasNativeScrolling = mobileOS;
        }

        support.mouseAndTouchPresent = support.touch && !(support.mobileOS.ios || support.mobileOS.android);

        support.detectBrowser = function(ua) {
            var browser = false, match = [],
                browserRxs = {
                    webkit: /(chrome)[ \/]([\w.]+)/i,
                    safari: /(webkit)[ \/]([\w.]+)/i,
                    opera: /(opera)(?:.*version|)[ \/]([\w.]+)/i,
                    msie: /(msie\s|trident.*? rv:)([\w.]+)/i,
                    mozilla: /(mozilla)(?:.*? rv:([\w.]+)|)/i
                };

            for (var agent in browserRxs) {
                if (browserRxs.hasOwnProperty(agent)) {
                    match = ua.match(browserRxs[agent]);
                    if (match) {
                        browser = {};
                        browser[agent] = true;
                        browser[match[1].toLowerCase().split(" ")[0].split("/")[0]] = true;
                        browser.version = parseInt(document.documentMode || match[2], 10);

                        break;
                    }
                }
            }

            return browser;
        };

        support.browser = support.detectBrowser(navigator.userAgent);

        support.zoomLevel = function() {
            try {
                var browser = support.browser;
                var ie11WidthCorrection = 0;
                var docEl = document.documentElement;

                if (browser.msie && browser.version == 11 && docEl.scrollHeight > docEl.clientHeight && !support.touch) {
                    ie11WidthCorrection = support.scrollbar();
                }

                return support.touch ? (docEl.clientWidth / window.innerWidth) :
                       browser.msie && browser.version >= 10 ? (((top || window).document.documentElement.offsetWidth + ie11WidthCorrection) / (top || window).innerWidth) : 1;
            } catch(e) {
                return 1;
            }
        };

        support.cssBorderSpacing = typeof document.documentElement.style.borderSpacing != "undefined" && !(support.browser.msie && support.browser.version < 8);

        (function(browser) {
            // add browser-specific CSS class
            var cssClass = "",
                docElement = $(document.documentElement),
                majorVersion = parseInt(browser.version, 10);

            if (browser.msie) {
                cssClass = "ie";
            } else if (browser.mozilla) {
                cssClass = "ff";
            } else if (browser.safari) {
                cssClass = "safari";
            } else if (browser.webkit) {
                cssClass = "webkit";
            } else if (browser.opera) {
                cssClass = "opera";
            }

            if (cssClass) {
                cssClass = "k-" + cssClass + " k-" + cssClass + majorVersion;
            }
            if (support.mobileOS) {
                cssClass += " k-mobile";
            }

            docElement.addClass(cssClass);
        })(support.browser);

        support.eventCapture = document.documentElement.addEventListener;

        var input = document.createElement("input");

        support.placeholder = "placeholder" in input;
        support.propertyChangeEvent = "onpropertychange" in input;

        support.input = (function() {
            var types = ["number", "date", "time", "month", "week", "datetime", "datetime-local"];
            var length = types.length;
            var value = "test";
            var result = {};
            var idx = 0;
            var type;

            for (;idx < length; idx++) {
                type = types[idx];
                input.setAttribute("type", type);
                input.value = value;

                result[type.replace("-", "")] = input.type !== "text" && input.value !== value;
            }

            return result;
        })();

        input.style.cssText = "float:left;";

        support.cssFloat = !!input.style.cssFloat;

        input = null;

        support.stableSort = (function() {
            // Chrome sort is not stable for more than *10* items
            // IE9+ sort is not stable for than *512* items
            var threshold = 513;

            var sorted = [{
                index: 0,
                field: "b"
            }];

            for (var i = 1; i < threshold; i++) {
                sorted.push({
                    index: i,
                    field: "a"
                });
            }

            sorted.sort(function(a, b) {
                return a.field > b.field ? 1 : (a.field < b.field ? -1 : 0);
            });

            return sorted[0].index === 1;
        })();

        support.matchesSelector = elementProto.webkitMatchesSelector || elementProto.mozMatchesSelector ||
                                  elementProto.msMatchesSelector || elementProto.oMatchesSelector ||
                                  elementProto.matchesSelector || elementProto.matches ||
          function( selector ) {
              var nodeList = document.querySelectorAll ? ( this.parentNode || document ).querySelectorAll( selector ) || [] : $(selector),
                  i = nodeList.length;

              while (i--) {
                  if (nodeList[i] == this) {
                      return true;
                  }
              }

              return false;
          };

        support.pushState = window.history && window.history.pushState;

        var documentMode = document.documentMode;

        support.hashChange = ("onhashchange" in window) && !(support.browser.msie && (!documentMode || documentMode <= 8)); // old IE detection
    })();


    function size(obj) {
        var result = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key) && key != "toJSON") { // Ignore fake IE7 toJSON.
                result++;
            }
        }

        return result;
    }

    function getOffset(element, type, positioned) {
        if (!type) {
            type = "offset";
        }

        var result = element[type](),
            mobileOS = support.mobileOS;

        // IE10 touch zoom is living in a separate viewport
        if (support.browser.msie && (support.pointers || support.msPointers) && !positioned) {
            result.top -= (window.pageYOffset - document.documentElement.scrollTop);
            result.left -= (window.pageXOffset - document.documentElement.scrollLeft);
        }

        return result;
    }

    var directions = {
        left: { reverse: "right" },
        right: { reverse: "left" },
        down: { reverse: "up" },
        up: { reverse: "down" },
        top: { reverse: "bottom" },
        bottom: { reverse: "top" },
        "in": { reverse: "out" },
        out: { reverse: "in" }
    };

    function parseEffects(input) {
        var effects = {};

        each((typeof input === "string" ? input.split(" ") : input), function(idx) {
            effects[idx] = this;
        });

        return effects;
    }

    function fx(element) {
        return new kendo.effects.Element(element);
    }

    var effects = {};

    $.extend(effects, {
        enabled: true,
        Element: function(element) {
            this.element = $(element);
        },

        promise: function(element, options) {
            if (!element.is(":visible")) {
                element.css({ display: element.data("olddisplay") || "block" }).css("display");
            }

            if (options.hide) {
                element.data("olddisplay", element.css("display")).hide();
            }

            if (options.init) {
                options.init();
            }

            if (options.completeCallback) {
                options.completeCallback(element); // call the external complete callback with the element
            }

            element.dequeue();
        },

        disable: function() {
            this.enabled = false;
            this.promise = this.promiseShim;
        },

        enable: function() {
            this.enabled = true;
            this.promise = this.animatedPromise;
        }
    });

    effects.promiseShim = effects.promise;

    function prepareAnimationOptions(options, duration, reverse, complete) {
        if (typeof options === STRING) {
            // options is the list of effect names separated by space e.g. animate(element, "fadeIn slideDown")

            // only callback is provided e.g. animate(element, options, function() {});
            if (isFunction(duration)) {
                complete = duration;
                duration = 400;
                reverse = false;
            }

            if (isFunction(reverse)) {
                complete = reverse;
                reverse = false;
            }

            if (typeof duration === BOOLEAN){
                reverse = duration;
                duration = 400;
            }

            options = {
                effects: options,
                duration: duration,
                reverse: reverse,
                complete: complete
            };
        }

        return extend({
            //default options
            effects: {},
            duration: 400, //jQuery default duration
            reverse: false,
            init: noop,
            teardown: noop,
            hide: false
        }, options, { completeCallback: options.complete, complete: noop }); // Move external complete callback, so deferred.resolve can be always executed.

    }

    function animate(element, options, duration, reverse, complete) {
        var idx = 0,
            length = element.length,
            instance;

        for (; idx < length; idx ++) {
            instance = $(element[idx]);
            instance.queue(function() {
                effects.promise(instance, prepareAnimationOptions(options, duration, reverse, complete));
            });
        }

        return element;
    }

    function toggleClass(element, classes, options, add) {
        if (classes) {
            classes = classes.split(" ");

            each(classes, function(idx, value) {
                element.toggleClass(value, add);
            });
        }

        return element;
    }

    if (!("kendoAnimate" in $.fn)) {
        extend($.fn, {
            kendoStop: function(clearQueue, gotoEnd) {
                return this.stop(clearQueue, gotoEnd);
            },

            kendoAnimate: function(options, duration, reverse, complete) {
                return animate(this, options, duration, reverse, complete);
            },

            kendoAddClass: function(classes, options){
                return kendo.toggleClass(this, classes, options, true);
            },

            kendoRemoveClass: function(classes, options){
                return kendo.toggleClass(this, classes, options, false);
            },
            kendoToggleClass: function(classes, options, toggle){
                return kendo.toggleClass(this, classes, options, toggle);
            }
        });
    }

    var ampRegExp = /&/g,
        ltRegExp = /</g,
        quoteRegExp = /"/g,
        aposRegExp = /'/g,
        gtRegExp = />/g;
    function htmlEncode(value) {
        return ("" + value).replace(ampRegExp, "&amp;").replace(ltRegExp, "&lt;").replace(gtRegExp, "&gt;").replace(quoteRegExp, "&quot;").replace(aposRegExp, "&#39;");
    }

    var eventTarget = function (e) {
        return e.target;
    };

    if (support.touch) {

        eventTarget = function(e) {
            var touches = "originalEvent" in e ? e.originalEvent.changedTouches : "changedTouches" in e ? e.changedTouches : null;

            return touches ? document.elementFromPoint(touches[0].clientX, touches[0].clientY) : e.target;
        };

        each(["swipe", "swipeLeft", "swipeRight", "swipeUp", "swipeDown", "doubleTap", "tap"], function(m, value) {
            $.fn[value] = function(callback) {
                return this.bind(value, callback);
            };
        });
    }

    if (support.touch) {
        if (!support.mobileOS) {
            support.mousedown = "mousedown touchstart";
            support.mouseup = "mouseup touchend";
            support.mousemove = "mousemove touchmove";
            support.mousecancel = "mouseleave touchcancel";
            support.click = "click";
            support.resize = "resize";
        } else {
            support.mousedown = "touchstart";
            support.mouseup = "touchend";
            support.mousemove = "touchmove";
            support.mousecancel = "touchcancel";
            support.click = "touchend";
            support.resize = "orientationchange";
        }
    } else if (support.pointers) {
        support.mousemove = "pointermove";
        support.mousedown = "pointerdown";
        support.mouseup = "pointerup";
        support.mousecancel = "pointercancel";
        support.click = "pointerup";
        support.resize = "orientationchange resize";
    } else if (support.msPointers) {
        support.mousemove = "MSPointerMove";
        support.mousedown = "MSPointerDown";
        support.mouseup = "MSPointerUp";
        support.mousecancel = "MSPointerCancel";
        support.click = "MSPointerUp";
        support.resize = "orientationchange resize";
    } else {
        support.mousemove = "mousemove";
        support.mousedown = "mousedown";
        support.mouseup = "mouseup";
        support.mousecancel = "mouseleave";
        support.click = "click";
        support.resize = "resize";
    }

    var wrapExpression = function(members, paramName) {
        var result = paramName || "d",
            index,
            idx,
            length,
            member,
            count = 1;

        for (idx = 0, length = members.length; idx < length; idx++) {
            member = members[idx];
            if (member !== "") {
                index = member.indexOf("[");

                if (index !== 0) {
                    if (index == -1) {
                        member = "." + member;
                    } else {
                        count++;
                        member = "." + member.substring(0, index) + " || {})" + member.substring(index);
                    }
                }

                count++;
                result += member + ((idx < length - 1) ? " || {})" : ")");
            }
        }
        return new Array(count).join("(") + result;
    },
    localUrlRe = /^([a-z]+:)?\/\//i;

    extend(kendo, {
        ui: kendo.ui || {},
        fx: kendo.fx || fx,
        effects: kendo.effects || effects,
        mobile: kendo.mobile || { },
        data: kendo.data || {},
        dataviz: kendo.dataviz || {},
        keys: {
            INSERT: 45,
            DELETE: 46,
            BACKSPACE: 8,
            TAB: 9,
            ENTER: 13,
            ESC: 27,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            END: 35,
            HOME: 36,
            SPACEBAR: 32,
            PAGEUP: 33,
            PAGEDOWN: 34,
            F2: 113,
            F10: 121,
            F12: 123,
            NUMPAD_PLUS: 107,
            NUMPAD_MINUS: 109,
            NUMPAD_DOT: 110
        },
        support: kendo.support || support,
        animate: kendo.animate || animate,
        ns: "",
        attr: function(value) {
            return "data-" + kendo.ns + value;
        },
        getShadows: getShadows,
        wrap: wrap,
        deepExtend: deepExtend,
        getComputedStyles: getComputedStyles,
        size: size,
        toCamelCase: toCamelCase,
        toHyphens: toHyphens,
        getOffset: kendo.getOffset || getOffset,
        parseEffects: kendo.parseEffects || parseEffects,
        toggleClass: kendo.toggleClass || toggleClass,
        directions: kendo.directions || directions,
        Observable: Observable,
        Class: Class,
        Template: Template,
        template: proxy(Template.compile, Template),
        render: proxy(Template.render, Template),
        stringify: proxy(JSON.stringify, JSON),
        eventTarget: eventTarget,
        htmlEncode: htmlEncode,
        isLocalUrl: function(url) {
            return url && !localUrlRe.test(url);
        },

        expr: function(expression, safe, paramName) {
            expression = expression || "";

            if (typeof safe == STRING) {
                paramName = safe;
                safe = false;
            }

            paramName = paramName || "d";

            if (expression && expression.charAt(0) !== "[") {
                expression = "." + expression;
            }

            if (safe) {
                expression = expression.replace(/"([^.]*)\.([^"]*)"/g,'"$1_$DOT$_$2"');
                expression = expression.replace(/'([^.]*)\.([^']*)'/g,"'$1_$DOT$_$2'");
                expression = wrapExpression(expression.split("."), paramName);
                expression = expression.replace(/_\$DOT\$_/g, ".");
            } else {
                expression = paramName + expression;
            }

            return expression;
        },

        getter: function(expression, safe) {
            var key = expression + safe;
            return getterCache[key] = getterCache[key] || new Function("d", "return " + kendo.expr(expression, safe));
        },

        setter: function(expression) {
            return setterCache[expression] = setterCache[expression] || new Function("d,value", kendo.expr(expression) + "=value");
        },

        accessor: function(expression) {
            return {
                get: kendo.getter(expression),
                set: kendo.setter(expression)
            };
        },

        guid: function() {
            var id = "", i, random;

            for (i = 0; i < 32; i++) {
                random = math.random() * 16 | 0;

                if (i == 8 || i == 12 || i == 16 || i == 20) {
                    id += "-";
                }
                id += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
            }

            return id;
        },

        roleSelector: function(role) {
            return role.replace(/(\S+)/g, "[" + kendo.attr("role") + "=$1],").slice(0, -1);
        },

        directiveSelector: function(directives) {
            var selectors = directives.split(" ");

            if (selectors) {
                for (var i = 0; i < selectors.length; i++) {
                    if (selectors[i] != "view") {
                        selectors[i] = selectors[i].replace(/(\w*)(view|bar|strip|over)$/, "$1-$2");
                    }
                }
            }

            return selectors.join(" ").replace(/(\S+)/g, "kendo-mobile-$1,").slice(0, -1);
        },

        triggeredByInput: function(e) {
            return (/^(label|input|textarea|select)$/i).test(e.target.tagName);
        },

        logToConsole: function(message) {
            var console = window.console;

            if (!kendo.suppressLog && typeof(console) != "undefined" && console.log) {
                console.log(message);
            }
        }
    });

    var Widget = Observable.extend( {
        init: function(element, options) {
            var that = this;

            that.element = kendo.jQuery(element).handler(that);

            that.angular("init", options);

            Observable.fn.init.call(that);

            var dataSource = options ? options.dataSource : null;

            if (dataSource) {
                // avoid deep cloning the data source
                options = extend({}, options, { dataSource: {} });
            }

            options = that.options = extend(true, {}, that.options, options);

            if (dataSource) {
                options.dataSource = dataSource;
            }

            if (!that.element.attr(kendo.attr("role"))) {
                that.element.attr(kendo.attr("role"), (options.name || "").toLowerCase());
            }

            that.element.data("kendo" + options.prefix + options.name, that);

            that.bind(that.events, options);
        },

        events: [],

        options: {
            prefix: ""
        },

        _hasBindingTarget: function() {
            return !!this.element[0].kendoBindingTarget;
        },

        _tabindex: function(target) {
            target = target || this.wrapper;

            var element = this.element,
                TABINDEX = "tabindex",
                tabindex = target.attr(TABINDEX) || element.attr(TABINDEX);

            element.removeAttr(TABINDEX);

            target.attr(TABINDEX, !isNaN(tabindex) ? tabindex : 0);
        },

        setOptions: function(options) {
            this._setEvents(options);
            $.extend(this.options, options);
        },

        _setEvents: function(options) {
            var that = this,
                idx = 0,
                length = that.events.length,
                e;

            for (; idx < length; idx ++) {
                e = that.events[idx];
                if (that.options[e] && options[e]) {
                    that.unbind(e, that.options[e]);
                }
            }

            that.bind(that.events, options);
        },

        resize: function(force) {
            var size = this.getSize(),
                currentSize = this._size;

            if (force || (size.width > 0 || size.height > 0) && (!currentSize || size.width !== currentSize.width || size.height !== currentSize.height)) {
                this._size = size;
                this._resize(size, force);
                this.trigger("resize", size);
            }
        },

        getSize: function() {
            return kendo.dimensions(this.element);
        },

        size: function(size) {
            if (!size) {
                return this.getSize();
            } else {
                this.setSize(size);
            }
        },

        setSize: $.noop,
        _resize: $.noop,

        destroy: function() {
            var that = this;

            that.element.removeData("kendo" + that.options.prefix + that.options.name);
            that.element.removeData("handler");
            that.unbind();
        },

        angular: function(){}
    });

    var DataBoundWidget = Widget.extend({
        // Angular consumes these.
        dataItems: function() {
            return this.dataSource.flatView();
        },

        _angularItems: function(cmd) {
            var that = this;
            that.angular(cmd, function(){
                return {
                    elements: that.items(),
                    data: $.map(that.dataItems(), function(dataItem){
                        return { dataItem: dataItem };
                    })
                };
            });
        }
    });

    kendo.dimensions = function(element, dimensions) {
        var domElement = element[0];

        if (dimensions) {
            element.css(dimensions);
        }

        return { width: domElement.offsetWidth, height: domElement.offsetHeight };
    };

    kendo.notify = noop;

    var templateRegExp = /template$/i,
        jsonRegExp = /^\s*(?:\{(?:.|\r\n|\n)*\}|\[(?:.|\r\n|\n)*\])\s*$/,
        jsonFormatRegExp = /^\{(\d+)(:[^\}]+)?\}|^\[[A-Za-z_]*\]$/,
        dashRegExp = /([A-Z])/g;

    function parseOption(element, option) {
        var value;

        if (option.indexOf("data") === 0) {
            option = option.substring(4);
            option = option.charAt(0).toLowerCase() + option.substring(1);
        }

        option = option.replace(dashRegExp, "-$1");
        value = element.getAttribute("data-" + kendo.ns + option);

        if (value === null) {
            value = undefined;
        } else if (value === "null") {
            value = null;
        } else if (value === "true") {
            value = true;
        } else if (value === "false") {
            value = false;
        } else if (numberRegExp.test(value)) {
            value = parseFloat(value);
        } else if (jsonRegExp.test(value) && !jsonFormatRegExp.test(value)) {
            value = new Function("return (" + value + ")")();
        }

        return value;
    }

    function parseOptions(element, options) {
        var result = {},
            option,
            value;

        for (option in options) {
            value = parseOption(element, option);

            if (value !== undefined) {

                if (templateRegExp.test(option)) {
                    value = kendo.template($("#" + value).html());
                }

                result[option] = value;
            }
        }

        return result;
    }

    kendo.initWidget = function(element, options, roles) {
        var result,
            option,
            widget,
            idx,
            length,
            role,
            value,
            dataSource,
            fullPath,
            widgetKeyRegExp;

        // Preserve backwards compatibility with (element, options, namespace) signature, where namespace was kendo.ui
        if (!roles) {
            roles = kendo.ui.roles;
        } else if (roles.roles) {
            roles = roles.roles;
        }

        element = element.nodeType ? element : element[0];

        role = element.getAttribute("data-" + kendo.ns + "role");

        if (!role) {
            return;
        }

        fullPath = role.indexOf(".") === -1;

        // look for any widget that may be already instantiated based on this role.
        // The prefix used is unknown, hence the regexp
        //

        if (fullPath) {
            widget = roles[role];
        } else { // full namespace path - like kendo.ui.Widget
            widget = kendo.getter(role)(window);
        }

        var data = $(element).data(),
            widgetKey = widget ? "kendo" + widget.fn.options.prefix + widget.fn.options.name : "";

        if (fullPath) {
            widgetKeyRegExp = new RegExp("^kendo.*" + role + "$", "i");
        } else { // full namespace path - like kendo.ui.Widget
            widgetKeyRegExp = new RegExp("^" + widgetKey + "$", "i");
        }

        for(var key in data) {
            if (key.match(widgetKeyRegExp)) {
                // we have detected a widget of the same kind - save its reference, we will set its options
                if (key === widgetKey) {
                    result = data[key];
                } else {
                    return data[key];
                }
            }
        }

        if (!widget) {
            return;
        }

        dataSource = parseOption(element, "dataSource");

        options = $.extend({}, parseOptions(element, widget.fn.options), options);

        if (dataSource) {
            if (typeof dataSource === STRING) {
                options.dataSource = kendo.getter(dataSource)(window);
            } else {
                options.dataSource = dataSource;
            }
        }

        for (idx = 0, length = widget.fn.events.length; idx < length; idx++) {
            option = widget.fn.events[idx];

            value = parseOption(element, option);

            if (value !== undefined) {
                options[option] = kendo.getter(value)(window);
            }
        }

        if (!result) {
            result = new widget(element, options);
        } else if (!$.isEmptyObject(options)) {
            result.setOptions(options);
        }

        return result;
    };

    kendo.rolesFromNamespaces = function(namespaces) {
        var roles = [],
            idx,
            length;

        if (!namespaces[0]) {
            namespaces = [kendo.ui, kendo.dataviz.ui];
        }

        for (idx = 0, length = namespaces.length; idx < length; idx ++) {
            roles[idx] = namespaces[idx].roles;
        }

        return extend.apply(null, [{}].concat(roles.reverse()));
    };

    kendo.init = function(element) {
        var roles = kendo.rolesFromNamespaces(slice.call(arguments, 1));

        $(element).find("[data-" + kendo.ns + "role]").addBack().each(function(){
            kendo.initWidget(this, {}, roles);
        });
    };

    kendo.destroy = function(element) {
        $(element).find("[data-" + kendo.ns + "role]").addBack().each(function(){
            var data = $(this).data();

            for (var key in data) {
                if (key.indexOf("kendo") === 0 && typeof data[key].destroy === FUNCTION) {
                    data[key].destroy();
                }
            }
        });
    };

    function containmentComparer(a, b) {
        return $.contains(a, b) ? -1 : 1;
    }

    function resizableWidget() {
        var widget = $(this);
        return ($.inArray(widget.attr("data-" + kendo.ns + "role"), ["slider", "rangeslider"]) > -1) || widget.is(":visible");
    }

    kendo.resize = function(element, force) {
        var widgets = $(element).find("[data-" + kendo.ns + "role]").addBack().filter(resizableWidget);

        if (!widgets.length) {
            return;
        }

        // sort widgets based on their parent-child relation
        var widgetsArray = $.makeArray(widgets);
        widgetsArray.sort(containmentComparer);

        // resize widgets
        $.each(widgetsArray, function () {
            var widget = kendo.widgetInstance($(this));
            if (widget) {
                widget.resize(force);
            }
        });
    };

    kendo.parseOptions = parseOptions;

    extend(kendo.ui, {
        Widget: Widget,
        DataBoundWidget: DataBoundWidget,
        roles: {},
        progress: function(container, toggle) {
            var mask = container.find(".k-loading-mask"),
                support = kendo.support,
                browser = support.browser,
                isRtl, leftRight, webkitCorrection, containerScrollLeft;

            if (toggle) {
                if (!mask.length) {
                    isRtl = support.isRtl(container);
                    leftRight = isRtl ? "right" : "left";
                    containerScrollLeft = container.scrollLeft();
                    webkitCorrection = browser.webkit ? (!isRtl ? 0 : container[0].scrollWidth - container.width() - 2 * containerScrollLeft) : 0;

                    mask = $("<div class='k-loading-mask'><span class='k-loading-text'>Loading...</span><div class='k-loading-image'/><div class='k-loading-color'/></div>")
                        .width("100%").height("100%")
                        .css("top", container.scrollTop())
                        .css(leftRight, Math.abs(containerScrollLeft) + webkitCorrection)
                        .prependTo(container);
                }
            } else if (mask) {
                mask.remove();
            }
        },
        plugin: function(widget, register, prefix) {
            var name = widget.fn.options.name,
                getter;

            register = register || kendo.ui;
            prefix = prefix || "";

            register[name] = widget;

            register.roles[name.toLowerCase()] = widget;

            getter = "getKendo" + prefix + name;
            name = "kendo" + prefix + name;

            $.fn[name] = function(options) {
                var value = this,
                    args;

                if (typeof options === STRING) {
                    args = slice.call(arguments, 1);

                    this.each(function(){
                        var widget = $.data(this, name),
                            method,
                            result;

                        if (!widget) {
                            throw new Error(kendo.format("Cannot call method '{0}' of {1} before it is initialized", options, name));
                        }

                        method = widget[options];

                        if (typeof method !== FUNCTION) {
                            throw new Error(kendo.format("Cannot find method '{0}' of {1}", options, name));
                        }

                        result = method.apply(widget, args);

                        if (result !== undefined) {
                            value = result;
                            return false;
                        }
                    });
                } else {
                    this.each(function() {
                        new widget(this, options);
                    });
                }

                return value;
            };

            $.fn[name].widget = widget;

            $.fn[getter] = function() {
                return this.data(name);
            };
        }
    });

    var ContainerNullObject = { bind: function () { return this; }, nullObject: true, options: {} };

    var MobileWidget = Widget.extend({
        init: function(element, options) {
            Widget.fn.init.call(this, element, options);
            this.element.autoApplyNS();
            this.wrapper = this.element;
            this.element.addClass("km-widget");
        },

        destroy: function() {
            Widget.fn.destroy.call(this);
            this.element.kendoDestroy();
        },

        options: {
            prefix: "Mobile"
        },

        events: [],

        view: function() {
            var viewElement = this.element.closest(kendo.roleSelector("view splitview modalview drawer"));
            return kendo.widgetInstance(viewElement, kendo.mobile.ui) || ContainerNullObject;
        },

        viewHasNativeScrolling: function() {
            var view = this.view();
            return view && view.options.useNativeScrolling;
        },

        container: function() {
            var element = this.element.closest(kendo.roleSelector("view layout modalview drawer splitview"));
            return kendo.widgetInstance(element.eq(0), kendo.mobile.ui) || ContainerNullObject;
        }
    });

    extend(kendo.mobile, {
        init: function(element) {
            kendo.init(element, kendo.mobile.ui, kendo.ui, kendo.dataviz.ui);
        },

        appLevelNativeScrolling: function() {
            return kendo.mobile.application && kendo.mobile.application.options && kendo.mobile.application.options.useNativeScrolling;
        },

        roles: {},

        ui: {
            Widget: MobileWidget,
            DataBoundWidget: DataBoundWidget.extend(MobileWidget.prototype),
            roles: {},
            plugin: function(widget) {
                kendo.ui.plugin(widget, kendo.mobile.ui, "Mobile");
            }
        }
    });

    deepExtend(kendo.dataviz, {
        init: function(element) {
            kendo.init(element, kendo.dataviz.ui);
        },
        ui: {
            roles: {},
            themes: {},
            views: [],
            plugin: function(widget) {
                kendo.ui.plugin(widget, kendo.dataviz.ui);
            }
        },
        roles: {}
    });

    kendo.touchScroller = function(elements, options) {
        // return the first touch scroller
        return $(elements).map(function(idx, element) {
            element = $(element);
            if (support.kineticScrollNeeded && kendo.mobile.ui.Scroller && !element.data("kendoMobileScroller")) {
                element.kendoMobileScroller(options);
                return element.data("kendoMobileScroller");
            } else {
                return false;
            }
        })[0];
    };

    kendo.preventDefault = function(e) {
        e.preventDefault();
    };

    kendo.widgetInstance = function(element, suites) {
        var role = element.data(kendo.ns + "role"),
            widgets = [], i, length;

        if (role) {
            // HACK!!! mobile view scroller widgets are instantiated on data-role="content" elements. We need to discover them when resizing.
            if (role === "content") {
                role = "scroller";
            }

            if (suites) {
                if (suites[0]) {
                    for (i = 0, length = suites.length; i < length; i ++) {
                        widgets.push(suites[i].roles[role]);
                    }
                } else {
                    widgets.push(suites.roles[role]);
                }
            }
            else {
                widgets = [ kendo.ui.roles[role], kendo.dataviz.ui.roles[role],  kendo.mobile.ui.roles[role] ];
            }

            if (role.indexOf(".") >= 0) {
                widgets = [ kendo.getter(role)(window) ];
            }

            for (i = 0, length = widgets.length; i < length; i ++) {
                var widget = widgets[i];
                if (widget) {
                    var instance = element.data("kendo" + widget.fn.options.prefix + widget.fn.options.name);
                    if (instance) {
                        return instance;
                    }
                }
            }
        }
    };

    kendo.onResize = function(callback) {
        var handler = callback;
        if (support.mobileOS.android) {
            handler = function() { setTimeout(callback, 600); };
        }

        $(window).on(support.resize, handler);
        return handler;
    };

    kendo.unbindResize = function(callback) {
        $(window).off(support.resize, callback);
    };

    kendo.attrValue = function(element, key) {
        return element.data(kendo.ns + key);
    };

    kendo.days = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6
    };

    function focusable(element, isTabIndexNotNaN) {
        var nodeName = element.nodeName.toLowerCase();

        return (/input|select|textarea|button|object/.test(nodeName) ?
                !element.disabled :
                "a" === nodeName ?
                element.href || isTabIndexNotNaN :
                isTabIndexNotNaN
               ) &&
            visible(element);
    }

    function visible(element) {
        return !$(element).parents().addBack().filter(function() {
            return $.css(this,"visibility") === "hidden" || $.expr.filters.hidden(this);
        }).length;
    }

    $.extend($.expr[ ":" ], {
        kendoFocusable: function(element) {
            var idx = $.attr(element, "tabindex");
            return focusable(element, !isNaN(idx) && idx > -1);
        }
    });

    var MOUSE_EVENTS = ["mousedown", "mousemove", "mouseenter", "mouseleave", "mouseover", "mouseout", "mouseup", "click"];
    var EXCLUDE_BUST_CLICK_SELECTOR = "label, input, [data-rel=external]";

    var MouseEventNormalizer = {
        setupMouseMute: function() {
            var idx = 0,
                length = MOUSE_EVENTS.length,
                element = document.documentElement;

            if (MouseEventNormalizer.mouseTrap || !support.eventCapture) {
                return;
            }

            MouseEventNormalizer.mouseTrap = true;

            MouseEventNormalizer.bustClick = false;
            MouseEventNormalizer.captureMouse = false;

            var handler = function(e) {
                if (MouseEventNormalizer.captureMouse) {
                    if (e.type === "click") {
                        if (MouseEventNormalizer.bustClick && !$(e.target).is(EXCLUDE_BUST_CLICK_SELECTOR)) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    } else {
                        e.stopPropagation();
                    }
                }
            };

            for (; idx < length; idx++) {
                element.addEventListener(MOUSE_EVENTS[idx], handler, true);
            }
        },

        muteMouse: function(e) {
            MouseEventNormalizer.captureMouse = true;
            if (e.data.bustClick) {
                MouseEventNormalizer.bustClick = true;
            }
            clearTimeout(MouseEventNormalizer.mouseTrapTimeoutID);
        },

        unMuteMouse: function() {
            clearTimeout(MouseEventNormalizer.mouseTrapTimeoutID);
            MouseEventNormalizer.mouseTrapTimeoutID = setTimeout(function() {
                MouseEventNormalizer.captureMouse = false;
                MouseEventNormalizer.bustClick = false;
            }, 400);
        }
    };

    var eventMap = {
        down: "touchstart mousedown",
        move: "mousemove touchmove",
        up: "mouseup touchend touchcancel",
        cancel: "mouseleave touchcancel"
    };

    if (support.touch && (support.mobileOS.ios || support.mobileOS.android)) {
        eventMap = {
            down: "touchstart",
            move: "touchmove",
            up: "touchend touchcancel",
            cancel: "touchcancel"
        };
    } else if (support.pointers) {
        eventMap = {
            down: "pointerdown",
            move: "pointermove",
            up: "pointerup",
            cancel: "pointercancel pointerleave"
        };
    } else if (support.msPointers) {
        eventMap = {
            down: "MSPointerDown",
            move: "MSPointerMove",
            up: "MSPointerUp",
            cancel: "MSPointerCancel MSPointerLeave"
        };
    }

    if (support.msPointers && !("onmspointerenter" in window)) { // IE10
        // Create MSPointerEnter/MSPointerLeave events using mouseover/out and event-time checks
        $.each({
            MSPointerEnter: "MSPointerOver",
            MSPointerLeave: "MSPointerOut"
        }, function( orig, fix ) {
            $.event.special[ orig ] = {
                delegateType: fix,
                bindType: fix,

                handle: function( event ) {
                    var ret,
                        target = this,
                        related = event.relatedTarget,
                        handleObj = event.handleObj;

                    // For mousenter/leave call the handler if related is outside the target.
                    // NB: No relatedTarget if the mouse left/entered the browser window
                    if ( !related || (related !== target && !$.contains( target, related )) ) {
                        event.type = handleObj.origType;
                        ret = handleObj.handler.apply( this, arguments );
                        event.type = fix;
                    }
                    return ret;
                }
            };
        });
    }


    var getEventMap = function(e) { return (eventMap[e] || e); },
        eventRegEx = /([^ ]+)/g;

    kendo.applyEventMap = function(events, ns) {
        events = events.replace(eventRegEx, getEventMap);

        if (ns) {
            events = events.replace(eventRegEx, "$1." + ns);
        }

        return events;
    };

    var on = $.fn.on;

    function kendoJQuery(selector, context) {
        return new kendoJQuery.fn.init(selector, context);
    }

    extend(true, kendoJQuery, $);

    kendoJQuery.fn = kendoJQuery.prototype = new $();

    kendoJQuery.fn.constructor = kendoJQuery;

    kendoJQuery.fn.init = function(selector, context) {
        if (context && context instanceof $ && !(context instanceof kendoJQuery)) {
            context = kendoJQuery(context);
        }

        return $.fn.init.call(this, selector, context, rootjQuery);
    };

    kendoJQuery.fn.init.prototype = kendoJQuery.fn;

    var rootjQuery = kendoJQuery(document);

    extend(kendoJQuery.fn, {
        handler: function(handler) {
            this.data("handler", handler);
            return this;
        },

        autoApplyNS: function(ns) {
            this.data("kendoNS", ns || kendo.guid());
            return this;
        },

        on: function() {
            var that = this,
                ns = that.data("kendoNS");

            // support for event map signature
            if (arguments.length === 1) {
                return on.call(that, arguments[0]);
            }

            var context = that,
                args = slice.call(arguments);

            if (typeof args[args.length -1] === UNDEFINED) {
                args.pop();
            }

            var callback =  args[args.length - 1],
                events = kendo.applyEventMap(args[0], ns);

            // setup mouse trap
            if (support.mouseAndTouchPresent && events.search(/mouse|click/) > -1 && this[0] !== document.documentElement) {
                MouseEventNormalizer.setupMouseMute();

                var selector = args.length === 2 ? null : args[1],
                    bustClick = events.indexOf("click") > -1 && events.indexOf("touchend") > -1;

                on.call(this,
                    {
                        touchstart: MouseEventNormalizer.muteMouse,
                        touchend: MouseEventNormalizer.unMuteMouse
                    },
                    selector,
                    {
                        bustClick: bustClick
                    });
            }

            if (typeof callback === STRING) {
                context = that.data("handler");
                callback = context[callback];

                args[args.length - 1] = function(e) {
                    callback.call(context, e);
                };
            }

            args[0] = events;

            on.apply(that, args);

            return that;
        },

        kendoDestroy: function(ns) {
            ns = ns || this.data("kendoNS");

            if (ns) {
                this.off("." + ns);
            }

            return this;
        }
    });

    kendo.jQuery = kendoJQuery;
    kendo.eventMap = eventMap;

    kendo.timezone = (function(){
        var months =  { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

        function ruleToDate(year, rule) {
            var date;
            var targetDay;
            var ourDay;
            var month = rule[3];
            var on = rule[4];
            var time = rule[5];
            var cache = rule[8];

            if (!cache) {
                rule[8] = cache = {};
            }

            if (cache[year]) {
                return cache[year];
            }

            if (!isNaN(on)) {
                date = new Date(Date.UTC(year, months[month], on, time[0], time[1], time[2], 0));
            } else if (on.indexOf("last") === 0) {
                date = new Date(Date.UTC(year, months[month] + 1, 1, time[0] - 24, time[1], time[2], 0));

                targetDay = days[on.substr(4, 3)];
                ourDay = date.getUTCDay();

                date.setUTCDate(date.getUTCDate() + targetDay - ourDay - (targetDay > ourDay ? 7 : 0));
            } else if (on.indexOf(">=") >= 0) {
                date = new Date(Date.UTC(year, months[month], on.substr(5), time[0], time[1], time[2], 0));

                targetDay = days[on.substr(0, 3)];
                ourDay = date.getUTCDay();

                date.setUTCDate(date.getUTCDate() + targetDay - ourDay + (targetDay < ourDay ? 7 : 0));
            }

            return cache[year] = date;
        }

        function findRule(utcTime, rules, zone) {
            rules = rules[zone];

            if (!rules) {
                var time = zone.split(":");
                var offset = 0;

                if (time.length > 1) {
                    offset = time[0] * 60 + Number(time[1]);
                }

                return [-1000000, 'max', '-', 'Jan', 1, [0, 0, 0], offset, '-'];
            }

            var year = new Date(utcTime).getUTCFullYear();

            rules = jQuery.grep(rules, function(rule) {
                var from = rule[0];
                var to = rule[1];

                return from <= year && (to >= year || (from == year && to == "only") || to == "max");
            });

            rules.push(utcTime);

            rules.sort(function(a, b) {
                if (typeof a != "number") {
                    a = Number(ruleToDate(year, a));
                }

                if (typeof b != "number") {
                    b = Number(ruleToDate(year, b));
                }

                return a - b;
            });

            var rule = rules[jQuery.inArray(utcTime, rules) - 1] || rules[rules.length - 1];

            return isNaN(rule) ? rule : null;
        }

        function findZone(utcTime, zones, timezone) {
            var zoneRules = zones[timezone];

            if (typeof zoneRules === "string") {
                zoneRules = zones[zoneRules];
            }

            if (!zoneRules) {
                throw new Error('Timezone "' + timezone + '" is either incorrect, or kendo.timezones.min.js is not included.');
            }

            for (var idx = zoneRules.length - 1; idx >= 0; idx--) {
                var until = zoneRules[idx][3];

                if (until && utcTime > until) {
                    break;
                }
            }

            var zone = zoneRules[idx + 1];

            if (!zone) {
                throw new Error('Timezone "' + timezone + '" not found on ' + utcTime + ".");
            }

            return zone;
        }

        function zoneAndRule(utcTime, zones, rules, timezone) {
            if (typeof utcTime != NUMBER) {
                utcTime = Date.UTC(utcTime.getFullYear(), utcTime.getMonth(),
                    utcTime.getDate(), utcTime.getHours(), utcTime.getMinutes(),
                    utcTime.getSeconds(), utcTime.getMilliseconds());
            }

            var zone = findZone(utcTime, zones, timezone);

            return {
                zone: zone,
                rule: findRule(utcTime, rules, zone[1])
            };
        }

        function offset(utcTime, timezone) {
            if (timezone == "Etc/UTC" || timezone == "Etc/GMT") {
                return 0;
            }

            var info = zoneAndRule(utcTime, this.zones, this.rules, timezone);
            var zone = info.zone;
            var rule = info.rule;

            return kendo.parseFloat(rule? zone[0] - rule[6] : zone[0]);
        }

        function abbr(utcTime, timezone) {
            var info = zoneAndRule(utcTime, this.zones, this.rules, timezone);
            var zone = info.zone;
            var rule = info.rule;

            var base = zone[2];

            if (base.indexOf("/") >= 0) {
                return base.split("/")[rule && +rule[6] ? 1 : 0];
            } else if (base.indexOf("%s") >= 0) {
                return base.replace("%s", (!rule || rule[7] == "-") ? '' : rule[7]);
            }

            return base;
        }

        function convert(date, fromOffset, toOffset) {
            if (typeof fromOffset == STRING) {
                fromOffset = this.offset(date, fromOffset);
            }

            if (typeof toOffset == STRING) {
                toOffset = this.offset(date, toOffset);
            }

            var fromLocalOffset = date.getTimezoneOffset();

            date = new Date(date.getTime() + (fromOffset - toOffset) * 60000);

            var toLocalOffset = date.getTimezoneOffset();

            return new Date(date.getTime() + (toLocalOffset - fromLocalOffset) * 60000);
        }

        function apply(date, timezone) {
           return this.convert(date, date.getTimezoneOffset(), timezone);
        }

        function remove(date, timezone) {
           return this.convert(date, timezone, date.getTimezoneOffset());
        }

        function toLocalDate(time) {
            return this.apply(new Date(time), "Etc/UTC");
        }

        return {
           zones: {},
           rules: {},
           offset: offset,
           convert: convert,
           apply: apply,
           remove: remove,
           abbr: abbr,
           toLocalDate: toLocalDate
        };
    })();

    kendo.date = (function(){
        var MS_PER_MINUTE = 60000,
            MS_PER_DAY = 86400000;

        function adjustDST(date, hours) {
            if (hours === 0 && date.getHours() === 23) {
                date.setHours(date.getHours() + 2);
                return true;
            }

            return false;
        }

        function setDayOfWeek(date, day, dir) {
            var hours = date.getHours();

            dir = dir || 1;
            day = ((day - date.getDay()) + (7 * dir)) % 7;

            date.setDate(date.getDate() + day);
            adjustDST(date, hours);
        }

        function dayOfWeek(date, day, dir) {
            date = new Date(date);
            setDayOfWeek(date, day, dir);
            return date;
        }

        function firstDayOfMonth(date) {
            return new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            );
        }

        function lastDayOfMonth(date) {
            var last = new Date(date.getFullYear(), date.getMonth() + 1, 0),
                first = firstDayOfMonth(date),
                timeOffset = Math.abs(last.getTimezoneOffset() - first.getTimezoneOffset());

            if (timeOffset) {
                last.setHours(first.getHours() + (timeOffset / 60));
            }

            return last;
        }

        function getDate(date) {
            date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            adjustDST(date, 0);
            return date;
        }

        function toUtcTime(date) {
            return Date.UTC(date.getFullYear(), date.getMonth(),
                        date.getDate(), date.getHours(), date.getMinutes(),
                        date.getSeconds(), date.getMilliseconds());
        }

        function getMilliseconds(date) {
            return date.getTime() - getDate(date);
        }

        function isInTimeRange(value, min, max) {
            var msMin = getMilliseconds(min),
                msMax = getMilliseconds(max),
                msValue;

            if (!value || msMin == msMax) {
                return true;
            }

            if (min >= max) {
                max += MS_PER_DAY;
            }

            msValue = getMilliseconds(value);

            if (msMin > msValue) {
                msValue += MS_PER_DAY;
            }

            if (msMax < msMin) {
                msMax += MS_PER_DAY;
            }

            return msValue >= msMin && msValue <= msMax;
        }

        function isInDateRange(value, min, max) {
            var msMin = min.getTime(),
                msMax = max.getTime(),
                msValue;

            if (msMin >= msMax) {
                msMax += MS_PER_DAY;
            }

            msValue = value.getTime();

            return msValue >= msMin && msValue <= msMax;
        }

        function addDays(date, offset) {
            var hours = date.getHours();
                date = new Date(date);

            setTime(date, offset * MS_PER_DAY);
            adjustDST(date, hours);
            return date;
        }

        function setTime(date, milliseconds, ignoreDST) {
            var offset = date.getTimezoneOffset();
            var difference;

            date.setTime(date.getTime() + milliseconds);

            if (!ignoreDST) {
                difference = date.getTimezoneOffset() - offset;
                date.setTime(date.getTime() + difference * MS_PER_MINUTE);
            }
        }

        function today() {
            return getDate(new Date());
        }

        function isToday(date) {
           return getDate(date).getTime() == today().getTime();
        }

        function toInvariantTime(date) {
            var staticDate = new Date(1980, 1, 1, 0, 0, 0);

            if (date) {
                staticDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
            }

            return staticDate;
        }

        return {
            adjustDST: adjustDST,
            dayOfWeek: dayOfWeek,
            setDayOfWeek: setDayOfWeek,
            getDate: getDate,
            isInDateRange: isInDateRange,
            isInTimeRange: isInTimeRange,
            isToday: isToday,
            nextDay: function(date) {
                return addDays(date, 1);
            },
            previousDay: function(date) {
                return addDays(date, -1);
            },
            toUtcTime: toUtcTime,
            MS_PER_DAY: MS_PER_DAY,
            MS_PER_HOUR: 60 * MS_PER_MINUTE,
            MS_PER_MINUTE: MS_PER_MINUTE,
            setTime: setTime,
            addDays: addDays,
            today: today,
            toInvariantTime: toInvariantTime,
            firstDayOfMonth: firstDayOfMonth,
            lastDayOfMonth: lastDayOfMonth,
            getMilliseconds: getMilliseconds
            //TODO methods: combine date portion and time portion from arguments - date1, date 2
        };
    })();


    kendo.stripWhitespace = function(element) {
        if (document.createNodeIterator) {
            var iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT, function(node) {
                    return node.parentNode == element ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }, false);

            while (iterator.nextNode()) {
                if (iterator.referenceNode && !iterator.referenceNode.textContent.trim()) {
                    iterator.referenceNode.parentNode.removeChild(iterator.referenceNode);
                }
            }
        } else { // IE7/8 support
            for (var i = 0; i < element.childNodes.length; i++) {
                var child = element.childNodes[i];

                if (child.nodeType == 3 && !/\S/.test(child.nodeValue)) {
                    element.removeChild(child);
                    i--;
                }

                if (child.nodeType == 1) {
                    kendo.stripWhitespace(child);
                }
            }
        }
    };

    var animationFrame  = window.requestAnimationFrame       ||
                          window.webkitRequestAnimationFrame ||
                          window.mozRequestAnimationFrame    ||
                          window.oRequestAnimationFrame      ||
                          window.msRequestAnimationFrame     ||
                          function(callback){ setTimeout(callback, 1000 / 60); };

    kendo.animationFrame = function(callback) {
        animationFrame.call(window, callback);
    };

    var animationQueue = [];

    kendo.queueAnimation = function(callback) {
        animationQueue[animationQueue.length] = callback;
        if (animationQueue.length === 1) {
            kendo.runNextAnimation();
        }
    };

    kendo.runNextAnimation = function() {
        kendo.animationFrame(function() {
            if (animationQueue[0]) {
                animationQueue.shift()();
                if (animationQueue[0]) {
                    kendo.runNextAnimation();
                }
            }
        });
    };

    kendo.parseQueryStringParams = function(url) {
        var queryString = url.split('?')[1] || "",
            params = {},
            paramParts = queryString.split(/&|=/),
            length = paramParts.length,
            idx = 0;

        for (; idx < length; idx += 2) {
            if(paramParts[idx] !== "") {
                params[decodeURIComponent(paramParts[idx])] = decodeURIComponent(paramParts[idx + 1]);
            }
        }

        return params;
    };

    kendo.elementUnderCursor = function(e) {
        if (typeof e.x.client != "undefined") {
            return document.elementFromPoint(e.x.client, e.y.client);
        }
    };

    kendo.wheelDeltaY = function(jQueryEvent) {
        var e = jQueryEvent.originalEvent,
            deltaY = e.wheelDeltaY,
            delta;

            if (e.wheelDelta) { // Webkit and IE
                if (deltaY === undefined || deltaY) { // IE does not have deltaY, thus always scroll (horizontal scrolling is treated as vertical)
                    delta = e.wheelDelta;
                }
            } else if (e.detail && e.axis === e.VERTICAL_AXIS) { // Firefox and Opera
                delta = (-e.detail) * 10;
            }

        return delta;
    };

    kendo.throttle = function(fn, delay) {
        var timeout;
        var lastExecTime = 0;

        if (!delay || delay <= 0) {
            return fn;
        }

        var throttled = function() {
            var that = this;
            var elapsed = +new Date() - lastExecTime;
            var args = arguments;

            function exec() {
                fn.apply(that, args);
                lastExecTime = +new Date();
            }

            // first execution
            if (!lastExecTime) {
                return exec();
            }

            if (timeout) {
                clearTimeout(timeout);
            }

            if (elapsed > delay) {
                exec();
            } else {
                timeout = setTimeout(exec, delay - elapsed);
            }
        };

        throttled.cancel = function() {
            clearTimeout(timeout);
        };

        return throttled;
    };


    kendo.caret = function (element, start, end) {
        var rangeElement;
        var isPosition = start !== undefined;

        if (end === undefined) {
            end = start;
        }

        if (element[0]) {
            element = element[0];
        }

        if (isPosition && element.disabled) {
            return;
        }

        try {
            if (element.selectionStart !== undefined) {
                if (isPosition) {
                    element.focus();
                    element.setSelectionRange(start, end);
                } else {
                    start = [element.selectionStart, element.selectionEnd];
                }
            } else if (document.selection) {
                if ($(element).is(":visible")) {
                    element.focus();
                }

                rangeElement = element.createTextRange();

                if (isPosition) {
                    rangeElement.collapse(true);
                    rangeElement.moveStart("character", start);
                    rangeElement.moveEnd("character", end - start);
                    rangeElement.select();
                } else {
                    var rangeDuplicated = rangeElement.duplicate(),
                        selectionStart, selectionEnd;

                        rangeElement.moveToBookmark(document.selection.createRange().getBookmark());
                        rangeDuplicated.setEndPoint('EndToStart', rangeElement);
                        selectionStart = rangeDuplicated.text.length;
                        selectionEnd = selectionStart + rangeElement.text.length;

                    start = [selectionStart, selectionEnd];
                }
            }
        } catch(e) {
            /* element is not focused or it is not in the DOM */
            start = [];
        }

        return start;
    };

    kendo.compileMobileDirective = function(element, scope) {
        var angular = window.angular;

        element.attr("data-" + kendo.ns + "role", element[0].tagName.toLowerCase().replace('kendo-mobile-', '').replace('-', ''));

        angular.element(element).injector().invoke(["$compile", function($compile) {
            $compile(element)(scope);

            if (!/^\$(digest|apply)$/.test(scope.$$phase)) {
                scope.$digest();
            }
        }]);

        return kendo.widgetInstance(element, kendo.mobile.ui);
    };

    kendo.antiForgeryTokens = function() {
        var tokens = { },
            csrf_token = $("meta[name=csrf-token],meta[name=_csrf]").attr("content"),
            csrf_param = $("meta[name=csrf-param],meta[name=_csrf_header]").attr("content");

        $("input[name^='__RequestVerificationToken']").each(function() {
            tokens[this.name] = this.value;
        });

        if (csrf_param !== undefined && csrf_token !== undefined) {
          tokens[csrf_param] = csrf_token;
        }

        return tokens;
    };

    // kendo.saveAs -----------------------------------------------
    (function() {
        function postToProxy(dataURI, fileName, proxyURL, proxyTarget) {
            var form = $("<form>").attr({
                action: proxyURL,
                method: "POST",
                target: proxyTarget
            });

            var data = kendo.antiForgeryTokens();
            data.fileName = fileName;

            var parts = dataURI.split(";base64,");
            data.contentType = parts[0].replace("data:", "");
            data.base64 = parts[1];

            for (var name in data) {
                if (data.hasOwnProperty(name)) {
                    $('<input>').attr({
                        value: data[name],
                        name: name,
                        type: "hidden"
                    }).appendTo(form);
                }
            }

            form.appendTo("body").submit().remove();
        }

        var fileSaver = document.createElement("a");
        var downloadAttribute = "download" in fileSaver;

        function saveAsBlob(dataURI, fileName) {
            var blob = dataURI; // could be a Blob object

            if (typeof dataURI == "string") {
                var parts = dataURI.split(";base64,");
                var contentType = parts[0];
                var base64 = atob(parts[1]);
                var array = new Uint8Array(base64.length);

                for (var idx = 0; idx < base64.length; idx++) {
                    array[idx] = base64.charCodeAt(idx);
                }
                blob = new Blob([array.buffer], { type: contentType });
            }

            navigator.msSaveBlob(blob, fileName);
        }

        function saveAsDataURI(dataURI, fileName) {
            if (window.Blob && dataURI instanceof Blob) {
                dataURI = URL.createObjectURL(dataURI);
            }

            fileSaver.download = fileName;
            fileSaver.href = dataURI;

            var e = document.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);

            fileSaver.dispatchEvent(e);
        }

        kendo.saveAs = function(options) {
            var save = postToProxy;

            if (!options.forceProxy) {
                if (downloadAttribute) {
                    save = saveAsDataURI;
                } else if (navigator.msSaveBlob) {
                    save = saveAsBlob;
                }
            }

            save(options.dataURI, options.fileName, options.proxyURL, options.proxyTarget);
        };
    })();
})(jQuery, window);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core", "./kendo.binder", "./kendo.fx" ], f);
})(function(){

var __meta__ = {
    id: "view",
    name: "View",
    category: "framework",
    description: "The View class instantiates and handles the events of a certain screen from the application.",
    depends: [ "core", "binder", "fx" ],
    hidden: false
};

(function($, undefined) {
    var kendo = window.kendo,
        Observable = kendo.Observable,
        SCRIPT = "SCRIPT",
        INIT = "init",
        SHOW = "show",
        HIDE = "hide",
        TRANSITION_START = "transitionStart",
        TRANSITION_END = "transitionEnd",

        ATTACH = "attach",
        DETACH = "detach",
        sizzleErrorRegExp = /unrecognized expression/;

    var View = Observable.extend({
        init: function(content, options) {
            var that = this;
            options = options || {};

            Observable.fn.init.call(that);
            that.content = content;
            that.id = kendo.guid();
            that.tagName = options.tagName || "div";
            that.model = options.model;
            that._wrap = options.wrap !== false;
            this._evalTemplate = options.evalTemplate || false;
            that._fragments = {};

            that.bind([ INIT, SHOW, HIDE, TRANSITION_START, TRANSITION_END ], options);
        },

        render: function(container) {
            var that = this,
                notInitialized = !that.element;

            // The order below matters - kendo.bind should happen when the element is in the DOM, and show should be triggered after init.

            if (notInitialized) {
                that.element = that._createElement();
            }

            if (container) {
                $(container).append(that.element);
            }

            if (notInitialized) {
                kendo.bind(that.element, that.model);
                that.trigger(INIT);
            }

            if (container) {
                that._eachFragment(ATTACH);
                that.trigger(SHOW);
            }

            return that.element;
        },

        clone: function(back) {
            return new ViewClone(this);
        },

        triggerBeforeShow: function() {
            return true;
        },

        triggerBeforeHide: function() {
            return true;
        },

        showStart: function() {
            this.element.css("display", "");
        },

        showEnd: function() {
        },

        hideEnd: function() {
            this.hide();
        },

        beforeTransition: function(type){
            this.trigger(TRANSITION_START, { type: type });
        },

        afterTransition: function(type){
            this.trigger(TRANSITION_END, { type: type });
        },

        hide: function() {
            this._eachFragment(DETACH);
            this.element.detach();
            this.trigger(HIDE);
        },

        destroy: function() {
            var element = this.element;

            if (element) {
                kendo.unbind(element);
                kendo.destroy(element);
                element.remove();
            }
        },

        fragments: function(fragments) {
            $.extend(this._fragments, fragments);
        },

        _eachFragment: function(methodName) {
            for (var placeholder in this._fragments) {
                this._fragments[placeholder][methodName](this, placeholder);
            }
        },

        _createElement: function() {
            var that = this,
                wrapper = "<" + that.tagName + " />",
                element,
                content;

            try {
                content = $(document.getElementById(that.content) || that.content); // support passing id without #

                if (content[0].tagName === SCRIPT) {
                    content = content.html();
                }
            } catch(e) {
                if (sizzleErrorRegExp.test(e.message)) {
                    content = that.content;
                }
            }

            if (typeof content === "string") {
                content = content.replace(/^\s+|\s+$/g, '');
                if (that._evalTemplate) {
                    content = kendo.template(content)(that.model || {});
                }

                element = $(wrapper).append(content);
                // drop the wrapper if asked - this seems like the easiest (although not very intuitive) way to avoid messing up templates with questionable content, like this one for instance:
                // <script id="my-template">
                // foo
                // <span> Span </span>
                // </script>
                if (!that._wrap) {
                   element = element.contents();
                }
            } else {
                element = content;
                if (that._evalTemplate) {
                    var result = $(kendo.template($("<div />").append(element.clone(true)).html())(that.model || {}));

                    // template uses DOM
                    if ($.contains(document, element[0])) {
                        element.replaceWith(result);
                    }

                    element = result;
                }
                if (that._wrap) {
                    element = element.wrapAll(wrapper).parent();
                }
            }

            return element;
        }
    });

    var ViewClone = kendo.Class.extend({
        init: function(view) {
            $.extend(this, {
                element: view.element.clone(true),
                transition: view.transition,
                id: view.id
            });

            view.element.parent().append(this.element);
        },

        hideEnd: function() {
            this.element.remove();
        },

        beforeTransition: $.noop,
        afterTransition: $.noop
    });

    var Layout = View.extend({
        init: function(content, options) {
            View.fn.init.call(this, content, options);
            this.containers = {};
        },

        container: function(selector) {
            var container = this.containers[selector];

            if (!container) {
                container = this._createContainer(selector);
                this.containers[selector] = container;
            }

            return container;
        },

        showIn: function(selector, view, transition) {
            this.container(selector).show(view, transition);
        },

        _createContainer: function(selector) {
            var root = this.render(),
                element = root.find(selector),
                container;

            if (!element.length && root.is(selector)) {
                if (root.is(selector)) {
                    element = root;
                } else {

                    throw new Error("can't find a container with the specified " + selector + " selector");
                }
            }

            container = new ViewContainer(element);

            container.bind("accepted", function(e) {
                e.view.render(element);
            });

            return container;
        }
    });

    var Fragment = View.extend({
        attach: function(view, placeholder) {
            view.element.find(placeholder).replaceWith(this.render());
        },

        detach: function() {
        }
    });

    var transitionRegExp = /^(\w+)(:(\w+))?( (\w+))?$/;

    function parseTransition(transition) {
        if (!transition){
            return {};
        }

        var matches = transition.match(transitionRegExp) || [];

        return {
            type: matches[1],
            direction: matches[3],
            reverse: matches[5] === "reverse"
        };
    }

    var ViewContainer = Observable.extend({
        init: function(container) {
            Observable.fn.init.call(this);
            this.container = container;
            this.history = [];
            this.view = null;
            this.running = false;
        },

        after: function() {
            this.running = false;
            this.trigger("complete", {view: this.view});
            this.trigger("after");
        },

        end: function() {
            this.view.showEnd();
            this.previous.hideEnd();
            this.after();
        },

        show: function(view, transition, locationID) {
            if (!view.triggerBeforeShow() || (this.view && !this.view.triggerBeforeHide())) {
                this.trigger("after");
                return false;
            }

            locationID = locationID || view.id;

            var that = this,
                current = (view === that.view) ? view.clone() : that.view,
                history = that.history,
                previousEntry = history[history.length - 2] || {},
                back = previousEntry.id === locationID,
                // If explicit transition is set, it will be with highest priority
                // Next we will try using the history record transition or the view transition configuration
                theTransition = transition || ( back ? history[history.length - 1].transition : view.transition ),
                transitionData = parseTransition(theTransition);

            if (that.running) {
                that.effect.stop();
            }

            if (theTransition === "none") {
                theTransition = null;
            }

            that.trigger("accepted", { view: view });
            that.view = view;
            that.previous = current;
            that.running = true;

            if (!back) {
                history.push({ id: locationID, transition: theTransition });
            } else {
                history.pop();
            }

            if (!current) {
                view.showStart();
                view.showEnd();
                that.after();
                return true;
            }

            if (!theTransition || !kendo.effects.enabled) {
                view.showStart();
                that.end();
            } else {
                // hide the view element before init/show - prevents blinks on iPad
                // the replace effect will remove this class
                view.element.addClass("k-fx-hidden");
                view.showStart();
                // do not reverse the explicit transition
                if (back && !transition) {
                    transitionData.reverse = !transitionData.reverse;
                }

                that.effect = kendo.fx(view.element).replace(current.element, transitionData.type)
                    .beforeTransition(function() {
                        view.beforeTransition("show");
                        current.beforeTransition("hide");
                    })
                    .afterTransition(function() {
                        view.afterTransition("show");
                        current.afterTransition("hide");
                    })
                    .direction(transitionData.direction)
                    .setReverse(transitionData.reverse);

                that.effect.run().then(function() { that.end(); });
            }

            return true;
        }
    });

    kendo.ViewContainer = ViewContainer;
    kendo.Fragment = Fragment;
    kendo.Layout = Layout;
    kendo.View = View;
    kendo.ViewClone = ViewClone;

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "fx",
    name: "Effects",
    category: "framework",
    description: "Required for animation effects in all Kendo UI widgets.",
    depends: [ "core" ]
};

(function($, undefined) {
    var kendo = window.kendo,
        fx = kendo.effects,
        each = $.each,
        extend = $.extend,
        proxy = $.proxy,
        support = kendo.support,
        browser = support.browser,
        transforms = support.transforms,
        transitions = support.transitions,
        scaleProperties = { scale: 0, scalex: 0, scaley: 0, scale3d: 0 },
        translateProperties = { translate: 0, translatex: 0, translatey: 0, translate3d: 0 },
        hasZoom = (typeof document.documentElement.style.zoom !== "undefined") && !transforms,
        matrix3dRegExp = /matrix3?d?\s*\(.*,\s*([\d\.\-]+)\w*?,\s*([\d\.\-]+)\w*?,\s*([\d\.\-]+)\w*?,\s*([\d\.\-]+)\w*?/i,
        cssParamsRegExp = /^(-?[\d\.\-]+)?[\w\s]*,?\s*(-?[\d\.\-]+)?[\w\s]*/i,
        translateXRegExp = /translatex?$/i,
        oldEffectsRegExp = /(zoom|fade|expand)(\w+)/,
        singleEffectRegExp = /(zoom|fade|expand)/,
        unitRegExp = /[xy]$/i,
        transformProps = ["perspective", "rotate", "rotatex", "rotatey", "rotatez", "rotate3d", "scale", "scalex", "scaley", "scalez", "scale3d", "skew", "skewx", "skewy", "translate", "translatex", "translatey", "translatez", "translate3d", "matrix", "matrix3d"],
        transform2d = ["rotate", "scale", "scalex", "scaley", "skew", "skewx", "skewy", "translate", "translatex", "translatey", "matrix"],
        transform2units = { "rotate": "deg", scale: "", skew: "px", translate: "px" },
        cssPrefix = transforms.css,
        round = Math.round,
        BLANK = "",
        PX = "px",
        NONE = "none",
        AUTO = "auto",
        WIDTH = "width",
        HEIGHT = "height",
        HIDDEN = "hidden",
        ORIGIN = "origin",
        ABORT_ID = "abortId",
        OVERFLOW = "overflow",
        TRANSLATE = "translate",
        POSITION = "position",
        COMPLETE_CALLBACK = "completeCallback",
        TRANSITION = cssPrefix + "transition",
        TRANSFORM = cssPrefix + "transform",
        BACKFACE = cssPrefix + "backface-visibility",
        PERSPECTIVE = cssPrefix + "perspective",
        DEFAULT_PERSPECTIVE = "1500px",
        TRANSFORM_PERSPECTIVE = "perspective(" + DEFAULT_PERSPECTIVE + ")",
        ios7 = support.mobileOS && support.mobileOS.majorVersion == 7,
        directions = {
            left: {
                reverse: "right",
                property: "left",
                transition: "translatex",
                vertical: false,
                modifier: -1
            },
            right: {
                reverse: "left",
                property: "left",
                transition: "translatex",
                vertical: false,
                modifier: 1
            },
            down: {
                reverse: "up",
                property: "top",
                transition: "translatey",
                vertical: true,
                modifier: 1
            },
            up: {
                reverse: "down",
                property: "top",
                transition: "translatey",
                vertical: true,
                modifier: -1
            },
            top: {
                reverse: "bottom"
            },
            bottom: {
                reverse: "top"
            },
            "in": {
                reverse: "out",
                modifier: -1
            },
            out: {
                reverse: "in",
                modifier: 1
            },

            vertical: {
                reverse: "vertical"
            },

            horizontal: {
                reverse: "horizontal"
            }
        };

    kendo.directions = directions;

    extend($.fn, {
        kendoStop: function(clearQueue, gotoEnd) {
            if (transitions) {
                return fx.stopQueue(this, clearQueue || false, gotoEnd || false);
            } else {
                return this.stop(clearQueue, gotoEnd);
            }
        }
    });

    /* jQuery support for all transform animations (FF 3.5/3.6, Opera 10.x, IE9 */

    if (transforms && !transitions) {
        each(transform2d, function(idx, value) {
            $.fn[value] = function(val) {
                if (typeof val == "undefined") {
                    return animationProperty(this, value);
                } else {
                    var that = $(this)[0],
                        transformValue = value + "(" + val + transform2units[value.replace(unitRegExp, "")] + ")";

                    if (that.style.cssText.indexOf(TRANSFORM) == -1) {
                        $(this).css(TRANSFORM, transformValue);
                    } else {
                        that.style.cssText = that.style.cssText.replace(new RegExp(value + "\\(.*?\\)", "i"), transformValue);
                    }
                }
                return this;
            };

            $.fx.step[value] = function (fx) {
                $(fx.elem)[value](fx.now);
            };
        });

        var curProxy = $.fx.prototype.cur;
        $.fx.prototype.cur = function () {
            if (transform2d.indexOf(this.prop) != -1) {
                return parseFloat($(this.elem)[this.prop]());
            }

            return curProxy.apply(this, arguments);
        };
    }

    kendo.toggleClass = function(element, classes, options, add) {
        if (classes) {
            classes = classes.split(" ");

            if (transitions) {
                options = extend({
                    exclusive: "all",
                    duration: 400,
                    ease: "ease-out"
                }, options);

                element.css(TRANSITION, options.exclusive + " " + options.duration + "ms " + options.ease);
                setTimeout(function() {
                    element.css(TRANSITION, "").css(HEIGHT);
                }, options.duration); // TODO: this should fire a kendoAnimate session instead.
            }

            each(classes, function(idx, value) {
                element.toggleClass(value, add);
            });
        }

        return element;
    };

    kendo.parseEffects = function(input, mirror) {
        var effects = {};

        if (typeof input === "string") {
            each(input.split(" "), function(idx, value) {
                var redirectedEffect = !singleEffectRegExp.test(value),
                    resolved = value.replace(oldEffectsRegExp, function(match, $1, $2) {
                        return $1 + ":" + $2.toLowerCase();
                    }), // Support for old zoomIn/fadeOut style, now deprecated.
                    effect = resolved.split(":"),
                    direction = effect[1],
                    effectBody = {};

                if (effect.length > 1) {
                    effectBody.direction = (mirror && redirectedEffect ? directions[direction].reverse : direction);
                }

                effects[effect[0]] = effectBody;
            });
        } else {
            each(input, function(idx) {
                var direction = this.direction;

                if (direction && mirror && !singleEffectRegExp.test(idx)) {
                    this.direction = directions[direction].reverse;
                }

                effects[idx] = this;
            });
        }

        return effects;
    };

    function parseInteger(value) {
        return parseInt(value, 10);
    }

    function parseCSS(element, property) {
        return parseInteger(element.css(property));
    }

    function keys(obj) {
        var acc = [];
        for (var propertyName in obj) {
            acc.push(propertyName);
        }
        return acc;
    }

    function strip3DTransforms(properties) {
        for (var key in properties) {
            if (transformProps.indexOf(key) != -1 && transform2d.indexOf(key) == -1) {
                delete properties[key];
            }
        }

        return properties;
    }

    function normalizeCSS(element, properties) {
        var transformation = [], cssValues = {}, lowerKey, key, value, isTransformed;

        for (key in properties) {
            lowerKey = key.toLowerCase();
            isTransformed = transforms && transformProps.indexOf(lowerKey) != -1;

            if (!support.hasHW3D && isTransformed && transform2d.indexOf(lowerKey) == -1) {
                delete properties[key];
            } else {
                value = properties[key];

                if (isTransformed) {
                    transformation.push(key + "(" + value + ")");
                } else {
                    cssValues[key] = value;
                }
            }
        }

        if (transformation.length) {
            cssValues[TRANSFORM] = transformation.join(" ");
        }

        return cssValues;
    }

    if (transitions) {
        extend(fx, {
            transition: function(element, properties, options) {
                var css,
                    delay = 0,
                    oldKeys = element.data("keys") || [],
                    timeoutID;

                options = extend({
                        duration: 200,
                        ease: "ease-out",
                        complete: null,
                        exclusive: "all"
                    },
                    options
                );

                var stopTransitionCalled = false;

                var stopTransition = function() {
                    if (!stopTransitionCalled) {
                        stopTransitionCalled = true;

                        if (timeoutID) {
                            clearTimeout(timeoutID);
                            timeoutID = null;
                        }

                        element
                        .removeData(ABORT_ID)
                        .dequeue()
                        .css(TRANSITION, "")
                        .css(TRANSITION);

                        options.complete.call(element);
                    }
                };

                options.duration = $.fx ? $.fx.speeds[options.duration] || options.duration : options.duration;

                css = normalizeCSS(element, properties);

                $.merge(oldKeys, keys(css));
                element
                    .data("keys", $.unique(oldKeys))
                    .height();

                element.css(TRANSITION, options.exclusive + " " + options.duration + "ms " + options.ease).css(TRANSITION);
                element.css(css).css(TRANSFORM);

                /**
                 * Use transitionEnd event for browsers who support it - but duplicate it with setTimeout, as the transitionEnd event will not be triggered if no CSS properties change.
                 * This should be cleaned up at some point (widget by widget), and refactored to widgets not relying on the complete callback if no transition occurs.
                 *
                 * For IE9 and below, resort to setTimeout.
                 */
                if (transitions.event) {
                    element.one(transitions.event, stopTransition);
                    if (options.duration !== 0) {
                        delay = 500;
                    }
                }

                timeoutID = setTimeout(stopTransition, options.duration + delay);
                element.data(ABORT_ID, timeoutID);
                element.data(COMPLETE_CALLBACK, stopTransition);
            },

            stopQueue: function(element, clearQueue, gotoEnd) {
                var cssValues,
                    taskKeys = element.data("keys"),
                    retainPosition = (!gotoEnd && taskKeys),
                    completeCallback = element.data(COMPLETE_CALLBACK);

                if (retainPosition) {
                    cssValues = kendo.getComputedStyles(element[0], taskKeys);
                }

                if (completeCallback) {
                    completeCallback();
                }

                if (retainPosition) {
                    element.css(cssValues);
                }

                return element
                        .removeData("keys")
                        .stop(clearQueue);
            }
        });
    }

    function animationProperty(element, property) {
        if (transforms) {
            var transform = element.css(TRANSFORM);
            if (transform == NONE) {
                return property == "scale" ? 1 : 0;
            }

            var match = transform.match(new RegExp(property + "\\s*\\(([\\d\\w\\.]+)")),
                computed = 0;

            if (match) {
                computed = parseInteger(match[1]);
            } else {
                match = transform.match(matrix3dRegExp) || [0, 0, 0, 0, 0];
                property = property.toLowerCase();

                if (translateXRegExp.test(property)) {
                    computed = parseFloat(match[3] / match[2]);
                } else if (property == "translatey") {
                    computed = parseFloat(match[4] / match[2]);
                } else if (property == "scale") {
                    computed = parseFloat(match[2]);
                } else if (property == "rotate") {
                    computed = parseFloat(Math.atan2(match[2], match[1]));
                }
            }

            return computed;
        } else {
            return parseFloat(element.css(property));
        }
    }

    var EffectSet = kendo.Class.extend({
        init: function(element, options) {
            var that = this;

            that.element = element;
            that.effects = [];
            that.options = options;
            that.restore = [];
        },

        run: function(effects) {
            var that = this,
                effect,
                idx, jdx,
                length = effects.length,
                element = that.element,
                options = that.options,
                deferred = $.Deferred(),
                start = {},
                end = {},
                target,
                children,
                childrenLength;

            that.effects = effects;

            deferred.then($.proxy(that, "complete"));

            element.data("animating", true);

            for (idx = 0; idx < length; idx ++) {
                effect = effects[idx];

                effect.setReverse(options.reverse);
                effect.setOptions(options);

                that.addRestoreProperties(effect.restore);

                effect.prepare(start, end);

                children = effect.children();

                for (jdx = 0, childrenLength = children.length; jdx < childrenLength; jdx ++) {
                    children[jdx].duration(options.duration).run();
                }
            }

            // legacy support for options.properties
            for (var effectName in options.effects) {
                extend(end, options.effects[effectName].properties);
            }

            // Show the element initially
            if (!element.is(":visible")) {
                extend(start, { display: element.data("olddisplay") || "block" });
            }

            if (transforms && !options.reset) {
                target = element.data("targetTransform");

                if (target) {
                    start = extend(target, start);
                }
            }

            start = normalizeCSS(element, start);

            if (transforms && !transitions) {
                start = strip3DTransforms(start);
            }

            element.css(start)
                   .css(TRANSFORM); // Nudge

            for (idx = 0; idx < length; idx ++) {
                effects[idx].setup();
            }

            if (options.init) {
                options.init();
            }

            element.data("targetTransform", end);
            fx.animate(element, end, extend({}, options, { complete: deferred.resolve }));

            return deferred.promise();
        },

        stop: function() {
            $(this.element).kendoStop(true, true);
        },

        addRestoreProperties: function(restore) {
            var element = this.element,
                value,
                i = 0,
                length = restore.length;

            for (; i < length; i ++) {
                value = restore[i];

                this.restore.push(value);

                if (!element.data(value)) {
                    element.data(value, element.css(value));
                }
            }
        },

        restoreCallback: function() {
            var element = this.element;

            for (var i = 0, length = this.restore.length; i < length; i ++) {
                var value = this.restore[i];
                element.css(value, element.data(value));
            }
        },

        complete: function() {
            var that = this,
                idx = 0,
                element = that.element,
                options = that.options,
                effects = that.effects,
                length = effects.length;

            element
                .removeData("animating")
                .dequeue(); // call next animation from the queue

            if (options.hide) {
                element.data("olddisplay", element.css("display")).hide();
            }

            this.restoreCallback();

            if (hasZoom && !transforms) {
                setTimeout($.proxy(this, "restoreCallback"), 0); // Again jQuery callback in IE8-
            }

            for (; idx < length; idx ++) {
                effects[idx].teardown();
            }

            if (options.completeCallback) {
                options.completeCallback(element);
            }
        }
    });

    fx.promise = function(element, options) {
        var effects = [],
            effectClass,
            effectSet = new EffectSet(element, options),
            parsedEffects = kendo.parseEffects(options.effects),
            effect;

        options.effects = parsedEffects;

        for (var effectName in parsedEffects) {
            effectClass = fx[capitalize(effectName)];

            if (effectClass) {
                effect = new effectClass(element, parsedEffects[effectName].direction);
                effects.push(effect);
           }
        }

        if (effects[0]) {
            effectSet.run(effects);
        } else { // Not sure how would an fx promise reach this state - means that you call kendoAnimate with no valid effects? Why?
            if (!element.is(":visible")) {
                element.css({ display: element.data("olddisplay") || "block" }).css("display");
            }

            if (options.init) {
                options.init();
            }

            element.dequeue();
            effectSet.complete();
        }
    };

    extend(fx, {
        animate: function(elements, properties, options) {
            var useTransition = options.transition !== false;
            delete options.transition;

            if (transitions && "transition" in fx && useTransition) {
                fx.transition(elements, properties, options);
            } else {
                if (transforms) {
                    elements.animate(strip3DTransforms(properties), { queue: false, show: false, hide: false, duration: options.duration, complete: options.complete }); // Stop animate from showing/hiding the element to be able to hide it later on.
                } else {
                    elements.each(function() {
                        var element = $(this),
                            multiple = {};

                        each(transformProps, function(idx, value) { // remove transforms to avoid IE and older browsers confusion
                            var params,
                                currentValue = properties ? properties[value]+ " " : null; // We need to match

                            if (currentValue) {
                                var single = properties;

                                if (value in scaleProperties && properties[value] !== undefined) {
                                    params = currentValue.match(cssParamsRegExp);
                                    if (transforms) {
                                        extend(single, { scale: +params[0] });
                                    }
                                } else {
                                    if (value in translateProperties && properties[value] !== undefined) {
                                        var position = element.css(POSITION),
                                            isFixed = (position == "absolute" || position == "fixed");

                                        if (!element.data(TRANSLATE)) {
                                            if (isFixed) {
                                                element.data(TRANSLATE, {
                                                    top: parseCSS(element, "top") || 0,
                                                    left: parseCSS(element, "left") || 0,
                                                    bottom: parseCSS(element, "bottom"),
                                                    right: parseCSS(element, "right")
                                                });
                                            } else {
                                                element.data(TRANSLATE, {
                                                    top: parseCSS(element, "marginTop") || 0,
                                                    left: parseCSS(element, "marginLeft") || 0
                                                });
                                            }
                                        }

                                        var originalPosition = element.data(TRANSLATE);

                                        params = currentValue.match(cssParamsRegExp);
                                        if (params) {

                                            var dX = value == TRANSLATE + "y" ? +null : +params[1],
                                                dY = value == TRANSLATE + "y" ? +params[1] : +params[2];

                                            if (isFixed) {
                                                if (!isNaN(originalPosition.right)) {
                                                    if (!isNaN(dX)) { extend(single, { right: originalPosition.right - dX }); }
                                                } else {
                                                    if (!isNaN(dX)) { extend(single, { left: originalPosition.left + dX }); }
                                                }

                                                if (!isNaN(originalPosition.bottom)) {
                                                    if (!isNaN(dY)) { extend(single, { bottom: originalPosition.bottom - dY }); }
                                                } else {
                                                    if (!isNaN(dY)) { extend(single, { top: originalPosition.top + dY }); }
                                                }
                                            } else {
                                                if (!isNaN(dX)) { extend(single, { marginLeft: originalPosition.left + dX }); }
                                                if (!isNaN(dY)) { extend(single, { marginTop: originalPosition.top + dY }); }
                                            }
                                        }
                                    }
                                }

                                if (!transforms && value != "scale" && value in single) {
                                    delete single[value];
                                }

                                if (single) {
                                    extend(multiple, single);
                                }
                            }
                        });

                        if (browser.msie) {
                            delete multiple.scale;
                        }

                        element.animate(multiple, { queue: false, show: false, hide: false, duration: options.duration, complete: options.complete }); // Stop animate from showing/hiding the element to be able to hide it later on.
                    });
                }
            }
        }
    });

    fx.animatedPromise = fx.promise;

    var Effect = kendo.Class.extend({
        init: function(element, direction) {
            var that = this;
            that.element = element;
            that._direction = direction;
            that.options = {};
            that._additionalEffects = [];

            if (!that.restore) {
                that.restore = [];
            }
        },

// Public API
        reverse: function() {
            this._reverse = true;
            return this.run();
        },

        play: function() {
            this._reverse = false;
            return this.run();
        },

        add: function(additional) {
            this._additionalEffects.push(additional);
            return this;
        },

        direction: function(value) {
            this._direction = value;
            return this;
        },

        duration: function(duration) {
            this._duration = duration;
            return this;
        },

        compositeRun: function() {
            var that = this,
                effectSet = new EffectSet(that.element, { reverse: that._reverse, duration: that._duration }),
                effects = that._additionalEffects.concat([ that ]);

            return effectSet.run(effects);
        },

        run: function() {
            if (this._additionalEffects && this._additionalEffects[0]) {
                return this.compositeRun();
            }

            var that = this,
                element = that.element,
                idx = 0,
                restore = that.restore,
                length = restore.length,
                value,
                deferred = $.Deferred(),
                start = {},
                end = {},
                target,
                children = that.children(),
                childrenLength = children.length;

            deferred.then($.proxy(that, "_complete"));

            element.data("animating", true);

            for (idx = 0; idx < length; idx ++) {
                value = restore[idx];

                if (!element.data(value)) {
                    element.data(value, element.css(value));
                }
            }

            for (idx = 0; idx < childrenLength; idx ++) {
                children[idx].duration(that._duration).run();
            }

            that.prepare(start, end);

            if (!element.is(":visible")) {
                extend(start, { display: element.data("olddisplay") || "block" });
            }

            if (transforms) {
                target = element.data("targetTransform");

                if (target) {
                    start = extend(target, start);
                }
            }

            start = normalizeCSS(element, start);

            if (transforms && !transitions) {
                start = strip3DTransforms(start);
            }

            element.css(start).css(TRANSFORM); // Trick webkit into re-rendering

            that.setup();

            element.data("targetTransform", end);
            fx.animate(element, end, { duration: that._duration, complete: deferred.resolve });

            return deferred.promise();
        },

        stop: function() {
            var idx = 0,
                children = this.children(),
                childrenLength = children.length;

            for (idx = 0; idx < childrenLength; idx ++) {
                children[idx].stop();
            }

            $(this.element).kendoStop(true, true);
            return this;
        },

        restoreCallback: function() {
            var element = this.element;

            for (var i = 0, length = this.restore.length; i < length; i ++) {
                var value = this.restore[i];
                element.css(value, element.data(value));
            }
        },

        _complete: function() {
            var that = this,
                element = that.element;

            element
                .removeData("animating")
                .dequeue(); // call next animation from the queue

            that.restoreCallback();

            if (that.shouldHide()) {
                element.data("olddisplay", element.css("display")).hide();
            }

            if (hasZoom && !transforms) {
                setTimeout($.proxy(that, "restoreCallback"), 0); // Again jQuery callback in IE8-
            }

            that.teardown();
        },

        /////////////////////////// Support for kendo.animate;
        setOptions: function(options) {
            extend(true, this.options, options);
        },

        children: function() {
            return [];
        },

        shouldHide: $.noop,

        setup: $.noop,
        prepare: $.noop,
        teardown: $.noop,
        directions: [],

        setReverse: function(reverse) {
            this._reverse = reverse;
            return this;
        }
    });

    function capitalize(word) {
        return word.charAt(0).toUpperCase() + word.substring(1);
    }

    function createEffect(name, definition) {
        var effectClass = Effect.extend(definition),
            directions = effectClass.prototype.directions;

        fx[capitalize(name)] = effectClass;

        fx.Element.prototype[name] = function(direction, opt1, opt2, opt3) {
            return new effectClass(this.element, direction, opt1, opt2, opt3);
        };

        each(directions, function(idx, theDirection) {
            fx.Element.prototype[name + capitalize(theDirection)] = function(opt1, opt2, opt3) {
                return new effectClass(this.element, theDirection, opt1, opt2, opt3);
            };
        });
    }

    var FOUR_DIRECTIONS = ["left", "right", "up", "down"],
        IN_OUT = ["in", "out"];

    createEffect("slideIn", {
        directions: FOUR_DIRECTIONS,

        divisor: function(value) {
            this.options.divisor = value;
            return this;
        },

        prepare: function(start, end) {
            var that = this,
                tmp,
                element = that.element,
                direction = directions[that._direction],
                offset = -direction.modifier * (direction.vertical ? element.outerHeight() : element.outerWidth()),
                startValue = offset / (that.options && that.options.divisor || 1) + PX,
                endValue = "0px";

            if (that._reverse) {
                tmp = start;
                start = end;
                end = tmp;
            }

            if (transforms) {
                start[direction.transition] = startValue;
                end[direction.transition] = endValue;
            } else {
                start[direction.property] = startValue;
                end[direction.property] = endValue;
            }
        }
    });

    createEffect("tile", {
        directions: FOUR_DIRECTIONS,

        init: function(element, direction, previous) {
            Effect.prototype.init.call(this, element, direction);
            this.options = { previous: previous };
        },

        previousDivisor: function(value) {
            this.options.previousDivisor = value;
            return this;
        },

        children: function() {
            var that = this,
                reverse = that._reverse,
                previous = that.options.previous,
                divisor = that.options.previousDivisor || 1,
                dir = that._direction;

            var children = [ kendo.fx(that.element).slideIn(dir).setReverse(reverse) ];

            if (previous) {
                children.push( kendo.fx(previous).slideIn(directions[dir].reverse).divisor(divisor).setReverse(!reverse) );
            }

            return children;
        }
    });

    function createToggleEffect(name, property, defaultStart, defaultEnd) {
        createEffect(name, {
            directions: IN_OUT,

            startValue: function(value) {
                this._startValue = value;
                return this;
            },

            endValue: function(value) {
                this._endValue = value;
                return this;
            },

            shouldHide: function() {
               return this._shouldHide;
            },

            prepare: function(start, end) {
                var that = this,
                    startValue,
                    endValue,
                    out = this._direction === "out",
                    startDataValue = that.element.data(property),
                    startDataValueIsSet = !(isNaN(startDataValue) || startDataValue == defaultStart);

                if (startDataValueIsSet) {
                    startValue = startDataValue;
                } else if (typeof this._startValue !== "undefined") {
                    startValue = this._startValue;
                } else {
                    startValue = out ? defaultStart : defaultEnd;
                }

                if (typeof this._endValue !== "undefined") {
                    endValue = this._endValue;
                } else {
                    endValue = out ? defaultEnd : defaultStart;
                }

                if (this._reverse) {
                    start[property] = endValue;
                    end[property] = startValue;
                } else {
                    start[property] = startValue;
                    end[property] = endValue;
                }

                that._shouldHide = end[property] === defaultEnd;
            }
        });
    }

    createToggleEffect("fade", "opacity", 1, 0);
    createToggleEffect("zoom", "scale", 1, 0.01);

    createEffect("slideMargin", {
        prepare: function(start, end) {
            var that = this,
                element = that.element,
                options = that.options,
                origin = element.data(ORIGIN),
                offset = options.offset,
                margin,
                reverse = that._reverse;

            if (!reverse && origin === null) {
                element.data(ORIGIN, parseFloat(element.css("margin-" + options.axis)));
            }

            margin = (element.data(ORIGIN) || 0);
            end["margin-" + options.axis] = !reverse ? margin + offset : margin;
        }
    });

    createEffect("slideTo", {
        prepare: function(start, end) {
            var that = this,
                element = that.element,
                options = that.options,
                offset = options.offset.split(","),
                reverse = that._reverse;

            if (transforms) {
                end.translatex = !reverse ? offset[0] : 0;
                end.translatey = !reverse ? offset[1] : 0;
            } else {
                end.left = !reverse ? offset[0] : 0;
                end.top = !reverse ? offset[1] : 0;
            }
            element.css("left");
        }
    });

    createEffect("expand", {
        directions: ["horizontal", "vertical"],

        restore: [ OVERFLOW ],

        prepare: function(start, end) {
            var that = this,
                element = that.element,
                options = that.options,
                reverse = that._reverse,
                property = that._direction === "vertical" ? HEIGHT : WIDTH,
                setLength = element[0].style[property],
                oldLength = element.data(property),
                length = parseFloat(oldLength || setLength),
                realLength = round(element.css(property, AUTO)[property]());

            start.overflow = HIDDEN;

            length = (options && options.reset) ? realLength || length : length || realLength;

            end[property] = (reverse ? 0 : length) + PX;
            start[property] = (reverse ? length : 0) + PX;

            if (oldLength === undefined) {
                element.data(property, setLength);
            }
        },

        shouldHide: function() {
           return this._reverse;
        },

        teardown: function() {
            var that = this,
                element = that.element,
                property = that._direction === "vertical" ? HEIGHT : WIDTH,
                length = element.data(property);

            if (length == AUTO || length === BLANK) {
                setTimeout(function() { element.css(property, AUTO).css(property); }, 0); // jQuery animate complete callback in IE is called before the last animation step!
            }
        }
    });

    var TRANSFER_START_STATE = { position: "absolute", marginLeft: 0, marginTop: 0, scale: 1 };
    /**
     * Intersection point formulas are taken from here - http://zonalandeducation.com/mmts/intersections/intersectionOfTwoLines1/intersectionOfTwoLines1.html
     * Formula for a linear function from two points from here - http://demo.activemath.org/ActiveMath2/search/show.cmd?id=mbase://AC_UK_calculus/functions/ex_linear_equation_two_points
     * The transform origin point is the intersection point of the two lines from the top left corners/top right corners of the element and target.
     * The math and variables below MAY BE SIMPLIFIED (zeroes removed), but this would make the formula too cryptic.
     */
    createEffect("transfer", {
        init: function(element, target) {
            this.element = element;
            this.options = { target: target };
            this.restore = [];
        },

        setup: function() {
            this.element.appendTo(document.body);
        },

        prepare: function(start, end) {
            var that = this,
                element = that.element,
                outerBox = fx.box(element),
                innerBox = fx.box(that.options.target),
                currentScale = animationProperty(element, "scale"),
                scale = fx.fillScale(innerBox, outerBox),
                transformOrigin = fx.transformOrigin(innerBox, outerBox);

            extend(start, TRANSFER_START_STATE);
            end.scale = 1;

            element.css(TRANSFORM, "scale(1)").css(TRANSFORM);
            element.css(TRANSFORM, "scale(" + currentScale + ")");

            start.top = outerBox.top;
            start.left = outerBox.left;
            start.transformOrigin = transformOrigin.x + PX + " " + transformOrigin.y + PX;

            if (that._reverse) {
                start.scale = scale;
            } else {
                end.scale = scale;
            }
        }
    });


    var CLIPS = {
        top: "rect(auto auto $size auto)",
        bottom: "rect($size auto auto auto)",
        left: "rect(auto $size auto auto)",
        right: "rect(auto auto auto $size)"
    };

    var ROTATIONS = {
        top:    { start: "rotatex(0deg)", end: "rotatex(180deg)" },
        bottom: { start: "rotatex(-180deg)", end: "rotatex(0deg)" },
        left:   { start: "rotatey(0deg)", end: "rotatey(-180deg)" },
        right:  { start: "rotatey(180deg)", end: "rotatey(0deg)" }
    };

    function clipInHalf(container, direction) {
        var vertical = kendo.directions[direction].vertical,
            size = (container[vertical ? HEIGHT : WIDTH]() / 2) + "px";

        return CLIPS[direction].replace("$size", size);
    }

    createEffect("turningPage", {
        directions: FOUR_DIRECTIONS,

        init: function(element, direction, container) {
            Effect.prototype.init.call(this, element, direction);
            this._container = container;
        },

        prepare: function(start, end) {
            var that = this,
                reverse = that._reverse,
                direction = reverse ? directions[that._direction].reverse : that._direction,
                rotation = ROTATIONS[direction];

            start.zIndex = 1;

            if (that._clipInHalf) {
               start.clip = clipInHalf(that._container, kendo.directions[direction].reverse);
            }

            start[BACKFACE] = HIDDEN;

            end[TRANSFORM] = TRANSFORM_PERSPECTIVE + (reverse ? rotation.start : rotation.end);
            start[TRANSFORM] = TRANSFORM_PERSPECTIVE + (reverse ? rotation.end : rotation.start);
        },

        setup: function() {
            this._container.append(this.element);
        },

        face: function(value) {
            this._face = value;
            return this;
        },

        shouldHide: function() {
            var that = this,
                reverse = that._reverse,
                face = that._face;

            return (reverse && !face) || (!reverse && face);
        },

        clipInHalf: function(value) {
            this._clipInHalf = value;
            return this;
        },

        temporary: function() {
            this.element.addClass('temp-page');
            return this;
        }
    });

    createEffect("staticPage", {
        directions: FOUR_DIRECTIONS,

        init: function(element, direction, container) {
            Effect.prototype.init.call(this, element, direction);
            this._container = container;
        },

        restore: ["clip"],

        prepare: function(start, end) {
            var that = this,
                direction = that._reverse ? directions[that._direction].reverse : that._direction;

            start.clip = clipInHalf(that._container, direction);
            start.opacity = 0.999;
            end.opacity = 1;
        },

        shouldHide: function() {
            var that = this,
                reverse = that._reverse,
                face = that._face;

            return (reverse && !face) || (!reverse && face);
        },

        face: function(value) {
            this._face = value;
            return this;
        }
    });

    createEffect("pageturn", {
        directions: ["horizontal", "vertical"],

        init: function(element, direction, face, back) {
            Effect.prototype.init.call(this, element, direction);
            this.options = {};
            this.options.face = face;
            this.options.back = back;
        },

        children: function() {
            var that = this,
                options = that.options,
                direction = that._direction === "horizontal" ? "left" : "top",
                reverseDirection = kendo.directions[direction].reverse,
                reverse = that._reverse,
                temp,
                faceClone = options.face.clone(true).removeAttr("id"),
                backClone = options.back.clone(true).removeAttr("id"),
                element = that.element;

            if (reverse) {
                temp = direction;
                direction = reverseDirection;
                reverseDirection = temp;
            }

            return [
                kendo.fx(options.face).staticPage(direction, element).face(true).setReverse(reverse),
                kendo.fx(options.back).staticPage(reverseDirection, element).setReverse(reverse),
                kendo.fx(faceClone).turningPage(direction, element).face(true).clipInHalf(true).temporary().setReverse(reverse),
                kendo.fx(backClone).turningPage(reverseDirection, element).clipInHalf(true).temporary().setReverse(reverse)
            ];
        },

        prepare: function(start, end) {
            start[PERSPECTIVE] = DEFAULT_PERSPECTIVE;
            start.transformStyle = "preserve-3d";
            // hack to trigger transition end.
            start.opacity = 0.999;
            end.opacity = 1;
        },

        teardown: function() {
            this.element.find(".temp-page").remove();
        }
    });

    createEffect("flip", {
        directions: ["horizontal", "vertical"],

        init: function(element, direction, face, back) {
            Effect.prototype.init.call(this, element, direction);
            this.options = {};
            this.options.face = face;
            this.options.back = back;
        },

        children: function() {
            var that = this,
                options = that.options,
                direction = that._direction === "horizontal" ? "left" : "top",
                reverseDirection = kendo.directions[direction].reverse,
                reverse = that._reverse,
                temp,
                element = that.element;

            if (reverse) {
                temp = direction;
                direction = reverseDirection;
                reverseDirection = temp;
            }

            return [
                kendo.fx(options.face).turningPage(direction, element).face(true).setReverse(reverse),
                kendo.fx(options.back).turningPage(reverseDirection, element).setReverse(reverse)
            ];
        },

        prepare: function(start) {
            start[PERSPECTIVE] = DEFAULT_PERSPECTIVE;
            start.transformStyle = "preserve-3d";
        }
    });

    var RESTORE_OVERFLOW = !support.mobileOS.android;
    var IGNORE_TRANSITION_EVENT_SELECTOR = ".km-touch-scrollbar, .km-actionsheet-wrapper";

    createEffect("replace", {
        _before: $.noop,
        _after: $.noop,
        init: function(element, previous, transitionClass) {
            Effect.prototype.init.call(this, element);
            this._previous = $(previous);
            this._transitionClass = transitionClass;
        },

        duration: function() {
            throw new Error("The replace effect does not support duration setting; the effect duration may be customized through the transition class rule");
        },

        beforeTransition: function(callback) {
            this._before = callback;
            return this;
        },

        afterTransition: function(callback) {
            this._after = callback;
            return this;
        },

        _both: function() {
            return $().add(this._element).add(this._previous);
        },

        _containerClass: function() {
            var direction = this._direction,
                containerClass = "k-fx k-fx-start k-fx-" + this._transitionClass;

            if (direction) {
                containerClass += " k-fx-" + direction;
            }

            if (this._reverse) {
                containerClass += " k-fx-reverse";
            }

            return containerClass;
        },

        complete: function(e) {
            if (!this.deferred || (e && $(e.target).is(IGNORE_TRANSITION_EVENT_SELECTOR))) {
                return;
            }

            var container = this.container;

            container
                .removeClass("k-fx-end")
                .removeClass(this._containerClass())
                .off(transitions.event, this.completeProxy);

            this._previous.hide().removeClass("k-fx-current");
            this.element.removeClass("k-fx-next");

            if (RESTORE_OVERFLOW) {
                container.css(OVERFLOW, "");
            }

            if (!this.isAbsolute) {
                this._both().css(POSITION, "");
            }

            this.deferred.resolve();
            delete this.deferred;
        },

        run: function() {
            if (this._additionalEffects && this._additionalEffects[0]) {
                return this.compositeRun();
            }

            var that = this,
                element = that.element,
                previous = that._previous,
                container = element.parents().filter(previous.parents()).first(),
                both = that._both(),
                deferred = $.Deferred(),
                originalPosition = element.css(POSITION),
                originalOverflow;

            // edge case for grid/scheduler, where the previous is already destroyed.
            if (!container.length) {
                container = element.parent();
            }

            this.container = container;
            this.deferred = deferred;
            this.isAbsolute = originalPosition  == "absolute";

            if (!this.isAbsolute) {
                both.css(POSITION, "absolute");
            }

            if (RESTORE_OVERFLOW) {
                originalOverflow = container.css(OVERFLOW);
                container.css(OVERFLOW, "hidden");
            }

            if (!transitions) {
                this.complete();
            } else {
                element.addClass("k-fx-hidden");

                container.addClass(this._containerClass());

                this.completeProxy = $.proxy(this, "complete");
                container.on(transitions.event, this.completeProxy);

                kendo.animationFrame(function() {
                    element.removeClass("k-fx-hidden").addClass("k-fx-next");
                    previous.css("display", "").addClass("k-fx-current");
                    that._before(previous, element);
                    kendo.animationFrame(function() {
                        container.removeClass("k-fx-start").addClass("k-fx-end");
                        that._after(previous, element);
                    });
                });
            }

            return deferred.promise();
        },

        stop: function() {
            this.complete();
        }
    });

    var Animation = kendo.Class.extend({
        init: function() {
            var that = this;
            that._tickProxy = proxy(that._tick, that);
            that._started = false;
        },

        tick: $.noop,
        done: $.noop,
        onEnd: $.noop,
        onCancel: $.noop,

        start: function() {
            if (!this.enabled()) {
                return;
            }

            if (!this.done()) {
                this._started = true;
                kendo.animationFrame(this._tickProxy);
            } else {
                this.onEnd();
            }
        },

        enabled: function() {
            return true;
        },

        cancel: function() {
            this._started = false;
            this.onCancel();
        },

        _tick: function() {
            var that = this;
            if (!that._started) { return; }

            that.tick();

            if (!that.done()) {
                kendo.animationFrame(that._tickProxy);
            } else {
                that._started = false;
                that.onEnd();
            }
        }
    });

    var Transition = Animation.extend({
        init: function(options) {
            var that = this;
            extend(that, options);
            Animation.fn.init.call(that);
        },

        done: function() {
            return this.timePassed() >= this.duration;
        },

        timePassed: function() {
            return Math.min(this.duration, (new Date()) - this.startDate);
        },

        moveTo: function(options) {
            var that = this,
                movable = that.movable;

            that.initial = movable[that.axis];
            that.delta = options.location - that.initial;

            that.duration = typeof options.duration == "number" ? options.duration : 300;

            that.tick = that._easeProxy(options.ease);

            that.startDate = new Date();
            that.start();
        },

        _easeProxy: function(ease) {
            var that = this;

            return function() {
                that.movable.moveAxis(that.axis, ease(that.timePassed(), that.initial, that.delta, that.duration));
            };
        }
    });

    extend(Transition, {
        easeOutExpo: function (t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },

        easeOutBack: function (t, b, c, d, s) {
            s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        }
    });

    fx.Animation = Animation;
    fx.Transition = Transition;
    fx.createEffect = createEffect;

    fx.box = function(element) {
        element = $(element);
        var result = element.offset();
        result.width = element.outerWidth();
        result.height = element.outerHeight();
        return result;
    };

    fx.transformOrigin = function(inner, outer) {
        var x = (inner.left - outer.left) * outer.width / (outer.width - inner.width),
            y = (inner.top - outer.top) * outer.height / (outer.height - inner.height);

        return {
            x: isNaN(x) ? 0 : x,
            y: isNaN(y) ? 0 : y
        };
    };

    fx.fillScale = function(inner, outer) {
        return Math.min(inner.width / outer.width, inner.height / outer.height);
    };

    fx.fitScale = function(inner, outer) {
        return Math.max(inner.width / outer.width, inner.height / outer.height);
    };
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core", "./kendo.data.odata", "./kendo.data.xml" ], f);
})(function(){

var __meta__ = {
    id: "data",
    name: "Data source",
    category: "framework",
    description: "Powerful component for using local and remote data.Fully supports CRUD, Sorting, Paging, Filtering, Grouping, and Aggregates.",
    depends: [ "core" ],
    features: [ {
        id: "data-odata",
        name: "OData",
        description: "Support for accessing Open Data Protocol (OData) services.",
        depends: [ "data.odata" ]
    }, {
        id: "data-XML",
        name: "XML",
        description: "Support for binding to XML.",
        depends: [ "data.xml" ]
    } ]
};

/*jshint eqnull: true, loopfunc: true, evil: true */
(function($, undefined) {
    var extend = $.extend,
        proxy = $.proxy,
        isPlainObject = $.isPlainObject,
        isEmptyObject = $.isEmptyObject,
        isArray = $.isArray,
        grep = $.grep,
        ajax = $.ajax,
        map,
        each = $.each,
        noop = $.noop,
        kendo = window.kendo,
        isFunction = kendo.isFunction,
        Observable = kendo.Observable,
        Class = kendo.Class,
        STRING = "string",
        FUNCTION = "function",
        CREATE = "create",
        READ = "read",
        UPDATE = "update",
        DESTROY = "destroy",
        CHANGE = "change",
        SYNC = "sync",
        GET = "get",
        ERROR = "error",
        REQUESTSTART = "requestStart",
        PROGRESS = "progress",
        REQUESTEND = "requestEnd",
        crud = [CREATE, READ, UPDATE, DESTROY],
        identity = function(o) { return o; },
        getter = kendo.getter,
        stringify = kendo.stringify,
        math = Math,
        push = [].push,
        join = [].join,
        pop = [].pop,
        splice = [].splice,
        shift = [].shift,
        slice = [].slice,
        unshift = [].unshift,
        toString = {}.toString,
        stableSort = kendo.support.stableSort,
        dateRegExp = /^\/Date\((.*?)\)\/$/,
        newLineRegExp = /(\r+|\n+)/g,
        quoteRegExp = /(?=['\\])/g;

    var ObservableArray = Observable.extend({
        init: function(array, type) {
            var that = this;

            that.type = type || ObservableObject;

            Observable.fn.init.call(that);

            that.length = array.length;

            that.wrapAll(array, that);
        },

        at: function(index) {
            return this[index];
        },

        toJSON: function() {
            var idx, length = this.length, value, json = new Array(length);

            for (idx = 0; idx < length; idx++){
                value = this[idx];

                if (value instanceof ObservableObject) {
                    value = value.toJSON();
                }

                json[idx] = value;
            }

            return json;
        },

        parent: noop,

        wrapAll: function(source, target) {
            var that = this,
                idx,
                length,
                parent = function() {
                    return that;
                };

            target = target || [];

            for (idx = 0, length = source.length; idx < length; idx++) {
                target[idx] = that.wrap(source[idx], parent);
            }

            return target;
        },

        wrap: function(object, parent) {
            var that = this,
                observable;

            if (object !== null && toString.call(object) === "[object Object]") {
                observable = object instanceof that.type || object instanceof Model;

                if (!observable) {
                    object = object instanceof ObservableObject ? object.toJSON() : object;
                    object = new that.type(object);
                }

                object.parent = parent;

                object.bind(CHANGE, function(e) {
                    that.trigger(CHANGE, {
                        field: e.field,
                        node: e.node,
                        index: e.index,
                        items: e.items || [this],
                        action: e.node ? (e.action || "itemloaded") : "itemchange"
                    });
                });
            }

            return object;
        },

        push: function() {
            var index = this.length,
                items = this.wrapAll(arguments),
                result;

            result = push.apply(this, items);

            this.trigger(CHANGE, {
                action: "add",
                index: index,
                items: items
            });

            return result;
        },

        slice: slice,

        sort: [].sort,

        join: join,

        pop: function() {
            var length = this.length, result = pop.apply(this);

            if (length) {
                this.trigger(CHANGE, {
                    action: "remove",
                    index: length - 1,
                    items:[result]
                });
            }

            return result;
        },

        splice: function(index, howMany, item) {
            var items = this.wrapAll(slice.call(arguments, 2)),
                result, i, len;

            result = splice.apply(this, [index, howMany].concat(items));

            if (result.length) {
                this.trigger(CHANGE, {
                    action: "remove",
                    index: index,
                    items: result
                });

                for (i = 0, len = result.length; i < len; i++) {
                    if (result[i] && result[i].children) {
                        result[i].unbind(CHANGE);
                    }
                }
            }

            if (item) {
                this.trigger(CHANGE, {
                    action: "add",
                    index: index,
                    items: items
                });
            }
            return result;
        },

        shift: function() {
            var length = this.length, result = shift.apply(this);

            if (length) {
                this.trigger(CHANGE, {
                    action: "remove",
                    index: 0,
                    items:[result]
                });
            }

            return result;
        },

        unshift: function() {
            var items = this.wrapAll(arguments),
                result;

            result = unshift.apply(this, items);

            this.trigger(CHANGE, {
                action: "add",
                index: 0,
                items: items
            });

            return result;
        },

        indexOf: function(item) {
            var that = this,
                idx,
                length;

            for (idx = 0, length = that.length; idx < length; idx++) {
                if (that[idx] === item) {
                    return idx;
                }
            }
            return -1;
        },

        forEach: function(callback) {
            var idx = 0,
                length = this.length;

            for (; idx < length; idx++) {
                callback(this[idx], idx, this);
            }
        },

        map: function(callback) {
            var idx = 0,
                result = [],
                length = this.length;

            for (; idx < length; idx++) {
                result[idx] = callback(this[idx], idx, this);
            }

            return result;
        },

        filter: function(callback) {
            var idx = 0,
                result = [],
                item,
                length = this.length;

            for (; idx < length; idx++) {
                item = this[idx];
                if (callback(item, idx, this)) {
                    result[result.length] = item;
                }
            }

            return result;
        },

        find: function(callback) {
            var idx = 0,
                item,
                length = this.length;

            for (; idx < length; idx++) {
                item = this[idx];
                if (callback(item, idx, this)) {
                    return item;
                }
            }
        },

        every: function(callback) {
            var idx = 0,
                item,
                length = this.length;

            for (; idx < length; idx++) {
                item = this[idx];
                if (!callback(item, idx, this)) {
                    return false;
                }
            }

            return true;
        },

        some: function(callback) {
            var idx = 0,
                item,
                length = this.length;

            for (; idx < length; idx++) {
                item = this[idx];
                if (callback(item, idx, this)) {
                    return true;
                }
            }

            return false;
        },

        // non-standard collection methods
        remove: function(item) {
            var idx = this.indexOf(item);

            if (idx !== -1) {
                this.splice(idx, 1);
            }
        },

        empty: function() {
            this.splice(0, this.length);
        }
    });

    var LazyObservableArray = ObservableArray.extend({
        init: function(data, type) {
            Observable.fn.init.call(this);

            this.type = type || ObservableObject;

            for (var idx = 0; idx < data.length; idx++) {
                this[idx] = data[idx];
            }

            this.length = idx;
            this._parent = proxy(function() { return this; }, this);
        },
        at: function(index) {
            var item = this[index];

            if (!(item instanceof this.type)) {
                item = this[index] = this.wrap(item, this._parent);
            } else {
                item.parent = this._parent;
            }

            return item;
        }
    });

    function eventHandler(context, type, field, prefix) {
        return function(e) {
            var event = {}, key;

            for (key in e) {
                event[key] = e[key];
            }

            if (prefix) {
                event.field = field + "." + e.field;
            } else {
                event.field = field;
            }

            if (type == CHANGE && context._notifyChange) {
                context._notifyChange(event);
            }

            context.trigger(type, event);
        };
    }

    var ObservableObject = Observable.extend({
        init: function(value) {
            var that = this,
                member,
                field,
                parent = function() {
                    return that;
                };

            Observable.fn.init.call(this);

            for (field in value) {
                member = value[field];

                if (typeof member === "object" && member && !member.getTime && field.charAt(0) != "_") {
                    member = that.wrap(member, field, parent);
                }

                that[field] = member;
            }

            that.uid = kendo.guid();
        },

        shouldSerialize: function(field) {
            return this.hasOwnProperty(field) && field !== "_events" && typeof this[field] !== FUNCTION && field !== "uid";
        },

        forEach: function(f) {
            for (var i in this) {
                if (this.shouldSerialize(i)) {
                    f(this[i], i);
                }
            }
        },

        toJSON: function() {
            var result = {}, value, field;

            for (field in this) {
                if (this.shouldSerialize(field)) {
                    value = this[field];

                    if (value instanceof ObservableObject || value instanceof ObservableArray) {
                        value = value.toJSON();
                    }

                    result[field] = value;
                }
            }

            return result;
        },

        get: function(field) {
            var that = this, result;

            that.trigger(GET, { field: field });

            if (field === "this") {
                result = that;
            } else {
                result = kendo.getter(field, true)(that);
            }

            return result;
        },

        _set: function(field, value) {
            var that = this;
            var composite = field.indexOf(".") >= 0;

            if (composite) {
                var paths = field.split("."),
                    path = "";

                while (paths.length > 1) {
                    path += paths.shift();
                    var obj = kendo.getter(path, true)(that);
                    if (obj instanceof ObservableObject) {
                        obj.set(paths.join("."), value);
                        return composite;
                    }
                    path += ".";
                }
            }

            kendo.setter(field)(that, value);

            return composite;
        },

        set: function(field, value) {
            var that = this,
                composite = field.indexOf(".") >= 0,
                current = kendo.getter(field, true)(that);

            if (current !== value) {

                if (!that.trigger("set", { field: field, value: value })) {
                    if (!composite) {
                        value = that.wrap(value, field, function() { return that; });
                    }
                    if (!that._set(field, value) || field.indexOf("(") >= 0 || field.indexOf("[") >= 0) {
                        that.trigger(CHANGE, { field: field });
                    }
                }
            }
        },

        parent: noop,

        wrap: function(object, field, parent) {
            var that = this,
                type = toString.call(object);

            if (object != null && (type === "[object Object]" || type === "[object Array]")) {
                var isObservableArray = object instanceof ObservableArray;
                var isDataSource = object instanceof DataSource;

                if (type === "[object Object]" && !isDataSource && !isObservableArray) {
                    if (!(object instanceof ObservableObject)) {
                        object = new ObservableObject(object);
                    }

                    if (object.parent() != parent()) {
                        object.bind(GET, eventHandler(that, GET, field, true));
                        object.bind(CHANGE, eventHandler(that, CHANGE, field, true));
                    }
                } else if (type === "[object Array]" || isObservableArray || isDataSource) {
                    if (!isObservableArray && !isDataSource) {
                        object = new ObservableArray(object);
                    }

                    if (object.parent() != parent()) {
                        object.bind(CHANGE, eventHandler(that, CHANGE, field, false));
                    }
                }

                object.parent = parent;
            }

            return object;
        }
    });

    function equal(x, y) {
        if (x === y) {
            return true;
        }

        var xtype = $.type(x), ytype = $.type(y), field;

        if (xtype !== ytype) {
            return false;
        }

        if (xtype === "date") {
            return x.getTime() === y.getTime();
        }

        if (xtype !== "object" && xtype !== "array") {
            return false;
        }

        for (field in x) {
            if (!equal(x[field], y[field])) {
                return false;
            }
        }

        return true;
    }

    var parsers = {
        "number": function(value) {
            return kendo.parseFloat(value);
        },

        "date": function(value) {
            return kendo.parseDate(value);
        },

        "boolean": function(value) {
            if (typeof value === STRING) {
                return value.toLowerCase() === "true";
            }
            return value != null ? !!value : value;
        },

        "string": function(value) {
            return value != null ? (value + "") : value;
        },

        "default": function(value) {
            return value;
        }
    };

    var defaultValues = {
        "string": "",
        "number": 0,
        "date": new Date(),
        "boolean": false,
        "default": ""
    };

    function getFieldByName(obj, name) {
        var field,
            fieldName;

        for (fieldName in obj) {
            field = obj[fieldName];
            if (isPlainObject(field) && field.field && field.field === name) {
                return field;
            } else if (field === name) {
                return field;
            }
        }
        return null;
    }

    var Model = ObservableObject.extend({
        init: function(data) {
            var that = this;

            if (!data || $.isEmptyObject(data)) {
                data = $.extend({}, that.defaults, data);

                if (that._initializers) {
                    for (var idx = 0; idx < that._initializers.length; idx++) {
                         var name = that._initializers[idx];
                         data[name] = that.defaults[name]();
                    }
                }
            }

            ObservableObject.fn.init.call(that, data);

            that.dirty = false;

            if (that.idField) {
                that.id = that.get(that.idField);

                if (that.id === undefined) {
                    that.id = that._defaultId;
                }
            }
        },

        shouldSerialize: function(field) {
            return ObservableObject.fn.shouldSerialize.call(this, field) && field !== "uid" && !(this.idField !== "id" && field === "id") && field !== "dirty" && field !== "_accessors";
        },

        _parse: function(field, value) {
            var that = this,
                fieldName = field,
                fields = (that.fields || {}),
                parse;

            field = fields[field];
            if (!field) {
                field = getFieldByName(fields, fieldName);
            }
            if (field) {
                parse = field.parse;
                if (!parse && field.type) {
                    parse = parsers[field.type.toLowerCase()];
                }
            }

            return parse ? parse(value) : value;
        },

        _notifyChange: function(e) {
            var action = e.action;

            if (action == "add" || action == "remove") {
                this.dirty = true;
            }
        },

        editable: function(field) {
            field = (this.fields || {})[field];
            return field ? field.editable !== false : true;
        },

        set: function(field, value, initiator) {
            var that = this;

            if (that.editable(field)) {
                value = that._parse(field, value);

                if (!equal(value, that.get(field))) {
                    that.dirty = true;
                    ObservableObject.fn.set.call(that, field, value, initiator);
                }
            }
        },

        accept: function(data) {
            var that = this,
                parent = function() { return that; },
                field;

            for (field in data) {
                var value = data[field];

                if (field.charAt(0) != "_") {
                    value = that.wrap(data[field], field, parent);
                }

                that._set(field, value);
            }

            if (that.idField) {
                that.id = that.get(that.idField);
            }

            that.dirty = false;
        },

        isNew: function() {
            return this.id === this._defaultId;
        }
    });

    Model.define = function(base, options) {
        if (options === undefined) {
            options = base;
            base = Model;
        }

        var model,
            proto = extend({ defaults: {} }, options),
            name,
            field,
            type,
            value,
            idx,
            length,
            fields = {},
            originalName,
            id = proto.id,
            functionFields = [];

        if (id) {
            proto.idField = id;
        }

        if (proto.id) {
            delete proto.id;
        }

        if (id) {
            proto.defaults[id] = proto._defaultId = "";
        }

        if (toString.call(proto.fields) === "[object Array]") {
            for (idx = 0, length = proto.fields.length; idx < length; idx++) {
                field = proto.fields[idx];
                if (typeof field === STRING) {
                    fields[field] = {};
                } else if (field.field) {
                    fields[field.field] = field;
                }
            }
            proto.fields = fields;
        }

        for (name in proto.fields) {
            field = proto.fields[name];
            type = field.type || "default";
            value = null;
            originalName = name;

            name = typeof (field.field) === STRING ? field.field : name;

            if (!field.nullable) {
                value = proto.defaults[originalName !== name ? originalName : name] = field.defaultValue !== undefined ? field.defaultValue : defaultValues[type.toLowerCase()];

                if (typeof value === "function") {
                    functionFields.push(name);
                }
            }

            if (options.id === name) {
                proto._defaultId = value;
            }

            proto.defaults[originalName !== name ? originalName : name] = value;

            field.parse = field.parse || parsers[type];
        }

        if (functionFields.length > 0) {
            proto._initializers = functionFields;
        }

        model = base.extend(proto);
        model.define = function(options) {
            return Model.define(model, options);
        };

        if (proto.fields) {
            model.fields = proto.fields;
            model.idField = proto.idField;
        }

        return model;
    };

    var Comparer = {
        selector: function(field) {
            return isFunction(field) ? field : getter(field);
        },

        compare: function(field) {
            var selector = this.selector(field);
            return function (a, b) {
                a = selector(a);
                b = selector(b);

                if (a == null && b == null) {
                    return 0;
                }

                if (a == null) {
                    return -1;
                }

                if (b == null) {
                    return 1;
                }

                if (a.localeCompare) {
                    return a.localeCompare(b);
                }

                return a > b ? 1 : (a < b ? -1 : 0);
            };
        },

        create: function(sort) {
            var compare = sort.compare || this.compare(sort.field);

            if (sort.dir == "desc") {
                return function(a, b) {
                    return compare(b, a, true);
                };
            }

            return compare;
        },

        combine: function(comparers) {
            return function(a, b) {
                var result = comparers[0](a, b),
                    idx,
                    length;

                for (idx = 1, length = comparers.length; idx < length; idx ++) {
                    result = result || comparers[idx](a, b);
                }

                return result;
            };
        }
    };

    var StableComparer = extend({}, Comparer, {
        asc: function(field) {
            var selector = this.selector(field);
            return function (a, b) {
                var valueA = selector(a);
                var valueB = selector(b);

                if (valueA && valueA.getTime && valueB && valueB.getTime) {
                    valueA = valueA.getTime();
                    valueB = valueB.getTime();
                }

                if (valueA === valueB) {
                    return a.__position - b.__position;
                }

                if (valueA == null) {
                    return -1;
                }

                if (valueB == null) {
                    return 1;
                }

                if (valueA.localeCompare) {
                    return valueA.localeCompare(valueB);
                }

                return valueA > valueB ? 1 : -1;
            };
        },

        desc: function(field) {
            var selector = this.selector(field);
            return function (a, b) {
                var valueA = selector(a);
                var valueB = selector(b);

                if (valueA && valueA.getTime && valueB && valueB.getTime) {
                    valueA = valueA.getTime();
                    valueB = valueB.getTime();
                }

                if (valueA === valueB) {
                    return a.__position - b.__position;
                }

                if (valueA == null) {
                    return 1;
                }

                if (valueB == null) {
                    return -1;
                }

                if (valueB.localeCompare) {
                    return valueB.localeCompare(valueA);
                }

                return valueA < valueB ? 1 : -1;
            };
        },
        create: function(sort) {
           return this[sort.dir](sort.field);
        }
    });

    map = function (array, callback) {
        var idx, length = array.length, result = new Array(length);

        for (idx = 0; idx < length; idx++) {
            result[idx] = callback(array[idx], idx, array);
        }

        return result;
    };

    var operators = (function(){

        function quote(value) {
            return value.replace(quoteRegExp, "\\").replace(newLineRegExp, "");
        }

        function operator(op, a, b, ignore) {
            var date;

            if (b != null) {
                if (typeof b === STRING) {
                    b = quote(b);
                    date = dateRegExp.exec(b);
                    if (date) {
                        b = new Date(+date[1]);
                    } else if (ignore) {
                        b = "'" + b.toLowerCase() + "'";
                        a = "(" + a + " || '').toLowerCase()";
                    } else {
                        b = "'" + b + "'";
                    }
                }

                if (b.getTime) {
                    //b looks like a Date
                    a = "(" + a + "?" + a + ".getTime():" + a + ")";
                    b = b.getTime();
                }
            }

            return a + " " + op + " " + b;
        }

        return {
            quote: function(value) {
                if (value && value.getTime) {
                    return "new Date(" + value.getTime() + ")";
                }

                if (typeof value == "string") {
                    return "'" + quote(value) + "'";
                }

                return "" + value;
            },
            eq: function(a, b, ignore) {
                return operator("==", a, b, ignore);
            },
            neq: function(a, b, ignore) {
                return operator("!=", a, b, ignore);
            },
            gt: function(a, b, ignore) {
                return operator(">", a, b, ignore);
            },
            gte: function(a, b, ignore) {
                return operator(">=", a, b, ignore);
            },
            lt: function(a, b, ignore) {
                return operator("<", a, b, ignore);
            },
            lte: function(a, b, ignore) {
                return operator("<=", a, b, ignore);
            },
            startswith: function(a, b, ignore) {
                if (ignore) {
                    a = "(" + a + " || '').toLowerCase()";
                    if (b) {
                        b = b.toLowerCase();
                    }
                }

                if (b) {
                    b = quote(b);
                }

                return a + ".lastIndexOf('" + b + "', 0) == 0";
            },
            endswith: function(a, b, ignore) {
                if (ignore) {
                    a = "(" + a + " || '').toLowerCase()";
                    if (b) {
                        b = b.toLowerCase();
                    }
                }

                if (b) {
                    b = quote(b);
                }

                return a + ".indexOf('" + b + "', " + a + ".length - " + (b || "").length + ") >= 0";
            },
            contains: function(a, b, ignore) {
                if (ignore) {
                    a = "(" + a + " || '').toLowerCase()";
                    if (b) {
                        b = b.toLowerCase();
                    }
                }

                if (b) {
                    b = quote(b);
                }

                return a + ".indexOf('" + b + "') >= 0";
            },
            doesnotcontain: function(a, b, ignore) {
                if (ignore) {
                    a = "(" + a + " || '').toLowerCase()";
                    if (b) {
                        b = b.toLowerCase();
                    }
                }

                if (b) {
                    b = quote(b);
                }

                return a + ".indexOf('" + b + "') == -1";
            }
        };
    })();

    function Query(data) {
        this.data = data || [];
    }

    Query.filterExpr = function(expression) {
        var expressions = [],
            logic = { and: " && ", or: " || " },
            idx,
            length,
            filter,
            expr,
            fieldFunctions = [],
            operatorFunctions = [],
            field,
            operator,
            filters = expression.filters;

        for (idx = 0, length = filters.length; idx < length; idx++) {
            filter = filters[idx];
            field = filter.field;
            operator = filter.operator;

            if (filter.filters) {
                expr = Query.filterExpr(filter);
                //Nested function fields or operators - update their index e.g. __o[0] -> __o[1]
                filter = expr.expression
                .replace(/__o\[(\d+)\]/g, function(match, index) {
                    index = +index;
                    return "__o[" + (operatorFunctions.length + index) + "]";
                })
                .replace(/__f\[(\d+)\]/g, function(match, index) {
                    index = +index;
                    return "__f[" + (fieldFunctions.length + index) + "]";
                });

                operatorFunctions.push.apply(operatorFunctions, expr.operators);
                fieldFunctions.push.apply(fieldFunctions, expr.fields);
            } else {
                if (typeof field === FUNCTION) {
                    expr = "__f[" + fieldFunctions.length +"](d)";
                    fieldFunctions.push(field);
                } else {
                    expr = kendo.expr(field);
                }

                if (typeof operator === FUNCTION) {
                    filter = "__o[" + operatorFunctions.length + "](" + expr + ", " + operators.quote(filter.value) + ")";
                    operatorFunctions.push(operator);
                } else {
                    filter = operators[(operator || "eq").toLowerCase()](expr, filter.value, filter.ignoreCase !== undefined? filter.ignoreCase : true);
                }
            }

            expressions.push(filter);
        }

        return  { expression: "(" + expressions.join(logic[expression.logic]) + ")", fields: fieldFunctions, operators: operatorFunctions };
    };

    function normalizeSort(field, dir) {
        if (field) {
            var descriptor = typeof field === STRING ? { field: field, dir: dir } : field,
            descriptors = isArray(descriptor) ? descriptor : (descriptor !== undefined ? [descriptor] : []);

            return grep(descriptors, function(d) { return !!d.dir; });
        }
    }

    var operatorMap = {
        "==": "eq",
        equals: "eq",
        isequalto: "eq",
        equalto: "eq",
        equal: "eq",
        "!=": "neq",
        ne: "neq",
        notequals: "neq",
        isnotequalto: "neq",
        notequalto: "neq",
        notequal: "neq",
        "<": "lt",
        islessthan: "lt",
        lessthan: "lt",
        less: "lt",
        "<=": "lte",
        le: "lte",
        islessthanorequalto: "lte",
        lessthanequal: "lte",
        ">": "gt",
        isgreaterthan: "gt",
        greaterthan: "gt",
        greater: "gt",
        ">=": "gte",
        isgreaterthanorequalto: "gte",
        greaterthanequal: "gte",
        ge: "gte",
        notsubstringof: "doesnotcontain"
    };

    function normalizeOperator(expression) {
        var idx,
        length,
        filter,
        operator,
        filters = expression.filters;

        if (filters) {
            for (idx = 0, length = filters.length; idx < length; idx++) {
                filter = filters[idx];
                operator = filter.operator;

                if (operator && typeof operator === STRING) {
                    filter.operator = operatorMap[operator.toLowerCase()] || operator;
                }

                normalizeOperator(filter);
            }
        }
    }

    function normalizeFilter(expression) {
        if (expression && !isEmptyObject(expression)) {
            if (isArray(expression) || !expression.filters) {
                expression = {
                    logic: "and",
                    filters: isArray(expression) ? expression : [expression]
                };
            }

            normalizeOperator(expression);

            return expression;
        }
    }

    Query.normalizeFilter = normalizeFilter;

    function normalizeAggregate(expressions) {
        return isArray(expressions) ? expressions : [expressions];
    }

    function normalizeGroup(field, dir) {
        var descriptor = typeof field === STRING ? { field: field, dir: dir } : field,
        descriptors = isArray(descriptor) ? descriptor : (descriptor !== undefined ? [descriptor] : []);

        return map(descriptors, function(d) { return { field: d.field, dir: d.dir || "asc", aggregates: d.aggregates }; });
    }

    Query.prototype = {
        toArray: function () {
            return this.data;
        },
        range: function(index, count) {
            return new Query(this.data.slice(index, index + count));
        },
        skip: function (count) {
            return new Query(this.data.slice(count));
        },
        take: function (count) {
            return new Query(this.data.slice(0, count));
        },
        select: function (selector) {
            return new Query(map(this.data, selector));
        },
        order: function(selector, dir) {
            var sort = { dir: dir };

            if (selector) {
                if (selector.compare) {
                    sort.compare = selector.compare;
                } else {
                    sort.field = selector;
                }
            }

            return new Query(this.data.slice(0).sort(Comparer.create(sort)));
        },
        orderBy: function(selector) {
            return this.order(selector, "asc");
        },
        orderByDescending: function(selector) {
            return this.order(selector, "desc");
        },
        sort: function(field, dir, comparer) {
            var idx,
            length,
            descriptors = normalizeSort(field, dir),
            comparers = [];

            comparer = comparer || Comparer;

            if (descriptors.length) {
                for (idx = 0, length = descriptors.length; idx < length; idx++) {
                    comparers.push(comparer.create(descriptors[idx]));
                }

                return this.orderBy({ compare: comparer.combine(comparers) });
            }

            return this;
        },

        filter: function(expressions) {
            var idx,
            current,
            length,
            compiled,
            predicate,
            data = this.data,
            fields,
            operators,
            result = [],
            filter;

            expressions = normalizeFilter(expressions);

            if (!expressions || expressions.filters.length === 0) {
                return this;
            }

            compiled = Query.filterExpr(expressions);
            fields = compiled.fields;
            operators = compiled.operators;

            predicate = filter = new Function("d, __f, __o", "return " + compiled.expression);

            if (fields.length || operators.length) {
                filter = function(d) {
                    return predicate(d, fields, operators);
                };
            }


            for (idx = 0, length = data.length; idx < length; idx++) {
                current = data[idx];

                if (filter(current)) {
                    result.push(current);
                }
            }

            return new Query(result);
        },

        group: function(descriptors, allData) {
            descriptors =  normalizeGroup(descriptors || []);
            allData = allData || this.data;

            var that = this,
            result = new Query(that.data),
            descriptor;

            if (descriptors.length > 0) {
                descriptor = descriptors[0];
                result = result.groupBy(descriptor).select(function(group) {
                    var data = new Query(allData).filter([ { field: group.field, operator: "eq", value: group.value, ignoreCase: false } ]);
                    return {
                        field: group.field,
                        value: group.value,
                        items: descriptors.length > 1 ? new Query(group.items).group(descriptors.slice(1), data.toArray()).toArray() : group.items,
                        hasSubgroups: descriptors.length > 1,
                        aggregates: data.aggregate(descriptor.aggregates)
                    };
                });
            }
            return result;
        },

        groupBy: function(descriptor) {
            if (isEmptyObject(descriptor) || !this.data.length) {
                return new Query([]);
            }

            var field = descriptor.field,
                sorted = this._sortForGrouping(field, descriptor.dir || "asc"),
                accessor = kendo.accessor(field),
                item,
                groupValue = accessor.get(sorted[0], field),
                group = {
                    field: field,
                    value: groupValue,
                    items: []
                },
                currentValue,
                idx,
                len,
                result = [group];

            for(idx = 0, len = sorted.length; idx < len; idx++) {
                item = sorted[idx];
                currentValue = accessor.get(item, field);
                if(!groupValueComparer(groupValue, currentValue)) {
                    groupValue = currentValue;
                    group = {
                        field: field,
                        value: groupValue,
                        items: []
                    };
                    result.push(group);
                }
                group.items.push(item);
            }
            return new Query(result);
        },

        _sortForGrouping: function(field, dir) {
            var idx, length,
                data = this.data;

            if (!stableSort) {
                for (idx = 0, length = data.length; idx < length; idx++) {
                    data[idx].__position = idx;
                }

                data = new Query(data).sort(field, dir, StableComparer).toArray();

                for (idx = 0, length = data.length; idx < length; idx++) {
                    delete data[idx].__position;
                }
                return data;
            }
            return this.sort(field, dir).toArray();
        },

        aggregate: function (aggregates) {
            var idx,
                len,
                result = {},
                state = {};

            if (aggregates && aggregates.length) {
                for(idx = 0, len = this.data.length; idx < len; idx++) {
                    calculateAggregate(result, aggregates, this.data[idx], idx, len, state);
                }
            }
            return result;
        }
    };

    function groupValueComparer(a, b) {
        if (a && a.getTime && b && b.getTime) {
            return a.getTime() === b.getTime();
        }
        return a === b;
    }

    function calculateAggregate(accumulator, aggregates, item, index, length, state) {
        aggregates = aggregates || [];
        var idx,
            aggr,
            functionName,
            len = aggregates.length;

        for (idx = 0; idx < len; idx++) {
            aggr = aggregates[idx];
            functionName = aggr.aggregate;
            var field = aggr.field;
            accumulator[field] = accumulator[field] || {};
            state[field] = state[field] || {};
            state[field][functionName] = state[field][functionName] || {};
            accumulator[field][functionName] = functions[functionName.toLowerCase()](accumulator[field][functionName], item, kendo.accessor(field), index, length, state[field][functionName]);
        }
    }

    var functions = {
        sum: function(accumulator, item, accessor) {
            var value = accessor.get(item);

            if (!isNumber(accumulator)) {
                accumulator = value;
            } else if (isNumber(value)) {
                accumulator += value;
            }

            return accumulator;
        },
        count: function(accumulator) {
            return (accumulator || 0) + 1;
        },
        average: function(accumulator, item, accessor, index, length, state) {
            var value = accessor.get(item);

            if (state.count === undefined) {
                state.count = 0;
            }

            if (!isNumber(accumulator)) {
                accumulator = value;
            } else if (isNumber(value)) {
                accumulator += value;
            }

            if (isNumber(value)) {
                state.count++;
            }

            if(index == length - 1 && isNumber(accumulator)) {
                accumulator = accumulator / state.count;
            }
            return accumulator;
        },
        max: function(accumulator, item, accessor) {
            var value = accessor.get(item);

            if (!isNumber(accumulator) && !isDate(accumulator)) {
                accumulator = value;
            }

            if(accumulator < value && (isNumber(value) || isDate(value))) {
                accumulator = value;
            }
            return accumulator;
        },
        min: function(accumulator, item, accessor) {
            var value = accessor.get(item);

            if (!isNumber(accumulator) && !isDate(accumulator)) {
                accumulator = value;
            }

            if(accumulator > value && (isNumber(value) || isDate(value))) {
                accumulator = value;
            }
            return accumulator;
        }
    };

    function isNumber(val) {
        return typeof val === "number" && !isNaN(val);
    }

    function isDate(val) {
        return val && val.getTime;
    }

    function toJSON(array) {
        var idx, length = array.length, result = new Array(length);

        for (idx = 0; idx < length; idx++) {
            result[idx] = array[idx].toJSON();
        }

        return result;
    }

    Query.process = function(data, options) {
        options = options || {};

        var query = new Query(data),
            group = options.group,
            sort = normalizeGroup(group || []).concat(normalizeSort(options.sort || [])),
            total,
            filterCallback = options.filterCallback,
            filter = options.filter,
            skip = options.skip,
            take = options.take;

        if (filter) {
            query = query.filter(filter);

            if (filterCallback) {
                query = filterCallback(query);
            }

            total = query.toArray().length;
        }

        if (sort) {
            query = query.sort(sort);

            if (group) {
                data = query.toArray();
            }
        }

        if (skip !== undefined && take !== undefined) {
            query = query.range(skip, take);
        }

        if (group) {
            query = query.group(group, data);
        }

        return {
            total: total,
            data: query.toArray()
        };
    };

    var LocalTransport = Class.extend({
        init: function(options) {
            this.data = options.data;
        },

        read: function(options) {
            options.success(this.data);
        },
        update: function(options) {
            options.success(options.data);
        },
        create: function(options) {
            options.success(options.data);
        },
        destroy: function(options) {
            options.success(options.data);
        }
    });

    var RemoteTransport = Class.extend( {
        init: function(options) {
            var that = this, parameterMap;

            options = that.options = extend({}, that.options, options);

            each(crud, function(index, type) {
                if (typeof options[type] === STRING) {
                    options[type] = {
                        url: options[type]
                    };
                }
            });

            that.cache = options.cache? Cache.create(options.cache) : {
                find: noop,
                add: noop
            };

            parameterMap = options.parameterMap;

            if (isFunction(options.push)) {
                that.push = options.push;
            }

            if (!that.push) {
                that.push = identity;
            }

            that.parameterMap = isFunction(parameterMap) ? parameterMap : function(options) {
                var result = {};

                each(options, function(option, value) {
                    if (option in parameterMap) {
                        option = parameterMap[option];
                        if (isPlainObject(option)) {
                            value = option.value(value);
                            option = option.key;
                        }
                    }

                    result[option] = value;
                });

                return result;
            };
        },

        options: {
            parameterMap: identity
        },

        create: function(options) {
            return ajax(this.setup(options, CREATE));
        },

        read: function(options) {
            var that = this,
                success,
                error,
                result,
                cache = that.cache;

            options = that.setup(options, READ);

            success = options.success || noop;
            error = options.error || noop;

            result = cache.find(options.data);

            if(result !== undefined) {
                success(result);
            } else {
                options.success = function(result) {
                    cache.add(options.data, result);

                    success(result);
                };

                $.ajax(options);
            }
        },

        update: function(options) {
            return ajax(this.setup(options, UPDATE));
        },

        destroy: function(options) {
            return ajax(this.setup(options, DESTROY));
        },

        setup: function(options, type) {
            options = options || {};

            var that = this,
                parameters,
                operation = that.options[type],
                data = isFunction(operation.data) ? operation.data(options.data) : operation.data;

            options = extend(true, {}, operation, options);
            parameters = extend(true, {}, data, options.data);

            options.data = that.parameterMap(parameters, type);

            if (isFunction(options.url)) {
                options.url = options.url(parameters);
            }

            return options;
        }
    });

    var Cache = Class.extend({
        init: function() {
            this._store = {};
        },
        add: function(key, data) {
            if(key !== undefined) {
                this._store[stringify(key)] = data;
            }
        },
        find: function(key) {
            return this._store[stringify(key)];
        },
        clear: function() {
            this._store = {};
        },
        remove: function(key) {
            delete this._store[stringify(key)];
        }
    });

    Cache.create = function(options) {
        var store = {
            "inmemory": function() { return new Cache(); }
        };

        if (isPlainObject(options) && isFunction(options.find)) {
            return options;
        }

        if (options === true) {
            return new Cache();
        }

        return store[options]();
    };

    function serializeRecords(data, getters, modelInstance, originalFieldNames, fieldNames) {
        var record,
            getter,
            originalName,
            idx,
            length;

        for (idx = 0, length = data.length; idx < length; idx++) {
            record = data[idx];
            for (getter in getters) {
                originalName = fieldNames[getter];

                if (originalName && originalName !== getter) {
                    record[originalName] = getters[getter](record);
                    delete record[getter];
                }
            }
        }
    }

    function convertRecords(data, getters, modelInstance, originalFieldNames, fieldNames) {
        var record,
            getter,
            originalName,
            idx,
            length;

        for (idx = 0, length = data.length; idx < length; idx++) {
            record = data[idx];
            for (getter in getters) {
                record[getter] = modelInstance._parse(getter, getters[getter](record));

                originalName = fieldNames[getter];
                if (originalName && originalName !== getter) {
                    delete record[originalName];
                }
            }
        }
    }

    function convertGroup(data, getters, modelInstance, originalFieldNames, fieldNames) {
        var record,
            idx,
            fieldName,
            length;

        for (idx = 0, length = data.length; idx < length; idx++) {
            record = data[idx];

            fieldName = originalFieldNames[record.field];
            if (fieldName && fieldName != record.field) {
                record.field = fieldName;
            }

            record.value = modelInstance._parse(record.field, record.value);

            if (record.hasSubgroups) {
                convertGroup(record.items, getters, modelInstance, originalFieldNames, fieldNames);
            } else {
                convertRecords(record.items, getters, modelInstance, originalFieldNames, fieldNames);
            }
        }
    }

    function wrapDataAccess(originalFunction, model, converter, getters, originalFieldNames, fieldNames) {
        return function(data) {
            data = originalFunction(data);

            if (data && !isEmptyObject(getters)) {
                if (toString.call(data) !== "[object Array]" && !(data instanceof ObservableArray)) {
                    data = [data];
                }

                converter(data, getters, new model(), originalFieldNames, fieldNames);
            }

            return data || [];
        };
    }

    var DataReader = Class.extend({
        init: function(schema) {
            var that = this, member, get, model, base;

            schema = schema || {};

            for (member in schema) {
                get = schema[member];

                that[member] = typeof get === STRING ? getter(get) : get;
            }

            base = schema.modelBase || Model;

            if (isPlainObject(that.model)) {
                that.model = model = base.define(that.model);
            }

            var dataFunction = proxy(that.data, that);

            that._dataAccessFunction = dataFunction;

            if (that.model) {
                var groupsFunction = proxy(that.groups, that),
                    serializeFunction = proxy(that.serialize, that),
                    originalFieldNames = {},
                    getters = {},
                    serializeGetters = {},
                    fieldNames = {},
                    shouldSerialize = false,
                    fieldName;

                model = that.model;

                if (model.fields) {
                    each(model.fields, function(field, value) {
                        var fromName;

                        fieldName = field;

                        if (isPlainObject(value) && value.field) {
                            fieldName = value.field;
                        } else if (typeof value === STRING) {
                            fieldName = value;
                        }

                        if (isPlainObject(value) && value.from) {
                            fromName = value.from;
                        }

                        shouldSerialize = shouldSerialize || (fromName && fromName !== field) || fieldName !== field;

                        getters[field] = getter(fromName || fieldName);
                        serializeGetters[field] = getter(field);
                        originalFieldNames[fromName || fieldName] = field;
                        fieldNames[field] = fromName || fieldName;
                    });

                    if (!schema.serialize && shouldSerialize) {
                        that.serialize = wrapDataAccess(serializeFunction, model, serializeRecords, serializeGetters, originalFieldNames, fieldNames);
                    }
                }

                that._dataAccessFunction = dataFunction;
                that.data = wrapDataAccess(dataFunction, model, convertRecords, getters, originalFieldNames, fieldNames);
                that.groups = wrapDataAccess(groupsFunction, model, convertGroup, getters, originalFieldNames, fieldNames);
            }
        },
        errors: function(data) {
            return data ? data.errors : null;
        },
        parse: identity,
        data: identity,
        total: function(data) {
            return data.length;
        },
        groups: identity,
        aggregates: function() {
            return {};
        },
        serialize: function(data) {
            return data;
        }
    });

    function mergeGroups(target, dest, skip, take) {
        var group,
            idx = 0,
            items;

        while (dest.length && take) {
            group = dest[idx];
            items = group.items;

            var length = items.length;

            if (target && target.field === group.field && target.value === group.value) {
                if (target.hasSubgroups && target.items.length) {
                    mergeGroups(target.items[target.items.length - 1], group.items, skip, take);
                } else {
                    items = items.slice(skip, skip + take);
                    target.items = target.items.concat(items);
                }
                dest.splice(idx--, 1);
            } else if (group.hasSubgroups && items.length) {
                mergeGroups(group, items, skip, take);
                if (!group.items.length) {
                    dest.splice(idx--, 1);
                }
            } else {
                items = items.slice(skip, skip + take);
                group.items = items;

                if (!group.items.length) {
                    dest.splice(idx--, 1);
                }
            }

            if (items.length === 0) {
                skip -= length;
            } else {
                skip = 0;
                take -= items.length;
            }

            if (++idx >= dest.length) {
                break;
            }
        }

        if (idx < dest.length) {
            dest.splice(idx, dest.length - idx);
        }
    }

    function flattenGroups(data) {
        var idx,
            result = [],
            length,
            items,
            itemIndex;

        for (idx = 0, length = data.length; idx < length; idx++) {
            var group = data.at(idx);
            if (group.hasSubgroups) {
                result = result.concat(flattenGroups(group.items));
            } else {
                items = group.items;
                for (itemIndex = 0; itemIndex < items.length; itemIndex++) {
                    result.push(items.at(itemIndex));
                }
            }
        }
        return result;
    }

    function wrapGroupItems(data, model) {
        var idx, length, group, items;
        if (model) {
            for (idx = 0, length = data.length; idx < length; idx++) {
                group = data.at(idx);

                if (group.hasSubgroups) {
                    wrapGroupItems(group.items, model);
                } else {
                    group.items = new LazyObservableArray(group.items, model);
                }
            }
        }
    }

    function eachGroupItems(data, func) {
        for (var idx = 0, length = data.length; idx < length; idx++) {
            if (data[idx].hasSubgroups) {
                if (eachGroupItems(data[idx].items, func)) {
                    return true;
                }
            } else if (func(data[idx].items, data[idx])) {
                return true;
            }
        }
    }

    function replaceInRanges(ranges, data, item, observable) {
        for (var idx = 0; idx < ranges.length; idx++) {
            if (ranges[idx].data === data) {
                break;
            }
            if (replaceInRange(ranges[idx].data, item, observable)) {
                break;
            }
        }
    }

    function replaceInRange(items, item, observable) {
        for (var idx = 0, length = items.length; idx < length; idx++) {
            if (items[idx] && items[idx].hasSubgroups) {
                return replaceInRange(items[idx].items, item, observable);
            } else if (items[idx] === item || items[idx] === observable) {
               items[idx] = observable;
               return true;
            }
        }
    }

    function replaceWithObservable(view, data, ranges, type, serverGrouping) {
        for (var viewIndex = 0, length = view.length; viewIndex < length; viewIndex++) {
            var item = view[viewIndex];

            if (!item || item instanceof type) {
                continue;
            }

            if (item.hasSubgroups !== undefined && !serverGrouping) {
                replaceWithObservable(item.items, data, ranges, type, serverGrouping);
            } else {
                for (var idx = 0; idx < data.length; idx++) {
                    if (data[idx] === item) {
                        view[viewIndex] = data.at(idx);
                        replaceInRanges(ranges, data, item, view[viewIndex]);
                        break;
                    }
                }
            }
        }
    }

    function removeModel(data, model) {
        var idx, length;

        for (idx = 0, length = data.length; idx < length; idx++) {
            var dataItem = data.at(idx);
            if (dataItem.uid == model.uid) {
                data.splice(idx, 1);
                return dataItem;
            }
        }
    }

    function indexOfPristineModel(data, model) {
        if (model) {
            return indexOf(data, function(item) {
                if (item.uid) {
                    return item.uid == model.uid;
                }

                return item[model.idField] === model.id;
            });
        }
        return -1;
    }

    function indexOfModel(data, model) {
        if (model) {
            return indexOf(data, function(item) {
                return item.uid == model.uid;
            });
        }
        return -1;
    }

    function indexOf(data, comparer) {
        var idx, length;

        for (idx = 0, length = data.length; idx < length; idx++) {
            if (comparer(data[idx])) {
                return idx;
            }
        }

        return -1;
    }

    function fieldNameFromModel(fields, name) {
        if (fields && !isEmptyObject(fields)) {
            var descriptor = fields[name];
            var fieldName;
            if (isPlainObject(descriptor)) {
                fieldName = descriptor.from || descriptor.field || name;
            } else {
                fieldName = fields[name] || name;
            }

            if (isFunction(fieldName)) {
                return name;
            }

            return fieldName;
        }
        return name;
    }

    function convertFilterDescriptorsField(descriptor, model) {
        var idx,
            length,
            target = {};

        for (var field in descriptor) {
            if (field !== "filters") {
                target[field] = descriptor[field];
            }
        }

        if (descriptor.filters) {
            target.filters = [];
            for (idx = 0, length = descriptor.filters.length; idx < length; idx++) {
                target.filters[idx] = convertFilterDescriptorsField(descriptor.filters[idx], model);
            }
        } else {
            target.field = fieldNameFromModel(model.fields, target.field);
        }
        return target;
    }

    function convertDescriptorsField(descriptors, model) {
        var idx,
            length,
            result = [],
            target,
            descriptor;

        for (idx = 0, length = descriptors.length; idx < length; idx ++) {
            target = {};

            descriptor = descriptors[idx];

            for (var field in descriptor) {
                target[field] = descriptor[field];
            }

            target.field = fieldNameFromModel(model.fields, target.field);

            if (target.aggregates && isArray(target.aggregates)) {
                target.aggregates = convertDescriptorsField(target.aggregates, model);
            }
            result.push(target);
        }
        return result;
    }

    var DataSource = Observable.extend({
        init: function(options) {
            var that = this, model, data;

            if (options) {
                data = options.data;
            }

            options = that.options = extend({}, that.options, options);

            that._map = {};
            that._prefetch = {};
            that._data = [];
            that._pristineData = [];
            that._ranges = [];
            that._view = [];
            that._pristineTotal = 0;
            that._destroyed = [];
            that._pageSize = options.pageSize;
            that._page = options.page  || (options.pageSize ? 1 : undefined);
            that._sort = normalizeSort(options.sort);
            that._filter = normalizeFilter(options.filter);
            that._group = normalizeGroup(options.group);
            that._aggregate = options.aggregate;
            that._total = options.total;

            that._shouldDetachObservableParents = true;

            Observable.fn.init.call(that);

            that.transport = Transport.create(options, data, that);

            if (isFunction(that.transport.push)) {
                that.transport.push({
                    pushCreate: proxy(that._pushCreate, that),
                    pushUpdate: proxy(that._pushUpdate, that),
                    pushDestroy: proxy(that._pushDestroy, that)
                });
            }

            if (options.offlineStorage != null) {
                if (typeof options.offlineStorage == "string") {
                    var key = options.offlineStorage;

                    that._storage = {
                        getItem: function() {
                            return JSON.parse(localStorage.getItem(key));
                        },
                        setItem: function(item) {
                            localStorage.setItem(key, stringify(that.reader.serialize(item)));
                        }
                    };
                } else {
                    that._storage = options.offlineStorage;
                }
            }

            that.reader = new kendo.data.readers[options.schema.type || "json" ](options.schema);

            model = that.reader.model || {};

            that._detachObservableParents();

            that._data = that._observe(that._data);
            that._online = true;

            that.bind(["push", ERROR, CHANGE, REQUESTSTART, SYNC, REQUESTEND, PROGRESS], options);
        },

        options: {
            data: null,
            schema: {
               modelBase: Model
            },
            offlineStorage: null,
            serverSorting: false,
            serverPaging: false,
            serverFiltering: false,
            serverGrouping: false,
            serverAggregates: false,
            batch: false
        },

        online: function(value) {
            if (value !== undefined) {
                if (this._online != value) {
                    this._online = value;

                    if (value) {
                        return this.sync();
                    }
                }

                return $.Deferred().resolve().promise();
            } else {
                return this._online;
            }
        },

        offlineData: function(state) {
            if (this.options.offlineStorage == null) {
                return null;
            }

            if (state !== undefined) {
                return this._storage.setItem(state);
            }

            return this._storage.getItem() || {};
        },

        _isServerGrouped: function() {
            var group = this.group() || [];

            return this.options.serverGrouping && group.length;
        },

        _pushCreate: function(result) {
            this._push(result, "pushCreate");
        },

        _pushUpdate: function(result) {
            this._push(result, "pushUpdate");
        },

        _pushDestroy: function(result) {
            this._push(result, "pushDestroy");
        },

        _push: function(result, operation) {
            var data = this._readData(result);

            if (!data) {
                data = result;
            }

            this[operation](data);
        },

        _flatData: function(data, skip) {
            if (data) {
                if (this._isServerGrouped()) {
                    return flattenGroups(data);
                }

                if (!skip) {
                    for (var idx = 0; idx < data.length; idx++) {
                        data.at(idx);
                    }
                }
            }

            return data;
        },

        parent: noop,

        get: function(id) {
            var idx, length, data = this._flatData(this._data);

            for (idx = 0, length = data.length; idx < length; idx++) {
                if (data[idx].id == id) {
                    return data[idx];
                }
            }
        },

        getByUid: function(id) {
            var idx, length, data = this._flatData(this._data);

            if (!data) {
                return;
            }

            for (idx = 0, length = data.length; idx < length; idx++) {
                if (data[idx].uid == id) {
                    return data[idx];
                }
            }
        },

        indexOf: function(model) {
            return indexOfModel(this._data, model);
        },

        at: function(index) {
            return this._data.at(index);
        },

        data: function(value) {
            var that = this;
            if (value !== undefined) {
                that._detachObservableParents();
                that._data = this._observe(value);

                that._pristineData = value.slice(0);

                that._storeData();

                that._ranges = [];
                that.trigger("reset");
                that._addRange(that._data);

                that._total = that._data.length;
                that._pristineTotal = that._total;

                that._process(that._data);
            } else {
                if (that._data) {
                    for (var idx = 0; idx < that._data.length; idx++) {
                        that._data.at(idx);
                    }
                }

                return that._data;
            }
        },

        view: function(value) {
            if (value === undefined) {
                return this._view;
            } else {
                this._view = this._observeView(value);
            }
        },

        _observeView: function(data) {
            var that = this;
            replaceWithObservable(data, that._data, that._ranges, that.reader.model || ObservableObject, that._isServerGrouped());

            var view = new LazyObservableArray(data, that.reader.model);
            view.parent = function() { return that.parent(); };
            return view;
        },

        flatView: function() {
            var groups = this.group() || [];

            if (groups.length) {
                return flattenGroups(this._view);
            } else {
                return this._view;
            }
        },

        add: function(model) {
            return this.insert(this._data.length, model);
        },

        _createNewModel: function(model) {
            if (this.reader.model) {
                return new this.reader.model(model);
            }

            if (model instanceof ObservableObject) {
                return model;
            }

            return new ObservableObject(model);
        },

        insert: function(index, model) {
            if (!model) {
                model = index;
                index = 0;
            }

            if (!(model instanceof Model)) {
                model = this._createNewModel(model);
            }

            if (this._isServerGrouped()) {
                this._data.splice(index, 0, this._wrapInEmptyGroup(model));
            } else {
                this._data.splice(index, 0, model);
            }

            return model;
        },

        pushCreate: function(items) {
            if (!isArray(items)) {
                items = [items];
            }

            var pushed = [];
            var autoSync = this.options.autoSync;
            this.options.autoSync = false;

            try {
                for (var idx = 0; idx < items.length; idx ++) {
                    var item = items[idx];

                    var result = this.add(item);

                    pushed.push(result);

                    var pristine = result.toJSON();

                    if (this._isServerGrouped()) {
                        pristine = this._wrapInEmptyGroup(pristine);
                    }

                    this._pristineData.push(pristine);
                }
            } finally {
                this.options.autoSync = autoSync;
            }

            if (pushed.length) {
                this.trigger("push", {
                    type: "create",
                    items: pushed
                });
            }
        },

        pushUpdate: function(items) {
            if (!isArray(items)) {
                items = [items];
            }

            var pushed = [];

            for (var idx = 0; idx < items.length; idx ++) {
                var item = items[idx];
                var model = this._createNewModel(item);

                var target = this.get(model.id);

                if (target) {
                    pushed.push(target);

                    target.accept(item);

                    target.trigger(CHANGE);

                    this._updatePristineForModel(target, item);
                } else {
                    this.pushCreate(item);
                }
            }

            if (pushed.length) {
                this.trigger("push", {
                    type: "update",
                    items: pushed
                });
            }
        },

        pushDestroy: function(items) {
            var pushed = this._removeItems(items);

            if (pushed.length) {
                this.trigger("push", {
                    type: "destroy",
                    items: pushed
                });
            }
        },

        _removeItems: function(items) {
            if (!isArray(items)) {
                items = [items];
            }

            var destroyed = [];
            var autoSync = this.options.autoSync;
            this.options.autoSync = false;
            try {
                for (var idx = 0; idx < items.length; idx ++) {
                    var item = items[idx];
                    var model = this._createNewModel(item);
                    var found = false;

                    this._eachItem(this._data, function(items){
                        for (var idx = 0; idx < items.length; idx++) {
                            var item = items.at(idx);
                            if (item.id === model.id) {
                                destroyed.push(item);
                                items.splice(idx, 1);
                                found = true;
                                break;
                            }
                        }
                    });

                    if (found) {
                        this._removePristineForModel(model);
                        this._destroyed.pop();
                    }
                }
            } finally {
                this.options.autoSync = autoSync;
            }

            return destroyed;
        },

        remove: function(model) {
            var result,
                that = this,
                hasGroups = that._isServerGrouped();

            this._eachItem(that._data, function(items) {
                result = removeModel(items, model);
                if (result && hasGroups) {
                    if (!result.isNew || !result.isNew()) {
                        that._destroyed.push(result);
                    }
                    return true;
                }
            });

            this._removeModelFromRanges(model);

            this._updateRangesLength();

            return model;
        },

        destroyed: function() {
            return this._destroyed;
        },

        created: function() {
            var idx,
                length,
                result = [],
                data = this._flatData(this._data);

            for (idx = 0, length = data.length; idx < length; idx++) {
                if (data[idx].isNew && data[idx].isNew()) {
                    result.push(data[idx]);
                }
            }
            return result;
        },

        updated: function() {
            var idx,
                length,
                result = [],
                data = this._flatData(this._data);

            for (idx = 0, length = data.length; idx < length; idx++) {
                if ((data[idx].isNew && !data[idx].isNew()) && data[idx].dirty) {
                    result.push(data[idx]);
                }
            }
            return result;
        },

        sync: function() {
            var that = this,
                idx,
                length,
                created = [],
                updated = [],
                destroyed = that._destroyed,
                data = that._flatData(that._data);

            var promise = $.Deferred().resolve().promise();

            if (that.online()) {

                if (!that.reader.model) {
                    return promise;
                }

                created = that.created();
                updated = that.updated();

                var promises = [];

                if (that.options.batch && that.transport.submit) {
                    promises = that._sendSubmit(created, updated, destroyed);
                } else {
                    promises.push.apply(promises, that._send("create", created));
                    promises.push.apply(promises, that._send("update", updated));
                    promises.push.apply(promises, that._send("destroy", destroyed));
                }

                promise = $.when
                 .apply(null, promises)
                 .then(function() {
                    var idx, length;

                    for (idx = 0, length = arguments.length; idx < length; idx++){
                        that._accept(arguments[idx]);
                    }

                    that._storeData(true);

                    that._change({ action: "sync" });

                    that.trigger(SYNC);
                });
            } else {
                that._storeData(true);

                that._change({ action: "sync" });
            }

            return promise;
        },

        cancelChanges: function(model) {
            var that = this;

            if (model instanceof kendo.data.Model) {
                that._cancelModel(model);
            } else {
                that._destroyed = [];
                that._detachObservableParents();
                that._data = that._observe(that._pristineData);
                if (that.options.serverPaging) {
                    that._total = that._pristineTotal;
                }

                that._ranges = [];
                that._addRange(that._data);

                that._change();
            }
        },

        hasChanges: function() {
            var idx,
                length,
                data = this._flatData(this._data);

            if (this._destroyed.length) {
                return true;
            }

            for (idx = 0, length = data.length; idx < length; idx++) {
                if ((data[idx].isNew && data[idx].isNew()) || data[idx].dirty) {
                    return true;
                }
            }

            return false;
        },

        _accept: function(result) {
            var that = this,
                models = result.models,
                response = result.response,
                idx = 0,
                serverGroup = that._isServerGrouped(),
                pristine = that._pristineData,
                type = result.type,
                length;

            that.trigger(REQUESTEND, { response: response, type: type });

            if (response && !isEmptyObject(response)) {
                response = that.reader.parse(response);

                if (that._handleCustomErrors(response)) {
                    return;
                }

                response = that.reader.data(response);

                if (!isArray(response)) {
                    response = [response];
                }
            } else {
                response = $.map(models, function(model) { return model.toJSON(); } );
            }

            if (type === "destroy") {
                that._destroyed = [];
            }

            for (idx = 0, length = models.length; idx < length; idx++) {
                if (type !== "destroy") {
                    models[idx].accept(response[idx]);

                    if (type === "create") {
                        pristine.push(serverGroup ? that._wrapInEmptyGroup(models[idx]) : response[idx]);
                    } else if (type === "update") {
                        that._updatePristineForModel(models[idx], response[idx]);
                    }
                } else {
                    that._removePristineForModel(models[idx]);
                }
            }
        },

        _updatePristineForModel: function(model, values) {
            this._executeOnPristineForModel(model, function(index, items) {
                kendo.deepExtend(items[index], values);
            });
        },

        _executeOnPristineForModel: function(model, callback) {
            this._eachPristineItem(
                function(items) {
                    var index = indexOfPristineModel(items, model);
                    if (index > -1) {
                        callback(index, items);
                        return true;
                    }
                });
        },

        _removePristineForModel: function(model) {
            this._executeOnPristineForModel(model, function(index, items) {
                items.splice(index, 1);
            });
        },

        _readData: function(data) {
            var read = !this._isServerGrouped() ? this.reader.data : this.reader.groups;
            return read.call(this.reader, data);
        },

        _eachPristineItem: function(callback) {
            this._eachItem(this._pristineData, callback);
        },

       _eachItem: function(data, callback) {
            if (data && data.length) {
                if (this._isServerGrouped()) {
                    eachGroupItems(data, callback);
                } else {
                    callback(data);
                }
            }
        },

        _pristineForModel: function(model) {
            var pristine,
                idx,
                callback = function(items) {
                    idx = indexOfPristineModel(items, model);
                    if (idx > -1) {
                        pristine = items[idx];
                        return true;
                    }
                };

            this._eachPristineItem(callback);

            return pristine;
        },

        _cancelModel: function(model) {
            var pristine = this._pristineForModel(model);

            this._eachItem(this._data, function(items) {
                var idx = indexOfModel(items, model);
                if (idx >= 0) {
                    if (pristine && (!model.isNew() || pristine.__state__)) {
                        items[idx].accept(pristine);
                    } else {
                        items.splice(idx, 1);
                    }
                }
            });
        },

        _submit: function(promises, data) {
            var that = this;

            that.trigger(REQUESTSTART, { type: "submit" });

            that.transport.submit(extend({
                success: function(response, type) {
                    var promise = $.grep(promises, function(x) {
                        return x.type == type;
                    })[0];

                    if (promise) {
                        promise.resolve({
                            response: response,
                            models: promise.models,
                            type: type
                        });
                    }
                },
                error: function(response, status, error) {
                    for (var idx = 0; idx < promises.length; idx++) {
                        promises[idx].reject(response);
                    }

                    that.error(response, status, error);
                }
            }, data));
        },

        _sendSubmit: function(created, updated, destroyed) {
            var that = this,
                promises = [];

            if (that.options.batch) {
                if (created.length) {
                    promises.push($.Deferred(function(deferred) {
                        deferred.type = "create";
                        deferred.models = created;
                    }));
                }

                if (updated.length) {
                    promises.push($.Deferred(function(deferred) {
                        deferred.type = "update";
                        deferred.models = updated;
                    }));
                }

                if (destroyed.length) {
                    promises.push($.Deferred(function(deferred) {
                        deferred.type = "destroy";
                        deferred.models = destroyed;
                    }));
                }

                that._submit(promises, {
                    data: {
                        created: that.reader.serialize(toJSON(created)),
                        updated: that.reader.serialize(toJSON(updated)),
                        destroyed: that.reader.serialize(toJSON(destroyed))
                    }
                });
            }

            return promises;
        },

        _promise: function(data, models, type) {
            var that = this;

            return $.Deferred(function(deferred) {
                that.trigger(REQUESTSTART, { type: type });

                that.transport[type].call(that.transport, extend({
                    success: function(response) {
                        deferred.resolve({
                            response: response,
                            models: models,
                            type: type
                        });
                    },
                    error: function(response, status, error) {
                        deferred.reject(response);
                        that.error(response, status, error);
                    }
                }, data));
            }).promise();
        },

        _send: function(method, data) {
            var that = this,
                idx,
                length,
                promises = [],
                converted = that.reader.serialize(toJSON(data));

            if (that.options.batch) {
                if (data.length) {
                    promises.push(that._promise( { data: { models: converted } }, data , method));
                }
            } else {
                for (idx = 0, length = data.length; idx < length; idx++) {
                    promises.push(that._promise( { data: converted[idx] }, [ data[idx] ], method));
                }
            }

            return promises;
        },

        read: function(data) {
            var that = this, params = that._params(data);
            var deferred = $.Deferred();

            that._queueRequest(params, function() {
                var isPrevented = that.trigger(REQUESTSTART, { type: "read" });
                if (!isPrevented) {
                    that.trigger(PROGRESS);

                    that._ranges = [];
                    that.trigger("reset");
                    if (that.online()) {
                        that.transport.read({
                            data: params,
                            success: function(data) {
                                that.success(data);

                                deferred.resolve();
                            },
                            error: function() {
                                var args = slice.call(arguments);

                                that.error.apply(that, args);

                                deferred.reject.apply(deferred, args);
                            }
                        });
                    } else if (that.options.offlineStorage != null){
                        that.success(that.offlineData());

                        deferred.resolve();
                    }
                } else {
                    that._dequeueRequest();

                    deferred.resolve(isPrevented);
                }
            });

            return deferred.promise();
        },

        _readAggregates: function(data) {
            return this.reader.aggregates(data);
        },

        success: function(data) {
            var that = this,
                options = that.options;

            that.trigger(REQUESTEND, { response: data, type: "read" });

            if (that.online()) {
                data = that.reader.parse(data);

                if (that._handleCustomErrors(data)) {
                    that._dequeueRequest();
                    return;
                }

                that._total = that.reader.total(data);

                if (that._aggregate && options.serverAggregates) {
                    that._aggregateResult = that._readAggregates(data);
                }

                data = that._readData(data);
            } else {
                data = that._readData(data);

                var items = [];

                for (var idx = 0; idx < data.length; idx++) {
                    var item = data[idx];
                    var state = item.__state__;

                    if (state == "destroy") {
                       this._destroyed.push(this._createNewModel(item));
                    } else {
                        items.push(item);
                    }
                }

                data = items;

                that._total = data.length;
            }

            that._pristineTotal = that._total;

            that._pristineData = data.slice(0);

            that._detachObservableParents();

            that._data = that._observe(data);

            if (that.options.offlineStorage != null) {
                that._eachItem(that._data, function(items) {
                    for (var idx = 0; idx < items.length; idx++) {
                        var item = items.at(idx);
                        if (item.__state__ == "update") {
                            item.dirty = true;
                        }
                    }
                });
            }

            that._storeData();

            that._addRange(that._data);

            that._process(that._data);

            that._dequeueRequest();
        },

        _detachObservableParents: function() {
            if (this._data && this._shouldDetachObservableParents) {
                for (var idx = 0; idx < this._data.length; idx++) {
                    if (this._data[idx].parent) {
                        this._data[idx].parent = noop;
                    }
                }
            }
        },

        _storeData: function(updatePristine) {
            var serverGrouping = this._isServerGrouped();
            var model = this.reader.model;

            function items(data) {
                var state = [];

                for (var idx = 0; idx < data.length; idx++) {
                    var dataItem = data.at(idx);
                    var item = dataItem.toJSON();

                    if (serverGrouping && dataItem.items) {
                        item.items = items(dataItem.items);
                    } else {
                        item.uid = dataItem.uid;

                        if (model) {
                            if (dataItem.isNew()) {
                                item.__state__ = "create";
                            } else if (dataItem.dirty) {
                                item.__state__ = "update";
                            }
                        }
                    }
                    state.push(item);
                }

                return state;
            }

            if (this.options.offlineStorage != null) {
                var state = items(this._data);

                for (var idx = 0; idx < this._destroyed.length; idx++) {
                    var item = this._destroyed[idx].toJSON();
                    item.__state__ = "destroy";
                    state.push(item);
                }

                this.offlineData(state);

                if (updatePristine) {
                    this._pristineData = state;
                }
            }
        },

        _addRange: function(data) {
            var that = this,
                start = that._skip || 0,
                end = start + that._flatData(data, true).length;

            that._ranges.push({ start: start, end: end, data: data });
            that._ranges.sort( function(x, y) { return x.start - y.start; } );
        },

        error: function(xhr, status, errorThrown) {
            this._dequeueRequest();
            this.trigger(REQUESTEND, { });
            this.trigger(ERROR, { xhr: xhr, status: status, errorThrown: errorThrown });
        },

        _params: function(data) {
            var that = this,
                options =  extend({
                    take: that.take(),
                    skip: that.skip(),
                    page: that.page(),
                    pageSize: that.pageSize(),
                    sort: that._sort,
                    filter: that._filter,
                    group: that._group,
                    aggregate: that._aggregate
                }, data);

            if (!that.options.serverPaging) {
                delete options.take;
                delete options.skip;
                delete options.page;
                delete options.pageSize;
            }

            if (!that.options.serverGrouping) {
                delete options.group;
            } else if (that.reader.model && options.group) {
                options.group = convertDescriptorsField(options.group, that.reader.model);
            }

            if (!that.options.serverFiltering) {
                delete options.filter;
            } else if (that.reader.model && options.filter) {
               options.filter = convertFilterDescriptorsField(options.filter, that.reader.model);
            }

            if (!that.options.serverSorting) {
                delete options.sort;
            } else if (that.reader.model && options.sort) {
                options.sort = convertDescriptorsField(options.sort, that.reader.model);
            }

            if (!that.options.serverAggregates) {
                delete options.aggregate;
            } else if (that.reader.model && options.aggregate) {
                options.aggregate = convertDescriptorsField(options.aggregate, that.reader.model);
            }

            return options;
        },

        _queueRequest: function(options, callback) {
            var that = this;
            if (!that._requestInProgress) {
                that._requestInProgress = true;
                that._pending = undefined;
                callback();
            } else {
                that._pending = { callback: proxy(callback, that), options: options };
            }
        },

        _dequeueRequest: function() {
            var that = this;
            that._requestInProgress = false;
            if (that._pending) {
                that._queueRequest(that._pending.options, that._pending.callback);
            }
        },

        _handleCustomErrors: function(response) {
            if (this.reader.errors) {
                var errors = this.reader.errors(response);
                if (errors) {
                    this.trigger(ERROR, { xhr: null, status: "customerror", errorThrown: "custom error", errors: errors });
                    return true;
                }
            }
            return false;
        },

        _shouldWrap: function(data) {
            var model = this.reader.model;

            if (model && data.length) {
                return !(data[0] instanceof model);
            }

            return false;
        },

        _observe: function(data) {
            var that = this,
                model = that.reader.model,
                wrap = false;

            that._shouldDetachObservableParents = true;

            if (data instanceof ObservableArray) {
                that._shouldDetachObservableParents = false;
                if (that._shouldWrap(data)) {
                    data.type = that.reader.model;
                    data.wrapAll(data, data);
                }
            } else {
                var arrayType = that.pageSize() && !that.options.serverPaging ? LazyObservableArray : ObservableArray;
                data = new arrayType(data, that.reader.model);
                data.parent = function() { return that.parent(); };
            }

            if (that._isServerGrouped()) {
                wrapGroupItems(data, model);
            }

            if (that._changeHandler && that._data && that._data instanceof ObservableArray) {
                that._data.unbind(CHANGE, that._changeHandler);
            } else {
                that._changeHandler = proxy(that._change, that);
            }

            return data.bind(CHANGE, that._changeHandler);
        },

        _change: function(e) {
            var that = this, idx, length, action = e ? e.action : "";

            if (action === "remove") {
                for (idx = 0, length = e.items.length; idx < length; idx++) {
                    if (!e.items[idx].isNew || !e.items[idx].isNew()) {
                        that._destroyed.push(e.items[idx]);
                    }
                }
            }

            if (that.options.autoSync && (action === "add" || action === "remove" || action === "itemchange")) {
                that.sync();
            } else {
                var total = parseInt(that._total, 10);
                if (!isNumber(that._total)) {
                    total = parseInt(that._pristineTotal, 10);
                }
                if (action === "add") {
                    total += e.items.length;
                } else if (action === "remove") {
                    total -= e.items.length;
                } else if (action !== "itemchange" && action !== "sync" && !that.options.serverPaging) {
                    total = that._pristineTotal;
                } else if (action === "sync") {
                    total = that._pristineTotal = parseInt(that._total, 10);
                }

                that._total = total;

                that._process(that._data, e);
            }
        },

        _calculateAggregates: function (data, options) {
            options = options || {};

            var query = new Query(data),
                aggregates = options.aggregate,
                filter = options.filter;

            if (filter) {
                query = query.filter(filter);
            }

            return query.aggregate(aggregates);
        },

        _process: function (data, e) {
            var that = this,
                options = {},
                result;

            if (that.options.serverPaging !== true) {
                options.skip = that._skip;
                options.take = that._take || that._pageSize;

                if(options.skip === undefined && that._page !== undefined && that._pageSize !== undefined) {
                    options.skip = (that._page - 1) * that._pageSize;
                }
            }

            if (that.options.serverSorting !== true) {
                options.sort = that._sort;
            }

            if (that.options.serverFiltering !== true) {
                options.filter = that._filter;
            }

            if (that.options.serverGrouping !== true) {
                options.group = that._group;
            }

            if (that.options.serverAggregates !== true) {
                options.aggregate = that._aggregate;
                that._aggregateResult = that._calculateAggregates(data, options);
            }

            result = that._queryProcess(data, options);

            that.view(result.data);

            if (result.total !== undefined && !that.options.serverFiltering) {
                that._total = result.total;
            }

            e = e || {};

            e.items = e.items || that._view;

            that.trigger(CHANGE, e);
        },

        _queryProcess: function(data, options) {
            return Query.process(data, options);
        },

        _mergeState: function(options) {
            var that = this;

            if (options !== undefined) {
                that._pageSize = options.pageSize;
                that._page = options.page;
                that._sort = options.sort;
                that._filter = options.filter;
                that._group = options.group;
                that._aggregate = options.aggregate;
                that._skip = options.skip;
                that._take = options.take;

                if(that._skip === undefined) {
                    that._skip = that.skip();
                    options.skip = that.skip();
                }

                if(that._take === undefined && that._pageSize !== undefined) {
                    that._take = that._pageSize;
                    options.take = that._take;
                }

                if (options.sort) {
                    that._sort = options.sort = normalizeSort(options.sort);
                }

                if (options.filter) {
                    that._filter = options.filter = normalizeFilter(options.filter);
                }

                if (options.group) {
                    that._group = options.group = normalizeGroup(options.group);
                }
                if (options.aggregate) {
                    that._aggregate = options.aggregate = normalizeAggregate(options.aggregate);
                }
            }
            return options;
        },

        query: function(options) {
            var result;
            var remote = this.options.serverSorting || this.options.serverPaging || this.options.serverFiltering || this.options.serverGrouping || this.options.serverAggregates;

            if (remote || ((this._data === undefined || this._data.length === 0) && !this._destroyed.length)) {
                return this.read(this._mergeState(options));
            }

            var isPrevented = this.trigger(REQUESTSTART, { type: "read" });
            if (!isPrevented) {
                this.trigger(PROGRESS);

                result = this._queryProcess(this._data, this._mergeState(options));

                if (!this.options.serverFiltering) {
                    if (result.total !== undefined) {
                        this._total = result.total;
                    } else {
                        this._total = this._data.length;
                    }
                }

                this._aggregateResult = this._calculateAggregates(this._data, options);
                this.view(result.data);
                this.trigger(REQUESTEND, { type: "read" });
                this.trigger(CHANGE, { items: result.data });
            }

            return $.Deferred().resolve(isPrevented).promise();
        },

        fetch: function(callback) {
            var that = this;
            var fn = function(isPrevented) {
                if (isPrevented !== true && isFunction(callback)) {
                    callback.call(that);
                }
            };

            return this._query().then(fn);
        },

        _query: function(options) {
            var that = this;

            return that.query(extend({}, {
                page: that.page(),
                pageSize: that.pageSize(),
                sort: that.sort(),
                filter: that.filter(),
                group: that.group(),
                aggregate: that.aggregate()
            }, options));
        },

        next: function(options) {
            var that = this,
                page = that.page(),
                total = that.total();

            options = options || {};

            if (!page || (total && page + 1 > that.totalPages())) {
                return;
            }

            that._skip = page * that.take();

            page += 1;
            options.page = page;

            that._query(options);

            return page;
        },

        prev: function(options) {
            var that = this,
                page = that.page();

            options = options || {};

            if (!page || page === 1) {
                return;
            }

            that._skip = that._skip - that.take();

            page -= 1;
            options.page = page;

            that._query(options);

            return page;
        },

        page: function(val) {
            var that = this,
            skip;

            if(val !== undefined) {
                val = math.max(math.min(math.max(val, 1), that.totalPages()), 1);
                that._query({ page: val });
                return;
            }
            skip = that.skip();

            return skip !== undefined ? math.round((skip || 0) / (that.take() || 1)) + 1 : undefined;
        },

        pageSize: function(val) {
            var that = this;

            if(val !== undefined) {
                that._query({ pageSize: val, page: 1 });
                return;
            }

            return that.take();
        },

        sort: function(val) {
            var that = this;

            if(val !== undefined) {
                that._query({ sort: val });
                return;
            }

            return that._sort;
        },

        filter: function(val) {
            var that = this;

            if (val === undefined) {
                return that._filter;
            }

            that._query({ filter: val, page: 1 });
            that.trigger("reset");
        },

        group: function(val) {
            var that = this;

            if(val !== undefined) {
                that._query({ group: val });
                return;
            }

            return that._group;
        },

        total: function() {
            return parseInt(this._total || 0, 10);
        },

        aggregate: function(val) {
            var that = this;

            if(val !== undefined) {
                that._query({ aggregate: val });
                return;
            }

            return that._aggregate;
        },

        aggregates: function() {
            var result = this._aggregateResult;

            if (isEmptyObject(result)) {
                result = this._emptyAggregates(this.aggregate());
            }

            return result;
        },

        _emptyAggregates: function(aggregates) {
            var result = {};

            if (!isEmptyObject(aggregates)) {
                var aggregate = {};

                if (!isArray(aggregates)){
                    aggregates = [aggregates];
                }

                for (var idx = 0; idx <aggregates.length; idx++) {
                    aggregate[aggregates[idx].aggregate] = 0;
                    result[aggregates[idx].field] = aggregate;
                }
            }

            return result;
        },

        _wrapInEmptyGroup: function(model) {
            var groups = this.group(),
                parent,
                group,
                idx,
                length;

            for (idx = groups.length-1, length = 0; idx >= length; idx--) {
                group = groups[idx];
                parent = {
                    value: model.get(group.field),
                    field: group.field,
                    items: parent ? [parent] : [model],
                    hasSubgroups: !!parent,
                    aggregates: this._emptyAggregates(group.aggregates)
                };
            }

            return parent;
        },

        totalPages: function() {
            var that = this,
            pageSize = that.pageSize() || that.total();

            return math.ceil((that.total() || 0) / pageSize);
        },

        inRange: function(skip, take) {
            var that = this,
                end = math.min(skip + take, that.total());

            if (!that.options.serverPaging && that._data.length > 0) {
                return true;
            }

            return that._findRange(skip, end).length > 0;
        },

        lastRange: function() {
            var ranges = this._ranges;
            return ranges[ranges.length - 1] || { start: 0, end: 0, data: [] };
        },

        firstItemUid: function() {
            var ranges = this._ranges;
            return ranges.length && ranges[0].data.length && ranges[0].data[0].uid;
        },

        enableRequestsInProgress: function() {
            this._skipRequestsInProgress = false;
        },

        range: function(skip, take) {
            skip = math.min(skip || 0, this.total());

            var that = this,
                pageSkip = math.max(math.floor(skip / take), 0) * take,
                size = math.min(pageSkip + take, that.total()),
                data;

            that._skipRequestsInProgress = false;

            data = that._findRange(skip, math.min(skip + take, that.total()));

            if (data.length) {
                that._skipRequestsInProgress = true;
                that._pending = undefined;

                that._skip = skip > that.skip() ? math.min(size, (that.totalPages() - 1) * that.take()) : pageSkip;

                that._take = take;

                var paging = that.options.serverPaging;
                var sorting = that.options.serverSorting;
                var filtering = that.options.serverFiltering;
                var aggregates = that.options.serverAggregates;
                try {
                    that.options.serverPaging = true;
                    if (!that._isServerGrouped() && !(that.group() && that.group().length)) {
                        that.options.serverSorting = true;
                    }
                    that.options.serverFiltering = true;
                    that.options.serverPaging = true;
                    that.options.serverAggregates = true;

                    if (paging) {
                        that._detachObservableParents();
                        that._data = data = that._observe(data);
                    }
                    that._process(data);
                } finally {
                    that.options.serverPaging = paging;
                    that.options.serverSorting = sorting;
                    that.options.serverFiltering = filtering;
                    that.options.serverAggregates = aggregates;
                }

                return;
            }

            if (take !== undefined) {
                if (!that._rangeExists(pageSkip, size)) {
                    that.prefetch(pageSkip, take, function() {
                        if (skip > pageSkip && size < that.total() && !that._rangeExists(size, math.min(size + take, that.total()))) {
                            that.prefetch(size, take, function() {
                                that.range(skip, take);
                            });
                        } else {
                            that.range(skip, take);
                        }
                    });
                } else if (pageSkip < skip) {
                    that.prefetch(size, take, function() {
                        that.range(skip, take);
                    });
                }
            }
        },

        _findRange: function(start, end) {
            var that = this,
                ranges = that._ranges,
                range,
                data = [],
                skipIdx,
                takeIdx,
                startIndex,
                endIndex,
                rangeData,
                rangeEnd,
                processed,
                options = that.options,
                remote = options.serverSorting || options.serverPaging || options.serverFiltering || options.serverGrouping || options.serverAggregates,
                flatData,
                count,
                length;

            for (skipIdx = 0, length = ranges.length; skipIdx < length; skipIdx++) {
                range = ranges[skipIdx];
                if (start >= range.start && start <= range.end) {
                    count = 0;

                    for (takeIdx = skipIdx; takeIdx < length; takeIdx++) {
                        range = ranges[takeIdx];
                        flatData = that._flatData(range.data, true);

                        if (flatData.length && start + count >= range.start) {
                            rangeData = range.data;
                            rangeEnd = range.end;

                            if (!remote) {
                                var sort = normalizeGroup(that.group() || []).concat(normalizeSort(that.sort() || []));
                                processed = that._queryProcess(range.data, { sort: sort, filter: that.filter() });
                                flatData = rangeData = processed.data;

                                if (processed.total !== undefined) {
                                    rangeEnd = processed.total;
                                }
                            }

                            startIndex = 0;
                            if (start + count > range.start) {
                                startIndex = (start + count) - range.start;
                            }
                            endIndex = flatData.length;
                            if (rangeEnd > end) {
                                endIndex = endIndex - (rangeEnd - end);
                            }
                            count += endIndex - startIndex;
                            data = that._mergeGroups(data, rangeData, startIndex, endIndex);

                            if (end <= range.end && count == end - start) {
                                return data;
                            }
                        }
                    }
                    break;
                }
            }
            return [];
        },

        _mergeGroups: function(data, range, skip, take) {
            if (this._isServerGrouped()) {
                var temp = range.toJSON(),
                    prevGroup;

                if (data.length) {
                    prevGroup = data[data.length - 1];
                }

                mergeGroups(prevGroup, temp, skip, take);

                return data.concat(temp);
            }
            return data.concat(range.slice(skip, take));
        },

        skip: function() {
            var that = this;

            if (that._skip === undefined) {
                return (that._page !== undefined ? (that._page  - 1) * (that.take() || 1) : undefined);
            }
            return that._skip;
        },

        take: function() {
            return this._take || this._pageSize;
        },

        _prefetchSuccessHandler: function (skip, size, callback, force) {
            var that = this;

            return function(data) {
                var found = false,
                    range = { start: skip, end: size, data: [] },
                    idx,
                    length,
                    temp;

                that._dequeueRequest();

                that.trigger(REQUESTEND, { response: data, type: "read" });

                data = that.reader.parse(data);

                temp = that._readData(data);

                if (temp.length) {
                    for (idx = 0, length = that._ranges.length; idx < length; idx++) {
                        if (that._ranges[idx].start === skip) {
                            found = true;
                            range = that._ranges[idx];
                            break;
                        }
                    }
                    if (!found) {
                        that._ranges.push(range);
                    }
                }

                range.data = that._observe(temp);
                range.end = range.start + that._flatData(range.data, true).length;
                that._ranges.sort( function(x, y) { return x.start - y.start; } );
                that._total = that.reader.total(data);

                if (force || !that._skipRequestsInProgress) {
                    if (callback && temp.length) {
                        callback();
                    } else {
                        that.trigger(CHANGE, {});
                    }
                }
            };
        },

        prefetch: function(skip, take, callback) {
            var that = this,
                size = math.min(skip + take, that.total()),
                options = {
                    take: take,
                    skip: skip,
                    page: skip / take + 1,
                    pageSize: take,
                    sort: that._sort,
                    filter: that._filter,
                    group: that._group,
                    aggregate: that._aggregate
                };

            if (!that._rangeExists(skip, size)) {
                clearTimeout(that._timeout);

                that._timeout = setTimeout(function() {
                    that._queueRequest(options, function() {
                        if (!that.trigger(REQUESTSTART, { type: "read" })) {
                            that.transport.read({
                                data: that._params(options),
                                success: that._prefetchSuccessHandler(skip, size, callback),
                                error: function() {
                                    var args = slice.call(arguments);
                                    that.error.apply(that, args);
                                }
                            });
                        } else {
                            that._dequeueRequest();
                        }
                    });
                }, 100);
            } else if (callback) {
                callback();
            }
        },

        _multiplePrefetch: function(skip, take, callback) {
            var that = this,
                size = math.min(skip + take, that.total()),
                options = {
                    take: take,
                    skip: skip,
                    page: skip / take + 1,
                    pageSize: take,
                    sort: that._sort,
                    filter: that._filter,
                    group: that._group,
                    aggregate: that._aggregate
                };

            if (!that._rangeExists(skip, size)) {
                if (!that.trigger(REQUESTSTART, { type: "read" })) {
                    that.transport.read({
                        data: that._params(options),
                        success: that._prefetchSuccessHandler(skip, size, callback, true)
                    });
                }
            } else if (callback) {
                callback();
            }
        },

        _rangeExists: function(start, end) {
            var that = this,
                ranges = that._ranges,
                idx,
                length;

            for (idx = 0, length = ranges.length; idx < length; idx++) {
                if (ranges[idx].start <= start && ranges[idx].end >= end) {
                    return true;
                }
            }
            return false;
        },

        _removeModelFromRanges: function(model) {
            var result,
                found,
                range;

            for (var idx = 0, length = this._ranges.length; idx < length; idx++) {
                range = this._ranges[idx];

                this._eachItem(range.data, function(items) {
                    result = removeModel(items, model);
                    if (result) {
                        found = true;
                    }
                });

                if (found) {
                    break;
                }
            }
        },

        _updateRangesLength: function() {
            var startOffset = 0,
                range,
                rangeLength;

            for (var idx = 0, length = this._ranges.length; idx < length; idx++) {
                range = this._ranges[idx];
                range.start = range.start - startOffset;

                rangeLength = this._flatData(range.data, true).length;
                startOffset = range.end - rangeLength;
                range.end = range.start + rangeLength;
            }
        }
    });

    var Transport = {};

    Transport.create = function(options, data, dataSource) {
        var transport,
            transportOptions = options.transport;

        if (transportOptions) {
            transportOptions.read = typeof transportOptions.read === STRING ? { url: transportOptions.read } : transportOptions.read;

            if (dataSource) {
                transportOptions.dataSource = dataSource;
            }

            if (options.type) {
                kendo.data.transports = kendo.data.transports || {};
                kendo.data.schemas = kendo.data.schemas || {};

                if (kendo.data.transports[options.type] && !isPlainObject(kendo.data.transports[options.type])) {
                    transport = new kendo.data.transports[options.type](extend(transportOptions, { data: data }));
                } else {
                    transportOptions = extend(true, {}, kendo.data.transports[options.type], transportOptions);
                }

                options.schema = extend(true, {}, kendo.data.schemas[options.type], options.schema);
            }

            if (!transport) {
                transport = isFunction(transportOptions.read) ? transportOptions : new RemoteTransport(transportOptions);
            }
        } else {
            transport = new LocalTransport({ data: options.data || [] });
        }
        return transport;
    };

    DataSource.create = function(options) {
        if (isArray(options) || options instanceof ObservableArray) {
           options = { data: options };
        }

        var dataSource = options || {},
            data = dataSource.data,
            fields = dataSource.fields,
            table = dataSource.table,
            select = dataSource.select,
            idx,
            length,
            model = {},
            field;

        if (!data && fields && !dataSource.transport) {
            if (table) {
                data = inferTable(table, fields);
            } else if (select) {
                data = inferSelect(select, fields);

                if (dataSource.group === undefined && data[0] && data[0].optgroup !== undefined) {
                    dataSource.group = "optgroup";
                }
            }
        }

        if (kendo.data.Model && fields && (!dataSource.schema || !dataSource.schema.model)) {
            for (idx = 0, length = fields.length; idx < length; idx++) {
                field = fields[idx];
                if (field.type) {
                    model[field.field] = field;
                }
            }

            if (!isEmptyObject(model)) {
                dataSource.schema = extend(true, dataSource.schema, { model:  { fields: model } });
            }
        }

        dataSource.data = data;

        select = null;
        dataSource.select = null;
        table = null;
        dataSource.table = null;

        return dataSource instanceof DataSource ? dataSource : new DataSource(dataSource);
    };

    function inferSelect(select, fields) {
        select = $(select)[0];
        var options = select.options;
        var firstField = fields[0];
        var secondField = fields[1];

        var data = [];
        var idx, length;
        var optgroup;
        var option;
        var record;
        var value;

        for (idx = 0, length = options.length; idx < length; idx++) {
            record = {};
            option = options[idx];
            optgroup = option.parentNode;

            if (optgroup === select) {
                optgroup = null;
            }

            if (option.disabled || (optgroup && optgroup.disabled)) {
                continue;
            }

            if (optgroup) {
                record.optgroup = optgroup.label;
            }

            record[firstField.field] = option.text;

            value = option.attributes.value;

            if (value && value.specified) {
                value = option.value;
            } else {
                value = option.text;
            }

            record[secondField.field] = value;

            data.push(record);
        }

        return data;
    }

    function inferTable(table, fields) {
        var tbody = $(table)[0].tBodies[0],
        rows = tbody ? tbody.rows : [],
        idx,
        length,
        fieldIndex,
        fieldCount = fields.length,
        data = [],
        cells,
        record,
        cell,
        empty;

        for (idx = 0, length = rows.length; idx < length; idx++) {
            record = {};
            empty = true;
            cells = rows[idx].cells;

            for (fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
                cell = cells[fieldIndex];
                if(cell.nodeName.toLowerCase() !== "th") {
                    empty = false;
                    record[fields[fieldIndex].field] = cell.innerHTML;
                }
            }
            if(!empty) {
                data.push(record);
            }
        }

        return data;
    }

    var Node = Model.define({
        idField: "id",

        init: function(value) {
            var that = this,
                hasChildren = that.hasChildren || value && value.hasChildren,
                childrenField = "items",
                childrenOptions = {};

            kendo.data.Model.fn.init.call(that, value);

            if (typeof that.children === STRING) {
                childrenField = that.children;
            }

            childrenOptions = {
                schema: {
                    data: childrenField,
                    model: {
                        hasChildren: hasChildren,
                        id: that.idField,
                        fields: that.fields
                    }
                }
            };

            if (typeof that.children !== STRING) {
                extend(childrenOptions, that.children);
            }

            childrenOptions.data = value;

            if (!hasChildren) {
                hasChildren = childrenOptions.schema.data;
            }

            if (typeof hasChildren === STRING) {
                hasChildren = kendo.getter(hasChildren);
            }

            if (isFunction(hasChildren)) {
                that.hasChildren = !!hasChildren.call(that, that);
            }

            that._childrenOptions = childrenOptions;

            if (that.hasChildren) {
                that._initChildren();
            }

            that._loaded = !!(value && (value[childrenField] || value._loaded));
        },

        _initChildren: function() {
            var that = this;
            var children, transport, parameterMap;

            if (!(that.children instanceof HierarchicalDataSource)) {
                children = that.children = new HierarchicalDataSource(that._childrenOptions);

                transport = children.transport;
                parameterMap = transport.parameterMap;

                transport.parameterMap = function(data, type) {
                    data[that.idField || "id"] = that.id;

                    if (parameterMap) {
                        data = parameterMap(data, type);
                    }

                    return data;
                };

                children.parent = function(){
                    return that;
                };

                children.bind(CHANGE, function(e){
                    e.node = e.node || that;
                    that.trigger(CHANGE, e);
                });

                children.bind(ERROR, function(e){
                    var collection = that.parent();

                    if (collection) {
                        e.node = e.node || that;
                        collection.trigger(ERROR, e);
                    }
                });

                that._updateChildrenField();
            }
        },

        append: function(model) {
            this._initChildren();
            this.loaded(true);
            this.children.add(model);
        },

        hasChildren: false,

        level: function() {
            var parentNode = this.parentNode(),
                level = 0;

            while (parentNode && parentNode.parentNode) {
                level++;
                parentNode = parentNode.parentNode ? parentNode.parentNode() : null;
            }

            return level;
        },

        _updateChildrenField: function() {
            var fieldName = this._childrenOptions.schema.data;

            this[fieldName || "items"] = this.children.data();
        },

        _childrenLoaded: function() {
            this._loaded = true;

            this._updateChildrenField();
        },

        load: function() {
            var options = {};
            var method = "_query";
            var children, promise;

            if (this.hasChildren) {
                this._initChildren();

                children = this.children;

                options[this.idField || "id"] = this.id;

                if (!this._loaded) {
                    children._data = undefined;
                    method = "read";
                }

                children.one(CHANGE, proxy(this._childrenLoaded, this));

                promise = children[method](options);
            } else {
                this.loaded(true);
            }

            return promise || $.Deferred().resolve().promise();
        },

        parentNode: function() {
            var array = this.parent();

            return array.parent();
        },

        loaded: function(value) {
            if (value !== undefined) {
                this._loaded = value;
            } else {
                return this._loaded;
            }
        },

        shouldSerialize: function(field) {
            return Model.fn.shouldSerialize.call(this, field) &&
                    field !== "children" &&
                    field !== "_loaded" &&
                    field !== "hasChildren" &&
                    field !== "_childrenOptions";
        }
    });

    function dataMethod(name) {
        return function() {
            var data = this._data,
                result = DataSource.fn[name].apply(this, slice.call(arguments));

            if (this._data != data) {
                this._attachBubbleHandlers();
            }

            return result;
        };
    }

    var HierarchicalDataSource = DataSource.extend({
        init: function(options) {
            var node = Node.define({
                children: options
            });

            DataSource.fn.init.call(this, extend(true, {}, { schema: { modelBase: node, model: node } }, options));

            this._attachBubbleHandlers();
        },

        _attachBubbleHandlers: function() {
            var that = this;

            that._data.bind(ERROR, function(e) {
                that.trigger(ERROR, e);
            });
        },

        remove: function(node){
            var parentNode = node.parentNode(),
                dataSource = this,
                result;

            if (parentNode && parentNode._initChildren) {
                dataSource = parentNode.children;
            }

            result = DataSource.fn.remove.call(dataSource, node);

            if (parentNode && !dataSource.data().length) {
                parentNode.hasChildren = false;
            }

            return result;
        },

        success: dataMethod("success"),

        data: dataMethod("data"),

        insert: function(index, model) {
            var parentNode = this.parent();

            if (parentNode && parentNode._initChildren) {
                parentNode.hasChildren = true;
                parentNode._initChildren();
            }

            return DataSource.fn.insert.call(this, index, model);
        },

        _find: function(method, value) {
            var idx, length, node, data, children;

            node = DataSource.fn[method].call(this, value);

            if (node) {
                return node;
            }

            data = this._flatData(this._data);

            if (!data) {
                return;
            }

            for (idx = 0, length = data.length; idx < length; idx++) {
                children = data[idx].children;

                if (!(children instanceof HierarchicalDataSource)) {
                    continue;
                }

                node = children[method](value);

                if (node) {
                    return node;
                }
            }
        },

        get: function(id) {
            return this._find("get", id);
        },

        getByUid: function(uid) {
            return this._find("getByUid", uid);
        }
    });

    function inferList(list, fields) {
        var items = $(list).children(),
            idx,
            length,
            data = [],
            record,
            textField = fields[0].field,
            urlField = fields[1] && fields[1].field,
            spriteCssClassField = fields[2] && fields[2].field,
            imageUrlField = fields[3] && fields[3].field,
            item,
            id,
            textChild,
            className,
            children;

        function elements(collection, tagName) {
            return collection.filter(tagName).add(collection.find(tagName));
        }

        for (idx = 0, length = items.length; idx < length; idx++) {
            record = { _loaded: true };
            item = items.eq(idx);

            textChild = item[0].firstChild;
            children = item.children();
            list = children.filter("ul");
            children = children.filter(":not(ul)");

            id = item.attr("data-id");

            if (id) {
                record.id = id;
            }

            if (textChild) {
                record[textField] = textChild.nodeType == 3 ? textChild.nodeValue : children.text();
            }

            if (urlField) {
                record[urlField] = elements(children, "a").attr("href");
            }

            if (imageUrlField) {
                record[imageUrlField] = elements(children, "img").attr("src");
            }

            if (spriteCssClassField) {
                className = elements(children, ".k-sprite").prop("className");
                record[spriteCssClassField] = className && $.trim(className.replace("k-sprite", ""));
            }

            if (list.length) {
                record.items = inferList(list.eq(0), fields);
            }

            if (item.attr("data-hasChildren") == "true") {
                record.hasChildren = true;
            }

            data.push(record);
        }

        return data;
    }

    HierarchicalDataSource.create = function(options) {
        options = options && options.push ? { data: options } : options;

        var dataSource = options || {},
            data = dataSource.data,
            fields = dataSource.fields,
            list = dataSource.list;

        if (data && data._dataSource) {
            return data._dataSource;
        }

        if (!data && fields && !dataSource.transport) {
            if (list) {
                data = inferList(list, fields);
            }
        }

        dataSource.data = data;

        return dataSource instanceof HierarchicalDataSource ? dataSource : new HierarchicalDataSource(dataSource);
    };

    var Buffer = kendo.Observable.extend({
        init: function(dataSource, viewSize, disablePrefetch) {
            kendo.Observable.fn.init.call(this);

            this._prefetching = false;
            this.dataSource = dataSource;
            this.prefetch = !disablePrefetch;

            var buffer = this;

            dataSource.bind("change", function() {
                buffer._change();
            });

            dataSource.bind("reset", function() {
                buffer._reset();
            });

            this._syncWithDataSource();

            this.setViewSize(viewSize);
        },

        setViewSize: function(viewSize) {
            this.viewSize = viewSize;
            this._recalculate();
        },

        at: function(index)  {
            var pageSize = this.pageSize,
                item,
                itemPresent = true,
                changeTo;

            if (index >= this.total()) {
                this.trigger("endreached", {index: index });
                return null;
            }

            if (!this.useRanges) {
               return this.dataSource.view()[index];
            }
            if (this.useRanges) {
                // out of range request
                if (index < this.dataOffset || index >= this.skip + pageSize) {
                    itemPresent = this.range(Math.floor(index / pageSize) * pageSize);
                }

                // prefetch
                if (index === this.prefetchThreshold) {
                    this._prefetch();
                }

                // mid-range jump - prefetchThreshold and nextPageThreshold may be equal, do not change to else if
                if (index === this.midPageThreshold) {
                    this.range(this.nextMidRange, true);
                }
                // next range jump
                else if (index === this.nextPageThreshold) {
                    this.range(this.nextFullRange);
                }
                // pull-back
                else if (index === this.pullBackThreshold) {
                    if (this.offset === this.skip) { // from full range to mid range
                        this.range(this.previousMidRange);
                    } else { // from mid range to full range
                        this.range(this.previousFullRange);
                    }
                }

                if (itemPresent) {
                    return this.dataSource.at(index - this.dataOffset);
                } else {
                    this.trigger("endreached", { index: index });
                    return null;
                }
            }
        },

        indexOf: function(item) {
            return this.dataSource.data().indexOf(item) + this.dataOffset;
        },

        total: function() {
            return parseInt(this.dataSource.total(), 10);
        },

        next: function() {
            var buffer = this,
                pageSize = buffer.pageSize,
                offset = buffer.skip - buffer.viewSize + pageSize,
                pageSkip = math.max(math.floor(offset / pageSize), 0) * pageSize;

            this.offset = offset;
            this.dataSource.prefetch(pageSkip, pageSize, function() {
                buffer._goToRange(offset, true);
            });
        },

        range: function(offset, nextRange) {
            if (this.offset === offset) {
                return true;
            }

            var buffer = this,
                pageSize = this.pageSize,
                pageSkip = math.max(math.floor(offset / pageSize), 0) * pageSize,
                dataSource = this.dataSource;

            if (nextRange) {
                pageSkip += pageSize;
            }

            if (dataSource.inRange(offset, pageSize)) {
                this.offset = offset;
                this._recalculate();
                this._goToRange(offset);
                return true;
            } else if (this.prefetch) {
                dataSource.prefetch(pageSkip, pageSize, function() {
                    buffer.offset = offset;
                    buffer._recalculate();
                    buffer._goToRange(offset, true);
                });
                return false;
            }

            return true;
        },

        syncDataSource: function() {
            var offset = this.offset;
            this.offset = null;
            this.range(offset);
        },

        destroy: function() {
            this.unbind();
        },

        _prefetch: function() {
            var buffer = this,
                pageSize = this.pageSize,
                prefetchOffset = this.skip + pageSize,
                dataSource = this.dataSource;

            if (!dataSource.inRange(prefetchOffset, pageSize) && !this._prefetching && this.prefetch) {
                this._prefetching = true;
                this.trigger("prefetching", { skip: prefetchOffset, take: pageSize });

                dataSource.prefetch(prefetchOffset, pageSize, function() {
                    buffer._prefetching = false;
                    buffer.trigger("prefetched", { skip: prefetchOffset, take: pageSize });
                });
            }
        },

        _goToRange: function(offset, expanding) {
            if (this.offset !== offset) {
                return;
            }

            this.dataOffset = offset;
            this._expanding = expanding;
            this.dataSource.range(offset, this.pageSize);
            this.dataSource.enableRequestsInProgress();
        },

        _reset: function() {
            this._syncPending = true;
        },

        _change: function() {
            var dataSource = this.dataSource;

            this.length = this.useRanges ? dataSource.lastRange().end : dataSource.view().length;

            if (this._syncPending) {
                this._syncWithDataSource();
                this._recalculate();
                this._syncPending = false;
                this.trigger("reset", { offset: this.offset });
            }

            this.trigger("resize");

            if (this._expanding) {
                this.trigger("expand");
            }

            delete this._expanding;
        },

        _syncWithDataSource: function() {
            var dataSource = this.dataSource;

            this._firstItemUid = dataSource.firstItemUid();
            this.dataOffset = this.offset = dataSource.skip() || 0;
            this.pageSize = dataSource.pageSize();
            this.useRanges = dataSource.options.serverPaging;
        },

        _recalculate: function() {
            var pageSize = this.pageSize,
                offset = this.offset,
                viewSize = this.viewSize,
                skip = Math.ceil(offset / pageSize) * pageSize;

            this.skip = skip;
            this.midPageThreshold = skip + pageSize - 1;
            this.nextPageThreshold = skip + viewSize - 1;
            this.prefetchThreshold = skip + Math.floor(pageSize / 3 * 2);
            this.pullBackThreshold = this.offset - 1;

            this.nextMidRange = skip + pageSize - viewSize;
            this.nextFullRange = skip;
            this.previousMidRange = offset - viewSize;
            this.previousFullRange = skip - pageSize;
        }
    });

    var BatchBuffer = kendo.Observable.extend({
        init: function(dataSource, batchSize) {
            var batchBuffer = this;

            kendo.Observable.fn.init.call(batchBuffer);

            this.dataSource = dataSource;
            this.batchSize = batchSize;
            this._total = 0;

            this.buffer = new Buffer(dataSource, batchSize * 3);

            this.buffer.bind({
                "endreached": function (e) {
                    batchBuffer.trigger("endreached", { index: e.index });
                },
                "prefetching": function (e) {
                    batchBuffer.trigger("prefetching", { skip: e.skip, take: e.take });
                },
                "prefetched": function (e) {
                    batchBuffer.trigger("prefetched", { skip: e.skip, take: e.take });
                },
                "reset": function () {
                    batchBuffer._total = 0;
                    batchBuffer.trigger("reset");
                },
                "resize": function () {
                    batchBuffer._total = Math.ceil(this.length / batchBuffer.batchSize);
                    batchBuffer.trigger("resize", { total: batchBuffer.total(), offset: this.offset });
                }
            });
        },

        syncDataSource: function() {
            this.buffer.syncDataSource();
        },

        at: function(index) {
            var buffer = this.buffer,
                skip = index * this.batchSize,
                take = this.batchSize,
                view = [],
                item;

            if (buffer.offset > skip) {
                buffer.at(buffer.offset - 1);
            }

            for (var i = 0; i < take; i++) {
                item = buffer.at(skip + i);

                if (item === null) {
                    break;
                }

                view.push(item);
            }

            return view;
        },

        total: function() {
            return this._total;
        },

        destroy: function() {
            this.buffer.destroy();
            this.unbind();
        }
    });

    extend(true, kendo.data, {
        readers: {
            json: DataReader
        },
        Query: Query,
        DataSource: DataSource,
        HierarchicalDataSource: HierarchicalDataSource,
        Node: Node,
        ObservableObject: ObservableObject,
        ObservableArray: ObservableArray,
        LazyObservableArray: LazyObservableArray,
        LocalTransport: LocalTransport,
        RemoteTransport: RemoteTransport,
        Cache: Cache,
        DataReader: DataReader,
        Model: Model,
        Buffer: Buffer,
        BatchBuffer: BatchBuffer
    });
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "userevents",
    name: "User Events",
    category: "framework",
    depends: [ "core" ],
    hidden: true
};

(function ($, undefined) {
    var kendo = window.kendo,
        support = kendo.support,
        document = window.document,
        Class = kendo.Class,
        Observable = kendo.Observable,
        now = $.now,
        extend = $.extend,
        OS = support.mobileOS,
        invalidZeroEvents = OS && OS.android,
        DEFAULT_MIN_HOLD = 800,
        DEFAULT_THRESHOLD = support.browser.msie ? 5 : 0, // WP8 and W8 are very sensitive and always report move.

        // UserEvents events
        PRESS = "press",
        HOLD = "hold",
        SELECT = "select",
        START = "start",
        MOVE = "move",
        END = "end",
        CANCEL = "cancel",
        TAP = "tap",
        RELEASE = "release",
        GESTURESTART = "gesturestart",
        GESTURECHANGE = "gesturechange",
        GESTUREEND = "gestureend",
        GESTURETAP = "gesturetap";

    var THRESHOLD = {
        "api": 0,
        "touch": 0,
        "mouse": 9,
        "pointer": 9
    };

    var ENABLE_GLOBAL_SURFACE = (!support.touch || support.mouseAndTouchPresent);

    function touchDelta(touch1, touch2) {
        var x1 = touch1.x.location,
            y1 = touch1.y.location,
            x2 = touch2.x.location,
            y2 = touch2.y.location,
            dx = x1 - x2,
            dy = y1 - y2;

        return {
            center: {
               x: (x1 + x2) / 2,
               y: (y1 + y2) / 2
            },

            distance: Math.sqrt(dx*dx + dy*dy)
        };
    }

    function getTouches(e) {
        var touches = [],
            originalEvent = e.originalEvent,
            currentTarget = e.currentTarget,
            idx = 0, length,
            changedTouches,
            touch;

        if (e.api) {
            touches.push({
                id: 2,  // hardcoded ID for API call;
                event: e,
                target: e.target,
                currentTarget: e.target,
                location: e,
                type: "api"
            });
        }
        else if (e.type.match(/touch/)) {
            changedTouches = originalEvent ? originalEvent.changedTouches : [];
            for (length = changedTouches.length; idx < length; idx ++) {
                touch = changedTouches[idx];
                touches.push({
                    location: touch,
                    event: e,
                    target: touch.target,
                    currentTarget: currentTarget,
                    id: touch.identifier,
                    type: "touch"
                });
            }
        }
        else if (support.pointers || support.msPointers) {
            touches.push({
                location: originalEvent,
                event: e,
                target: e.target,
                currentTarget: currentTarget,
                id: originalEvent.pointerId,
                type: "pointer"
            });
        } else {
            touches.push({
                id: 1, // hardcoded ID for mouse event;
                event: e,
                target: e.target,
                currentTarget: currentTarget,
                location: e,
                type: "mouse"
            });
        }

        return touches;
    }

    var TouchAxis = Class.extend({
        init: function(axis, location) {
            var that = this;

            that.axis = axis;

            that._updateLocationData(location);

            that.startLocation = that.location;
            that.velocity = that.delta = 0;
            that.timeStamp = now();
        },

        move: function(location) {
            var that = this,
                offset = location["page" + that.axis],
                timeStamp = now(),
                timeDelta = (timeStamp - that.timeStamp) || 1; // Firing manually events in tests can make this 0;

            if (!offset && invalidZeroEvents) {
                return;
            }

            that.delta = offset - that.location;

            that._updateLocationData(location);

            that.initialDelta = offset - that.startLocation;
            that.velocity = that.delta / timeDelta;
            that.timeStamp = timeStamp;
        },

        _updateLocationData: function(location) {
            var that = this, axis = that.axis;

            that.location = location["page" + axis];
            that.client = location["client" + axis];
            that.screen = location["screen" + axis];
        }
    });

    var Touch = Class.extend({
        init: function(userEvents, target, touchInfo) {
            extend(this, {
                x: new TouchAxis("X", touchInfo.location),
                y: new TouchAxis("Y", touchInfo.location),
                type: touchInfo.type,
                threshold: userEvents.threshold || THRESHOLD[touchInfo.type],
                userEvents: userEvents,
                target: target,
                currentTarget: touchInfo.currentTarget,
                initialTouch: touchInfo.target,
                id: touchInfo.id,
                pressEvent: touchInfo,
                _moved: false,
                _finished: false
            });
        },

        press: function() {
            this._holdTimeout = setTimeout($.proxy(this, "_hold"), this.userEvents.minHold);
            this._trigger(PRESS, this.pressEvent);
        },

        _hold: function() {
            this._trigger(HOLD, this.pressEvent);
        },

        move: function(touchInfo) {
            var that = this;

            if (that._finished) { return; }

            that.x.move(touchInfo.location);
            that.y.move(touchInfo.location);

            if (!that._moved) {
                if (that._withinIgnoreThreshold()) {
                    return;
                }

                if (!UserEvents.current || UserEvents.current === that.userEvents) {
                    that._start(touchInfo);
                } else {
                    return that.dispose();
                }
            }

            // Event handlers may cancel the drag in the START event handler, hence the double check for pressed.
            if (!that._finished) {
                that._trigger(MOVE, touchInfo);
            }
        },

        end: function(touchInfo) {
            var that = this;

            that.endTime = now();

            if (that._finished) { return; }

            // Mark the object as finished if there are blocking operations in the event handlers (alert/confirm)
            that._finished = true;

            that._trigger(RELEASE, touchInfo); // Release should be fired before TAP (as click is after mouseup/touchend)

            if (that._moved) {
                that._trigger(END, touchInfo);
            } else {
                that._trigger(TAP, touchInfo);
            }

            clearTimeout(that._holdTimeout);

            that.dispose();
        },

        dispose: function() {
            var userEvents = this.userEvents,
                activeTouches = userEvents.touches;

            this._finished = true;
            this.pressEvent = null;
            clearTimeout(this._holdTimeout);

            activeTouches.splice($.inArray(this, activeTouches), 1);
        },

        skip: function() {
            this.dispose();
        },

        cancel: function() {
            this.dispose();
        },

        isMoved: function() {
            return this._moved;
        },

        _start: function(touchInfo) {
            clearTimeout(this._holdTimeout);

            this.startTime = now();
            this._moved = true;
            this._trigger(START, touchInfo);
        },

        _trigger: function(name, touchInfo) {
            var that = this,
                jQueryEvent = touchInfo.event,
                data = {
                    touch: that,
                    x: that.x,
                    y: that.y,
                    target: that.target,
                    event: jQueryEvent
                };

            if(that.userEvents.notify(name, data)) {
                jQueryEvent.preventDefault();
            }
        },

        _withinIgnoreThreshold: function() {
            var xDelta = this.x.initialDelta,
                yDelta = this.y.initialDelta;

            return Math.sqrt(xDelta * xDelta + yDelta * yDelta) <= this.threshold;
        }
    });

    function withEachUpEvent(callback) {
        var downEvents = kendo.eventMap.up.split(" "),
            idx = 0,
            length = downEvents.length;

        for(; idx < length; idx ++) {
            callback(downEvents[idx]);
        }
    }

    var UserEvents = Observable.extend({
        init: function(element, options) {
            var that = this,
                filter,
                ns = kendo.guid();

            options = options || {};
            filter = that.filter = options.filter;
            that.threshold = options.threshold || DEFAULT_THRESHOLD;
            that.minHold = options.minHold || DEFAULT_MIN_HOLD;
            that.touches = [];
            that._maxTouches = options.multiTouch ? 2 : 1;
            that.allowSelection = options.allowSelection;
            that.captureUpIfMoved = options.captureUpIfMoved;
            that.eventNS = ns;

            element = $(element).handler(that);
            Observable.fn.init.call(that);

            extend(that, {
                element: element,
                // the touch events lock to the element anyway, so no need for the global setting
                surface: options.global && ENABLE_GLOBAL_SURFACE ? $(document.documentElement) : $(options.surface || element),
                stopPropagation: options.stopPropagation,
                pressed: false
            });

            that.surface.handler(that)
                .on(kendo.applyEventMap("move", ns), "_move")
                .on(kendo.applyEventMap("up cancel", ns), "_end");

            element.on(kendo.applyEventMap("down", ns), filter, "_start");

            if (support.pointers || support.msPointers) {
                element.css("-ms-touch-action", "pinch-zoom double-tap-zoom");
            }

            if (options.preventDragEvent) {
                element.on(kendo.applyEventMap("dragstart", ns), kendo.preventDefault);
            }

            element.on(kendo.applyEventMap("mousedown", ns), filter, { root: element }, "_select");

            if (that.captureUpIfMoved && support.eventCapture) {
                var surfaceElement = that.surface[0],
                    preventIfMovingProxy = $.proxy(that.preventIfMoving, that);

                withEachUpEvent(function(eventName) {
                    surfaceElement.addEventListener(eventName, preventIfMovingProxy, true);
                });
            }

            that.bind([
            PRESS,
            HOLD,
            TAP,
            START,
            MOVE,
            END,
            RELEASE,
            CANCEL,
            GESTURESTART,
            GESTURECHANGE,
            GESTUREEND,
            GESTURETAP,
            SELECT
            ], options);
        },

        preventIfMoving: function(e) {
            if (this._isMoved()) {
                e.preventDefault();
            }
        },

        destroy: function() {
            var that = this;

            if (that._destroyed) {
                return;
            }

            that._destroyed = true;

            if (that.captureUpIfMoved && support.eventCapture) {
                var surfaceElement = that.surface[0];
                withEachUpEvent(function(eventName) {
                    surfaceElement.removeEventListener(eventName, that.preventIfMoving);
                });
            }

            that.element.kendoDestroy(that.eventNS);
            that.surface.kendoDestroy(that.eventNS);
            that.element.removeData("handler");
            that.surface.removeData("handler");
            that._disposeAll();

            that.unbind();
            delete that.surface;
            delete that.element;
            delete that.currentTarget;
        },

        capture: function() {
            UserEvents.current = this;
        },

        cancel: function() {
            this._disposeAll();
            this.trigger(CANCEL);
        },

        notify: function(eventName, data) {
            var that = this,
                touches = that.touches;

            if (this._isMultiTouch()) {
                switch(eventName) {
                    case MOVE:
                        eventName = GESTURECHANGE;
                        break;
                    case END:
                        eventName = GESTUREEND;
                        break;
                    case TAP:
                        eventName = GESTURETAP;
                        break;
                }

                extend(data, {touches: touches}, touchDelta(touches[0], touches[1]));
            }

            return this.trigger(eventName, extend(data, {type: eventName}));
        },

        // API
        press: function(x, y, target) {
            this._apiCall("_start", x, y, target);
        },

        move: function(x, y) {
            this._apiCall("_move", x, y);
        },

        end: function(x, y) {
            this._apiCall("_end", x, y);
        },

        _isMultiTouch: function() {
            return this.touches.length > 1;
        },

        _maxTouchesReached: function() {
            return this.touches.length >= this._maxTouches;
        },

        _disposeAll: function() {
            var touches = this.touches;
            while (touches.length > 0) {
                touches.pop().dispose();
            }
        },

        _isMoved: function() {
            return $.grep(this.touches, function(touch) {
                return touch.isMoved();
            }).length;
        },

        _select: function(e) {
           if (!this.allowSelection || this.trigger(SELECT, { event: e })) {
               e.preventDefault();
           }
        },

        _start: function(e) {
            var that = this,
                idx = 0,
                filter = that.filter,
                target,
                touches = getTouches(e),
                length = touches.length,
                touch,
                which = e.which;

            if ((which && which > 1) || (that._maxTouchesReached())){
                return;
            }

            UserEvents.current = null;

            that.currentTarget = e.currentTarget;

            if (that.stopPropagation) {
                e.stopPropagation();
            }

            for (; idx < length; idx ++) {
                if (that._maxTouchesReached()) {
                    break;
                }

                touch = touches[idx];

                if (filter) {
                    target = $(touch.currentTarget); // target.is(filter) ? target : target.closest(filter, that.element);
                } else {
                    target = that.element;
                }

                if (!target.length) {
                    continue;
                }

                touch = new Touch(that, target, touch);
                that.touches.push(touch);
                touch.press();

                if (that._isMultiTouch()) {
                    that.notify("gesturestart", {});
                }
            }
        },

        _move: function(e) {
            this._eachTouch("move", e);
        },

        _end: function(e) {
            this._eachTouch("end", e);
        },

        _eachTouch: function(methodName, e) {
            var that = this,
                dict = {},
                touches = getTouches(e),
                activeTouches = that.touches,
                idx,
                touch,
                touchInfo,
                matchingTouch;

            for (idx = 0; idx < activeTouches.length; idx ++) {
                touch = activeTouches[idx];
                dict[touch.id] = touch;
            }

            for (idx = 0; idx < touches.length; idx ++) {
                touchInfo = touches[idx];
                matchingTouch = dict[touchInfo.id];

                if (matchingTouch) {
                    matchingTouch[methodName](touchInfo);
                }
            }
        },

        _apiCall: function(type, x, y, target) {
            this[type]({
                api: true,
                pageX: x,
                pageY: y,
                clientX: x,
                clientY: y,
                target: $(target || this.element)[0],
                stopPropagation: $.noop,
                preventDefault: $.noop
            });
        }
    });

    UserEvents.defaultThreshold = function(value) {
        DEFAULT_THRESHOLD = value;
    };

    UserEvents.minHold = function(value) {
        DEFAULT_MIN_HOLD = value;
    };

    kendo.getTouches = getTouches;
    kendo.touchDelta = touchDelta;
    kendo.UserEvents = UserEvents;
 })(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core", "./kendo.userevents" ], f);
})(function(){

var __meta__ = {
    id: "selectable",
    name: "Selectable",
    category: "framework",
    depends: [ "core", "userevents" ],
    advanced: true
};

(function ($, undefined) {
    var kendo = window.kendo,
        Widget = kendo.ui.Widget,
        proxy = $.proxy,
        abs = Math.abs,
        shift = Array.prototype.shift,
        ARIASELECTED = "aria-selected",
        SELECTED = "k-state-selected",
        ACTIVE = "k-state-selecting",
        SELECTABLE = "k-selectable",
        CHANGE = "change",
        NS = ".kendoSelectable",
        UNSELECTING = "k-state-unselecting",
        INPUTSELECTOR = "input,a,textarea,.k-multiselect-wrap,select,button,a.k-button>.k-icon,button.k-button>.k-icon,span.k-icon.k-i-expand,span.k-icon.k-i-collapse",
        msie = kendo.support.browser.msie,
        supportEventDelegation = false;

        (function($) {
            (function() {
                $('<div class="parent"><span /></div>')
                .on("click", ">*", function() {
                    supportEventDelegation = true;
                })
                .find("span")
                .click()
                .end()
                .off();
            })();
        })($);

    var Selectable = Widget.extend({
        init: function(element, options) {
            var that = this,
                multiple;

            Widget.fn.init.call(that, element, options);

            that._marquee = $("<div class='k-marquee'><div class='k-marquee-color'></div></div>");
            that._lastActive = null;
            that.element.addClass(SELECTABLE);

            that.relatedTarget = that.options.relatedTarget;

            multiple = that.options.multiple;

            if (this.options.aria && multiple) {
                that.element.attr("aria-multiselectable", true);
            }

            that.userEvents = new kendo.UserEvents(that.element, {
                global: true,
                allowSelection: true,
                filter: (!supportEventDelegation ? "." + SELECTABLE + " " : "") + that.options.filter,
                tap: proxy(that._tap, that)
            });

            if (multiple) {
                that.userEvents
                   .bind("start", proxy(that._start, that))
                   .bind("move", proxy(that._move, that))
                   .bind("end", proxy(that._end, that))
                   .bind("select", proxy(that._select, that));
            }
        },

        events: [CHANGE],

        options: {
            name: "Selectable",
            filter: ">*",
            multiple: false,
            relatedTarget: $.noop
        },

        _isElement: function(target) {
            var elements = this.element;
            var idx, length = elements.length, result = false;

            target = target[0];

            for (idx = 0; idx < length; idx ++) {
                if (elements[idx] === target) {
                    result = true;
                    break;
                }
            }

            return result;
        },

        _tap: function(e) {
            var target = $(e.target),
                that = this,
                ctrlKey = e.event.ctrlKey || e.event.metaKey,
                multiple = that.options.multiple,
                shiftKey = multiple && e.event.shiftKey,
                selected,
                whichCode = e.event.which,
                buttonCode = e.event.button;

            //in case of hierarchy or right-click
            if (!that._isElement(target.closest("." + SELECTABLE)) || whichCode && whichCode == 3 || buttonCode && buttonCode == 2) {
                return;
            }

            if (!this._allowSelection(e.event.target)) {
                return;
            }

            selected = target.hasClass(SELECTED);
            if (!multiple || !ctrlKey) {
                that.clear();
            }

            target = target.add(that.relatedTarget(target));

            if (shiftKey) {
                that.selectRange(that._firstSelectee(), target);
            } else {
                if (selected && ctrlKey) {
                    that._unselect(target);
                    that._notify(CHANGE);
                } else {
                    that.value(target);
                }

                that._lastActive = that._downTarget = target;
            }
        },

        _start: function(e) {
            var that = this,
                target = $(e.target),
                selected = target.hasClass(SELECTED),
                currentElement,
                ctrlKey = e.event.ctrlKey || e.event.metaKey;

            if (!this._allowSelection(e.event.target)) {
                return;
            }

            that._downTarget = target;

            //in case of hierarchy
            if (!that._isElement(target.closest("." + SELECTABLE))) {
                that.userEvents.cancel();
                return;
            }

            if (that.options.useAllItems) {
                that._items = that.element.find(that.options.filter);
            } else {
                currentElement = target.closest(that.element);
                that._items = currentElement.find(that.options.filter);
            }

            e.sender.capture();

            that._marquee
                .appendTo(document.body)
                .css({
                    left: e.x.client + 1,
                    top: e.y.client + 1,
                    width: 0,
                    height: 0
                });

            if (!ctrlKey) {
                that.clear();
            }

            target = target.add(that.relatedTarget(target));
            if (selected) {
                that._selectElement(target, true);
                if (ctrlKey) {
                    target.addClass(UNSELECTING);
                }
            }
        },

        _move: function(e) {
            var that = this,
                position = {
                    left: e.x.startLocation > e.x.location ? e.x.location : e.x.startLocation,
                    top: e.y.startLocation > e.y.location ? e.y.location : e.y.startLocation,
                    width: abs(e.x.initialDelta),
                    height: abs(e.y.initialDelta)
                };

            that._marquee.css(position);

            that._invalidateSelectables(position, (e.event.ctrlKey || e.event.metaKey));

            e.preventDefault();
        },

        _end: function() {
            var that = this;

            that._marquee.remove();

            that._unselect(that.element
                .find(that.options.filter + "." + UNSELECTING))
                .removeClass(UNSELECTING);


            var target = that.element.find(that.options.filter + "." + ACTIVE);
            target = target.add(that.relatedTarget(target));

            that.value(target);
            that._lastActive = that._downTarget;
            that._items = null;
        },

        _invalidateSelectables: function(position, ctrlKey) {
            var idx,
                length,
                target = this._downTarget[0],
                items = this._items,
                related,
                toSelect;

            for (idx = 0, length = items.length; idx < length; idx ++) {
                toSelect = items.eq(idx);
                related = toSelect.add(this.relatedTarget(toSelect));

                if (collision(toSelect, position)) {
                    if(toSelect.hasClass(SELECTED)) {
                        if(ctrlKey && target !== toSelect[0]) {
                            related.removeClass(SELECTED).addClass(UNSELECTING);
                        }
                    } else if (!toSelect.hasClass(ACTIVE) && !toSelect.hasClass(UNSELECTING)) {
                        related.addClass(ACTIVE);
                    }
                } else {
                    if (toSelect.hasClass(ACTIVE)) {
                        related.removeClass(ACTIVE);
                    } else if(ctrlKey && toSelect.hasClass(UNSELECTING)) {
                        related.removeClass(UNSELECTING).addClass(SELECTED);
                    }
                }
            }
        },

        value: function(val) {
            var that = this,
                selectElement = proxy(that._selectElement, that);

            if(val) {
                val.each(function() {
                    selectElement(this);
                });

                that._notify(CHANGE);
                return;
            }

            return that.element.find(that.options.filter + "." + SELECTED);
        },

        _firstSelectee: function() {
            var that = this,
                selected;

            if(that._lastActive !== null) {
                return that._lastActive;
            }

            selected = that.value();
            return selected.length > 0 ?
                    selected[0] :
                    that.element.find(that.options.filter)[0];
        },

        _selectElement: function(element, preventNotify) {
            var toSelect = $(element),
                isPrevented =  !preventNotify && this._notify("select", { element: element });

            toSelect.removeClass(ACTIVE);
            if(!isPrevented) {
                 toSelect.addClass(SELECTED);

                if (this.options.aria) {
                    toSelect.attr(ARIASELECTED, true);
                }
            }
        },

        _notify: function(name, args) {
            args = args || { };
            return this.trigger(name, args);
        },

        _unselect: function(element) {
            element.removeClass(SELECTED);

            if (this.options.aria) {
                element.attr(ARIASELECTED, false);
            }

            return element;
        },

        _select: function(e) {
            if (this._allowSelection(e.event.target)) {
                if (!msie || (msie && !$(kendo._activeElement()).is(INPUTSELECTOR))) {
                    e.preventDefault();
                }
            }
        },

        _allowSelection: function(target) {
            if ($(target).is(INPUTSELECTOR)) {
                this.userEvents.cancel();
                this._downTarget = null;
                return false;
            }

            return true;
        },

        resetTouchEvents: function() {
            this.userEvents.cancel();
        },

        clear: function() {
            var items = this.element.find(this.options.filter + "." + SELECTED);
            this._unselect(items);
        },

        selectRange: function(start, end) {
            var that = this,
                idx,
                tmp,
                items;

            that.clear();

            if (that.element.length > 1) {
                items = that.options.continuousItems();
            }

            if (!items || !items.length) {
                items = that.element.find(that.options.filter);
            }

            start = $.inArray($(start)[0], items);
            end = $.inArray($(end)[0], items);

            if (start > end) {
                tmp = start;
                start = end;
                end = tmp;
            }

            if (!that.options.useAllItems) {
                end += that.element.length - 1;
            }

            for (idx = start; idx <= end; idx ++ ) {
                that._selectElement(items[idx]);
            }

            that._notify(CHANGE);
        },

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);

            that.element.off(NS);

            that.userEvents.destroy();

            that._marquee = that._lastActive = that.element = that.userEvents = null;
        }
    });

    Selectable.parseOptions = function(selectable) {
        var asLowerString = typeof selectable === "string" && selectable.toLowerCase();

        return {
            multiple: asLowerString && asLowerString.indexOf("multiple") > -1,
            cell: asLowerString && asLowerString.indexOf("cell") > -1
        };
    };

    function collision(element, position) {
        if (!element.is(":visible")) {
            return false;
        }

        var elementPosition = kendo.getOffset(element),
            right = position.left + position.width,
            bottom = position.top + position.height;

        elementPosition.right = elementPosition.left + element.outerWidth();
        elementPosition.bottom = elementPosition.top + element.outerHeight();

        return !(elementPosition.left > right||
            elementPosition.right < position.left ||
            elementPosition.top > bottom ||
            elementPosition.bottom < position.top);
    }

    kendo.ui.plugin(Selectable);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "button",
    name: "Button",
    category: "web",
    description: "The Button widget displays styled buttons.",
    depends: [ "core" ]
};

(function ($, undefined) {
    var kendo = window.kendo,
        Widget = kendo.ui.Widget,
        proxy = $.proxy,
        keys = kendo.keys,
        CLICK = "click",
        KBUTTON = "k-button",
        KBUTTONICON = "k-button-icon",
        KBUTTONICONTEXT = "k-button-icontext",
        NS = ".kendoButton",
        DISABLED = "disabled",
        DISABLEDSTATE = "k-state-disabled",
        FOCUSEDSTATE = "k-state-focused",
        SELECTEDSTATE = "k-state-selected";

    var Button = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            element = that.wrapper = that.element;
            options = that.options;

            element.addClass(KBUTTON).attr("role", "button");

            options.enable = options.enable && !element.attr(DISABLED);
            that.enable(options.enable);

            that._tabindex();

            that._graphics();

            element
                .on(CLICK + NS, proxy(that._click, that))
                .on("focus" + NS, proxy(that._focus, that))
                .on("blur" + NS, proxy(that._blur, that))
                .on("keydown" + NS, proxy(that._keydown, that))
                .on("keyup" + NS, proxy(that._keyup, that));

            kendo.notify(that);
        },
        
        destroy: function() {
			var that = this;
			
			that.wrapper.off(NS);
			
			Widget.fn.destroy.call(that);
		},

        events: [
            CLICK
        ],

        options: {
            name: "Button",
            icon: "",
            spriteCssClass: "",
            imageUrl: "",
            enable: true
        },

        _isNativeButton: function() {
            return this.element.prop("tagName").toLowerCase() == "button";
        },

        _click: function(e) {
            if (this.options.enable) {
                if (this.trigger(CLICK, { event: e })) {
                    e.preventDefault();
                }
            }
        },

        _focus: function() {
            if (this.options.enable) {
                this.element.addClass(FOCUSEDSTATE);
            }
        },

        _blur: function() {
            this.element.removeClass(FOCUSEDSTATE);
        },

        _keydown: function(e) {
            var that = this;
            if (!that._isNativeButton()) {
                if (e.keyCode == keys.ENTER || e.keyCode == keys.SPACEBAR) {
                    if (e.keyCode == keys.SPACEBAR) {
                        e.preventDefault();
                        if (that.options.enable) {
                            that.element.addClass(SELECTEDSTATE);
                        }
                    }
                    that._click(e);
                }
            }
        },

        _keyup: function() {
            this.element.removeClass(SELECTEDSTATE);
        },

        _graphics: function() {
            var that = this,
                element = that.element,
                options = that.options,
                icon = options.icon,
                spriteCssClass = options.spriteCssClass,
                imageUrl = options.imageUrl,
                span, img, isEmpty;

            if (spriteCssClass || imageUrl || icon) {
                isEmpty = true;

                element.contents().not("span.k-sprite").not("span.k-icon").not("img.k-image").each(function(idx, el){
                    if (el.nodeType == 1 || el.nodeType == 3 && $.trim(el.nodeValue).length > 0) {
                        isEmpty = false;
                    }
                });

                if (isEmpty) {
                    element.addClass(KBUTTONICON);
                } else {
                    element.addClass(KBUTTONICONTEXT);
                }
            }

            if (icon) {
                span = element.children("span.k-icon").first();
                if (!span[0]) {
                    span = $('<span class="k-icon"></span>').prependTo(element);
                }
                span.addClass("k-i-" + icon);
            } else if (spriteCssClass) {
                span = element.children("span.k-sprite").first();
                if (!span[0]) {
                    span = $('<span class="k-sprite"></span>').prependTo(element);
                }
                span.addClass(spriteCssClass);
            } else if (imageUrl) {
                img = element.children("img.k-image").first();
                if (!img[0]) {
                    img = $('<img alt="icon" class="k-image" />').prependTo(element);
                }
                img.attr("src", imageUrl);
            }
        },

        enable: function(enable) {
            var that = this,
                element = that.element;

            if (enable === undefined) {
                enable = true;
            }

            enable = !!enable;
            that.options.enable = enable;
            element.toggleClass(DISABLEDSTATE, !enable)
                   .attr("aria-disabled", !enable)
                   .attr(DISABLED, !enable);
            // prevent 'Unspecified error' in IE when inside iframe
            try {
                element.blur();
            } catch (err) {
            }
        }
    });

    kendo.ui.plugin(Button);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.data" ], f);
})(function(){

var __meta__ = {
    id: "pager",
    name: "Pager",
    category: "framework",
    depends: [ "data" ],
    advanced: true
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        proxy = $.proxy,
        FIRST = ".k-i-seek-w",
        LAST = ".k-i-seek-e",
        PREV = ".k-i-arrow-w",
        NEXT = ".k-i-arrow-e",
        CHANGE = "change",
        NS = ".kendoPager",
        CLICK = "click",
        KEYDOWN = "keydown",
        DISABLED = "disabled",
        iconTemplate = kendo.template('<a href="\\#" title="#=text#" class="k-link k-pager-nav #= wrapClassName #"><span class="k-icon #= className #">#=text#</span></a>');

    function button(template, idx, text, numeric, title) {
        return template( {
            idx: idx,
            text: text,
            ns: kendo.ns,
            numeric: numeric,
            title: title || ""
        });
    }

    function icon(className, text, wrapClassName) {
        return iconTemplate({
            className: className.substring(1),
            text: text,
            wrapClassName: wrapClassName || ""
        });
    }

    function update(element, selector, page, disabled) {
       element.find(selector)
              .parent()
              .attr(kendo.attr("page"), page)
              .attr("tabindex", -1)
              .toggleClass("k-state-disabled", disabled);
    }

    function first(element, page) {
        update(element, FIRST, 1, page <= 1);
    }

    function prev(element, page) {
        update(element, PREV, Math.max(1, page - 1), page <= 1);
    }

    function next(element, page, totalPages) {
        update(element, NEXT, Math.min(totalPages, page + 1), page >= totalPages);
    }

    function last(element, page, totalPages) {
        update(element, LAST, totalPages, page >= totalPages);
    }

    var Pager = Widget.extend( {
        init: function(element, options) {
            var that = this, page, totalPages;

            Widget.fn.init.call(that, element, options);

            options = that.options;
            that.dataSource = kendo.data.DataSource.create(options.dataSource);
            that.linkTemplate = kendo.template(that.options.linkTemplate);
            that.selectTemplate = kendo.template(that.options.selectTemplate);
            that.currentPageTemplate = kendo.template(that.options.currentPageTemplate);

            page = that.page();
            totalPages = that.totalPages();

            that._refreshHandler = proxy(that.refresh, that);

            that.dataSource.bind(CHANGE, that._refreshHandler);

            if (options.previousNext) {
                if (!that.element.find(FIRST).length) {
                    that.element.append(icon(FIRST, options.messages.first, "k-pager-first"));

                    first(that.element, page, totalPages);
                }

                if (!that.element.find(PREV).length) {
                    that.element.append(icon(PREV, options.messages.previous));

                    prev(that.element, page, totalPages);
                }
            }

            if (options.numeric) {
                that.list = that.element.find(".k-pager-numbers");

                if (!that.list.length) {
                   that.list = $('<ul class="k-pager-numbers k-reset" />').appendTo(that.element);
                }
            }

            if (options.input) {
                if (!that.element.find(".k-pager-input").length) {
                   that.element.append('<span class="k-pager-input k-label">'+
                       options.messages.page +
                       '<input class="k-textbox">' +
                       kendo.format(options.messages.of, totalPages) +
                       '</span>');
                }

                that.element.on(KEYDOWN + NS, ".k-pager-input input", proxy(that._keydown, that));
            }

            if (options.previousNext) {
                if (!that.element.find(NEXT).length) {
                    that.element.append(icon(NEXT, options.messages.next));

                    next(that.element, page, totalPages);
                }

                if (!that.element.find(LAST).length) {
                    that.element.append(icon(LAST, options.messages.last, "k-pager-last"));

                    last(that.element, page, totalPages);
                }
            }

            if (options.pageSizes){
                if (!that.element.find(".k-pager-sizes").length){
                     $('<span class="k-pager-sizes k-label"><select/>' + options.messages.itemsPerPage + "</span>")
                        .appendTo(that.element)
                        .find("select")
                        .html($.map($.isArray(options.pageSizes) ? options.pageSizes : [5,10,20], function(page){
                            return "<option>" + page + "</option>";
                        }).join(""))
                        .end()
                        .appendTo(that.element);
                }

                that.element.find(".k-pager-sizes select").val(that.pageSize());

                if (kendo.ui.DropDownList) {
                   that.element.find(".k-pager-sizes select").show().kendoDropDownList();
                }

                that.element.on(CHANGE + NS, ".k-pager-sizes select", proxy(that._change, that));
            }

            if (options.refresh) {
                if (!that.element.find(".k-pager-refresh").length) {
                    that.element.append('<a href="#" class="k-pager-refresh k-link" title="' + options.messages.refresh +
                        '"><span class="k-icon k-i-refresh">' + options.messages.refresh + "</span></a>");
                }

                that.element.on(CLICK + NS, ".k-pager-refresh", proxy(that._refreshClick, that));
            }

            if (options.info) {
                if (!that.element.find(".k-pager-info").length) {
                    that.element.append('<span class="k-pager-info k-label" />');
                }
            }

            that.element
                .on(CLICK + NS , "a", proxy(that._click, that))
                .addClass("k-pager-wrap k-widget");

            that.element.on(CLICK + NS , ".k-current-page", proxy(that._toggleActive, that));

            if (options.autoBind) {
                that.refresh();
            }

            kendo.notify(that);
        },

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);

            that.element.off(NS);
            that.dataSource.unbind(CHANGE, that._refreshHandler);
            that._refreshHandler = null;

            kendo.destroy(that.element);
            that.element = that.list = null;
        },

        events: [
            CHANGE
        ],

        options: {
            name: "Pager",
            selectTemplate: '<li><span class="k-state-selected">#=text#</span></li>',
            currentPageTemplate: '<li class="k-current-page"><span class="k-link k-pager-nav">#=text#</span></li>',
            linkTemplate: '<li><a tabindex="-1" href="\\#" class="k-link" data-#=ns#page="#=idx#" #if (title !== "") {# title="#=title#" #}#>#=text#</a></li>',
            buttonCount: 10,
            autoBind: true,
            numeric: true,
            info: true,
            input: false,
            previousNext: true,
            pageSizes: false,
            refresh: false,
            messages: {
                display: "{0} - {1} of {2} items",
                empty: "No items to display",
                page: "Page",
                of: "of {0}",
                itemsPerPage: "items per page",
                first: "Go to the first page",
                previous: "Go to the previous page",
                next: "Go to the next page",
                last: "Go to the last page",
                refresh: "Refresh",
                morePages: "More pages"
            }
        },

        setDataSource: function(dataSource) {
            var that = this;

            that.dataSource.unbind(CHANGE, that._refreshHandler);
            that.dataSource = that.options.dataSource = dataSource;
            dataSource.bind(CHANGE, that._refreshHandler);

            if (that.options.autoBind) {
                dataSource.fetch();
            }
        },

        refresh: function(e) {
            var that = this,
                idx,
                end,
                start = 1,
                reminder,
                page = that.page(),
                html = "",
                options = that.options,
                pageSize = that.pageSize(),
                total = that.dataSource.total(),
                totalPages = that.totalPages(),
                linkTemplate = that.linkTemplate,
                buttonCount = options.buttonCount;

            if (e && e.action == "itemchange") {
                return;
            }

            if (options.numeric) {

                if (page > buttonCount) {
                    reminder = (page % buttonCount);

                    start = (reminder === 0) ? (page - buttonCount) + 1 : (page - reminder) + 1;
                }

                end = Math.min((start + buttonCount) - 1, totalPages);

                if (start > 1) {
                    html += button(linkTemplate, start - 1, "...", false, options.messages.morePages);
                }

                for (idx = start; idx <= end; idx++) {
                    html += button(idx == page ? that.selectTemplate : linkTemplate, idx, idx, true);
                }

                if (end < totalPages) {
                    html += button(linkTemplate, idx, "...", false, options.messages.morePages);
                }

                if (html === "") {
                    html = that.selectTemplate({ text: 0 });
                }

                html = this.currentPageTemplate({ text: page }) + html;

                that.list.removeClass("k-state-expanded").html(html);
            }

            if (options.info) {
                if (total > 0) {
                    html = kendo.format(options.messages.display,
                        (page - 1) * pageSize + 1, // first item in the page
                        Math.min(page * pageSize, total), // last item in the page
                    total);
                } else {
                    html = options.messages.empty;
                }

                that.element.find(".k-pager-info").html(html);
            }

            if (options.input) {
                that.element
                    .find(".k-pager-input")
                    .html(that.options.messages.page +
                        '<input class="k-textbox">' +
                        kendo.format(options.messages.of, totalPages))
                    .find("input")
                    .val(page)
                    .attr(DISABLED, total < 1)
                    .toggleClass("k-state-disabled", total < 1);
            }

            if (options.previousNext) {
                first(that.element, page, totalPages);

                prev(that.element, page, totalPages);

                next(that.element, page, totalPages);

                last(that.element, page, totalPages);
            }

            if (options.pageSizes) {
                that.element
                    .find(".k-pager-sizes select")
                    .val(pageSize)
                    .filter("[" + kendo.attr("role") + "=dropdownlist]")
                    .kendoDropDownList("value", pageSize)
                    .kendoDropDownList("text", pageSize); // handles custom values
            }
        },

        _keydown: function(e) {
            if (e.keyCode === kendo.keys.ENTER) {
                var input = this.element.find(".k-pager-input").find("input"),
                    page = parseInt(input.val(), 10);

                if (isNaN(page) || page < 1 || page > this.totalPages()) {
                    page = this.page();
                }

                input.val(page);

                this.page(page);
            }
        },

        _refreshClick: function(e) {
            e.preventDefault();

            this.dataSource.read();
        },

        _change: function(e) {
            var pageSize = parseInt(e.currentTarget.value, 10);

            if (!isNaN(pageSize)){
               this.dataSource.pageSize(pageSize);
            }
        },

        _toggleActive: function(e) {
            this.list.toggleClass("k-state-expanded");
        },

        _click: function(e) {
            var target = $(e.currentTarget);

            e.preventDefault();

            if (!target.is(".k-state-disabled")) {
                this.page(target.attr(kendo.attr("page")));
            }
        },

        totalPages: function() {
            return Math.ceil((this.dataSource.total() || 0) / this.pageSize());
        },

        pageSize: function() {
            return this.dataSource.pageSize() || this.dataSource.total();
        },

        page: function(page) {
            if (page !== undefined) {
                this.dataSource.page(page);

                this.trigger(CHANGE, { index: page });
            } else {
                if (this.dataSource.total() > 0) {
                    return this.dataSource.page();
                } else {
                    return 0;
                }
            }
        }
    });

    ui.plugin(Pager);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "popup",
    name: "Pop-up",
    category: "framework",
    depends: [ "core" ],
    advanced: true
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        support = kendo.support,
        getOffset = kendo.getOffset,
        activeElement = kendo._activeElement,
        OPEN = "open",
        CLOSE = "close",
        DEACTIVATE = "deactivate",
        ACTIVATE = "activate",
        CENTER = "center",
        LEFT = "left",
        RIGHT = "right",
        TOP = "top",
        BOTTOM = "bottom",
        ABSOLUTE = "absolute",
        HIDDEN = "hidden",
        BODY = "body",
        LOCATION = "location",
        POSITION = "position",
        VISIBLE = "visible",
        EFFECTS = "effects",
        ACTIVE = "k-state-active",
        ACTIVEBORDER = "k-state-border",
        ACTIVEBORDERREGEXP = /k-state-border-(\w+)/,
        ACTIVECHILDREN = ".k-picker-wrap, .k-dropdown-wrap, .k-link",
        MOUSEDOWN = "down",
        DOCUMENT_ELEMENT = $(document.documentElement),
        WINDOW = $(window),
        SCROLL = "scroll",
        RESIZE_SCROLL = "resize scroll",
        cssPrefix = support.transitions.css,
        TRANSFORM = cssPrefix + "transform",
        extend = $.extend,
        NS = ".kendoPopup",
        styles = ["font-size",
                  "font-family",
                  "font-stretch",
                  "font-style",
                  "font-weight",
                  "line-height"];

    function contains(container, target) {
        return container === target || $.contains(container, target);
    }

    var Popup = Widget.extend({
        init: function(element, options) {
            var that = this, parentPopup;

            options = options || {};

            if (options.isRtl) {
                options.origin = options.origin || BOTTOM + " " + RIGHT;
                options.position = options.position || TOP + " " + RIGHT;
            }

            Widget.fn.init.call(that, element, options);

            element = that.element;
            options = that.options;

            that.collisions = options.collision ? options.collision.split(" ") : [];
            that.downEvent = kendo.applyEventMap(MOUSEDOWN, kendo.guid());

            if (that.collisions.length === 1) {
                that.collisions.push(that.collisions[0]);
            }

            parentPopup = $(that.options.anchor).closest(".k-popup,.k-group").filter(":not([class^=km-])"); // When popup is in another popup, make it relative.
            options.appendTo = $($(options.appendTo)[0] || parentPopup[0] || BODY);

            that.element.hide()
                .addClass("k-popup k-group k-reset")
                .toggleClass("k-rtl", !!options.isRtl)
                .css({ position : ABSOLUTE })
                .appendTo(options.appendTo)
                .on("mouseenter" + NS, function() {
                    that._hovered = true;
                })
                .on("mouseleave" + NS, function() {
                    that._hovered = false;
                });

            that.wrapper = $();

            if (options.animation === false) {
                options.animation = { open: { effects: {} }, close: { hide: true, effects: {} } };
            }

            extend(options.animation.open, {
                complete: function() {
                    that.wrapper.css({ overflow: VISIBLE }); // Forcing refresh causes flickering in mobile.
                    that._activated = true;
                    that._trigger(ACTIVATE);
                }
            });

            extend(options.animation.close, {
                complete: function() {
                    that._animationClose();
                }
            });

            that._mousedownProxy = function(e) {
                that._mousedown(e);
            };

            that._resizeProxy = function(e) {
                that._resize(e);
            };

            if (options.toggleTarget) {
                $(options.toggleTarget).on(options.toggleEvent + NS, $.proxy(that.toggle, that));
            }
        },

        events: [
            OPEN,
            ACTIVATE,
            CLOSE,
            DEACTIVATE
        ],

        options: {
            name: "Popup",
            toggleEvent: "click",
            origin: BOTTOM + " " + LEFT,
            position: TOP + " " + LEFT,
            anchor: BODY,
            appendTo: null,
            collision: "flip fit",
            viewport: window,
            copyAnchorStyles: true,
            autosize: false,
            modal: false,
            adjustSize: {
                width: 0,
                height: 0
            },
            animation: {
                open: {
                    effects: "slideIn:down",
                    transition: true,
                    duration: 200
                },
                close: { // if close animation effects are defined, they will be used instead of open.reverse
                    duration: 100,
                    hide: true
                }
            }
        },

        _animationClose: function() {
            var that = this,
                options = that.options;

            that.wrapper.hide();

            var location = that.wrapper.data(LOCATION),
                anchor = $(options.anchor),
                direction, dirClass;

            if (location) {
                that.wrapper.css(location);
            }

            if (options.anchor != BODY) {
                direction = ((anchor.attr("class") || "").match(ACTIVEBORDERREGEXP) || ["", "down"])[1];
                dirClass = ACTIVEBORDER + "-" + direction;

                anchor
                    .removeClass(dirClass)
                    .children(ACTIVECHILDREN)
                    .removeClass(ACTIVE)
                    .removeClass(dirClass);

                that.element.removeClass(ACTIVEBORDER + "-" + kendo.directions[direction].reverse);
            }

            that._closing = false;
            that._trigger(DEACTIVATE);
        },

        destroy: function() {
            var that = this,
                options = that.options,
                element = that.element.off(NS),
                parent;

            Widget.fn.destroy.call(that);

            if (options.toggleTarget) {
                $(options.toggleTarget).off(NS);
            }

            if (!options.modal) {
                DOCUMENT_ELEMENT.unbind(that.downEvent, that._mousedownProxy);
                that._scrollableParents().unbind(SCROLL, that._resizeProxy);
                WINDOW.unbind(RESIZE_SCROLL, that._resizeProxy);
            }

            kendo.destroy(that.element.children());
            element.removeData();

            if (options.appendTo[0] === document.body) {
                parent = element.parent(".k-animation-container");

                if (parent[0]) {
                    parent.remove();
                } else {
                    element.remove();
                }
            }
        },

        open: function(x, y) {
            var that = this,
                fixed = { isFixed: !isNaN(parseInt(y,10)), x: x, y: y },
                element = that.element,
                options = that.options,
                direction = "down",
                animation, wrapper,
                anchor = $(options.anchor),
                mobile = element[0] && element.hasClass("km-widget");

            if (!that.visible()) {
                if (options.copyAnchorStyles) {
                    if (mobile && styles[0] == "font-size") {
                        styles.shift();
                    }
                    element.css(kendo.getComputedStyles(anchor[0], styles));
                }

                if (element.data("animating") || that._trigger(OPEN)) {
                    return;
                }

                that._activated = false;

                if (!options.modal) {
                    DOCUMENT_ELEMENT.unbind(that.downEvent, that._mousedownProxy)
                                .bind(that.downEvent, that._mousedownProxy);

                    // this binding hangs iOS in editor
                    if (!(support.mobileOS.ios || support.mobileOS.android)) {
                        // all elements in IE7/8 fire resize event, causing mayhem
                        that._scrollableParents()
                            .unbind(SCROLL, that._resizeProxy)
                            .bind(SCROLL, that._resizeProxy);
                        WINDOW.unbind(RESIZE_SCROLL, that._resizeProxy)
                              .bind(RESIZE_SCROLL, that._resizeProxy);
                    }
                }

                that.wrapper = wrapper = kendo.wrap(element, options.autosize)
                                        .css({
                                            overflow: HIDDEN,
                                            display: "block",
                                            position: ABSOLUTE
                                        });

                if (support.mobileOS.android) {
                    wrapper.css(TRANSFORM, "translatez(0)"); // Android is VERY slow otherwise. Should be tested in other droids as well since it may cause blur.
                }

                wrapper.css(POSITION);

                if ($(options.appendTo)[0] == document.body) {
                    wrapper.css(TOP, "-10000px");
                }

                animation = extend(true, {}, options.animation.open);
                that.flipped = that._position(fixed);
                animation.effects = kendo.parseEffects(animation.effects, that.flipped);

                direction = animation.effects.slideIn ? animation.effects.slideIn.direction : direction;

                if (options.anchor != BODY) {
                    var dirClass = ACTIVEBORDER + "-" + direction;

                    element.addClass(ACTIVEBORDER + "-" + kendo.directions[direction].reverse);

                    anchor
                        .addClass(dirClass)
                        .children(ACTIVECHILDREN)
                        .addClass(ACTIVE)
                        .addClass(dirClass);
                }

                element.data(EFFECTS, animation.effects)
                       .kendoStop(true)
                       .kendoAnimate(animation);
            }
        },

        position: function() {
            if (this.visible()) {
                this._position();
            }
        },

        toggle: function() {
            var that = this;

            that[that.visible() ? CLOSE : OPEN]();
        },

        visible: function() {
            return this.element.is(":" + VISIBLE);
        },

        close: function(skipEffects) {
            var that = this,
                options = that.options, wrap,
                animation, openEffects, closeEffects;

            if (that.visible()) {
                wrap = (that.wrapper[0] ? that.wrapper : kendo.wrap(that.element).hide());

                if (that._closing || that._trigger(CLOSE)) {
                    return;
                }

                // Close all inclusive popups.
                that.element.find(".k-popup").each(function () {
                    var that = $(this),
                        popup = that.data("kendoPopup");

                    if (popup) {
                        popup.close(skipEffects);
                    }
                });

                DOCUMENT_ELEMENT.unbind(that.downEvent, that._mousedownProxy);
                that._scrollableParents().unbind(SCROLL, that._resizeProxy);
                WINDOW.unbind(RESIZE_SCROLL, that._resizeProxy);

                if (skipEffects) {
                    animation = { hide: true, effects: {} };
                } else {
                    animation = extend(true, {}, options.animation.close);
                    openEffects = that.element.data(EFFECTS);
                    closeEffects = animation.effects;

                    if (!closeEffects && !kendo.size(closeEffects) && openEffects && kendo.size(openEffects)) {
                        animation.effects = openEffects;
                        animation.reverse = true;
                    }

                    that._closing = true;
                }

                that.element.kendoStop(true);
                wrap.css({ overflow: HIDDEN }); // stop callback will remove hidden overflow
                that.element.kendoAnimate(animation);
            }
        },

        _trigger: function(ev) {
            return this.trigger(ev, { type: ev });
        },

        _resize: function(e) {
            var that = this;

            if (e.type === "resize") {
                clearTimeout(that._resizeTimeout);
                that._resizeTimeout = setTimeout(function() {
                    that._position();
                    that._resizeTimeout = null;
                }, 50);
            } else {
                if (!that._hovered || (that._activated && that.element.hasClass("k-list-container"))) {
                    that.close();
                }
            }
        },

        _mousedown: function(e) {
            var that = this,
                container = that.element[0],
                options = that.options,
                anchor = $(options.anchor)[0],
                toggleTarget = options.toggleTarget,
                target = kendo.eventTarget(e),
                popup = $(target).closest(".k-popup"),
                mobile = popup.parent().parent(".km-shim").length;

            popup = popup[0];
            if (!mobile && popup && popup !== that.element[0]){
                return;
            }

            // This MAY result in popup not closing in certain cases.
            if ($(e.target).closest("a").data("rel") === "popover") {
                return;
            }

            if (!contains(container, target) && !contains(anchor, target) && !(toggleTarget && contains($(toggleTarget)[0], target))) {
                that.close();
            }
        },

        _fit: function(position, size, viewPortSize) {
            var output = 0;

            if (position + size > viewPortSize) {
                output = viewPortSize - (position + size);
            }

            if (position < 0) {
                output = -position;
            }

            return output;
        },

        _flip: function(offset, size, anchorSize, viewPortSize, origin, position, boxSize) {
            var output = 0;
                boxSize = boxSize || size;

            if (position !== origin && position !== CENTER && origin !== CENTER) {
                if (offset + boxSize > viewPortSize) {
                    output += -(anchorSize + size);
                }

                if (offset + output < 0) {
                    output += anchorSize + size;
                }
            }
            return output;
        },

        _scrollableParents: function() {
            return $(this.options.anchor)
                       .parentsUntil("body")
                       .filter(function(index, element) {
                            var computedStyle = kendo.getComputedStyles(element, ["overflow"]);
                            return computedStyle.overflow != "visible";
                       });
        },

        _position: function(fixed) {
            var that = this,
                //element = that.element.css(POSITION, ""), /* fixes telerik/kendo-ui-core#790, comes from telerik/kendo#615 */
                element = that.element,
                wrapper = that.wrapper,
                options = that.options,
                viewport = $(options.viewport),
                viewportOffset = viewport.offset(),
                anchor = $(options.anchor),
                origins = options.origin.toLowerCase().split(" "),
                positions = options.position.toLowerCase().split(" "),
                collisions = that.collisions,
                zoomLevel = support.zoomLevel(),
                siblingContainer, parents,
                parentZIndex, zIndex = 10002,
                isWindow = !!((viewport[0] == window) && window.innerWidth && (zoomLevel <= 1.02)),
                idx = 0,
                docEl = document.documentElement,
                length, viewportWidth, viewportHeight;

            // $(window).height() uses documentElement to get the height
            viewportWidth = isWindow ? window.innerWidth : viewport.width();
            viewportHeight = isWindow ? window.innerHeight : viewport.height();
            
            if (isWindow && docEl.scrollHeight - docEl.clientHeight > 0) {
                viewportWidth -= kendo.support.scrollbar();
            }

            siblingContainer = anchor.parents().filter(wrapper.siblings());

            if (siblingContainer[0]) {
                parentZIndex = Math.max(Number(siblingContainer.css("zIndex")), 0);

                // set z-index to be more than that of the container/sibling
                // compensate with more units for window z-stack
                if (parentZIndex) {
                    zIndex = parentZIndex + 10;
                } else {
                    parents = anchor.parentsUntil(siblingContainer);
                    for (length = parents.length; idx < length; idx++) {
                        parentZIndex = Number($(parents[idx]).css("zIndex"));
                        if (parentZIndex && zIndex < parentZIndex) {
                            zIndex = parentZIndex + 10;
                        }
                    }
                }
            }

            wrapper.css("zIndex", zIndex);

            if (fixed && fixed.isFixed) {
                wrapper.css({ left: fixed.x, top: fixed.y });
            } else {
                wrapper.css(that._align(origins, positions));
            }

            var pos = getOffset(wrapper, POSITION, anchor[0] === wrapper.offsetParent()[0]),
                offset = getOffset(wrapper),
                anchorParent = anchor.offsetParent().parent(".k-animation-container,.k-popup,.k-group"); // If the parent is positioned, get the current positions

            if (anchorParent.length) {
                pos = getOffset(wrapper, POSITION, true);
                offset = getOffset(wrapper);
            }

            if (viewport[0] === window) {
                offset.top -= (window.pageYOffset || document.documentElement.scrollTop || 0);
                offset.left -= (window.pageXOffset || document.documentElement.scrollLeft || 0);
            }
            else {
                offset.top -= viewportOffset.top;
                offset.left -= viewportOffset.left;
            }

            if (!that.wrapper.data(LOCATION)) { // Needed to reset the popup location after every closure - fixes the resize bugs.
                wrapper.data(LOCATION, extend({}, pos));
            }

            var offsets = extend({}, offset),
                location = extend({}, pos),
                adjustSize = options.adjustSize;

            if (collisions[0] === "fit") {
                location.top += that._fit(offsets.top, wrapper.outerHeight() + adjustSize.height, viewportHeight / zoomLevel);
            }

            if (collisions[1] === "fit") {
                location.left += that._fit(offsets.left, wrapper.outerWidth() + adjustSize.width, viewportWidth / zoomLevel);
            }

            var flipPos = extend({}, location);

            if (collisions[0] === "flip") {
                location.top += that._flip(offsets.top, element.outerHeight(), anchor.outerHeight(), viewportHeight / zoomLevel, origins[0], positions[0], wrapper.outerHeight());
            }

            if (collisions[1] === "flip") {
                location.left += that._flip(offsets.left, element.outerWidth(), anchor.outerWidth(), viewportWidth / zoomLevel, origins[1], positions[1], wrapper.outerWidth());
            }

            element.css(POSITION, ABSOLUTE);
            wrapper.css(location);

            return (location.left != flipPos.left || location.top != flipPos.top);
        },

        _align: function(origin, position) {
            var that = this,
                element = that.wrapper,
                anchor = $(that.options.anchor),
                verticalOrigin = origin[0],
                horizontalOrigin = origin[1],
                verticalPosition = position[0],
                horizontalPosition = position[1],
                anchorOffset = getOffset(anchor),
                appendTo = $(that.options.appendTo),
                appendToOffset,
                width = element.outerWidth(),
                height = element.outerHeight(),
                anchorWidth = anchor.outerWidth(),
                anchorHeight = anchor.outerHeight(),
                top = anchorOffset.top,
                left = anchorOffset.left,
                round = Math.round;

            if (appendTo[0] != document.body) {
                appendToOffset = getOffset(appendTo);
                top -= appendToOffset.top;
                left -= appendToOffset.left;
            }


            if (verticalOrigin === BOTTOM) {
                top += anchorHeight;
            }

            if (verticalOrigin === CENTER) {
                top += round(anchorHeight / 2);
            }

            if (verticalPosition === BOTTOM) {
                top -= height;
            }

            if (verticalPosition === CENTER) {
                top -= round(height / 2);
            }

            if (horizontalOrigin === RIGHT) {
                left += anchorWidth;
            }

            if (horizontalOrigin === CENTER) {
                left += round(anchorWidth / 2);
            }

            if (horizontalPosition === RIGHT) {
                left -= width;
            }

            if (horizontalPosition === CENTER) {
                left -= round(width / 2);
            }

            return {
                top: top,
                left: left
            };
        }
    });

    ui.plugin(Popup);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core", "./kendo.popup" ], f);
})(function(){

var __meta__ = {
    id: "notification",
    name: "Notification",
    category: "web",
    description: "The Notification widget displays user alerts.",
    depends: [ "core", "popup" ]
};

(function($, undefined) {
    var kendo = window.kendo,
        Widget = kendo.ui.Widget,
        proxy = $.proxy,
        extend = $.extend,
        setTimeout = window.setTimeout,
        CLICK = "click",
        SHOW = "show",
        HIDE = "hide",
        KNOTIFICATION = "k-notification",
        KICLOSE = ".k-notification-wrap .k-i-close",
        INFO = "info",
        SUCCESS = "success",
        WARNING = "warning",
        ERROR = "error",
        TOP = "top",
        LEFT = "left",
        BOTTOM = "bottom",
        RIGHT = "right",
        UP = "up",
        NS = ".kendoNotification",
        WRAPPER = '<div class="k-widget k-notification"></div>',
        TEMPLATE = '<div class="k-notification-wrap">' +
                '<span class="k-icon k-i-note">#=typeIcon#</span>' +
                '#=content#' +
                '<span class="k-icon k-i-close">Hide</span>' +
            '</div>';

    var Notification = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            options = that.options;

            if (!options.appendTo || !$(options.appendTo).is(element)) {
                that.element.hide();
            }

            that._compileTemplates(options.templates);
            that._guid = "_" + kendo.guid();
            that._isRtl = kendo.support.isRtl(element);
            that._compileStacking(options.stacking, options.position.top);

            kendo.notify(that);
        },

        events: [
            SHOW,
            HIDE
        ],

        options: {
            name: "Notification",
            position: {
                pinned: true,
                top: null,
                left: null,
                bottom: 20,
                right: 20
            },
            stacking: "default",
            hideOnClick: true,
            button: false,
            allowHideAfter: 0,
            autoHideAfter: 5000,
            appendTo: null,
            width: null,
            height: null,
            templates: [],
            animation: {
                open: {
                    effects: "fade:in",
                    duration: 300
                },
                close: {
                    effects: "fade:out",
                    duration: 600,
                    hide: true
                }
            }
        },

        _compileTemplates: function(templates) {
            var that = this;
            var kendoTemplate = kendo.template;

            that._compiled = {};

            $.each(templates, function(key, value) {
                that._compiled[value.type] = kendoTemplate(value.template || $("#" + value.templateId).html());
            });

            that._defaultCompiled = kendoTemplate(TEMPLATE);
        },

        _getCompiled: function(type) {
            var that = this;
            var defaultCompiled = that._defaultCompiled;

            return type ? that._compiled[type] || defaultCompiled : defaultCompiled;
        },

        _compileStacking: function(stacking, top) {
            var that = this,
                paddings = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
                origin, position;

            switch (stacking) {
                case "down":
                    origin = BOTTOM + " " + LEFT;
                    position = TOP + " " + LEFT;
                    delete paddings.paddingBottom;
                break;
                case RIGHT:
                    origin = TOP + " " + RIGHT;
                    position = TOP + " " + LEFT;
                    delete paddings.paddingRight;
                break;
                case LEFT:
                    origin = TOP + " " + LEFT;
                    position = TOP + " " + RIGHT;
                    delete paddings.paddingLeft;
                break;
                case UP:
                    origin = TOP + " " + LEFT;
                    position = BOTTOM + " " + LEFT;
                    delete paddings.paddingTop;
                break;
                default:
                    if (top !== null) {
                        origin = BOTTOM + " " + LEFT;
                        position = TOP + " " + LEFT;
                        delete paddings.paddingBottom;
                    } else {
                        origin = TOP + " " + LEFT;
                        position = BOTTOM + " " + LEFT;
                        delete paddings.paddingTop;
                    }
                break;
            }

            that._popupOrigin = origin;
            that._popupPosition = position;
            that._popupPaddings = paddings;
        },

        _attachPopupEvents: function(options, popup) {
            var that = this,
                allowHideAfter = options.allowHideAfter,
                attachDelay = !isNaN(allowHideAfter) && allowHideAfter > 0,
                closeIcon;

            function attachClick(target) {
                target.on(CLICK + NS, function() {
                    popup.close();
                });
            }

            if (options.hideOnClick) {
                popup.bind("activate", function(e) {
                    if (attachDelay) {
                        setTimeout(function(){
                            attachClick(popup.element);
                        }, allowHideAfter);
                    } else {
                        attachClick(popup.element);
                    }
                });
            } else if (options.button) {
                closeIcon = popup.element.find(KICLOSE);
                if (attachDelay) {
                    setTimeout(function(){
                        attachClick(closeIcon);
                    }, allowHideAfter);
                } else {
                    attachClick(closeIcon);
                }
            }
        },

        _showPopup: function(wrapper, options) {
            var that = this,
                autoHideAfter = options.autoHideAfter,
                x = options.position.left,
                y = options.position.top,
                allowHideAfter = options.allowHideAfter,
                popup, openPopup, attachClick, closeIcon;

            openPopup = $("." + that._guid).last();

            popup = new kendo.ui.Popup(wrapper, {
                anchor: openPopup[0] ? openPopup : document.body,
                origin: that._popupOrigin,
                position: that._popupPosition,
                animation: options.animation,
                modal: true,
                collision: "",
                isRtl: that._isRtl,
                close: function(e) {
                    that._triggerHide(this.element);
                },
                deactivate: function(e) {
                    e.sender.element.off(NS);
                    e.sender.element.find(KICLOSE).off(NS);
                    e.sender.destroy();
                }
            });

            that._attachPopupEvents(options, popup);

            if (openPopup[0]) {
                popup.open();
            } else {
                if (x === null) {
                    x = $(window).width() - wrapper.width() - options.position.right;
                }

                if (y === null) {
                    y = $(window).height() - wrapper.height() - options.position.bottom;
                }

                popup.open(x, y);
            }

            popup.wrapper.addClass(that._guid).css(extend({margin:0}, that._popupPaddings));

            if (options.position.pinned) {
                popup.wrapper.css("position", "fixed");
                if (openPopup[0]) {
                    that._togglePin(popup.wrapper, true);
                }
            } else if (!openPopup[0]) {
                that._togglePin(popup.wrapper, false);
            }

            if (autoHideAfter > 0) {
                setTimeout(function(){
                    popup.close();
                }, autoHideAfter);
            }
        },

        _togglePin: function(wrapper, pin) {
            var win = $(window),
                sign = pin ? -1 : 1;

            wrapper.css({
                top: parseInt(wrapper.css(TOP), 10) + sign * win.scrollTop(),
                left: parseInt(wrapper.css(LEFT), 10) + sign * win.scrollLeft()
            });
        },

        _attachStaticEvents: function(options, wrapper) {
            var that = this,
                allowHideAfter = options.allowHideAfter,
                attachDelay = !isNaN(allowHideAfter) && allowHideAfter > 0;

            function attachClick(target) {
                target.on(CLICK + NS, proxy(that._hideStatic, that, wrapper));
            }

            if (options.hideOnClick) {
                if (attachDelay) {
                    setTimeout(function(){
                        attachClick(wrapper);
                    }, allowHideAfter);
                } else {
                    attachClick(wrapper);
                }
            } else if (options.button) {
                if (attachDelay) {
                    setTimeout(function(){
                        attachClick(wrapper.find(KICLOSE));
                    }, allowHideAfter);
                } else {
                    attachClick(wrapper.find(KICLOSE));
                }
            }
        },

        _showStatic: function(wrapper, options) {
            var that = this,
                autoHideAfter = options.autoHideAfter,
                animation = options.animation,
                insertionMethod = options.stacking == UP || options.stacking == LEFT ? "prependTo" : "appendTo",
                attachClick;

            wrapper
                .addClass(that._guid)
                [insertionMethod](options.appendTo)
                .hide()
                .kendoAnimate(animation.open || false);

            that._attachStaticEvents(options, wrapper);

            if (autoHideAfter > 0) {
                setTimeout(function(){
                    that._hideStatic(wrapper);
                }, autoHideAfter);
            }
        },

        _hideStatic: function(wrapper) {
            wrapper.kendoAnimate(extend(this.options.animation.close || false, { complete: function() {
                wrapper.off(NS).find(KICLOSE).off(NS);
                wrapper.remove();
            }}));
            this._triggerHide(wrapper);
        },

        _triggerHide: function(element) {
            this.trigger(HIDE, { element: element });
            this.angular("cleanup", function(){
                return { elements: element };
            });
        },

        show: function(content, type) {
            var that = this,
                options = that.options,
                wrapper = $(WRAPPER),
                args, defaultArgs, popup;

            if (!type) {
                type = INFO;
            }

            if (content !== null && content !== undefined && content !== "") {

                if (kendo.isFunction(content)) {
                    content = content();
                }

                defaultArgs = {typeIcon: type, content: ""};

                if ($.isPlainObject(content)) {
                    args = extend(defaultArgs, content);
                } else {
                    args = extend(defaultArgs, {content: content});
                }

                wrapper
                    .addClass(KNOTIFICATION + "-" + type)
                    .toggleClass(KNOTIFICATION + "-button", options.button)
                    .attr("data-role", "alert")
                    .css({width: options.width, height: options.height})
                    .append(that._getCompiled(type)(args));

                that.angular("compile", function(){
                    return {
                        elements: wrapper,
                        data: [{ dataItem: args }]
                    };
                });

                if ($(options.appendTo)[0]) {
                    that._showStatic(wrapper, options);
                } else {
                    that._showPopup(wrapper, options);
                }

                that.trigger(SHOW, {element: wrapper});
            }

            return that;
        },

        info: function(content) {
            return this.show(content, INFO);
        },

        success: function(content) {
            return this.show(content, SUCCESS);
        },

        warning: function(content) {
            return this.show(content, WARNING);
        },

        error: function(content) {
            return this.show(content, ERROR);
        },

        hide: function() {
            var that = this,
                openedNotifications = that.getNotifications();

            if (that.options.appendTo) {
                openedNotifications.each(function(idx, element){
                    that._hideStatic($(element));
                });
            } else {
                openedNotifications.each(function(idx, element){
                    var popup = $(element).data("kendoPopup");
                    if (popup) {
                        popup.close();
                    }
                });
            }

            return that;
        },

        getNotifications: function() {
            var that = this,
                guidElements = $("." + that._guid);

            if (that.options.appendTo) {
                return guidElements;
            } else {
                return guidElements.children("." + KNOTIFICATION);
            }
        },

        setOptions: function(newOptions) {
            var that = this,
                options;

            Widget.fn.setOptions.call(that, newOptions);

            options = that.options;

            if (newOptions.templates !== undefined) {
                that._compileTemplates(options.templates);
            }

            if (newOptions.stacking !== undefined || newOptions.position !== undefined) {
                that._compileStacking(options.stacking, options.position.top);
            }
        },

        destroy: function() {
            Widget.fn.destroy.call(this);
            this.getNotifications().off(NS).find(KICLOSE).off(NS);
        }
    });

    kendo.ui.plugin(Notification);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.data", "./kendo.popup" ], f);
})(function(){

var __meta__ = {
    id: "list",
    name: "List",
    category: "framework",
    depends: [ "data", "popup" ],
    hidden: true
};

/*jshint evil: true*/
(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        keys = kendo.keys,
        support = kendo.support,
        htmlEncode = kendo.htmlEncode,
        activeElement = kendo._activeElement,
        ObservableArray = kendo.data.ObservableArray,
        ID = "id",
        LI = "li",
        CHANGE = "change",
        CHARACTER = "character",
        FOCUSED = "k-state-focused",
        HOVER = "k-state-hover",
        LOADING = "k-loading",
        OPEN = "open",
        CLOSE = "close",
        SELECT = "select",
        SELECTED = "selected",
        PROGRESS = "progress",
        REQUESTEND = "requestEnd",
        WIDTH = "width",
        extend = $.extend,
        proxy = $.proxy,
        isArray = $.isArray,
        browser = support.browser,
        isIE8 = browser.msie && browser.version < 9,
        quotRegExp = /"/g,
        alternativeNames = {
            "ComboBox": "DropDownList",
            "DropDownList": "ComboBox"
        };

    var List = kendo.ui.DataBoundWidget.extend({
        init: function(element, options) {
            var that = this,
                ns = that.ns,
                id;

            Widget.fn.init.call(that, element, options);
            element = that.element;
            options = that.options;

            that._isSelect = element.is(SELECT);

            if (that._isSelect && that.element[0].length) {
                if (!options.dataSource) {
                    options.dataTextField = options.dataTextField || "text";
                    options.dataValueField = options.dataValueField || "value";
                }
            }

            that.ul = $('<ul unselectable="on" class="k-list k-reset"/>')
                        .attr({
                            tabIndex: -1,
                            "aria-hidden": true
                        });

            that.list = $("<div class='k-list-container'/>")
                        .append(that.ul)
                        .on("mousedown" + ns, proxy(that._listMousedown, that));

            id = element.attr(ID);

            if (id) {
                that.list.attr(ID, id + "-list");
                that.ul.attr(ID, id + "_listbox");
            }

            that._header();
            that._accessors();
            that._initValue();
        },

        options: {
            valuePrimitive: false,
            headerTemplate: ""
        },

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            if (options && options.enable !== undefined) {
                options.enabled = options.enable;
            }
        },

        focus: function() {
            this._focused.focus();
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        _listOptions: function(options) {
            var currentOptions = this.options;

            options = options || {};
            options = {
                height: options.height || currentOptions.height,
                dataValueField: options.dataValueField || currentOptions.dataValueField,
                dataTextField: options.dataTextField || currentOptions.dataTextField,
                groupTemplate: options.groupTemplate || currentOptions.groupTemplate,
                fixedGroupTemplate: options.fixedGroupTemplate || currentOptions.fixedGroupTemplate,
                template: options.template || currentOptions.template
            };

            if (!options.template) {
                options.template = "#:" + kendo.expr(options.dataTextField, "data") + "#";
            }

            return options;
        },

        _initList: function() {
            var that = this;
            var options = that.options;
            var virtual = options.virtual;
            var hasVirtual = !!virtual;
            var value = options.value;

            var listBoundHandler = proxy(that._listBound, that);

            var listOptions = {
                autoBind: false,
                selectable: true,
                dataSource: that.dataSource,
                click: proxy(that._click, that),
                change: proxy(that._listChange, that),
                activate: proxy(that._activateItem, that),
                deactivate: proxy(that._deactivateItem, that),
                dataBinding: function() {
                    that.trigger("dataBinding");
                    that._angularItems("cleanup");
                },
                dataBound: listBoundHandler,
                listBound: listBoundHandler,
                selectedItemChange: proxy(that._listChange, that)
            };

            listOptions = $.extend(that._listOptions(), listOptions, typeof virtual === "object" ? virtual : {});

            if (!hasVirtual) {
                that.listView = new kendo.ui.StaticList(that.ul, listOptions);
                that.listView.setTouchScroller(that._touchScroller);
            } else {
                that.listView = new kendo.ui.VirtualList(that.ul, listOptions);
            }

            if (value !== undefined) {
                that.listView.value(value).done(function() {
                    var text = options.text;

                    if (!that.listView.filter() && that.input) {
                        if (that.selectedIndex === -1) {
                            if (text === undefined || text === null) {
                                text = value;
                            }

                            that._accessor(value);
                            that.input.val(text);
                        } else if (that._oldIndex === -1) {
                            that._oldIndex = that.selectedIndex;
                        }
                    }
                });
            }
        },

        _listMousedown: function(e) {
            if (!this.filterInput || this.filterInput[0] !== e.target) {
                e.preventDefault();
            }
        },

        _filterSource: function(filter, force) {
            var that = this;
            var options = that.options;
            var dataSource = that.dataSource;
            var expression = extend({}, dataSource.filter() || {});

            var removed = removeFiltersForField(expression, options.dataTextField);

            if ((filter || removed) && that.trigger("filtering", { filter: filter })) {
                return;
            }

            if (filter) {
                expression = expression.filters || [];
                expression.push(filter);
            }

            if (!force) {
                dataSource.filter(expression);
            } else {
                dataSource.read(expression);
            }
        },

        //TODO: refactor
        _header: function() {
            var that = this;
            var template = that.options.headerTemplate;
            var header;

            if ($.isFunction(template)) {
                template = template({});
            }

            if (template) {
                that.list.prepend(template);

                header = that.ul.prev();

                that.header = header[0] ? header : null;
                if (that.header) {
                    that.angular("compile", function(){
                        return { elements: that.header };
                    });
                }
            }
        },

        _initValue: function() {
            var that = this,
                value = that.options.value;

            if (value !== null) {
                that.element.val(value);
            } else {
                value = that._accessor();
                that.options.value = value;
            }

            that._old = value;
        },

        _ignoreCase: function() {
            var that = this,
                model = that.dataSource.reader.model,
                field;

            if (model && model.fields) {
                field = model.fields[that.options.dataTextField];

                if (field && field.type && field.type !== "string") {
                    that.options.ignoreCase = false;
                }
            }
        },

        _focus: function(candidate) {
            return this.listView.focus(candidate);
        },

        current: function(candidate) {
            return this._focus(candidate);
        },

        items: function() {
            return this.ul[0].children;
        },

        destroy: function() {
            var that = this;
            var ns = that.ns;

            Widget.fn.destroy.call(that);

            that._unbindDataSource();

            that.listView.destroy();
            that.list.off(ns);

            if (that._touchScroller) {
                that._touchScroller.destroy();
            }

            that.popup.destroy();

            if (that._form) {
                that._form.off("reset", that._resetHandler);
            }
        },

        dataItem: function(index) {
            var that = this;

            if (index === undefined) {
                return that.listView.selectedDataItems()[0];
            }

            if (typeof index !== "number") {
                index = $(that.items()).index(index);
            }

            return that.dataSource.flatView()[index];
        },

        _activateItem: function() {
            var current = this.listView.focus();
            if (current) {
                this._focused.add(this.filterInput).attr("aria-activedescendant", current.attr("id"));
            }
        },

        _deactivateItem: function() {
            this._focused.add(this.filterInput).removeAttr("aria-activedescendant");
        },

        _accessors: function() {
            var that = this;
            var element = that.element;
            var options = that.options;
            var getter = kendo.getter;
            var textField = element.attr(kendo.attr("text-field"));
            var valueField = element.attr(kendo.attr("value-field"));

            if (!options.dataTextField && textField) {
                options.dataTextField = textField;
            }

            if (!options.dataValueField && valueField) {
                options.dataValueField = valueField;
            }

            that._text = getter(options.dataTextField);
            that._value = getter(options.dataValueField);
        },

        _aria: function(id) {
            var that = this,
                options = that.options,
                element = that._focused.add(that.filterInput);

            if (options.suggest !== undefined) {
                element.attr("aria-autocomplete", options.suggest ? "both" : "list");
            }

            id = id ? id + " " + that.ul[0].id : that.ul[0].id;

            element.attr("aria-owns", id);

            that.ul.attr("aria-live", !options.filter || options.filter === "none" ? "off" : "polite");
        },

        _blur: function() {
            var that = this;

            that._change();
            that.close();
        },

        _change: function() {
            var that = this;
            var index = that.selectedIndex;
            var optionValue = that.options.value;
            var value = that.value();
            var trigger;

            if (that._isSelect && !that.listView.isBound() && optionValue) {
                value = optionValue;
            }

            if (value !== that._old) {
                trigger = true;
            } else if (index !== undefined && index !== that._oldIndex) {
                trigger = true;
            }

            if (trigger) {
                that._old = value;
                that._oldIndex = index;

                if (!that._typing) {
                    // trigger the DOM change event so any subscriber gets notified
                    that.element.trigger(CHANGE);
                }

                that.trigger(CHANGE);
            }

            that.typing = false;
        },

        _data: function() {
            return this.dataSource.view();
        },

        _enable: function() {
            var that = this,
                options = that.options,
                disabled = that.element.is("[disabled]");

            if (options.enable !== undefined) {
                options.enabled = options.enable;
            }

            if (!options.enabled || disabled) {
                that.enable(false);
            } else {
                that.readonly(that.element.is("[readonly]"));
            }
        },

        _dataValue: function(dataItem) {
            var value = this._value(dataItem);

            if (value === undefined) {
                value = this._text(dataItem);
            }

            return value;
        },

        _height: function(length) {
            var that = this;
            var list = that.list;
            var height = that.options.height;
            var visible = that.popup.visible();
            var offsetTop;
            var popups;

            if (length) {
                popups = list.add(list.parent(".k-animation-container")).show();

                height = that.ul[0].scrollHeight > height ? height : "auto";

                popups.height(height);

                if (height !== "auto") {
                    offsetTop = that.ul[0].offsetTop;

                    if (offsetTop) {
                        height = list.height() - offsetTop;
                    }
                }

                that.ul.height(height);

                if (!visible) {
                    popups.hide();
                }
            }

            return height;
        },

        _adjustListWidth: function() {
            var list = this.list,
                width = list[0].style.width,
                wrapper = this.wrapper,
                computedStyle, computedWidth;

            if (!list.data(WIDTH) && width) {
                return;
            }

            computedStyle = window.getComputedStyle ? window.getComputedStyle(wrapper[0], null) : 0;
            computedWidth = computedStyle ? parseFloat(computedStyle.width) : wrapper.outerWidth();

            if (computedStyle && browser.msie) { // getComputedStyle returns different box in IE.
                computedWidth += parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight) + parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
            }

            if (list.css("box-sizing") !== "border-box") {
                width = computedWidth - (list.outerWidth() - list.width());
            } else {
                width = computedWidth;
            }

            list.css({
                fontFamily: wrapper.css("font-family"),
                width: width
            })
            .data(WIDTH, width);

            return true;
        },

        _openHandler: function(e) {
            this._adjustListWidth();

            if (this.trigger(OPEN)) {
                e.preventDefault();
            } else {
                this._focused.attr("aria-expanded", true);
                this.ul.attr("aria-hidden", false);
            }
        },

        _closeHandler: function(e) {
            if (this.trigger(CLOSE)) {
                e.preventDefault();
            } else {
                this._focused.attr("aria-expanded", false);
                this.ul.attr("aria-hidden", true);
            }
        },

        _focusItem: function() {
            var listView = this.listView;
            var focusedItem = listView.focus();
            var index = listView.select();

            index = index[index.length - 1];

            if (index === undefined && this.options.highlightFirst && !focusedItem) {
                index = 0;
            }

            if (index !== undefined) {
                listView.focus(index);
            } else {
                listView.scrollToIndex(0);
            }
        },

        _calculateGroupPadding: function(height) {
            var ul = this.ul;
            var li = ul.children(".k-first:first");
            var groupHeader = ul.prev(".k-group-header");
            var padding = 0;

            if (groupHeader[0] && groupHeader[0].style.display !== "none") {
                if (height !== "auto") {
                    padding = kendo.support.scrollbar();
                }

                padding += parseFloat(li.css("border-right-width"), 10) + parseFloat(li.children(".k-group").css("padding-right"), 10);

                groupHeader.css("padding-right", padding);
            }
        },

        _firstOpen: function() {
            var height = this._height(this.dataSource.flatView().length);
            this._calculateGroupPadding(height);
        },

        _popup: function() {
            var that = this;

            that.popup = new ui.Popup(that.list, extend({}, that.options.popup, {
                anchor: that.wrapper,
                open: proxy(that._openHandler, that),
                close: proxy(that._closeHandler, that),
                animation: that.options.animation,
                isRtl: support.isRtl(that.wrapper)
            }));

            if (!that.options.virtual) {
                that.popup.one(OPEN, proxy(that._firstOpen, that));
            }

            that._touchScroller = kendo.touchScroller(that.popup.element);
        },

        _makeUnselectable: function() {
            if (isIE8) {
                this.list.find("*").not(".k-textbox").attr("unselectable", "on");
            }
        },

        _toggleHover: function(e) {
            $(e.currentTarget).toggleClass(HOVER, e.type === "mouseenter");
        },

        _toggle: function(open, preventFocus) {
            var that = this;
            var touchEnabled = support.mobileOS && (support.touch || support.MSPointers || support.pointers);

            open = open !== undefined? open : !that.popup.visible();

            if (!preventFocus && !touchEnabled && that._focused[0] !== activeElement()) {
                that._prevent = true;
                that._focused.focus();
                that._prevent = false;
            }

            that[open ? OPEN : CLOSE]();
        },

        _triggerCascade: function() {
            var that = this;

            if (!that._cascadeTriggered || that._old !== that.value() || that._oldIndex !== that.selectedIndex) {
                that._cascadeTriggered = true;
                that.trigger("cascade", { userTriggered: that._userTriggered });
            }
        },

        _unbindDataSource: function() {
            var that = this;

            that.dataSource.unbind(PROGRESS, that._progressHandler)
                           .unbind(REQUESTEND, that._requestEndHandler)
                           .unbind("error", that._errorHandler);
        }
    });

    extend(List, {
        inArray: function(node, parentNode) {
            var idx, length, siblings = parentNode.children;

            if (!node || node.parentNode !== parentNode) {
                return -1;
            }

            for (idx = 0, length = siblings.length; idx < length; idx++) {
                if (node === siblings[idx]) {
                    return idx;
                }
            }

            return -1;
        }
    });

    kendo.ui.List = List;

    ui.Select = List.extend({
        init: function(element, options) {
            List.fn.init.call(this, element, options);
            this._initial = this.element.val();
        },

        setDataSource: function(dataSource) {
            var that = this;
            var parent;

            that.options.dataSource = dataSource;

            that._dataSource();

            that.listView.setDataSource(that.dataSource);

            if (that.options.autoBind) {
                that.dataSource.fetch();
            }

            parent = that._parentWidget();

            if (parent) {
                parent.trigger("cascade");
            }
        },

        close: function() {
            this.popup.close();
        },

        select: function(candidate) {
            var that = this;

            if (candidate === undefined) {
                return that.selectedIndex;
            } else {
                that._select(candidate);

                that._old = that._accessor();
                that._oldIndex = that.selectedIndex;
            }
        },

        search: function(word) {
            word = typeof word === "string" ? word : this.text();
            var that = this;
            var length = word.length;
            var options = that.options;
            var ignoreCase = options.ignoreCase;
            var filter = options.filter;
            var field = options.dataTextField;

            clearTimeout(that._typingTimeout);

            if (!length || length >= options.minLength) {
                that._state = "filter";
                that.listView.filter(true);
                if (filter === "none") {
                    that._filter(word);
                } else {
                    that._open = true;
                    that._filterSource({
                        value: ignoreCase ? word.toLowerCase() : word,
                        field: field,
                        operator: filter,
                        ignoreCase: ignoreCase
                    });
                }
            }
        },

        _accessor: function(value, idx) {
            return this[this._isSelect ? "_accessorSelect" : "_accessorInput"](value, idx);
        },

        _accessorInput: function(value) {
            var element = this.element[0];

            if (value === undefined) {
                return element.value;
            } else {
                if (value === null) {
                    value = "";
                }
                element.value = value;
            }
        },

        _accessorSelect: function(value, idx) {
            var element = this.element[0];
            var selectedIndex = element.selectedIndex;
            var option;

            if (value === undefined) {
                if (selectedIndex > -1) {
                    option = element.options[selectedIndex];
                }

                if (option) {
                    value = option.value;
                }
                return value || "";
            } else {
                if (selectedIndex > -1) {
                    element.options[selectedIndex].removeAttribute(SELECTED);
                }

                if (idx === undefined) {
                    idx = -1;
                }

                if (value !== "" && idx == -1) {
                    this._custom(value);
                } else {
                    if (value) {
                        element.value = value;
                    } else {
                        element.selectedIndex = idx;
                    }

                    if (element.selectedIndex > -1) {
                        option = element.options[element.selectedIndex];
                    }

                    if (option) {
                       option.setAttribute(SELECTED, SELECTED);
                    }
                }
            }
        },

        _custom: function(value) {
            var that = this;
            var element = that.element;
            var custom = that._customOption;

            if (!custom) {
                custom = $("<option/>");
                that._customOption = custom;

                element.append(custom);
            }

            custom.text(value);
            custom[0].setAttribute(SELECTED, SELECTED);
            custom[0].selected = true;
        },

        _hideBusy: function () {
            var that = this;
            clearTimeout(that._busy);
            that._arrow.removeClass(LOADING);
            that._focused.attr("aria-busy", false);
            that._busy = null;
        },

        _showBusy: function () {
            var that = this;

            that._request = true;

            if (that._busy) {
                return;
            }

            that._busy = setTimeout(function () {
                if (that._arrow) { //destroyed after request start
                    that._focused.attr("aria-busy", true);
                    that._arrow.addClass(LOADING);
                }
            }, 100);
        },

        _requestEnd: function() {
            this._request = false;
        },

        _dataSource: function() {
            var that = this,
                element = that.element,
                options = that.options,
                dataSource = options.dataSource || {},
                idx;

            dataSource = $.isArray(dataSource) ? {data: dataSource} : dataSource;

            if (that._isSelect) {
                idx = element[0].selectedIndex;
                if (idx > -1) {
                    options.index = idx;
                }

                dataSource.select = element;
                dataSource.fields = [{ field: options.dataTextField },
                                     { field: options.dataValueField }];
            }

            if (that.dataSource) {
                that._unbindDataSource();
            } else {
                that._progressHandler = proxy(that._showBusy, that);
                that._requestEndHandler = proxy(that._requestEnd, that);
                that._errorHandler = proxy(that._hideBusy, that);
            }

            that.dataSource = kendo.data.DataSource.create(dataSource)
                                   .bind(PROGRESS, that._progressHandler)
                                   .bind(REQUESTEND, that._requestEndHandler)
                                   .bind("error", that._errorHandler);
        },

        _firstItem: function() {
            this.listView.first();
        },

        _lastItem: function() {
            this.listView.last();
        },

        _nextItem: function() {
            this.listView.next();
        },

        _prevItem: function() {
            this.listView.prev();
        },

        _move: function(e) {
            var that = this;
            var key = e.keyCode;
            var ul = that.ul[0];
            var down = key === keys.DOWN;
            var dataItem;
            var pressed;
            var current;

            if (key === keys.UP || down) {
                if (e.altKey) {
                    that.toggle(down);
                } else {
                    if (!that.listView.isBound()) {
                        if (!that._fetch) {
                            that.dataSource.one(CHANGE, function() {
                                that._fetch = false;
                                that._move(e);
                            });

                            that._fetch = true;
                            that._filterSource();
                        }

                        e.preventDefault();

                        return true; //pressed
                    }

                    current = that._focus();

                    if (!that._fetch && (!current || current.hasClass("k-state-selected"))) {
                        if (down) {
                            that._nextItem();

                            if (!that._focus()) {
                                that._lastItem();
                            }
                        } else {
                            that._prevItem();

                            if (!that._focus()) {
                                that._firstItem();
                            }
                        }
                    }

                    if (that.trigger(SELECT, { item: that.listView.focus() })) {
                        that._focus(current);
                        return;
                    }

                    that._select(that._focus(), true);

                    if (!that.popup.visible()) {
                        that._blur();
                    }
                }

                e.preventDefault();
                pressed = true;
            } else if (key === keys.ENTER || key === keys.TAB) {
                if (that.popup.visible()) {
                    e.preventDefault();
                }

                current = that._focus();
                dataItem = that.dataItem();

                if (!that.popup.visible() && (!dataItem || that.text() !== that._text(dataItem))) {
                    current = null;
                }

                var activeFilter = that.filterInput && that.filterInput[0] === activeElement();

                if (current) {
                    if (that.trigger(SELECT, { item: current })) {
                        return;
                    }

                    that._select(current);
                } else if (that.input) {
                    that._accessor(that.input.val());
                    that.listView.value(that.input.val());
                }

                if (that._focusElement) {
                    that._focusElement(that.wrapper);
                }

                if (activeFilter && key === keys.TAB) {
                    that.wrapper.focusout();
                } else {
                    that._blur();
                }

                that.close();
                pressed = true;
            } else if (key === keys.ESC) {
                if (that.popup.visible()) {
                    e.preventDefault();
                }
                that.close();
                pressed = true;
            }

            return pressed;
        },

        _fetchData: function() {
            var that = this;
            var hasItems = !!that.dataSource.view().length;

            if (that._request || that.options.cascadeFrom) {
                return;
            }

            if (!that.listView.isBound() && !that._fetch && !hasItems) {
                that._fetch = true;
                that.dataSource.fetch().done(function() {
                    that._fetch = false;
                });
            }
        },

        _options: function(data, optionLabel, value) {
            var that = this,
                element = that.element,
                length = data.length,
                options = "",
                option,
                dataItem,
                dataText,
                dataValue,
                idx = 0;

            if (optionLabel) {
                options = optionLabel;
            }

            for (; idx < length; idx++) {
                option = "<option";
                dataItem = data[idx];
                dataText = that._text(dataItem);
                dataValue = that._value(dataItem);

                if (dataValue !== undefined) {
                    dataValue += "";

                    if (dataValue.indexOf('"') !== -1) {
                        dataValue = dataValue.replace(quotRegExp, "&quot;");
                    }

                    option += ' value="' + dataValue + '"';
                }

                option += ">";

                if (dataText !== undefined) {
                    option += htmlEncode(dataText);
                }

                option += "</option>";
                options += option;
            }

            element.html(options);

            if (value !== undefined) {
                element[0].value = value;
            }
        },

        _reset: function() {
            var that = this,
                element = that.element,
                formId = element.attr("form"),
                form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    setTimeout(function() {
                        that.value(that._initial);
                    });
                };

                that._form = form.on("reset", that._resetHandler);
            }
        },

        _parentWidget: function() {
            var name = this.options.name;
            var parentElement = $("#" + this.options.cascadeFrom);
            var parent = parentElement.data("kendo" + name);

            if (!parent) {
                parent = parentElement.data("kendo" + alternativeNames[name]);
            }

            return parent;
        },

        _cascade: function() {
            var that = this,
                options = that.options,
                cascade = options.cascadeFrom,
                select, valueField,
                parent, change;

            if (cascade) {
                parent = that._parentWidget();

                if (!parent) {
                    return;
                }

                options.autoBind = false;
                valueField = options.cascadeFromField || parent.options.dataValueField;

                change = function() {
                    that.dataSource.unbind(CHANGE, change);

                    var value = that._accessor();

                    if (that._userTriggered) {
                        that._clearSelection(parent, true);
                    } else if (value) {
                        if (value !== that.listView.value()[0]) {
                            that.value(value);
                        }

                        if (!that.dataSource.view()[0] || that.selectedIndex === -1) {
                            that._clearSelection(parent, true);
                        }
                    } else if (that.dataSource.flatView().length) {
                        that.select(options.index);
                    }

                    that.enable();
                    that._triggerCascade();
                    that._userTriggered = false;
                };
                select = function() {
                    var dataItem = parent.dataItem(),
                        filterValue = dataItem ? parent._value(dataItem) : null,
                        expressions, filters;

                    if (filterValue || filterValue === 0) {
                        expressions = that.dataSource.filter() || {};
                        removeFiltersForField(expressions, valueField);
                        filters = expressions.filters || [];

                        filters.push({
                            field: valueField,
                            operator: "eq",
                            value: filterValue
                        });

                        var handler = function() {
                            that.unbind("dataBound", handler);
                            change.apply(that, arguments);
                        };

                        that.first("dataBound", handler);

                        that.dataSource.filter(filters);

                    } else {
                        that.enable(false);
                        that._clearSelection(parent);
                        that._triggerCascade();
                        that._userTriggered = false;
                    }
                };

                parent.first("cascade", function(e) {
                    that._userTriggered = e.userTriggered;
                    select();
                });

                //refresh was called
                if (parent.listView.isBound()) {
                    select();
                } else if (!parent.value()) {
                    that.enable(false);
                }
            }
        }
    });

    var STATIC_LIST_NS = ".StaticList";

    var StaticList = kendo.ui.DataBoundWidget.extend({
        init: function(element, options) {
            Widget.fn.init.call(this, element, options);

            this.element.attr("role", "listbox")
                        .css({ overflow: support.kineticScrollNeeded ? "": "auto" })
                        .on("click" + STATIC_LIST_NS, "li", proxy(this._click, this))
                        .on("mouseenter" + STATIC_LIST_NS, "li", function() { $(this).addClass(HOVER); })
                        .on("mouseleave" + STATIC_LIST_NS, "li", function() { $(this).removeClass(HOVER); });


            this.header = this.element.before('<div class="k-group-header" style="display:none"></div>').prev();

            this._bound = false;

            this._optionID = kendo.guid();

            this._selectedIndices = [];

            this._view = [];
            this._dataItems = [];
            this._values = [];

            var value = this.options.value;

            if (value) {
                this._values = $.isArray(value) ? value.slice(0) : [value];
            }

            this._getter();
            this._templates();

            this.setDataSource(this.options.dataSource);

            this._onScroll = proxy(function() {
                var that = this;
                clearTimeout(that._scrollId);

                that._scrollId = setTimeout(function() {
                    that._renderHeader();
                }, 50);
            }, this);
        },

        options: {
            name: "StaticList",
            dataValueField: null,
            selectable: true,
            template: null,
            groupTemplate: null,
            fixedGroupTemplate: null
        },

        events: [
           "click",
           "change",
           "activate",
           "deactivate",
           "dataBinding",
           "dataBound",
           "selectedItemChange"
        ],

        setDataSource: function(source) {
            var that = this;
            var dataSource = source || {};
            var value;

            dataSource = $.isArray(dataSource) ? { data: dataSource } : dataSource;
            dataSource = kendo.data.DataSource.create(dataSource);

            if (that.dataSource) {
                that.dataSource.unbind(CHANGE, that._refreshHandler);

                value = that.value();

                that.value([]);
                that._bound = false;

                that.value(value);
            } else {
                that._refreshHandler = proxy(that.refresh, that);
            }

            that.dataSource = dataSource.bind(CHANGE, that._refreshHandler);
            that._fixedHeader();
        },

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            this._getter();
            this._templates();
            this._render();
        },

        destroy: function() {
            this.element.off(STATIC_LIST_NS);

            if (this._refreshHandler) {
                this.dataSource.unbind(CHANGE, this._refreshHandler);
            }

            Widget.fn.destroy.call(this);
        },

        scrollToIndex: function(index) {
            var item = this.element[0].children[index];

            if (item) {
                this.scroll(item);
            }
        },

        _offsetHeight: function() {
            var offsetHeight = 0;
            var siblings = this.element.prevAll();

            siblings.each(function() {
                var element = $(this);
                if (element.is(":visible")) {
                    if (element.hasClass("k-list-filter")) {
                        offsetHeight += element.children().height();
                    } else {
                        offsetHeight += element.outerHeight();
                    }
                }
            });

            return offsetHeight;
        },

        setTouchScroller: function (touchScroller) {
            this._touchScroller = touchScroller;
        },

        scroll: function (item) {
            if (!item) {
                return;
            }

            if (item[0]) {
                item = item[0];
            }

            var ul = this.element[0],
                itemOffsetTop = item.offsetTop,
                itemOffsetHeight = item.offsetHeight,
                ulScrollTop = ul.scrollTop,
                ulOffsetHeight = ul.clientHeight,
                bottomDistance = itemOffsetTop + itemOffsetHeight,
                touchScroller = this._touchScroller,
                yDimension, offsetHeight;

            if (touchScroller) {
                yDimension = touchScroller.dimensions.y;
                yDimension.update(true);

                if (yDimension.enabled && itemOffsetTop > yDimension.size) {
                    itemOffsetTop = itemOffsetTop - yDimension.size + itemOffsetHeight + 4;

                    touchScroller.scrollTo(0, -itemOffsetTop);
                }
            } else {
                offsetHeight = this._offsetHeight();
                if (ulScrollTop > (itemOffsetTop - offsetHeight)) {
                    ulScrollTop = (itemOffsetTop - offsetHeight);
                } else if (bottomDistance > (ulScrollTop + ulOffsetHeight + offsetHeight)) {
                    ulScrollTop = (bottomDistance - ulOffsetHeight - offsetHeight);
                }

                ul.scrollTop = ulScrollTop;
           }
        },

        selectedDataItems: function(dataItems) {
            var getter = this._valueGetter;

            if (dataItems === undefined) {
                return this._dataItems.slice();
            }

            this._dataItems = dataItems;

            this._values = $.map(dataItems, function(dataItem) {
                return getter(dataItem);
            });
        },

        next: function() {
            var current = this.focus();

            if (!current) {
                current = 0;
            } else {
                current = current.next();
            }

            this.focus(current);
        },

        prev: function() {
            var current = this.focus();

            if (!current) {
                current = this.element[0].children.length - 1;
            } else {
                current = current.prev();
            }

            this.focus(current);
        },

        first: function() {
            this.focus(this.element[0].children[0]);
        },

        last: function() {
            this.focus(this.element[0].children[this.element[0].children.length - 1]);
        },

        focus: function(candidate) {
            var that = this;
            var id = that._optionID;
            var hasCandidate;

            if (candidate === undefined) {
                return that._current;
            }

            candidate = that._get(candidate);
            candidate = candidate[candidate.length - 1];
            candidate = $(this.element[0].children[candidate]);

            if (that._current) {
                that._current
                    .removeClass(FOCUSED)
                    .removeAttr("aria-selected")
                    .removeAttr(ID);

                that.trigger("deactivate");
            }

            hasCandidate = !!candidate[0];

            if (hasCandidate) {
                candidate.addClass(FOCUSED);
                that.scroll(candidate);

                candidate.attr("id", id);
            }

            that._current = hasCandidate ? candidate : null;
            that.trigger("activate");
        },

        focusIndex: function() {
            return this.focus() ? this.focus().index() : undefined;
        },

        filter: function(filter, skipValueUpdate) {
            if (filter === undefined) {
                return this._filtered;
            }

            this._filtered = filter;
        },

        skipUpdate: function(skipUpdate) {
            this._skipUpdate = skipUpdate;
        },

        select: function(indices) {
            var that = this;
            var selectable = that.options.selectable;
            var singleSelection = selectable !== "multiple" && selectable !== false;
            var selectedIndices = that._selectedIndices;

            var added = [];
            var removed = [];
            var result;

            if (indices === undefined) {
                return selectedIndices.slice();
            }

            indices = that._get(indices);

            if (indices.length === 1 && indices[0] === -1) {
                indices = [];
            }

            if (that._filtered && !singleSelection && that._deselectFiltered(indices)) {
                return;
            }

            if (singleSelection && !that._filtered && $.inArray(indices[indices.length - 1], selectedIndices) !== -1) {
                if (that._dataItems.length && that._view.length) {
                    that._dataItems = [that._view[selectedIndices[0]].item];
                }

                return;
            }

            result = that._deselect(indices);

            removed = result.removed;
            indices = result.indices;

            if (indices.length) {
                if (singleSelection) {
                    indices = [indices[indices.length - 1]];
                }

                added = that._select(indices);
            }

            if (added.length || removed.length) {
                that._valueComparer = null;
                that.trigger("change", {
                    added: added,
                    removed: removed
                });
            }
        },

        removeAt: function(position) {
            this._selectedIndices.splice(position, 1);
            this._values.splice(position, 1);

            return {
                position: position,
                dataItem: this._dataItems.splice(position, 1)[0]
            };
        },

        setValue: function(value) {
            value = $.isArray(value) || value instanceof ObservableArray ? value.slice(0) : [value];

            this._values = value;

            this._valueComparer = null;
        },

        value: function(value) {
            var that = this;
            var deferred = that._valueDeferred;
            var indices;

            if (value === undefined) {
                return that._values.slice();
            }

            that.setValue(value);

            if (!deferred || deferred.state() === "resolved") {
                that._valueDeferred = deferred = $.Deferred();
            }

            if (that.isBound()) {
                indices = that._valueIndices(that._values);

                if (that.options.selectable === "multiple") {
                    that.select(-1);
                }

                that.select(indices);

                deferred.resolve();
            }

            that._skipUpdate = false;

            return deferred;
        },

        _click: function(e) {
            if (!e.isDefaultPrevented()) {
                this.trigger("click", { item: $(e.currentTarget) });
            }
        },

        _valueExpr: function(type, values) {
            var that = this;
            var value;
            var idx = 0;

            var body;
            var comparer;
            var normalized = [];

            if (!that._valueComparer  || that._valueType !== type) {
                that._valueType = type;

                for (; idx < values.length; idx++) {
                    value = values[idx];

                    if (value !== undefined && value !== "" && value !== null) {
                        if (type === "boolean") {
                            value = Boolean(value);
                        } else if (type === "number") {
                            value = Number(value);
                        } else if (type === "string") {
                            value = value.toString();
                        }
                    }

                    normalized.push(value);
                }

                body = "for (var idx = 0; idx < " + normalized.length + "; idx++) {" +
                        " if (current === values[idx]) {" +
                        "   return idx;" +
                        " }" +
                        "} " +
                        "return -1;";

                comparer = new Function(["current", "values"], body);

                that._valueComparer = function(current) {
                    return comparer(current, normalized);
                };
            }

            return that._valueComparer;
        },

        _dataItemPosition: function(dataItem, values) {
            var value = this._valueGetter(dataItem);

            var valueExpr = this._valueExpr(typeof value, values);

            return valueExpr(value);
        },

        _getter: function() {
            this._valueGetter = kendo.getter(this.options.dataValueField);
        },

        _deselect: function(indices) {
            var that = this;
            var children = that.element[0].children;
            var selectable = that.options.selectable;
            var selectedIndices = that._selectedIndices;
            var dataItems = that._dataItems;
            var values = that._values;
            var removed = [];
            var i = 0;
            var j;

            var index, selectedIndex;
            var removedIndices = 0;

            indices = indices.slice();

            if (selectable === true || !indices.length) {
                for (; i < selectedIndices.length; i++) {
                    $(children[selectedIndices[i]]).removeClass("k-state-selected");

                    removed.push({
                        position: i,
                        dataItem: dataItems[i]
                    });
                }

                that._values = [];
                that._dataItems = [];
                that._selectedIndices = [];
            } else if (selectable === "multiple") {
                for (; i < indices.length; i++) {
                    index = indices[i];

                    if (!$(children[index]).hasClass("k-state-selected")) {
                        continue;
                    }

                    for (j = 0; j < selectedIndices.length; j++) {
                        selectedIndex = selectedIndices[j];

                        if (selectedIndex === index) {
                            $(children[selectedIndex]).removeClass("k-state-selected");

                            removed.push({
                                position: j + removedIndices,
                                dataItem: dataItems.splice(j, 1)[0]
                            });

                            selectedIndices.splice(j, 1);
                            indices.splice(i, 1);
                            values.splice(j, 1);

                            removedIndices += 1;
                            i -= 1;
                            j -= 1;
                            break;
                        }
                    }
                }
            }

            return {
                indices: indices,
                removed: removed
            };
        },

        _deselectFiltered: function(indices) {
            var children = this.element[0].children;
            var dataItem, index, position;
            var removed = [];
            var idx = 0;

            for (; idx < indices.length; idx++) {
                index = indices[idx];
                dataItem = this._view[index].item;
                position = this._dataItemPosition(dataItem, this._values);

                if (position > -1) {
                    removed.push(this.removeAt(position));
                    $(children[index]).removeClass("k-state-selected");
                }
            }

            if (removed.length) {
                this.trigger("change", {
                    added: [],
                    removed: removed
                });

                return true;
            }

            return false;
        },

        _select: function(indices) {
            var that = this;
            var children = that.element[0].children;
            var data = that._view;
            var dataItem, index;
            var added = [];
            var idx = 0;

            if (indices[indices.length - 1] !== -1) {
                that.focus(indices);
            }

            for (; idx < indices.length; idx++) {
                index = indices[idx];
                dataItem = data[index];

                if (index === -1 || !dataItem) {
                    continue;
                }

                dataItem = dataItem.item;

                that._selectedIndices.push(index);
                that._dataItems.push(dataItem);
                that._values.push(that._valueGetter(dataItem));

                $(children[index]).addClass("k-state-selected").attr("aria-selected", true);

                added.push({
                    dataItem: dataItem
                });
            }

            return added;
        },

        _get: function(candidate) {
            if (typeof candidate === "number") {
                candidate = [candidate];
            } else if (!isArray(candidate)) {
                candidate = $(candidate).data("offset-index");

                if (candidate === undefined) {
                    candidate = -1;
                }

                candidate = [candidate];
            }

            return candidate;
        },

        _template: function() {
            var that = this;
            var options = that.options;
            var template = options.template;

            if (!template) {
                template = kendo.template('<li tabindex="-1" role="option" unselectable="on" class="k-item">${' + kendo.expr(options.dataTextField, "data") + "}</li>", { useWithBlock: false });
            } else {
                template = kendo.template(template);
                template = function(data) {
                    return '<li tabindex="-1" role="option" unselectable="on" class="k-item">' + template(data) + "</li>";
                };
            }

            return template;
        },

        _templates: function() {
            var template;
            var templates = {
                template: this.options.template,
                groupTemplate: this.options.groupTemplate,
                fixedGroupTemplate: this.options.fixedGroupTemplate
            };

            for (var key in templates) {
                template = templates[key];
                if (template && typeof template !== "function") {
                    templates[key] = kendo.template(template);
                }
            }

            this.templates = templates;
        },

        _normalizeIndices: function(indices) {
            var newIndices = [];
            var idx = 0;

            for (; idx < indices.length; idx++) {
                if (indices[idx] !== undefined) {
                    newIndices.push(indices[idx]);
                }
            }

            return newIndices;
        },

        _valueIndices: function(values, indices) {
            var data = this._view;
            var idx = 0;
            var index;

            indices = indices ? indices.slice() : [];

            if (!values.length) {
                return [];
            }

            for (; idx < data.length; idx++) {
                index = this._dataItemPosition(data[idx].item, values);

                if (index !== -1) {
                    indices[index] = idx;
                }
            }

            return this._normalizeIndices(indices);
        },

        _firstVisibleItem: function() {
            var element = this.element[0];
            var scrollTop = element.scrollTop;
            var itemHeight = $(element.children[0]).height();
            var itemIndex = Math.floor(scrollTop / itemHeight) || 0;
            var item = element.children[itemIndex] || element.lastChild;
            var offsetHeight = this._offsetHeight();
            var forward = (item.offsetTop - offsetHeight) < scrollTop;

            while (item) {
                if (forward) {
                    if ((item.offsetTop + itemHeight - offsetHeight) > scrollTop || !item.nextSibling) {
                        break;
                    }

                    item = item.nextSibling;
                } else {
                    if ((item.offsetTop - offsetHeight) <= scrollTop || !item.previousSibling) {
                        break;
                    }

                    item = item.previousSibling;
                }
            }

            return this._view[$(item).data("offset-index")];
        },

        _fixedHeader: function() {
            if (this.isGrouped() && this.templates.fixedGroupTemplate) {
                this.header.show();
                this.element.scroll(this._onScroll);
            } else {
                this.header.hide();
                this.element.off("scroll", this._onScroll);
            }
        },

        _renderHeader: function() {
            var template = this.templates.fixedGroupTemplate;
            if (!template) {
                return;
            }

            var visibleItem = this._firstVisibleItem();

            if (visibleItem) {
                this.header.html(template(visibleItem.group));
            }
        },

        _renderItem: function(context) {
            var item = '<li tabindex="-1" role="option" unselectable="on" class="k-item';

            var dataItem = context.item;
            var notFirstItem = context.index !== 0;
            var selected = context.selected;

            if (notFirstItem && context.newGroup) {
                item += ' k-first';
            }

            if (selected) {
                item += ' k-state-selected';
            }

            item += '"' + (selected ? ' aria-selected="true"' : "") + ' data-offset-index="' + context.index + '">';

            item += this.templates.template(dataItem);

            if (notFirstItem && context.newGroup) {
                item += '<div class="k-group">' + this.templates.groupTemplate(context.group) + '</div>';
            }

            return item + "</li>";
        },

        _render: function() {
            var html = "";

            var i = 0;
            var idx = 0;
            var context;
            var dataContext = [];
            var view = this.dataSource.view();
            var values = this.value();

            var group, newGroup, j;
            var isGrouped = this.isGrouped();

            if (isGrouped) {
                for (i = 0; i < view.length; i++) {
                    group = view[i];
                    newGroup = true;

                    for (j = 0; j < group.items.length; j++) {
                        context = {
                            selected: this._selected(group.items[j], values),
                            item: group.items[j],
                            group: group.value,
                            newGroup: newGroup,
                            index: idx };
                        dataContext[idx] = context;
                        idx += 1;

                        html += this._renderItem(context);
                        newGroup = false;
                    }
                }
            } else {
                for (i = 0; i < view.length; i++) {
                    context = { selected: this._selected(view[i], values), item: view[i], index: i };

                    dataContext[i] = context;

                    html += this._renderItem(context);
                }
            }

            this._view = dataContext;

            this.element[0].innerHTML = html;

            if (isGrouped && dataContext.length) {
                this._renderHeader();
            }
        },

        _selected: function(dataItem, values) {
            var select = !this._filtered || this.options.selectable === "multiple";
            return select && this._dataItemPosition(dataItem, values) !== -1;
        },

        refresh: function(e) {
            var that = this;
            var changedItems;
            var action = e && e.action;

            that.trigger("dataBinding");

            that._fixedHeader();

            that._render();

            that._bound = true;

            if (action === "itemchange") {
                changedItems = findChangedItems(that._dataItems, e.items);
                if (changedItems.length) {
                    that.trigger("selectedItemChange", {
                        items: changedItems
                    });
                }
            } else if (that._filtered || that._skipUpdate) {
                that.focus(0);
                if (that._skipUpdate) {
                    that._skipUpdate = false;
                    that._selectedIndices = that._valueIndices(that._values, that._selectedIndices);
                }
            } else if (!action || action === "add") {
                that.value(that._values);
            }

            if (that._valueDeferred) {
                that._valueDeferred.resolve();
            }

            that.trigger("dataBound");
        },

        isBound: function() {
            return this._bound;
        },

        isGrouped: function() {
            return (this.dataSource.group() || []).length;
        }
    });

    ui.plugin(StaticList);

    function findChangedItems(selected, changed) {
        var changedLength = changed.length;
        var result = [];
        var dataItem;
        var i, j;

        for (i = 0; i < selected.length; i++) {
            dataItem = selected[i];

            for (j = 0; j < changedLength; j++) {
                if (dataItem === changed[j]) {
                    result.push({
                        index: i,
                        item: dataItem
                    });
                }
            }
        }

        return result;
    }

    function removeFiltersForField(expression, field) {
        var filters;
        var found = false;

        if (expression.filters) {
            filters = $.grep(expression.filters, function(filter) {
                found = removeFiltersForField(filter, field);
                if (filter.filters) {
                    return filter.filters.length;
                } else {
                    return filter.field != field;
                }
            });

            if (!found && expression.filters.length !== filters.length) {
                found = true;
            }

            expression.filters = filters;
        }

        return found;
    }
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "calendar",
    name: "Calendar",
    category: "web",
    description: "The Calendar widget renders a graphical calendar that supports navigation and selection.",
    depends: [ "core" ]
};

(function($, undefined) {
    var kendo = window.kendo,
        support = kendo.support,
        ui = kendo.ui,
        Widget = ui.Widget,
        keys = kendo.keys,
        parse = kendo.parseDate,
        adjustDST = kendo.date.adjustDST,
        extractFormat = kendo._extractFormat,
        template = kendo.template,
        getCulture = kendo.getCulture,
        transitions = kendo.support.transitions,
        transitionOrigin = transitions ? transitions.css + "transform-origin" : "",
        cellTemplate = template('<td#=data.cssClass# role="gridcell"><a tabindex="-1" class="k-link" href="\\#" data-#=data.ns#value="#=data.dateString#">#=data.value#</a></td>', { useWithBlock: false }),
        emptyCellTemplate = template('<td role="gridcell">&nbsp;</td>', { useWithBlock: false }),
        browser = kendo.support.browser,
        isIE8 = browser.msie && browser.version < 9,
        ns = ".kendoCalendar",
        CLICK = "click" + ns,
        KEYDOWN_NS = "keydown" + ns,
        ID = "id",
        MIN = "min",
        LEFT = "left",
        SLIDE = "slideIn",
        MONTH = "month",
        CENTURY = "century",
        CHANGE = "change",
        NAVIGATE = "navigate",
        VALUE = "value",
        HOVER = "k-state-hover",
        DISABLED = "k-state-disabled",
        FOCUSED = "k-state-focused",
        OTHERMONTH = "k-other-month",
        OTHERMONTHCLASS = ' class="' + OTHERMONTH + '"',
        TODAY = "k-nav-today",
        CELLSELECTOR = "td:has(.k-link)",
        BLUR = "blur" + ns,
        FOCUS = "focus",
        FOCUS_WITH_NS = FOCUS + ns,
        MOUSEENTER = support.touch ? "touchstart" : "mouseenter",
        MOUSEENTER_WITH_NS = support.touch ? "touchstart" + ns : "mouseenter" + ns,
        MOUSELEAVE = support.touch ? "touchend" + ns + " touchmove" + ns : "mouseleave" + ns,
        MS_PER_MINUTE = 60000,
        MS_PER_DAY = 86400000,
        PREVARROW = "_prevArrow",
        NEXTARROW = "_nextArrow",
        ARIA_DISABLED = "aria-disabled",
        ARIA_SELECTED = "aria-selected",
        proxy = $.proxy,
        extend = $.extend,
        DATE = Date,
        views = {
            month: 0,
            year: 1,
            decade: 2,
            century: 3
        };

    var Calendar = Widget.extend({
        init: function(element, options) {
            var that = this, value, id;

            Widget.fn.init.call(that, element, options);

            element = that.wrapper = that.element;
            options = that.options;

            options.url = window.unescape(options.url);

            that._templates();

            that._header();

            that._footer(that.footer);

            id = element
                    .addClass("k-widget k-calendar")
                    .on(MOUSEENTER_WITH_NS + " " + MOUSELEAVE, CELLSELECTOR, mousetoggle)
                    .on(KEYDOWN_NS, "table.k-content", proxy(that._move, that))
                    .on(CLICK, CELLSELECTOR, function(e) {
                        var link = e.currentTarget.firstChild;

                        if (link.href.indexOf("#") != -1) {
                            e.preventDefault();
                        }

                        that._click($(link));
                    })
                    .on("mouseup" + ns, "table.k-content, .k-footer", function() {
                        that._focusView(that.options.focusOnNav !== false);
                    })
                    .attr(ID);

            if (id) {
                that._cellID = id + "_cell_selected";
            }

            normalize(options);
            value = parse(options.value, options.format, options.culture);

            that._index = views[options.start];
            that._current = new DATE(+restrictValue(value, options.min, options.max));

            that._addClassProxy = function() {
                that._active = true;
                that._cell.addClass(FOCUSED);
            };

            that._removeClassProxy = function() {
                that._active = false;
                that._cell.removeClass(FOCUSED);
            };

            that.value(value);

            kendo.notify(that);
        },

        options: {
            name: "Calendar",
            value: null,
            min: new DATE(1900, 0, 1),
            max: new DATE(2099, 11, 31),
            dates: [],
            url: "",
            culture: "",
            footer : "",
            format : "",
            month : {},
            start: MONTH,
            depth: MONTH,
            animation: {
                horizontal: {
                    effects: SLIDE,
                    reverse: true,
                    duration: 500,
                    divisor: 2
                },
                vertical: {
                    effects: "zoomIn",
                    duration: 400
                }
            }
        },

        events: [
            CHANGE,
            NAVIGATE
        ],

        setOptions: function(options) {
            var that = this;

            normalize(options);

            if (!options.dates[0]) {
                options.dates = that.options.dates;
            }

            Widget.fn.setOptions.call(that, options);

            that._templates();

            that._footer(that.footer);
            that._index = views[that.options.start];

            that.navigate();
        },

        destroy: function() {
            var that = this,
                today = that._today;

            that.element.off(ns);
            that._title.off(ns);
            that[PREVARROW].off(ns);
            that[NEXTARROW].off(ns);

            kendo.destroy(that._table);

            if (today) {
                kendo.destroy(today.off(ns));
            }

            Widget.fn.destroy.call(that);
        },

        current: function() {
            return this._current;
        },

        view: function() {
            return this._view;
        },

        focus: function(table) {
            table = table || this._table;
            this._bindTable(table);
            table.focus();
        },

        min: function(value) {
            return this._option(MIN, value);
        },

        max: function(value) {
            return this._option("max", value);
        },

        navigateToPast: function() {
            this._navigate(PREVARROW, -1);
        },

        navigateToFuture: function() {
            this._navigate(NEXTARROW, 1);
        },

        navigateUp: function() {
            var that = this,
                index = that._index;

            if (that._title.hasClass(DISABLED)) {
                return;
            }

            that.navigate(that._current, ++index);
        },

        navigateDown: function(value) {
            var that = this,
            index = that._index,
            depth = that.options.depth;

            if (!value) {
                return;
            }

            if (index === views[depth]) {
                if (+that._value != +value) {
                    that.value(value);
                    that.trigger(CHANGE);
                }
                return;
            }

            that.navigate(value, --index);
        },

        navigate: function(value, view) {
            view = isNaN(view) ? views[view] : view;

            var that = this,
                options = that.options,
                culture = options.culture,
                min = options.min,
                max = options.max,
                title = that._title,
                from = that._table,
                old = that._oldTable,
                selectedValue = that._value,
                currentValue = that._current,
                future = value && +value > +currentValue,
                vertical = view !== undefined && view !== that._index,
                to, currentView, compare,
                disabled;

            if (!value) {
                value = currentValue;
            }

            that._current = value = new DATE(+restrictValue(value, min, max));

            if (view === undefined) {
                view = that._index;
            } else {
                that._index = view;
            }

            that._view = currentView = calendar.views[view];
            compare = currentView.compare;

            disabled = view === views[CENTURY];
            title.toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);

            disabled = compare(value, min) < 1;
            that[PREVARROW].toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);

            disabled = compare(value, max) > -1;
            that[NEXTARROW].toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);

            if (from && old && old.data("animating")) {
                old.kendoStop(true, true);
                from.kendoStop(true, true);
            }

            that._oldTable = from;

            if (!from || that._changeView) {
                title.html(currentView.title(value, min, max, culture));

                that._table = to = $(currentView.content(extend({
                    min: min,
                    max: max,
                    date: value,
                    url: options.url,
                    dates: options.dates,
                    format: options.format,
                    culture: culture
                }, that[currentView.name])));

                makeUnselectable(to);

                that._animate({
                    from: from,
                    to: to,
                    vertical: vertical,
                    future: future
                });

                that._focus(value);
                that.trigger(NAVIGATE);
            }

            if (view === views[options.depth] && selectedValue) {
                that._class("k-state-selected", currentView.toDateString(selectedValue));
            }

            that._class(FOCUSED, currentView.toDateString(value));

            if (!from && that._cell) {
                that._cell.removeClass(FOCUSED);
            }

            that._changeView = true;
        },

        value: function(value) {
            var that = this,
            view = that._view,
            options = that.options,
            old = that._view,
            min = options.min,
            max = options.max;

            if (value === undefined) {
                return that._value;
            }

            value = parse(value, options.format, options.culture);

            if (value !== null) {
                value = new DATE(+value);

                if (!isInRange(value, min, max)) {
                    value = null;
                }
            }

            that._value = value;

            if (old && value === null && that._cell) {
                that._cell.removeClass("k-state-selected");
            } else {
                that._changeView = !value || view && view.compare(value, that._current) !== 0;
                that.navigate(value);
            }
        },

        _move: function(e) {
            var that = this,
                options = that.options,
                key = e.keyCode,
                view = that._view,
                index = that._index,
                currentValue = new DATE(+that._current),
                isRtl = kendo.support.isRtl(that.wrapper),
                value, prevent, method, temp;

            if (e.target === that._table[0]) {
                that._active = true;
            }

            if (e.ctrlKey) {
                if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
                    that.navigateToFuture();
                    prevent = true;
                } else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
                    that.navigateToPast();
                    prevent = true;
                } else if (key == keys.UP) {
                    that.navigateUp();
                    prevent = true;
                } else if (key == keys.DOWN) {
                    that._click($(that._cell[0].firstChild));
                    prevent = true;
                }
            } else {
                if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
                    value = 1;
                    prevent = true;
                } else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
                    value = -1;
                    prevent = true;
                } else if (key == keys.UP) {
                    value = index === 0 ? -7 : -4;
                    prevent = true;
                } else if (key == keys.DOWN) {
                    value = index === 0 ? 7 : 4;
                    prevent = true;
                } else if (key == keys.ENTER) {
                    that._click($(that._cell[0].firstChild));
                    prevent = true;
                } else if (key == keys.HOME || key == keys.END) {
                    method = key == keys.HOME ? "first" : "last";
                    temp = view[method](currentValue);
                    currentValue = new DATE(temp.getFullYear(), temp.getMonth(), temp.getDate(), currentValue.getHours(), currentValue.getMinutes(), currentValue.getSeconds(), currentValue.getMilliseconds());
                    prevent = true;
                } else if (key == keys.PAGEUP) {
                    prevent = true;
                    that.navigateToPast();
                } else if (key == keys.PAGEDOWN) {
                    prevent = true;
                    that.navigateToFuture();
                }

                if (value || method) {
                    if (!method) {
                        view.setDate(currentValue, value);
                    }

                    that._focus(restrictValue(currentValue, options.min, options.max));
                }
            }

            if (prevent) {
                e.preventDefault();
            }

            return that._current;
        },

        _animate: function(options) {
            var that = this,
                from = options.from,
                to = options.to,
                active = that._active;

            if (!from) {
                to.insertAfter(that.element[0].firstChild);
                that._bindTable(to);
            } else if (from.parent().data("animating")) {
                from.off(ns);
                from.parent().kendoStop(true, true).remove();
                from.remove();

                to.insertAfter(that.element[0].firstChild);
                that._focusView(active);
            } else if (!from.is(":visible") || that.options.animation === false) {
                to.insertAfter(from);
                from.off(ns).remove();

                that._focusView(active);
            } else {
                that[options.vertical ? "_vertical" : "_horizontal"](from, to, options.future);
            }
        },

        _horizontal: function(from, to, future) {
            var that = this,
                active = that._active,
                horizontal = that.options.animation.horizontal,
                effects = horizontal.effects,
                viewWidth = from.outerWidth();

            if (effects && effects.indexOf(SLIDE) != -1) {
                from.add(to).css({ width: viewWidth });

                from.wrap("<div/>");

                that._focusView(active, from);

                from.parent()
                    .css({
                        position: "relative",
                        width: viewWidth * 2,
                        "float": LEFT,
                        "margin-left": future ? 0 : -viewWidth
                    });

                to[future ? "insertAfter" : "insertBefore"](from);

                extend(horizontal, {
                    effects: SLIDE + ":" + (future ? "right" : LEFT),
                    complete: function() {
                        from.off(ns).remove();
                        that._oldTable = null;

                        to.unwrap();

                        that._focusView(active);

                    }
                });

                from.parent().kendoStop(true, true).kendoAnimate(horizontal);
            }
        },

        _vertical: function(from, to) {
            var that = this,
                vertical = that.options.animation.vertical,
                effects = vertical.effects,
                active = that._active, //active state before from's blur
                cell, position;

            if (effects && effects.indexOf("zoom") != -1) {
                to.css({
                    position: "absolute",
                    top: from.prev().outerHeight(),
                    left: 0
                }).insertBefore(from);

                if (transitionOrigin) {
                    cell = that._cellByDate(that._view.toDateString(that._current));
                    position = cell.position();
                    position = (position.left + parseInt(cell.width() / 2, 10)) + "px" + " " + (position.top + parseInt(cell.height() / 2, 10) + "px");
                    to.css(transitionOrigin, position);
                }

                from.kendoStop(true, true).kendoAnimate({
                    effects: "fadeOut",
                    duration: 600,
                    complete: function() {
                        from.off(ns).remove();
                        that._oldTable = null;

                        to.css({
                            position: "static",
                            top: 0,
                            left: 0
                        });

                        that._focusView(active);
                    }
                });

                to.kendoStop(true, true).kendoAnimate(vertical);
            }
        },

        _cellByDate: function(value) {
            return this._table.find("td:not(." + OTHERMONTH + ")")
                       .filter(function() {
                           return $(this.firstChild).attr(kendo.attr(VALUE)) === value;
                       });
        },

        _class: function(className, value) {
            var that = this,
                id = that._cellID,
                cell = that._cell;

            if (cell) {
                cell.removeAttr(ARIA_SELECTED)
                    .removeAttr("aria-label")
                    .removeAttr(ID);
            }

            cell = that._table
                       .find("td:not(." + OTHERMONTH + ")")
                       .removeClass(className)
                       .filter(function() {
                          return $(this.firstChild).attr(kendo.attr(VALUE)) === value;
                       })
                       .attr(ARIA_SELECTED, true);

            if (className === FOCUSED && !that._active && that.options.focusOnNav !== false) {
                className = "";
            }

            cell.addClass(className);

            if (cell[0]) {
                that._cell = cell;
            }

            if (id) {
                cell.attr(ID, id);
                that._table.removeAttr("aria-activedescendant").attr("aria-activedescendant", id);
            }
        },

        _bindTable: function (table) {
            table
                .on(FOCUS_WITH_NS, this._addClassProxy)
                .on(BLUR, this._removeClassProxy);
        },

        _click: function(link) {
            var that = this,
                options = that.options,
                currentValue = new Date(+that._current),
                value = link.attr(kendo.attr(VALUE)).split("/");

            //Safari cannot create correctly date from "1/1/2090"
            value = new DATE(value[0], value[1], value[2]);
            adjustDST(value, 0);

            that._view.setDate(currentValue, value);

            that.navigateDown(restrictValue(currentValue, options.min, options.max));
        },

        _focus: function(value) {
            var that = this,
                view = that._view;

            if (view.compare(value, that._current) !== 0) {
                that.navigate(value);
            } else {
                that._current = value;
                that._class(FOCUSED, view.toDateString(value));
            }
        },

        _focusView: function(active, table) {
            if (active) {
                this.focus(table);
            }
        },

        _footer: function(template) {
            var that = this,
                today = getToday(),
                element = that.element,
                footer = element.find(".k-footer");

            if (!template) {
                that._toggle(false);
                footer.hide();
                return;
            }

            if (!footer[0]) {
                footer = $('<div class="k-footer"><a href="#" class="k-link k-nav-today"></a></div>').appendTo(element);
            }

            that._today = footer.show()
                                .find(".k-link")
                                .html(template(today))
                                .attr("title", kendo.toString(today, "D", that.options.culture));

            that._toggle();
        },

        _header: function() {
            var that = this,
            element = that.element,
            links;

            if (!element.find(".k-header")[0]) {
                element.html('<div class="k-header">' +
                             '<a href="#" role="button" class="k-link k-nav-prev"><span class="k-icon k-i-arrow-w"></span></a>' +
                             '<a href="#" role="button" aria-live="assertive" aria-atomic="true" class="k-link k-nav-fast"></a>' +
                             '<a href="#" role="button" class="k-link k-nav-next"><span class="k-icon k-i-arrow-e"></span></a>' +
                             '</div>');
            }

            links = element.find(".k-link")
                           .on(MOUSEENTER_WITH_NS + " " + MOUSELEAVE + " " + FOCUS_WITH_NS + " " + BLUR, mousetoggle)
                           .click(false);

            that._title = links.eq(1).on(CLICK, function() { that._active = that.options.focusOnNav !== false; that.navigateUp(); });
            that[PREVARROW] = links.eq(0).on(CLICK, function() { that._active = that.options.focusOnNav !== false; that.navigateToPast(); });
            that[NEXTARROW] = links.eq(2).on(CLICK, function() { that._active = that.options.focusOnNav !== false; that.navigateToFuture(); });
        },

        _navigate: function(arrow, modifier) {
            var that = this,
                index = that._index + 1,
                currentValue = new DATE(+that._current);

            arrow = that[arrow];

            if (!arrow.hasClass(DISABLED)) {
                if (index > 3) {
                    currentValue.setFullYear(currentValue.getFullYear() + 100 * modifier);
                } else {
                    calendar.views[index].setDate(currentValue, modifier);
                }

                that.navigate(currentValue);
            }
        },

        _option: function(option, value) {
            var that = this,
                options = that.options,
                currentValue = that._value || that._current,
                isBigger;

            if (value === undefined) {
                return options[option];
            }

            value = parse(value, options.format, options.culture);

            if (!value) {
                return;
            }

            options[option] = new DATE(+value);

            if (option === MIN) {
                isBigger = value > currentValue;
            } else {
                isBigger = currentValue > value;
            }

            if (isBigger || isEqualMonth(currentValue, value)) {
                if (isBigger) {
                    that._value = null;
                }
                that._changeView = true;
            }

            if (!that._changeView) {
                that._changeView = !!(options.month.content || options.month.empty);
            }

            that.navigate(that._value);

            that._toggle();
        },

        _toggle: function(toggle) {
            var that = this,
                options = that.options,
                link = that._today;

            if (toggle === undefined) {
                toggle = isInRange(getToday(), options.min, options.max);
            }

            if (link) {
                link.off(CLICK);

                if (toggle) {
                    link.addClass(TODAY)
                        .removeClass(DISABLED)
                        .on(CLICK, proxy(that._todayClick, that));
                } else {
                    link.removeClass(TODAY)
                        .addClass(DISABLED)
                        .on(CLICK, prevent);
                }
            }
        },

        _todayClick: function(e) {
            var that = this,
                depth = views[that.options.depth],
                today = getToday();

            e.preventDefault();

            if (that._view.compare(that._current, today) === 0 && that._index == depth) {
                that._changeView = false;
            }

            that._value = today;
            that.navigate(today, depth);

            that.trigger(CHANGE);
        },

        _templates: function() {
            var that = this,
                options = that.options,
                footer = options.footer,
                month = options.month,
                content = month.content,
                empty = month.empty;

            that.month = {
                content: template('<td#=data.cssClass# role="gridcell"><a tabindex="-1" class="k-link#=data.linkClass#" href="#=data.url#" ' + kendo.attr("value") + '="#=data.dateString#" title="#=data.title#">' + (content || "#=data.value#") + '</a></td>', { useWithBlock: !!content }),
                empty: template('<td role="gridcell">' + (empty || "&nbsp;") + "</td>", { useWithBlock: !!empty })
            };

            that.footer = footer !== false ? template(footer || '#= kendo.toString(data,"D","' + options.culture +'") #', { useWithBlock: false }) : null;
        }
    });

    ui.plugin(Calendar);

    var calendar = {
        firstDayOfMonth: function (date) {
            return new DATE(
                date.getFullYear(),
                date.getMonth(),
                1
            );
        },

        firstVisibleDay: function (date, calendarInfo) {
            calendarInfo = calendarInfo || kendo.culture().calendar;

            var firstDay = calendarInfo.firstDay,
            firstVisibleDay = new DATE(date.getFullYear(), date.getMonth(), 0, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

            while (firstVisibleDay.getDay() != firstDay) {
                calendar.setTime(firstVisibleDay, -1 * MS_PER_DAY);
            }

            return firstVisibleDay;
        },

        setTime: function (date, time) {
            var tzOffsetBefore = date.getTimezoneOffset(),
            resultDATE = new DATE(date.getTime() + time),
            tzOffsetDiff = resultDATE.getTimezoneOffset() - tzOffsetBefore;

            date.setTime(resultDATE.getTime() + tzOffsetDiff * MS_PER_MINUTE);
        },
        views: [{
            name: MONTH,
            title: function(date, min, max, culture) {
                return getCalendarInfo(culture).months.names[date.getMonth()] + " " + date.getFullYear();
            },
            content: function(options) {
                var that = this,
                idx = 0,
                min = options.min,
                max = options.max,
                date = options.date,
                dates = options.dates,
                format = options.format,
                culture = options.culture,
                navigateUrl = options.url,
                hasUrl = navigateUrl && dates[0],
                currentCalendar = getCalendarInfo(culture),
                firstDayIdx = currentCalendar.firstDay,
                days = currentCalendar.days,
                names = shiftArray(days.names, firstDayIdx),
                shortNames = shiftArray(days.namesShort, firstDayIdx),
                start = calendar.firstVisibleDay(date, currentCalendar),
                firstDayOfMonth = that.first(date),
                lastDayOfMonth = that.last(date),
                toDateString = that.toDateString,
                today = new DATE(),
                html = '<table tabindex="0" role="grid" class="k-content" cellspacing="0"><thead><tr role="row">';

                for (; idx < 7; idx++) {
                    html += '<th scope="col" title="' + names[idx] + '">' + shortNames[idx] + '</th>';
                }

                today = new DATE(today.getFullYear(), today.getMonth(), today.getDate());
                adjustDST(today, 0);
                today = +today;

                start = new DATE(start.getFullYear(), start.getMonth(), start.getDate());
                adjustDST(start, 0);

                return view({
                    cells: 42,
                    perRow: 7,
                    html: html += '</tr></thead><tbody><tr role="row">',
                    start: start,
                    min: new DATE(min.getFullYear(), min.getMonth(), min.getDate()),
                    max: new DATE(max.getFullYear(), max.getMonth(), max.getDate()),
                    content: options.content,
                    empty: options.empty,
                    setter: that.setDate,
                    build: function(date) {
                        var cssClass = [],
                            day = date.getDay(),
                            linkClass = "",
                            url = "#";

                        if (date < firstDayOfMonth || date > lastDayOfMonth) {
                            cssClass.push(OTHERMONTH);
                        }

                        if (+date === today) {
                            cssClass.push("k-today");
                        }

                        if (day === 0 || day === 6) {
                            cssClass.push("k-weekend");
                        }

                        if (hasUrl && inArray(+date, dates)) {
                            url = navigateUrl.replace("{0}", kendo.toString(date, format, culture));
                            linkClass = " k-action-link";
                        }

                        return {
                            date: date,
                            dates: dates,
                            ns: kendo.ns,
                            title: kendo.toString(date, "D", culture),
                            value: date.getDate(),
                            dateString: toDateString(date),
                            cssClass: cssClass[0] ? ' class="' + cssClass.join(" ") + '"' : "",
                            linkClass: linkClass,
                            url: url
                        };
                    }
                });
            },
            first: function(date) {
                return calendar.firstDayOfMonth(date);
            },
            last: function(date) {
                var last = new DATE(date.getFullYear(), date.getMonth() + 1, 0),
                    first = calendar.firstDayOfMonth(date),
                    timeOffset = Math.abs(last.getTimezoneOffset() - first.getTimezoneOffset());

                if (timeOffset) {
                    last.setHours(first.getHours() + (timeOffset / 60));
                }

                return last;
            },
            compare: function(date1, date2) {
                var result,
                month1 = date1.getMonth(),
                year1 = date1.getFullYear(),
                month2 = date2.getMonth(),
                year2 = date2.getFullYear();

                if (year1 > year2) {
                    result = 1;
                } else if (year1 < year2) {
                    result = -1;
                } else {
                    result = month1 == month2 ? 0 : month1 > month2 ? 1 : -1;
                }

                return result;
            },
            setDate: function(date, value) {
                var hours = date.getHours();
                if (value instanceof DATE) {
                    date.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
                } else {
                    calendar.setTime(date, value * MS_PER_DAY);
                }
                adjustDST(date, hours);
            },
            toDateString: function(date) {
                return date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate();
            }
        },
        {
            name: "year",
            title: function(date) {
                return date.getFullYear();
            },
            content: function(options) {
                var namesAbbr = getCalendarInfo(options.culture).months.namesAbbr,
                toDateString = this.toDateString,
                min = options.min,
                max = options.max;

                return view({
                    min: new DATE(min.getFullYear(), min.getMonth(), 1),
                    max: new DATE(max.getFullYear(), max.getMonth(), 1),
                    start: new DATE(options.date.getFullYear(), 0, 1),
                    setter: this.setDate,
                    build: function(date) {
                        return {
                            value: namesAbbr[date.getMonth()],
                            ns: kendo.ns,
                            dateString: toDateString(date),
                            cssClass: ""
                        };
                    }
                });
            },
            first: function(date) {
                return new DATE(date.getFullYear(), 0, date.getDate());
            },
            last: function(date) {
                return new DATE(date.getFullYear(), 11, date.getDate());
            },
            compare: function(date1, date2){
                return compare(date1, date2);
            },
            setDate: function(date, value) {
                var month,
                    hours = date.getHours();

                if (value instanceof DATE) {
                    month = value.getMonth();

                    date.setFullYear(value.getFullYear(), month, date.getDate());

                    if (month !== date.getMonth()) {
                        date.setDate(0);
                    }
                } else {
                    month = date.getMonth() + value;

                    date.setMonth(month);

                    if (month > 11) {
                        month -= 12;
                    }

                    if (month > 0 && date.getMonth() != month) {
                        date.setDate(0);
                    }
                }

                adjustDST(date, hours);
            },
            toDateString: function(date) {
                return date.getFullYear() + "/" + date.getMonth() + "/1";
            }
        },
        {
            name: "decade",
            title: function(date, min, max) {
                return title(date, min, max, 10);
            },
            content: function(options) {
                var year = options.date.getFullYear(),
                toDateString = this.toDateString;

                return view({
                    start: new DATE(year - year % 10 - 1, 0, 1),
                    min: new DATE(options.min.getFullYear(), 0, 1),
                    max: new DATE(options.max.getFullYear(), 0, 1),
                    setter: this.setDate,
                    build: function(date, idx) {
                        return {
                            value: date.getFullYear(),
                            ns: kendo.ns,
                            dateString: toDateString(date),
                            cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ""
                        };
                    }
                });
            },
            first: function(date) {
                var year = date.getFullYear();
                return new DATE(year - year % 10, date.getMonth(), date.getDate());
            },
            last: function(date) {
                var year = date.getFullYear();
                return new DATE(year - year % 10 + 9, date.getMonth(), date.getDate());
            },
            compare: function(date1, date2) {
                return compare(date1, date2, 10);
            },
            setDate: function(date, value) {
                setDate(date, value, 1);
            },
            toDateString: function(date) {
                return date.getFullYear() + "/0/1";
            }
        },
        {
            name: CENTURY,
            title: function(date, min, max) {
                return title(date, min, max, 100);
            },
            content: function(options) {
                var year = options.date.getFullYear(),
                min = options.min.getFullYear(),
                max = options.max.getFullYear(),
                toDateString = this.toDateString,
                minYear = min,
                maxYear = max;

                minYear = minYear - minYear % 10;
                maxYear = maxYear - maxYear % 10;

                if (maxYear - minYear < 10) {
                    maxYear = minYear + 9;
                }

                return view({
                    start: new DATE(year - year % 100 - 10, 0, 1),
                    min: new DATE(minYear, 0, 1),
                    max: new DATE(maxYear, 0, 1),
                    setter: this.setDate,
                    build: function(date, idx) {
                        var start = date.getFullYear(),
                            end = start + 9;

                        if (start < min) {
                            start = min;
                        }

                        if (end > max) {
                            end = max;
                        }

                        return {
                            ns: kendo.ns,
                            value: start + " - " + end,
                            dateString: toDateString(date),
                            cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ""
                        };
                    }
                });
            },
            first: function(date) {
                var year = date.getFullYear();
                return new DATE(year - year % 100, date.getMonth(), date.getDate());
            },
            last: function(date) {
                var year = date.getFullYear();
                return new DATE(year - year % 100 + 99, date.getMonth(), date.getDate());
            },
            compare: function(date1, date2) {
                return compare(date1, date2, 100);
            },
            setDate: function(date, value) {
                setDate(date, value, 10);
            },
            toDateString: function(date) {
                var year = date.getFullYear();
                return (year - year % 10) + "/0/1";
            }
        }]
    };

    function title(date, min, max, modular) {
        var start = date.getFullYear(),
            minYear = min.getFullYear(),
            maxYear = max.getFullYear(),
            end;

        start = start - start % modular;
        end = start + (modular - 1);

        if (start < minYear) {
            start = minYear;
        }
        if (end > maxYear) {
            end = maxYear;
        }

        return start + "-" + end;
    }

    function view(options) {
        var idx = 0,
            data,
            min = options.min,
            max = options.max,
            start = options.start,
            setter = options.setter,
            build = options.build,
            length = options.cells || 12,
            cellsPerRow = options.perRow || 4,
            content = options.content || cellTemplate,
            empty = options.empty || emptyCellTemplate,
            html = options.html || '<table tabindex="0" role="grid" class="k-content k-meta-view" cellspacing="0"><tbody><tr role="row">';

        for(; idx < length; idx++) {
            if (idx > 0 && idx % cellsPerRow === 0) {
                html += '</tr><tr role="row">';
            }

            data = build(start, idx);

            html += isInRange(start, min, max) ? content(data) : empty(data);

            setter(start, 1);
        }

        return html + "</tr></tbody></table>";
    }

    function compare(date1, date2, modifier) {
        var year1 = date1.getFullYear(),
            start  = date2.getFullYear(),
            end = start,
            result = 0;

        if (modifier) {
            start = start - start % modifier;
            end = start - start % modifier + modifier - 1;
        }

        if (year1 > end) {
            result = 1;
        } else if (year1 < start) {
            result = -1;
        }

        return result;
    }

    function getToday() {
        var today = new DATE();
        return new DATE(today.getFullYear(), today.getMonth(), today.getDate());
    }

    function restrictValue (value, min, max) {
        var today = getToday();

        if (value) {
            today = new DATE(+value);
        }

        if (min > today) {
            today = new DATE(+min);
        } else if (max < today) {
            today = new DATE(+max);
        }
        return today;
    }

    function isInRange(date, min, max) {
        return +date >= +min && +date <= +max;
    }

    function shiftArray(array, idx) {
        return array.slice(idx).concat(array.slice(0, idx));
    }

    function setDate(date, value, multiplier) {
        value = value instanceof DATE ? value.getFullYear() : date.getFullYear() + multiplier * value;
        date.setFullYear(value);
    }

    function mousetoggle(e) {
        $(this).toggleClass(HOVER, MOUSEENTER.indexOf(e.type) > -1 || e.type == FOCUS);
    }

    function prevent (e) {
        e.preventDefault();
    }

    function getCalendarInfo(culture) {
        return getCulture(culture).calendars.standard;
    }

    function normalize(options) {
        var start = views[options.start],
            depth = views[options.depth],
            culture = getCulture(options.culture);

        options.format = extractFormat(options.format || culture.calendars.standard.patterns.d);

        if (isNaN(start)) {
            start = 0;
            options.start = MONTH;
        }

        if (depth === undefined || depth > start) {
            options.depth = MONTH;
        }

        if (!options.dates) {
            options.dates = [];
        }
    }

    function makeUnselectable(element) {
        if (isIE8) {
            element.find("*").attr("unselectable", "on");
        }
    }

    function inArray(date, dates) {
        for(var i = 0, length = dates.length; i < length; i++) {
            if (date === +dates[i]) {
                return true;
            }
        }
        return false;
    }

    function isEqualDatePart(value1, value2) {
        if (value1) {
            return value1.getFullYear() === value2.getFullYear() &&
                   value1.getMonth() === value2.getMonth() &&
                   value1.getDate() === value2.getDate();
        }

        return false;
    }

    function isEqualMonth(value1, value2) {
        if (value1) {
            return value1.getFullYear() === value2.getFullYear() &&
                   value1.getMonth() === value2.getMonth();
        }

        return false;
    }

    calendar.isEqualDatePart = isEqualDatePart;
    calendar.makeUnselectable =  makeUnselectable;
    calendar.restrictValue = restrictValue;
    calendar.isInRange = isInRange;
    calendar.normalize = normalize;
    calendar.viewsEnum = views;

    kendo.calendar = calendar;
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.calendar", "./kendo.popup" ], f);
})(function(){

var __meta__ = {
    id: "datepicker",
    name: "DatePicker",
    category: "web",
    description: "The DatePicker widget allows the user to select a date from a calendar or by direct input.",
    depends: [ "calendar", "popup" ]
};

(function($, undefined) {
    var kendo = window.kendo,
    ui = kendo.ui,
    Widget = ui.Widget,
    parse = kendo.parseDate,
    keys = kendo.keys,
    template = kendo.template,
    activeElement = kendo._activeElement,
    DIV = "<div />",
    SPAN = "<span />",
    ns = ".kendoDatePicker",
    CLICK = "click" + ns,
    OPEN = "open",
    CLOSE = "close",
    CHANGE = "change",
    DATEVIEW = "dateView",
    DISABLED = "disabled",
    READONLY = "readonly",
    DEFAULT = "k-state-default",
    FOCUSED = "k-state-focused",
    SELECTED = "k-state-selected",
    STATEDISABLED = "k-state-disabled",
    HOVER = "k-state-hover",
    KEYDOWN = "keydown" + ns,
    HOVEREVENTS = "mouseenter" + ns + " mouseleave" + ns,
    MOUSEDOWN = "mousedown" + ns,
    ID = "id",
    MIN = "min",
    MAX = "max",
    MONTH = "month",
    ARIA_DISABLED = "aria-disabled",
    ARIA_EXPANDED = "aria-expanded",
    ARIA_HIDDEN = "aria-hidden",
    ARIA_READONLY = "aria-readonly",
    calendar = kendo.calendar,
    isInRange = calendar.isInRange,
    restrictValue = calendar.restrictValue,
    isEqualDatePart = calendar.isEqualDatePart,
    extend = $.extend,
    proxy = $.proxy,
    DATE = Date;

    function normalize(options) {
        var parseFormats = options.parseFormats,
            format = options.format;

        calendar.normalize(options);


        parseFormats = $.isArray(parseFormats) ? parseFormats : [parseFormats];

        if (!parseFormats.length) {
            parseFormats.push("yyyy-MM-dd");
        }

        if ($.inArray(format, parseFormats) === -1) {
            parseFormats.splice(0, 0, options.format);
        }

        options.parseFormats = parseFormats;
    }

    function preventDefault(e) {
        e.preventDefault();
    }

    var DateView = function(options) {
        var that = this, id,
            body = document.body,
            div = $(DIV).attr(ARIA_HIDDEN, "true")
                        .addClass("k-calendar-container")
                        .appendTo(body);

        that.options = options = options || {};
        id = options.id;

        if (id) {
            id += "_dateview";

            div.attr(ID, id);
            that._dateViewID = id;
        }

        that.popup = new ui.Popup(div, extend(options.popup, options, { name: "Popup", isRtl: kendo.support.isRtl(options.anchor) }));
        that.div = div;

        that.value(options.value);
    };

    DateView.prototype = {
        _calendar: function() {
            var that = this;
            var calendar = that.calendar;
            var options = that.options;
            var div;

            if (!calendar) {
                div = $(DIV).attr(ID, kendo.guid())
                            .appendTo(that.popup.element)
                            .on(MOUSEDOWN, preventDefault)
                            .on(CLICK, "td:has(.k-link)", proxy(that._click, that));

                that.calendar = calendar = new ui.Calendar(div);
                that._setOptions(options);

                kendo.calendar.makeUnselectable(calendar.element);

                calendar.navigate(that._value || that._current, options.start);

                that.value(that._value);
            }
        },

        _setOptions: function(options) {
            this.calendar.setOptions({
                focusOnNav: false,
                change: options.change,
                culture: options.culture,
                dates: options.dates,
                depth: options.depth,
                footer: options.footer,
                format: options.format,
                max: options.max,
                min: options.min,
                month: options.month,
                start: options.start
            });
        },

        setOptions: function(options) {
            var old = this.options;

            this.options = extend(old, options, {
                change: old.change,
                close: old.close,
                open: old.open
            });

            if (this.calendar) {
                this._setOptions(this.options);
            }
        },

        destroy: function() {
            this.popup.destroy();
        },

        open: function() {
            var that = this;

            that._calendar();
            that.popup.open();
        },

        close: function() {
            this.popup.close();
        },

        min: function(value) {
            this._option(MIN, value);
        },

        max: function(value) {
            this._option(MAX, value);
        },

        toggle: function() {
            var that = this;

            that[that.popup.visible() ? CLOSE : OPEN]();
        },

        move: function(e) {
            var that = this,
                key = e.keyCode,
                calendar = that.calendar,
                selectIsClicked = e.ctrlKey && key == keys.DOWN || key == keys.ENTER,
                handled = false;

            if (e.altKey) {
                if (key == keys.DOWN) {
                    that.open();
                    e.preventDefault();
                    handled = true;
                } else if (key == keys.UP) {
                    that.close();
                    e.preventDefault();
                    handled = true;
                }

            } else if (that.popup.visible()) {

                if (key == keys.ESC || (selectIsClicked && calendar._cell.hasClass(SELECTED))) {
                    that.close();
                    e.preventDefault();
                    return true;
                }

                that._current = calendar._move(e);
                handled = true;
            }

            return handled;
        },

        current: function(date) {
            this._current = date;
            this.calendar._focus(date);
        },

        value: function(value) {
            var that = this,
                calendar = that.calendar,
                options = that.options;

            that._value = value;
            that._current = new DATE(+restrictValue(value, options.min, options.max));

            if (calendar) {
                calendar.value(value);
            }
        },

        _click: function(e) {
            if (e.currentTarget.className.indexOf(SELECTED) !== -1) {
                this.close();
            }
        },

        _option: function(option, value) {
            var that = this;
            var calendar = that.calendar;

            that.options[option] = value;

            if (calendar) {
                calendar[option](value);
            }
        }
    };

    DateView.normalize = normalize;

    kendo.DateView = DateView;

    var DatePicker = Widget.extend({
        init: function(element, options) {
            var that = this,
                disabled,
                div;

            Widget.fn.init.call(that, element, options);
            element = that.element;
            options = that.options;

            options.min = parse(element.attr("min")) || parse(options.min);
            options.max = parse(element.attr("max")) || parse(options.max);

            normalize(options);

            that._initialOptions = extend({}, options);

            that._wrapper();

            that.dateView = new DateView(extend({}, options, {
                id: element.attr(ID),
                anchor: that.wrapper,
                change: function() {
                    // calendar is the current scope
                    that._change(this.value());
                    that.close();
                },
                close: function(e) {
                    if (that.trigger(CLOSE)) {
                        e.preventDefault();
                    } else {
                        element.attr(ARIA_EXPANDED, false);
                        div.attr(ARIA_HIDDEN, true);
                    }
                },
                open: function(e) {
                    var options = that.options,
                        date;

                    if (that.trigger(OPEN)) {
                        e.preventDefault();
                    } else {
                        if (that.element.val() !== that._oldText) {
                            date = parse(element.val(), options.parseFormats, options.culture);

                            that.dateView[date ? "current" : "value"](date);
                        }

                        element.attr(ARIA_EXPANDED, true);
                        div.attr(ARIA_HIDDEN, false);

                        that._updateARIA(date);

                    }
                }
            }));
            div = that.dateView.div;

            that._icon();

            try {
                element[0].setAttribute("type", "text");
            } catch(e) {
                element[0].type = "text";
            }

            element
                .addClass("k-input")
                .attr({
                    role: "combobox",
                    "aria-expanded": false,
                    "aria-owns": that.dateView._dateViewID
                });

            that._reset();
            that._template();

            disabled = element.is("[disabled]") || $(that.element).parents("fieldset").is(':disabled');
            if (disabled) {
                that.enable(false);
            } else {
                that.readonly(element.is("[readonly]"));
            }

            that._old = that._update(options.value || that.element.val());
            that._oldText = element.val();

            kendo.notify(that);
        },
        events: [
        OPEN,
        CLOSE,
        CHANGE],
        options: {
            name: "DatePicker",
            value: null,
            footer: "",
            format: "",
            culture: "",
            parseFormats: [],
            min: new Date(1900, 0, 1),
            max: new Date(2099, 11, 31),
            start: MONTH,
            depth: MONTH,
            animation: {},
            month : {},
            dates: [],
            ARIATemplate: 'Current focused date is #=kendo.toString(data.current, "D")#'
        },

        setOptions: function(options) {
            var that = this;
            var value = that._value;

            Widget.fn.setOptions.call(that, options);

            options = that.options;

            options.min = parse(options.min);
            options.max = parse(options.max);

            normalize(options);

            that.dateView.setOptions(options);

            if (value) {
                that.element.val(kendo.toString(value, options.format, options.culture));
                that._updateARIA(value);
            }
        },

        _editable: function(options) {
            var that = this,
                icon = that._dateIcon.off(ns),
                element = that.element.off(ns),
                wrapper = that._inputWrapper.off(ns),
                readonly = options.readonly,
                disable = options.disable;

            if (!readonly && !disable) {
                wrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover);

                element.removeAttr(DISABLED)
                       .removeAttr(READONLY)
                       .attr(ARIA_DISABLED, false)
                       .attr(ARIA_READONLY, false)
                       .on("keydown" + ns, proxy(that._keydown, that))
                       .on("focusout" + ns, proxy(that._blur, that))
                       .on("focus" + ns, function() {
                           that._inputWrapper.addClass(FOCUSED);
                       });

               icon.on(CLICK, proxy(that._click, that))
                   .on(MOUSEDOWN, preventDefault);
            } else {
                wrapper
                    .addClass(disable ? STATEDISABLED : DEFAULT)
                    .removeClass(disable ? DEFAULT : STATEDISABLED);

                element.attr(DISABLED, disable)
                       .attr(READONLY, readonly)
                       .attr(ARIA_DISABLED, disable)
                       .attr(ARIA_READONLY, readonly);
            }
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);

            that.dateView.destroy();

            that.element.off(ns);
            that._dateIcon.off(ns);
            that._inputWrapper.off(ns);

            if (that._form) {
                that._form.off("reset", that._resetHandler);
            }
        },

        open: function() {
            this.dateView.open();
        },

        close: function() {
            this.dateView.close();
        },

        min: function(value) {
            return this._option(MIN, value);
        },

        max: function(value) {
            return this._option(MAX, value);
        },

        value: function(value) {
            var that = this;

            if (value === undefined) {
                return that._value;
            }

            that._old = that._update(value);

            if (that._old === null) {
                that.element.val("");
            }

            that._oldText = that.element.val();
        },

        _toggleHover: function(e) {
            $(e.currentTarget).toggleClass(HOVER, e.type === "mouseenter");
        },

        _blur: function() {
            var that = this,
                value = that.element.val();

            that.close();
            if (value !== that._oldText) {
                that._change(value);
            }

            that._inputWrapper.removeClass(FOCUSED);
        },

        _click: function() {
            var that = this,
                element = that.element;

            that.dateView.toggle();

            if (!kendo.support.touch && element[0] !== activeElement()) {
                element.focus();
            }
        },

        _change: function(value) {
            var that = this;

            value = that._update(value);

            if (+that._old != +value) {
                that._old = value;
                that._oldText = that.element.val();

                if (!that._typing) {
                    // trigger the DOM change event so any subscriber gets notified
                    that.element.trigger(CHANGE);
                }

                that.trigger(CHANGE);
            }

            that._typing = false;
        },

        _keydown: function(e) {
            var that = this,
                dateView = that.dateView,
                value = that.element.val(),
                handled = false;

            if (!dateView.popup.visible() && e.keyCode == keys.ENTER && value !== that._oldText) {
                that._change(value);
            } else {
                handled = dateView.move(e);
                that._updateARIA(dateView._current);

                if (!handled) {
                    that._typing = true;
                }
            }
        },

        _icon: function() {
            var that = this,
                element = that.element,
                icon;

            icon = element.next("span.k-select");

            if (!icon[0]) {
                icon = $('<span unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-calendar">select</span></span>').insertAfter(element);
            }

            that._dateIcon = icon.attr({
                "role": "button",
                "aria-controls": that.dateView._dateViewID
            });
        },

        _option: function(option, value) {
            var that = this,
                options = that.options;

            if (value === undefined) {
                return options[option];
            }

            value = parse(value, options.parseFormats, options.culture);

            if (!value) {
                return;
            }

            options[option] = new DATE(+value);
            that.dateView[option](value);
        },

        _update: function(value) {
            var that = this,
                options = that.options,
                min = options.min,
                max = options.max,
                current = that._value,
                date = parse(value, options.parseFormats, options.culture),
                isSameType = (date === null && current === null) || (date instanceof Date && current instanceof Date),
                formattedValue;

            if (+date === +current && isSameType) {
                formattedValue = kendo.toString(date, options.format, options.culture);

                if (formattedValue !== value) {
                    that.element.val(date === null ? value : formattedValue);
                }

                return date;
            }

            if (date !== null && isEqualDatePart(date, min)) {
                date = restrictValue(date, min, max);
            } else if (!isInRange(date, min, max)) {
                date = null;
            }

            that._value = date;
            that.dateView.value(date);
            that.element.val(date ? kendo.toString(date, options.format, options.culture) : value);
            that._updateARIA(date);

            return date;
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                wrapper;

            wrapper = element.parents(".k-datepicker");

            if (!wrapper[0]) {
                wrapper = element.wrap(SPAN).parent().addClass("k-picker-wrap k-state-default");
                wrapper = wrapper.wrap(SPAN).parent();
            }

            wrapper[0].style.cssText = element[0].style.cssText;
            element.css({
                width: "100%",
                height: element[0].style.height
            });

            that.wrapper = wrapper.addClass("k-widget k-datepicker k-header")
                                  .addClass(element[0].className);

            that._inputWrapper = $(wrapper[0].firstChild);
        },

        _reset: function() {
            var that = this,
                element = that.element,
                formId = element.attr("form"),
                form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    that.value(element[0].defaultValue);
                    that.max(that._initialOptions.max);
                    that.min(that._initialOptions.min);
                };

                that._form = form.on("reset", that._resetHandler);
            }
        },

        _template: function() {
            this._ariaTemplate = template(this.options.ARIATemplate);
        },

        _updateARIA: function(date) {
            var cell;
            var that = this;
            var calendar = that.dateView.calendar;

            that.element.removeAttr("aria-activedescendant");

            if (calendar) {
                cell = calendar._cell;
                cell.attr("aria-label", that._ariaTemplate({ current: date || calendar.current() }));

                that.element.attr("aria-activedescendant", cell.attr("id"));
            }
        }
    });

    ui.plugin(DatePicker);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.list", "./kendo.mobile.scroller" ], f);
})(function(){

var __meta__ = {
    id: "autocomplete",
    name: "AutoComplete",
    category: "web",
    description: "The AutoComplete widget provides suggestions depending on the typed text.It also allows multiple value entries.",
    depends: [ "list" ],
    features: [ {
        id: "mobile-scroller",
        name: "Mobile scroller",
        description: "Support for kinetic scrolling in mobile device",
        depends: [ "mobile.scroller" ]
    }, {
        id: "virtualization",
        name: "VirtualList",
        description: "Support for virtualization",
        depends: [ "virtuallist" ]
    } ]
};

(function ($, undefined) {
    var kendo = window.kendo,
        support = kendo.support,
        caret = kendo.caret,
        activeElement = kendo._activeElement,
        placeholderSupported = support.placeholder,
        ui = kendo.ui,
        List = ui.List,
        keys = kendo.keys,
        DataSource = kendo.data.DataSource,
        ARIA_DISABLED = "aria-disabled",
        ARIA_READONLY = "aria-readonly",
        DEFAULT = "k-state-default",
        DISABLED = "disabled",
        READONLY = "readonly",
        FOCUSED = "k-state-focused",
        SELECTED = "k-state-selected",
        STATEDISABLED = "k-state-disabled",
        HOVER = "k-state-hover",
        ns = ".kendoAutoComplete",
        HOVEREVENTS = "mouseenter" + ns + " mouseleave" + ns,
        proxy = $.proxy;

    function indexOfWordAtCaret(caretIdx, text, separator) {
        return separator ? text.substring(0, caretIdx).split(separator).length - 1 : 0;
    }

    function wordAtCaret(caretIdx, text, separator) {
        return text.split(separator)[indexOfWordAtCaret(caretIdx, text, separator)];
    }

    function replaceWordAtCaret(caretIdx, text, word, separator) {
        var words = text.split(separator);

        words.splice(indexOfWordAtCaret(caretIdx, text, separator), 1, word);

        if (separator && words[words.length - 1] !== "") {
            words.push("");
        }

        return words.join(separator);
    }

    var AutoComplete = List.extend({
        init: function (element, options) {
            var that = this, wrapper, disabled;

            that.ns = ns;
            options = $.isArray(options) ? { dataSource: options} : options;

            List.fn.init.call(that, element, options);

            element = that.element;
            options = that.options;

            options.placeholder = options.placeholder || element.attr("placeholder");
            if (placeholderSupported) {
                element.attr("placeholder", options.placeholder);
            }

            that._wrapper();
            that._loader();

            that._dataSource();
            that._ignoreCase();

            element[0].type = "text";
            wrapper = that.wrapper;

            that._popup();

            element
                .addClass("k-input")
                .on("keydown" + ns, proxy(that._keydown, that))
                .on("paste" + ns, proxy(that._search, that))
                .on("focus" + ns, function () {
                    that._prev = that._accessor();
                    that._placeholder(false);
                    wrapper.addClass(FOCUSED);
                })
                .on("focusout" + ns, function () {
                    that._change();
                    that._placeholder();
                    wrapper.removeClass(FOCUSED);
                })
                .attr({
                    autocomplete: "off",
                    role: "textbox",
                    "aria-haspopup": true
                });

            that._enable();

            that._old = that._accessor();

            if (element[0].id) {
                element.attr("aria-owns", that.ul[0].id);
            }

            that._aria();

            that._placeholder();

            that._initList();

            disabled = $(that.element).parents("fieldset").is(':disabled');

            if (disabled) {
                that.enable(false);
            }

            kendo.notify(that);
        },

        options: {
            name: "AutoComplete",
            enabled: true,
            suggest: false,
            template: "",
            groupTemplate: "#:data#",
            fixedGroupTemplate: "#:data#",
            dataTextField: "",
            minLength: 1,
            delay: 200,
            height: 200,
            filter: "startswith",
            ignoreCase: true,
            highlightFirst: false,
            separator: null,
            placeholder: "",
            animation: {},
            value: null
        },

        _dataSource: function() {
            var that = this;

            if (that.dataSource && that._refreshHandler) {
                that._unbindDataSource();
            } else {
                that._progressHandler = proxy(that._showBusy, that);
            }

            that.dataSource = DataSource.create(that.options.dataSource)
                .bind("progress", that._progressHandler);
        },

        setDataSource: function(dataSource) {
            this.options.dataSource = dataSource;
            this._dataSource();

            this.listView.setDataSource(this.dataSource);
        },

        events: [
            "open",
            "close",
            "change",
            "select",
            "filtering",
            "dataBinding",
            "dataBound"
        ],

        setOptions: function(options) {
            var listOptions = this._listOptions(options);

            List.fn.setOptions.call(this, options);

            listOptions.dataValueField = listOptions.dataTextField;

            this.listView.setOptions(listOptions);
            this._accessors();
            this._aria();
        },

        _editable: function(options) {
            var that = this,
                element = that.element,
                wrapper = that.wrapper.off(ns),
                readonly = options.readonly,
                disable = options.disable;

            if (!readonly && !disable) {
                wrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover);

                element.removeAttr(DISABLED)
                       .removeAttr(READONLY)
                       .attr(ARIA_DISABLED, false)
                       .attr(ARIA_READONLY, false);
            } else {
                wrapper
                    .addClass(disable ? STATEDISABLED : DEFAULT)
                    .removeClass(disable ? DEFAULT : STATEDISABLED);

                element.attr(DISABLED, disable)
                       .attr(READONLY, readonly)
                       .attr(ARIA_DISABLED, disable)
                       .attr(ARIA_READONLY, readonly);
            }
        },

        close: function () {
            var that = this;
            var current = that.listView.focus();

            if (current) {
                current.removeClass(SELECTED);
            }

            that.popup.close();
        },

        destroy: function() {
            var that = this;

            that.element.off(ns);
            that.wrapper.off(ns);

            List.fn.destroy.call(that);
        },

        refresh: function() {
            this.listView.refresh();
        },

        select: function (li) {
            this._select(li);
        },

        search: function (word) {
            var that = this,
            options = that.options,
            ignoreCase = options.ignoreCase,
            separator = options.separator,
            length;

            word = word || that._accessor();

            clearTimeout(that._typingTimeout);

            if (separator) {
                word = wordAtCaret(caret(that.element)[0], word, separator);
            }

            length = word.length;

            if (!length || length >= options.minLength) {
                that._open = true;

                that.listView.filter(true);
                that._filterSource({
                    value: ignoreCase ? word.toLowerCase() : word,
                    operator: options.filter,
                    field: options.dataTextField,
                    ignoreCase: ignoreCase
                });
            }
        },

        suggest: function (word) {
            var that = this,
                key = that._last,
                value = that._accessor(),
                element = that.element[0],
                caretIdx = caret(element)[0],
                separator = that.options.separator,
                words = value.split(separator),
                wordIndex = indexOfWordAtCaret(caretIdx, value, separator),
                selectionEnd = caretIdx,
                idx;

            if (key == keys.BACKSPACE || key == keys.DELETE) {
                that._last = undefined;
                return;
            }

            word = word || "";

            if (typeof word !== "string") {
                if (word[0]) {
                    word = that.dataSource.view()[List.inArray(word[0], that.ul[0])];
                }

                word = word ? that._text(word) : "";
            }

            if (caretIdx <= 0) {
                caretIdx = value.toLowerCase().indexOf(word.toLowerCase()) + 1;
            }

            idx = value.substring(0, caretIdx).lastIndexOf(separator);
            idx = idx > -1 ? caretIdx - (idx + separator.length) : caretIdx;
            value = words[wordIndex].substring(0, idx);

            if (word) {
                word = word.toString();
                idx = word.toLowerCase().indexOf(value.toLowerCase());
                if (idx > -1) {
                    word = word.substring(idx + value.length);

                    selectionEnd = caretIdx + word.length;

                    value += word;
                }

                if (separator && words[words.length - 1] !== "") {
                    words.push("");
                }

            }

            words[wordIndex] = value;

            that._accessor(words.join(separator || ""));

            if (element === activeElement()) {
                caret(element, caretIdx, selectionEnd);
            }
        },

        value: function (value) {
            if (value !== undefined) {
                this.listView.value(value);

                this._accessor(value);
                this._old = this._accessor();
            } else {
                return this._accessor();
            }
        },

        _click: function(e) {
            var item = e.item;
            var element = this.element;

            if (this.trigger("select", { item: item })) {
                this.close();
                return;
            }

            this._select(item);
            this._blur();

            caret(element, element.val().length);
        },

        _initList: function() {
            var that = this;
            var virtual = that.options.virtual;
            var hasVirtual = !!virtual;

            var listBoundHandler = proxy(that._listBound, that);

            var listOptions = {
                autoBind: false,
                selectable: true,
                dataSource: that.dataSource,
                click: $.proxy(that._click, this),
                change: $.proxy(that._listChange, this),
                activate: proxy(that._activateItem, that),
                deactivate: proxy(that._deactivateItem, that),
                dataBinding: function() {
                    that.trigger("dataBinding");
                    that._angularItems("cleanup");
                },
                dataBound: listBoundHandler,
                listBound: listBoundHandler
            };

            listOptions = $.extend(that._listOptions(), listOptions, typeof virtual === "object" ? virtual : {});

            listOptions.dataValueField = listOptions.dataTextField;

            if (!hasVirtual) {
                that.listView = new kendo.ui.StaticList(that.ul, listOptions);
            } else {
                that.listView = new kendo.ui.VirtualList(that.ul, listOptions);
            }

            that.listView.value(that.options.value);
        },

        _listBound: function() {
            var that = this;
            var popup = that.popup;
            var options = that.options;
            var data = that.dataSource.flatView();
            var length = data.length;
            var isActive = that.element[0] === activeElement();
            var action;

            that._angularItems("compile");

            //reset list value
            that.listView.value([]);
            that.listView.focus(-1);

            that.listView.filter(false);

            that._calculateGroupPadding(that._height(length));

            popup.position();

            if (length) {
                var current = this.listView.focus();

                if (options.highlightFirst && !current) {
                    that.listView.first();
                }

                if (options.suggest && isActive) {
                    that.suggest(data[0]);
                }
            }

            if (that._open) {
                that._open = false;
                action = length ? "open" : "close";

                if (that._typingTimeout && !isActive) {
                    action = "close";
                }

                popup[action]();
                that._typingTimeout = undefined;
            }

            if (that._touchScroller) {
                that._touchScroller.reset();
            }

            that._hideBusy();
            that._makeUnselectable();
            that._hideBusy();

            that.trigger("dataBound");
        },

        _listChange: function() {
            if (!this.listView.filter()) {
                this._selectValue(this.listView.selectedDataItems()[0]);
            }
        },

        _selectValue: function(dataItem) {
            var separator = this.options.separator;
            var text = "";

            if (dataItem) {
                text = this._text(dataItem);
            }

            if (text === null) {
                text = "";
            }

            if (separator) {
                text = replaceWordAtCaret(caret(this.element)[0], this._accessor(), text, separator);
            }

            this._prev = text;
            this._accessor(text);
            this._placeholder();
        },

        _accessor: function (value) {
            var that = this,
                element = that.element[0];

            if (value !== undefined) {
                element.value = value === null ? "" : value;
                that._placeholder();
            } else {
                value = element.value;

                if (element.className.indexOf("k-readonly") > -1) {
                    if (value === that.options.placeholder) {
                        return "";
                    } else {
                        return value;
                    }
                }

                return value;
            }
        },

        _keydown: function (e) {
            var that = this;
            var key = e.keyCode;
            var visible = that.popup.visible();
            var current = this.listView.focus();

            that._last = key;

            if (key === keys.DOWN) {
                if (visible) {
                    this._move(current ? "next" : "first");
                }
                e.preventDefault();
            } else if (key === keys.UP) {
                if (visible) {
                    this._move(current ? "prev" : "last");
                }
                e.preventDefault();
            } else if (key === keys.ENTER || key === keys.TAB) {

                if (key === keys.ENTER && visible) {
                    e.preventDefault();
                }

                if (visible && current) {
                    if (that.trigger("select", { item: current })) {
                        return;
                    }

                    this._select(current);
                }

                this._blur();
            } else if (key === keys.ESC) {
                if (visible) {
                    e.preventDefault();
                }
                that.close();
            } else {
                that._search();
                that._typing = true;
            }
        },

        _move: function (action) {
            this.listView[action]();

            if (this.options.suggest) {
                this.suggest(this.listView.focus());
            }
        },

        _hideBusy: function () {
            var that = this;
            clearTimeout(that._busy);
            that._loading.hide();
            that.element.attr("aria-busy", false);
            that._busy = null;
        },

        _showBusy: function () {
            var that = this;

            if (that._busy) {
                return;
            }

            that._busy = setTimeout(function () {
                that.element.attr("aria-busy", true);
                that._loading.show();
            }, 100);
        },

        _placeholder: function(show) {
            if (placeholderSupported) {
                return;
            }

            var that = this,
                element = that.element,
                placeholder = that.options.placeholder,
                value;

            if (placeholder) {
                value = element.val();

                if (show === undefined) {
                    show = !value;
                }

                if (!show) {
                    if (value !== placeholder) {
                        placeholder = value;
                    } else {
                        placeholder = "";
                    }
                }

                if (value === that._old && !show) {
                    return;
                }

                element.toggleClass("k-readonly", show)
                       .val(placeholder);

                if (!placeholder && element[0] === document.activeElement) {
                    caret(element[0], 0, 0);
                }
            }
        },

        _search: function () {
            var that = this;
            clearTimeout(that._typingTimeout);

            that._typingTimeout = setTimeout(function () {
                if (that._prev !== that._accessor()) {
                    that._prev = that._accessor();
                    that.search();
                }
            }, that.options.delay);
        },

        _select: function(candidate) {
            this.listView.select(candidate);
        },

        _loader: function() {
            this._loading = $('<span class="k-icon k-loading" style="display:none"></span>').insertAfter(this.element);
        },

        _toggleHover: function(e) {
            $(e.currentTarget).toggleClass(HOVER, e.type === "mouseenter");
        },

        _wrapper: function () {
            var that = this,
                element = that.element,
                DOMelement = element[0],
                wrapper;

            wrapper = element.parent();

            if (!wrapper.is("span.k-widget")) {
                wrapper = element.wrap("<span />").parent();
            }

            wrapper.attr("tabindex", -1);
            wrapper.attr("role", "presentation");

            wrapper[0].style.cssText = DOMelement.style.cssText;
            element.css({
                width: "100%",
                height: DOMelement.style.height
            });

            that._focused = that.element;
            that.wrapper = wrapper
                              .addClass("k-widget k-autocomplete k-header")
                              .addClass(DOMelement.className);
        }
    });

    ui.plugin(AutoComplete);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.list", "./kendo.mobile.scroller" ], f);
})(function(){

var __meta__ = {
    id: "dropdownlist",
    name: "DropDownList",
    category: "web",
    description: "The DropDownList widget displays a list of values and allows the selection of a single value from the list.",
    depends: [ "list" ],
    features: [ {
        id: "mobile-scroller",
        name: "Mobile scroller",
        description: "Support for kinetic scrolling in mobile device",
        depends: [ "mobile.scroller" ]
    }, {
        id: "virtualization",
        name: "VirtualList",
        description: "Support for virtualization",
        depends: [ "virtuallist" ]
    } ]
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Select = ui.Select,
        support = kendo.support,
        activeElement = kendo._activeElement,
        ObservableObject = kendo.data.ObservableObject,
        keys = kendo.keys,
        ns = ".kendoDropDownList",
        DISABLED = "disabled",
        READONLY = "readonly",
        CHANGE = "change",
        FOCUSED = "k-state-focused",
        DEFAULT = "k-state-default",
        STATEDISABLED = "k-state-disabled",
        ARIA_DISABLED = "aria-disabled",
        ARIA_READONLY = "aria-readonly",
        SELECTED = "k-state-selected",
        HOVEREVENTS = "mouseenter" + ns + " mouseleave" + ns,
        TABINDEX = "tabindex",
        STATE_FILTER = "filter",
        STATE_ACCEPT = "accept",
        proxy = $.proxy;

    var DropDownList = Select.extend( {
        init: function(element, options) {
            var that = this;
            var index = options && options.index;
            var optionLabel, text, disabled;

            that.ns = ns;
            options = $.isArray(options) ? { dataSource: options } : options;

            Select.fn.init.call(that, element, options);

            options = that.options;
            element = that.element.on("focus" + ns, proxy(that._focusHandler, that));

            that._focusInputHandler = $.proxy(that._focusInput, that);
            that._inputTemplate();

            that._reset();

            that._prev = "";
            that._word = "";
            that.optionLabel = $();

            that._wrapper();

            that._tabindex();
            that.wrapper.data(TABINDEX, that.wrapper.attr(TABINDEX));

            that._span();

            that._popup();

            that._mobile();

            that._dataSource();
            that._ignoreCase();

            that._filterHeader();

            that._aria();

            that._enable();

            that._oldIndex = that.selectedIndex = -1;

            if (index !== undefined) {
                options.index = index;
            }

            that._initialIndex = options.index;
            that._optionLabel();
            that._initList();

            that._cascade();

            if (options.autoBind) {
                that.dataSource.fetch();
            } else if (that.selectedIndex === -1) { //selectedIndex !== -1 when cascade functionality happens instantly
                text = options.text || "";
                if (!text) {
                    optionLabel = options.optionLabel;

                    if (optionLabel && options.index === 0) {
                        text = optionLabel;
                    } else if (that._isSelect) {
                        text = element.children(":selected").text();
                    }
                }

                that._textAccessor(text);
            }

            disabled = $(that.element).parents("fieldset").is(':disabled');

            if (disabled) {
                that.enable(false);
            }

            kendo.notify(that);
        },

        options: {
            name: "DropDownList",
            enabled: true,
            autoBind: true,
            index: 0,
            text: null,
            value: null,
            delay: 500,
            height: 200,
            dataTextField: "",
            dataValueField: "",
            optionLabel: "",
            cascadeFrom: "",
            cascadeFromField: "",
            ignoreCase: true,
            animation: {},
            filter: "none",
            minLength: 1,
            virtual: false,
            template: null,
            valueTemplate: null,
            optionLabelTemplate: null,
            groupTemplate: "#:data#",
            fixedGroupTemplate: "#:data#"
        },

        events: [
            "open",
            "close",
            CHANGE,
            "select",
            "filtering",
            "dataBinding",
            "dataBound",
            "cascade"
        ],

        setOptions: function(options) {
            Select.fn.setOptions.call(this, options);

            this.listView.setOptions(this._listOptions(options));

            this._optionLabel();
            this._inputTemplate();
            this._accessors();
            this._filterHeader();
            this._enable();
            this._aria();

            if (!this.value() && this.optionLabel[0]) {
                this.select(0);
            }
        },

        destroy: function() {
            var that = this;

            that.wrapper.off(ns);
            that.element.off(ns);
            that._inputWrapper.off(ns);

            that._arrow.off();
            that._arrow = null;

            that.optionLabel.off();

            Select.fn.destroy.call(that);
        },

        open: function() {
            var that = this;

            if (that.popup.visible()) {
                return;
            }

            if (!that.listView.isBound() || that._state === STATE_ACCEPT) {
                that._open = true;
                that._state = "rebind";

                if (that.filterInput) {
                    that.filterInput.val("");
                    that._prev = "";
                }

                that._filterSource();
            } else if (that._allowOpening()) {
                that.popup.one("activate", that._focusInputHandler);
                that.popup.open();
                that._focusItem();
            }
        },

        _focusInput: function () {
            this._focusElement(this.filterInput);
        },

        _allowOpening: function(length) {
            return this.optionLabel[0] || this.filterInput || this.dataSource.view().length;
        },

        toggle: function(toggle) {
            this._toggle(toggle, true);
        },

        current: function(candidate) {
            var current;

            if (candidate === undefined) {
                current = this.listView.focus();

                if (!current && this.selectedIndex === 0 && this.optionLabel[0]) {
                    return this.optionLabel;
                }

                return current;
            }

            this._focus(candidate);
        },

        dataItem: function(index) {
            var that = this;
            var dataItem = null;
            var hasOptionLabel = !!that.optionLabel[0];
            var optionLabel = that.options.optionLabel;

            if (index === undefined) {
                dataItem = that.listView.selectedDataItems()[0];
            } else {
                if (typeof index !== "number") {
                    if (index.hasClass("k-list-optionlabel")) {
                        index = -1;
                    } else {
                        index = $(that.items()).index(index);
                    }
                } else if (hasOptionLabel) {
                    index -= 1;
                }

                dataItem = that.dataSource.flatView()[index];
            }

            if (!dataItem && hasOptionLabel) {
                dataItem = $.isPlainObject(optionLabel) ? new ObservableObject(optionLabel) : that._assignInstance(that._optionLabelText(), "");
            }

            return dataItem;
        },

        refresh: function() {
            this.listView.refresh();
        },

        text: function (text) {
            var that = this;
            var dataItem, loweredText;
            var ignoreCase = that.options.ignoreCase;

            text = text === null ? "" : text;

            if (text !== undefined) {
                if (typeof text === "string") {
                    loweredText = ignoreCase ? text.toLowerCase() : text;

                    that._select(function(data) {
                        data = that._text(data);

                        if (ignoreCase) {
                            data = (data + "").toLowerCase();
                        }

                        return data === loweredText;
                    });

                    dataItem = that.dataItem();

                    if (dataItem) {
                        text = dataItem;
                    }
                }

                that._textAccessor(text);
            } else {
                return that._textAccessor();
            }
        },

        value: function(value) {
            var that = this;
            var dataSource = that.dataSource;

            if (value === undefined) {
                value = that._accessor() || that.listView.value()[0];
                return value === undefined || value === null ? "" : value;
            }

            if (value) {
                that._initialIndex = null;
            }

            if (that._request && that.options.cascadeFrom && that.listView.isBound()) {
                if (that._valueSetter) {
                    dataSource.unbind(CHANGE, that._valueSetter);
                }

                that._valueSetter = proxy(function() { that.value(value); }, that);

                dataSource.one(CHANGE, that._valueSetter);
                return;
            }

            that.listView.value(value).done(function() {
                if (that.selectedIndex === -1 && that.text()) {
                    that.text("");
                    that._accessor("", -1);
                }

                that._old = that._accessor();
                that._oldIndex = that.selectedIndex;
            });

            that._fetchData();
        },

        _optionLabel: function() {
            var that = this;
            var options = that.options;
            var optionLabel = options.optionLabel;
            var template = options.optionLabelTemplate;

            if (!optionLabel) {
                that.optionLabel.off().remove();
                that.optionLabel = $();
                return;
            }

            if (!template) {
                template = "#:";

                if (typeof optionLabel === "string") {
                    template += "data";
                } else {
                    template += kendo.expr(options.dataTextField, "data");
                }

                template += "#";
            }

            if (typeof template !== "function") {
                template = kendo.template(template);
            }

            that.optionLabelTemplate = template;

            if (!that.optionLabel[0]) {
                that.optionLabel = $('<div class="k-list-optionlabel"></div>').prependTo(that.list);
            }

            that.optionLabel.html(template(optionLabel))
                            .off()
                            .click(proxy(that._click, that))
                            .on(HOVEREVENTS, that._toggleHover);

            that.angular("compile", function(){
                return { elements: that.optionLabel };
            });
        },

        _optionLabelText: function() {
            var optionLabel = this.options.optionLabel;
            return (typeof optionLabel === "string") ? optionLabel : this._text(optionLabel);
        },

        _listBound: function() {
            var that = this;
            var initialIndex = that._initialIndex;
            var optionLabel = that.options.optionLabel;
            var filtered = that._state === STATE_FILTER;
            var element = that.element[0];

            var data = that.dataSource.flatView();
            var length = data.length;
            var dataItem;

            var height;
            var value;

            that._angularItems("compile");

            that._presetValue = false;

            if (!that.options.virtual) {
                height = that._height(filtered ? (length || 1) : length);
                that._calculateGroupPadding(height);
            }

            that.popup.position();

            if (that._isSelect) {
                value = that.value();

                if (length) {
                    if (optionLabel) {
                        optionLabel = that._option("", that._optionLabelText());
                    }
                } else if (value) {
                    optionLabel = that._option(value, that.text());
                }

                that._options(data, optionLabel, value);
            }

            that._hideBusy();
            that._makeUnselectable();

            if (!filtered) {
                if (that._open) {
                    that.toggle(that._allowOpening());
                }

                that._open = false;

                if (!that._fetch) {
                    if (length) {
                        if (!that.listView.value().length && initialIndex > -1 && initialIndex !== null) {
                            that.select(initialIndex);
                        }

                        that._initialIndex = null;
                        dataItem = that.listView.selectedDataItems()[0];
                        if (dataItem && that.text() !== that._text(dataItem)) {
                            that._selectValue(dataItem);
                        }
                    } else if (that._textAccessor() !== that._optionLabelText()) {
                        that.listView.value("");
                        that._selectValue(null);
                        that._oldIndex = that.selectedIndex;
                    }
                }
            }

            that._hideBusy();
            that.trigger("dataBound");
        },

        _listChange: function() {
            this._selectValue(this.listView.selectedDataItems()[0]);

            if (this._presetValue || (this._old && this._oldIndex === -1)) {
                this._oldIndex = this.selectedIndex;
            }
        },

        _focusHandler: function() {
            this.wrapper.focus();
        },

        _focusinHandler: function() {
            this._inputWrapper.addClass(FOCUSED);
            this._prevent = false;
        },

        _focusoutHandler: function() {
            var that = this;
            var filtered = that._state === STATE_FILTER;
            var isIFrame = window.self !== window.top;
            var focusedItem = that._focus();

            if (!that._prevent) {
                clearTimeout(that._typingTimeout);

                if (filtered && focusedItem && !that.trigger("select", { item: focusedItem })) {
                    that._select(focusedItem, !that.dataSource.view().length);
                }

                if (support.mobileOS.ios && isIFrame) {
                    that._change();
                } else {
                    that._blur();
                }

                that._inputWrapper.removeClass(FOCUSED);
                that._prevent = true;
                that._open = false;
                that.element.blur();
            }
        },

        _wrapperMousedown: function() {
            this._prevent = !!this.filterInput;
        },

        _wrapperClick: function(e) {
            e.preventDefault();
            this.popup.unbind("activate", this._focusInputHandler);
            this._focused = this.wrapper;
            this._toggle();
        },

        _editable: function(options) {
            var that = this;
            var element = that.element;
            var disable = options.disable;
            var readonly = options.readonly;
            var wrapper = that.wrapper.add(that.filterInput).off(ns);
            var dropDownWrapper = that._inputWrapper.off(HOVEREVENTS);

            if (!readonly && !disable) {
                element.removeAttr(DISABLED).removeAttr(READONLY);

                dropDownWrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover);

                wrapper
                    .attr(TABINDEX, wrapper.data(TABINDEX))
                    .attr(ARIA_DISABLED, false)
                    .attr(ARIA_READONLY, false)
                    .on("keydown" + ns, proxy(that._keydown, that))
                    .on("focusin" + ns, proxy(that._focusinHandler, that))
                    .on("focusout" + ns, proxy(that._focusoutHandler, that))
                    .on("mousedown" + ns, proxy(that._wrapperMousedown, that));

                that.wrapper.on("click" + ns, proxy(that._wrapperClick, that));

                if (!that.filterInput) {
                    wrapper.on("keypress" + ns, proxy(that._keypress, that));
                }

            } else if (disable) {
                wrapper.removeAttr(TABINDEX);
                dropDownWrapper
                    .addClass(STATEDISABLED)
                    .removeClass(DEFAULT);
            } else {
                dropDownWrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED);

                wrapper
                    .on("focusin" + ns, proxy(that._focusinHandler, that))
                    .on("focusout" + ns, proxy(that._focusoutHandler, that));
            }

            element.attr(DISABLED, disable)
                   .attr(READONLY, readonly);

            wrapper.attr(ARIA_DISABLED, disable)
                   .attr(ARIA_READONLY, readonly);
        },

        _option: function(value, text) {
            return '<option value="' + value + '">' + text + "</option>";
        },

        _keydown: function(e) {
            var that = this;
            var key = e.keyCode;
            var altKey = e.altKey;
            var ul = that.ul[0];
            var isInputActive;
            var handled;

            var isPopupVisible = that.popup.visible();

            if (that.filterInput) {
                isInputActive = that.filterInput[0] === activeElement();
            }

            if (key === keys.LEFT) {
                key = keys.UP;
                handled = true;
            } else if (key === keys.RIGHT) {
                key = keys.DOWN;
                handled = true;
            }

            if (handled && isInputActive) {
                return;
            }

            e.keyCode = key;

            if (altKey && key === keys.UP) {
                that._focusElement(that.wrapper);
            }

            if (key === keys.ENTER && that._typingTimeout && that.filterInput && isPopupVisible) {
                e.preventDefault();
                return;
            }

            handled = that._move(e);

            if (handled) {
                return;
            }

            if (!isPopupVisible || !that.filterInput) {
                if (key === keys.HOME) {
                    handled = true;
                    that._firstItem();
                } else if (key === keys.END) {
                    handled = true;
                    that._lastItem();
                }

                if (handled) {
                    that._select(that._focus());
                    e.preventDefault();
                }
            }

            if (!altKey && !handled && that.filterInput) {
                that._search();
            }
        },

        _matchText: function(text, index) {
            var that = this;
            var ignoreCase = that.options.ignoreCase;
            var found = false;

            text = text + "";

            if (ignoreCase) {
                text = text.toLowerCase();
            }

            if (text.indexOf(that._word) === 0) {
                if (that.optionLabel[0]) {
                    index += 1;
                }

                that._select(index);
                if (!that.popup.visible()) {
                    that._change();
                }

                found = true;
            }

            return found;
        },

        _selectNext: function(index) {
            var that = this;
            var startIndex = index;
            var data = that.dataSource.flatView();
            var length = data.length;
            var text;

            for (; index < length; index++) {
                text = that._text(data[index]);

                if (text && that._matchText(text, index) && !(that._word.length === 1 && startIndex === that.selectedIndex)) {
                    return true;
                }
            }

            if (startIndex > 0 && startIndex < length) {
                index = 0;
                for (; index <= startIndex; index++) {
                    text = that._text(data[index]);
                    if (text && that._matchText(text, index)) {
                        return true;
                    }
                }
            }

            return false;
        },

        _keypress: function(e) {
            var that = this;

            if (e.which === 0 || e.keyCode === kendo.keys.ENTER) {
                return;
            }

            var character = String.fromCharCode(e.charCode || e.keyCode);
            var index = that.selectedIndex;
            var length = that._word.length;

            if (that.options.ignoreCase) {
                character = character.toLowerCase();
            }

            if (character === " ") {
                e.preventDefault();
            }

            if (!length) {
                that._word = character;
            }

            if (that._last === character && length <= 1 && index > -1) {
                if (that._selectNext(index)) {
                    return;
                }
            }

            if (length) {
                that._word += character;
            }

            that._last = character;

            that._search();
        },

        _popupOpen: function() {
            var popup = this.popup;

            popup.wrapper = kendo.wrap(popup.element);

            if (popup.element.closest(".km-root")[0]) {
                popup.wrapper.addClass("km-popup km-widget");
                this.wrapper.addClass("km-widget");
            }
        },

        _popup: function() {
            Select.fn._popup.call(this);
            this.popup.one("open", proxy(this._popupOpen, this));
        },

        _click: function (e) {
            var item = e.item || $(e.currentTarget);

            if (this.trigger("select", { item: item })) {
                this.close();
                return;
            }

            this._userTriggered = true;

            this._select(item);
            this._focusElement(this.wrapper);

            this._blur();
        },

        _focusElement: function(element) {
            var active = activeElement();
            var wrapper = this.wrapper;
            var filterInput = this.filterInput;
            var compareElement = element === filterInput ? wrapper : filterInput;
            var touchEnabled = support.mobileOS && (support.touch || support.MSPointers || support.pointers);

            if (filterInput && filterInput[0] === element[0] && touchEnabled) {
                return;
            }

            if (filterInput && compareElement[0] === active) {
                this._prevent = true;
                this._focused = element.focus();
            }
        },

        _filter: function(word) {
            if (word) {
                var that = this;
                var ignoreCase = that.options.ignoreCase;

                if (ignoreCase) {
                    word = word.toLowerCase();
                }

                that._select(function(dataItem) {
                    var text = that._text(dataItem);

                    if (text !== undefined) {
                        text = (text + "");
                        if (ignoreCase) {
                            text = text.toLowerCase();
                        }

                        return text.indexOf(word) === 0;
                    }
                });
            }
        },

        _search: function() {
            var that = this;
            var dataSource = that.dataSource;
            var index = that.selectedIndex;

            clearTimeout(that._typingTimeout);

            if (that.options.filter !== "none") {
                that._typingTimeout = setTimeout(function() {
                    var value = that.filterInput.val();

                    if (that._prev !== value) {
                        that._prev = value;
                        that.search(value);
                    }

                    that._typingTimeout = null;
                }, that.options.delay);
            } else {
                that._typingTimeout = setTimeout(function() {
                    that._word = "";
                }, that.options.delay);

                if (index === -1) {
                    index = 0;
                }

                if (!that.ul[0].firstChild) {
                    dataSource.fetch().done(function () {
                        if (dataSource.data()[0] && index > -1) {
                            that._selectNext(index);
                        }
                    });
                    return;
                }

                that._selectNext(index);
            }
        },

        _get: function(candidate) {
            var data, found, idx;
            var jQueryCandidate = $(candidate);

            if (this.optionLabel[0]) {
                if (typeof candidate === "number") {
                    if (candidate > -1) {
                        candidate -= 1;
                    }
                } else if (jQueryCandidate.hasClass("k-list-optionlabel")) {
                    candidate = -1;
                }
            }

            if (typeof candidate === "function") {
                data = this.dataSource.flatView();

                for (idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        candidate = idx;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    candidate = -1;
                }
            }

            return candidate;
        },

        _firstItem: function() {
            if (this.optionLabel[0]) {
                this._focus(this.optionLabel);
            } else {
                this.listView.first();
            }
        },

        _lastItem: function() {
            this.optionLabel.removeClass("k-state-focused");
            this.listView.last();
        },

        _nextItem: function() {
            if (this.optionLabel.hasClass("k-state-focused")) {
                this.optionLabel.removeClass("k-state-focused");
                this.listView.first();
            } else {
                this.listView.next();
            }
        },

        _prevItem: function() {
            if (this.optionLabel.hasClass("k-state-focused")) {
                return;
            }

            this.listView.prev();
            if (!this.listView.focus()) {
                this.optionLabel.addClass("k-state-focused");
            }
        },

        _focusItem: function() {
            var listView = this.listView;
            var focusedItem = listView.focus();
            var index = listView.select();

            index = index[index.length - 1];

            if (index === undefined && this.options.highlightFirst && !focusedItem) {
                index = 0;
            }

            if (index !== undefined) {
                listView.focus(index);
            } else {
                if (this.options.optionLabel) {
                    this._focus(this.optionLabel);
                    this._select(this.optionLabel);
                } else {
                    listView.scrollToIndex(0);
                }
            }
        },

        _focus: function(candidate) {
            var listView = this.listView;
            var optionLabel = this.optionLabel;

            if (candidate === undefined) {
                candidate = listView.focus();

                if (!candidate && optionLabel.hasClass("k-state-focused")) {
                    candidate = optionLabel;
                }

                return candidate;
            }

            optionLabel.removeClass("k-state-focused");

            candidate = this._get(candidate);

            listView.focus(candidate);

            if (candidate === -1) {
                //TODO: ARIA
                optionLabel.addClass("k-state-focused");
            }
        },

        _select: function(candidate, keepState) {
            var that = this;
            var optionLabel = that.optionLabel;

            candidate = that._get(candidate);

            that.listView.select(candidate);

            if (!keepState && that._state === STATE_FILTER) {
                that.listView.filter(false);
                that._state = STATE_ACCEPT;
            }

            if (candidate === -1) {
                that._selectValue(null);
            }
        },

        _selectValue: function(dataItem) {
            var that = this;
            var optionLabel = that.options.optionLabel;
            var labelElement = that.optionLabel;
            var idx = that.listView.select();

            var value = "";
            var text = "";

            idx = idx[idx.length - 1];
            if (idx === undefined) {
                idx = -1;
            }

            labelElement.removeClass("k-state-focused k-state-selected");

            if (dataItem) {
                text = dataItem;
                value = that._dataValue(dataItem);
                if (optionLabel) {
                    idx += 1;
                }
            } else if (optionLabel) {
                that._focus(labelElement.addClass("k-state-selected"));
                text = that._optionLabelText();
                if (typeof optionLabel === "string") {
                    value = "";
                } else {
                    value = that._value(optionLabel);
                }

                idx = 0;
            }

            that.selectedIndex = idx;

            if (value === null) {
                value = "";
            }

            that._textAccessor(text);
            that._accessor(value, idx);

            that._triggerCascade();
        },

        _mobile: function() {
            var that = this,
                popup = that.popup,
                mobileOS = support.mobileOS,
                root = popup.element.parents(".km-root").eq(0);

            if (root.length && mobileOS) {
                popup.options.animation.open.effects = (mobileOS.android || mobileOS.meego) ? "fadeIn" : (mobileOS.ios || mobileOS.wp) ? "slideIn:up" : popup.options.animation.open.effects;
            }
        },

        _filterHeader: function() {
            var icon;
            var options = this.options;
            var filterEnalbed = options.filter !== "none";

            if (this.filterInput) {
                this.filterInput
                    .off(ns)
                    .parent()
                    .remove();

                this.filterInput = null;
            }

            if (filterEnalbed) {
                icon = '<span unselectable="on" class="k-icon k-i-search">select</span>';

                this.filterInput = $('<input class="k-textbox"/>')
                                      .attr({
                                          role: "listbox",
                                          "aria-haspopup": true,
                                          "aria-expanded": false
                                      });

                this.list
                    .prepend($('<span class="k-list-filter" />')
                    .append(this.filterInput.add(icon)));
            }
        },

        _span: function() {
            var that = this,
                wrapper = that.wrapper,
                SELECTOR = "span.k-input",
                span;

            span = wrapper.find(SELECTOR);

            if (!span[0]) {
                wrapper.append('<span unselectable="on" class="k-dropdown-wrap k-state-default"><span unselectable="on" class="k-input">&nbsp;</span><span unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-arrow-s">select</span></span></span>')
                       .append(that.element);

                span = wrapper.find(SELECTOR);
            }

            that.span = span;
            that._inputWrapper = $(wrapper[0].firstChild);
            that._arrow = wrapper.find(".k-icon");
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                DOMelement = element[0],
                wrapper;

            wrapper = element.parent();

            if (!wrapper.is("span.k-widget")) {
                wrapper = element.wrap("<span />").parent();
                wrapper[0].style.cssText = DOMelement.style.cssText;
                wrapper[0].title = DOMelement.title;
            }

            element.hide();

            that._focused = that.wrapper = wrapper
                              .addClass("k-widget k-dropdown k-header")
                              .addClass(DOMelement.className)
                              .css("display", "")
                              .attr({
                                  unselectable: "on",
                                  role: "listbox",
                                  "aria-haspopup": true,
                                  "aria-expanded": false
                              });
        },

        _clearSelection: function(parent) {
            this.select(parent.value() ? 0 : -1);
        },

        _inputTemplate: function() {
            var that = this,
                template = that.options.valueTemplate;


            if (!template) {
                template = $.proxy(kendo.template('#:this._text(data)#', { useWithBlock: false }), that);
            } else {
                template = kendo.template(template);
            }

            that.valueTemplate = template;
        },

        _textAccessor: function(text) {
            var dataItem = null;
            var template = this.valueTemplate;
            var options = this.options;
            var optionLabel = options.optionLabel;
            var span = this.span;

            if (text !== undefined) {
                if ($.isPlainObject(text) || text instanceof ObservableObject) {
                    dataItem = text;
                } else if (optionLabel && this._optionLabelText() === text) {
                    dataItem = optionLabel;
                    template = this.optionLabelTemplate;
                }

                if (!dataItem) {
                    dataItem = this._assignInstance(text, this._accessor());
                }

                var getElements = function(){
                    return {
                        elements: span.get(),
                        data: [ { dataItem: dataItem } ]
                    };
                };
                this.angular("cleanup", getElements);
                span.html(template(dataItem));
                this.angular("compile", getElements);
            } else {
                return span.text();
            }
        },

        _preselect: function(value, text) {
            if (!value && !text) {
                text = this._optionLabelText();
            }

            this._accessor(value);
            this._textAccessor(text);

            this._old = this._accessor();
            this._oldIndex = this.selectedIndex;

            this.listView.setValue(value);

            this._initialIndex = null;
            this._presetValue = true;
        },

        _assignInstance: function(text, value) {
            var dataTextField = this.options.dataTextField;
            var dataItem = {};

            if (dataTextField) {
                assign(dataItem, dataTextField.split("."), text);
                assign(dataItem, this.options.dataValueField.split("."), value);
                dataItem = new ObservableObject(dataItem);
            } else {
                dataItem = text;
            }

            return dataItem;
        }
    });

    function assign(instance, fields, value) {
        var idx = 0,
            lastIndex = fields.length - 1,
            field;

        for (; idx < lastIndex; ++idx) {
            field = fields[idx];

            if (!(field in instance)) {
                instance[field] = {};
            }

            instance = instance[field];
        }

        instance[fields[lastIndex]] = value;
    }

    ui.plugin(DropDownList);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.list", "./kendo.mobile.scroller" ], f);
})(function(){

var __meta__ = {
    id: "combobox",
    name: "ComboBox",
    category: "web",
    description: "The ComboBox widget allows the selection from pre-defined values or entering a new value.",
    depends: [ "list" ],
    features: [ {
        id: "mobile-scroller",
        name: "Mobile scroller",
        description: "Support for kinetic scrolling in mobile device",
        depends: [ "mobile.scroller" ]
    }, {
        id: "virtualization",
        name: "VirtualList",
        description: "Support for virtualization",
        depends: [ "virtuallist" ]
    } ]
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        List = ui.List,
        Select = ui.Select,
        caret = kendo.caret,
        support = kendo.support,
        placeholderSupported = support.placeholder,
        activeElement = kendo._activeElement,
        keys = kendo.keys,
        ns = ".kendoComboBox",
        CLICK = "click" + ns,
        MOUSEDOWN = "mousedown" + ns,
        DISABLED = "disabled",
        READONLY = "readonly",
        CHANGE = "change",
        DEFAULT = "k-state-default",
        FOCUSED = "k-state-focused",
        STATEDISABLED = "k-state-disabled",
        ARIA_DISABLED = "aria-disabled",
        ARIA_READONLY = "aria-readonly",
        STATE_SELECTED = "k-state-selected",
        STATE_FILTER = "filter",
        STATE_ACCEPT = "accept",
        STATE_REBIND = "rebind",
        HOVEREVENTS = "mouseenter" + ns + " mouseleave" + ns,
        NULL = null,
        proxy = $.proxy;

    var ComboBox = Select.extend({
        init: function(element, options) {
            var that = this, text, disabled;

            that.ns = ns;

            options = $.isArray(options) ? { dataSource: options } : options;

            Select.fn.init.call(that, element, options);

            options = that.options;
            element = that.element.on("focus" + ns, proxy(that._focusHandler, that));

            options.placeholder = options.placeholder || element.attr("placeholder");

            that._reset();

            that._wrapper();

            that._input();

            that._tabindex(that.input);

            that._popup();

            that._dataSource();
            that._ignoreCase();

            that._enable();

            that._oldIndex = that.selectedIndex = -1;

            that._aria();

            that._initialIndex = options.index;

            that._initList();

            that._cascade();

            if (options.autoBind) {
                that._filterSource();
            } else {
                text = options.text;

                if (!text && that._isSelect) {
                    text = element.children(":selected").text();
                }

                if (text) {
                    that.input.val(text);
                    that._prev = text;
                }
            }

            if (!text) {
                that._placeholder();
            }

            disabled = $(that.element).parents("fieldset").is(':disabled');

            if (disabled) {
                that.enable(false);
            }

            kendo.notify(that);
        },

        options: {
            name: "ComboBox",
            enabled: true,
            index: -1,
            text: null,
            value: null,
            autoBind: true,
            delay: 200,
            dataTextField: "",
            dataValueField: "",
            minLength: 0,
            height: 200,
            highlightFirst: true,
            filter: "none",
            placeholder: "",
            suggest: false,
            cascadeFrom: "",
            cascadeFromField: "",
            ignoreCase: true,
            animation: {},
            template: null,
            groupTemplate: "#:data#",
            fixedGroupTemplate: "#:data#"
        },

        events:[
            "open",
            "close",
            CHANGE,
            "select",
            "filtering",
            "dataBinding",
            "dataBound",
            "cascade"
        ],

        setOptions: function(options) {
            Select.fn.setOptions.call(this, options);

            this.listView.setOptions(options);

            this._accessors();
            this._aria();
        },

        destroy: function() {
            var that = this;

            that.input.off(ns);
            that.element.off(ns);
            that._inputWrapper.off(ns);

            Select.fn.destroy.call(that);
        },

        _focusHandler: function() {
            this.input.focus();
        },

        _arrowClick: function() {
            this._toggle();
        },

        _inputFocus: function() {
            this._inputWrapper.addClass(FOCUSED);
            this._placeholder(false);
        },

        _inputFocusout: function() {
            var that = this;

            that._inputWrapper.removeClass(FOCUSED);
            clearTimeout(that._typingTimeout);
            that._typingTimeout = null;

            if (that.options.text !== that.input.val()) {
                that.text(that.text());
            }

            that._placeholder();
            that._blur();

            that.element.blur();
        },

        _editable: function(options) {
            var that = this,
                disable = options.disable,
                readonly = options.readonly,
                wrapper = that._inputWrapper.off(ns),
                input = that.element.add(that.input.off(ns)),
                arrow = that._arrow.parent().off(CLICK + " " + MOUSEDOWN);

            if (!readonly && !disable) {
                wrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover);

                input.removeAttr(DISABLED)
                     .removeAttr(READONLY)
                     .attr(ARIA_DISABLED, false)
                     .attr(ARIA_READONLY, false);

                arrow.on(CLICK, proxy(that._arrowClick, that))
                     .on(MOUSEDOWN, function(e) { e.preventDefault(); });

                that.input
                    .on("keydown" + ns, proxy(that._keydown, that))
                    .on("focus" + ns, proxy(that._inputFocus, that))
                    .on("focusout" + ns, proxy(that._inputFocusout, that));

            } else {
                wrapper
                    .addClass(disable ? STATEDISABLED : DEFAULT)
                    .removeClass(disable ? DEFAULT : STATEDISABLED);

                input.attr(DISABLED, disable)
                     .attr(READONLY, readonly)
                     .attr(ARIA_DISABLED, disable)
                     .attr(ARIA_READONLY, readonly);
            }
        },

        open: function() {
            var that = this;
            var state = that._state;
            var focusedItem;
            var index;

            if (that.popup.visible()) {
                return;
            }

            if ((!that.listView.isBound() && state !== STATE_FILTER) || state === STATE_ACCEPT) {
                that._open = true;
                that._state = STATE_REBIND;
                that.listView.filter(false);
                that._filterSource();
            } else {
                that.popup.open();
                that._focusItem();
            }
        },

        _listBound: function() {
            var that = this;
            var options  = that.options;
            var initialIndex = that._initialIndex;
            var filtered = that._state === STATE_FILTER;
            var isActive = that.input[0] === activeElement();

            var listView = that.listView;
            var focusedItem = listView.focus();
            var data = this.dataSource.flatView();
            var page = this.dataSource.page();
            var length = data.length;
            var dataItem;
            var value;

            that._angularItems("compile");

            that._presetValue = false;

            if (!options.virtual) {
                that._calculateGroupPadding(that._height(length));
            }

            that.popup.position();

            if (that._isSelect) {
                var hasChild = that.element[0].children[0];

                if (that._state === STATE_REBIND) {
                    that._state = "";
                }

                var keepState = true;
                var custom = that._customOption;

                that._customOption = undefined;
                that._options(data, "", that.value());

                if (custom && custom[0].selected) {
                    that._custom(custom.val(), keepState);
                } else if (!hasChild) {
                    that._custom("", keepState);
                }
            }

            that._hideBusy();
            that._makeUnselectable();

            if (!filtered && !that._fetch) {
                if (!listView.value().length) {
                    if (initialIndex !== null && initialIndex > -1) {
                        that.select(initialIndex);
                        focusedItem = listView.focus();
                    } else if (that._accessor()) {
                        listView.value(that._accessor());
                    }
                }

                that._initialIndex = null;

                dataItem = that.listView.selectedDataItems()[0];
                if (dataItem && that.text() && that.text() !== that._text(dataItem)) {
                    that._selectValue(dataItem);
                }
            } else if (filtered && focusedItem) {
                focusedItem.removeClass("k-state-selected");
            }

            if (length && (page === undefined || page === 1)) {
                if (options.highlightFirst) {
                    if (!focusedItem && !listView.focusIndex()) {
                        listView.focus(0);
                    }
                } else {
                    listView.focus(-1);
                }

                if (options.suggest && isActive && that.input.val()) {
                    that.suggest(data[0]);
                }
            }

            if (that._open) {
                that._open = false;

                if (that._typingTimeout && !isActive) {
                    that.popup.close();
                } else {
                    that.toggle(!!length);
                }

                that._typingTimeout = null;
            }

            if (that._touchScroller) {
                that._touchScroller.reset();
            }

            that._hideBusy();
            that.trigger("dataBound");
        },

        _listChange: function() {
            this._selectValue(this.listView.selectedDataItems()[0]);

            if (this._presetValue) {
                this._oldIndex = this.selectedIndex;
            }
        },

        _get: function(candidate) {
            var data, found, idx;

            if (typeof candidate === "function") {
                data = this.dataSource.flatView();

                for (idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        candidate = idx;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    candidate = -1;
                }
            }

            return candidate;
        },

        _select: function(candidate, keepState) {
            candidate = this._get(candidate);

            if (candidate === -1) {
                this.input[0].value = "";
                this._accessor("");
            }

            this.listView.select(candidate);

            if (!keepState && this._state === STATE_FILTER) {
                this.listView.filter(false);
                this._state = STATE_ACCEPT;
            }
        },

        _selectValue: function(dataItem) {
            var idx = this.listView.select();
            var value = "";
            var text = "";

            idx = idx[idx.length - 1];
            if (idx === undefined) {
                idx = -1;
            }

            this.selectedIndex = idx;

            if (idx === -1) {
                value = text = this.input[0].value;
                this.listView.focus(-1);
            } else {
                if (dataItem) {
                    value = this._dataValue(dataItem);
                    text = this._text(dataItem);
                }

                if (value === null) {
                    value = "";
                }
            }

            this._prev = this.input[0].value = text;
            this._accessor(value !== undefined ? value : text, idx);

            this._placeholder();
            this._triggerCascade();
        },

        refresh: function() {
            this.listView.refresh();
        },

        suggest: function(word) {
            var that = this;
            var element = that.input[0];
            var value = that.text();
            var caretIdx = caret(element)[0];
            var key = that._last;
            var idx;

            if (key == keys.BACKSPACE || key == keys.DELETE) {
                that._last = undefined;
                return;
            }

            word = word || "";

            if (typeof word !== "string") {
                if (word[0]) {
                    word = that.dataSource.view()[List.inArray(word[0], that.ul[0])];
                }

                word = word ? that._text(word) : "";
            }

            if (caretIdx <= 0) {
                caretIdx = value.toLowerCase().indexOf(word.toLowerCase()) + 1;
            }

            if (word) {
                word = word.toString();
                idx = word.toLowerCase().indexOf(value.toLowerCase());
                if (idx > -1) {
                    value += word.substring(idx + value.length);
                }
            } else {
                value = value.substring(0, caretIdx);
            }

            if (value.length !== caretIdx || !word) {
                element.value = value;
                if (element === activeElement()) {
                    caret(element, caretIdx, value.length);
                }
            }
        },

        text: function (text) {
            text = text === null ? "" : text;

            var that = this;
            var input = that.input[0];
            var ignoreCase = that.options.ignoreCase;
            var loweredText = text;
            var dataItem;
            var value;

            if (text === undefined) {
                return input.value;
            }

            dataItem = that.dataItem();

            if (that.options.autoBind === false && !that.listView.isBound()) {
                return;
            }

            if (dataItem && that._text(dataItem) === text) {
                value = that._value(dataItem);
                if (value === null) {
                    value = "";
                } else {
                    value += "";
                }

                if (value === that._old) {
                    that._triggerCascade();
                    return;
                }
            }

            if (ignoreCase) {
                loweredText = loweredText.toLowerCase();
            }

            that._select(function(data) {
                data = that._text(data);

                if (ignoreCase) {
                    data = (data + "").toLowerCase();
                }

                return data === loweredText;
            });

            if (that.selectedIndex < 0) {
                that._accessor(text);
                input.value = text;

                that._triggerCascade();
            }

            that._prev = input.value;
        },

        toggle: function(toggle) {
            this._toggle(toggle, true);
        },

        value: function(value) {
            var that = this;
            var options = that.options;

            if (value === undefined) {
                value = that._accessor() || that.listView.value()[0];
                return value === undefined || value === null ? "" : value;
            }

            if (value === options.value && that.input.val() === options.text) {
                return;
            }

            that._accessor(value);

            that.listView
                .value(value)
                .done(function() {
                    that._selectValue(that.listView.selectedDataItems()[0]);

                    if (that.selectedIndex === -1) {
                        that._accessor(value);
                        that.input.val(value);
                        that._placeholder(true);
                    }

                    that._old = that._accessor();
                    that._oldIndex = that.selectedIndex;

                    that._prev = that.input.val();

                    if (that._state === STATE_FILTER) {
                        that._state = STATE_ACCEPT;
                    }
                });

            that._fetchData();
        },

        _click: function(e) {
            var item = e.item;

            if (this.trigger("select", { item: item })) {
                this.close();
                return;
            }

            this._userTriggered = true;

            this._select(item);
            this._blur();
        },

        _filter: function(word) {
            var that = this;
            var options = that.options;
            var dataSource = that.dataSource;
            var ignoreCase = options.ignoreCase;
            var predicate = function (dataItem) {
                var text = that._text(dataItem);
                if (text !== undefined) {
                    text = text + "";
                    if (text !== "" && word === "") {
                        return false;
                    }

                    if (ignoreCase) {
                        text = text.toLowerCase();
                    }

                    return text.indexOf(word) === 0;
                }
            };

            if (ignoreCase) {
                word = word.toLowerCase();
            }

            if (!that.ul[0].firstChild) {
                dataSource.one(CHANGE, function () {
                    if (dataSource.view()[0]) {
                        that.search(word);
                    }
                }).fetch();
                return;
            }

            this.listView.focus(this._get(predicate));

            var current = this.listView.focus();

            if (current) {
                if (options.suggest) {
                    that.suggest(current);
                }

                this.open();
            }

            if (this.options.highlightFirst && !word) {
                this.listView.first();
            }

            that._hideBusy();
        },

        _input: function() {
            var that = this,
                element = that.element.removeClass("k-input")[0],
                accessKey = element.accessKey,
                wrapper = that.wrapper,
                SELECTOR = "input.k-input",
                name = element.name || "",
                input;

            if (name) {
                name = 'name="' + name + '_input" ';
            }

            input = wrapper.find(SELECTOR);

            if (!input[0]) {
                wrapper.append('<span tabindex="-1" unselectable="on" class="k-dropdown-wrap k-state-default"><input ' + name + 'class="k-input" type="text" autocomplete="off"/><span tabindex="-1" unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-arrow-s">select</span></span></span>')
                       .append(that.element);

                input = wrapper.find(SELECTOR);
            }

            input[0].style.cssText = element.style.cssText;
            input[0].title = element.title;

            if (element.maxLength > -1) {
                input[0].maxLength = element.maxLength;
            }

            input.addClass(element.className)
                 .val(this.options.text || element.value)
                 .css({
                    width: "100%",
                    height: element.style.height
                 })
                 .attr({
                     "role": "combobox",
                     "aria-expanded": false
                 })
                 .show();

            if (placeholderSupported) {
                input.attr("placeholder", that.options.placeholder);
            }

            if (accessKey) {
                element.accessKey = "";
                input[0].accessKey = accessKey;
            }

            that._focused = that.input = input;
            that._inputWrapper = $(wrapper[0].firstChild);
            that._arrow = wrapper.find(".k-icon")
                                 .attr({
                                     "role": "button",
                                     "tabIndex": -1
                                 });

            if (element.id) {
                that._arrow.attr("aria-controls", that.ul[0].id);
            }
        },

        _keydown: function(e) {
            var that = this,
                key = e.keyCode;

            that._last = key;

            clearTimeout(that._typingTimeout);
            that._typingTimeout = null;

            if (key != keys.TAB && !that._move(e)) {
               that._search();
            }
        },

        _placeholder: function(show) {
            if (placeholderSupported) {
                return;
            }

            var that = this,
                input = that.input,
                placeholder = that.options.placeholder,
                value;

            if (placeholder) {
                value = that.value();

                if (show === undefined) {
                    show = !value;
                }

                input.toggleClass("k-readonly", show);

                if (!show) {
                    if (!value) {
                        placeholder = "";
                    } else {
                        return;
                    }
                }

                input.val(placeholder);

                if (!placeholder && input[0] === activeElement()) {
                    caret(input[0], 0, 0);
                }
            }
        },

        _search: function() {
            var that = this;

            that._typingTimeout = setTimeout(function() {
                var value = that.text();

                if (that._prev !== value) {
                    that._prev = value;
                    that.search(value);
                }

                that._typingTimeout = null;
            }, that.options.delay);
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                wrapper = element.parent();

            if (!wrapper.is("span.k-widget")) {
                wrapper = element.hide().wrap("<span />").parent();
                wrapper[0].style.cssText = element[0].style.cssText;
            }

            that.wrapper = wrapper.addClass("k-widget k-combobox k-header")
                                  .addClass(element[0].className)
                                  .css("display", "");
        },

        _clearSelection: function(parent, isFiltered) {
            var that = this;
            var hasValue = parent.value();
            var custom = hasValue && parent.selectedIndex === -1;

            if (isFiltered || !hasValue || custom) {
                that.options.value = "";
                that.value("");
            }
        },

        _preselect: function(value, text) {
            this.input.val(text);
            this._accessor(value);

            this._old = this._accessor();
            this._oldIndex = this.selectedIndex;

            this.listView.setValue(value);

            this._initialIndex = null;
            this._presetValue = true;
        }
    });

    ui.plugin(ComboBox);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.list", "./kendo.mobile.scroller" ], f);
})(function(){

var __meta__ = {
    id: "multiselect",
    name: "MultiSelect",
    category: "web",
    description: "The MultiSelect widget allows the selection from pre-defined values.",
    depends: [ "list" ],
    features: [ {
        id: "mobile-scroller",
        name: "Mobile scroller",
        description: "Support for kinetic scrolling in mobile device",
        depends: [ "mobile.scroller" ]
    }, {
        id: "virtualization",
        name: "VirtualList",
        description: "Support for virtualization",
        depends: [ "virtuallist" ]
    } ]
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        List = ui.List,
        keys = kendo.keys,
        activeElement = kendo._activeElement,
        ObservableArray = kendo.data.ObservableArray,
        proxy = $.proxy,
        ID = "id",
        LI = "li",
        ACCEPT = "accept",
        FILTER = "filter",
        REBIND = "rebind",
        OPEN = "open",
        CLOSE = "close",
        CHANGE = "change",
        PROGRESS = "progress",
        SELECT = "select",
        NEXT = "nextSibling",
        PREV = "previousSibling",
        HIDE = ' style="display:none"',
        ARIA_DISABLED = "aria-disabled",
        ARIA_READONLY = "aria-readonly",
        FOCUSEDCLASS = "k-state-focused",
        HIDDENCLASS = "k-loading-hidden",
        HOVERCLASS = "k-state-hover",
        STATEDISABLED = "k-state-disabled",
        DISABLED = "disabled",
        READONLY = "readonly",
        ns = ".kendoMultiSelect",
        CLICK = "click" + ns,
        KEYDOWN = "keydown" + ns,
        MOUSEENTER = "mouseenter" + ns,
        MOUSELEAVE = "mouseleave" + ns,
        HOVEREVENTS = MOUSEENTER + " " + MOUSELEAVE,
        quotRegExp = /"/g,
        isArray = $.isArray,
        styles = ["font-family",
                  "font-size",
                  "font-stretch",
                  "font-style",
                  "font-weight",
                  "letter-spacing",
                  "text-transform",
                  "line-height"];

    var MultiSelect = List.extend({
        init: function(element, options) {
            var that = this, id, disabled;

            that.ns = ns;
            List.fn.init.call(that, element, options);

            that._optionsMap = {};
            that._customOptions = {};

            that._wrapper();
            that._tagList();
            that._input();
            that._textContainer();
            that._loader();

            that._tabindex(that.input);

            element = that.element.attr("multiple", "multiple").hide();
            options = that.options;

            if (!options.placeholder) {
                options.placeholder = element.data("placeholder");
            }

            id = element.attr(ID);

            if (id) {
                that._tagID = id + "_tag_active";

                id = id + "_taglist";
                that.tagList.attr(ID, id);
            }

            that._aria(id);
            that._dataSource();
            that._ignoreCase();
            that._popup();

            that._tagTemplate();
            that._initList();

            that._reset();
            that._enable();
            that._placeholder();

            if (options.autoBind) {
                that.dataSource.fetch();
            } else if (options.value) {
                that._preselect(options.value);
            }

            disabled = $(that.element).parents("fieldset").is(':disabled');

            if (disabled) {
                that.enable(false);
            }

            kendo.notify(that);
        },

        _preselect: function(data, value) {
            var that = this;

            if (!isArray(data) && !(data instanceof kendo.data.ObservableArray)) {
                data = [data];
            }

            if ($.isPlainObject(data[0]) || data[0] instanceof kendo.data.ObservableObject || !that.options.dataValueField) {
                that._retrieveData = true;
                that.dataSource.data(data);
                that.value(value || that._initialValues);
            }
        },

        options: {
            name: "MultiSelect",
            enabled: true,
            autoBind: true,
            autoClose: true,
            highlightFirst: true,
            dataTextField: "",
            dataValueField: "",
            filter: "startswith",
            ignoreCase: true,
            minLength: 0,
            delay: 100,
            value: null,
            maxSelectedItems: null,
            placeholder: "",
            height: 200,
            animation: {},
            itemTemplate: "",
            tagTemplate: "",
            groupTemplate: "#:data#",
            fixedGroupTemplate: "#:data#"
        },

        events: [
            OPEN,
            CLOSE,
            CHANGE,
            SELECT,
            "filtering",
            "dataBinding",
            "dataBound"
        ],

        setDataSource: function(dataSource) {
            this.options.dataSource = dataSource;

            this._dataSource();

            this.listView.setDataSource(this.dataSource);

            if (this.options.autoBind) {
                this.dataSource.fetch();
            }
        },

        setOptions: function(options) {
            var listOptions = this._listOptions(options);

            List.fn.setOptions.call(this, options);

            this._normalizeOptions(listOptions);

            this.listView.setOptions(listOptions);

            this._accessors();
            this._aria(this.tagList.attr(ID));
            this._tagTemplate();
        },

        currentTag: function(candidate) {
            var that = this;

            if (candidate !== undefined) {
                if (that._currentTag) {
                    that._currentTag
                        .removeClass(FOCUSEDCLASS)
                        .removeAttr(ID);

                    that.input.removeAttr("aria-activedescendant");
                }

                if (candidate) {
                    candidate.addClass(FOCUSEDCLASS).attr(ID, that._tagID);

                    that.input
                        .attr("aria-activedescendant", that._tagID);
                }

                that._currentTag = candidate;
            } else {
                return that._currentTag;
            }
        },

        dataItems: function() {
            return this.listView.selectedDataItems();
        },

        destroy: function() {
            var that = this,
                ns = that.ns;

            clearTimeout(that._busy);
            clearTimeout(that._typingTimeout);

            that.wrapper.off(ns);
            that.tagList.off(ns);
            that.input.off(ns);

            List.fn.destroy.call(that);
        },

        _activateItem: function() {
            List.fn._activateItem.call(this);
            this.currentTag(null);
        },

        _normalizeOptions: function(options) {
            var itemTemplate = this.options.itemTemplate || this.options.template;
            var template = options.itemTemplate || itemTemplate || options.template;

            if (!template) {
                template = "#:" + kendo.expr(options.dataTextField, "data") + "#";
            }

            options.template = template;
        },

        _initList: function() {
            var that = this;
            var virtual = that.options.virtual;
            var hasVirtual = !!virtual;

            var listBoundHandler = proxy(that._listBound, that);

            var listOptions = {
                autoBind: false,
                selectable: "multiple",
                dataSource: that.dataSource,
                click: proxy(that._click, that),
                change: proxy(that._listChange, that),
                activate: proxy(that._activateItem, that),
                deactivate: proxy(that._deactivateItem, that),
                dataBinding: function() {
                    that.trigger("dataBinding");
                    that._angularItems("cleanup");
                },
                dataBound: listBoundHandler,
                listBound: listBoundHandler,
                selectedItemChange: proxy(that._selectedItemChange, that)
            };

            listOptions = $.extend(that._listOptions(), listOptions, typeof virtual === "object" ? virtual : {});

            that._normalizeOptions(listOptions);

            if (!hasVirtual) {
                that.listView = new kendo.ui.StaticList(that.ul, listOptions);
            } else {
                that.listView = new kendo.ui.VirtualList(that.ul, listOptions);
            }

            that.listView.value(that._initialValues || that.options.value);
        },

        _listChange: function(e) {
            if (this._state === REBIND) {
                this._state = "";
                e.added = [];
            }

            this._selectValue(e.added, e.removed);
        },

        _selectedItemChange: function(e) {
            var items = e.items;
            var context;
            var idx;

            for (idx = 0; idx < items.length; idx++) {
                context = items[idx];
                this.tagList.children().eq(context.index).children("span:first").html(this.tagTextTemplate(context.item));
            }
        },

        _wrapperMousedown: function(e) {
            var that = this;
            var notInput = e.target.nodeName.toLowerCase() !== "input";
            var closeButton = $(e.target).hasClass("k-select") || $(e.target).parent().hasClass("k-select");

            if (notInput && !(closeButton && kendo.support.mobileOS)) {
                e.preventDefault();
            }

            if (!closeButton) {
                if (that.input[0] !== activeElement() && notInput) {
                    that.input.focus();
                }

                if (that.options.minLength === 0) {
                    that.open();
                }
            }

        },

        _inputFocus: function() {
            this._placeholder(false);
            this.wrapper.addClass(FOCUSEDCLASS);
        },

        _inputFocusout: function() {
            var that = this;

            clearTimeout(that._typingTimeout);

            that.wrapper.removeClass(FOCUSEDCLASS);

            that._placeholder(!that.listView.selectedDataItems()[0], true);
            that.close();

            if (that._state === FILTER) {
                that._state = ACCEPT;
                that.listView.filter(false);
                that.listView.skipUpdate(true);
            }

            that.element.blur();
        },

        _removeTag: function(tag) {
            var that = this;
            var state = that._state;
            var position = tag.index();
            var listView = that.listView;
            var value = listView.value()[position];
            var customIndex = that._customOptions[value];
            var option;

            if (customIndex === undefined && (state === ACCEPT || state === FILTER)) {
                customIndex = that._optionsMap[value];
            }

            if (customIndex !== undefined) {
                option = that.element[0].children[customIndex];
                option.removeAttribute("selected");
                option.selected = false;

                listView.removeAt(position);
                tag.remove();
            } else {
                listView.select(listView.select()[position]);
            }

            that.currentTag(null);
            that._change();
            that._close();
        },

        _tagListClick: function(e) {
            this._removeTag($(e.target).closest(LI));
        },

        _editable: function(options) {
            var that = this,
                disable = options.disable,
                readonly = options.readonly,
                wrapper = that.wrapper.off(ns),
                tagList = that.tagList.off(ns),
                input = that.element.add(that.input.off(ns));

            if (!readonly && !disable) {
                wrapper
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover)
                    .on("mousedown" + ns + " touchend" + ns, proxy(that._wrapperMousedown, that));

                that.input.on(KEYDOWN, proxy(that._keydown, that))
                    .on("paste" + ns, proxy(that._search, that))
                    .on("focus" + ns, proxy(that._inputFocus, that))
                    .on("focusout" + ns, proxy(that._inputFocusout, that));

                input.removeAttr(DISABLED)
                     .removeAttr(READONLY)
                     .attr(ARIA_DISABLED, false)
                     .attr(ARIA_READONLY, false);

                tagList
                    .on(MOUSEENTER, LI, function() { $(this).addClass(HOVERCLASS); })
                    .on(MOUSELEAVE, LI, function() { $(this).removeClass(HOVERCLASS); })
                    .on(CLICK, "li.k-button .k-select", proxy(that._tagListClick, that));
            } else {
                if (disable) {
                    wrapper.addClass(STATEDISABLED);
                } else {
                    wrapper.removeClass(STATEDISABLED);
                }

                input.attr(DISABLED, disable)
                     .attr(READONLY, readonly)
                     .attr(ARIA_DISABLED, disable)
                     .attr(ARIA_READONLY, readonly);
            }
        },

        _close: function() {
            var that = this;
            if (that.options.autoClose) {
                that.close();
            } else {
                that.popup.position();
            }
        },

        close: function() {
            this.popup.close();
        },

        open: function() {
            var that = this;

            if (that._request) {
                that._retrieveData = false;
            }

            if (that._retrieveData || !that.listView.isBound() || that._state === ACCEPT) {
                that._open = true;
                that._state = REBIND;
                that._retrieveData = false;

                that.listView.filter(false);
                that.listView.skipUpdate(true);

                that._filterSource();
            } else if (that._allowSelection()) {
                that.popup.open();
                that._focusItem();
            }
        },

        toggle: function(toggle) {
            toggle = toggle !== undefined ? toggle : !this.popup.visible();

            this[toggle ? OPEN : CLOSE]();
        },

        refresh: function() {
            this.listView.refresh();
        },

        _listBound: function(e) {
            var that = this;
            var data = that.dataSource.flatView();
            var page = that.dataSource.page();
            var length = data.length;

            that._angularItems("compile");

            that._render(data);

            that._calculateGroupPadding(that._height(length));

            if (that._open) {
                that._open = false;
                that.toggle(length);
            }

            that.popup.position();

            if (that.options.highlightFirst && (page === undefined || page === 1)) {
                that.listView.first();
            }

            if (that._touchScroller) {
                that._touchScroller.reset();
            }

            that._hideBusy();
            that._makeUnselectable();

            that._hideBusy();
            that.trigger("dataBound");
        },

        search: function(word) {
            var that = this;
            var options = that.options;
            var ignoreCase = options.ignoreCase;
            var filter = options.filter;
            var field = options.dataTextField;
            var inputValue = that.input.val();
            var expression;
            var length;

            if (options.placeholder === inputValue) {
                inputValue = "";
            }

            clearTimeout(that._typingTimeout);

            word = typeof word === "string" ? word : inputValue;

            length = word.length;

            if (!length || length >= options.minLength) {
                that.listView.filter(true);
                that._state = FILTER;
                that._open = true;

                expression = {
                    value: ignoreCase ? word.toLowerCase() : word,
                    field: field,
                    operator: filter,
                    ignoreCase: ignoreCase
                };

                that._filterSource(expression, that._retrieveData);
                that._retrieveData = false;
            }
        },

        value: function(value) {
            var that = this;
            var oldValue = that.listView.value().slice();
            var maxSelectedItems = that.options.maxSelectedItems;
            var idx;

            if (value === undefined) {
                return oldValue;
            }

            value = that._normalizeValues(value);

            if (maxSelectedItems !== null && value.length > maxSelectedItems) {
                value = value.slice(0, maxSelectedItems);
            }

            that.listView.value(value);

            that._old = value;

            that._fetchData();
        },

        _setOption: function(value, selected) {
            var option = this.element[0].children[this._optionsMap[value]];

            if (option) {
                if (selected) {
                    option.setAttribute("selected", "selected");
                } else {
                    option.removeAttribute("selected");
                }

                option.selected = selected;
            }
        },

        _fetchData: function() {
            var that = this;
            var hasItems = !!that.dataSource.view().length;
            var isEmptyArray = that.listView.value().length === 0;

            if (isEmptyArray || that._request) {
                return;
            }

            if (!that._fetch && !hasItems) {
                that._fetch = true;
                that.dataSource.fetch().done(function() {
                    that._fetch = false;
                });
            }
        },

        _dataSource: function() {
            var that = this,
                element = that.element,
                options = that.options,
                dataSource = options.dataSource || {};

            dataSource = isArray(dataSource) ? {data: dataSource} : dataSource;

            dataSource.select = element;
            dataSource.fields = [{ field: options.dataTextField },
                                 { field: options.dataValueField }];

            if (that.dataSource && that._refreshHandler) {
                that._unbindDataSource();
            } else {
                that._progressHandler = proxy(that._showBusy, that);
            }

            that.dataSource = kendo.data.DataSource.create(dataSource)
                                   .bind(PROGRESS, that._progressHandler);
        },

        _reset: function() {
            var that = this,
                element = that.element,
                formId = element.attr("form"),
                form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    setTimeout(function() {
                        that.value(that._initialValues);
                        that._placeholder();
                    });
                };

                that._form = form.on("reset", that._resetHandler);
            }
        },

        _initValue: function() {
            var value = this.options.value || this.element.val();

            this._old = this._initialValues = this._normalizeValues(value);
        },

        _normalizeValues: function(value) {
            var that = this;

            if (value === null) {
                value = [];
            } else if (value && $.isPlainObject(value)) {
                value = [that._value(value)];
            } else if (value && $.isPlainObject(value[0])) {
                value = $.map(value, function(dataItem) { return that._value(dataItem); });
            } else if (!isArray(value) && !(value instanceof ObservableArray)) {
                value = [value];
            }

            return value;
        },

        _change: function() {
            var that = this,
                value = that.value();

            if (!compare(value, that._old)) {
                that._old = value.slice();

                that.trigger(CHANGE);

                // trigger the DOM change event so any subscriber gets notified
                that.element.trigger(CHANGE);
            }
        },

        _click: function(e) {
            var item = e.item;

            if (this.trigger(SELECT, { item: item })) {
                this._close();
                return;
            }

            this._select(item);
            this._change();
            this._close();
        },

        _keydown: function(e) {
            var that = this;
            var key = e.keyCode;
            var tag = that._currentTag;
            var current = that.listView.focus();
            var hasValue = that.input.val();
            var isRtl = kendo.support.isRtl(that.wrapper);
            var visible = that.popup.visible();

            if (key === keys.DOWN) {
                e.preventDefault();

                if (!visible) {
                    that.open();

                    if (!current) {
                        this.listView.first();
                    }
                    return;
                }

                if (current) {
                    this.listView.next();
                    if (!this.listView.focus()) {
                        this.listView.last();
                    }
                } else {
                    this.listView.first();
                }
            } else if (key === keys.UP) {
                if (visible) {
                    if (current) {
                        this.listView.prev();
                    }

                    if (!this.listView.focus()) {
                        that.close();
                    }
                }
                e.preventDefault();
            } else if ((key === keys.LEFT && !isRtl) || (key === keys.RIGHT && isRtl)) {
                if (!hasValue) {
                    tag = tag ? tag.prev() : $(that.tagList[0].lastChild);
                    if (tag[0]) {
                        that.currentTag(tag);
                    }
                }
            } else if ((key === keys.RIGHT && !isRtl) || (key === keys.LEFT && isRtl)) {
                if (!hasValue && tag) {
                    tag = tag.next();
                    that.currentTag(tag[0] ? tag : null);
                }
            } else if (key === keys.ENTER && visible) {
                if (current) {
                    if (that.trigger(SELECT, {item: current})) {
                        that._close();
                        return;
                    }

                    that._select(current);
                }

                that._change();
                that._close();
                e.preventDefault();
            } else if (key === keys.ESC) {
                if (visible) {
                    e.preventDefault();
                } else {
                    that.currentTag(null);
                }

                that.close();
            } else if (key === keys.HOME) {
                if (visible) {
                    this.listView.first();
                } else if (!hasValue) {
                    tag = that.tagList[0].firstChild;

                    if (tag) {
                        that.currentTag($(tag));
                    }
                }
            } else if (key === keys.END) {
                if (visible) {
                    this.listView.last();
                } else if (!hasValue) {
                    tag = that.tagList[0].lastChild;

                    if (tag) {
                        that.currentTag($(tag));
                    }
                }
            } else if ((key === keys.DELETE || key === keys.BACKSPACE) && !hasValue) {
                if (key === keys.BACKSPACE && !tag) {
                    tag = $(that.tagList[0].lastChild);
                }

                if (tag && tag[0]) {
                    that._removeTag(tag);
                }
            } else {
                clearTimeout(that._typingTimeout);
                setTimeout(function() { that._scale(); });
                that._search();
            }
        },

        _hideBusy: function () {
            var that = this;
            clearTimeout(that._busy);
            that.input.attr("aria-busy", false);
            that._loading.addClass(HIDDENCLASS);
            that._request = false;
            that._busy = null;
        },

        _showBusyHandler: function() {
            this.input.attr("aria-busy", true);
            this._loading.removeClass(HIDDENCLASS);
        },

        _showBusy: function () {
            var that = this;

            that._request = true;

            if (that._busy) {
                return;
            }

            that._busy = setTimeout(proxy(that._showBusyHandler, that), 100);
        },

        _placeholder: function(show, skipCaret) {
            var that = this,
                input = that.input,
                active = activeElement();

            if (show === undefined) {
                show = false;
                if (input[0] !== active) {
                    show = !that.listView.selectedDataItems()[0];
                }
            }

            that._prev = "";
            input.toggleClass("k-readonly", show)
                 .val(show ? that.options.placeholder : "");

            if (input[0] === active && !skipCaret) {
                kendo.caret(input[0], 0, 0);
            }

            that._scale();
        },

        _scale: function() {
            var that = this,
                wrapper = that.wrapper,
                wrapperWidth = wrapper.width(),
                span = that._span.text(that.input.val()),
                textWidth;

            if (!wrapper.is(":visible")) {
                span.appendTo(document.documentElement);
                wrapperWidth = textWidth = span.width() + 25;
                span.appendTo(wrapper);
            } else {
                textWidth = span.width() + 25;
            }

            that.input.width(textWidth > wrapperWidth ? wrapperWidth : textWidth);
        },

        _option: function(dataValue, dataText, selected) {
            var option = "<option";

            if (dataValue !== undefined) {
                dataValue += "";

                if (dataValue.indexOf('"') !== -1) {
                    dataValue = dataValue.replace(quotRegExp, "&quot;");
                }

                option += ' value="' + dataValue + '"';
            }

            if (selected) {
                option += ' selected';
            }

            option += ">";

            if (dataText !== undefined) {
                option += kendo.htmlEncode(dataText);
            }

            return option += "</option>";
        },

        _render: function(data) {
            var selectedItems = this.listView.selectedDataItems();
            var values = this.listView.value();
            var length = data.length;
            var selectedIndex;
            var options = "";
            var dataItem;
            var value;
            var idx;

            if (values.length !== selectedItems.length) {
                selectedItems = this._buildSelectedItems(values);
            }

            var custom = {};
            var optionsMap = {};

            for (idx = 0; idx < length; idx++) {
                dataItem = data[idx];
                value = this._value(dataItem);

                selectedIndex = this._selectedItemIndex(value, selectedItems);
                if (selectedIndex !== -1) {
                    selectedItems.splice(selectedIndex, 1);
                }

                optionsMap[value] = idx;
                options += this._option(value, this._text(dataItem), selectedIndex !== -1);
            }

            if (selectedItems.length) {
                for (idx = 0; idx < selectedItems.length; idx++) {
                    dataItem = selectedItems[idx];

                    value = this._value(dataItem);
                    custom[value] = length;
                    optionsMap[value] = length;

                    length += 1;
                    options += this._option(value, this._text(dataItem), true);
                }
            }

            this._customOptions = custom;
            this._optionsMap = optionsMap;

            this.element.html(options);
        },

        _buildSelectedItems: function(values) {
            var valueField = this.options.dataValueField;
            var textField = this.options.dataTextField;
            var result = [];
            var item;

            for (var idx = 0; idx < values.length; idx++) {
                item = {};
                item[valueField] = values[idx];
                item[textField] = values[idx];

                result.push(item);
            }

            return result;
        },

        _selectedItemIndex: function(value, selectedItems) {
            var valueGetter = this._value;
            var idx = 0;

            for (; idx < selectedItems.length; idx++) {
                if (value === valueGetter(selectedItems[idx])) {
                    return idx;
                }
            }

            return -1;
        },

        _search: function() {
            var that = this;

            that._typingTimeout = setTimeout(function() {
                var value = that.input.val();
                if (that._prev !== value) {
                    that._prev = value;
                    that.search(value);
                }
            }, that.options.delay);
        },

        _allowSelection: function() {
            var max = this.options.maxSelectedItems;
            return max === null || max > this.listView.value().length;
        },

        _angularTagItems: function(cmd) {
            var that = this;

            that.angular(cmd, function() {
                return {
                    elements: that.tagList[0].children,
                    data: $.map(that.dataItems(), function(dataItem) {
                        return { dataItem: dataItem };
                    })
                };
            });
        },

        _selectValue: function(added, removed) {
            var that = this;
            var tagList = that.tagList;
            var getter = that._value;
            var removedItem;
            var addedItem;
            var idx;

            that._angularTagItems("cleanup");

            for (idx = removed.length - 1; idx > -1; idx--) {
                removedItem = removed[idx];

                tagList[0].removeChild(tagList[0].children[removedItem.position]);

                that._setOption(getter(removedItem.dataItem), false);
            }

            for (idx = 0; idx < added.length; idx++) {
                addedItem = added[idx];

                tagList.append(that.tagTemplate(addedItem.dataItem));

                that._setOption(getter(addedItem.dataItem), true);
            }

            that._angularTagItems("compile");
            that._placeholder();
        },

        _select: function(candidate) {
            var that = this;
            var idx;

            if (that._state === REBIND) {
                that._state = "";
            }

            if (!that._allowSelection()) {
                return;
            }

            this.listView.select(candidate);

            that._placeholder();

            if (that._state === FILTER) {
                that._state = ACCEPT;
                that.listView.filter(false);
                that.listView.skipUpdate(true);
            }
        },

        _input: function() {
            var that = this,
                accessKey = that.element[0].accessKey,
                input = that._innerWrapper.children("input.k-input");

            if (!input[0]) {
                input = $('<input class="k-input" style="width: 25px" />').appendTo(that._innerWrapper);
            }

            that.element.removeAttr("accesskey");
            that._focused = that.input = input.attr({
                "accesskey": accessKey,
                "autocomplete": "off",
                "role": "listbox",
                "aria-expanded": false
            });
        },

        _tagList: function() {
            var that = this,
                tagList = that._innerWrapper.children("ul");

            if (!tagList[0]) {
                tagList = $('<ul role="listbox" unselectable="on" class="k-reset"/>').appendTo(that._innerWrapper);
            }

            that.tagList = tagList;
        },

        _tagTemplate: function() {
            var that = this;
            var options = that.options;
            var tagTemplate = options.tagTemplate;
            var hasDataSource = options.dataSource;

            if (that.element[0].length && !hasDataSource) {
                options.dataTextField = options.dataTextField || "text";
                options.dataValueField = options.dataValueField || "value";
            }

            tagTemplate = tagTemplate ? kendo.template(tagTemplate) : kendo.template("#:" + kendo.expr(options.dataTextField, "data") + "#", { useWithBlock: false });

            that.tagTextTemplate = tagTemplate;
            that.tagTemplate = function(data) {
                return '<li class="k-button" unselectable="on"><span unselectable="on">' + tagTemplate(data) + '</span><span unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-close">delete</span></span></li>';
            };
        },

        _loader: function() {
            this._loading = $('<span class="k-icon k-loading ' + HIDDENCLASS + '"></span>').insertAfter(this.input);
        },

        _textContainer: function() {
            var computedStyles = kendo.getComputedStyles(this.input[0], styles);

            computedStyles.position = "absolute";
            computedStyles.visibility = "hidden";
            computedStyles.top = -3333;
            computedStyles.left = -3333;

            this._span = $("<span/>").css(computedStyles).appendTo(this.wrapper);
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                wrapper = element.parent("span.k-multiselect");

            if (!wrapper[0]) {
                wrapper = element.wrap('<div class="k-widget k-multiselect k-header" unselectable="on" />').parent();
                wrapper[0].style.cssText = element[0].style.cssText;
                wrapper[0].title = element[0].title;

                $('<div class="k-multiselect-wrap k-floatwrap" unselectable="on" />').insertBefore(element);
            }

            that.wrapper = wrapper.addClass(element[0].className).css("display", "");
            that._innerWrapper = $(wrapper[0].firstChild);
        }
    });

    function compare(a, b) {
        var length;

        if ((a === null && b !== null) || (a !== null && b === null)) {
            return false;
        }

        length = a.length;
        if (length !== b.length) {
            return false;
        }

        while (length--) {
            if (a[length] !== b[length]) {
                return false;
            }
        }

        return true;
    }

    ui.plugin(MultiSelect);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.data", "./kendo.editable", "./kendo.selectable" ], f);
})(function(){

var __meta__ = {
    id: "listview",
    name: "ListView",
    category: "web",
    description: "The ListView widget offers rich support for interacting with data.",
    depends: [ "data" ],
    features: [ {
        id: "listview-editing",
        name: "Editing",
        description: "Support for record editing",
        depends: [ "editable" ]
    }, {
        id: "listview-selection",
        name: "Selection",
        description: "Support for selection",
        depends: [ "selectable" ]
    } ]
};

(function($, undefined) {
    var kendo = window.kendo,
        CHANGE = "change",
        CANCEL = "cancel",
        DATABOUND = "dataBound",
        DATABINDING = "dataBinding",
        Widget = kendo.ui.Widget,
        keys = kendo.keys,
        FOCUSSELECTOR =  ">*",
        PROGRESS = "progress",
        ERROR = "error",
        FOCUSED = "k-state-focused",
        SELECTED = "k-state-selected",
        KEDITITEM = "k-edit-item",
        STRING = "string",
        EDIT = "edit",
        REMOVE = "remove",
        SAVE = "save",
        CLICK = "click",
        NS = ".kendoListView",
        proxy = $.proxy,
        activeElement = kendo._activeElement,
        progress = kendo.ui.progress,
        DataSource = kendo.data.DataSource;

    var ListView = kendo.ui.DataBoundWidget.extend( {
        init: function(element, options) {
            var that = this;

            options = $.isArray(options) ? { dataSource: options } : options;

            Widget.fn.init.call(that, element, options);

            options = that.options;

            that.wrapper = element = that.element;

            if (element[0].id) {
                that._itemId = element[0].id + "_lv_active";
            }

            that._element();

            that._dataSource();

            that._templates();

            that._navigatable();

            that._selectable();

            that._pageable();

            that._crudHandlers();

            if (that.options.autoBind){
                that.dataSource.fetch();
            }

            kendo.notify(that);
        },

        events: [
            CHANGE,
            CANCEL,
            DATABINDING,
            DATABOUND,
            EDIT,
            REMOVE,
            SAVE
        ],

        options: {
            name: "ListView",
            autoBind: true,
            selectable: false,
            navigatable: false,
            template: "",
            altTemplate: "",
            editTemplate: ""
        },

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            this._templates();

            if (this.selectable) {
                this.selectable.destroy();
                this.selectable = null;
            }

            this._selectable();
        },

        _templates: function() {
            var options = this.options;

            this.template = kendo.template(options.template || "");
            this.altTemplate = kendo.template(options.altTemplate || options.template);
            this.editTemplate = kendo.template(options.editTemplate || "");
        },

        _item: function(action) {
            return this.element.children()[action]();
        },

        items: function() {
            return this.element.children();
        },

        dataItem: function(element) {
            var attr = kendo.attr("uid");
            var uid = $(element).closest("[" + attr + "]").attr(attr);

            return this.dataSource.getByUid(uid);
        },

        setDataSource: function(dataSource) {
            this.options.dataSource = dataSource;
            this._dataSource();

            if (this.options.autoBind) {
                dataSource.fetch();
            }
        },

        _unbindDataSource: function() {
            var that = this;

            that.dataSource.unbind(CHANGE, that._refreshHandler)
                            .unbind(PROGRESS, that._progressHandler)
                            .unbind(ERROR, that._errorHandler);
        },

        _dataSource: function() {
            var that = this;

            if (that.dataSource && that._refreshHandler) {
                that._unbindDataSource();
            } else {
                that._refreshHandler = proxy(that.refresh, that);
                that._progressHandler = proxy(that._progress, that);
                that._errorHandler = proxy(that._error, that);
            }

            that.dataSource = DataSource.create(that.options.dataSource)
                                .bind(CHANGE, that._refreshHandler)
                                .bind(PROGRESS, that._progressHandler)
                                .bind(ERROR, that._errorHandler);
        },

        _progress: function() {
            progress(this.element, true);
        },

        _error: function() {
            progress(this.element, false);
        },

        _element: function() {
            this.element.addClass("k-widget k-listview").attr("role", "listbox");
        },

        refresh: function(e) {
            var that = this,
                view = that.dataSource.view(),
                data,
                items,
                item,
                html = "",
                idx,
                length,
                template = that.template,
                altTemplate = that.altTemplate,
                active = activeElement();

            e = e || {};

            if (e.action === "itemchange") {
                if (!that._hasBindingTarget() && !that.editable) {
                    data = e.items[0];
                    item = that.items().filter("[" + kendo.attr("uid") + "=" + data.uid + "]");

                    if (item.length > 0) {
                        idx = item.index();

                        that.angular("cleanup", function() {
                            return { elements: [ item ]};
                        });

                        item.replaceWith(template(data));
                        item = that.items().eq(idx);
                        item.attr(kendo.attr("uid"), data.uid);

                        that.angular("compile", function() {
                            return { elements: [ item ], data: [ { dataItem: data } ]};
                        });

                        that.trigger("itemChange", {
                            item: item,
                            data: data
                        });
                    }
                }

                return;
            }

            if (that.trigger(DATABINDING, { action: e.action || "rebind", items: e.items, index: e.index })) {
                return;
            }

            that._angularItems("cleanup");

            that._destroyEditable();

            for (idx = 0, length = view.length; idx < length; idx++) {
                if (idx % 2) {
                    html += altTemplate(view[idx]);
                } else {
                    html += template(view[idx]);
                }
            }

            that.element.html(html);

            items = that.items();
            for (idx = 0, length = view.length; idx < length; idx++) {
                items.eq(idx).attr(kendo.attr("uid"), view[idx].uid)
                             .attr("role", "option")
                             .attr("aria-selected", "false");
            }

            if (that.element[0] === active && that.options.navigatable) {
                that.current(items.eq(0));
            }

            that._angularItems("compile");

            that.trigger(DATABOUND);
        },

        _pageable: function() {
            var that = this,
                pageable = that.options.pageable,
                settings,
                pagerId;

            if ($.isPlainObject(pageable)) {
                pagerId = pageable.pagerId;
                settings = $.extend({}, pageable, {
                    dataSource: that.dataSource,
                    pagerId: null
                });

                that.pager = new kendo.ui.Pager($("#" + pagerId), settings);
            }
        },

        _selectable: function() {
            var that = this,
                multi,
                current,
                selectable = that.options.selectable,
                navigatable = that.options.navigatable;

            if (selectable) {
                multi = kendo.ui.Selectable.parseOptions(selectable).multiple;

                that.selectable = new kendo.ui.Selectable(that.element, {
                    aria: true,
                    multiple: multi,
                    filter: FOCUSSELECTOR,
                    change: function() {
                        that.trigger(CHANGE);
                    }
                });

                if (navigatable) {
                    that.element.on("keydown" + NS, function(e) {
                        if (e.keyCode === keys.SPACEBAR) {
                            current = that.current();
                            if (e.target == e.currentTarget) {
                                e.preventDefault();
                            }
                            if(multi) {
                                if(!e.ctrlKey) {
                                    that.selectable.clear();
                                } else {
                                    if (current && current.hasClass(SELECTED)) {
                                        current.removeClass(SELECTED);
                                        return;
                                    }
                                }
                            } else {
                                that.selectable.clear();
                            }

                            that.selectable.value(current);
                        }
                    });
                }
            }
        },

        current: function(candidate) {
            var that = this,
                element = that.element,
                current = that._current,
                id = that._itemId;

            if (candidate === undefined) {
                return current;
            }

            if (current && current[0]) {
                if (current[0].id === id) {
                    current.removeAttr("id");
                }

                current.removeClass(FOCUSED);
                element.removeAttr("aria-activedescendant");
            }

            if (candidate && candidate[0]) {
                id = candidate[0].id || id;

                that._scrollTo(candidate[0]);

                element.attr("aria-activedescendant", id);
                candidate.addClass(FOCUSED).attr("id", id);
            }

            that._current = candidate;
        },

        _scrollTo: function(element) {
            var that = this,
                container,
                UseJQueryoffset = false,
                SCROLL = "scroll";

            if (that.wrapper.css("overflow") == "auto" || that.wrapper.css("overflow") == SCROLL) {
                container = that.wrapper[0];
            } else {
                container = window;
                UseJQueryoffset = true;
            }

            var scrollDirectionFunc = function(direction, dimension) {

                var elementOffset = UseJQueryoffset ? $(element).offset()[direction.toLowerCase()] : element["offset" + direction],
                    elementDimension = element["client" + dimension],
                    containerScrollAmount = $(container)[SCROLL + direction](),
                    containerDimension = $(container)[dimension.toLowerCase()]();

                if (elementOffset + elementDimension > containerScrollAmount + containerDimension) {
                    $(container)[SCROLL + direction](elementOffset + elementDimension - containerDimension);
                } else if (elementOffset < containerScrollAmount) {
                    $(container)[SCROLL + direction](elementOffset);
                }
            };

            scrollDirectionFunc("Top", "Height");
            scrollDirectionFunc("Left", "Width");
        },

        _navigatable: function() {
            var that = this,
                navigatable = that.options.navigatable,
                element = that.element,
                clickCallback = function(e) {
                    that.current($(e.currentTarget));
                    if(!$(e.target).is(":button,a,:input,a>.k-icon,textarea")) {
                        element.focus();
                    }
                };

            if (navigatable) {
                that._tabindex();
                element.on("focus" + NS, function() {
                        var current = that._current;
                        if(!current || !current.is(":visible")) {
                            current = that._item("first");
                        }

                        that.current(current);
                    })
                    .on("focusout" + NS, function() {
                        if (that._current) {
                            that._current.removeClass(FOCUSED);
                        }
                    })
                    .on("keydown" + NS, function(e) {
                        var key = e.keyCode,
                            current = that.current(),
                            target = $(e.target),
                            canHandle = !target.is(":button,textarea,a,a>.t-icon,input"),
                            isTextBox = target.is(":text"),
                            preventDefault = kendo.preventDefault,
                            editItem = element.find("." + KEDITITEM),
                            active = activeElement(), idx;

                        if ((!canHandle && !isTextBox && keys.ESC != key) || (isTextBox && keys.ESC != key && keys.ENTER != key)) {
                            return;
                        }

                        if (keys.UP === key || keys.LEFT === key) {
                            if (current) {
                                current = current.prev();
                            }

                            that.current(!current || !current[0] ? that._item("last") : current);
                            preventDefault(e);
                        } else if (keys.DOWN === key || keys.RIGHT === key) {
                            if (current) {
                                current = current.next();
                            }
                            that.current(!current || !current[0] ? that._item("first") : current);
                            preventDefault(e);
                        } else if (keys.PAGEUP === key) {
                            that.current(null);
                            that.dataSource.page(that.dataSource.page() - 1);
                            preventDefault(e);
                        } else if (keys.PAGEDOWN === key) {
                            that.current(null);
                            that.dataSource.page(that.dataSource.page() + 1);
                            preventDefault(e);
                        } else if (keys.HOME === key) {
                            that.current(that._item("first"));
                            preventDefault(e);
                        } else if (keys.END === key) {
                            that.current(that._item("last"));
                            preventDefault(e);
                        } else if (keys.ENTER === key) {
                            if (editItem.length !== 0 && (canHandle || isTextBox)) {
                                idx = that.items().index(editItem);
                                if (active) {
                                    active.blur();
                                }
                                that.save();
                                var focusAgain = function(){
                                    that.element.trigger("focus");
                                    that.current(that.items().eq(idx));
                                };
                                that.one("dataBound", focusAgain);
                            } else if (that.options.editTemplate !== "") {
                                that.edit(current);
                            }
                        } else if (keys.ESC === key) {
                            editItem = element.find("." + KEDITITEM);
                            if (editItem.length === 0) {
                                return;
                            }
                            idx = that.items().index(editItem);
                            that.cancel();
                            that.element.trigger("focus");
                            that.current(that.items().eq(idx));
                        }
                    });

                element.on("mousedown" + NS + " touchstart" + NS, FOCUSSELECTOR, proxy(clickCallback, that));
            }
       },

       clearSelection: function() {
           var that = this;
           that.selectable.clear();
           that.trigger(CHANGE);
       },

       select: function(items) {
           var that = this,
               selectable = that.selectable;

            items = $(items);
            if(items.length) {
                if(!selectable.options.multiple) {
                    selectable.clear();
                    items = items.first();
                }
                selectable.value(items);
                return;
            }

           return selectable.value();
       },

       _destroyEditable: function() {
           var that = this;
           if (that.editable) {
               that.editable.destroy();
               delete that.editable;
           }
       },

       _modelFromElement: function(element) {
           var uid = element.attr(kendo.attr("uid"));

           return this.dataSource.getByUid(uid);
       },

       _closeEditable: function(validate) {
           var that = this,
               editable = that.editable,
               data,
               item,
               index,
               template = that.template,
               valid = true;

           if (editable) {
               if (validate) {
                   valid = editable.end();
               }

               if (valid) {
                   if (editable.element.index() % 2) {
                       template = that.altTemplate;
                   }

                   that.angular("cleanup", function() {
                       return { elements: [ editable.element ]};
                   });

                   data = that._modelFromElement(editable.element);
                   that._destroyEditable();

                   index = editable.element.index();
                   editable.element.replaceWith(template(data));
                   item = that.items().eq(index);
                   item.attr(kendo.attr("uid"), data.uid);

                   if (that._hasBindingTarget()) {
                        kendo.bind(item, data);
                   }

                   that.angular("compile", function() {
                       return { elements: [ item ], data: [ { dataItem: data } ]};
                   });
               }
           }

           return valid;
       },

       edit: function(item) {
           var that = this,
               data = that._modelFromElement(item),
               container,
               uid = data.uid,
               index;

            that.cancel();

            item = that.items().filter("[" + kendo.attr("uid") + "=" + uid + "]");
            index = item.index();
            item.replaceWith(that.editTemplate(data));
            container = that.items().eq(index).addClass(KEDITITEM).attr(kendo.attr("uid"), data.uid);
            that.editable = container.kendoEditable({
                model: data,
                clearContainer: false,
                errorTemplate: false,
                target: that
            }).data("kendoEditable");

            that.trigger(EDIT, { model: data, item: container });
       },

       save: function() {
           var that = this,
               editable = that.editable,
               model;

           if (!editable) {
               return;
           }

           editable = editable.element;
           model = that._modelFromElement(editable);

           if (!that.trigger(SAVE, { model: model, item: editable }) && that._closeEditable(true)) {
               that.dataSource.sync();
           }
       },

       remove: function(item) {
           var that = this,
               dataSource = that.dataSource,
               data = that._modelFromElement(item);

           if (that.editable) {
               dataSource.cancelChanges(that._modelFromElement(that.editable.element));
               that._closeEditable(false);
           }

           if (!that.trigger(REMOVE, { model: data, item: item })) {
               item.hide();
               dataSource.remove(data);
               dataSource.sync();
           }
       },

       add: function() {
           var that = this,
               dataSource = that.dataSource,
               index = dataSource.indexOf((dataSource.view() || [])[0]);

           if (index < 0) {
               index = 0;
           }

           that.cancel();
           dataSource.insert(index, {});
           that.edit(that.element.children().first());
       },

       cancel: function() {
           var that = this,
               dataSource = that.dataSource;

           if (that.editable) {
               var container = that.editable.element;
               var model = that._modelFromElement(container);

               if (!that.trigger(CANCEL, { model: model, container: container})) {
                   dataSource.cancelChanges(model);
                   that._closeEditable(false);
               }
           }
       },

       _crudHandlers: function() {
           var that = this,
               clickNS = CLICK + NS;

           that.element.on(clickNS, ".k-edit-button", function(e) {
               var item = $(this).closest("[" + kendo.attr("uid") + "]");
               that.edit(item);
               e.preventDefault();
           });

           that.element.on(clickNS, ".k-delete-button", function(e) {
               var item = $(this).closest("[" + kendo.attr("uid") + "]");
               that.remove(item);
               e.preventDefault();
           });

           that.element.on(clickNS, ".k-update-button", function(e) {
               that.save();
               e.preventDefault();
           });

           that.element.on(clickNS, ".k-cancel-button", function(e) {
               that.cancel();
               e.preventDefault();
           });
       },

       destroy: function() {
           var that = this;

           Widget.fn.destroy.call(that);

           that._unbindDataSource();

           that._destroyEditable();

           that.element.off(NS);

           if (that.pager) {
               that.pager.destroy();
           }

           kendo.destroy(that.element);
       }
    });

    kendo.ui.plugin(ListView);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core", "./kendo.userevents" ], f);
})(function(){

var __meta__ = {
    id: "numerictextbox",
    name: "NumericTextBox",
    category: "web",
    description: "The NumericTextBox widget can format and display numeric, percentage or currency textbox.",
    depends: [ "core", "userevents" ]
};

(function($, undefined) {
    var kendo = window.kendo,
        caret = kendo.caret,
        keys = kendo.keys,
        ui = kendo.ui,
        Widget = ui.Widget,
        activeElement = kendo._activeElement,
        extractFormat = kendo._extractFormat,
        parse = kendo.parseFloat,
        placeholderSupported = kendo.support.placeholder,
        getCulture = kendo.getCulture,
        round = kendo._round,
        CHANGE = "change",
        DISABLED = "disabled",
        READONLY = "readonly",
        INPUT = "k-input",
        SPIN = "spin",
        ns = ".kendoNumericTextBox",
        TOUCHEND = "touchend",
        MOUSELEAVE = "mouseleave" + ns,
        HOVEREVENTS = "mouseenter" + ns + " " + MOUSELEAVE,
        DEFAULT = "k-state-default",
        FOCUSED = "k-state-focused",
        HOVER = "k-state-hover",
        FOCUS = "focus",
        POINT = ".",
        SELECTED = "k-state-selected",
        STATEDISABLED = "k-state-disabled",
        ARIA_DISABLED = "aria-disabled",
        ARIA_READONLY = "aria-readonly",
        INTEGER_REGEXP = /^(-)?(\d*)$/,
        NULL = null,
        proxy = $.proxy,
        extend = $.extend;

    var NumericTextBox = Widget.extend({
         init: function(element, options) {
             var that = this,
             isStep = options && options.step !== undefined,
             min, max, step, value, disabled;

             Widget.fn.init.call(that, element, options);

             options = that.options;
             element = that.element
                           .on("focusout" + ns, proxy(that._focusout, that))
                           .attr("role", "spinbutton");

             options.placeholder = options.placeholder || element.attr("placeholder");

             that._initialOptions = extend({}, options);

             that._reset();
             that._wrapper();
             that._arrows();
             that._input();

             if (!kendo.support.mobileOS) {
                 that._text.on(FOCUS + ns, proxy(that._click, that));
             } else {
                 that._text.on(TOUCHEND + ns + " " + FOCUS + ns, function(e) {
                    that._toggleText(false);
                    element.focus();
                 });
             }

             min = that.min(element.attr("min"));
             max = that.max(element.attr("max"));
             step = that._parse(element.attr("step"));

             if (options.min === NULL && min !== NULL) {
                 options.min = min;
             }

             if (options.max === NULL && max !== NULL) {
                 options.max = max;
             }

             if (!isStep && step !== NULL) {
                 options.step = step;
             }

             element.attr("aria-valuemin", options.min)
                    .attr("aria-valuemax", options.max);

             options.format = extractFormat(options.format);

             value = options.value;
             that.value(value !== NULL ? value : element.val());

             disabled = element.is("[disabled]") || $(that.element).parents("fieldset").is(':disabled');

             if (disabled) {
                 that.enable(false);
             } else {
                 that.readonly(element.is("[readonly]"));
             }

             kendo.notify(that);
         },

        options: {
            name: "NumericTextBox",
            decimals: NULL,
            min: NULL,
            max: NULL,
            value: NULL,
            step: 1,
            culture: "",
            format: "n",
            spinners: true,
            placeholder: "",
            upArrowText: "Increase value",
            downArrowText: "Decrease value"
        },
        events: [
            CHANGE,
            SPIN
        ],

        _editable: function(options) {
            var that = this,
                element = that.element,
                disable = options.disable,
                readonly = options.readonly,
                text = that._text.add(element),
                wrapper = that._inputWrapper.off(HOVEREVENTS);

            that._toggleText(true);

            that._upArrowEventHandler.unbind("press");
            that._downArrowEventHandler.unbind("press");
            element.off("keydown" + ns).off("keypress" + ns).off("paste" + ns);

            if (!readonly && !disable) {
                wrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover);

                text.removeAttr(DISABLED)
                    .removeAttr(READONLY)
                    .attr(ARIA_DISABLED, false)
                    .attr(ARIA_READONLY, false);

                that._upArrowEventHandler.bind("press", function(e) {
                    e.preventDefault();
                    that._spin(1);
                    that._upArrow.addClass(SELECTED);
                });

                that._downArrowEventHandler.bind("press", function(e) {
                    e.preventDefault();
                    that._spin(-1);
                    that._downArrow.addClass(SELECTED);
                });

                that.element
                    .on("keydown" + ns, proxy(that._keydown, that))
                    .on("keypress" + ns, proxy(that._keypress, that))
                    .on("paste" + ns, proxy(that._paste, that));

            } else {
                wrapper
                    .addClass(disable ? STATEDISABLED : DEFAULT)
                    .removeClass(disable ? DEFAULT : STATEDISABLED);

                text.attr(DISABLED, disable)
                    .attr(READONLY, readonly)
                    .attr(ARIA_DISABLED, disable)
                    .attr(ARIA_READONLY, readonly);
            }
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        destroy: function() {
            var that = this;

            that.element
                .add(that._text)
                .add(that._upArrow)
                .add(that._downArrow)
                .add(that._inputWrapper)
                .off(ns);

            that._upArrowEventHandler.destroy();
            that._downArrowEventHandler.destroy();

            if (that._form) {
                that._form.off("reset", that._resetHandler);
            }

            Widget.fn.destroy.call(that);
        },

        min: function(value) {
            return this._option("min", value);
        },

        max: function(value) {
            return this._option("max", value);
        },

        step: function(value) {
            return this._option("step", value);
        },

        value: function(value) {
            var that = this, adjusted;

            if (value === undefined) {
                return that._value;
            }

            value = that._parse(value);
            adjusted = that._adjust(value);

            if (value !== adjusted) {
                return;
            }

            that._update(value);
            that._old = that._value;
        },

        focus: function() {
            this._focusin();
        },

        _adjust: function(value) {
            var that = this,
            options = that.options,
            min = options.min,
            max = options.max;

            if (value === NULL) {
                return value;
            }

            if (min !== NULL && value < min) {
                value = min;
            } else if (max !== NULL && value > max) {
                value = max;
            }

            return value;
        },

        _arrows: function() {
            var that = this,
            arrows,
            _release = function() {
                clearTimeout( that._spinning );
                arrows.removeClass(SELECTED);
            },
            options = that.options,
            spinners = options.spinners,
            element = that.element;

            arrows = element.siblings(".k-icon");

            if (!arrows[0]) {
                arrows = $(buttonHtml("n", options.upArrowText) + buttonHtml("s", options.downArrowText))
                        .insertAfter(element);

                arrows.wrapAll('<span class="k-select"/>');
            }

            if (!spinners) {
                arrows.parent().toggle(spinners);
                that._inputWrapper.addClass("k-expand-padding");
            }

            that._upArrow = arrows.eq(0);
            that._upArrowEventHandler = new kendo.UserEvents(that._upArrow, { release: _release });
            that._downArrow = arrows.eq(1);
            that._downArrowEventHandler = new kendo.UserEvents(that._downArrow, { release: _release });
        },

        _blur: function() {
            var that = this;

            that._toggleText(true);
            that._change(that.element.val());
        },

        _click: function(e) {
            var that = this;

            clearTimeout(that._focusing);
            that._focusing = setTimeout(function() {
                var input = e.target,
                    idx = caret(input)[0],
                    value = input.value.substring(0, idx),
                    format = that._format(that.options.format),
                    group = format[","],
                    result, groupRegExp, extractRegExp,
                    caretPosition = 0;

                if (group) {
                    groupRegExp = new RegExp("\\" + group, "g");
                    extractRegExp = new RegExp("([\\d\\" + group + "]+)(\\" + format[POINT] + ")?(\\d+)?");
                }

                if (extractRegExp) {
                    result = extractRegExp.exec(value);
                }

                if (result) {
                    caretPosition = result[0].replace(groupRegExp, "").length;

                    if (value.indexOf("(") != -1 && that._value < 0) {
                        caretPosition++;
                    }
                }

                that._focusin();

                caret(that.element[0], caretPosition);
            });
        },

        _change: function(value) {
            var that = this;

            that._update(value);
            value = that._value;

            if (that._old != value) {
                that._old = value;

                if (!that._typing) {
                    // trigger the DOM change event so any subscriber gets notified
                    that.element.trigger(CHANGE);
                }

                that.trigger(CHANGE);
            }

            that._typing = false;
        },

        _culture: function(culture) {
            return culture || getCulture(this.options.culture);
        },

        _focusin: function() {
            var that = this;
            that._inputWrapper.addClass(FOCUSED);
            that._toggleText(false);
            that.element[0].focus();
        },

        _focusout: function() {
            var that = this;

            clearTimeout(that._focusing);
            that._inputWrapper.removeClass(FOCUSED).removeClass(HOVER);
            that._blur();
        },

        _format: function(format, culture) {
            var numberFormat = this._culture(culture).numberFormat;

            format = format.toLowerCase();

            if (format.indexOf("c") > -1) {
                numberFormat = numberFormat.currency;
            } else if (format.indexOf("p") > -1) {
                numberFormat = numberFormat.percent;
            }

            return numberFormat;
        },

        _input: function() {
            var that = this,
                CLASSNAME = "k-formatted-value",
                element = that.element.addClass(INPUT).show()[0],
                accessKey = element.accessKey,
                wrapper = that.wrapper,
                text;

            text = wrapper.find(POINT + CLASSNAME);

            if (!text[0]) {
                text = $('<input type="text"/>').insertBefore(element).addClass(CLASSNAME);
            }

            try {
                element.setAttribute("type", "text");
            } catch(e) {
                element.type = "text";
            }

            text[0].tabIndex = element.tabIndex;
            text[0].style.cssText = element.style.cssText;
            text[0].title = element.title;
            text.prop("placeholder", that.options.placeholder);

            if (accessKey) {
                text.attr("accesskey", accessKey);
                element.accessKey = "";
            }

            that._text = text.addClass(element.className);
        },

        _keydown: function(e) {
            var that = this,
                key = e.keyCode;

            that._key = key;

            if (key == keys.DOWN) {
                that._step(-1);
            } else if (key == keys.UP) {
                that._step(1);
            } else if (key == keys.ENTER) {
                that._change(that.element.val());
            } else {
                that._typing = true;
            }

        },

        _keypress: function(e) {
            if (e.which === 0 || e.metaKey || e.ctrlKey || e.keyCode === keys.BACKSPACE || e.keyCode === keys.ENTER) {
                return;
            }

            var that = this;
            var min = that.options.min;
            var element = that.element;
            var selection = caret(element);
            var selectionStart = selection[0];
            var selectionEnd = selection[1];
            var character = String.fromCharCode(e.which);
            var numberFormat = that._format(that.options.format);
            var isNumPadDecimal = that._key === keys.NUMPAD_DOT;
            var value = element.val();
            var isValid;

            if (isNumPadDecimal) {
                character = numberFormat[POINT];
            }

            value = value.substring(0, selectionStart) + character + value.substring(selectionEnd);
            isValid = that._numericRegex(numberFormat).test(value);

            if (isValid && isNumPadDecimal) {
                element.val(value);
                caret(element, selectionStart + character.length);

                e.preventDefault();
            } else if ((min !== null && min >= 0 && value.charAt(0) === "-") || !isValid) {
                e.preventDefault();
            }

            that._key = 0;
        },

        _numericRegex: function(numberFormat) {
            var that = this;
            var separator = numberFormat[POINT];
            var precision = that.options.decimals;

            if (separator === POINT) {
                separator = "\\" + separator;
            }

            if (precision === NULL) {
                precision = numberFormat.decimals;
            }

            if (precision === 0) {
                return INTEGER_REGEXP;
            }

            if (that._separator !== separator) {
                that._separator = separator;
                that._floatRegExp = new RegExp("^(-)?(((\\d+(" + separator + "\\d*)?)|(" + separator + "\\d*)))?$");
            }

            return that._floatRegExp;
        },

        _paste: function(e) {
            var that = this,
                element = e.target,
                value = element.value;

            setTimeout(function() {
                if (that._parse(element.value) === NULL) {
                    that._update(value);
                }
            });
        },

        _option: function(option, value) {
            var that = this,
                options = that.options;

            if (value === undefined) {
                return options[option];
            }

            value = that._parse(value);

            if (!value && option === "step") {
                return;
            }

            options[option] = value;
            that.element
                .attr("aria-value" + option, value)
                .attr(option, value);
        },

        _spin: function(step, timeout) {
            var that = this;

            timeout = timeout || 500;

            clearTimeout( that._spinning );
            that._spinning = setTimeout(function() {
                that._spin(step, 50);
            }, timeout );

            that._step(step);
        },

        _step: function(step) {
            var that = this,
                element = that.element,
                value = that._parse(element.val()) || 0;

            if (activeElement() != element[0]) {
                that._focusin();
            }

            value += that.options.step * step;

            that._update(that._adjust(value));
            that._typing = false;

            that.trigger(SPIN);
        },

        _toggleHover: function(e) {
            $(e.currentTarget).toggleClass(HOVER, e.type === "mouseenter");
        },

        _toggleText: function(toggle) {
            var that = this;

            that._text.toggle(toggle);
            that.element.toggle(!toggle);
        },

        _parse: function(value, culture) {
            return parse(value, this._culture(culture), this.options.format);
        },

        _update: function(value) {
            var that = this,
                options = that.options,
                format = options.format,
                decimals = options.decimals,
                culture = that._culture(),
                numberFormat = that._format(format, culture),
                isNotNull;

            if (decimals === NULL) {
                decimals = numberFormat.decimals;
            }

            value = that._parse(value, culture);

            isNotNull = value !== NULL;

            if (isNotNull) {
                value = parseFloat(round(value, decimals));
            }

            that._value = value = that._adjust(value);
            that._placeholder(kendo.toString(value, format, culture));

            if (isNotNull) {
                value = value.toString();
                if (value.indexOf("e") !== -1) {
                    value = round(+value, decimals);
                }
                value = value.replace(POINT, numberFormat[POINT]);
            } else {
                value = "";
            }

            that.element.val(value).attr("aria-valuenow", value);
        },

        _placeholder: function(value) {
            this._text.val(value);
            if (!placeholderSupported && !value) {
                this._text.val(this.options.placeholder);
            }
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                DOMElement = element[0],
                wrapper;

            wrapper = element.parents(".k-numerictextbox");

            if (!wrapper.is("span.k-numerictextbox")) {
                wrapper = element.hide().wrap('<span class="k-numeric-wrap k-state-default" />').parent();
                wrapper = wrapper.wrap("<span/>").parent();
            }

            wrapper[0].style.cssText = DOMElement.style.cssText;
            DOMElement.style.width = "";
            that.wrapper = wrapper.addClass("k-widget k-numerictextbox")
                                  .addClass(DOMElement.className)
                                  .css("display", "");

            that._inputWrapper = $(wrapper[0].firstChild);
        },

        _reset: function() {
            var that = this,
                element = that.element,
                formId = element.attr("form"),
                form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    setTimeout(function() {
                        that.value(element[0].value);
                        that.max(that._initialOptions.max);
                        that.min(that._initialOptions.min);
                    });
                };

                that._form = form.on("reset", that._resetHandler);
            }
        }
    });

    function buttonHtml(className, text) {
        return '<span unselectable="on" class="k-link"><span unselectable="on" class="k-icon k-i-arrow-' + className + '" title="' + text + '">' + text + '</span></span>';
    }

    ui.plugin(NumericTextBox);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "maskedtextbox",
    name: "MaskedTextBox",
    category: "web",
    description: "The MaskedTextBox widget allows to specify a mask type on an input field.",
    depends: [ "core" ]
};

(function($, undefined) {
    var kendo = window.kendo;
    var caret = kendo.caret;
    var keys = kendo.keys;
    var ui = kendo.ui;
    var Widget = ui.Widget;
    var ns = ".kendoMaskedTextBox";
    var proxy = $.proxy;

    var INPUT_EVENT_NAME = (kendo.support.propertyChangeEvent ? "propertychange" : "input") + ns;
    var STATEDISABLED = "k-state-disabled";
    var DISABLED = "disabled";
    var READONLY = "readonly";
    var CHANGE = "change";

    var MaskedTextBox = Widget.extend({
        init: function(element, options) {
            var that = this;
            var DOMElement;

            Widget.fn.init.call(that, element, options);

            that._rules = $.extend({}, that.rules, that.options.rules);

            element = that.element;
            DOMElement = element[0];

            that.wrapper = element;
            that._tokenize();
            that._form();

            that.element
                .addClass("k-textbox")
                .attr("autocomplete", "off")
                .on("focus" + ns, function() {
                    var value = DOMElement.value;

                    if (!value) {
                        DOMElement.value = that._old = that._emptyMask;
                    } else {
                        that._togglePrompt(true);
                    }

                    that._oldValue = value;

                    that._timeoutId = setTimeout(function() {
                        caret(element, 0, value ? that._maskLength : 0);
                    });
                })
                .on("focusout" + ns, function() {
                    var value = element.val();

                    clearTimeout(that._timeoutId);
                    DOMElement.value = that._old = "";

                    if (value !== that._emptyMask) {
                        DOMElement.value = that._old = value;
                    }

                    that._change();
                    that._togglePrompt();
                });

             var disabled = element.is("[disabled]") || $(that.element).parents("fieldset").is(':disabled');

             if (disabled) {
                 that.enable(false);
             } else {
                 that.readonly(element.is("[readonly]"));
             }

             that.value(that.options.value || element.val());

             kendo.notify(that);
        },

        options: {
            name: "MaskedTextBox",
            clearPromptChar: false,
            unmaskOnPost: false,
            promptChar: "_",
            culture: "",
            rules: {},
            value: "",
            mask: ""
        },

        events: [
            CHANGE
        ],

        rules: {
            "0": /\d/,
            "9": /\d|\s/,
            "#": /\d|\s|\+|\-/,
            "L": /[a-zA-Z]/,
            "?": /[a-zA-Z]|\s/,
            "&": /\S/,
            "C": /./,
            "A": /[a-zA-Z0-9]/,
            "a": /[a-zA-Z0-9]|\s/
        },

        setOptions: function(options) {
            var that = this;

            Widget.fn.setOptions.call(that, options);

            that._rules = $.extend({}, that.rules, that.options.rules);

            that._tokenize();

            this._unbindInput();
            this._bindInput();

            that.value(that.element.val());
        },

        destroy: function() {
            var that = this;

            that.element.off(ns);

            if (that._formElement) {
                that._formElement.off("reset", that._resetHandler);
                that._formElement.off("submit", that._submitHandler);
            }

            Widget.fn.destroy.call(that);
        },

        raw: function() {
            var unmasked = this._unmask(this.element.val(), 0);
            return unmasked.replace(new RegExp(this.options.promptChar, "g"), "");
        },

        value: function(value) {
            var element = this.element;
            var emptyMask = this._emptyMask;
            var options = this.options;

            if (value === undefined) {
                return this.element.val();
            }

            if (value === null) {
                value = "";
            }

            if (!emptyMask) {
                element.val(value);
                return;
            }

            value = this._unmask(value + "");

            element.val(value ? emptyMask : "");

            this._mask(0, this._maskLength, value);

            value = element.val();
            this._oldValue = value;

            if (kendo._activeElement() !== element) {
                if (value === emptyMask) {
                    element.val("");
                } else {
                    this._togglePrompt();
                }
            }
        },

        _togglePrompt: function(show) {
            var DOMElement = this.element[0];
            var value = DOMElement.value;

            if (this.options.clearPromptChar) {
                if (!show) {
                    value = value.replace(new RegExp(this.options.promptChar, "g"), " ");
                } else {
                    value = this._oldValue;
                }

                DOMElement.value = this._old = value;
            }
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        _bindInput: function() {
            var that = this;

            if (that._maskLength) {
                that.element
                    .on("keydown" + ns, proxy(that._keydown, that))
                    .on("keypress" + ns, proxy(that._keypress, that))
                    .on("paste" + ns, proxy(that._paste, that))
                    .on(INPUT_EVENT_NAME, proxy(that._propertyChange, that));
            }
        },

        _unbindInput: function() {
            this.element
                .off("keydown" + ns)
                .off("keypress" + ns)
                .off("paste" + ns)
                .off(INPUT_EVENT_NAME);
        },

        _editable: function(options) {
            var that = this;
            var element = that.element;
            var disable = options.disable;
            var readonly = options.readonly;

            that._unbindInput();

            if (!readonly && !disable) {
                element.removeAttr(DISABLED)
                       .removeAttr(READONLY)
                       .removeClass(STATEDISABLED);

                that._bindInput();
            } else {
                element.attr(DISABLED, disable)
                       .attr(READONLY, readonly)
                       .toggleClass(STATEDISABLED, disable);
            }
        },

        _change: function() {
            var that = this;
            var value = that.value();

            if (value !== that._oldValue) {
                that._oldValue = value;

                that.trigger(CHANGE);
                that.element.trigger(CHANGE);
            }
        },

        _propertyChange: function() {
            var that = this;
            var element = that.element[0];
            var value = element.value;
            var unmasked;
            var start;

            if (kendo._activeElement() !== element) {
                return;
            }

            if (value !== that._old && !that._pasting) {
                start = caret(element)[0];
                unmasked = that._unmask(value.substring(start), start);

                element.value = that._old = value.substring(0, start) + that._emptyMask.substring(start);

                that._mask(start, start, unmasked);
                caret(element, start);
            }
        },

        _paste: function(e) {
            var that = this;
            var element = e.target;
            var position = caret(element);
            var start = position[0];
            var end = position[1];

            var unmasked = that._unmask(element.value.substring(end), end);

            that._pasting = true;

            setTimeout(function() {
                var value = element.value;
                var pasted = value.substring(start, caret(element)[0]);

                element.value = that._old = value.substring(0, start) + that._emptyMask.substring(start);

                that._mask(start, start, pasted);

                start = caret(element)[0];

                that._mask(start, start, unmasked);

                caret(element, start);

                that._pasting = false;
            });
        },

        _form: function() {
            var that = this;
            var element = that.element;
            var formId = element.attr("form");
            var form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    setTimeout(function() {
                        that.value(element[0].value);
                    });
                };

                that._submitHandler = function() {
                    that.element[0].value = that._old = that.raw();
                };

                if (that.options.unmaskOnPost) {
                    form.on("submit", that._submitHandler);
                }

                that._formElement = form.on("reset", that._resetHandler);
            }
        },

        _keydown: function(e) {
            var key = e.keyCode;
            var element = this.element[0];
            var selection = caret(element);
            var start = selection[0];
            var end = selection[1];
            var placeholder;

            var backward = key === keys.BACKSPACE;

            if (backward || key === keys.DELETE) {
                if (start === end) {
                    if (backward) {
                        start -= 1;
                    } else {
                        end += 1;
                    }

                    placeholder = this._find(start, backward);
                }

                if (placeholder !== undefined && placeholder !== start) {
                    if (backward) {
                        placeholder += 1;
                    }

                    caret(element, placeholder);
                } else if (start > -1) {
                    this._mask(start, end, "", backward);
                }

                e.preventDefault();
            } else if (key === keys.ENTER) {
                this._change();
            }
        },

        _keypress: function(e) {
            if (e.which === 0 || e.metaKey || e.ctrlKey || e.keyCode === keys.ENTER) {
                return;
            }

            var character = String.fromCharCode(e.which);

            var selection = caret(this.element);

            this._mask(selection[0], selection[1], character);

            if (e.keyCode === keys.BACKSPACE || character) {
                e.preventDefault();
            }
        },

        _find: function(idx, backward) {
            var value = this.element.val() || this._emptyMask;
            var step = 1;

            if (backward === true) {
                step = -1;
            }

            while (idx > -1 || idx <= this._maskLength) {
                if (value.charAt(idx) !== this.tokens[idx]) {
                    return idx;
                }

                idx += step;
            }

            return -1;
        },

        _mask: function(start, end, value, backward) {
            var element = this.element[0];
            var current = element.value || this._emptyMask;
            var empty = this.options.promptChar;
            var valueLength;
            var chrIdx = 0;
            var unmasked;
            var chr;
            var idx;

            start = this._find(start, backward);

            if (start > end) {
                end = start;
            }

            unmasked = this._unmask(current.substring(end), end);
            value = this._unmask(value, start);
            valueLength = value.length;

            if (value) {
                unmasked = unmasked.replace(new RegExp("^_{0," + valueLength + "}"), "");
            }

            value += unmasked;
            current = current.split("");
            chr = value.charAt(chrIdx);

            while (start < this._maskLength) {
                current[start] = chr || empty;
                chr = value.charAt(++chrIdx);

                if (idx === undefined && chrIdx > valueLength) {
                    idx = start;
                }

                start = this._find(start + 1);
            }

            element.value = this._old = current.join("");

            if (kendo._activeElement() === element) {
                if (idx === undefined) {
                    idx = this._maskLength;
                }

                caret(element, idx);
            }
        },

        _unmask: function(value, idx) {
            if (!value) {
                return "";
            }

            value = (value + "").split("");

            var chr;
            var token;
            var chrIdx = 0;
            var tokenIdx = idx || 0;

            var empty = this.options.promptChar;

            var valueLength = value.length;
            var tokensLength = this.tokens.length;

            var result = "";

            while (tokenIdx < tokensLength) {
                chr = value[chrIdx];
                token = this.tokens[tokenIdx];

                if (chr === token || chr === empty) {
                    result += chr === empty ? empty : "";

                    chrIdx += 1;
                    tokenIdx += 1;
                } else if (typeof token !== "string") {
                    if ((token.test && token.test(chr)) || ($.isFunction(token) && token(chr))) {
                        result += chr;
                        tokenIdx += 1;
                    }

                    chrIdx += 1;
                } else {
                    tokenIdx += 1;
                }

                if (chrIdx >= valueLength) {
                    break;
                }
            }

            return result;
        },

        _tokenize: function() {
            var tokens = [];
            var tokenIdx = 0;

            var mask = this.options.mask || "";
            var maskChars = mask.split("");
            var length = maskChars.length;
            var idx = 0;
            var chr;
            var rule;

            var emptyMask = "";
            var promptChar = this.options.promptChar;
            var numberFormat = kendo.getCulture(this.options.culture).numberFormat;
            var rules = this._rules;

            for (; idx < length; idx++) {
                chr = maskChars[idx];
                rule = rules[chr];

                if (rule) {
                    tokens[tokenIdx] = rule;
                    emptyMask += promptChar;
                    tokenIdx += 1;
                } else {
                    if (chr === "." || chr === ",") {
                        chr = numberFormat[chr];
                    } else if (chr === "$") {
                        chr = numberFormat.currency.symbol;
                    } else if (chr === "\\") {
                        idx += 1;
                        chr = maskChars[idx];
                    }

                    chr = chr.split("");

                    for (var i = 0, l = chr.length; i < l; i++) {
                        tokens[tokenIdx] = chr[i];
                        emptyMask += chr[i];
                        tokenIdx += 1;
                    }
                }
            }

            this.tokens = tokens;

            this._emptyMask = emptyMask;
            this._maskLength = emptyMask.length;
        }
    });

    ui.plugin(MaskedTextBox);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.datepicker", "./kendo.numerictextbox", "./kendo.validator", "./kendo.binder" ], f);
})(function(){

var __meta__ = {
    id: "editable",
    name: "Editable",
    category: "framework",
    depends: [ "datepicker", "numerictextbox", "validator", "binder" ],
    hidden: true
};

/* jshint eqnull: true */
(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        extend = $.extend,
        oldIE = kendo.support.browser.msie && kendo.support.browser.version < 9,
        isFunction = kendo.isFunction,
        isPlainObject = $.isPlainObject,
        inArray = $.inArray,
        nameSpecialCharRegExp = /("|\%|'|\[|\]|\$|\.|\,|\:|\;|\+|\*|\&|\!|\#|\(|\)|<|>|\=|\?|\@|\^|\{|\}|\~|\/|\||`)/g,
        ERRORTEMPLATE = '<div class="k-widget k-tooltip k-tooltip-validation" style="margin:0.5em"><span class="k-icon k-warning"> </span>' +
                    '#=message#<div class="k-callout k-callout-n"></div></div>',
        CHANGE = "change";

    var specialRules = ["url", "email", "number", "date", "boolean"];

    function fieldType(field) {
        field = field != null ? field : "";
        return field.type || $.type(field) || "string";
    }

    function convertToValueBinding(container) {
        container.find(":input:not(:button, [" + kendo.attr("role") + "=upload], [" + kendo.attr("skip") + "], [type=file]), select").each(function() {
            var bindAttr = kendo.attr("bind"),
                binding = this.getAttribute(bindAttr) || "",
                bindingName = this.type === "checkbox" ||  this.type === "radio" ? "checked:" : "value:",
                fieldName = this.name;

            if (binding.indexOf(bindingName) === -1 && fieldName) {
                binding += (binding.length ? "," : "") + bindingName + fieldName;

                $(this).attr(bindAttr, binding);
            }
        });
    }

    function createAttributes(options) {
        var field = (options.model.fields || options.model)[options.field],
            type = fieldType(field),
            validation = field ? field.validation : {},
            ruleName,
            DATATYPE = kendo.attr("type"),
            BINDING = kendo.attr("bind"),
            rule,
            attr = {
                name: options.field
            };

        for (ruleName in validation) {
            rule = validation[ruleName];

            if (inArray(ruleName, specialRules) >= 0) {
                attr[DATATYPE] = ruleName;
            } else if (!isFunction(rule)) {
                attr[ruleName] = isPlainObject(rule) ? rule.value || ruleName : rule;
            }

            attr[kendo.attr(ruleName + "-msg")] = rule.message;
        }

        if (inArray(type, specialRules) >= 0) {
            attr[DATATYPE] = type;
        }

        attr[BINDING] = (type === "boolean" ? "checked:" : "value:") + options.field;

        return attr;
    }

    function convertItems(items) {
        var idx,
            length,
            item,
            value,
            text,
            result;

        if (items && items.length) {
            result = [];
            for (idx = 0, length = items.length; idx < length; idx++) {
                item = items[idx];
                text = item.text || item.value || item;
                value = item.value == null ? (item.text || item) : item.value;

                result[idx] = { text: text, value: value };
            }
        }
        return result;
    }

    var editors = {
        "number": function(container, options) {
            var attr = createAttributes(options);
            $('<input type="text"/>').attr(attr).appendTo(container).kendoNumericTextBox({ format: options.format });
            $('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
        },
        "date": function(container, options) {
            var attr = createAttributes(options),
                format = options.format;

            if (format) {
                format = kendo._extractFormat(format);
            }

            attr[kendo.attr("format")] = format;

            $('<input type="text"/>').attr(attr).appendTo(container).kendoDatePicker({ format: options.format });
            $('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
        },
        "string": function(container, options) {
            var attr = createAttributes(options);

            $('<input type="text" class="k-input k-textbox"/>').attr(attr).appendTo(container);
        },
        "boolean": function(container, options) {
            var attr = createAttributes(options);
            $('<input type="checkbox" />').attr(attr).appendTo(container);
        },
        "values": function(container, options) {
            var attr = createAttributes(options);
            $('<select ' + kendo.attr("text-field") + '="text"' + kendo.attr("value-field") + '="value"' +
                kendo.attr("source") + "=\'" + kendo.stringify(convertItems(options.values)).replace(/\'/g,"&apos;") +
                "\'" + kendo.attr("role") + '="dropdownlist"/>') .attr(attr).appendTo(container);
            $('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
        }
    };

    function addValidationRules(modelField, rules) {
        var validation = modelField ? (modelField.validation || {}) : {},
            rule,
            descriptor;

        for (rule in validation) {
            descriptor = validation[rule];

            if (isPlainObject(descriptor) && descriptor.value) {
                descriptor = descriptor.value;
            }

            if (isFunction(descriptor)) {
                rules[rule] = descriptor;
            }
        }
    }

    var Editable = Widget.extend({
        init: function(element, options) {
            var that = this;

            if (options.target) {
                options.$angular = options.target.options.$angular;
            }
            Widget.fn.init.call(that, element, options);
            that._validateProxy = $.proxy(that._validate, that);
            that.refresh();
        },

        events: [CHANGE],

        options: {
            name: "Editable",
            editors: editors,
            clearContainer: true,
            errorTemplate: ERRORTEMPLATE
        },

        editor: function(field, modelField) {
            var that = this,
                editors = that.options.editors,
                isObject = isPlainObject(field),
                fieldName = isObject ? field.field : field,
                model = that.options.model || {},
                isValuesEditor = isObject && field.values,
                type = isValuesEditor ? "values" : fieldType(modelField),
                isCustomEditor = isObject && field.editor,
                editor = isCustomEditor ? field.editor : editors[type],
                container = that.element.find("[" + kendo.attr("container-for") + "=" + fieldName.replace(nameSpecialCharRegExp, "\\$1")+ "]");

            editor = editor ? editor : editors.string;

            if (isCustomEditor && typeof field.editor === "string") {
                editor = function(container) {
                    container.append(field.editor);
                };
            }

            container = container.length ? container : that.element;
            editor(container, extend(true, {}, isObject ? field : { field: fieldName }, { model: model }));
        },

        _validate: function(e) {
            var that = this,
                input,
                value = e.value,
                preventChangeTrigger = that._validationEventInProgress,
                values = {},
                bindAttribute = kendo.attr("bind"),
                fieldName = e.field.replace(nameSpecialCharRegExp, "\\$1"),
                bindingRegex = new RegExp("(value|checked)\\s*:\\s*" + fieldName + "\\s*(,|$)");

            values[e.field] = e.value;

            input = $(':input[' + bindAttribute + '*="' + fieldName + '"]', that.element)
                .filter("[" + kendo.attr("validate") + "!='false']").filter(function(element) {
                   return bindingRegex.test($(this).attr(bindAttribute));
                });
            if (input.length > 1) {
                input = input.filter(function () {
                    var element = $(this);
                    return !element.is(":radio") || element.val() == value;
                });
            }

            try {
                that._validationEventInProgress = true;

                if (!that.validatable.validateInput(input) || (!preventChangeTrigger && that.trigger(CHANGE, { values: values }))) {
                    e.preventDefault();
                }

            } finally {
                that._validationEventInProgress = false;
            }
        },

        end: function() {
            return this.validatable.validate();
        },

        destroy: function() {
            var that = this;

            that.angular("cleanup", function(){
                return { elements: that.element };
            });

            Widget.fn.destroy.call(that);

            that.options.model.unbind("set", that._validateProxy);

            kendo.unbind(that.element);

            if (that.validatable) {
                that.validatable.destroy();
            }
            kendo.destroy(that.element);

            that.element.removeData("kendoValidator");
        },

        refresh: function() {
            var that = this,
                idx,
                length,
                fields = that.options.fields || [],
                container = that.options.clearContainer ? that.element.empty() : that.element,
                model = that.options.model || {},
                rules = {},
                field,
                isObject,
                fieldName,
                modelField,
                modelFields;

            if (!$.isArray(fields)) {
                fields = [fields];
            }

            for (idx = 0, length = fields.length; idx < length; idx++) {
                 field = fields[idx];
                 isObject = isPlainObject(field);
                 fieldName = isObject ? field.field : field;
                 modelField = (model.fields || model)[fieldName];

                 addValidationRules(modelField, rules);

                 that.editor(field, modelField);
            }

            if (that.options.target) {
                that.angular("compile", function(){
                    return {
                        elements: container,
                        data: [ { dataItem: model } ]
                    };
                });
            }

            if (!length) {
                modelFields = model.fields || model;
                for (fieldName in modelFields) {
                    addValidationRules(modelFields[fieldName], rules);
               }
            }

            convertToValueBinding(container);

            if (that.validatable) {
                that.validatable.destroy();
            }

            kendo.bind(container, that.options.model);

            that.options.model.unbind("set", that._validateProxy);
            that.options.model.bind("set", that._validateProxy);

            that.validatable = new kendo.ui.Validator(container, {
                validateOnBlur: false,
                errorTemplate: that.options.errorTemplate || undefined,
                rules: rules });

            var focusable = container.find(":kendoFocusable").eq(0).focus();
            if (oldIE) {
                focusable.focus();
            }
        }
   });

   ui.plugin(Editable);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "panelbar",
    name: "PanelBar",
    category: "web",
    description: "The PanelBar widget displays hierarchical data as a multi-level expandable panel bar.",
    depends: [ "core" ]
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        keys = kendo.keys,
        extend = $.extend,
        each = $.each,
        template = kendo.template,
        Widget = ui.Widget,
        excludedNodesRegExp = /^(ul|a|div)$/i,
        NS = ".kendoPanelBar",
        IMG = "img",
        HREF = "href",
        LAST = "k-last",
        LINK = "k-link",
        LINKSELECTOR = "." + LINK,
        ERROR = "error",
        ITEM = ".k-item",
        GROUP = ".k-group",
        VISIBLEGROUP = GROUP + ":visible",
        IMAGE = "k-image",
        FIRST = "k-first",
        EXPAND = "expand",
        SELECT = "select",
        CONTENT = "k-content",
        ACTIVATE = "activate",
        COLLAPSE = "collapse",
        MOUSEENTER = "mouseenter",
        MOUSELEAVE = "mouseleave",
        CONTENTLOAD = "contentLoad",
        ACTIVECLASS = "k-state-active",
        GROUPS = "> .k-panel",
        CONTENTS = "> .k-content",
        FOCUSEDCLASS = "k-state-focused",
        DISABLEDCLASS = "k-state-disabled",
        SELECTEDCLASS = "k-state-selected",
        SELECTEDSELECTOR = "." + SELECTEDCLASS,
        HIGHLIGHTCLASS = "k-state-highlight",
        ACTIVEITEMSELECTOR = ITEM + ":not(.k-state-disabled)",
        clickableItems = "> " + ACTIVEITEMSELECTOR + " > " + LINKSELECTOR + ", .k-panel > " + ACTIVEITEMSELECTOR + " > " + LINKSELECTOR,
        disabledItems = ITEM + ".k-state-disabled > .k-link",
        selectableItems = "> li > " + SELECTEDSELECTOR + ", .k-panel > li > " + SELECTEDSELECTOR,
        defaultState = "k-state-default",
        ARIA_DISABLED = "aria-disabled",
        ARIA_EXPANDED = "aria-expanded",
        ARIA_HIDDEN = "aria-hidden",
        ARIA_SELECTED = "aria-selected",
        VISIBLE = ":visible",
        EMPTY = ":empty",
        SINGLE = "single",

        templates = {
            content: template(
                "<div role='region' class='k-content'#= contentAttributes(data) #>#= content(item) #</div>"
            ),
            group: template(
                "<ul role='group' aria-hidden='true' class='#= groupCssClass(group) #'#= groupAttributes(group) #>" +
                    "#= renderItems(data) #" +
                "</ul>"
            ),
            itemWrapper: template(
                "<#= tag(item) # class='#= textClass(item, group) #' #= contentUrl(item) ##= textAttributes(item) #>" +
                    "#= image(item) ##= sprite(item) ##= text(item) #" +
                    "#= arrow(data) #" +
                "</#= tag(item) #>"
            ),
            item: template(
                "<li role='menuitem' #=aria(item)#class='#= wrapperCssClass(group, item) #'>" +
                    "#= itemWrapper(data) #" +
                    "# if (item.items) { #" +
                    "#= subGroup({ items: item.items, panelBar: panelBar, group: { expanded: item.expanded } }) #" +
                    "# } else if (item.content || item.contentUrl) { #" +
                    "#= renderContent(data) #" +
                    "# } #" +
                "</li>"
            ),
            image: template("<img class='k-image' alt='' src='#= imageUrl #' />"),
            arrow: template("<span class='#= arrowClass(item) #'></span>"),
            sprite: template("<span class='k-sprite #= spriteCssClass #'></span>"),
            empty: template("")
        },

        rendering = {
            aria: function(item) {
                var attr = "";

                if (item.items || item.content || item.contentUrl) {
                    attr += ARIA_EXPANDED + "='" + (item.expanded ? "true" : "false") + "' ";
                }

                if (item.enabled === false) {
                    attr += ARIA_DISABLED + "='true'";
                }

                return attr;
            },

            wrapperCssClass: function (group, item) {
                var result = "k-item",
                    index = item.index;

                if (item.enabled === false) {
                    result += " " + DISABLEDCLASS;
                } else if (item.expanded === true) {
                    result += " " + ACTIVECLASS;
                } else {
                    result += " k-state-default";
                }

                if (index === 0) {
                    result += " k-first";
                }

                if (index == group.length-1) {
                    result += " k-last";
                }

                if (item.cssClass) {
                    result += " " + item.cssClass;
                }

                return result;
            },

            textClass: function(item, group) {
                var result = LINK;

                if (group.firstLevel) {
                    result += " k-header";
                }

                return result;
            },
            textAttributes: function(item) {
                return item.url ? " href='" + item.url + "'" : "";
            },
            arrowClass: function(item) {
                var result = "k-icon";

                result += item.expanded ? " k-i-arrow-n k-panelbar-collapse" : " k-i-arrow-s k-panelbar-expand";

                return result;
            },
            text: function(item) {
                return item.encoded === false ? item.text : kendo.htmlEncode(item.text);
            },
            tag: function(item) {
                return item.url || item.contentUrl ? "a" : "span";
            },
            groupAttributes: function(group) {
                return group.expanded !== true ? " style='display:none'" : "";
            },
            groupCssClass: function() {
                return "k-group k-panel";
            },
            contentAttributes: function(content) {
                return content.item.expanded !== true ? " style='display:none'" : "";
            },
            content: function(item) {
                return item.content ? item.content : item.contentUrl ? "" : "&nbsp;";
            },
            contentUrl: function(item) {
                return item.contentUrl ? 'href="' + item.contentUrl + '"' : "";
            }
        };

    function updateArrow (items) {
        items = $(items);

        items.children(LINKSELECTOR).children(".k-icon").remove();

        items
            .filter(":has(.k-panel),:has(.k-content)")
            .children(".k-link:not(:has([class*=k-i-arrow]))")
            .each(function () {
                var item = $(this),
                    parent = item.parent();

                item.append("<span class='k-icon " + (parent.hasClass(ACTIVECLASS) ? "k-i-arrow-n k-panelbar-collapse" : "k-i-arrow-s k-panelbar-expand") + "'/>");
            });
    }

    function updateFirstLast (items) {
        items = $(items);

        items.filter(".k-first:not(:first-child)").removeClass(FIRST);
        items.filter(".k-last:not(:last-child)").removeClass(LAST);
        items.filter(":first-child").addClass(FIRST);
        items.filter(":last-child").addClass(LAST);
    }

    var PanelBar = Widget.extend({
        init: function(element, options) {
            var that = this,
                content;

            Widget.fn.init.call(that, element, options);

            element = that.wrapper = that.element.addClass("k-widget k-reset k-header k-panelbar");
            options = that.options;

            if (element[0].id) {
                that._itemId = element[0].id + "_pb_active";
            }

            that._tabindex();

            that._initData(options);

            that._updateClasses();

            that._animations(options);

            element
                .on("click" + NS, clickableItems, function(e) {
                    if (that._click($(e.currentTarget))) {
                        e.preventDefault();
                    }
                })
                .on(MOUSEENTER  + NS + " " + MOUSELEAVE + NS, clickableItems, that._toggleHover)
                .on("click" + NS, disabledItems, false)
                .on("keydown" + NS, $.proxy(that._keydown, that))
                .on("focus" + NS, function() {
                    var item = that.select();
                    that._current(item[0] ? item : that._first());
                })
                .on("blur" + NS, function() {
                    that._current(null);
                })
                .attr("role", "menu");

            content = element.find("li." + ACTIVECLASS + " > ." + CONTENT);

            if (content[0]) {
                that.expand(content.parent(), false);
            }

            kendo.notify(that);
        },

        events: [
            EXPAND,
            COLLAPSE,
            SELECT,
            ACTIVATE,
            ERROR,
            CONTENTLOAD
        ],
        options: {
            name: "PanelBar",
            animation: {
                expand: {
                    effects: "expand:vertical",
                    duration: 200
                },
                collapse: { // if collapse animation effects are defined, they will be used instead of expand.reverse
                    duration: 200
                }
            },
            expandMode: "multiple"
        },

        destroy: function() {
            Widget.fn.destroy.call(this);

            this.element.off(NS);

            kendo.destroy(this.element);
        },

        _initData: function(options) {
            var that = this;

            if (options.dataSource) {
                that.element.empty();
                that.append(options.dataSource, that.element);
            }
        },

        setOptions: function(options) {
            var animation = this.options.animation;

            this._animations(options);

            options.animation = extend(true, animation, options.animation);

            if ("dataSource" in options) {
                this._initData(options);
            }

            Widget.fn.setOptions.call(this, options);
        },

        expand: function (element, useAnimation) {
            var that = this,
                animBackup = {};
            useAnimation = useAnimation !== false;
            element = this.element.find(element);

            element.each(function (index, item) {
                item = $(item);
                var groups = item.find(GROUPS).add(item.find(CONTENTS));

                if (!item.hasClass(DISABLEDCLASS) && groups.length > 0) {

                    if (that.options.expandMode == SINGLE && that._collapseAllExpanded(item)) {
                        return that;
                    }

                    element.find("." + HIGHLIGHTCLASS).removeClass(HIGHLIGHTCLASS);
                    item.addClass(HIGHLIGHTCLASS);

                    if (!useAnimation) {
                        animBackup = that.options.animation;
                        that.options.animation = { expand: { effects: {} }, collapse: { hide: true, effects: {} } };
                    }

                    if (!that._triggerEvent(EXPAND, item)) {
                        that._toggleItem(item, false);
                    }

                    if (!useAnimation) {
                        that.options.animation = animBackup;
                    }
                }
            });

            return that;
        },

        collapse: function (element, useAnimation) {
            var that = this,
                animBackup = {};
            useAnimation = useAnimation !== false;
            element = that.element.find(element);

            element.each(function (index, item) {
                item = $(item);
                var groups = item.find(GROUPS).add(item.find(CONTENTS));

                if (!item.hasClass(DISABLEDCLASS) && groups.is(VISIBLE)) {
                    item.removeClass(HIGHLIGHTCLASS);

                    if (!useAnimation) {
                        animBackup = that.options.animation;
                        that.options.animation = { expand: { effects: {} }, collapse: { hide: true, effects: {} } };
                    }

                    if (!that._triggerEvent(COLLAPSE, item)) {
                        that._toggleItem(item, true);
                    }

                    if (!useAnimation) {
                        that.options.animation = animBackup;
                    }
                }

            });

            return that;
        },

        _toggleDisabled: function (element, enable) {
            element = this.element.find(element);
            element
                .toggleClass(defaultState, enable)
                .toggleClass(DISABLEDCLASS, !enable)
                .attr(ARIA_DISABLED, !enable);
        },

        select: function (element) {
            var that = this;

            if (element === undefined) {
                return that.element.find(selectableItems).parent();
            }

            element = that.element.find(element);

            if (!element.length) {
                this._updateSelected(element);
            } else {
                element
                    .each(function () {
                        var item = $(this),
                            link = item.children(LINKSELECTOR);

                        if (item.hasClass(DISABLEDCLASS)) {
                            return that;
                        }

                        if (!that._triggerEvent(SELECT, item)) {
                            that._updateSelected(link);
                        }
                    });
            }

            return that;
        },

        clearSelection: function() {
            this.select($());
        },

        enable: function (element, state) {
            this._toggleDisabled(element, state !== false);

            return this;
        },

        disable: function (element) {
            this._toggleDisabled(element, false);

            return this;
        },

        append: function (item, referenceItem) {
            referenceItem = this.element.find(referenceItem);

            var inserted = this._insert(item, referenceItem, referenceItem.length ? referenceItem.find(GROUPS) : null);

            each(inserted.items, function () {
                inserted.group.append(this);
                updateFirstLast(this);
            });

            updateArrow(referenceItem);
            updateFirstLast(inserted.group.find(".k-first, .k-last"));
            inserted.group.height("auto");

            return this;
        },

        insertBefore: function (item, referenceItem) {
            referenceItem = this.element.find(referenceItem);

            var inserted = this._insert(item, referenceItem, referenceItem.parent());

            each(inserted.items, function () {
                referenceItem.before(this);
                updateFirstLast(this);
            });

            updateFirstLast(referenceItem);
            inserted.group.height("auto");

            return this;
        },

        insertAfter: function (item, referenceItem) {
            referenceItem = this.element.find(referenceItem);

            var inserted = this._insert(item, referenceItem, referenceItem.parent());

            each(inserted.items, function () {
                referenceItem.after(this);
                updateFirstLast(this);
            });

            updateFirstLast(referenceItem);
            inserted.group.height("auto");

            return this;
        },

        remove: function (element) {
            element = this.element.find(element);

            var that = this,
                parent = element.parentsUntil(that.element, ITEM),
                group = element.parent("ul");

            element.remove();

            if (group && !group.hasClass("k-panelbar") && !group.children(ITEM).length) {
                group.remove();
            }

            if (parent.length) {
                parent = parent.eq(0);

                updateArrow(parent);
                updateFirstLast(parent);
            }

            return that;
        },

        reload: function (element) {
            var that = this;
            element = that.element.find(element);

            element.each(function () {
                var item = $(this);

                that._ajaxRequest(item, item.children("." + CONTENT), !item.is(VISIBLE));
            });
        },

        _first: function() {
            return this.element.children(ACTIVEITEMSELECTOR).first();
        },

        _last: function() {
            var item = this.element.children(ACTIVEITEMSELECTOR).last(),
                group = item.children(VISIBLEGROUP);

            if (group[0]) {
                return group.children(ACTIVEITEMSELECTOR).last();
            }
            return item;
        },

        _current: function(candidate) {
            var that = this,
                focused = that._focused,
                id = that._itemId;

            if (candidate === undefined) {
                return focused;
            }

            that.element.removeAttr("aria-activedescendant");

            if (focused) {
                if (focused[0].id === id) {
                    focused.removeAttr("id");
                }

                focused
                    .children(LINKSELECTOR)
                    .removeClass(FOCUSEDCLASS);
            }

            if ($(candidate).length) {
                id = candidate[0].id || id;

                candidate.attr("id", id)
                         .children(LINKSELECTOR)
                         .addClass(FOCUSEDCLASS);

                that.element.attr("aria-activedescendant", id);
            }

            that._focused = candidate;
        },

        _keydown: function(e) {
            var that = this,
                key = e.keyCode,
                current = that._current();

            if (e.target != e.currentTarget) {
                return;
            }

            if (key == keys.DOWN || key == keys.RIGHT) {
                that._current(that._nextItem(current));
                e.preventDefault();
            } else if (key == keys.UP || key == keys.LEFT) {
                that._current(that._prevItem(current));
                e.preventDefault();
            } else if (key == keys.ENTER || key == keys.SPACEBAR) {
                that._click(current.children(LINKSELECTOR));
                e.preventDefault();
            } else if (key == keys.HOME) {
                that._current(that._first());
                e.preventDefault();
            } else if (key == keys.END) {
                that._current(that._last());
                e.preventDefault();
            }
        },

        _nextItem: function(item) {
            if (!item) {
                return this._first();
            }

            var group = item.children(VISIBLEGROUP),
                next = item.nextAll(":visible").first();

            if (group[0]) {
                next = group.children("." + FIRST);
            }

            if (!next[0]) {
                next = item.parent(VISIBLEGROUP).parent(ITEM).next();
            }

            if (!next[0]) {
                next = this._first();
            }

            if (next.hasClass(DISABLEDCLASS)) {
                next = this._nextItem(next);
            }

            return next;
        },

        _prevItem: function(item) {
            if (!item) {
                return this._last();
            }

            var prev = item.prevAll(":visible").first(),
                result;

            if (!prev[0]) {
                prev = item.parent(VISIBLEGROUP).parent(ITEM);
                if (!prev[0]) {
                    prev = this._last();
                }
            } else {
                result = prev;
                while (result[0]) {
                    result = result.children(VISIBLEGROUP).children("." + LAST);
                    if (result[0]) {
                        prev = result;
                    }
                }
            }

            if (prev.hasClass(DISABLEDCLASS)) {
                prev = this._prevItem(prev);
            }

            return prev;
        },

        _insert: function (item, referenceItem, parent) {
            var that = this,
                items,
                plain = $.isPlainObject(item),
                isReferenceItem = referenceItem && referenceItem[0],
                groupData;

            if (!isReferenceItem) {
                parent = that.element;
            }

            groupData = {
                firstLevel: parent.hasClass("k-panelbar"),
                expanded: parent.parent().hasClass(ACTIVECLASS),
                length: parent.children().length
            };

            if (isReferenceItem && !parent.length) {
                parent = $(PanelBar.renderGroup({ group: groupData })).appendTo(referenceItem);
            }

            if (item instanceof kendo.Observable) {
                item = item.toJSON();
            }

            if (plain || $.isArray(item)) { // is JSON
                items = $.map(plain ? [ item ] : item, function (value, idx) {
                            if (typeof value === "string") {
                                return $(value);
                            } else {
                                return $(PanelBar.renderItem({
                                    group: groupData,
                                    item: extend(value, { index: idx })
                                }));
                            }
                        });

                if (isReferenceItem) {
                    referenceItem.attr(ARIA_EXPANDED, false);
                }
            } else {
                if (typeof item == "string" && item.charAt(0) != "<") {
                    items = that.element.find(item);
                } else {
                    items = $(item);
                }
                that._updateItemsClasses(items);
            }

            return { items: items, group: parent };
        },

        _toggleHover: function(e) {
            var target = $(e.currentTarget);

            if (!target.parents("li." + DISABLEDCLASS).length) {
                target.toggleClass("k-state-hover", e.type == MOUSEENTER);
            }
        },

        _updateClasses: function() {
            var that = this,
                panels, items;

            panels = that.element
                         .find("li > ul")
                         .not(function () { return $(this).parentsUntil(".k-panelbar", "div").length; })
                         .addClass("k-group k-panel")
                         .attr("role", "group");

            panels.parent()
                  .attr(ARIA_EXPANDED, false)
                  .not("." + ACTIVECLASS)
                  .children("ul")
                  .attr(ARIA_HIDDEN, true)
                  .hide();

            items = that.element.add(panels).children();

            that._updateItemsClasses(items);
            updateArrow(items);
            updateFirstLast(items);
        },

        _updateItemsClasses: function(items) {
            var length = items.length,
                idx = 0;

            for(; idx < length; idx++) {
                this._updateItemClasses(items[idx], idx);
            }
        },

        _updateItemClasses: function(item, index) {
            var selected = this._selected,
                contentUrls = this.options.contentUrls,
                url = contentUrls && contentUrls[index],
                root = this.element[0],
                wrapElement, link;

            item = $(item).addClass("k-item").attr("role", "menuitem");

            if (kendo.support.browser.msie) {  // IE10 doesn't apply list-style: none on invisible items otherwise.
                item.css("list-style-position", "inside")
                    .css("list-style-position", "");
            }

            item
                .children(IMG)
                .addClass(IMAGE);

            link = item
                    .children("a")
                    .addClass(LINK);

            if (link[0]) {
                link.attr("href", url); //url can be undefined

                link.children(IMG)
                    .addClass(IMAGE);
            }

            item
                .filter(":not([disabled]):not([class*=k-state])")
                .addClass("k-state-default");

            item
                .filter("li[disabled]")
                .addClass("k-state-disabled")
                .attr(ARIA_DISABLED, true)
                .removeAttr("disabled");

            item
                .children("div")
                .addClass(CONTENT)
                .attr("role", "region")
                .attr(ARIA_HIDDEN, true)
                .hide()
                .parent()
                .attr(ARIA_EXPANDED, false);

            link = item.children(SELECTEDSELECTOR);
            if (link[0]) {
                if (selected) {
                    selected.removeAttr(ARIA_SELECTED)
                            .children(SELECTEDSELECTOR)
                            .removeClass(SELECTEDCLASS);
                }

                link.addClass(SELECTEDCLASS);
                this._selected = item.attr(ARIA_SELECTED, true);
            }

            if (!item.children(LINKSELECTOR)[0]) {
                wrapElement = "<span class='" + LINK + "'/>";
                if (contentUrls && contentUrls[index] && item[0].parentNode == root) {
                    wrapElement = '<a class="k-link k-header" href="' + contentUrls[index] + '"/>';
                }

                item
                    .contents()      // exclude groups, real links, templates and empty text nodes
                    .filter(function() { return (!this.nodeName.match(excludedNodesRegExp) && !(this.nodeType == 3 && !$.trim(this.nodeValue))); })
                    .wrapAll(wrapElement);
            }

            if (item.parent(".k-panelbar")[0]) {
                item
                    .children(LINKSELECTOR)
                    .addClass("k-header");
            }
        },

        _click: function (target) {
            var that = this,
                element = that.element,
                prevent, contents, href, isAnchor;

            if (target.parents("li." + DISABLEDCLASS).length) {
                return;
            }

            if (target.closest(".k-widget")[0] != element[0]) {
                return;
            }

            var link = target.closest(LINKSELECTOR),
                item = link.closest(ITEM);

            that._updateSelected(link);

            contents = item.find(GROUPS).add(item.find(CONTENTS));
            href = link.attr(HREF);
            isAnchor = href && (href.charAt(href.length - 1) == "#" || href.indexOf("#" + that.element[0].id + "-") != -1);
            prevent = !!(isAnchor || contents.length);

            if (contents.data("animating")) {
                return prevent;
            }

            if (that._triggerEvent(SELECT, item)) {
                prevent = true;
            }

            if (prevent === false) {
                return;
            }

            if (that.options.expandMode == SINGLE) {
                if (that._collapseAllExpanded(item)) {
                    return prevent;
                }
            }

            if (contents.length) {
                var visibility = contents.is(VISIBLE);

                if (!that._triggerEvent(!visibility ? EXPAND : COLLAPSE, item)) {
                    prevent = that._toggleItem(item, visibility);
                }
            }

            return prevent;
        },

        _toggleItem: function (element, isVisible) {
            var that = this,
                childGroup = element.find(GROUPS),
                link = element.find(LINKSELECTOR),
                url = link.attr(HREF),
                prevent, content;

            if (childGroup.length) {
                this._toggleGroup(childGroup, isVisible);
                prevent = true;
            } else {
                content = element.children("."  + CONTENT);

                if (content.length) {
                    prevent = true;

                    if (!content.is(EMPTY) || url === undefined) {
                        that._toggleGroup(content, isVisible);
                    } else {
                        that._ajaxRequest(element, content, isVisible);
                    }
                }
            }
            return prevent;
        },

        _toggleGroup: function (element, visibility) {
            var that = this,
                animationSettings = that.options.animation,
                animation = animationSettings.expand,
                collapse = extend({}, animationSettings.collapse),
                hasCollapseAnimation = collapse && "effects" in collapse;

            if (element.is(VISIBLE) != visibility) {
                return;
            }

            element
                .parent()
                .attr(ARIA_EXPANDED, !visibility)
                .attr(ARIA_HIDDEN, visibility)
                .toggleClass(ACTIVECLASS, !visibility)
                .find("> .k-link > .k-icon")
                    .toggleClass("k-i-arrow-n", !visibility)
                    .toggleClass("k-panelbar-collapse", !visibility)
                    .toggleClass("k-i-arrow-s", visibility)
                    .toggleClass("k-panelbar-expand", visibility);

            if (visibility) {
                animation = extend( hasCollapseAnimation ? collapse
                                    : extend({ reverse: true }, animation), { hide: true });
            } else {
                animation = extend( { complete: function (element) {
                    that._triggerEvent(ACTIVATE, element.closest(ITEM));
                } }, animation );
            }

            element
                .kendoStop(true, true)
                .kendoAnimate( animation );
        },

        _collapseAllExpanded: function (item) {
            var that = this, children, stopExpand = false;

            var groups = item.find(GROUPS).add(item.find(CONTENTS));

            if (groups.is(VISIBLE)) {
                stopExpand = true;
            }

            if (!(groups.is(VISIBLE) || groups.length === 0)) {
                children = item.siblings();
                children.find(GROUPS).add(children.find(CONTENTS))
                        .filter(function () { return $(this).is(VISIBLE); })
                        .each(function (index, content) {
                            content = $(content);

                            stopExpand = that._triggerEvent(COLLAPSE, content.closest(ITEM));
                            if (!stopExpand) {
                                that._toggleGroup(content, true);
                            }
                        });
            }

            return stopExpand;
        },

        _ajaxRequest: function (element, contentElement, isVisible) {

            var that = this,
                statusIcon = element.find(".k-panelbar-collapse, .k-panelbar-expand"),
                link = element.find(LINKSELECTOR),
                loadingIconTimeout = setTimeout(function () {
                    statusIcon.addClass("k-loading");
                }, 100),
                data = {},
                url = link.attr(HREF);

            $.ajax({
                type: "GET",
                cache: false,
                url: url,
                dataType: "html",
                data: data,

                error: function (xhr, status) {
                    statusIcon.removeClass("k-loading");
                    if (that.trigger(ERROR, { xhr: xhr, status: status })) {
                        this.complete();
                    }
                },

                complete: function () {
                    clearTimeout(loadingIconTimeout);
                    statusIcon.removeClass("k-loading");
                },

                success: function (data) {
                    function getElements(){
                        return { elements: contentElement.get() };
                    }
                    try {
                        that.angular("cleanup", getElements);
                        contentElement.html(data);
                        that.angular("compile", getElements);
                    } catch (e) {
                        var console = window.console;

                        if (console && console.error) {
                            console.error(e.name + ": " + e.message + " in " + url);
                        }
                        this.error(this.xhr, "error");
                    }

                    that._toggleGroup(contentElement, isVisible);

                    that.trigger(CONTENTLOAD, { item: element[0], contentElement: contentElement[0] });
                }
            });
        },

        _triggerEvent: function (eventName, element) {
            var that = this;

            return that.trigger(eventName, { item: element[0] });
        },

        _updateSelected: function(link) {
            var that = this,
                element = that.element,
                item = link.parent(ITEM),
                selected = that._selected;

            if (selected) {
                selected.removeAttr(ARIA_SELECTED);
            }

            that._selected = item.attr(ARIA_SELECTED, true);

            element.find(selectableItems).removeClass(SELECTEDCLASS);
            element.find("> ." + HIGHLIGHTCLASS + ", .k-panel > ." + HIGHLIGHTCLASS).removeClass(HIGHLIGHTCLASS);

            link.addClass(SELECTEDCLASS);
            link.parentsUntil(element, ITEM).filter(":has(.k-header)").addClass(HIGHLIGHTCLASS);
            that._current(item[0] ? item : null);
        },

        _animations: function(options) {
            if (options && ("animation" in options) && !options.animation) {
                options.animation = { expand: { effects: {} }, collapse: { hide: true, effects: {} } };
            }
        }

    });

    // client-side rendering
    extend(PanelBar, {
        renderItem: function (options) {
            options = extend({ panelBar: {}, group: {} }, options);

            var empty = templates.empty,
                item = options.item;

            return templates.item(extend(options, {
                image: item.imageUrl ? templates.image : empty,
                sprite: item.spriteCssClass ? templates.sprite : empty,
                itemWrapper: templates.itemWrapper,
                renderContent: PanelBar.renderContent,
                arrow: item.items || item.content || item.contentUrl ? templates.arrow : empty,
                subGroup: PanelBar.renderGroup
            }, rendering));
        },

        renderGroup: function (options) {
            return templates.group(extend({
                renderItems: function(options) {
                    var html = "",
                        i = 0,
                        items = options.items,
                        len = items ? items.length : 0,
                        group = extend({ length: len }, options.group);

                    for (; i < len; i++) {
                        html += PanelBar.renderItem(extend(options, {
                            group: group,
                            item: extend({ index: i }, items[i])
                        }));
                    }

                    return html;
                }
            }, options, rendering));
        },

        renderContent: function (options) {
            return templates.content(extend(options, rendering));
        }
    });

    kendo.ui.plugin(PanelBar);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.popup" ], f);
})(function(){

var __meta__ = {
    id: "timepicker",
    name: "TimePicker",
    category: "web",
    description: "The TimePicker widget allows the end user to select a value from a list of predefined values or to type a new value.",
    depends: [ "popup" ]
};

(function($, undefined) {
    var kendo = window.kendo,
        keys = kendo.keys,
        parse = kendo.parseDate,
        activeElement = kendo._activeElement,
        extractFormat = kendo._extractFormat,
        support = kendo.support,
        browser = support.browser,
        ui = kendo.ui,
        Widget = ui.Widget,
        OPEN = "open",
        CLOSE = "close",
        CHANGE = "change",
        ns = ".kendoTimePicker",
        CLICK = "click" + ns,
        DEFAULT = "k-state-default",
        DISABLED = "disabled",
        READONLY = "readonly",
        LI = "li",
        SPAN = "<span/>",
        FOCUSED = "k-state-focused",
        HOVER = "k-state-hover",
        HOVEREVENTS = "mouseenter" + ns + " mouseleave" + ns,
        MOUSEDOWN = "mousedown" + ns,
        MS_PER_MINUTE = 60000,
        MS_PER_DAY = 86400000,
        SELECTED = "k-state-selected",
        STATEDISABLED = "k-state-disabled",
        ARIA_SELECTED = "aria-selected",
        ARIA_EXPANDED = "aria-expanded",
        ARIA_HIDDEN = "aria-hidden",
        ARIA_DISABLED = "aria-disabled",
        ARIA_READONLY = "aria-readonly",
        ARIA_ACTIVEDESCENDANT = "aria-activedescendant",
        ID = "id",
        isArray = $.isArray,
        extend = $.extend,
        proxy = $.proxy,
        DATE = Date,
        TODAY = new DATE();

    TODAY = new DATE(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 0, 0, 0);

    var TimeView = function(options) {
        var that = this,
            id = options.id;

        that.options = options;

        that.ul = $('<ul tabindex="-1" role="listbox" aria-hidden="true" unselectable="on" class="k-list k-reset"/>')
                    .css({ overflow: support.kineticScrollNeeded ? "": "auto" })
                    .on(CLICK, LI, proxy(that._click, that))
                    .on("mouseenter" + ns, LI, function() { $(this).addClass(HOVER); })
                    .on("mouseleave" + ns, LI, function() { $(this).removeClass(HOVER); });

        that.list = $("<div class='k-list-container'/>")
                    .append(that.ul)
                    .on(MOUSEDOWN, preventDefault);

        if (id) {
            that._timeViewID = id + "_timeview";
            that._optionID = id + "_option_selected";

            that.ul.attr(ID, that._timeViewID);
        }

        that._popup();
        that._heightHandler = proxy(that._height, that);

        that.template = kendo.template('<li tabindex="-1" role="option" class="k-item" unselectable="on">#=data#</li>', { useWithBlock: false });
    };

    TimeView.prototype = {
        current: function(candidate) {
            var that = this,
                active = that.options.active;

            if (candidate !== undefined) {
                if (that._current) {
                    that._current
                        .removeClass(SELECTED)
                        .removeAttr(ARIA_SELECTED)
                        .removeAttr(ID);
                }

                if (candidate) {
                    candidate = $(candidate).addClass(SELECTED)
                                            .attr(ID, that._optionID)
                                            .attr(ARIA_SELECTED, true);

                    that.scroll(candidate[0]);
                }

                that._current = candidate;

                if (active) {
                    active(candidate);
                }
            } else {
                return that._current;
            }
        },

        close: function() {
            this.popup.close();
        },

        destroy: function() {
            var that = this;

            that.ul.off(ns);
            that.list.off(ns);

            if (that._touchScroller) {
                that._touchScroller.destroy();
            }

            that.popup.destroy();
        },

        open: function() {
            var that = this;

            if (!that.ul[0].firstChild) {
                that.bind();
            }

            that.popup.open();
            if (that._current) {
                that.scroll(that._current[0]);
            }
        },

        dataBind: function(dates) {
            var that = this,
                options = that.options,
                format = options.format,
                toString = kendo.toString,
                template = that.template,
                length = dates.length,
                idx = 0,
                date,
                html = "";

            for (; idx < length; idx++) {
                date = dates[idx];

                if (isInRange(date, options.min, options.max)) {
                    html += template(toString(date, format, options.culture));
                }
            }

            that._html(html);
        },

        refresh: function() {
            var that = this,
                options = that.options,
                format = options.format,
                offset = dst(),
                ignoreDST = offset < 0,
                min = options.min,
                max = options.max,
                msMin = getMilliseconds(min),
                msMax = getMilliseconds(max),
                msInterval = options.interval * MS_PER_MINUTE,
                toString = kendo.toString,
                template = that.template,
                start = new DATE(+min),
                startDay = start.getDate(),
                msStart, lastIdx,
                idx = 0, length,
                html = "";

            if (ignoreDST) {
                length = (MS_PER_DAY + (offset * MS_PER_MINUTE)) / msInterval;
            } else {
                length = MS_PER_DAY / msInterval;
            }


            if (msMin != msMax) {
                if (msMin > msMax) {
                    msMax += MS_PER_DAY;
                }

                length = ((msMax - msMin) / msInterval) + 1;
            }

            lastIdx = parseInt(length, 10);

            for (; idx < length; idx++) {
                if (idx) {
                    setTime(start, msInterval, ignoreDST);
                }

                if (msMax && lastIdx == idx) {
                    msStart = getMilliseconds(start);
                    if (startDay < start.getDate()) {
                        msStart += MS_PER_DAY;
                    }

                    if (msStart > msMax) {
                        start = new DATE(+max);
                    }
                }

                html += template(toString(start, format, options.culture));
            }

            that._html(html);
        },

        bind: function() {
            var that = this,
                dates = that.options.dates;

            if (dates && dates[0]) {
                that.dataBind(dates);
            } else {
                that.refresh();
            }
        },

        _html: function(html) {
            var that = this;

            that.ul[0].innerHTML = html;

            that.popup.unbind(OPEN, that._heightHandler);
            that.popup.one(OPEN, that._heightHandler);

            that.current(null);
            that.select(that._value);
        },

        scroll: function(item) {
            if (!item) {
                return;
            }

            var ul = this.ul[0],
                itemOffsetTop = item.offsetTop,
                itemOffsetHeight = item.offsetHeight,
                ulScrollTop = ul.scrollTop,
                ulOffsetHeight = ul.clientHeight,
                bottomDistance = itemOffsetTop + itemOffsetHeight,
                touchScroller = this._touchScroller,
                elementHeight;

            if (touchScroller) {
                elementHeight = this.list.height();

                if (itemOffsetTop > elementHeight) {
                    itemOffsetTop = itemOffsetTop - elementHeight + itemOffsetHeight;
                }

                touchScroller.scrollTo(0, -itemOffsetTop);
            } else {
                ul.scrollTop = ulScrollTop > itemOffsetTop ?
                               itemOffsetTop : bottomDistance > (ulScrollTop + ulOffsetHeight) ?
                               bottomDistance - ulOffsetHeight : ulScrollTop;
            }
        },

        select: function(li) {
            var that = this,
                options = that.options,
                current = that._current;

            if (li instanceof Date) {
                li = kendo.toString(li, options.format, options.culture);
            }

            if (typeof li === "string") {
                if (!current || current.text() !== li) {
                    li = $.grep(that.ul[0].childNodes, function(node) {
                        return (node.textContent || node.innerText) == li;
                    });

                    li = li[0] ? li : null;
                } else {
                    li = current;
                }
            }

            that.current(li);
        },

        setOptions: function(options) {
            var old = this.options;

            options.min = parse(options.min);
            options.max = parse(options.max);

            this.options = extend(old, options, {
                active: old.active,
                change: old.change,
                close: old.close,
                open: old.open
            });

            this.bind();
        },

        toggle: function() {
            var that = this;

            if (that.popup.visible()) {
                that.close();
            } else {
                that.open();
            }
        },

        value: function(value) {
            var that = this;

            that._value = value;
            if (that.ul[0].firstChild) {
                that.select(value);
            }
        },

        _click: function(e) {
            var that = this,
                li = $(e.currentTarget),
                date = li.text(),
                dates = that.options.dates;

            if (dates && dates.length > 0) {
                date = dates[li.index()];
            }

            if (!e.isDefaultPrevented()) {
                that.select(li);
                that.options.change(date, true);
                that.close();
            }
        },

        _height: function() {
            var that = this;
            var list = that.list;
            var parent = list.parent(".k-animation-container");
            var height = that.options.height;

            if (that.ul[0].children.length) {
                list.add(parent)
                    .show()
                    .height(that.ul[0].scrollHeight > height ? height : "auto")
                    .hide();
            }
        },

        _parse: function(value) {
            var that = this,
                options = that.options,
                current = that._value || TODAY;

            if (value instanceof DATE) {
                return value;
            }

            value = parse(value, options.parseFormats, options.culture);

            if (value) {
                value = new DATE(current.getFullYear(),
                                 current.getMonth(),
                                 current.getDate(),
                                 value.getHours(),
                                 value.getMinutes(),
                                 value.getSeconds(),
                                 value.getMilliseconds());
            }

            return value;
        },

        _adjustListWidth: function() {
            var list = this.list,
                width = list[0].style.width,
                wrapper = this.options.anchor,
                computedStyle, computedWidth;

            if (!list.data("width") && width) {
                return;
            }

            computedStyle = window.getComputedStyle ? window.getComputedStyle(wrapper[0], null) : 0;
            computedWidth = computedStyle ? parseFloat(computedStyle.width) : wrapper.outerWidth();

            if (computedStyle && (browser.mozilla || browser.msie)) { // getComputedStyle returns different box in FF and IE.
                computedWidth += parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight) + parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
            }

            width = computedWidth - (list.outerWidth() - list.width());

            list.css({
                fontFamily: wrapper.css("font-family"),
                width: width
            })
            .data("width", width);
        },

        _popup: function() {
            var that = this,
                list = that.list,
                options = that.options,
                anchor = options.anchor;

            that.popup = new ui.Popup(list, extend(options.popup, {
                anchor: anchor,
                open: options.open,
                close: options.close,
                animation: options.animation,
                isRtl: support.isRtl(options.anchor)
            }));

            that._touchScroller = kendo.touchScroller(that.popup.element);
        },

        move: function(e) {
            var that = this,
                key = e.keyCode,
                ul = that.ul[0],
                current = that._current,
                down = key === keys.DOWN;

            if (key === keys.UP || down) {
                if (e.altKey) {
                    that.toggle(down);
                    return;
                } else if (down) {
                    current = current ? current[0].nextSibling : ul.firstChild;
                } else {
                    current = current ? current[0].previousSibling : ul.lastChild;
                }

                if (current) {
                    that.select(current);
                }

                that.options.change(that._current.text());
                e.preventDefault();

            } else if (key === keys.ENTER || key === keys.TAB || key === keys.ESC) {
                e.preventDefault();
                if (current) {
                    that.options.change(current.text(), true);
                }
                that.close();
            }
        }
    };

    function setTime(date, time, ignoreDST) {
        var offset = date.getTimezoneOffset(),
            offsetDiff;

        date.setTime(date.getTime() + time);

        if (!ignoreDST) {
            offsetDiff = date.getTimezoneOffset() - offset;
            date.setTime(date.getTime() + offsetDiff * MS_PER_MINUTE);
        }
    }

    function dst() {
        var today = new DATE(),
            midnight = new DATE(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
            noon = new DATE(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);

        return -1 * (midnight.getTimezoneOffset() - noon.getTimezoneOffset());
    }

    function getMilliseconds(date) {
        return date.getHours() * 60 * MS_PER_MINUTE + date.getMinutes() * MS_PER_MINUTE + date.getSeconds() * 1000 + date.getMilliseconds();
    }

    function isInRange(value, min, max) {
        var msMin = getMilliseconds(min),
            msMax = getMilliseconds(max),
            msValue;

        if (!value || msMin == msMax) {
            return true;
        }

        msValue = getMilliseconds(value);

        if (msMin > msValue) {
            msValue += MS_PER_DAY;
        }

        if (msMax < msMin) {
            msMax += MS_PER_DAY;
        }

        return msValue >= msMin && msValue <= msMax;
    }

    TimeView.getMilliseconds = getMilliseconds;

    kendo.TimeView = TimeView;

    var TimePicker = Widget.extend({
        init: function(element, options) {
            var that = this, ul, timeView, disabled;

            Widget.fn.init.call(that, element, options);

            element = that.element;
            options = that.options;

            options.min = parse(element.attr("min")) || parse(options.min);
            options.max = parse(element.attr("max")) || parse(options.max);

            normalize(options);

            that._initialOptions = extend({}, options);

            that._wrapper();

            that.timeView = timeView = new TimeView(extend({}, options, {
                id: element.attr(ID),
                anchor: that.wrapper,
                format: options.format,
                change: function(value, trigger) {
                    if (trigger) {
                        that._change(value);
                    } else {
                        element.val(value);
                    }
                },
                open: function(e) {
                    that.timeView._adjustListWidth();

                    if (that.trigger(OPEN)) {
                        e.preventDefault();
                    } else {
                        element.attr(ARIA_EXPANDED, true);
                        ul.attr(ARIA_HIDDEN, false);
                    }
                },
                close: function(e) {
                    if (that.trigger(CLOSE)) {
                        e.preventDefault();
                    } else {
                        element.attr(ARIA_EXPANDED, false);
                        ul.attr(ARIA_HIDDEN, true);
                    }
                },
                active: function(current) {
                    element.removeAttr(ARIA_ACTIVEDESCENDANT);
                    if (current) {
                        element.attr(ARIA_ACTIVEDESCENDANT, timeView._optionID);
                    }
                }
            }));
            ul = timeView.ul;

            that._icon();
            that._reset();

            try {
                element[0].setAttribute("type", "text");
            } catch(e) {
                element[0].type = "text";
            }

            element.addClass("k-input")
                   .attr({
                        "role": "combobox",
                        "aria-expanded": false,
                        "aria-owns": timeView._timeViewID
                   });

            disabled = element.is("[disabled]") || $(that.element).parents("fieldset").is(':disabled');
            if (disabled) {
                that.enable(false);
            } else {
                that.readonly(element.is("[readonly]"));
            }

            that._old = that._update(options.value || that.element.val());
            that._oldText = element.val();

            kendo.notify(that);
        },

        options: {
            name: "TimePicker",
            min: TODAY,
            max: TODAY,
            format: "",
            dates: [],
            parseFormats: [],
            value: null,
            interval: 30,
            height: 200,
            animation: {}
        },

        events: [
         OPEN,
         CLOSE,
         CHANGE
        ],

        setOptions: function(options) {
            var that = this;
            var value = that._value;

            Widget.fn.setOptions.call(that, options);
            options = that.options;

            normalize(options);

            that.timeView.setOptions(options);

            if (value) {
                that.element.val(kendo.toString(value, options.format, options.culture));
            }
        },

        dataBind: function(dates) {
            if (isArray(dates)) {
                this.timeView.dataBind(dates);
            }
        },

        _editable: function(options) {
            var that = this,
                disable = options.disable,
                readonly = options.readonly,
                arrow = that._arrow.off(ns),
                element = that.element.off(ns),
                wrapper = that._inputWrapper.off(ns);

            if (!readonly && !disable) {
                wrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover);

                element.removeAttr(DISABLED)
                       .removeAttr(READONLY)
                       .attr(ARIA_DISABLED, false)
                       .attr(ARIA_READONLY, false)
                       .on("keydown" + ns, proxy(that._keydown, that))
                       .on("focusout" + ns, proxy(that._blur, that))
                       .on("focus" + ns, function() {
                           that._inputWrapper.addClass(FOCUSED);
                       });

               arrow.on(CLICK, proxy(that._click, that))
                   .on(MOUSEDOWN, preventDefault);
            } else {
                wrapper
                    .addClass(disable ? STATEDISABLED : DEFAULT)
                    .removeClass(disable ? DEFAULT : STATEDISABLED);

                element.attr(DISABLED, disable)
                       .attr(READONLY, readonly)
                       .attr(ARIA_DISABLED, disable)
                       .attr(ARIA_READONLY, readonly);
            }
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);

            that.timeView.destroy();

            that.element.off(ns);
            that._arrow.off(ns);
            that._inputWrapper.off(ns);

            if (that._form) {
                that._form.off("reset", that._resetHandler);
            }
        },

        close: function() {
            this.timeView.close();
        },

        open: function() {
            this.timeView.open();
        },

        min: function (value) {
            return this._option("min", value);
        },

        max: function (value) {
            return this._option("max", value);
        },

        value: function(value) {
            var that = this;

            if (value === undefined) {
                return that._value;
            }

            that._old = that._update(value);

            if (that._old === null) {
                that.element.val("");
            }

            that._oldText = that.element.val();
        },

        _blur: function() {
            var that = this,
                value = that.element.val();

            that.close();
            if (value !== that._oldText) {
                that._change(value);
            }
            that._inputWrapper.removeClass(FOCUSED);
        },

        _click: function() {
            var that = this,
                element = that.element;

            that.timeView.toggle();

            if (!support.touch && element[0] !== activeElement()) {
                element.focus();
            }
        },

        _change: function(value) {
            var that = this;

            value = that._update(value);

            if (+that._old != +value) {
                that._old = value;
                that._oldText = that.element.val();

                if (!that._typing) {
                    // trigger the DOM change event so any subscriber gets notified
                    that.element.trigger(CHANGE);
                }

                that.trigger(CHANGE);
            }

            that._typing = false;
        },

        _icon: function() {
            var that = this,
                element = that.element,
                arrow;

            arrow = element.next("span.k-select");

            if (!arrow[0]) {
                arrow = $('<span unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-clock">select</span></span>').insertAfter(element);
            }

            that._arrow = arrow.attr({
                "role": "button",
                "aria-controls": that.timeView._timeViewID
            });
        },

        _keydown: function(e) {
            var that = this,
                key = e.keyCode,
                timeView = that.timeView,
                value = that.element.val();

            if (timeView.popup.visible() || e.altKey) {
                timeView.move(e);
            } else if (key === keys.ENTER && value !== that._oldText) {
                that._change(value);
            } else {
                that._typing = true;
            }
        },

        _option: function(option, value) {
            var that = this,
                options = that.options;

            if (value === undefined) {
                return options[option];
            }

            value = that.timeView._parse(value);

            if (!value) {
                return;
            }

            value = new DATE(+value);

            options[option] = value;
            that.timeView.options[option] = value;
            that.timeView.bind();
        },

        _toggleHover: function(e) {
            $(e.currentTarget).toggleClass(HOVER, e.type === "mouseenter");
        },

        _update: function(value) {
            var that = this,
                options = that.options,
                timeView = that.timeView,
                date = timeView._parse(value);

            if (!isInRange(date, options.min, options.max)) {
                date = null;
            }

            that._value = date;
            that.element.val(date ? kendo.toString(date, options.format, options.culture) : value);
            timeView.value(date);

            return date;
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                wrapper;

            wrapper = element.parents(".k-timepicker");

            if (!wrapper[0]) {
                wrapper = element.wrap(SPAN).parent().addClass("k-picker-wrap k-state-default");
                wrapper = wrapper.wrap(SPAN).parent();
            }

            wrapper[0].style.cssText = element[0].style.cssText;
            that.wrapper = wrapper.addClass("k-widget k-timepicker k-header")
                                  .addClass(element[0].className);

            element.css({
                width: "100%",
                height: element[0].style.height
            });

            that._inputWrapper = $(wrapper[0].firstChild);
        },

        _reset: function() {
            var that = this,
                element = that.element,
                formId = element.attr("form"),
                form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    that.value(element[0].defaultValue);
                    that.max(that._initialOptions.max);
                    that.min(that._initialOptions.min);
                };

                that._form = form.on("reset", that._resetHandler);
            }
        }
    });

    function normalize(options) {
        var parseFormats = options.parseFormats;

        options.format = extractFormat(options.format || kendo.getCulture(options.culture).calendars.standard.patterns.t);

        parseFormats = isArray(parseFormats) ? parseFormats : [parseFormats];
        parseFormats.splice(0, 0, options.format);
        options.parseFormats = parseFormats;
    }

    function preventDefault(e) {
        e.preventDefault();
    }

    ui.plugin(TimePicker);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.datepicker", "./kendo.timepicker" ], f);
})(function(){

var __meta__ = {
    id: "datetimepicker",
    name: "DateTimePicker",
    category: "web",
    description: "The DateTimePicker allows the end user to select a value from a calendar or a time drop-down list.",
    depends: [ "datepicker", "timepicker" ]
};

(function($, undefined) {

    var kendo = window.kendo,
        TimeView = kendo.TimeView,
        parse = kendo.parseDate,
        activeElement = kendo._activeElement,
        extractFormat = kendo._extractFormat,
        calendar = kendo.calendar,
        isInRange = calendar.isInRange,
        restrictValue = calendar.restrictValue,
        isEqualDatePart = calendar.isEqualDatePart,
        getMilliseconds = TimeView.getMilliseconds,
        ui = kendo.ui,
        Widget = ui.Widget,
        OPEN = "open",
        CLOSE = "close",
        CHANGE = "change",
        ns = ".kendoDateTimePicker",
        CLICK = "click" + ns,
        DISABLED = "disabled",
        READONLY = "readonly",
        DEFAULT = "k-state-default",
        FOCUSED = "k-state-focused",
        HOVER = "k-state-hover",
        STATEDISABLED = "k-state-disabled",
        HOVEREVENTS = "mouseenter" + ns + " mouseleave" + ns,
        MOUSEDOWN = "mousedown" + ns,
        MONTH = "month",
        SPAN = "<span/>",
        ARIA_ACTIVEDESCENDANT = "aria-activedescendant",
        ARIA_EXPANDED = "aria-expanded",
        ARIA_HIDDEN = "aria-hidden",
        ARIA_OWNS = "aria-owns",
        ARIA_DISABLED = "aria-disabled",
        ARIA_READONLY = "aria-readonly",
        DATE = Date,
        MIN = new DATE(1800, 0, 1),
        MAX = new DATE(2099, 11, 31),
        dateViewParams = { view: "date" },
        timeViewParams = { view: "time" },
        extend = $.extend;

    var DateTimePicker = Widget.extend({
        init: function(element, options) {
            var that = this, disabled;

            Widget.fn.init.call(that, element, options);

            element = that.element;
            options = that.options;

            options.min = parse(element.attr("min")) || parse(options.min);
            options.max = parse(element.attr("max")) || parse(options.max);

            normalize(options);

            that._initialOptions = extend({}, options);

            that._wrapper();

            that._views();

            that._icons();

            that._reset();
            that._template();

            try {
                element[0].setAttribute("type", "text");
            } catch(e) {
                element[0].type = "text";
            }

            element.addClass("k-input")
                   .attr({
                       "role": "combobox",
                       "aria-expanded": false
                   });


            that._midnight = that._calculateMidnight(options.min, options.max);

            disabled = element.is("[disabled]") || $(that.element).parents("fieldset").is(':disabled');
            if (disabled) {
                that.enable(false);
            } else {
                that.readonly(element.is("[readonly]"));
            }

            that._old = that._update(options.value || that.element.val());
            that._oldText = element.val();

            kendo.notify(that);
        },

        options: {
            name: "DateTimePicker",
            value: null,
            format: "",
            timeFormat: "",
            culture: "",
            parseFormats: [],
            dates: [],
            min: new DATE(MIN),
            max: new DATE(MAX),
            interval: 30,
            height: 200,
            footer: "",
            start: MONTH,
            depth: MONTH,
            animation: {},
            month : {},
            ARIATemplate: 'Current focused date is #=kendo.toString(data.current, "d")#'
    },

    events: [
        OPEN,
        CLOSE,
        CHANGE
    ],

        setOptions: function(options) {
            var that = this,
                value = that._value,
                dateViewOptions = that.dateView.options,
                timeViewOptions = that.timeView.options,
                min, max, currentValue;

            Widget.fn.setOptions.call(that, options);

            options = that.options;

            options.min = min = parse(options.min);
            options.max = max = parse(options.max);

            normalize(options);

            that._midnight = that._calculateMidnight(options.min, options.max);

            currentValue = options.value || that._value || that.dateView._current;

            if (min && !isEqualDatePart(min, currentValue)) {
                min = new DATE(MIN);
            }

            if (max && !isEqualDatePart(max, currentValue)) {
                max = new DATE(MAX);
            }

            that.dateView.setOptions(options);

            that.timeView.setOptions(extend({}, options, {
                format: options.timeFormat,
                min: min,
                max: max
            }));

            if (value) {
                that.element.val(kendo.toString(value, options.format, options.culture));
                that._updateARIA(value);
            }
        },

        _editable: function(options) {
            var that = this,
                element = that.element.off(ns),
                dateIcon = that._dateIcon.off(ns),
                timeIcon = that._timeIcon.off(ns),
                wrapper = that._inputWrapper.off(ns),
                readonly = options.readonly,
                disable = options.disable;

            if (!readonly && !disable) {
                wrapper
                    .addClass(DEFAULT)
                    .removeClass(STATEDISABLED)
                    .on(HOVEREVENTS, that._toggleHover);

                element.removeAttr(DISABLED)
                       .removeAttr(READONLY)
                       .attr(ARIA_DISABLED, false)
                       .attr(ARIA_READONLY, false)
                       .on("keydown" + ns, $.proxy(that._keydown, that))
                       .on("focus" + ns, function() {
                           that._inputWrapper.addClass(FOCUSED);
                       })
                       .on("focusout" + ns, function() {
                           that._inputWrapper.removeClass(FOCUSED);
                           if (element.val() !== that._oldText) {
                               that._change(element.val());
                           }
                           that.close("date");
                           that.close("time");
                       });

               dateIcon.on(MOUSEDOWN, preventDefault)
                        .on(CLICK, function() {
                            that.toggle("date");

                            if (!kendo.support.touch && element[0] !== activeElement()) {
                                element.focus();
                            }
                        });


               timeIcon.on(MOUSEDOWN, preventDefault)
                        .on(CLICK, function() {
                            that.toggle("time");

                            if (!kendo.support.touch && element[0] !== activeElement()) {
                                element.focus();
                            }
                        });

            } else {
                wrapper
                    .addClass(disable ? STATEDISABLED : DEFAULT)
                    .removeClass(disable ? DEFAULT : STATEDISABLED);

                element.attr(DISABLED, disable)
                       .attr(READONLY, readonly)
                       .attr(ARIA_DISABLED, disable)
                       .attr(ARIA_READONLY, readonly);
            }
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);
            that.dateView.destroy();
            that.timeView.destroy();

            that.element.off(ns);
            that._dateIcon.off(ns);
            that._timeIcon.off(ns);
            that._inputWrapper.off(ns);

            if (that._form) {
                that._form.off("reset", that._resetHandler);
            }
        },

        close: function(view) {
            if (view !== "time") {
                view = "date";
            }

            this[view + "View"].close();
        },

        open: function(view) {
            if (view !== "time") {
                view = "date";
            }

            this[view + "View"].open();
        },

        min: function(value) {
            return this._option("min", value);
        },

        max: function(value) {
            return this._option("max", value);
        },

        toggle: function(view) {
            var secondView = "timeView";

            if (view !== "time") {
                view = "date";
            } else {
                secondView = "dateView";
            }

            this[view + "View"].toggle();
            this[secondView].close();
        },

        value: function(value) {
            var that = this;

            if (value === undefined) {
                return that._value;
            }

            that._old = that._update(value);
            if (that._old === null) {
                that.element.val("");
            }

            that._oldText = that.element.val();
        },

        _change: function(value) {
            var that = this;

            value = that._update(value);

            if (+that._old != +value) {
                that._old = value;
                that._oldText = that.element.val();

                that.trigger(CHANGE);

                if (!that._typing) {
                    // trigger the DOM change event so any subscriber gets notified
                    that.element.trigger(CHANGE);
                }
            }
        },

        _option: function(option, value) {
            var that = this;
            var options = that.options;
            var timeView = that.timeView;
            var timeViewOptions = timeView.options;
            var current = that._value || that._old;
            var minDateEqual;
            var maxDateEqual;

            if (value === undefined) {
                return options[option];
            }

            value = parse(value, options.parseFormats, options.culture);

            if (!value) {
                return;
            }

            if (options.min.getTime() === options.max.getTime()) {
                timeViewOptions.dates = [];
            }

            options[option] = new DATE(value.getTime());
            that.dateView[option](value);

            that._midnight = that._calculateMidnight(options.min, options.max);

            if (current) {
                minDateEqual = isEqualDatePart(options.min, current);
                maxDateEqual = isEqualDatePart(options.max, current);
            }

            if (minDateEqual || maxDateEqual) {
                timeViewOptions[option] = value;

                if (minDateEqual && !maxDateEqual) {
                    timeViewOptions.max = lastTimeOption(options.interval);
                }

                if (maxDateEqual) {
                    if (that._midnight) {
                        timeView.dataBind([MAX]);
                        return;
                    } else if (!minDateEqual) {
                        timeViewOptions.min = MIN;
                    }
                }
            } else {
                timeViewOptions.max = MAX;
                timeViewOptions.min = MIN;
            }

            timeView.bind();
        },

        _toggleHover: function(e) {
            $(e.currentTarget).toggleClass(HOVER, e.type === "mouseenter");
        },

        _update: function(value) {
            var that = this,
                options = that.options,
                min = options.min,
                max = options.max,
                dates = options.dates,
                timeView = that.timeView,
                current = that._value,
                date = parse(value, options.parseFormats, options.culture),
                isSameType = (date === null && current === null) || (date instanceof Date && current instanceof Date),
                rebind, timeViewOptions, old, skip, formattedValue;

            if (+date === +current && isSameType) {
                formattedValue = kendo.toString(date, options.format, options.culture);

                if (formattedValue !== value) {
                    that.element.val(date === null ? value : formattedValue);
                }

                return date;
            }

            if (date !== null && isEqualDatePart(date, min)) {
                date = restrictValue(date, min, max);
            } else if (!isInRange(date, min, max)) {
                date = null;
            }

            that._value = date;
            timeView.value(date);
            that.dateView.value(date);

            if (date) {
                old = that._old;
                timeViewOptions = timeView.options;

                if (dates[0]) {
                    dates = $.grep(dates, function(d) { return isEqualDatePart(date, d); });

                    if (dates[0]) {
                        timeView.dataBind(dates);
                        skip = true;
                    }
                }

                if (!skip) {
                    if (isEqualDatePart(date, min)) {
                        timeViewOptions.min = min;
                        timeViewOptions.max = lastTimeOption(options.interval);
                        rebind = true;
                    }

                    if (isEqualDatePart(date, max)) {
                        if (that._midnight) {
                            timeView.dataBind([MAX]);
                            skip = true;
                        } else {
                            timeViewOptions.max = max;
                            if (!rebind) {
                                timeViewOptions.min = MIN;
                            }
                            rebind = true;
                        }
                    }
                }

                if (!skip && ((!old && rebind) || (old && !isEqualDatePart(old, date)))) {
                    if (!rebind) {
                        timeViewOptions.max = MAX;
                        timeViewOptions.min = MIN;
                    }

                    timeView.bind();
                }
            }

            that.element.val(date ? kendo.toString(date, options.format, options.culture) : value);
            that._updateARIA(date);

            return date;
        },

        _keydown: function(e) {
            var that = this,
                dateView = that.dateView,
                timeView = that.timeView,
                value = that.element.val(),
                isDateViewVisible = dateView.popup.visible();

            if (e.altKey && e.keyCode === kendo.keys.DOWN) {
                that.toggle(isDateViewVisible ? "time" : "date");
            } else if (isDateViewVisible) {
                dateView.move(e);
                that._updateARIA(dateView._current);
            } else if (timeView.popup.visible()) {
                timeView.move(e);
            } else if (e.keyCode === kendo.keys.ENTER && value !== that._oldText) {
                that._change(value);
            } else {
                that._typing = true;
            }
        },

        _views: function() {
            var that = this,
                element = that.element,
                options = that.options,
                id = element.attr("id"),
                dateView, timeView,
                div, ul, msMin,
                date;

            that.dateView = dateView = new kendo.DateView(extend({}, options, {
                id: id,
                anchor: that.wrapper,
                change: function() {
                    var value = dateView.calendar.value(),
                        msValue = +value,
                        msMin = +options.min,
                        msMax = +options.max,
                        current;

                    if (msValue === msMin || msValue === msMax) {
                        current = new DATE(+that._value);
                        current.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());

                        if (isInRange(current, msMin, msMax)) {
                            value = current;
                        }
                    }

                    that._change(value);
                    that.close("date");
                },
                close: function(e) {
                    if (that.trigger(CLOSE, dateViewParams)) {
                        e.preventDefault();
                    } else {
                        element.attr(ARIA_EXPANDED, false);
                        div.attr(ARIA_HIDDEN, true);

                        if (!timeView.popup.visible()) {
                            element.removeAttr(ARIA_OWNS);
                        }
                    }
                },
                open:  function(e) {
                    if (that.trigger(OPEN, dateViewParams)) {
                        e.preventDefault();
                    } else {

                        if (element.val() !== that._oldText) {
                            date = parse(element.val(), options.parseFormats, options.culture);

                            that.dateView[date ? "current" : "value"](date);
                        }

                        div.attr(ARIA_HIDDEN, false);
                        element.attr(ARIA_EXPANDED, true)
                               .attr(ARIA_OWNS, dateView._dateViewID);

                        that._updateARIA(date);
                    }
                }
            }));
            div = dateView.div;

            msMin = options.min.getTime();
            that.timeView = timeView = new TimeView({
                id: id,
                value: options.value,
                anchor: that.wrapper,
                animation: options.animation,
                format: options.timeFormat,
                culture: options.culture,
                height: options.height,
                interval: options.interval,
                min: new DATE(MIN),
                max: new DATE(MAX),
                dates: msMin === options.max.getTime() ? [new Date(msMin)] : [],
                parseFormats: options.parseFormats,
                change: function(value, trigger) {
                    value = timeView._parse(value);

                    if (value < options.min) {
                        value = new DATE(+options.min);
                        timeView.options.min = value;
                    } else if (value > options.max) {
                        value = new DATE(+options.max);
                        timeView.options.max = value;
                    }

                    if (trigger) {
                        that._timeSelected = true;
                        that._change(value);
                    } else {
                        element.val(kendo.toString(value, options.format, options.culture));
                        dateView.value(value);
                        that._updateARIA(value);
                    }
                },
                close: function(e) {
                    if (that.trigger(CLOSE, timeViewParams)) {
                        e.preventDefault();
                    } else {
                        ul.attr(ARIA_HIDDEN, true);
                        element.attr(ARIA_EXPANDED, false);

                        if (!dateView.popup.visible()) {
                            element.removeAttr(ARIA_OWNS);
                        }
                    }
                },
                open:  function(e) {
                    timeView._adjustListWidth();
                    if (that.trigger(OPEN, timeViewParams)) {
                        e.preventDefault();
                    } else {
                        if (element.val() !== that._oldText) {
                            date = parse(element.val(), options.parseFormats, options.culture);

                            that.timeView.value(date);
                        }

                        ul.attr(ARIA_HIDDEN, false);
                        element.attr(ARIA_EXPANDED, true)
                               .attr(ARIA_OWNS, timeView._timeViewID);

                        timeView.options.active(timeView.current());
                    }
                },
                active: function(current) {
                    element.removeAttr(ARIA_ACTIVEDESCENDANT);
                    if (current) {
                        element.attr(ARIA_ACTIVEDESCENDANT, timeView._optionID);
                    }
                }
            });
            ul = timeView.ul;
        },

        _icons: function() {
            var that = this,
                element = that.element,
                icons;

            icons = element.next("span.k-select");

            if (!icons[0]) {
                icons = $('<span unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-calendar">select</span><span unselectable="on" class="k-icon k-i-clock">select</span></span>').insertAfter(element);
            }

            icons = icons.children();
            that._dateIcon = icons.eq(0).attr({
                "role": "button",
                "aria-controls": that.dateView._dateViewID
            });

            that._timeIcon = icons.eq(1).attr({
                "role": "button",
                "aria-controls": that.timeView._timeViewID
            });
        },

        _wrapper: function() {
            var that = this,
            element = that.element,
            wrapper;

            wrapper = element.parents(".k-datetimepicker");

            if (!wrapper[0]) {
                wrapper = element.wrap(SPAN).parent().addClass("k-picker-wrap k-state-default");
                wrapper = wrapper.wrap(SPAN).parent();
            }

            wrapper[0].style.cssText = element[0].style.cssText;
            element.css({
                width: "100%",
                height: element[0].style.height
            });

            that.wrapper = wrapper.addClass("k-widget k-datetimepicker k-header")
                                  .addClass(element[0].className);

            that._inputWrapper = $(wrapper[0].firstChild);
        },

        _reset: function() {
            var that = this,
                element = that.element,
                formId = element.attr("form"),
                form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    that.value(element[0].defaultValue);
                    that.max(that._initialOptions.max);
                    that.min(that._initialOptions.min);
                };

                that._form = form.on("reset", that._resetHandler);
            }
        },

        _template: function() {
            this._ariaTemplate = kendo.template(this.options.ARIATemplate);
        },

        _calculateMidnight: function(min, max) {
            return getMilliseconds(min) + getMilliseconds(max) === 0;
        },

        _updateARIA: function(date) {
            var cell;
            var that = this;
            var calendar = that.dateView.calendar;

            that.element.removeAttr(ARIA_ACTIVEDESCENDANT);

            if (calendar) {
                cell = calendar._cell;
                cell.attr("aria-label", that._ariaTemplate({ current: date || calendar.current() }));

                that.element.attr(ARIA_ACTIVEDESCENDANT, cell.attr("id"));
            }
        }
    });

    function lastTimeOption(interval) {
        var date = new Date(2100, 0, 1);
        date.setMinutes(-interval);
        return date;
    }

    function preventDefault(e) {
        e.preventDefault();
    }

    function normalize(options) {
        var patterns = kendo.getCulture(options.culture).calendars.standard.patterns,
            parseFormats = !options.parseFormats.length,
            timeFormat;

        options.format = extractFormat(options.format || patterns.g);
        options.timeFormat = timeFormat = extractFormat(options.timeFormat || patterns.t);
        kendo.DateView.normalize(options);

        if (parseFormats) {
            options.parseFormats.push("yyyy-MM-ddTHH:mm:ss");
        }

        if ($.inArray(timeFormat, options.parseFormats) === -1) {
            options.parseFormats.splice(1, 0, timeFormat);
        }
    }

    ui.plugin(DateTimePicker);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.data" ], f);
})(function(){

var __meta__ = {
    id: "virtuallist",
    name: "VirtualList",
    category: "framework",
    depends: [ "data" ],
    hidden: true
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DataBoundWidget = ui.DataBoundWidget,
        proxy = $.proxy,

        WRAPPER = "k-virtual-wrap",
        VIRTUALLIST = "k-virtual-list",
        CONTENT = "k-virtual-content",
        LIST = "k-list",
        HEADER = "k-group-header",
        VIRTUALITEM = "k-virtual-item",
        ITEM = "k-item",
        HEIGHTCONTAINER = "k-height-container",
        GROUPITEM = "k-group",

        SELECTED = "k-state-selected",
        FOCUSED = "k-state-focused",
        HOVER = "k-state-hover",
        CHANGE = "change",
        CLICK = "click",
        LISTBOUND = "listBound",
        ITEMCHANGE = "itemChange",

        ACTIVATE = "activate",
        DEACTIVATE = "deactivate",

        VIRTUAL_LIST_NS = ".VirtualList";

    function lastFrom(array) {
        return array[array.length - 1];
    }

    function toArray(value) {
        return value instanceof Array ? value : [value];
    }

    function isPrimitive(dataItem) {
        return typeof dataItem === "string" || typeof dataItem === "number" || typeof dataItem === "boolean";
    }

    function getItemCount(screenHeight, listScreens, itemHeight) {
        return Math.ceil(screenHeight * listScreens / itemHeight);
    }

    function appendChild(parent, className, tagName) {
        var element = document.createElement(tagName || "div");
        if (className) {
            element.className = className;
        }
        parent.appendChild(element);

        return element;
    }

    function getDefaultItemHeight() {
        var mockList = $('<div class="k-popup"><ul class="k-list"><li class="k-item"><li></ul></div>'),
            lineHeight;
        mockList.css({
            position: "absolute",
            left: "-200000px",
            visibility: "hidden"
        });
        mockList.appendTo(document.body);
        lineHeight = parseFloat(kendo.getComputedStyles(mockList.find(".k-item")[0], ["line-height"])["line-height"]);
        mockList.remove();

        return lineHeight;
    }

    function bufferSizes(screenHeight, listScreens, opposite) { //in pixels
        return {
            down: screenHeight * opposite,
            up: screenHeight * (listScreens - 1 - opposite)
        };
    }

    function listValidator(options, screenHeight) {
        var downThreshold = (options.listScreens - 1 - options.threshold) * screenHeight;
        var upThreshold = options.threshold * screenHeight;

        return function(list, scrollTop, lastScrollTop) {
            if (scrollTop > lastScrollTop) {
                return scrollTop - list.top < downThreshold;
            } else {
                return list.top === 0 || scrollTop - list.top > upThreshold;
            }
        };
    }

    function scrollCallback(element, callback) {
        return function(force) {
            return callback(element.scrollTop, force);
        };
    }

    function syncList(reorder) {
        return function(list, force) {
            reorder(list.items, list.index, force);
            return list;
        };
    }

    function position(element, y) {
        if (kendo.support.browser.msie && kendo.support.browser.version < 10) {
            element.style.top = y + "px";
        } else {
            element.style.webkitTransform = 'translateY(' + y + "px)";
            element.style.transform = 'translateY(' + y + "px)";
        }
    }

    function map2(callback, templates) {
        return function(arr1, arr2) {
            for (var i = 0, len = arr1.length; i < len; i++) {
                callback(arr1[i], arr2[i], templates);
                if (arr2[i].item) {
                    this.trigger(ITEMCHANGE, { item: $(arr1[i]), data: arr2[i].item, ns: kendo.ui });
                    if (arr2[i].index === this._selectedIndex) {
                        this.select(this._selectedIndex);
                    }
                }
            }
        };
    }

    function reshift(items, diff) {
        var range;

        if (diff > 0) { // down
            range = items.splice(0, diff);
            items.push.apply(items, range);
        } else { // up
            range = items.splice(diff, -diff);
            items.unshift.apply(items, range);
        }

        return range;
    }

    function render(element, data, templates) {
        var itemTemplate = templates.template;

        element = $(element);

        if (!data.item) {
            itemTemplate = templates.placeholderTemplate;
        }

        this.angular("cleanup", function() {
            return { elements: [ element ]};
        });

        element
            .attr("data-uid", data.item ? data.item.uid : "")
            .attr("data-offset-index", data.index)
            .html(itemTemplate(data.item || {}));

        element.toggleClass(FOCUSED, data.current);
        element.toggleClass(SELECTED, data.selected);
        element.toggleClass("k-first", data.newGroup);
        element.toggleClass("k-loading-item", !data.item);

        if (data.index !== 0 && data.newGroup) {
            $("<div class=" + GROUPITEM + "></div>")
                .appendTo(element)
                .html(templates.groupTemplate({ group: data.group }));
        }

        if (data.top !== undefined) {
            position(element[0], data.top);
        }

        this.angular("compile", function() {
            return { elements: [ element ], data: [ { dataItem: data.item, group: data.group, newGroup: data.newGroup } ]};
        });
    }

    function findChangedItems(selected, changed) {
        var changedLength = changed.length;
        var result = [];
        var dataItem;
        var i, j;

        for (i = 0; i < selected.length; i++) {
            dataItem = selected[i];

            for (j = 0; j < changedLength; j++) {
                if (dataItem === changed[j]) {
                    result.push({
                        index: i,
                        item: dataItem
                    });
                }
            }
        }

        return result;
    }

    var VirtualList = DataBoundWidget.extend({
        init: function(element, options) {
            var that = this;
            that._listCreated = false;
            that._fetching = false;
            that._filter = false;

            Widget.fn.init.call(that, element, options);

            if (!that.options.itemHeight) {
                that.options.itemHeight = getDefaultItemHeight();
            }

            options = that.options;

            that.element.addClass(LIST + " " + VIRTUALLIST).attr("role", "listbox");
            that.content = that.element.wrap("<div unselectable='on' class='" + CONTENT + "'></div>").parent();
            that.wrapper = that.content.wrap("<div class='" + WRAPPER + "'></div>").parent();
            that.header = that.content.before("<div class='" + HEADER + "'></div>").prev();

            that.element.on("mouseenter" + VIRTUAL_LIST_NS, "li:not(.k-loading-item)", function() { $(this).addClass(HOVER); })
                        .on("mouseleave" + VIRTUAL_LIST_NS, "li", function() { $(this).removeClass(HOVER); });

            that._values = toArray(that.options.value);
            that._selectedDataItems = [];
            that._selectedIndexes = [];
            that._rangesList = {};
            that._activeDeferred = null;
            that._promisesList = [];
            that._optionID = kendo.guid();

            that.setDataSource(options.dataSource);

            that.content.on("scroll" + VIRTUAL_LIST_NS, kendo.throttle(function() {
                that._renderItems();
            }, options.delay));

            that._selectable();
        },

        options: {
            name: "VirtualList",
            autoBind: true,
            delay: 100,
            height: null,
            listScreens: 4,
            threshold: 0.5,
            itemHeight: null,
            oppositeBuffer: 1,
            type: "flat",
            selectable: false,
            value: [],
            dataValueField: null,
            template: "#:data#",
            placeholderTemplate: "loading...",
            groupTemplate: "#:group#",
            fixedGroupTemplate: "fixed header template",
            valueMapper: null
        },

        events: [
            CHANGE,
            CLICK,
            LISTBOUND,
            ITEMCHANGE,
            ACTIVATE,
            DEACTIVATE
        ],

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            if (this._selectProxy && this.options.selectable === false) {
                this.element.off(CLICK, "." + VIRTUALITEM, this._selectProxy);
            } else if (!this._selectProxy && this.options.selectable) {
                this._selectable();
            }

            this.refresh();
        },

        items: function() {
            return $(this._items);
        },

        destroy: function() {
            this.wrapper.off(VIRTUAL_LIST_NS);
            this.dataSource.unbind(CHANGE, this._refreshHandler);
            Widget.fn.destroy.call(this);
        },

        setDataSource: function(source) {
            var that = this;
            var dataSource = source || {};
            var value;

            dataSource = $.isArray(dataSource) ? {data: dataSource} : dataSource;
            dataSource = kendo.data.DataSource.create(dataSource);

            if (that.dataSource) {
                that.dataSource.unbind(CHANGE, that._refreshHandler);
                that.dataSource.unbind(CHANGE, that._rangeChangeHandler);

                value = that.value();

                that.value([]);
                that.mute(function() {
                    that.value(value);
                });
            } else {
                that._refreshHandler = $.proxy(that.refresh, that);
                that._rangeChangeHandler = $.proxy(that.rangeChange, that);
            }

            that.dataSource = dataSource.bind(CHANGE, that._refreshHandler)
                                        .bind(CHANGE, that._rangeChangeHandler);

            if (that.dataSource.view().length !== 0) {
                that.refresh();
            } else if (that.options.autoBind) {
                that.dataSource.fetch();
            }
        },

        rangeChange: function () {
            var that = this;
            var page = that.dataSource.page();

            if (that.isBound() && that._rangeChange === true && that._lastPage !== page) {
                that._lastPage = page;
                that.trigger(LISTBOUND);
            }
        },

        refresh: function(e) {
            var that = this;
            var action = e && e.action;
            var changedItems;

            if (that._mute) { return; }

            if (!that._fetching) {
                if (that._filter) {
                    that.focus(0);
                }

                that._createList();
                if (!action && that._values.length && !that._filter) {
                    that.value(that._values, true).done(function() {
                        that._lastPage = that.dataSource.page();
                        that._listCreated = true;
                        that.trigger(LISTBOUND);
                    });
                } else {
                    that._lastPage = that.dataSource.page();
                    that._listCreated = true;
                    that.trigger(LISTBOUND);
                }
            } else {
                if (that._renderItems) {
                    that._renderItems(true);
                }
            }

            if (action === "itemchange") {
                changedItems = findChangedItems(that._selectedDataItems, e.items);
                if (changedItems.length) {
                    that.trigger("selectedItemChange", {
                        items: changedItems
                    });
                }
            }

            that._fetching = false;
        },

        removeAt: function(position) {
            this._selectedIndexes.splice(position, 1);
            this._values.splice(position, 1);

            return {
                position: position,
                dataItem: this._selectedDataItems.splice(position, 1)[0]
            };
        },

        setValue: function(value) {
            this._values = toArray(value);
        },

        value: function(value, _forcePrefetch) {
            var that = this;
            var dataSource = that.dataSource;

            if (value === undefined) {
                return that._values.slice();
            }

            value = toArray(value);

            if (that.options.selectable === "multiple" && that.select().length && value.length) {
                that.select(-1);
            }

            if (!that._valueDeferred || that._valueDeferred.state() === "resolved") {
                that._valueDeferred = $.Deferred();
            }

            if (!value.length) {
                that.select(-1);
            }

            that._values = value;

            if ((that.isBound() && !that._mute) || _forcePrefetch) {
                that._prefetchByValue(value);
            }

            return that._valueDeferred;
        },

        _prefetchByValue: function(value) {
            var that = this,
                dataView = that._dataView,
                valueGetter = that._valueGetter,
                item, match = false,
                forSelection = [];

            //try to find the items in the loaded data
            for (var i = 0; i < value.length; i++) {
                for (var idx = 0; idx < dataView.length; idx++) {
                    item = dataView[idx].item;
                    if (item) {
                        match = isPrimitive(item) ? value[i] === item : value[i] === valueGetter(item);

                        if (match) {
                            forSelection.push(idx);
                        }
                    }
                }
            }

            if (forSelection.length === value.length) {
                that._values = [];
                that.select(forSelection);
                return;
            }

            //prefetch the items
            if (typeof that.options.valueMapper === "function") {
                that.options.valueMapper({
                    value: (this.options.selectable === "multiple") ? value : value[0],
                    success: function(indexes) {
                        that._values = [];
                        that._selectedIndexes = [];
                        that._selectedDataItems = [];

                        indexes = toArray(indexes);

                        if (!indexes.length) {
                            indexes = [-1];
                        }

                        that.select(indexes);
                    }
                });
            } else {
                throw new Error("valueMapper is not provided");
            }
        },

        deferredRange: function(index) {
            var dataSource = this.dataSource;
            var take = this.itemCount;
            var ranges = this._rangesList;
            var result = $.Deferred();
            var defs = [];


            var low = Math.floor(index / take) * take;
            var high = Math.ceil(index / take) * take;

            var pages = high  === low ? [ high ] : [ low, high ];

            $.each(pages, function(_, skip) {
                var end = skip + take;
                var existingRange = ranges[skip];
                var deferred;

                if (!existingRange || (existingRange.end !== end)) {
                    deferred = $.Deferred();
                    ranges[skip] = { end: end, deferred: deferred };

                    dataSource._multiplePrefetch(skip, take, function() {
                        deferred.resolve();
                    });
                } else {
                    deferred = existingRange.deferred;
                }

                defs.push(deferred);
            });

            $.when.apply($, defs).then(function() {
                result.resolve();
            });

            return result;
        },

        prefetch: function(indexes) {
            var that = this,
                take = this.itemCount,
                dataSource = this.dataSource,
                isEmptyList = !that._promisesList.length;

            if (!that._activeDeferred) {
                that._activeDeferred = $.Deferred();
                that._promisesList = [];
            }

            $.each(indexes, function(_, index) {
                var rangeStart = Math.floor(index / take) * take;
                that._promisesList.push(that.deferredRange(rangeStart));
            });

            if (isEmptyList) {
                $.when.apply($, that._promisesList).done(function() {
                    that._activeDeferred.resolve();
                    that._activeDeferred = null;
                    that._promisesList = [];
                });
            }

            return that._activeDeferred;
        },

        _findDataItem: function(index) {
            var view = this.dataSource.view(),
                group;

            //find in grouped view
            if (this.options.type === "group") {
                for (var i = 0; i < view.length; i++) {
                    group = view[i].items;
                    if (group.length <= index) {
                        index = index - group.length;
                    } else {
                        return group[index];
                    }
                }
            }

            //find in flat view
            return view[index];
        },

        selectedDataItems: function() {
            return this._selectedDataItems.slice();
        },

        scrollTo: function(y) {
            this.content.scrollTop(y); //works only if the element is visible
        },

        scrollToIndex: function(index) {
            this.scrollTo(index * this.options.itemHeight);
        },

        focus: function(candidate) {
            var element,
                index,
                data,
                dataSource = this.dataSource,
                current,
                itemHeight = this.options.itemHeight,
                id = this._optionID,
                triggerEvent = true;

            if (candidate === undefined) {
                current = this.element.find("." + FOCUSED);
                return current.length ? current : null;
            }

            if (typeof candidate === "function") {
                data = this.dataSource.flatView();
                for (var idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        candidate = idx;
                        break;
                    }
                }
            }

            if (candidate instanceof Array) {
                candidate = lastFrom(candidate);
            }

            if (isNaN(candidate)) {
                element = $(candidate);
                index = parseInt($(element).attr("data-offset-index"), 10);
            } else {
                index = candidate;
                element = this._getElementByIndex(index);
            }

            if (index === -1) {
                this.element.find("." + FOCUSED).removeClass(FOCUSED);
                this._focusedIndex = undefined;
                return;
            }

            if (element.length) { /*focus rendered item*/
                if (element.hasClass(FOCUSED)) {
                    triggerEvent = false;
                }
                if (this._focusedIndex !== undefined) {
                    current = this._getElementByIndex(this._focusedIndex);
                    current
                        .removeClass(FOCUSED)
                        .removeAttr("id");

                    if (triggerEvent) {
                        this.trigger(DEACTIVATE);
                    }
                }

                this._focusedIndex = index;

                element
                    .addClass(FOCUSED)
                    .attr("id", id);

                var position = this._getElementLocation(index);

                if (position === "top") {
                    this.scrollTo(index * itemHeight);
                } else if (position === "bottom") {
                    this.scrollTo((index * itemHeight + itemHeight) - this.screenHeight);
                } else if (position === "outScreen") {
                    this.scrollTo(index * itemHeight);
                }

                if (triggerEvent) {
                    this.trigger(ACTIVATE);
                }
            } else { /*focus non rendered item*/
                this._focusedIndex = index;
                this.items().removeClass(FOCUSED);
                this.scrollToIndex(index);
            }
        },

        focusIndex: function() {
            return this._focusedIndex;
        },

        first: function() {
            this.scrollTo(0);
            this.focus(0);
        },

        last: function() {
            var lastIndex = this.dataSource.total();
            this.scrollTo(this.heightContainer.offsetHeight);
            this.focus(lastIndex);
        },

        prev: function() {
            var index = this._focusedIndex;
            var current;

            if (!isNaN(index) && index > 0) {
                index -= 1;
                this.focus(index);

                current = this.focus();
                if (current && current.hasClass("k-loading-item")) {
                    index += 1;
                    this.focus(index);
                }

                return index;
            }
        },

        next: function() {
            var index = this._focusedIndex;
            var lastIndex = this.dataSource.total() - 1;
            var current;

            if (!isNaN(index) && index < lastIndex) {
                index += 1;
                this.focus(index);

                current = this.focus();
                if (current && current.hasClass("k-loading-item")) {
                    index -= 1;
                    this.focus(index);
                }

                return index;
            }
        },

        select: function(candidate) {
            var that = this,
                indices,
                singleSelection = that.options.selectable !== "multiple",
                prefetchStarted = !!that._activeDeferred,
                deferred,
                added = [],
                removed = [];

            if (candidate === undefined) {
                return that._selectedIndexes.slice();
            }

            indices = that._getIndecies(candidate);

            if (that._filter && !singleSelection && that._deselectFiltered(indices)) {
                return;
            }

            if (!indices.length || (singleSelection && !that._filter && lastFrom(indices) === lastFrom(this._selectedIndexes))) {
                return;
            }

            removed = that._deselect(indices);

            if (singleSelection) {
                that._activeDeferred = null;
                prefetchStarted = false;
                if (indices.length) {
                    indices = [lastFrom(indices)];
                }
            }

            var done = function() {
                var added = that._select(indices);

                that.focus(indices);

                if (added.length || removed.length) {
                    that.trigger(CHANGE, {
                        added: added,
                        removed: removed
                    });
                }

                if (that._valueDeferred) {
                    that._valueDeferred.resolve();
                }
            };

            deferred = that.prefetch(indices);

            if (!prefetchStarted) {
                if (deferred) {
                    deferred.done(done);
                } else {
                    done();
                }
            }
        },

        isBound: function() {
            return this._listCreated;
        },

        mute: function(callback) {
            this._mute = true;
            proxy(callback(), this);
            this._mute = false;
        },

        filter: function(filter) {
            if (filter === undefined) {
                return this._filter;
            }

            this._filter = filter;
            this._rangeChange = true;
        },

        skipUpdate: $.noop,

        _getElementByIndex: function(index) {
            return this.items().filter(function(idx, element) {
                return index === parseInt($(element).attr("data-offset-index"), 10);
            });
        },

        _clean: function() {
            this.result = undefined;
            this._lastScrollTop = undefined;
            this._lastPage = undefined;
            $(this.heightContainer).remove();
            this.heightContainer = undefined;
            this.element.empty();
        },

        _height: function() {
            var hasData = !!this.dataSource.view().length,
                height = this.options.height,
                itemHeight = this.options.itemHeight,
                total = this.dataSource.total();

            if (!hasData) {
                height = 0;
            } else if (height/itemHeight > total) {
                height = total * itemHeight;
            }

            return height;
        },

        _screenHeight: function() {
            var height = this._height(),
                element = this.element,
                content = this.content;

            content.height(height);
            this.screenHeight = height;
        },

        _getElementLocation: function(index) {
            var scrollTop = this.content.scrollTop(),
                screenHeight = this.screenHeight,
                itemHeight = this.options.itemHeight,
                yPosition = index * itemHeight,
                yDownPostion = yPosition + itemHeight,
                screenEnd = scrollTop + screenHeight,
                position;

            if (yPosition === (scrollTop - itemHeight) || (yDownPostion > scrollTop && yPosition < scrollTop)) {
                position = "top";
            } else if (yPosition === screenEnd || (yPosition < screenEnd && screenEnd < yDownPostion)) {
                position = "bottom";
            } else if ((yPosition >= scrollTop) && (yPosition <= scrollTop + (screenHeight - itemHeight))) {
                position = "inScreen";
            } else {
                position = "outScreen";
            }

            return position;
        },

        _templates: function() {
            var templates = {
                template: this.options.template,
                placeholderTemplate: this.options.placeholderTemplate,
                groupTemplate: this.options.groupTemplate,
                fixedGroupTemplate: this.options.fixedGroupTemplate
            };

            for (var key in templates) {
                if (typeof templates[key] !== "function") {
                    templates[key] = kendo.template(templates[key]);
                }
            }

            this.templates = templates;
        },

        _generateItems: function(element, count) {
            var items = [],
                item,
                itemHeight = this.options.itemHeight + "px";

            while(count-- > 0) {
                item = document.createElement("li");
                item.tabIndex = -1;
                item.className = VIRTUALITEM + " " + ITEM;
                item.setAttribute("role", "option");
                item.style.height = itemHeight;
                item.style.minHeight = itemHeight;
                element.appendChild(item);

                items.push(item);
            }

            return items;
        },

        _saveInitialRanges: function() {
            var ranges = this.dataSource._ranges;
            var deferred = $.Deferred();
            deferred.resolve();

            this._rangesList = {};
            for (var i = 0; i < ranges.length; i++) {
                this._rangesList[ranges[i].start] = { end: ranges[i].end, deferred: deferred };
            }
        },

        _createList: function() {
            var that = this,
                content = that.content.get(0),
                options = that.options,
                dataSource = that.dataSource,
                total = dataSource.total();

            if (that._listCreated) {
                that._clean();
            }

            that._saveInitialRanges();
            that._screenHeight();
            that._buildValueGetter();
            that.itemCount = getItemCount(that.screenHeight, options.listScreens, options.itemHeight);

            if (that.itemCount > dataSource.total()) {
                that.itemCount = dataSource.total();
            }

            that._templates();
            that._items = that._generateItems(that.element[0], that.itemCount);

            that._setHeight(options.itemHeight * dataSource.total());
            that.options.type = (dataSource.group() || []).length ? "group" : "flat";

            if (that.options.type === "flat") {
                that.header.hide();
            } else {
                that.header.show();
            }

            that.getter = that._getter(function() {
                that._renderItems(true);
            });

            that._onScroll = function(scrollTop, force) {
                var getList = that._listItems(that.getter);
                return that._fixedHeader(scrollTop, getList(scrollTop, force));
            };

            that._renderItems = that._whenChanged(
                scrollCallback(content, that._onScroll),
                syncList(that._reorderList(that._items, $.proxy(render, that)))
            );

            that._renderItems();
            that._calculateGroupPadding(that.screenHeight);
        },

        _setHeight: function(height) {
            var currentHeight,
                heightContainer = this.heightContainer;

            if (!heightContainer) {
                heightContainer = this.heightContainer = appendChild(this.content[0], HEIGHTCONTAINER);
            } else {
                currentHeight = heightContainer.offsetHeight;
            }

            if (height !== currentHeight) {
                heightContainer.innerHTML = "";

                while (height > 0) {
                    var padHeight = Math.min(height, 250000); //IE workaround, should not create elements with height larger than 250000px
                    appendChild(heightContainer).style.height = padHeight + "px";
                    height -= padHeight;
                }
            }
        },

        _getter: function() {
            var lastRequestedRange = null,
                dataSource = this.dataSource,
                lastRangeStart = dataSource.skip(),
                type = this.options.type,
                pageSize = this.itemCount,
                flatGroups = {};

            return function(index, rangeStart) {
                var that = this;
                if (!dataSource.inRange(rangeStart, pageSize)) {
                    if (lastRequestedRange !== rangeStart) {
                        lastRequestedRange = rangeStart;
                        lastRangeStart = rangeStart;
                        that._fetching = true;

                        if (that._getterDeferred) {
                            that._getterDeferred.reject();
                        }

                        that._getterDeferred = that.deferredRange(rangeStart);
                        that._getterDeferred.then(function() {
                            var firstItemIndex = that._indexConstraint(that.content[0].scrollTop);

                            that._getterDeferred = null;

                            if (rangeStart <= firstItemIndex && firstItemIndex <= (rangeStart + pageSize)) {
                                that._fetching = true;
                                that._rangeChange = true;
                                dataSource.range(rangeStart, pageSize);
                                that._rangeChange = false;
                            }
                        });
                    }

                    return null;
                } else {
                    if (lastRangeStart !== rangeStart) {
                        that._mute = true;
                        that._fetching = true;
                        that._rangeChange = true;

                        dataSource.range(rangeStart, pageSize);
                        lastRangeStart = rangeStart;

                        that._rangeChange = false;
                        that._fetching = false;
                        that._mute = false;
                    }

                    var result;
                    if (type === "group") { //grouped list
                        if (!flatGroups[rangeStart]) {
                            var flatGroup = flatGroups[rangeStart] = [];
                            var groups = dataSource.view();
                            for (var i = 0, len = groups.length; i < len; i++) {
                                var group = groups[i];
                                for (var j = 0, groupLength = group.items.length; j < groupLength; j++) {
                                    flatGroup.push({ item: group.items[j], group: group.value });
                                }
                            }
                        }

                        result = flatGroups[rangeStart][index - rangeStart];
                    } else { //flat list
                        result = dataSource.view()[index - rangeStart];
                    }

                    return result;
                }
            };
        },

        _fixedHeader: function(scrollTop, list) {
            var group = this.currentVisibleGroup,
                itemHeight = this.options.itemHeight,
                firstVisibleDataItemIndex = Math.floor((scrollTop - list.top) / itemHeight),
                firstVisibleDataItem = list.items[firstVisibleDataItemIndex];

            if (firstVisibleDataItem && firstVisibleDataItem.item) {
                var firstVisibleGroup = firstVisibleDataItem.group;

                if (firstVisibleGroup !== group) {
                    this.header[0].innerHTML = firstVisibleGroup || "";
                    this.currentVisibleGroup = firstVisibleGroup;
                }
            }

            return list;
        },

        _itemMapper: function(item, index, value) {
            var listType = this.options.type,
                itemHeight = this.options.itemHeight,
                currentIndex = this._focusedIndex,
                selected = false,
                current = false,
                newGroup = false,
                group = null,
                nullIndex = -1,
                match = false,
                valueGetter = this._valueGetter;

            if (listType === "group") {
                if (item) {
                    newGroup = index === 0 || (this._currentGroup && this._currentGroup !== item.group);
                    this._currentGroup = item.group;
                }

                group = item ? item.group : null;
                item = item ? item.item : null;
            }

            if (value.length && item) {
                for (var i = 0; i < value.length; i++) {
                    match = isPrimitive(item) ? value[i] === item : value[i] === valueGetter(item);
                    if (match) {
                        value.splice(i , 1);
                        selected = true;
                        break;
                    }
                }
            }

            if (currentIndex === index) {
                current = true;
            }

            return {
                item: item ? item : null,
                group: group,
                newGroup: newGroup,
                selected: selected,
                current: current,
                index: index,
                top: index * itemHeight
            };
        },

        _range: function(index) {
            var itemCount = this.itemCount,
                value = this._values.slice(),
                items = [],
                item;

            this._view = {};
            this._currentGroup = null;

            for (var i = index, length = index + itemCount; i < length; i++) {
                item = this._itemMapper(this.getter(i, index), i, value);
                items.push(item);
                this._view[item.index] = item;
            }

            this._dataView = items;
            return items;
        },

        _getDataItemsCollection: function(scrollTop, lastScrollTop) {
            var items = this._range(this._listIndex(scrollTop, lastScrollTop));
            return {
                index: items.length ? items[0].index : 0,
                top: items.length ? items[0].top : 0,
                items: items
            };
        },

        _listItems: function(getter) {
            var screenHeight = this.screenHeight,
                itemCount = this.itemCount,
                options = this.options;

            var theValidator = listValidator(options, screenHeight);

            return $.proxy(function(value, force) {
                var result = this.result,
                    lastScrollTop = this._lastScrollTop;

                if (force || !result || !theValidator(result, value, lastScrollTop)) {
                    result = this._getDataItemsCollection(value, lastScrollTop);
                }

                this._lastScrollTop = value;
                this.result = result;

                return result;
            }, this);
        },

        _whenChanged: function(getter, callback) {
            var current;

            return function(force) {
                var theNew = getter(force);

                if (theNew !== current) {
                    current = theNew;
                    callback(theNew, force);
                }
            };
        },

        _reorderList: function(list, reorder) {
            var that = this;
            var length = list.length;
            var currentOffset = -Infinity;
            reorder = $.proxy(map2(reorder, this.templates), this);

            return function(list2, offset, force) {
                var diff = offset - currentOffset;
                var range, range2;

                if (force || Math.abs(diff) >= length) { // full reorder
                    range = list;
                    range2 = list2;
                } else { // partial reorder
                    range = reshift(list, diff);
                    range2 = diff > 0 ? list2.slice(-diff) : list2.slice(0, -diff);
                }

                reorder(range, range2, that._listCreated);

                currentOffset = offset;
            };
        },

        _bufferSizes: function() {
            var options = this.options;

            return bufferSizes(this.screenHeight, options.listScreens, options.oppositeBuffer);
        },

        _indexConstraint: function(position) {
            var itemCount = this.itemCount,
                itemHeight = this.options.itemHeight,
                total = this.dataSource.total();

            return Math.min(Math.max(total - itemCount, 0), Math.max(0, Math.floor(position / itemHeight )));
        },

        _listIndex: function(scrollTop, lastScrollTop) {
            var buffers = this._bufferSizes(),
                position;

            position = scrollTop - ((scrollTop > lastScrollTop) ? buffers.down : buffers.up);

            return this._indexConstraint(position);
        },

        _selectable: function() {
            if (this.options.selectable) {
                this._selectProxy = $.proxy(this, "_clickHandler");
                this.element.on(CLICK + VIRTUAL_LIST_NS, "." + VIRTUALITEM, this._selectProxy);
            }
        },

        _getIndecies: function(candidate) {
            var result = [], data;

            if (typeof candidate === "function") {
                data = this.dataSource.flatView();
                for (var idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        result.push(idx);
                        break;
                    }
                }
            }

            if (typeof candidate === "number") {
                result.push(candidate);
            }

            if (candidate instanceof jQuery) {
                candidate = parseInt(candidate.attr("data-offset-index"), 10);
                if (!isNaN(candidate)) {
                    result.push(candidate);
                }
            }

            if (candidate instanceof Array) {
                result = candidate;
            }

            return result;
        },

        _deselect: function(indexes) {
            var removed = [],
                index,
                selectedIndex,
                dataItem,
                selectedIndexes = this._selectedIndexes,
                position = 0,
                selectable = this.options.selectable,
                removedindexesCounter = 0,
                item;

            if (indexes[position] === -1) { //deselect everything
                for (var idx = 0; idx < selectedIndexes.length; idx++) {
                    selectedIndex = selectedIndexes[idx];

                    this._getElementByIndex(selectedIndex).removeClass(SELECTED);

                    removed.push({
                        index: selectedIndex,
                        position: idx,
                        dataItem: this._selectedDataItems[idx]
                    });
                }

                this._values = [];
                this._selectedDataItems = [];
                this._selectedIndexes = [];
                indexes.splice(0, indexes.length);

                return removed;
            }

            if (selectable === true) {
                index = indexes[position];
                selectedIndex = selectedIndexes[position];

                if (selectedIndex !== undefined && index !== selectedIndex) {
                    this._getElementByIndex(selectedIndex).removeClass(SELECTED);

                    removed.push({
                        index: selectedIndex,
                        position: position,
                        dataItem: this._selectedDataItems[position]
                    });

                    this._values = [];
                    this._selectedDataItems = [];
                    this._selectedIndexes = [];
                }
            } else if (selectable === "multiple") {
                for (var i = 0; i < indexes.length; i++) {
                    position = $.inArray(indexes[i], selectedIndexes);
                    selectedIndex = selectedIndexes[position];

                    if (selectedIndex !== undefined) {
                        item = this._getElementByIndex(selectedIndex);

                        if (!item.hasClass("k-state-selected")) {
                            continue;
                        }

                        item.removeClass(SELECTED);
                        this._values.splice(position, 1);
                        this._selectedIndexes.splice(position, 1);
                        dataItem = this._selectedDataItems.splice(position, 1);

                        indexes.splice(i, 1);

                        removed.push({
                            index: selectedIndex,
                            position: position + removedindexesCounter,
                            dataItem: dataItem
                        });

                        removedindexesCounter++;
                        i--;
                    }
                }
            }

            return removed;
        },

        _deselectFiltered: function(indices) {
            var children = this.element[0].children;
            var value, index, position;
            var values = this._values;
            var removed = [];
            var idx = 0;
            var j;

            for (; idx < indices.length; idx++) {
                position = -1;
                index = indices[idx];
                value = this._valueGetter(this._view[index].item);

                for (j = 0; j < values.length; j++) {
                    if (value == values[j]) {
                        position = j;
                        break;
                    }
                }

                if (position > -1) {
                    removed.push(this.removeAt(position));
                    $(children[index]).removeClass("k-state-selected");
                }
            }

            if (removed.length) {
                this.trigger("change", {
                    added: [],
                    removed: removed
                });

                return true;
            }

            return false;
        },

        _select: function(indexes) {
            var that = this,
                singleSelection = this.options.selectable !== "multiple",
                dataSource = this.dataSource,
                index, dataItem, selectedValue, element,
                page, skip, oldSkip,
                take = this.itemCount,
                valueGetter = this._valueGetter,
                added = [];

            if (singleSelection) {
                that._selectedIndexes = [];
                that._selectedDataItems = [];
                that._values = [];
            }

            oldSkip = dataSource.skip();

            $.each(indexes, function(_, index) {
                var page = index < take ? 1 : Math.floor(index / take) + 1;
                var skip = (page - 1) * take;

                that.mute(function() {
                    dataSource.range(skip, take); //switch the range to get the dataItem

                    dataItem = that._findDataItem([index - skip]);
                    that._selectedIndexes.push(index);
                    that._selectedDataItems.push(dataItem);
                    that._values.push(isPrimitive(dataItem) ? dataItem : valueGetter(dataItem));

                    added.push({
                        index: index,
                        dataItem: dataItem
                    });

                    that._getElementByIndex(index).addClass(SELECTED);

                    dataSource.range(oldSkip, take); //switch back the range
                });
            });

            return added;
        },

        _clickHandler: function(e) {
            var item = $(e.currentTarget);

            if (!e.isDefaultPrevented() && item.attr("data-uid")) {
                this.trigger(CLICK, { item: item });
            }
        },

        _buildValueGetter: function() {
            this._valueGetter = kendo.getter(this.options.dataValueField);
        },

        _calculateGroupPadding: function(height) {
            var firstItem = this.items().first(),
                groupHeader = this.header,
                padding = 0;

            if (groupHeader[0] && groupHeader[0].style.display !== "none") {
                if (height !== "auto") {
                    padding = kendo.support.scrollbar();
                }

                padding += parseFloat(firstItem.css("border-right-width"), 10) + parseFloat(firstItem.children(".k-group").css("right"), 10);

                groupHeader.css("padding-right", padding);
            }
        }

    });

    kendo.ui.VirtualList = VirtualList;
    kendo.ui.plugin(VirtualList);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
/* Concatenated */
(function(f, define){
    define([ "./kendo.core" ], f);
})(function() {

var __meta__ = {
    id: "angular",
    name: "AngularJS Directives",
    category: "framework",
    description: "Adds Kendo UI for AngularJS directives",
    depends: [ "core" ],
    defer: true
};

(function ($, angular, undefined) {
    "use strict";

    if (!angular) {
        return;
    }

    /*jshint eqnull:true,loopfunc:true,-W052,-W028  */

    var module = angular.module('kendo.directives', []),
        $injector = angular.injector(['ng']),
        $parse = $injector.get('$parse'),
        $timeout = $injector.get('$timeout'),
        $defaultCompile,
        $log = $injector.get('$log');

    function withoutTimeout(f) {
        var save = $timeout;
        try {
            $timeout = function(f){ return f(); };
            return f();
        } finally {
            $timeout = save;
        }
    }

    var OPTIONS_NOW;

    var createDataSource = (function() {
        var types = {
            TreeList    : 'TreeListDataSource',
            TreeView    : 'HierarchicalDataSource',
            Scheduler   : 'SchedulerDataSource',
            PanelBar    : '$PLAIN',
            Menu        : "$PLAIN",
            ContextMenu : "$PLAIN"
        };
        var toDataSource = function(dataSource, type) {
            if (type == '$PLAIN') {
                return dataSource;
            }
            return kendo.data[type].create(dataSource);
        };
        return function(scope, element, role, source) {
            var type = types[role] || 'DataSource';
            var ds = toDataSource(scope.$eval(source), type);

            // not recursive -- this triggers when the whole data source changed
            scope.$watch(source, function(mew, old){
                if (mew !== old) {
                    var ds = toDataSource(mew, type);
                    var widget = kendoWidgetInstance(element);
                    if (widget && typeof widget.setDataSource == "function") {
                        widget.setDataSource(ds);
                    }
                }
            });
            return ds;
        };
    }());

    var ignoredAttributes = {
        kDataSource : true,
        kOptions    : true,
        kRebind     : true,
        kNgModel    : true,
        kNgDelay    : true
    };

    var ignoredOwnProperties = {
        // XXX: other names to ignore here?
        name    : true,
        title   : true,
        style   : true
    };

    function addOption(scope, options, name, value) {
        options[name] = angular.copy(scope.$eval(value));
        if (options[name] === undefined && value.match(/^\w*$/)) {
            $log.warn(name + ' attribute resolved to undefined. Maybe you meant to use a string literal like: \'' + value + '\'?');
        }
    }

    function createWidget(scope, element, attrs, widget, origAttr, controllers) {
        if (!(element instanceof jQuery)) {
            throw new Error("The Kendo UI directives require jQuery to be available before AngularJS. Please include jquery before angular in the document.");
        }
        var kNgDelay = attrs.kNgDelay,
            delayValue = scope.$eval(kNgDelay);

        controllers = controllers || [];

        var ngModel = controllers[0],
            ngForm = controllers[1];

        if (kNgDelay && !delayValue) {
            var root = scope.$root || scope;

            var register = function() {
                var unregister = scope.$watch(kNgDelay, function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                        unregister();
                        // remove subsequent delays, to make ng-rebind work
                        element.removeAttr(attrs.$attr.kNgDelay);
                        kNgDelay = null;
                        $timeout(createIt); // XXX: won't work without `timeout` ;-\
                    }
                });
            };

            // WARNING: the watchers should be registered in the digest cycle.
            // the fork here is for the timeout/non-timeout initiated widgets.
            if (/^\$(digest|apply)$/.test(root.$$phase)) {
                register();
            } else {
                scope.$apply(register);
            }

            return;
        } else {
            return createIt();
        }

        function createIt() {
            var originalElement;

            if (attrs.kRebind) {
                originalElement = $($(element)[0].cloneNode(true));
            }


            var role = widget.replace(/^kendo/, '');
            var options = angular.extend({}, attrs.defaultOptions, scope.$eval(attrs.kOptions || attrs.options));
            var ctor = $(element)[widget];

            if (!ctor) {
                window.console.error("Could not find: " + widget);
                return null;
            }

            var widgetOptions = ctor.widget.prototype.options;
            var widgetEvents = ctor.widget.prototype.events;

            $.each(attrs, function(name, value) {
                if (name === "source" || name === "kDataSource" || name === "kScopeField") {
                    return;
                }

                var dataName = "data" + name.charAt(0).toUpperCase() + name.slice(1);

                if (name.indexOf("on") === 0) { // let's search for such event.
                    var eventKey = name.replace(/^on./, function(prefix) {
                        return prefix.charAt(2).toLowerCase();
                    });

                    if (widgetEvents.indexOf(eventKey) > -1) {
                        options[eventKey] = value;
                    }
                } // don't elsif here - there are on* options

                if (widgetOptions.hasOwnProperty(dataName)) {
                    addOption(scope, options, dataName, value);
                } else if (widgetOptions.hasOwnProperty(name) && !ignoredOwnProperties[name]) {
                    addOption(scope, options, name, value);
                } else if (!ignoredAttributes[name]) {
                    var match = name.match(/^k(On)?([A-Z].*)/);
                    if (match) {
                        var optionName = match[2].charAt(0).toLowerCase() + match[2].slice(1);
                        if (match[1] && name != "kOnLabel" // XXX: k-on-label can be used on MobileSwitch :-\
                        ) {
                            options[optionName] = value;
                        } else {
                            if (name == "kOnLabel") {
                                optionName = "onLabel"; // XXX: that's awful.
                            }
                            addOption(scope, options, optionName, value);
                        }
                    }
                }
            });

            // parse the datasource attribute
            var dataSource = attrs.kDataSource || attrs.source;

            if (dataSource) {
                options.dataSource = createDataSource(scope, element, role, dataSource);
            }

            // deepExtend in kendo.core (used in Editor) will fail with stack
            // overflow if we don't put it in an array :-\
                options.$angular = [ scope ];

            if (element.is("select")) {
                (function(options){
                    if (options.length > 0) {
                        var first = $(options[0]);
                        if (!/\S/.test(first.text()) && /^\?/.test(first.val())) {
                            first.remove();
                        }
                    }
                }(element[0].options));
            }

            var object = ctor.call(element, OPTIONS_NOW = options).data(widget);

            exposeWidget(object, scope, attrs, widget, origAttr);

            scope.$emit("kendoWidgetCreated", object);

            var destroyRegister = destroyWidgetOnScopeDestroy(scope, object);

            if (attrs.kRebind) {
                setupRebind(object, scope, element, originalElement, attrs.kRebind, destroyRegister, attrs);
            }

            if (attrs.kNgDisabled) {
                var kNgDisabled = attrs.kNgDisabled;
                var isDisabled = scope.$eval(kNgDisabled);
                if (isDisabled) {
                    object.enable(!isDisabled);
                }
                bindToKNgDisabled(object, scope, element, kNgDisabled);
            }

            if (attrs.kNgReadonly) {
                var kNgReadonly = attrs.kNgReadonly;
                var isReadonly = scope.$eval(kNgReadonly);
                if (isReadonly) {
                    object.readonly(isReadonly);
                }
                bindToKNgReadonly(object, scope, element, kNgReadonly);
            }

            // kNgModel is used for the "logical" value
            if (attrs.kNgModel) {
                bindToKNgModel(object, scope, attrs.kNgModel);
            }

            // 2 way binding: ngModel <-> widget.value()
            if (ngModel) {
                bindToNgModel(object, scope, element, ngModel, ngForm);
            }

            if (object) {
                propagateClassToWidgetWrapper(object, element);
            }

            return object;
        }
    }

    function bindToKNgDisabled(widget, scope, element, kNgDisabled) {
        if ((kendo.ui.PanelBar && widget instanceof kendo.ui.PanelBar) || (kendo.ui.Menu && widget instanceof kendo.ui.Menu)) {
            $log.warn("k-ng-disabled specified on a widget that does not have the enable() method: " + (widget.options.name));
            return;
        }
        scope.$apply(function() {
            scope.$watch(kNgDisabled, function(newValue, oldValue) {
                if (newValue != oldValue) {
                    widget.enable(!newValue);
                }
            });
        });
    }

    function bindToKNgReadonly(widget, scope, element, kNgReadonly) {
        if (typeof widget.readonly != "function") {
            $log.warn("k-ng-readonly specified on a widget that does not have the readonly() method: " + (widget.options.name));
            return;
        }
        scope.$apply(function() {
            scope.$watch(kNgReadonly, function(newValue, oldValue) {
                if (newValue != oldValue) {
                    widget.readonly(newValue);
                }
            });
        });

    }

    function exposeWidget(widget, scope, attrs, kendoWidget, origAttr) {
        if (attrs[origAttr]) {
            var set = $parse(attrs[origAttr]).assign;
            if (set) {
                // set the value of the expression to the kendo widget object to expose its api
                set(scope, widget);
            } else {
                throw new Error(origAttr + ' attribute used but expression in it is not assignable: ' + attrs[kendoWidget]);
            }
        }
    }

    function formValue(element) {
        if (/checkbox|radio/i.test(element.attr("type"))) {
            return element.prop("checked");
        }
        return element.val();
    }

    var formRegExp = /^(input|select|textarea)$/i;

    function isForm(element) {
        return formRegExp.test(element[0].tagName);
    }

    function bindToNgModel(widget, scope, element, ngModel, ngForm) {
        if (!widget.value) {
            return;
        }

        var value;

        if (isForm(element)) {
            value = function() {
                return formValue(element);
            };
        } else {
            value = function() {
                return widget.value();
            };
        }

        // Angular will invoke $render when the view needs to be updated with the view value.
        ngModel.$render = function() {
            // Update the widget with the view value.

            // delaying with setTimout for cases where the datasource is set thereafter.
            // https://github.com/kendo-labs/angular-kendo/issues/304
            var val = ngModel.$viewValue;
            if (val === undefined) {
                val = ngModel.$modelValue;
            }

            if (val === undefined) {
                val = null;
            }

            setTimeout(function(){
                if (widget) { // might have been destroyed in between. :-(
                    widget.value(val);
                }
            }, 0);
        };

        // Some widgets trigger "change" on the input field
        // and this would result in two events sent (#135)
        var haveChangeOnElement = false;

        if (isForm(element)) {
            element.on("change", function() {
                haveChangeOnElement = true;
            });
        }

        var onChange = function(pristine) {
            return function() {
                var formPristine;
                if (haveChangeOnElement) {
                    return;
                }
                haveChangeOnElement = false;
                if (pristine && ngForm) {
                    formPristine = ngForm.$pristine;
                }
                ngModel.$setViewValue(value());
                if (pristine) {
                    ngModel.$setPristine();
                    if (formPristine) {
                        ngForm.$setPristine();
                    }
                }
                digest(scope);
            };
        };

        widget.first("change", onChange(false));
		if (!(kendo.ui.AutoComplete && widget instanceof kendo.ui.AutoComplete)) {
			widget.first("dataBound", onChange(true));
		}

        var currentVal = value();

        // if the model value is undefined, then we set the widget value to match ( == null/undefined )
        if (currentVal != ngModel.$viewValue) {
            if (!ngModel.$isEmpty(ngModel.$viewValue)) {
                widget.value(ngModel.$viewValue);
            } else if (currentVal != null && currentVal !== "" && currentVal != ngModel.$viewValue) {
                ngModel.$setViewValue(currentVal);
            }
        }

        ngModel.$setPristine();
    }

    function bindToKNgModel(widget, scope, kNgModel) {
        if (typeof widget.value != "function") {
            $log.warn("k-ng-model specified on a widget that does not have the value() method: " + (widget.options.name));
            return;
        }

        var form  = $(widget.element).parents("form");
        var ngForm = scope[form.attr("name")];
        var getter = $parse(kNgModel);
        var setter = getter.assign;
        var updating = false;

        widget.$angular_setLogicValue(getter(scope));

        // keep in sync
        scope.$apply(function() {
            var watchHandler = function(newValue, oldValue) {
                if (newValue === undefined) {
                    // because widget's value() method usually checks if the new value is undefined,
                    // in which case it returns the current value rather than clearing the field.
                    // https://github.com/telerik/kendo-ui-core/issues/299
                    newValue = null;
                }
                if (updating) {
                    return;
                }
                if (newValue === oldValue) {
                    return;
                }
                widget.$angular_setLogicValue(newValue);
            };
            if (kendo.ui.MultiSelect && widget instanceof kendo.ui.MultiSelect) {
                scope.$watchCollection(kNgModel, watchHandler);
            } else {
                scope.$watch(kNgModel, watchHandler);
            }
        });

        widget.first("change", function(){
            updating = true;

            if (ngForm && ngForm.$pristine) {
                ngForm.$setDirty();
            }

            scope.$apply(function(){
                setter(scope, widget.$angular_getLogicValue());
            });
            updating = false;
        });
    }

    function destroyWidgetOnScopeDestroy(scope, widget) {
        var deregister = scope.$on("$destroy", function() {
            deregister();
            if (widget) {
                if (widget.element) {
                    widget = kendoWidgetInstance(widget.element);
                    if (widget) {
                        widget.destroy();
                    }
                }
                widget = null;
            }
        });

        return deregister;
    }

    // mutation observers - propagate the original
    // element's class to the widget wrapper.
    function propagateClassToWidgetWrapper(widget, element) {
        if (!(window.MutationObserver && widget.wrapper)) {
            return;
        }

        var prevClassList = [].slice.call($(element)[0].classList);

        var mo = new MutationObserver(function(changes){
            suspend();    // make sure we don't trigger a loop
            if (!widget) {
                return;
            }

            changes.forEach(function(chg){
                var w = $(widget.wrapper)[0];
                switch (chg.attributeName) {

                    case "class":
                        // sync classes to the wrapper element
                        var currClassList = [].slice.call(chg.target.classList);
                        currClassList.forEach(function(cls){
                            if (prevClassList.indexOf(cls) < 0) {
                                w.classList.add(cls);
                                if (kendo.ui.ComboBox && widget instanceof kendo.ui.ComboBox) { // https://github.com/kendo-labs/angular-kendo/issues/356
                                    widget.input[0].classList.add(cls);
                                }
                            }
                        });
                        prevClassList.forEach(function(cls){
                            if (currClassList.indexOf(cls) < 0) {
                                w.classList.remove(cls);
                                if (kendo.ui.ComboBox && widget instanceof kendo.ui.ComboBox) { // https://github.com/kendo-labs/angular-kendo/issues/356
                                    widget.input[0].classList.remove(cls);
                                }
                            }
                        });
                        prevClassList = currClassList;
                        break;

                    case "disabled":
                        if (typeof widget.enable == "function") {
                            widget.enable(!$(chg.target).attr("disabled"));
                        }
                        break;

                    case "readonly":
                        if (typeof widget.readonly == "function") {
                            widget.readonly(!!$(chg.target).attr("readonly"));
                        }
                        break;
                }
            });

            resume();
        });

        function suspend() {
            mo.disconnect();
        }

        function resume() {
            mo.observe($(element)[0], { attributes: true });
        }

        resume();
        widget.first("destroy", suspend);
    }

    function setupRebind(widget, scope, element, originalElement, rebindAttr, destroyRegister, attrs) {
        // watch for changes on the expression passed in the k-rebind attribute
        var unregister = scope.$watch(rebindAttr, function(newValue, oldValue) {
            if (newValue !== oldValue) {
                unregister(); // this watcher will be re-added if we compile again!

                /****************************************************************
                // XXX: this is a gross hack that might not even work with all
                // widgets.  we need to destroy the current widget and get its
                // wrapper element out of the DOM, then make the original element
                // visible so we can initialize a new widget on it.
                //
                // kRebind is probably impossible to get right at the moment.
                ****************************************************************/

                var templateOptions = WIDGET_TEMPLATE_OPTIONS[widget.options.name];

                if (templateOptions) {
                    templateOptions.forEach(function(name) {
                        var templateContents = scope.$eval(attrs["k" + name]);

                        if (templateContents) {
                            originalElement.append($(templateContents).attr(kendo.toHyphens("k" + name), ""));
                        }
                    });
                }

                var _wrapper = $(widget.wrapper)[0];
                var _element = $(widget.element)[0];
                var compile = element.injector().get("$compile");
                widget.destroy();

                if (destroyRegister) {
                    destroyRegister();
                }

                widget = null;

                if (_wrapper && _element) {
                    _wrapper.parentNode.replaceChild(_element, _wrapper);
                    $(element).replaceWith(originalElement);
                }

                compile(originalElement)(scope);
            }
        }, true); // watch for object equality. Use native or simple values.
        digest(scope);
    }

    module.factory('directiveFactory', [ '$compile', function(compile) {
        var KENDO_COUNT = 0;
        var RENDERED = false;

        // caching $compile for the dirty hack upstairs. This is awful, but we happen to have elements outside of the bootstrapped root :(.
        $defaultCompile = compile;

        var create = function(role, origAttr) {

            return {
                // Parse the directive for attributes and classes
                restrict: "AC",
                require: [ "?ngModel", "^?form" ],
                scope: false,

                controller: [ '$scope', '$attrs', '$element', function($scope, $attrs, $element) {
                    var that = this;
                    that.template = function(key, value) {
                        $attrs[key] = kendo.stringify(value);
                    };

                    $scope.$on("$destroy", function() {
                        that.template = null;
                        that = null;
                    });
                }],

                link: function(scope, element, attrs, controllers) {
                    var $element = $(element);

                    // we must remove data-kendo-widget-name attribute because
                    // it breaks kendo.widgetInstance; can generate all kinds
                    // of funny issues like
                    //
                    //   https://github.com/kendo-labs/angular-kendo/issues/167
                    //
                    // but we still keep the attribute without the
                    // `data-` prefix, so k-rebind would work.
                    var roleattr = role.replace(/([A-Z])/g, "-$1");
                    var isVisible = $element.css("visibility") !== "hidden";

                    $element.attr(roleattr, $element.attr("data-" + roleattr));
                    $element[0].removeAttribute("data-" + roleattr);

                    if (isVisible) {
                        $element.css("visibility", "hidden");
                    }

                    ++KENDO_COUNT;

                    $timeout(function() {
                        if (isVisible) {
                            $element.css("visibility", "");
                        }
                        var widget = createWidget(scope, element, attrs, role, origAttr, controllers);

                        if (!widget) {
                            return;
                        }

                        --KENDO_COUNT;
                        if (KENDO_COUNT === 0) {
                            scope.$emit("kendoRendered");
                            if (!RENDERED) {
                                RENDERED = true;
                                $("form").each(function(){
                                    var form = $(this).controller("form");
                                    if (form) {
                                        form.$setPristine();
                                    }
                                });
                            }
                        }
                    });
                }
            };
        };

        return {
            create: create
        };
    }]);

    var TAGNAMES = {
        Editor         : "textarea",
        NumericTextBox : "input",
        DatePicker     : "input",
        DateTimePicker : "input",
        TimePicker     : "input",
        AutoComplete   : "input",
        ColorPicker    : "input",
        MaskedTextBox  : "input",
        MultiSelect    : "input",
        Upload         : "input",
        Validator      : "form",
        Button         : "button",
        MobileButton        : "a",
        MobileBackButton    : "a",
        MobileDetailButton  : "a",
        ListView       : "ul",
        MobileListView : "ul",
        TreeView       : "ul",
        Menu           : "ul",
        ContextMenu    : "ul",
        ActionSheet    : "ul"
    };

    var SKIP_SHORTCUTS = [
        'MobileView',
        'MobileLayout',
        'MobileSplitView',
        'MobilePane',
        'MobileModalView'
    ];

    var MANUAL_DIRECTIVES = [
        'MobileApplication',
        'MobileView',
        'MobileModalView',
        'MobileLayout',
        'MobileActionSheet',
        'MobileDrawer',
        'MobileSplitView',
        'MobilePane',
        'MobileScrollView',
        'MobilePopOver'
    ];

    angular.forEach(['MobileNavBar', 'MobileButton', 'MobileBackButton', 'MobileDetailButton', 'MobileTabStrip', 'MobileScrollView', 'MobileScroller'], function(widget) {
        MANUAL_DIRECTIVES.push(widget);
        widget = "kendo" + widget;
        module.directive(widget, function() {
            return {
                restrict: "A",
                link: function(scope, element, attrs, controllers) {
                    createWidget(scope, element, attrs, widget, widget);
                }
            };
        });
    });

    function createDirectives(klass, isMobile) {
        function make(directiveName, widgetName) {
            module.directive(directiveName, [
                "directiveFactory",
                function(directiveFactory) {
                    return directiveFactory.create(widgetName, directiveName);
                }
            ]);
        }

        var name = isMobile ? "Mobile" : "";
        name += klass.fn.options.name;

        var className = name;
        var shortcut = "kendo" + name.charAt(0) + name.substr(1).toLowerCase();
        name = "kendo" + name;

        // <kendo-numerictextbox>-type directives
        var dashed = name.replace(/([A-Z])/g, "-$1");

        if (SKIP_SHORTCUTS.indexOf(name.replace("kendo", "")) == -1) {
            var names = name === shortcut ? [ name ] : [ name, shortcut ];
            angular.forEach(names, function(directiveName) {
                module.directive(directiveName, function(){
                    return {
                        restrict : "E",
                        replace  : true,
                        template : function(element, attributes) {
                            var tag = TAGNAMES[className] || "div";
                            var scopeField = attributes.kScopeField;

                            return "<" + tag + " " + dashed + (scopeField ? ('="' + scopeField + '"') : "") + ">" + element.html() + "</" + tag + ">";
                        }
                    };
                });
            });
        }

        if (MANUAL_DIRECTIVES.indexOf(name.replace("kendo", "")) > -1) {
            return;
        }

        // here name should be like kendoMobileListView so kendo-mobile-list-view works,
        // and shortcut like kendoMobilelistview, for kendo-mobilelistview

        make(name, name);
        if (shortcut != name) {
            make(shortcut, name);
        }

    }

    (function(){
        function doAll(isMobile) {
            return function(namespace) {
                angular.forEach(namespace, function(value) {
                    if (value.fn && value.fn.options && value.fn.options.name && (/^[A-Z]/).test(value.fn.options.name)) {
                        createDirectives(value, isMobile);
                    }
                });
            };
        }
        angular.forEach([ kendo.ui, kendo.dataviz && kendo.dataviz.ui ], doAll(false));
        angular.forEach([ kendo.mobile && kendo.mobile.ui ], doAll(true));
    })();

    /* -----[ utils ]----- */

    function kendoWidgetInstance(el) {
        el = $(el);
        return kendo.widgetInstance(el, kendo.ui) ||
            kendo.widgetInstance(el, kendo.mobile.ui) ||
            kendo.widgetInstance(el, kendo.dataviz.ui);
    }

    function digest(scope, func) {
        var root = scope.$root || scope;
        var isDigesting = /^\$(digest|apply)$/.test(root.$$phase);
        if (func) {
            if (isDigesting) {
                func();
            } else {
                root.$apply(func);
            }
        } else if (!isDigesting) {
            root.$digest();
        }
    }

    function destroyScope(scope, el) {
        scope.$destroy();
        if (el) {
            // prevent leaks. https://github.com/kendo-labs/angular-kendo/issues/237
            $(el)
                .removeData("$scope")
                .removeData("$$kendoScope")
                .removeData("$isolateScope")
                .removeData("$isolateScopeNoTemplate")
                .removeClass("ng-scope");
        }
    }

    var pendingPatches = [];

    // defadvice will patch a class' method with another function.  That
    // function will be called in a context containing `next` (to call
    // the next method) and `object` (a reference to the original
    // object).
    function defadvice(klass, methodName, func) {
        if ($.isArray(klass)) {
            return angular.forEach(klass, function(klass){
                defadvice(klass, methodName, func);
            });
        }
        if (typeof klass == "string") {
            var a = klass.split(".");
            var x = kendo;
            while (x && a.length > 0) {
                x = x[a.shift()];
            }
            if (!x) {
                pendingPatches.push([ klass, methodName, func ]);
                return false;
            }
            klass = x.prototype;
        }
        var origMethod = klass[methodName];
        klass[methodName] = function() {
            var self = this, args = arguments;
            return func.apply({
                self: self,
                next: function() {
                    return origMethod.apply(self, arguments.length > 0 ? arguments : args);
                }
            }, args);
        };
        return true;
    }

    defadvice(kendo.ui, "plugin", function(klass, register, prefix){
        this.next();
        pendingPatches = $.grep(pendingPatches, function(args){
            return !defadvice.apply(null, args);
        });
        createDirectives(klass, prefix == "Mobile");
    });

    /* -----[ Customize widgets for Angular ]----- */

    defadvice([ "ui.Widget", "mobile.ui.Widget" ], "angular", function(cmd, arg){
        var self = this.self;
        if (cmd == "init") {
            // `arg` here should be the widget options.
            // the Chart doesn't send the options to Widget::init in constructor
            // hence the OPTIONS_NOW hack (initialized in createWidget).
            if (!arg && OPTIONS_NOW) {
                arg = OPTIONS_NOW;
            }
            OPTIONS_NOW = null;
            if (arg && arg.$angular) {
                self.$angular_scope = arg.$angular[0];
                self.$angular_init(self.element, arg);
            }
            return;
        }

        var scope = self.$angular_scope;

        if (scope) {
            withoutTimeout(function(){
                var x = arg(), elements = x.elements, data = x.data;
                if (elements.length > 0) {
                    switch (cmd) {

                      case "cleanup":
                        angular.forEach(elements, function(el){
                            var itemScope = $(el).data("$$kendoScope");

                            if (itemScope && itemScope !== scope && itemScope.$$kendoScope) {
                                destroyScope(itemScope, el);
                            }
                        });
                        break;

                      case "compile":
                        var injector = self.element.injector();
                        // gross gross gross hack :(. Works for popups that may be out of the ng-app directive.
                        // they don't have injectors. Same thing happens in our tests, too.
                        var compile = injector ? injector.get("$compile") : $defaultCompile;

                        angular.forEach(elements, function(el, i){
                            var itemScope;
                            if (x.scopeFrom) {
                                itemScope = x.scopeFrom;
                            } else {
                                var vars = data && data[i];
                                if (vars !== undefined) {
                                    itemScope = $.extend(scope.$new(), vars);
                                    itemScope.$$kendoScope = true;
                                } else {
                                    itemScope = scope;
                                }
                            }

                            $(el).data("$$kendoScope", itemScope);
                            compile(el)(itemScope);
                        });
                        digest(scope);
                        break;
                    }
                }
            });
        }
    });

    defadvice("ui.Widget", "$angular_getLogicValue", function(){
        return this.self.value();
    });

    defadvice("ui.Widget", "$angular_setLogicValue", function(val){
        this.self.value(val);
    });

    defadvice("ui.Select", "$angular_getLogicValue", function(){
        var item = this.self.dataItem(),
            valueField = this.self.options.dataValueField;

        if (item) {
            if (this.self.options.valuePrimitive) {
                if (!!valueField) {
                    return item[valueField];
                } else {
                    return item;
                }
            } else {
                return item.toJSON();
            }
        } else {
            return null;
        }
    });

    defadvice("ui.Select", "$angular_setLogicValue", function(val){
        var self = this.self;
        var options = self.options;
        var valueField = options.dataValueField;
        var text = options.text || "";

        if (val === undefined) {
            val = "";
        }

        if (valueField && !options.valuePrimitive && val) {
            text = val[options.dataTextField] || "";
            val = val[valueField || options.dataTextField];
        }

        if (self.options.autoBind === false && !self.listView.isBound()) {
            if (!text && val && options.valuePrimitive) {
                self.value(val);
            } else {
                self._preselect(val, text);
            }
        } else {
            self.value(val);
        }
    });

    defadvice("ui.MultiSelect", "$angular_getLogicValue", function() {
        var value = this.self.dataItems().slice(0);
        var valueField = this.self.options.dataValueField;

        if (valueField && this.self.options.valuePrimitive) {
            value = $.map(value, function(item) {
                return item[valueField];
            });
        }

        return value;
    });

    defadvice("ui.MultiSelect", "$angular_setLogicValue", function(val){
        if (val == null) {
            val = [];
        }

        var self = this.self;
        var options = self.options;
        var valueField = options.dataValueField;
        var data = val;

        if (valueField && !options.valuePrimitive) {
            val = $.map(val, function(item) {
                return item[valueField];
            });
        }

        if (options.autoBind === false && !options.valuePrimitive && !self.listView.isBound()) {
            self._preselect(data, val);
        } else {
            self.value(val);
        }
    });

    defadvice("ui.AutoComplete", "$angular_getLogicValue", function(){
        var options = this.self.options;

        var values = this.self.value().split(options.separator);
        var valuePrimitive = options.valuePrimitive;
        var data = this.self.dataSource.data();
        var dataItems = [];
        for (var idx = 0, length = data.length; idx < length; idx++) {
            var item = data[idx];
            var dataValue = options.dataTextField ? item[options.dataTextField] : item;
            for (var j = 0; j < values.length; j++) {
                if (dataValue === values[j]) {
                    if (valuePrimitive) {
                        dataItems.push(dataValue);
                    } else {
                        dataItems.push(item.toJSON());
                    }

                    break;
                }
            }
        }

        return dataItems;
    });

    defadvice("ui.AutoComplete", "$angular_setLogicValue", function(value) {
        if (value == null) {
            value = [];
        }

        var self = this.self,
            dataTextField = self.options.dataTextField;

        if (dataTextField && !self.options.valuePrimitive) {
            value = $.map(value, function(item){
                return item[dataTextField];
            });
        }

        self.value(value);
    });

    // All event handlers that are strings are compiled the Angular way.
    defadvice("ui.Widget", "$angular_init", function(element, options) {
        var self = this.self;
        if (options && !$.isArray(options)) {
            var scope = self.$angular_scope;
            for (var i = self.events.length; --i >= 0;) {
                var event = self.events[i];
                var handler = options[event];
                if (handler && typeof handler == "string") {
                    options[event] = self.$angular_makeEventHandler(event, scope, handler);
                }
            }
        }
    });

    // most handers will only contain a kendoEvent in the scope.
    defadvice("ui.Widget", "$angular_makeEventHandler", function(event, scope, handler){
        handler = $parse(handler);
        return function(e) {
            digest(scope, function() {
                handler(scope, { kendoEvent: e });
            });
        };
    });

    // for the Grid and ListView we add `data` and `selected` too.
    defadvice([ "ui.Grid", "ui.ListView", "ui.TreeView" ], "$angular_makeEventHandler", function(event, scope, handler){
        if (event != "change") {
            return this.next();
        }
        handler = $parse(handler);
        return function(ev) {
            var widget = ev.sender;
            var options = widget.options;
            var cell, multiple, locals = { kendoEvent: ev }, elems, items, columns, colIdx;

            if (angular.isString(options.selectable)) {
                cell = options.selectable.indexOf('cell') !== -1;
                multiple = options.selectable.indexOf('multiple') !== -1;
            }

            elems = locals.selected = this.select();
            items = locals.data = [];
            columns = locals.columns = [];
            for (var i = 0; i < elems.length; i++) {
                var item = cell ? elems[i].parentNode : elems[i];
                var dataItem = widget.dataItem(item);
                if (cell) {
                    if (angular.element.inArray(dataItem, items) < 0) {
                        items.push(dataItem);
                    }
                    colIdx = angular.element(elems[i]).index();
                    if (angular.element.inArray(colIdx, columns) < 0 ) {
                        columns.push(colIdx);
                    }
                } else {
                    items.push(dataItem);
                }
            }

            if (!multiple) {
                locals.dataItem = locals.data = items[0];
                locals.selected = elems[0];
            }

            digest(scope, function() {
                handler(scope, locals);
            });
        };
    });

    // If no `template` is supplied for Grid columns, provide an Angular
    // template.  The reason is that in this way AngularJS will take
    // care to update the view as the data in scope changes.
    defadvice("ui.Grid", "$angular_init", function(element, options){
        this.next();
        if (options.columns) {
            var settings = $.extend({}, kendo.Template, options.templateSettings);
            angular.forEach(options.columns, function(col){
                if (col.field && !col.template && !col.format && !col.values && (col.encoded === undefined || col.encoded)) {
                    col.template = "<span ng-bind='" +
                        kendo.expr(col.field, "dataItem") + "'>#: " +
                        kendo.expr(col.field, settings.paramName) + "#</span>";
                }
            });
        }
    });

    {
        // mobile/ButtonGroup does not have a "value" method, but looks
        // like it would be useful.  We provide it here.

        defadvice("mobile.ui.ButtonGroup", "value", function(mew){
            var self = this.self;
            if (mew != null) {
                self.select(self.element.children("li.km-button").eq(mew));
                self.trigger("change");
                self.trigger("select", { index: self.selectedIndex });
            }
            return self.selectedIndex;
        });

        defadvice("mobile.ui.ButtonGroup", "_select", function(){
            this.next();
            this.self.trigger("change");
        });
    }

    // mobile directives
    module
    .directive('kendoMobileApplication', function() {
        return {
            terminal: true,
            link: function(scope, element, attrs, controllers) {
                createWidget(scope, element, attrs, 'kendoMobileApplication', 'kendoMobileApplication');
            }
        };
    }).directive('kendoMobileView', function() {
        return {
            scope: true,
            link: {
                pre: function(scope, element, attrs, controllers) {
                    attrs.defaultOptions = scope.viewOptions;
                    attrs._instance = createWidget(scope, element, attrs, 'kendoMobileView', 'kendoMobileView');
                },

                post: function(scope, element, attrs) {
                    attrs._instance._layout();
                    attrs._instance._scroller();
                }
            }
        };
    }).directive('kendoMobileDrawer', function() {
        return {
            scope: true,
            link: {
                pre: function(scope, element, attrs, controllers) {
                    attrs.defaultOptions = scope.viewOptions;
                    attrs._instance = createWidget(scope, element, attrs, 'kendoMobileDrawer', 'kendoMobileDrawer');
                },

                post: function(scope, element, attrs) {
                    attrs._instance._layout();
                    attrs._instance._scroller();
                }
            }
        };
    }).directive('kendoMobileModalView', function() {
        return {
            scope: true,
            link: {
                pre: function(scope, element, attrs, controllers) {
                    attrs.defaultOptions = scope.viewOptions;
                    attrs._instance = createWidget(scope, element, attrs, 'kendoMobileModalView', 'kendoMobileModalView');
                },

                post: function(scope, element, attrs) {
                    attrs._instance._layout();
                    attrs._instance._scroller();
                }
            }
        };
    }).directive('kendoMobileSplitView', function() {
        return {
            terminal: true,
            link: {
                pre: function(scope, element, attrs, controllers) {
                    attrs.defaultOptions = scope.viewOptions;
                    attrs._instance = createWidget(scope, element, attrs, 'kendoMobileSplitView', 'kendoMobileSplitView');
                },

                post: function(scope, element, attrs) {
                    attrs._instance._layout();
                }
            }
        };
    }).directive('kendoMobilePane', function() {
        return {
            terminal: true,
            link: {
                pre: function(scope, element, attrs, controllers) {
                    attrs.defaultOptions = scope.viewOptions;
                    createWidget(scope, element, attrs, 'kendoMobilePane', 'kendoMobilePane');
                }
            }
        };
    }).directive('kendoMobileLayout', function() {
        return {
            link: {
                pre: function (scope, element, attrs, controllers) {
                    createWidget(scope, element, attrs, 'kendoMobileLayout', 'kendoMobileLayout');
                }
            }
        };
    }).directive('kendoMobileActionSheet', function() {
        return {
            restrict: "A",
            link: function(scope, element, attrs, controllers) {
                element.find("a[k-action]").each(function() {
                    $(this).attr("data-" + kendo.ns + "action", $(this).attr("k-action"));
                });

                createWidget(scope, element, attrs, 'kendoMobileActionSheet', 'kendoMobileActionSheet');
            }
        };
    }).directive('kendoMobilePopOver', function() {
        return {
            terminal: true,
            link: {
                pre: function(scope, element, attrs, controllers) {
                    attrs.defaultOptions = scope.viewOptions;
                    createWidget(scope, element, attrs, 'kendoMobilePopOver', 'kendoMobilePopOver');
                }
            }
        };
    }).directive('kendoViewTitle', function(){
        return {
            restrict : "E",
            replace  : true,
            template : function(element, attributes) {
                return "<span data-" + kendo.ns + "role='view-title'>" + element.html() + "</span>";
            }
        };
    }).directive('kendoMobileHeader', function() {
            return {
                restrict: "E",
                link: function(scope, element, attrs, controllers) {
                    element.addClass("km-header").attr("data-role", "header");
                }
            };
    }).directive('kendoMobileFooter', function() {
            return {
                restrict: 'E',
                link: function(scope, element, attrs, controllers) {
                    element.addClass("km-footer").attr("data-role", "footer");
                }
            };
    }).directive('kendoMobileScrollViewPage', function(){
        return {
            restrict : "E",
            replace  : true,
            template : function(element, attributes) {
                return "<div data-" + kendo.ns + "role='page'>" + element.html() + "</div>";
            }
        };
    });

    angular.forEach(['align', 'icon', 'rel', 'transition', 'actionsheetContext'], function(attr) {
          var kAttr = "k" + attr.slice(0, 1).toUpperCase() + attr.slice(1);

          module.directive(kAttr, function() {
              return {
                  restrict: 'A',
                  priority: 2,
                  link: function(scope, element, attrs) {
                      element.attr(kendo.attr(kendo.toHyphens(attr)), scope.$eval(attrs[kAttr]));
                  }
              };
          });
    });

    var WIDGET_TEMPLATE_OPTIONS = {
        "TreeMap": [ "Template" ],
        "MobileListView": [ "HeaderTemplate", "Template" ],
        "MobileScrollView": [ "EmptyTemplate", "Template" ],
        "Grid": [ "AltRowTemplate", "DetailTemplate", "RowTemplate" ],
        "ListView": [ "EditTemplate", "Template", "AltTemplate" ],
        "Pager": [ "SelectTemplate", "LinkTemplate" ],
        "PivotGrid": [ "ColumnHeaderTemplate", "DataCellTemplate", "RowHeaderTemplate" ],
        "Scheduler": [ "AllDayEventTemplate", "DateHeaderTemplate", "EventTemplate", "MajorTimeHeaderTemplate", "MinorTimeHeaderTemplate" ],
        "TreeView": [ "Template" ],
        "Validator": [ "ErrorTemplate" ]
    };

    (function() {
        var templateDirectives = {};
        angular.forEach(WIDGET_TEMPLATE_OPTIONS, function(templates, widget) {
            angular.forEach(templates, function(template) {
                if (!templateDirectives[template]) {
                    templateDirectives[template] = [ ];
                }
                templateDirectives[template].push("?^^kendo" + widget);
            });
        });

        angular.forEach(templateDirectives, function(parents, directive) {
            var templateName = "k" + directive;
            var attrName = kendo.toHyphens(templateName);

            module.directive(templateName, function() {
                return {
                    restrict: "A",
                    require: parents,
                    terminal: true,
                    compile: function($element, $attrs) {
                        if ($attrs[templateName] !== "") {
                            return;
                        }

                        $element.removeAttr(attrName);
                        var template = $element[0].outerHTML;

                        return function(scope, element, attrs, controllers) {
                            var controller;

                            while(!controller && controllers.length) {
                                controller = controllers.shift();
                            }

                            if (!controller) {
                                $log.warn(attrName + " without a matching parent widget found. It can be one of the following: " + parents.join(", "));
                            } else {
                                controller.template(templateName, template);
                                $element.remove();
                            }
                        };
                    }
                };
            });
        });

    })();


})(window.kendo.jQuery, window.angular);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
