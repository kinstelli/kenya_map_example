var mymap = L.map('mapid').setView([0.0515, 37.09], 5);

var kenyaDataLayer = new L.Util.ajax("http://localhost:5000/data/kenyadata.geojson").then(
		function(loadedData){ 
			for(var i =0; i < loadedData.features.length; i++)
			{
				L.geoJSON(loadedData.features[i]).addTo(mymap);
			}
		});
	
var kenyaCountiesLayer = new L.Util.ajax("http://localhost:5000/data/counties.geojson").then(
		function(countiesObj){
			for(var i =0; i < countiesObj.features.length; i++)
			{
				L.geoJSON(countiesObj.features[i]).addTo(mymap);
			}
		}
	);


L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={authToken}' , {
		maxZoom: 10,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets',
		authToken: 'pk.eyJ1IjoibXJra2lzZWxqYWsiLCJhIjoiY2oybW9qYThlMDE0eTJ4bWh6cDBzOHNxaiJ9.9Kdv39_U7J2_UaDhbNj_CQ'

	}).addTo(mymap);
