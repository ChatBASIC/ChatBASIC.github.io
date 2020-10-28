

var BASIC = {};
var that;

BASIC.program = {};
BASIC.sourceCode = {};
BASIC.variable = {};
BASIC.progPointer = "stop"; // points a line in a program
BASIC.linePointer = 0;      // points a statement in a line
BASIC.nextProgPointer = "stop";
BASIC.nextLinePointer = "stop";
BASIC.forLoopStack = [];


const print = function (txt) {

    ui.t(txt);
}

const input = function (txt, vname) {

    ui.t(txt, (r) => { window[vname] = r; });
}

const edit = function (lineNumber, compiled, sourceCode) {

    BASIC.program[lineNumber] = compiled;
    BASIC.sourceCode[lineNumber] = sourceCode
}

const run = function (start) {

    BASIC.progPointer = BASIC.orderedLines().filter(l => l >= (start || 0))[0];

    while (BASIC.progPointer) {

        BASIC.nextProgPointer = BASIC.orderedLines().filter(l => l > BASIC.progPointer)[0];
        
        BASIC.that = BASIC.execute(BASIC.program[BASIC.progPointer], BASIC.linePointer);
        
        if (BASIC.linePointer < BASIC.program[BASIC.progPointer].length-1) {
            BASIC.linePointer++;
        } else {
            BASIC.progPointer = BASIC.nextProgPointer;
            BASIC.linePointer = 0;
        }
    }

    BASIC.progPointer = "stop";
}

const goto = function (n) {

    BASIC.nextProgPointer = BASIC.orderedLines().filter(l => l >= n)[0];
    BASIC.nextLinePointer = 0;
}

const list = function (rawStart, rawEnd) {

    var lineList = BASIC.orderedLines();

    var start = rawStart || lineList[0];
    var end = rawEnd || lineList[lineList.length - 1];

    lineList.filter(l => l >= start && l <= end).forEach(l => { print(l + ' ' + BASIC.sourceCode[l]); });
}

const cls = function () {
    ui.t();
}

BASIC.execute = function (compiled, statementIndex) {

    //console.log("[execute linePointer]", BASIC.linePointer);

    if (BASIC.skip) {
        //console.log("[skipped]");
        BASIC.skip = false;
        return BASIC.that;
    }

    if (compiled) {
        return compiled[statementIndex](BASIC, statementIndex);
    } else {
        alert(JSON.stringify(compiled, null, 4));
    }
}

BASIC.compile = function (code, linenum) {

    try {

        //console.log("[parse]", parser.parse(code + '\n'));
        return parser.parse(code + '\n').map(parsed => new Function("BASIC", parsed));

    } catch (e) {

        BASIC.err = "Syntax error: " + e.message;
        if (linenum) BASIC.erl = linenum;
        return null;
    }
}

BASIC.evalInput = function (cmd) {

    var first = cmd.substr(0, cmd.indexOf(' '));
    var lineNumber = parseInt(first);
    if (first.length > 0 && !isNaN(lineNumber)) {

        let compiled = BASIC.compile(cmd.substr(first.length), lineNumber);
        if (compiled) {
            edit(lineNumber, compiled, cmd.substr(first.length).trim());
        } else {
            print(BASIC.err);
        }

    } else {

        let compiled = BASIC.compile(cmd);
        if (compiled) {
            BASIC.linePointer = 0;
            while (BASIC.linePointer <= compiled.length-1) {
                //console.log("[evalInput linePointer]", BASIC.linePointer);
                //console.log("[evalInput compiled.length]", compiled.length);
                //console.log("[evalInput compiled]", compiled.toString());
                BASIC.that = BASIC.execute(compiled, BASIC.linePointer);
                BASIC.linePointer++;
            }    
        } else {
            
            print(BASIC.err);
        }
        print("Ready");
    }
}

BASIC.orderedLines = function () {
    return Object.keys(BASIC.program).map(t => parseInt(t)).sort((a, b) => { a < b });
}

BASIC.raiseError = function (err) {

    BASIC.err = err;
    BASIC.erl = BASIC.progPointer;
}

BASIC.pushForLoop = function(variable, startv, endv, stepv, progPointer, linePointer) {

    BASIC.forLoopStack.push({
        variable: variable,
        currentv: startv,
        endv: endv,
        stepv: stepv,
        progPointer: progPointer,
        linePointer: linePointer
    });
};







BASIC.PRINT = (line) => {
    //console.log("print");
    print(line.join(''));
};

BASIC.SETVAR = (vname, vtype, vindex, value) => {
    if (typeof value == vtype.toLowerCase())
        BASIC.variable[vname + '(' + vindex + ')'] = value;
    else
        BASIC.raiseError("Type mismatch");
};

BASIC.GETVAR = (vtype, vname, vindex) => {
    return BASIC.variable[vname + '(' + vindex + ')'];
};

BASIC.CONDITIONAL = (condition, then_s, else_s) => {

    if (condition) then_s(BASIC);
    else {
        if (else_s) else_s(BASIC);
    }
};

BASIC.FORLOOP = (variable, startv, endv, stepv) => {

    //console.log("for");
    BASIC.pushForLoop(variable, startv, endv, stepv, BASIC.progPointer, BASIC.linePointer);
    var topmost = BASIC.forLoopStack[BASIC.forLoopStack.length-1];
    BASIC.SETVAR(topmost.variable.identifier, topmost.variable.vartype, topmost.variable.index, topmost.currentv);
};

BASIC.NEXT = () => {

    var topmost = BASIC.forLoopStack[BASIC.forLoopStack.length-1];
    var precondition = true;
    if (topmost.stepv == 0) precondition = false;
    if (topmost.stepv > 0 && (topmost.currentv > topmost.endv - topmost.stepv)) precondition = false;
    if (topmost.stepv < 0 && (topmost.currentv < topmost.endv - topmost.stepv)) precondition = false;
    if (precondition && (topmost.currentv != topmost.endv)) {
        
        topmost.currentv += topmost.stepv;
        BASIC.SETVAR(topmost.variable.identifier, topmost.variable.vartype, topmost.variable.index, topmost.currentv);

        BASIC.nextProgPointer = topmost.progPointer;
        BASIC.linePointer = topmost.linePointer;

        if (BASIC.progPointer != "stop") BASIC.skip = true;

    } else {

        BASIC.forLoopStack.pop();
    }
};

BASIC.RUN = () => {
    run();
}




BASIC.wrongType = function () {

    for (let a = 0; a < arguments.length; a += 2) {
        if (arguments[a].type != arguments[a + 1]) return {
            expected: arguments[a + 1],
            found: arguments[a].type
        };
    }
    return false;
}
