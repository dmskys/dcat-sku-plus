(function () {
    function SKU(wrap) {
        this.wrap = $(wrap);
        this.attrs = {};
        this.attrsObj = {};
        this.skuAttributes = JSON.parse($('.sku_attributes').val());
        this.uploadUrl = $('.upload_url').val();
        this.deleteUrl = $('.delete_url').val();
        this.attrIndex = 0;
        this.currentAttributeValue = [];
        this.currentSkuId = '';
        this.skuAttr = {};
        this.init();
    }

    SKU.prototype.init = function () {
        let _this = this;
        // 绑定属性值添加事件
        _this.wrap.find('.sku_attr_key_val').on('click', '.Js_add_attr_val', function () {
            let html = '<div class="sku_attr_val_item">' +
                '<div class="sku_attr_val_input">' +
                '<input type="text" class="form-control">' +
                '</div>' +
                '<span class="btn btn-default Js_remove_attr_val"><i class="feather icon-x"></i></span>' +
                '</div>';
            $(this).before(html);
        });

        // 绑定属性值移除事件
        _this.wrap.find('.sku_attr_key_val').on('click', '.Js_remove_attr_val', function () {
            $(this).parent('.sku_attr_val_item').remove();
            _this.getSkuAttr();
        });

        // 选择属性触发
        _this.wrap.find('.sku_attr_key_val').on('change', '.attribute_selector', function () {
            if ($(this).val() != 'input') {
                let skuAttributesArray = _this.skuAttributes;
                _this.attrIndex = $(this).find("option:selected").data('idx');
                _this.skuAttr = skuAttributesArray[_this.attrIndex];
            }
            _this.changeAttrValueHtml($(this), $(this).val());
        });

        // 绑定添加属性名事件
        _this.wrap.find('.Js_add_attr_name').click(function () {
            _this.wrap.find('.sku_attr_key_val tbody').append(_this.getHtml())
        });

        // 绑定移除属性名事件
        _this.wrap.find('.sku_attr_key_val').on('click', '.Js_remove_attr_name', function () {
            $(this).closest('tr').remove();
            _this.getSkuAttr()
        });

        // 绑定input变化事件
        _this.wrap.find('.sku_attr_key_val tbody').on('change', 'input', _this.getSkuAttr.bind(_this));
        _this.wrap.find('.sku_edit_wrap tbody').on('keyup', 'input', _this.processSku.bind(_this));

        // Attr SKU图片上传
        _this.wrap.find('.sku_attr_key_val td').on('click', '.Js_sku_upload', function () {
            if (!$(this).parent().find('input[type="checkbox"]').is(':checked')) {
                Dcat.warning('选中后才能上传图片');
                return;
            }
            _this.upload($(this));
        });

        // 删除图片
        _this.wrap.find('.sku_attr_key_val td').on('click', '.img .icon-x', function () {
            let that = $(this);
            Dcat.confirm('确认要删除图片吗？', null, function () {
                $.ajax({
                    type: "POST",
                    url: _this.deleteUrl,
                    data: {path: that.data('path')},
                    headers: {
                        Accept: "application/json"
                    },
                    success: function (res) {
                        let method = res.code == 200 ? 'success' : 'error';
                        Dcat[method](res.message);
                        if (res.code == 200) {
                            that.parent("div").parent("div").find(".Js_sku_upload").show();
                            that.parent('div').remove();
                            _this.processSku();
                        }
                    }
                })
            });

            return false;
        });

        let old_val = _this.wrap.find('.Js_sku_input').val();
        let params = _this.wrap.find('.Js_sku_params_input').val();
        if (old_val) {
            // 根据值生成DOM
            old_val = JSON.parse(old_val);
            // 处理规格名
            let attr_names = old_val.attrs;
            let tbody = _this.wrap.find('.sku_attr_key_val tbody');
            let attr_keys = Object.keys(attr_names);

            attr_keys.forEach(function (attr_key, index) {
                // 规格名
                let tr = tbody.find('tr').eq(index);
                let scopeAttrType = '';
                let sku = _this.skuAttributes.filter((res) => {
                    return res.attr_name == attr_key;
                });
                if (sku.length > 0) {
                    scopeAttrType = sku[0].attr_type;
                }
                switch (scopeAttrType) {
                    case 'checkbox':
                    case 'radio':
                        _this.currentAttributeValue = attr_names[attr_key];
                        _this.currentSkuId = sku[0].id;
                        let attributeHtml = _this.getAttributeHtml(scopeAttrType, sku[0]);
                        let html = _this.getHtml(attributeHtml);
                        _this.wrap.find('.sku_attr_key_val tbody').append(html);
                        break;
                    default:
                        tr.find('td:eq(0) input').val(attr_key);
                        // 规格值
                        let attr_val_td = tr.find('td:eq(1)');
                        let attr_vals = attr_names[attr_key];
                        let attr_vals_len = attr_vals.length;
                        attr_vals.forEach(function (attr_val, index_2) {
                            attr_val_td.find('input').eq(index_2).val(attr_val);
                            if (index_2 < attr_vals_len - 1) {
                                attr_val_td.find('.Js_add_attr_val').trigger('click');
                            }
                        });
                        break;
                }
            });

            // 生成具体的SKU配置表单
            _this.attrs = old_val.attrs;
            _this.attrsObj = old_val.attrsObj;
            _this.SKUForm(old_val.sku, JSON.parse(params));
        } else {
            _this.processSku();
        }
    };

    // 获取SKU属性
    SKU.prototype.getSkuAttr = function () {
        let attr = {}; // 所有属性
        let attrsObj = {}; //所有属性对象信息
        let _this = this;
        let trs = _this.wrap.find('.sku_attr_key_val tbody tr');
        trs.each(function () {
            let tr = $(this);
            let attr_val = []; // 属性值
            let attr_obj_val = {}; // 属性值obj
            let scopeAttrType = tr.find('td:eq(0) select:eq(0)').val();
            let scopeAttrName = '';
            switch (scopeAttrType) {
                case 'checkbox':
                case 'radio':
                    scopeAttrName = tr.find('td:eq(0) select:eq(0)').find("option:selected").text();
                    tr.find('td:eq(1) input[type="' + scopeAttrType + '"]:checked').each(function (i, v) {
                        attr_val.push($(v).val());
                        let pic = $(v).parent().parent().find(".img img").attr("src");
                        attr_obj_val[$(v).val()] = {
                            'name': $(v).val(),
                            'display': $(v).parent().parent().find(".note").val(),
                            'imageUrl': pic == undefined ? "" : pic
                        };
                    });
                    break;
                default:
                    scopeAttrName = tr.find('td:eq(0) input').val();
                    tr.find('td:eq(1) input').each(function () {
                        let ipt_val = $(this).val();
                        if (ipt_val) {
                            attr_val.push(ipt_val)
                        }
                    });
                    break;
            }
            if (attr_val.length) {
                attr[scopeAttrName] = attr_val;
                attrsObj[scopeAttrName] = attr_obj_val;
            }
        });
        if (JSON.stringify(_this.attrs) !== JSON.stringify(attr) || JSON.stringify(_this.attrsObj) !== JSON.stringify(attrsObj)) {
            _this.attrs = attr;
            _this.attrsObj = attrsObj;
            let params = _this.wrap.find('.Js_sku_params_input').val();
            _this.SKUForm(null, JSON.parse(params))
        }
    };

    // 生成具体的SKU配置表单
    SKU.prototype.SKUForm = function (default_sku, params) {
        let _this = this;
        let attr_names = Object.keys(_this.attrs);
        if (attr_names.length === 0) {
            _this.wrap.find('.sku_edit_wrap tbody').html(' ');
            _this.wrap.find('.sku_edit_wrap thead').html(' ');
        } else {
            // 渲染表头
            let thead_html = '<tr>';
            attr_names.forEach(function (attr_name) {
                thead_html += '<th style="width: 80px">' + attr_name + '</th>'
            });
            thead_html += '<th data-field="stock">库存 <input type="text" class="form-control"></th>';
            thead_html += '<th data-field="price">价格 <input type="text" class="form-control"></th>';

            params.forEach((v) => {
                thead_html += '<th data-field="' + v['field'] + '">' + v['name'] + '<input  type="text" class="form-control"></th>'
            })

            thead_html += '</tr>';
            _this.wrap.find('.sku_edit_wrap thead').html(thead_html);

            // 求笛卡尔积
            let cartesianProductOf = (function () {
                return Array.prototype.reduce.call(arguments, function (a, b) {
                    const ret = [];
                    a.forEach(function (a) {
                        b.forEach(function (b) {
                            ret.push(a.concat([b]));
                        });
                    });
                    return ret;
                }, [[]]);
            })(...Object.values(_this.attrs));

            // 根据计算的笛卡尔积渲染tbody
            let tbody_html = '';
            cartesianProductOf.forEach(function (sku_item) {
                tbody_html += '<tr>';
                sku_item.forEach(function (attr_val, index) {
                    let attr_name = attr_names[index];
                    tbody_html += '<td data-field="' + attr_name + '" class="attr-name">' + attr_val + '</td>';
                });
                tbody_html += '<td data-field="stock"><input value="" type="text" class="form-control"></td>';
                tbody_html += '<td data-field="price"><input value="" type="text" class="form-control"></td>';

                params.forEach((v) => {
                    tbody_html += '<td data-field="' + v['field'] + '"><input value="' + v['default'] + '" type="text" class="form-control"></td>';
                })
                tbody_html += '</tr>'
            });
            _this.wrap.find('.sku_edit_wrap tbody').html(tbody_html);
            if (default_sku) {
                // 填充数据
                default_sku.forEach(function (item_sku, index) {
                    let tr = _this.wrap.find('.sku_edit_wrap tbody tr').eq(index);
                    Object.keys(item_sku).forEach(function (field) {
                        let input = tr.find('td[data-field="' + field + '"] input');
                        if (input.length) {
                            input.val(item_sku[field]);
                        }
                    })
                });
            }
        }
        _this.processSku()
        _this.setListener()
    };


    SKU.prototype.setListener = function () {
        let _this = this
        let ths = _this.wrap.find('.sku_edit_wrap thead th')
        let tr = _this.wrap.find('.sku_edit_wrap tbody tr')
        let tds = tr.find('td[data-field]')
        let ads = _this.wrap.find(".attr-display-name")
        let notes = _this.wrap.find(".note")

        ths.each(function () {
            let th = $(this)
            let input = th.find('input')
            input.change(function () {
                let value = input.val()
                let field = th.attr('data-field')
                // 找出所有带这个attr的下级
                tds.each(function () {
                    let td = $(this)
                    let tdField = td.attr('data-field')
                    let tdInput = td.find('input')
                    if (tdInput && field === tdField) {
                        tdInput.val(value);
                    }
                })
                _this.processSku()
            })
        });

        ads.each(function () {
            let input = $(this)
            input.change(function () {
                let field = input.attr('data-field')
                let value = input.val()
                _this.wrap.find('.attr-display-name[data-field="' + field + '"]').val(value);
            })
            _this.processSku()
        });

        notes.each(function () {
            let input = $(this)
            input.change(function () {
                _this.getSkuAttr()
            })
        });
    };

    // 处理最终SKU数据，并写入input
    SKU.prototype.processSku = function () {
        let _this = this;
        let sku_json = {};
        sku_json.type = _this.wrap.find('.sku_attr_select .btn.btn-success').attr('data-type');
        // 多规格
        sku_json.attrs = _this.attrs;
        sku_json.attrsObj = _this.attrsObj;
        let sku = [];
        _this.wrap.find('.sku_edit_wrap tbody tr').each(function () {
            let tr = $(this);
            let item_sku = {};
            tr.find('td[data-field]').each(function () {
                let td = $(this);
                let field = td.attr('data-field');
                item_sku[field] = td.find('input').val() || td.text();
            });
            sku.push(item_sku);
        });
        sku_json.sku = sku;
        _this.wrap.find('.Js_sku_input').val(JSON.stringify(sku_json));
    };

    // 图片上传
    SKU.prototype.upload = function (obj) {
        let _this = this;
        // 创建input[type="file"]元素
        let file_input = document.createElement('input');
        file_input.setAttribute('type', 'file');
        file_input.setAttribute('accept', 'image/x-png,image/jpeg');

        // 模拟点击 选择文件
        file_input.click();

        file_input.onchange = function () {
            let file = file_input.files[0];  //获取上传的文件名
            let formData = new FormData();
            formData.append('file', file);
            // 使用ajax上传文件
            $.ajax({
                type: "POST",
                url: _this.uploadUrl,
                data: formData,
                contentType: false, //告诉jQuery不要去设置Content-Type请求头
                headers: {
                    Accept: "application/json"
                },
                processData: false, //告诉jQuery不要去处理发送的数据
                success: function (res) {
                    obj.before('<div class="img"><img src="' + res.full_url + '"/><i class="feather icon-x" data-path="' + res.short_url + '"></i></div>');
                    _this.processSku();
                    _this.getSkuAttr();
                    obj.hide();
                }
            })
        }
    };

    SKU.prototype.changeAttrValueHtml = function (e, attrType) {
        let html = this.getAttributeHtml(attrType, this.skuAttr);
        attrType != 'input' ? e.next('input').hide() : e.next('input').show();
        e.parent().next('td').find('.sku_attr_val_wrap').html(html);
    };

    SKU.prototype.getAttributeHtml = function (attrType, attribute) {
        let _this = this;
        let html = '';
        switch (attrType) {
            case 'checkbox':
                if (attribute.attr_value.length > 0) {
                    html += '<div class="d-flex flex-wrap">';
                    attribute.attr_value.forEach(function (v) {
                        html += '<div class="checkbox-wrp"><div class="vs-checkbox-con vs-checkbox-primary" style="margin-right: 5px"><input value="' + v + '" class="Dcat_Admin_Widgets_Checkbox" type="checkbox" name="' + attribute.attr_name + '"';
                        if (_this.currentAttributeValue.indexOf(v) >= 0) {
                            html += ' checked="checked"';
                        }
                        html += '><span class="vs-checkbox">' +
                            '<span class="vs-checkbox--check">' +
                            '<i class="vs-icon feather icon-check"></i>' +
                            '</span>' +
                            '</span>' +
                            '<span>' + v + '</span>' +
                            '</div>' +
                            '<input type="text" placeholder="显示名称" value="' + v + '" class="form-control note" style="width: 70px;height: 30px;min-height: 30px;">' +
                            '<span class="Js_sku_upload"><i class="feather icon-upload-cloud"></i></span>' +
                            '</div>';
                    });
                    html += '</div>';
                }
                break;
            case 'radio':
                if (attribute.attr_value.length > 0) {
                    html += '<div class="d-flex flex-wrap">';
                    attribute.attr_value.forEach(function (v) {
                        html += '<div class="vs-radio-con vs-radio-primary" style="margin-right: 16px">' +
                            '<input value="' + v + '" class="Dcat_Admin_Widgets_Radio" type="radio" name="' + attribute.attr_name + '"';
                        if (_this.currentAttributeValue.indexOf(v) >= 0) {
                            html += ' checked="checked"';
                        }
                        html += '><span class="vs-radio">' +
                            '<span class="vs-radio--border"></span>' +
                            '<span class="vs-radio--circle"></span>' +
                            '</span>' +
                            '<span>' + v + '</span>' +
                            '</div>';
                    });
                    html += '</div>';
                }
                break;
            default:
                html = '';
                break;
        }

        return html;
    };

    SKU.prototype.getHtml = function (innerHtml = '') {
        let _this = this;
        let skuAttributesArray = this.skuAttributes;
        let html = '<tr><td><select class="form-control  attribute_selector"';
        if (innerHtml.length > 0 && _this.currentSkuId == '') {
            html += ' selected="selected"';
        }
        html += '><option value="input">请选择</option>';
        skuAttributesArray.forEach(function (v, i) {
            html += ' <option value="' + v.attr_type + '" data-idx="' + i + '"';
            if (innerHtml.length > 0 && v.id == _this.currentSkuId) {
                html += ' selected="selected"';
            }
            html += '>' + v.attr_name + '</option>'
        });
        html += '</select></td><td><div class="sku_attr_val_wrap">' +
            (innerHtml.length > 0 ? innerHtml : this.getAttributeHtml('input', this.skuAttr)) +
            '</div></td><td><span class="btn btn-default Js_remove_attr_name">移除</span></td></tr>';

        return html;
    };

    window.JadeKunSKU = SKU;
})();
