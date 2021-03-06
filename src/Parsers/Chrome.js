"use strict";

const OS      = require('os');
const FS      = require('fs');
const Path    = require('path');
const Promise = require('bluebird');

const Parser = require('../Parser');

class Chrome extends Parser {

	constructor() {
		super();
	}

	getBookmarks(profile, global_options = {}) {
		let raw = this._parseFileJSON(Path.join(profile.path, "Bookmarks"));
		let flat = this._flattenBookmarks(raw);

		let final = [];

		flat.forEach(i => {
			let matches = [];

			matches.push(global_options.regex_uri && global_options.regex_uri.test(i.url));
			matches.push(global_options.regex_name && global_options.regex_name.test(i.name));

			matches.push(!global_options.regex_name && !global_options.regex_uri);

			if(matches.indexOf(true) === -1)
				return false;

			final.push({
				name: i.name,
				type: i.type,
				uri: i.url,
				source: `Chrome (${profile.name})`,
				date_added: this._parseChromeTime(i.date_added)
			});
		});

		return Promise.resolve(final);
	}

	getProfiles() {
		return Promise.resolve(Object.keys(this._findProfiles()));
	}

	getProfile(profile) {
		let profiles = this._findProfiles();
		if(!profiles[profile])
			return Promise.resolve(false);

		return Promise.resolve(profiles[profile]);
	}

	_parseChromeTime(time) {
		let past = new Date(1601, 0, 1).getTime();
		time = parseInt(time, 10);
		time = time / 1000;
		return new Date(past + time);
	}

	_flattenBookmarks(raw) {
		let marks = [];

		if(typeof raw != 'object')
			return marks;

		Object.keys(raw).forEach(k => {
			if(typeof raw[k] != 'object')
				return;

			if(raw[k].id && raw[k].url) {
				marks.push(raw[k]);
			} else {
				marks = marks.concat(this._flattenBookmarks(raw[k]));
			}
		});

		return marks;
	}

	_findProfiles() {
		let profiles = {};

		this._findSearchPaths().forEach(path => {
			let state = this._parseFileJSON(Path.join(path, "Local State"));

			if(state == null || typeof state != 'object')
				return false;

			if(typeof state.profile != 'object' || typeof state.profile.info_cache != 'object')
				return false;

			Object.keys(state.profile.info_cache).forEach(k => {
				let name = state.profile.info_cache[k].shortcut_name;
				let profile_path = Path.join(path, k);
				try {
					FS.accessSync(profile_path, FS.constants.R_OK);
					profiles[name] = {
						name: name,
						path: profile_path
					};
				} catch(e) { }
			});
		});

		return profiles;
	}

	_findSearchPaths() {
		let paths = [];

		if(OS.platform() == "win32") {
			paths.push(Path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data"));
			paths.push(Path.join(process.env.LOCALAPPDATA, "Chromium", "User Data"));
			paths.push(Path.join(process.env.USERPROFILE, "Local Settings", "Application Data", "Google", "Chrome", "User Data"));
			paths.push(Path.join(process.env.USERPROFILE, "Local Settings", "Application Data", "Chromium", "User Data"));
		}

		if(OS.platform() == "darwin") {
			paths.push(Path.join(process.env.HOME, "Library", "Application Support", "Google", "Chrome"));
			paths.push(Path.join(process.env.HOME, "Library", "Application Support", "Chromium"));
		}

		if(['linux', 'sunos', 'freebsd'].indexOf(OS.platform()) !== -1) {
			paths.push(Path.join(process.env.HOME, ".config", "google-chrome"));
			paths.push(Path.join(process.env.HOME, ".config", "chromium"));
			paths.push(Path.join(process.env.HOME, "chronos"));
		}

		return paths;
	}

}

module.exports = Chrome;
