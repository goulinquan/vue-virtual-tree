<template>
  <div class="vc-tree">
    <div
      class="vc-tree-container"
      @wheel="rootScrolled"
      :style="`height: ${typeof height === 'number' ? height + 'px' : height}`"
      ref="vc-tree-container"
    >
      <div class="vc-tree-holder" :style="`height: ${containerHeight}px`">
        <div
          class="vc-tree-content"
          :style="`transform: translateY(${startIdx * itemHeight}px)`"
        >
          <div
            v-for="item in renderedItems"
            :key="item.key"
            class="vc-tree-node"
            :style="`padding-left: ${item.deep * 24}px`"
          >
            <span
              class="vc-tree-node-collapse"
              v-if="item.isPNode"
              @click="expendNode(item.key)"
            >
              <svg
                viewBox="0 0 1024 1024"
                focusable="false"
                :class="
                  !_expendedKeys.includes(item.key)
                    ? 'vc-tree-node__collapsed'
                    : ''
                "
                data-icon="caret-down"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"
                ></path>
              </svg>
            </span>
            <span
              v-else
              class="vc-tree-node-collapse"
              style="cursor: default"
            />
            <span
              :class="
                `vc-tree-node-checkbox ${
                  _checkedKeys.includes(item.key) ? 'vc-tree-node__checked' : ''
                }`
              "
              @click="checkItem(item)"
            >
              <span
                class="vc-tree-node__halfChecked"
                v-if="onHalfCheckedKeys.includes(item.key)"
              ></span>
              <svg
                v-if="_checkedKeys.includes(item.key)"
                class="icon"
                style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="2502"
              >
                <path
                  d="M376.123077 836.923077L51.2 510.030769c-11.815385-11.815385-11.815385-31.507692 0-43.323077l43.323077-43.323077c11.815385-11.815385 31.507692-11.815385 43.323077 0L382.030769 669.538462c7.876923 7.876923 21.661538 7.876923 29.538462 0L890.092308 187.076923c11.815385-11.815385 31.507692-11.815385 43.323077 0l43.323077 43.323077c11.815385 11.815385 11.815385 31.507692 0 43.323077L419.446154 836.923077c-11.815385 13.784615-31.507692 13.784615-43.323077 0z"
                  p-id="2503"
                ></path>
              </svg>
            </span>
            <span
              v-if="onClicked && item.selectable !== false"
              class="vc-tree-node-title vc-tree-node-selectable"
              @click="onClicked([item.key])"
              >{{ item.title }}</span
            >
            <span v-else>{{ item.title }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="thumbnailHeight"
      class="vc-tree-thumbnail"
      :style="
        `height: ${thumbnailHeight}px; transform: translateY(${thumbnailPos}px);`
      "
    ></div>
  </div>
</template>
<script>
import throttle from "lodash/throttle";
let tree = {
  data: [],
  list: []
};
export default {
  name: "vc-tree",
  model: {
    prop: "checkedKeys",
    event: "check"
  },
  props: {
    checkedKeys: Array,
    onClicked: Function,
    height: { type: [String, Number], default: 400 },
    expandAllParents: Boolean,
    expendedKeys: Array,
    defaultExpendedKeys: {
      type: Array,
      default: function() {
        return [];
      }
    },
    // checkededKeys: Array,
    defaultCheckedKeys: {
      type: Array,
      default: function() {
        return [];
      }
    }
  },
  data() {
    return {
      startIdx: 0,
      endIdx: 0,
      itemHeight: 32,
      itemPerPage: 0,
      triggerRender: 0, // 用来触发获取列表
      renderList: [],
      onExpendedKeys: [], // 展开的key
      onCheckedKeys: [], // 选中的key
      onHalfCheckedKeys: [],
      clientHeight: 0,
      thumbnailPos: 0
    };
  },
  computed: {
    _expendedKeys() {
      return this.expendedKeys || this.onExpendedKeys;
    },
    _checkedKeys() {
      return this.checkedKeys || this.onCheckedKeys;
    },
    unHiddenList() {
      return this.triggerRender ? tree.list.filter(item => !item.isHidden) : [];
    },
    // 需要渲染得列表
    renderedItems() {
      return this.unHiddenList.slice(this.startIdx, this.endIdx);
    },
    // 总高度
    containerHeight() {
      return this.itemHeight * this.unHiddenList.length;
    },
    // 滚动块长度
    thumbnailHeight() {
      const height = Math.round(
        (this.clientHeight / this.containerHeight) * this.clientHeight
      );
      return this.containerHeight <= this.clientHeight
        ? 0
        : height > 16
        ? height
        : 16;
    }
  },
  created() {
    this.onExpendedKeys = [...this.defaultExpendedKeys];
    this.onCheckedKeys = [...this.defaultCheckedKeys];

    this.renderHalfChecked();
  },
  mounted() {
    this.clientHeight = this.$refs["vc-tree-container"].clientHeight;

    this.itemPerPage = Math.floor(this.clientHeight / 32 + 2);

    this.endIdx = this.itemPerPage;
  },
  methods: {
    setData(data) {
      tree.data = data;
      tree.list = this.flatData(data, 0, "0");

      this.triggerRender = this.triggerRender + 1;

      this.onHalfCheckedKeys = [];
      this.$nextTick(() => {
        this.listHeightChanged();

        if (this.checkedKeys) {
          this.onCheckedKeys = this.checkedKeys;
        }
        this.onHalfCheckedKeys = this.renderHalfChecked();
      });
    },

    /**
     * 拉平树数据
     * @param {arry} data 数据
     * @param {number} deep 层级
     * @param {string} pId 父级key
     * @return {arry}数组
     */
    flatData(data, deep, pId) {
      let result = [];

      data.forEach(value => {
        let items = [];

        if (value.children && value.children.length > 0) {
          if (this.expandAllParents) {
            this.onExpendedKeys.push(value.key);
          }
          value.isPNode = true;
          items = this.flatData(value.children, deep + 1, value.key);
        }

        delete value.children;

        items = [
          {
            ...value,
            deep,
            pId: pId + "",
            isHidden: this.expandAllParents ? false : pId !== "0"
          }
        ].concat(items);

        result = result.concat(items);
      });

      return result;
    },

    rootScrolled: throttle(function(event) {
      if (this.containerHeight <= this.clientHeight) {
        this.$refs["vc-tree-container"].scrollTop = 0;
        this.startIdx = 0;
        this.endIdx = this.itemPerPage;
        return;
      }
      let newScrollTop =
        this.$refs["vc-tree-container"].scrollTop + event.deltaY;

      if (newScrollTop < 0) {
        newScrollTop = 0;
      } else if (newScrollTop > this.containerHeight - this.clientHeight) {
        newScrollTop = this.containerHeight - this.clientHeight;
      }

      this.$refs["vc-tree-container"].scrollTop = newScrollTop;

      let startIdx =
        newScrollTop > 0 ? Math.floor(newScrollTop / this.itemHeight) : 0;

      if (startIdx + this.itemPerPage > this.unHiddenList.length) {
        startIdx = this.unHiddenList.length - this.itemPerPage;
      }

      this.startIdx = startIdx;
      this.endIdx = startIdx + this.itemPerPage;

      this.thumbnailPos = Math.round(
        (newScrollTop / (this.containerHeight - this.clientHeight)) *
          (this.clientHeight - this.thumbnailHeight)
      );
    }, 50),

    expendNode(key) {
      if (this._expendedKeys.includes(key)) {
        this.onExpendedKeys = this._expendedKeys.filter(val => val !== key);
      } else {
        this.onExpendedKeys.push(key);
      }

      this.hideItem();
    },

    hideItem() {
      const isHiddenPId = [];

      tree.list.forEach(item => {
        if (
          item.pId !== "0" &&
          (!this._expendedKeys.includes(item.pId) ||
            isHiddenPId.includes(item.pId))
        ) {
          isHiddenPId.push(item.key);
          item.isHidden = true;
        } else {
          item.isHidden = false;
        }
      });

      this.triggerRender = this.triggerRender + 1;

      this.$nextTick(() => {
        this.listHeightChanged();
      });
    },

    checkItem({ key, pId }) {
      let keys = [key];

      tree.list.forEach(item => {
        if (keys.includes(item.pId)) {
          keys.push(item.key);
        }
      });

      if (this.onCheckedKeys.includes(key)) {
        this.onCheckedKeys = this.onCheckedKeys.filter(
          val => !keys.includes(val)
        );
      } else {
        this.onCheckedKeys.push(...keys);
      }

      this.isParentChecked(pId);

      this.$emit("check", this.onCheckedKeys);
    },

    isParentChecked(pId) {
      let allChildChecked = true;
      let noChildChecked = true;
      let pPId; // 父级的父级

      tree.list.forEach(item => {
        if (item.pId === pId && !this.onCheckedKeys.includes(item.key)) {
          allChildChecked = false;
        }

        if (
          item.pId === pId &&
          (this.onCheckedKeys.includes(item.key) ||
            this.onHalfCheckedKeys.includes(item.key))
        ) {
          noChildChecked = false;
        }

        if (item.key === pId) {
          pPId = item.pId;
        }
      });

      // 只有发生变化时才需要判断父级是否发生变化
      if (noChildChecked) {
        if (this.onCheckedKeys.includes(pId)) {
          this.onCheckedKeys = this.onCheckedKeys.filter(key => key !== pId);

          this.isParentChecked(pPId);
        } else if (this.onHalfCheckedKeys.includes(pId)) {
          this.onHalfCheckedKeys = this.onHalfCheckedKeys.filter(
            key => key !== pId
          );

          this.isParentChecked(pPId);
        }
      } else if (allChildChecked) {
        if (!this.onCheckedKeys.includes(pId)) {
          this.onHalfCheckedKeys = this.onHalfCheckedKeys.filter(
            key => key !== pId
          );

          this.onCheckedKeys.push(pId);

          this.isParentChecked(pPId);
        }
      } else {
        if (!this.onHalfCheckedKeys.includes(pId)) {
          this.onCheckedKeys = this.onCheckedKeys.filter(key => key !== pId);
          this.onHalfCheckedKeys.push(pId);

          this.isParentChecked(pPId);
        }
      }
    },

    renderHalfChecked() {
      const halfCheckedKeys = [];

      const pushPIdToHalfChecked = node => {
        if (
          this._checkedKeys.includes(node.key) &&
          node.pId !== "0" &&
          !halfCheckedKeys.includes(node.pId)
        ) {
          halfCheckedKeys.push(node.pId);

          const PNode = tree.list.find(node => node.key === node.pId);
          pushPIdToHalfChecked(PNode);
        }
      };

      tree.list.forEach(node => {
        pushPIdToHalfChecked(node);
      });

      return halfCheckedKeys;
    },

    listHeightChanged() {
      const vcCon = this.$refs["vc-tree-container"];

      if (this.containerHeight <= this.clientHeight) {
        this.startIdx = 0;
        this.endIdx = this.itemPerPage;
        this.$refs["vc-tree-container"].scrollTop = 0;
      } else if (vcCon.scrollTop >= this.containerHeight - this.clientHeight) {
        this.startIdx = this.unHiddenList.length - this.itemPerPage;
        this.endIdx = this.unHiddenList.length;
        this.$refs["vc-tree-container"].scrollTop =
          this.containerHeight - this.clientHeight;
      }
    }
  }
};
</script>
<style lang="less" scoped src="./tree.less"></style>
