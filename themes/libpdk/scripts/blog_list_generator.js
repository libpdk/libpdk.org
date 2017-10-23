"use strict";

let pagination = require("hexo-pagination");

hexo.extend.generator.register("bloglist", function(locals){
   let config = this.config;
   let posts = locals.posts.sort("-date");
   let paginationDir = config.pagination_dir || "page";
   return pagination("blog", posts, {
      perPage: config.per_page,
      layout: ["blog"],
      format: paginationDir + "/%d/",
      data: {
         _isBlogList: true
      }
   });
});