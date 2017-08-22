var path = require("path");
var express = require("express");
var app = express();
var expressWs = require('express-ws')(app);
var fs = require('fs');

var myStations = [];
var myNameStation;
var dateFilter = "day";
var dataFilter = "temp";

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
app.get('/', function(req, res) {
    console.log("--get--");
    myStations = JSON.parse(fs.readFileSync(__dirname + "/data.json", "utf8"));

    var stations = []
    myStations.forEach(function(element) {
        var d = {};
        d.name = element.name;
        d.position = element.position;
        d.type = element.type;
        stations.push(d);
    });

    //res.render('split');

    res.render('index', {
        data: {
            stations: stations
        }
    });
    
});


app.ws('/', function(ws, req) {
    console.log("web socket up");
    ws.on('message', function(msg) {
        console.log(msg);
        var msg = JSON.parse(msg);

        if (msg.type == "setDateFilrer") {
          dateFilter = msg.data;
          var configT = createLineChart(myNameStation);
          ws.send(JSON.stringify({
              type: "infoLineChart",
              lineChartT: configT
          }));
        }else if (msg.type == "getStationInfo") {
          myNameStation = msg.station;
          var live = getLiveData(myStations, myNameStation);
          /* send info at client page */
          ws.send(JSON.stringify({
              type: "infoStation",
              data: live
          }));
        }else if (msg.type == "setDataLineChart") {
            dataFilter = msg.data;
            var configT = createLineChart(myNameStation);
            ws.send(JSON.stringify({
                type: "infoLineChart",
                lineChartT: configT
            }));
        }else if (msg.type == "refreshLineChart") {
            var configT = createLineChart(myNameStation);
            ws.send(JSON.stringify({
                type: "infoLineChart",
                lineChartT: configT
            }));
        }
    });
    //console.log('socket', req.testing);
});

app.listen(3000);



/******   Function ******/

function getListData(stations, id, sort) {
    var list = [];
    var date = [];
    var Min = [];
    var Max = [];

    var listData = [];

    /***  Date  ***/
    var mydate = new Date();

    var myMonth = mydate.getMonth()+1;
    var smyMonth = myMonth;
    if (myMonth<10)
      smyMonth = "0"+myMonth;

    var myDay = mydate.getDate();
    var myYear = mydate.getFullYear();

    if(sort == "month"){
      for(i=1;i<=getNbJoursMois(myMonth-1,myYear);i++){
        if(i<10){
          date.push(myYear+'-'+smyMonth+'-0'+i+"T00:00:00");
        } else {
          date.push(myYear+'-'+smyMonth+'-'+i+"T00:00:00");
        }
        listData.push([]);

      }
    }if(sort == "year"){
      for(i=1;i<=12;i++){
        if(i<10){
          date.push(myYear+'-0'+i+"-01T00:00:00")
        } else {
          date.push(myYear+'-'+i+"-01T00:00:00")
        }
        listData.push([]);;
      }
    }

    for (var i in stations) {
        s = stations[i];
        if (s.name == id) {
            for (var j in s.data) {
                var myData = s.data[j];
                var [y,m,d] = myData.date.split("T")[0].split("-");;
                if(sort == "day" && d == myDay && m == myMonth && y == myYear){
                  //listDataT.push(myData);
                  date.push(myData.date)
                  if(dataFilter == "temp"){
                    Min.push(myData.temperature);
                  }else if(dataFilter == "hygr"){
                    Min.push(myData.hygrometry);
                  }else if(dataFilter == "pres"){
                    Min.push(myData.pressure);
                  }else if(dataFilter == "snow"){
                    Min.push(myData.snow);
                  }

                }if(sort == "month" && m == myMonth && y == myYear){
                  _d = parseInt(d)-1;
                  if(dataFilter == "temp"){
                    listData[_d].push(myData.temperature);
                  }else if(dataFilter == "hygr"){
                    listData[_d].push(myData.hygrometry);
                  }else if(dataFilter == "pres"){
                    listData[_d].push(myData.pressure);
                  }else if(dataFilter == "snow"){
                    listData[_d].push(myData.snow);
                  }
                }if(sort == "year" && y == myYear){
                  _m = parseInt(m)-1;
                  if(dataFilter == "temp"){
                    listData[_m].push(myData.temperature);
                  }else if(dataFilter == "hygr"){
                    listData[_m].push(myData.hygrometry);
                  }else if(dataFilter == "pres"){
                    listData[_m].push(myData.pressure);
                  }else if(dataFilter == "snow"){
                    listData[_m].push(myData.snow);
                  }
                }
            }
            for(var k=0;k<listData.length;k++){
              /*** min T ****/
              v = Math.min(...listData[k]);
              if(v == (Infinity))
                v = null;
              Min.push(v);

              /*** max T ****/
              v = Math.max(...listData[k]);
              if(v == (-Infinity))
                v = null;
              Max.push(v);
            }
            list.push(date, Min, Max);
            return list;
        }
    }
    return null;
}


function getNbJoursMois(mois, annee) {
  var lgMois = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((annee%4 == 0 && annee%100 != 0) || annee%400 == 0) {
    lgMois[1] = 29;
  }
  return lgMois[mois]; // 0 < mois <11
}


function getLiveData(stations, id) {
    var date;
    var temp;
    var hydr;
    var pres;
    var snow;
    var type;
    for (var i in stations) {
        s = stations[i];
        if (s.name == id) {
          type = s.type;
          var d = s.data[0];
          date = d.date;
          temp = d.temperature;
          hydr = d.hygrometry;
          pres = d.pressure;
          snow = d.snow;

          return {
            "type":type,
            "date":date,
            "temperature":temp,
            "hygrometry":hydr,
            "pressure":pres,
            "snow":snow
          };
        }
    }
    return null;
}

function createLineChart(name){
  list = getListData(myStations, name,dateFilter,dataFilter);
  var optLine1 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
  if(dataFilter == "temp"){
    optLine1.scales.yAxes[0].scaleLabel.labelString = "°C";
    optLine1.title.text = "Temperature";
  }else if(dataFilter == "hygr"){
    optLine1.scales.yAxes[0].scaleLabel.labelString = "%";
    optLine1.title.text = "Hygrometry";
  }else if(dataFilter == "pres"){
    optLine1.scales.yAxes[0].scaleLabel.labelString = "Pa";
    optLine1.title.text = "Pessure";
  }else if(dataFilter == "snow"){
    optLine1.scales.yAxes[0].scaleLabel.labelString = "M";
    optLine1.title.text = "Snow";
  }

  var config = {
      type: 'line',
      data: {
          labels: list[0],
          datasets: [{
              label: "min",
              backgroundColor: 'rgb(107, 28, 35)',
              borderColor: 'rgb(107, 28, 35)',
              data: list[1],
              fill: false,
              yAxisID: "y-axis-0",
          },
          {
              label: "max",
              backgroundColor: 'rgb(183, 67, 67)',
              borderColor: 'rgb(183, 67, 67)',
              data: list[2],
              fill: false,
              yAxisID: "y-axis-0",
          }
        ]
      },
      options: optLine1

  };
  if(dateFilter == "day"){
    config.data.datasets.splice(-1);
    config.data.datasets[0].label = "value";
  }

  return config;
}
