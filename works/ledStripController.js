require("dotenv").config();

const fetch = require("node-fetch");

function ledON() {
	return new Promise((resolve, reject) => {
		fetch(`https://maker.ifttt.com/trigger/SERVER_REQUEST_ACTION_ON/with/key/${process.env.MAGIC_HOME}`)
		.then(res => {
			console.log("LED ON");

			console.log(res);

			resolve();
		})
		.catch(e => {
			reject(e);

			console.error(e);
		});
	});
};

function ledOFF() {
	return new Promise((resolve, reject) => {
		fetch(`https://maker.ifttt.com/trigger/SERVER_REQUEST_ACTION_OFF/with/key/${process.env.MAGIC_HOME}`)
		.then(res => {
			console.log("LED OFF");

			console.log(res);

			resolve();
		})
		.catch(e => {
			reject(e);

			console.error(e);
		});
	});
};

module.exports = {
	ledON,
	ledOFF
};