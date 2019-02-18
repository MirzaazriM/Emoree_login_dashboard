class Exercise
{
	constructor(options)
	{
		this.title = '';
		this.type = '';
		this.page = 0;
		this.content = [];
		this.startTime = 0;
		this.isPaused = 0;
		this.recording = false;
		this.suffix = 0;
		this.bookmark = false;
		this.startHandler = undefined;
		this.endHandler = undefined;
		this.speed = null;

		for(var o in options)
		{
			if (o in this)
			{
				this[o] = options[o];
			}
			else
			{
				console.error('unknown exercise option:', o);
			}
		}
	}
	load()
	{
		/*if (this.bookmark)
		{
			popup(520, `Lesezeichen bei ${Math.round(Math.min(1, Math.max(0, this.bookmark.word / this.data.length)) * 100)}%`, `Möchtest die Übung an der Stelle fortsetzen, an der du sie <b>${this.bookmark.date}</b> unterbrochen hast?<hr><div class="button bookmark-continue"><a><i class="icon">&#xE866;</i> Fortsetzen</a></div><div class="button flat bookmark-discard" style="margin-left:8px;"><a><i class="icon">&#xE166;</i> Neu starten</a></div>`);
			$('.bookmark-continue').on('click', (function()
			{
				this.word.current = this.word.next = this.bookmark.word;
				this.bookmark = false;
				this.load();
			}).bind(this));
			$('.bookmark-discard').on('click', (function()
			{
				this.bookmark = false;
				this.load();
			}).bind(this));
			return;
		}
		*/
		popup();
		$(document).off('autohide').on('mousemove.autohide touchmove.autohide', function(event)
		{
			if ($('#exercise-controls').length)
			{
				var bounds = $('#exercise-controls')[0].getBoundingClientRect();
				var x = event.getX();
				var y = event.getY();
				var toggle = y < 100 || (($(window).width() >= 1600 || $('nav').hasClass('sidebar-expanded')) && x < 340) || (x > bounds.x && y > bounds.y && x < bounds.x + bounds.width);
				var random = Math.random();
				if (toggle)
				{
					$('nav').removeClass('hidden');
					$('#exercise-controls').attr('highlight', random);
				}
				else
				{
					$('#exercise-controls[highlight]').attr('highlight', random);
					setTimeout(function()
					{
						if ($(`#exercise-controls[highlight='${random}']`).removeAttr('highlight').length)
						{
							$('nav').addClass('hidden');
						}
					}, 1000);
				}
			}
			else
			{
				$(document).off('.autohide');
			}
		}).trigger('mousemove');
		$('#sheet').show();
		for (var c in this.content)
		{
			if (this.content[c].type === 'description')
			{
				var description = String(this.content[c].description).trim();
				this.content.splice(c, 1);
				if (description)
				{
					$('#exercise-content').empty().append(this.title ? $('<h1>').html(this.title) : null, $('<div>').css({textAlign: 'left'}).html('<h2>Übungsbeschreibung</h2>' + description + '<br><br>'), $('<div>', {class: 'text-button'}).css({display: 'block', margin: '0 auto'}).append($('<a>').addRipple().html('<div class="center start"><i>Los</i></div>').on('click', this.startHandler.bind(this)), '<span class="text-label">Bereit?</span>'));
					return;
				}
			}
		}
		this.countdown();
	}
	countdown()
	{
		if (this.startHandler/* && !this.bookmark*/)
		{
			this.timeout_exercise_countdown;
			if (this.timeout_exercise_countdown !== undefined)
			{
				clearTimeout(this.timeout_exercise_countdown);
				this.timeout_exercise_countdown = undefined;
			}
			$('#exercise-content').empty().append(this.title ? $('<h1>').html(this.title) : null, $('<div>', {class: 'text-button'}).css({display: 'block', margin: '0 auto'}).append($('<a>').addRipple().html('<div class="center"><i>3</i></div>').on('click', (function()
			{
				if (this.timeout_exercise_countdown !== undefined)
				{
					clearTimeout(this.timeout_exercise_countdown);
					this.timeout_exercise_countdown = undefined;
				}
				this.startHandler();
			}).bind(this)), '<span class="text-label">Bereit?</span>'));
			this.timeout_exercise_countdown = setTimeout((function()
			{
				$('#exercise-content .text-button i').text(2);
				this.timeout_exercise_countdown = setTimeout((function()
				{
					$('#exercise-content .text-button i').text(1);
					this.timeout_exercise_countdown = setTimeout((function()
					{
						this.startHandler();
					}).bind(this), 1e3);
				}).bind(this), 1e3);
			}).bind(this), 1e3);
		}
	}
	element(element)
	{
		var content = $('<div>').css({paddingTop: 16});
		switch(element.type)
		{
			case 'description':
				content.append($('<div>').html(element.description));
				break;
			case 'start-button':
				content.css({textAlign: 'center'}).append($('<div>', {class: 'button'}).html('<a>Start</a>').on('click', (function()
				{
					++this.page;
				}).bind(this)));
				break;
			case 'image':
				if (element.media != 0)
				{
					content.append('<img style="margin:0 auto;max-height:480px;display:block;" src="login/exercise-media/' + element.media + '/">');
				}
				break;
			case 'video':
				if (element.media != 0)
				{
					if (isFinite(element.media))
					{
						content.append(`<video controls style="width:100%;" controlsList="nodownload"><source type="video/mp4" src="login/exercise-media/${element.media}/" ></video>`);
					}
					else
					{
						content.append($('<div>').css({height: 0, paddingBottom: '56.25%'}).append('<iframe src="https://www.youtube-nocookie.com/embed/' + element.media + '?rel=0" allowfullscreen style="width:100%;height:100%;position:absolute;border:none;top:0;left:0;"></iframe>'), '<div class="explanation" style="margin-top:8px;">Quelle: <a style="color:inherit;" href="https://youtu.be/' + element.media + '" target="_blank">https://youtu.be/' + element.media + '</a></div>');
					}
				}
				break;
			case 'audio':
				if (element.media != 0)
				{
					content.append($('<div>').html(`<audio controls style="width:100%;" controlsList="nodownload"><source type="audio/mp3" ${element.media == 0 ? '' : element.media.match(/^[0-9]+$/) ? `src="login/exercise-media/${element.media}/"` : `src="${element.media}"`}></audio>`));
				}
				break;
			case 'speech':
				var microphone = new Microphone(element.max_duration || 1);
				microphone.canvas = $('<canvas>').css({height: 200, display: 'none'});
				var start_recording = function()
				{
					microphone.start().then((function()
					{
						$(this).html('<a><i class="icon">stop</i> Aufnahme beenden</a>').off('click').on('click', function()
						{
							microphone.stop();
						}).next('.button').hide();
						page.intervals.push(setInterval((function()
						{
							if (!microphone.timestamp)
							{
								$(this).html('<a><i class="icon">mic</i> Aufnahme neu starten</a>').off('click').on('click', start_recording).next('.button').show();
								microphone.answer(element);
							}
						}).bind(this), 100));
					}).bind(this)).catch((function(event)
					{
						$(this).trigger('click');
					}).bind(this));
				};
				var audio_playback_source = null;
				var audio_playback_timeout = null;
				var play_recording = function()
				{
					$(this).html('<a><i class="icon">pause</i> Wiedergabe pausieren</a>').off('click').on('click', function()
					{
						$(this).html('<a><i class="icon">play_arrow</i> Aufnahme abspielen</a>').off('click').on('click', play_recording);
						if (audio_playback_source && !audio_playback_source.ended)
						{
							audio_playback_source.pause();
						}
						page.clearIntervals();
					});
					audio_playback_source = new Audio(element.answer);
					audio_playback_source.play();
					page.clearIntervals();
					page.intervals.push(setInterval((function()
					{
						if (audio_playback_source.ended)
						{
							$(this).trigger('click');
						}
					}).bind(this), 100));
				};
				content.append($('<div>', {class: 'button'}).html('<a><i class="icon">mic</i> Aufnahme starten</a>').on('click', start_recording), ' ', $('<div>', {class: 'button flat'}).hide().html('<a><i class="icon">play_arrow</i> Aufnahme abspielen</a>').on('click', play_recording), microphone.canvas);
				break;
			case 'divider':
				$('<div>', {class: 'two-col'}).append(
					$('<div>').append(element.content && element.content[0] ? this.element(element.content[0]) : null),
					$('<div>').append(element.content && element.content[1] ? this.element(element.content[1]) : null),
					'<br>'
				).appendTo(content);
				break;
			case 'question':
				content.append($('<h2>').html(element.question || 'Frage'));
				var answers = $('<div>', {class: 'answers'});

				switch(element.questionType)
				{
					case 'multiple-choice': default:
						for(var a in element.answers)
						{
							answers.append($('<div>', {class: 'radio'}).append($('<input>', {type: 'radio'}).prop('checked', a == element.answer).on('change', function(element)
							{
								return function()
								{
									element.answer = $(this).parent().index();
									element.score = element.answers[element.answer][0];
								};
							} (element)), '<i class="icon before"></i><div><span>' + element.answers[a][1] + '</span></div>'));
						}
						break;
					case 'short':
						answers.append($('<textarea>', {placeholder: 'Antwort eingeben'}).autoresize().on('change', function()
						{
							element.answer = $(this).val();
						}));
						break;
				}
				content.append(answers);
				break;
			case 'gap-text':
				var gap_regex = new RegExp(`${page.gap_character}[^\\s]+`, `g`);

				switch(element.fill_type || 0)
				{
					case 'user-input':
						content.append($('<div>', {class: 'gap-text'}).html(element.text.replace(gap_regex, '<input>').replace(/\n/g, '<br>')));
						content.find('input').on('change', function()
						{
							element.answers = [];
							$('.gap-text input').each(function()
							{
								element.answers.push($(this).val());
							});
						});
						break;
					case 'drag-and-drop': default:
						var solutions = element.text.match(gap_regex);
						var b, c, d;
						c=solutions.length;while(c)b=Math.random()*c--|0,d=solutions[c],solutions[c]=solutions[b],solutions[b]=d;
						var source = $('<div>', {class: 'gap-text-solutions'});
						for(var s in solutions)
						{
							source.append($('<div>', {class: 'gap-text-solution'}).text(solutions[s].substr(1, solutions[s].length - 1)));
						}
						var destination = $('<div>', {class: 'gap-text'}).html(element.text.replace(gap_regex, '<div class="gap-text-gap"></div>').replace(/\n/g, '<br>'));
						content.append(source, destination);

						var drag = {element: 0, raw: 0, x: 0, y: 0, w: 0, h: 0, source: source, destination: destination};
						$(document).on('mousemove.drag touchmove.drag', function(event)
						{
							if (drag.element)
							{
								try
								{
									drag.element.css({top: drag.y = (event.getY() - drag.element.outerHeight() / 2 - page.scrollTop()), left: drag.x = (event.getX() - drag.element.outerWidth() / 2)});
								}
								catch (exception)
								{
								}
							}
						}).on('mouseup.drag touchend.drag', function()
						{
							if (drag.element)
							{
								$('.gap-text-gap', drag.destination).each(function()
								{
									if (!drag.element || !drag.element.hasClass('float'))
									{
										return false;
									}
									var gap = {
											w: $(this).outerWidth(),
											h: $(this).outerHeight(),
											x: $(this).offset().left,
											y: $(this).offset().top - page.scrollTop(),
									};

									if (
										drag.x + drag.w > gap.x && drag.y + drag.h > gap.y &&
										drag.x < gap.x + gap.w && drag.y < gap.y + gap.h
									)
									{
										if ($(this).text())
										{
											$('<div>', {class: 'gap-text-solution'}).text($(this).text()).appendTo(drag.source);
										}
										$(this).text(drag.element.text()).addClass('gap-text-solution');

										element.answers = [];
										$('.gap-text-gap', drag.destination).each(function()
										{
											element.answers.push($(this).text());
										});

										drag.element.remove();
										drag.raw.remove();
										drag.element = 0;
										return false;
									}
								});
								if (drag.element)
								{
									drag.raw.removeClass('raw');
									drag.element.remove();
									drag.element = 0;
								}
							}
						});
						content.off('.drag', '.gap-text-solution').on('mousedown.drag touchstart.drag', '.gap-text-solution', function(event)
						{
							event.preventDefault();
							drag.raw = $(event.target);
							drag.element = drag.raw.clone();
							drag.element.addClass('float').css({width: drag.w = drag.raw.outerWidth(), height: drag.h = drag.raw.outerHeight(), top: drag.y = (event.getY() - drag.raw.outerHeight() / 2 - page.scrollTop()), left: drag.x = (event.getX() - drag.raw.outerWidth() / 2)}).appendTo('body');
							if (drag.raw.parent().is(drag.destination))
							{
								drag.raw = $('<div>', {class: 'gap-text-solution'}).text(drag.raw.text()).appendTo(drag.source);
								$(event.target).replaceWith($('<div>', {class: 'gap-text-gap'}));
							}
							drag.raw.addClass('raw');
						});
						break;
				}
				break;
			case 'table':
				content.append($('<table>').append($('<thead>').append($('<tr>').append(function()
				{
					var ths = [];
					for(var col in element.content.head)
					{
						ths.push($('<th>').text(element.content.head[col]));
					}
					return ths;
				})), $('<tbody>').append(function()
				{
					var trs = [];
					for(var row in element.content.body)
					{
						trs.push($('<tr>').append(function()
						{
							var tds = [];
							for (var col in element.content.body[row])
							{
								tds.push($('<td>').html(element.content.body[row][col].type == 'answer' ? $('<input>', {type: 'text', placeholder: 'Antwort eingeben'}).on('change', function()
								{
									element.answers = [];
									$(this).parents('tbody').find('input[type=text]').each(function(i)
									{
										element.answers.push($(this).val());
									});
								}) : element.content.body[row][col].text));
							}
							return tds;
						}));
					}
					return trs;
				})));
				break;
			default:
				return null;
				break;
		}
		return content;
	}
	render()
	{
		if (!this.startTime)
		{
			this.startTime = +(new Date);
		}
		var content = $('#exercise-content').removeClass('scroll').removeAttr('style').empty();
		for(var i in this.content)
		{
			if (i >= this.page)
			{
				if (this.content[i].type === 'text')
				{
					if (i > this.page)
					{
						break;
					}
					else
					{
						this.speed = this.content[i].speed;
						var text = new Text({
							exercise: this,
							element: $('<div>').appendTo(content),
							data: this.content[i].text.split(/\s+/),
							technique: parseInt(this.content[i].technique || 0, 10),
							endHandler: (function()
							{
								++this.page;
								this.render();
							}).bind(this),
						});
						text.render();
						return;
					}
				}
				content.append(this.element(this.content[i]));
			}
		}
		if (this.page >= this.content.length)
		{
			if (this.endHandler)
			{
				$('#exercise-page').hide();
				this.endHandler();
				return;
			}
		}
		page.init();
		$('#exercise-page').show().children().show().addRipple().off('click').on('click', function(self)
		{
			return function(event)
			{
				var delta = parseInt($(this).attr('delta'), 10);

				if (delta > 0)
				{
					var prev_page = self.page;
					self.page = self.content.length;
					for(var i in self.content)
					{
						if (i > prev_page)
						{
							if (self.content[prev_page] && (self.content[i].type === 'text') !== (self.content[prev_page].type === 'text'))
							{
								self.page = i;
								break;
							}
						}
					}
					self.render();
				}
				if (delta < 0)
				{
					var prev_page = self.page;
					self.page = 0;
					for(var i = prev_page; i--;)
					{
						if (self.content[prev_page] && (self.content[i].type === 'text') !== (self.content[prev_page].type === 'text'))
						{
							self.page = i;
							break;
						}
					}
					self.render();
				}
			};
		} (this)).first().toggle(!!this.page);
		content.addClass('scroll').css({height: $('#sheet').height() - $('#exercise-controls').outerHeight()});
	}
	answers()
	{
		var answers = [];
		var values_iterative = function(array)
		{
			for(var c in array)
			{
				var value = null;
				switch(array[c].type)
				{
					case 'question':
						value = array[c].answer;
						break;
					case 'gap-text': case 'table':
						value = array[c].answers;
						break;
					case 'divider':
						values_iterative(array[c].content);
						continue;
						break;
					case 'speech':
						value = array[c].answer;
						break;
					default:
						break;
				}
				if (value === undefined)
				{
					value = null;
				}
				answers.push(value);
			}
		};
		values_iterative(this.content);
		return answers;
	}
	score()
	{
		var score = 0;
		var count = 0;
		for(var c in this.content)
		{
			if (this.content[c].score || this.content[c].type === 'question')
			{
				score = ((score * count) + (this.content[c].score || 0)) / (count + 1);
				++count;
			}
		}
		return score;
	}
	record()
	{
		if (this.recording)
		{
			ajax({data: 'count_exercise', training: this.type || page.url().split('/')[1]});
			var record_stop = function()
			{
				if (typeof window.recordSync !== 'undefined')
				{
					clearInterval(window.recordSync);
				}
			};
			var syncTime = +(new Date);
			var startTime = syncTime;
			var syncing = false;
			var syncInterval = 2e3;

			page.intervals.push(window.recordSync = setInterval((function()
			{
				if (syncing || !page.focus || (+(new Date) - syncTime) < syncInterval)
				{
					return;
				}
				syncing = true;

				var timedelta = +(new Date) - syncTime;
				var startdelta = (new Date()).getTime() - startTime;
				var f = function(data)
				{
					syncTime = +(new Date);
					syncing = false;
					ajaxDone(data || '');
				};

				if (!this.type || this.type != 'custom-exercise')
				{
					if (this.speed)
					{
						this.speed.average = (syncTime == startTime) ? this.speed.current : ((this.speed.average * (startdelta - timedelta) + this.speed.current * timedelta) / startdelta);
					}
					if (this.recording && !this.isPaused)
					{
						return ajax({data: 'record', training: this.type || page.url().split('/')[1], speed: this.speed ? this.speed.current : 0, timedelta: Math.round(timedelta / 100) / 10, suffix: this.suffix || ''}).done(f);
					}
				}
				else if (this.type)
				{
					var data = {data: 'record', training: this.type, timedelta: Math.round(timedelta / 100) / 10};
					if (this.type == 'custom-exercise')
					{
						data.exercise_url = page.url().split('/').slice(-1)[0];
					}
					return ajax(data).done(f);
				}
				f();
			}).bind(this), 500));
		}
		return this;
	}
};

class Text
{
	constructor(options)
	{
		this.exercise = null;
		this.data = [];
		this.endHandler = undefined;
		this.element = $();
		this.lineHeight = 23;
		this.recent = {x: 0, y: 0};
		this.technique = 0;
		this.resized = false;
		this.startTimeOffset = -1;
		this.word = {
			prev: -1,
			current: 0,
			next: 0,
		};
		for(var o in options)
		{
			if (o in this)
			{
				this[o] = options[o];
			}
			else
			{
				console.error('unknown text option:', o);
			}
		}

		this.exercise.word = this.word;

		this.attachEventListeners();
	}
	attachEventListeners()
	{
		$('#exercise-play-pause').off('click').on('click', this.playPause.bind(this));
		var set_slider_value = (function()
		{
			if (this.exercise.speed)
			{
				this.exercise.speed.current = Math.max(Math.min(this.exercise.speed.max, this.exercise.speed.current), this.exercise.speed.min);
				$('#exercise-speed-progress').css({width: ((this.exercise.speed.current - this.exercise.speed.min) / (this.exercise.speed.max - this.exercise.speed.min) * 100) + '%'});
				$('#exercise-speed-slider b').html(this.exercise.speed.current);
			}
		}).bind(this);
		set_slider_value();
		var calculate_speed = (function(event)
		{
			var percentage = (event.getX() - $('#exercise-speed-bar').offset().left) * 100 / parseInt($('#exercise-speed-bar').outerWidth(), 10);
			this.exercise.speed.current = (Math.round(this.exercise.speed.min / 10 + percentage * (this.exercise.speed.max - this.exercise.speed.min) / 1e3) * 10);
			$('#exercise-speed-slider').addClass('drag');
			set_slider_value();
		}).bind(this);
		$('#exercise-skip').off('click').on('click', (function()
		{
			this.word.current = this.data.length;
		}).bind(this));
		$('#exercise-speed').off('.exercise').on('mousedown.exercise touchstart.exercise', calculate_speed);
		$(document).off('.exercise').on('mousemove.exercise touchmove.exercise', function(event)
		{
			if ($('#exercise-speed-slider').hasClass('drag'))
			{
				calculate_speed(event);
			}
		}).on('mouseup.exercise touchend.exercise', function(event)
		{
			$('#exercise-speed-slider.drag').removeClass('drag');
		}).on('mousewheel.exercise', $.proxy(function(event)
		{
			if (this.exercise.speed)
			{
				this.exercise.speed.current -= Math.round('wheelDelta' in event.originalEvent ? event.originalEvent.wheelDelta / -120 : event.originalEvent.detail) * 10;
				set_slider_value();
			}
		}, this)).on('keydown.exercise', $.proxy(function(event)
		{
			if (event.which == 32 && $('#exercise-play-pause').is(':visible'))
			{
				this.playPause();
			}
		}, this));
		$(window).off('.exercise').on('resize.exercise', (function()
		{
			this.resized = true;
		}).bind(this)).on('blur.exercise', (function(event)
		{
			this.pause();
		}).bind(this)).on('focus.exercise', (function(event)
		{
			this.play();
		}).bind(this));
		$('#exercise-page > div').addRipple().off('click').on('click', function(self)
		{
			return function(event)
			{
				var maxHeight = ($('#sheet').height() || 0) - ($('#exercise-controls:visible').outerHeight() || 0);
				var content = $('#exercise-content > div:first-child').empty();
				var delta = parseInt($(this).attr('delta'), 10);
				if (delta == -1 && self.word.current < 1)
				{
					delta = 0;
				}
				switch(delta)
				{
					case -1:
						var nextCache = self.word.next = self.word.current;
						while(content.outerHeight() < maxHeight && (self.word.next -= 50) > -50)
						{
							content.prepend(self.data.slice(Math.max(0, self.word.next), self.word.next + 50).join(' ') + ' ');
						}
						self.word.next = Math.max(0, self.word.next);
						while(content.outerHeight() > maxHeight && ++self.word.next < self.data.length)
						{
							content.html(self.data.slice(self.word.next, self.word.current).join(' ') + ' ');
						}
						self.word.current = self.word.next;
						self.word.prev = self.word.current;
						self.word.next = nextCache;
						break;
					case 0:
						self.word.next = Math.max(0, self.word.current);
					default:
						if (self.word.next >= self.data.length)
						{
							self.word.prev = self.word.current = self.word.next = self.data.length;
							$('#exercise-page div').last().hide();
							$('#exercise-content > div:first-child').empty().append($('<div>', {class: 'text-button'}).css({display: 'block', margin: '0 auto'}).append($('<a>').addRipple().html('<div class="center end"><i class="icon">&#xE047;</i></div>').on('click', function()
							{
								self.element = null;
								if (self.endHandler)
								{
									self.endHandler();
								}
							}), '<span class="text-label">Fertig?</span>'));
							return;
						}
						else
						{
							self.word.current = self.word.next;
						}
						break;
				}
				$('#exercise-page div').first().toggle(self.word.current > 0).next().show();
			};
		} (this));
	}
	play()
	{
		if (this.exercise.isPaused)
		{
			this.exercise.startTime += +(new Date) - this.exercise.isPaused;
			this.exercise.isPaused = 0;
		}
		$('#exercise-play-pause').attr('standee', 'Pause').children('i').html('&#xE036;');
	}
	pause()
	{
		this.exercise.isPaused = +(new Date);
		$('#exercise-play-pause').attr('standee', 'Play').children('i').html('&#xE039;');
	}
	playPause()
	{
		if (this.exercise.isPaused)
		{
			this.play();
		}
		else
		{
			this.pause();
		}
	}
	render()
	{
		if (!this.element)
		{
			return;
		}
		if (this.startTimeOffset === -1)
		{
			this.startTimeOffset = -this.exercise.startTime;
			if (this.technique)
			{
				this.element.after($('<div>', {class: 'exercise-shape'}));
				if (this.technique & 16)
				{
					this.element.siblings('.exercise-shape').css({margin: 0, borderRadius: 0, opacity: .5, background: 'none', filter: 'brightness(0) invert(1)', '-webkit-filter': 'brightness(0) invert(1)'});
				}
			}
			$('#exercise-controls').show();
			$('#exercise-speed').toggle((this.technique || false) && (this.exercise.speed.max > this.exercise.speed.min || false));
			$('#exercise-page').toggle(!(this.technique || false)).children().first().hide();
			this.element.css({lineHeight: this.lineHeight + 'px', textAlign: 'justify'});
			this.play();
		}
		if (!this.element.length)
		{
			return setTimeout(this.render.bind(this), 50);
		}
		if (this.resized)
		{
			this.word.prev = -1;
			this.word.next = this.word.current;
			switch(this.technique)
			{
				case 8: // technique 4
					this.element.toggleClass('two-col', $(window).width() > 540);
					break;
				case 16: // technique 5
					this.element.siblings('.exercise-shape').css({width: this.element.outerWidth(), height: this.element.outerHeight()});
					break;
			}
		}
		if (this.word.current !== this.word.prev)
		{
			this.element.empty();
			if (this.word.current < this.data.length)
			{
				var i = this.word.current, maxHeight = $('#sheet').height() - ($('#exercise-controls:visible').outerHeight() || 0);
				while(this.element.outerHeight() < maxHeight && (this.word.next += 50) < this.data.length + 50)
				{
					this.element.append(this.data.slice(this.word.next - 50, Math.min(this.data.length, this.word.next)).join(' ') + ' ');
				}
			}
			if (this.word.current >= this.data.length)
			{
				this.recording = false;
				this.word.prev = this.word.current = this.data.length;
				this.element.removeClass('two-col');
				$('#exercise-speed, #exercise-skip').hide();
				$('#exercise-page').show();
				$('#sheet .exercise-shape').remove();
				if (this.endHandler)
				{
					this.endHandler();
				}
			}
			while((this.element.outerHeight() > maxHeight || (this.technique == 4 && Math.round(this.element.outerHeight() / this.lineHeight) % this.parameters)) && --this.word.next > 0)
			{
				this.element.html(this.data.slice(i, this.word.next).join(' '));
			}
			this.word.prev = this.word.current;
		}

		if (this.technique)
		{
			var timestamp = this.exercise.isPaused || +(new Date);
			var delta = timestamp - this.exercise.startTime - this.startTimeOffset;
			if (delta < 0 || (this.exercise.speed.current != this.exercise.speed.prev))
			{
				if (this.exercise.speed.prev > 0 && this.exercise.speed.current != this.exercise.speed.prev)
				{
					this.exercise.startTime = timestamp - delta * this.exercise.speed.prev / this.exercise.speed.current - this.startTimeOffset;
				}
				else
				{
					this.exercise.startTime = timestamp - this.startTimeOffset;
				}
				delta = timestamp - this.exercise.startTime - this.startTimeOffset;
			}
			this.exercise.speed.prev = this.exercise.speed.current;
			var height = this.element.height();
			var x;
			var y;

			var deltaCache = delta /= 1e3 * (this.word.next - this.word.current) * 60 / this.exercise.speed.current / (height / this.lineHeight) / 2;

			switch(this.technique)
			{
				case 1: // serpentine
					var	xi = .01; //x-interpolation
					var yi = .06; // y-interpolation
					delta *= (height / this.lineHeight) / (height / this.lineHeight - .92); // fake additional line
					x = (Math.min(.5 - xi, Math.max(xi, Math.abs(((delta / 4 + .5) % 1) - .5))) - xi) / (1 - 4 * xi) * 2;
					y = Math.min(height, (Math.max(0, Math.floor((delta - yi) / 2)) + Math.max(0, (Math.abs(((delta - yi) / 2) % 1) - 1 + yi) / yi)) * this.lineHeight);
					break;
				case 2: // infinity
					var	xi = .5; // x-interpolation
					var yi = .25; // y-interpolation
					x = ((1 - Math.sin(delta * Math.PI)) * xi + Math.abs((delta / 2 + .25) % 1 - .5) * 4 * (1 - xi)) / 2;
					y = (Math.max(0, (Math.floor(delta / 2 - yi / 2)) + Math.max(0, (Math.abs((delta / 2 - yi / 2) % 1) - 1 + yi) / yi)) + Math.sin(delta * Math.PI * 2) * .5 + .5) * this.lineHeight;
					break;
				case 4: // technique 3
					var lineCount = parameters;
					delta *= (height / this.lineHeight) / (height / this.lineHeight - lineCount * .8); // fake additional lines (speed adjustment)
					x = .5 * (1 - Math.sign(Math.abs(delta / lineCount + 3) % 4 - 2) * (1 - Math.pow(Math.abs((delta / lineCount + 1) % 2 - 1), 1.6)));
					y = Math.min(height, Math.max(0, lineCount * Math.floor(delta / lineCount / 2) + (Math.round(delta / lineCount + 1) % 2) * lineCount * (Math.round(delta / lineCount - .5) % 2 - Math.pow(Math.cos((delta + lineCount / 2) * Math.PI / 2 / lineCount), 2))) * this.lineHeight);
					break;
				case 8: // technique 4
					if (this.element.hasClass('two-col'))
					{
						x = Math.round(delta / 2 * this.lineHeight / height) / 2 + .25;
						y = (delta * this.lineHeight) % height;
					}
					else
					{
						x = .5;
						y = delta * this.lineHeight / 2;
					}
					break;
				case 16: // triangulation
					x = 0; y = 0;
					var w = this.element.outerWidth(), b = 'px inset #fff', css;
					if (delta * this.lineHeight < (height * 4 / 5))
					{
						css = {border: 'none'};
					}
					else if (delta * this.lineHeight < (height * 6 / 5))
					{
						css = {borderRight: w + b, borderBottom: height / 2 + b, borderLeft: 0 + b, borderTop: height / 2 + 'px inset transparent'};
					}
					else if (delta * this.lineHeight < (height * 8 / 5))
					{
						css = {borderRight: w + 'px inset transparent', borderBottom: height / 2 + b, borderLeft: 0 + b, borderTop: height / 2 + b};
					}
					else
					{
						css = {borderRight: w + b, borderBottom: height / 2 + 'px inset transparent', borderLeft: 0 + b, borderTop: height / 2 + b};
					}
					this.element.siblings('.exercise-shape').css(css);
					break;
				case 32: // technique 6
					delta *= (height / this.lineHeight) / (height / this.lineHeight - 1); // fake additional line
					x = Math.abs((delta / 4 + .5) % 1 - .5) * 2;
					y = (delta - 1) * this.lineHeight / 2;
					break;
				case 64:
					//if (Math.round(this.element.outerHeight() / this.lineHeight) % 3 == 1) one additional infinity-line
					//if (Math.round(this.element.outerHeight() / this.lineHeight) % 3 == 2) one additional infinity-line and one additional s-technique-line

					var combination = 1;
					var currentLine = Math.floor(delta / 2);

					combination = Math.floor(3 * currentLine / Math.round(height / this.lineHeight));

					switch(combination)
					{
						case 0: // s-technique
							var	xi = .01; //x-interpolation
							var yi = .06; // y-interpolation

							delta *= (height / this.lineHeight) / (height / this.lineHeight - 1.3);
							x = (Math.min(.5 - xi, Math.max(xi, Math.abs(((delta / 4 + .5) % 1) - .5))) - xi) / (1 - 4 * xi) * 2;
							y = Math.min(height, (Math.max(0, Math.floor((delta - yi) / 2)) + Math.max(0, (Math.abs(((delta - yi) / 2) % 1) - 1 + yi) / yi)) * this.lineHeight);
							break;
						case 1: // vertical dot
							x = .5;
							y = delta * this.lineHeight / 2;
							break;
						case 2: // infinity-technique
							var	xi = .5, // x-interpolation
								yi = .25; // y-interpolation
							x = ((1 - Math.sin(delta * Math.PI)) * xi + Math.abs((delta / 2 + .25) % 1 - .5) * 4 * (1 - xi)) / 2;
							y = (Math.max(0, (Math.floor(delta / 2 - yi / 2)) + Math.max(0, (Math.abs((delta / 2 - yi / 2) % 1) - 1 + yi) / yi)) + Math.sin(delta * Math.PI * 2) * .5 + .5) * this.lineHeight;
							break;
					}
					break;
			}
			if (deltaCache * this.lineHeight > (height * 2))
			{
				this.startTimeOffset = +(new Date) - this.exercise.startTime;
				this.word.current = this.word.next;
			}
			if (x !== null || y !== null)
			{
				this.element.siblings('.exercise-shape').css({left: this.element.position().left + x * this.element.outerWidth(), top: this.element.position().top + y, display: 'block'});
			}
			this.recent = {x: x, y: y};
		}
		if (this.resized)
		{
			this.resized = false;
		}
		window.requestAnimationFrame(this.render.bind(this));
	}
}

class Microphone
{
	constructor(max_duration)
	{
		this.chunks = [];
		this.waveform = [];
		this.analyser = null;
		this.media_recorder = null;
		this.frequency_data = null;
		this.timestamp = 0;
		this.canvas = null;
		this.max_duration = max_duration * 60e3;
	}
	start()
	{
		if (this.timestamp)
		{
			this.stop();
		}
		this.chunks = [];
		this.waveform = [];
		return navigator.mediaDevices.getUserMedia({audio: true}).then((function(stream)
		{
			var audio_context = new (window.AudioContext || window.webkitAudioContext)();
			this.media_recorder = new MediaRecorder(stream);

			this.analyser = audio_context.createAnalyser();
			this.analyser.fftSize = 256;
			this.frequency_data = new Uint8Array(this.analyser.frequencyBinCount);

			audio_context.createMediaStreamSource(stream).connect(this.analyser);
			this.media_recorder.ondataavailable = (function(event)
			{
				if (this.chunks)
				{
					this.chunks.push(event.data);
				}
			}).bind(this);
			this.media_recorder.start();
			this.timestamp = new Date;
			this.render();
		}).bind(this));
	}
	stop()
	{
		this.timestamp = 0;
		if (this.media_recorder && this.media_recorder.state === 'recording')
		{
			this.media_recorder.stop();
		}
	}
	answer(item)
	{
		if (!this.chunks.length)
		{
			setTimeout(this.answer.bind(this, item), 100);
		}
		var reader = new FileReader();
		reader.onloadend = function()
		{
			item.answer = reader.result;
		}
		reader.readAsDataURL(new Blob(this.chunks, {type: 'audio/ogg'}));
	}
	render()
	{
		if (this.timestamp)
		{
			setTimeout(this.render.bind(this), 200);

			this.analyser.getByteFrequencyData(this.frequency_data);
			var scale = Math.max(window.devicePixelRatio, 1);
			var ctx = this.canvas.show().attr('width', Math.round(this.canvas[0].getBoundingClientRect().width * scale)).attr('height', Math.round(this.canvas[0].getBoundingClientRect().height * scale))[0].getContext('2d');

			var width = ctx.canvas.width;
			var height = ctx.canvas.height;
			var x = ((new Date) - this.timestamp) / this.max_duration;
			if (x > 1)
			{
				this.stop();
			}
			if (!this.waveform.length || x - this.waveform[this.waveform.length - 1][0] > 0.001)
			{
				this.waveform.push([x, Math.pow(this.frequency_data[0] / 256, 2)]);
			}
			var gradient = ctx.createLinearGradient(0, 0, 0, height);
			gradient.addColorStop(  0, page.css['color.tertiary']);
			gradient.addColorStop(0.3, page.css['color.primary']);
			gradient.addColorStop(0.7, page.css['color.primary']);
			gradient.addColorStop(  1, page.css['color.tertiary']);
			ctx.fillStyle = ctx.strokeStyle = gradient;
			ctx.beginPath();
			ctx.moveTo(0, height / 2);
			for(var w = 0; w < this.waveform.length; ++w)
			{
				ctx.lineTo(width * this.waveform[w][0], height * (1 - this.waveform[w][1]) / 2);
			}
			ctx.lineTo(width * this.waveform[this.waveform.length - 1][0], height / 2);
			ctx.lineTo(width, height / 2);
			ctx.lineTo(width * this.waveform[this.waveform.length - 1][0], height / 2);
			for(var w = this.waveform.length; w--;)
			{
				ctx.lineTo(width * this.waveform[w][0], height * (1 + this.waveform[w][1]) / 2);
			}
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		}
	}
}