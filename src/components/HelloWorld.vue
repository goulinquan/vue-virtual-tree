<template>
  <div class="hello">
    <vc-tree ref="vc-tree"></vc-tree>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String
  },
  mounted() {
    this.$refs["vc-tree"].setData([
      {
        key: "111",
        title: "0",
        children: [
          {
            key: "1",
            title: "1",
            children: [
              { key: "43", title: "43" },
              {
                key: "2",
                title: "2",
                children: [
                  { key: "3", title: "3" },
                  { key: "4", title: "4" },
                  { key: "5", title: "5" },
                  { key: "6", title: "6" },
                  { key: "7", title: "7" },
                  { key: "17", title: "4" },
                  { key: "15", title: "5" },
                  { key: "16", title: "6" },
                  { key: "27", title: "7" },
                  { key: "24", title: "4" },
                  { key: "25", title: "5" },
                  { key: "36", title: "6" },
                  { key: "37", title: "7" }
                ]
              },
              { key: "8", title: "8" }
            ]
          }
        ]
      }
    ]);
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
