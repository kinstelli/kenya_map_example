//TODO: encapsulate this whole thing

//TODO: add Angular or React to handle interactivity

//TODO: hide authtoken and other configs on server side

var theMap = L.map('mapid').setView([0.0515, 38.09], 6);

var markerClusters = L.markerClusterGroup();

var doClustering = true;

//create assoc/obj data for each county (TODO: weigh benefit of server-side calcs)
var countyStats = { };

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={authToken}' , {
		maxZoom: 10,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets',
		authToken: 'pk.eyJ1IjoibXJra2lzZWxqYWsiLCJhIjoiY2oybW9qYThlMDE0eTJ4bWh6cDBzOHNxaiJ9.9Kdv39_U7J2_UaDhbNj_CQ',
	}).addTo(theMap);


//load project data
L.Util.ajax("http://localhost:5000/data/prunedprojdata.geojson").then(
		function(loadedData){ 

			for(var i =0; i < loadedData.features.length; i++)
			{
				var props = loadedData.features[i].properties;
				var popupMarkup = buildPopupMarkup(props);
				
				calcCountyStats(props);

				if (doClustering)
				{
					var m = L.marker( [props.y, props.x ] )
                  	.bindPopup( popupMarkup )
               		markerClusters.addLayer( m );
				}else
				{
					L.geoJSON(loadedData.features[i],
							function(eachFeature, layer){
							console.log(eachFeature);
					}).bindPopup( popupMarkup )
					.addTo(theMap);
				}
			}

			//done cycling through features..
			if(doClustering)
			{
				theMap.addLayer(markerClusters);	
			}
			getRangeOfCountyStats();

		}).then(function(){
				//Load county data
				L.Util.ajax("http://localhost:5000/data/counties.geojson")
						.then(function(countiesObj){
							for(var i =0; i < countiesObj.features.length; i++)
							{
								L.geoJSON(countiesObj.features[i], 
									{style: getChloroplethStyle(countiesObj.features[i]) })
								.addTo(theMap);
							}
						}
					);

});
	



function calcCountyStats(props)
{
	if (props.county !== null)
	{
		var curCounty = props.county.toUpperCase();
		//then incr count of proj per county
		if (countyStats.hasOwnProperty( curCounty ))
		{
			countyStats[curCounty] += 1;
		}else{

			countyStats[curCounty] = 1;
		}
	}
}


function getRangeOfCountyStats()
{
	//assume some counties aren't in our list, so assume min = 0
	//find bounds of county stats:
	var maxCount = 0;

	for (let prop in countyStats)
	{
		if (countyStats[prop] > maxCount)
		{ maxCount = countyStats[prop]; }

	}
	countyStats.maxCount = maxCount;
}

function getChloroplethStyle(countyObj)
{
	//TODO: build a linear curve with the mean & min/max of projs per county
	//TODO: display a legend, based on increments of curve

	var dynColor = Math.round((255 - (countyStats.maxCount)) +  ((countyStats[countyObj.properties.COUNTY_NAM]) * 8)  );
	var blueVal = 255;
	var greenVal = 	dynColor;
	var redVal = dynColor;

	//create a range of reds:
	return { 
			fillColor: 'rgb('+redVal + ',' + greenVal + ',' + blueVal + ')',
			fillOpacity: '0.5' 
		};	
}


function buildPopupMarkup(props)
{
	//Clicking on a marker should show project title, description and objectives
	var projTitle = (props.project_title !== null) ? props.project_title: 'No information given.';
	var projDesc = (props.project_description !== null) ? props.project_description : '';
	var projObjectives = (props.project_objectives !== null) ? props.project_objectives : '';
	
	return '<b>' + projTitle + '</b>'
				+ '<div class="projDescText">' + projDesc + '</div>'
				+ '<div class="projObjectivesText">' + projObjectives + '</div>';

}
