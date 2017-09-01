function onLoad(data){
  console.log("onload");

  $("#splitPage").click(function() {
    var $splitPageHight = $("#splitPage").height();
    $("#splitPage").css({top : -$splitPageHight});
  });

  var $panel = $(".panel");
  var $chartPanel = $("#chartPanel");
  var $chartButton = $("#chartButton");
  var $panelWidth = $panel.width();

  $chartButton.hide();

  $( "#closeButton" ).click(function() {
    if($panel.offset().left == 0){
      $chartButton.hide();
      $chartPanel.css({
        right: 20,
      });
      $panel.css({
        left: -$panelWidth,
      });

      $("#imgtemp").attr("src","/image/temperature_passif.png");
      $("#imghygr").attr("src","/image/hydraulic_passif.png");
      $("#imgpres").attr("src","/image/pression_passif.png");
      $("#imgsnow").attr("src","/image/Snow_level_passif.png");
    }
  });

  $( "#chartButton" ).click(function() {

    $chartPanel.css({
      right: 20
    });
    $("#imgtemp").attr("src","/image/temperature_passif.png");
    $("#imghygr").attr("src","/image/hydraulic_passif.png");
    $("#imgpres").attr("src","/image/pression_passif.png");
    $("#imgsnow").attr("src","/image/Snow_level_passif.png");
  });
  /***  Clik filter selection   ***/
  $("#year").click(function(){
    sendDataFilter("year");
    $('#liYear').addClass('current');
    $('#liMonth').removeClass('current');
    $('#liDay').removeClass('current');
  });
  $("#month").click(function(){
    sendDataFilter("month");
    $('#liMonth').addClass('current');
    $('#liDay').removeClass('current');
    $('#liYear').removeClass('current');
  });
  $("#day").click(function(){
    sendDataFilter("day");
    $('#liDay').addClass('current');
    $('#liMonth').removeClass('current');
    $('#liYear').removeClass('current');
  });


  /***  Clik data line chart   ***/
  $("#imgtemp").click(function(){
    $("#imghygr").attr("src","/image/hydraulic_passif.png");
    $("#imgpres").attr("src","/image/pression_passif.png");
    $("#imgsnow").attr("src","/image/Snow_level_passif.png");
    $("#imgtemp").attr("src","/image/temperature_actif.png");
    sendDataLineChart("temp");

    if($chartPanel.offset().left != $panelWidth){
      $chartPanel.css({
        right: -$chartPanel.width(),
      });
    }
  });
  $("#imghygr").click(function(){
    $("#imgtemp").attr("src","/image/temperature_passif.png");
    $("#imghygr").attr("src","/image/hydraulic_actif.png");
    $("#imgpres").attr("src","/image/pression_passif.png");
    $("#imgsnow").attr("src","/image/Snow_level_passif.png");

    sendDataLineChart("hygr");
    if($chartPanel.offset().left != $panelWidth){
      $chartPanel.css({
        right: -$chartPanel.width(),
      });
    }
  });
  $("#imgpres").click(function(){
    $("#imgtemp").attr("src","/image/temperature_passif.png");
    $("#imghygr").attr("src","/image/hydraulic_passif.png");
    $("#imgpres").attr("src","/image/pression_actif.png");
    $("#imgsnow").attr("src","/image/Snow_level_passif.png");

    sendDataLineChart("pres");

    if($chartPanel.offset().left != $panelWidth){
      $chartPanel.css({
        right: -$chartPanel.width(),
      });
    }
  });
  $("#imgsnow").click(function(){
    $("#imgtemp").attr("src","/image/temperature_passif.png");
    $("#imghygr").attr("src","/image/hydraulic_passif.png");
    $("#imgpres").attr("src","/image/pression_passif.png");
    $("#imgsnow").attr("src","/image/Snow_level_actif.png");

    sendDataLineChart("snow");

    if($chartPanel.offset().left != $panelWidth){
      $chartPanel.css({
        right: -$chartPanel.width(),
      });
    }
  });

  loadStations(data.stations);

  /*- - - - - Slider - - - - - - -*/
  initSlider();

  /*- - - - - WebSocket - - - - -*/
 
  //ws = new WebSocket('ws://localhost:3000/');
  console.log("ext_uri : " + data.ext_uri);
  ws = new WebSocket("wss://" + data.ext_uri);
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
    var imgIcon = "/image/refuge_station_icone.png";
    if(station.type == "station"){
      imgIcon = "/image/station_icone.png";
    }
    var marker = new google.maps.Marker({
      position: station.position,
      map: map,
      animation: google.maps.Animation.DROP,
      icon: imgIcon
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
    $("#tempLive").html(msg.data.temperature + "°C");
    $("#hygrLive").html(msg.data.hygrometry + "%");
    $("#presLive").html(msg.data.pressure + "Pa");
    $("#snowLive").html(msg.data.snow + "m");
    if(msg.data.type == "station"){
      $("#staionImg").attr("src","/image/station_icone.png");
    } else {
      $("#staionImg").attr("src","/image/refuge_station_icone.png");
    }

    ws.send(JSON.stringify({type: "refreshLineChart"}));
  }else if(msg.type == "infoLineChart"){
    /*- - - - - Chart - - - - -*/
    try {
      window.myLine.destroy();
    } catch (e) {}
    console.log(JSON.stringify(msg.lineChartT));
    var ctx1 = document.getElementById("lineChartT").getContext("2d");
    window.myLine = new Chart(ctx1, msg.lineChartT);
  }

}


function initSlider(){

  var $menu = $(".menu");
  var $underline = $menu.find("span");

  function slider() {
    var $current = $menu.find(".current a");

    var $currentWidth = $current.width();
    var $innerWidth = $current.innerWidth();
    var $outerWidth = $current.outerWidth(true);
    var $currentOffset = $current.position().left;

    var $currentHeight = $current.height();
    var $currentTop = $current.position().top;
    var $innerHeight = $current.innerHeight();
    var $outerHeight = $current.outerHeight(true);

    $underline.css({
      left: $currentOffset + ($outerWidth - $currentWidth)/2,
      width: $currentWidth,
      top : $currentHeight + $currentTop + ($outerHeight - $currentHeight)/2
    });
  };

  slider();

  $menu.find('a').hover(
    function () {
      $underline.css({
        left: $(this).position().left + ($(this).outerWidth(true) - $(this).width())/2,
        width: $(this).width(),
        top: $(this).height() + $(this).position().top + ($(this).outerHeight(true) - $(this).height())/2
      });
    },
    function () {
      slider();
    }
  );

}
