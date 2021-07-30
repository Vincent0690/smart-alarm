require("dotenv").config();

const moment = require("moment-timezone");
const fetch = require("node-fetch");
const ical = require("node-ical");

const config = require("./config.json");

const Alarms = require("../models/Alarms");

module.exports = () => {
	console.log("Running");

	let tomorrow = moment().add(1, "day");

	//let tomorrow = moment("28/05/2021", "DD/MM/YYYY");

	if(tomorrow.weekday() <= 5) {
		//WEEKDAYS

		

		ical.async.fromURL("https://mathis67.ymag.cloud/index.php/planning/ical/C63278DA-9407-435B-A7C7-47414985E89D/", {
			"method": "GET"
		}, (err, AGENDA) => {
			if(err) console.error(err);

			//console.log(AGENDA);

			let nextClass = Object.values(AGENDA)
			.filter(e => (tomorrow.format("DDMMYYYY") === moment(e.start).format("DDMMYYYY")))
			.sort((a, b) => a.start - b.start)[0];

			if(!nextClass) {

			};

			console.log(`Cours de ${nextClass.summary} en salle ${nextClass.location}. Le ${moment(nextClass.start).tz("Europe/Paris").format("DD MMM YYYY à HH:mm:ss")} jusqu'à ${moment(nextClass.end).tz("Europe/Paris").format("HH:mm:ss")}`);

			let dayTarget = `${tomorrow.format("YYYYMMDD")}T000000`;

			fetch(`https://${process.env.SNCF}@api.sncf.com/v1/coverage/sncf/journeys?from=${config.stations.house}&to=${config.stations.school}&datetime=${dayTarget}`)
			.then(res => res.json())
			.then(TRAINS => {
				console.log(TRAINS);
			})
			.catch(console.error);
		});
	} else {
		//WEEKENDS
	};
};