const url = "https://api.apify.com/v2/key-value-stores/vpfkeiYLXPIDIea2T/records/LATEST?disableRedirect=true";
let data;

function preload(){
	getData();
}

function setup() {
	//loadMap();
	createCanvas(0,0);
}

function getData(){
	$.ajax({
		url: url,
		success: function(response) {
			displayData(response);
			data = response;
			loadMap(data.State);
			fillChartStates('#infectedChart',response.State,'infected','desc',"Número de infectados",'rgba(255, 99, 132, 0.2)','rgba(255, 99, 132, 1)');
			fillChartStates('#deceasedChart',response.State,'deceased','desc',"Número de defunciones",'rgba(33, 37, 41, 0.2)','rgba(33, 37, 41, 1)');
		},
		error: function() {
	        console.log("No se ha podido obtener la información");
	    }
	});
}
function fillChartStates(tag,data,keyOrder,orden,labelChart,color,borderColor){
	var statesOrder = sortData(keyOrder,data,orden);

	var states = [];
	var data = [];

	for(var key in statesOrder){
		statesOrder[key].name = key;
		states.push(key);
		data.push(statesOrder[key][keyOrder]);
	}
	
	chartBar(tag,states.slice(0, 10),data.slice(0, 10),labelChart,color,borderColor);
	
}

function sortData(key, data, type) {
  let ordered = [];
  let compareFunction = function(a, b) {
    return data[b][key] - data[a][key];
  };
  if (type === "asc") {
    compareFunction = function(a, b) {
      return data[a][key] - data[b][key];
    }
  }
  Object.keys(data).sort(compareFunction).forEach(function(key) {
    ordered[key] = data[key];
  });
  return ordered;
}

function chartBar(tag,labels,data,label,color,borderColor){
	var ctx = $(tag);
	var myChart = new Chart(ctx, {
	    type: 'bar',
	    data: {
	        labels: labels,
	        datasets: [{
	            label: label,
	            data: data,
	            backgroundColor: color,
	            borderColor: borderColor,
	            borderWidth: 1
	        }]
	    },
	    options: {
	    	indexAxis: 'y',
	        scales: {
	            y: {
	                beginAtZero: true
	            }
	        }
	    }
	});
}

function displayData(data){
	$('#negativeNum').text(data.negative);
	$('#suspectedNum').text(data.suspected);
	$('#infectedNum').text(data.infected);
	$('#deathNum').text(data.deceased);
}

function draw() {
}
function loadMap(dataStates){
	var matchExpression = getColorSemaphore(dataStates);

	var popup = new mapboxgl.Popup({
		closeButton: false,
		closeOnClick: false
	});
	mapboxgl.accessToken = 'pk.eyJ1IjoibHVpczE0NSIsImEiOiJjazNlemF3em8wMHR6M2VwamtrbjY0b201In0.AEYvlh3rHD6z1rlIB2T2YA';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-102.552784, 23.634501],
        zoom: 3.5
    });
    var hoveredStateId = null;

    map.on('load', function () {
        map.addSource('states', {
            'type': 'geojson',
            'data': './assets/mx_states.geojson'
        });

        map.addLayer({
            'id': 'state-fills',
            'type': 'fill',
            'source': 'states',
            'layout': {},
            'paint': {
                'fill-color': matchExpression,
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.8,
                    0.5
                ]
            }
        });

        map.addLayer({
            'id': 'state-borders',
            'type': 'line',
            'source': 'states',
            'layout': {},
            'paint': {
                'line-color': matchExpression,
                'line-width': 2
            }
        });
        
        map.on('mousemove', 'state-fills', function (e) {
            if (e.features.length > 0) {
                if (hoveredStateId !== null) {
                    map.setFeatureState(
                        { source: 'states', id: hoveredStateId },
                        { hover: false }
                    );
                }
                hoveredStateId = e.features[0].id;
                map.setFeatureState(
                    { source: 'states', id: hoveredStateId },
                    { hover: true }
                );

                map.getCanvas().style.cursor = 'pointer';

                var key = e.features[0].properties.name;
                var infected = data.State[key].infected;
                var deceased = data.State[key].deceased;
                
				let description = `<h6><strong>${key}</strong></h6>
									<hr class="my-0 mb-1">
									<span>
										<strong>Infectados:</strong> ${infected}
									</span>
									<br>
									<span>
										<strong>Defunciones:</strong> ${deceased}
									</span>`;
				popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
            }
        });

        map.on('mouseleave', 'state-fills', function () {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: 'states', id: hoveredStateId },
                    { hover: false }
                );
            }
            hoveredStateId = null;
            map.getCanvas().style.cursor = '';
			popup.remove();
        });
    });
}

function getColorSemaphore(data){
	var matchExpression = ['match', ['get', 'name']];

	poblation.forEach(function (row) {
		var scale = Math.round(data[row['name']].infected/(row['poblation'] / 100000));
		var color = 'rgb(212, 218, 220)';//'#D4DADC';

		if (scale < 500) {
			color = 'rgb(64, 184, 115)';//'#40B873';
		}
		else if(scale >= 500 && scale <1000){
			color = 'rgb(254, 211, 73)';//'#FED349';
		}
		else if (scale >= 1000 && scale<1500) {
			color = 'rgb(254, 147, 62)';//'#FE933E';
		}
		else if(scale>=1500){
			color = 'rgb(223, 30, 32)';//'#F84809';
		}
		 
		matchExpression.push(row['name'], color);
	});
	 
	matchExpression.push('rgba(0, 0, 0, 0)');

	return matchExpression;
}