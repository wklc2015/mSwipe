/**
 * mSwipe.js plugin
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
			selector               : '.mSwipe-items',
			/*0:translation,1:scale,2:cover*/
			animated               : 0,
			/*effected when animated = 1*/
			scaleTo                : 0.2,
			startSlide             : 0,
			speed                  : 400,
			distanceValue          : 100,
			direction              : 'y',
			disableToNext          : false,
			disableToPrev          : false,
			disableToLoop          : false,
			disablePreventDefault  : true,
			disableStopPropagation : true,
			bindToWrapper          : true,
			disableMouse           : true,
			disablePointer         : true,
			disableTouch           : false,
			disableClass           : 'preventDefault',
			translateZ             : true,
			drag                   : true,
			callback               : null
		};
		Utils.extend(this.options, options);
		this.slides = this.container.querySelectorAll(this.options.selector);
		this.animated = this.options.animated;
		this.scaleTo = this.options.scaleTo < 1 && this.options.scaleTo >= 0 ? this.options.scaleTo : 0.2;
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
		this.isAnimating = false;
		this.isMouseDown = false;
		this.hasMoved = false;
		this.moved = false;
		this.distance = 0;
		this.init();
	}

	Swipe.prototype = {
		init               : function(remove) {
			this.initNodes(true);
			this._initEvent();
		},
		handleEvent        : function(e) {
			var target = e.target;
			var cls = target.className;
			if(target == window || (cls.indexOf(this.options.disableClass) == -1)){
				switch(e.type) {
					case 'touchstart':
					case 'pointerdown':
					case 'MSPointerDown':
					case 'mousedown':
						this._start(e);
						break;
					case 'touchmove':
					case 'pointermove':
					case 'MSPointerMove':
					case 'mousemove':
						this.options.drag && (this._move(e));
						break;
					case 'touchend':
					case 'pointerup':
					case 'MSPointerUp':
					case 'mouseup':
					case 'touchcancel':
					case 'pointercancel':
					case 'MSPointerCancel':
					case 'mousecancel':
						this._end(e);
						break;
					case 'orientationchange':
					case 'resize':
						this._resize();
						break;
					case 'transitionend':
					case 'webkitTransitionEnd':
					case 'oTransitionEnd':
					case 'MSTransitionEnd':
						this._transitionEnd(e);
						break;
				}
			}
		},
		_initEvent         : function(remove) {
			var eventType = remove ? Utils.removeEvent : Utils.addEvent,
				target = this.options.bindToWrapper ? this.container : window;
			eventType(window, 'orientationchange', this);
			eventType(window, 'resize', this);
			if(!this.options.disableMouse){
				eventType(this.container, 'mousedown', this);
				eventType(target, 'mousemove', this);
				eventType(target, 'mousecancel', this);
				eventType(target, 'mouseup', this);
			}
			if(Utils.hasPointer && !this.options.disablePointer){
				eventType(this.container, Utils.prefixPointerEvent('pointerdown'), this);
				eventType(target, Utils.prefixPointerEvent('pointermove'), this);
				eventType(target, Utils.prefixPointerEvent('pointercancel'), this);
				eventType(target, Utils.prefixPointerEvent('pointerup'), this);
			}
			if(Utils.hasTouch && !this.options.disableTouch){
				eventType(this.container, 'touchstart', this);
				eventType(target, 'touchmove', this);
				eventType(target, 'touchcancel', this);
				eventType(target, 'touchend', this);
			}
		},
		_destroy           : function() {
			this._initEvents(true);
		},
		_start             : function(e) {
			if(this.disablePreventDefault){
				e.preventDefault();
			}
			if(this.disableStopPropagation){
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
				this.moved = false;
				this.disableMove = true;
			}
		},
		_move              : function(e) {
			if(this.disablePreventDefault){
				e.preventDefault();
			}
			if(this.disableStopPropagation){
				e.stopPropagation();
			}
			if(this.isMouseDown){
				var touches = e.touches ? e.touches[0] : e;
				this.moveDelta = {
					x : touches.pageX - this.startPosition.x,
					y : touches.pageY - this.startPosition.y
				};
				this.distance = this.moveDelta[this.direction];
				if((this.disableToNext && this.moveDelta[this.direction] < 0) || (this.disableToPrev && this.moveDelta[this.direction] > 0)){
					this.disableMove = true;
				} else{
					this.disableMove = false;
					this.moved = true;
					/*start move*/
					this._effectMove(this.distance);
				}
			}

		},
		_effectMove        : function(distance) {
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
						this.currPage.style[Utils.style.transform] = 'scale(' + (this.size - absDistance) / this.size + ')' + this.translateZ;
					} else{
						this.currPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + distance / 2 + 'px)' + this.translateZ;
					}
					otherPage && (otherPage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(0px)' + this.translateZ);
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
		_end               : function(e) {
			var that = this;
			if(this.isMouseDown){
				this.isMouseDown = false;
				if(this.options.drag){
					(!this.disableMove && this.moved) && (this._effectEnd(this.distance));
				} else{
					var touches = e.touches ? e.changedTouches[0] : e;
					this.moveDelta = {
						x : touches.pageX - this.startPosition.x,
						y : touches.pageY - this.startPosition.y
					};
					this.setTransformOrigin(this.moveDelta[this.direction]);
					setTimeout(function() {
						that._effectEnd(that.moveDelta[that.direction]);
					}, 100)
				}
			}
		},
		_effectEnd         : function(distance, btn) {
			this.isAnimating = true;
			var value = this.distanceValue;
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
							activePageArray[i].style[Utils.style.transitionDuration] = this.speed + 'ms';
							activePageArray[i].style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
						}
					}
					break;
				case 1:
					this.currPage.style[Utils.style.transitionDuration] = this.speed + 'ms';
					this.currPage.style[Utils.style.transformOrigin] = this.origin;
					if(activePage){
						activePage.style[Utils.style.transitionDuration] = this.speed + 'ms';
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
						if(size == 0){
							this.currPage.style[Utils.style.transform] = 'scale(1) translate(0px, 0px)' + this.translateZ;
						} else{
							this.currPage.style[Utils.style.transform] = 'scale(' + this.scaleTo + ') translate(0px, 0px)' + this.translateZ;
						}
					} else{
						this.currPage.style[Utils.style.transform] = (this.scaleTo != 'null' ? 'scale(1)' : '') + ' translate(0px, 0px)';
					}
					break;
				case 2:
					if(activePage){
						activePage.style[Utils.style.transitionDuration] = this.speed + 'ms';
						activePage.style[Utils.style.transform] = 'translate' + this.direction.toUpperCase() + '(' + size + 'px)' + this.translateZ;
					} else{
						this.currPage.style[Utils.style.transitionDuration] = this.speed + 'ms';
						this.currPage.style[Utils.style.transform] = ' translate(0px, 0px)' + this.translateZ;
					}
					break;
			}

			var that = this;
			setTimeout(function() {
				that._transitionEnd(btn);
			}, this.speed)
		},
		_resize            : function() {
			this.initNodes();
		},
		_transitionEnd     : function(btn) {
			this.isAnimating = false;
			if(this.lastIndex != this.currIndex || btn){
				if(this.options.callback && '[object Function]' === Object.prototype.toString.call(this.options.callback)){
					this.options.callback(this);
				}
			}
			this.initPosition(this.hasMoved);
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
				this.prevIndex = this.currIndex <= 0 ? null : this.currIndex - 1;
				this.nextIndex = this.currIndex >= this.length - 1 ? null : this.currIndex + 1;
				this.prevPage = this.slides[this.prevIndex];
				this.currPage = this.slides[this.currIndex];
				this.nextPage = this.slides[this.nextIndex];
			}
			this.lastIndex = this.currIndex;
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
		prev               : function() {
			this.slideTo(this.prevIndex);
		},
		next               : function() {
			this.slideTo(this.nextIndex);
		},
		slideTo            : function(num) {
			if(!this.isAnimating && typeof num == 'number'){
				var self = this, symbol, origin;
				if(num == this.currIndex){
					this.isAnimating = false;
				} else{
					this.isAnimating = true;
					if(num > this.currIndex){
						this.nextIndex = num;
						this.nextPage = this.slides[this.nextIndex];
						symbol = -200;
						this.origin = this.direction === 'x' ? '0% 50%' : '50% 0%';
					} else{
						this.prevIndex = num;
						this.prevPage = this.slides[this.prevIndex];
						symbol = 200;
						this.origin = this.direction === 'x' ? '100% 50%' : '50% 100%';
					}
					this.currPage.style[Utils.style.transformOrigin] = origin;
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
