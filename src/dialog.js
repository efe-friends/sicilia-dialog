/**
* dialog.js(mobile)，依赖zepto(or jQuery)
* 基于dialog的ui组件，包含：
*   - dialog
*   - alert
*   - confirm
*   - loading
*   - success、error
*   - photoViewer
*/

(function(exports, $) {

	'use strict';

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

	var render = function(option) {
		var modalFooter = '';

		if(option.btns.length) {
			var modalFooterBtns = '';

			for(var i = 0, len = option.btns.length; i < len; i++) {
				var btn = option.btns[i];
				modalFooterBtns += [
					'<div class="flex">',
						'<button class="modal-btn',
							(btn.className ? " " + btn.className : ""),
						'">',
							btn.text,
						'</button>',
					'</div>'].join('');
			}
			
			modalFooter = [
				'<div class="modal-footer">',
					modalFooterBtns,
				'</div>'].join('');
		}

		return [
			'<div class="global-modal',
				option.customStyleName ? " " + option.customStyleName : "",
				option.className ? " " + option.className : "",
				option.animateClass ? " " + option.animateClass : "",
			'">',
				'<div class="modal-dialog">',
					'<div class="modal-body">',
						option.content,
					'</div>',
					modalFooter,
				'</div>',
			'</div>'].join('');
	};

	var Dialog = function(option) {
		this.option = $.extend({}, defaults, option);
		this.option.customStyleName = customStyleName;

		if (this.option.animate) {
			this.option.animateClass = 'modal-animate';
		}

		this.$modal = $(render(this.option)).appendTo($('body'));

		$(document.body).addClass('modal-select-none-helper');

		this.option.shown();

		var self = this;

		if (this.option.animate) {
			setTimeout(function() {
				self.$modal.find('.modal-dialog').addClass('dialog-animate-show');
			}, 20);
		}

		if (this.option.btns.length) {
			this._bindBtnTap();
		}

		instanceCount++;
	};

	Dialog.prototype._bindBtnTap = function() {
		var self = this;
		this.$modal.find('.modal-footer .modal-btn').on('click', function() {
			var index = $(this).parent().index();
			var btn = self.option.btns[index];
			if (self.option.btnFn(btn) !== false) {
				self.destroy();
			}
		});
	};

	Dialog.prototype.destroy = function() {
		if (this.option.beforeClose() !== false) {
			if (instanceCount === 1) {
				$(document.body).removeClass('modal-select-none-helper');
			}

			this.$modal.remove();
			this.option.close();
			instanceCount--;
		}
	};

	exports.dialog = function(option) {
		return new Dialog(option);
	};

	exports.dialog.customStyle = function(styleName) {
		customStyleName = styleName;
	};

	exports.dialog.insertStyleHelper = function(css) {
		if ($('title').length) {
			$('title').after($('<style>').text(css));
		} else {
			$('head').prepend($('<style>').text(css));
		}
	};

	exports.alert = function(content, fn) {
		var option = {
			content: content,
			btns: [{
				text: '确定',
				value: true
			}],
			btnFn: function(btn) {
				if (typeof fn === 'function') {
					fn(btn);
				}
			}
		};

		if (typeof content === 'object') {
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
				if (typeof fn === 'function') {
					return fn(btn.value);
				}
			}
		};

		if (typeof content === 'object') {
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
		}

		if (typeof opt === 'object') {
			if (opt.className) {
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

			if (typeof msg === 'object') {
				if (msg.className) {
					option.className = option.className + ' ' + msg.className;
				}
				option = $.extend(msg, option);
			}

			option.delay = option.delay || delay || 2000;

			var dialog = exports.dialog(option);

			if (typeof option.delay === 'number') {
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
		$(document.body).on('touchmove', function(e) {
			if (instanceCount > 0) {
				e.preventDefault();
			}
		});
		if (halfPelBorderSupportCheck()) {
			$(document.body).addClass('half-pel-support-helper');
		}
	});
})(window.$, window.$);
