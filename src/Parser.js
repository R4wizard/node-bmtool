"use strict";

const FS = require('fs');

class Parser {

	_parseFileJSON(file) {
		try {
			return JSON.parse(FS.readFileSync(file));
		} catch(e) {
			return null;
		}
	}

}

module.exports = Parser;
