'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');

var cors = require('cors');

var app = express();

// var router = express.Router();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

var Schema = mongoose.Schema;
var SubmittedUrlSchema = new Schema({
  oldUrl: String,
  newUrl: Number
});
var SubmittedUrl = mongoose.model('SubmittedUrl', SubmittedUrlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});

function startProcess(url, res) {
  var checkLen = function() {
    // Find the number of items to determine which number to assign the new post to
    SubmittedUrl.find(function(err, data){
      if (err) return console.error(err);
      findUrl(url, data.length, res);
    });
  }
  // Check if website exists
  // dns.lookup(url, null, function(err, address, family) {
  //   if (err) return console.error(err);
  //   console.log(address);
  //   console.log(family);
  //   // checkLen();
  // });
  checkLen();
};

function findUrl(url, dbLength, res) {
  SubmittedUrl.find({oldUrl: url}, function(err, data) {
    if (err) return console.error(err);
    if (data.length > 0) {
      console.log("Already exists: " + data);
      res.json({original_url: data[0].oldUrl, short_url: data[0].newUrl});
    } else {
      console.log("new! " + dbLength);
      var freshUrl = new SubmittedUrl({oldUrl: url, newUrl: dbLength});
      postUrl(freshUrl, res);
    }
  });
};

function postUrl(url, res) {
  url.save(function(err) {
    if (err) return console.error(err);
    console.log("Posted: " + url.oldUrl, url.newUrl);
    res.json({original_url: url.oldUrl, short_url: url.newUrl});
  });
};

app.post('/api/shorturl/new/', function(req, res) {
  var regex = /http(s?):\/\/(www.)?\w{3,}\.\w+/g;
  var url = req.body.url;
  regex.test(url) ? startProcess(url, res) : res.json({"error":"invalid URL"});
});

app.get('/api/shorturl/:num?', function(req, res) {
  var num = req.params.num;
  // res.json({number: num});
  SubmittedUrl.find({newUrl: num}, function(err, data) {
    if (err) return console.error(err);
    console.log(data);
    if (data.length > 0) {
      res.redirect(data[0].oldUrl);
    } else {
      res.json({"error": "numeric id not in database"});
    }
  });
});