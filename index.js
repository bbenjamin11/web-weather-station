var path    = require("path");
var express = require("express");
var app     = express();
var expressWs = require('express-ws')(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

/* use less ??!!
app.use(function (req, res, next) {
 console.log('middleware');
 req.testing = 'testing';
 return next();
});
*/
app.get('/',function(req,res){
  console.log("--get--");
  var myStations = [
    {
      name: "Capgemini 1",
      position: {lat: 43.5668035, lng: 1.3783154}
    },
    {
      name: "Capgemini 3",
      position: {lat: 43.6668035, lng: 1.3783154}
    }
  ];

  res.render('index', {data :{stations : myStations}});
});


app.ws('/', function(ws, req) {
  console.log("web socket up");
  ws.on('message', function(msg) {
    console.log(msg);
  });
  //console.log('socket', req.testing);
});

app.listen(3000);
