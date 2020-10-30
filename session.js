


var session = {

    export: function() {

        var result = JSON.parse(JSON.stringify(this.data));
        for (int in result.interpreters) delete result.interpreters[int].program;
        console.log(JSON.stringify(result, null, 4));
    },

    data: {
        interpreters: {},
        terminal: [],
        editor: ''
    }
};












