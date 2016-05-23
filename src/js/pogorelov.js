var _pogorelov = {};
var animationPrefix = (function () {
	var t,
	el = document.createElement("fakeelement");
	var transitions = {
		"WebkitTransition": "webkitAnimationEnd",
		"OTransition": "oAnimationEnd",
		"MozTransition": "animationend",
		"transition": "animationend"
	};
	for (t in transitions) {

		if (el.style[t] !== undefined) {

			return transitions[t];

		}

	}
})(),
transitionPrefix = (function () {
	var t,
	el = document.createElement("fakeelement");
	var transitions = {
		"WebkitTransition": "webkitTransitionEnd",
		"transition": "transitionend",
		"OTransition": "oTransitionEnd",
		"MozTransition": "transitionend"
	};
	for (t in transitions) {

		if (el.style[t] !== undefined) {

			return transitions[t];

		}

	}
})(),
requestAnimFrame = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame    ||
window.oRequestAnimationFrame      ||
window.msRequestAnimationFrame     ||
function( callback ){
	window.setTimeout( callback, 1000 / 60 );
},
bodyOverflow = (function () {
	var $body = $('body'),
		$mainNavigation = $('.main-navigation');
	return {
		fixBody: function () {

			$body.width( $body.width() )
				.addClass('fixed');

			$mainNavigation.width( $body.width() - 80 );

		},
		unfixBody: function () {

			$body
				.css({
					'width': 'auto'
				})
				.removeClass('fixed');

			$mainNavigation.width('');

		},
		resize: function () {

			this.unfixBody();

		}.bind(this)
	};
})();

(function ($) {

$.fn.simpleSlider = function (opt) {

	// options
	if (!opt) {
		opt = {};
	}
	opt = $.extend({
		'loop': true,
		'interval': false,
		'easing': 'swing',
		'prevClass': 'arrow-left-1',
		'nextClass': 'arrow-right-1',
		'holderClass': '.slides-holder',
		'slideClass': '.slide',
		'nameClass': '.slide-name',
		'imageClass': '.slide-image',
		'pagination': false,
		'clickToNext': false,
		'startSlide': 0,
		'autoHeight': false,
		'mouseWheel': false,
		'mouseDrug': false,
		'touch': true,
		'slidesOnPage': 1
	}, opt);

	var plugin = function (i) {

		var DOM = {},
			state = {
				'touchStart': {},
				'touchEnd': {}
			},
			self = this,
			$window = $(window),
			touchendCleaner = function () {
				DOM.$sliderHolder.removeClass('touched');
				state.touchStart.yPos = 0;
				state.touchStart.xPos = 0;
				state.shiftX = 0;
				state.shiftD = 0;
			};

		// methods
		var plg = {
			cacheDOM: function () {
				DOM.$slider = $(self);
				DOM.$section = $(self).closest('section');
				DOM.$preloader = DOM.$slider.find('.slider-preloader');
				DOM.$viewport = DOM.$slider.find('.slider-viewport');
				DOM.$sliderHolder = DOM.$viewport.find('.slider-holder');
				DOM.$slides = DOM.$sliderHolder.find('.slide');
				DOM.$slides.eq(0).addClass('active');
			},
			init: function () {
				state.cur = state.cur || 0;
				state.slides = DOM.$slides.length;
				state.pages = Math.ceil(DOM.$slides.length / opt.slidesOnPage);

				if (this.initialized) return false;

				this.addIdsToSlides();

				if (opt.loop) {

					DOM.$slides.each(function (i) {
						$(this)
							.clone()
							.addClass('cloned')
							.insertBefore( DOM.$slides.eq(0) )
							.clone()
							.appendTo( DOM.$sliderHolder );
					});

					DOM.$slidesAll = DOM.$sliderHolder.find('.slide');

				}
				this.addHandlersToSlides();

				DOM.$preloader.fadeOut(150);
				this.initialized = true;
			},
			addIdsToSlides: function () {
				DOM.$slides.not('.cloned').each(function (i) {
					$(this).attr('data-id', i);
				});
			},
			addHandlersToSlides: function () {
				DOM.$slides.not('.cloned').each(function (i) {
					var $self = $(this);
					$self.find('a').on('click', function (e) {
						if (!$self.hasClass('active')) {
							e.preventDefault();
							if (i > state.cur) {
								plg.nextSlide();
							} else {
								plg.prevSlide();
							}
						}
					});
				});
				DOM.$slidesAll.filter('.cloned').find('a').on('click', function (e) {
					e.preventDefault();
					plg.fakeAnimation( $(this).closest('.slide').data('id') );
				});
			},
			resize: function () {

				state.sliderWidth = DOM.$viewport.width();

				if ($window.width() > 300 && opt.slidesOnPage > 1 && $window.width() <= 700) {

					opt.slidesOnPage = Math.floor( opt.slidesOnPage / 2 );
					plg.init();

				}

				state.itemWidth = DOM.$viewport.width() / opt.slidesOnPage;

				if (opt.loop) {

					DOM.$slidesAll.width( state.itemWidth );

				} else {

					DOM.$slides.width( state.itemWidth );

				}

				if (opt.autoHeight) {

					DOM.$slides.height(

							(function ($slides) {

								var max = 1;

								$slides.each(function () {
									var height = $(this).find('> div').outerHeight();
									if (height > max) {
										max = height;
									}
								});

								return max;

							})(DOM.$slides)

						);

				}

				state.slideWidth = DOM.$slides.eq(0).outerWidth();

				if (opt.loop) {

					state.holderWidth = 3 * state.slides * state.slideWidth;

				} else {

					state.holderWidth = state.slideWidth * state.slides;

				}

				DOM.$sliderHolder.width( state.holderWidth );

				plg.toSlide(state.cur, true);

			},
			prevSlide: function () {

				var id = state.cur - 1;
				if (id < 0) {

					plg.fakeAnimation( state.pages - 1 );

					return;

				}

				plg.toSlide(id);

			},
			nextSlide: function () {

				var id = state.cur + 1;
				if (id >= state.pages) {

					plg.fakeAnimation( 0 );

					return;

				}

				plg.toSlide(id);

			},
			fakeAnimation: function (id) {

				var direction = state.cur > id ? true : false;

				// console.log(state.animated);
				if (state.animated) {
					state.doAfterTransition = function () {
												plg.fakeAnimation(id);
											};
					return;
				}

				DOM.$sliderHolder.addClass('touched');

				if (direction) {

					DOM.$slides.eq(id).addClass('unpressed');
					DOM.$sliderHolder.css({
						'transform': 'translateX( ' + -( state.sliderWidth * (id + state.slides - 1) ) + 'px) translateZ(0)'
					});

				} else {

					DOM.$slides.eq(id).addClass('pressed');
					DOM.$sliderHolder.css({
						'transform': 'translateX( ' + -( state.sliderWidth * (id + state.slides + state.cur + 1) ) + 'px) translateZ(0)'
					});

				}

				setTimeout(function () {

					DOM.$sliderHolder.removeClass('touched');
					DOM.$slides.eq(id).removeClass('pressed unpressed');

					plg.toSlide(id);

				}, $.browser.mobile ? 100 : 40);

			},
			toSlide: function (id, resize) {

				if ( id < 0 || id >= state.pages ) {
					console.warn('id is ' + id);
					return;
				}

				state.cur = id;

				if ( DOM.$sliderHolder.hasClass('touched') || resize ) {

					state.animated = false;

				} else {

					state.animated = true;

				}

				if (opt.loop) {

					DOM.$slidesAll.removeClass('active fake-active');
					DOM.$slidesAll.filter('[data-id="' + id + '"]').each(function () {
						$self = $(this);
						if ($self.hasClass('cloned')) {
							$self.addClass('fake-active');
						} else {
							$self.addClass('active');
						}
					});

				} else {

					DOM.$slides.removeClass('active').eq(id).addClass('active');

				}

				DOM.$pagination.find('.page').eq(id).addClass('active').siblings().removeClass('active');

				// todo add class
				// DOM.$slider.addClass('animated');

				if (opt.loop) {

					DOM.$sliderHolder.css({
						'transform': 'translateX( ' + -( state.sliderWidth * (id + state.slides) ) + 'px) translateZ(0)'
					});

				} else {

					DOM.$sliderHolder.css({
						'transform': 'translateX( ' + -(state.sliderWidth * id) + 'px) translateZ(0)'
					});

				}

			},
			createPagination: function () {

				if (DOM.$pagination) {

					DOM.$pagination.empty();

				} else {

					DOM.$pagination = $('<div>').addClass('paginator-holder');

					if (opt.pagination || true) {

						DOM.$pagination.appendTo(DOM.$slider);

					}

				}

				$('<div>')
					.addClass('prev-slide')
					.appendTo(DOM.$pagination);

				for (var i = 0; i < state.pages / opt.slidesOnPage; i++) {
					var page = $('<div>').data('page', i).addClass('page');

					if (!i) {

						page.addClass('active');

					}

					DOM.$pagination.append(page);
				}

				$('<div>')
					.addClass('next-slide')
					.appendTo(DOM.$pagination);

			},
			getCurrent: function () {
				return state.cur;
			}
		};

		plg.cacheDOM();
		plg.init();
		plg.createPagination();
		plg.resize();

		// resize
		$window.on('resize', function () {
			plg.resize();
		});

		// click events
		DOM.$slider.on('click', function (e) {

			var $target = $(e.target);

			if ($target.hasClass('page')) {

				plg.toSlide($(e.target).data('page'));

			} else if ($target.hasClass('prev-slide')) {

				plg.prevSlide();

			} else if ($target.hasClass('next-slide')) {

				plg.nextSlide();

			} else if (opt.clickToNext && $target.parents('.slide').length) {

				plg.nextSlide();

			}

		});

		if (opt.mouseWheel) {

			DOM.$slider.on('DOMMouseScroll wheel', function (e) {

				e.preventDefault();
				e.stopPropagation();

				var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY;
				if (true || pagesState.lastScrollTime - 50 < new Date().getTime()) {
					if (delta > 0) {

						plg.prevSlide();

					} else if (delta < 0) {

						plg.nextSlide();

					}
				}

			}).on('mousewheel', function (e) {

				e.preventDefault();
				e.stopPropagation();

				var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY;
				if (true || pagesState.lastScrollTime - 50 < new Date().getTime()) {
					if (delta > 0) {

						plg.prevSlide();

					} else if (delta < 0) {

						plg.nextSlide();

					}
				}

			});

		}

		if (opt.touch) {

			// drag events
			DOM.$slider.on('touchstart', function (e) {
				state.touchStart.timeStamp = e.timeStamp;
			}).on('touchmove', function (e) {

				state.touchEnd.xPos = e.originalEvent.touches[0].clientX;
				state.touchEnd.yPos = e.originalEvent.touches[0].clientY;

				if (!state.touchStart.xPos) {

					state.touchStart.xPos = e.originalEvent.touches[0].clientX;

				}

				if (!state.touchStart.yPos) {

					state.touchStart.yPos = e.originalEvent.touches[0].clientY;

				}

			}).on('touchend touchcancel', function (e) {
				var distance = 70,
					speed = 200,
					deltaX = state.touchEnd.xPos - state.touchStart.xPos,
					deltaY = Math.abs(state.touchEnd.yPos - state.touchStart.yPos);

				state.touchEnd.xPos = 0;
				state.touchEnd.yPos = 0;
				if (deltaX > distance || -deltaX > distance) {
					if (deltaX < 0) {

						if (state.animated) {

							state.doAfterTransition = plg.nextSlide;

						} else {

							plg.nextSlide();

						}

					} else {

						if (state.animated) {

							state.doAfterTransition = plg.prevSlide;

						} else {

							plg.prevSlide();

						}

					}
				}
				deltaX = null;
				deltaY = null;
				state.touchEnd.xPos = null;
				state.touchEnd.yPos = null;
				state.touchStart.xPos = null;
				state.touchStart.yPos = null;
			});
		}

		if (opt.mouseDrug) {

			DOM.$section.on('mousedown', function (e) {
				DOM.$sliderHolder.addClass('touched');
				state.touchStart.xPos = e.pageX;
				state.touchStart.yPos = e.pageY;
				try {

					state.touchStart.trfX = -parseInt( DOM.$sliderHolder.css('transform').split(',')[4] );

				} catch (error) {

					console.warn('transform is undefined');
					console.log(error);

				}

			}).on('mousemove', function (e) {
				if (e.buttons < 1) {
					touchendCleaner ();
				} else if (state.touchStart.xPos) {

					state.shiftD = state.touchStart.xPos - e.pageX;
					state.shiftX = state.touchStart.trfX + state.shiftD;

					DOM.$sliderHolder.css({
						'-webkit-transform': 'translateX( ' + -state.shiftX + 'px) translateZ(0)',
						'transform': 'translateX( ' + -state.shiftX + 'px) translateZ(0)'
					});

				}
			}).on('mouseup mouseleave', function (e) {
				if ( Math.abs(state.shiftD) > 40 ) {
					if (state.shiftD > 0) {
						plg.nextSlide();
					} else {
						plg.prevSlide();
					}
				} else {
					plg.toSlide(state.cur);
				}
				touchendCleaner ();
			});

		}

		DOM.$sliderHolder.on(transitionPrefix, function (e) {
			if (this === e.target) {
				state.animated = false;

				// todo add class
				// DOM.$slider.removeClass('animated');

				if (typeof state.doAfterTransition === 'function') {

					setTimeout(function () {

						state.doAfterTransition();
						state.doAfterTransition = null;

					}, 10);

				}

				
			}
		});

		$window.on( 'resize', plg.resize.bind(plg) );
		plg.init();

		return plg;
	};

	if (this.length > 1) {

		return this.each(plugin);

	} else if (this.length === 1) {

		return plugin.call(this[0]);

	}

};

$.fn.validate = function (opt) {

	this.each(function (i) {

		var DOM = {},
			state = {},
			$self = $(this);

		// options
		if (!opt) {
			opt = {};
		}
		opt = $.extend({
		}, opt);

		// methods
		var plg = {
			init: function () {

				DOM.$fields = $self.find('[data-validate]');
				$self.find('[type="submit"]').on('click', plg.submit);
				DOM.$fields.on('focus', function () {
					plg.removeLabel( $(this) );
				});

			},
			test: function (data, type) {

				switch (type) {
					case 'name':
						return /^[а-яА-Яa-zA-Z\-]+\s{0,1}[а-яА-Яa-zA-Z\-]{0,}$/.test(data);
					case 'phone':
						return /^[\(\)0-9\-\s\+]{8,}/.test(data);
					case 'email':
						return /^[0-9a-zA-Z._-]+@[0-9a-zA-Z_-]+\.[a-zA-Z._-]+/.test(data);
					default:
						return true;
				}

			},
			addLabel: function ($el) {

				$el.parent().addClass('error');

			},
			removeLabel: function ($el) {

				$el.parent().removeClass('error');

			},
			validate: function ($el) {

				if ( $el.hasClass('skip') ) return;

				if ( plg.test( $el.val(), $el.data('validate') ) ) {

					plg.removeLabel( $el );

				} else {

					plg.addLabel( $el );
					state.errors++;

				}

			},
			submit: function (e) {

				state.errors = 0;
				DOM.$fields.each( function () {

					plg.validate( $(this) );

				} );

				if (state.errors) {

					e.preventDefault();

				}

			}

		};

		plg.init();

		return plg;

	});

};


})(jQuery);