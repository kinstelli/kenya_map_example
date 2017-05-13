const fs = require('fs');

const fileInPath = '../data/Distribution_of_Donor_and_GOK_Funded_Projects_2013_to_2015.geojson';
const fileOutPath = '../data/prunedprojdata.geojson';

const unusedFields = ['ward', 'approval_date', 'start_date__planned_','constituency',
					'start_date__actual_', 'end_date__planned_', 'end_date__actual_',
					'duration', 'duration__months_', 'vision_2030_flagship_ministry',
					'vision_2030_flagship_project_pr', 'implementation_status', 
					'mtef_sector', 'work_plan_progress____', 'project_cost_yearly_breakdown__', 
					'implementing_agency'];

let parsedJSON = JSON.parse(fs.readFileSync(fileInPath, 'utf8'));

let newCollection = [];

parsedJSON.features.map(function removeFields(feature){

	if (hasGeometry(feature)) //don't bother with this record if it has no geometry
	{
		//remove unnecessary props from each object
		for (var prop in feature.properties )
		{
			if (feature.properties.hasOwnProperty(prop) && (unusedFields.indexOf(prop) > -1)) 
			{
				delete feature.properties[prop];
			}
		}
 		// and if it has unique geometry, store it in a new array
		//addIfUnique(newCollection, feature);
		newCollection.push(feature);

	}
});

//TODO: instead of eradicating data, normalize some data for filtering, but put elsewhere

function hasGeometry(newItem)
{
	if (newItem.geometry === null)
	{
		return false;
	}
	return true;
}

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

