/**
 * zepto.mSwipe.js plugin
 * v 2.2
 * */
BASE.namespace('BASE.COM.mSwipe');
BASE.COM.mSwipe = (function ($, win, doc) {
    var Utils = BASE.COM.mUtils;

    function Swipe(container, options) {
        "use strict";
        this.container = typeof container === "string" ? doc.getElementById(container) : container;
        if (!this.container) return;
        this.element = this.container.children[0];
        this.options = $.extend({}, {
            animated       : 0,
            zoomTo         : 0.9,
            zoomIng        : 0.2,
            startSlide     : 0,
            speed          : 300,
            direction      : 'y',
            distanceValue  : 10,
            loop           : true,
            disableToPrev  : false,
            disableToNext  : false,
            translateZ     : true,
            bindToContainer: true,
            drag           : true,
            bind           : true,
            showIcons      : false,
            iconsClass     : null,
            autoPlay       : false
        }, options);
        this.index = this.options.startSlide;
        this.translateZ = Utils.hasPerspective && this.options.translateZ ? ' translateZ(0px)' : '';
        this.target = $(this.options.bindToContainer ? this.container : window);
        this.startPosition = {};
        this.moveDelta = {};
        this.events = {};
        this.timer = null;
        this.sizeParam = ['height', 'width'][this.options.direction === 'y' ? 0 : 1];
        this.sizePosition = ['top', 'left'][this.options.direction === 'y' ? 0 : 1];
        this.isAnimating = false;
        this.init();
    }

    Swipe.prototype = {
        disableToPrev   : function () {
            this.options.disableToPrev = true;
        },
        enableToPrev    : function () {
            this.options.disableToPrev = false;
        },
        disableToNext   : function () {
            this.options.disableToNext = true;
        },
        enableToNext    : function () {
            this.options.disableToNext = false;
        },
        getIndex        : function () {
            return this.index;
        },
        getLength       : function () {
            return this.length;
        },
        on              : function (type, fn) {
            if (!this.events[type]) {
                this.events[type] = [];
            }
            this.events[type].push(fn);
        },
        off             : function (type, fn) {
            if (this.events[type]) {
                var index = this.events[type].indexOf(fn);
                if (index > -1) {
                    this.events[type].splice(index, 1);
                }
            }
        },
        execEvent       : function (type) {
            var that = this;
            if (this.events[type]) {
                for (var i = 0, l = this.events[type].length; i < l; i++) {
                    this.events[type][i].apply(this, [].slice.call(arguments, 1));
                }
            }
        },
        autoPlay        : function () {
            if (this.options.autoPlay) {
                this.closeAuto();
                this.timer = setTimeout($.proxy(function () {
                    this.slideTo(this._circle(this.index + 1));
                    this.autoPlay();
                }, this), this.options.autoPlay);
            }
        },
        closeAuto:function(){
            clearTimeout(this.timer);
        },
        init            : function () {
            this.initNodes();
            this.initEvents();
            this.autoPlay();
        },
        initNodes       : function () {
            var width = this.container.getBoundingClientRect().width;
            var height = this.container.getBoundingClientRect().height;
            this.slides = this.element.children;
            this.length = this.slides.length;
            this.wraperSize = this.options.direction === 'y' ? height : width;
            this.element.style[this.sizeParam] = (this.length * this.wraperSize) + 'px';
            this.options.showIcons && (this.initIcons());
            this.slidePos = new Array(this.length);
            var pos = this.length;
            while (pos--) {
                var slide = this.slides[pos];
                var dist = this.index > pos ? -this.wraperSize : (this.index < pos ? this.wraperSize : 0);
                slide.setAttribute('data-index', pos);
                slide.style[this.sizeParam] = this.wraperSize + 'px';
                slide.style[this.sizePosition] = (pos * -this.wraperSize) + 'px';
                this._translate(slide, dist, 0);
            }
            this.initPosition();
            this.container.style.visibility = 'visible';
        },
        initIcons       : function () {
            var pos = this.length, html = '';
            this.icons = doc.createElement('ul');
            for (var i = 0; i < this.length; i++) {
                html += '<li>' + i + '</li>';
            }
            this.icons.innerHTML = html;
            this.icons.className = 'mSwipe-icons' + (this.options.iconsClass ? ' ' + this.options.iconsClass : '');
            this.iconsItems = this.icons.children;
            this.container.appendChild(this.icons);
        },
        initPosition    : function (num, back) {
            var pos = this.length, prev, next;
            if (arguments.length == 2 && typeof num === 'number') {
                if(back){
                    prev = num;
                    next = null;
                }else{
                    prev = null;
                    next = num;
                }
            } else {
                prev = this._circle(this.index - 1);
                next = this._circle(this.index + 1);
            }
            this.prevPage = null;
            this.currPage = null;
            this.nextPage = null;
            while (pos--) {
                var slide = this.slides[pos];
                var dist = this.index > pos ? -this.wraperSize : (this.index < pos ? this.wraperSize : 0);
                if (pos == prev) {
                    this.prevPage = slide;
                    slide.setAttribute('data-slide', 'prev');
                    this._translate(slide, -this.wraperSize, 0);
                    this.slidePos[pos] = -this.wraperSize;
                } else if (pos == this.index) {
                    this.currPage = slide;
                    slide.setAttribute('data-slide', 'curr');
                    this._translate(slide, 0, 0);
                    this.slidePos[pos] = 0;
                } else if (pos == next) {
                    this.nextPage = slide;
                    slide.setAttribute('data-slide', 'next');
                    this._translate(slide, this.wraperSize, 0);
                    this.slidePos[pos] = this.wraperSize;
                } else {
                    slide.setAttribute('data-slide', 'none');
                    this._translate(slide, dist, 0);
                    this.slidePos[pos] = dist;
                }
                /**
                 * 处理icosn图标
                 * */
                if (this.options.showIcons) {
                    var i = this.length - pos - 1;
                    this.iconsItems[i].className = i == this.index ? 'active' : '';
                }
            }
            this.lastIndex = this.index;
        },
        initEvents      : function () {
            $(win).on('resize', $.proxy(this._resize, this));
            if (this.options.bind) {
                this.target.on(Utils.eventName.start, $.proxy(this._start, this));
                if (this.options.drag) {
                    this.target.on(Utils.eventName.move, $.proxy(this._move, this));
                }
                this.target.on(Utils.eventName.end, $.proxy(this._end, this));
            } else {
                $(doc).on('touchmove', function () {
                    return false;
                })
            }
        },
        _circle         : function (index, loop) {
            return (arguments.length == 2 ? loop : this.options.loop) ? (this.length + (index % this.length)) % this.length : index;
        },
        _translate      : function (slide, dist, speed) {
            var style = slide && slide.style;
            if (style) {
                style[Utils.style.transitionDuration] = speed + 'ms';
                style[Utils.style.transform] = 'translate' + this.options.direction.toUpperCase() + '(' + dist + 'px)' + this.translateZ;
            }
        },
        _transformOrigin: function (style, distance) {
            if (distance > 0) {
                style[Utils.style.transformOrigin] = this.options.direction === 'x' ? '100% 50%' : '50% 100%';
            } else if (distance < 0) {
                style[Utils.style.transformOrigin] = this.options.direction === 'x' ? '0% 50%' : '50% 0%';
            }
        },
        _scale          : function (slide, dist, speed) {
            var style = slide && slide.style;
            if (style) {
                var scaleTo = (this.wraperSize - Math.abs(dist) * this.options.zoomIng) / this.wraperSize;
                this._transformOrigin(style, dist);
                style[Utils.style.transitionDuration] = speed + 'ms';
                style[Utils.style.transform] = 'scale(' + scaleTo + ') translateZ(0px)';
            }
        },
        _resize         : function () {
            this.initNodes();
        },
        _start          : function (e) {
            if (!this.isAnimating) {
                var touches = e.touches ? e.touches[0] : e;
                this.startPosition = {
                    x: touches.pageX,
                    y: touches.pageY
                };
                this.moveDelta = {
                    x: 0,
                    y: 0
                };
                this.isAnimating = false;
                this.isMouseDown = true;
                this.hasMoved = false;
                this.firstMoved = true;
                this.disableMove = true;
                this.execEvent('beforetouchStart');
            }
        },
        _move           : function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (this.isMouseDown) {
                var touches = e.touches ? e.touches[0] : e;
                this.moveDelta = {
                    x: touches.pageX - this.startPosition.x,
                    y: touches.pageY - this.startPosition.y
                };
                this.moveDistance = this.moveDelta[this.options.direction];
                if ((this.options.disableToNext && this.moveDistance < 0) || (this.options.disableToPrev && this.moveDistance > 0)) {
                    this.disableMove = true;
                } else {
                    if (this.firstMoved) {
                        this.execEvent('touchStart');
                    }
                    this.disableMove = false;
                    this.firstMoved = false;
                    this.hasMoved = true;
                    this._effectMove();
                    this.execEvent('touchMove');
                }
            }
            return false;
        },
        _end            : function (e) {
            if (this.isMouseDown) {
                this.isMouseDown = false;
                if (this.options.drag) {
                    (!this.disableMove && this.hasMoved) && (this._effectEnd());
                } else {
                    var touches = e.touches ? e.changedTouches[0] : e;
                    this.moveDelta = {
                        x: touches.pageX - this.startPosition.x,
                        y: touches.pageY - this.startPosition.y
                    };
                    this.moveDistance = this.moveDelta[this.options.direction];
                    this._effectEnd();
                }
                this.execEvent('touchEnd');
            }
        },
        _effectMove     : function () {
            var distance = this.moveDistance;
            if ((distance < 0 && !this.nextPage) || (distance > 0 && !this.prevPage)) {
                distance = distance * this.options.zoomIng;
            }
            switch (this.options.animated) {
                case 1:
                    this._translate(this.prevPage, distance + this.slidePos[this._circle(this.index - 1)], 0);
                    this._scale(this.currPage, distance, 0);
                    this._translate(this.nextPage, distance + this.slidePos[this._circle(this.index + 1)], 0);
                    break;
                case 2:
                    if (!!this.prevPage) {
                        this._translate(this.prevPage, distance + this.slidePos[this._circle(this.index - 1)], 0);
                    } else {
                        (distance >= 0) && (this._translate(this.currPage, distance + this.slidePos[this._circle(this.index)], 0));
                    }
                    if (!!this.nextPage) {
                        this._translate(this.nextPage, distance + this.slidePos[this._circle(this.index + 1)], 0);
                    } else {
                        (distance <= 0) && (this._translate(this.currPage, distance + this.slidePos[this._circle(this.index)], 0));
                    }
                    break;
                default :
                    this._translate(this.prevPage, distance + this.slidePos[this._circle(this.index - 1)], 0);
                    this._translate(this.currPage, distance + this.slidePos[this._circle(this.index)], 0);
                    this._translate(this.nextPage, distance + this.slidePos[this._circle(this.index + 1)], 0);
                    break;
            }
        },
        _effectEnd      : function (distance, to, speed) {
            var isSlide = arguments.length == 3;
            var size, index = this.index;
            this.isAnimating = true;
            distance = isSlide ? arguments[0] : this.moveDistance;
            speed = isSlide ? arguments[2] : this.options.speed;
            if (distance > this.options.distanceValue && !!this.prevPage) {
                size = this.wraperSize;
                this.index = isSlide ? to : this._circle(this.index - 1);
            } else if (distance < -this.options.distanceValue && !!this.nextPage) {
                size = -this.wraperSize;
                this.index = isSlide ? to : this._circle(this.index + 1);
            } else {
                this.hasMoved = false;
                size = 0;
            }
            switch (this.options.animated) {
                case 1:
                    this._translate(this.prevPage, size + this.slidePos[this._circle(index - 1)], speed);
                    this._scale(this.currPage, size, speed);
                    this._translate(this.nextPage, size + this.slidePos[this._circle(index + 1)], speed);
                    break;
                case 2:
                    if (!!this.prevPage) {
                        this._translate(this.prevPage, size + this.slidePos[this._circle(index - 1)], speed);
                    } else {
                        (distance >= 0) && (this._translate(this.currPage, size + this.slidePos[index], speed));
                    }
                    if (!!this.nextPage) {
                        this._translate(this.nextPage, size + this.slidePos[this._circle(index + 1)], speed);
                    } else {
                        distance <= 0 && (this._translate(this.currPage, size + this.slidePos[index], speed));
                    }
                    break;
                default :
                    this._translate(this.prevPage, size + this.slidePos[this._circle(index - 1)], speed);
                    this._translate(this.currPage, size + this.slidePos[index], speed);
                    this._translate(this.nextPage, size + this.slidePos[this._circle(index + 1)], speed);
                    break;
            }
            setTimeout($.proxy(this._transitionEnd, this), speed);
        },
        _transitionEnd  : function () {
            this.isAnimating = false;
            if (this.lastIndex != this.index) {
                this.execEvent('pageCallback');
            }
            this.execEvent('transitionEnd');
            this.initPosition();
            this.autoPlay();
        },
        prev            : function () {
            this.slideTo(this._circle(this.index - 1, true), this.options.speed, true);
        },
        next            : function () {
            this.slideTo(this._circle(this.index + 1, true), this.options.speed, false);
        },
        slideTo         : function (num, speed, back) {
            if (!this.isAnimating && typeof num == 'number') {
                var that = this, symbol, to, from;
                if (num >= 0 && num < this.length && num != this.index) {
                    this.isAnimating = true;
                    this.closeAuto();
                    if(arguments.length == 3){
                        to = back ? 1 : -1;
                        from = back;
                    }else{
                        to = num < this.index ? 1 : -1;
                        from = num < this.index;
                    }
                    symbol = to * (this.options.distanceValue + 1);
                    this.initPosition(num, from);
                    this.execEvent('beforeSlide', num);
                    speed = speed != undefined ? speed : this.options.speed;
                    setTimeout($.proxy(this._effectEnd, this), 20, symbol, num, speed);
                }
            }
        }
    };
    var init = function (container, options) {
        return new Swipe(container, options);
    };
    return {
        init: init
    }
}(Zepto, window, document));
