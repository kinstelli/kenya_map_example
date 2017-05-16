
Resources Used:

https://sandbox.idre.ucla.edu/sandbox/general/optimize-geojson

https://github.com/calvinmetcalf/leaflet-ajax
	-- but didn't like the apparenttly Promise-less GeoJSON Ajax call, so used util.ajax instead,
		and handled my own feature add ons

https://jsfiddle.net/ve2huzxw/307/

https://github.com/Leaflet/Leaflet.markercluster

http://leafletjs.com/examples/choropleth/

https://www.mapbox.com/api-documentation/


https://loading.io/

Qs:
Some descriptions are truncated from source data...anything we can do about this?

TODO:
	* shade areas by average project cost in that county 
	change built-in PHP server to Node.js standalone server
	add promises to rendering functions, so it's easier to handle when they're done
	hide various configs on server side
	decompose code into proper Angular factories, directives, components etc
	add mediaqueries for mobile?
	normalize some data into other json files for faster loading

WOULD BE NICE:
	add filtering by type
	icons for different proj types
	display legend for cholorpleth at left

