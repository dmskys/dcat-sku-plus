<?php

namespace Dcat\Admin\Extension\DcatSkuPlus;

use App\Models\Goods\SkuAttribute;
use Dcat\Admin\Admin;
use Dcat\Admin\Form\Field;

class SkuField extends Field
{
	protected $view = 'dcat-sku-plus::index';
	
	public function render()
	{
		Admin::js('vendor/dcat-admin-extensions/dmskys/dcat-sku-plus/js/index.js');
		Admin::css('vendor/dcat-admin-extensions/dmskys/dcat-sku-plus/css/index.css');
		
		$uploadUrl = DcatSkuPlusServiceProvider::setting('sku_plus_img_upload_url') ?: '/admin/sku-image-upload';
		$deleteUrl = DcatSkuPlusServiceProvider::setting('sku_plus_img_remove_url') ?: '/admin/sku-image-remove';
		
		$this->script = <<< EOF
        window.DemoSku = new JadeKunSKU('{$this->getElementClassSelector()}');
EOF;
		$this->addVariables(compact( 'uploadUrl', 'deleteUrl'));
		
		//没有设置给空
		if(!key_exists('skuAttributes',$this->variables())){
			$this->initSkuAttributes([]);
		}
		
		return parent::render();
	}
	
	/**
	 * 初始化
	 * @param  array  $skuAttributes
	 * @param  array  $column
	 * @return $this
	 */
	public function init(array $skuAttributes = [],array $column = []): self
	{
		//数据格式
//	    $skuAttributes = [
//			[
//				'id'=>1,
//				'attr_name'=>'size',
//				'attr_type'=>'checkbox',//checkbox|radio
//				'attr_value'=>["S","M","L"],
//				'sort'=>1,
//			],
//		    [
//			    'id'=>2,
//			    'attr_name'=>'color',
//			    'attr_type'=>'checkbox',
//			    'attr_value'=>["S","M","L"],
//			    'sort'=>1,
//		    ]
//	    ];
		
		$this->addVariables(['skuAttributes' => $skuAttributes]);
		$this->addVariables(['extra_column' => json_encode($column)]);
		
		return $this;
	}
}
