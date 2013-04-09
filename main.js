Lungo.init({
	name: 'd2db',
	resources: ['template/main.html']
});

var refreshRecent = function() {
	Lungo.Service.json(url + 'recent/api?callback=?', {}, function(result) {
		Lungo.Data.Storage.persistent('recent', result);
		Lungo.Data.Storage.persistent('recentUpdate', new Date());
		parseRecent(result);
		redrawUpdate();
	}, 'json');
}

var refreshInsert = function() {
	Lungo.Service.json(url + 'insert/api?callback=?', {}, function(result) {
		Lungo.Data.Storage.persistent('insert', result);
		Lungo.Data.Storage.persistent('insertUpdate', new Date());
		parseInsert(result);
		redrawUpdate();
	}, 'json');
}

var parseRecent = function(result) {
	if(result == null) {
		// there's nothing to display :(
		$('#recent ul')
			.append($('<li/>')
				.append($('<strong/>', { text: 'Keine Daten gefunden :(' }))
				.append($('<small/>', { text: 'Dein Cache scheint geleert worden zu sein.' })));
	} else {
		// print recent entries
		$('#recent ul').empty();
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

var parseInsert = function(result) {
	$('#series').empty();
	$('#episodes').empty();
	$('#characters').empty();

	if(result != undefined) {
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

var toggleInsertEpisodes = function() {
	index = Lungo.dom('#series')[0].value;
	Lungo.dom('#episodes .series-' + index).show();
	Lungo.dom('#episodes :not(.series-' + index + ')').hide();
}

var parseInserted = function(result) {
	if(result.insert) {
		$('#insert input[type=text]').val('');
		$('#insert textarea').val('');
		Lungo.Notification.success('Eingetragen', null, 'check');
	} else {
		Lungo.Notification.error('Fehler', null, 'cancel');
	}
}

var redrawUpdate = function() {
	$('#recentUpdate').text(prettyDate(Lungo.Data.Storage.persistent('recentUpdate')));
	$('#insertUpdate').text(prettyDate(Lungo.Data.Storage.persistent('insertUpdate')));
}

var clearCache = function() {
	Lungo.Data.Storage.persistent('recent', null);
	Lungo.Data.Storage.persistent('insert', null);

	Lungo.Data.Storage.persistent('recentUpdate', false);
	Lungo.Data.Storage.persistent('insertUpdate', false);

	parseRecent(Lungo.Data.Storage.persistent('recent'));
	parseInsert(Lungo.Data.Storage.persistent('insert'));
}

var url = 'http://d2db.w8l.org/';
Lungo.Service.Settings.timeout = 500;

Lungo.Service.Settings.error = function(type, xhr) {
	Lungo.Notification.error('Fehler', 'Konnte keine Daten aus der #D2DB laden :(', 'cancel');
	parseRecent(Lungo.Data.Storage.persistent('recent'));
	parseInsert(Lungo.Data.Storage.persistent('insert'));
};

Lungo.dom('#clearCache').on('singleTap', clearCache);
Lungo.dom('#refreshRecent').on('singleTap', refreshRecent);
Lungo.dom('#refreshInsert').on('singleTap', refreshInsert);
Lungo.dom('#refreshAll').on('singleTap', function() { refreshRecent(); refreshInsert(); });
Lungo.dom('#toggleAside').on('singleTap', function() { Lungo.Router.aside('main', 'links'); });
//Lungo.dom('a').on('singleTap', function() { alert(this.attr('href')); return false; });

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

// if there's no local data, update
if(Lungo.Data.Storage.persistent('recent') == null) { refreshRecent(); } else { parseRecent(Lungo.Data.Storage.persistent('recent')); }
if(Lungo.Data.Storage.persistent('insert') == null) { refreshInsert(); } else { parseInsert(Lungo.Data.Storage.persistent('insert')); }

// update the settings screen every ten seconds
setInterval(redrawUpdate, 6000);
