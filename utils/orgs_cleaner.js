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
		addIfUnique(newCollection, feature);
	}
});

//TODO: instead of eradicating data, normalize some data for filtering, but put elsewhere


//TODO: doublecheck against duplicate coords or objects missing essential data
function hasGeometry(newItem)
{
	if (newItem.geometry === null)
	{
		return false;
	}
	return true;
}

function addIfUnique(newColl, newItem)
{
	for (var i = 0; i < newColl.length; i++)
	{
		//find out if this exact long/lat already exists in the array
		if (newColl[i].geometry.coordinates[0] === newItem.geometry.coordinates[0]
			&& newColl[i].geometry.coordinates[1] === newItem.geometry.coordinates[1])
		{
			console.log('matched:', newColl[i],' against ', newItem);
			//then, decide what to keep...

			//if the existing record has no data, and the new one *does*, then overwrite old record
			if (newColl[i].properties.project_title === null && newItem.properties.project_title !== null)
			{
				newColl[i] = newItem;
			}
			//if the existing record has proj name/desc data, and this one doesn't, then don't add it
			else if (newItem.properties.project_title === null)
			{
				return;
			//if they both have data, then add the record
			}else if (newColl[i].properties.project_title !== null && newItem.properties.project_title !== null)
			{
				return;
			}
		}
	}

	//TODO: this is a potentially ugly side-effect, don't rely on array ref here
	newColl.push(newItem);
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

