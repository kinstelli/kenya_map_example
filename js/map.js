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
		$scope.clusterButtonText = 'Uncluster Projects';
		$scope.showClusters = true;
		$scope.mapColorStat = 'projTotal';

		//this object will store unique values from various project properties
		//	for dynamic picklist options, etc
		$scope.uniquePropValues = { };
		$scope.propsNotToIndex = ['objectid','total_project_cost__kes_',
					'projectid','x','y','project_description','project_objectives'];

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

	//TODO: finish this
	$scope.orderNGProgramByText = function(fullProgText) {
		 if(fullProgText !== null && fullProgText.indexOf('-') > -1)
		 {
		 	return fullProgText.split('-')[1];
		 }
		 return null;
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

	//don't actually clear ALL the layers on cluster toggle rerender,
	// just clear the projects/clusters
	$scope.toggleClustering = function()
	{
		$scope.currentlyRendering = true; 
		$scope.showClusters = (!$scope.showClusters);
		if($scope.showClusters)
		{
			$scope.clusterButtonText = 'Uncluster Projects';
		}else
		{
			$scope.clusterButtonText = 'Cluster Projects';
		}
		$scope.reRenderMap();
	}

	$scope.colorBy = function(textValue)
	{
		$scope.mapColorStat = textValue;
		//redraw county cholorpleth
		$scope.reRenderMap();
	}

	$scope.reRenderMap = function()
	{

		//TODO: turn add*ToMap methods into promises to accurately know when complete
		setTimeout(function() {
        	$scope.currentlyRendering = true; 
			$scope.clearAllLayers();
			$scope.setTheTile();
			$scope.addProjectsToMap();
			$scope.addCountyDataToMap();
		}, 0);
	}


	$scope.clearAllLayers = function()
	{
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
						$scope.currentlyRendering = false;
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
					$scope.countyStats[curCounty].projCount += 1;
				}else{
					$scope.countyStats[curCounty] = {projCount: 1};
				}
				// now that a record has been added, include proj costs
				if (props.total_project_cost__kes_ !== null)
				{
					if ($scope.countyStats[curCounty].hasOwnProperty('projCosts'))
					{
						$scope.countyStats[curCounty].projCosts += (props.total_project_cost__kes_);
						$scope.countyStats[curCounty].projsWithCost += 1;
					}else
					{
						$scope.countyStats[curCounty]['projCosts'] = (props.total_project_cost__kes_);
						$scope.countyStats[curCounty]['projsWithCost'] = 1;
					}
				}
			}	
		}	
		calcMinMaxForCountyStats();
	}

	function calcMinMaxForCountyStats()
	{
		//then store the max of county stats into same object
		var maxCount = 0;
		var maxAvgCost = 0;
		var minAvgCost = null;

		for (var prop in $scope.countyStats)
		{
			if ($scope.countyStats[prop].projCount > maxCount)
			{ maxCount = $scope.countyStats[prop].projCount; }
			//calc averages
			if ($scope.countyStats[prop].projsWithCost > 0)
			{
				var countyAvg = Math.round($scope.countyStats[prop].projCosts / $scope.countyStats[prop].projsWithCost);
				if (countyAvg > maxAvgCost)
				{
					maxAvgCost = countyAvg;
				}
				if(countyAvg < minAvgCost || minAvgCost === null)
				{
					minAvgCost = countyAvg;
				}
			} 
		}
		//store these in same object for later
		$scope.countyStats.maxCount = maxCount;
		$scope.countyStats.maxAvgCost = maxAvgCost;
		$scope.countyStats.minAvgCost = minAvgCost;
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
		var countyValue = 0;
		var maxCount = 1;
		var dynColor = 255;

		var curCountyStats = {};
		if (typeof $scope.countyStats[countyObj.properties.COUNTY_NAM] !== 'undefined')
		{
			curCountyStats = $scope.countyStats[countyObj.properties.COUNTY_NAM];
		}

		// what are we coloring?
		if ($scope.mapColorStat === 'avgCost')
		{
			maxCount = ( 1 + $scope.countyStats.maxAvgCost); 
			var minAvgCost = $scope.countyStats.minAvgCost; 
			var costRange = (maxCount - minAvgCost);

			if (curCountyStats.hasOwnProperty('projsWithCost') && curCountyStats.projsWithCost > 0)
			{
				countyValue = 1 + (curCountyStats.projCosts / curCountyStats.projsWithCost);
				dynColor = Math.round( 255 - ( ((countyValue - minAvgCost) * 255 * (15)) / costRange + 1) );
			} 

		}else{ // assume projCount...or garbage-in-projCount-out
			
			maxCount = ( 1 + $scope.countyStats.maxCount); // so range = 0 -> maxCount
			countyValue = (typeof(curCountyStats.projCount) === 'undefined' ? 0 : curCountyStats.projCount);
			//TODO: build a linear curve with the mean & min/max of projs per county
			dynColor = Math.round( 254 - ((countyValue * 10) *  (255 / maxCount)) + 1);
		}
		
		var blueVal = 255;
		var greenVal = 	dynColor;
		var redVal = dynColor;

		return { 
				fillColor: 'rgb('+redVal + ',' + greenVal + ',' + blueVal + ')',
				fillOpacity: '0.5' 
			};	
	}


});//end controller

		


		


