#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const {
    URL
} = require('url');
var arguments = process.argv.splice(2);
// console.log('所传递的参数是:', arguments);
const root = arguments[0] ? arguments[0] : './',
    exts = ['.jpg', '.png'],
    max = 5200000; // 5MB == 5242848.754299136
const options = {
    method: 'POST',
    hostname: 'tinypng.com',
    path: '/web/shrink',
    headers: {
        rejectUnauthorized: false,
        'Postman-Token': Date.now(),
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
};
// fileList(root);
// console.log(process.argv.slice(2))
// console.log(process.argv.splice(2))

// 获取文件列表
function fileList(folder) {
    console.log(folder)
    //  if(folder === '-v'){
    //     console.log('version is 1.0.0');
    // }else if(folder === '-h'){
    //     console.log('Useage:');
    //     console.log('dao-tinypng [path]');
    // }else{
        fs.readdir(folder, (err, files) => {
            // if (err) console.error(err);
            if (err){console.error('\n输入参数错误！ 正确格式：dao-tinypng [path]');return;}
            files.forEach(file => {
                fileFilter(folder + file);
            });
        });
    // }
}
// 过滤文件格式，返回所有jpg,png图片
function fileFilter(file) {
    fs.stat(file, (err, stats) => {
        if (err) return console.error(err);
        if (
            // 必须是文件，小于5MB，后缀 jpg||png
            stats.size <= max && stats.isFile() && exts.includes(path.extname(file))) {
            fileUpload(file); // console.log('可以压缩：' + file);
        }
        if (stats.isDirectory()) fileList(file + '/');
    });
}
// 异步API,压缩图片
function fileUpload(img) {
    var req = https.request(options, function(res) {
        res.on('data', buf => {
            // console.log(buf)
            let obj = JSON.parse(buf.toString());
            if (obj.error) {
                console.log(`[${img}]：压缩失败！报错：${obj.message}`);
            } else {
                fileUpdate(img, obj);
            }
        });
    });
    req.write(fs.readFileSync(img), 'binary');
    req.on('error', e => {
        console.error(e);
    });
    req.end();
}
// 该方法被循环调用,请求图片数据
function fileUpdate(imgpath, obj) {
    let options = new URL(obj.output.url);
    let req = https.request(options, res => {
        let body = '';
        res.setEncoding('binary');
        res.on('data', function(data) {
            body += data;
        });
        res.on('end', function() {
            fs.writeFile(imgpath, body, 'binary', err => {
                if (err) return console.error(err);
                console.log(`\n资源名称：[${imgpath}]\n压缩成功，原始大小:${obj.input.size/1000}kb，压缩后大小:${
            obj.output.size/1000
          }kb，优化比例:${(1-obj.output.ratio).toFixed(2)*100}%`);
            });
        });
    });
    req.on('error', e => {
        console.error(e);
    });
    req.end();
}
//获取除第一个命令以后的参数，使用空格拆分
// fileList(process.argv.slice(2)); 
// fileList(process.argv.splice(2)[0] ? process.argv.splice(2)[0] : './');
fileList(root);