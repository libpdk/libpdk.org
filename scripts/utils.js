/**
 * get hexo current lang
 */
hexo.extend.helper.register('get_cur_lang', function(){
   return this.config.language || 'default';
});

hexo.extend.helper.register('get_site_data', function(key ,lang){
   let get_cur_lang = hexo.extend.helper.get('get_cur_lang');
   lang = lang || get_cur_lang.call(hexo);
   let data = this.site.data;
   key = lang+"/"+key;
   if (!data.hasOwnProperty(key)) {
      throw new Error("data key : "+key + " is not exist!");
   }
   return data[key];
});
