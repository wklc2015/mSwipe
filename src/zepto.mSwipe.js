/**
 * zepto.mSwipe.js plugin
 * */
;
(function(win) {
	var me = {};
	var _elementStyle = document.createElement('div').style;
	var _vendor = (function() {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;
		for(; i < l; i++){
			transform = vendors[i] + 'ransform';
			if(transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
		}
		return false;
	})();

	function _prefixStyle(style) {
		if(_vendor === false) return false;
		if(_vendor === '') return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	var _transform = _prefixStyle('transform');
	me.extend = function(target, obj) {
		for(var i in obj){
			target[i] = obj[i];
		}
	};
	me.extend(me, {
		hasTransform   : _transform !== false,
		hasPerspective : _prefixStyle('perspective') in _elementStyle,
		hasTouch       : 'ontouchstart' in window,
		hasPointer     : window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
		hasTransition  : _prefixStyle('transition') in _elementStyle
	});
	me.extend(me.style = {}, {
		transform                : _transform,
		transitionTimingFunction : _prefixStyle('transitionTimingFunction'),
		transitionDuration       : _prefixStyle('transitionDuration'),
		transformOrigin          : _prefixStyle('transformOrigin')
	});
	me.extend(me.eventName = {}, {
		start : ['mousedown', 'touchstart'][Number(me.hasTouch)],
		move  : ['mousemove', 'touchmove'][Number(me.hasTouch)],
		end   : ['mouseup', 'touchend'][Number(me.hasTouch)]
	});
	win.Utils = me;
}(window))

;
(function($, win) {
	function Swipe(container, options) {
		"use strict";
		this.container = container;
		if(!this.container) return;
		this.element = this.container.children[0];
		this.options = $.extend({}, {
			animated               : 0,
			zoomTo                 : 0.9,
			zoomIng                : 0.1,
			startSlide             : 0,
			speed                  : 300,
			direction              : 'y',
			distanceValue          : 10,
			loop                   : true,
			disableToPrev          : false,
			disableToNext          : false,
			disablePreventDefault  : true,
			disableStopPropagation : true,
			translateZ             : true,
			bindToContainer        : true,
			drag                   : true,
			bind                   : true
		}, options);
		this.index = this.options.startSlide;
		this.translateZ = Utils.hasPerspective && this.options.translateZ ? ' translateZ(0)' : '';
		this.options.zoomTo = this.options.zoomTo >=0.5 || this.options.zoomTo <=0.9 ? this.options.zoomTo : 0.9;
		this.target = $(this.options.bindToContainer ? this.container : window);
		this.startPosition = {};
		this.moveDelta = {};
		this.events = {};
		this.sizeParam = ['height', 'width'][this.options.direction === 'y' ? 0 : 1];
		this.sizePosition = ['top', 'left'][this.options.direction === 'y' ? 0 : 1];
		this.isAnimating = false;
		this.init();
	}

	Swipe.prototype = {
		disableToPrev    : function() {
			this.options.disableToPrev = true;
		},
		enableToPrev     : function() {
			this.options.disableToPrev = false;
		},
		disableToNext    : function() {
			this.options.disableToNext = true;
		},
		enableToNext     : function() {
			this.options.disableToNext = false;
		},
		getIndex         : function() {
			return this.index;
		},
		getLength        : function() {
			return this.length;
		},
		on               : function(type, fn) {
			if(!this.events[type]){
				this.events[type] = [];
			}
			this.events[type].push(fn);
		},
		off              : function(type, fn) {
			if(this.events[type]){
				var index = this.events[type].indexOf(fn);
				if(index > -1){
					this.events[type].splice(index, 1);
				}
			}
		},
		execEvent        : function(type) {
			var that = this;
			if(this.events[type]){
				for(var i = 0, l = this.events[type].length; i < l; i++){
					this.events[type][i].apply(this, [].slice.call(arguments, 1));
				}
			}
		},
		init             : function() {
			this.initNodes();
			this.initEvents()
		},
		initNodes        : function() {
			var width = this.container.getBoundingClientRect().width;
			var height = this.container.getBoundingClientRect().height;
			this.slides = this.element.children;
			this.length = this.slides.length;
			this.wraperSize = this.options.direction === 'y' ? height : width;
			this.element.style[this.sizeParam] = 3 * this.wraperSize + 'px';
			this.element.style[this.sizePosition] = -this.wraperSize + 'px';
			var pos = this.length;
			while(pos--) {
				var slide = this.slides[pos];
				slide.style[this.sizeParam] = this.wraperSize + 'px';
			}
			this.initPosition();
			this.container.style.visibility = 'visible';
		},
		initPosition     : function(num) {
			var pos = this.length, prev, next;
			if(!!arguments.length && typeof num === 'number'){
				prev = num >= this.index ? null : num;
				next = num <= this.index ? null : num;
			} else{
				prev = this.options.loop && this.index == 0 ? this.length - 1 : this.index - 1;
				next = this.options.loop && this.index == this.length - 1 ? 0 : this.index + 1;
			}
			this.prevPage = null;
			this.currPage = null;
			this.nextPage = null;
			while(pos--) {
				var slide = this.slides[pos];
				slide.setAttribute('data-index', pos);
				slide.style[this.sizePosition] = (this.index > pos ? -this.wraperSize : (this.index < pos ? this.wraperSize : 0)) + this.wraperSize + 'px';
				if(pos == prev){
					this.prevPage = slide;
					slide.style[this.sizePosition] = 0 + 'px';
					slide.setAttribute('data-slide', 'prev');
				} else if(pos == this.index){
					this.currPage = slide;
					slide.style[this.sizePosition] = this.wraperSize + 'px';
					slide.setAttribute('data-slide', 'curr');
				} else if(pos == next){
					this.nextPage = slide;
					slide.style[this.sizePosition] = this.wraperSize + this.wraperSize + 'px';
					slide.setAttribute('data-slide', 'next');
				} else{
					slide.setAttribute('data-slide', 'none');
				}
				this._translate(slide, 0, 0);
			}
			this.lastIndex = this.index;
		},
		initEvents       : function() {
			$(win).on('resize', $.proxy(this._resize, this));
			if(this.options.bind){
				this.target.on(Utils.eventName.start, $.proxy(this._start, this));
				if(this.options.drag){
					this.target.on(Utils.eventName.move, $.proxy(this._move, this));
				}
				this.target.on(Utils.eventName.end, $.proxy(this._end, this));
			}
		},
		_translate       : function(slide, dist, speed) {
			var style = slide && slide.style;
			if(style){
				style[Utils.style.transitionDuration] = speed + 'ms';
				style[Utils.style.transform] = 'translate' + this.options.direction.toUpperCase() + '(' + dist + 'px)' + this.translateZ;
			}
		},
		_transformOrigin : function(style, distance) {
			if(distance > 0){
				style[Utils.style.transformOrigin] = this.options.direction === 'x' ? '100% 50%' : '50% 100%';
			} else if(distance < 0){
				style[Utils.style.transformOrigin] = this.options.direction === 'x' ? '0% 50%' : '50% 0%';
			}
		},
		_scale           : function(slide, dist, speed) {
			var style = slide && slide.style;
			if(style){
				var scaleTo = (this.wraperSize - Math.abs(dist) * this.options.zoomIng) / this.wraperSize;
				this._transformOrigin(style, dist);
				style[Utils.style.transitionDuration] = speed + 'ms';
				style[Utils.style.transform] = 'scale3d(' + scaleTo + ', ' + scaleTo + ', ' + scaleTo + ')';
			}
		},
		_resize          : function() {
			this.initNodes();
		},
		_start           : function(e) {
			if(this.options.disablePreventDefault){
				e.preventDefault();
			}
			if(this.options.disableStopPropagation){
				e.stopPropagation();
			}
			if(!this.isAnimating){
				var touches = e.touches ? e.touches[0] : e;
				this.startPosition = {
					x : touches.pageX,
					y : touches.pageY
				};
				this.moveDelta = {
					x : 0,
					y : 0
				};
				this.isAnimating = false;
				this.isMouseDown = true;
				this.hasMoved = false;
				this.firstMoved = true;
				this.disableMove = true;
				this.execEvent('beforetouchStart', [this]);
			}
		},
		_move            : function(e) {
			if(this.options.disablePreventDefault){
				e.preventDefault();
			}
			if(this.options.disableStopPropagation){
				e.stopPropagation();
			}
			if(this.isMouseDown){
				var touches = e.touches ? e.touches[0] : e;
				this.moveDelta = {
					x : touches.pageX - this.startPosition.x,
					y : touches.pageY - this.startPosition.y
				};
				this.moveDistance = this.moveDelta[this.options.direction];
				if((this.options.disableToNext && this.moveDistance < 0) || (this.options.disableToPrev && this.moveDistance > 0)){
					this.disableMove = true;
				} else{
					if(this.firstMoved){
						this.execEvent('touchStart', [this]);
					}
					this.disableMove = false;
					this.firstMoved = false;
					this.hasMoved = true;
					this._effectMove();
					this.execEvent('touchMove', [this]);
				}
			}
		},
		_end             : function(e) {
			if(this.isMouseDown){
				this.isMouseDown = false;
				if(this.options.drag){
					(!this.disableMove && this.hasMoved) && (this._effectEnd());
				} else{
					var touches = e.touches ? e.changedTouches[0] : e;
					this.moveDelta = {
						x : touches.pageX - this.startPosition.x,
						y : touches.pageY - this.startPosition.y
					};
					this.moveDistance = this.moveDelta[this.options.direction];
					this._effectEnd();
				}
				this.execEvent('touchEnd', [this]);
			}
		},
		_effectMove      : function() {
			switch(this.options.animated) {
				case 0:
					this._translate(this.prevPage, this.moveDistance, 0);
					this._translate(this.currPage, this.moveDistance, 0);
					this._translate(this.nextPage, this.moveDistance, 0);
					break;
				case 1:
					this._translate(this.prevPage, this.moveDistance, 0);
					this._scale(this.currPage, this.moveDistance, 0);
					this._translate(this.nextPage, this.moveDistance, 0);
					break;
				case 2:
					if(!!this.prevPage){
						this._translate(this.prevPage, this.moveDistance, 0);
					} else{
						this._translate(this.currPage, this.moveDistance, 0);
					}
					if(!!this.nextPage){
						this._translate(this.nextPage, this.moveDistance, 0);
					} else{
						this._translate(this.currPage, this.moveDistance, 0);
					}
					break;
			}
		},
		_effectEnd       : function(distance, to, speed) {
			var size;
			this.isAnimating = true;
			distance = arguments.length == 3 ? arguments[0] : this.moveDistance;
			speed = arguments.length == 3 ? arguments[2] : this.options.speed;
			if(distance > this.options.distanceValue && !!this.prevPage){
				size = this.wraperSize;
				this.index = arguments.length == 3 ? to : (this.options.loop && this.index == 0) ? (this.length - 1) : (this.index - 1);
			} else if(distance < -this.options.distanceValue && !!this.nextPage){
				size = -this.wraperSize;
				this.index = arguments.length == 3 ? to : (this.options.loop && this.index == this.length - 1) ? 0 : (this.index + 1);
			} else{
				this.hasMoved = false;
				size = 0;
			}
			switch(this.options.animated) {
				case 0:
					this._translate(this.prevPage, size, speed);
					this._translate(this.currPage, size, speed);
					this._translate(this.nextPage, size, speed);
					break;
				case 1:
					this._translate(this.prevPage, size, speed);
					this._scale(this.currPage, size, speed);
					this._translate(this.nextPage, size, speed);
					break;
				case 2:
					if(!!this.prevPage){
						this._translate(this.prevPage, size, speed);
					} else{
						this._translate(this.currPage, size, speed);
					}
					if(!!this.nextPage){
						this._translate(this.nextPage, size, speed);
					} else{
						this._translate(this.currPage, size, speed);
					}
					break;
			}
			setTimeout($.proxy(this._transitionEnd, this), speed);
		},
		_transitionEnd   : function() {
			this.isAnimating = false;
			if(this.lastIndex != this.index){
				this.execEvent('pageCallback', [this]);
			}
			this.execEvent('transitionEnd', [this]);
			this.initPosition();
		},
		prev             : function() {
			var prev = this.options.loop && this.index == 0 ? this.length - 1 : this.index - 1;
			this.slideTo(prev);
		},
		next             : function() {
			var next = this.options.loop && this.index == this.length - 1 ? 0 : this.index + 1;
			this.slideTo(next);
		},
		slideTo          : function(num, speed) {
			if(!this.isAnimating && typeof num == 'number'){
				var that = this, symbol;
				if(num == this.index){
					this.isAnimating = false;
				} else{
					this.isAnimating = true;
					symbol = (num > this.index ? -1 : 1) * 200;
					this.initPosition(num);
					this.execEvent('beforeSlide', [this, num]);
					speed = speed || this.options.speed;
					setTimeout($.proxy(this._effectEnd, this), 20, symbol, num, speed);
				}
			}
		}
	};
	$.fn.mSwipe = function(options) {
		return this.each(function() {
			var $this = $(this);
			if(!$this.data('mSwipe')){
				$this.data('mSwipe', new Swipe(this, options));
			}
		});
	};
})(Zepto, window);

