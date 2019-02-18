var chart = {
	greyDark: (typeof page !== 'undefined' && 'css' in page) ? page.css['color.greyDark'] : '#455a64',
	greyLight: (typeof page !== 'undefined' && 'css' in page) ? page.css['color.greyLight'] : '#dfe4e6',
  getSet: function(options, index, ctx) {
    var set = ($.extend ? $.extend : $.merge)({type: 'line', data: 0, color: (typeof page !== 'undefined' && 'css' in page) ? {0: page.css['color.primaryLight'], 0.5: page.css['color.primary'], 1: page.css['color.primaryDark']} : this.greyDark, unit: '', padding: {t: 28, r: 28, b: 18, l: 24}, ranges: [[Number.MAX_VALUE, Number.MIN_VALUE], [Number.MAX_VALUE, Number.MIN_VALUE]], standee: 1, dashed: 0, interpolation: .5, easeIn: 1, total: false}, options);
		set.unit = set.unit ? ' ' + set.unit : '';
		for(var i in set.data) set.ranges = [[Math.min(i, set.ranges[0][0]), Math.max(i, set.ranges[0][1])], [Math.min(parseFloat(set.data[i].value) || 0, set.ranges[1][0]), Math.max(parseFloat(set.data[i].value) || 0, set.ranges[1][1])]];
		if (set.total !== false) set.ranges[1][1] = set.total;
		set.ranges[1][0] = 0;
		ctx.textBaseline = 'middle';
		ctx.font = '12px "Open Sans"';
    set.bottom = 0;
		for(var i in set.data) set.bottom = Math.max(set.bottom, ctx.measureText(set.data[i].label).width);
		set.padding.b += set.bottom;

		var scaleDelta = .1;
		set.yAxis = [];
		while((set.ranges[1][1] - set.ranges[1][0]) / scaleDelta > 11) scaleDelta *= 10;
		if ((set.ranges[1][1] - set.ranges[1][0]) / scaleDelta < 5) scaleDelta /= 2;
		for(var i = set.ranges[1][0]; i <= set.ranges[1][1]; i += scaleDelta) set.yAxis.push(Math.round(i * 1e9) / 1e9 + set.unit.replace(/<i.+\/i>/i, ''));

		set.left = 0;
		for(var i in set.yAxis) set.left = Math.max(set.left, ctx.measureText(set.yAxis[i]).width);
		set.padding.l += set.left;

		if ((set.easeInState = (set.easeInState || +ctx.canvas.getAttribute('easeInState') || (set.easeIn ? 0 : 1))) !== 1 && set.easeIn) {
			set.easeInState = Math.min(1, set.easeInState + 1 / set.easeIn / 60);
			if (index == 0) ctx.canvas.setAttribute('easeInState', set.easeInState);
		}
		return set;
  },
	getX: function(w, v, set) {
		return Math.round((w - set.padding.l - set.padding.r - (set.barWidth || 0)) * (set.ranges[0][1] - set.ranges[0][0] ? (v - set.ranges[0][0]) / (set.ranges[0][1] - set.ranges[0][0]) : 0) + set.padding.l + (set.barWidth || 0) / 2);
	},
	getY: function(h, v, set) {
		return Math.round(h - (h - set.padding.t - set.padding.b) * ((parseFloat(v) || 0) - set.ranges[1][0]) / (set.ranges[1][1] - set.ranges[1][0]) - set.padding.b);
	},
	draw: function(canvas, options, easeInCall) {
		if (!canvas) return;
		var easeInState = canvas.getAttribute('easeInState');
		if (!(easeInCall || !easeInState || easeInState == 1)) return;
		var scale = Math.max(window.devicePixelRatio, 1);
		$(canvas).attr('width', Math.round(canvas.getBoundingClientRect().width * scale)).attr('height', Math.round(canvas.getBoundingClientRect().height * scale));
		var w = canvas.width / scale,
			h = canvas.height / scale,
			ctx = canvas.getContext('2d'),
			prev = null,
			sets = {}, r, set, totalranges, angle, totalAngle;
		ctx.scale(scale, scale);
		function getColor(i) {
			var color = (i ? set.data[i].color : 0) || set.color;
			if (typeof color === 'object') {
				var gradient = ctx.createLinearGradient(0, 0, 0, h - set.padding.b);
				for(var i in color) gradient.addColorStop(i, color[i]);
				return gradient;
			}
			return color;
		}
		for(var o in options) {
			set = sets[o] = this.getSet(options[o], o, ctx);
			if (['pie', 'donut'].indexOf(set.type) > -1) {
				ctx.strokeStyle = '#fff';
				ctx.lineWidth = 2;
				r = Math.min(w, h) / 2;
				totalAngle = Math.PI / -2;
				for(var i in set.data) {
					ctx.beginPath();
					ctx.fillStyle = set.data[i].color || set.color;
					angle = 2 * Math.PI * set.data[i].value / (set.total === false ? 1 : set.total) * this.easeInOutExpo(set.easeInState);
					ctx.moveTo(w / 2, h / 2);
					ctx.arc(w / 2, h / 2, r, totalAngle, totalAngle += angle);
					ctx.lineTo(w / 2, h / 2);
					ctx.fill();
					ctx.stroke();
				}
				if (set.type === 'donut') {
					ctx.beginPath();
					ctx.fillStyle = '#fff';
					ctx.arc(w / 2, h / 2, r / 2, 0, 2 * Math.PI);
					ctx.fill();
					if (set.total !== false) {
						ctx.strokeStyle = '#fff';
						ctx.fillStyle = getColor();
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.font = '700 30px "Open Sans"';
						ctx.strokeText(set.total, Math.round(w / 2), h / 2);
						ctx.fillText(set.total, Math.round(w / 2), h / 2);
					}
				}
				continue;
			} else if (set.type === 'bar') {
				set.barWidth = Math.min(50, Math.round((w - set.padding.l - set.padding.r) / Object.keys(set.data).length / 2) * 2);
			}
			if (prev !== null) {
				set.padding = sets[prev].padding;
				totalranges = [[Math.min(totalranges[0][0], set.ranges[0][0]), Math.max(totalranges[0][1], set.ranges[0][1])], [Math.min(totalranges[1][0], set.ranges[1][0]), Math.max(totalranges[1][1], set.ranges[1][1])]];
			} else totalranges = set.ranges;
			prev = 0;
		}
		if (prev !== null) {
			set = sets[0];
			ctx.beginPath();
			var recentAxis = 0;
			ctx.textAlign = 'right';
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 3;
			for(var i in set.yAxis) {
				var getY = chart.getY(h, parseFloat(set.yAxis[i]), set);
				if (Math.abs(getY - recentAxis) > 12 || 1) {
					ctx.fillStyle = i > 0 ? this.greyLight : this.greyDark;
					ctx.fillRect((set.padding.l - set.left) / 2 + set.left, getY, w, 1);
					ctx.fillStyle = this.greyDark;
					ctx.strokeText(set.yAxis[i], set.left, getY);
					ctx.fillText(set.yAxis[i], set.left, getY);
					recentAxis = getY;
				}
			}
			ctx.beginPath();
			recentAxis = 0;
			for(var i in set.data) {
				var getX = chart.getX(w, i, set);
				if (Math.abs(getX - recentAxis) > 12) {
					ctx.save();
					ctx.translate(getX, h - set.bottom);
					ctx.rotate(Math.PI / -2);
					ctx.strokeText(set.data[i].label, 0, 0);
					ctx.fillText(set.data[i].label, 0, 0);
					ctx.restore();
					recentAxis = getX;
				}
			}
			for(var s in sets) {
				sets[s].ranges = totalranges;
				set = sets[s];
				if (set.data && Object.keys(set.data).length) {
					ctx.moveTo(set.padding.l, chart.getY(h, set.data[set.ranges[0][0]].value, set));
					ctx.beginPath();
					switch(set.type) {
						case 'bar':
							ctx.lineWidth = Math.max(2, set.barWidth - 10);
							for(var i in set.data) {
								ctx.beginPath();
								var getX = chart.getX(w, i, set);
								ctx.moveTo(getX, Math.min(h - set.padding.b - 2, chart.getY(h, set.data[i].value * this.easeInOutExpo(set.easeInState), set)));
								ctx.lineTo(getX, h - set.padding.b);
								ctx.strokeStyle = getColor(i);
								ctx.stroke();
							}
							break;
						case 'line': default:
							var points = [], interpolated = [], minY = chart.getY(h, 0, set), a, b, c, d, step;
							for(var i in set.data) for(var n = -1; n < (set.ranges[0].indexOf(parseInt(i, 10)) > -1); ++n) {
								points.push(chart.getX(w, i, set));
								points.push(chart.getY(h, set.data[i].value * this.easeInOutExpo(set.easeInState), set));
							}
							ctx.strokeStyle = getColor();
							ctx.lineWidth = 2;
							for(var i = 2, n = 0; i <= (points.length - 2); i += 2) {
								if (i / 2 == set.dashed) {
									ctx.stroke();
									ctx.lineDashOffset = (i > 2) * 12;
									ctx.setLineDash([9, 13]);
									ctx.beginPath();
								}
								for(var t = 0, segments = w * scale / (points.length - 2) / 2; t <= segments; ++t, ++n) {
									step = t / segments;

									a = 2 * Math.pow(step, 3) - 3 * Math.pow(step, 2) + 1;
									b = -(2 * Math.pow(step, 3)) + 3 * Math.pow(step, 2);
									c = Math.pow(step, 3) - 2 * Math.pow(step, 2) + step;
									d = Math.pow(step, 3) - Math.pow(step, 2);

									interpolated.push([a * points[i] + b * points[i + 2] + c * (points[i + 2] - points[i - 2]) * set.interpolation + d * (points[i + 4] - points[i]) * set.interpolation, Math.min(minY, a * points[i + 1] + b * points[i + 3] + c * (points[i + 3] - points[i - 1]) * set.interpolation + d * (points[i + 5] - points[i + 1]) * set.interpolation)]);
									ctx.lineTo(interpolated[n][0], interpolated[n][1]);
								}
							}
							ctx.stroke();
							ctx.setLineDash([]);

							if (set.fill) {
								ctx.beginPath();
								for(var i in set.data);
								ctx.moveTo(chart.getX(w, i, set), chart.getY(h, 0, set));
								ctx.lineTo(chart.getX(w, 0, set), chart.getY(h, 0, set));
								for(var i = 0; i < interpolated.length; ++i) ctx.lineTo(interpolated[i][0], interpolated[i][1]);
								ctx.fillStyle = set.fill;
								ctx.fill();
							}

							ctx.fillStyle = '#fff';
							for(var i in set.data) if (!set.dashed || (set.dashed - 1) > i) {
								ctx.beginPath();
								ctx.arc(chart.getX(w, i, set), chart.getY(h, set.data[i].value * this.easeInOutExpo(set.easeInState), set), 3, 0, 2 * Math.PI);
								ctx.fill();
								ctx.stroke();
							}
							break;
					}
					if (!set.standee) {
						ctx.beginPath();
						ctx.textAlign = 'center';
						ctx.strokeStyle = '#fff';
						ctx.lineWidth = 3;
						for(var i in set.data) {
							ctx.fillStyle = getColor(i);
							var getX = chart.getX(w, i, set), getY = chart.getY(h, set.data[i].value * this.easeInOutExpo(set.easeInState), set) - 16;
							ctx.strokeText(set.data[i].value + set.unit, getX, getY);
							ctx.fillText(set.data[i].value + set.unit, getX, getY);
						}
					}
				}
			}
		}
		canvas.checksum = canvas.checksum || Math.random();
		if (set.easeIn && set.easeInState != 1) setTimeout(function(canvas, options, checksum) {
			return function() {
				if (canvas.width * canvas.height * canvas.checksum === checksum) chart.draw(canvas, options, 1);
			};
		} (canvas, options, canvas.width * canvas.height * canvas.checksum), 1e3 / 60);
		else canvas.setAttribute('easeInState', 1);

		if (0 in sets && sets[0].standee) $(canvas).off('.chart').on('mousedown.chart', function(event) {
			event.stopPropagation();
		}).on('mousedown.chart mouseenter.chart mousemove.chart touchstart.chart', function(options) {
			return function(event, position) {
				var scale = Math.max(window.devicePixelRatio, 1);
				if (position) {
					event.pageX = position.x;
					event.pageY = position.y;
				}
				var x = event.getX() - $(this).offset().left,
					y = event.getY() - $(this).offset().top,
					canvas = this,
					w = canvas.width,
					h = canvas.height,
					ctx = canvas.getContext('2d');
				ctx.scale(scale, scale);
				for(var s in sets) {
					set = sets[s];
					if (set.data && Object.keys(set.data).length) {
						var distance = w * h, nearest = undefined, tmpDist, getX, getY;
						switch(set.type) {
							case 'bar':
								for(var i in set.data) if ((tmpDist = Math.abs(chart.getX(w / scale, i, set) - x)) < distance) {
									distance = tmpDist;
									nearest = i;
								}
								break;
							case 'line': default:
								for(var i in set.data) if ((tmpDist = Math.sqrt(Math.pow(chart.getX(w / scale, i, set) - x, 2) + Math.pow(chart.getY(h / scale, set.data[i].value, set) - y, 2))) < distance) {
									distance = tmpDist;
									nearest = i;
								}
								break;
							case 'pie': case 'donut':
								var r = Math.min(w, h) / 2 / scale,
									full = set.total === false ? 1 : set.total,
									totalAngle = -.25,
									posAngle = (Math.atan((h / 2 / scale - y) / (w / 2 / scale - x)) / 2 / Math.PI + (x < w / 2 / scale ? 0.5 : (y < h / 2 / scale ? 1 : 0)) + .25) % 1 - .25;
								if (Math.sqrt(Math.pow(x - w / 2 / scale, 2) + Math.pow(y - h / 2 / scale, 2)) <= r) for(var i in set.data) {
									if (posAngle > totalAngle && posAngle < totalAngle + set.data[i].value / full) {
										nearest = i;
										getX = w / 2 / scale + Math.cos(2 * Math.PI * (totalAngle + set.data[i].value / 2 / full)) * r * (set.type === 'pie' ? .5 : .75);
										getY = h / 2 / scale + Math.sin(2 * Math.PI * (totalAngle + set.data[i].value / 2 / full)) * r * (set.type === 'pie' ? .5 : .75);
									}
									totalAngle += set.data[i].value / full;
								}
								break;
						}
						if ((i = nearest) === undefined) continue;
						var display = '', matches, standee, color;
						for(var t in sets) if (i in sets[t].data) {
							matches = /^\{(.*)\}$/.exec(sets[t].data[i].value);
							color = sets[t].data[i].color || sets[t].color;
							display += '<br>' + (matches ? matches[1] : ('<i class="icon" style="color:' + (typeof color === 'object' ? color[0.5] : color) + ';">&#xE892;</i> ' + (sets[t].data[i].hoverLabel || sets[t].data[i].label) + ': ' + (['pie', 'donut'].indexOf(sets[o].type) > -1 && set.total === false ? Math.round(sets[t].data[i].value * 1e3) / 10 : sets[t].data[i].value) + sets[t].unit));
						}

						(standee = $(canvas).standee(display.substr(4))).css({top: (getY || chart.getY(h / scale, set.data[i].value, set)) + $(canvas).offset().top - standee.outerHeight() - 8, left: (getX || chart.getX(w / scale, i, set)) + $(canvas).offset().left - standee.outerWidth() / 2 - .5}).on('mouseenter mousemove', function(canvas) {
							return function(event) {
								$(canvas).trigger('mousemove', {x: event.getX(), y: event.getY()});
							};
						} (canvas)).on('mouseleave', function(canvas) {
							return function(event) {
								if (!$(event.toElement || event.relatedTarget).is('canvas')) $(canvas).trigger('mouseleave.chart');
							};
						} (canvas));
						return;
					}
				}
			};
		} (options)).on('mouseleave.chart', function(event) {
			if (!$(event.toElement || event.relatedTarget).hasClass('standee')) setTimeout(function() {
				if (+(new Date) - $('.standee').attr('time') > 100) $('body').standee();
			}, 100);
		});
		return this;
	},
	easeInOutExpo: function(t) {
		if (t === 1) return 1;
		if ((t *= 2) < 1) return Math.pow(2, 10 * (t - 1)) / 2;
		return 1 - Math.pow(2, -10 * (t - 1)) / 2;
	},
}