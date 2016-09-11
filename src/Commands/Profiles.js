"use strict";

const Colors  = require('colors');

const Command = require('../Command');
const Core    = require('../Core');

class Profiles extends Command {

	constructor(program) {
		super();

		program
			.command('profiles')
			.description('list all available profiles')
			.option('--parsers <names>', 'list of parsers to use', e => e.split(','))
			.action(this._handleCommand.bind(this))
			.on('--help', () => {
				console.log('  If no parsers are specified, all parsers will be used.');
				console.log('');
				console.log('  Examples:');
				console.log();
				console.log('     $ bmtool profiles');
				console.log('     $ bmtool profiles --parsers Chrome,Firefox');
				console.log();
			});
	}

	_handleCommand(options) {
		Core.getProfiles({
			parsers: options.parsers
		}).then(browsers => {
			for(let browser in browsers) {
				console.log(Colors.green(`> ${browser}:`));
				console.log();

				browsers[browser].forEach(profile => console.log(`    ${profile}`));

				if(!browsers[browser].length)
					console.log(`    no profiles detected`);

				console.log();
			}

			if(!Object.keys(browsers).length)
				console.log(Colors.red(`> no profiles detected at all`));
		});
	}

}

module.exports = Profiles;
