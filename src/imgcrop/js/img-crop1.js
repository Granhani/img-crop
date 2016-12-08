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
        return '<span><strong>' + Math.round(bts) + '</strong> ' + uni + '</span>';
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
            if (opt.showcrop && !$(el).find('.openCrop').elm()) {
                $(el).append('<a href="#" class="btn btn-info openCrop"><i class="glyphicon glyphicon-picture"></i> Alterar Imagem</a>');
            }
            opt.showcrop = ($(el).find('.openCrop').length ? true : false);
        }

        opt.filePath = (opt.filePath || $(el).elAttr('filePath').val() || null);
        opt.seloPath = (opt.seloPath || $(el).elAttr('seloPath').val() || null);
        opt.seloFix = (opt.seloFix || $(el).elAttr('seloFix').val() || null);

        if (opt.success !== false) {
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
            if (o.multiple) {
                this._add_icroptmbs();
            } else {
                this.divTmb = false;
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
        _buildEvents: function() {
            $('.fcSubmit').addClass('disabled icEvt');
            $('#cropForm a, .fcSubmit, .fcCancel, .openCrop, .icropTmbs, .openFile').addClass('icEvt');
            this.cmfCls = (this.formid).replace('#', 'cmf-');
            if (this.o.showcrop) {
                var cmfCls = '#cropModal.' + this.cmfCls;
                $(document).on('click', cmfCls + ' #fcOpen', $.proxy(this._openFiles, this));
                $(document).on('click', cmfCls + ' #closeCrop', $.proxy(this._closeModal, this));
                $(document).on('click', cmfCls + ' #fcSubmit', $.proxy(this._fcSubmit, this));
                $(document).on('change', cmfCls + ' #fixRatio', $.proxy(this._set_cratio, this));
                $(document).on('ic-resize', cmfCls, $.proxy(this._defineSize, this));
                $(document).on('ic-keyup', cmfCls + ' .cpRatio', $.proxy(this._cpRatioFix, this));
                this.o.msgCancel = '<span class="ic-upload"></span>';
            } else {
                $(this.formid).on('click', '.fcSubmit', $.proxy(this._fcSubmit, this));
            }
            $(this.formid).on('click', '.openFile', $.proxy(this._openFiles, this));
            $(this.formid).on('click', '.openCrop', $.proxy(this._openFiles, this));
            $(this.formid).on('click', '.fcCancel', $.proxy(this.removeAll, this));
            $(this.inputFile).on('change', $.proxy(this._fileadd, this));
        },
        _onSuccess: function(file, ret) {
            var self = this, div, img, src, succOk = (self.o.success && ret.status == 'ok' ? true : false);
            self._emitFrm('success', 500, file, ret);

            if (succOk) {
                src = (ret.tmb ? ret.tmb : ret.path);
                if ($(self.o.success).is('img')) {
                    img = self.o.success, div = $(img).closest('a').elm();
                } else {
                    div = (self.divTmb ? $.parseHTML(self.o.success.outerHTML) : self.o.success), img = $(div).find('img:not(.imgPrev)').elm();
                }
            }

            self._fadePreview(succOk || !self.divTmb ? file : null);

            if (self.divTmb && succOk) {
                $(div).removeClass('icModelo').appendTo($(self.o.success).parent());
            }
            self._emitTmOut('_fcSubmit', 400);
            //img = (file.imgPrev ? self._removeImgPrev(file, 1) : img);
            if (succOk) {
                //$(img).attr('src', src + (self.divTmb ? '' : '?' + Math.random()));
                $(img).attr('src', src + '?' + Math.random());
                div = $(div).is('a') ? div : $(img).closest('a').elm(), src = (div ? $(div).attr('href') : '');
                if (div && /(\.jpg|\.jpeg|\.png|\.gif|\.bmp)$/gi.test(src)) {
                    $(div).attr('href', ret.path);
                }
            }
        },
        _onProgress: function(e, file, ret) {
            var self = this, progs = (e.type === 'progress' ? 100 * e.loaded / e.total : 100) + '%';
            $(file.preview).find('.ic-upload').css('width', progs);
            if (e.type !== 'progress') {
                ret = ret || {status: e.type, coffin: ''};
                file.status = (ret.status == 'ok' ? iCrop.SUCCESS : iCrop.ERROR);
                $(file.preview).removeClass('ic-processing').addClass('ic-complete ic-' + file.status);
                $(file.preview).find('.ic-error-message span').html(ret.coffin);
                $(file.preview).find('.ic-remove').html(self.o.msgRemove);
            }
            self._emitFrm('fileprogress', file, progs);
            if (e.type !== 'progress') {
                self._emitTmOut('_onSuccess', 1000, file, ret);
            }
        },
        _fileDispatch: function(file) {
            var self = this, oForm;

            if (self.oPost) {
                oForm = new FormData();
                $.each(self.oPost, function(name, val) {
                    oForm.append(name, val);
                });
            } else if (self.o.showcrop) {
                oForm = new FormData(document.getElementById('cropForm'));
            }
            $(self.formid).trigger('sending', oForm);
            if (oForm.get('filePath')) {
                oForm.append('recoil', DIR.recoil);
                oForm.append('accept', self.o.accept);
                oForm.append('inputFile', file, file.name);

                var xhr = new XMLHttpRequest();
                xhr.open("POST", DIR.url + DIR.class, true);
                xhr.upload.addEventListener("progress", function(e) {
                    self._onProgress(e, file);
                }, false);
                xhr.upload.addEventListener("error", function(e) {
                    self._onProgress(e, file);
                }, false);
                xhr.onload = function(e, ret) {
                    ret = {status: 'erro', coffin: 'Erro no Envio!'};
                    if (xhr.status === 200 && xhr.statusText === 'OK') {
                        if (/Warning|Notice|stdClass|on line/.test(xhr.responseText) === false) {
                            ret = eval("(" + xhr.responseText + ")") || ret;
                        }
                    }
                    self._onProgress(e, file, ret);
                };
                xhr.send(oForm);
            } else {
                console.error("ERROR: Caminho de destino inválido! 'filePath' ");
            }
        },
        _fcSubmit: function(e) {
            var self = this, o = self.o, file;
            file = self.getFilesQueue(1);
            if (file && (e || self.o.autosend !== false)) {
                self.sendFile(file);
            } else if (!file && self.vFile.length) {
                if (!self.divTmb) {
                    self._emitTmOut((o.showcrop ? '_closeModal' : '_resetForm'), 200, true);
                } else if (self.getFilesStatus(iCrop.SUCCESS, 1) === self.vFile.length) {
                    self.removeAll();
                }
            }
        },
        sendFile: function(file) {
            var self = this;
            if (file && file.status === iCrop.QUEUED) {
                file.status = iCrop.PROCESSING;
                self._getDataPost();
                if (file.preview) {
                    $(file.preview).find(self.o.showcrop ? '#divResize .ui-icon' : '.ic-remove').html(self.o.msgCancel);
                    $(file.preview).addClass('ic-processing');
                }
                self._fileDispatch(file);
            } else {
                console.error((!file ? 'arquivo inválido!' : 'file status inválido! ' + file.status));
            }
        },
        _addPreview: function(file, img) {
            var self = this, elPrev, imgLoad = self.getFilesQueue(1);
            if (imgLoad) {
                self.removeFile(imgLoad, 1);
            }
            self._imagePreview(file);
            if (self.o.success) {
                elPrev = ($(self.o.success).is('img') ? self.o.success : $(self.o.success).children().elm());
                if ($(elPrev).is('img')) {

                    imgLoad = $('<div />', {class: 'icropTmbs icLoadPrev icEvt', html: '<img class="imgPrev" src="' + img + '">'});
                    img = $(imgLoad).find('.imgPrev').height($(elPrev).height());

                    $(elPrev).parent().addClass('icInPrev');
                    $(imgLoad).append(file.preview);
                    $(imgLoad).insertAfter(elPrev);

                    self._thumbMargen(img);
                    file.preview = $(imgLoad).elm();
                }
            }
        },
        _imagePreview: function(file, addSize) {
            var self = this, preview, removeLink, removeFileEvent;
            if (self.o.showcrop) {
                preview = $('<div />', {id: 'divCrop', class: 'divCrop', html: '<div id="divResize"></div>'});
            } else {
                addSize = (addSize ? calcFileSize(file.size) : '');
                if (addSize) {
                    addSize = '<div class="ic-image"></div><div class="ic-details"><div class="ic-size">' + addSize;
                    addSize += '</div><div class="ic-filename"><span>' + file.name + '</span></div></div>';
                }
                preview = '<div class="ic-progress"><span class="ic-upload"></span></div>\n\
                       <div class="ic-error-message"><span></span></div>\n\
                       <div class="ic-success-mark"><i class="glyphicon glyphicon-ok"></i></div>\n\
                       <div class="ic-error-mark"><i class="glyphicon glyphicon-remove"></i></div>';

                preview = $('<div />', {class: 'ic-preview ic-image-preview', html: addSize + preview});

                removeLink = $('<span class="ic-remove">' + self.o.msgRemove + '</span>');
                removeFileEvent = (function(_this) {
                    return function(e) {
                        e.preventDefault(), e.stopPropagation();
                        return _this.removeFile(true, file, 20);
                    };
                })(self);
                $(removeLink).on("click", removeFileEvent).appendTo(preview);
            }
            file.status = iCrop.QUEUED;
            file.preview = $(preview).elm();
            return file;
        },
        _openModal: function(file, img) {
            var self = this, o = self.o, size = self.size;
            if (!$('html').hasClass('shwCrop')) {
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
            }
            $('#fcSubmit').removeClass('disabled');
            size.d = {width: size.c.width, height: size.c.height, left: 0, top: 0};

            self._imagePreview(file);
            img = $('<img />', {id: 'imgCrop', class: 'imgCrop', src: img});
            $('#colCrop').html('').append($(file.preview).append(img));
            $(img).on('load', $.proxy(this._start_crop, this));
        },
        _add_icroptmbs: function(file, img) {
            var self = this, o = self.o, divTmb = self.divTmb;
            if (divTmb === undefined) {
                o.showcrop = false;
                divTmb = $(self.formid + ' .icropTmbs').elm() || $('<div />', {class: 'icropTmbs'}).elm();
                $(divTmb).html('<div class="ic-message"><span>' + o.msgDefault + '</span><i class="ic-picture"></i></div><div class="ic-rowTmbs"></div>');
                $(self.formid).prepend($(divTmb).addClass('openFile'));
                self.divTmb = divTmb;
                self.updateMaxFiles(o.maxfiles);
                self._initDragDrop();
                //self._emitFrm('started', self.divTmb);
            } else if (divTmb && file && img) {
                self._imagePreview(file, 1);
                img = $('<img />', {alt: file.name, class: 'tmbCrop', src: img});
                self._thumbMargen(img);
                $(file.preview).find('.ic-image').prepend(img);
                $(file.preview).appendTo($(divTmb).find('.ic-rowTmbs'));
            }
        },
        _fileadd: function(e) {
            var self = this, o = self.o, files = self.inputFile.files, emitFn, i = 0, file;
            if (files) {
                emitFn = (self.divTmb ? '_add_icroptmbs' : (o.showcrop ? '_openModal' : '_addPreview'));
                $(self.formid + ' .fcSubmit').removeClass('disabled');
                for (i = 0; i < files.length; i++) {
                    file = files[i];
                    file.status = iCrop.ADDED;
                    self[emitFn](file, window.URL.createObjectURL(file));
                    self._emitFrm('fileadd', file);
                    self.vFile.push(file);
                    self._updateMaxFiles(1);
                }
                self._emitFrm('filesadded', self.vFile);
                if (!o.showcrop && o.autosend) {
                    self._emitTmOut('_fcSubmit', 800, true);
                }
            }
            $(self.inputFile).val('');
        },
        _getDataPost: function() {
            var self = this, o = self.o;
            if (o.showcrop) {
                if (!$('#fixRatio').is(':checked')) {
                    $('#fixRatio').trigger('click');
                }
                $('#fc_path').val(o.filePath);
                $.each(self.size, function(ind, arg) {
                    ind = '#cropForm #' + ind + '_';
                    $.each(arg, function(nam, val) {
                        $(ind + nam).val(val);
                    });
                });
            } else if (!self.oPost) {
                self.oPost = {
                    acao: 'cropFotoSelo', sizetmb: o.sizetmb, seloFix: o.seloFix, seloPath: o.seloPath,
                    cwidth: o.sizecut.width, cheight: o.sizecut.height, filePath: o.filePath
                };
            }
        },
        _thumbMargen: function(img) {
            $(img).on('load', function(el, mrg) {
                el = this, mrg = el.width - $(el).parent().width();
                $(el).addClass((mrg > 1 ? 'ic-tmb-cntr' : ''));
            });
        },
        _fadePreview: function(preview, tm, rmv) {
            if (preview) {
                preview = preview.preview || preview;
                var divLoad = $(preview).hasClass('icLoadPrev');
                tm = tm || (divLoad ? 2000 : 10);
                setTimeout(function() {
                    $(preview).fadeOut(function() {
                        if (divLoad) {
                            $(divLoad).parent().removeClass('icInPrev'), rmv = true;
                        }
                        rmv ? $(preview).remove() : null;
                    });
                }, tm);
            }
        },
        removeFile: function(file, tm) {
            var self = this, preview, ind;
            if (file && file.preview && (preview = file.preview) != null) {
                ind = $(preview).hasClass('icLoadPrev') ? 0 : $(preview).index();
                self._fadePreview(file, tm, true);
                self.vFile.splice(ind, 1);
                self._emitFrm('fileremoved', file);
                self._updateMaxFiles(-1);
            } else {
                console.log(file);
            }
        }, // remove
        removeAll: function() {
            var self = this, vFile = self.vFile, i = 0, file;
            if (vFile.length) {
                for (i = 0; i < vFile.length; i++) {
                    file = vFile[i];
                    if (file.status !== iCrop.SUCCESS) {
                        this._updateMaxFiles(-1);
                    }
                }
                if (this.divTmb) {
                    $(this.divTmb).find('.ic-preview').remove();
                } else {
                    this._fadePreview(file, 1, true);
                }
            }
            this._resetForm(true);
            this._updateMaxFiles();
        },
        updateMaxFiles: function(maxfiles) {
            var self = this, o = self.o;
            if (!o.msgMaxFiles_dfl) {
                o.msgMaxFiles_dfl = o.msgMaxFiles;
            }
            o.maxfiles = ($.isNumeric(maxfiles) ? maxfiles : null);
            o.msgMaxFiles = (o.msgMaxFiles_dfl).replace('{{maxFile}}', (o.maxfiles === null || o.maxfiles < 2 ? '' : o.maxfiles));
            self._updateMaxFiles();
        },
        _updateMaxFiles: function(qnt) {
            var self = this, _len = self.vFile.length;
            if (self.divTmb) {
                if (_len > 0 !== $(self.divTmb).hasClass('ic-started')) {
                    $(self.divTmb).toggleClass('ic-started');
                }
            }
            if (!self.isNull('o.maxfiles')) {
                self.o.qntfiles += (qnt || 0);
                if (_len) {
                    qnt = self.getFilesStatus(iCrop.QUEUED, 1), _len = null;
                    if (self.o.qntfiles > self.o.maxfiles && qnt) {
                        _len = $(self.getFilesStatus(iCrop.QUEUED)).get(-1), qnt = 1;
                    } else if (self.o.maxfiles - qnt > 0 && $(self.divTmb).find('.ic-error.maxfile').length) {
                        _len = self.getFilesStatus(iCrop.MAXFILE)[0], qnt = -1;
                    }
                    if (_len) {
                        _len.status = (qnt > 0 ? iCrop.MAXFILE : iCrop.QUEUED);
                        $(_len.preview).toggleClass('ic-complete ic-error maxfile');
                        $(_len.preview).find('.ic-error-message span').html((qnt > 0 ? self.o.msgMaxFiles : ''));
                    }
                }
                qnt = self.o.qntfiles >= self.o.maxfiles;
                if (qnt !== $(self.divTmb).hasClass('ic-disabled')) {
                    $(self.divTmb).toggleClass('ic-disabled');
                    $(self.divTmb).find('.ic-message span').html((qnt ? self.o.msgMaxFiles : self.o.msgDefault));
                }
            }
        },
        _resetForm: function(e) {
            if (this.o.showcrop) {
                $('#cropForm').elm().reset();
                $('#divCrop').attr({class: '', style: ''});
                if (e) {
                    $('#fcSubmit').addClass('disabled');
                    $("#divCrop").html('<img src="' + DIR.img + '" class="imgCrop">');
                } else {
                    $('#imgCrop').attr('src', DIR.img);
                }
            }
            if (e) {
                $(this.formid).elm().reset();
                $(this.formid).find('.fcSubmit').addClass('disabled');
                this.qFile = [], this.vFile = [], this.oPost = null;
            }
        },
        _closeModal: function(e) {
            var self = this;
            $('.rowCrop').addClass('opct0');
            $('#cropModal').css('min-height', '0px');
            $('#cropModal').removeClass(self.cmfCls);
            $('#cropModal').delay(300).slideUp(600, function() {
                $('html').removeClass('shwCrop');
                $('#cropModal').attr('style', '');
                self._resetForm(e);
            });
        },
        _openFiles: function() {
            $(this.inputFile).focus();
            $(this.inputFile).trigger('click');
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
        getFilesQueue: function(ret) {
            var self = this;
            self.qFile = self.getFilesStatus(iCrop.QUEUED);
            if (ret) {
                return (self.qFile.length ? self.qFile[0] : null);
            } else {
                return self.qFile;
            }
        },
        _divMsg: {
            msgDefault: '.ic-message span',
            msgMaxFiles: '.ic-message span',
            msgMaxFilesExceeded: '.ic-message span',
            msgRemove: '.ic-remove',
            msgCancel: '.ic-remove',
            msgCancelConfirm: '.ic-error-message span',
            msgError: '.ic-error-message span',
            msgInvalidFile: '.ic-error-message span'
        },
        _setMgs: function(key, val, div) {
            var self = this, el;
            val ? self.o[key] = val : val = self.o[key];
            div = (!div ? self.divTmb : div.preview || div);

            $(div).find(self._divMsg[key]).html(val);
        },
        option: function(key, val) {
            var self = this;
            if (typeof key === 'string' && key.substr(0, 3) === 'msg') {
                self._setMgs(key, val);
            }
        },
        isNull: function(val) {
            val = (val && val.hasChar('o.') ? this.o[val.substr(2)] : val);
            return val === null;
        },
        isEmpty: function(val, emp) {
            val = (typeof val === 'string' && val.hasChar('o.') ? this.o[val.substr(2)] : val);
            if (typeof emp !== 'undefined') {
                return val == emp;
            } else if (val == '0' && emp == '0') {
                return false;
            } else if (!val || val == '0' || val == 'false' || val == 'null') {
                return true;
            } else if (val.toString() === '[object Object]') {
                return $.isEmptyObject(val);
            } else {
                return val.length < 1;
            }
        },
        _add_modalCrop: function(ret) {
            if ($('.cropModal').length === 0) {
                ret = (ret && typeof ret === 'string' && /cropModal|cropForm/.test(ret) ? $.parseHTML(ret) : false);
                if (!ret || !$(ret).find('#cropForm').length) {
                    throw new Error('Diretório imgcrop não encontrado');
                }
                $(ret).appendTo('body');
            }
            ret = $('#divCrop .imgCrop').elm();
            if (ret && $(ret).attr('src') != DIR.img) {
                $(ret).attr('src', DIR.img);
            }
        },
        _setPath: function() {
            if (DIR) {
                console.log('ja tem');
            } else {
                DIR = {url: 'imgcrop/', view: 'crop-view.html', class: 'crop-control.php', img: '', recoil: 2};
                var url = $.elm('[src$="img-crop.js"]') || $.elm('[src*="imgcrop/"]') || $.elm('[href$="img-crop.css"]');
                url = $(url).attr('src') || $(url).attr('href');
                if (!url) {
                    throw new Error('Diretório imgcrop não encontrado');
                } else {
                    url = url.split('/').reverse();
                    url.shift();
                    (url[0] == 'js' || url[0] == 'css' ? url.shift() : null);
                    DIR.recoil = url.length;
                    DIR.url = url.reverse().join('/') + '/';
                    if (DIR.img === '') {
                        DIR.img = DIR.url + 'img/img.jpg';
                    }
                    $('#cropModal').length ? this._add_modalCrop() : $.get(DIR.url + DIR.view, $.proxy(this._add_modalCrop, this));
                }
                $(document).on('click', '.icEvt', function(e) {
                    return false;
                });
                this._buildTimeout();
            }
        },
        _accept: function(val) {
            val = val || this.o.accept;
            if (val) {
                val = val.match(/(jpg|jpeg|png)/gi);
                val = (val ? '.' + val.join(',.') : '');
            }
            this.o.accept = val || '.jpg,.jpeg,.png';
            $(this.inputFile).attr('accept', val);
            $(this.inputFile).attr('multiple', this.o.multiple);
        },
        /* resizable draggable */
        _start_crop: function() {
            var self = this, size = self.size, opt = {aspectRatio: size.c.ratio};
            size.c.page = (size.c.width > size.c.height ? 1 : 0);
            self._defineSize();

            opt.maxWidth = size.i.width - size.d.left;
            opt.maxHeight = size.i.height - size.d.top;
            $("#divResize").resizable(opt);
            $('#divResize').draggable({
                cursor: "move",
                containment: '#divCrop'
            });
            $('#divResize').on('dragstop', function(el, ui) {
                self._drag_stop(el, ui);
            });
            $('#divResize').on('resizestop', function(el, ui) {
                self._resize_stop(el, ui);
            });
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
                self._drag_stop();
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
        },
        _resize_stop: function(el, ui) {
            this.size.d.width = ui.size.width;
            this.size.d.height = ui.size.height;
        },
        _drag_stop: function(el, ui) {
            var size = this.size;
            if (el) {
                size.d.top = ui.position.top;
                size.d.left = ui.position.left;
            } else {
                if (size.d.width >= size.i.width && size.d.left > 0) {
                    console.log('corrige width');
                    size.d.width = size.i.width;
                    size.i.left = 0;
                }
                if (size.d.height >= size.i.height && size.d.top > 0) {
                    console.log('corrige height');
                    size.d.height = size.i.height;
                    size.i.top = 0;
                }
            }
            $("#divResize").resizable("option", "maxWidth", (size.i.width - size.d.left));
            $("#divResize").resizable("option", "maxHeight", (size.i.height - size.d.top));
        },
        _emitFrm: function() {
            var evts = 'fileadd, filesadded, fileremoved, filesremoved, sending, fileprogress, success, complete, started';
            var self = this, data = self.o, args, event, tmout;
            args = [].slice.call(arguments);
            event = args.shift();
            tmout = (args.length && typeof args[0] === 'number' ? args.shift() : 50);

            if (data[event] && typeof data[event] === 'function') {
                data[event].apply(data, args);
            }

            setTimeout(function() {
                //$(self.formid).trigger(event, args);
            }, tmout);
        },
        _emitTmOut: function() {
            var self = this, args, event, tmout;
            args = [].slice.call(arguments);
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
        _initDragDrop: function() {
            var self = this, div = self.divTmb, ddFiles = false;
            var advUpload = function() {
                return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
            }();
            if (advUpload && $(window).width() > 99) {
                self._setMgs('msgDefault', 'Clique ou arraste as fotos até aqui!');
                $(div).on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                    e.preventDefault(), e.stopPropagation();
                });
                $(div).on('dragover dragenter', function() {
                    $(div).addClass('is-dragover');
                });
                $(div).on('dragleave dragend drop', function() {
                    $(div).removeClass('is-dragover');
                });
                $(div).on('drop', function(e) {
                    ddFiles = e.originalEvent.dataTransfer.files;
                    if (ddFiles && ddFiles.length) {
                        setTimeout(function() {
                            self.inputFile.files = ddFiles;
                        }, 400);
                    }
                });
            }
        },
        _buildTimeout: function() {
            var tRto = 1, tmRsz = 1;

            $(window).on('resize', function(e) {
                if ($('#imgCrop').length && !$(e.target).attr('id')) {
                    clearTimeout(tmRsz);
                    $("#divCrop").width($("#divCrop .imgCrop").width());
                    tmRsz = setTimeout(function() {
                        $('#cropModal').trigger('ic-resize');
                    }, 200);
                }
            });
            $(document).on('keydown keyup', '#cropForm .cpRatio', function(e) {
                clearTimeout(tRto);
                if (e.type === 'keyup') {
                    e = $(this);
                    tRto = setTimeout(function() {
                        $(e).trigger('ic-keyup');
                    }, 1000);
                }
            });
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
        qntfiles: 0, // quantidade de imagem ja adicionadas
        filePath: null, // caminho completo da nova imagem
        autosend: null, // apos carregada as imagens enviar automaticamente
        //
        showsize: null, // mostrar no form a opção de redimencionar
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

        // multiple == true, Mensagens do preview
        msgDefault: 'Click para adicionar fotos!',
        msgMaxFiles: 'Limite de {{maxFile}} fotos atingido!',
        msgRemove: "Remover",
        msgCancel: "Cancelar",
        msgCancelConfirm: "Tem certeza de que deseja cancelar este envio?",
        msgError: "Erro no Envio!",
        msgMaxFilesExceeded: "Você não pode enviar mais fotos.",
        msgInvalidFile: "Você não pode enviar arquivos desse tipo."
    };
}(window.jQuery));