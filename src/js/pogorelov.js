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
		'lablesSlider': true,
		'lablesHolderClass': 'labels',
		'loop': true,
		'mouseDrug': true,
		'mouseWheel': true,
		'nextClass': 'arrow-right',
		'pagination': true,
		'paginationHolderClass': 'controls-mobile',
		'paginationPageClass': 'page',
		'preloaderClass': 'slide',
		'prevClass': 'arrow-left',
		'scaleFactor': 0.8,
		'sectionClass': 'section',
		'slideClass': 'slide',
		'slidesOnPage': 1,
		'speed': 600,
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
				// console.info( 'cacheDOM' );
				DOM.$section = DOM.$slider.closest('.' + opt.sectionClass);
				DOM.$preloader = DOM.$slider.find('.' + opt.preloaderClass);
				DOM.$viewport = DOM.$slider.find('.' + opt.viewportClass);
				DOM.$sliderHolder = DOM.$viewport.find('.' + opt.holderClass);
				DOM.$slides = DOM.$slidesAndCloned = DOM.$sliderHolder.find('.' + opt.slideClass);
			},
			init: function () {
				// console.info( 'init' );
				this.cacheDOM();
				state.current = state.current || 0;
				state.slides = DOM.$slides.length;
				state.pages = Math.ceil(DOM.$slides.length / opt.slidesOnPage);
				this.createPagination();

				// console.log(this)

				if (this.initialized) return false;

				this.addIdsToSlides();

				if (opt.loop) this.createClones();

				DOM.$preloader.fadeOut(150);

				this.initialized = true;

			},
			addIdsToSlides: function () {
				// console.info( 'addIdsToSlides' );

				DOM.$slides.not('.cloned').each(function (i) {
					$(this).attr('data-id', i);
				});

			},
			createClones: function () {
				// console.info( 'createClones' );

				DOM.$slides.each(function (i) {
					$(this)
						.clone()
						.removeClass('active')
						.addClass('cloned')
						.insertBefore( DOM.$slides.eq(0) )
						.clone()
						.appendTo( DOM.$sliderHolder );
				});

				DOM.$slidesAndCloned = DOM.$slider.find( '.' + opt.slideClass);

			},
			calculateMaxHeight: function ($el) {
				// console.info( 'calculateMaxHeight' );

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
				// console.info( 'resize' );

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

				plg.toSlide(state.current);

			},
			prevSlide: function () {
				// console.info( 'prevSlide' );

				var id = state.current - 1;

				if (id < 0) {

					id = state.pages - 1;

				}

				return id;

			},
			nextSlide: function () {
				// console.info( 'nextSlide' );

				var id = state.current + 1;

				if (id >= state.pages ) {

					id = 0;

				}

				return id;

			},
			toSlide: function (id) {
				// console.info( 'toSlide' );

				var $activeSlide;

				if ( id < 0 || id >= state.pages ) {
					console.warn('id is ' + id);
					return;
				}

				state.current = id;

				DOM.$slidesAndCloned
					.removeClass('active')
					.filter('[data-id="' + id + '"]').each(function () {
						$self = $(this);
						if (!$self.hasClass('cloned')) {
							$self.addClass('active');
							$activeSlide = $self;
						}
					});

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
						.find('.' + opt.paginationPageClass)
						.eq(id)
						.addClass('active')
						.siblings()
						.removeClass('active');

				}
			},
			renderFw: function ($activeSlide, $futureSlide, mult, step, stepChanged) {
				// console.info( 'renderFw' );

				if (step === 1) {

					$activeSlide
						.css({
							'z-index': 4,
							'transform': 'scale(1)',
							'left': state.itemWidth * mult / 0.7
						});

					$futureSlide
						.css({
							'z-index': 3,
						});

						if (stepChanged) {
							$activeSlide.addClass('active');
							$futureSlide.removeClass('active');
						}

				} else if (step === 2) {

					$activeSlide
						.css({
							'z-index': 3,
							'transform': 'scale(' + ( 1 - ( ( 1 - opt.scaleFactor ) * ( mult - 0.7 ) / 0.3 ) ) + ')',
							'transform-origin': + (30 * mult + 70) + '% 50%',
							'left': state.itemWidth - ( state.itemWidth * (mult - 0.7) / 0.3 ) + (opt.swing * (mult - 0.7) / 0.3 )
						});

					$futureSlide
						.css({
							'z-index': 4,
						});

						if (stepChanged) {
							$activeSlide.removeClass('active');
							$futureSlide.addClass('active');
						}

				}

				// Prev Slide
				if (step === 1 || step === 2) {
					$futureSlide
						.css({
							'transform': 'scale(' + (0.2 * mult + opt.scaleFactor) + ')',
							'transform-origin': + (50 * mult) + '% 50%',
							'left':  -opt.swing + opt.swing * mult
						});
				}

				// end
				if (step === 3) {

					if (!stepChanged) return;

					$activeSlide
						.css({
							'z-index': 3,
							'transform': 'scale(' + opt.scaleFactor + ')',
							'transform-origin': '100% 50%',
							'left': opt.swing
						});

					$futureSlide
						.css({
							'z-index': 4,
							'transform': 'scale(1)',
							'transform-origin': '50% 50%',
							'left': 0
						});

				}
			},
			renderBw: function ($activeSlide, $futureSlide, mult, step, stepChanged) {
				// console.info( 'renderBw' );

				if (step === 1) {

					$activeSlide
						.css({
							'z-index': 4,
							'transform': 'scale(1)',
							'left': state.itemWidth * mult / 0.7
						});

					$futureSlide
						.css({
							'z-index': 3,
						});

						if (stepChanged) {
							$activeSlide.addClass('active');
							$futureSlide.removeClass('active');
						}

				} else if (step === 2) {

					$activeSlide
						.css({
							'z-index': 3,
							'transform': 'scale(' + ( 1 - ( ( 1 - opt.scaleFactor ) * ( -mult - 0.7 ) / 0.3 ) ) + ')',
							'transform-origin': + (50 - 50 * (-mult - 0.7) / 0.3) + '% 50%',
							'left': (state.itemWidth * (-mult - 0.7) / 0.3 ) - state.itemWidth + (opt.swing * (mult + 0.7) / 0.3 )
						});

					$futureSlide
						.css({
							'z-index': 4,
						});

						if (stepChanged) {
							$activeSlide.removeClass('active');
							$futureSlide.addClass('active');
						}

				}

				// Prev Slide
				if (step === 1 || step === 2) {
					$futureSlide
						.css({
							'transform': 'scale(' + (0.2 * -mult + opt.scaleFactor) + ')',
							'transform-origin': + (100 - 50 * -mult) + '% 50%',
							'left':  opt.swing + opt.swing * mult
						});
				}

				// end
				if (step === 3) {

					if (!stepChanged) return;

					$activeSlide
						.css({
							'z-index': 3,
							'transform': 'scale(' + opt.scaleFactor + ')',
							'transform-origin': '0% 50%',
							'left': -opt.swing
						});

					$futureSlide
						.css({
							'z-index': 4,
							'transform': 'scale(1)',
							'transform-origin': '50% 50%',
							'left': 0
						});

				}
			},
			renderReset: function ( id ) {
				// console.info( 'renderReset' );
				// TODO refactor
				var resetStyles = {
						'z-index': '',
						'transform': '',
						'transform-origin': '',
						'left': ''
					}
				state.$activeSlide
					.removeClass('active')
					.css(resetStyles);
				state.$prevSlide
					.removeClass('active')
					.css(resetStyles);
				state.$nextSlide
					.removeClass('active')
					.css(resetStyles);

				// console.warn(id)
				plg.toSlide( id );

			},
			updateState: function (mult) {
				var stepChanged = null,
					$activeSlide,
					$futureSlide,
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
				$activeSlide = state.$activeSlide;
				if (mult > 0) {
					$futureSlide = state.$prevSlide;
				} else {
					$futureSlide = state.$nextSlide;
				}

				// move active card
				if ( !( $activeSlide instanceof jQuery && $futureSlide instanceof jQuery ) || isNaN(mult) ) return;

				if ( mult >= -0.7 && mult <= 0.7 ) {
					stepChanged = step.set(1);
				} else if (mult > 0.7 && mult < 1 || mult < -0.7 && mult > -1) {
					stepChanged = step.set(2);
				} else {
					stepChanged = step.set(3);
				}

				// console.log(mult);

				if (mult === 0 ) {

					state.direction = 0;
					plg.renderReset( state.current );

				} else if (mult <= -1) {

					state.direction = 0;
					plg.renderReset( plg.nextSlide() );

				} else if (mult >= 1) {

					state.direction = 0;
					plg.renderReset( plg.prevSlide() );

				} else if (mult > 0) {

					if (state.direction == -1) plg.renderReset( state.current );
					state.direction = 1;
					plg.renderFw($activeSlide, $futureSlide, mult, step.get(), stepChanged)

				} else if (mult < 0) {

					if (state.direction == 1) plg.renderReset( state.current );
					state.direction = -1;
					plg.renderBw($activeSlide, $futureSlide, mult, step.get(), stepChanged)

				}

			},
			animateSlideToFinish: function (status, speed, startTime) {
				// console.info( 'animateSlideToFinish' );
				var animationTime, endTime, startAnimation;
				animationTime = speed - speed * Math.abs(status);
				endTime = startTime + animationTime;
				startAnimationTime = endTime - speed;
				requestAnimFrame(function loop () {

					var time = new Date().getTime(),
						calculatedState = status * (time - startAnimationTime) / (startTime - startAnimationTime);

					if (time > endTime) {
						if (status > 0) {
							plg.updateState( 1 );
						} else {
							plg.updateState( -1 );
						}
						return;
					}

					plg.updateState( calculatedState );
					requestAnimFrame( loop );
				});
			},
			animateSlideToStart: function (status, speed, startTime) {
				// console.info( 'animateSlideToStart' );
				var animationTime, endTime, startAnimation;
				animationTime = speed * Math.abs(status);
				endTime = startTime + animationTime;
				startAnimationTime = startTime - animationTime;
				requestAnimFrame(function loop () {

					var time = new Date().getTime(),
						calculatedState = status * (endTime - time) / (startTime - startAnimationTime);

					if (time > endTime) {
						plg.updateState( 0 );
						return;
					}

					plg.updateState( calculatedState );
					requestAnimFrame( loop );
				});
			},
			createPagination: function () {
				// console.info( 'createPagination' );

				var $lablesSlider;

				if (DOM.$pagination) {

					DOM.$pagination.empty();

				} else {

					DOM.$pagination = $('<div>').addClass( opt.paginationHolderClass );

					if (opt.pagination) {

						DOM.$pagination.appendTo(DOM.$slider);

					}

				}

				$('<div>')
					.addClass( opt.prevClass )
					.appendTo( DOM.$pagination );


				if (opt.lablesSlider) {

					$lablesSlider = $('<ul>')
						.addClass( opt.lablesHolderClass )
						.appendTo( DOM.$pagination );

					DOM.$slides.each(function (i) {

						$('<li>')
							.html( $(this).data('name') || "&nbsp" )
							.appendTo( $lablesSlider );

					});

				}

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

			state.lastScrollTime = new Date().getTime();

			DOM.$slider.on('DOMMouseScroll wheel', function (e) {

				e.preventDefault();
				e.stopPropagation();

				var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY;
				if ( state.lastScrollTime + opt.speed < new Date().getTime() ) {

					if (delta > 0) {

						plg.animateSlideToFinish(-0.1, opt.speed, new Date().getTime());

					} else if (delta < 0) {

						plg.animateSlideToFinish(0.1, opt.speed, new Date().getTime());

					}

					state.lastScrollTime = new Date().getTime();

				}

			}).on('mousewheel', function (e) {

				e.preventDefault();
				e.stopPropagation();

				var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY;
				if ( pagesState.lastScrollTime + opt.speed < new Date().getTime() ) {

					if (delta > 0) {

						plg.animateSlideToFinish(-0.1, opt.speed, new Date().getTime());

					} else if (delta < 0) {

						plg.animateSlideToFinish(0.1, opt.speed, new Date().getTime());

					}

					state.lastScrollTime = new Date().getTime();

				}

			});

		}

		if (opt.touch) {

			// drag events
			DOM.$slider.on('touchstart', function (e) {
				state.touchStart.timeStamp = e.timeStamp;
			}).on('touchmove', function (e) {
				var mult;

				state.touchEnd.xPos = e.originalEvent.touches[0].clientX;
				state.touchEnd.yPos = e.originalEvent.touches[0].clientY;

				if (!state.touchStart.xPos) {
					state.touchStart.xPos = e.originalEvent.touches[0].clientX;
				}

				if (!state.touchStart.yPos) {
					state.touchStart.yPos = e.originalEvent.touches[0].clientY;
				}

				state.deltaX = state.touchEnd.xPos - state.touchStart.xPos;

				mult = state.deltaX / state.itemWidth;

				mult = Math.min(0.9999, mult);
				mult = Math.max(-0.9999, mult);

				plg.updateState( mult );

			}).on('touchend touchcancel', function (e) {
				// TODO reformat it
				var distance = 70,
					speed = opt.speed || 200,
					currentStatus = state.deltaX / state.itemWidth;

				if (currentStatus < 0.3 && currentStatus > -0.3) {
					plg.animateSlideToStart(currentStatus, opt.speed, new Date().getTime());
				} else if (currentStatus < 1 || currentStatus > -1) {
					plg.animateSlideToFinish(currentStatus, opt.speed, new Date().getTime());
				} else {
					// plg.animateSlideToFinish
					// plg.updateState( 1 );
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

					plg.updateState( state.shiftX / state.itemWidth );

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