const Mongoose = require("mongoose");

let Schema = Mongoose.Schema({
	at: String,
	message: String,
	reason: String,
	rang: Boolean
});

module.exports = Mongoose.model("Alarms", Schema);