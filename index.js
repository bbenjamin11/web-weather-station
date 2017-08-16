var path = require("path");
var express = require("express");
var app = express();
var expressWs = require('express-ws')(app);
var fs = require('fs');

var myStations = [];
var myNameStation;
var dateFilter = "day";

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
        stations.push(d);
    });


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
          var [configT,configH,configP,configS] = createLineChart(myNameStation);
          ws.send(JSON.stringify({
              type: "setDateFilter",
              lineChartT: configT,
              lineChartH: configH,
              lineChartP: configP,
              lineChartS: configS
          }));
        }else if (msg.type == "getStationInfo") {
          myNameStation = msg.station;
          var live = getLiveData(myStations, myNameStation);
          var [configT,configH,configP,configS] = createLineChart(myNameStation);
          /* send info at client page */
          ws.send(JSON.stringify({
              type: "infoStation",
              data: live,
              lineChartT: configT,
              lineChartH: configH,
              lineChartP: configP,
              lineChartS: configS
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
    var tempMin = [];
    var hydrMin = [];
    var presMin = [];
    var snowMin = [];
    var tempMax = [];
    var hydrMax = [];
    var presMax = [];
    var snowMax = [];

    var listDataT = [];
    var listDataH = [];
    var listDataP = [];
    var listDataS = [];

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
        listDataT.push([]);
        listDataH.push([]);
        listDataP.push([]);
        listDataS.push([]);
      }
    }if(sort == "year"){
      for(i=1;i<=12;i++){
        if(i<10){
          date.push(myYear+'-0'+i+"-01T00:00:00")
        } else {
          date.push(myYear+'-'+i+"-01T00:00:00")
        }
        listDataT.push([]);
        listDataH.push([]);
        listDataP.push([]);
        listDataS.push([]);
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
                  tempMin.push(myData.temperature);
                  hydrMin.push(myData.hygrometry);
                  presMin.push(myData.pressure);
                  snowMin.push(myData.snow);

                }if(sort == "month" && m == myMonth && y == myYear){
                  _d = parseInt(d)-1;
                  listDataT[_d].push(myData.temperature);
                  listDataH[_d].push(myData.hygrometry);
                  listDataP[_d].push(myData.pressure);
                  listDataS[_d].push(myData.snow);

                }if(sort == "year" && y == myYear){
                  _m = parseInt(m)-1;
                  listDataT[_m].push(myData.temperature);
                  listDataH[_m].push(myData.hygrometry);
                  listDataP[_m].push(myData.pressure);
                  listDataS[_m].push(myData.snow)
                }
            }
            for(var k=0;k<listDataT.length;k++){
              /*** min T ****/
              v = Math.min(...listDataT[k]);
              if(v == (Infinity))
                v = null;
              tempMin.push(v);

              /*** max T ****/
              v = Math.max(...listDataT[k]);
              if(v == (-Infinity))
                v = null;
              tempMax.push(v);

              /*** min H ****/
              v = Math.min(...listDataH[k]);
              if(v ==  (Infinity))
                v = null;
              hydrMin.push(v);

              /*** max H ****/
              v = Math.max(...listDataH[k]);
              if(v == (-Infinity))
                v = null;
              hydrMax.push(v);

              /*** min P ****/
              v = Math.min(...listDataP[k]);
              if(v == (Infinity))
                v = null;
              presMin.push(v);

              /*** max P ****/
              v = Math.max(...listDataP[k]);
              if(v == (-Infinity))
                v = null;
              presMax.push(v);

              /*** min S ****/
              v = Math.min(...listDataS[k]);
              if(v == (Infinity))
                v = null;
              snowMin.push(v);

              /*** max S ****/
              v = Math.max(...listDataS[k]);
              if(v == (-Infinity))
                v = null;
              snowMax.push(v);
            }
            list.push(date, tempMin, tempMax, hydrMin,hydrMax, presMin, presMax, snowMin, snowMax);
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
    for (var i in stations) {
        s = stations[i];
        if (s.name == id) {
          var d = s.data[0];
          date = d.date;
          temp = d.temperature;
          hydr = d.hygrometry;
          pres = d.pressure;
          snow = d.snow;

          return {
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
  list = getListData(myStations, name,dateFilter);

  var optLine1 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
  optLine1.scales.yAxes[0].scaleLabel.labelString = "°C";
  optLine1.title.text = "Temperature";
  var configT = {
      type: 'line',
      data: {
          labels: list[0],
          datasets: [{
              label: "min",
              backgroundColor: 'rgb(255, 0, 0)',
              borderColor: 'rgb(255, 0, 0)',
              data: list[1],
              fill: false,
              yAxisID: "y-axis-0",
          },
          {
              label: "max",
              backgroundColor: 'rgb(255, 0, 0)',
              borderColor: 'rgb(255, 0, 0)',
              data: list[2],
              fill: false,
              yAxisID: "y-axis-0",
          }
        ]
      },
      options: optLine1

  };
  var optLine2 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
  optLine2.scales.yAxes[0].scaleLabel.labelString = "%";
  optLine2.title.text = "Hygrometry";
  var configH = {
      type: 'line',
      data: {
          labels: list[0],
          datasets: [{
              label: "min",
              backgroundColor: 'rgb(0, 0, 255)',
              borderColor: 'rgb(0, 0, 255)',
              data: list[3],
              fill: false,
              yAxisID: "y-axis-0",
          },{
              label: "max",
              backgroundColor: 'rgb(0, 0, 255)',
              borderColor: 'rgb(0, 0, 255)',
              data: list[4],
              fill: false,
              yAxisID: "y-axis-0",
          }
        ]
      },
      options: optLine2

  };
  var optLine3 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
  optLine3.scales.yAxes[0].scaleLabel.labelString = "Pa";
  optLine3.title.text = "Pressure";
  var configP = {
      type: 'line',
      data: {
          labels: list[0],
          datasets: [{
              label: "min",
              backgroundColor: 'rgb(128, 0, 255)',
              borderColor: 'rgb(128, 0, 255)',
              data: list[5],
              fill: false,
              yAxisID: "y-axis-0",
          },{
              label: "max",
              backgroundColor: 'rgb(128, 0, 255)',
              borderColor: 'rgb(128, 0, 255)',
              data: list[6],
              fill: false,
              yAxisID: "y-axis-0",
          }]
      },
      options: optLine3

  };
  var optLine4 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
  optLine4.scales.yAxes[0].scaleLabel.labelString = "M";
  optLine4.title.text = "Snow";
  var configS = {
      type: 'line',
      data: {
          labels: list[0],
          datasets: [{
              label: "min",
              backgroundColor: 'rgb(0, 255, 0)',
              borderColor: 'rgb(0, 255, 0)',
              data: list[7],
              fill: false,
              yAxisID: "y-axis-0",
          },{
              label: "max",
              backgroundColor: 'rgb(0, 255, 0)',
              borderColor: 'rgb(0, 255, 0)',
              data: list[8],
              fill: false,
              yAxisID: "y-axis-0",
          }
        ]
      },
      options: optLine4

  };

  return [configT,configH,configP,configS];
}
