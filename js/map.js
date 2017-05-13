var app = angular.module('projectsMapApp', []);

var baseUrl = 'http://localhost:5000';

//TODO: hide authtoken and other configs on server side
app.controller('appCtrlr', function($scope, $http, $q) {

 	$scope.theMap = L.map('mapid').setView([0.0515, 38.09], 6);

	$scope.doInit = function()
	{
		//collection vars to init
		$scope.projSet = [];
		$scope.countySet = [];

		$scope.displayStatus = 'Inited.';
		$scope.showClusters = true;

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

	//TODO: don't actually clear ALL the layers on cluster toggle rerender,
	// just clear the projects/clusters
	$scope.toggleClustering = function()
	{
		$scope.showClusters = (!$scope.showClusters);
		$scope.reRenderMap();
	}


	$scope.reRenderMap = function()
	{
		$scope.currentlyRendering = true; 
		$scope.clearAllLayers();
		$scope.displayStatus = 'Loading features into map';
		$scope.setTheTile();

		//TODO: turn add*ToMap methods into promises
		$scope.addProjectsToMap();
		$scope.addCountyDataToMap();
	}

	//TODO: use Angular filters to filter the data...

	$scope.clearAllLayers = function()
	{
		$scope.displayStatus = 'Re-rendering...';
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
		var markerClusters = L.markerClusterGroup();

		for(var i =0; i < theFeatures.length; i++)
		{
			$scope.displayStatus += '.';
			var props = theFeatures[i].properties;
			var popupMarkup = $scope.buildPopupMarkup(props);

			if ($scope.showClusters)
			{
				//TODO: dont we want to use the Point info here, not props info?
				var m = L.marker( [props.y, props.x ] ).bindPopup( popupMarkup );
           		markerClusters.addLayer( m );
			}else
			{
				//TODO: why use a diff format here, versus clusters format?
				L.geoJSON(theFeatures[i]).bindPopup( popupMarkup )
				.addTo($scope.theMap);
			}
		}

		//done cycling through features..
		if($scope.showClusters)
		{
			$scope.theMap.addLayer(markerClusters);	
		}
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
		$scope.calcCountyStats();
		console.log('county stats are now:', $scope.countyStats);

		$scope.currentlyRendering = true; 
		var counties = $scope.countySet;
		for(var i =0; i < counties.length; i++)
		{
			L.geoJSON(counties[i], 
				{style: $scope.getChloroplethStyle(counties[i]) })
			.addTo($scope.theMap);
		}
		$scope.currentlyRendering = false; 
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

	$scope.calcCountyStats = function()
	{
		$scope.countyStats = { }; //re init this
		for (var i = 0; i < $scope.projSet.length; i++)
		{
			var props = $scope.projSet[i].properties;
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

		//then store the max of county stats into same object
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
		var projTitle = (props.project_title !== null) ? props.project_title: 'No information provided.';
		var projDesc = (props.project_description !== null) ? props.project_description : '';
		var projObjectives = (props.project_objectives !== null) ? props.project_objectives : '';
		
			return 	'<b>' + projTitle + '</b>'
					+ '<div class="projDescText">' + projDesc + '</div>'
					+ '<div class="projObjectivesText">' + projObjectives + '</div>';

	}

	$scope.getChloroplethStyle = function(countyObj)
	{
		var maxCount = $scope.countyStats.maxCount;
		var projsPerCounty = $scope.countyStats[countyObj.properties.COUNTY_NAM];

		//TODO: build a linear curve with the mean & min/max of projs per county
		var dynColor = Math.round( ( 255 - (maxCount) ) +  (($scope.countyStats[countyObj.properties.COUNTY_NAM]) * 8)  );
		
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

		


		


