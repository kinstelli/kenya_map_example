# Interactive Map of Kenyan Donor and GOK Funded Projects 

### Overview

As per the requirements, this project provides a few features:

- Creates a web based map based on the dataset [provided here](http://www.opendata.go.ke/datasets/distribution-of-donor-and-gok-funded-projects-2013-to-2015) with simple markers for each project. 	Clicking on a marker should show project title, description and objectives.
	 
- Allows clustering / unclustering of markers on the map

- Displays a chloropleth of counties [from boundary dataset provided here](https://github.com/mikelmaron/kenya-election-data/blob/master/data/counties.geojson), based on either total projects per each county , or average total project cost for each county. 

Out of curiosity, I decided to add a few filters, such as a partial text filter, a filter that omits markers without a name or description, and a multi-select box to filter for "NG Programme".

- As projects are filtered, the chloropleth and relevant statistics are also recalculated and refreshed.

### Live version

This project is currently hosted here:

[https://morning-forest-71014.herokuapp.com/](https://morning-forest-71014.herokuapp.com/) 

### How to install/run

To run this project locally, clone the repo, make sure npm is installed, and run the following commands:

`cd kenya_projects_map`

`npm install`

`gulp`

The application should be visible at [http://localhost:3000](http://localhost:3000)

Gulp runs two tasks:
	`cleandata`, which does some trimming of the source JSON files, and
	`run`, which launches and watches the server

### Approach

I started this with raw HTML, JS, CSS, and some Leaflet libraries, and planned to write it in React, but after trying to use some React / Leaflet modules, I reversed course and built a very straightforward version with Angular 1. 

I'd never used Leaflet or Mapbox, but I saw it in the Ushahidi source code. After writing a handful of small Google Maps projects, I was eager to try out something else.

### Resources Used

 I followed a few suggestions here, per trimming the provided JSON files, though this mostly amounted to removing a few columns from the dataset.
[https://sandbox.idre.ucla.edu/sandbox/general/optimize-geojson
](https://sandbox.idre.ucla.edu/sandbox/general/optimize-geojson)

I started using this, although I skipped a few of the suggested AJAX functions which didn't return Promises as...well, promised, and used Angular's ajax functions instead.
[https://github.com/calvinmetcalf/leaflet-ajax
](https://github.com/calvinmetcalf/leaflet-ajax)	

This was an extraordinarily helpful library:
[https://github.com/Leaflet/Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)

As was this example:
[http://leafletjs.com/examples/choropleth/](http://leafletjs.com/examples/choropleth/)

Mapbox provided the map tiles, though I barely used its API: 
[https://www.mapbox.com/api-documentation/](https://www.mapbox.com/api-documentation/)

And I grabbed a loading gif, presumably license-free, from here.
[https://loading.io/](https://loading.io/) 

### Improvements to be made

Throughout the project, I kept notes of features I wanted to add/modify here, which are still relevant:
[TODOs](https://github.com/kinstelli/Map-Of-Kenya-Projects/blob/master/TODOs.md)
