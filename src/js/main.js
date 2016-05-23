
if ($.browser.mobile) $('body').addClass('mobile');
if ($.browser.safari) $('body').addClass('safari');

var meatstudies = {};

// WOW classes
(function () {
	if ($.browser.mobile) return;

	blevogue.$wowElements = $('.fadeInUp, .fadeInRight, .fadeInLeft').addClass('wow');

})();

var loading = {
	avgTime: 3000,
	trg: 1,
	state: 0,
	preloader: $('body > .preloader'),
	loaded: function () {

		if(++loading.state == loading.trg) {

			loading.status(1);
			setTimeout(loading.done, 500);

		} else {

			loading.status(loading.state / loading.trg / 1.1);

		}
	},
	status: function (mult) {

		loading.preloader.find('> .after').css({
			'width': mult * 100 + '%'
		});

	},
	done: function () {

		if (loading.finished) return;

		// TODO temp for developing
		// $('section.articles-gallery-1 > article, .article-content, .article-name, .article-date, .video, .article-page, #about-modal .content-holder').find('p, h1, h2, h3, h4, h5, h6, blockquote, span').attr('contenteditable', true).on('click', function (e) {
		// 	e.preventDefault();
		// });
		// $('.article-holder-1 a').on('click', function (e) {
		// 	e.preventDefault();
		// });

		setTimeout(function () {

			// WOW init
			if ($.browser.desktop) {

				new WOW().init();

			}

		}, 380);

		// hide preloader
		loading.preloader.addClass('done').animate({}).delay(400).animate({
			'opacity': 0
		}, 400, function () {

			bodyOverflow.unfixBody();

			$(window).trigger('scroll').trigger('resize');

			loading.status(0);
			$(this).detach();
			loading.finished = true;

		});

	}
};

// TODO test it
$('img').each(function () {

	if (!this.naturalWidth || true) {
		loading.trg ++;
		$(this).one('load', loading.loaded);
	}

});

setTimeout(function () {

	loading.status(1);
	setTimeout(loading.done, 100);

}, 30000);

$(window).on('load', function () {

	loading.status(1);
	setTimeout(loading.done, 200);

});

$(document).on('ready', function () {
	var $window = $(window),
		winWidth = $window.width(),
		winHeight = $window.height(),
		bodyHeight = $('body').height(),
		goUp = (function () {

			var $el = $('#to-top'),
				state = false,
				speed = 900,
				paused = false,
				plg = {
					up: function () {

						paused = true;
						state = true;

						$("html, body").stop().animate({scrollTop:0}, speed, 'swing', function () {

							paused = false;

						}).one('touchstart mousewheel DOMMouseScroll wheel', function () {

							$(this).stop(false, false).off('touchstart mousewheel DOMMouseScroll wheel');
							paused = false;

						});

						plg.hide();

					},
					show: function () {

						if (!state && !paused) {

							$el.addClass('opened');

							state = true;

						}

					},
					hide: function () {

						if (state) {

							$el.removeClass('opened');

							state = false;

						}

					},
					$el: $el
				};

			$el.on('click', function () {

				plg.up();

			});

			return plg;

		})();


		// article add comment fake textarea
		(function () {

			$('[contenteditable="true"]').each(function () {

				var $self = $(this),
					$textarea,
					fakePlaceholder = null;

				if ($self.hasClass('comment-wysiwyg')) {

					$textarea = $self.siblings('textarea');

					$self.on('keyup', function () {
						$textarea.html( $self.html() );
					}).on('focus', function () {
						if (fakePlaceholder === null) {
							fakePlaceholder = $self.html();
							$self.html('');
						};
						if (fakePlaceholder === $self.html()) $self.html('');
					}).on('blur', function () {
						if (!$self.text().replace(/\n\S/, '')) $self.html( fakePlaceholder );
					});

				}

			});

		})();

		// modals
		var modals = {
			opened: [],
			openModal: function ( $modal ) {

				if (!$modal.data('modal-ununique') && this.opened.length > 0) {
					modals.closeModal( this.opened[this.opened.length - 1], true );
				}
				this.opened.push( $modal );
				// $modal.addClass('opened').one( transitionPrefix, bodyOverflow.fixBody );

				$modal.off( transitionPrefix ).addClass('opened');
				bodyOverflow.fixBody();

				if ( $modal.is('[data-cross]') ) {

					this.$cross = $('<div>').addClass('cross-top-fixed animated ' + $modal.attr('data-cross') ).one('click', function () {

						modals.closeModal();

					}).one(animationPrefix, function () {

						$(this).removeClass( 'animated' );

					}).appendTo('body');

				}

			},
			closeModal: function ($modal, alt) {

				if ( this.opened.length > 0 && !$modal ) {

					for ( var y = 0; y < this.opened.length; y++ ) {

						this.closeModal( this.opened[y] );

					}

					return;

				} else if ( $modal && !($modal instanceof jQuery) ) {

					$modal = $( $modal );

				} else if ( $modal === undefined ) {

					throw 'something went wrong';

				}

				try {

					$modal.removeClass('opened');

				} catch (e) {

					console.error(e);

					this.closeModal();

					return;

				}

				this.opened.pop();

				if (!alt) {

					$modal.one( transitionPrefix, bodyOverflow.unfixBody );

					try {

						this.$cross.addClass('fadeOut').one(animationPrefix, function () {

							$(this).remove();

						});

					} catch (e) {

						console.error(e);

					}

				} else {

					this.$cross.remove();

				}

			}

		};

		$('[data-modal]').on('click', function (e) {

			e.preventDefault();

			var $self = $(this),
				target = $self.attr('data-modal'),
				$target = $(target);

			if ($target.length) {

				modals.openModal($target);

			} else {

				console.warn('Ошибка в элементе:');
				console.log(this);
				console.warn('Не найдены элементы с селектором ' + target);

			}
			
		});

		$('[data-close]').on('click', function (e) {

			e.preventDefault();

			var $self = $(this),
				target = $self.attr('data-close'),
				$target;

			if (target) {

				$target = $(target);

				if ($target.length) {

					modals.closeModal( $target );

				}

			} else {

				modals.closeModal( $self.closest('.opened') );

			}

		});

		$('.modal-holder').not('.fake').on('click', function (e) {

			if (e.target === this) {

				modals.closeModal( $(this) );

			}

		});

		$window.on('keyup', function (e) {

			// esc pressed
			if (e.keyCode == '27') {

				modals.closeModal();

			}

		});


		// shuffle array
		Array.prototype.shuffle = function() {

			for (var i = this.length - 1; i > 0; i--) {

				var num = Math.floor(Math.random() * (i + 1)),
					d = this[num];
				this[num] = this[i];
				this[i] = d;

			}

			return this;

		};

		// validation
		(function () {

			var $profileForms = $('form');
			$profileForms.validate();

		})();


		scroll
		$(document).on('scroll', function () {

			var top = $(this).scrollTop();

		});

		// resize
		$window.on('resize', function () {

			winWidth = $window.width();
			winHeight = $window.height();
			bodyHeight = $('body').height();

		});

});
