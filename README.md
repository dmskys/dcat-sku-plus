# Dcat Admin SKU扩展
基于https://github.com/Abbotton/dcat-sku-plus 修改
# 只支持选择sku规格，规格可带显示备注，独立图片
```shell
composer require dmskys/dcat-sku-plus
```

```php

        $skuParams = [
            // 扩展第一列
            [
                'name'    => '会员价', // table 第一行 title
                'field'   => 'member_price', // input 的 field_name 名称
                'default' => 5, // 默认值
            ],
            // 扩展第二列
        ];
        //
        $form->sku('sku', '生成SKU')->init([
			[
				'id'=>1,
				'attr_name'=>'size',
				'attr_type'=>'checkbox',//checkbox|radio
				'attr_value'=>["S","M","L"],
				'sort'=>1,
			],
		    [
			    'id'=>2,
			    'attr_name'=>'color',
			    'attr_type'=>'checkbox',
			    'attr_value'=>["S","M","L"],
			    'sort'=>1,
		    ]
	    ],$skuParams);

```