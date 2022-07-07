<?php

use Dcat\Admin\Extension\DcatSkuPlus\Http\Controllers;
use Illuminate\Support\Facades\Route;

// 图片上传
Route::post('sku-image-upload', [Controllers\UploadController::class, 'store']);
Route::post('sku-image-remove', [Controllers\UploadController::class, 'delete']);
