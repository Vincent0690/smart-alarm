const moment = require("moment-timezone");
const ical = require("node-ical");

const Alarms = require("../models/Alarms");

module.exports = () => {
	console.log("Running");

	ical.async.fromURL("https://mathis67.ymag.cloud/index.php/planning/ical/C63278DA-9407-435B-A7C7-47414985E89D/", {
		"method": "GET"
	}, (err, data) => {
		if(err) console.error(err);

		//console.log(data);

		for(let element in data) {
			if(!data.hasOwnProperty(element)) return;

			let ev = data[element];
			
			console.log(`Cours de ${ev.summary} en salle ${ev.location}. Le ${moment(ev.start).format("DD MMM YYYY à HH:mm:ss")} jusqu'à ${moment(ev.end).format("HH:mm:ss")}`);
		};
	});
};