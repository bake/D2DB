Lungo.init({
	name: 'd2db',
	resources: ['template/main.html']
});

document.addEventListener('deviceready', onDeviceReady, false);

// get new entries
function refreshRecent() {
	Lungo.Service.json(url + 'recent/api?callback=?', {}, function(result) {
		Lungo.Data.Storage.persistent('recent', result);
		Lungo.Data.Storage.persistent('recentUpdate', new Date());
		parseRecent(result);
		redrawUpdate();
	}, 'json');
}

// get new episodes
function refreshInsert() {
	Lungo.Service.json(url + 'insert/api?callback=?', {}, function(result) {
		Lungo.Data.Storage.persistent('insert', result);
		Lungo.Data.Storage.persistent('insertUpdate', new Date());
		parseInsert(result);
		redrawUpdate();
	}, 'json');
}

// parse recent list
var parseRecent = function(result) {
	$('#recent ul').empty();

	if(result == null) {
		// there's nothing to display :(
		$('#recent ul')
			.append($('<li/>')
				.append($('<strong/>', { text: 'Keine Daten gefunden :(' }))
				.append($('<small/>', { text: 'Dein Cache scheint geleert worden zu sein.' })));
	} else {
		// print recent entries
		$.each(result, function(index, item) {
			$('#recent ul')
				.append($('<li/>', { class: 'arrow', id: index })
					.append($('<strong/>', { html: item.description }))
					.append($('<small/>', { text: item.series_title + ' - ' + item.episode_num + ': ' + item.episode_title })));
		});

		Lungo.dom('#recent ul li').on('singleTap', function(event) {
			try {
				var item = result[Lungo.dom(this)[0].id];

				$('#episode ul')
					.empty()
					.append($('<li/>')
						.append($('<strong/>', { html: item.description }))
						.append($('<small/>', { text: item.series_title + ' - ' + item.episode_num + ': ' + item.episode_title })))
					.append($('<li/>')
						.append($('<strong/>', { text: (item.author_name == null) ? 'Unbekannt' : item.author_name }))
						.append($('<small/>', { text: 'Gemeldet von' })))
					.append($('<li/>')
						.append($('<strong/>', { text: item.time }))
						.append($('<small/>', { text: 'Gemeldet am' })))
					.append($('<li/>')
						.append($('<strong/>', { text: item.episode_year }))
						.append($('<small/>', { text: 'Release' })))
					.append($('<li/>')
						.append($('<strong/>', { text: item.episode_authors }))
						.append($('<small/>', { text: (item.episode_authors.split(',').length == 1) ? 'Autor' : 'Autoren' })))
					.append($('<li/>')
						.append($('<strong/>', { text: item.series_description }))
						.append($('<small/>', { text: 'Beschreibung' })));

				Lungo.Router.article('main', 'episode');
			} catch(e) {}
		});
	}
}

// parse insert form
var parseInsert = function(result) {
	$('#series').empty();
	$('#episodes').empty();
	$('#characters').empty();

	if(result != null) {
		$.each(result, function(row, index) {
			$.each(index, function(col, item) {
				if(row == 'series') {
					data = { text: item.title, value: item.id };
				} else if(row == 'episodes') {
					data = { text: item.num + ': ' + item.title, value: item.num, class: 'series-' + item.series };
				} else if(row == 'characters') {
					data = { text: item.name, value: item.id };
				} else { data = null; }

				$('#' + row).append($('<option/>', data));
			});
		});
	}

	Lungo.dom('#series').on('change', function(event) {
		toggleInsertEpisodes();
	});
}

// show/hide episodes of not-choosen series
// doesn't work atm
function toggleInsertEpisodes() {
	index = Lungo.dom('#series')[0].value;
	Lungo.dom('#episodes .series-' + index).show();
	Lungo.dom('#episodes :not(.series-' + index + ')').hide();
}

// parse result of post entry
var parseInserted = function(result) {
	if(result.insert) {
		$('#insert input[type=text]').val('');
		$('#insert textarea').val('');
		Lungo.Notification.success('Eingetragen', null, 'check');
	} else {
		Lungo.Notification.error('Fehler', null, 'cancel');
	}
}

// redraw time-since-update
function redrawUpdate() {
	$('#recentUpdate').text(prettyDate(Lungo.Data.Storage.persistent('recentUpdate')));
	$('#insertUpdate').text(prettyDate(Lungo.Data.Storage.persistent('insertUpdate')));
}

// clear local storage and redraw
function clearCache() {
	navigator.notification.vibrate(50);
	Lungo.Data.Storage.persistent('recent', null);
	Lungo.Data.Storage.persistent('insert', null);
	Lungo.Data.Storage.persistent('recentUpdate', null);
	Lungo.Data.Storage.persistent('insertUpdate', null);

	parseRecent(null);
	parseInsert(null);
}

// bob is always on!
function youAreOnline(showPopup) {
	var showPopup = showPopup || false;
	var online = (
		navigator.network.connection.type == 'none' ||
		navigator.network.connection.type == 'unknown'
	) ? false : true;

	if(!online && showPopup) {
		Lungo.Notification.error('Du bist offline!', 'Tut mir leid, aber ohne Internetverbindung geht das nicht.', 'cancel');
	}

	return online;
}

var url = 'http://d2db.w8l.org/';

// update the settings screen every ten seconds
setInterval(redrawUpdate, 6000);

// idk
Lungo.Service.Settings.error = function(type, xhr) {
	Lungo.Notification.error('Fehler', 'Konnte keine Daten aus der #D2DB laden :(', 'cancel');
	parseRecent(Lungo.Data.Storage.persistent('recent'));
	parseInsert(Lungo.Data.Storage.persistent('insert'));
};

// handy some taps
Lungo.dom('#clearCache').on('singleTap', function() {
	if(youAreOnline()) {
		clearCache();
	} else {
		Lungo.Notification.confirm({
			icon: 'warning',
			title: 'Du bist offline!',
			description: 'Du bist aktuell offline! Wenn du alle Daten löscht, kannst du sie erst wieder laden, wenn sich dein Handy im Internet befindet.',
			accept: { icon: 'checkmark', label: 'Trotzdem löschen', callback: clearCache },
			cancel: { icon: 'close', label: 'Dann lieber nicht' }
		});
	}
});

Lungo.dom('#refreshRecent').on('singleTap', function() { if(youAreOnline(true)) { refreshRecent(); } });
Lungo.dom('#refreshInsert').on('singleTap', function() { if(youAreOnline(true)) { refreshInsert(); } });
Lungo.dom('#refreshAll').on('singleTap', function() { if(youAreOnline(true)) { refreshRecent(); refreshInsert(); } });
Lungo.dom('#toggleAside').on('singleTap', function() { Lungo.Router.aside('main', 'links'); });

// try to save your entry
Lungo.dom('#insertSubmit').on('singleTap', function() {
	data = {
		method:      'post',

		series:      Lungo.dom('#series')[0].value,
		episode:     Lungo.dom('#episodes')[0].value,
		character:   Lungo.dom('#characters')[0].value,
		description: Lungo.dom('#description')[0].value,

		name:        Lungo.dom('#name')[0].value,
		email:       Lungo.dom('#email')[0].value,
		comment:     Lungo.dom('#comment')[0].value
	};

	Lungo.Service.get(url + 'insert/api?' + Quo.serializeParameters(data) + '&callback=?', {}, parseInserted, 'text');
});

// open external links in default browser
Lungo.dom('a').on('singleTap', function() {
	if(this.href.substr(0, 7) != 'file://') {
		navigator.app.loadUrl(this.href, { openExternal:true });
		return false;
	}
});

// init
function onDeviceReady() {
	// if youAreOnline, update
	if(youAreOnline()) {
		refreshRecent();
		refreshInsert();
	} else {
		parseRecent(Lungo.Data.Storage.persistent('recent'));
		parseRecent(Lungo.Data.Storage.persistent('insert'));
	}
}
