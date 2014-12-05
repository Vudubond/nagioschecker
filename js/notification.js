$(document).ready(function() {    
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var checker= chrome.extension.getBackgroundPage().checker;

	var couleurs = ['grey', 'yellow', 'red', 'red']

	var alerts = '';
	var text = '';
	var nb = 0;
	for(a in checker.notificationAlerts) {
		alerts += '<tr class="alert-';
		if(checker.notificationAlerts[a].status == 'CRITICAL') alerts += 'red';
		if(checker.notificationAlerts[a].status == 'DOWN') alerts += 'red';
		if(checker.notificationAlerts[a].status == 'UNREACHABLE') alerts += 'orange';
		if(checker.notificationAlerts[a].status == 'UNKNOWN') alerts += 'orange';
		if(checker.notificationAlerts[a].status == 'WARNING') alerts += 'yellow';
		alerts += '">';
		alerts += '<td style="width: 18px; align: center;">';
		if(checker.notificationAlerts[a].type == 'host') alerts += '<img style="padding-top: 2px;" src="/icons/computer.png">';
		if(checker.notificationAlerts[a].type == 'service') alerts += '<img style="padding-top: 2px;" src="/icons/brick.png">';
		alerts += '</td>';
		alerts += '<td><div style="font-size: 11px; font-family: Lucida Grande, Lucida Sans, Arial, sans-serif;">';
		alerts += checker.notificationAlerts[a].host + '</div></td>'
		alerts += '<td><div style="font-size: 11px; font-family: Lucida Grande, Lucida Sans, Arial, sans-serif;">';
		alerts += checker.notificationAlerts[a].service == '' ? '&nbsp;' : checker.notificationAlerts[a].service;
		alerts += '</div></td>';
		alerts += '</tr>';
		nb++;
	}
	var text = '<table cellpadding="0" cellspacing="1" width="100%">';
	text += '<tr class="alert-' + couleurs[checker.notificationLevel] + '"><td colspan="3">';
	text += '<div style="font-size: 11px; font-family: Lucida Grande, Lucida Sans, Arial, sans-serif;">';
	text += '<img style="vertical-align: text-bottom;" src="/icons/icon_' + couleurs[checker.notificationLevel] + '.png"> &nbsp;' + nb + ' new alert(s)';
	text += '</div></td></tr>';
	text += alerts;
	text += '</table>';

	$('#text').append(text);
});

