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


