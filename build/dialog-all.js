/** 
 * @Author: lichen
 * @Date:   2015-10-28 17:40:43
 * @Last Modified by:   lichen
 * @Last Modified time: 2015-11-11 11:52:09
 *
 * dialog.js(mobile)
 * 基于dialog的ui组件，包含：
 *   - dialog
 *   - alert
 *   - confirm
 *   - loading
 *   - success、error
 *   - photoViewer
 * 依赖zepto(or jQuery)、artTemplate
 */ 

'use strict';

(function(exports, $, template) {

    var noop = $.noop || function() {};

    var defaults = {
        className: '',
        content: '',
        animate: false,
        btns: [],
        btnFn: noop,
        close: noop,
        beforeClose: noop,
        shown: noop
    };

    var instanceCount = 0;

    var customStyleName = '';

    var tmpl = [
        '<div class="global-modal',
            '{{customStyleName ? " " + customStyleName : ""}}',
            '{{className ? " " + className : ""}}',
            '{{animateClass ? " " + animateClass : ""}}',
        '">',
            '<div class="modal-dialog">',
                '<div class="modal-body">',
                    '{{#content}}',
                '</div>',
                '{{if btns.length}}',
                '<div class="modal-footer">',
                    '{{each btns}}',
                    '<div class="flex">',
                        '<button class="modal-btn{{$value.className? " " + $value.className : ""}}">{{$value.text}}</button>',
                    '</div>',
                    '{{/each}}',
                '</div>',
                '{{/if}}',
            '</div>',
        '</div>'].join('');

    var render = template.compile(tmpl);

    var Dialog = function(option) {
        this.option = $.extend({}, defaults, option);
        this.option.customStyleName = customStyleName;

        if(this.option.animate) {
            this.option.animateClass = 'modal-animate';
        }

        this.$modal = $(render(this.option)).appendTo($('body'));

        $(document.body).addClass('modal-select-none-helper');

        this.option.shown();

        var self = this;

        if(this.option.animate) {
            setTimeout(function() {
                self.$modal.find('.modal-dialog').addClass('dialog-animate-show');
            }, 20);
        }

        if(this.option.btns.length) {
            this._bindBtnTap();
        }
        
        instanceCount ++;
    };

    Dialog.prototype._bindBtnTap = function() {
        var self = this;
        this.$modal.find('.modal-footer .modal-btn').on('click', function() {
            var index = $(this).parent().index();
            var btn = self.option.btns[index];
            if(self.option.btnFn(btn) !== false) {
                self.destroy();
            }
        });
    };

    Dialog.prototype.destroy = function() {
        if(this.option.beforeClose() !== false) {
            if(instanceCount === 1) {
                $(document.body).removeClass('modal-select-none-helper');
            }

            this.$modal.remove();
            this.option.close();
            instanceCount --;
        }
    };

    exports.dialog = function(option) {
        return new Dialog(option);
    };

    exports.dialog.customStyle = function(styleName) {
        customStyleName = styleName;
    }

    exports.dialog.insertStyleHelper = function(css) {
        if($('title').length) {
            $('title').after($('<style>').text(css));
        } else {
            $('head').prepend($('<style>').text(css));
        }
    }

    exports.alert = function(content, fn) {
        var option = {
            content: content,
            btns: [{
                text: '确定',
                value: true
            }],
            btnFn: function(btn) {
                if(typeof fn === 'function') {
                    fn(btn);
                }
            }
        };

        if(typeof content === 'object') {
            content.btns = option.btns;
            $.extend(option, content);
        }

        return exports.dialog(option);
    };

    exports.confirm = function(content, fn) {
        var option = {
            content: content,
            btns: [{
                className: 'modal-btn-default',
                text: '取消',
                value: false
            }, {
                className: 'modal-btn-primary',
                text: '确定',
                value: true
            }],
            btnFn: function(btn) {
                if(typeof fn === 'function') {
                    return fn(btn.value);
                }
            }
        };

        if(typeof content === 'object') {
            content.btns = option.btns;
            $.extend(option, content);
        }

        return exports.dialog(option);
    };

    exports.loading = function(opt) {
        var option = {
            className: 'global-modal-loading',
            content: [
                '<div class="loading-dialog">',
                    '<div class="spinner"></div>',
                '</div>'
            ].join(''),
            btns: []
        };

        if(typeof opt === 'object') {
            if(opt.className) {
                option.className = option.className + ' ' + opt.className;
            }
            option = $.extend(opt, option);
        }

        return exports.dialog(option);
    };

    $(['success', 'error']).each(function(i, name) {
        exports[name] = function(msg, delay) {
            var option = {
                className: 'global-modal-message',
                content: [
                    '<div class="message-dialog ' + name + '">',
                        typeof msg === 'object' ? msg.content : msg,
                    '</div>'
                ].join(''),
                btns: []
            };

            if(typeof msg === 'object') {
                if(msg.className) {
                    option.className = option.className + ' ' + msg.className;
                }
                option = $.extend(msg, option);
            }

            option.delay = option.delay || delay || 2000;

            var dialog = exports.dialog(option);

            if(typeof option.delay === 'number') {
                setTimeout(function() {
                    dialog.destroy();
                }, option.delay);
            }

            return dialog;
        };
    });

    exports.photoViewer = function(src, lsrc) {
        var option = {
            className: 'global-modal-photo-viewer',
            content: [
                '<div class="img-wrap">',
                    '<div class="spinner"></div>',
                    '<img class="photo" src="' + src + '"/>',
                 '</div>'
            ].join('')
        };

        var dialog = exports.dialog(option);

        var img = new Image();

        img.onerror = function() {
            exports.error('图片加载失败');
            dialog.destroy();
        };

        img.onload = function() {
            dialog.$modal.find('.spinner').remove();
            dialog.$modal.find('.photo').attr('src', lsrc);
        };

        dialog.$modal.on('click', function() {
            dialog.destroy();
        });

        img.src = lsrc;

        return dialog;
    };

    // border-width .5px support for iOS 8+
    var halfPelBorderSupportCheck = function() {
        if (window.devicePixelRatio && devicePixelRatio >= 2) {
            var tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.border = '.5px solid transparent';
            document.body.appendChild(tempDiv);
            var height = tempDiv.offsetHeight;
            document.body.removeChild(tempDiv);
            return height === 1;
        }
        return false;
    };

    // 弹框时阻止手指滑动页面效果
    $(function() {
        $('body').on('touchmove', function (e) {
            if(instanceCount > 0) {
                e.preventDefault();
            }
        });
        if(halfPelBorderSupportCheck()) {
            $('body').addClass('half-pel-support-helper');
        }
    });
})(window.$, window.$, window.template);

$.dialog.insertStyleHelper('.modal-select-none-helper{-webkit-user-select:none;user-select:none;}.global-modal{position:fixed;top:0;left:0;width:100%;height:100%;padding:0 .55rem;text-align:center;font-size:0;background:#999;background:rgba(0,0,0,.2);box-sizing:border-box;z-index:1000;}.global-modal a,.global-modal button,.global-modal img{outline:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}.global-modal:before{content:" ";display:inline-block;height:100%;width:0;vertical-align:middle;}.global-modal .modal-dialog{font-size:.28rem;display:inline-block;width:100%;margin-top:-1rem;background-color:#fff;vertical-align:middle;border-radius:5px;overflow:hidden;}.modal-animate .modal-dialog{-webkit-transition:-webkit-transform .4s;transition:transform .4s;-webkit-transform:translateY(-999px);transform:translateY(-999px);}.modal-animate .dialog-animate-show{-webkit-transform:translateY(0);transform:translateY(0);}.global-modal .modal-body{padding:.45rem .2rem;font-size:.32rem;line-height:140%;}.global-modal .modal-footer{display:-moz-box;display:-webkit-box;display:box;border-top:1px solid #eee;}.half-pel-support-helper .modal-footer{border-top:.5px solid #e5e5e5;}.global-modal .modal-footer .flex{-moz-box-flex:1;-webkit-box-flex:1;box-flex:1;}.global-modal .modal-footer .modal-btn{display:block;width:100%;padding:.25rem .1rem;background-color:#fff;border:none;border-radius:0;font-size:.3rem;color:#0ea7ea;text-align:center;margin:0;border-right:1px solid #eee;}.half-pel-support-helper .modal-footer .modal-btn{border-right:.5px solid #e5e5e5;}.global-modal .modal-footer .modal-btn:active{color:#0ea7ea;background-color:#f2f2f2;}.global-modal-loading .modal-dialog{width:1.2rem;height:1.2rem;background-color:transparent;}.global-modal-loading .modal-body{padding:0;}.global-modal-loading .loading-dialog{font-size:.28rem;display:inline-block;width:1.2rem;height:1.2rem;vertical-align:middle;border-radius:1rem;overflow:hidden;position:relative;background-color:#fff;}.global-modal-loading .loading-dialog img{width:100%;}.global-modal-message .modal-dialog{width:auto;background-color:transparent;}.global-modal-message .modal-body{padding:0;}.global-modal-message .message-dialog{font-size:.32rem;display:inline-block;padding:.2rem .35rem;background-color:rgba(0,0,0,.75);vertical-align:middle;border-radius:.05rem;color:#fff;text-align:center;position:relative;}.global-modal .success{color:#52b02b;}.global-modal .error{color:#E87616;}.global-modal .spinner{width:1rem;height:1rem;position:absolute;top:.1rem;left:.1rem;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKoAAACqCAMAAAAKqCSwAAAAnFBMVEUAAAAJpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu0Jpu1RawTyAAAAM3RSTlMAsPmhAwsH2M468cinXvVHQCPu524exJ3qwIJ+LnMQmHhiMym2aEvfFrwSsrnUiJNPW1Oc0dfnAAAGxElEQVR42szaC3KbMBAG4N8CAQbzcgHjGJvEr9px89z7362d6UybdAQSkiD9LsCOtOyuBLClnL9tVrPKr0NGv7Cw9qvZahPPS/w/vPmpjULqFEbtae7hq3np8zohBUn1nHJ8mbw4JjRAcixyfIFyG5GGYFtiUl5ckbYq5pjK4WVJRsKXA6aQHcmCY4axvQZkSfCKMaURWRSkGMu+IsuqPcZwWdEInAtsc4uQRhFuXVjVRDSaqIE97h2jEbE7F5bkEY0symHFQ0KjSx5gznNoEg6HoTKgiQQljGRLmswyg4GY0TC1X90cZ7VynFvl1zQMi6FtQ8pY4GzPB45P+OG8dQJGyu6gx21Vw7zeZxydeHZ/VQ23dbUiXahl2OqVQ4q/tmpZv9CI1ZuRHFukLhS5qcNI7uZhIFchUr94xCC7wleI1bW++9XZxXDnte0caElinUFTJg22tVmlnlIYyAJ7NSumXvXJhRH3VFOvGIoyRn2cRxh7dKgPy6CkXFKP7ymsSL9Tj2UOBTygHosdLNktqEfAIedIJmB74oS6OZB66Nv8BlY1fUkgXZU8oU7rHSzbXalTkqOXG1Enx4OE3eNQ5KLPnaQu67L/xIZRl3uM5J66sEZr+08YzUknBbZma2p/XbfocAnN8tR+voaXocXfgVXmT95Th6uHkXlX6rCHSNXVo3YY3a6rb1UQSEksaTCBJiEx0SAXmYy55mISCwRfeUhsgYksSOwV/wpME9U8XRWXNZOlin2qIWT47GhcUc2tSOiITw4kVD9iQo81CR3w0csEQ4r2CeQFH/CQRAIXk3IDEgm5vKhlmFhGQrG0p661Em7+HhdF/D7XSvO1rLuWJDTHQPvtcUl/LI/bPQaak1ApGKkNFrXc+IIOsikxyJVEtpJOdcYAB4d1XWwfMMC5v2PlJOLr/Ctg/s3/iURy/FaQSAFlD0vqtXwwPRQWfU012UERX5DUgkPRLulprjwx6v65Twr83OiclfCe8T+FmuYbKan3kJKG80wCtasYaUiKQsVY3ZoEnrtbVQsl+TdSVudQ0nY2LC/RL6rcpwH8nX5pZV5XL2Nc4zwkNYMKzkhg3lVVf+jMl3InqPjRVVlb7eu0y5IGCi/a120tgEh7qHJosIX2eBUBCMVJLNeQhgZyHhNtSMesGpi8U+bLGohn1rluV81JS66bWXPE4lFW7o60+DO5JxKIsdFtAN+pAwtut4CRbRuspJcEwy6O/ZgDAI99smuFGQl42t8a/v7f6W7IqplwWPmm21LoDR+8kU0VRPv0BLlQnE+fWF1XH7XesfpCAr6LT1yf7KkR6k1AmdJdfEz2hGB6HeBdaXLkjKxhsPiHQyBpkYYgvtCUKtTy5jZ2qK1eqLef5Z3LdqMwDIY1EJwSEhJupTQ501yZQgppRu//bnM6LKbTAzjYxpFPv2U2aBGDLOn/NW6oJv0BDDpWgi8rV//LyqRPgOiHNWxNVsb8sJqUrhiUBBqUWhtzYXmGK8FroBf9R/NjLn65TizBy7UgNEsWXcxEa5YHFOAAEnjCjWAbB2ODMJqLluGr+kHHYpxS8A7E0Vtgn4McE31tCwckyTQ1g6IAJNDaYtuADBobl9EG5GG02sHtUGyyd0BxdKGfRHogpEyxh/QVlOHRGbPpQMPw0nSdgAIojoTxyagM2nVAcHwxf3OBAwtJDIWyKSI32Itwfqn6eLcES3CAuZH7cIM9ExgLn2MDJ9gV3v1k/cYGbrDevSUMZYTYFqwZwpC/wdKT28TYxptLT8TkWkO0YdkdpWFlVwm0ICe4exwmuIO0u2AsiLyMkZo4tB4+mBcbI7nVLGTmR/owMUYevoce1tpF9zXniUJWBqlWKwN+Yh/MsJNC+begzLAT/wAcFhptN/a/5CrcKXbjX0EhJ0uyws08ChYxlaPAeGcFSsgj7GEWKLEzSn8qtDOSFSVfsZennbRJVIi9nNRZbz2sQIJlhf3Uag3N3PEMzeyhGSSPIh/Jw/k8UW++V50GHrDyFvO9IxvF0tC3V6otDY+OwDG18RaeXnIHuLA8DfEWzkyi/c7HP25d1hOmuy58vA2b6TA1TeNl8OVBTrAcZmpagzBXC4cRVcXcti8Xe/6jqEIcSGyKAe9sCVIkHmpiegBJWIoK0NSFXcxwdKwTgBnG5tXGELt4rBl8QN+Ev9pDA/XVBv72UxZBemHEPIEx2GeomEcXWqG33OQdxuTdMyRQdYt4iiXw+FbrjT5gi0ziLO0cEED/Kq5tAALoXnBmFXECAmheG2fJro3TtIwvpbCM7x+Ju/i84hD9aOqdX54XqwQU8Qep5XhbrEvISAAAAABJRU5ErkJggg==);background-repeat:no-repeat;background-size:100% 100%;-webkit-animation:rotate 1000ms infinite linear;animation:rotate 1000ms infinite linear;transform:translateZ(0px);-webkit-transform-origin:50% 50%;transform-origin:50% 50%;}.global-modal-photo-viewer{padding:0 .3rem;background:rgba(0,0,0,.85);cursor:pointer;}.global-modal-photo-viewer .modal-dialog{width:auto;margin-top:0;background-color:transparent;}.global-modal-photo-viewer .modal-body{padding:0;}.global-modal-photo-viewer .img-wrap{position:relative;display:inline-block;width:100%;vertical-align:middle;}.global-modal-photo-viewer .img-wrap img{max-width:100%;}.global-modal-photo-viewer .img-wrap .spinner{position:absolute;width:.4rem;height:.4rem;top:50%;left:50%;margin-left:-.21rem;margin-top:-.21rem;border:2px solid #fff;border-bottom-color:transparent;border-radius:2rem;background:transparent;-webkit-animation:rotate 1000ms infinite linear;animation:rotate 1000ms infinite linear;transform:translateZ(0px);-webkit-transform-origin:50% 50%;transform-origin:50% 50%;}@-webkit-keyframes rotate{0%{-webkit-transform:rotate(0deg);}100%{-webkit-transform:rotate(360deg);}}@keyframes rotate{0%{-webkit-transform:rotate(0deg);}100%{-webkit-transform:rotate(360deg);}}');