var BASE = BASE || {};
/**
 * 命名空间函数
 * */
BASE.namespace = function(name) {
	var parts = name.split('.'),
		i, size, parent = BASE;
	if(parts[0] === 'BASE'){
		parts = parts.slice(1);
	}
	size = parts.length;
	for(i = 0; i < size; i++){
		if(typeof parent[parts[i]] === 'undefined'){
			parent[parts[i]] = {};
		}
		parent = parent[parts[i]];
	}
	return parent;
};
/**
 * 工具函数
 * */
BASE.namespace('BASE.COM.Utils');
BASE.COM.Utils = (function() {
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

	me.extend = function(target, obj) {
		for(var i in obj){
			target[i] = obj[i];
		}
	};
	me.extend(me.eventType = {}, {
		touchstart : 1,
		touchmove  : 1,
		touchend   : 1,

		mousedown : 2,
		mousemove : 2,
		mouseup   : 2,

		pointerdown : 3,
		pointermove : 3,
		pointerup   : 3,

		MSPointerDown : 3,
		MSPointerMove : 3,
		MSPointerUp   : 3
	});
	me.addEvent = function(el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	};
	me.removeEvent = function(el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	};
	me.hasClass = function(e, c) {
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
		return re.test(e.className);
	};
	me.addClass = function(e, c) {
		if(me.hasClass(e, c)){
			return;
		}
		var newclass = e.className.split(' ');
		newclass.push(c);
		e.className = newclass.join(' ');
	};
	me.removeClass = function(e, c) {
		if(!me.hasClass(e, c)){
			return;
		}
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
		e.className = e.className.replace(re, ' ');
	};
	var _transform = _prefixStyle('transform');
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
	return me;
}());
/**
 * 滑动函数
 * */
BASE.namespace('BASE.COM.mSwipe');
BASE.COM.mSwipe = (function() {
	var Utils = BASE.COM.Utils,
		Init = function(container, options) {
			return new Swipe(container, options);
		};

	function Swipe(container, options) {
		"use strict";
		this.container = typeof container === 'string' ? document.getElementById(container) : container;
		if(!this.container) return;
		this.options = {
			animated   : 0,
			/*0:平滑,1:缩放,2:覆盖*/
			scaleTo    : 0.2,
			/*effected when animated = 1*/
			translateZ : true,
			callback   : null
		};
		Utils.extend(this.options, options);
		this.slides = this.container.querySelectorAll(this.options.Selector || '.mSwipe-items');
		this.animated = this.options.animated;
		this.currIndex = this.options.startSlide || 0;
		this.speed = (this.options.speed || '400') + 'ms';
		this.distanceValue = this.options.distanceValue || 10;
		this.scaleTo = this.options.scaleTo < 1 && this.options.scaleTo >= 0 ? this.options.scaleTo : 'null';
		this.translateZ = Utils.hasPerspective && this.options.translateZ ? ' translateZ(0)' : '';
		this.direction = this.options.direction && this.options.direction == 'x' ? 'x' : 'y';

		this.toNext = this.options.toNext || true;
		this.toPrev = this.options.toPrev || true;
		this.loop = this.options.loop || true;
		this.disablePreventDefault = this.options.disablePreventDefault || true;
		this.disableStopPropagation = this.options.disableStopPropagation || true;
		this.startPosition = {};
		this.moveDelta = {};
		this.isAnimating = false;
		this.isMouseDown = false;
		this.hasMoved = false;
		this.moved = false;
		this.distance = 0;
		this.init();
	}

	Swipe.prototype = {
		init           : function(remove) {
			this.initNodes(true);
			this._start();
			this._move();
			this._end();
			this._resize();
		},
		_start         : function() {
			var that = this;
			this.container.addEventListener('touchstart', function(e) {
				if(that.disablePreventDefault){
					e.preventDefault();
				}
				if(that.disableStopPropagation){
					e.stopPropagation();
				}
				if(!that.isAnimating){
					var touches = e.touches[0];
					that.startPosition = {
						x : touches.pageX,
						y : touches.pageY
					};
					that.moveDelta = {
						x : 0,
						y : 0
					};
					that.isAnimating = false;
					that.isMouseDown = true;
					that.moved = false;
					that.disableMove = true;
				} else{
					that.isMouseDown = false;
				}
			}, false);
		},
		_move          : function() {
			var that = this;
			this.container.addEventListener('touchmove', function(e) {
				if(that.disablePreventDefault){
					e.preventDefault();
				}
				if(that.disableStopPropagation){
					e.stopPropagation();
				}
				if(that.isMouseDown){
					var touches = e.touches[0];
					that.moveDelta = {
						x : touches.pageX - that.startPosition.x,
						y : touches.pageY - that.startPosition.y
					};
					that.distance = that.moveDelta[that.direction];
					if((!that.toNext && that.moveDelta[that.direction] < 0) || (!that.toPrev && that.moveDelta[that.direction] > 0)){
						that.disableMove = true;
					} else{
						that.disableMove = false;
						that.moved = true;
						/*start move*/
						that._effectMove(that.distance);
					}
				}
			}, false)

		},
		_effectMove    : function(distance) {
			var activePageArray = [this.prevPage, this.currPage, this.nextPage];
			switch(this.animated) {
				case 0:
					for(var i = 0, len = 3; i < len; i++){
						if(activePageArray[i]){
							activePageArray[i].style[Utils.style.transitionDuration] = '0ms';
							activePageArray[i].style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance + 'px)' + this.translateZ;
						}
					}
					break;
				case 1:
					var absDistance = Math.abs(distance), activePage, otherPage;
					if(distance > 0){
						activePage = this.prevPage;
						otherPage = this.nextPage;
						this.oragin = this.direction === 'x' ? '100% 50%' : '50% 100%';
						this.currPage.style[Utils.style.transformOrigin] = '50% 100%';
					} else{
						activePage = this.nextPage;
						otherPage = this.prevPage;
						this.oragin = this.direction === 'x' ? '0% 50%' : '50% 0%';
					}
					this.currPage.style[Utils.style.transformOrigin] = this.oragin;
					if(activePage){
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance + 'px)' + this.translateZ;
						(this.scaleTo != 'null') && (this.currPage.style[Utils.style.transform] = 'scale(' + (this.size - absDistance) / this.size + ')' + this.translateZ);
					} else{
						this.currPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance / 2 + 'px)' + this.translateZ;
					}
					otherPage && (otherPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(0px)');
					break;
				case 2:
					var absDistance = Math.abs(distance), activePage, otherPage;
					if(distance > 0){
						activePage = this.prevPage;
						otherPage = this.nextPage;
					} else{
						activePage = this.nextPage;
						otherPage = this.prevPage;
					}
					if(activePage){
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance + 'px)' + this.translateZ;
					} else{
						this.currPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance / 2 + 'px)' + this.translateZ;
					}
					otherPage && (otherPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(0px)' + this.translateZ);
					break;
			}
		},
		_end           : function() {
			var that = this;
			this.container.addEventListener('touchend', function(e) {
				if(that.isMouseDown){
					that.isMouseDown = false;
					(!that.disabled && that.moved) && (that._effectEnd(that.distance));
				}
			}, false)
		},
		_effectEnd     : function(distance) {
			var that = this;
			this.isAnimating = true;
			var value = this.distanceValue;
			var activePageArray = [this.prevPage, this.currPage, this.nextPage],
				size, activePage;
			if(distance > value && this.prevPage){
				//to prev
				this.hasMoved = true;
				size = this.size;
				this.currIndex = this.prevIndex;
				activePage = this.prevPage;
			} else if(distance < -value && this.nextPage){
				//to next
				this.hasMoved = true;
				size = -this.size;
				this.currIndex = this.nextIndex;
				activePage = this.nextPage;
			} else{
				//not move
				this.hasMoved = false;
				size = 0;
				if(distance > 0){
					activePage = this.prevPage;
				} else{
					activePage = this.nextPage;
				}
			}
			switch(this.animated) {
				case 0:
					for(var i = 0, len = 3; i < len; i++){
						if(activePageArray[i]){
							activePageArray[i].style[Utils.style.transitionDuration] = this.speed;
							activePageArray[i].style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
						}
					}
					break;
				case 1:
					this.currPage.style[Utils.style.transitionDuration] = this.speed;
					if(activePage){
						activePage.style[Utils.style.transitionDuration] = this.speed;
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
						(this.scaleTo != 'null') && (this.currPage.style[Utils.style.transform] = 'scale(' + this.scaleTo + ') translate(0px, 0px)' + this.translateZ);
					} else{
						this.currPage.style[Utils.style.transform] = (this.scaleTo != 'null' ? 'scale(1)' : '') + ' translate(0px, 0px)' + this.translateZ;
					}
					break;
				case 2:
					if(activePage){
						activePage.style[Utils.style.transitionDuration] = this.speed;
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
					} else{
						this.currPage.style[Utils.style.transitionDuration] = this.speed;
						this.currPage.style[Utils.style.transform] = ' translate(0px, 0px)' + this.translateZ;
					}
					break;
			}
			var hasBind = false;
			for(var i = 0, len = 3; i < len; i++){
				if(activePageArray[i] && !hasBind){
					activePageArray[i].addEventListener('transitionend', function() {
						that._transitionEnd();
					}, false);
					activePageArray[i].addEventListener('webkitTransitionEnd', function() {
						that._transitionEnd();
					}, false);
				}
			}
		},
		_resize        : function() {
			var that = this;
			window.addEventListener('resize', function() {
				that.initNodes();
			}, false);
		},
		_transitionEnd : function() {
			this.isAnimating = false;
			this.initPosition(this.hasMoved);
			console.log(2)
			if(this.options.callback && '[object Function]' === Object.prototype.toString.call(this.options.callback)){
				this.options.callback(this);
			}
		},
		initNodes      : function(hasMOved) {
			var that = this;
			that.length = that.slides.length;
			var width = that.container.getBoundingClientRect().width || that.container.offsetWidth;
			var height = that.container.getBoundingClientRect().height || that.container.offsetHeight;
			that.size = that.direction === 'x' ? width : height;
			that.initPosition(hasMOved);
			for(var i = 0; i < that.length; i++){
				that.slides[i].style[Utils.style.transitionTimingFunction] = 'ease-out';
				that.slides[i].style.width = width + 'px';
				that.slides[i].style.height = height + 'px';
			}
		},
		initPosition   : function(hasMoved) {
			if(hasMoved){
				this.prevIndex = this.currIndex <= 0 ? null : this.currIndex - 1;
				this.nextIndex = this.currIndex >= this.length - 1 ? null : this.currIndex + 1;
				this.prevPage = this.slides[this.prevIndex];
				this.currPage = this.slides[this.currIndex];
				this.nextPage = this.slides[this.nextIndex];
			}
			var pos = this.direction === 'x' ? 'left' : 'top';
			for(var i = 0; i < this.length; i++){
				if(i == this.prevIndex){
					this.slides[i].style[pos] = -this.size + 'px';
					this.slides[i].setAttribute('data-slide', 'prev');
				} else if(i == this.currIndex){
					this.slides[i].style[pos] = '0px';
					this.slides[i].setAttribute('data-slide', 'curr');
				} else if(i == this.nextIndex){
					this.slides[i].style[pos] = this.size + 'px';
					this.slides[i].setAttribute('data-slide', 'next');
				} else{
					this.slides[i].style[pos] = '0px';
					this.slides[i].setAttribute('data-slide', 'none');
				}
				this.slides[i].style[Utils.style.transitionDuration] = '0s';
				this.slides[i].style[Utils.style.transform] = 'none';
			}
		},
		prev           : function() {
			this.slideTo(this.prevIndex);
		},
		next           : function() {
			this.slideTo(this.nextIndex);
		},
		slideTo        : function(num) {
			if(!this.isAnimating && typeof num == 'number'){
				var self = this, symbol, oragin;
				if(num == this.currIndex){
					this.isAnimating = false;
				} else{
					this.isAnimating = true;
					if(num > this.currIndex){
						this.nextIndex = num;
						this.nextPage = this.slides[this.nextIndex];
						symbol = -200;
						oragin = this.direction === 'x' ? '0% 50%' : '50% 0%';
					} else{
						this.prevIndex = num;
						this.prevPage = this.slides[this.prevIndex];
						symbol = 200;
						oragin = this.direction === 'x' ? '100% 50%' : '50% 100%';
					}
					this.currPage.style[Utils.style.transformOrigin] = oragin;
					this.initPosition();
					setTimeout(function() {
						self._effectEnd(symbol);
					}, 1)
				}
			}
		}
	}
	return {
		init : Init
	}
}());

function Loaded() {
	var Utils = BASE.COM.Utils;
	var Events = Utils.hasTouch ? 'touchstart' : 'click';
	var mSwipe = BASE.COM.mSwipe.init('mSwipe', {
		direction : 'y',
		//						speed: 10000,
						startSlide: 0,
		animated  : 1,
		callback  : function(a) {
			//			console.log(a)
		}
	});

	function Header(PageSwipe) {
		var indexHeader = document.querySelector('.indexHeader');
		var li = indexHeader.querySelectorAll('li');
		for(var i = 0, length = li.length; i < length; i++){
			(function(i) {
				Utils.addEvent(li[i], Events, function() {
					var page = parseInt(this.innerHTML, 10) - 1;
					PageSwipe.slideTo(page);
				}, false)
			}(i))
		}
		;
		var btn = document.querySelectorAll('p[data-btn]');
		for(var j = 0, btnLenth = btn.length; j < btnLenth; j++){
			(function(i) {
				Utils.addEvent(btn[i], Events, function(e) {
					e.preventDefault();
					e.stopPropagation();
					var a = this.getAttribute('data-btn');
					var b = this.getAttribute('data-params');
					if(b){
						PageSwipe[a] = !!parseInt(b, 10);
					} else{
						PageSwipe[a]();
					}
					return false;
				})
			}(j))
		}
	}

	Header(mSwipe);
}
