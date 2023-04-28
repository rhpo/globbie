require('node-json-color-stringify')
const colors = require('colors');

// The PROTON PROGRAMMING LANGUAGE (2022-2023).

var int = 0
function log(any) {
    int++
    return any
}

const DEBUG_SWITCHES = {

    tokenizer: 1
}

/** @param {string} i **/
const type = i => {

    let abc = '$abcdefghijklmnopqrstuvwxyz_çéèà'.split('')
    let number = '0123456789'.split('')
    let symbol = './,-+*`!?|/\\=&#:<^>~()[]{}@\'"%'.split('')
    let nothing = '\t '.split('')

    let result;
    if (abc.includes(i.toLowerCase())) return "letter"
    else if (number.includes(i)) return "number"
    else if (symbol.includes(i)) return "symbol"
    else if (nothing.includes(i)) return "whitespace"

    return result || "unknown"
}

const DataTypes = {
    IDENTIFIER: 'IDENTIFIER',
    COMPLEX_IDENTIFIER: 'COMPLEX_IDENTIFIER',
    KEYWORD: "KEYWORD",
    OPERATOR: "OPERATOR",
    ASSIGNMENT_OPERATOR: 'ASSIGNMENT_OPERATOR',
    STRING_LITERAL: 'STRING_LITERAL',
    INTEGER_LITERAL: 'INTEGER_LITERAL',
    FLOAT_LITERAL: "FLOAT_LITERAL",
    BOOLEAN_LITERAL: 'BOOLEAN_LITERAL',
    COLON: 'COLON',
    // DEF_KEYWORD: 'DEF_KEYWORD',
    END_KEYWORD: 'END_KEYWORD',
    COMMA: 'COMMA',
    QUESTION_MARK: 'QUESTION_MARK',
    PROGRAM_END: 'PROGRAM_END',

    AND: "AND",
    INVERT_BOOLEAN: "INVERT_BOOLEAN",

    LBRACKET: "LBRACKET",
    RBRACKET: "RBRACKET",
    RPAREN: "RPAREN",
    LPAREN: "LPAREN",
};


const KEYWORDS = 'call end def if else return while return exit'.split(' ')

class Token {

    /**
     *
     * @param {string} type
     * @param {string} value
     * @param {string} raw
     */
    constructor(type, value, raw, indexRaw) {
        this.type = type
        this.value = value
        this.raw = raw
        this.indexRaw = indexRaw
    }

    get object() {

        const { type, value, raw } = this

        return {
            type,
            value,
            raw: raw || value,
            index: cursorInfo || 0,
            indexRaw: `${line}:${row}`
        }
    }
}

// *** LEXICAL ANALYSIS ***
class Proton {

    /** @param {string} code */

    constructor(code) {
        this.code = code

        this.line = 1
        this.row = 0

    }

    /**
     * @type {Array<Token>} tokens
     */
    get tokens() {

        /**
         * @type {Array<Token>} tokens
         */
        const tokens = []

        var char = ''

        var cursorInfo


        class Token {

            /**
             *
             * @param {string} type
             * @param {string} value
             * @param {string} raw
             */
            constructor(type, value, raw, indexRaw) {
                this.type = type
                this.value = value
                this.raw = raw
                this.indexRaw = indexRaw
            }

            get object() {

                const { type, value, raw } = this

                return {
                    type,
                    value,
                    raw: raw || value,
                    index: cursorInfo || 0,
                    indexRaw: `${this.indexRaw}`
                }
            }
        }

        const token = (type, value, raw) => {

            tokens.push(new Token(type, value, raw, `${this.line}:${this.row}`))

            return true
        }

        function err(str, title, pos) {
            throw (title ? title + ": " + str : str) + ` at line ${pos?.line}, column ${pos?.row}`
        }

        let all = []

        for (var cursor = 0; cursor <= this.code.length; cursor++) {

            cursorInfo = cursor
            char = this.code[cursor]

            if (cursor === this.code.length) {
                token(DataTypes.PROGRAM_END);
                return tokens;
            }

            switch (char) {

                case "#":
                    while (char !== '\n') {
                        cursor++
                        char = this.code[cursor]
                    }

                    this.line++

                    break

                case "\n":
                    this.line++
                    this.row = 0

                    // tokens[tokens.length - 1].type !== "end-block" && token("end-block", 0, "\\n");
                    break

                default:
                    switch (type(char)) {

                        case "letter":

                            let identifier = ""

                            A: while (cursor < this.code.length) {

                                char = this.code[cursor]

                                if (char === '.') {
                                    if (identifier === '' || tokens[tokens.length - 1] && tokens[tokens.length - 1].value === '.') {
                                        return err("Unexpected '.'", 'SyntaxError', {
                                            line: this.line,
                                            row: this.row
                                        });
                                    }

                                    all.push(identifier);
                                    identifier = ""

                                    cursor++
                                }

                                else {

                                    function isParen(c) {
                                        return ["(", "{", "[", ")", "}", "]"].includes(c)
                                    }

                                    function is(i) {
                                        return (type(char) === "symbol" && char === ':')
                                    }

                                    if (type(char) === "whitespace" || isParen(char)) {
                                        break A;
                                    }

                                    else if (type(char) !== 'letter' && !is(':') && !is(',')) {
                                        err(`Invalid character ${char}`, 'SyntaxError', {
                                            line: this.line,
                                            row: this.row
                                        });
                                    }

                                    identifier += char
                                    cursor++
                                }

                            }

                            cursor--;
                            all.push(identifier)

                            if (['true', "false"].includes(identifier))
                                token(DataTypes.BOOLEAN_LITERAL, identifier === 'true' ? true : false, identifier);
                            else if (KEYWORDS.includes(identifier))
                                token(DataTypes.KEYWORD, identifier, identifier);
                            else if (all.length === 1)
                                token(DataTypes.IDENTIFIER, identifier, identifier);
                            else
                                token(DataTypes.COMPLEX_IDENTIFIER, identifier, all);

                            all = []
                            break

                        case "number":

                            let float = false, number = "", beforeOptional

                            B: while (cursor < this.code.length) {

                                char = this.code[cursor]

                                if (type(char) !== 'number') {

                                    if (char === '.') {

                                        if (float) err("Unexpected '.'", 'SyntaxError');

                                        beforeOptional = number
                                        float = true
                                        number = ""
                                    }

                                    else if (type(char) === 'whitespace') break B;

                                    else {
                                        err(`Invalid character '${char}'`, 'SyntaxError', {
                                            line: this.line,
                                            row: this.row
                                        })
                                    }
                                }

                                number += char !== "." ? char : ""
                                cursor++

                            }

                            if (float && !number) {
                                err("Unexpected '.'", 'SyntaxError', {
                                    line: this.line,
                                    row: this.row
                                })
                            }

                            let formed = float ? parseFloat(beforeOptional + "." + number) : parseInt(number);

                            cursor--
                            token(float ? DataTypes.FLOAT_LITERAL : DataTypes.INTEGER_LITERAL, formed, formed.toString());

                            break

                        case "symbol":

                            switch (char) {

                                case "+":
                                case "-":
                                case "*":
                                case "/":
                                case "%":
                                case "²":
                                case "^":
                                    token(DataTypes.OPERATOR, char);
                                    break;

                                case "=":
                                    token(DataTypes.ASSIGNMENT_OPERATOR, char);
                                    break;

                                case "&":
                                    token(DataTypes.AND, char);
                                    break

                                case ":":
                                    token(DataTypes.COLON, char);
                                    break

                                case "!":
                                    token(DataTypes.INVERT_BOOLEAN, char);
                                    break
                                case "?":
                                    token(DataTypes.QUESTION_MARK, char);
                                    break;

                                case ".":
                                    err("Unexpected '.'", 'SyntaxError');
                                    break;

                                case ",":
                                    token(DataTypes.COMMA, char);
                                    break

                                case "(":
                                    token(DataTypes.LPAREN, char);
                                    break;

                                case ")":
                                    token(DataTypes.RPAREN, char);
                                    break;

                                case "{":
                                    token(DataTypes.LBRACKET, char);
                                    break;

                                case "}":
                                    token(DataTypes.RBRACKET, char);
                                    break;

                                case '"':
                                case "'":

                                    let opener = char

                                    let string = ""

                                    A: while (cursor < this.code.length) {

                                        cursor++
                                        char = this.code[cursor]

                                        if (char === opener) break A

                                        string += char

                                    }


                                    if (char !== opener) err('Unterminated string', 'SyntaxError');

                                    token(DataTypes.STRING_LITERAL, string, `"${string}"`);

                                    break;

                                default:
                                    err(`Invalid symbol '${char}'`, 'SyntaxError');
                                    break
                            }

                            break

                        case "whitespace":
                            // Do nothing
                            break

                        case "unknown":
                            err(`Invalid character '${char}'`, 'SyntaxError');
                            break
                    }
            }

            this.row++

        }

        if (DEBUG_SWITCHES.tokenizer)
            console.log(tokens.map(e => e.type + " " + e.value).join('\n'));

        return tokens.map(e => e.object);

    }
}

class ASTNode {
    /**
     * @param {string} type Type
     * @param {any} value Value
     * @param {Array} children Node's Children
     * @param {object} properties
     */
    constructor(type, value, children, properties) {
        this.type = type;
        this.value = value || null;
        this.children = children || [];
        this.properties = properties || {}
    }
}

const Nodes = {

    Function: class Function {

        constructor(name, argumentList, body) {

            this.arguments = argumentList || []
            this.children = body
            this.properties = { name };
            this.children = []
        }
    },

    Argument: class FunctionArgument {

        constructor(name, alternativeValue) {
            this.name = name
            this.value = alternativeValue
        }
    }
}

/**
 * @param {Array<Token>} tokens
 */
function checkSyntax(tokens) {

    var stairs = 0
    var lastRaw
    var lastToken = new Token;

    tokens.forEach(token => {

        if (token.type === 'bracket') {

            switch (token.value) {

                case "(":
                    stairs++
                    break

                case ")":
                    stairs--
                    break
            }

            lastRaw = token.indexRaw
            lastToken = token

            if (stairs < 0)
                throw `Unexpected token ${token.type}, at: ${lastRaw}`

        }
    });


    if (stairs !== 0)
        throw `Unexpected token ${lastToken.type}, at: ${lastRaw}`
}

const generateAST = require('./proton-ast.js')

module.exports = {
    Proton,
    ASTNode
}

const input = require('prompt-sync')();

while (true) {

    // let code = input('>>> ')

    let test = process.argv.length > 2;

    let code = test ? input('>>> ') : require('fs').readFileSync('./example.gm').toString();

    if (code) {
        let proton = new Proton(code);

        console.log(JSON.colorStringify(proton.tokens, null, 2));
        // console.log(JSON.colorStringify(new generateAST(proton.tokens).render(), null, 2));

        !test || code === 'exit' && process.exit();
    }
}
