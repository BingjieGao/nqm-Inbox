/**
 * Created by toby on 18/10/15.
 * Modified by Alex on 2/06/16.
 */

module.exports = (function() {
  var log = require("debug")("AppProcess");
  var config = require("./config.json");
  var base64url = require("base64url");
  var http = require("http");
  var https = require("https");
  var gRequest = require('request');
  var querystring = require("querystring");
  var fs = require('fs');
  var google = require('googleapis');
  var googleAuth = require('google-auth-library');
  var _accessToken;
  var https = require('https');
  var readline = require('readline');

  var CMD_GET_MSG = "/message?id=";
  var CMD_GET_PAGE = "/page?id=";

  var SCOPES = ['https://mail.google.com/'];
  var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
  var TOKEN_PATH = 'gmail-nodejs-quickstart.json';
  var oauth2Client;

  var bodyParser = require('body-parser');

  // re-generate token
  function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    });
  };

  function storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
  }
  // Load client secrets from a local file.                                      
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      log('Error loading client secret file: ' + err);
      return;
    }
    log("client_secrets.json Loaded.");
    authorize(JSON.parse(content));
  });

  function AppProcess(args, watchdog) {
    this._args = require("minimist")(args);
    this._watchdog = watchdog;
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
          getNewToken(oauth2Client,function(oauth){
          console.log("new token");
          console.log(oauth);
        })
        console.log("Get new Token for client!!!");
        return;
      } else {
        oauth2Client.credentials = JSON.parse(token);
        log(oauth2Client.credentials.access_token);
      }
    });
  }

  function getBody(message) {
    var encodedBody = '';
    if(typeof message.parts === 'undefined')
      encodedBody = message.body.data;
    else
      encodedBody = getHTMLPart(message.parts);
    //encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    //return decodeURIComponent(escape(window.atob(encodedBody)));
    return base64url.decode(encodedBody);
  }

  function getHTMLPart(arr) {
    for(var x = 0; x <= arr.length; x++) {
      if(typeof arr[x].parts === 'undefined') {
        if(arr[x].mimeType === 'text/html')
          return arr[x].body.data;
      } else
        return getHTMLPart(arr[x].parts);
    }

    return '';
  }

  AppProcess.prototype.run = function() {
    var self = this;

    var express = require('express');
    var app = express();
    var path = require("path");


    app.set("views", __dirname + "/views");
    app.set('view engine', 'jade');
    app.use(express.static(__dirname  + '/public'));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.get('/', function (req, res) {
      res.redirect("/inbox");
    });

    var getMessages = function(o2c, page_token, maxResults, cb) {
      var gmail = google.gmail('v1');
      var maillist = [];
      var itemproc = 0;
      var token_str='';

      if (page_token!='0') token_str = page_token;

      gmail.users.messages.list({
        auth: o2c,
        userId: 'me',
        pageToken: token_str
      }, function(err, response) {
        msgid = 0;
        if (err) {
          log('The API returned an error: ' + err);
          return;
        }
        for (var idx in response.messages) {
          //console.log(response.messages);
          gmail.users.messages.get({
            auth: o2c,
            userId: 'me',
            id: response.messages[idx].id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date']
          }, function(err, gmailres){
            var fromfield, subjectfield, datefield;
            if(err)
              console.log(err);
            if(gmailres.labelIds == 'undefined'||gmailres.labelIds == '');
            //console.log('labels are');
            //console.log(gmailres.labelIds);
            //console.log(gmailres.labelIds.length);
            if(gmailres.labelIds != 'undefined') {
              if (gmailres.labelIds.indexOf('INBOX') > -1) {
                for (var i = 0; i < 3; i++) {
                  if (gmailres.payload.headers[i].name == 'From')
                    fromfield = gmailres.payload.headers[i].value;
                  else if (gmailres.payload.headers[i].name == 'Subject')
                    subjectfield = gmailres.payload.headers[i].value;
                  else if (gmailres.payload.headers[i].name == 'Date')
                    datefield = gmailres.payload.headers[i].value;
                }
                maillist.push({
                  id: ++msgid,
                  msgid: gmailres.id,
                  folder: '1',
                  from: fromfield,
                  subject: subjectfield,
                  date: datefield,
                  prevpage: page_token,
                  nextpage: response.nextPageToken
                });
              }
            }
            if(++itemproc==response.messages.length)
              cb(maillist);
          });
        }
      });
    };

    var sendMessages = function(o2c,email,cb){
      var gmail = google.gmail('v1');
      var base64EncodedEmail = new Buffer(email).toString('base64');
      base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_');
      console.log(base64EncodedEmail);
      gmail.users.messages.send({
        auth:o2c,
        userId:'me',
        resource:{
          raw:base64EncodedEmail
        }
      },function(err,result){
        if(err)
          console.log("error"+err);
        console.log(result);
        cb(err,result);
      });
    }

    var deleteMessages = function(o2c,msgid,cb){
      var gmail = google.gmail('v1');
      gmail.users.messages.delete({
        auth:o2c,
        userId:'me',
        'id':msgid
      },function(err,result){
        if(err)
          console.log(err);
        console.log(result);
        cb(err,result);
      })
    }

    app.get("/inbox", function(req, result) {
      log("In Inbox");
      //var url = "https://q.nqminds.com/v1/datasets/HJlxrOl0d/data";
      // https.get(url, function(res){
      // 	var body = '';
      // 	res.on('data',function(chunk){
      // 		body += chunk;
      // 	});
      // 	res.on('end',function(){
      // 		var cbresponse = JSON.parse(body);
      // 		console.log('get response end');
      // 		console.log(cbresponse['data']);
      // 		result.render('inbox', { messages:cbresponse['data'] });
      // 	})
      // });

///*
      getMessages(oauth2Client, '0', 0, function(maillist){
        result.render("inbox", { messages: maillist });
      });
//*/		
    });

    app.get("/page/", function(req, res){
      console.log("GET /page/ *******");
      getMessages(oauth2Client, req.url.substr(CMD_GET_PAGE.length), 0, function(maillist){
        res.end({messages: maillist});
      });
    });

    app.get(/message/, function(req, res){
      console.log("GET /message/ ********");
      var gmail = google.gmail('v1');
      gmail.users.messages.get({
        auth: oauth2Client,
        userId: 'me',
        id: req.url.substr(CMD_GET_MSG.length),
        format: 'full'
      }, function(err, gmailres){
        var htmlcode = getBody(gmailres.payload);
        if (htmlcode=='')
          res.end("Error parsing.");
        else res.end(htmlcode);
      });
    });

    app.post("/send",function(req,res,next){
      console.log(req.body.message);
      console.log(req.body.content);
      var message = req.body.message;
      var content = req.body.content;

      var email = [];
      message = JSON.parse(message);
      content = JSON.parse(content);

      email.push("From: \"bingjie\" <bingjie@nquiringminds.com>");
      email.push("To: "+message["To"]);
      email.push("Cc: "+message["Cc"]);
      email.push('Content-type: text/html;charset=iso-8859-1');
      email.push('MIME-Version: 1.0');
      email.push("Subject: "+message['Subject']);
      email.push("");
      email.push(content.html);
      email = email.join('\r\n').trim();
      console.log(email);

      sendMessages(oauth2Client,email,function(err,result){
        if(err)
          consold.log(err);
        else
          res.send('SUCCESS');
      });
    });

    app.post("message",function(req,res,next){
      var msgid = req.query.id;
      console.log('reply mesgid is=>'+req.query.id);
      var message = req.body.message;
      var content = req.body.content;

      var email = [];
      message = JSON.parse(message);
      content = JSON.parse(content);

      email.push("From: \"bingjie\" <bingjie@nquiringminds.com>");
      email.push("To: "+message["To"]);
      email.push("Cc: "+message["Cc"]);
      email.push('Content-type: text/html;charset=iso-8859-1');
      email.push('MIME-Version: 1.0');
      email.push("Subject: "+message['Subject']);
      email.push("In-Reply-To: "+msgid);
      email.push("");
      email.push(content.html);
      email = email.join('\r\n').trim();
      console.log(email);
      sendMessages(oauth2Client,email,function(err,result){
        if(err)
          console.log(err);
        console.log(result);
      })

    })

    app.delete(/message/,function(req,res,next){
      var message_id = req.url.substr(CMD_GET_MSG.length);
      var id = req.query.id;
      console.log('delete message =>'+message_id);
      console.log('delete query id is => '+id);
      deleteMessages(oauth2Client,req.query.id,function(err,result){
        console.log(result);
      })
      res.send('delete message id=>'+message_id);
    })

    app.get("/login",function(req,res,next){
      res.render("login");
    });

    app.get(/oauth2callback/,function(req,res,next){
      var oauthCode = req.query.code;
      console.log(req.query.code);
      // Set the headers
      var headers = {
        'User-Agent':       'HTTP/1.1',
        'Content-Type':     'application/x-www-form-urlencoded'
      };
      // Configure the request
      var options = {
        url: 'https://www.googleapis.com/oauth2/v4/token?',
        method: 'POST',
        headers: headers,
        qs: {
          'grant_type':'authorization_code',
          'code': oauthCode,
          'client_id': '34234327356-ouiojrg05qps9sp0dtgca5mmo9r3n8e5.apps.googleusercontent.com',
          'client_secret':'sydN50rSG6lAroDaldB84wCa',
          'redirect_uri':'http://localhost:3000/oauth2callback',
          'response_type':'token'
          }
      };
      console.log(options)
      gRequest(options,function(err,result,body){
        if(err)
        console.log(err);
        else {
          console.log(body);
          storeToken(JSON.parse(body));
          fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
              log('Error loading client secret file: ' + err);
              return;
            }
            log("client_secrets.json Loaded.");
            authorize(JSON.parse(content));
            console.log('read end');
          });
          console.log('end');
          res.redirect('/inbox');
        }
      })

    })

    var server = app.listen(3000, function () {
      var host = server.address().address;
      var port = server.address().port;

      console.log('Example app listening at http://%s:%s', host, port);
    });
  };
  return AppProcess;
}())
