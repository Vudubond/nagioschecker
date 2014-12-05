function checkerEngine(configuration) {
	this.loop = null;
	this.loopIcon = null;
	this.iconServers = [];
	this.started = false;
	this.configuration = configuration;
	this.serial = 0;

	this.notificationAlerts = [];
	this.notificationLevel = 0;

	this.playSound = function(sound, repeat) {
		var sounds = ['', 'warning', 'critical', 'hostdown'];
		$('#sound' + sounds[sound]).get(0).play();
		//if(repeat) audio.loop = true;
		//audio.play();
		//return audio;
	};

	this.stopSound = function(sound) {
		sound.pause();
	};

	// Start the engine
	this.start = function() {
		// If clone copy of config.servers is empty, re-fill it with enabled servers
		var i, serversList = [];
		for(i in this.configuration.servers) { if(this.configuration.servers[i].enabled == true) { if(this.configuration.servers[i].enabled == true) serversList.push(this.configuration.servers[i].name); } };

		this.checkServers(serversList, 'hosts');
		this.loop = setTimeout("chrome.extension.getBackgroundPage().checker.start();", this.configuration.options.commun.checkFrequency * 1000);
		this.started = true;
	};

	// Stop everything
	this.stop = function() {
		clearTimeout(this.loop);
		this.started = false;
	};

	// Stop...wait, no ! start !!
	this.restart = function() {
		this.stop();
		this.start();
	};

	// Icon rotation
	this.startIcon = function() {
		// No servers ?.. exit
		if($.isEmptyObject(this.configuration.servers)) {
			chrome.browserAction.setBadgeText({text: ''});
			chrome.browserAction.setBadgeBackgroundColor({color: [128, 128, 128, 255]});
			chrome.browserAction.setIcon({path:'/icons/icon.png'});
			return;
		}

		// If clone copy of config.servers is empty, re-fill it with enabled servers
		if(this.iconServers.length == 0) {
			this.iconServers = [];
			var i;
			for(i in this.configuration.servers) { if(this.configuration.servers[i].enabled == true) { this.iconServers.push(this.configuration.servers[i]); } };
		}
		var iconCurrent = this.iconServers.shift();

		if(this.started == false) {
			chrome.browserAction.setBadgeText({text: 'stop'});
			chrome.browserAction.setBadgeBackgroundColor({color: [128, 128, 128, 255]});
			chrome.browserAction.setIcon({path:'/icons/icon_grey.png'});
		} else if(typeof(this.configuration.results[iconCurrent.name]) != 'undefined') {
			var nbs = 0, nbh = 0, nbr = 0, nbo = 0, nby = 0;

			for(h in this.configuration.results[iconCurrent.name].hosts) {
				if(this.configuration.results[iconCurrent.name].hosts[h].status != 'OK') nbh++;
				if(this.configuration.results[iconCurrent.name].hosts[h].downtime == false) {
					if(this.configuration.results[iconCurrent.name].hosts[h].status == 'DOWN') nbr++;
					if(this.configuration.results[iconCurrent.name].hosts[h].status == 'UNREACHABLE') nbo++;
				}
			}
			for(i in this.configuration.results[iconCurrent.name].services) {
				if(this.configuration.results[iconCurrent.name].services[i].status != 'OK') nbs++;
				if(this.configuration.results[iconCurrent.name].services[i].downtime == false) {
					if(this.configuration.results[iconCurrent.name].services[i].status == 'CRITICAL') nbr++;
					if(this.configuration.results[iconCurrent.name].services[i].status == 'UNKNOWN') nbo++;
					if(this.configuration.results[iconCurrent.name].services[i].status == 'WARNING') nby++;
				}
			}

			chrome.browserAction.setBadgeText({text: nbh + '/' + nbs});
			if(nbr != 0) {
				chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
				chrome.browserAction.setIcon({path:'/icons/icon_red.png'});
			} else if(nbo != 0 || nby != 0) {
				chrome.browserAction.setBadgeBackgroundColor({color: [255, 255, 0, 255]});
				chrome.browserAction.setIcon({path:'/icons/icon_yellow.png'});
			} else {
				chrome.browserAction.setBadgeBackgroundColor({color: [0, 255, 0, 255]});
				chrome.browserAction.setIcon({path:'/icons/icon.png'});
			}
		}
		this.loopIcon = setTimeout("chrome.extension.getBackgroundPage().checker.startIcon();", this.configuration.options.commun.iconFrequency * 1000);
	};

	this.stopIcon = function() {
		clearTimeout(this.loopIcon);
	};

	// Check all servers
	this.checkServers = function(list, step) {
		// No servers ? Get out !
		if(list.length == 0) return;

		var xhr = new XMLHttpRequest();
		xhr.serverName = list[0];
		xhr.list = list;
		xhr.checker = this;
		xhr.step = step;
		this.sound = 0;

		xhr.onreadystatechange = function() {
			if(this.readyState != 4 || this.status != 200) return;

			if(typeof(this.checker.configuration.results[this.serverName]) == 'undefined') this.checker.configuration.results[this.serverName] = { hosts: {}, services: {} };
			//this.checker.configuration.results[this.serverName][this.step] = {};

			var nb = 0;

			if(this.step == 'hosts') {
				var items = this.responseText.split(/<\/TR>\n<TR>\n<TD CLASS='statusHOST/i);
				items.shift();

				for(i in items) {
					if(typeof(i) != 'undefined') {
						// Status, last check, duration and information
						var s = [], m;
						var r = /<TD CLASS='status[^']+'[^>]*>([^<]+)<\/TD>\n/gi;

						while(m = r.exec(items[i])) { s.push(m[1]); };

						var entry = {
							id: 0,
							serverName: this.serverName,
							type: 'host',
							host: new RegExp(/'extinfo.cgi\?type=1&host=([^']+)'/).exec(items[i])[1],
							service: '',
							serial: this.checker.serial,
							status: s[0],
							lastCheck: s[1],
							duration: s[2],
							info: s[3].replace(/&nbsp;/, ''),
							downtime: items[i].search(/downtime\.gif/) > 0 ? true : false,
							acknowledged: items[i].search(/This host problem has been acknowledged/) > 0 ? true : false,
							notification: items[i].search(/Notifications for this host have been disabled/) > 0 ? false : true
						};
						entry.id = crc32(new RegExp(/'extinfo.cgi\?type=1&host=([^']+)'/).exec(items[i])[1]);

						if(entry.status != 'UP' && (this.checker.configuration.options.commun.displayProblemsDowntimed == true || entry.downtime === false) && (this.checker.configuration.options.commun.displayProblemsNotification == true || entry.notification === true) && (this.checker.configuration.options.commun.displayProblemsAcknowledged == true || entry.acknowledged === false)) {
							this.checker.configuration.results[this.serverName].hosts[entry.id]= this.checker.configuration.results[this.serverName].hosts[entry.id] ? this.checker.configuration.results[this.serverName].hosts[entry.id] : {};
							var e = this.checker.configuration.results[this.serverName].hosts[entry.id];
							e.id		= entry.id;
							e.serverName	= entry.serverName;
							e.type		= entry.type;
							e.host		= entry.host;
							e.service	= entry.service;
							e.serial	= entry.serial;
							e.status	= entry.status;
							e.notified	= e.notified ? e.notified : false;
							e.lastCheck	= entry.lastCheck;
							e.duration	= entry.duration;
							e.info		= entry.info
							e.downtime	= entry.downtime;
							e.acknowledged	= entry.acknowledged;
							e.notification	= entry.notification;
							nb++;
						}

						s = null; m = null; entry = null; r = null;
						delete s, m, entry, r;
					}
				};
			} else if(this.step == 'services') {
				var items = this.responseText.split(/<TR><TD colspan=6><\/TD><\/TR>\n/);
				var i;
				for(i in items) {
					if(items[i] != '') {
						// If host is not downtimed
						if(items[i].search(/This host is currently in a period of scheduled downtime/) < 0) {
							var item = items[i].split(/<\/TR>\n<TR>/i);
							for(ii in item) {
								var serviceName = /<A HREF='extinfo.cgi\?type=2&host=[^&]+&service=[^']+'>([^<]+)<\/A>/mi.exec(item[ii]);
								if(serviceName) {
									serviceName = serviceName[1];
									// Status, last check, duration and information
									var s = [], m;
									var r =  /<TD CLASS='status[^']+'[^>]*>(.+)<\/TD>\n/gi;
									while(m = r.exec(item[ii])) { s.push(m[1].replace(/(<[^>]+>|&nbsp;)/g, '')); };

									var entry = {
										id: 0,
										serverName: this.serverName,
										type: 'service',
										host: new RegExp(/'extinfo.cgi\?type=1&host=([^']+)'/).exec(items[i])[1],
										service: serviceName,
										serial: this.checker.serial,
										status: s[0],
										lastCheck: s[1],
										duration: s[2],
										info: s[4].replace(/&nbsp;/, ''),
										downtime: item[ii].search(/This service is currently in a period of scheduled downtime/) > 0 ? true : false,
										acknowledged: item[ii].search(/This service problem has been acknowledged/) > 0 ? true : false,
										notification: item[ii].search(/Notifications for this service have been disabled/) > 0 ? false : true
									};
									entry.id = crc32(entry.host + '-' + entry.service);

									if(entry.status != 'OK' && (this.checker.configuration.options.commun.displayProblemsDowntimed == true || entry.downtime == false) && (this.checker.configuration.options.commun.displayProblemsNotification == true || entry.notification == true) && (this.checker.configuration.options.commun.displayProblemsAcknowledged == true || entry.acknowledged == false)) {
										this.checker.configuration.results[this.serverName].services[entry.id] = this.checker.configuration.results[this.serverName].services[entry.id] ? this.checker.configuration.results[this.serverName].services[entry.id] : {};
										var e = this.checker.configuration.results[this.serverName].services[entry.id];
										e.id		= entry.id;
										e.serverName	= entry.serverName;
										e.type		= entry.type;
										e.host		= entry.host;
										e.service	= entry.service;
										e.serial	= entry.serial;
										e.status	= entry.status;
										e.notified	= e.notified ? e.notified : false;
										e.lastCheck	= entry.lastCheck;
										e.duration	= entry.duration;
										e.info		= entry.info
										e.downtime	= entry.downtime;
										e.acknowledged	= entry.acknowledged;
										e.notification	= entry.notification;
										nb++;
									}
								}
								ii = null; s = null; m = null; entry = null; serviceName = null; r = null;
								delete ii, s, m, entry, serviceName, r;
							};
							item = null;
							delete item;
						}
					}
					i = null;
					delete i;
				};
			}

			if(nb == 0) {
				// No alerts
				this.checker.configuration.results[this.serverName][this.step][1] = {
					id: 0,
					serverName: this.serverName,
					type: 'info',
					host: 'No alerts',
					service: 'for ' + this.step + '.',
					serial: this.checker.serial,
					status: 'OK',
					lastCheck: new Date(),
					duration: 0,
					info: '',
					downtime: false,
					acknowledged: false,
					notification: true
				};
			}

			var s;
			for(s in this.checker.configuration.results[this.serverName][this.step]) {
				if(this.checker.configuration.results[this.serverName][this.step][s].serial != this.checker.serial) delete this.checker.configuration.results[this.serverName][this.step][s];
			}

			delete s, i, items, nb, item;

			if(this.step == 'hosts') {
				this.checker.checkServers(this.list, 'services');
			} else if(this.step == 'services') {
				if(this.list.length > 1) {
					this.list.shift();
					this.checker.checkServers(this.list, 'hosts');
				} else {
					// Notifications
					this.checker.notificationLevel = 0;
					this.checker.notificationAlerts = {};
					for(s in this.checker.configuration.results) { for(t in this.checker.configuration.results[s]) { for(a in this.checker.configuration.results[s][t]) {
						var alerte = this.checker.configuration.results[s][t][a];
						if(alerte.notified == false) {
							if(alerte.status == 'CRITICAL')						{ this.checker.notificationLevel = 3; };
							if(alerte.status == 'DOWN'    && this.checker.notificationLevel < 2)	{ this.checker.notificationLevel = 2; };
							if(alerte.status == 'UNKNOWN' && this.checker.notificationLevel < 2)	{ this.checker.notificationLevel = 2; };
							if(alerte.status == 'WARNING' && this.checker.notificationLevel < 1)	{ this.checker.notificationLevel = 1; };
							this.checker.notificationAlerts[alerte.id] = alerte;
							alerte.notified = true;
						}
					}}}
					if(this.checker.notificationLevel > 0)
					{
						if(this.checker.configuration.options.commun.popup == true)
						{
							try {
								var notification = webkitNotifications.createHTMLNotification('/html/notification.html');
								notification.show();
								if(this.checker.configuration.options.commun.popupDuration != 301) setTimeout(function() { notification.cancel(); }, this.checker.configuration.options.commun.popupDuration * 1000);
							} catch (e) {
								console.error(e);
							}
						}
						if(this.checker.configuration.options.commun.sound == true) this.checker.playSound(this.checker.notificationLevel);
					}
					//if(level != 0) this.checker.notify(alerts);

					this.checker.serial++;
					delete this;
				}
			}
		};

		if(step == 'hosts') xhr.open("GET", this.configuration.getServerUrl(xhr.serverName) + this.configuration.servers[xhr.serverName].statusPath + '?hostgroup=all&style=hostdetail', true);
		if(step == 'services') xhr.open("GET", this.configuration.getServerUrl(xhr.serverName) + this.configuration.servers[xhr.serverName].statusPath + '?host=all', true);
		xhr.send(null); 
	};
};
