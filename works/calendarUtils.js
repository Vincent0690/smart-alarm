function isFreeDay(date) {
	return new Promise((resolve, reject) => {
		ical.async.fromURL("https://etalab.github.io/jours-feries-france-data/ics/jours_feries_alsace-moselle.ics", {
			"method": "GET"
		}, (err, AGENDA) => {
			
		});
	});
};

module.exports = {
	isFreeDay
};