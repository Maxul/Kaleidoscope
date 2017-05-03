/*
 * lexer: tokenize input stream into lexemes list
 */
function kaleidoscope_lex(input)
{
    var token_list = [];
    var index = 0;

    var ch;                     /* current character */

    // private methods using RE
    function isDigit(c) { return /[\d\.]/.test(c); }
    function isOp(c) { return /[\+\-\*\/\(\)\,\=]/.test(c); }
    function isSpace(c) { return /\s/.test(c); }
    function isId(c) { return "string" === typeof c && !isOp(c) && !isSpace(c); }

    // read a character once from stream buffer
    function advance() { return ch = input[++index]; }

    function addToken(token) { token_list.push(token); }

    function getToken()
    {
        if (index >= input.length)
            return null;

        // getChar()
        ch = input[index];

        // skip all whitespaces
        while (isSpace(ch))
            ch = advance();
        
        if (isOp(ch)) {
            var ret = {node: ch};
            advance();
            return ret;
        }
        
        if (isDigit(ch)) {
            var num = ch;
            
            while (isDigit(advance(ch)))
                num += ch;
            num = parseFloat(num);
            if (!isFinite(num))
                throw "Number is too large or too small for a 64-bit floating-point.";
            return {node: "num", value: num};
        }
        
        // can be either variables or subroutines
        if (isId(ch)) {
            var id = ch;

            while (isId(advance()))
                id += ch;
            return {node: "id", value: id};
        }

        throw "Unrecognized token.";
    }

    while (1) {
        var token = getToken();
        console.log( JSON.stringify(token) );
        if (null === token)
            break;
        addToken(token);
    }
    
    addToken({node: "EOF"});           /* no more tokens */
    console.log( JSON.stringify(token_list) );
    return token_list;
}

