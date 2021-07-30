require("dotenv").config();

const moment = require("moment-timezone");
const favicon = require("serve-favicon");
const Mongoose = require("mongoose");
const fetch = require("node-fetch");
const express = require("express");
const cron = require("node-cron");
const path = require("path");

moment.locale("fr");

const setupNextAlarm = require("./works/setupNextAlarm");

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

	connection.on("message", message => {
		//let content = JSON.parse((message.utf8Data));
		let content = message.utf8Data;
		let parsed_content = content.split(":");

		console.log(`Received Message from: ${request.key}
${content}`);
		
		switch(parsed_content[0]) {
			case "run":
				clients.forEach(client => {
					client.send(content.replace("run:"));
				});
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
	fetch("https://smart-alarm-vb.herokuapp.com/");

	clients.forEach(client => {
		client.send(JSON.stringify({
			command: "hearthbeat",
			rest: getTime()
		}));
	});
});

/*cron.schedule("0 20 * * *", () => {
	setupNextAlarm();
});

setupNextAlarm();*/