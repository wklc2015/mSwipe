;
(function(win) {


	loadImage();
	var data = [
		{
			tag  : 'div',
			cls  : 'page p1',
			list : [
				{
					tag  : 'article',
					cls  : 'pa p_b',
					list : [
						{
							tag  : 'a',
							cls  : 'pa phone animated infinite ani_phone',
							href : 'tel:3663737'
						},
						{
							tag : 'img',
							cls : 'pa t1 isAni animated fadeInUp delay_1',
							src : 'img/p1_1.png'
						},
						{
							tag : 'img',
							cls : 'pa t1 isAni animated fadeInUp delay_1',
							src : 'img/p1_1.png'
						}
					]
				}
			]
		}
	];

	var bt = baidu.template;
	var tpl = "";
	var tpFunc = bt(tpl);

	var p1 = tpFunc(data[0]);

}(window))

