/*
 * evaluate: iterate each parse node and do syntax analysis
 */
function kaleidoscope_evaluate(parse_tree)
{
    var ops = {
        // take the place of LHS with RHS when only RHS exists
        "+": function(a, b) { return "undefined" === typeof b ? +a : a + b; },
        "-": function(a, b) { return "undefined" === typeof b ? -a : a - b; },
        "*": function(a, b) { return a * b; },
        "/": function(a, b) { return a / b; },
    };

    var args = {};
    function parseTree(root)
    {
        if ("num" === root.node) {
            return root.value;
        }
        else if (ops[root.node]) {
            if (root.lhs)
                return ops[root.node](parseTree(root.lhs), parseTree(root.rhs));
            else
                return ops[root.node](parseTree(root.rhs));
        }
        else if ("assign" === root.node) {
            variables[root.name] = parseTree(root.value);
        }
        else if ("call" === root.node) {
            if ("undefined" === typeof functions[root.name])
                throw "Function \"" + root.name + "\" is undefined";

            for (var i = 0; i < root.args.length; ++i)
                root.args[i] = parseTree(root.args[i]);
            return functions[root.name].apply(null, root.args);
        }
        else if ("func" === root.node) {
            // register a new function
            functions[root.name] = function() {
                var ret;

                for (var i = 0; i < root.args.length; ++i)
                    args[root.args[i].value] = arguments[i];
                ret = parseTree(root.value);
                args = {}; // clear all
                return ret;
            };
        }
        else if ("id" === root.node) {
            var val;

            if (args.hasOwnProperty(root.value))
                val = args[root.value];
            else
                val = variables[root.value];

            if ("undefined" === typeof val)
                throw "Variable \"" + root.value + "\" is undefined";
            return val;
        }
    }

    // main process of evaluating parse node
    var output = "";

    for (var i = 0; i < parse_tree.length; ++i) {
        console.log( parse_tree[i] );
        var value = parseTree(parse_tree[i]);
        if ("undefined" !== typeof value)
            output += value + "\n";
    }
    return output;
}
