/*eslint-env node*/
//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var dbCreds = appEnv.getServiceCreds('NoSQLDB-weather-station');
var bodyParser = require("body-parser");
var async = require("async");
var fs = require("fs");

/*** Apps Environement ***/ 
var vcap_app = {application_uris: [ appEnv.url.split("//")[1] ]};						//default blank
//var vcap_app = {application_uris: [host]};						//default blank
var ext_uri = vcap_app.application_uris[0];

/*** Global variable ***/
var myStations = [];
var myNameStation;
var dateFilter = "day";
var dataFilter = "temp";

/*** Database connection ***/
nano = require('nano')(dbCreds.url);
// declare the DB
stations = nano.use('station');

/*** Apps configuration ***/
// Jade template
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
// Parse request data
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// Serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));




/*
 * Main Page 
 */
app.get('/', function(req, res) {
    console.log(" ----------------------- test -------------------- ");


    var values = [];
    var tt = 10;

    async.series([
        function(callback) {
            stations.list(function(err, body) {
                if (!err) {
                    tt = body.total_rows;
                    console.log("tt = " + tt);
                    var cpt = 1;
                    body.rows.forEach(function(element) {
                    	console.log("----------- element : " + JSON.stringify(element));
                        stations.get(element.id, function(err, b) {
                            if (!err) {
                            	myStations.push(b);
                        		var d = {};
						        d.name = b.name;
						        d.position = b.position;
						        d.type = b.type;
						        console.log("----------- d: " + JSON.stringify(d));
						        values.push(d);
	                            cpt++;
	                       		if (cpt > tt) {
	                            	callback(null, 1);
	                            }
                            } else {
                                console.log(err);
                            }
                        });
                    });
                } else {
                    console.log(err);
                }
            });

        },
        function(callback) {
            console.log("--------------------------- values -------------------------");
            console.log("values : " + JSON.stringify(values));
            console.log("lenght : " + values.length);
            res.render('index', {
                data: {
		            stations: values,
		            ext_uri: ext_uri
		        }
            });
            callback(null, 3);

        }
    ]);

});
/*
 * Web socket communication with the main page
 */
app.ws('/', function(ws, req) {
    console.log("web socket up");
    console.log("**** my station : " + JSON.stringify(myStations));
    ws.on('message', function(msg) {
        console.log(msg);
        var msg = JSON.parse(msg);

        if (msg.type === "setDateFilrer") {
          dateFilter = msg.data;
          var configT = createLineChart(myNameStation);
          ws.send(JSON.stringify({
              type: "infoLineChart",
              lineChartT: configT
          }));
        }else if (msg.type === "getStationInfo") {
          myNameStation = msg.station;
          var live = getLiveData(myStations, myNameStation);
          /* send info at client page */
          ws.send(JSON.stringify({
              type: "infoStation",
              data: live
          }));
        }else if (msg.type === "setDataLineChart") {
            dataFilter = msg.data;
            var configT = createLineChart(myNameStation);
            ws.send(JSON.stringify({
                type: "infoLineChart",
                lineChartT: configT
            }));
        }else if (msg.type === "refreshLineChart") {
            var configT = createLineChart(myNameStation);
            ws.send(JSON.stringify({
                type: "infoLineChart",
                lineChartT: configT
            }));
        }
    });
    //console.log('socket', req.testing);
});


/*
 * With destroy, you can delete your DB and create a new DB
 */
app.get('/destroy', function(req, res) {
    console.log(" ----------------------- destroy -------------------- ");
    nano.db.destroy('station', function() {
        // create a new database 
        nano.db.create('station');
    });
});


/*
 * Insert add information in the DB
 */
app.post('/insert', function(req, res) {

    console.log(" ------------------- insert --------------------- ");
    var data = req.body;

    // Check if there are station information
    if (!data.hasOwnProperty("name")) {
        console.log('No station name ');
        res.send(400);
        return;
    }

    // Add date and time
    if (!data.hasOwnProperty("datetime")) {
        d = getDateTime();
        console.log(d);
        data.date = d;
    }
    // Check if the station send  hygrometry | rain | temperature | wind_direction | wind_strength | snow | pressure information
    if (!data.hasOwnProperty("temperature")) {
        data.temperature = null;
    }
    if (!data.hasOwnProperty("pressure")) {
        data.pressure = null;
    }
    if (!data.hasOwnProperty("hygrometry")) {
        data.hygrometry = null;
    }
    if (!data.hasOwnProperty("snow")) {
        data.snow = null;
    }
    /*
    if (!data.hasOwnProperty("rain")) {
    	data.rain = null;
    }
    if (!data.hasOwnProperty("wind_direction")) {
    	data.wind_direction = null;
    }
    if (!data.hasOwnProperty("wind_strength")) {
    	data.wind_strength = null;
    }
    */

    console.log(JSON.stringify(data));

    stations.insert(data, function(err, body, header) {
        if (err) {
            console.log('[station.insert] ', err.message);
            res.send(400);
            return;
        }
        console.log('you have inserted the test.');
        console.log(body);
    });
    res.send(data);
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

/*
 * Create the actual date and time in String
 * Use for inserte data
 */
function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    //2017-07-03T13:50:08Z
    return year + "-" + month + "-" + day + "T" + hour + ":" + min + ":" + sec;

}



/******   Function ******/

/*
 * Return min and max element according with the station and date selected
 */
function getListData(stations, id, sort) {
	console.log("Get list Data --> stations : " + JSON.stringify(stations));
	console.log("Get list Data --> id : " + JSON.stringify(id));
	
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

    if(sort === "month"){
      for(var i=1;i<=getNbJoursMois(myMonth-1,myYear);i++){
        if(i<10){
          date.push(myYear+'-'+smyMonth+'-0'+i+"T00:00:00");
        } else {
          date.push(myYear+'-'+smyMonth+'-'+i+"T00:00:00");
        }
        listData.push([]);

      }
    }if(sort === "year"){
      for(var k=1;i<=12;i++){
        if(k<10){
          date.push(myYear+'-0'+k+"-01T00:00:00");
        } else {
          date.push(myYear+'-'+k+"-01T00:00:00");
        }
        listData.push([]);
      }
    }

    for (var s in stations) {
        s = stations[s];
        if (s.name === id) {
            for (var j in s.data) {
                var myData = s.data[j];
                var [y,m,d] = myData.date.split("T")[0].split("-");
                if(sort === "day" && d === myDay && m === myMonth && y === myYear){
                  //listDataT.push(myData);
                  date.push(myData.date);
                  if(dataFilter === "temp"){
                    Min.push(myData.temperature);
                  }else if(dataFilter === "hygr"){
                    Min.push(myData.hygrometry);
                  }else if(dataFilter === "pres"){
                    Min.push(myData.pressure);
                  }else if(dataFilter === "snow"){
                    Min.push(myData.snow);
                  }

                }if(sort === "month" && m === myMonth && y === myYear){
                  _d = parseInt(d)-1;
                  if(dataFilter === "temp"){
                    listData[_d].push(myData.temperature);
                  }else if(dataFilter === "hygr"){
                    listData[_d].push(myData.hygrometry);
                  }else if(dataFilter === "pres"){
                    listData[_d].push(myData.pressure);
                  }else if(dataFilter === "snow"){
                    listData[_d].push(myData.snow);
                  }
                }if(sort === "year" && y === myYear){
                  _m = parseInt(m)-1;
                  if(dataFilter === "temp"){
                    listData[_m].push(myData.temperature);
                  }else if(dataFilter === "hygr"){
                    listData[_m].push(myData.hygrometry);
                  }else if(dataFilter === "pres"){
                    listData[_m].push(myData.pressure);
                  }else if(dataFilter === "snow"){
                    listData[_m].push(myData.snow);
                  }
                }
            }
            for(var k=0;k<listData.length;k++){
              /*** min T ****/
              v = Math.min(...listData[k]);
              if(v === (Infinity))
                v = null;
              Min.push(v);

              /*** max T ****/
              v = Math.max(...listData[k]);
              if(v === (-Infinity))
                v = null;
              Max.push(v);
            }
            list.push(date, Min, Max);
            return list;
        }
    }
    return null;
}

/*
 * Allow to know how many days in one month
 */
function getNbJoursMois(mois, annee) {
  var lgMois = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((annee%4 === 0 && annee%100 !== 0) || annee%400 === 0) {
    lgMois[1] = 29;
  }
  return lgMois[mois]; // 0 < mois <11
}

/*
 * Return only the last value
 */
function getLiveData(stations, id) {
	
	console.log("Get live Data --> stations : " + JSON.stringify(stations));
	console.log("Get live Data --> id : " + JSON.stringify(id));
    var date;
    var temp;
    var hydr;
    var pres;
    var snow;
    var type;
    for (var i in stations) {
        var s = stations[i];
        if (s.name === id) {
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

/*
 * create the chartjs config
 */
function createLineChart(name){
  list = getListData(myStations, name, dateFilter,dataFilter);
  var optLine1 = JSON.parse(fs.readFileSync(__dirname + "/optionLineChart.json", "utf8"));
  if(dataFilter === "temp"){
    optLine1.scales.yAxes[0].scaleLabel.labelString = "°C";
    optLine1.title.text = "Temperature";
  }else if(dataFilter === "hygr"){
    optLine1.scales.yAxes[0].scaleLabel.labelString = "%";
    optLine1.title.text = "Hygrometry";
  }else if(dataFilter === "pres"){
    optLine1.scales.yAxes[0].scaleLabel.labelString = "Pa";
    optLine1.title.text = "Pessure";
  }else if(dataFilter === "snow"){
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
  if(dateFilter === "day"){
    config.data.datasets.splice(-1);
    config.data.datasets[0].label = "value";
  }

  return config;
}





