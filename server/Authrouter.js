const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const Authrouter = express.Router();
const authenticate = require('./middleware');
const {check,validationResult} = require('express-validator/check');
const connection  = require('./lib/db');

//Authentications all TABs.
Authrouter.get('/', authenticate.isloggedIn, function(req, res)
{
      res.render('Auth/login',{
            title: 'Login',
            session: res.locals.session,
            errors: res.locals.errors,
            error: res.locals.error
      });
});

//authenticate user
Authrouter.post('/',[
      check('username','Username is required').not().isEmpty(),
      check('userpassword','Password is required').not().isEmpty()
    ],async function(req, res, next) {
      var err = validationResult(req);
      if(!err.isEmpty()){
            var errors = err.array();
            var messages = {};
            errors.forEach(function(error){
                  messages[error.param] = error.msg;
            });
            req.flash('errors',messages);
            res.redirect('/');
      } else {
            const user_name = req.body.username;
            const salt = await bcrypt.genSaltSync(10);
            const userpassword = await bcrypt.hash(req.body.userpassword, salt);
            console.log('userP',userpassword);
            connection.query(mysql.format('SELECT * FROM lc_users WHERE username = ? OR phone = ?', [user_name,user_name]), function(err, rows, fields) {
                  
                  if(err) throw err
                  if(rows.length!=0)
                  {
                        if(rows[0]["status"] == 1){
                              var password_hash = rows[0]["password"];
                              const verified = bcrypt.compareSync(req.body.userpassword, password_hash);
                              if(verified) {
                                    req.session.loggedin = true;
                                    req.session.user = {id: rows[0]['uid'], fname: rows[0]['fname'], lname: rows[0]['lname'], role: rows[0]['role']};
                                    req.session.save();
                                    console.log('user session',req.session);
                                    res.redirect('/dashboard');
                              } else {
                                    req.flash('error', 'Please enter correct username and Password!')
                                    res.redirect('/')
                              }
                        } else {
                              req.flash('error', 'Your account is deactive. Kindly contact to the site administartor!')
                              res.redirect('/')
                        }
                  } else {
                        req.flash('error', 'Please enter correct username and Password!')
                        res.redirect('/')
                  }
            });
      }
});

Authrouter.get('/forgot', function(req, res)
{
      res.locals = {  title: 'Password Recovery' };
      res.render('Auth/pages_recoverpw');
});

module.exports = Authrouter;