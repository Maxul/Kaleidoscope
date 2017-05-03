(function(ctx) {
    var sprintf = function() {
        if (!sprintf.cache.hasOwnProperty(arguments[0])) {
            sprintf.cache[arguments[0]] = sprintf.parse(arguments[0])
        }
        return sprintf.format.call(null, sprintf.cache[arguments[0]], arguments)
    };
    sprintf.format = function(parse_tree, argv) {
        var cursor = 1,
            tree_length = parse_tree.length,
            node_type = "",
            arg, output = [],
            i, k, match, pad, pad_character, pad_length;
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i]);
            if (node_type === "string") {
                output.push(parse_tree[i])
            } else if (node_type === "array") {
                match = parse_tree[i];
                if (match[2]) {
                    arg = argv[cursor];
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw sprintf('[sprintf] property "%s" does not exist', match[2][k])
                        }
                        arg = arg[match[2][k]]
                    }
                } else if (match[1]) {
                    arg = argv[match[1]]
                } else {
                    arg = argv[cursor++]
                }
                if (/[^s]/.test(match[8]) && get_type(arg) != "number") {
                    throw sprintf("[sprintf] expecting number but found %s", get_type(arg))
                }
                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2);
                        break;
                    case "c":
                        arg = String.fromCharCode(arg);
                        break;
                    case "d":
                        arg = parseInt(arg, 10);
                        break;
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential();
                        break;
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
                        break;
                    case "o":
                        arg = arg.toString(8);
                        break;
                    case "s":
                        arg = (arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg;
                        break;
                    case "u":
                        arg = arg >>> 0;
                        break;
                    case "x":
                        arg = arg.toString(16);
                        break;
                    case "X":
                        arg = arg.toString(16).toUpperCase();
                        break
                }
                arg = /[def]/.test(match[8]) && match[3] && arg >= 0 ? "+" + arg : arg;
                pad_character = match[4] ? match[4] == "0" ? "0" : match[4].charAt(1) : " ";
                pad_length = match[6] - String(arg).length;
                pad = match[6] ? str_repeat(pad_character, pad_length) : "";
                output.push(match[5] ? arg + pad : pad + arg)
            }
        }
        return output.join("")
    };
    sprintf.cache = {};
    sprintf.parse = function(fmt) {
        var _fmt = fmt,
            match = [],
            parse_tree = [],
            arg_names = 0;
        while (_fmt) {
            if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
                parse_tree.push(match[0])
            } else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
                parse_tree.push("%")
            } else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [],
                        replacement_field = match[2],
                        field_match = [];
                    if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1]);
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            } else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            } else {
                                throw "[sprintf] huh?"
                            }
                        }
                    } else {
                        throw "[sprintf] huh?"
                    }
                    match[2] = field_list
                } else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw "[sprintf] mixing positional and named placeholders is not (yet) supported"
                }
                parse_tree.push(match)
            } else {
                throw "[sprintf] huh?"
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return parse_tree
    };
    var vsprintf = function(fmt, argv, _argv) {
        _argv = argv.slice(0);
        _argv.splice(0, 0, fmt);
        return sprintf.apply(null, _argv)
    };

    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        for (var output = []; multiplier > 0; output[--multiplier] = input) {}
        return output.join("")
    }
    ctx.sprintf = sprintf;
    ctx.vsprintf = vsprintf
})(typeof exports != "undefined" ? exports : window);
(function($, undefined) {
    "use strict";
    $.omap = function(o, fn) {
        var result = {};
        $.each(o, function(k, v) {
            result[k] = fn.call(o, k, v)
        });
        return result
    };
    var Clone = {
        clone_object: function(object) {
            var tmp = {};
            if (typeof object == "object") {
                if ($.isArray(object)) {
                    return this.clone_array(object)
                } else if (object === null) {
                    return object
                } else {
                    for (var key in object) {
                        if ($.isArray(object[key])) {
                            tmp[key] = this.clone_array(object[key])
                        } else if (typeof object[key] == "object") {
                            tmp[key] = this.clone_object(object[key])
                        } else {
                            tmp[key] = object[key]
                        }
                    }
                }
            }
            return tmp
        },
        clone_array: function(array) {
            if (!$.isFunction(Array.prototype.map)) {
                throw new Error("You'r browser don't support ES5 array map " + "use es5-shim")
            }
            return array.slice(0).map(function(item) {
                if (typeof item == "object") {
                    return this.clone_object(item)
                } else {
                    return item
                }
            }.bind(this))
        }
    };
    var clone = function(object) {
        return Clone.clone_object(object)
    };
    var isLS = typeof window.localStorage !== "undefined";

    function wls(n, v) {
        var c;
        if (typeof n === "string" && typeof v === "string") {
            localStorage[n] = v;
            return true
        } else if (typeof n === "object" && typeof v === "undefined") {
            for (c in n) {
                if (n.hasOwnProperty(c)) {
                    localStorage[c] = n[c]
                }
            }
            return true
        }
        return false
    }

    function wc(n, v) {
        var dt, e, c;
        dt = new Date;
        dt.setTime(dt.getTime() + 31536e6);
        e = "; expires=" + dt.toGMTString();
        if (typeof n === "string" && typeof v === "string") {
            document.cookie = n + "=" + v + e + "; path=/";
            return true
        } else if (typeof n === "object" && typeof v === "undefined") {
            for (c in n) {
                if (n.hasOwnProperty(c)) {
                    document.cookie = c + "=" + n[c] + e + "; path=/"
                }
            }
            return true
        }
        return false
    }

    function rls(n) {
        return localStorage[n]
    }

    function rc(n) {
        var nn, ca, i, c;
        nn = n + "=";
        ca = document.cookie.split(";");
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1, c.length)
            }
            if (c.indexOf(nn) === 0) {
                return c.substring(nn.length, c.length)
            }
        }
        return null
    }

    function dls(n) {
        return delete localStorage[n]
    }

    function dc(n) {
        return wc(n, "", -1)
    }
    $.extend({
        Storage: {
            set: isLS ? wls : wc,
            get: isLS ? rls : rc,
            remove: isLS ? dls : dc
        }
    });
    jQuery.fn.extend({
        everyTime: function(interval, label, fn, times, belay) {
            return this.each(function() {
                jQuery.timer.add(this, interval, label, fn, times, belay)
            })
        },
        oneTime: function(interval, label, fn) {
            return this.each(function() {
                jQuery.timer.add(this, interval, label, fn, 1)
            })
        },
        stopTime: function(label, fn) {
            return this.each(function() {
                jQuery.timer.remove(this, label, fn)
            })
        }
    });
    jQuery.extend({
        timer: {
            guid: 1,
            global: {},
            regex: /^([0-9]+)\s*(.*s)?$/,
            powers: {
                ms: 1,
                cs: 10,
                ds: 100,
                s: 1e3,
                das: 1e4,
                hs: 1e5,
                ks: 1e6
            },
            timeParse: function(value) {
                if (value === undefined || value === null) {
                    return null
                }
                var result = this.regex.exec(jQuery.trim(value.toString()));
                if (result[2]) {
                    var num = parseInt(result[1], 10);
                    var mult = this.powers[result[2]] || 1;
                    return num * mult
                } else {
                    return value
                }
            },
            add: function(element, interval, label, fn, times, belay) {
                var counter = 0;
                if (jQuery.isFunction(label)) {
                    if (!times) {
                        times = fn
                    }
                    fn = label;
                    label = interval
                }
                interval = jQuery.timer.timeParse(interval);
                if (typeof interval !== "number" || isNaN(interval) || interval <= 0) {
                    return
                }
                if (times && times.constructor !== Number) {
                    belay = !!times;
                    times = 0
                }
                times = times || 0;
                belay = belay || false;
                if (!element.$timers) {
                    element.$timers = {}
                }
                if (!element.$timers[label]) {
                    element.$timers[label] = {}
                }
                fn.$timerID = fn.$timerID || this.guid++;
                var handler = function() {
                    if (belay && handler.inProgress) {
                        return
                    }
                    handler.inProgress = true;
                    if (++counter > times && times !== 0 || fn.call(element, counter) === false) {
                        jQuery.timer.remove(element, label, fn)
                    }
                    handler.inProgress = false
                };
                handler.$timerID = fn.$timerID;
                if (!element.$timers[label][fn.$timerID]) {
                    element.$timers[label][fn.$timerID] = window.setInterval(handler, interval)
                }
                if (!this.global[label]) {
                    this.global[label] = []
                }
                this.global[label].push(element)
            },
            remove: function(element, label, fn) {
                var timers = element.$timers,
                    ret;
                if (timers) {
                    if (!label) {
                        for (var lab in timers) {
                            if (timers.hasOwnProperty(lab)) {
                                this.remove(element, lab, fn)
                            }
                        }
                    } else if (timers[label]) {
                        if (fn) {
                            if (fn.$timerID) {
                                window.clearInterval(timers[label][fn.$timerID]);
                                delete timers[label][fn.$timerID]
                            }
                        } else {
                            for (var _fn in timers[label]) {
                                if (timers[label].hasOwnProperty(_fn)) {
                                    window.clearInterval(timers[label][_fn]);
                                    delete timers[label][_fn]
                                }
                            }
                        }
                        for (ret in timers[label]) {
                            if (timers[label].hasOwnProperty(ret)) {
                                break
                            }
                        }
                        if (!ret) {
                            ret = null;
                            delete timers[label]
                        }
                    }
                    for (ret in timers) {
                        if (timers.hasOwnProperty(ret)) {
                            break
                        }
                    }
                    if (!ret) {
                        element.$timers = null
                    }
                }
            }
        }
    });
    if (/(msie) ([\w.]+)/.exec(navigator.userAgent.toLowerCase())) {
        jQuery(window).one("unload", function() {
            var global = jQuery.timer.global;
            for (var label in global) {
                if (global.hasOwnProperty(label)) {
                    var els = global[label],
                        i = els.length;
                    while (--i) {
                        jQuery.timer.remove(els[i], label)
                    }
                }
            }
        })
    }(function(undef) {
        if (!String.prototype.split.toString().match(/\[native/)) {
            return
        }
        var nativeSplit = String.prototype.split,
            compliantExecNpcg = /()??/.exec("")[1] === undef,
            self;
        self = function(str, separator, limit) {
            if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
                return nativeSplit.call(str, separator, limit)
            }
            var output = [],
                flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + (separator.sticky ? "y" : ""),
                lastLastIndex = 0,
                separator2, match, lastIndex, lastLength;
            separator = new RegExp(separator.source, flags + "g");
            str += "";
            if (!compliantExecNpcg) {
                separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags)
            }
            limit = limit === undef ? -1 >>> 0 : limit >>> 0;
            while (match = separator.exec(str)) {
                lastIndex = match.index + match[0].length;
                if (lastIndex > lastLastIndex) {
                    output.push(str.slice(lastLastIndex, match.index));
                    if (!compliantExecNpcg && match.length > 1) {
                        match[0].replace(separator2, function() {
                            for (var i = 1; i < arguments.length - 2; i++) {
                                if (arguments[i] === undef) {
                                    match[i] = undef
                                }
                            }
                        })
                    }
                    if (match.length > 1 && match.index < str.length) {
                        Array.prototype.push.apply(output, match.slice(1))
                    }
                    lastLength = match[0].length;
                    lastLastIndex = lastIndex;
                    if (output.length >= limit) {
                        break
                    }
                }
                if (separator.lastIndex === match.index) {
                    separator.lastIndex++
                }
            }
            if (lastLastIndex === str.length) {
                if (lastLength || !separator.test("")) {
                    output.push("")
                }
            } else {
                output.push(str.slice(lastLastIndex))
            }
            return output.length > limit ? output.slice(0, limit) : output
        };
        String.prototype.split = function(separator, limit) {
            return self(this, separator, limit)
        };
        return self
    })();
    $.fn.caret = function(pos) {
        var target = this[0];
        var isContentEditable = target.contentEditable === "true";
        if (arguments.length == 0) {
            if (window.getSelection) {
                if (isContentEditable) {
                    target.focus();
                    var range1 = window.getSelection().getRangeAt(0),
                        range2 = range1.cloneRange();
                    range2.selectNodeContents(target);
                    range2.setEnd(range1.endContainer, range1.endOffset);
                    return range2.toString().length
                }
                return target.selectionStart
            }
            if (document.selection) {
                target.focus();
                if (isContentEditable) {
                    var range1 = document.selection.createRange(),
                        range2 = document.body.createTextRange();
                    range2.moveToElementText(target);
                    range2.setEndPoint("EndToEnd", range1);
                    return range2.text.length
                }
                var pos = 0,
                    range = target.createTextRange(),
                    range2 = document.selection.createRange().duplicate(),
                    bookmark = range2.getBookmark();
                range.moveToBookmark(bookmark);
                while (range.moveStart("character", -1) !== 0) pos++;
                return pos
            }
            return 0
        }
        if (pos == -1) pos = this[isContentEditable ? "text" : "val"]().length;
        if (window.getSelection) {
            if (isContentEditable) {
                target.focus();
                window.getSelection().collapse(target.firstChild, pos)
            } else target.setSelectionRange(pos, pos)
        } else if (document.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(target);
            range.moveStart("character", pos);
            range.collapse(true);
            range.select()
        }
        if (!isContentEditable) target.focus();
        return pos
    };

    function str_parts(str, length) {
        var result = [];
        var len = str.length;
        if (len < length) {
            return [str]
        } else if (length < 0) {
            throw new Error("str_parts: length can't be negative")
        }
        for (var i = 0; i < len; i += length) {
            result.push(str.substring(i, i + length))
        }
        return result
    }

    function Cycle(init) {
        var data = init ? [init] : [];
        var pos = 0;
        $.extend(this, {
            get: function() {
                return data
            },
            rotate: function() {
                if (data.length === 1) {
                    return data[0]
                } else {
                    if (pos === data.length - 1) {
                        pos = 0
                    } else {
                        ++pos
                    }
                    return data[pos]
                }
            },
            length: function() {
                return data.length
            },
            remove: function(index) {
                data.splice(index, 1)
            },
            set: function(item) {
                for (var i = data.length; i--;) {
                    if (data[i] === item) {
                        pos = i;
                        return
                    }
                }
                this.append(item)
            },
            front: function() {
                return data[pos]
            },
            append: function(item) {
                data.push(item)
            }
        })
    }

    function Stack(init) {
        var data = init instanceof Array ? init : init ? [init] : [];
        $.extend(this, {
            map: function(fn) {
                return $.map(data, fn)
            },
            size: function() {
                return data.length
            },
            pop: function() {
                if (data.length === 0) {
                    return null
                } else {
                    var value = data[data.length - 1];
                    data = data.slice(0, data.length - 1);
                    return value
                }
            },
            push: function(value) {
                data = data.concat([value]);
                return value
            },
            top: function() {
                return data.length > 0 ? data[data.length - 1] : null
            },
            clone: function() {
                return new Stack(data.slice(0))
            }
        })
    }
    $.json_stringify = function(object, level) {
        var result = "",
            i;
        level = level === undefined ? 1 : level;
        var type = typeof object;
        switch (type) {
            case "function":
                result += object;
                break;
            case "boolean":
                result += object ? "true" : "false";
                break;
            case "object":
                if (object === null) {
                    result += "null"
                } else if (object instanceof Array) {
                    result += "[";
                    var len = object.length;
                    for (i = 0; i < len - 1; ++i) {
                        result += $.json_stringify(object[i], level + 1)
                    }
                    result += $.json_stringify(object[len - 1], level + 1) + "]"
                } else {
                    result += "{";
                    for (var property in object) {
                        if (object.hasOwnProperty(property)) {
                            result += '"' + property + '":' + $.json_stringify(object[property], level + 1)
                        }
                    }
                    result += "}"
                }
                break;
            case "string":
                var str = object;
                var repl = {
                    "\\\\": "\\\\",
                    '"': '\\"',
                    "/": "\\/",
                    "\\n": "\\n",
                    "\\r": "\\r",
                    "\\t": "\\t"
                };
                for (i in repl) {
                    if (repl.hasOwnProperty(i)) {
                        str = str.replace(new RegExp(i, "g"), repl[i])
                    }
                }
                result += '"' + str + '"';
                break;
            case "number":
                result += String(object);
                break
        }
        result += level > 1 ? "," : "";
        if (level === 1) {
            result = result.replace(/,([\]}])/g, "$1")
        }
        return result.replace(/([\[{]),/g, "$1")
    };

    function History(name, size) {
        var enabled = true;
        var storage_key = "";
        if (typeof name === "string" && name !== "") {
            storage_key = name + "_"
        }
        storage_key += "commands";
        var data = $.Storage.get(storage_key);
        data = data ? $.parseJSON(data) : [];
        var pos = data.length - 1;
        $.extend(this, {
            append: function(item) {
                if (enabled) {
                    if (data[data.length - 1] !== item) {
                        data.push(item);
                        if (size && data.length > size) {
                            data = data.slice(-size)
                        }
                        pos = data.length - 1;
                        $.Storage.set(storage_key, $.json_stringify(data))
                    }
                }
            },
            data: function() {
                return data
            },
            reset: function() {
                pos = data.length - 1
            },
            last: function() {
                return data[length - 1]
            },
            end: function() {
                return pos === data.length - 1
            },
            position: function() {
                return pos
            },
            current: function() {
                return data[pos]
            },
            next: function() {
                if (pos < data.length - 1) {
                    ++pos
                }
                if (pos !== -1) {
                    return data[pos]
                }
            },
            previous: function() {
                var old = pos;
                if (pos > 0) {
                    --pos
                }
                if (old !== -1) {
                    return data[pos]
                }
            },
            clear: function() {
                data = [];
                this.purge()
            },
            enabled: function() {
                return enabled
            },
            enable: function() {
                enabled = true
            },
            purge: function() {
                $.Storage.remove(storage_key)
            },
            disable: function() {
                enabled = false
            }
        })
    }
    var is_paste_supported = function() {
        var el = document.createElement("div");
        el.setAttribute("onpaste", "return;");
        return typeof el.onpaste == "function"
    }();
    var first_cmd = true;
    $.fn.cmd = function(options) {
        var self = this;
        var maybe_data = self.data("cmd");
        if (maybe_data) {
            return maybe_data
        }
        self.addClass("cmd");
        self.append('<span class="prompt"></span><span></span>' + '<span class="cursor">&nbsp;</span><span></span>');
        var clip = $("<textarea />").addClass("clipboard").appendTo(self);
        if (options.width) {
            self.width(options.width)
        }
        var num_chars;
        var prompt_len;
        var prompt_node = self.find(".prompt");
        var reverse_search = false;
        var rev_search_str = "";
        var reverse_search_position = null;
        var backup_prompt;
        var mask = options.mask || false;
        var command = "";
        var last_command;
        var selected_text = "";
        var kill_text = "";
        var position = 0;
        var prompt;
        var enabled;
        var historySize = options.historySize || 60;
        var name, history;
        var cursor = self.find(".cursor");
        var animation;

        function mobile_focus() {
            if (enabled) {
                var foucs = clip.is(":focus");
                if (!foucs) {
                    clip.focus()
                }
            } else {
                if (focus) {
                    clip.blur()
                }
            }
        }

        function fake_mobile_entry() {
            if (is_touch()) {
                self.oneTime(10, function() {
                    clip.val(command);
                    self.oneTime(10, function() {
                        clip.caret(position)
                    })
                })
            }
        }
        if (support_animations() && !is_android()) {
            animation = function(toggle) {
                if (toggle) {
                    cursor.addClass("blink")
                } else {
                    cursor.removeClass("blink")
                }
            }
        } else {
            var animating = false;
            animation = function(toggle) {
                if (toggle && !animating) {
                    animating = true;
                    cursor.addClass("inverted");
                    self.everyTime(500, "blink", blink)
                } else if (animating && !toggle) {
                    animating = false;
                    self.stopTime("blink", blink);
                    cursor.removeClass("inverted")
                }
            }
        }

        function blink(i) {
            cursor.toggleClass("inverted")
        }

        function draw_reverse_prompt() {
            prompt = "(reverse-i-search)`" + rev_search_str + "': ";
            draw_prompt()
        }

        function clear_reverse_state() {
            prompt = backup_prompt;
            reverse_search = false;
            reverse_search_position = null;
            rev_search_str = ""
        }

        function reverse_history_search(next) {
            var history_data = history.data();
            var regex, save_string;
            var len = history_data.length;
            if (next && reverse_search_position > 0) {
                len -= reverse_search_position
            }
            if (rev_search_str.length > 0) {
                for (var j = rev_search_str.length; j > 0; j--) {
                    save_string = rev_search_str.substring(0, j).replace(/([.*+{}\[\]?])/g, "\\$1");
                    regex = new RegExp(save_string);
                    for (var i = len; i--;) {
                        if (regex.test(history_data[i])) {
                            reverse_search_position = history_data.length - i;
                            self.position(0);
                            self.set(history_data[i], true);
                            redraw();
                            if (rev_search_str.length !== j) {
                                rev_search_str = rev_search_str.substring(0, j);
                                draw_reverse_prompt()
                            }
                            return
                        }
                    }
                }
            }
            rev_search_str = ""
        }

        function change_num_chars() {
            var W = self.width();
            var w = cursor.width();
            num_chars = Math.floor(W / w)
        }

        function get_splited_command_line(string) {
            var first = string.substring(0, num_chars - prompt_len);
            var rest = string.substring(num_chars - prompt_len);
            return [first].concat(str_parts(rest, num_chars))
        }
        var redraw = function(self) {
            var before = cursor.prev();
            var after = cursor.next();

            function draw_cursor_line(string, position) {
                var len = string.length;
                if (position === len) {
                    before.html($.terminal.encode(string));
                    cursor.html("&nbsp;");
                    after.html("")
                } else if (position === 0) {
                    before.html("");
                    cursor.html($.terminal.encode(string.slice(0, 1)));
                    after.html($.terminal.encode(string.slice(1)))
                } else {
                    var before_str = string.slice(0, position);
                    before.html($.terminal.encode(before_str));
                    var c = string.slice(position, position + 1);
                    cursor.html($.terminal.encode(c));
                    if (position === string.length - 1) {
                        after.html("")
                    } else {
                        after.html($.terminal.encode(string.slice(position + 1)))
                    }
                }
            }

            function div(string) {
                return "<div>" + $.terminal.encode(string) + "</div>"
            }

            function lines_after(lines) {
                var last_ins = after;
                $.each(lines, function(i, line) {
                    last_ins = $(div(line)).insertAfter(last_ins).addClass("clear")
                })
            }

            function lines_before(lines) {
                $.each(lines, function(i, line) {
                    before.before(div(line))
                })
            }
            var count = 0;
            return function() {
                var string;
                var str;
                switch (typeof mask) {
                    case "boolean":
                        string = mask ? command.replace(/./g, "*") : command;
                        break;
                    case "string":
                        string = command.replace(/./g, mask)
                }
                var i, first_len;
                self.find("div").remove();
                before.html("");
                if (string.length > num_chars - prompt_len - 1 || string.match(/\n/)) {
                    var array;
                    var tabs = string.match(/\t/g);
                    var tabs_rm = tabs ? tabs.length * 3 : 0;
                    if (tabs) {
                        string = string.replace(/\t/g, "\x00\x00\x00\x00")
                    }
                    if (string.match(/\n/)) {
                        var tmp = string.split("\n");
                        first_len = num_chars - prompt_len - 1;
                        for (i = 0; i < tmp.length - 1; ++i) {
                            tmp[i] += " "
                        }
                        if (tmp[0].length > first_len) {
                            array = [tmp[0].substring(0, first_len)];
                            str = tmp[0].substring(first_len);
                            array = array.concat(str_parts(str, num_chars))
                        } else {
                            array = [tmp[0]]
                        }
                        for (i = 1; i < tmp.length; ++i) {
                            if (tmp[i].length > num_chars) {
                                array = array.concat(str_parts(tmp[i], num_chars))
                            } else {
                                array.push(tmp[i])
                            }
                        }
                    } else {
                        array = get_splited_command_line(string)
                    }
                    if (tabs) {
                        array = $.map(array, function(line) {
                            return line.replace(/\x00\x00\x00\x00/g, "	")
                        })
                    }
                    first_len = array[0].length;
                    if (first_len === 0 && array.length === 1) {} else if (position < first_len) {
                        draw_cursor_line(array[0], position);
                        lines_after(array.slice(1))
                    } else if (position === first_len) {
                        before.before(div(array[0]));
                        draw_cursor_line(array[1], 0);
                        lines_after(array.slice(2))
                    } else {
                        var num_lines = array.length;
                        var offset = 0;
                        if (position < first_len) {
                            draw_cursor_line(array[0], position);
                            lines_after(array.slice(1))
                        } else if (position === first_len) {
                            before.before(div(array[0]));
                            draw_cursor_line(array[1], 0);
                            lines_after(array.slice(2))
                        } else {
                            var last = array.slice(-1)[0];
                            var from_last = string.length - position - tabs_rm;
                            var last_len = last.length;
                            var pos = 0;
                            if (from_last <= last_len) {
                                lines_before(array.slice(0, -1));
                                if (last_len === from_last) {
                                    pos = 0
                                } else {
                                    pos = last_len - from_last
                                }
                                draw_cursor_line(last, pos)
                            } else {
                                if (num_lines === 3) {
                                    str = $.terminal.encode(array[0]);
                                    before.before("<div>" + str + "</div>");
                                    draw_cursor_line(array[1], position - first_len - 1);
                                    str = $.terminal.encode(array[2]);
                                    after.after('<div class="clear">' + str + "</div>")
                                } else {
                                    var line_index;
                                    var current;
                                    pos = position;
                                    for (i = 0; i < array.length; ++i) {
                                        var current_len = array[i].length;
                                        if (pos > current_len) {
                                            pos -= current_len
                                        } else {
                                            break
                                        }
                                    }
                                    current = array[i];
                                    line_index = i;
                                    if (pos === current.length) {
                                        pos = 0;
                                        current = array[++line_index]
                                    }
                                    draw_cursor_line(current, pos);
                                    lines_before(array.slice(0, line_index));
                                    lines_after(array.slice(line_index + 1))
                                }
                            }
                        }
                    }
                } else {
                    if (string === "") {
                        before.html("");
                        cursor.html("&nbsp;");
                        after.html("")
                    } else {
                        draw_cursor_line(string, position)
                    }
                }
            }
        }(self);
        var draw_prompt = function() {
            function set(prompt) {
                prompt_node.html($.terminal.format($.terminal.encode(prompt)));
                prompt_len = prompt_node.text().length
            }
            return function() {
                switch (typeof prompt) {
                    case "string":
                        set(prompt);
                        break;
                    case "function":
                        prompt(set);
                        break
                }
            }
        }();

        function paste() {
            $(".cmd").each(function() {
                var self = $(this);
                var cmd = self.data("cmd");
                if (cmd.isenabled()) {
                    var clip = self.find("textarea");
                    if (!clip.is(":focus")) {
                        clip.focus()
                    }
                    cmd.oneTime(100, function() {
                        cmd.insert(clip.val());
                        clip.val("");
                        fake_mobile_entry()
                    })
                }
            })
        }
        var first_up_history = true;
        var prevent_keypress = false;
        var no_keypress;

        function keydown_event(e) {
            var result, pos, len;
            if (enabled) {
                if ($.isFunction(options.keydown)) {
                    result = options.keydown(e);
                    if (result !== undefined) {
                        return result
                    }
                }
                if (e.which !== 38 && !(e.which === 80 && e.ctrlKey)) {
                    first_up_history = true
                }
                if (reverse_search && (e.which === 35 || e.which === 36 || e.which === 37 || e.which === 38 || e.which === 39 || e.which === 40 || e.which === 13 || e.which === 27)) {
                    clear_reverse_state();
                    draw_prompt();
                    if (e.which === 27) {
                        self.set("")
                    }
                    redraw();
                    keydown_event.call(this, e)
                } else if (e.altKey) {
                    if (e.which === 68) {
                        self.set(command.slice(0, position) + command.slice(position).replace(/ *[^ ]+ *(?= )|[^ ]+$/, ""), true);
                        return false
                    }
                    return true
                } else if (e.keyCode === 13) {
                    if (e.shiftKey) {
                        self.insert("\n")
                    } else {
                        if (history && command && !mask && ($.isFunction(options.historyFilter) && options.historyFilter(command)) || options.historyFilter instanceof RegExp && command.match(options.historyFilter) || !options.historyFilter) {
                            history.append(command)
                        }
                        var tmp = command;
                        history.reset();
                        self.set("");
                        if (options.commands) {
                            options.commands(tmp)
                        }
                        if ($.isFunction(prompt)) {
                            draw_prompt()
                        }
                    }
                } else if (e.which === 8) {
                    if (reverse_search) {
                        rev_search_str = rev_search_str.slice(0, -1);
                        draw_reverse_prompt()
                    } else {
                        if (command !== "" && position > 0) {
                            self["delete"](-1)
                        }
                    }
                    if (is_touch()) {
                        return true
                    }
                } else if (e.which === 67 && e.ctrlKey && e.shiftKey) {
                    selected_text = get_selected_text()
                } else if (e.which === 86 && e.ctrlKey && e.shiftKey) {
                    if (selected_text !== "") {
                        self.insert(selected_text)
                    }
                } else if (e.which === 9 && !(e.ctrlKey || e.altKey)) {
                    self.insert("	")
                } else if (e.which === 46) {
                    self["delete"](1);
                    return
                } else if (history && (e.which === 38 && !e.ctrlKey) || e.which === 80 && e.ctrlKey) {
                    if (first_up_history) {
                        last_command = command;
                        self.set(history.current())
                    } else {
                        self.set(history.previous())
                    }
                    first_up_history = false
                } else if (history && (e.which === 40 && !e.ctrlKey) || e.which === 78 && e.ctrlKey) {
                    self.set(history.end() ? last_command : history.next())
                } else if (e.which === 37 || e.which === 66 && e.ctrlKey) {
                    if (e.ctrlKey && e.which !== 66) {
                        len = position - 1;
                        pos = 0;
                        if (command[len] === " ") {
                            --len
                        }
                        for (var i = len; i > 0; --i) {
                            if (command[i] === " " && command[i + 1] !== " ") {
                                pos = i + 1;
                                break
                            } else if (command[i] === "\n" && command[i + 1] !== "\n") {
                                pos = i;
                                break
                            }
                        }
                        self.position(pos)
                    } else {
                        if (position > 0) {
                            self.position(-1, true);
                            redraw()
                        }
                    }
                } else if (e.which === 82 && e.ctrlKey) {
                    if (reverse_search) {
                        reverse_history_search(true)
                    } else {
                        backup_prompt = prompt;
                        draw_reverse_prompt();
                        last_command = command;
                        self.set("");
                        redraw();
                        reverse_search = true
                    }
                } else if (e.which == 71 && e.ctrlKey) {
                    if (reverse_search) {
                        prompt = backup_prompt;
                        draw_prompt();
                        self.set(last_command);
                        redraw();
                        reverse_search = false;
                        rev_search_str = ""
                    }
                } else if (e.which === 39 || e.which === 70 && e.ctrlKey) {
                    if (e.ctrlKey && e.which !== 70) {
                        if (command[position] === " ") {
                            ++position
                        }
                        var re = /\S[\n\s]{2,}|[\n\s]+\S?/;
                        var match = command.slice(position).match(re);
                        if (!match || match[0].match(/^\s+$/)) {
                            self.position(command.length)
                        } else {
                            if (match[0][0] !== " ") {
                                position += match.index + 1
                            } else {
                                position += match.index + match[0].length - 1;
                                if (match[0][match[0].length - 1] !== " ") {
                                    --position
                                }
                            }
                        }
                        redraw()
                    } else {
                        if (position < command.length) {
                            self.position(1, true)
                        }
                    }
                } else if (e.which === 123) {
                    return
                } else if (e.which === 36) {
                    self.position(0)
                } else if (e.which === 35) {
                    self.position(command.length)
                } else if (e.shiftKey && e.which == 45) {
                    clip.val("");
                    if (!is_paste_supported) {
                        paste()
                    }
                    return
                } else if (e.ctrlKey || e.metaKey) {
                    if (e.which === 192) {
                        return
                    }
                    if (e.metaKey) {
                        if (e.which === 82) {
                            return
                        } else if (e.which === 76) {
                            return
                        }
                    }
                    if (e.shiftKey) {
                        if (e.which === 84) {
                            return
                        }
                    } else {
                        if (e.which === 81) {
                            if (command !== "" && position !== 0) {
                                var m = command.slice(0, position).match(/([^ ]+ *$)/);
                                kill_text = self["delete"](-m[0].length)
                            }
                            return false
                        } else if (e.which === 72) {
                            if (command !== "" && position > 0) {
                                self["delete"](-1)
                            }
                            return false
                        } else if (e.which === 65) {
                            self.position(0)
                        } else if (e.which === 69) {
                            self.position(command.length)
                        } else if (e.which === 88 || e.which === 67 || e.which === 84) {
                            return
                        } else if (e.which === 89) {
                            if (kill_text !== "") {
                                self.insert(kill_text)
                            }
                        } else if (e.which === 86) {
                            clip.val("");
                            if (!is_paste_supported) {
                                paste()
                            }
                            return
                        } else if (e.which === 75) {
                            kill_text = self["delete"](command.length - position)
                        } else if (e.which === 85) {
                            if (command !== "" && position !== 0) {
                                kill_text = self["delete"](-position)
                            }
                        } else if (e.which === 17) {
                            return false
                        }
                    }
                } else {
                    prevent_keypress = false;
                    no_keypress = true;
                    return
                }
                prevent_keypress = true;
                return false
            }
        }

        function fire_change_command() {
            if ($.isFunction(options.onCommandChange)) {
                options.onCommandChange(command)
            }
        }
        $.extend(self, {
            name: function(string) {
                if (string !== undefined) {
                    name = string;
                    var enabled = history && history.enabled() || !history;
                    history = new History(string, historySize);
                    if (!enabled) {
                        history.disable()
                    }
                    return self
                } else {
                    return name
                }
            },
            purge: function() {
                history.clear();
                return self
            },
            history: function() {
                return history
            },
            "delete": function(n, stay) {
                var removed;
                if (n === 0) {
                    return self
                } else if (n < 0) {
                    if (position > 0) {
                        removed = command.slice(0, position).slice(n);
                        command = command.slice(0, position + n) + command.slice(position, command.length);
                        if (!stay) {
                            self.position(position + n)
                        } else {
                            fire_change_command()
                        }
                    }
                } else {
                    if (command !== "" && position < command.length) {
                        removed = command.slice(position).slice(0, n);
                        command = command.slice(0, position) + command.slice(position + n, command.length);
                        fire_change_command()
                    }
                }
                redraw();
                fake_mobile_entry();
                return removed
            },
            set: function(string, stay) {
                if (string !== undefined) {
                    command = string;
                    if (!stay) {
                        self.position(command.length)
                    }
                    redraw();
                    fake_mobile_entry();
                    fire_change_command()
                }
                return self
            },
            insert: function(string, stay) {
                if (position === command.length) {
                    command += string
                } else if (position === 0) {
                    command = string + command
                } else {
                    command = command.slice(0, position) + string + command.slice(position)
                }
                if (!stay) {
                    self.position(string.length, true)
                } else {
                    fake_mobile_entry()
                }
                redraw();
                fire_change_command();
                return self
            },
            get: function() {
                return command
            },
            commands: function(commands) {
                if (commands) {
                    options.commands = commands;
                    return self
                } else {
                    return commands
                }
            },
            destroy: function() {
                $(document.documentElement || window).unbind(".cmd");
                self.stopTime("blink", blink);
                self.find(".cursor").next().remove().end().prev().remove().end().remove();
                self.find(".prompt, .clipboard").remove();
                self.removeClass("cmd").removeData("cmd");
                return self
            },
            prompt: function(user_prompt) {
                if (user_prompt === undefined) {
                    return prompt
                } else {
                    if (typeof user_prompt === "string" || typeof user_prompt === "function") {
                        prompt = user_prompt
                    } else {
                        throw "prompt must be a function or string"
                    }
                    draw_prompt();
                    redraw();
                    return self
                }
            },
            kill_text: function() {
                return kill_text
            },
            position: function(n, relative) {
                if (typeof n === "number") {
                    if (relative) {
                        position += n
                    } else {
                        if (n < 0) {
                            position = 0
                        } else if (n > command.length) {
                            position = command.length
                        } else {
                            position = n
                        }
                    }
                    if ($.isFunction(options.onPositionChange)) {
                        options.onPositionChange(position)
                    }
                    redraw();
                    fake_mobile_entry();
                    return self
                } else {
                    return position
                }
            },
            visible: function() {
                var visible = self.visible;
                return function() {
                    visible.apply(self, []);
                    redraw();
                    draw_prompt()
                }
            }(),
            show: function() {
                var show = self.show;
                return function() {
                    show.apply(self, []);
                    redraw();
                    draw_prompt()
                }
            }(),
            resize: function(num) {
                if (num) {
                    num_chars = num
                } else {
                    change_num_chars()
                }
                redraw();
                return self
            },
            enable: function() {
                enabled = true;
                self.addClass("enabled");
                animation(true);
                mobile_focus();
                return self
            },
            isenabled: function() {
                return enabled
            },
            disable: function() {
                enabled = false;
                self.removeClass("enabled");
                animation(false);
                mobile_focus();
                return self
            },
            mask: function(new_mask) {
                if (typeof new_mask === "undefined") {
                    return mask
                } else {
                    mask = new_mask;
                    redraw();
                    return self
                }
            }
        });
        self.name(options.name || options.prompt || "");
        if (typeof options.prompt == "string") {
            prompt = options.prompt
        } else {
            prompt = "> "
        }
        draw_prompt();
        if (options.enabled === undefined || options.enabled === true) {
            self.enable()
        }
        var object;
        var doc = $(document.documentElement || window);
        doc.bind("keypress.cmd", function(e) {
            var result;
            no_keypress = false;
            if (e.ctrlKey && e.which === 99) {
                return
            }
            if (prevent_keypress) {
                return
            }
            if (!reverse_search && $.isFunction(options.keypress)) {
                result = options.keypress(e)
            }
            if (result === undefined || result) {
                if (enabled) {
                    if ($.inArray(e.which, [38, 13, 0, 8]) > -1 && !(e.which === 38 && e.shiftKey)) {
                        if (e.keyCode == 123) {
                            return
                        }
                        return false
                    } else if (!e.ctrlKey && !(e.altKey && e.which === 100) || e.altKey) {
                        if (reverse_search) {
                            rev_search_str += String.fromCharCode(e.which);
                            reverse_history_search();
                            draw_reverse_prompt()
                        } else {
                            self.insert(String.fromCharCode(e.which))
                        }
                        return false
                    }
                }
            } else {
                return result
            }
        }).bind("keydown.cmd", keydown_event).bind("keyup.cmd", function(e) {
            if (no_keypress) {
                var val = clip.val();
                if (val || e.which == 8) {
                    self.set(val)
                }
            }
        });
        if (is_paste_supported) {
            doc.bind("paste.cmd", paste)
        }
        self.data("cmd", self);
        return self
    };

    function skip_formatting_count(string) {
        return $("<div>" + $.terminal.strip(string) + "</div>").text().length
    }

    function formatting_count(string) {
        return string.length - skip_formatting_count(string)
    }

    function support_animations() {
        var animation = false,
            animationstring = "animation",
            keyframeprefix = "",
            domPrefixes = "Webkit Moz O ms Khtml".split(" "),
            pfx = "",
            elm = document.createElement("div");
        if (elm.style.animationName) {
            animation = true
        }
        if (animation === false) {
            for (var i = 0; i < domPrefixes.length; i++) {
                var name = domPrefixes[i] + "AnimationName";
                if (elm.style[name] !== undefined) {
                    pfx = domPrefixes[i];
                    animationstring = pfx + "Animation";
                    keyframeprefix = "-" + pfx.toLowerCase() + "-";
                    animation = true;
                    break
                }
            }
        }
        return animation
    }

    function is_android() {
        return navigator.userAgent.toLowerCase().indexOf("android") != -1
    }

    function is_touch() {
        return "ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch
    }

    function process_command(string, fn) {
        var array = fn(string);
        if (array.length) {
            var name = array.shift();
            var regex = new RegExp("^" + $.terminal.escape_regex(name));
            var rest = string.replace(regex, "").trim();
            return {
                command: string,
                name: name,
                args: array,
                rest: rest
            }
        } else {
            return {
                command: string,
                name: "",
                args: [],
                rest: ""
            }
        }
    }
    var format_split_re = /(\[\[[!gbiuso]*;[^;]*;[^\]]*\](?:[^\]]*\\\][^\]]*|[^\]]*|[^\[]*\[[^\]]*)\]?)/i;
    var format_parts_re = /\[\[([!gbiuso]*);([^;]*);([^;\]]*);?([^;\]]*);?([^\]]*)\]([^\]]*\\\][^\]]*|[^\]]*|[^\[]*\[[^\]]*)\]?/gi;
    var format_re = /\[\[([!gbiuso]*;[^;\]]*;[^;\]]*(?:;|[^\]()]*);?[^\]]*)\]([^\]]*\\\][^\]]*|[^\]]*|[^\[]*\[[^\]]*)\]?/gi;
    var format_full_re = /^\[\[([!gbiuso]*;[^;\]]*;[^;\]]*(?:;|[^\]()]*);?[^\]]*)\]([^\]]*\\\][^\]]*|[^\]]*|[^\[]*\[[^\]]*)\]$/gi;
    var color_hex_re = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
    var url_re = /(\bhttps?:\/\/(?:(?:(?!&[^;]+;)|(?=&amp;))[^\s"'<>\]\[)])+\b)/gi;
    var email_re = /((([^<>('")[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))/g;
    var command_re = /('[^']*'|"(\\"|[^"])*"|(?:\/(\\\/|[^\/])+\/[gimy]*)(?=:? |$)|(\\ |[^ ])+|[\w-]+)/gi;
    var format_begin_re = /(\[\[[!gbiuso]*;[^;]*;[^\]]*\])/i;
    var format_last_re = /\[\[[!gbiuso]*;[^;]*;[^\]]*\]?$/i;
    var format_exec_re = /(\[\[(?:[^\]]|\](?!\]))*\]\])/;
    $.terminal = {
        version: "0.9.3",
        color_names: ["black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia", "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua", "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen"],
        valid_color: function(color) {
            if (color.match(color_hex_re)) {
                return true
            } else {
                return $.inArray(color.toLowerCase(), $.terminal.color_names) !== -1
            }
        },
        escape_regex: function(str) {
            if (typeof str == "string") {
                var special = /([-\\\^$\[\]()+{}?*.|])/g;
                return str.replace(special, "\\$1")
            }
        },
        have_formatting: function(str) {
            return typeof str == "string" && !!str.match(format_re)
        },
        is_formatting: function(str) {
            return typeof str == "string" && !!str.match(format_full_re)
        },
        format_split: function(str) {
            return str.split(format_split_re)
        },
        split_equal: function(str, length, words) {
            var formatting = false;
            var in_text = false;
            var prev_format = "";
            var result = [];
            var array = str.replace(format_re, function(_, format, text) {
                var semicolons = format.match(/;/g).length;
                if (semicolons == 2) {
                    semicolons = ";;"
                } else if (semicolons == 3) {
                    semicolons = ";"
                } else {
                    semicolons = ""
                }
                return "[[" + format + semicolons + text.replace(/\\\]/g, "&#93;").replace(/\n/g, "\\n") + "]" + text + "]"
            }).split(/\n/g);
            for (var i = 0, len = array.length; i < len; ++i) {
                if (array[i] === "") {
                    result.push("");
                    continue
                }
                var line = array[i];
                var first_index = 0;
                var count = 0;
                for (var j = 0, jlen = line.length; j < jlen; ++j) {
                    if (line[j] === "[" && line[j + 1] === "[") {
                        formatting = true
                    } else if (formatting && line[j] === "]") {
                        if (in_text) {
                            formatting = false;
                            in_text = false
                        } else {
                            in_text = true
                        }
                    } else if (formatting && in_text || !formatting) {
                        if (line[j] === "&") {
                            var m = line.substring(j).match(/^(&[^;]+;)/);
                            if (!m) {
                                throw new Error("Unclosed html entity in line " + (i + 1) + " at char " + (j + 1))
                            }
                            j += m[1].length - 2;
                            if (j === jlen - 1) {
                                result.push(output + m[1])
                            }
                            continue
                        } else if (line[j] === "]" && line[j - 1] === "\\") {
                            --count
                        } else {
                            ++count
                        }
                    }
                    if (count === length || j === jlen - 1) {
                        var output = line.substring(first_index, j + 1);
                        if (prev_format) {
                            output = prev_format + output;
                            if (output.match("]")) {
                                prev_format = ""
                            }
                        }
                        first_index = j + 1;
                        count = 0;
                        var matched = output.match(format_re);
                        if (matched) {
                            var last = matched[matched.length - 1];
                            if (last[last.length - 1] !== "]") {
                                prev_format = last.match(format_begin_re)[1];
                                output += "]"
                            } else if (output.match(format_last_re)) {
                                var line_len = output.length;
                                output = output.replace(format_last_re, "");
                                prev_format = last.match(format_begin_re)[1]
                            }
                        }
                        result.push(output)
                    }
                }
            }
            return result
        },
        encode: function(str) {
            str = str.replace(/&(?!#[0-9]+;|[a-zA-Z]+;)/g, "&amp;");
            return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
        },
        escape_formatting: function(string) {
            return $.terminal.escape_brackets($.terminal.encode(string))
        },
        format: function(str, options) {
            var settings = $.extend({}, {
                linksNoReferrer: false
            }, options || {});
            if (typeof str === "string") {
                var splitted = $.terminal.format_split(str);
                if (splitted && splitted.length > 1) {
                    str = $.map(splitted, function(text) {
                        if (text === "") {
                            return text
                        } else if ($.terminal.is_formatting(text)) {
                            return text.replace(format_parts_re, function(s, style, color, background, _class, data_text, text) {
                                if (text === "") {
                                    return ""
                                }
                                text = text.replace(/\\]/g, "]");
                                var style_str = "";
                                if (style.indexOf("b") !== -1) {
                                    style_str += "font-weight:bold;"
                                }
                                var text_decoration = [];
                                if (style.indexOf("u") !== -1) {
                                    text_decoration.push("underline")
                                }
                                if (style.indexOf("s") !== -1) {
                                    text_decoration.push("line-through")
                                }
                                if (style.indexOf("o") !== -1) {
                                    text_decoration.push("overline")
                                }
                                if (text_decoration.length) {
                                    style_str += "text-decoration:" + text_decoration.join(" ") + ";"
                                }
                                if (style.indexOf("i") !== -1) {
                                    style_str += "font-style:italic;"
                                }
                                if ($.terminal.valid_color(color)) {
                                    style_str += "color:" + color + ";";
                                    if (style.indexOf("g") !== -1) {
                                        style_str += "text-shadow:0 0 5px " + color + ";"
                                    }
                                }
                                if ($.terminal.valid_color(background)) {
                                    style_str += "background-color:" + background
                                }
                                var data;
                                if (data_text === "") {
                                    data = text
                                } else {
                                    data = data_text.replace(/&#93;/g, "]")
                                }
                                var result;
                                if (style.indexOf("!") !== -1) {
                                    if (data.match(email_re)) {
                                        result = '<a href="mailto:' + data + '" '
                                    } else {
                                        result = '<a target="_blank" href="' + data + '" ';
                                        if (settings.linksNoReferer) {
                                            result += 'rel="noreferrer" '
                                        }
                                    }
                                } else {
                                    result = "<span "
                                }
                                if (style_str !== "") {
                                    result += 'style="' + style_str + '"'
                                }
                                if (_class !== "") {
                                    result += ' class="' + _class + '"'
                                }
                                if (style.indexOf("!") !== -1) {
                                    result += ">" + text + "</a>"
                                } else {
                                    result += ' data-text="' + data.replace('"', "&quote;") + '">' + text + "</span>"
                                }
                                return result
                            })
                        } else {
                            return "<span>" + text + "</span>"
                        }
                    }).join("")
                } else {
                    str = "<span>" + str + "</span>"
                }
                return str.replace(/<span><br\/?><\/span>/gi, "<br/>")
            } else {
                return ""
            }
        },
        escape_brackets: function(string) {
            return string.replace(/\[/g, "&#91;").replace(/\]/g, "&#93;")
        },
        strip: function(str) {
            return str.replace(format_parts_re, "$6")
        },
        active: function() {
            return terminals.front()
        },
        parseArguments: function(string) {
            return $.terminal.parse_arguments(string)
        },
        splitArguments: function(string) {
            return $.terminal.split_arguments(string)
        },
        parseCommand: function(string) {
            return $.terminal.parse_command(string)
        },
        splitCommand: function(string) {
            return $.terminal.split_command(string)
        },
        parse_arguments: function(string) {
            var float_re = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
            return $.map(string.match(command_re) || [], function(arg) {
                if (arg[0] === "'" && arg[arg.length - 1] === "'") {
                    return arg.replace(/^'|'$/g, "")
                } else if (arg[0] === '"' && arg[arg.length - 1] === '"') {
                    arg = arg.replace(/^"|"$/g, "").replace(/\\([" ])/g, "$1");
                    return arg.replace(/\\\\|\\t|\\n/g, function(string) {
                        if (string[1] === "t") {
                            return "	"
                        } else if (string[1] === "n") {
                            return "\n"
                        } else {
                            return "\\"
                        }
                    }).replace(/\\x([0-9a-f]+)/gi, function(_, hex) {
                        return String.fromCharCode(parseInt(hex, 16))
                    }).replace(/\\0([0-7]+)/g, function(_, oct) {
                        return String.fromCharCode(parseInt(oct, 8))
                    })
                } else if (arg.match(/^\/(\\\/|[^\/])+\/[gimy]*$/)) {
                    var m = arg.match(/^\/([^\/]+)\/([^\/]*)$/);
                    return new RegExp(m[1], m[2])
                } else if (arg.match(/^-?[0-9]+$/)) {
                    return parseInt(arg, 10)
                } else if (arg.match(float_re)) {
                    return parseFloat(arg)
                } else {
                    return arg.replace(/\\ /g, " ")
                }
            })
        },
        split_arguments: function(string) {
            return $.map(string.match(command_re) || [], function(arg) {
                if (arg[0] === "'" && arg[arg.length - 1] === "'") {
                    return arg.replace(/^'|'$/g, "")
                } else if (arg[0] === '"' && arg[arg.length - 1] === '"') {
                    return arg.replace(/^"|"$/g, "").replace(/\\([" ])/g, "$1")
                } else if (arg.match(/\/.*\/[gimy]*$/)) {
                    return arg
                } else {
                    return arg.replace(/\\ /g, " ")
                }
            })
        },
        parse_command: function(string) {
            return process_command(string, $.terminal.parse_arguments)
        },
        split_command: function(string) {
            return process_command(string, $.terminal.split_arguments)
        },
        extended_command: function(term, string) {
            try {
                change_hash = false;
                term.exec(string, true).then(function() {
                    change_hash = true
                })
            } catch (e) {}
        }
    };
    $.fn.visible = function() {
        return this.css("visibility", "visible")
    };
    $.fn.hidden = function() {
        return this.css("visibility", "hidden")
    };
    var ids = {};
    $.jrpc = function(url, method, params, success, error) {
        ids[url] = ids[url] || 0;
        var request = $.json_stringify({
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: ++ids[url]
        });
        return $.ajax({
            url: url,
            data: request,
            success: function(result, status, jqXHR) {
                var content_type = jqXHR.getResponseHeader("Content-Type");
                if (!content_type.match(/application\/json/)) {
                    var msg = "Response Content-Type is not application/json";
                    if (console && console.warn) {
                        console.warn(msg)
                    } else {
                        throw new Error("WARN: " + msg)
                    }
                }
                var json;
                try {
                    json = $.parseJSON(result)
                } catch (e) {
                    if (error) {
                        error(jqXHR, "Invalid JSON", e)
                    } else {
                        throw new Error("Invalid JSON")
                    }
                    return
                }
                success(json, status, jqXHR)
            },
            error: error,
            contentType: "application/json",
            dataType: "text",
            async: true,
            cache: false,
            type: "POST"
        })
    };

    function is_scrolled_into_view(elem) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();
        return elemBottom >= docViewTop && elemTop <= docViewBottom
    }

    function char_size() {
        var temp = $('<div class="terminal temp"><div class="cmd"><span cla' + 'ss="cursor">&nbsp;</span></div></div>').appendTo("body");
        var span = temp.find("span");
        var result = {
            width: span.width(),
            height: span.outerHeight()
        };
        temp.remove();
        return result
    }

    function get_num_chars(terminal) {
        var temp = $('<div class="terminal wrap"><span class="cursor">' + "</span></div>").appendTo("body").css("padding", 0);
        var span = temp.find("span");
        var max = 60;
        var spaces = "";
        for (var i = 0; i <= max; ++i) {
            spaces += "&nbsp;"
        }
        span.html(spaces);
        var width = span.width() / max;
        var result = Math.floor(terminal.width() / width);
        temp.remove();
        if (have_scrollbars(terminal)) {
            var SCROLLBAR_WIDTH = 20;
            var margins = terminal.innerWidth() - terminal.width();
            result -= Math.ceil((SCROLLBAR_WIDTH - margins / 2) / (width - 1))
        }
        return result
    }

    function get_num_rows(terminal) {
        return Math.floor(terminal.height() / char_size().height)
    }

    function get_selected_text() {
        if (window.getSelection || document.getSelection) {
            var selection = (window.getSelection || document.getSelection)();
            if (selection.text) {
                return selection.text
            } else {
                return selection.toString()
            }
        } else if (document.selection) {
            return document.selection.createRange().text
        }
    }

    function have_scrollbars(div) {
        if (div.is("body")) {
            return $("body").height() > $(window).height()
        } else {
            return div.get(0).scrollHeight > div.innerHeight()
        }
    }
    var version_set = !$.terminal.version.match(/^\{\{/);
    var copyright = "Copyright (c) 2011-2015 Jakub Jankiewicz <http://jcubic" + ".pl>";
    var version_string = version_set ? " v. " + $.terminal.version : " ";
    var reg = new RegExp(" {" + version_string.length + "}$");
    var name_ver = "jQuery Terminal Emulator" + (version_set ? version_string : "");
    var signatures = [
        ["jQuery Terminal", "(c) 2011-2015 jcubic"],
        [name_ver, copyright.replace(/^Copyright | *<.*>/g, "")],
        [name_ver, copyright.replace(/^Copyright /, "")],
        ["      _______                 ________                        __", "     / / _  /_ ____________ _/__  ___/______________  _____  / /", " __ / / // / // / _  / _/ // / / / _  / _/     / /  \\/ / _ \\/ /", "/  / / // / // / ___/ // // / / / ___/ // / / / / /\\  / // / /__", "\\___/____ \\\\__/____/_/ \\__ / /_/____/_//_/ /_/ /_/  \\/\\__\\_\\___/", "         \\/          /____/                                   ".replace(reg, " ") + version_string, copyright],
        ["      __ _____                     ________                              __", "     / // _  /__ __ _____ ___ __ _/__  ___/__ ___ ______ __ __  __ ___  / /", " __ / // // // // // _  // _// // / / // _  // _//     // //  \\/ // _ \\/ /", "/  / // // // // // ___// / / // / / // ___// / / / / // // /\\  // // / /__", "\\___//____ \\\\___//____//_/ _\\_  / /_//____//_/ /_/ /_//_//_/ /_/ \\__\\_\\___/", "          \\/              /____/                                          ".replace(reg, "") + version_string, copyright]
    ];
    $.terminal.defaults = {
        prompt: "> ",
        history: true,
        exit: true,
        clear: true,
        enabled: true,
        historySize: 60,
        maskChar: "*",
        checkArity: true,
        raw: false,
        exceptionHandler: null,
        cancelableAjax: true,
        globalToken: false,
        processArguments: true,
        linksNoReferrer: false,
        processRPCResponse: null,
        Token: true,
        convertLinks: true,
        historyState: false,
        login: null,
        outputLimit: -1,
        formatters: [],
        onAjaxError: null,
        onRPCError: null,
        completion: false,
        historyFilter: null,
        onInit: $.noop,
        onClear: $.noop,
        onBlur: $.noop,
        onFocus: $.noop,
        onTerminalChange: $.noop,
        onExit: $.noop,
        keypress: $.noop,
        keydown: $.noop,
        strings: {
            wrongPasswordTryAgain: "Wrong password try again!",
            wrongPassword: "Wrong password!",
            ajaxAbortError: "Error while aborting ajax call!",
            wrongArity: "Wrong number of arguments. Function '%s' expects %s got" + " %s!",
            commandNotFound: "Command '%s' Not Found!",
            oneRPCWithIgnore: "You can use only one rpc with ignoreSystemDescr" + "ibe",
            oneInterpreterFunction: "You can't use more than one function (rpc" + "with ignoreSystemDescribe counts as one)",
            loginFunctionMissing: "You didn't specify a login function",
            noTokenError: "Access denied (no token)",
            serverResponse: "Server responded",
            wrongGreetings: "Wrong value of greetings parameter",
            notWhileLogin: "You can't call `%s' function while in login",
            loginIsNotAFunction: "Authenticate must be a function",
            canExitError: "You can't exit from main interpreter",
            invalidCompletion: "Invalid completion",
            hashChangeMissing: "You need to include hashchange jquery plugin " + "for history to work",
            invalidSelector: 'Sorry, but terminal said that "%s" is not valid ' + "selector!",
            invalidTerminalId: "Invalid Terminal ID",
            login: "login",
            password: "password",
            recursiveCall: "Recursive call detected, skip"
        }
    };
    var requests = [];
    var terminals = new Cycle;
    var save_state = [];
    var hash_commands;
    var change_hash = false;
    var fire_hash_change = true;
    var first_instance = true;
    $.fn.terminal = function(init_interpreter, options) {
        function get_processed_command(command) {
            if ($.isFunction(settings.processArguments)) {
                return process_command(command, settings.processArguments)
            } else if (settings.processArguments) {
                return $.terminal.parse_command(command)
            } else {
                return $.terminal.split_command(command)
            }
        }

        function display_object(object) {
            if (typeof object === "string") {
                self.echo(object)
            } else if (object instanceof Array) {
                self.echo($.map(object, function(object) {
                    return $.json_stringify(object)
                }).join(" "))
            } else if (typeof object === "object") {
                self.echo($.json_stringify(object))
            } else {
                self.echo(object)
            }
        }

        function print_line(url_spec) {
            var re = /(.*):([0-9]+):([0-9]+)$/;
            var m = url_spec.match(re);
            if (m) {
                self.pause();
                $.get(m[1], function(response) {
                    var prefix = location.href.replace(/[^\/]+$/, "");
                    var file = m[1].replace(prefix, "");
                    self.echo("[[b;white;]" + file + "]");
                    var code = response.split("\n");
                    var n = +m[2] - 1;
                    self.echo(code.slice(n - 2, n + 3).map(function(line, i) {
                        if (i == 2) {
                            line = "[[;#f00;]" + $.terminal.escape_brackets(line) + "]"
                        }
                        return "[" + (n + i) + "]: " + line
                    }).join("\n")).resume()
                }, "text")
            }
        }

        function display_json_rpc_error(error) {
            if ($.isFunction(settings.onRPCError)) {
                settings.onRPCError.call(self, error)
            } else {
                self.error("&#91;RPC&#93; " + error.message)
            }
        }

        function make_basic_json_rpc(url) {
            var interpreter = function(method, params) {
                self.pause();
                $.jrpc(url, method, params, function(json) {
                    if (json.error) {
                        display_json_rpc_error(json.error)
                    } else {
                        if ($.isFunction(settings.processRPCResponse)) {
                            settings.processRPCResponse.call(self, json.result)
                        } else {
                            display_object(json.result)
                        }
                    }
                    self.resume()
                }, ajax_error)
            };
            return function(command, terminal) {
                if (command === "") {
                    return
                }
                try {
                    command = get_processed_command(command)
                } catch (e) {
                    terminal.error(e.toString());
                    return
                }
                if (!settings.login || command.name === "help") {
                    interpreter(command.name, command.args)
                } else {
                    var token = terminal.token();
                    if (token) {
                        interpreter(command.name, [token].concat(command.args))
                    } else {
                        terminal.error("&#91;AUTH&#93; " + strings.noTokenError)
                    }
                }
            }
        }

        function make_object_interpreter(object, arity, login, fallback) {
            return function(user_command, terminal) {
                if (user_command === "") {
                    return
                }
                var command;
                try {
                    command = get_processed_command(user_command)
                } catch (e) {
                    self.error(e.toString());
                    return
                }
                if (login) {
                    var token = self.token(true);
                    if (token) {
                        command.args = [token].concat(command.args)
                    } else {
                        terminal.error("&#91;AUTH&#93; " + strings.noTokenError);
                        return
                    }
                }
                var val = object[command.name];
                var type = $.type(val);
                if (type === "function") {
                    if (arity && val.length !== command.args.length) {
                        self.error("&#91;Arity&#93; " + sprintf(strings.wrongArity, command.name, val.length, command.args.length))
                    } else {
                        return val.apply(self, command.args)
                    }
                } else if (type === "object" || type === "string") {
                    var commands = [];
                    if (type === "object") {
                        commands = Object.keys(val);
                        val = make_object_interpreter(val, settings.arity, login)
                    }
                    terminal.push(val, {
                        prompt: command.name + "> ",
                        name: command.name,
                        completion: type === "object" ? commands : undefined
                    })
                } else {
                    if ($.isFunction(fallback)) {
                        fallback(user_command, self)
                    } else if ($.isFunction(settings.onCommandNotFound)) {
                        settings.onCommandNotFound(user_command, self)
                    } else {
                        terminal.error(sprintf(strings.commandNotFound, command.name))
                    }
                }
            }
        }

        function ajax_error(xhr, status, error) {
            self.resume();
            if ($.isFunction(settings.onAjaxError)) {
                settings.onAjaxError.call(self, xhr, status, error)
            } else if (status !== "abort") {
                self.error("&#91;AJAX&#93; " + status + " - " + strings.serverResponse + ": \n" + $.terminal.escape_brackets(xhr.responseText))
            }
        }

        function make_json_rpc_object(url, success) {
            $.jrpc(url, "system.describe", [], function(ret) {
                var commands = [];
                if (ret.procs) {
                    var interpreter_object = {};
                    $.each(ret.procs, function(_, proc) {
                        interpreter_object[proc.name] = function() {
                            var append = auth && proc.name != "help";
                            var args = Array.prototype.slice.call(arguments);
                            var args_len = args.length + (append ? 1 : 0);
                            if (settings.checkArity && proc.params && proc.params.length !== args_len) {
                                self.error("&#91;Arity&#93; " + sprintf(strings.wrongArity, proc.name, proc.params.length, args_len))
                            } else {
                                self.pause();
                                if (append) {
                                    args = [self.token(true)].concat(args)
                                }
                                $.jrpc(url, proc.name, args, function(json) {
                                    if (json.error) {
                                        display_json_rpc_error(json.error)
                                    } else {
                                        display_object(json.result)
                                    }
                                    self.resume()
                                }, ajax_error)
                            }
                        }
                    });
                    success(interpreter_object)
                } else {
                    success(null)
                }
            }, function() {
                success(null)
            })
        }

        function make_interpreter(user_intrp, login, finalize) {
            finalize = finalize || $.noop;
            var type = $.type(user_intrp);
            var result = {};
            var commands;
            var rpc_count = 0;
            var fn_interpreter;
            if (type === "array") {
                var object = {};
                (function recur(interpreters, success) {
                    if (interpreters.length) {
                        var first = interpreters[0];
                        var rest = interpreters.slice(1);
                        var type = $.type(first);
                        if (type === "string") {
                            rpc_count++;
                            self.pause();
                            if (settings.ignoreSystemDescribe) {
                                if (rpc_count === 1) {
                                    fn_interpreter = make_basic_json_rpc(first)
                                } else {
                                    self.error(strings.oneRPCWithIgnore)
                                }
                                recur(rest, success)
                            } else {
                                make_json_rpc_object(first, function(new_obj) {
                                    if (new_obj) {
                                        $.extend(object, new_obj)
                                    }
                                    self.resume();
                                    recur(rest, success)
                                })
                            }
                        } else if (type === "function") {
                            if (fn_interpreter) {
                                self.error(strings.oneInterpreterFunction)
                            } else {
                                fn_interpreter = first
                            }
                        } else if (type === "object") {
                            $.extend(object, first);
                            recur(rest, success)
                        }
                    } else {
                        success()
                    }
                })(user_intrp, function() {
                    finalize({
                        interpreter: make_object_interpreter(object, false, login, fn_interpreter),
                        completion: Object.keys(object)
                    })
                })
            } else if (type === "string") {
                if (settings.ignoreSystemDescribe) {
                    finalize({
                        interpreter: make_basic_json_rpc(user_intrp),
                        completion: settings.completion
                    })
                } else {
                    self.pause();
                    make_json_rpc_object(user_intrp, function(object) {
                        if (object) {
                            result.interpreter = make_object_interpreter(object, false, login);
                            result.completion = commands
                        } else {
                            result.interpreter = make_basic_json_rpc(user_intrp);
                            result.completion = settings.completion
                        }
                        self.resume();
                        finalize(result)
                    })
                }
            } else if (type === "object") {
                finalize({
                    interpreter: make_object_interpreter(user_intrp, settings.checkArity),
                    completion: Object.keys(user_intrp)
                })
            } else {
                if (type === "undefined") {
                    user_intrp = $.noop
                } else if (type !== "function") {
                    throw type + " is invalid interpreter value"
                }
                finalize({
                    interpreter: user_intrp,
                    completion: settings.completion
                })
            }
        }

        function make_json_rpc_login(url, login) {
            var method = $.type(login) === "boolean" ? "login" : login;
            return function(user, passwd, callback, term) {
                self.pause();
                $.jrpc(url, method, [user, passwd], function(response) {
                    self.resume();
                    if (!response.error && response.result) {
                        callback(response.result)
                    } else {
                        callback(null)
                    }
                }, ajax_error)
            }
        }

        function exception_message(e) {
            if (typeof e === "string") {
                return e
            } else if (typeof e.fileName === "string") {
                return e.fileName + ": " + e.message
            } else {
                return e.message
            }
        }

        function display_exception(e, label) {
            if ($.isFunction(settings.exceptionHandler)) {
                settings.exceptionHandler.call(self, e)
            } else {
                self.exception(e, label)
            }
        }

        function scroll_to_bottom() {
            var scrollHeight;
            if (scroll_object.prop) {
                scrollHeight = scroll_object.prop("scrollHeight")
            } else {
                scrollHeight = scroll_object.attr("scrollHeight")
            }
            scroll_object.scrollTop(scrollHeight)
        }

        function validate(label, object) {
            try {
                if ($.isFunction(object)) {
                    object(function() {})
                } else if (typeof object !== "string") {
                    var msg = label + " must be string or function";
                    throw msg
                }
            } catch (e) {
                display_exception(e, label.toUpperCase());
                return false
            }
            return true
        }
        var output_buffer = [];
        var NEW_LINE = 1;

        function buffer_line(string, options) {
            if (settings.convertLinks) {
                string = string.replace(email_re, "[[!;;]$1]").replace(url_re, "[[!;;]$1]")
            }
            var formatters = $.terminal.defaults.formatters;
            var i, len;
            if (!options.raw) {
                for (i = 0; i < formatters.length; ++i) {
                    try {
                        if (typeof formatters[i] == "function") {
                            var ret = formatters[i](string);
                            if (typeof ret == "string") {
                                string = ret
                            }
                        }
                    } catch (e) {
                        alert("formatting error at formatters[" + i + "]\n" + (e.stack ? e.stack : e))
                    }
                }
                string = $.terminal.encode(string)
            }
            output_buffer.push(NEW_LINE);
            if (!options.raw && (string.length > num_chars || string.match(/\n/))) {
                var words = options.keepWords;
                var array = $.terminal.split_equal(string, num_chars, words);
                for (i = 0, len = array.length; i < len; ++i) {
                    if (array[i] === "" || array[i] === "\r") {
                        output_buffer.push("<span></span>")
                    } else {
                        if (options.raw) {
                            output_buffer.push(array[i])
                        } else {
                            output_buffer.push($.terminal.format(array[i], {
                                linksNoReferer: settings.linksNoReferer
                            }))
                        }
                    }
                }
            } else {
                if (!options.raw) {
                    string = $.terminal.format(string, {
                        linksNoReferer: settings.linksNoReferer
                    })
                }
                output_buffer.push(string)
            }
            output_buffer.push(options.finalize)
        }

        function process_line(line, options) {
            try {
                var line_settings = $.extend({
                    exec: true,
                    raw: false,
                    finalize: $.noop
                }, options || {});
                var string = $.type(line) === "function" ? line() : line;
                string = $.type(string) === "string" ? string : String(string);
                if (string !== "") {
                    if (line_settings.exec) {
                        string = $.map(string.split(format_exec_re), function(string) {
                            if (string.match(format_exec_re)) {
                                string = string.replace(/^\[\[|\]\]$/g, "");
                                if (prev_command && prev_command.command == string) {
                                    self.error(strings.recursiveCall)
                                } else {
                                    $.terminal.extended_command(self, string)
                                }
                                return ""
                            } else {
                                return string
                            }
                        }).join("");
                        if (string !== "") {
                            buffer_line(string, line_settings)
                        }
                    } else {
                        buffer_line(string, line_settings)
                    }
                }
            } catch (e) {
                output_buffer = [];
                alert("[Internal Exception(process_line)]:" + exception_message(e) + "\n" + e.stack)
            }
        }

        function redraw() {
            command_line.resize(num_chars);
            var detached_output = output.empty().detach();
            var lines_to_show;
            if (settings.outputLimit >= 0) {
                var limit = settings.outputLimit === 0 ? self.rows() : settings.outputLimit;
                lines_to_show = lines.slice(lines.length - limit - 1)
            } else {
                lines_to_show = lines
            }
            try {
                output_buffer = [];
                $.each(lines_to_show, function(i, line) {
                    process_line.apply(null, line)
                });
                command_line.before(detached_output);
                self.flush()
            } catch (e) {
                alert("Exception in redraw\n" + e.stack)
            }
        }

        function show_greetings() {
            if (settings.greetings === undefined) {
                self.echo(self.signature)
            } else if (settings.greetings) {
                var type = typeof settings.greetings;
                if (type === "string") {
                    self.echo(settings.greetings)
                } else if (type === "function") {
                    settings.greetings.call(self, self.echo)
                } else {
                    self.error(strings.wrongGreetings)
                }
            }
        }

        function echo_command(command) {
            var prompt = command_line.prompt();
            var mask = command_line.mask();
            switch (typeof mask) {
                case "string":
                    command = command.replace(/./g, mask);
                    break;
                case "boolean":
                    if (mask) {
                        command = command.replace(/./g, settings.maskChar)
                    } else {
                        command = $.terminal.escape_formatting(command)
                    }
                    break
            }
            var options = {
                finalize: function(div) {
                    div.addClass("command")
                }
            };
            if ($.isFunction(prompt)) {
                prompt(function(string) {
                    self.echo(string + command, options)
                })
            } else {
                self.echo(prompt + command, options)
            }
        }

        function restore_state(spec) {
            var terminal = terminals.get()[spec[0]];
            if (!terminal) {
                throw new Error(strings.invalidTerminalId)
            }
            if (save_state[spec[1]]) {
                terminal.import_view(save_state[spec[1]])
            } else {
                change_hash = false;
                if (spec[2]) {
                    terminal.exec(spec[2]).then(function() {
                        change_hash = true
                    })
                }
            }
        }

        function maybe_update_hash() {
            if (change_hash) {
                fire_hash_change = false;
                location.hash = $.json_stringify(hash_commands);
                setTimeout(function() {
                    fire_hash_change = true
                }, 100)
            }
        }

        function restore_history_state() {
            try {
                if (save_state.length) {
                    var state, terminal;
                    if (history.state === null) {
                        state = save_state[0];
                        terminal = terminals.get()[0]
                    } else {
                        state = save_state[history.state.pos];
                        terminal = terminals.get()[history.state.id]
                    }
                    terminal.import_view(state.view);
                    if (state.join.length) {
                        $.each(state.join, function(_, state) {
                            var terminal = terminals.get()[state.id];
                            terminal.import_view(state.view)
                        })
                    }
                }
            } catch (e) {
                display_exception(e, "TERMINAL")
            }
        }
        var first_command = true;

        function commands(command, silent, exec) {
            if (first_command) {
                first_command = false;
                if (settings.historyState) {
                    if (!save_state.length) {
                        self.save_state()
                    } else {
                        self.save_state(null)
                    }
                }
            }

            function after_exec() {
                if (!exec) {
                    change_hash = true;
                    if (settings.historyState) {
                        self.save_state(command, false)
                    }
                    change_hash = saved_change_hash
                }
                deferred.resolve();
                if ($.isFunction(settings.onAfterCommand)) {
                    settings.onAfterCommand(self, command)
                }
            }
            try {
                if ($.isFunction(settings.onBeforeCommand)) {
                    if (settings.onBeforeCommand(self, command) === false) {
                        return
                    }
                }
                if (!exec) {
                    prev_command = $.terminal.split_command(command)
                }
                if (!ghost()) {
                    if (exec && $.isFunction(settings.historyFilter) && settings.historyFilter(command) || !settings.historyFilter) {
                        command_line.history().append(command)
                    }
                }
                var interpreter = interpreters.top();
                if (!silent) {
                    echo_command(command)
                }
                var saved_change_hash = change_hash;
                if (command.match(/^\s*login\s*$/i) && settings.login && interpreters.size() == 1) {
                    self.logout()
                } else if (command.match(/^\s*(exit|clear)\s*$/i) && !in_login) {
                    if (settings.exit && command.match(/^\s*exit\s*$/i)) {
                        var count = interpreters.size();
                        if (count == 1 && self.token() || count > 1) {
                            self.pop()
                        }
                    } else if (settings.clear && command.match(/^\s*clear\s*$/i)) {
                        self.clear()
                    }
                    if ($.isFunction(settings.onAfterCommand)) {
                        settings.onAfterCommand(self, command)
                    }
                } else {
                    var deferred = new $.Deferred;
                    var position = lines.length - 1;
                    var result = interpreter.interpreter.call(self, command, self);
                    if (result !== undefined) {
                        self.pause();
                        return $.when(result).then(function(result) {
                            if (result && position === lines.length - 1) {
                                display_object(result)
                            }
                            after_exec();
                            self.resume()
                        })
                    } else if (paused) {
                        self.bind("resume.command", function() {
                            after_exec();
                            self.unbind("resume.command")
                        })
                    } else {
                        after_exec()
                    }
                    return deferred.promise()
                }
            } catch (e) {
                display_exception(e, "USER");
                self.resume();
                throw e
            }
        }

        function global_logout() {
            if ($.isFunction(settings.onBeforeLogout)) {
                try {
                    if (settings.onBeforeLogout(self) === false) {
                        return
                    }
                } catch (e) {
                    display_exception(e, "onBeforeLogout");
                    throw e
                }
            }
            clear_loging_storage();
            if ($.isFunction(settings.onAfterLogout)) {
                try {
                    settings.onAfterLogout(self)
                } catch (e) {
                    display_exception(e, "onAfterlogout");
                    throw e
                }
            }
            self.login(settings.login, true, initialize)
        }

        function clear_loging_storage() {
            var name = self.prefix_name(true) + "_";
            $.Storage.remove(name + "token");
            $.Storage.remove(name + "login")
        }

        function maybe_append_name(interpreter_name) {
            var storage_key = self.prefix_name() + "_interpreters";
            var names = $.Storage.get(storage_key);
            if (names) {
                names = $.parseJSON(names)
            } else {
                names = []
            }
            if ($.inArray(interpreter_name, names) == -1) {
                names.push(interpreter_name);
                $.Storage.set(storage_key, $.json_stringify(names))
            }
        }

        function prepare_top_interpreter(silent) {
            var interpreter = interpreters.top();
            var name = self.prefix_name(true);
            if (!ghost()) {
                maybe_append_name(name)
            }
            command_line.name(name);
            if ($.isFunction(interpreter.prompt)) {
                command_line.prompt(function(command) {
                    interpreter.prompt(command, self)
                })
            } else {
                command_line.prompt(interpreter.prompt)
            }
            command_line.set("");
            if (!silent && $.isFunction(interpreter.onStart)) {
                interpreter.onStart(self)
            }
        }
        var local_first_instance;

        function initialize() {
            prepare_top_interpreter();
            show_greetings();
            var was_paused = false;
            if ($.isFunction(settings.onInit)) {
                onPause = function() {
                    was_paused = true
                };
                try {
                    settings.onInit(self)
                } catch (e) {
                    display_exception(e, "OnInit")
                } finally {
                    onPause = $.noop;
                    if (!was_paused) {
                        self.resume()
                    }
                }
            }
            if (first_instance && settings.historyState) {
                first_instance = false;
                if ($.fn.hashchange) {
                    $(window).hashchange(function() {
                        if (fire_hash_change) {
                            try {
                                if (location.hash) {
                                    var hash = location.hash.replace(/^#/, "");
                                    hash_commands = $.parseJSON(hash)
                                } else {
                                    hash_commands = []
                                }
                                if (hash_commands.length) {
                                    restore_state(hash_commands[hash_commands.length - 1])
                                } else if (save_state[0]) {
                                    self.import_view(save_state[0])
                                }
                            } catch (e) {
                                display_exception(e, "TERMINAL")
                            }
                        }
                    })
                } else {
                    self.error(strings.hashChangeMissing)
                }
            }
        }

        function complete_helper(command, string, commands) {
            if (settings.clear) {
                commands.push("clear")
            }
            if (settings.exit) {
                commands.push("exit")
            }
            var test = command_line.get().substring(0, command_line.position());
            if (test !== command) {
                return
            }
            var regex = new RegExp("^" + $.terminal.escape_regex(string));
            var matched = [];
            for (var i = commands.length; i--;) {
                if (regex.test(commands[i])) {
                    matched.push(commands[i])
                }
            }
            if (matched.length === 1) {
                self.insert(matched[0].replace(regex, ""))
            } else if (matched.length > 1) {
                if (tab_count >= 2) {
                    echo_command(command);
                    self.echo(matched.join("	"));
                    tab_count = 0
                } else {
                    var found = false;
                    var found_index;
                    var j;
                    loop: for (j = string.length; j < matched[0].length; ++j) {
                        for (i = 1; i < matched.length; ++i) {
                            if (matched[0].charAt(j) !== matched[i].charAt(j)) {
                                break loop
                            }
                        }
                        found = true
                    }
                    if (found) {
                        self.insert(matched[0].slice(0, j).replace(regex, ""))
                    }
                }
            }
        }

        function ghost() {
            return in_login || command_line.mask() !== false
        }

        function key_down(e) {
            var result, i, top = interpreters.top();
            if (!self.paused() && self.enabled()) {
                if ($.isFunction(top.keydown)) {
                    result = top.keydown(e, self);
                    if (result !== undefined) {
                        return result
                    }
                }
                var completion;
                if (settings.completion && $.type(settings.completion) != "boolean" && !top.completion) {
                    completion = settings.completion
                } else {
                    completion = top.completion
                }
                if ($.isFunction(settings.keydown)) {
                    result = settings.keydown(e, self);
                    if (result !== undefined) {
                        return result
                    }
                }
                self.oneTime(10, function() {
                    on_scrollbar_show_resize()
                });
                if (e.which !== 9) {
                    tab_count = 0
                }
                if (e.which === 68 && e.ctrlKey) {
                    if (!in_login) {
                        if (command_line.get() === "") {
                            if (interpreters.size() > 1 || settings.login !== undefined) {
                                self.pop("")
                            } else {
                                self.resume();
                                self.echo("")
                            }
                        } else {
                            self.set_command("")
                        }
                    }
                    return false
                } else if (e.which === 76 && e.ctrlKey) {
                    self.clear()
                } else if (completion && e.which === 9) {
                    ++tab_count;
                    var pos = command_line.position();
                    var command = command_line.get().substring(0, pos);
                    var strings = command.split(" ");
                    var string;
                    if (strings.length == 1) {
                        string = strings[0]
                    } else {
                        string = strings[strings.length - 1];
                        for (i = strings.length - 1; i > 0; i--) {
                            if (strings[i - 1][strings[i - 1].length - 1] == "\\") {
                                string = strings[i - 1] + " " + string
                            } else {
                                break
                            }
                        }
                    }
                    switch ($.type(completion)) {
                        case "function":
                            completion(self, string, function(commands) {
                                complete_helper(command, string, commands)
                            });
                            break;
                        case "array":
                            complete_helper(command, string, completion);
                            break;
                        default:
                            throw new Error(strings.invalidCompletion)
                    }
                    return false
                } else if (e.which === 86 && e.ctrlKey) {
                    self.oneTime(1, function() {
                        scroll_to_bottom()
                    });
                    return
                } else if (e.which === 9 && e.ctrlKey) {
                    if (terminals.length() > 1) {
                        self.focus(false);
                        return false
                    }
                } else if (e.which === 34) {
                    self.scroll(self.height())
                } else if (e.which === 33) {
                    self.scroll(-self.height())
                } else {
                    self.attr({
                        scrollTop: self.attr("scrollHeight")
                    })
                }
            } else if (e.which === 68 && e.ctrlKey) {
                if (requests.length) {
                    for (i = requests.length; i--;) {
                        var r = requests[i];
                        if (4 !== r.readyState) {
                            try {
                                r.abort()
                            } catch (error) {
                                self.error(strings.ajaxAbortError)
                            }
                        }
                    }
                    requests = [];
                    self.resume()
                }
                return false
            }
        }
        var self = this;
        if (this.length > 1) {
            return this.each(function() {
                $.fn.terminal.call($(this), init_interpreter, $.extend({
                    name: self.selector
                }, options))
            })
        } else {
            if (self.data("terminal")) {
                return self.data("terminal")
            }
            if (self.length === 0) {
                throw sprintf($.terminal.defaults.strings.invalidSelector, self.selector)
            }
            var scroll_object;
            var prev_command;
            var loged_in = false;
            var tab_count = 0;
            var lines = [];
            var output;
            var terminal_id = terminals.length();
            var num_chars;
            var num_rows;
            var command_list = [];
            var url;
            var in_login = false;
            var onPause = $.noop;
            var old_width, old_height;
            var dalyed_commands = [];
            var settings = $.extend({}, $.terminal.defaults, {
                name: self.selector
            }, options || {});
            var strings = $.terminal.defaults.strings;
            var enabled = settings.enabled,
                frozen;
            var paused = false;
            $.extend(self, $.omap({
                id: function() {
                    return terminal_id
                },
                clear: function() {
                    output.html("");
                    command_line.set("");
                    lines = [];
                    try {
                        settings.onClear(self)
                    } catch (e) {
                        display_exception(e, "onClear");
                        throw e
                    }
                    self.attr({
                        scrollTop: 0
                    });
                    return self
                },
                export_view: function() {
                    return {
                        focus: enabled,
                        mask: command_line.mask(),
                        prompt: self.get_prompt(),
                        command: self.get_command(),
                        position: command_line.position(),
                        lines: clone(lines),
                        interpreters: interpreters.clone()
                    }
                },
                import_view: function(view) {
                    if (in_login) {
                        throw new Error(sprintf(strings.notWhileLogin, "import_view"))
                    }
                    self.set_prompt(view.prompt);
                    self.set_command(view.command);
                    command_line.position(view.position);
                    command_line.mask(view.mask);
                    if (view.focus) {
                        self.focus()
                    }
                    lines = clone(view.lines);
                    interpreters = view.interpreters;
                    redraw();
                    return self
                },
                save_state: function(command, ignore_hash) {
                    save_state.push(self.export_view());
                    if (!$.isArray(hash_commands)) {
                        hash_commands = []
                    }
                    if (command !== undefined) {
                        var state = [terminal_id, save_state.length - 1, command];
                        hash_commands.push(state);
                        if (!ignore_hash) {
                            maybe_update_hash()
                        }
                    }
                },
                exec: function(command, silent, deferred) {
                    var d;
                    if ($.isArray(command)) {
                        return $.when.apply($, $.map(command, function(command) {
                            return self.exec(command, silent)
                        }))
                    }
                    if (paused) {
                        d = deferred || new $.Deferred;
                        dalyed_commands.push([command, silent, d]);
                        if (d) {
                            return d.promise()
                        }
                    } else {
                        var ret = commands(command, silent, true).then(function() {
                            if (deferred) {
                                deferred.resolve(self, 1)
                            }
                        });
                        if (deferred) {
                            return deferred.promise()
                        } else {
                            return ret
                        }
                        if (!ret) {
                            if (deferred) {
                                deferred.resolve(self, 2);
                                return deferred.promise()
                            } else {
                                try {
                                    d = new $.Deferred;
                                    ret = d.promise();
                                    d.resolve(self, 3)
                                } catch (e) {
                                    self.exception(e);
                                    throw e
                                }
                            }
                        }
                        return ret
                    }
                },
                autologin: function(user, token, silent) {
                    self.trigger("terminal.autologin", [user, token, silent]);
                    return self
                },
                login: function(auth, infinite, success, error) {
                    if (in_login) {
                        throw new Error(sprintf(strings.notWhileLogin, "login"))
                    }
                    if (!$.isFunction(auth)) {
                        throw new Error(strings.loginIsNotAFunction)
                    }
                    if (self.token(true) && self.login_name(true)) {
                        if ($.isFunction(success)) {
                            success()
                        }
                        return self
                    }
                    var user = null;
                    if (settings.history) {
                        command_line.history().disable()
                    }
                    in_login = true;

                    function login_callback(user, token, silent, event) {
                        if (token) {
                            while (interpreters.size() > 1) {
                                self.pop()
                            }
                            if (settings.history) {
                                command_line.history().enable()
                            }
                            var name = self.prefix_name(true) + "_";
                            $.Storage.set(name + "token", token);
                            $.Storage.set(name + "login", user);
                            in_login = false;
                            if ($.isFunction(success)) {
                                success()
                            }
                        } else {
                            if (infinite) {
                                if (!silent) {
                                    self.error(strings.wrongPasswordTryAgain)
                                }
                                self.pop().set_mask(false)
                            } else {
                                in_login = false;
                                if (!silent) {
                                    self.error(strings.wrongPassword)
                                }
                                self.pop().pop()
                            }
                            if ($.isFunction(error)) {
                                error()
                            }
                        }
                        self.off("terminal.autologin")
                    }
                    self.on("terminal.autologin", function(event, user, token, silent) {
                        login_callback(user, token, silent)
                    });
                    return self.push(function(user) {
                        self.set_mask(settings.maskChar).push(function(pass) {
                            try {
                                auth.call(self, user, pass, function(token, silent) {
                                    login_callback(user, token, silent)
                                })
                            } catch (e) {
                                display_exception(e, "USER(authentication)")
                            }
                        }, {
                            prompt: strings.password + ": "
                        })
                    }, {
                        prompt: strings.login + ": "
                    })
                },
                settings: function() {
                    return settings
                },
                commands: function() {
                    return interpreters.top().interpreter
                },
                setInterpreter: function(user_intrp, login) {
                    function overwrite_interpreter() {
                        self.pause();
                        make_interpreter(user_intrp, function(result) {
                            self.resume();
                            var top = interpreters.top();
                            $.extend(top, result);
                            prepare_top_interpreter(true)
                        })
                    }
                    if ($.type(user_intrp) == "string" && login) {
                        self.login(make_json_rpc_login(user_intrp, login), true, overwrite_interpreter)
                    } else {
                        overwrite_interpreter()
                    }
                },
                greetings: function() {
                    show_greetings();
                    return self
                },
                paused: function() {
                    return paused
                },
                pause: function() {
                    onPause();
                    if (!paused && command_line) {
                        paused = true;
                        self.disable();
                        command_line.hidden();
                        if ($.isFunction(settings.onPause)) {
                            settings.onPause()
                        }
                    }
                    return self
                },
                resume: function() {
                    if (paused && command_line) {
                        paused = false;
                        self.enable();
                        command_line.visible();
                        var original = dalyed_commands;
                        dalyed_commands = [];
                        while (original.length) {
                            self.exec.apply(self, original.shift())
                        }
                        self.trigger("resume");
                        scroll_to_bottom();
                        if ($.isFunction(settings.onResume)) {
                            settings.onResume()
                        }
                    }
                    return self
                },
                cols: function() {
                    return num_chars
                },
                rows: function() {
                    return num_rows
                },
                history: function() {
                    return command_line.history()
                },
                history_state: function(toggle) {
                    if (toggle) {
                        self.oneTime(1, function() {
                            settings.historyState = true
                        })
                    } else {
                        settings.historyState = false
                    }
                    return self
                },
                next: function() {
                    if (terminals.length() === 1) {
                        return self
                    } else {
                        var offsetTop = self.offset().top;
                        var height = self.height();
                        var scrollTop = self.scrollTop();
                        if (!is_scrolled_into_view(self)) {
                            self.enable();
                            $("html,body").animate({
                                scrollTop: offsetTop - 50
                            }, 500);
                            return self
                        } else {
                            terminals.front().disable();
                            var next = terminals.rotate().enable();
                            var x = next.offset().top - 50;
                            $("html,body").animate({
                                scrollTop: x
                            }, 500);
                            try {
                                settings.onTerminalChange(next)
                            } catch (e) {
                                display_exception(e, "onTerminalChange");
                                throw e
                            }
                            return next
                        }
                    }
                },
                focus: function(toggle, silent) {
                    if (terminals.length() === 1) {
                        if (toggle === false) {
                            try {
                                if (!silent && settings.onBlur(self) !== false || silent) {
                                    self.disable()
                                }
                            } catch (e) {
                                display_exception(e, "onBlur");
                                throw e
                            }
                        } else {
                            try {
                                if (!silent && settings.onFocus(self) !== false || silent) {
                                    self.enable()
                                }
                            } catch (e) {
                                display_exception(e, "onFocus");
                                throw e
                            }
                        }
                    } else {
                        if (toggle === false) {
                            self.next()
                        } else {
                            var front = terminals.front();
                            if (front != self) {
                                front.disable();
                                if (!silent) {
                                    try {
                                        settings.onTerminalChange(self)
                                    } catch (e) {
                                        display_exception(e, "onTerminalChange");
                                        throw e
                                    }
                                }
                            }
                            terminals.set(self);
                            self.enable()
                        }
                    }
                    self.oneTime(1, function() {});
                    return self
                },
                freeze: function(freeze) {
                    if (freeze) {
                        self.disable();
                        frozen = true
                    } else {
                        frozen = false;
                        self.enable()
                    }
                },
                frozen: function() {
                    return frozen
                },
                enable: function() {
                    if (!enabled && !frozen) {
                        if (num_chars === undefined) {
                            self.resize()
                        }
                        if (command_line) {
                            command_line.enable();
                            enabled = true
                        }
                    }
                    return self
                },
                disable: function() {
                    if (enabled && command_line && !frozen) {
                        enabled = false;
                        command_line.disable()
                    }
                    return self
                },
                enabled: function() {
                    return enabled
                },
                signature: function() {
                    var cols = self.cols();
                    var i = cols < 15 ? null : cols < 35 ? 0 : cols < 55 ? 1 : cols < 64 ? 2 : cols < 75 ? 3 : 4;
                    if (i !== null) {
                        return signatures[i].join("\n") + "\n"
                    } else {
                        return ""
                    }
                },
                version: function() {
                    return $.terminal.version
                },
                cmd: function() {
                    return command_line
                },
                get_command: function() {
                    return command_line.get()
                },
                set_command: function(command) {
                    command_line.set(command);
                    return self
                },
                insert: function(string) {
                    if (typeof string === "string") {
                        command_line.insert(string);
                        return self
                    } else {
                        throw "insert function argument is not a string"
                    }
                },
                set_prompt: function(prompt) {
                    if (validate("prompt", prompt)) {
                        if ($.isFunction(prompt)) {
                            command_line.prompt(function(callback) {
                                prompt(callback, self)
                            })
                        } else {
                            command_line.prompt(prompt)
                        }
                        interpreters.top().prompt = prompt
                    }
                    return self
                },
                get_prompt: function() {
                    return interpreters.top().prompt
                },
                set_mask: function(mask) {
                    command_line.mask(mask === true ? settings.maskChar : mask);
                    return self
                },
                get_output: function(raw) {
                    if (raw) {
                        return lines
                    } else {
                        return $.map(lines, function(item) {
                            return $.isFunction(item[0]) ? item[0]() : item[0]
                        }).join("\n")
                    }
                },
                resize: function(width, height) {
                    if (!self.is(":visible")) {
                        self.stopTime("resize");
                        self.oneTime(500, "resize", function() {
                            self.resize(width, height)
                        })
                    } else {
                        if (width && height) {
                            self.width(width);
                            self.height(height)
                        }
                        width = self.width();
                        height = self.height();
                        var new_num_chars = get_num_chars(self);
                        var new_num_rows = get_num_rows(self);
                        if (new_num_chars !== num_chars || new_num_rows !== num_rows) {
                            num_chars = new_num_chars;
                            num_rows = new_num_rows;
                            redraw();
                            if ($.isFunction(settings.onResize)) {
                                settings.onResize(self)
                            }
                            old_height = height;
                            old_width = width;
                            scroll_to_bottom()
                        }
                    }
                    return self
                },
                flush: function() {
                    try {
                        var wrapper;
                        $.each(output_buffer, function(i, line) {
                            if (line === NEW_LINE) {
                                wrapper = $("<div></div>")
                            } else if ($.isFunction(line)) {
                                wrapper.appendTo(output);
                                try {
                                    line(wrapper)
                                } catch (e) {
                                    display_exception(e, "USER:echo(finalize)")
                                }
                            } else {
                                $("<div/>").html(line).appendTo(wrapper).width("100%")
                            }
                        });
                        if (settings.outputLimit >= 0) {
                            var limit = settings.outputLimit === 0 ? self.rows() : settings.outputLimit;
                            var $lines = output.find("div div");
                            if ($lines.length > limit) {
                                var max = lines.length - limit + 1;
                                var for_remove = $lines.slice(0, max);
                                var parents = for_remove.parent();
                                for_remove.remove();
                                parents.each(function() {
                                    var self = $(this);
                                    if (self.is(":empty")) {
                                        self.remove()
                                    }
                                })
                            }
                        }
                        scroll_to_bottom();
                        output_buffer = []
                    } catch (e) {
                        alert("[Flush] " + exception_message(e) + "\n" + e.stack)
                    }
                    return self
                },
                update: function(line, string) {
                    if (line < 0) {
                        line = lines.length + line
                    }
                    if (!lines[line]) {
                        self.error("Invalid line number " + line)
                    } else {
                        lines[line][0] = string;
                        redraw()
                    }
                    return self
                },
                echo: function(string, options) {
                    string = string || "";
                    $.when(string).then(function(string) {
                        try {
                            output_buffer = [];
                            var locals = $.extend({
                                flush: true,
                                raw: settings.raw,
                                finalize: $.noop
                            }, options || {});
                            process_line(string, locals);
                            lines.push([string, $.extend(locals, {
                                exec: false
                            })]);
                            if (locals.flush) {
                                self.flush()
                            }
                            on_scrollbar_show_resize()
                        } catch (e) {
                            alert("[Terminal.echo] " + exception_message(e) + "\n" + e.stack)
                        }
                    });
                    return self
                },
                error: function(message, finalize) {
                    var str = $.terminal.escape_brackets(message).replace(/\\$/, "&#92;");
                    return self.echo("[[;;;error]" + str + "]", finalize)
                },
                exception: function(e, label) {
                    var message = exception_message(e);
                    if (label) {
                        message = "&#91;" + label + "&#93;: " + message
                    }
                    if (message) {
                        self.error(message, {
                            finalize: function(div) {
                                div.addClass("exception message")
                            }
                        })
                    }
                    if (typeof e.fileName === "string") {
                        self.pause();
                        $.get(e.fileName, function(file) {
                            self.resume();
                            var num = e.lineNumber - 1;
                            var line = file.split("\n")[num];
                            if (line) {
                                self.error("[" + e.lineNumber + "]: " + line)
                            }
                        })
                    }
                    if (e.stack) {
                        self.echo(e.stack.split(/\n/g).map(function(trace) {
                            return "[[;;;error]" + trace.replace(url_re, function(url) {
                                return "]" + url + "[[;;;error]"
                            }) + "]"
                        }).join("\n"), {
                            finalize: function(div) {
                                div.addClass("exception stack-trace")
                            }
                        })
                    }
                },
                scroll: function(amount) {
                    var pos;
                    amount = Math.round(amount);
                    if (scroll_object.prop) {
                        if (amount > scroll_object.prop("scrollTop") && amount > 0) {
                            scroll_object.prop("scrollTop", 0)
                        }
                        pos = scroll_object.prop("scrollTop");
                        scroll_object.scrollTop(pos + amount)
                    } else {
                        if (amount > scroll_object.attr("scrollTop") && amount > 0) {
                            scroll_object.attr("scrollTop", 0)
                        }
                        pos = scroll_object.attr("scrollTop");
                        scroll_object.scrollTop(pos + amount)
                    }
                    return self
                },
                logout: function(local) {
                    if (local) {
                        self.pop()
                    } else {
                        while (interpreters.size() > 0) {
                            if (self.pop()) {
                                break
                            }
                        }
                    }
                    return self
                },
                token: function(local) {
                    if (settings.globalToken) {
                        local = false
                    }
                    return $.Storage.get(self.prefix_name(local) + "_token")
                },
                set_token: function(token, local) {
                    var name = self.prefix_name(local) + "_token";
                    if (typeof token == "undefined") {
                        $.Storage.remove(name, token)
                    } else {
                        $.Storage.set(name, token)
                    }
                    return self
                },
                get_token: function(local) {
                    if (settings.globalToken) {
                        local = false
                    }
                    return $.Storage.get(self.prefix_name(local) + "_token")
                },
                login_name: function(local) {
                    return $.Storage.get(self.prefix_name(local) + "_login")
                },
                name: function() {
                    return interpreters.top().name
                },
                prefix_name: function(local) {
                    var name = (settings.name ? settings.name + "_" : "") + terminal_id;
                    if (local && interpreters.size() > 1) {
                        name += "_" + interpreters.map(function(intrp) {
                            return intrp.name
                        }).slice(1).join("_")
                    }
                    return name
                },
                read: function(message, callback) {
                    var d = new $.Deferred;
                    self.push(function(text) {
                        self.pop();
                        if ($.isFunction(callback)) {
                            callback(text)
                        }
                        d.resolve(text)
                    }, {
                        prompt: message
                    });
                    return d.promise()
                },
                push: function(interpreter, options) {
                    options = options || {};
                    if (!options.name && prev_command) {
                        options.name = prev_command.name
                    }
                    if (options.prompt === undefined) {
                        options.prompt = options.name + " "
                    }
                    var top = interpreters.top();
                    if (top) {
                        top.mask = command_line.mask()
                    }
                    make_interpreter(interpreter, options.login, function(ret) {
                        interpreters.push($.extend({}, ret, options));
                        if (options.login) {
                            var type = $.type(options.login);
                            if (type == "function") {
                                self.login(options.login, false, prepare_top_interpreter, self.pop)
                            } else if ($.type(interpreter) == "string" && type == "string" || type == "boolean") {
                                self.login(make_json_rpc_login(interpreter, options.login), false, prepare_top_interpreter, self.pop)
                            }
                        } else {
                            prepare_top_interpreter()
                        }
                    });
                    return self
                },
                pop: function(string) {
                    if (string !== undefined) {
                        echo_command(string)
                    }
                    var token = self.token(true);
                    if (interpreters.size() == 1) {
                        if (settings.login) {
                            global_logout();
                            if ($.isFunction(settings.onExit)) {
                                try {
                                    settings.onExit(self)
                                } catch (e) {
                                    display_exception(e, "onExit");
                                    throw e
                                }
                            }
                            return true
                        } else {
                            self.error(strings.canExitError)
                        }
                    } else {
                        if (self.token(true)) {
                            clear_loging_storage()
                        }
                        var current = interpreters.pop();
                        prepare_top_interpreter();
                        if ($.isFunction(current.onExit)) {
                            try {
                                current.onExit(self)
                            } catch (e) {
                                display_exception(e, "onExit");
                                throw e
                            }
                        }
                        self.set_mask(interpreters.top().mask)
                    }
                    return self
                },
                option: function(object_or_name, value) {
                    if (typeof value == "undefined") {
                        if (typeof object_or_name == "string") {
                            return settings[object_or_name]
                        } else if (typeof object_or_name == "object") {
                            $.each(object_or_name, function(key, value) {
                                settings[key] = value
                            })
                        }
                    } else {
                        settings[object_or_name] = value
                    }
                    return self
                },
                level: function() {
                    return interpreters.size()
                },
                reset: function() {
                    self.clear();
                    while (interpreters.size() > 1) {
                        interpreters.pop()
                    }
                    initialize();
                    return self
                },
                purge: function() {
                    var prefix = self.prefix_name() + "_";
                    var names = $.Storage.get(prefix + "interpreters");
                    $.each($.parseJSON(names), function(_, name) {
                        $.Storage.remove(name + "_commands");
                        $.Storage.remove(name + "_token");
                        $.Storage.remove(name + "_login")
                    });
                    command_line.purge();
                    $.Storage.remove(prefix + "interpreters");
                    return self
                },
                destroy: function() {
                    command_line.destroy().remove();
                    output.remove();
                    $(document).unbind(".terminal");
                    $(window).unbind(".terminal");
                    self.unbind("click mousewheel");
                    self.removeData("terminal").removeClass("terminal");
                    if (settings.width) {
                        self.css("width", "")
                    }
                    if (settings.height) {
                        self.css("height", "")
                    }
                    terminals.remove(terminal_id);
                    if (!terminals.length()) {
                        $(window).off("popstate", restore_history_state)
                    }
                    return self
                }
            }, function(name, fun) {
                return function() {
                    try {
                        return fun.apply(self, [].slice.apply(arguments))
                    } catch (e) {
                        if (name !== "exec" && name !== "resume") {
                            display_exception(e, "TERMINAL")
                        }
                        throw e
                    }
                }
            }));
            var on_scrollbar_show_resize = function() {
                var scroll_bars = have_scrollbars(self);
                return function() {
                    if (scroll_bars !== have_scrollbars(self)) {
                        self.resize();
                        scroll_bars = have_scrollbars(self)
                    }
                }
            }();
            if (settings.width) {
                self.width(settings.width)
            }
            if (settings.height) {
                self.height(settings.height)
            }
            var agent = navigator.userAgent.toLowerCase();
            if (!agent.match(/(webkit)[ \/]([\w.]+)/) && self[0].tagName.toLowerCase() == "body") {
                scroll_object = $("html")
            } else {
                scroll_object = self
            }
            $(document).bind("ajaxSend.terminal", function(e, xhr, opt) {
                requests.push(xhr)
            });
            output = $("<div>").addClass("terminal-output").appendTo(self);
            self.addClass("terminal");
            if (settings.login && $.isFunction(settings.onBeforeLogin)) {
                try {
                    settings.onBeforeLogin(self)
                } catch (e) {
                    display_exception(e, "onBeforeLogin");
                    throw e
                }
            }
            var auth = settings.login;
            var base_interpreter;
            if (typeof init_interpreter == "string") {
                base_interpreter = init_interpreter
            } else if (init_interpreter instanceof Array && typeof init_interpreter[0] == "string") {
                base_interpreter = init_interpreter[0]
            }
            if (base_interpreter && (typeof settings.login === "string" || settings.login)) {
                settings.login = make_json_rpc_login(base_interpreter, settings.login)
            }
            terminals.append(self);
            var interpreters;
            var command_line;
            make_interpreter(init_interpreter, settings.login, function(itrp) {
                interpreters = new Stack($.extend({
                    name: settings.name,
                    prompt: settings.prompt,
                    keypress: settings.keypress,
                    greetings: settings.greetings
                }, itrp));
                command_line = $("<div/>").appendTo(self).cmd({
                    prompt: settings.prompt,
                    history: settings.history,
                    historyFilter: settings.historyFilter,
                    historySize: settings.historySize,
                    width: "100%",
                    enabled: enabled && !is_touch(),
                    keydown: key_down,
                    keypress: function(e) {
                        var result, i, top = interpreters.top();
                        if ($.isFunction(top.keypress)) {
                            return top.keypress(e, self)
                        }
                    },
                    onCommandChange: function(command) {
                        if ($.isFunction(settings.onCommandChange)) {
                            try {
                                settings.onCommandChange(command, self)
                            } catch (e) {
                                display_exception(e, "onCommandChange");
                                throw e
                            }
                        }
                        scroll_to_bottom()
                    },
                    commands: commands
                });
                if (enabled && self.is(":visible") && !is_touch()) {
                    self.focus(undefined, true)
                } else {
                    self.disable()
                }
                self.oneTime(100, function() {
                    function disable(e) {
                        var sender = $(e.target);
                        if (!sender.closest(".terminal").length && self.enabled() && settings.onBlur(self) !== false) {
                            self.disable()
                        }
                    }
                    $(document).bind("click.terminal", disable).bind("contextmenu.terminal", disable)
                });
                var old_enabled;
                if (!is_touch()) {
                    var $win = $(window).focus(function() {
                        if (old_enabled) {
                            self.focus()
                        }
                    }).blur(function() {
                        old_enabled = enabled;
                        self.disable()
                    })
                } else {
                    self.find("textarea").blur(function() {
                        if (enabled) {
                            self.focus(false)
                        }
                    })
                }
                self.click(function(e) {
                    if (!self.enabled()) {
                        self.focus()
                    } else if (is_touch()) {
                        self.focus(true, true)
                    }
                }).delegate(".exception a", "click", function(e) {
                    var href = $(this).attr("href");
                    if (href.match(/:[0-9]+$/)) {
                        e.preventDefault();
                        print_line(href)
                    }
                });
                if (!navigator.platform.match(/linux/i)) {
                    self.mousedown(function(e) {
                        if (e.which == 2) {
                            var selected = get_selected_text();
                            self.insert(selected)
                        }
                    })
                }
                if (self.is(":visible")) {
                    num_chars = get_num_chars(self);
                    command_line.resize(num_chars);
                    num_rows = get_num_rows(self)
                }
                if (settings.login) {
                    self.login(settings.login, true, initialize)
                } else {
                    initialize()
                }
                self.oneTime(100, function() {
                    $win.bind("resize.terminal", function() {
                        if (self.is(":visible")) {
                            var width = self.width();
                            var height = self.height();
                            if (old_height !== height || old_width !== width) {
                                self.resize()
                            }
                        }
                    })
                });

                function exec_spec(spec) {
                    var terminal = terminals.get()[spec[0]];
                    if (terminal && terminal_id == terminal.id()) {
                        if (spec[2]) {
                            try {
                                return terminal.exec(spec[2]).then(function(term, i) {
                                    terminal.save_state(spec[2], true)
                                })
                            } catch (e) {
                                var cmd = $.terminal.escape_brackets(command);
                                var msg = "Error while exec with command " + cmd;
                                terminal.error(msg).exception(e)
                            }
                        }
                    }
                }
                if (settings.execHash) {
                    if (location.hash) {
                        try {
                            var hash = location.hash.replace(/^#/, "");
                            hash_commands = $.parseJSON(hash);
                            $.when.apply($, $.map(hash_commands, exec_spec)).then(function() {
                                change_hash = true
                            })
                        } catch (e) {}
                    } else {
                        change_hash = true
                    }
                } else {
                    change_hash = true
                }
                if ($.event.special.mousewheel) {
                    var shift = false;
                    $(document).bind("keydown.terminal", function(e) {
                        if (e.shiftKey) {
                            shift = true
                        }
                    }).bind("keyup.terminal", function(e) {
                        if (e.shiftKey || e.which == 16) {
                            shift = false
                        }
                    });
                    self.mousewheel(function(event, delta) {
                        if (!shift) {
                            if (delta > 0) {
                                self.scroll(-40)
                            } else {
                                self.scroll(40)
                            }
                        }
                    })
                }
            });
            self.data("terminal", self);
            return self
        }
    }
})(jQuery);