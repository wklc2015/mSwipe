/**
 * 加载图片
 * */
;
BASE.namespace('BASE.COM.mSwipeReady');
BASE.COM.mSwipeReady = (function($, win, doc) {
	var imgData = [
			{name : 'logo', path : 'img/logo.png'}
			, {name : 'tel', path : 'img/tel.png'}
			, {name : 'p1_1', path : 'img/p1_1.png'}
			, {name : 'p1_2', path : 'img/p1_2.png'}
			, {name : 'p2_1', path : 'img/p2_1.png'}
			, {name : 'p2_2', path : 'img/p2_2.png'}
			, {name : 'p3_1', path : 'img/p3_1.png'}
			, {name : 'p3_2', path : 'img/p3_2.png'}
			, {name : 'p4_1', path : 'img/p4_1.png'}
			, {name : 'p4_2', path : 'img/p4_2.png'}
			, {name : 'p5_1', path : 'img/p5_1.png'}
			, {name : 'p5_2', path : 'img/p5_2.png'}
			, {name : 'p6_1', path : 'img/p6_1.png'}
			, {name : 'p6_2', path : 'img/p6_2.png'}
			, {name : 'p6_3', path : 'img/p6_3.png'}
			, {name : 'page1', path : 'img/page1.jpg'}
			, {name : 'page2', path : 'img/page2.jpg'}
			, {name : 'page3', path : 'img/page3.jpg'}
			, {name : 'page4', path : 'img/page4.jpg'}
			, {name : 'page5', path : 'img/page5.jpg'}
			, {name : 'page6', path : 'img/page6.jpg'}
		],
		loadIndex = 0,
		length = imgData.length,
		imgLoading, loadingText,
		data = [],
		speed = 400,
		init = function() {
			imgLoading = $('#imgLoading');
			loadingText = imgLoading.find('span');
			loadImage();
		}

	function loadImage() {
		if(loadIndex >= length){
			imgLoading.hide();
			var mSwipe = BASE.COM.mSwipe.init('mSwipe', {
				animated   : 0,
				startSlide : 0
			});
		} else{
			var img = new Image();
			img.src = imgData[loadIndex].path;
			img.onload = function(e) {
				loadIndex++;
				var percentage = (loadIndex * 100 / length).toFixed(0) + '%';
				loadingText.html(percentage);
				loadImage();
			}
		}
	}

	return {
		init : init
	}
}(Zepto, window, document));

$(function() {
	BASE.COM.mSwipeReady.init();
});
