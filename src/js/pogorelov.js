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
			setInterval(this.fixBody, 10)

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
		'speed': 400,
		'prevClass': 'arrow-left',
		'nextClass': 'arrow-right',
		'holderClass': 'slides-holder',
		'viewportClass': 'viewport',
		'sectionClass': 'section',
		'slideClass': 'slide',
		'preloaderClass': 'slide',
		'clickToNext': true,
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
				DOM.$section = $(self).closest('.' + opt.sectionClass);
				DOM.$preloader = DOM.$slider.find('.' + opt.preloaderClass);
				DOM.$viewport = DOM.$slider.find('.' + opt.viewportClass);
				DOM.$sliderHolder = DOM.$viewport.find('.' + opt.holderClass);
				DOM.$slides = DOM.$slidesAndCloned = DOM.$sliderHolder.find('.' + opt.slideClass);
				DOM.$slides.eq( state.current || 0 ).addClass('active');
			},
			init: function () {
				state.current = state.current || 0;
				state.slides = DOM.$slides.length;
				state.pages = Math.ceil(DOM.$slides.length / opt.slidesOnPage);

				if (this.initialized) return false;

				if (opt.loop) {

					DOM.$slides.each(function (i) {
						$(this)
							.clone()
							.addClass('cloned')
							.insertBefore( DOM.$slides.eq(0) )
							.clone()
							.appendTo( DOM.$sliderHolder );
					});

					DOM.$slidesAndCloned = DOM.$sliderHolder.find(opt.slideClass);

					this.addIdsToSlides();

				}

				if (opt.slidesClickable) {
					this.addHandlersToSlides();
				}

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
							if (i > state.current) {
								plg.nextSlide();
							} else {
								plg.prevSlide();
							}
						}
					});
				});

				DOM.$slidesAndCloned.filter('.cloned').find('a').on('click', function (e) {
					e.preventDefault();
					plg.fakeAnimation( $(this).closest(opt.slideClass).data('id') );
				});

			},
			calculateMaxHeight: function ($el) {

				var max = 1;

				$el.each(function () {

					var height = 0,
						$self = $(this);

					$self.find('> *').each(function () {
						height += $self.outerHeight();
					});

					if (height > max) {
						max = height;
					}

				});

				return max;

			},
			resize: function () {

				state.sliderWidth = DOM.$viewport.width();

				if ($window.width() > 300 && opt.slidesOnPage > 1 && $window.width() <= 700) {

					opt.slidesOnPage = Math.floor( opt.slidesOnPage / 2 );
					plg.init();

				}

				state.itemWidth = DOM.$viewport.width() / opt.slidesOnPage;

				DOM.$slidesAndCloned.width( state.itemWidth );

				if (opt.autoHeight) {

					DOM.$slides.height( this.calculateMaxHeight( DOM.$slides ) );

				}

				state.slideWidth = DOM.$slides.eq(0).outerWidth();

				if (opt.loop) {

					state.holderWidth = 3 * state.slides * state.slideWidth;

				} else {

					state.holderWidth = state.slideWidth * state.slides;

				}

				DOM.$sliderHolder.width( state.holderWidth );

				plg.toSlide(state.current, true);

			},
			prevSlide: function () {

				var id = state.current - 1;
				if (id < 0) {

					plg.fakeAnimation( state.pages - 1 );

					return;

				}

				plg.toSlide(id);

			},
			nextSlide: function () {

				var id = state.current + 1;
				if (id >= state.pages) {

					plg.fakeAnimation( 0 );

					return;

				}

				plg.toSlide(id);

			},
			fakeAnimation: function (id) {

				var direction = state.current > id ? true : false;

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
						'transform': 'translateX( ' + -( state.sliderWidth * (id + state.slides + state.current + 1) ) + 'px) translateZ(0)'
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

				state.current = id;

				if ( DOM.$sliderHolder.hasClass('touched') || resize ) {

					state.animated = false;

				} else {

					state.animated = true;

				}

				if (opt.loop) {

					DOM.$slidesAndCloned.removeClass('active fake-active');
					DOM.$slidesAndCloned.filter('[data-id="' + id + '"]').each(function () {
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

				if (opt.pagination) {

					DOM.$pagination.find('.page').eq(id).addClass('active').siblings().removeClass('active');

				}

				// TODO add class
				// DOM.$slider.addClass('animated');

				if (opt.loop) {

					DOM.$sliderHolder.css({
						'transform': 'translateX( ' + -( state.sliderWidth * (id + state.slides) ) + 'px) translateZ(0)',
						'transition': 'transform ' + opt.speed + 'ms'
					});

				} else {

					DOM.$sliderHolder.css({
						'transform': 'translateX( ' + -(state.sliderWidth * id) + 'px) translateZ(0)',
						'transition': 'transform ' + opt.speed + 'ms'
					});

				}

			},
			transitionEnded: function (e) {

				if (this !== e.target) return;

				state.animated = false;

				DOM.$sliderHolder.css({
					'transition': 'none'
				});

				// todo add class
				// DOM.$slider.removeClass('animated');

				if (typeof state.doAfterTransition === 'function') {

					setTimeout(function () {

						state.doAfterTransition();
						state.doAfterTransition = null;

					}, 10);

				}

				pagesState.lastScrollTime = new Date().getTime();

			},
			getCurrent: function () {
				return state.current;
			}
		};

		plg.cacheDOM();
		plg.init();
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

			} else if (opt.clickToNext && $target.parents(opt.slideClass).length) {

				plg.nextSlide();

			}

		});

		if (opt.mouseWheel) {

			DOM.$slider.on('DOMMouseScroll wheel', function (e) {

				e.preventDefault();
				e.stopPropagation();

				var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY;
				if ( pagesState.lastScrollTime + opt.speed < new Date().getTime() ) {

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
				if ( pagesState.lastScrollTime + opt.speed < new Date().getTime() ) {

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
				// TODO reformat it
				var distance = 70,
					speed = opt.speed || 200,
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
				// TODO replace it by function
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
					plg.toSlide(state.current);
				}
				touchendCleaner ();
			});

		}

		DOM.$sliderHolder.on(transitionPrefix, plg.transitionEnded);

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

$.fn.cardsSlider = function (opt) {

	// options
	if (!opt) {
		opt = {};
	}
	opt = $.extend({
		'autoHeight': false,
		'clickToNext': true,
		'easing': 'swing',
		'holderClass': 'slides-holder',
		'interval': false,
		'loop': true,
		'mouseDrug': true,
		'mouseWheel': true,
		'nextClass': 'next-slide',
		'paginationHolderClass': 'pagination-holder',
		'paginationPageClass': 'page',
		'preloaderClass': 'slide',
		'prevClass': 'prev-slide',
		'scaleFactor': 0.8,
		'sectionClass': 'section',
		'slideClass': 'slide',
		'slidesOnPage': 1,
		'speed': 400,
		'startSlide': 0,
		'swing': 20,
		'touch': true,
		'viewportClass': 'viewport'
	}, opt);

	var plugin = function (i) {

		// privat and cnstants
		var self = this,
			DOM = {
				$slider: $(self)
			},
			state = {
				'touchStart': {},
				'touchEnd': {}
			},
			$window = $(window),
			touchendCleaner = function () {
				DOM.$sliderHolder.removeClass('touched');
				state.touchStart.yPos = 0;
				state.touchStart.xPos = 0;
				state.shiftX = 0;
				state.shiftD = 0;
			},
			moveendCleaner = function () {
				state.deltaX = null;
				state.touchEnd.xPos = null;
				state.touchEnd.yPos = null;
				state.touchStart.xPos = null;
				state.touchStart.yPos = null;
			};

		// TODO remove it
		_pogorelov.state = state;

		// methods
		var plg = {
			cacheDOM: function () {
				console.info( 'cacheDOM' );
				DOM.$section = DOM.$slider.closest('.' + opt.sectionClass);
				DOM.$preloader = DOM.$slider.find('.' + opt.preloaderClass);
				DOM.$viewport = DOM.$slider.find('.' + opt.viewportClass);
				DOM.$sliderHolder = DOM.$viewport.find('.' + opt.holderClass);
				DOM.$slides = DOM.$slidesAndCloned = DOM.$sliderHolder.find('.' + opt.slideClass);
				DOM.$slides.eq( state.current || 0 ).addClass('active');
			},
			init: function () {
				console.info( 'init' );
				this.cacheDOM();
				state.current = state.current || 0;
				state.slides = DOM.$slides.length;
				state.pages = Math.ceil(DOM.$slides.length / opt.slidesOnPage);

				// console.log(this)

				if (this.initialized) return false;

				this.addIdsToSlides();

				if (opt.loop) this.createClones();

				if (opt.slidesClickable) this.addHandlersToSlides();

				DOM.$preloader.fadeOut(150);

				this.initialized = true;

			},
			addIdsToSlides: function () {
				console.info( 'addIdsToSlides' );

				DOM.$slides.not('.cloned').each(function (i) {
					$(this).attr('data-id', i);
				});

			},
			createClones: function () {
				console.info( 'createClones' );

				DOM.$slides.each(function (i) {
					$(this)
						.clone()
						.addClass('cloned')
						.insertBefore( DOM.$slides.eq(0) )
						.clone()
						.appendTo( DOM.$sliderHolder );
				});

				DOM.$slidesAndCloned = DOM.$slider.find( '.' + opt.slideClass);

			},
			addHandlersToSlides: function () {
				console.info( 'addHandlersToSlides' );
				console.warn( 'remove this methood!' );

				// DOM.$slides.not('.cloned').each(function (i) {
				// 	var $self = $(this);
				// 	$self.on('click', function (e) {
				// 		if (!$self.hasClass('active')) {
				// 			e.preventDefault();
				// 			e.stopPropagation();
				// 			if (i > state.current) {
				// 				plg.nextSlide();
				// 			} else {
				// 				plg.prevSlide();
				// 			}
				// 		}
				// 	});
				// });

			},
			calculateMaxHeight: function ($el) {
				console.info( 'calculateMaxHeight' );

				var max = 1;

				$el.each(function () {

					var height = 0,
						$self = $(this);

					$self.find('> *').each(function () {
						height += $self.outerHeight();
					});

					if (height > max) {
						max = height;
					}

				});

				return max;

			},
			resize: function () {
				console.info( 'resize' );

				state.sliderWidth = DOM.$viewport.width();

				if ($window.width() > 300 && opt.slidesOnPage > 1 && $window.width() <= 700) {

					opt.slidesOnPage = Math.floor( opt.slidesOnPage / 2 );
					// TODO is this needed?
					plg.init();

				}

				state.itemWidth = DOM.$viewport.width() / opt.slidesOnPage;

				DOM.$slidesAndCloned.width( state.itemWidth );

				if (opt.autoHeight) {

					DOM.$slides.height( this.calculateMaxHeight( DOM.$slides ) );

				}

				state.slideWidth = DOM.$slides.eq(0).outerWidth();

				if (opt.loop) {

					state.holderWidth = 3 * state.slides * state.slideWidth;

				} else {

					state.holderWidth = state.slideWidth * state.slides;

				}

				DOM.$sliderHolder.width( state.holderWidth );

				plg.toSlide(state.current, true);

			},
			prevSlide: function () {
				console.info( 'prevSlide' );

				var id = state.current - 1;
				if (id < 0 && false) {

					plg.fakeAnimation( state.pages - 1 );

					return;

				}

				plg.toSlide(id);

			},
			nextSlide: function () {
				console.info( 'nextSlide' );

				var id = state.current + 1;
				if (id >= state.pages && false) {

					plg.fakeAnimation( 0 );

					return;

				}

				plg.toSlide(id);

			},
			fakeAnimation: function (id) {
				console.info( 'fakeAnimation' );

				var direction = state.current > id ? true : false;

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
						'transition': 'transform ' + opt.speed + 'ms'
					});

				} else {

					DOM.$slides.eq(id).addClass('pressed');
					DOM.$sliderHolder.css({
						'transition': 'transform ' + opt.speed + 'ms'
					});

				}

				setTimeout(function () {

					DOM.$sliderHolder.removeClass('touched');
					DOM.$slides.eq(id).removeClass('pressed unpressed');

					plg.toSlide(id);

				}, $.browser.mobile ? 100 : 40);

			},
			toSlide: function (id, resize) {

				console.info( 'toSlide' );

				var $activeSlide;

				if ( id < 0 || id >= state.pages ) {
					console.warn('id is ' + id);
					return;
				}

				state.current = id;

				if (opt.loop) {

					// console.log( $('[data-id="' + id + '"]') );
					// console.log( id );

					DOM.$slidesAndCloned
						.removeClass('active fake-active')
						.filter('[data-id="' + id + '"]').each(function () {
							$self = $(this);
							if ($self.hasClass('cloned')) {
								$self.addClass('fake-active');
							} else {
								$self.addClass('active');
								$activeSlide = $self;
							}
						});

				} else {

					$activeSlide = DOM.$slides
									.removeClass('active')
									.eq(id)
									.addClass('active');

				}

				// TODO ...
				// save active
				try {

					state.$activeSlide = $activeSlide;
					state.$prevSlide = $activeSlide.prev();
					state.$nextSlide = $activeSlide.next();

				} catch (e) {

					console.error(e);
					state.$prevSlide = null;
					state.$nextSlide = null;

				}

				if (opt.pagination) {

					DOM.$pagination
						.find('.page')
						.eq(id)
						.addClass('active')
						.siblings()
						.removeClass('active');

				}

				// DOM.$slides
				// 	.eq(id)
				// 	.addClass('active')
				// 	.siblings()
				// 	.removeClass('active');

			},
			renderState: function (mult) {
				var stepChanged = null,
					step = (function (s) {
							var stp = null;
							return {
								get: function (s) {
									return stp;
								},
								set: function (s) {
									if (s !== stp) {
										stp = s;
										return true;
									}
									return false;
								}
							}
						})();

				// move active card
				console.log(mult);
				if ( !(state.$activeSlide instanceof jQuery && state.$prevSlide instanceof jQuery && state.$nextSlide instanceof jQuery) ) return;

				// if (mult < 0) mult = -mult
				if (mult < 0 || mult > 1) return

				if (mult <= 0.7) {
					stepChanged = step.set(1);
				} else if (mult > 0.7 && mult < 1) {
					stepChanged = step.set(2);
				} else {
					stepChanged = step.set(3);
				}

				// 0.3 = 1
				// 0 = x
				if (step.get() === 1) {

					state.$activeSlide
						.css({
							'z-index': 4,
							'transform': 'scale(1)',
							'left': state.itemWidth * mult / 0.7
						});

					state.$prevSlide
						.css({
							'z-index': 3,
						});

						if (stepChanged) {
							state.$activeSlide.addClass('active');
							state.$prevSlide.removeClass('active');
						}

				} else if (step.get() === 2) {

					state.$activeSlide
						.css({
							'z-index': 3,
							'transform': 'scale(' + ( 1 - ( ( 1 - opt.scaleFactor ) * ( mult - 0.7 ) / 0.3 ) ) + ')',
							'transform-origin': + (30 * mult + 70) + '% 50%',
							'left': state.itemWidth - ( state.itemWidth * (mult - 0.7) / 0.3 ) + (opt.swing * (mult - 0.7) / 0.3 )
						});

					state.$prevSlide
						.css({
							'z-index': 4,
						});

						if (stepChanged) {
							state.$activeSlide.removeClass('active');
							state.$prevSlide.addClass('active');
						}

				}

				// Prev Slide
				if (step.get() === 1 || step.get() === 2) {
					state.$prevSlide
						.css({
							'transform': 'scale(' + (0.2 * mult + opt.scaleFactor) + ')',
							'transform-origin': + (50 * mult) + '% 50%',
							'left':  -opt.swing + opt.swing * mult
						});
				}

				// state.$nextSlide
				// 	.css({
				// 		'left': opt.swing * mult
				// 	});

				// end
				if (step.get() === 3) {

					state.$activeSlide
						.css({
							'z-index': 3,
							'transform': 'scale(' + opt.scaleFactor + ')',
							'transform-origin': '100% 50%',
							'left': opt.swing
						});

					state.$prevSlide
						.css({
							'z-index': 4,
							'transform': 'scale(1)',
							'transform-origin': '50% 50%',
							'left': 0
						});

				}

			},
			createPagination: function () {
				console.info( 'createPagination' );

				if (DOM.$pagination) {

					DOM.$pagination.empty();

				} else {

					DOM.$pagination = $('<div>').addClass( opt.paginationHolderClass );

					if (opt.pagination || true) {

						DOM.$pagination.appendTo(DOM.$slider);

					}

				}

				$('<div>')
					.addClass( opt.prevSlide )
					.appendTo( DOM.$pagination );

				for (var i = 0; i < state.pages / opt.slidesOnPage; i++) {
					var page = $('<div>').data('page', i).addClass( opt.paginationPageClass );

					if (!i) {

						page.addClass('active');

					}

					DOM.$pagination.append( page );
				}

				$('<div>')
					.addClass( opt.nextClass )
					.appendTo( DOM.$pagination );

			},
			transitionEnded: function (e) {

				if (this !== e.target) return;
				console.info( 'transitionEnded' );

				state.animated = false;

				DOM.$sliderHolder.css({
					'transition': 'none'
				});

				// todo add class
				// DOM.$slider.removeClass('animated');

				if ( typeof state.doAfterTransition === 'function' ) {

					setTimeout(function () {

						state.doAfterTransition();
						state.doAfterTransition = null;

					}, 10);

				}

				pagesState.lastScrollTime = new Date().getTime();

			},
			getCurrent: function () {
				return state.current;
			}
		};

		// initializing
		plg.init();
		plg.resize();

		// resize
		$window.on('resize', function () {
			plg.resize();
		});

		// click events
		DOM.$slider.on('click', function (e) {

			var $target = $(e.target);

			if ( $target.hasClass('page') ) {

				plg.toSlide( $(e.target).data('page') );

			} else if ( $target.hasClass( opt.prevClass ) ) {

				plg.prevSlide();

			} else if ( $target.hasClass( opt.nextClass ) ) {

				plg.nextSlide();

			} else if ( opt.clickToNext && $target.parents(opt.slideClass).length ) {

				// plg.nextSlide();


				var $slideTrigger = $target.closest(opt.slideClass);
				var targetId =  parseInt( $slideTrigger.attr('data-id') );
				if (typeof targetId !== 'number') return

				// TODO not .not('.cloned')

				if (!$slideTrigger.hasClass('active')) {
					e.preventDefault();
					e.stopPropagation();
					if (targetId > state.current) {
						plg.nextSlide();
					} else {
						plg.prevSlide();
					}
				}

			}

		});

		if (opt.mouseWheel) {

			DOM.$slider.on('DOMMouseScroll wheel', function (e) {

				e.preventDefault();
				e.stopPropagation();

				var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY;
				if ( state.lastScrollTime + opt.speed < new Date().getTime() ) {

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
				if ( pagesState.lastScrollTime + opt.speed < new Date().getTime() ) {

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

				state.deltaX = state.touchEnd.xPos - state.touchStart.xPos;

				plg.renderState( state.deltaX / state.itemWidth );

			}).on('touchend touchcancel', function (e) {
				// TODO reformat it
				var distance = 70,
					speed = opt.speed || 200;

				if (state.deltaX / state.itemWidth < 1) {
					// TODO complete animation
				}

				state.touchEnd.xPos = 0;
				state.touchEnd.yPos = 0;

				moveendCleaner();

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

					touchendCleaner();

				} else if (state.touchStart.xPos) {

					state.shiftD = state.touchStart.xPos - e.pageX;
					state.shiftX = state.touchStart.trfX + state.shiftD;

					plg.renderState( state.shiftX / state.itemWidth );

				}

			}).on('mouseup mouseleave', function (e) {
				if ( Math.abs(state.shiftD) > 40 ) {
					if (state.shiftD > 0) {
						plg.nextSlide();
					} else {
						plg.prevSlide();
					}
				} else {
					plg.toSlide(state.current);
				}
				touchendCleaner();
			});

		}

		DOM.$sliderHolder.on(transitionPrefix, plg.transitionEnded);

		$window.on( 'resize', plg.resize.bind(plg) );

		return {
					'getCurrent': plg.getCurrent,
					'init': plg.init,
					'nextSlide': plg.nextSlide,
					'prevSlide': plg.prevSlide,
					'toSlide': plg.toSlide
				};
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