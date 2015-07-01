var BASE = BASE || {};
/**
 * 命名空间函数
 * */
BASE.namespace = function(name) {
	var parts = name.split('.'),
		i, size, parent = BASE;
	if (parts[0] === 'BASE') {
		parts = parts.slice(1);
	}
	size = parts.length;
	for (i = 0; i < size; i++) {
		if (typeof parent[parts[i]] === 'undefined') {
			parent[parts[i]] = {};
		}
		parent = parent[parts[i]];
	}
	return parent;
};

/**
 * 工具函数
 * 属性检测
 * 事件检测
 * */
BASE.namespace('BASE.COM.mUtils');
BASE.COM.mUtils = (function(win, doc) {
	var me = {};
	var _elementStyle = doc.createElement('div').style;
	var _vendor = (function() {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;
		for (; i < l; i++) {
			transform = vendors[i] + 'ransform';
			if (transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
		}
		return false;
	})();

	function _prefixStyle(style) {
		if (_vendor === false) return false;
		if (_vendor === '') return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	var isMobile = (function () {
		var isMobile;
		var sUserAgent = navigator.userAgent.toLowerCase();
		var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
		var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
		var bIsMidp = sUserAgent.match(/midp/i) == "midp";
		var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
		var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
		var bIsAndroid = sUserAgent.match(/android/i) == "android";
		var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
		var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
		if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
			isMobile = true;
		} else {
			isMobile = false;
		}
		return isMobile;
	}());

	var _transform = _prefixStyle('transform');
	me.extend = function(target, obj) {
		for (var i in obj) {
			target[i] = obj[i];
		}
	};
	me.extend(me, {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: isMobile,
		hasPointer: win.PointerEvent || win.MSPointerEvent, // IE10 is prefixed
		hasTransition: _prefixStyle('transition') in _elementStyle
	});
	me.extend(me.style = {}, {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration'),
		transformOrigin: _prefixStyle('transformOrigin'),
		animationDelay: _prefixStyle('animationDelay'),
		animationDuration: _prefixStyle('animationDelay')
	});
	me.extend(me.eventName = {}, {
		start: me.hasTouch ? 'touchstart' : 'mousedown',
		move: me.hasTouch ? 'touchmove' : 'mousemove',
		end: me.hasTouch ? 'touchend' : 'mouseup',
		tap: me.hasTouch ? 'tap' : 'click'
	});
	return me;
}(window, document));
