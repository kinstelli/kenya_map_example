const fs = require('fs');

const fileInPath = '../data/Distribution_of_Donor_and_GOK_Funded_Projects_2013_to_2015.geojson';
const fileOutPath = '../data/Distribution_of_Donor_and_GOK_Funded_Projects_2013_to_2015.trimmed.geojson';

const unusedFields = ['ward', 'approval_date', 'start_date__planned_','constituency',
					'start_date__actual_', 'end_date__planned_', 'end_date__actual_',
					'duration', 'duration__months_', 'vision_2030_flagship_ministry',
					'vision_2030_flagship_project_pr', 'implementation_status', 
					'mtef_sector', 'work_plan_progress____', 'project_cost_yearly_breakdown__', 
					'total_project_cost__kes_', 'implementing_agency'];

let parsedJSON = JSON.parse(fs.readFileSync(fileInPath, 'utf8'));

let newCollection = [];

//proceed to remove unnecessary props from each object and store that in a new array
parsedJSON.features.map(function removeFields(feature){

	for (var prop in feature.properties )
	{
		if (feature.properties.hasOwnProperty(prop) && (unusedFields.indexOf(prop) > -1)) 
		{
			delete feature.properties[prop];
		}
	}
	newCollection.push(feature);
});

//TODO: instead of eradicating data, normalize some data for filtering, but put elsewhere

//reassemble to original object
parsedJSON.features = newCollection;

//then write it out to new file
const newJsonString = JSON.stringify(parsedJSON);
fs.writeFile(fileOutPath, newJsonString, function (err) {
	if (err)
	{
	  console.error('ERROR: unable to write file', err);
	}else
	{
		console.log('Success. Wrote ' + newCollection.length + ' objects to path: "' + fileOutPath + '"');
	}
});

