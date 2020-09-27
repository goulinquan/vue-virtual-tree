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
          :style="`transform: translateY(${startIdx * nodeHeight}px)`"
        >
          <div
            v-for="(node, index) in renderedNodes"
            :key="node.key"
            :class="
              `vc-tree-node ${node.disabled ? 'vc-tree-node__disabled' : ''}`
            "
            :style="`padding-left: ${node.path.length * 24}px`"
          >
            <span
              class="vc-tree-node-collapse"
              v-if="node.isPNode"
              @click="expandNode(node.key)"
            >
              <svg
                viewBox="0 0 1024 1024"
                focusable="false"
                :class="node.expand ? '' : 'vc-tree-node__collapsed'"
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
                  node.checked ? 'vc-tree-node__checked' : ''
                }`
              "
              @click="checkNode(node, index)"
            >
              <span
                class="vc-tree-node__halfChecked"
                v-if="node.halfChecked"
              ></span>
              <svg
                v-if="node.checked"
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
              v-if="node.selectable !== false"
              class="vc-tree-node-title vc-tree-node-selectable"
              @click="titleClicked([node.key])"
              >{{ node.title }}</span
            >
            <span v-else>{{ node.title }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="thumbnailHeight"
      :class="`vc-tree-thumbnail ${onDrag}`"
      :style="
        `height: ${thumbnailHeight}px; transform: translateY(${thumbnailPos}px);`
      "
      @mousedown="dragNail"
    ></div>
  </div>
</template>
<script>
import _ from "lodash";

export default {
  name: "vc-tree",
  model: {
    prop: "checkedKeys",
    event: "check"
  },
  props: {
    checkedKeys: Array,
    checkStrictly: Boolean, // 父子节点完全关联
    defaultCheckedKeys: {
      type: Array,
      default: function() {
        return [];
      }
    },
    defaultExpandedKeys: {
      type: Array,
      default: function() {
        return [];
      }
    },
    expandAllParents: Boolean,
    expandedKeys: Array,
    filterKey: [String, Number], // 搜索的关键词
    filterTreeNode: {
      type: Function,
      default: function() {
        return true;
      }
    }, // 节点筛选函数, node => Boolean
    height: { type: [String, Number], default: 400 }
  },
  data() {
    this.tree = {
      data: [],
      list: []
    };
    this.onCheckedKeys = new Set([]);
    this.onHalfCheckedKeys = new Set([]);
    this.onExpandedKeys = new Set([]);

    this.startPos = 0;
    return {
      startIdx: 0,
      endIdx: 0,
      nodeHeight: 32,
      nodePerPage: 0,
      triggerRender: 0, // 用来触发获取列表
      clientHeight: 0,
      thumbnailPos: 0,
      onDrag: ""
    };
  },
  computed: {
    _expandedKeys() {
      return this.expandedKeys || Array.from(this.onExpandedKeys);
    },
    _checkedKeys() {
      return this.checkedKeys || Array.from(this.onCheckedKeys);
    },
    unHiddenList() {
      return this.triggerRender
        ? this.tree.list.filter(node => !node.isHidden)
        : [];
    },
    // 需要渲染得列表
    renderedNodes() {
      return this.unHiddenList.slice(this.startIdx, this.endIdx);
    },
    // 总高度
    containerHeight() {
      return this.nodeHeight * this.unHiddenList.length;
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
  watch: {
    checkedKeys: function(newVal) {
      if (_.isEqual(newVal, Array.from(this.onCheckedKeys))) return;
      this.renderCheckedNodes();
    },
    filterKey: function() {
      this.update();
    }
  },
  created() {
    this.onExpandedKeys = new Set(this.defaultExpandedKeys);
    this.onCheckedKeys = new Set(this.defaultCheckedKeys);
    this.onHalfCheckedKeys = new Set([]);
  },
  mounted() {
    this.clientHeight = this.$refs["vc-tree-container"].clientHeight;

    this.nodePerPage = Math.floor(this.clientHeight / 32 + 2);

    this.endIdx = this.nodePerPage;
  },
  methods: {
    update() {
      this.setData(this.tree.data);
    },
    setData(data) {
      this.tree.data = data;
      this.tree.list = [];
      this.flatData(data);

      this.triggerRender = this.triggerRender + 1;

      this.$nextTick(() => {
        this.listHeightChanged();
      });
    },

    flatData(data) {
      const newCheckedKeys = new Set(this._checkedKeys);
      const PNodes = {}; // 集合,父节点判断是否为全选或半选

      const cb = node => {
        node.checked = newCheckedKeys.has(node.key);

        const pid = node.path[node.path.length - 1];

        if (!node.checked && newCheckedKeys.has(pid)) {
          newCheckedKeys.add(node.key);
          node.checked = true;
        }

        if (node.isPNode) {
          PNodes[node.key] = {
            index: this.tree.list.length,
            checked: new Set()
          };

          node.expand =
            this.expandAllParents || this._expandedKeys.includes(node.key);

          if (node.expand) {
            this.onExpandedKeys.add(node.key);
          }
        } else {
          node.path.forEach(key => {
            PNodes[key].checked.add(node.checked);
          });
        }

        this.tree.list.push({ ...node, children: [] });
      };

      this.depthFirstEach(data, [], cb, this.filterKey, this.filterTreeNode);

      this.setParentsState(PNodes);
    },

    setParentsState(PNodes) {
      if (this.checkStrictly) return;

      Object.values(PNodes).forEach(pnode => {
        const node = this.tree.list[pnode.index];

        this.changeChecked(
          node,
          pnode.checked.has(true) && !pnode.checked.has(false)
        );
        if (pnode.checked.has(true) && pnode.checked.has(false)) {
          this.addHalfCheck(node);
        }
      });
    },

    depthFirstEach(tree, path, cb, filterKey, filter) {
      if (!Array.isArray(tree) || !tree.length) return;

      for (let node of tree) {
        if (filterKey && !node.title.includes(filterKey)) continue;
        if (filter && !filter(node)) continue;

        let isPNode = node.children && node.children.length > 0;

        const newNode = { ...node, path, isPNode };

        cb(newNode);

        if (isPNode) {
          this.depthFirstEach(
            node.children,
            [...path, node.key],
            cb,
            filterKey,
            filter
          );
        }
      }
    },

    rootScrolled: function(event) {
      if (this.containerHeight <= this.clientHeight) {
        this.$refs["vc-tree-container"].scrollTop = 0;
        this.startIdx = 0;
        this.endIdx = this.nodePerPage;
        return;
      }
      let newScrollTop =
        this.$refs["vc-tree-container"].scrollTop + event.deltaY;

      if (newScrollTop < 0) {
        newScrollTop = 0;
      } else if (newScrollTop > this.containerHeight - this.clientHeight) {
        newScrollTop = this.containerHeight - this.clientHeight;
      }

      this.thumbnailPos = Math.round(
        (newScrollTop / (this.containerHeight - this.clientHeight)) *
          (this.clientHeight - this.thumbnailHeight)
      );

      this.changeScrollTop(newScrollTop);
    },

    changeScrollTop: _.throttle(function(newScrollTop) {
      this.$refs["vc-tree-container"].scrollTop = newScrollTop;

      let startIdx =
        newScrollTop > 0 ? Math.floor(newScrollTop / this.nodeHeight) : 0;

      if (startIdx + this.nodePerPage > this.unHiddenList.length) {
        startIdx = this.unHiddenList.length - this.nodePerPage;
      }

      this.startIdx = startIdx;
      this.endIdx = startIdx + this.nodePerPage;
    }, 50),

    expandNode(key) {
      const idx = this.tree.list.findIndex(node => node.key === key);
      const node = this.tree.list[idx];

      node.expand = !node.expand;

      if (node.expand) {
        this.onExpandedKeys.add(node.key);
      } else {
        this.onExpandedKeys.delete(node.key);
      }

      this.toggleChildren(idx, node);

      if (this.$listeners.expand) {
        this.$emit("expand", [
          Array.from(this.onExpandedKeys),
          { expanded: node.expand, node }
        ]);
      }

      this.triggerRender = this.triggerRender + 1;

      this.$nextTick(() => {
        this.listHeightChanged();
      });
    },

    toggleChildren(idx, pNode) {
      for (let i = idx + 1; i < this.tree.list.length; i++) {
        const node = this.tree.list[i];
        if (!node.path.includes(pNode.key)) break;

        let isHidden = false;
        node.path.forEach(key => {
          if (!this.onExpandedKeys.has(key)) {
            isHidden = true;
          }
        });
        node.isHidden = isHidden;
      }
    },

    checkNode(node, index) {
      this.changeChecked(node, !node.checked);

      this.toggleChildrenCheck(node.key, node.checked, index);

      if (!this.checkStrictly) {
        for (let i = node.path.length; i > 0; i--) {
          this.isParentChecked(node.path[i - 1]);
        }
      }

      if (this.$listeners.check) {
        this.$emit("check", Array.from(this.onCheckedKeys), {
          checked: !node.checked,
          node,
          halfChecked: this.checkStrictly
            ? Array.from(this.onHalfCheckedKeys)
            : null
        });
      }

      this.triggerRender = this.triggerRender + 1;
    },

    toggleChildrenCheck(key, checked, index) {
      if (this.checkStrictly) return;

      for (let i = index + 1; i < this.tree.list.length; i++) {
        const node = this.tree.list[i];
        if (!node.path.includes(key)) break;

        this.changeChecked(node, checked);
      }
    },

    changeChecked(node, checked) {
      node.checked = checked;
      node.halfChecked = false;

      if (node.checked) {
        this.onCheckedKeys.add(node.key);
        this.onHalfCheckedKeys.delete(node.key);
      } else {
        this.onCheckedKeys.delete(node.key);
        this.onHalfCheckedKeys.delete(node.key);
      }
    },

    addHalfCheck(node) {
      node.checked = false;
      node.halfChecked = true;

      this.onCheckedKeys.delete(node.key);
      this.onHalfCheckedKeys.add(node.key);
    },

    isParentChecked(key) {
      let allChildChecked = true;
      let noChildChecked = true;

      const list = this.tree.list;
      const pNode = list.findIndex(val => val.key === key);
      for (let i = pNode + 1; i < list.length; i++) {
        if (!list[i].path.includes(key)) break;

        if (list[i].checked) {
          noChildChecked = false;
        } else {
          allChildChecked = false;
        }
      }

      this.changeChecked(list[pNode], allChildChecked);

      if (!allChildChecked && !noChildChecked) {
        this.addHalfCheck(list[pNode]);
      }
    },

    // 完全控制时,选中的key被改变,且和当前状态不一致
    renderCheckedNodes() {
      this.onCheckedKeys = new Set(this.checkedKeys);
      const PNodes = {}; // 集合,父节点判断是否为全选或半选

      this.tree.list.forEach((node, index) => {
        const pid = node.path[node.path.length - 1];

        node.checked = this.onCheckedKeys.has(node.key);

        if (this.onCheckedKeys.has(pid)) {
          node.checked = true;
          this.onCheckedKeys.add(node.key);
        }

        if (node.isPNode) {
          PNodes[node.key] = {
            index: index,
            checked: new Set()
          };
        } else {
          node.path.forEach(key => {
            PNodes[key].checked.add(node.checked);
          });
        }
      });

      this.setParentsState(PNodes);

      this.triggerRender = this.triggerRender + 1;
    },

    listHeightChanged() {
      const vcCon = this.$refs["vc-tree-container"];

      if (this.containerHeight <= this.clientHeight) {
        this.startIdx = 0;
        this.endIdx = this.nodePerPage;
        this.$refs["vc-tree-container"].scrollTop = 0;
      } else if (vcCon.scrollTop >= this.containerHeight - this.clientHeight) {
        this.startIdx = this.unHiddenList.length - this.nodePerPage;
        this.endIdx = this.unHiddenList.length;
        this.$refs["vc-tree-container"].scrollTop =
          this.containerHeight - this.clientHeight;
      }
    },

    dragNail(event) {
      this.startPos = event.pageY;
      window.addEventListener("mousemove", this.dragNailMove);
      window.addEventListener("mouseup", this.dragNailEnd);
      this.onDrag = "vc-tree-thumbnail__ondrag";
    },

    dragNailMove(event) {
      event.preventDefault();
      let newThumbnailPos = this.thumbnailPos + event.pageY - this.startPos;

      if (newThumbnailPos < 0) {
        newThumbnailPos = 0;
      } else if (newThumbnailPos > this.clientHeight - this.thumbnailHeight) {
        newThumbnailPos = this.clientHeight - this.thumbnailHeight;
      }
      const scrollTop =
        (newThumbnailPos / (this.clientHeight - this.thumbnailHeight)) *
        this.containerHeight;

      this.changeScrollTop(scrollTop);

      this.startPos = event.pageY;
      this.thumbnailPos = newThumbnailPos;
    },

    dragNailEnd() {
      window.removeEventListener("mousemove", this.dragNailMove);
      window.removeEventListener("mouseup", this.dragNailEnd);
      this.onDrag = "";
    },

    titleClicked(node) {
      if (this.$listeners.select) {
        this.$emit("select", [node.key, node]);
      }
    }
  }
};
</script>
<style lang="less" scoped src="./tree.less"></style>
