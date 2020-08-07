const express = require('express');
const app = express();
const routes = require('./routes');
const path = require('path');
const favicon = require('serve-favicon');



app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", 'favicon.ico')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.get('/', routes);
app.get('/register', routes);
app.post('/register', routes);
app.get('/login', routes);
app.post('/login', routes);
app.get('/success', routes);
app.post('/success', routes);
app.get('/send', routes);
app.get('/feedback', routes);
app.post('/feedback', routes);
app.post('/sendfeed', routes)
app.get('/sendfeed', routes)
app.post('/send', routes);
app.get('/logout', routes);
app.get('/forgot', routes);
app.post('/forgot', routes);
app.get('/reset/:token', routes);
app.post('/reset/:token', routes);

app.post('/addmsg', routes);



const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log("Server Stated At Port", PORT));
