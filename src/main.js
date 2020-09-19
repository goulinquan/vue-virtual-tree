import Vue from 'vue'
import App from './App.vue'

import VcTree from "../lib/VcTree/index";
Vue.use(VcTree);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
