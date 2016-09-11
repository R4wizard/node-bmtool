"use strict";

const Program = require('commander');

const Package = require('../package.json');

class CLI {

	constructor() {
		Program.version(Package.version);

		let commands = [
			require('./Commands/Profiles'),
			require('./Commands/List'),
			require('./Commands/Random'),
			require('./Commands/ExportJSON')
		];

		commands.forEach(command => new command(Program));

		Program.parse(process.argv);

		if(!process.argv.slice(2).length)
			Program.outputHelp();
	}

}

module.exports = CLI;
