/**
 * some useful function for api docs build
 */
const path = require('path');

function get_root_dir()
{
   return path.normalize(__dirname+"/..");
}

function get_temp_dir()
{
   return get_root_dir()+"/temp";
}

hexo.extend.helper.register("get_root_dir", get_root_dir);

hexo.extend.helper.register("get_temp_dir", get_temp_dir);

hexo.extend.helper.register("get_php_apidoc_saved_dir",function get_php_apidoc_saved_dir()
{
   return get_root_dir() + "/public/apidocs/php";
});

