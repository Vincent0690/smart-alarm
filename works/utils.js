const moment = require("moment-timezone");
const config = require("./config.json");

const fetch = require("node-fetch");
const ical = require("node-ical");

function isFreeDay(date) {
	return new Promise((resolve, reject) => {
		ical.async.fromURL("https://etalab.github.io/jours-feries-france-data/ics/jours_feries_alsace-moselle.ics", {
			"method": "GET"
		}, (err, AGENDA) => {
			if(err) return reject(err);

			let freeday = Object.values(AGENDA)
			.sort((a, b) => a.start - b.start)
			.filter(e => (Number(date.format("DDMMYYYY")) === Number(moment(e.start).tz("Europe/Paris").format("DDMMYYYY"))))[0];
			
			if(!freeday) {
				resolve(false);

				console.log(`${date.format("DD/MM/YYYY")}: No freeday`);
			} else {
				resolve(true);

				console.log(`${date.format("DD/MM/YYYY")}: ${freeday.summary}`);
			};
		});
	});
};

function isClassDay(date) {
	return new Promise((resolve, reject) => {
		ical.async.fromURL("https://mathis67.ymag.cloud/index.php/planning/ical/C63278DA-9407-435B-A7C7-47414985E89D/", {
			"method": "GET"
		}, (err, AGENDA) => {
			if(err) return reject(err);

			let nextClass = Object.values(AGENDA)
			.filter(e => (date.format("DDMMYYYY") === moment(e.start).format("DDMMYYYY")))
			.sort((a, b) => a.start - b.start)[0];

			/*Object.values(AGENDA)
			.filter(e => (date.format("DDMMYYYY") === moment(e.start).format("DDMMYYYY")))
			.sort((a, b) => a.start - b.start)
			.forEach(nextClass => {
				console.log(`Cours de ${nextClass.summary} en salle ${nextClass.location}. Le ${moment(nextClass.start).tz("Europe/Paris").format("DD MMM YYYY à HH:mm:ss")} jusqu'à ${moment(nextClass.end).tz("Europe/Paris").format("HH:mm:ss")}`);
				//console.log(nextClass);
			});*/

			if(!nextClass) {
				resolve(false);

				console.log(`${date.format("DD/MM/YYYY")}: No class`);
			} else {
				resolve({
					cours: nextClass.summary.toString().split(" - ")[0],
					classroom: nextClass.location.toString().replace(" CFA", ""),
					description: nextClass.description.toString(),
					teacher: nextClass.summary.toString().split(" - ")[1],
					from: moment(nextClass.start).tz("Europe/Paris").toDate(),
					to: moment(nextClass.end).tz("Europe/Paris").toDate(),
				});

				console.log(`Cours de ${nextClass.summary} en salle ${nextClass.location}. Le ${moment(nextClass.start).tz("Europe/Paris").format("DD MMM YYYY à HH:mm:ss")} jusqu'à ${moment(nextClass.end).tz("Europe/Paris").format("HH:mm:ss")}`);
			};
		});
	});
};

function getTrains(dayTarget) {
	return new Promise((resolve, reject) => {
		fetch(`https://${process.env.SNCF}@api.sncf.com/v1/coverage/sncf/journeys?from=${config.stations.house}&to=${config.stations.school}&datetime=${dayTarget}&count=${config.requestJourneys}`)
		.then(res => res.json())
		.then(TRAINS => {
			/*TRAINS.journeys.forEach(train => {
				let sections = "";

				train.sections.filter(section => section.type === "public_transport").forEach(PTs => {
					sections += `> [${PTs.display_informations.commercial_mode}] ${PTs.display_informations.name} ${PTs.stop_date_times.length} arrêts
`;
				});

				console.log(`--------
Train à ${moment(train.departure_date_time, "YYYYMMDDTHHmmss").format("HH:mm:ss")}, arrive à ${moment(train.arrival_date_time, "YYYYMMDDTHHmmss").format("HH:mm:ss")}.
Duré: ${moment.duration(train.duration, "s").humanize()}
${sections}
--------`);
			});*/

			resolve(TRAINS.journeys);
		})
		.catch(reject);
	});
};

function determineBestTrain(nextClass, trains) {
	let goodOnes = [];
	let best;

	trains.forEach(train => {
		//Eliminate trains after the class or has less diff than 30mn
		if(moment(nextClass.from).diff(moment(train.arrival_date_time, "YYYYMMDDTHHmmss"), "minutes") < 30) return;
		//console.log(`Train: ${moment(train.arrival_date_time, "YYYYMMDDTHHmmss").format("HH:mm:ss")}. diff: ${moment(nextClass.from).diff(moment(train.arrival_date_time, "YYYYMMDDTHHmmss"), "minutes")}`);

		goodOnes.push({
			journey: train,
			diff: moment(nextClass.from).diff(moment(train.arrival_date_time, "YYYYMMDDTHHmmss"), "minutes")
		});
	});

	goodOnes.sort((a, b) => a.diff - b.diff);

	//If the 2nd train gives 0 to 15mn more diff, we take this one. Else we take the first
	if((goodOnes[1].diff - goodOnes[0].diff) <= 15) {
		best = goodOnes[1];
	} else best = goodOnes[0];

	return best;
};

module.exports = {
	isFreeDay,
	isClassDay,
	determineBestTrain,
	getTrains
};