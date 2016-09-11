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
			return (profiles.length == 0 ? parser.getProfiles() : Promise.resolve(profiles)).then(profiles => {
				return Promise.map(profiles, profile_name => parser.getProfile(profile_name).then(profile => {
					if(!profile) return console.error(Colors.red(`> Profile '${profile_name}' was not found.`));
					parser.getBookmarks(profile, options).then(marks => {
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
