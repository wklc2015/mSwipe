$(function () {


    function setIscroll(myScroll, string) {
        if (!myScroll) {
            myScroll = new IScroll('#' + string, {
                scrollX       : true,
                bindToWrapper : true,
                preventDefault: false
            });
        } else {
            myScroll.scrollTo(0, 0);
        }
    }

    function EventmSwipeChild(mSwipeChild) {
        var $btn = $('#mSwipeChildWraper').find('p[data-btn]');
        $btn.on(BASE.COM.mUtils.eventName.tap, function (e) {
            e.preventDefault();
            e.stopPropagation();
            var a = this.getAttribute('data-btn');
            mSwipeChild[a]();
            return false;
        });
    }

    var myScroll_1, myScroll_2, myScroll_4, mSwipe_3, mSwipe_4;

    var mSwich = BASE.COM.mSwich.init('#mSwitch');
    mSwich.on('beforeSwitch', function (idx) {
        switch (idx) {
            case 0:
                setIscroll(myScroll_1, 'iscroll_1');
                break;
            case 1:
                setIscroll(myScroll_2, 'iscroll_2');
                break;
            case 2:
                if (!mSwipe_3) {
                    mSwipe_3 = BASE.COM.mSwipe.init('mSwipeChildWraper', {
                        autoPlay: false
                    });
                    EventmSwipeChild(mSwipe_3);
                } else {
                    mSwipe_3.slideTo(0, 0);
                }
                break;
            case 3:
                if (!mSwipe_4) {
                    mSwipe_4 = BASE.COM.mSwipe.init('mSwipe-demo1', {
                        showIcons : true,
                        iconsClass: 'mIconsClass',
                        direction : 'x'
                    });
                }
                setIscroll(myScroll_4, 'iscroll_4');
                break;
        }
    });
    setIscroll(myScroll_1, 'iscroll_1');

});