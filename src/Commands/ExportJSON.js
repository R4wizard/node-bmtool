"use strict";

const Colors  = require('colors');
const FS      = require('fs');

const Command = require('../Command');
const Core    = require('../Core');

class ExportJSON extends Command {

	constructor(program) {
		super();

		program
			.command('export-json')
			.description('retrieves all bookmarks from the list')
			.option('--regex-uri <regex>', 'regular expression that all URIs must match')
			.option('--regex-name <regex>', 'regular exprssion that all names must match')
			.option('--parsers <names>', 'list of parsers to use', e => e.split(','))
			.option('--profiles <names>', 'list of profile names to retrieve bookmarks from', e => e.split(','))
			.action(this._handleCommand.bind(this))
			.on('--help', () => {
				console.log('  If no parsers are specified, all parsers will be used.');
				console.log('  If no profiles are specified, all profiles will be used.');
				console.log('  If multiple regex parameters are specified, any matches for either will be returned.');
				console.log('');
				console.log('  Examples:');
				console.log();
				console.log('     $ bmtool export-json');
				console.log('     $ bmtool export-json --file output.json');
				console.log('     $ bmtool export-json --profiles "Peter Corcoran",Joe');
				console.log('     $ bmtool export-json --parsers Chrome,Firefox');
				console.log('     $ bmtool export-json --regex-uri "(youtube|soundcloud)\\.co(m|\\.uk)"');
				console.log('     $ bmtool export-json --regex-name "(YouTube|Soundcloud)"');
				console.log();
			});
	}

	_handleCommand(options) {
		let regex_uri = options.regexUri;
		let regex_name = options.regexName;

		if(regex_uri)  regex_uri = new RegExp(regex_uri, 'i');
		if(regex_name) regex_name = new RegExp(regex_name, 'i');

		let file = options.file || "output.json";

		Core.getBookmarks({
			profiles:   options.profiles,
			parsers:    options.parsers,
			regex_uri:  regex_uri,
			regex_name: regex_name
		}).then(bookmarks => {
			if(!bookmarks || !bookmarks.length)
				return console.error(Colors.red(`> Unable to find bookmarks with the specified parameters`));

			FS.writeFileSync(file, JSON.stringify(bookmarks, null, "\t"));
			console.log(Colors.green(`> Exported ${bookmarks.length} bookmarks to '${file}'`));
		});
	}

}

module.exports = ExportJSON;
