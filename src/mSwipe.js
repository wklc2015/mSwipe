/**
 * mSwipe.js plugin
 * depend some tools function
 * Utils.extend
 * Utils.hasPerspective
 * Utils.removeEvent
 * Utils.addEvent
 * Utils.hasPointer
 * Utils.hasTouch
 * Utils.prefixPointerEvent
 * Utils.style.transitionDuration
 * Utils.style.transform
 * Utils.style.transformOrigin
 * Utils.eventType
 * */
BASE.namespace('BASE.COM.mSwipe');
BASE.COM.mSwipe = (function() {
	var Utils = BASE.COM.Utils,
		eventName = {
			start : ['mousedown', 'touchstart'][Number(Utils.hasTouch)],
			move  : ['mousemove', 'touchmove'][Number(Utils.hasTouch)],
			end   : ['mouseup', 'touchend'][Number(Utils.hasTouch)]
		},
		Init = function(container, options) {
			return new Swipe(container, options);
		};

	function Swipe(container, options) {
		"use strict";
		this.container = typeof container === 'string' ? document.getElementById(container) : container;
		if(!this.container) return;
		this.options = {
			selector               : '.mSwipe-items',
			animated               : 0,
			zoomTo                 : 0.2,
			zoomIng                : 0.1,
			startSlide             : 0,
			speed                  : 400,
			distanceValue          : 10,
			direction              : 'y',
			disableToNext          : false,
			disableToPrev          : false,
			disableToLoop          : false,
			disablePreventDefault  : true,
			disableStopPropagation : true,
			bindToWrapper          : true,
			translateZ             : true,
			drag                   : true
		};
		Utils.extend(this.options, options);
		this.slides = this.container.querySelectorAll(this.options.selector);
		this.animated = this.options.animated;
		this.zoomTo = this.options.zoomTo < 0.9 && this.options.zoomTo > 0.5 ? this.options.zoomTo : 0.9;
		this.currIndex = this.options.startSlide;
		this.speed = this.options.speed;
		this.distanceValue = this.options.distanceValue;
		this.direction = this.options.direction && this.options.direction == 'x' ? 'x' : 'y';
		this.translateZ = Utils.hasPerspective && this.options.translateZ ? ' translateZ(0)' : '';

		this.disableToNext = this.options.disableToNext;
		this.disableToPrev = this.options.disableToPrev;
		this.disableToLoop = this.options.disableToLoop;
		this.disablePreventDefault = this.options.disablePreventDefault;
		this.disableStopPropagation = this.options.disableStopPropagation;

		this.startPosition = {};
		this.moveDelta = {};
		this._events = {};
		this.isAnimating = false;
		this.isMouseDown = false;
		this.hasMoved = false;
		this.moved = false;
		this.distance = 0;
		//this.init();
		this.target = this.options.bindToWrapper ? this.container : window;
	}

	Swipe.prototype = {
		init               : function(event) {
			this.initNodes(true);
			this._resize();
			if(!event){
				this._start();
				this.options.drag && (this._move());
				this._end();
			}
		},
		on                 : function(type, fn) {
			if(!this._events[type]){
				this._events[type] = [];
			}
			this._events[type].push(fn);
		},
		off                : function(type, fn) {
			if(this._events[type]){
				var index = this._events[type].indexOf(fn);
				if(index > -1){
					this._events[type].splice(index, 1);
				}
			}
		},
		_execEvent         : function(type) {
			var that = this;
			if(this._events[type]){
				for(var i = 0, l = this._events[type].length; i < l; i++){
					this._events[type][i].apply(this, [].slice.call(arguments, 1));
				}
			}
		},
		_start             : function() {
			var that = this;
			this.container.addEventListener(eventName.start, function(e) {
				if(Utils.eventType[e.type] != 1){
					if(e.button !== 0){
						return;
					}
				}
				if(that.disablePreventDefault){
					e.preventDefault();
				}
				if(that.disableStopPropagation){
					e.stopPropagation();
				}
				if(!that.isAnimating){
					var touches = e.touches ? e.touches[0] : e;
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
					that.firstMoved = true;
					that.disableMove = true;
					that._execEvent('beforetouchStart', [that]);
				}
			}, false);
		},
		_move              : function() {
			var that = this;
			this.container.addEventListener(eventName.move, function(e) {
				if(that.disablePreventDefault){
					e.preventDefault();
				}
				if(that.disableStopPropagation){
					e.stopPropagation();
				}
				if(that.isMouseDown){
					var touches = e.touches ? e.touches[0] : e;
					that.moveDelta = {
						x : touches.pageX - that.startPosition.x,
						y : touches.pageY - that.startPosition.y
					};
					that.distance = that.moveDelta[that.direction];
					if((that.disableToNext && that.moveDelta[that.direction] < 0) || (that.disableToPrev && that.moveDelta[that.direction] > 0)){
						that.disableMove = true;
					} else{
						if(that.firstMoved){
							that._execEvent('touchStart', [that]);
						}
						that.disableMove = false;
						that.moved = true;
						that.firstMoved = false;
						/*start move*/
						that._effectMove(that.distance);
						that._execEvent('touchMove', [that]);
					}
				}
			}, false);
		},
		_effectMove        : function(distance) {
			var activePageArray = [this.prevPage, this.currPage, this.nextPage];
			var absDistance = Math.abs(distance), activePage, otherPage;
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
					this.setTransformOrigin(distance);
					if(distance > 0){
						activePage = this.prevPage;
						otherPage = this.nextPage;
					} else{
						activePage = this.nextPage;
						otherPage = this.prevPage;
					}
					this.currPage.style[Utils.style.transformOrigin] = this.origin;
					if(activePage){
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance + 'px)' + this.translateZ;
						this.currPage.style[Utils.style.transform] = 'scale(' + (this.size - absDistance * this.options.zoomIng) / this.size + ')' + this.translateZ;
					} else{
						this.currPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance / 2 + 'px)' + this.translateZ;
					}
					otherPage && (otherPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(0px)' + this.translateZ);
					break;
				case 2:
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
		_end               : function() {
			var that = this;
			this.container.addEventListener(eventName.end, function(e) {
				if(that.isMouseDown){
					that.isMouseDown = false;
					if(that.options.drag){
						(!that.disableMove && that.moved) && (that._effectEnd(that.distance));
					} else{
						var touches = e.touches ? e.changedTouches[0] : e;
						that.moveDelta = {
							x : touches.pageX - that.startPosition.x,
							y : touches.pageY - that.startPosition.y
						};
						that.setTransformOrigin(that.moveDelta[that.direction]);
						setTimeout(function() {
							that._effectEnd(that.moveDelta[that.direction]);
						}, 10)
					}
					that._execEvent('touchEnd', [that]);
				}
			}, false);
		},
		_effectEnd         : function(distance, btn, speed) {
			this.isAnimating = true;
			var value = this.distanceValue;
			var speed = speed || this.speed;
			var activePageArray = [this.prevPage, this.currPage, this.nextPage], size, activePage;
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
							activePageArray[i].style[Utils.style.transitionDuration] = speed + 'ms';
							activePageArray[i].style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
						}
					}
					break;
				case 1:
					this.currPage.style[Utils.style.transitionDuration] = speed + 'ms';
					this.currPage.style[Utils.style.transformOrigin] = this.origin;
					if(activePage){
						activePage.style[Utils.style.transitionDuration] = speed + 'ms';
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
						if(size == 0){
							this.currPage.style[Utils.style.transform] = 'scale(1) translate(0px, 0px)' + this.translateZ;
						} else{
							this.currPage.style[Utils.style.transform] = 'scale(' + this.zoomTo + ') translate(0px, 0px)' + this.translateZ;
						}
					} else{
						this.currPage.style[Utils.style.transform] = (this.zoomTo != 'null' ? 'scale(1)' : '') + ' translate(0px, 0px)';
					}
					break;
				case 2:
					if(activePage){
						activePage.style[Utils.style.transitionDuration] = speed + 'ms';
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
					} else{
						this.currPage.style[Utils.style.transitionDuration] = speed + 'ms';
						this.currPage.style[Utils.style.transform] = ' translate(0px, 0px)' + this.translateZ;
					}
					break;
			}

			var that = this;
			setTimeout(function() {
				that._transitionEnd(btn);
			}, speed)
		},
		_resize            : function() {
			var that = this;
			window.addEventListener('resize', function() {
				that.initNodes();
			}, false);
		},
		_transitionEnd     : function(btn) {
			this.isAnimating = false;
			if(this.lastIndex != this.currIndex || btn){
				this._execEvent('pageCallback', [this]);
			}
			this._execEvent('transitionEnd', [this]);
			this.initPosition(true);
		},
		setTransformOrigin : function(distance) {
			if(distance > 0){
				this.origin = this.direction === 'x' ? '100% 50%' : '50% 100%';
			} else{
				this.origin = this.direction === 'x' ? '0% 50%' : '50% 0%';
			}
		},
		initNodes          : function(hasMOved) {
			this.length = this.slides.length;
			var width = this.container.getBoundingClientRect().width || this.container.offsetWidth;
			var height = this.container.getBoundingClientRect().height || this.container.offsetHeight;
			this.size = this.direction === 'x' ? width : height;
			this.initPosition(hasMOved);
			for(var i = 0; i < this.length; i++){
				this.slides[i].style.width = width + 'px';
				this.slides[i].style.height = height + 'px';
			}
		},
		initPosition       : function(hasMoved) {
			if(hasMoved){
				if(this.disableToLoop){
					this.prevIndex = this.currIndex <= 0 ? null : this.currIndex - 1;
					this.nextIndex = this.currIndex >= this.length - 1 ? null : this.currIndex + 1;
				} else{
					this.prevIndex = this.currIndex <= 0 ? this.length - 1 : this.currIndex - 1;
					this.nextIndex = this.currIndex >= this.length - 1 ? 0 : this.currIndex + 1;
				}
			}
			var pos = this.direction === 'x' ? 'left' : 'top';
			for(var i = 0; i < this.length; i++){
				if(i == this.prevIndex){
					this.slides[i].style[pos] = -this.size + 'px';
					this.slides[i].setAttribute('data-slide', 'prev');
					this.prevPage = this.slides[this.prevIndex];
				} else if(i == this.currIndex){
					this.slides[i].style[pos] = '0px';
					this.slides[i].setAttribute('data-slide', 'curr');
					this.currPage = this.slides[this.currIndex];
				} else if(i == this.nextIndex){
					this.slides[i].style[pos] = this.size + 'px';
					this.slides[i].setAttribute('data-slide', 'next');
					this.nextPage = this.slides[this.nextIndex];
				} else{
					this.slides[i].style[pos] = '0px';
					this.slides[i].setAttribute('data-slide', 'none');
				}
				this.slides[i].style[Utils.style.transitionDuration] = '0s';
				this.slides[i].style[Utils.style.transform] = 'none';
			}
			this.lastIndex = this.currIndex;
		},
		prev               : function() {
			this.slideTo(this.prevIndex);
		},
		next               : function() {
			this.slideTo(this.nextIndex);
		},
		slideTo            : function(num, speed) {
			if(!this.isAnimating && typeof num == 'number'){
				var that = this, symbol;
				if(num == this.currIndex){
					this.isAnimating = false;
				} else{
					this.isAnimating = true;
					if(num > this.currIndex){
						this.nextIndex = num;
						this.prevIndex = null;
						this.prevPage = null;
						symbol = -200;
						this.origin = this.direction === 'x' ? '0% 50%' : '50% 0%';
					} else{
						this.prevIndex = num;
						this.nextIndex = null;
						this.nextPage = null;
						symbol = 200;
						this.origin = this.direction === 'x' ? '100% 50%' : '50% 100%';
					}
					this.currPage.style[Utils.style.transformOrigin] = this.origin;
					this.initPosition();
					this._execEvent('beforeSlide', [that, num]);
					setTimeout(function() {
						that._effectEnd(symbol, true, speed);
					}, 10)
				}
			}
		}
	};
	return {
		init : Init
	}
}());
