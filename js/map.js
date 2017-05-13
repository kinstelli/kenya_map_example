var app = angular.module('projectsMapApp', []);

var baseUrl = 'http://localhost:5000';

//TODO: hide authtoken and other configs on server side
app.controller('appCtrlr', function($scope, $http, $q) {

	$scope.doClustering = true;
	$scope.countyStats = { };
 	$scope.theMap = L.map('mapid').setView([0.0515, 38.09], 6);
	$scope.markerClusters = L.markerClusterGroup();
	$scope.displayStatus = '';
	$scope.currentlyRendering = false; 

	$scope.doInit = function()
	{
		//vars to init
		$scope.projSet = [];
		$scope.countySet = [];
		$scope.displayStatus = 'Inited.';
		$scope.countyStats = { };

		//first functions to load...
		$scope.setTheTile();
		$scope.currentlyRendering = true; 
		$scope.loadTheData();
	}

	$scope.setTheTile = function()
	{
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={authToken}' , {
			maxZoom: 15,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets',
			authToken: 'pk.eyJ1IjoibXJra2lzZWxqYWsiLCJhIjoiY2oybW9qYThlMDE0eTJ4bWh6cDBzOHNxaiJ9.9Kdv39_U7J2_UaDhbNj_CQ',
		}).addTo($scope.theMap);
	}


	$scope.toggleClustering = function()
	{
		$scope.doClustering = (!$scope.doClustering);
		$scope.reRenderMap();
		//TODO: turn add*ToMap methods into promises

		
	}

	$scope.reRenderMap = function()
	{
		$scope.clearAllLayers();
		$scope.currentlyRendering = true; 
		$scope.displayStatus = 'Loading features into map';
		$scope.setTheTile();
		//TODO: decide if we need to reload serverside data

		$scope.addProjectsToMap();
		$scope.addCountyDataToMap();
	}

	//TODO: use Angular filters to filter the data...

	$scope.clearAllLayers = function()
	{
		$scope.displayStatus = 'Re-rendering...';
		$scope.markerClusters.clearLayers();

		$scope.theMap.eachLayer(function (layer) {
    		$scope.theMap.removeLayer(layer);
		});

	}

	$scope.loadTheData = function()
	{
		//load project data
		$q.all([$scope.loadProjectData(),
				$scope.loadCountyData()])
			.then(
					function(){
						console.log('Loaded everything...');
						console.log('Currently loaded: ' + $scope.projSet.length + ' projects.');
						console.log('Currently loaded: ' + $scope.countySet.length + ' counties.');
						
						$scope.addProjectsToMap();
						$scope.addCountyDataToMap();
					}
					);
	}

	$scope.addProjectsToMap = function()
	{
		$scope.currentlyRendering = true; 
		var theFeatures = $scope.projSet;
		for(var i =0; i < theFeatures.length; i++)
		{
			$scope.displayStatus += '.';
			var props = theFeatures[i].properties;
			var popupMarkup = $scope.buildPopupMarkup(props);

			$scope.calcCountyStats(props);

			if ($scope.doClustering)
			{
				var m = L.marker( [props.y, props.x ] )
              	.bindPopup( popupMarkup )
           		$scope.markerClusters.addLayer( m );
			}else
			{
				L.geoJSON(theFeatures[i],
						function(eachFeature, layer){
						console.log(eachFeature);
				}).bindPopup( popupMarkup )
				.addTo($scope.theMap);
			}
		}

		//done cycling through features..
		if($scope.doClustering)
		{
			$scope.theMap.addLayer($scope.markerClusters);	
		}
		$scope.getRangeOfCountyStats();
		$scope.displayStatus = 'Finished loading features.';
		$scope.currentlyRendering = false; 
	}

	$scope.loadProjectData = function()
	{
		console.log('loading proj data');
		//returning the result at end of chain, which is a Promise
		return $http.get(baseUrl + '/data/prunedprojdata.geojson')
				.then(function(results){ 
					$scope.projSet = results.data.features;
				});
	}

	$scope.addCountyDataToMap = function()
	{
		var counties = $scope.countySet;
		for(var i =0; i < counties.length; i++)
		{
			L.geoJSON(counties[i], 
				{style: $scope.getChloroplethStyle(counties[i]) })
			.addTo($scope.theMap);
		}
	}

	$scope.loadCountyData = function()
	{
		console.log('Current county stats:' , $scope.countyStats);
		//returning the result at end of chain, which is a Promise
		return $http.get( baseUrl + '/data/counties.geojson')
					.then(function(countiesObj){
						$scope.countySet = countiesObj.data.features;
			});
	}

	$scope.calcCountyStats = function(props)
	{
		if (props.county !== null)
		{
			var curCounty = props.county.toUpperCase();
			//then incr count of proj per county
			if ($scope.countyStats.hasOwnProperty( curCounty ))
			{
				$scope.countyStats[curCounty] += 1;
			}else{

				$scope.countyStats[curCounty] = 1;
			}
		}
	}

	$scope.getRangeOfCountyStats = function ()
	{
		//assume some counties aren't in our list, so assume min = 0
		//find bounds of county stats:
		var maxCount = 0;

		for (let prop in $scope.countyStats)
		{
			if ($scope.countyStats[prop] > maxCount)
			{ maxCount = $scope.countyStats[prop]; }

		}
		$scope.countyStats.maxCount = maxCount;
	}



	$scope.buildPopupMarkup = function(props)
	{
		//Clicking on a marker should show project title, description and objectives
		var projTitle = (props.project_title !== null) ? props.project_title: 'No information given.';
		var projDesc = (props.project_description !== null) ? props.project_description : '';
		var projObjectives = (props.project_objectives !== null) ? props.project_objectives : '';
		
		return '<b>' + projTitle + '</b>'
					+ '<div class="projDescText">' + projDesc + '</div>'
					+ '<div class="projObjectivesText">' + projObjectives + '</div>';

	}

	$scope.getChloroplethStyle = function(countyObj)
	{
		var maxCount = $scope.countyStats.maxCount;
		//TODO: build a linear curve with the mean & min/max of projs per county
		//TODO: display a legend, based on increments of curve
		var dynColor = Math.round( (255 - (maxCount)) +  (($scope.countyStats[countyObj.properties.COUNTY_NAM]) * 8)  );
		var blueVal = 255;
		var greenVal = 	dynColor;
		var redVal = dynColor;

		//create a range of reds:
		return { 
				fillColor: 'rgb('+redVal + ',' + greenVal + ',' + blueVal + ')',
				fillOpacity: '0.5' 
			};	
	}


});//end controller

		


		


