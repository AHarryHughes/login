const express = require('express');
const bodyParser = require('body-parser');
const mustache = require('mustache-express');
const expressValidator = require('express-validator');
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

var storage = {
    users: [],
    sessionId: 0,
    sessions: []
};

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

        response.redirect('/');
    }
});

application.listen(3000);