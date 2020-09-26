# vc-tree

支持海量数据的虚拟滚动树组件

This project is a virtual scroll tree component for [Vue.js](http://vuejs.org)
#
## Install

```
$ npm install vc-tree --save
```

#
## Usage

### main.js
```
import VcTree from "vc-tree";
import "vc-tree/lib/VcTree/tree.less";
Vue.use(VcTree);
```

### Customize color

```
// less vars
@background-color-base: hsv(0, 0, 96%);
@primary-color: #ff9800; // 全局主色
@border-color-base: #d9d9d9; // 边框色
@heading-color: rgba(0, 0, 0, 0.85); // 标题色
@disabled-color: rgba(0, 0, 0, 0.25); // 失效色
@disabled-bg: @background-color-base; // 失效背景色

// vue.config.js
module.exports = {
  ...
  css: {
    loaderOptions: {
      less: {
        modifyVars: {
          "primary-color": "#1890ff",
           ...
        },
        javascriptEnabled: true
      }
    }
  }
  ...
};
```

### Tree node example

```
[
  {
    key: "1",
    title: "1",
    children: [
      {
        key: "1-1",
        title: "1-1",
        children: [
          { 
            key: 21001, 
            title: "辽CME870", 
            disabled: true // 禁用选框,单击事件
          }
        ],
        selectable: false // 禁止单击title事件
      }
  }
]
```

#
## Props

|参数|说明|类型|默认值|
|:----|:----|:----|:----|
|checkedKeys(v-model)|完全控制被选的节点|Array|-|
|checkStrictly|父子节点取消关联|Boolean|false|
|defaultCheckedKeys|默认选中的节点 (当设置 checkedKeys 时此设置无效)|Array|[]|
|defaultExpandedKeys|默认展开的父节点(当设置 expandedKeys 时此设置无效)|Array|[]|
|expandAllParents|默认展开全部父节点|Boolean|false|
|expandedKeys|完全控制展开的父节点|Array|-|
|filterKey|筛选节点, 只显示包含此关键字的节点|String,Number|-|
|filterTreeNode|筛选节点函数, 返回值为true的时候展示节点|(node) => Boolean|() => true|
|height|容器的高度|Number,String|400|


## Methods
|名称|说明|参数|返回值|
|:----|:----|:----|:----|
|setData|设置树的数据 |data \[Array\]|-|
|reset|手动更新生成树|-|-|

#### 调用方法: 
1. 设置组件ref
2. this.$ref[refName].setData(treeData);
