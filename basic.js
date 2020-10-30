


function Interpreter(id, src) {

    this.program = {};
    this.sourceCode = {};
    this.variable = {};
    this.progPointer = "stop"; // points to a line in a program
    this.linePointer = 0;      // points to a statement in a line
    this.nextProgPointer = "stop";
    this.nextLinePointer = "stop";
    this.forLoopStack = [];
    this.orderedLines = []; // line numbers, in order

    this.id = id;
    session.data.interpreters[id] = this;
}



Interpreter.prototype.raiseError = function (err) {

    this.err = err;
    this.erl = this.progPointer;
};



Interpreter.prototype.run = function (start) {

    this.progPointer = this.orderedLines.filter(l => l >= (start || 0))[0];

    while (this.progPointer) {

        if (this.linePointer < this.program[this.progPointer].length - 1) {
            this.nextLinePointer = this.linePointer + 1;
            this.nextProgPointer = this.progPointer;
        } else {
            this.nextProgPointer = this.orderedLines.filter(l => l > this.progPointer)[0]; // todo: enhance
            this.nextLinePointer = 0;
        }

        this.that = this.execute(this.program[this.progPointer], this.linePointer);

        this.progPointer = this.nextProgPointer;
        this.linePointer = this.nextLinePointer;
    }

    this.progPointer = "stop";
};



Interpreter.prototype.refreshOrderedLines = function () {

    this.orderedLines = Object.keys(this.program).map(t => parseInt(t)).sort((a, b) => { a < b });
};



Interpreter.prototype.cls = function () {

    ui.t();
};



Interpreter.prototype.print = function (txt) {

    ui.t(txt);
};



Interpreter.prototype.input = function (txt, vname) {

    ui.t(txt, (r) => { window[vname] = r; });
};



Interpreter.prototype.edit = function (lineNumber, compiled, sourceCode) {

    this.program[lineNumber] = compiled;
    this.sourceCode[lineNumber] = sourceCode

    this.refreshOrderedLines();
};



Interpreter.prototype.goto = function (n) {

    this.nextProgPointer = this.orderedLines.filter(l => l >= n)[0];
    this.nextLinePointer = 0;
};



Interpreter.prototype.list = function (rawStart, rawEnd) {

    var start = rawStart || this.orderedLines[0];
    var end = rawEnd || this.orderedLines[this.orderedLines.length - 1];

    this.orderedLines.filter(l => l >= start && l <= end).forEach(l => { this.print(l + ' ' + this.sourceCode[l]); });
};



Interpreter.prototype.execute = function (compiled, statementIndex) {
    
    if (this.skip) {

        this.skip = false;
        return this.that;
    }

    if (compiled) {
        return compiled[statementIndex](this);
    } else {
        alert(JSON.stringify(compiled, null, 4));
    }
};



Interpreter.prototype.compile = function (code, linenum) {

    try {

        return parser.parse(code + '\n').map(parsed => new Function("BASIC", parsed));

    } catch (e) {

        this.err = "Syntax error: " + e.message;
        if (linenum) this.erl = linenum;
        return null;
    }
};



Interpreter.prototype.evalInput = function (cmd) {

    var first = cmd.substr(0, cmd.indexOf(' '));
    var lineNumber = parseInt(first);

    if (first.length > 0 && !isNaN(lineNumber)) {

        let compiled = this.compile(cmd.substr(first.length), lineNumber);
        if (compiled) {
            this.edit(lineNumber, compiled, cmd.substr(first.length).trim());
        } else {
            this.print(this.err);
        }

    } else {

        let compiled = this.compile(cmd);
        if (compiled) {
            this.linePointer = 0;
            while (this.linePointer <= compiled.length - 1) {
                this.that = this.execute(compiled, this.linePointer);
                this.linePointer++;
            }
        } else {

            this.print(this.err);
        }
        this.print("Ready");
    }
};



Interpreter.prototype.pushForLoop = function (variable, startv, endv, stepv, progPointer, linePointer) {

    this.forLoopStack.push({
        variable: variable,
        currentv: startv,
        endv: endv,
        stepv: stepv,
        progPointer: progPointer,
        linePointer: linePointer
    });
};



Interpreter.prototype.PRINT = function (line) {

    this.print(line.join(''));
};



Interpreter.prototype.SETVAR = function (vname, vtype, vindex, value) {
    if (typeof value == vtype.toLowerCase())
        this.variable[vname + '(' + vindex + ')'] = value;
    else
        this.raiseError("Type mismatch");
};



Interpreter.prototype.GETVAR = function (vtype, vname, vindex) {
    return this.variable[vname + '(' + vindex + ')'];
};



Interpreter.prototype.CONDITIONAL = function (condition, then_s, else_s) {

    if (condition) then_s(this);
    else {
        if (else_s) else_s(this);
    }
};



Interpreter.prototype.FORLOOP = function (variable, startv, endv, stepv) {

    this.pushForLoop(variable, startv, endv, stepv, this.progPointer, this.linePointer);
    var topmost = this.forLoopStack[this.forLoopStack.length - 1];
    this.SETVAR(topmost.variable.identifier, topmost.variable.vartype, topmost.variable.index, topmost.currentv);
};



Interpreter.prototype.NEXT = function () {

    var topmost = this.forLoopStack[this.forLoopStack.length - 1];
    var precondition = true;
    if (topmost.stepv == 0) precondition = false;
    if (topmost.stepv > 0 && (topmost.currentv > topmost.endv - topmost.stepv)) precondition = false;
    if (topmost.stepv < 0 && (topmost.currentv < topmost.endv - topmost.stepv)) precondition = false;
    if (precondition && (topmost.currentv != topmost.endv)) {

        topmost.currentv += topmost.stepv;
        this.SETVAR(topmost.variable.identifier, topmost.variable.vartype, topmost.variable.index, topmost.currentv);

        this.nextProgPointer = topmost.progPointer;
        this.linePointer = topmost.linePointer;

        if (this.progPointer != "stop") this.skip = true;

    } else {

        this.forLoopStack.pop();
    }
};



Interpreter.prototype.RUN = function () {
    this.run();
};



Interpreter.prototype.LIST = function () {
    this.list();
};



Interpreter.prototype.wrongType = function () {

    for (let a = 0; a < arguments.length; a += 2) {
        if (arguments[a].type != arguments[a + 1]) return {
            expected: arguments[a + 1],
            found: arguments[a].type
        };
    }
    return false;
};
