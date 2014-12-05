$(document).ready(function() {
	
	// Refresh servers list
	function refreshServersList(nameSelected) {
		$('#serverList').empty();
		for(var name in configuration.servers) {
			$('#serverList').append('<input type="radio" name="serverList" id="server' + name + '" value="' + name +'" />');
			$('#server' + name).after('<label for="server' + name +'">' + name +'</label>');
			$('#server' + name).click(function() { displayServerDetails(this.value); });
			if(typeof(nameSelected) == 'undefined' || name == nameSelected) { nameSelected = name; }
		}
		if(typeof(nameSelected) != 'undefined') {
			$('#server' + nameSelected).attr('checked', 'checked');
			displayServerDetails(nameSelected);
		}
		configuration.save(); checker.restart();
		$('#serverList').buttonset("refresh");
	}
	
	// Display server's details
	function displayServerDetails(nameSelected) {
		$('#serverDetails').empty();
		
		$('#serverDetails').attr('nameSelected', nameSelected);
		
		var details = '<table width="100%">';
		details+= '<tr><td>URL : </td><td>';
		details+= '<select name="protocol" id="serverDetailsProtocol" class="ui-widget-content ui-corner-all"><option value="http">http</option><option value="https">https</option></select>';
		details+= '://';
		details+= '<input type="text" name="username" id="serverDetailsUsername" size="12" class="text ui-widget-content ui-corner-all" />';
		details+= ':';
		details+= '<input type="password" name="password" id="serverDetailsPassword" size="12" class="text ui-widget-content ui-corner-all" />';
		details+= '@';
		details+= '<input type="text" name="url" id="serverDetailsUrl" size="40" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>nagios path :</td><td>';
		details+= '<input type="text" name="root" id="serverDetailsRoot" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>Service detail path :</td><td>';
		details+= '<input type="text" name="servicesPath" id="serverDetailsServicesPath" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>Host detail path :</td><td>';
		details+= '<input type="text" name="hostsPath" id="serverDetailsHostsPath" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>extinfo.cgi path :</td><td>';
		details+= '<input type="text" name="extinfoPath" id="serverDetailsExtinfoPath" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>status.cgi path :</td><td>';
		details+= '<input type="text" name="statusPath" id="serverDetailsStatusPath" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>tac.cgi path :</td><td>';
		details+= '<input type="text" name="tacPath" id="serverDetailsTacPath" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>cmd.cgi path :</td><td>';
		details+= '<input type="text" name="cmdPath" id="serverDetailsCmdPath" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		details+= '<tr><td>Enabled ?</td><td>';
		details+= '<div id="serverDetailsEnabled">';
		details+= '<input type="radio" name="enabled" id="serverDetailsEnabledYes" value="true" /><label for="serverDetailsEnabledYes">Yes</label>';
		details+= '<input type="radio" name="enabled" id="serverDetailsEnabledNo" value="false" /><label for="serverDetailsEnabledNo">No</label>';
		details+= '</div>';
		details+= '</td></tr>';
		details+= '</table>';
		
		$('#serverDetails').append(details);

		// Load configuration
		$('#serverDetailsProtocol').val(configuration.servers[nameSelected].protocol);
		$('#serverDetailsUsername').val(configuration.servers[nameSelected].username);
		$('#serverDetailsPassword').val(configuration.servers[nameSelected].password);
		$('#serverDetailsUrl').val(configuration.servers[nameSelected].url);
		$('#serverDetailsRoot').val(configuration.servers[nameSelected].root);
		$('#serverDetailsServicesPath').val(configuration.servers[nameSelected].servicesPath);
		$('#serverDetailsHostsPath').val(configuration.servers[nameSelected].hostsPath);
		$('#serverDetailsExtinfoPath').val(configuration.servers[nameSelected].extinfoPath);
		$('#serverDetailsStatusPath').val(configuration.servers[nameSelected].statusPath);
		$('#serverDetailsTacPath').val(configuration.servers[nameSelected].tacPath);
		$('#serverDetailsCmdPath').val(configuration.servers[nameSelected].cmdPath);
		if(configuration.servers[nameSelected].enabled == true) { $('#serverDetailsEnabledYes').attr('checked', 'checked'); } else { $('#serverDetailsEnabledNo').attr('checked', 'checked'); };
		$('#serverDetailsEnabled').buttonset();
		
		// Configuration change handling
		$('#serverDetailsProtocol').change(function() { configuration.servers[nameSelected].protocol = $('#serverDetailsProtocol').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsUsername').keyup(function() { configuration.servers[nameSelected].username = $('#serverDetailsUsername').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsPassword').keyup(function() { configuration.servers[nameSelected].password = $('#serverDetailsPassword').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsUrl').keyup(function() { configuration.servers[nameSelected].url = $('#serverDetailsUrl').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsRoot').keyup(function() { configuration.servers[nameSelected].root = $('#serverDetailsRoot').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsServicesPath').keyup(function() { configuration.servers[nameSelected].servicesPath = $('#serverDetailsServicesPath').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsHostsPath').keyup(function() { configuration.servers[nameSelected].hostsPath = $('#serverDetailsHostsPath').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsExtinfoPath').keyup(function() { configuration.servers[nameSelected].extinfoPath = $('#serverDetailsExtinfoPath').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsStatusPath').keyup(function() { configuration.servers[nameSelected].statusPath = $('#serverDetailsStatusPath').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsTacPath').keyup(function() { configuration.servers[nameSelected].tacPath = $('#serverDetailsTacPath').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsCmdPath').keyup(function() { configuration.servers[nameSelected].cmdPath = $('#serverDetailsCmdPath').val(); configuration.save(); checker.restart(); });
		$('#serverDetailsEnabledYes').click(function() { configuration.servers[nameSelected].enabled = true; configuration.save(); checker.restart(); });
		$('#serverDetailsEnabledNo').click(function() { configuration.servers[nameSelected].enabled = false; configuration.save(); checker.restart(); delete configuration.results[nameSelected]; });
	};
	
	// Load current configuration
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var checker = chrome.extension.getBackgroundPage().checker;

	// Apply current configuration
	$('#checkFrequency' + configuration.options.commun.checkFrequency).click();
	$('#iconFrequency' + configuration.options.commun.iconFrequency).click();
	$('#newStateDuration' + configuration.options.commun.newStateDuration).click();
	if(configuration.options.commun.displayProblemsDowntimed) $('#displayProblemsDowntimed').click();
	if(configuration.options.commun.displayProblemsAcknowledged) $('#displayProblemsAcknowledged').click();
	if(configuration.options.commun.displayProblemsNotification) $('#displayProblemsNotification').click();
	if(configuration.options.commun.displayProblemsOthers) $('#displayProblemsOthers').click();
	$('#gridMode' + configuration.options.commun.gridMode).click();
	if(configuration.options.commun.sound) { $('#soundOn').click(); } else { $('#soundOff').click(); };
	if(configuration.options.commun.popup) { $('#popupOn').click(); } else { $('#popupOff').click(); };
	$('#popupDurationVal').html(configuration.options.commun.popupDuration == 301 ? '&#8734;' : configuration.options.commun.popupDuration + 's');
	
	// Mouse events
	$('#checkFrequency30').click(function() { configuration.options.commun.checkFrequency = 30; configuration.save(); checker.restart(); });
	$('#checkFrequency60').click(function() { configuration.options.commun.checkFrequency = 60; configuration.save(); checker.restart(); });
	$('#checkFrequency120').click(function() { configuration.options.commun.checkFrequency = 120; configuration.save(); checker.restart(); });
	$('#checkFrequency300').click(function() { configuration.options.commun.checkFrequency = 300; configuration.save(); checker.restart(); });
	$('#checkFrequency600').click(function() { configuration.options.commun.checkFrequency = 600; configuration.save(); checker.restart(); });
	$('#iconFrequency1').click(function() { configuration.options.commun.iconFrequency = 1; configuration.save(); checker.restart(); });
	$('#iconFrequency2').click(function() { configuration.options.commun.iconFrequency = 2; configuration.save(); checker.restart(); });
	$('#iconFrequency5').click(function() { configuration.options.commun.iconFrequency = 5; configuration.save(); checker.restart(); });
	$('#iconFrequency10').click(function() { configuration.options.commun.iconFrequency = 10; configuration.save(); checker.restart(); });
	$('#iconFrequency30').click(function() { configuration.options.commun.iconFrequency = 30; configuration.save(); checker.restart(); });
	$('#newStateDuration60').click(function() { configuration.options.commun.newStateDuration = 60; configuration.save(); checker.restart(); });
	$('#newStateDuration120').click(function() { configuration.options.commun.newStateDuration = 120; configuration.save(); checker.restart(); });
	$('#newStateDuration300').click(function() { configuration.options.commun.newStateDuration = 300; configuration.save(); checker.restart(); });
	$('#newStateDuration600').click(function() { configuration.options.commun.newStateDuration = 600; configuration.save(); checker.restart(); });
	$('#newStateDuration1800').click(function() { configuration.options.commun.newStateDuration = 1800; configuration.save(); checker.restart(); });
	$('#displayProblemsDowntimed').click(function() { configuration.options.commun.displayProblemsDowntimed = $('#displayProblemsDowntimed').attr('checked'); configuration.save(); checker.restart(); });
	$('#displayProblemsAcknowledged').click(function() { configuration.options.commun.displayProblemsAcknowledged = $('#displayProblemsAcknowledged').attr('checked'); configuration.save(); checker.restart(); });
	$('#displayProblemsNotification').click(function() { configuration.options.commun.displayProblemsNotification = $('#displayProblemsNotification').attr('checked'); configuration.save(); checker.restart(); });
	$('#displayProblemsOthers').click(function() { configuration.options.commun.displayProblemsOthers = $('#displayProblemsOthers').attr('checked'); configuration.save(); checker.restart(); });
	$('#gridModeIcons').click(function() { configuration.options.commun.gridMode = 'Icons'; configuration.save(); checker.restart(); });
	$('#gridModeHighlighted').click(function() { configuration.options.commun.gridMode = 'Highlighted'; configuration.save(); checker.restart(); });
	$('#soundOn').click(function() { configuration.options.commun.sound = true; configuration.save(); checker.restart(); });
	$('#soundOff').click(function() { configuration.options.commun.sound = false; configuration.save(); checker.restart(); });
	$('#popupOn').click(function() { configuration.options.commun.popup = true; configuration.save(); checker.restart(); });
	$('#popupOff').click(function() { configuration.options.commun.popup = false; configuration.save(); checker.restart(); });

	// Tab creation
	$('#tabs').tabs();

	// Tab 1 - Options
	$('#checkFrequency').buttonset();
	$('#iconFrequency').buttonset();
	$('#newStateDuration').buttonset();
	$('#problemsDisplayed').buttonset();
	$('#gridMode').buttonset();

	// Tab 2 - Notifications
	$('#sound').buttonset();
	$('#popup').buttonset();
	$('#popupDuration').slider({
		range: 'min',
		value: 15,
		min: 5,
		max: 301,
		value: configuration.options.commun.popupDuration,
		slide: function( event, ui ) {
			$('#popupDurationVal').html(ui.value == 301 ? '&#8734;' : ui.value + 's');
			configuration.options.commun.popupDuration = ui.value;
			configuration.save();
		}
	});
	
	// Tab 3 - Servers
	
	// Display servers list
	refreshServersList();
	
	// Delete server dialog
	$( "#delserver-confirm" ).dialog({
		autoOpen: false,
		resizable: false,
		height:140,
		modal: true,
		buttons: {
			"Delete": function() {
				delete configuration.servers[$('#serverDetails').attr('nameSelected')];
				refreshServersList();
				$(this).dialog("close");
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		}
	});
	
	function updateTips( t ) {
		tips
			.text( t )
			.addClass( "ui-state-highlight" );
		setTimeout(function() {
			tips.removeClass( "ui-state-highlight", 1500 );
		}, 500 );
	}
	
	// Form validation
	function checkRegexp( o, regexp, n ) {
		if(!( regexp.test( o.val() ) ) ) {
			o.addClass( "ui-state-error" );
			updateTips( n );
			return false;
		} else {
			return true;
		}
	}
	
	// Add server dialog
	$('#addServerName').keypress(function(event) {
		if (event.which == '13') {
			$('#addserver-form').dialog('option', 'buttons')['Add new server']();
			$('#addserver-form').dialog('close');
			event.preventDefault();
  		}
	});
	var addServerName = $('#addServerName'), allFields = $( [] ).add( addServerName ), tips = $('.validateTips');
	$('#addserver-form').dialog({
		autoOpen: false,
		height: 200,
		width: 250,
		modal: true,
		buttons: {
			"Add new server": function() {
				var bValid = true;
				allFields.removeClass( "ui-state-error" );

				bValid = bValid && checkRegexp( addServerName, /^[a-z]([0-9a-z_])+$/i, "Server name may consist of a-z, 0-9, underscores, begin with a letter." );

				if(bValid) {
					configuration.addServer(addServerName.val());
					refreshServersList(addServerName.val());
					$(this).dialog("close");
				}
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		close: function() {
			allFields.val("").removeClass( "ui-state-error" );
		}
	});
	
	$('#serverAdd').button({ icons: { primary: "ui-icon-plusthick" }, text: false });
	$('#serverDel').button({ icons: { primary: "ui-icon-minusthick" }, text: false });
	$('#serverList').buttonset();
	
	$('#serverAdd').click(function() { $('#addserver-form').dialog('open'); });
	$('#serverDel').click(function() {
		$('#delserver-confirm').dialog('option', 'server', 'toto');
		$('#delserver-confirm').dialog('option', 'title', 'Delete server ' + $('#serverDetails').attr('nameSelected'));
		$('#delserver-confirm').dialog('open');
	});
});
