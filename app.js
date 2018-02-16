
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const methodOverride = require("method-override")
const Snippet = require('./schemas/snippetSchema')
const User = require('./schemas/userSchema')
const mustacheExpress = require('mustache-express');
const db = mongoose.connection

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

app.use(bodyParser.urlencoded({ extended:false }))
app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache')
app.use(express.static('statics'))

mongoose.connect('mongodb://localhost/SinppetApp')
mongoose.set("debug", true)


db.once('open', function(){console.log("database is connected")})
app.use(require('express-session')({
  secret : 'cat',
  resave :false,
  saveUninitialized : false
}))

// setting up passport
app.use(passport.initialize())
app.use(passport.session())

// passport Strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {return done(null, "user does not exist"); }
      if (!bcrypt.compareSync(password,user.password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

// serialize
passport.serializeUser(function(user,done){
  done(null,user)
})

// deserialize
passport.deserializeUser(function(user,done){
  done(null,user)
})

app.get('/register',function(req,res){
  res.render('register')
})


app.post('/register',function(req,res){

  let username = req.body.username
  let email = req.body.email
  let password = bcrypt.hashSync(req.body.password,8)

  let user = new User({ username: username, email : email, password : password })

  user.save(function(error,newUser){
    res.redirect('/renderSnippets')
  })
})

app.get('/',function(req,res){
  res.render('login')
})


app.post('/login',passport.authenticate('local',{
  failureRedirect : '/',
  successRedirect : '/renderSnippets'
}))

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/snippets/json',function(req,res){

  Snippet.find(function(error,snippets){
    res.json(snippets)
  }).select('-__v')

})

// get all snippets
app.get('/renderSnippets',function(req,res){
  Snippet.find({"author":req.user.username},function(error,snippets){
    res.render("snippets",{ "snippets" : snippets, "author" : req.user.username })
  })

})

app.get('/renderAllSnippets',function(req,res){
  Snippet.find(function(error,snippets){
    res.render("renderALLSnippets",{ "snippets" : snippets, "author" : req.user.username })
  })

})

app.get('/uploadNewSnippets',function(req,res){
  res.render('uploadNewSnippets', {"author" : req.user.username })
})

app.post('/snippetDetails',function(req,res){
  let snippetId = req.body.snippetId
  var ObjectId = require('mongodb').ObjectID;

  Snippet.find({"_id" : ObjectId(snippetId)},function(error,snippets){
    res.render("snippetDetails",{ "snippets" : snippets, "author" : req.user.username})
  })

})
app.post('/snippet', function(req,res){

    let title = req.body.title
    let body = req.body.body
    let tag = req.body.tag
    let userId =req.sessionID
    let author = req.user.username

    let snippet = new Snippet({ title: title, body : body, tag : tag, userId : userId, author : author})

    snippet.save(function(error,newSnippet){
      res.redirect('/renderSnippets')
    })

})

app.post('/deleteSnippet', function(req, res) {
    let snippetId = req.body.snippetId

        var collection = db.collection('snippets');
        var ObjectId = require('mongodb').ObjectID;

        collection.remove(
            {_id : ObjectId(snippetId)}, function(err, result) {
            if (err) {
                console.log(err);
            } else {
              res.redirect('/renderSnippets')}})});

app.listen(3000,function(){
  console.log("Server started....")
})
