


var sizes = localStorage.getItem('split-sizes')

if (sizes) {
    sizes = JSON.parse(sizes)
} else {
    sizes = [50, 50]
}



Split(["#editor", "#terminal"], {
    sizes: sizes,
    gutterSize: 5,
    direction: "vertical",
    elementStyle: function (dimension, size, gutterSize) {
        return {
            'height': 'calc(' + size + 'vh - ' + gutterSize + 'px - 2em)',
        }
    },
    onDragEnd: function (sizes) {
        localStorage.setItem('split-sizes', JSON.stringify(sizes))
    },
});


var jQueryTerminal = $('#terminal').terminal(function (command) {
    if (command !== '') {
        try {
            var result = termBASIC.evalInput(command);
            if (typeof result != "undefined") this.echo(JSON.stringify(result, null, 4));
        } catch (e) {
            this.echo(e.message);
            this.echo("Ready");
        }
    }
}, {
    greetings: 'Ready',
    name: 'term',
    prompt: '',
    historySize: 100
});


new EnhancedTextarea(document.getElementById("editor"));


var ui = {
    toolbarButtons: {},
    e: function (txt) { // editor
        try {
            if (typeof txt == "undefined") return document.getElementById("editor").value;
            document.getElementById("editor").value = txt;
        } catch (e) {
            console.error(e.message);
        }
    },
    b: function (name, code) { // buttons
        try {
            if (typeof code == "undefined") {
                document.getElementById(name).outerHTML = '';
                delete ui.toolbarButtons[name];
            } else {
                document.getElementById("toolbar").innerHTML +=
                    `<span id="${name}" class="button" onclick="ui.toolbarButtons['${name}']()">${name}</span>`;
                ui.toolbarButtons[name] = code;
            }
        } catch (e) {
            console.error(e.message);
        }
    },
    t: function (txt, handler) { // terminal
        try {
            if (typeof handler == "undefined") {
                if (typeof txt == "undefined") {
                    jQueryTerminal.clear();
                    //jQueryTerminal.echo("Ready");
                } else {
                    jQueryTerminal.echo(txt);
                }
            } else {
                jQueryTerminal.read(txt, input => { handler(input); });
            }
        } catch (e) {
            console.error(e.message);
        }
    },
    s: function (k, v) { // storage
        try {
            if (typeof v == "undefined") {
                if (typeof k == "undefined") {
                    return Object.keys(localStorage);
                } else {
                    if (arguments.length == 1)
                        return JSON.parse(localStorage[k]);
                    else
                        delete localStorage[k];
                }
            } else {
                return localStorage[k] = JSON.stringify(v);
            }
        } catch (e) {
            console.error(e.message);
        }
    },
};


/* View in fullscreen */
ui.openFullscreen = function openFullscreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
        ui.fullscreen = true;
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
        ui.fullscreen = true;
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
        ui.fullscreen = true;
    }
};

/* Close fullscreen */
ui.closeFullscreen = function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
        ui.fullscreen = false;
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        ui.fullscreen = false;
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        ui.fullscreen = false;
    }
};


ui.b("Toggle Fullscreen", () => { if (ui.fullscreen) ui.closeFullscreen(); else ui.openFullscreen(); });
ui.b("Clear Editor", () => { ui.e(''); });
ui.b("Clear Terminal", () => { ui.t(); });


setInterval(function () {
    var time = new Date();
    document.getElementById("time").innerHTML = time.getHours().toLocaleString(undefined, { minimumIntegerDigits: 2 }) + ':' + time.getMinutes().toLocaleString(undefined, { minimumIntegerDigits: 2 }) + '.' + time.getSeconds().toLocaleString(undefined, { minimumIntegerDigits: 2 });
}, 1000);