var page = {
	ctrl: 0,
	focus: 1,
	sidebarForceExpanded: 0,
	clearIntervals: function()
	{
		var l = this.intervals.length;
		while (l-- > 0)
		{
			clearInterval(this.intervals.shift());
		}
		return this;
	},
	init: function()
	{
		if (window.location.pathname.replace(/^\/+/, '').substr(0, 5) === 'login')
		{
			$('a:link').off('click.default').on('click.default', function(event)
			{
				if (page.ctrl || !$(this).attr('href') || $(this).attr('href').substr(0, 5) !== 'login' || $(this).attr('target')) return;
				event.preventDefault();
				page.url($(this).attr('href').substr(5)).reload();
			});
		}
		$('.button').addRipple().filter('.flat').each(function()
		{
			$(this).addRipple($(this).css('color').replace('b', 'ba').replace(')', ',.2)'));
		});
		$('.checkbox, .radio').off('mousedown.ripple').on('mousedown.ripple', function()
		{
			$('<span>', {class: 'ripple'}).css({top: 20, left: 12}).appendTo(this).animate({width: 18 * 2, height: 18 * 2, top: 20 - 18, left: 12 - 18}, 180);
		});
		$('.radio > input').off('change.default').on('change.default', function()
		{
			($(this).parent().siblings().children('input').length ? $(this).parent().siblings().children('input') : $(this).parent().parent().parent().siblings().children().children().children('input')).prop('checked', !1);
		});
		$('#fab').addRipple();
		$('textarea').autoresize(1).trigger('blur.autoresize');

		$('#sidebar a.current').removeClass('current');
		$(`#sidebar a[href='login/${page.url()}/']`).addClass('current');

		if (localStorage.viewChat && !$('.chat_send').hasClass('emulation'))
		{
			if (typeof chatStandeeTimeout !== 'undefined') clearTimeout(chatStandeeTimeout);
			chatStandeeTimeout = setTimeout(function()
			{
				if (!$('.standee').length && parseInt($('.chat').css('bottom'), 10) && page.url().split('/')[0] != 'training') $('.chat').standee('Fragen? Probleme? Anregungen? Schreib uns gerne deine Verbesserungsvorschläge');
			}, 12000);
		}
		$('[standee]').off('mouseover').on('mouseover', function()
		{
			$(this).standee($(this).attr('standee'));
		}).off('mouseout').on('mouseout', function()
		{
			setTimeout(function()
			{
				if (+(new Date) - $('.standee').attr('time') > 750) $(this).standee();
			}, 750);
		});

		$('.button[delete]').off('click.default').on('click.default', function()
		{
			ajax({data: 'delete', type: page.url(), id: $(this).attr('delete')}).done(function(row) {
				return function(data) {
					if (data && row.length) row.animate({}, 180, function()
					{
						$(this).after($('<tr></tr>').css({display: 'none'}));
						var height = $(this).children('td').outerHeight();
						$(this).children('td').empty().css({height: height}).animate({height: 0, padding: 0}, 180, function()
						{
							$(this).parent('tr').next().remove();
							$(this).parent('tr').remove();
						});
					}).children('td').animate({opacity: 0}, 180);
				};
			} ($(this).parents('tr').first()));
		});

		$('.chat_head').addRipple(255).on('click', function()
		{
			if ($(this).parent('.unread').removeClass('unread').length) ajax({data: 'mark_as_read'});
			if (parseInt($('.chat').css('bottom'), 10)) $('.chat').animate({bottom: 0}).find('.chat_toggle').text('expand_more');
			else $('.chat').animate({bottom: $('.chat_head').outerHeight() - $('.chat').outerHeight()}).find('.chat_toggle').text('expand_less');
			$('.chat .scroll').scrollTop($('.chat .scroll')[0].scrollHeight);
		});

		$('.chat_input').autoresize(1 /* 0 // CHAT_RELICT */).off('keydown.custom').on('keydown.custom', function(event) {
			return; // CHAT_RELICT
			if (!event.shiftKey && event.which == 13) {
				event.preventDefault();
				$('.chat_send').trigger('click');
			}
		}).on('focus.custom blur.custom keydown.custom keyup.custom change.custom paste.custom').on('focus.custom blur.custom keydown.custom keyup.custom change.custom paste.custom', function()
		{
			var outerHeight = $(this).outerHeight(),
				maxHeight = 453, // CHAT_RELICT 270
				result = Math.max(outerHeight, maxHeight);
			// CHAT_RELICT $(this).parent().css({height: result}).prev().css({bottom: result});
		});

		$('.chat_send').addRipple().on('click', function()
		{
			if ($(this).hasClass('emulation')) return page.reload();
			var message = $('.chat_input').val();
			if (message == '') return;
			var recipient = $(this).attr('recipient');
			ajax({data: 'help_message', message: message}).done(ajaxDone);
			$('.chat_input').val('').trigger('focus.autoresize');
			//worker.request();
		});

		$(window).off('resize.statistics').on('resize.statistics', function()
		{
			if (typeof users !== 'undefined') $('.statistics').each(function()
			{
				var view = users[$(this).attr('user')];
				if (!view || !view.speedreading_timeline || !view.memory) return;
				chart.draw($(this).find('[chart=speed-meeting]')[0], [{
					type: 'line',
					data: view.speedreading_timeline.own.in,
					unit: 'WPM',
				}, {
					type: 'line',
					data: view.speedreading_timeline.avg.in,
					color: page.css['color.tertiary'],
					unit: 'WPM',
					dashed: 1,
				}]);
				chart.draw($(this).find('[chart=speed-training]')[0], [{
					type: 'line',
					data: view.speedreading_timeline.own.out,
					unit: 'WPM',
				}, {
					type: 'line',
					data: view.speedreading_timeline.avg.out,
					color: page.css['color.tertiary'],
					unit: 'WPM',
					dashed: 1,
				}]);
				chart.draw($(this).find('[chart=memory-meeting]')[0], [{
					type: 'bar',
					data: view.memory.in,
					unit: '%',
					standee: 0,
				}]);
				chart.draw($(this).find('[chart=memory-training]')[0], [{
					type: 'bar',
					data: view.memory.out,
					unit: '%',
					standee: 0,
				}]);
			});
		}).trigger('resize.statistics');
		return this;
	},
	intervals: [],
	loadAjaxId: 0,
	load: function(url) {
		this.clearIntervals();
		if ($.active)
		{
			++this.loadAjaxId;
			setTimeout(page.reload, 50);
		}
		else
		{
			var loadAjax = ajax({data: 'get_page', page: url.replace(/\/$/, '')});
			var loadAjaxId = ++this.loadAjaxId;
			$.prototype.hint();
			$('section').empty().next('.spinner-div').removeClass('error').addClass('visible');
			exercise = undefined;
			loadAjax.done(function(data) {
				if (loadAjaxId === page.loadAjaxId)
				{
					if (data)
					{
						$('section').html(data).next('.spinner-div').removeClass('visible');
						page.init();
					}
					else
					{
						$('section + .spinner-div').addClass('error');
					}
				}
			}).fail(function()
			{
				if (loadAjaxId === page.loadAjaxId)
				{
					$('section + .spinner-div').addClass('error');
				}
			});
		}
		return this;
	},
	reload: function()
	{
		return page.load(page.url());
	},
	resize:
	{
		trigger: function(duration)
		{
			if (this.timeout !== null)
			{
				clearTimeout(this.timeout);
			}
			this.duration = duration;
			(function()
			{
				setTimeout(function()
				{
						(function()
						{
							$(window).trigger('resize');
							if (page.resize.duration > 0)
							{
								page.resize.trigger(page.resize.duration -= 32);
							}
						}());
				}, 32);
			}());
		},
		duration: null,
		timeout: null,
	},
	scrollTop: function(val, animate) {
		if (typeof val !== 'undefined') {
			if (val === Infinity) val = $('body').outerHeight();
			if (typeof animate === 'undefined' || animate !== false) $('html').stop().animate({scrollTop: val}, {complete: typeof animate === 'function' ? animate : null});
			else $('html').scrollTop(val);
			return this;
		}
		return $('html').scrollTop();
	},
	undo: function(message, action) {
		if (!$._data(document, 'events') || !('mouseup' in $._data(document, 'events')) || $._data(document, 'events').mouseup[0].namespace.indexOf('undo') == -1) $(document).off('mouseup.undo').on('mouseup.undo', function(event) {
			$('#undo').animate({opacity: 0}, {complete: function()
				{
				$(this).remove();
			}});
		});
		var button;
		($('#undo').length ? $('#undo').stop().css({opacity: 1}).empty() : $('<div>', {id: 'undo'}).css({bottom: -50}).appendTo('body')).append('<span>' + message + '</span>', button = $('<div></div', {class: 'button'}).html('<a>RÜCKGÄNGIG MACHEN</a>').on('click', function(action) {
			return function()
			{
				action();
			};
		} (action))).animate({bottom: 32});
		button.addRipple(button.children('a').css('color').replace('b', 'ba').replace(')', ',.1)'));
	},
	url: function(address)
	{
		if (typeof address === 'undefined') return window.location.pathname.replace(/^\/+(.*)\/$/, '$1').replace(/^login\//, '');
		window.history.pushState({}, document.title, $('base').attr('href') + 'login/' + address.replace(/\/+$/, '').replace(/^\/+/, '') + (address === '' ? '' : '/'));
		if (typeof audio !== 'undefined' && typeof audio.pause === 'function') audio.pause();
		delete exercise;
		return this;
	},
};

var easings = {standard: [.4,0,.2,1], deceleration: [0,0,.2,1], acceleration: [.4,0,1,1], sharp: [.4,0,.6,1]};
for(var key in easings) $.easing[key] = function(easing){return function(a,b,c,d,e){var p1=[easing[0],easing[1]],p2=[easing[2],easing[3]];A=[0,0],B=[0,0],C=[0,0],f=function(t,ax){C[ax]=3*p1[ax],B[ax]=3*(p2[ax]-p1[ax])-C[ax],A[ax]=1-C[ax]-B[ax];return t*(C[ax]+t*(B[ax]+t*A[ax]))},g=function(t){return C[0]+t*(2*B[0]+3*A[0]*t)},h=function(t){var x=t,i=0,z;while(++i<14){z=f(x,0)-t;if(Math.abs(z)<.001)break;x-=z/g(x)}return x};return c+d*f(h(b/e),1);};}(easings[key]);
$.easing._default = 'standard';
$.fx.speeds._default = 240;

if (typeof localStorage === 'undefined') localStorage = {};
var defaults = {password: '', viewChat: '1'};
for (var d in defaults) if (!(d in localStorage)) localStorage[d] = defaults[d];

$(function()
{
	page.init();
	$('#home').addRipple();
	$('#sidebar-toggle-label .sidebar-toggle').addRipple().parent().on('click', function()
	{
		if ($('#sidebar').length)
		{
			page.sidebarForceExpanded = true;
			$('nav').addClass('sidebar-expanded');
			if (!localStorage.persistentSidebar)
			{
				$('#sidebar .sidebar-toggle').show();
			}
			page.resize.trigger(320);
		}
	});
	$('#main-nav > div').addRipple().add($('#sidebar .sidebar-toggle, #sidebar-container > div, #sidebar-settings').addRipple()).on('click', function()
	{
		if ($(this).hasClass('sidebar-toggle') || $(window).width() < 1200)
		{
			page.sidebarForceExpanded = false;
			$('nav').removeClass('sidebar-expanded');
			page.resize.trigger(320);
		}
	});

	$(window).on('popstate', function(event)
	{
		page.load(location.pathname.replace('login/', ''));
	}).focus(function()
	{
		page.focus = 1;
	}).blur(function()
	{
		page.focus = 0;
	}).on('resize.content-adapt', function()
	{
		if ($('#sidebar').length)
		{
			if ($(window).width() >= 1600)
			{
				page.sidebarForceExpanded = false;
				if (!$('nav').hasClass('sidebar-expanded') && localStorage.persistentSidebar)
				{
					$('nav').addClass('sidebar-expanded');
					page.resize.trigger(320);
				}
			}
			else if (page.sidebarForceExpanded != $('nav').hasClass('sidebar-expanded'))
			{
				$('nav').toggleClass('sidebar-expanded', !!page.sidebarForceExpanded);
				page.resize.trigger(320);
			}
		}
	}).trigger('resize.content-adapt');

	$(document).on('keydown.ctrl', function(event)
	{
		page.ctrl = event.ctrlKey;
	}).on('keyup.ctrl', function(event)
	{
		page.ctrl = event.ctrlKey;
	});

	setInterval(function()
	{
		if (page.focus) ajax({data: 'ping'});
	}, 60e3);

	if (location.host === 'emoree.self') return;
	if (privacy.google == 1)
	{
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
		ga('create', 'UA-74686556-1', 'auto');
		ga('send', 'pageview');
	}
});
$.fn.extend({
	addRipple: function(color, radius, fixed)
	{
		if (!$._data(document, 'events') || !('mouseup' in $._data(document, 'events')) || $._data(document, 'events').mouseup[0].namespace.indexOf('ripple') == -1) $(document).off('.ripple').on('mouseup.ripple mouseleave.ripple dragend.ripple', function()
		{
			$('.ripple:not(.fixed)').animate({opacity: 0}, {queue: false, complete: function()
				{
				$(this).remove();
			}});
		});
		return this.off('.ripple').on('mousedown.ripple', {c: color || 0, r: radius || 0, f: fixed || 0}, function(event)
		{
			$(this).children('.ripple').stop().animate({opacity: 0}, {queue: false, complete: function()
			{
				$(this).remove();
			}});
			var off = $(this).offset();
			var f = event.data.f;
			if (f)
			{
				event.pageX = 0;
				event.pageY = 0;
			}
			var	x = event.pageX || $(this).outerWidth() / 2 + off.left,
				y = event.pageY || $(this).outerHeight() / 2 + off.top,
				r = event.data.r || Math.sqrt(Math.pow($(this).outerWidth(), 2) + Math.pow($(this).outerHeight(), 2)),
				pos = $(this).position()
				c = event.data.c;
			$('<span>', {class: 'ripple' + ($(this).hasClass('fixed') ? ' fixed' : '')}).css({backgroundColor: typeof c == 'number' ? 'rgba(' + c + ',' + c + ',' + c + ',' + (.15 + c / 2000) + ')' : c, top: y - off.top, left: x - off.left}).appendTo(this).animate({width: r * 2, height: r * 2, top: y - r - off.top, left: x - r - off.left}, Math.sqrt(r) * 27, 'deceleration');
		});
	},
	customSelect: function(options)
	{
		if (!$._data(document, 'events') || !('click' in $._data(document, 'events')) || $._data(document, 'events').click[0].namespace.indexOf('selecthide') == -1) $(document).on('click.selecthide', function(event)
		{
			if ($(event.target).hasClass('.select') || $(event.target).parents('.select').length) return;
			$('.select .dropdown').stop().animate({opacity: 0}, {complete: function()
				{
				$(this).hide();
			}});
		});
		return this.each(function(options)
		{
			return function()
			{
				if ($(this).children('.output, .dropdown').length) return;
				var input = $(this).children('input'), defaultValue;
				if (!input.val() && (defaultValue = input.attr('default'))) input.val(defaultValue);
				$(this).append($('<div>', {class: 'output'}));
				var dropdown = $('<div>', {class: 'dropdown'}), label = $(this).attr('label'), key;
				for (key in options) $('<div>', {key: key, class: input.val() == key ? 'current' : ''}).html('<span class="text">' + (label !== undefined ? '<s>' + label + ': </s>' : '') + options[key] + '</span>').on('click', function(event)
				{
					if (event.which != 1) return;
					var label = $(this).parent().parent().attr('label');
					$(this).addClass('current').siblings('.current').removeClass('current').end().parent().siblings('.output').html('<span class="text"' + ($(this).attr('key') == $(this).parent().siblings('input').attr('default') ? ' style="color:' + page.css['color.greyMedium'] + ';"' : '') + '>' + (label !== undefined ? label + ': ' : '') + $(this).children('.text').html() + '<i class="icon">&#xE5C5;</i></span>').siblings('input').val($(this).attr('key')).trigger('change').siblings('.dropdown').stop().animate({opacity: 0}, {complete: function()
						{
						$(this).hide();
					}});
				}).addRipple().appendTo(dropdown);
				$(this).children('.output').on('click', function()
				{
					var dropdown = $(this).siblings('.dropdown');
					$('.select .dropdown').not(dropdown).stop().animate({opacity: 0}, {complete: function()
						{
						$(this).hide();
					}});
					var height = dropdown.children().height(), scrollHeight = dropdown.children().length * height;
					dropdown.stop().css({opacity: 0}).show().scrollTop(scrollHeight * dropdown.children('.current').index() / dropdown.children().length - (Math.min(scrollHeight, dropdown.height()) - height) / 2).css({marginTop: dropdown.children('.current').position() ? -(dropdown.children('.current').position().top || 0) : 0}).animate({opacity: 1});
				}).addRipple().after(dropdown);
				var duplicate = dropdown.show().children('[key="' + input.val() + '"]').trigger($.Event('click', {which: 1})).end().clone().css({display: 'inline-block'}).appendTo('body');
				$(this).css({width: duplicate.width() + 56});
				duplicate.remove();
			};
		} (options));
	},
	autoresize: function(buffer)
	{
		if (typeof buffer === 'undefined') var buffer = 1;
		return this.off('.autoresize').on('focus.autoresize blur.autoresize keydown.autoresize keyup.autoresize change.autoresize paste.autoresize input.autoresize', function(buffer)
		{
			return function()
			{
				var pageCache = page.scrollTop(),
					parentCache = $(this).parent('.scroll').scrollTop(),
					thisCache = $(this).scrollTop();
				$(this).height(0).height(this.scrollHeight + buffer * parseInt($(this).css('lineHeight')));
				page.scrollTop(pageCache, !1);
				$(this).parent('.scroll').scrollTop(parentCache);
				$(this).scrollTop(thisCache);
			};
		} (buffer));
	},
	hintput: function(dataset)
	{
		return this.next('.hint-clear').remove().end().after($('<div>', {class: 'hint-clear'}).html('<i class="icon">&#xE14C;</i>').addRipple().on('click', function()
		{
			$(this).prevAll('input').first().val('').trigger('focus.hintput');
		})).off('.hintput').on('keydown.hintput keypress.hintput', function(event)
		{
			if (event.which == 13 || event.which == 38 || event.which == 40)
			{
				event.preventDefault();
			}
		}).on('focus.hintput keyup.hintput', (function(dataset)
		{
			return function(event)
			{
				var hint = $(this).removeAttr('item').next('.hint-list').length ? $(this).next().stop().animate({opacity: 1}) : $('<div>', {class: 'hint-list scroll'}).css({opacity: 0}).insertAfter(this).animate({opacity: 1});
				if (event.which == 13 || event.which == 38 || event.which == 40)
				{
					event.preventDefault();
				}
				switch(event.which)
				{
					case 38:
						if (!hint.children('.highlight').removeClass('highlight').prev().addClass('highlight').length) hint.children().last().addClass('highlight');
						hint.scrollTop(hint[0].scrollHeight * hint.children('.highlight').index() / hint.children().length - (hint.height() - hint.children().height()) / 2);
						return event.preventDefault();
					case 40:
						if (!hint.children('.highlight').removeClass('highlight').next().addClass('highlight').length) hint.children().first().addClass('highlight');
						hint.scrollTop(hint[0].scrollHeight * hint.children('.highlight').index() / hint.children().length - (hint.height() - hint.children().height()) / 2);
						return event.preventDefault();
					case 13:
						if (hint.children('.highlight').length) hint.children('.highlight').trigger($.Event('mouseup', {which: 1}));
						$(this).trigger('blur');
						return event.preventDefault();
				}
				hint.empty().css({marginTop: 0}).parents('.container').css({zIndex: 1});
				var weight = 0, needle = $(this).val();
				for(var i in dataset)
				{
					if ((weight = String(dataset[i]).replace(/<[^>]+>/g, '').replace('&#xE877;', '').occurrences(needle) + (String(dataset[i]).replace(/<[^>]+>/g, '').replace('&#xE877;', '').toLowerCase().indexOf(needle.toLowerCase()) == 0 ? 2 : 0)) > 0)
					{
						hint.append($('<div>', {weight: weight, key: i}).html(dataset[i]));
					}
				}
				hint.append(hint.children().detach().sort(function(a, b) { var aw = $(a).attr('weight'), bw = $(b).attr('weight'); return (bw - aw) || ($(a).text() || '').localeCompare($(b).text() || ''); })).children().addRipple().on('mouseup', function(event)
				{
					if (event.which == 1)
					{
						$(this).parent().prev('input').attr('item', $(this).attr('key')).val($(this).text().replace(/^\uE877/, ''));
					}
				});
				hint.is(':empty') ? hint.append($('<div>').css({cursor: 'default'}).text('Keine passenden Vorschläge.')) : hint.children().first().addClass('highlight');
				if ($('.hint-list').offset().top + $('.hint-list').outerHeight() > $('body').outerHeight())
				{
					hint.append(hint.children().get().reverse()).css({marginTop: -hint.height() - $(this).outerHeight()}).scrollTop(hint[0].scrollHeight);
				}
			};
		}) (dataset)).on('blur.hintput', (function(dataset)
		{
			return function()
			{
				var i, v = $(this).val();
				$(this).val('').removeAttr('item');
				for(var i in dataset) if (v === String(dataset[i]).replace(/<[^>]+>/g, '').replace('&#xE877;', '')) $(this).val(v).attr('item', i);
				$(this).next('.hint-list').stop().animate({opacity: 0}, function()
				{
					$(this).prev().trigger('change').end().remove();
				});
			};
		}) (dataset));
	},
	holdRipple: function()
	{
		return $(this).addClass('fixed');
	},
	multipleClassSelect: function(classes)
	{
		if (typeof classes !== 'undefined')
		{
			classes[0] = 'wählen';
		}
		else
		{
			var classes = ['wählen'], c;
			for(c = 0; c < 7 * 9; ++c)
			{
				classes.push(Math.floor(c / 7) + 5 + ['a', 'b', 'c', 'd', 'g', 'l', 'o'][c % 7]);
			}
		}
		return $(this).html($('<div>', {class: 'add-class button flat'}).html('<a><i class="icon">&#xE145;</i> Klasse hinzufügen</a>').on('click', function(element)
		{
			return function()
			{
				$(this).before('<div><div class="select" label="Klasse"><input type="hidden" default="0"></div><div class="hint-clear"><i class="icon">&#xE872;</i></div></div>');
				$(element).find('.select').customSelect(classes).next('.hint-clear').addRipple().off('click').on('click', function()
				{
					// specific for user management page
					if ($('#role-list').length && $('#role-list input:checked').val() == 0) return;
					$.prototype.hint();
					page.undo('Element gelöscht', function(nextSibling, element)
					{
						return function()
						{
							element.insertBefore(nextSibling);
						};
					} ($(this).parent().next(), $(this).parent().detach()));
				});
				page.init();
			};
		} (this)));
	},
	range: function(labels)
	{
		return this.off('.range').on('mouseenter.range mousedown.range mousemove.range input.range', function(labels)
		{
			return function()
			{
				var standee = $(this).standee(labels[$(this).val()]);
				standee.addClass('flat').css({left: $(this).offset().left + ($(this).val() - $(this).attr('min')) * ($(this).outerWidth() - 16) / ($(this).attr('max') - $(this).attr('min')) + 8 - standee.outerWidth() / 2});
			};
		} (labels)).on('mouseleave.range', function()
		{
			setTimeout(function()
			{
				if (+(new Date) - $('.standee').attr('time') > 750) $(this).standee();
			}, 750);
		});
	},
	releaseRipple: function()
	{
		return this.children('.ripple').removeClass('fixed').end().trigger('mouseup.ripple');
	},
	removeRipple: function()
	{
		return this.off('.ripple');
	},
	sequencing: function()
	{
		this.children('thead').children('tr').children('th').children('.sequencing').remove().end().prepend($('<div>', {class: 'sequencing'}).html('<i class="icon">import_export</i>').addRipple(0, 27).on('click', function()
		{
			$(this).parent().siblings().children('.sequencing').children('i').html('import_export');
			var index = $(this).parent().index(),
				tbody = $(this).parent().parent().parent().next('tbody'),
				icon = $(this).children('i'),
				desc = icon.html() == '\uE5C5';
			icon.html(desc ? '&#xE5C7;' : '&#xE5C5;');
			tbody.children('tr').detach().sort(function(a, b)
			{
				return (1 - 2 * desc) * ($($(a).children()[index]).text() || '').localeCompare($($(b).children()[index]).text() || '');
			}).appendTo(tbody);
		}));
		return this;
	},
	shake: function()
	{
		var el = this;
		if (el.hasClass('shake')) return;
		setTimeout(function()
		{
			el.removeClass('shake');
		}, 500);
		return el.addClass('shake');
	},
	spinner: function()
	{
		return $('<div>', {class: 'spinner-div spinner-card visible center'}).html(page.spinner).appendTo(this.parents('.card').first());
	},
	standee: function(arg, stack)
	{
		if (!$._data(window, 'events') || !('mousedown' in $._data(window, 'events')) || $._data(window, 'events').mousedown[0].namespace.indexOf('standee') == -1)
		{
			$(window).on('mousedown.standee resize.standee', function(event)
			{
				$('.standee').remove();
			});
		}
		if (typeof arg === 'undefined')
		{
			globalStandeeCache = undefined;
			return $('.standee').remove();
		}
		if (!this.length)
		{
			return this;
		}
		var standee = $('<div>', {class: 'standee'}).append(arg).on('mousedown', function(event)
		{
			event.stopPropagation();
		}).appendTo('body');
		var x = this.offset().left + (this.outerWidth() - standee.outerWidth()) / 2;
		var y = this.offset().top - standee.outerHeight() - 8;
		if (x < 0)
		{
			x += standee.addClass('left').outerWidth() / 2 - 18;
		}
		else if (x + standee.outerWidth() > $('body').width())
		{
			x -= standee.addClass('right').outerWidth() / 2 - 18;
		}
		standee.css({top: y, left: x, position: this.add(this.parents()).filter(function()
		{
			return $(this).css('position') == 'fixed';
		}).length ? 'fixed' : 'absolute'}).addClass('visible');
		var newCache = [y, x, arg.toString()].join(',');
		if (typeof globalStandeeCache !== 'undefined' && newCache === globalStandeeCache && $('.standee').not(standee).length)
		{
			standee.remove();
		}
		else if (!(stack || 0))
		{
			$('.standee').not(standee).remove();
		}
		globalStandeeCache = newCache;
		return (standee.length ? standee : $('.standee')).attr('time', +(new Date));
	},
	wordLimit: function(max)
	{
		if (!$(this).next().hasClass('word-limit'))
		{
			$('<span>', {class: 'word-limit explanation'}).text('0 / ' + max).insertAfter(this);
		}
		return $(this).off('.wordlimit').on('focus.wordlimit blur.wordlimit keydown.wordlimit keyup.wordlimit change.wordlimit paste.wordlimit input.wordlimit', function(max)
		{
			return function()
			{
				var count = (($(this).val() + ' ').match(/[^\s]+\s+/g) || []).length;
				$(this).toggleClass('invalid', count > max).next('.word-limit').text(count + ' / ' + max);
			};
		}(max)).trigger('change.wordlimit');
	},
	hint: function(arg)
	{
		if (!$._data(window, 'events') || !('resize' in $._data(window, 'events')) || !$._data(window, 'events').mousedown || $._data(window, 'events').mousedown[0].namespace.indexOf('hint') == -1) $(window).on('resize.hint', function(event) {
			$('.hint').remove();
		});
		if (typeof arg === 'undefined') return $('.hint').remove();
		if (!this.length) return this;
		var hints = $(), fixedParent;
		this.each(function()
		{
			if ($(this).is(':visible'))
			{
				fixedParent = $(this).add($(this).parents()).filter(function()
				{ return $(this).css('position') == 'fixed'; }).length;
				hints = hints.add($('<div>', {class: 'hint'}).append(arg).on('mousedown', function(event) {
					event.stopPropagation();
				}).appendTo('body').css({width: $(this).outerWidth(), top: $(this).offset().top + $(this).outerHeight() - (fixedParent ? page.scrollTop() : 0), left: $(this).offset().left, position: fixedParent ? 'fixed' : 'absolute'}).addClass('visible'));
			}
		});
		return hints;
	},
});


function popup(/* [max-width [, heading [, sub-heading]], ] content */)
{
	var content;

	switch(arguments.length)
	{
		case 0:
			return $('#popup').animate({opacity: 0}, {complete: function()
				{
				$(this).css({visibility: 'hidden'});
			}}).children().animate({top: 24});
			break;
		case 1:
			content = arguments[0];
			break;
		case 2:
			// NEW CODE
			// check if it is intro so that I can set new class in which will I delete padding
			var intro = arguments[1].indexOf("intro-container") !== -1 ? "intro " : "";

			content = '<div class="' + intro + 'card scroll"' + (arguments[0] ? ' style="max-width:' + arguments[0] + 'px;"' : '') + '>' + arguments[1] + '</div>';
			break;
		case 3:

			content = '<div class="card scroll"' + (arguments[0] ? ' style="max-width:' + arguments[0] + 'px;"' : '') + '><h1>' + arguments[1] + '</h1><div id="popup-close"><i class="icon"></i></div>' + arguments[2] + '</div>';
			break;
		case 4:
			content = '<div class="card scroll"' + (arguments[0] ? ' style="max-width:' + arguments[0] + 'px;"' : '') + '><h1>' + arguments[1] + '</h1><h2>' + arguments[2] + '</h2><div id="popup-close"><i class="icon"></i></div>' + arguments[3] + '</div>';
			break;
	}
	var element = $('#popup');
	if (!element.length)
	{
		$('body').append(element = $('<div>', {id: 'popup'}).css({opacity: 0}));
	}
	element.html(content).css({visibility: 'visible'}).animate({opacity: 1}).children().animate({top: 0}).find('.button').addRipple().filter('.flat').each(function()
	{
		$(this).addRipple($(this).css('color').replace('b', 'ba').replace(')', ',.2)'));
	});
	$('#popup-close').addRipple().on('click', function()
	{
		popup();
	});
	return element;
}


function generateIntroCards() {

	var cards = ["video-one", "video-two", "video-three", "download-pdf", "reading-test"];
	var cardImages = ["lamijas_stuff/kamera1.svg", "lamijas_stuff/kamera2.svg", "lamijas_stuff/kamera3.svg", "lamijas_stuff/pdficon.svg", "lamijas_stuff/bookicon.svg"];
	var cardDurations = ["10 seconds", "10 seconds", "10 seconds", "Download", "5 minutes"];
	var cardHeadings = ["Onboarding video", "Customize your own exercises", "Personilzed Emoree Exercises", "Started Kit", "Reading Test"];
	var cardTexts = [
		"See how you can create your classroom and add students, or let us do it for you.",
		"Learn how to create exercises and invite your students to do them.",
		"Let us show you where to find our customised exercises for your students",
		"Download printable version with all the instructions for the website.",
		"Try the reading test yourself and see what your students will be reading."
	];
	var cardInnerElements = "";


	for (var i = 0; i < cards.length; i++) {

		var image = "";
		var text = "";
		var heading = "";
		var duration = "";

		// create necessary elements
		cardInnerElements += "<div id='" + cards[i] + "' class='intro-card'>" +
									"<div class='left-card-part'>" +
										'<object  type="image/svg+xml" data="' + cardImages[i] + '"></object>' +
										"<span class='duration'>" + cardDurations[i] + "</span>" +
									"</div>" +
			                        "<div class='right-card-part'>" +
										"<h2>" + cardHeadings[i] + "</h2>" +
										"<span>" + cardTexts[i] + "</span>" +
									"</div>" +
								"</div>";


	}

	// add skip button
	cardInnerElements += "<div class='button skip-button' onclick='popup()'>Skip</div>";

	// set generated elements
	document.getElementById("right-intro-part").innerHTML = cardInnerElements;


	// TODO refactor this code
	document.getElementById(cards[0]).addEventListener("click", function () {
		showVideo();
	});

	document.getElementById(cards[1]).addEventListener("click", function () {
		showVideo();
	});

	document.getElementById(cards[2]).addEventListener("click", function () {
		showVideo();
	});

	document.getElementById(cards[3]).addEventListener("click", function () {
		window.open("lamijas_stuff/emoree_pdf_demo.pdf");
	});

	document.getElementById(cards[4]).addEventListener("click", function () {
		window.open("https://www.emoree.de/", "_blank");
	});

}


function downloadSchulerlist() {
	 window.open("lamijas_stuff/Anmeldeliste.xlsx");
}

function downloadElteranscreiben() {
	window.open("lamijas_stuff/201901_Emoree_Vorlage_Elternschreiben_Beispiel.docx");
}


function showVideo() {
	// hide intro parts
	document.getElementById("left-intro-part").style = "display: none";
	document.getElementById("right-intro-part").style = "display: none";
	// show and start video
	document.getElementById("video-close-button").style = "display: block";
	document.getElementById("intro-video-player").style = "display: block";

	// New CODE 2
	document.getElementById("intro-container").style = "height: 550px";
	// END New CODE 2

	document.getElementById("intro-video-player").currentTime = 0;
	document.getElementById("intro-video-player").play();

	// New CODE 2
	// track video current time
	var vid = document.getElementById("intro-video-player");
	vid.ontimeupdate = function() {
		// console.log(vid.currentTime);
		var time = vid.currentTime;

		if (time > 75.2) {
			showInviteButtonOverVideo();
		} else {
			hideInviteButtonOverVideo();
		}
	};
	// END New CODE 2
}

function exitVideo() {
	// hide
	document.getElementById("video-close-button").style = "display: none";
	document.getElementById("intro-video-player").style = "display: none";

	// New CODE 2
	document.getElementById("intro-container").style = "height: 700px";
	// END New CODE 2

	document.getElementById("intro-video-player").pause();
	document.getElementById("intro-video-player").currentTime = 0;

	// show
	document.getElementById("left-intro-part").style = "display: block";
	document.getElementById("right-intro-part").style = "display: block";

	// New CODE 2
	// hide invite button
	hideInviteButtonOverVideo();
	// END New CODE 2
}

// New CODE 2
function showInviteButtonOverVideo() {
	document.getElementById("kollegen-einladen-button").style = "display: block";
}

function hideInviteButtonOverVideo() {
	document.getElementById("kollegen-einladen-button").style = "display: none ";
}
// END New CODE 2


// NEW CODE 2 - this function is removed from login_dashboard.html and placed here
$(document).ready(function() {
	var classes = ['wählen'], c;

	for (c = 0; c < 7 * 9; ++c) classes.push(Math.floor(c / 7) + 5 + ['a', 'b', 'c', 'd', 'g', 'l', 'o'][c % 7]);

	popup(1100,
		'<div id="intro-container">' +
		'<div id="left-intro-part">' +
		'<h1 id="intro-heading" class="intro-text">Give Emoree <br/> Experience a Try</h1>' +
		'<p id="intro-description" class="intro-text">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor  deserunt mollit anim id est</p>' +
		'<p id="intro-question" class="intro-text">Was this helpful?</p>' +
		'<div id="thumbs-container">' +

		// New CODE 2 - here I wrapped objects with divs so that they are clickable and to enalbe cursor: pointer
		'<div id="likeButton" onclick="toggleLike(this.id)"><object type="image/svg+xml" data="lamijas_stuff/thumbs_up.svg"></object></div>' +
		'<div id="dislikeButton" onclick="toggleLike(this.id)"><object type="image/svg+xml" data="lamijas_stuff/thumbs_down.svg"></object></div>' +
		// END New CODE 2

		'</div>' +
		'</div>' +
		'<div id="right-intro-part"></div>' +
		'<video id="intro-video-player" width="100%" autoplay controls>' +
		'  <source src="lamijas_stuff/OnboardingVideo2.mp4" type="video/mp4">' +
		'  Your browser does not support the video element.' +
		'</video>' +

		// NEW CODE 2
		'<div id="kollegen-einladen-button" class="button" onclick="displayPopupOverIntro()">Einladen</div>' +
		// END New CODE 2

		'<div id="video-close-button" onclick="exitVideo()">' +
		'<img src="lamijas_stuff/close.svg"/>' +
		'</div>' +
		'</div>'
	);

	generateIntroCards();

});
// END New CODE 2

// New CODE 2
function toggleLike(value) {

}
// END New CODE 2


/*** AJAX ***/

function get_emulation_settings()
{
	return $('.chat_send').hasClass('emulation') ? JSON.stringify({
		su: $('#emulation-su').prop('checked'),
		staff: $('#emulation-staff').prop('checked'),
		business: $('#emulation-business input').val(),
		school: $('#emulation-school input').val(),
		class: $('#emulation-class input').val(),
	}) : undefined;
}
function ajax(data)
{
	data.emulation_settings = get_emulation_settings();
	return $.ajax({data: data})
}
function ajaxTrue(data)
{
	return ajax(data).then(function(data)
	{
		if (data == 'true')
		{
			return true;
		}
		else
		{
			throw new Error(data);
		}
	});
}
$.ajaxSetup({
	cache: false,
	mimeType: 'multipart/form-data',
	type: 'POST',
	url: '../user/ajax.php',
});
function ajaxDone(data)
{
	try
	{
		eval(data);
	}
	catch(exception)
	{
		window.onerror(exception + '(' + data + ')', 'ajax response');
		if (exception instanceof SyntaxError)
		{
			console.error('ajax response syntax error', data);
		}
	}
};

window.onerror = function(error, file, line, col, stack)
{
	ajax({data: 'bug_report', message: error, occurrence: file + (typeof line !== 'undefined' ? ' at line ' + line + ':' + (col || '?') : '')});
};

/*** HELPER FUNCTIONS ***/

String.prototype.occurrences = function(needle) {
	needle = needle.toLowerCase();
		if (needle.trim().length <= 0) return 0;
		var n = 0, pos = -1, haystack = this.toLowerCase();
		while (1) {
				pos = haystack.indexOf(needle, pos + 1);
				if (pos < 0) break;
		n++;
		}
		return n;
};
Object.defineProperty(Object.prototype, 'getX', {
	enumerable: false,
	value: function()
	{
		var e = this;
		if (typeof e !== 'object' || !('type' in e)) return;
		return e.type.substr(0, 5) === 'touch' ? e.originalEvent.changedTouches[0].pageX : e.pageX;
	}
});
Object.defineProperty(Object.prototype, 'getY', {
	enumerable: false,
	value: function()
	{
		var e = this;
		if (typeof e !== 'object' || !('type' in e)) return;
		return e.type.substr(0, 5) === 'touch' ? e.originalEvent.changedTouches[0].pageY : e.pageY;
	}
});

/*** DATE ***/

Date.prototype.toYmd = function()
{
	return this.getFullYear() + '-' + ('0' + (this.getMonth() + 1)).slice(-2) + '-' + ('0' + this.getDate()).slice(-2);
};
Date.prototype.toEuropean = function()
{
	if (isNaN(this)) return;
	return this.getDate() + '. ' + ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][this.getMonth()] + ' ' + this.getFullYear();
};
String.prototype.toDate = function()
{
	if (!this || this.length < 1) return new Date;
	var date = new Date,
		months = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'],
		month = this.toLowerCase().replace(/[^abdefgijklmnoprstuvzä]/g, '').trim(),
		split = this.split(/[\,\-\.\/\s)]+/);
	date.setDate(Math.max(-1000, Math.min(1000, this.match(/^(\d+)/, '') ? this.match(/^(\d+)/, '')[0] : 1)));
	if (split.length > 2) {
		date.setMonth((+split[1] || date.getMonth())-1);
	}
	if (month != '') {
		if (months.indexOf(month) == -1)
			for (var i in months) {
				if (months[i].indexOf(month) != -1 || month.indexOf(months[i]) != -1) {
					date.setMonth(i);
					break;
				}
			}
		else date.setMonth(months.indexOf(month));
	}
	date.setFullYear(Math.max(2000, Math.min(3000, (this.match(/(\d+)(?!.*\d)/, '') && (month != '' || split.length > 2) && this.match(/(\d+)(?!.*\d)/, '').index >= this.length - this.match(/(\d+)(?!.*\d)/, '')[0].length) ? '2'+('000'+this.match(/(\d+)(?!.*\d)/, '')[0]).slice(-3) : date.getFullYear())));
	return date;
};