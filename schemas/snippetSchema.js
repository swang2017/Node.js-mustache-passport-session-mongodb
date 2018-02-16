const mongoose = require('mongoose')

let snippetSchema = mongoose.Schema({

title:String,
body:String,
tag:String,
userId:String,
author:String
})

let Snippet =  mongoose.model('Snippet', snippetSchema)
module.exports = Snippet
