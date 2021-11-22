require("dotenv").config();

const moment = require("moment-timezone");
const favicon = require("serve-favicon");
const Mongoose = require("mongoose");
const fetch = require("node-fetch");
const express = require("express");
const cron = require("node-cron");
const path = require("path");

const Alarms = require("./models/Alarms");

moment.locale("fr");

moment.relativeTimeThreshold("s", 60);
moment.relativeTimeThreshold("m", 60);
moment.relativeTimeThreshold("h", 24);
moment.relativeTimeThreshold("d", 31);
moment.relativeTimeThreshold("M", 12);
moment.relativeTimeThreshold("y", 365);

const setupNextAlarm = require("./works/setupNextAlarm");
const ledStripController = require("./works/ledStripController");

const PORT = process.env.PORT || 8888;

const app = express();

//app.use(favicon(path.join(__dirname, "wbs", "views", "favicon.ico")));
app.use(express.static("public"));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

require("./router")(app);

Mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	ssl: true,
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
}, err => {
	if(err) return console.error(err);

	console.log("DB READY");
});

//WS

const webSocketServer = require("websocket").server;

let clients = [];

const server = require("http").createServer(app);

server.listen(PORT || 8888, () => {
    console.log(`Server started on port ${server.address().port}`);
});

const wsServer = new webSocketServer({
 	httpServer: server
});

wsServer.on("request", request => {
	console.log(`Connection requested by: '${request.key}' via ${request.origin}.`);

	let connection = request.accept(null, request.origin);
	let index = clients.push(connection) - 1;

	console.log("Connection accepted.");

	clients.forEach(client => {
		client.send(JSON.stringify({
			command: "hearthbeat",
			rest: getTime()
		}));
	});

	connection.on("message", message => {
		//let content = JSON.parse((message.utf8Data));
		let content = message.utf8Data;
		let parsed_content = content.split(":");

		console.log(`Received Message from: ${request.key}
${content}`);
		
		switch(parsed_content[0]) {
			case "run":
				clients.forEach(client => {
					client.send(JSON.stringify({
						command: parsed_content[1],
						rest: parsed_content[2]
					}));
				});
			break;

			case "led":
				if(parsed_content[1] === "on") ledStripController.ledON();
				if(parsed_content[1] === "off") ledStripController.ledOFF();
			break;
		};

		/*clients.forEach(client => {
			client.send(content);
		});*/
	}); 

	connection.on("close", connection => {
		console.log(`Peer ${connection} disconnected.`);

		clients.splice(index, 1);
	});
});

function getTime() {
	let time = moment().tz("Europe/Paris");

	return `${time.format("HH:mm")}`;
};

cron.schedule("0 * * * * *", () => {
	fetch("https://smart-alarm-vb.herokuapp.com/").catch(console.error);

	clients.forEach(client => {
		client.send(JSON.stringify({
			command: "hearthbeat",
			rest: getTime()
		}));
	});

	Alarms.find({
		rang: false
	}, (ERR, ALARMS) => {
		if(ERR) return console.error(ERR);

		ALARMS.forEach(alarm => {
			console.log(`Alarm ${moment(alarm.at).format("HH:mm:ss DD/MM/YYYY")}`);

			if(moment(alarm.at).isSameOrBefore(moment())) return;//Remove the '!' here !!!!!!!!!!!!!

			console.log(`Alarm ${moment(alarm.at).format("HH:mm:ss DD/MM/YYYY")} will ring now`);
			//ring

			//need to activate the relay 5mn before the alarm

			clients.forEach(client => {
				client.send(JSON.stringify({
					command: "message",
					rest: alarm.message
				}));

				console.log(`Alarm ${moment(alarm.at).format("HH:mm:ss DD/MM/YYYY")} send to a client`);
			});

			ledStripController.ledON()
			.then(() => {
				console.log(`Alarm ${moment(alarm.at).format("HH:mm:ss DD/MM/YYYY")} turned on LEDs`);

				alarm.rang = true;

				alarm.markModified("rang");
	
				alarm.save();
			})
			.catch(() => {
				//Fallback alarm (ring phone)
				console.log(`Alarm ${moment(alarm.at).format("HH:mm:ss DD/MM/YYYY")} could not turn on LEDs`);
			});
		});
	});
});

cron.schedule("0 20 * * *", () => {
	setupNextAlarm();
});

//setupNextAlarm();