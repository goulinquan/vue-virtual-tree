import VcTree from "./tree.vue";

const install = (Vue) => {
  Vue.component(VcTree.name, VcTree);
};

if (typeof window !== "undefined" && window.Vue) {
  install(window.Vue);
}

export default { install, VcTree };
