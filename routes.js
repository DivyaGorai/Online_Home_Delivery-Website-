const express = require('express');
const routes = express.Router();
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const async = require('async');
const shortid = require('shortid');
const user = require('./models.js');

const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const nodemailer = require('nodemailer');
const { urlencoded } = require('express');
const { assert } = require('console');




const accountSid = 'AC48b772fb04ef149ba252a152b5b0ebfa';
const authToken = '1d81c477b5ac377e336526ae26c151d1';
const client = require('twilio')(accountSid, authToken);


//const mongourl = require('./config/mongokey');


//console.log(shortid.generate());

// using Bodyparser for getting form data
routes.use(bodyparser.urlencoded({ extended: true }));
// using cookie-parser and session 
routes.use(cookieParser('secret'));
routes.use(session({
    secret: 'secret',
    maxAge: 3600000,
    resave: true,
    saveUninitialized: true,
}));
// using passport for authentications 
routes.use(passport.initialize());
routes.use(passport.session());
// using flash for flash messages 
routes.use(flash());

// MIDDLEWARES
// Global variable
routes.use(function (req, res, next) {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');
    next();
});



    


const checkAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    } else {
        res.redirect('/login');
    }
}

// Connecting To Database
// using Mongo Atlas as database
mongoose.connect('mongodb+srv://user1:Divya@12345@cluster0-jfx3z.mongodb.net/user1?retryWrites=true&w=majority', {
    useNewUrlParser: true, useUnifiedTopology: true,
}).then(() => console.log("Database Connected..........")
);


// ALL THE ROUTES 
routes.get('/', (req, res) => {
    res.render('index');
})
routes.get('/register', (req, res) => {
    res.render('register');
})

routes.post('/register', (req, res) => {
    var { email, username, password, confirmpassword } = req.body;
    var err;
    if (!email || !username || !password || !confirmpassword) {
        err = "Please Fill All The Fields...";
        res.render('register', { 'err': err });
    }
    if (password != confirmpassword) {
        err = "Passwords Don't Match";
        res.render('register', { 'err': err, 'email': email, 'username': username });
    }
    if (typeof err == 'undefined') {
        user.findOne({ email: email }, function (err, data) {
            if (err) throw err;
            if (data) {
                console.log("User Exists");
                err = "User Already Exists With This Email...";
                res.render('register', { 'err': err, 'email': email, 'username': username });
            } else {
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        password = hash;
                        user({
                            email,
                            username,
                            password,
                        }).save((err, data) => {
                            if (err) throw err;
                            req.flash('success_message', "Registered Successfully.. Login To Continue..");
                            res.redirect('/login');
                        });
                    });
                });
            }
        });
    }
});


// Authentication Strategy
// ---------------
var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({ usernameField: 'email' }, (email, password, done) => {
    user.findOne({ email: email }, (err, data) => {
        if (err) throw err;
        if (!data) {
            return done(null, false, { message: "User Doesn't Exists.." });
        }
        bcrypt.compare(password, data.password, (err, match) => {
            if (err) {
                return done(null, false);
            }
            if (!match) {
                return done(null, false, { message: "Password Doesn't Match" });
            }
            if (match) {
                return done(null, data);
            }
        });
    });
}));

passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    user.findById(id, function (err, user) {
        cb(err, user);
    });
});
// ---------------
// end of autentication statregy

routes.get('/login', (req, res) => {
    res.render('login');
});


routes.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/success',
        failureFlash: true,
    })(req, res, next);
});



routes.get('/success', checkAuthenticated, (req, res) => {
    res.render('success', { 'user': req.user });
});

routes.get('/send', (req, res) => {
   res.render('success');
  });



routes.get('/feedback', (req, res) => {
    res.render('feedback')
});

routes.post('/send', (req, res, next) => {
     const output = `
    <p>You have a new order request</p>
    <h3>Order Details</h3>
    <ul>  
      <li>Name: ${req.user.username}</li>
      <li>Phone: ${req.body.phone}</li>
      <li>Date: ${req.body.date}</li>
      <li>Choose: ${req.body.choose}</li>
      <li>Quantity: ${req.body.quantity}</li>
      <li>Breakfast: ${req.body.breakfast}</li>
      <li>Lunch: ${req.body.lunch}</li>
      <li>Dinner: ${req.body.dinner}</li>
    </ul>
    <h3>Address</h3>
    <p>${req.body.message}</p>
  `;
  

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: 'divyagorai@gmail.com',
            pass: '7098792824',
        },
    });

    let mailOptions = {
        from: '"Order details" <divyagorai@gmail.com>',
        to: 'heartdivs@gmail.com',
        subject: 'Node Contact Request',
        text: "Fork&Knife",
        html: output
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        res.render('ok', { username: req.user.username, phone: req.body.phone, date: req.body.date, choose: req.body.choose, quantity: req.body.quantity, breakfast: req.body.breakfast, lunch: req.body.lunch, dinner: req.body.dinner, message: req.body.message, email: req.user.email, id: shortid.generate() });


    });

    client.messages
    .create({
         body: output,
        from: '+12059272835',
       to: '+916201334039'
    })
     .then(message => console.log(message.sid));

});






routes.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

routes.post('/addmsg', checkAuthenticated, (req, res) => {
    user.findOneAndUpdate(
        { email: req.user.email },
        {
            $push: {
                messages: req.body['msg']
            }
        }, (err, suc) => {
            if (err) throw err;
            if (suc) console.log("Added Successfully...");
        }
    );
    res.redirect('/success');
});

// forgot password

routes.get('/forgot', function(req, res) {
  res.render('forgot');
});

routes.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      user.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },


    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'divyagorai@gmail.com',
          pass: '7098792824'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'divyagorai@gmail@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('Email sent for reset password');
        req.flash('success_message', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

routes.get('/reset/:token', function(req, res) {
  user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

routes.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirmpassword) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'divyagorai@gmail.com',
          pass: '7098792824'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'divyagorai@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/login');
  });
});


module.exports = routes;
