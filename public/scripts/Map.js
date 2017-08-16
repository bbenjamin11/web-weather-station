function onLoad(data){

  var $panel = $(".panel");
  var $chartPanel = $("#chartPanel");
  var $chartButton = $("#chartButton");
  var $panelWidth = $panel.width();

  $chartButton.hide();

  $( "#closeButton" ).click(function() {
    if($panel.offset().left == 0){
      $chartButton.hide();
      $chartPanel.css({
        right: 0,
      });
      $panel.css({
        left: -$panelWidth,
      });
    }
  });

  $( "#chartButton" ).click(function() {

    if($chartPanel.offset().left != $panelWidth){
      $chartPanel.css({
        right: -$chartPanel.width(),
      });
    }else{
      $chartPanel.css({
        right: 0,
      });
    }

  });

  $("#year").click(function(){
    sendDataFilter("year");
  });
  $("#month").click(function(){
    sendDataFilter("month");
  });
  $("#day").click(function(){
    sendDataFilter("day");
  });

  loadStations(data.stations);

  /*- - - - - WebSocket - - - - -*/
  ws = new WebSocket('ws://localhost:3000/');
  ws.onopen = function(evt) { onOpen(evt); };
  ws.onmessage = function(evt) { onMessage(evt); };
}

function loadStations(stations){

  var $panel = $(".panel");
  var $panelWidth = $panel.width();

  var uluru = {lat: 43.5668035, lng: 1.3783154};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: uluru,
    mapTypeId: 'satellite'
  });

  function openPanel(stationName) {
    $( "#stationName" ).text(stationName);
    var $chartButton = $("#chartButton");
    $chartButton.show();
    if($panel.offset().left != 0){
      $panel.css({
        left: 0
      });
    }
    ws.send(JSON.stringify({type: "getStationInfo",station: stationName}));
  }

  stations.forEach(function(station, index) {
    var marker = new google.maps.Marker({
      position: station.position,
      map: map
    });

    marker.addListener('click',function(){
      openPanel(station.name);
    });
  });
}

function sendDataFilter(date){
  ws.send(JSON.stringify({type: "setDateFilrer",data: date}));
}

/**
* Funtion executed when the WS is open
*/
function onOpen(evt){
  console.log("WS CONNECTED");
  connected = true;
}

function onMessage(evt){
  console.log("WS message");
  console.log(evt);

  var msg = JSON.parse(evt.data);
  if(msg.type == "infoStation"){
    console.log("-*-*-*-*-*-*-");
    $("#temperatureLive").html(msg.data.temperature + "°C");
    $("#humidityLive").html(msg.data.hygrometry + "%");
    $("#pressionLive").html(msg.data.pressure + "Pa");
    $("#snowLive").html(msg.data.snow + "m");
  }
  /*- - - - - Chart - - - - -*/

  try {
    window.myLine1.destroy();
    window.myLine2.destroy();
    window.myLine3.destroy();
    window.myLine4.destroy();
  } catch (e) {}
  var ctx1 = document.getElementById("lineChartT").getContext("2d");
  window.myLine1 = new Chart(ctx1, msg.lineChartT);
  var ctx2 = document.getElementById("lineChartH").getContext("2d");
  window.myLine2 = new Chart(ctx2, msg.lineChartH);
  var ctx3 = document.getElementById("lineChartP").getContext("2d");
  window.myLine3 = new Chart(ctx3, msg.lineChartP);
  var ctx4 = document.getElementById("lineChartS").getContext("2d");
  window.myLine4 = new Chart(ctx4, msg.lineChartS);
}
