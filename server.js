const express = require('express');
const bodyParser = require('body-parser');
const mustache = require('mustache-express');
const fs = require('fs');
const cookieParser = require('cookie-parser');


var application = express();

application.engine('mustache', mustache());

application.set('views', './views');
application.set('view engine', 'mustache');

application.use(bodyParser());
application.use(cookieParser());
application.use(bodyParser.urlencoded({ extended: true }));

application.use((request, response, next) => {
    if (request.cookies.session !== undefined) {
        var sessionId = parseInt(request.cookies.session);
        var user = storage.sessions[sessionId];

        if (!user) {
            response.locals.user = { isAuthenticated: false };
        }
        else {
            response.locals.user = { isAuthenticated: true };
        }
    } else {
        response.locals.user = { isAuthenticated: false };
    }

    next();
});

var model = {};
model.log_in_count = 0;
model.sign_up_count = 0;
model.button_count = 0;
model.is_logged_in = false;
model.word = 'tmp';
model.word_array = [];
model.guess_word_array = [];

const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

var storage = {
    users: [],
    sessionId: 0,
    sessions: []
};

function get_random_word() {
  var random_index = Math.floor(Math.random() * (words.length));
  return words[random_index];
}

function game_setup(){
    model.word = get_random_word();
    model.word_array = model.word.split('');
    model.guess_word_array = [];
    for(var i in model.word_array){
        model.guess_word_array.push('_');
    }
}

function letter_guess(letter){
    while(model.word_array.indexOf(letter) > -1){
       var letter_index = model.word_array.indexOf(letter);
       model.word_array.splice(letter_index, 1, '_');
       model.guess_word_array.splice(letter_index, 1, letter);
    }
}

application.get('/', (request, response) => {
    response.render('index', model);
});

application.post('/', (request, response) => {
    model.button_count++;
    model.is_logged_in = false;
    response.locals.user = { isAuthenticated: false };
    response.render('index', model);
});

application.get('/sign_up', (request, response) => {
    response.render('sign_up', model);
});

application.post('/sign_up', (request, response) => {
    model.sign_up_count++;
    var user = {
        username: request.body.username,
        password: request.body.password
    }

    storage.users.push(user);


    response.redirect('/log_in');
});

application.get('/log_in', (request, response) => {
    response.render('log_in', model);
});

application.post('/log_in', (request, response) => {
    model.log_in_count++;
    var username = request.body.username;
    var password = request.body.password;


    var user = storage.users.find(user => { return user.username === username && user.password === password })

    if (!user) {
        response.render('log_in', model);
    } else {
        var sessionId = storage.sessionId;
        storage.sessionId++;
        storage.sessions.push(user);

        response.cookie('session', sessionId);
        model.is_logged_in = true;

        response.redirect('/game');
    }
});

application.get('/game', (request, response) => {
    var sessionId = parseInt(request.cookies.session);
    var user = storage.sessions[sessionId];
    game_setup();


    if(response.locals.user.isAuthenticated === false){
        response.render('log_in', model);
    }
    else{
        response.render('game', model);
    }
});

application.post('/game', (request, response) => {
    letter_guess(request.body.guess);
    response.render('game', model);
});


application.get('/game_restart', (request, response) => {
    game_setup();
    response.render('game', model);
});

application.listen(3000);