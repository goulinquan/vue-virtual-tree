<template>
  <div class="hello">
    <vc-tree
      ref="vc-tree"
      :onClicked="onClicked"
      v-model="checkedKeys"
      :expandAllParents="true"
      style="text-align: left; width: 400px"
      @expand="expand"
    ></vc-tree>
    <button @click="click">haha</button>
    <button @click="change">change</button>
  </div>
</template>

<script>
const data = [
  {
    key: "parent",
    title: "parent",
    children: [
      {
        key: "parent1",
        title: "parent1",
        children: [
          {
            key: "parent3",
            title: "parent3",
            children: [
              { key: 210011, title: "辽CME870" },
              { key: 210021, title: "辽CMD757" },
              { key: 210031, title: "辽CMD706" },
              { key: 210041, title: "辽CMD025" },
              { key: 210051, title: "辽CMD803" },
              { key: 210061, title: "辽CMK006" },
              { key: 210071, title: "辽CMK029" },
              { key: 210081, title: "辽C8919M" },
              { key: 210091, title: "辽C0058B" },
              { key: 210101, title: "辽CD1060" },
              { key: 210111, title: "辽CF0206" },
              { key: 210121, title: "辽C0020A" }
            ],
            selectable: false
          },
          { key: 21001, title: "辽CME870" },
          { key: 21002, title: "辽CMD757" },
          { key: 21003, title: "辽CMD706" },
          { key: 21004, title: "辽CMD025" },
          { key: 21005, title: "辽CMD803" },
          { key: 21006, title: "辽CMK006" },
          { key: 21007, title: "辽CMK029" },
          { key: 21008, title: "辽C8919M" },
          { key: 21009, title: "辽C0058B" }
        ],
        selectable: false
      },

      {
        key: "parent2",
        title: "parent2",
        disabled: true,
        children: [
          {
            key: "parent4",
            title: "parent4",
            children: [],
            selectable: false
          }
        ],
        selectable: false
      }
    ],
    selectable: false
  }
];
export default {
  name: "HelloWorld",
  props: {
    msg: String
  },
  data() {
    return {
      checkedKeys: [],
      filterKey: "p",
      filterTreeNode: node => node.title.includes(this.filterKey)
    };
  },
  mounted() {
    this.$refs["vc-tree"].setData(data);
  },
  methods: {
    change() {
      this.checkedKeys = ["parent3"];
      this.filterKey = "";
      this.$refs["vc-tree"].update();
    },
    expand(msg) {
      console.log(msg);
    },
    onClicked() {
      console.log(1);
    },
    click() {
      console.time();
      let path = data[0].children;
      for (let i = 0; i < 100000; i++) {
        path.push({ key: i, title: "辽C" + i });
      }
      this.$refs["vc-tree"].setData(data);
      console.timeEnd();
    },
    createData() {}
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
