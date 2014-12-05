/*
	Fonctions de gestion de la configuration
 */

function ncConfig() {
	this.options = {};
	this.servers = {};
	this.results = {};
	this.version = '3.0.0';

	// Chargement de la configuration
	this.load = function() {
		this.migrate();
		if(typeof(localStorage['ncConfig']) != 'undefined') {
			this.options = JSON.decode(localStorage['ncConfig']);
		} else {
			this.loadDefaults();
			this.save();
		}
		if(typeof(localStorage['ncServers']) != 'undefined') {
			this.servers = JSON.decode(localStorage['ncServers']);
		}
		return this.options;
	};

	// Sauvegarde de la configuration
	this.save = function() {
		localStorage['ncConfig'] = JSON.encode(this.options);
		localStorage['ncServers'] = JSON.encode(this.servers);
		localStorage['ncVersion'] = this.version;
	};
	
	// Add new server
	this.addServer = function(serverName) {
		if(typeof(this.servers[serverName]) == 'undefined') this.servers[serverName] = {
			name: serverName,
			protocol: 'http',
			username: 'username',
			password: 'password',
			url: 'url.to',
			root: '/nagios',
			servicesPath: '/nagios/cgi-bin/extinfo.cgi?type=2&host=[host]&service=[service]',
			hostsPath: '/nagios/cgi-bin/extinfo.cgi?type=1&host=[host]',
			extinfoPath: '/nagios/cgi-bin/extinfo.cgi',
			statusPath: '/nagios/cgi-bin/status.cgi',
			tacPath: '/nagios/cgi-bin/tac.cgi',
			cmdPath: '/nagios/cgi-bin/cmd.cgi',
			enabled: false
		};
		return this.servers[serverName];
	};
	
	this.getAlertUrl = function(alert) {
		var url = this.getServerUrl(alert.serverName);
		if(alert.service == '') {
			// This is a host alert
			url+= this.servers[alert.serverName].hostsPath.replace('[host]', alert.host);
		} else {
			// This is a service alert
			url+= this.servers[alert.serverName].servicesPath.replace('[host]', alert.host).replace('[service]', alert.service);
		}
		return url;
	},
	
	this.getServerUrl = function(serverName) {
		var url = this.servers[serverName].protocol;
		url+= '://';
		if(this.servers[serverName].username != '') {
			url+= this.servers[serverName].username;
			if(this.servers[serverName].password != '') url+= ':' + this.servers[serverName].password;
			url+= '@';
		}
		url+= this.servers[serverName].url;
		return url;
	};
	
	// Delete a server by name
	this.delServer = function(name) {
		if(typeof(this.servers[name]) != 'undefined') {
			delete this.servers[name];
		}
	};

	// Default options loading
	this.loadDefaults = function() {
		this.options = {
			commun : {
				displayProblemsAcknowledged : false,
				displayProblemsNotification : false,
				displayProblemsDowntimed : false,
				displayProblemsOthers : true,
				gridMode : 'Highlighted',
				checkFrequency : 60,
				iconFrequency : 2,
				newStateDuration : 600,
				popup : true,
				popupDuration : 60,
				sound : true
			}
		};
	};

	this.migrate = function() {
		if(typeof(localStorage['ncVersion']) == 'undefined') {
			// First install
			this.loadDefaults();
			this.save();
		}
		if(localStorage['ncVersion'] == '2.0.0') {
			// 2.0.0 to 2.1.0 : Added two options "acknowledged" and "notifications"
			var config = JSON.decode(localStorage['ncConfig']);
			config.options.acknowledged = false;
			config.options.notification = false;
			config.options.problemDisplayMode = 0;
			localStorage['ncConfig'] = JSON.encode(config);
			localStorage['ncVersion'] = '2.1.0';
		}
		if(localStorage['ncVersion'] == '2.1.0') {
			// 2.1.0 to 3.0.0 : Code rewrite
			var config = JSON.decode(localStorage['ncConfig']);
			this.options = {
				commun : {
					displayProblemsAcknowledged : config.options.acknowledged,
					displayProblemsNotification : config.options.notification,
					displayProblemsDowntimed : config.options.downtimed,
					displayProblemsOthers : true,
					gridMode : 'Highlighted',
					checkFrequency : config.options.updateFreq,
					iconFrequency : config.options.iconFreq,
					newStateDuration : config.options.newStateDuration * 60,
					popup : true,
					popupDuration : 60,
					sound : true
				}
			};
			for(s in config.servers) {
				this.servers[config.servers[s].name] = { 
					name: config.servers[s].name,
					protocol: config.servers[s].protocol,
					username: config.servers[s].username,
					password: config.servers[s].password,
					url: config.servers[s].root,
					root: config.servers[s].nagios,
					servicesPath: config.servers[s].servicesPath,
					hostsPath: config.servers[s].hostsPath,
					extinfoPath: '/nagios/cgi-bin/extinfo.cgi',
					statusPath: config.servers[s].statusPath,
					tacPath: config.servers[s].tacPath,
					cmdPath: config.servers[s].cmdPath,
					enabled: config.servers[s].enabled
				};
			}
			this.save();
		}
	};
};
