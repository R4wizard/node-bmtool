"use strict";

const OS      = require('os');
const FS      = require('fs');
const Path    = require('path');
const Glob    = require('glob');
const Promise = require('bluebird');
const SQLite3 = require('sqlite3');

const Parser = require('../Parser');

class Firefox extends Parser {

	constructor() {
		super();
	}

	_queryMap(db, query, fn) {
		let promises = [];
		return new Promise((resolve, reject) => {
			db.each(query, (err, row) => {
				if(err) return reject(err);
				promises.push(fn(row));
			}, (err, row_count) => {
				if(err) return reject(err);
				Promise.all(promises).then(() => resolve(row_count));
			});
		});
	}

	getBookmarks(profile, global_options = {}) {
		let path = Path.join(profile.path, "places.sqlite");
		let db = new SQLite3.Database(path);
		let bookmarks = [];

		return new Promise((resolve, reject) => {
			db.serialize(() => {
				this._queryMap(db, "SELECT rowid AS id, title, dateAdded, fk FROM moz_bookmarks WHERE type = 1", row => { /* type 1 == bookmark */
					return this._queryMap(db, "SELECT rowid AS id, url FROM moz_places WHERE rowid = " + row.fk, mark => {
						let matches = [];

						matches.push(global_options.regex_uri && global_options.regex_uri.test(mark.url));
						matches.push(global_options.regex_name && global_options.regex_name.test(row.title));

						matches.push(!global_options.regex_name && !global_options.regex_uri);

						if(matches.indexOf(true) === -1)
							return false;

						bookmarks.push({
							name: row.title,
							type: "url",
							uri: mark.url,
							source: `Firefox (${profile.name})`,
							date_added: new Date(row.dateAdded / 1000)
						});
					});
				}).then(() => {
					db.close();
					resolve(bookmarks);
				});
			});
		});
	}

	getProfiles() {
		return this._findProfiles().then(profiles => {
			return Object.keys(profiles);
		});
	}

	getProfile(profile) {
		return this._findProfiles().then(profiles => {
			return profiles[profile] || false;
		});
	}

	_findProfiles() {
		let profiles = {};

		return new Promise((resolve, reject) => {
			this._findSearchPaths().forEach(path => {
				Glob.sync(Path.join(path, '*')).forEach(profile_path => {
					let name = profile_path.substr(path.length + 1);
					profiles[name] = {
						name: name,
						path: profile_path
					};;
				});
			});
			resolve(profiles);
		});
	}

	_findSearchPaths() {
		let paths = [];

		if(OS.platform() == "win32") {
			paths.push(Path.join(process.env.APPDATA, "Mozilla", "Firefox", "Profiles"));
			paths.push(Path.join(process.env.USERPROFILE, "Application Data", "Mozilla", "Firefox", "Profiles"));
		}

		if(OS.platform() == "darwin") {
			paths.push(Path.join(process.env.HOME, "Library", "Application Support", "Firefox", "Profiles"));
			paths.push(Path.join(process.env.HOME, "Library", "Mozilla", "Firefox", "Profiles"));
		}

		if(['linux', 'sunos', 'freebsd'].indexOf(OS.platform()) !== -1) {
			paths.push(Path.join(process.env.HOME, ".mozilla", "firefox"));
		}

		return paths;
	}

}

module.exports = Firefox;
