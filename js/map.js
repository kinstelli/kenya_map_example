var theMap = L.map('mapid').setView([0.0515, 38.09], 6);

var markerClusters = L.markerClusterGroup();

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={authToken}' , {
		maxZoom: 10,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets',
		authToken: 'pk.eyJ1IjoibXJra2lzZWxqYWsiLCJhIjoiY2oybW9qYThlMDE0eTJ4bWh6cDBzOHNxaiJ9.9Kdv39_U7J2_UaDhbNj_CQ',
	}).addTo(theMap);


L.Util.ajax("http://localhost:5000/data/kenyadata.geojson").then(
		function(loadedData){ 

			for(var i =0; i < loadedData.features.length; i++)
			{
				//Clicking on a marker should show project title, description and objectives
				var projTitle = loadedData.features[i].properties.project_title;
				var projDesc = loadedData.features[i].properties.project_description;
				if (projTitle === null)
				{
					projTitle = 'No information given.'
				}
				if (projDesc === null)
				{
					projDesc = '';
				}
				var popupInfo = '<b>' + projTitle + '</b>'
							+ '<div class="projDescText">' + projDesc + '</div>';

				L.geoJSON(loadedData.features[i],
						function(eachFeature, layer){
						console.log(eachFeature);
				}).bindPopup( popupInfo )
				.addTo(theMap);

				//var m = L.marker( [loadedData.features[i].properties.y, loadedData.features[i].properties.x ] )
                  
               // markerClusters.addLayer( m );
                //m.addTo(theMap);
			}
		});
	
L.Util.ajax("http://localhost:5000/data/counties.geojson").then(
		function(countiesObj){
			for(var i =0; i < countiesObj.features.length; i++)
			{
				L.geoJSON(countiesObj.features[i]).addTo(theMap);
			}
		}
	);

//theMap.addLayer( markerClusters );

