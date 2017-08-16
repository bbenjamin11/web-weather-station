var path    = require("path");
var express = require("express");
var app     = express();
var expressWs = require('express-ws')(app);
var fs = require('fs');

var myStations = [];

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
  myStations = [
    {
      name: "Capgemini 1",
      position: {lat: 43.5668035, lng: 1.3783154},
      data:[
        {
          date:"2017-07-14T13.00.00",
          temperature:28.4,
          pressure:1000.3,
          hygrometry:59,
          snow:0
        },{
          date:"2017-07-14T14.00.00",
          temperature:29.4,
          pressure:1000,
          hygrometry:50,
          snow:0
        },{
          date:"2017-07-14T15.00.00",
          temperature:30.4,
          pressure:1000,
          hygrometry:40,
          snow:0
        },{
          date:"2017-07-14T16.30.00",
          temperature:30,
          pressure:1000.3,
          hygrometry:30,
          snow:0
        },
      ]
    },
    {
      name: "Capgemini 3",
      position: {lat: 43.6668035, lng: 1.3783154},
      data:[
        {
          date:"2017-07-14T13.40.00",
          temperature:28.4,
          pressure:1000.3,
          hygrometry:59,
          snow:0
        },{
          date:"2017-07-14T14.40.00",
          temperature:29.4,
          pressure:1000,
          hygrometry:50,
          snow:0
        },{
          date:"2017-07-14T14.50.00",
          temperature:30.4,
          pressure:1000,
          hygrometry:40,
          snow:0
        },{
          date:"2017-07-14T15.00.00",
          temperature:30,
          pressure:1000.3,
          hygrometry:30,
          snow:0
        },
      ]
    }
  ];

  var stations=[]
  myStations.forEach(function(element){
    var d = {};
    d.name = element.name;
    d.position = element.position;
    stations.push(d);
  });


  res.render('index', {data :{stations : stations}});
});


app.ws('/', function(ws, req) {
  console.log("web socket up");
  ws.on('message', function(msg) {
    console.log(msg);
    var msg = JSON.parse(msg);

    if(msg.type == "getStationInfo"){
      /* simulation data */
      data =  {
        "date": "2017-07-14T13:45:25",
        "temperature": 31.4,
        "pressure": 1000.3,
        "hygrometry": 59,
        "snow": 0
      }

      list = getListData(myStations,msg.station);
      console.log(list);

      var optLine1 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
      optLine1.scales.yAxes[0].scaleLabel.labelString = "°C";
      var configT = {
        type: 'line',
        data: {
          labels:list[0],
          datasets: [{
                  label: "Temperature",
                  backgroundColor: 'rgb(255, 0, 0)',
                  borderColor: 'rgb(255, 0, 0)',
                  data: list[1],
                  fill: false,
                  yAxisID: "y-axis-0",
              }
            ]
        },
        options: optLine1

      };
      var optLine2 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
      optLine1.scales.yAxes[0].scaleLabel.labelString = "%";
      var configH = {
        type: 'line',
        data: {
          labels:list[0],
          datasets: [{
                  label: "Hygrometry",
                  backgroundColor: 'rgb(0, 0, 255)',
                  borderColor: 'rgb(0, 0, 255)',
                  data: list[2],
                  fill: false,
                  yAxisID: "y-axis-0",
              }
            ]
        },
        options: optLine2

      };
      var optLine3 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
      optLine1.scales.yAxes[0].scaleLabel.labelString = "Pa";
      var configP = {
        type: 'line',
        data: {
          labels:list[0],
          datasets: [{
                  label: "Pressure",
                  backgroundColor: 'rgb(128, 0, 255)',
                  borderColor: 'rgb(128, 0, 255)',
                  data: list[3],
                  fill: false,
                  yAxisID: "y-axis-0",
              }
            ]
        },
        options: optLine3

      };
      var optLine4 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
      optLine1.scales.yAxes[0].scaleLabel.labelString = "m";
      var configS = {
        type: 'line',
        data: {
          labels:list[0],
          datasets: [{
                  label: "Snow",
                  backgroundColor: 'rgb(0, 255, 0)',
                  borderColor: 'rgb(0, 255, 0)',
                  data: list[4],
                  fill: false,
                  yAxisID: "y-axis-0",
              }
            ]
        },
        options: optLine4

      };
      /* send info at client page */
      ws.send(JSON.stringify({
        type : "infoStation",
        data : data,
        lineChartT : configT,
        lineChartH : configH,
        lineChartP : configP,
        lineChartS : configS
      }));
    }
  });
  //console.log('socket', req.testing);
});

app.listen(3000);



/******   Function ******/
function getListData(stations,id){
  var list = [];
  var date = [];
  var temp = [];
  var hydr = [];
  var pres = [];
  var snow = [];
  for (var i in stations){
    s = stations[i];
    if(s.name == id){
      for(var j in s.data){
        var d = s.data[j];
        date.push(d.date)
        temp.push(d.temperature);
        hydr.push(d.hygrometry);
        pres.push(d.pressure);
        snow.push(d.snow);
      }
      list.push(date,temp,hydr,pres,snow);
      return list;
    }
  }
  return null;
}
