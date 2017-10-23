"use strict";
let PathUtils = require("path");
let Clone = require("clone");
let _ = require('lodash');
let toString = Object.prototype.toString;

const { spawnSync } = require('child_process');

hexo.extend.helper.register('manual_key_from_path', function(path){
   return PathUtils.basename(path, ".html");
});

hexo.extend.helper.register('clone', function(source){
   return Clone(source);
});

hexo.extend.helper.register('get_manual_catalog', function(page, config, site){
   let url_for = hexo.extend.helper.get('url_for');
   let clone = hexo.extend.helper.get('clone');
   let manual_key_from_path = hexo.extend.helper.get('manual_key_from_path');
   let targetVersion;
   if ("mainEntry" == page.subtype || "versionEntry" == page.subtype) {
      targetVersion = config.zapi_version;
   } else {
      let pagePath = page.canonical_path;
      let match = pagePath.match(/manual\/([.\d]*)/);
      targetVersion = match[1];
   }
   let versionKey = "manual/v"+targetVersion.replace(/\./g, "");
   let catalog = clone(site.data[versionKey]);
   let key = manual_key_from_path(page.path);
   let baseUrl = "manual/"+targetVersion;

   catalog.forEach(function(category){
      if (category.children && category.children.length != 0) {
         category.children.forEach(function(item){
            if (item.key == key) {
               item.isActive = true;
               category.isOpen = true;
               item.url = url_for.call(hexo, page.canonical_path);
            }
            item.url = url_for.call(hexo,baseUrl + "/"+ category.key + "/" + item.key + ".html");
         });
      }
   });
   if ("mainEntry" == page.subtype || "versionEntry" == page.subtype) {
      catalog.forEach(function(category){
         if (category.key == "prologue") {
            category.isOpen = true;
         }
      });
   }
   return catalog;
});

/**
 * 我在这里提供这个helper是为版本号做准备的, 暂时我们在积极的开发，不提供版本号的api手册
 * 只提供实时的api手册文档
 */
hexo.extend.helper.register('get_api_catalog', function(page, config, site){

   let url_for = hexo.extend.helper.get('url_for');
   let catalog = site.data['api/catalog'];
   let items = [];
   _.forIn(catalog, function(item, key) {
      let ret = {
         name: item.name,
         url: url_for.call(hexo, item.url),
         key: key,
         isActive: false
      };
      if (key == "apimodules") {
         if (page.layout == "apimodulecontent" || page.layout == "apimodules") {
            ret.isActive = true;
         }
      } else if (key == "apinamespaces") {
         if (page.layout == "apinamespacecontent" || page.layout == "apinamespaces" || page.layout == "apiclasscontent") {
            ret.isActive = true;
         }
      } else if (key == "apifiles") {
         if (page.layout == "apifilecontent" || page.layout == "apifiles") {
            ret.isActive = true;
         }
      } else if (key == page.layout) {
         ret.isActive = true;
      }
      items.push(ret);
   });
   return items;
});

hexo.extend.helper.register('get_doxygen_version', function(){
   let ret = spawnSync("doxygen", ["--version"]);
   if (0 != ret.status) {
      throw ret.stderr.toString();
   } else {
      return _.trim(ret.stdout.toString());
   }
});


hexo.extend.helper.register('sort_api_entity_by_name',function(left, right){
   if (left.name < right.name) {
      return -1;
   } else if (left.name == right.name) {
      return 0;
   } else {
      return 1;
   }
});

hexo.extend.helper.register('sort_api_entity_by_path',function(left, right){
   if (left.path < right.path) {
      return -1;
   } else if (left.path == right.path) {
      return 0;
   } else {
      return 1;
   }
});

hexo.extend.helper.register('is_array',function(value)
{
   return toString.call(value) == "[object Array]";
});

hexo.extend.helper.register('is_boolean',function(value)
{
   return typeof value === 'boolean';
});

hexo.extend.helper.register('is_string',function(value)
{
   return typeof value === 'string';
});

hexo.extend.helper.register('is_object',function(value)
{
   return toString.call(value) === '[object Object]';
});

hexo.extend.helper.register('is_object',function(value)
{
   return toString.call(value) === '[object Object]';
});

hexo.extend.helper.register('generate_flat_module_list', function(modules, depth, prefix)
{
   let self = hexo.extend.helper.get('generate_flat_module_list');
   let url_for_api_entity = hexo.extend.helper.get('url_for_api_entity');
   let ret = [];
   ++depth;
   for(let i = 0; i < modules.length; i++) {
      module = modules[i];
      let name =  prefix != "" ? prefix+"/"+module.name: module.name;
      ret.push({
         name: name,
         url: url_for_api_entity(module.refid),
         level: depth
      });
      ret = _.concat(ret, module.modules ? self(module.modules, depth,  name) : []);
   }
   return ret;
});