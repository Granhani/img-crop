/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function($, undefined) {
    String.prototype.hasChar = function(ch) {
        return this.indexOf(ch) >= 0;
    };
    String.prototype.splitObj = function(ch, arg) {
        if (typeof arg == 'string') {
            arg = [].slice.call(arguments);
            ch = arg.shift();
            return this.split(ch).splitObj(arg);
        } else {
            throw new Error(ch + '.' + ch + ', splitObj');
        }
    };
    Array.prototype.splitObj = function(arg) {
        var a = this, o = {};
        arg = ($.isArray(arg) ? arg : [].slice.call(arguments));
        $.map(arg, function(ind, k) {
            o[ind] = a[k] || "";
        });
        return o;
    };

    jQuery.fn.extend({
        elm: function() {
            return $(this)[0];
        },
        elAttr: function(val, atr) {
            val = val || '';
            if (!val.hasChar('.')) {
                val = (!atr && val === 'name' ? '' : val);
                val = '[' + (atr || 'name') + (val ? '="' + val + '"]' : ']');
            }
            return $(this).find(val);
        },
        exist: function(ret, pai) {
            var el = $(this);
            if (typeof ret === 'string') {
                ret = (!ret || /\.|#|\[/.test(ret) ? ret : '.' + ret);
                el = (pai ? $(el).closest(ret) : $(el).find(ret));
            }
            return ($(el).length ? $(el) : null);
        },
        setTimeout: function(fn, arg, tm) {
            var el = $(this);
            if (fn) {
                setTimeout(function() {
                    $(el)[fn](arg);
                }, tm || 400);
            }
        },
        triggerIn: function(ev, tm, val, el) {
            el = $(this)[0], el.tmout ? clearTimeout(el.tmout) : el.tmout = 1;
            if (ev)
                el.tmout = setTimeout(function() {
                    $(el).trigger(ev, val);
                }, tm || 200);
        },
        toggleClas: function(clas, cnd) {
            cnd = (cnd ? true : false);
            if ($(this).hasClass(clas) !== cnd) {
                $(this).toggleClass(clas);
                return $(this);
            }
        }
    });
    $.elm = function(id) {
        id = (!id || /\.|#|\[/.test(id) ? id : '#' + id);
        return $(id)[0];
    };

    function regra(v1, v2, v3, v4) {
        if (typeof v4 === 'undefined' || v4 === true) {
            v3 = (v3 * v2) / v1;
            return (v4 ? v3 : Math.round(v3));
        } else {
            return Math.round((v4 * v1) / v2);
        }
    }
    function calcResize(imo, img, dsiz, ret) {
        if (ret) {
            ret = regra(imo, dsiz, img, true);
            ret = (dsiz && ret > 0 ? ret : 0);
        } else if (dsiz < imo && (imo - dsiz) > 2) {  //dsiz >= imo || (imo - dsiz) < 3
            ret = regra(imo, dsiz, img, true);
            ret = (ret >= img ? 0 : ret);
        }
        return ret || 0;
    }
    function calcFileSize(bts, uni) {
        bts = bts * 0.001, uni = 'KB';
        if (bts > 999) {
            bts = bts * 0.001, uni = 'MB';
        }
        if (bts > 999) {
            bts = bts * 0.001, uni = 'GB';
        }
        return '<strong>' + Math.round(bts) + '</strong> ' + uni;
    }

    var DIR = null;
    var iCrop = function(el, opt) {
        this.formid = '#' + el.id;
        this.form = el;
        this.oPost = null;

        if (DIR === null) {
            this._setPath();
        }
        var frmfl = $(el).find('[type="file"]').elm(), sizecut;
        if (!frmfl) {
            throw new Error('input file não encontrado');
        }
        this.inputFile = frmfl;
        this.vFile = [];

        opt.multiple = (opt.multiple === null ? ($(frmfl).attr('multiple') ? true : false) : opt.multiple);
        opt.accept = (opt.accept === null ? $(frmfl).attr('accept') : opt.accept);

        opt.fixRatio = (opt.fixRatio === null ? (opt.sizecut || $(el).elAttr('sizecut').val() ? true : false) : opt.fixRatio);
        opt.showsize = (opt.showsize === null ? !opt.fixRatio : opt.showsize);

        opt.sizecut = this._getSizeCrop(opt.sizecut, $(el).elAttr('sizecut').val(), '1024x678');
        opt.sizetmb = opt.sizetmb || $(el).elAttr('sizetmb').val() || null;
        opt.showcrop = (opt.multiple ? false : opt.showcrop);
        if (opt.showcrop !== false) {
            if (opt.showcrop && !$(el).exist('.openCrop')) {
                $(el).append('<a href="#" class="btn btn-info openCrop"><i class="glyphicon glyphicon-picture"></i> Alterar Imagem</a>');
            }
            opt.showcrop = ($(el).exist('.openCrop') ? true : false);
        }

        opt.filePath = (opt.filePath || $(el).elAttr('filePath').val() || null);
        opt.seloPath = (opt.seloPath || $(el).elAttr('seloPath').val() || null);
        opt.seloFix = (opt.seloFix || $(el).elAttr('seloFix').val() || null);

        if (opt.success !== false && typeof opt.success !== 'function') {
            var elSuccess = (opt.success === null ? $(this.formid).find('img') : $(this.formid).find(opt.success));
            elSuccess = ($(elSuccess).length ? elSuccess : $(opt.success));
            opt.success = ($(elSuccess).length === 1 ? $(elSuccess).elm() : false);
        }
        opt.autosend = (opt.showcrop ? false : opt.autosend);
        opt.autosend = (opt.autosend !== null ? opt.autosend : ($(this.formid + ' .fcSubmit').length ? null : true));

        this._process_options(opt);
        this._buildEvents();
    };
    iCrop.ADDED = "added";
    iCrop.QUEUED = "queued";
    iCrop.ACCEPTED = iCrop.QUEUED;
    iCrop.UPLOADING = "uploading";
    iCrop.PROCESSING = iCrop.UPLOADING;
    iCrop.CANCELED = "canceled";
    iCrop.ERROR = "error";
    iCrop.MAXFILE = "maxfile";
    iCrop.SUCCESS = "success";

    iCrop.prototype = {
        constructor: iCrop,
        _process_options: function(opts) {
            this._o = $.extend({}, this._o, opts);
            var o = this.o = $.extend({}, this._o);
            this._accept();
            this._multiple(o.multiple);
            this.divTmb = (o.multiple ? true : false);
            if (this.divTmb) {
                this._add_icroptmbs();
            } else if (o.showcrop) {
                this._setPath();
            }
        },
        template: {
            msgDefault: '.ic-message span',
            msgMaxFiles: '.ic-message span',
            msgMaxFilesExceeded: '.ic-error-message span',
            msgRemove: '.ic-remove',
            msgCancel: '.ic-remove',
            msgCancelConfirm: '.ic-error-message span',
            msgError: '.ic-error-message span',
            msgInvalidFile: '.ic-error-message span',
            icUpload: '.divResize .ui-icon',
            icSize: '.ic-size span',
            icName: '.ic-filename span',
            //
            divtmbs: '<div class="ic-message"><span>{{msgDefault}}</span><i class="ic-picture"></i></div>\n\
                      <div class="ic-rowTmbs"></div>',
            //
            divcrop: '<div id="divCrop" class="divCrop"><div id="divResize" class="divResize"></div></div>',
            //
            preview: '<div class="ic-preview ic-image-preview">\n\
                          <div class="ic-image"></div>\n\
                          <div class="ic-details">\n\
                                <div class="ic-size"><span></span></div>\n\
                                <div class="ic-filename"><span></span></div>\n\
                          </div>\n\
                          <div class="ic-progress"><span class="ic-upload"></span></div>\n\
                          <div class="ic-error-message"><span></span></div>\n\
                          <div class="ic-success-mark"><i class="glyphicon glyphicon-ok"></i></div>\n\
                          <div class="ic-error-mark"><i class="glyphicon glyphicon-remove"></i></div>\n\
                      </div>',
            //
            divload: '<div class="icropTmbs icLoadPrev icEvt"></div>'
        },
        _getTemplate: function(theme) {
            var self = this, o = self.o;
            theme = self.template[theme] || '';
            if (theme) {
                var vMsg = theme.match(/(\{\{\w*\}\})/gi), msg, i = 0;
                for (i = 0; i < vMsg.length; i++) {
                    theme = self._msgReplace(vMsg[i], theme);
                }
            }
            return theme;
        },
        _msgReplace: function(key, str, val) {
            key = key.replace(/(\{*\}*)/gi, '');
            val = val || this.option(key) || '';
            return str.replace('{{' + key + '}}', val);
        },
        _setMgs: function(key, val, elem) {
            var self = this, opts = self.o;
            val = val === null ? self.option(key) : val;
            elem = (!elem ? self.divTmb : elem.preview || elem);
            elem = (elem ? $(elem).exist(self.template[key]) : elem);
            if (elem) {
                $(elem).html(val);
            }
        },
        _buildEvents: function() {
            $('.fcSubmit').addClass('disabled icEvt');
            $('#cropForm a, .fcSubmit, .fcCancel, .openCrop, .icropTmbs, .openFile').addClass('icEvt');
            this.cmfCls = (this.formid).replace('#', 'cmf-');
            if (this.o.showcrop) {
                var cmfCls = '#cropModal.' + this.cmfCls;
                $(this.formid).on('click', '.openCrop', $.proxy(this._openFiles, this));
                $(document).on('click', cmfCls + ' #fcOpen', $.proxy(this._openFiles, this));
                $(document).on('click', cmfCls + ' #closeCrop', $.proxy(this._closeModal, this));
                $(document).on('click', cmfCls + ' #fcSubmit', $.proxy(this._fcSubmit, this));
                $(document).on('change', cmfCls + ' #fixRatio', $.proxy(this._set_cratio, this));
                $(document).on('ic-resize', cmfCls, $.proxy(this._defineSize, this));
                $(document).on('ic-keyup', cmfCls + ' .cpRatio', $.proxy(this._cpRatioFix, this));
            } else {
                $(this.formid).on('click', '.openFile', $.proxy(this._openFiles, this));
                $(this.formid).on('click', '.fcCancel', $.proxy(this.removeAll, this));

                $(this.formid).on('click', '.fcSubmit', $.proxy(this._fcSubmit, this));
            }
            $(this.inputFile).on('change', $.proxy(this._filesAdd, this));
            $(this.formid).addClass('formiCrop');
            this._emitFrm('started', 100);
        },
        _getPreview: function(file) {
            var self = this, opts = self.o, preview, rmvLink, rmvEvent;
            if (opts.showcrop) {
                preview = $.parseHTML(self.template.divcrop);
                if (!$('html').hasClass('shwCrop')) {
                    self._openModalCrop();
                }
            } else {
                preview = $.parseHTML(self.template.preview);
                self._setMgs('icSize', calcFileSize(file.size), preview);
                self._setMgs('icName', file.name, preview);

                rmvLink = $('<span class="ic-remove">' + opts.msgRemove + '</span>');
                rmvEvent = (function(_this) {
                    return function(e) {
                        e.preventDefault(), e.stopPropagation();
                        return _this.removeFile(file, 10);
                    };
                })(self);
                $(rmvLink).on("click", rmvEvent).appendTo(preview);
            }
            file.status = iCrop.QUEUED;
            file.preview = $(preview).elm();
            return file;
        },
        _addPreview: function(file, img) {
            var self = this, opts = self.o, imgPrev = opts.success, elmPrev, divload, size;
            self._getPreview(file);
            self._thumbMargen(img);
            if (opts.showcrop) {
                $('#fcSubmit').removeClass('disabled');
                size = self.size;
                size.d = {width: size.c.width, height: size.c.height, left: 0, top: 0};
                $('#colCrop').html('').append($(file.preview).append(img));
            } else if (self.divTmb) {
                $(file.preview).find('.ic-image').prepend(img);
                $(file.preview).appendTo($(self.divTmb).find('.ic-rowTmbs'));
            } else if (imgPrev && typeof imgPrev !== 'function') {
                imgPrev = $(imgPrev).is('img') ? imgPrev : $(imgPrev).find('img').elm();
                if (imgPrev) {
                    elmPrev = $(imgPrev).parent();
                    $(img).height($(imgPrev).height()), $(elmPrev).addClass('icInPrev');
                    divload = $(elmPrev).find('.icLoadPrev').elm() || $(self.template.divload).appendTo(elmPrev);
                    $(divload).html(img).append(file.preview);
                }
            }
        },
        _onSuccess: function(file, ret) {
            var self = this, opts = self.o, imgPrev = opts.success, divTmb = self.divTmb, src, elmPrev, okSucss = false;
            if (ret.status == 'ok' && imgPrev && typeof imgPrev !== 'function') {
                okSucss = true, src = (ret.tmb ? ret.tmb : ret.path);
            }
            if (okSucss || !divTmb) {
                self._fadePreview(file, (divTmb ? 1000 : null), true);
            }
            if (okSucss && divTmb) {
                elmPrev = $(imgPrev.outerHTML).removeClass('icModelo').addClass('opcTrns opct0');
                $(elmPrev).appendTo($(imgPrev).parent());
                imgPrev = $(elmPrev).find('img').elm();
                self._toggleRowGlry();
            } else if (okSucss) {
                imgPrev = $(imgPrev).is('img') ? imgPrev : $(imgPrev).find('img').elm();
            }

            self._emitTmOut('_fcSubmit', 400);

            if (okSucss && imgPrev) {
                $(imgPrev).attr('src', src + '?' + Math.random());
                elmPrev = $(imgPrev).closest('a').elm();
                if (elmPrev && /(\.jpg|\.jpeg|\.png|\.gif|\.bmp)$/gi.test($(elmPrev).attr('href'))) {
                    $(elmPrev).attr('href', ret.path);
                }
                if (divTmb) {
                    elmPrev = $(elmPrev).closest('.opcTrns').removeClass('opct0');
                    $(elmPrev).setTimeout('removeClass', 'opcTrns', 450);
                }
            }
        },
        _filesAdd: function() {
            var self = this, vFile = self.inputFile.files, i, file;
            if (vFile.length) {
                $(self.formid + ' .fcSubmit').removeClass('disabled');
                for (i = 0; i < vFile.length; i++) {
                    file = vFile[i], file.status = iCrop.ADDED;
                    self.addFile(file);
                }
                if (self.o.multiple) {
                    self._emitFrm('filesadded', self.vFile);
                }
            }
            $(self.inputFile).val('');
        },
        addFile: function(file) {
            var self = this, opts = self.o, tipo = (file.type).replace('image/', '');
            file.accepted = false;
            if ((opts.accept).hasChar(tipo) && (opts.accept).hasChar((file.name).split('.').reverse()[0])) {
                file.status = file.status || iCrop.ADDED;
                file.accepted = (file.status === iCrop.ADDED ? true : false);
            }
            if (!file.accepted) {
                console.error('arquivo inválido!');
                return;
            }

            tipo = (opts.showcrop ? 'imgCrop' : self.divTmb ? 'tmbCrop' : 'imgPrev');
            tipo = $('<img />', {alt: file.name, class: tipo, src: window.URL.createObjectURL(file)});
            self._addPreview(file, tipo);
            if (opts.multiple) {
                self.vFile.push(file);
                self._updateMaxFiles(1, file);
            } else {
                self.vFile = [file];
            }
            self._emitFrm('fileadd', file);
        },
        _fcSubmit: function(e) {
            var self = this, opts = self.o, file;
            file = self.getFilesQueue(1);
            if (file && (e || opts.autosend !== false)) {
                self.sendFile(file);
            } else if (!file && (e = self.vFile.length) > 0) {
                self._emitFrm('complete', 10);
                if (!self.divTmb) {
                    self._emitTmOut('_closeModal', 200);
                } else if (self.getFilesStatus(iCrop.SUCCESS, 1) === e) {
                    self.removeAll(false);
                } else {
                    self._toggleRowGlry(true);
                }
            }
        },
        sendFile: function(file) {
            var self = this;
            if (file && file.status === iCrop.QUEUED) {
                file.status = iCrop.PROCESSING;
                self._getDataPost();
                if (file.preview) {
                    self._setMgs((self.o.showcrop ? 'icUpload' : 'msgCancel'), null, file.preview);
                    $(file.preview).addClass('ic-processing');
                }
                self._fileDispatch(file);
            } else {
                console.error((!file ? 'arquivo inválido!' : 'file status inválido! ' + file.status));
            }
        },
        _removePreview: function(preview, dload) {
            dload ? $(dload).parent().removeClass('icInPrev') : null;
            preview ? $(preview).remove() : null;
        },
        _fadePreview: function(prev, tm, rmv) {
            var self = this, dload, prev = (prev && prev.preview ? prev.preview : prev);
            if (prev) {
                dload = $(prev).exist('.icLoadPrev', 1);
                prev = dload || prev;
                rmv = (rmv ? prev : null);
                if (tm === 0) {
                    self._removePreview(rmv, dload);
                } else {
                    setTimeout(function() {
                        $(prev).fadeOut($.proxy(self._removePreview, self, rmv, dload));
                    }, tm || (dload ? 2000 : 10));
                }
            }
        },
        removeFile: function(file, tm) {
            var preview = (file && file.preview ? file.preview : null), self, _len, ind;
            if (preview) {
                self = this, _len = self.vFile.length;
                ind = (self.divTmb ? $(preview).index() : 0);
                tm = (self.divTmb && _len < 2 ? 0 : tm);

                self._fadePreview(file, tm, true);
                self.vFile.splice(ind, 1);
                self._emitFrm('fileremoved', file);
                self._updateMaxFiles(-1, file);

                if (_len < 1) {
                    self._resetForm(true);
                    if (self.o.multiple) {
                        self._emitFrm('filesremoved', 10);
                    }
                }
            } else {
                console.error('removeFile', file);
                return;
            }
        },
        _toggleRowGlry: function(rmv) {
            var self = this, qnt;
            if (self.rowGlry) {
                qnt = $(self.o.success).siblings().length;
                if (qnt < 3 || self._o.qntfiles === null) {
                    $(self.rowGlry).toggleClas('shwMdl', qnt < 1);
                    $(self.rowGlry).toggleClas('noImg', qnt < 2);
                }
                self._o.qntfiles = qnt;
            }
            if (self.divTmb && rmv) {
                self.vFile = self.getFilesNotStatus(iCrop.SUCCESS);
            }
        },
        removeAll: function(e) {
            var self = this, vFile = self.vFile, _len = vFile.length;
            if (_len) {
                $.each(vFile, function(i, file) {
                    self._fadePreview(file, 0, true);
                    if (file.status !== iCrop.SUCCESS) {
                        self._updateMaxFiles(-1);
                    }
                });
            }
            if (self.o.showcrop && self.dragStts) {
                self._closeModal(true);
            } else {
                self._resetForm(true);
            }
            self._updateMaxFiles(0);
            if (e !== false && _len && self.o.multiple) {
                self._emitFrm('filesremoved', 10);
            }
        },
        _updateMaxFiles: function(add, file) {
            var _len = this.vFile.length, excd;
            if (this.divTmb) {
                var self = this, opts = self.o, divTmb = self.divTmb;
                $(divTmb).toggleClas('ic-started', _len > 0);
                if (opts.maxfiles !== null) {
                    opts.qntfiles += add;
                    excd = opts.qntfiles >= opts.maxfiles;
                    if ($(divTmb).toggleClas('ic-disabled', excd)) {
                        self._setMgs((excd ? 'msgMaxFiles' : 'msgDefault'), null);
                    }
                    if (add && _len && file) {
                        add = (add > 0), _len = false;
                        excd = ($(divTmb).exist('.ic-error.maxfile') ? true : false);
                        if (!add && excd && file.status === iCrop.QUEUED && (opts.maxfiles - self.getFilesStatus(iCrop.QUEUED, 1) > 0)) {
                            _len = true, file = self.getFilesStatus(iCrop.MAXFILE)[0];
                        } else if (add) {
                            _len = (opts.qntfiles > opts.maxfiles ? true : false);
                        }
                        if (_len) {
                            file.status = (add ? iCrop.MAXFILE : iCrop.QUEUED);
                            self._setMgs('msgMaxFilesExceeded', (add ? null : ''), file.preview);
                            $(file.preview).toggleClass('ic-complete ic-error maxfile');
                        }
                    }
                }
            }
        },
        updateMaxFiles: function(maxfiles) {
            var self = this;
            self.o.maxfiles = ($.isNumeric(maxfiles) ? maxfiles : null);
            self.o.msgMaxFiles = self._msgReplace('{{maxFiles}}', self._o.msgMaxFiles);
            self._updateMaxFiles(0);
        },
        _resetForm: function(e) {
            if (this.o.showcrop) {
                $('#cropForm').elm().reset();
                $('#divCrop').attr({class: '', style: ''});
                if (e) {
                    $('#cropForm #fcSubmit').addClass('disabled');
                    $("#divCrop").html('<img src="' + DIR.img + '" class="imgCrop">');
                } else {
                    $('#imgCrop').attr('src', DIR.img);
                }
            }
            if (e) {
                $(this.formid).elm().reset();
                $(this.formid + ' .fcSubmit').addClass('disabled');
                this.qFile = [], this.vFile = [], this.oPost = null;
            }
        },
        _fileDispatch: function(file) {
            var self = this, oForm, fnProgress;

            if (self.o.showcrop) {
                oForm = new FormData(document.getElementById('cropForm'));
            } else if (self.oPost) {
                oForm = new FormData();
                $.each(self.oPost, function(name, val) {
                    oForm.append(name, val);
                });
            }
            $(self.formid).trigger('sending', oForm);
            if (oForm.get('filePath')) {
                oForm.append('recoil', DIR.recoil);
                oForm.append('accept', self.o.accept);
                oForm.append('inputFile', file, file.name);
                var xhr = new XMLHttpRequest();
                fnProgress = (function(_this) {
                    return function(e) {
                        return _this._onProgress(e, file);
                    };
                })(self);
                xhr.open("POST", DIR.url + DIR.class, true);
                xhr.upload.addEventListener("loadstart", fnProgress, false);
                xhr.upload.addEventListener("progress", fnProgress, false);
                xhr.upload.addEventListener("loadend", fnProgress, false);
                xhr.upload.addEventListener("error", fnProgress, false);
                xhr.onload = function(e, ret) {
                    ret = (xhr.status === 200 && xhr.statusText === 'OK' ? xhr.responseText : null);
                    self._xhrComplete(e, file, ret);
                };
                xhr.send(oForm);
            } else {
                console.error("ERROR: Caminho de destino inválido! 'filePath' ");
            }
        },
        _onProgress: function(e, file) {
            var ev = e.type, progs;
            progs = (ev === 'progress' ? 100 * e.loaded / e.total : (ev === 'loadstart' ? 5 : 100));
            $(file.preview).find('.ic-upload').css('width', progs + '%');
            if (ev === 'error') {
                this._xhrComplete(e, file);
            } else if (progs < 100 || ev === 'loadend') {
                this._emitFrm('fileprogress', 0, file, progs);
            }
        },
        _xhrComplete: function(ev, file, xret) {
            var self = this, ret = {status: 'erro', coffin: 'Erro no Envio!'};
            if (xret && /Warning|Notice|stdClass|on line/.test(xret) === false && xret.charAt(0) === '{') {
                ret = JSON.parse(xret) || ret;
            }
            file.status = (ret.status == 'ok' ? iCrop.SUCCESS : iCrop.ERROR);
            $(file.preview).removeClass('ic-processing').addClass('ic-complete ic-' + file.status);
            self._setMgs('msgError', ret.coffin, file.preview);
            self._setMgs('msgRemove', null, file.preview);

            self._emitFrm('success', 500, file, ret);
            self._emitTmOut('_onSuccess', 1000, file, ret);
        },
        /* ModalCrop */
        _openModalCrop: function() {
            var self = this, o = self.o, size = self.size;
            $('#cropModal').addClass(self.cmfCls);
            $('html').addClass('shwCrop');

            self.size = size = {c: {}, i: {}, d: {}};
            size.c = $.extend({}, {ratio: o.fixRatio, rtoSize: 1, page: 1}, o.sizecut);
            size.c.height = (size.c.height ? size.c.height : size.c.width || 100);
            size.c.width = (size.c.width ? size.c.width : size.c.height || 100);

            self._resetForm(false);
            self._set_cratio('init');

            if (o.showsize !== !$('.cropModal .shwSize').hasClass('hidden')) {
                $('.cropModal .shwSize').toggleClass('hidden');
            }
            setTimeout(function() {
                $("#divCrop").height($("#divCrop").height()).width($("#divCrop .imgCrop").width());
                $('.rowCrop').removeClass('opct0');
            }, 100);
            self._buildTimeEvents(true);
        },
        _closeModal: function(e) {
            var self = this;
            if (self.o.showcrop) {
                $('#cropModal .rowCrop').addClass('opct0');
                $('#cropModal').css('min-height', '0px');
                $('#cropModal').removeClass(self.cmfCls);
                $('#cropModal').delay(300).slideUp(600, function() {
                    $('html').removeClass('shwCrop');
                    $('#cropModal').attr('style', '');
                    self._resetForm(true);
                });
                self._buildTimeEvents(false);
            } else {
                self._resetForm(true);
            }
        },
        /*  definiçoes */
        _emitFrm: function() {
            var evts = 'started, fileadd, filesadded, fileremoved, filesremoved, sending, fileprogress, complete, success';

            var self = this, opts = self.o, args, event, tmout;
            args = [].slice.call(arguments);
            event = args.shift();
            tmout = (args.length && typeof args[0] === 'number' ? args.shift() : 50);

            if (opts[event] && typeof opts[event] === 'function') {
                setTimeout(function() {
                    opts[event].apply(opts, args);
                }, tmout);
            } else {
                setTimeout(function() {
                    $(self.formid).trigger(event, args);
                }, tmout);
            }
        },
        _emitTmOut: function() {
            var self = this, event, tmout, args = [].slice.call(arguments);
            event = args.shift();
            tmout = (args.length && typeof args[0] === 'number' ? args.shift() : 400);
            if (typeof event === 'string' && typeof self[event] === 'function') {
                setTimeout(function() {
                    self[event].apply(self, args);
                }, tmout);
            } else {
                console.error("ERROR: invalid '" + event + "' function.");
            }
        },
        _getOptsInd: function(key) {
            var ind = null;
            if (typeof key === 'string') {
                ind = key.toLowerCase();
                ind = (this.o.hasOwnProperty(ind) ? ind : (this.o.hasOwnProperty(key) ? key : null));
            }
            return ind;
        },
        _addOptsVal: function(key, val) {
            if (!key || typeof val === 'undefined') {
                return;
            } else if (typeof this['_' + key] === 'function') {
                this['_' + key](val);
            } else {
                this.o[key] = val;
                if (key.substr(0, 3) === 'msg') {
                    this._setMgs(key, val);
                }
            }
        },
        option: function(key, val) {
            var self = this, ind;
            if (typeof key === 'object') {
                $.each(key, function(ind, val) {
                    self._addOptsVal(self._getOptsInd(ind), val);
                });
            } else if ((ind = self._getOptsInd(key)) != null) {
                if (typeof val === 'undefined') {
                    return self.o[ind];
                } else {
                    self._addOptsVal(ind, val);
                }
            }
        },
        /* SET'S */
        _accept: function(val) {
            val = val || this.o.accept;
            if (val) {
                val = val.match(/(jpg|jpeg|png)/gi);
                val = (val ? '.' + val.join(',.') : '');
            }
            this.o.accept = val || '.jpg,.jpeg,.png';
            $(this.inputFile).attr('accept', val);
        },
        _multiple: function(val) {
            val = (val && this._o.multiple ? true : false);
            $(this.inputFile).attr('multiple', val);
        },
        _sizecut: function(val) {
            this.o.sizecut = this._getSizeCrop(val, this._o.sizecut, '1024x678');
        },
        _sizetmb: function(val) {
            this.o.sizetmb = val || '';
        },
        _showcrop: function(val) {
            this.o.showcrop = (this._o.multiple || !val ? false : true);
        },
        _openFiles: function() {
            if (this.divTmb && $(this.divTmb).hasClass('ic-disabled')) {
                return false;
            } else {
                $(this.inputFile).focus();
                $(this.inputFile).trigger('click');
            }
        },
        _add_icroptmbs: function() {
            var self = this, opts = self.o, divTmb = self.divTmb, rowGlry;
            self.rowGlry = rowGlry = false;
            if (divTmb === true) {
                opts.showcrop = false;
                divTmb = $(self.formid + ' .icropTmbs').elm() || $('<div />', {class: 'icropTmbs'}).prependTo($(self.formid)).elm();
                $(divTmb).addClass('noEfct openFile');
                if (!$(divTmb).exist('.ic-rowTmbs')) {
                    $(divTmb).html(self._getTemplate('divtmbs'));
                }
                self.divTmb = divTmb;
                if (typeof opts.success !== 'function') {
                    rowGlry = $(opts.success).hasClass('icModelo') ? $(opts.success).parent() : rowGlry;
                    if (!$.isNumeric(opts.qntfiles)) {
                        if ($(opts.success).hasClass('icModelo')) {
                            opts.qntfiles = $(opts.success).siblings().length;
                        } else {
                            opts.qntfiles = $(rowGlry).parent().children().not(opts.success).length;
                        }
                    }
                    self.rowGlry = rowGlry;
                }
                opts.qntfiles = ($.isNumeric(opts.qntfiles) ? opts.qntfiles : 0);
                self._toggleRowGlry();
                self._initDragDrop();
                self.updateMaxFiles(opts.maxfiles);
                $(divTmb).setTimeout('removeClass', 'noEfct', 1000);
            }
        },
        _add_modalCrop: function(ret) {
            if ($('#cropModal.cropModal  #cropForm').length) {
                ret = $('#divCrop .imgCrop').elm();
                if (ret && $(ret).attr('src') != DIR.img) {
                    $(ret).attr('src', DIR.img);
                }
                this._buildTimeEvents('init');
            } else {
                $('#cropModal').html('');
                this.o.showcrop = false;
                console.error('Diretório imgcrop não encontrado');
            }
        },
        _setPath: function() {
            if (!DIR) {
                DIR = {url: 'imgcrop/', view: 'crop-view.html', class: 'crop-control.php', img: '', recoil: 2};
                var url = $.elm('[src$="img-crop.js"]') || $.elm('[src*="imgcrop/"]') || $.elm('[href$="img-crop.css"]');
                url = $(url).attr('src') || $(url).attr('href');
                if (!url) {
                    throw new Error('Diretório imgcrop não encontrado');
                }
                url = url.split('/').reverse(), url.shift();
                (/(js|css)/.test(url[0]) ? url.shift() : null);
                DIR.recoil = url.length, DIR.url = url.reverse().join('/') + '/';
                DIR.img = DIR.img === '' ? DIR.url + 'img/img.jpg' : DIR.img;

                $(document).on('click', '.icEvt', function(e) {
                    return false;
                });
            } else if (this.o.showcrop && (!$('#cropModal').length || !$('#cropModal').hasClass('cropModal'))) {
                var lod, div = $('#cropModal').elm() || $('<div id="cropModal"></div>').appendTo('body');
                $(div).addClass('cropModal');

                lod = (!$(div).html() || !$(div).find('input').length ? true : false);
                lod ? $(div).load(DIR.url + DIR.view, $.proxy(this._add_modalCrop, this)) : this._add_modalCrop();
            }
        },
        _getSizeCrop: function(val, el, ret) {
            var oRet;
            if (val && val.toString() === '[object Object]') {
                oRet = {width: val.width || 0, height: val.height || 0};
            } else {
                val = val || el || ret, oRet = ret;
                if (typeof val === 'string') {
                    val = val.toLowerCase().replace(/[^x\d]/gi, '');
                    oRet = val.splitObj('x', 'width', 'height');
                }
            }
            return oRet;
        },
        _initDragDrop: function() {
            var self = this, div = self.divTmb, ddFiles = false;
            var advUpload = function() {
                return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
            }();
            if (advUpload && $(window).width() > 99) {
                self.option('msgDefault', self.o.msgDefaultDrag);
                $(div).on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                    e.preventDefault(), e.stopPropagation();
                }).on('dragover dragenter', function() {
                    $(div).addClass('is-dragover');
                }).on('dragleave dragend drop', function() {
                    $(div).removeClass('is-dragover');
                }).on('drop', function(e) {
                    ddFiles = e.originalEvent.dataTransfer.files;
                    if ($(div).hasClass('ic-disabled')) {
                        return ddFiles = false;
                    } else if (ddFiles && ddFiles.length) {
                        setTimeout(function() {
                            self.inputFile.files = ddFiles;
                        }, 400);
                    }
                });
            }
        },
        _getDataPost: function() {
            var self = this, opts = self.o;
            if (opts.showcrop) {
                if (!$('#fixRatio').is(':checked')) {
                    $('#fixRatio').trigger('click');
                }
                $('#fc_path').val(opts.filePath);
                $.each(self.size, function(ind, arg) {
                    ind = '#cropForm #' + ind + '_';
                    $.each(arg, function(nam, val) {
                        $(ind + nam).val(val);
                    });
                });
            } else if (!self.oPost) {
                self.oPost = {
                    acao: 'cropFotoSelo', sizetmb: opts.sizetmb, seloFix: opts.seloFix, seloPath: opts.seloPath,
                    cwidth: opts.sizecut.width, cheight: opts.sizecut.height, filePath: opts.filePath
                };
            }
        },
        _thumbMargen: function(img) {
            if ($(img).hasClass('imgCrop')) {
                $(img).attr('id', 'imgCrop');
                $(img).on('load', $.proxy(this._start_crop, this));
            } else {
                $(img).on('load', function(el, mrg) {
                    el = this, mrg = el.width - $(el).parent().width();
                    $(el).addClass((mrg > 1 ? 'ic-tmb-cntr' : ''));
                });
            }
        },
        _windowResize: function(e) {
            $("#divCrop").width($("#divCrop .imgCrop").width());
            $('#cropModal').triggerIn('ic-resize', 200);
        },
        _buildTimeEvents: function(ev) {
            var self = this;
            if (ev === 'init') {
                self.dragStts = false;
                $(document).on('keydown keyup', '#cropForm .cpRatio', function(e) {
                    $(this).triggerIn(e.type === 'keyup' ? 'ic-keyup' : null, 1000);
                });
            } else if (ev !== self.dragStts) {
                self.dragStts = ev;
                if (ev)
                    window.addEventListener('resize', self._windowResize, false);
                else
                    window.removeEventListener('resize', self._windowResize, false);
            }
        },
        getFilesStatus: function(status, qnt) {
            var file, _i, _len, _ref = this.vFile, _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                file = _ref[_i];
                if (file.status === status) {
                    _results.push(file);
                }
            }
            return (qnt ? _results.length : _results);
        },
        getFilesNotStatus: function(status, qnt) {
            var file, _i, _len, _ref = this.vFile, _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                file = _ref[_i];
                if (file.status !== status) {
                    _results.push(file);
                }
            }
            return (qnt ? _results.length : _results);
        },
        getFilesQueue: function(ret) {
            var self = this;
            self.qFile = self.getFilesStatus(iCrop.QUEUED);
            if (ret) {
                return (self.qFile.length ? self.qFile[0] : null);
            } else {
                return self.qFile;
            }
        },
        /* resizable draggable */
        _start_crop: function(divResize) {
            divResize = $(divResize.target).siblings('.divResize');

            var self = this, opt, size = self.size;

            size.c.page = (size.c.width > size.c.height ? 1 : 0);
            self._defineSize();

            $(divResize).resizable({
                aspectRatio: size.c.ratio,
                maxWidth: size.i.width - size.d.left,
                maxHeight: size.i.height - size.d.top
            });
            $(divResize).draggable({
                cursor: "move",
                containment: '#divCrop'
            });
            $(divResize).on('dragstop resizestop', function(el, ui) {
                self._dragResize_stop(el, ui);
            });
            $(divResize).on('resizecreate', function(el, ui) {
                //self._buildTimeEvents(true);
            });
        },
        _dragResize_stop: function(el, ui) {
            var self = this, size = self.size;
            if (!el || el.type !== 'resizestop') {
                if (!el && size.d.width >= size.i.width && size.d.left > 0) {
                    size.d.width = size.i.width, size.i.left = 0;
                    console.log('corrige width');
                }
                if (!el && size.d.height >= size.i.height && size.d.top > 0) {
                    size.d.height = size.i.height, size.i.top = 0;
                    console.log('corrige height');
                }
                if (el) {
                    size.d.top = ui.position.top;
                    size.d.left = ui.position.left;
                }
                $("#divResize").resizable("option", "maxWidth", (size.i.width - size.d.left));
                $("#divResize").resizable("option", "maxHeight", (size.i.height - size.d.top));
            } else if (el.type === 'resizestop') {
                size.d.width = ui.size.width;
                size.d.height = ui.size.height;
            }
        },
        _defineSize: function(e) {
            var self = this, size = self.size, img = size.i, div = size.d;

            $('#divCrop').attr('style', '');
            $('#imgCrop').removeClass('autow autoh');
            if ($('#imgCrop').height() > $('#divCrop').height()) {
                $("#divCrop").height($("#divCrop").height());
                $('#imgCrop').addClass('autoh');
            } else if ($('#imgCrop').width() > $('#divCrop').width()) {
                $("#divCrop").width($("#divCrop").width());
                $('#imgCrop').addClass('autow');
            }
            e = (e ? $.extend({}, img, true) : e);
            img.width = $('#imgCrop').width();
            img.height = $('#imgCrop').height();

            $("#divCrop").css(img);
            if (e) {
                self._onResize(e, img, div);
            } else {
                if (size.c.page && (div.width + 40) > img.width) {
                    div.width = img.width - 40;
                    div.height = regra(size.c.width, size.c.height, div.width);
                } else if (size.c.page == '0' && (div.height + 40) > img.height) {
                    div.height = img.height - 40;
                    div.width = regra(size.c.height, size.c.width, div.height);
                }
                div.left = ((div.width + 40) > img.width ? (img.width - div.width) / 2 : 20);
                div.top = ((div.height + 40) > img.height ? (img.height - div.height) / 2 : 20);
                $('#divResize').css(div);
            }
        },
        _onResize: function(imo, img, div) {
            var self = this, size = self.size;
            var nsiz = false, oldw = div.width, oldh = div.height;
            if (imo.height != img.height) {
                if (size.c.ratio) {
                    nsiz = calcResize(imo.height, img.height, div.height);

                    div.height = (nsiz ? nsiz : img.height);
                    div.width = div.height * size.c.rtoSize;

                    div.top = calcResize(oldh, div.height, div.top, true);
                    div.left = calcResize(oldw, div.width, div.left, true);
                } else {
                    nsiz = true;
                    div.height = regra(imo.height, oldh, img.height, true);
                    div.width = regra(oldh, oldw, div.height, true);
                    div.top = calcResize(oldh, div.height, div.top, true);
                    div.left = calcResize(oldw, div.width, div.left, true);
                }
            } else if (imo.width != img.width) {
                throw new Error('onResize width = ' + size.c.page);
                oldh = div.width / size.c.rtoSize;
            }
            if (nsiz !== false) {
                $("#divResize").css(div);
                self._dragResize_stop();
            }
        },
        _set_cratio: function(e) {
            var self = this, size, c, d;
            size = self.size;
            c = size.c, d = size.d;
            if (e.type === 'change') {
                c.ratio = $(e.target).is(':checked'), e = 'change';
                $("#divResize").resizable("instance")._aspectRatio = c.ratio;
            } else if (e === 'init') {
                $('.cwidth').val(c.width), $('.cheight').val(c.height);
            }
            $('.fixRatio').prop('checked', c.ratio).val((c.ratio ? 1 : 0));
            if (c.ratio !== !$('#cwidth').hasClass('disabled')) {
                $('.cpRatio').toggleClass('disabled');
                $('.cpRatio').prop('readonly', $('.cpRatio').hasClass('disabled'));
            }
            if ($("#divResize").elm()) {
                $("#divResize").resizable("option", "aspectRatio", c.ratio);
                if (e === 'change' && c.ratio) {
                    c.height = regra(d.width, d.height, c.width);
                    $('.cheight').val(c.height);
                    $("#divResize").resizable("instance").originalSize = {width: d.width, height: d.height};
                }
            }
            c.width = $('.cwidth').val() * 1;
            c.height = $('.cheight').val() * 1;
            c.rtoSize = (c.ratio ? ((c.width / c.height) || 1) : 1);
        },
        _cpRatioFix: function(el, val) {
            var size = this.size;
            if (size.c.ratio) {
                val = $(el.target).val().replace(/\D/g, '');
                el = $(el.target).val(val).attr('id');

                if (el == 'cwidth') {
                    $('.cheight').val(Math.round(val / size.c.rtoSize));
                } else {
                    $('.cwidth').val(Math.round(val * size.c.rtoSize));
                }
                size.c.width = $('.cwidth').val() * 1;
                size.c.height = $('.cheight').val() * 1;
            }
        }
    };

    $.fn.icrop = function(option) {
        var args = Array.apply(null, arguments);
        args.shift();
        var internal_return;
        this.each(function() {
            var $this = $(this), data = $this.data('icrop'), options = typeof option === 'object' && option;
            if (!data) {
                var opts = $.extend({}, defaults, options);
                $this.data('icrop', (data = new iCrop(this, opts)));
            } else if (typeof option === 'object' && !args.length) {
                args.push(option), option = 'option';
            }
            if (typeof option === 'string' && option.charAt(0) != '_' && typeof data[option] === 'function') {
                internal_return = data[option].apply(data, args);
                if (internal_return !== undefined)
                    return false;
            }
        });
        return (internal_return !== undefined ? internal_return : this);
    };

    $.fn.icrop.Constructor = iCrop;
    var defaults = $.fn.icrop.defaults = {
        accept: null, // tipos de imagem aceitas
        // se null pega a informção input file, default = '.jpg,.jpeg,.png'
        multiple: null, // multiplas imagem?, se null pega a informção input file
        maxfiles: null, // limitar a quantidade de imagem
        qntfiles: null, // quantidade de imagem ja adicionadas
        filePath: null, // caminho completo da nova imagem
        autosend: null, // apos carregada as imagens enviar automaticamente
        //
        showsize: null, // mostrar no form a opção de redimensionar
        showcrop: null, // se false redimenciona direto, sem exibir a área de seleção 
        fixRatio: null, // manter aspectRatio, null = fica a criterio do usuario
        sizecut: null, // tamanho que a imagem deve ser salva
        sizetmb: null, // tamanho que o thumbnail deve ser salvo
        seloPath: null, // caminho completo do selo
        seloFix: null, // Posição onde o selo deve ser fixado
        //
        /** events.
         * se event value == null apenas dispara o evento no form
         */
        started: null, // chamado após iniciado
        fileadd: null, // chamado apos cada imagem ser carregada
        filesadded: null, // chamado apos todas as imagens serem carregadas
        fileremoved: null, // chamado apos cada imagem ser removida
        filesremoved: null, // chamado apos todas as imagens serem removidas
        sending: null, // chamado antes que o arquivo seja enviado
        fileprogress: null, //chamado sempre que o progresso do upload mudar
        // parâmetros file, progs: o progresso porcentagem (0-100)

        complete: null, // chamado apos todas as imagens serem salvas
        success: null, // chamada apos salva a nova imagem,
        // se success == imagem substitui o src
        // se success == div ou img, e multiple == true,
        // cria um novo elemento (div||img) com a nova imagem e o adiciona na DOM
        icUpload: '<span class="ic-upload"></span>',
        // multiple == true, Mensagens do preview
        msgDefault: 'Click para adicionar fotos!',
        msgDefaultDrag: 'Clique ou arraste as fotos até aqui!',
        msgMaxFiles: 'Limite de {{maxFiles}} fotos atingido!',
        msgRemove: "Remover",
        msgCancel: "Cancelar",
        msgCancelConfirm: "Tem certeza de que deseja cancelar este envio?",
        msgError: "Erro no Envio!",
        msgMaxFilesExceeded: "Você não pode enviar mais fotos.",
        msgInvalidFile: "Você não pode enviar arquivos desse tipo."
    };

    $('form.formiCrop').each(function(i, el) {
        $(el).icrop();
    });
}(window.jQuery));