function onLoad(data){
  console.log("onload");
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
  /***  Clik filter selection   ***/
  $("#year").click(function(){
    sendDataFilter("year");
  });
  $("#month").click(function(){
    sendDataFilter("month");
  });
  $("#day").click(function(){
    sendDataFilter("day");
  });


  /***  Clik data line chart   ***/
  $("#imgtemp").click(function(){
    $("#imgtemp").attr("src","/image/temperature_actif.png");
    $("#imghygr").attr("src","/image/hydraulic_passif.png");
    $("#imgpres").attr("src","/image/pression_passif.png");
    $("#imgsnow").attr("src","/image/Snow_level_passif.png");

    sendDataLineChart("temp");
  });
  $("#imghygr").click(function(){
    $("#imgtemp").attr("src","/image/temperature_passif.png");
    $("#imghygr").attr("src","/image/hydraulic_actif.png");
    $("#imgpres").attr("src","/image/pression_passif.png");
    $("#imgsnow").attr("src","/image/Snow_level_passif.png");

    sendDataLineChart("hygr");
  });
  $("#imgpres").click(function(){
    $("#imgtemp").attr("src","/image/temperature_passif.png");
    $("#imghygr").attr("src","/image/hydraulic_passif.png");
    $("#imgpres").attr("src","/image/pression_actif.png");
    $("#imgsnow").attr("src","/image/Snow_level_passif.png");

    sendDataLineChart("pres");
  });
  $("#imgsnow").click(function(){
    $("#imgtemp").attr("src","/image/temperature_passif.png");
    $("#imghygr").attr("src","/image/hydraulic_passif.png");
    $("#imgpres").attr("src","/image/pression_passif.png");
    $("#imgsnow").attr("src","/image/Snow_level_actif.png");

    sendDataLineChart("snow");
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
    mapTypeId: 'terrain'
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

function sendDataLineChart(val){
  ws.send(JSON.stringify({type: "setDataLineChart",data: val}));
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
    $("#tempLive").html(msg.data.temperature + "°C");
    $("#hygrLive").html(msg.data.hygrometry + "%");
    $("#presLive").html(msg.data.pressure + "Pa");
    $("#snowLive").html(msg.data.snow + "m");
    if(msg.data.type == "station"){
      $("#staionImg").attr("src","/image/station_icone.png");
    } else {
      $("#staionImg").attr("src","/image/refuge_station_icone.png");
    }
  }else if(msg.type == "infoLineChart"){
    /*- - - - - Chart - - - - -*/
    try {
      window.myLine.destroy();
    } catch (e) {}
    console.log(JSON.stringify(msg.lineChartT));
    console.log("----------------------********---------------------");
    var ctx1 = document.getElementById("lineChartT").getContext("2d");
    window.myLine = new Chart(ctx1, msg.lineChartT);
  }

}
