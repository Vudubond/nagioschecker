// Open tactical view
function openTac(server) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	window.open(configuration.getServerUrl(server) + configuration.servers[server].tacPath);
}

// Open nagios home
function openNagios(server) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	window.open(configuration.getServerUrl(server) + configuration.servers[server].root);
}

// Enable/disable notifications
function notificationAlert(server, id, enabled) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var a = typeof(configuration.results[server].hosts[id]) != 'undefined' ? configuration.results[server].hosts[id] : configuration.results[server].services[id];

	$("#loadMask").dialog("open");
	$("#loadMask").dialog("option", "title", "Notification for alert");
	$("#loadMask").empty();
	$("#loadMask").append('<div id="progressbar"></div>');
	$('#progressbar').progressbar({ value: 0 });

	var params = 'host=' + a.host;
	params+= '&service=' + a.service;
	params+= '&cmd_typ=';
	params+= a.service != '' ? enabled == true ? 22 : 23 : enabled == true ? 24 : 25;
	params+= '&cmd_mod=2';

	var xhr = new XMLHttpRequest();
	xhr.host = a.host;
	xhr.service = a.service;
	xhr.onreadystatechange = function() {
		if(this.readyState != 4 || this.status != 200) return;
		if(this.responseText.indexOf('Your command request was successfully submitted to Nagios for processing.') < 0) {
			// Error
			$("#loadMask").append(a.service == '' ? 'Error : ' + this.host + '<br />' : 'Error : ' + this.host + '/' + this.service + '<br />');
		}
		$('#progressbar').progressbar('option', 'value', 100);
		setTimeout("$('#loadMask').dialog('close');", 1000);
	};
	xhr.open("POST", configuration.getServerUrl(server) + configuration.servers[server].cmdPath, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(params);
}

// Refresh one alert effectively
function doRefresh(server, alerts, nb, cur) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var a = alerts.shift();
	cur = cur ? cur : 0;
	if(a) {
		if(a.type != 'info') {
			var params = 'host=' + a.host;
			params+= '&service=' + a.service;
			params+= '&start_time=' + dateFormat(new Date(), "dd-mm-yyyy HH:MM:ss");
			params+= '&force_check=on&cmd_typ=';
			params+= a.service != '' ? 7 : 96;
			params+= '&cmd_mod=2';

			var xhr = new XMLHttpRequest();
			xhr.host = a.host;
			xhr.service = a.service;
			xhr.onreadystatechange = function() {
				if(this.readyState != 4 || this.status != 200) return;
				if(this.responseText.indexOf('Your command request was successfully submitted to Nagios for processing.') < 0) {
					// Error
					$("#loadMask").append(a.service == '' ? 'Error : ' + this.host + '<br />' : 'Error : ' + this.host + '/' + this.service + '<br />');
				}
				$('#progressbar').progressbar('option', 'value', (cur + 1) * 100 / nb);
				doRefresh(server, alerts, nb, cur + 1);
			};
			xhr.open("POST", configuration.getServerUrl(server) + configuration.servers[server].cmdPath, true);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.send(params);
		} else {
			$('#progressbar').progressbar('option', 'value', (cur + 1) * 100 / nb);
			doRefresh(server, alerts, nb, cur + 1);
		}
	} else {
		setTimeout("$('#loadMask').dialog('close');", 1000);
	}
}

// Undowntime alert
function unDowntimeAlert(server, id) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var a = typeof(configuration.results[server].hosts[id]) != 'undefined' ? configuration.results[server].hosts[id] : configuration.results[server].services[id];

	$("#loadMask").dialog("open");
	$("#loadMask").dialog("option", "title", "Remove downtime from alert");
	$("#loadMask").empty();
	$("#loadMask").append('<div id="progressbar"></div>');
	$('#progressbar').progressbar({ value: 0 });

	var xhr = new XMLHttpRequest();
	xhr.host = a.host;
	xhr.service = a.service;
	xhr.onreadystatechange = function() {
		if(this.readyState != 4 || this.status != 200) return;
		// Step 1, display all downtimes

		var items = this.responseText.split(/<tr CLASS='downtime[^']+'><td CLASS='downtime[^']+'>/);
		items.shift();
		var downId = -1;

		for(i in items) {
			if(typeof(i) != 'undefined' && downId < 0) {
				// Status, last check, duration and information
				var r = /<A HREF='extinfo.cgi\?type=2&host=([^&]+)&service=([^']+)'/gi;
				var m = r.exec(items[i]);
				if(m == null) {
					r = /<A HREF='extinfo.cgi\?type=1&host=([^']+)'/gi;
					m = r.exec(items[i]);
					m[2] = '';
				}

				if(this.host + '==' + decodeURIComponent(m[1].replace(/\+/g, ' ')) && this.service + '==' + decodeURIComponent(m[2].replace(/\+/g, ' '))) {
					r = /<a href='cmd.cgi\?cmd_typ=7.&down_id=([^']+)'>/;
					downId = r.exec(items[i])[1];
					// Downtime ID found !

					var params = '?cmd_mod=2&cmd_typ=';
					params += m[2] != '' ? 79 : 78;
					params += '&down_id=' + downId;

					xhr.onreadystatechange = function() {
						if(this.readyState != 4 || this.status != 200) return;
						// Step 2, remove downtime
						
						if(this.responseText.indexOf('Your command request was successfully submitted to Nagios for processing.') < 0) {
							// Error
							$("#loadMask").append(a.service == '' ? 'Error : ' + this.host + '<br />' : 'Error : ' + this.host + '/' + this.service + '<br />');
						}
						$('#progressbar').progressbar('option', 'value', 100);
						setTimeout("$('#loadMask').dialog('close');", 1000);
					}
					xhr.open("GET", configuration.getServerUrl(server) + configuration.servers[server].cmdPath + params, true);
					xhr.send(null);
				}
			}
		}
	};
	xhr.open("GET", configuration.getServerUrl(server) + configuration.servers[server].extinfoPath + '?type=6', true);
	xhr.send(null);
}


// Unacknowledge alert
function unAckAlert(server, id) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var a = typeof(configuration.results[server].hosts[id]) != 'undefined' ? configuration.results[server].hosts[id] : configuration.results[server].services[id];

	$("#loadMask").dialog("open");
	$("#loadMask").dialog("option", "title", "Remove acknowledgment from alert");
	$("#loadMask").empty();
	$("#loadMask").append('<div id="progressbar"></div>');
	$('#progressbar').progressbar({ value: 0 });

	var params = 'host=' + a.host;
	params+= '&service=' + a.service;
	params+= '&cmd_typ=';
	params+= a.service != '' ? 52 : 51;
	params+= '&cmd_mod=2';

	var xhr = new XMLHttpRequest();
	xhr.host = a.host;
	xhr.service = a.service;
	xhr.onreadystatechange = function() {
		if(this.readyState != 4 || this.status != 200) return;
		if(this.responseText.indexOf('Your command request was successfully submitted to Nagios for processing.') < 0) {
			// Error
			$("#loadMask").append(a.service == '' ? 'Error : ' + this.host + '<br />' : 'Error : ' + this.host + '/' + this.service + '<br />');
		}
		$('#progressbar').progressbar('option', 'value', 100);
		setTimeout("$('#loadMask').dialog('close');", 1000);
	};
	xhr.open("POST", configuration.getServerUrl(server) + configuration.servers[server].cmdPath, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(params);
}

// Downtime alert
function downtimeAlert(server, id) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var a = typeof(configuration.results[server].hosts[id]) != 'undefined' ? configuration.results[server].hosts[id] : configuration.results[server].services[id];
	
	$("#downtimeMask").dialog("open");
	$("#downtimeMask").dialog("option", "title", "Downtime alert...");
	$("#downtimeCommText").val("Downtimed from Nagios Checker.");

	$("#downtimeCancel").click(function() { $("#downtimeMask").dialog("close"); });
	$("#downtimeSubmit").click(function() { 
		$("#downtimeMask").dialog("close");
		$("#loadMask").dialog("open");
		$("#loadMask").dialog("option", "title", "Downtime alert");
		$("#loadMask").empty();
		$("#loadMask").append('<div id="progressbar"></div>');
		$('#progressbar').progressbar({ value: 0 });

		var params = 'host=' + a.host;
		params += '&service=' + a.service;
		params += '&cmd_typ=';
		params += a.service != '' ? 56 : 55;
		params += '&cmd_mod=2';
		params += '&com_data=' + $("#downtimeCommText").val();
		params += '&start_time=' + $('#downtimeStartDate').val() + ' ' + $('#downtimeStartTime').val() + ':00';
		params += '&end_time=' + $('#downtimeEndDate').val() + ' ' + $('#downtimeEndTime').val() + ':00';
		params += '&fixed=1'

		var xhr = new XMLHttpRequest();
		xhr.host = a.host;
		xhr.service = a.service;
		xhr.onreadystatechange = function() {
			if(this.readyState != 4 || this.status != 200) return;
			if(this.responseText.indexOf('Your command request was successfully submitted to Nagios for processing.') < 0) {
				// Error
				$("#loadMask").append(a.service == '' ? 'Error : ' + this.host + '<br />' : 'Error : ' + this.host + '/' + this.service + '<br />');
			}
			$('#progressbar').progressbar('option', 'value', 100);
			setTimeout("$('#loadMask').dialog('close');", 1000);
		};
		xhr.open("POST", configuration.getServerUrl(server) + configuration.servers[server].cmdPath, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.send(params);
	});
}

// Acknowledge alert
function ackAlert(server, id) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var a = typeof(configuration.results[server].hosts[id]) != 'undefined' ? configuration.results[server].hosts[id] : configuration.results[server].services[id];
	
	$("#ackMask").dialog("open");
	$("#ackMask").dialog("option", "title", "Acknowledge alert...");
	$("#ackCommText").val("Acknowledged from Nagios Checker.");

	$("#ackCancel").click(function() { $("#ackMask").dialog("close"); });
	$("#ackSubmit").click(function() { 
		$("#ackMask").dialog("close");
		$("#loadMask").dialog("open");
		$("#loadMask").dialog("option", "title", "Acknowledge alert");
		$("#loadMask").empty();
		$("#loadMask").append('<div id="progressbar"></div>');
		$('#progressbar').progressbar({ value: 0 });

		var params = 'host=' + a.host;
		params += '&service=' + a.service;
		params += '&cmd_typ=';
		params += a.service != '' ? 34 : 33;
		params += '&cmd_mod=2';
		params += '&com_data=' + $("#ackCommText").val();
		params += '&sticky_ack=';
		params += $("#ackStickyCheck").attr('checked') ? "on" : "off";
		params += '&send_notification=';
		params += $("#ackSendCheck").attr('checked') ? "on" : "off";
		params += '&persistent=';
		params += $("#ackPersistCheck").attr('checked') ? "on" : "off";

		var xhr = new XMLHttpRequest();
		xhr.host = a.host;
		xhr.service = a.service;
		xhr.onreadystatechange = function() {
			if(this.readyState != 4 || this.status != 200) return;
			if(this.responseText.indexOf('Your command request was successfully submitted to Nagios for processing.') < 0) {
				// Error
				$("#loadMask").append(a.service == '' ? 'Error : ' + this.host + '<br />' : 'Error : ' + this.host + '/' + this.service + '<br />');
			}
			$('#progressbar').progressbar('option', 'value', 100);
			setTimeout("$('#loadMask').dialog('close');", 1000);
		};
		xhr.open("POST", configuration.getServerUrl(server) + configuration.servers[server].cmdPath, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.send(params);
	});
}

// Refresh one alert
function refreshAlert(server, id) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var a = typeof(configuration.results[server].hosts[id]) != 'undefined' ? configuration.results[server].hosts[id] : configuration.results[server].services[id];
	
	$("#loadMask").dialog("open");
	$("#loadMask").dialog("option", "title", "Refresh alert");
	$("#loadMask").empty();
	$("#loadMask").append('<div id="progressbar"></div>');
	$('#progressbar').progressbar({ value: 0 });

	doRefresh(server, new Array(a), 1);
}

// Refresh all alerts
function refreshAllAlerts(server) {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	$("#loadMask").dialog("open"); 
	$("#loadMask").dialog("option", "title", "Refresh alerts");
	$("#loadMask").empty();
	$("#loadMask").append('<div id="progressbar"></div>');
	$('#progressbar').progressbar({ value: 0 });

	alerts = new Array();

	for(a in configuration.results[server].hosts) alerts.push(configuration.results[server].hosts[a]);
	for(a in configuration.results[server].services) alerts.push(configuration.results[server].services[a]);

	doRefresh(server, alerts, alerts.length);
}

$(document).ready(function() {
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var checker= chrome.extension.getBackgroundPage().checker;

	$("#loadMask").dialog({
		height: 140,
		modal: true,
		autoOpen: false,
		draggable: false,
		resizable: false
	});

	$("#ackMask").dialog({
		height: 140,
		modal: true,
		autoOpen: false,
		draggable: false,
		resizable: false
	});

	$("#ackStickyCheck").button();
	$("#ackSendCheck").button();
	$("#ackPersistCheck").button();
	$("#ackSubmit").button();
	$("#ackCancel").button();
	
	$("#downtimeMask").dialog({
		height: 170,
		modal: true,
		autoOpen: false,
		draggable: false,
		resizable: false
	});
	var dates = $("#downtimeStartDate, #downtimeEndDate").datepicker({
		dateFormat: 'mm-dd-yy',
		minDate: new Date(),
		onSelect: function( selectedDate ) {
			var option = this.id == "downtimeStartDate" ? "minDate" : "maxDate", instance = $(this).data("datepicker");
			date = $.datepicker.parseDate( instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings );
			dates.not(this).datepicker("option", option, date);
		}
	});
	$("#downtimeStartTime, #downtimeEndTime").timepicker();
	$("#downtimeStartDate").val(dateFormat(new Date(), 'mm-dd-yyyy'));
	$("#downtimeEndDate").val(dateFormat(new Date(), 'mm-dd-yyyy'));
	$("#downtimeStartTime").val(dateFormat(new Date(), 'HH:MM'));
	$("#downtimeEndTime").val(dateFormat(new Date().setHours(new Date().getHours() + 2), 'HH:MM'));
	$("#downtimeSubmit").button();
	$("#downtimeCancel").button();
	
	// Alert's color
	var alertColor = {
		DOWN: 'alert-red',
		UNREACHABLE: 'alert-orange',
		CRITICAL: 'alert-red',
		UNKNOWN: 'alert-orange',
		WARNING: 'alert-yellow',
		OK: 'alert-green'
	};
	
	function fillGrid(filter) {
		$('#serverGrid').jqGrid('clearGridData');
		var i = 1;
		for(server in configuration.results) {
			// Add all hosts alerts
			for(host in configuration.results[server].hosts) {
				if(typeof(filter) == 'undefined' || (configuration.results[server].hosts[host].host.toLowerCase().indexOf(filter.toLowerCase()) >= 0 || configuration.results[server].hosts[host].service.toLowerCase().indexOf(filter.toLowerCase()) >= 0)) {
					$('#serverGrid').jqGrid('addRowData', host, {
						num: i,
						type: '<div class="' + alertColor[configuration.results[server].hosts[host].status] + '">' + getIcons(configuration.results[server].hosts[host]) + '</div>',
						host: '<div class="' + alertColor[configuration.results[server].hosts[host].status] + '">' + configuration.results[server].hosts[host].host + '</div>',
						service: '<div class="' + alertColor[configuration.results[server].hosts[host].status] + '">' + configuration.results[server].hosts[host].service + '</div>',
						actions: '<div class="' + alertColor[configuration.results[server].hosts[host].status] + '">' + getActions(configuration.results[server].hosts[host]) + '</div>',
						duration: configuration.results[server].hosts[host].duration,
						lastCheck: configuration.results[server].hosts[host].lastCheck,
						info: configuration.results[server].hosts[host].info,
						serverName: configuration.results[server].hosts[host].serverName
					});
					$('#serverGrid tr#' + host + ' td').addClass(alertColor[configuration.results[server].hosts[host].status]);
					i++;
				}
			};
			// Add all services alerts
			for(service in configuration.results[server].services) {
				if(typeof(filter) == 'undefined' || (configuration.results[server].services[service].host.toLowerCase().indexOf(filter.toLowerCase()) >= 0 || configuration.results[server].services[service].service.toLowerCase().indexOf(filter.toLowerCase()) >= 0)) {
					$('#serverGrid').jqGrid('addRowData', service, {
						num: i,
						type: '<div class="' + alertColor[configuration.results[server].services[service].status] + '">' + getIcons(configuration.results[server].services[service]) + '</div>',
						host: '<div class="' + alertColor[configuration.results[server].services[service].status] + '">' + configuration.results[server].services[service].host + '</div>',
						service: '<div class="' + alertColor[configuration.results[server].services[service].status] + '">' + configuration.results[server].services[service].service + '</div>',
						actions: '<div class="' + alertColor[configuration.results[server].services[service].status] + '">' + getActions(configuration.results[server].services[service]) + '</div>',
						duration: configuration.results[server].services[service].duration,
						lastCheck: configuration.results[server].services[service].lastCheck,
						info: configuration.results[server].services[service].info,
						serverName: configuration.results[server].services[service].serverName
					});
					$('#serverGrid tr#' + service + ' td').addClass(alertColor[configuration.results[server].services[service].status]);
					i++;
				}
			};
		};
		$('#serverGrid').setGridParam({ sortname: 'num' }).trigger('reloadGrid')
		//$('#serverGrid').sortGrid('hosts');
		//$('#serverGrid').trigger("reloadGrid");	
	}
	
	function getIcons(alert) {
		icons = '';
		if(alert.type == 'host') icons+= '<img src="/icons/computer.png">';
		if(alert.type == 'service') icons+= '<img src="/icons/brick.png">';
		if(alert.type == 'info') icons+= '<img src="/icons/accept.png">';
		/(\d+)d +(\d+)h +(\d+)m +(\d+)s/.exec(alert.duration);
		if((parseInt(RegExp.$1) * 86400 + parseInt(RegExp.$2) * 3600 + parseInt(RegExp.$3) * 60 + parseInt(RegExp.$4)) < configuration.options.commun.newStateDuration) icons+= '<img src=/icons/new.png title="New problem">&nbsp;';
		if(alert.downtime) icons+= '<img src="/icons/hourglass.png" title="Downtimed">';
		if(alert.acknowledged) icons+= '<img src="/icons/font.png" title="Acknowledged">';
		if(!alert.notification) icons+= '<img src="/icons/sound_mute.png" title="Notifications disabled">';
		return icons;
	};
	
	function getActions(alert) {
		if(alert.type == 'info') return '';
		icons = '';
		if(!alert.downtime) icons+= '<a href="#" onClick="downtimeAlert(\'' + alert.serverName + '\', ' + alert.id + ');"><img src="/icons/hourglass.png" title="Downtime ' + alert.type + '"></a>';
		if(alert.downtime) icons+= '<a href="#" onClick="unDowntimeAlert(\'' + alert.serverName + '\', ' + alert.id + ');"><img src="/icons/hourglass_delete.png" title="Remove downtime from ' + alert.type + '"></a>';
		//if(alert.downtime) icons+= '<img src="/icons/hourglass_delete.png" title="Remove downtime from ' + alert.type + '">';
		if(!alert.acknowledged) icons+= '<a href="#" onClick="ackAlert(\'' + alert.serverName + '\', ' + alert.id + ');"><img src="/icons/font.png" title="Acknowledge ' + alert.type + '"></a>';
		if(alert.acknowledged) icons+= '<a href="#" onClick="unAckAlert(\'' + alert.serverName + '\', ' + alert.id + ');"><img src="/icons/font_delete.png" title="Remove acknowledgement from ' + alert.type + '"></a>';
		if(!alert.notification) icons+= '<a href="#" onClick="notificationAlert(\'' + alert.serverName + '\', ' + alert.id + ', true);"><img src="/icons/sound_none.png" title="Enable notification for ' + alert.type + '"></a>';
		if(alert.notification) icons+= '<a href="#" onClick="notificationAlert(\'' + alert.serverName + '\', ' + alert.id + ', false);"><img src="/icons/sound_mute.png" title="Disable notification for ' + alert.type + '"></a>';
		icons+= '<a href="#" onClick="refreshAlert(\'' + alert.serverName + '\', ' + alert.id + ');"><img src="/icons/arrow_refresh.png" title="Recheck alert"></a>';
		icons+= '<a href="' + configuration.getAlertUrl(alert) + '" target="_blank"><img src="/icons/bullet_go.png" title="Go to ' + alert.type + ' details"></a>';
		return icons;
	}
	
	// Toolbar

	// Start the checker
	$("#start").button({ text: false, disabled: true, icons: { primary: "icon-start" } });
	$("#start").click(function() { checker.start(); $("#start").button("disable"); $("#stop").button("enable"); });

	// Stop the checker
	$("#stop").button({ text: false, icons: { primary: "icon-stop" } });
	$("#stop").click(function() { checker.stop(); $("#start").button("enable"); $("#stop").button("disable"); });
	
	// Force check of all servers
	$("#recheck").button({ text: false, icons: { primary: "icon-recheck" } });
	$("#recheck").click(function() { checker.restart(); });

	// Go to options page
	$("#options").button({ text: false, icons: { primary: "icon-options" } });
	$("#options").click(function() { window.open('/html/options.html'); });
	
	// Search input
	$("#search").keyup(function(event) {
		if (event.keyCode == '13') event.preventDefault();
		fillGrid($('#search').val());
	});
	
	// Activate start or stop button regarding the checker status
	if(checker.started == true) { $("#start").button("disable"); $("#stop").button("enable"); }
	else { $("#stop").button("disable"); $("#start").button("enable"); }
	
	// Refresh popup every second
	function generateGrid() {
		$("#serverGrid").jqGrid({
			datatype: "local",
			height: 250,
			rowNum: 2048,
		   	colNames:['Num', 'Type','Host', 'Service', 'Actions', 'Duration', 'Info', 'Last check', 'Server name'],
		   	colModel:[
		   		{name: 'num', index: 'num', hidden: true, sorttype: 'int'},
		   		{name: 'type', index: 'type', width: 94, sortable: false},
		   		{name: 'host', index: 'host', width: 112, sortable: false},
		   		{name: 'service', index: 'service', width: 132, sortable: false},
		   		{name: 'actions', index: 'actions', width: 94, sortable: false},
		   		{name: 'duration', index: 'duration', hidden: true},
		   		{name: 'info', index: 'info', hidden: true},
		   		{name: 'lastCheck', index: 'lastCheck', hidden: true},
		   		{name: 'serverName', index: 'serverName', hidden: true}
		   	],
		   	multiselect: false,
		   	caption: false,
		   	onSelectRow: function(ids) {
		   		text = '';
		   		//text+= '<b><u>Host:</u></b> ' + $("#serverGrid").jqGrid('getCell', ids, 1);
		   		//if($("#serverGrid").jqGrid('getCell', ids, 2) != '') text+= '&nbsp;<b><u>Service:</u></b> ' + $("#serverGrid").jqGrid('getCell', ids, 2);
				text+= '<b><u>Duration:</u></b> ' + $("#serverGrid").jqGrid('getCell', ids, 5) + '&nbsp;';
		   		text+= '<br />';
				text+= '<b><u>Last check:</u></b> ' + $("#serverGrid").jqGrid('getCell', ids, 7);
		   		text+= '<br />';
				text+= '<b><u>Information:</u></b> ' + $("#serverGrid").jqGrid('getCell', ids, 6);
		   		$('#serverDetails').html(text);
		   	},
		   	sortname: 'num',
		   	grouping: true,
   			groupingView: {
   				groupField: ['serverName'],
		   		groupColumnShow: [false],
		        groupDataSorted: true,
		   		groupText: ['<b>{0} - {1} Item(s)</b><div class="css_right"><a href="#" onClick="refreshAllAlerts(\'{0}\');"><img src="/icons/arrow_refresh.png" title="Recheck all alerts"></a>&nbsp;<a href="#" onClick="openNagios(\'{0}\');"><img src="/icons/house.png" title="Open Nagios"></a>&nbsp;<a href="#" onClick="openTac(\'{0}\');"><img src="/icons/table_gear.png" title="Open tactical overview"></a></div>']
   			}
		});

		fillGrid();	
		

		//return true;
	};
	generateGrid();
});
