"use strict";

const Colors  = require('colors');
const Promise = require('bluebird');

class Core {

	static getProfiles(options) {
		let parsers = options.parsers  || Core.DEFAULT_PARSERS;

		let profiles = {};
		return Promise.map(parsers, name => {
			let parser = this._getParser(name);
			if(!parser) return Promise.resolve();
			return parser.getProfiles().then(p => profiles[name] = p);
		}).then(() => profiles);
	}

	static getBookmarks(options) {
		let profiles = options.profiles || [];
		let parsers  = options.parsers  || Core.DEFAULT_PARSERS;

		let bookmarks = [];

		return Promise.map(parsers, parser_name => {
			let parser = this._getParser(parser_name);
			if(!parser) return Promise.resolve();
			return parser.getProfiles().then(parser_profiles => {
				if(profiles.length == 0)
					profiles = parser_profiles;

				profiles = profiles.filter(profile => parser_profiles.indexOf(profile) !== -1);

				return Promise.map(profiles, profile_name => parser.getProfile(profile_name).then(profile => {
					if(!profile) return console.warn(Colors.yellow(`> Profile '${parser_name}/${profile_name}' was not found.`));
					return parser.getBookmarks(profile, options).then(marks => {
						bookmarks = bookmarks.concat(marks);
					});
				}));
			});
		}).then(() => bookmarks);
	}

	static getRandomBookmark(options) {
		return Core.getBookmarks(options).then(bookmarks => {
			return bookmarks[(Math.random() * bookmarks.length - 1) | 0];
		});
	}

	static getParser(parser) {
		return new (require(`./Parsers/${parser}`))();
	}

	static _getParser(parser) {
		try {
			return this.getParser(parser);
		} catch(e) {
			console.error(Colors.red(`> Parser '${parser}' was not found.`));
			console.error(e);
			return null;
		}
	}
}

Core.DEFAULT_PARSERS = ['Chrome', 'Firefox'];

module.exports = Core;
