var app = angular.module('projectsMapApp', []);

app.filter('displayOnlyAfterHyphen', function() {
        return function(input) {
        	if (input !== null)
        	{
	            var splitResult = input.split("-");
	        	if ( splitResult !== null && splitResult.length > 1)
	        	{
	        		return splitResult[1];
	        	}
        	}
        	return null;
        }
    });


var baseUrl = 'http://localhost:5000';

//TODO: hide authtoken and other configs on server side
app.controller('appCtrlr', function($scope, $http, $q) {

 	$scope.theMap = L.map('mapid').setView([0.0515, 38.09], 6);
	$scope.projFilter = { 
				showOnlyProjsWithTitle: false, 
				ngProgrammeFilter: null,
				titleKeyword: null,
				descKeyword: null,
		};

	$scope.doInit = function()
	{
		//collection vars to init
		$scope.projSet = [];
		$scope.countySet = [];
		$scope.countyStats = { }; //re init this

		//this object will store unique values from various project properties
		//	for dynamic picklist options, etc
		$scope.uniquePropValues = { };
		$scope.propsNotToIndex = ['objectid','total_project_cost__kes_',
					'projectid','x','y','project_description','project_objectives'];

		$scope.displayStatus = 'Inited.';
		$scope.showClusters = true;

		//first functions to load...
		$scope.setTheTile();
		$scope.currentlyRendering = true; 
		$scope.loadTheData();
	}

	// this is passed to each prop to collect values to index (Note: resource intensive - O2)
	$scope.collectUniqueValues = function()
	{
		$scope.projSet.map(function(proj)
		{
			for(var aProp in proj.properties)
			{
				if ($scope.propsNotToIndex.indexOf(aProp) < 0)
				{
					//console.log('check if unique:',aProp, proj.properties[aProp] );
				addPropValueIfUnique(aProp, proj.properties[aProp]);
				}	
			}
		});
		console.log('Unique values found:', $scope.uniquePropValues);
	}

	var addPropValueIfUnique = function(projProp, curValue)
	{
		if ($scope.uniquePropValues.hasOwnProperty(projProp))
		{
			if ($scope.uniquePropValues[projProp].indexOf(curValue) > -1)
			{
				//console.log($scope.uniquePropValues[projProp],' already contains?: ', curValue );
				return; 
			}else //no? then add it
			{
				$scope.uniquePropValues[projProp].push(curValue);
			}
		}else{//	property doesn't exist yet. add prop and an array containing the value.

			$scope.uniquePropValues[projProp] = [curValue];
		}
	}

	$scope.orderNGProgramByText = function(fullProgText) {
		 if(fullProgText.indexOf('-') > -1 && fullProgText.indexOf('-') < fullProgText.length)
		 {
		 	return fullProgText.split('-');
		 }
  		 console.log(fullProgText);
	};

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
						console.log('Loaded: ' + $scope.projSet.length + ' projects.');
						console.log('Loaded: ' + $scope.countySet.length + ' counties.');
						$scope.collectUniqueValues();
						$scope.addProjectsToMap();
						$scope.addCountyDataToMap();
					}
					);
	}

	$scope.doFilter = function()
	{
		//set the filter, rerender data.
		$scope.reRenderMap();
	}

	$scope.clearFilters = function()
	{
		$scope.projFilter = { 
				showOnlyProjsWithTitle: false, 
				ngProgrammeFilter: null,
				titleKeyword: null,
				descKeyword: null,
		};
		$scope.doFilter();
	}

	//TODO: finish this filter callback
	function projFilterFunc(proj)
	{
		var filtersPassed = 0; 
		var filtersToPass = 0;
		
		if($scope.projFilter.showOnlyProjsWithTitle)
		{
			console.log('only showing projs with title');
			filtersToPass++;
			if (proj.properties.project_title !== null)
			{
				filtersPassed++;
			}
		}

		if ($scope.projFilter.titleKeyword !== null)
		{
			filtersToPass++;

			console.log('keyword search:' + $scope.projFilter.titleKeyword);
			if(proj.properties.hasOwnProperty('project_title') && 
				proj.properties.project_title !== null &&
				proj.properties.project_title.toLowerCase().indexOf($scope.projFilter.titleKeyword.toLowerCase()) > -1)
			{
				filtersPassed++;
			}
		}
		// 
		if ($scope.projFilter.ngProgrammeFilter !== null && $scope.projFilter.ngProgrammeFilter.length > 0)
		{
			filtersToPass++;
			console.log('filtering by programme');
			if(proj.properties.hasOwnProperty('ng_programme') && 
				proj.properties.ng_programme !== null &&
				//note that this is doing indexOf an array, not a string
				$scope.projFilter.ngProgrammeFilter.indexOf(proj.properties.ng_programme) > -1)
			{
				filtersPassed++;
			}
		}
		
		return (filtersPassed >= filtersToPass )
	}

	$scope.addProjectsToMap = function()
	{
		$scope.filteredProjSet = $scope.projSet.filter(projFilterFunc);

		var markerClusters = L.markerClusterGroup();

		//TODO: convert to map, to better handle filters
		for(var i =0; i < $scope.filteredProjSet.length; i++)
		{
			//TODO:? apply proj filter in this loop?

			$scope.displayStatus += '.';
			var props = $scope.filteredProjSet[i].properties;
			var popupMarkup = $scope.buildPopupMarkup(props);

			if ($scope.showClusters)
			{
				//TODO: dont we want to use the Point info here, not props info?
				var m = L.marker( [props.y, props.x ] ).bindPopup( popupMarkup );
           		markerClusters.addLayer( m );
			}else
			{
				//TODO: why use a diff format here, versus clusters format?
				L.geoJSON($scope.filteredProjSet[i]).bindPopup( popupMarkup )
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
		//returning the result at end of chain, which is a Promise
		return $http.get(baseUrl + '/data/prunedprojdata.geojson')
				.then(function(results){ 
					$scope.projSet = results.data.features;
					$scope.filteredProjSet = $scope.projSet.slice(); // init a copy
				});
	}

	$scope.addCountyDataToMap = function()
	{
		$scope.calcCountyStats();

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
		//returning the result at end of chain, which is a Promise
		return $http.get( baseUrl + '/data/counties.geojson')
					.then(function(countiesObj){
						$scope.countySet = countiesObj.data.features;
			});
	}

	//TODO: include avg. cost data
	//TODO: update this to display stats based on currently shown projs, not all loaded projs
	$scope.calcCountyStats = function()
	{
		$scope.countyStats = { }; //re init this
		for (var i = 0; i < $scope.filteredProjSet.length; i++)
		{
			var props = $scope.filteredProjSet[i].properties;
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
		for (var prop in $scope.countyStats)
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
		var maxCount = ( 1 + $scope.countyStats.maxCount); // so range = 0 -> maxCount
		var projsPerCounty = (typeof($scope.countyStats[countyObj.properties.COUNTY_NAM]) === 'undefined' ? 0 : $scope.countyStats[countyObj.properties.COUNTY_NAM]);
		console.log('maxCount is: ', maxCount, 'projsPerCounty:', projsPerCounty);
		//TODO: build a linear curve with the mean & min/max of projs per county
		var dynColor = Math.round( 254 - ((projsPerCounty * (maxCount / (maxCount * 0.10)) *  (255 / maxCount)) + 1));
		
		var blueVal = 255;
		var greenVal = 	dynColor;
		var redVal = dynColor;

		return { 
				fillColor: 'rgb('+redVal + ',' + greenVal + ',' + blueVal + ')',
				fillOpacity: '0.5' 
			};	
	}


});//end controller

		


		


