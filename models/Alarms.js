const Mongoose = require("mongoose");

let Schema = Mongoose.Schema({
	at: Date,
	message: String,
	reason: String
});

module.exports = Mongoose.model("Alarms", Schema);