/**
 * 集成animate方法
 * 需要引入animate.css样式
 * 建议上线后再清理animate.css没有使用的样式
 * */
;
(function($, win) {
	var Page = [];
	var Selector = [];
	var Animated = {
		cache   : function(data) {
			$.each(data, function(idx, item) {
				Page[idx] = $(item.s);
				Selector[idx] = [];
				$.each(item.i, function(m, n) {
					Selector[idx][m] = Page[idx].find(n.s);
					Selector[idx][m].data('cls', Selector[idx][m][0].className);
					for(var i in n){
						!!n['e'] && (Selector[idx][m].data('effect', n['e']));
						!!n['d'] && (Selector[idx][m].data('delay', n['d']));
						!!n['l'] && (Selector[idx][m].data('loop', n['l']));
						!!n['t'] && (Selector[idx][m].data('time', n['t']));
					}
				})
			});
		},
		animate : function(num) {
			var p = Page[num];
			var s = Selector[num];
			var len = s.length;
			this.clear(num);
			for(var i=0; i<len; i++){
				var loop = s[i].data('loop');
				var cls = s[i].data('effect') + ' animated' + (!!loop ? ' infinite' : '');
				var delay = s[i].data('delay');
				var time = s[i].data('time');
				s[i].addClass(cls);
				!!delay && (s[i][0].style[Utils.style.animationDelay] = delay + 's');
				!!time && (s[i][0].style[Utils.style.animationDuration] = time + 's');
			}
		},
		clear:function(num){
			var len = Page.length;
			for(var i=0; i<len; i++){
				if(i != num){
					var p = Page[i];
					var s = Selector[i];
					for(var j= 0, size = s.length; j<size; j++){
						s[j][0].className = s[j].data('cls');
						s[j][0].style[Utils.style.animationDelay] = '0s';
						s[j][0].style[Utils.style.animationDuration] = '0s';
					}
				}
			}
		}
	}

	$.fn.mSwipe.animated = function(mSwipe, data) {
		Animated.cache(data);
		mSwipe.on('pageCallback', function(mSwipe, data) {
			Animated.animate(this.index);
		});
		Animated.animate(mSwipe.index);
	};
}(Zepto, window))

