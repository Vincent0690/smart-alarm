require("dotenv").config();

const moment = require("moment-timezone");
const config = require("./config.json");
const utils = require("./utils");

const Alarms = require("../models/Alarms");

module.exports = () => {
	console.log("Running");

	let tomorrow = moment().add(1, "day");
	//tomorrow = moment("22/10/2021", "DD/MM/YYYY");
	if(tomorrow.weekday() <= 5) {
		//WEEKDAYS
		console.log("Weekday");

		utils.isFreeDay(tomorrow)
		.then(freeday => {
			if(freeday) {
				console.log("Freeday so no alarm.");
			} else {
				utils.isClassDay(tomorrow)
				.then(nextClass => {
					if(nextClass) {
						let dayTarget = `${tomorrow.format("YYYYMMDD")}T000000`;
		
						utils.getTrains(dayTarget)
						.then(trains => {
							let bestTrain = utils.determineBestTrain(nextClass, trains);

							console.log(bestTrain);

							let departure = moment(bestTrain.journey.departure_date_time, "YYYYMMDDTHHmmss");

							let wakeupHour = departure.add(config.warmupDuration, "minutes");

							//If wakeup hour is over 7.30am, no alarm. TODO: can make it smarter to know if im already woke up
							if(wakeupHour.isAfter(moment(`${tomorrow.format("YYYYMMDD")}T${config.noAlarmAfterThis}`, "YYYYMMDDTHHmmss"))) return;

							Alarms.create({
								at: wakeupHour.tz("Europe/Paris").format("YYYYMMDDTHHmmss"),
								message: `Train à ${departure.tz("Europe/Paris").format("HH:mm")}`,
								reason: "class",
								rang: false
							});
						})
						.catch(console.error);
					} else {
						console.log("No class so work instead.");

						Alarms.create({
							at: moment(`${tomorrow.tz("Europe/Paris").format("YYYYMMDD")}T${config.workAlarm}`, "YYYYMMDDTHHmmss").format("YYYYMMDDTHHmmss"),
							message: "Journée de travail",
							reason: "work",
							rang: false
						});
					};
				})
				.catch(console.error);

				/*ical.async.fromURL("https://mathis67.ymag.cloud/index.php/planning/ical/C63278DA-9407-435B-A7C7-47414985E89D/", {
					"method": "GET"
				}, (err, AGENDA) => {
					if(err) console.error(err);
	
					//console.log(AGENDA);
	
					let nextClass = Object.values(AGENDA)
					.filter(e => (tomorrow.format("DDMMYYYY") === moment(e.start).format("DDMMYYYY")))
					.sort((a, b) => a.start - b.start)[0];
	
					if(!nextClass) {
						
						return;
					} else {
						console.log(`Cours de ${nextClass.summary} en salle ${nextClass.location}. Le ${moment(nextClass.start).tz("Europe/Paris").format("DD MMM YYYY à HH:mm:ss")} jusqu'à ${moment(nextClass.end).tz("Europe/Paris").format("HH:mm:ss")}`);
	
						let dayTarget = `${tomorrow.format("YYYYMMDD")}T000000`;
		
						fetch(`https://${process.env.SNCF}@api.sncf.com/v1/coverage/sncf/journeys?from=${config.stations.house}&to=${config.stations.school}&datetime=${dayTarget}`)
						.then(res => res.json())
						.then(TRAINS => {
							console.log(TRAINS);
						})
						.catch(console.error);
					}
				});*/
			};
		})
		.catch(console.error);
	} else {
		//WEEKENDS
		console.log("Weekend so no alarm.");
	};
};