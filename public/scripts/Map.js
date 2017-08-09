function onLoad(data){

  var $panel = $(".panel");
  var $panelWidth = $panel.width();

  $( "#closeButton" ).click(function() {
    if($panel.offset().left == 0){
      $panel.css({
        left: -$panelWidth,
      });
    }
  });

  loadStations(data.stations);
}

function loadStations(stations){

  var $panel = $(".panel");
  var $panelWidth = $panel.width();

  var uluru = {lat: 43.5668035, lng: 1.3783154};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: uluru,
    mapTypeId: 'satellite'
  });

  function openPanel(stationName) {
    $( "#stationName" ).text(stationName);
    if($panel.offset().left != 0){
      $panel.css({
        left: 0
      });
    }
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
