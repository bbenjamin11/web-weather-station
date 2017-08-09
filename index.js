var path    = require("path");
var express = require("express");
var app     = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){

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

app.listen(3000);
