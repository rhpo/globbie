// *** SYNTACTIC ANALYSIS ***

class Variable {
    constructor(name, value, constant = false) {
        this.name = name
        this.value = value
        this.constant = !!constant
    }
}

var DATATYPES = {
    string: "string",
    float: "float",
    int: "int",
    bool: "bool",
    operator: "operator",
    end: "end",
    identifier: "identifier",
    keyword: "keyword",
    special: "special",
    bracket: "bracket",
    access: "access",
}

const database = {
    variables: {
        'foo': new Variable('foo', "hello Fooie!"),
    }
}
class Proton {
    constructor(tokens) {
        this.tokens = tokens
        this.index = 0

        this.lookahead = this.getNextToken();
    }

    hasMoreTokens() {
        return this.index < this.tokens.length
    }

    getNextToken(temp = false) {
        if (!this.hasMoreTokens()) {
            return null
        }

        const { type, value } = this.tokens[this.index];

        !temp && this.index++

        return {
            type,
            value
        }
    }

    eat(tokenType, expectedValue = true) {
        const token = this.lookahead

        if (token == null) {
            throw new SyntaxError(`Unexpected end of input, expected "${tokenType}"`)
        }

        if (token.type !== tokenType) {
            throw new SyntaxError(
                `Unexpected token: "${token.value}", expected "${tokenType}"`
            )
        }

        if (token.value !== expectedValue) {
            throw new SyntaxError(
                `Unexpected character: "${token.value}", expected "${expectedValue}"`
            )
        }

        this.lookahead = this.tokenizer.getNextToken()

        return token
    }

    /**
   * StatementList
   *    = Statement+
   */
    StatementList() {
        const statementList = [this.Statement()]

        while (this.lookahead !== null) {
            statementList.push(this.Statement())
        }

        return statementList
    }

    /**
     * Statement
     *    = VariableStatement
     *    / PrintStatement
     *    / ExpressionStatement
     */
    Statement() {
        let nextToken = this.getNextToken(true);

        if (this.lookahead.type === DATATYPES.identifier) {
            if (nextToken.type === DATATYPES.operator) {
                switch (nextToken.value) {
                    case "=":
                        return this.VariableStatement()

                    case "+":
                    case "-":
                    case "*":
                    case "/":
                    case "%":
                    case "**":
                        return this.ExpressionStatement()
                }
            }

            else if (nextToken.type === DATATYPES.bracket) {
                switch (nextToken.value) {
                    case "(":
                        return this.ExpressionStatement()
                    case ")":
                        return this.ExpressionStatement()
                }
            }
        }


        // else if ()

        // if (this.lookahead.type === TokenTypes.PRINT) {
        //     return this.PrintStatement()
        // }

        return this.ExpressionStatement()
    }

    /**
     * VariableStatement
     *    = "var" IDENTIFIER "=" Expression ";"
     */
    VariableStatement() {
        const name = this.eat(DATATYPES.identifier).value
        this.eat(DATATYPES.operator, "=");
        const value = this.Expression()
        // this.eat(DATATYPES.end)

        const isUpperCase = name.toUpperCase() === name
        database.variables[name] = new Variable(name, value, isUpperCase)
    }

    /**
     * PrintStatement
     *    = "print" ParenthesizedExpression ";"
     */
    // PrintStatement() {
    //     this.eat(TokenTypes.PRINT)
    //     const expression = this.ParenthesizedExpression()
    //     this.eat(TokenTypes.SEMICOLON)
    //     console.log(expression)
    // }

    /**
     * ExpressionStatement
     *    = Expression ";"
     */
    ExpressionStatement() {
        const expression = this.Expression()
        this.eat(DATATYPES.end)
        return expression
    }

    /**
     * Expression
     *    = Prefix (Infix)*
     */
    Expression(prec = 0) {
        let left = this.Prefix()

        while (prec < this.getPrecedence(this.lookahead)) {
            left = this.Infix(left, this.lookahead?.type)
        }

        return left
    }

    /**
     * Prefix
     *    = ParenthesizedExpression
     *    / UnaryExpression
     *    / VariableOrFunctionExpression
     *    / NUMBER
     */
    Prefix() {
        if (this.lookahead.type === TokenTypes.PARENTHESIS_LEFT) {
            return this.ParenthesizedExpression()
        }

        if (this.lookahead.type === TokenTypes.SUBTRACTION) {
            return this.UnaryExpression()
        }

        if (this.lookahead.type === TokenTypes.IDENTIFIER) {
            return this.VariableOrFunctionExpression()
        }

        const token = this.eat(TokenTypes.NUMBER)
        return Number(token.value)
    }

    /**
     * Infix
     *    = ("+" / "-" / "*" / "/" / "^") Expression
     */
    Infix(left, operatorType) {
        let token = this.eat(operatorType)
        let newPrec = this.operators[token.value]
        switch (token.type) {
            case TokenTypes.ADDITION:
                return left + this.Expression(newPrec)
            case TokenTypes.SUBTRACTION:
                return left - this.Expression(newPrec)
            case TokenTypes.MULTIPLICATION:
                return left * this.Expression(newPrec)
            case TokenTypes.DIVISION:
                return left / this.Expression(newPrec)
            case TokenTypes.EXPONENTIATION:
                return left ** this.Expression(newPrec - 1)
        }
    }

    /**
     * ParenthesizedExpression
     *    = "(" Expression ")"
     */
    ParenthesizedExpression() {
        this.eat(TokenTypes.PARENTHESIS_LEFT)
        const expression = this.Expression()
        this.eat(TokenTypes.PARENTHESIS_RIGHT)
        return expression
    }

    /**
     * UnaryExpression
     *    = "-" Expression
     */
    UnaryExpression() {
        this.eat(TokenTypes.SUBTRACTION)
        return -this.Expression(this.getPrecedence('unary'))
    }

    /**
     * VariableOrFunctionExpression
     *    = FunctionExpression
     *    / Variable
     */
    VariableOrFunctionExpression() {
        const id = this.eat(TokenTypes.IDENTIFIER).value

        // if (this.lookahead.type === TokenTypes.PARENTHESIS_LEFT) {
        return this.FunctionExpression(id)
        // }

        return this.Variable(id)
    }

    /**
     * Variable
     *    = IDENTIFIER
     */
    Variable(id) {
        return database.variables[id].value;
    }

    /**
     * FunctionExpression
     *    = IDENTIFIER ParenthesizedExpression
     */
    FunctionExpression(id) {
        const expression = this.ParenthesizedExpression()
        return this.trig(id, expression)
    }
}

module.exports = Proton
