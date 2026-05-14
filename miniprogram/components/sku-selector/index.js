const spec = require('../../utils/specConfig.js')

const DEF = spec.DEFAULT_SEL

Component({
  options: { multipleSlots: false },
  properties: {
    product: { type: Object, value: {} },
    show: { type: Boolean, value: false },
    theme: { type: String, value: 'light' },
  },
  data: {
    _render: false,
    _open: false,
    sel: { ...DEF },
    groupsView: [],
    qty: 1,
    total: 0,
    totalText: '0.00',
    lineTotalText: '0.00',
  },
  observers: {
    show(s) {
      if (s) {
        this.setData({ _render: true })
        setTimeout(() => this.setData({ _open: true }), 30)
        this._resetAndSync()
      } else {
        this.setData({ _open: false })
        setTimeout(() => this.setData({ _render: false }), 320)
      }
    },
    'product.id': function () {
      if (this.data.show) {
        this._resetAndSync()
      }
    },
  },
  methods: {
    _resetAndSync() {
      const p = this.data.product || {}
      const sel = { ...DEF, toppings: [] }
      const groupsView = this._buildGroupsView(p, sel)
      this.setData({ sel, qty: 1, groupsView }, () => {
        this._refreshTotals(sel)
      })
    },
    _buildGroupsView(p, sel) {
      const groups = spec.listGroupsForUI(p)
      return groups.map((g) => ({
        ...g,
        options: g.options.map((o) => ({
          ...o,
          on: g.single
            ? sel[g.key] === o.id
            : (sel.toppings || []).indexOf(o.id) >= 0,
        })),
      }))
    },
    _syncGroups() {
      const p = this.data.product || {}
      const sel = this.data.sel
      this.setData({ groupsView: this._buildGroupsView(p, sel) })
    },
    _refreshTotals(selOverride) {
      const p = this.data.product || {}
      const sel = selOverride || this.data.sel
      const qty = Math.max(
        1,
        Math.min(99, Number(this.data.qty) || 1),
      )
      const unitTotal = spec.totalPrice(p, sel)
      const lineTotal = unitTotal * qty
      this.setData({
        qty,
        total: unitTotal,
        totalText: Number(unitTotal).toFixed(2),
        lineTotalText: Number(lineTotal).toFixed(2),
      })
      this.triggerEvent('change', {
        total: lineTotal,
        unitTotal,
        qty,
        sel: { ...sel },
      })
    },
    onIncQty() {
      const q = Math.min(99, (this.data.qty || 1) + 1)
      this.setData({ qty: q }, () => this._refreshTotals())
    },
    onDecQty() {
      let q = (this.data.qty || 1) - 1
      if (q < 1) q = 1
      this.setData({ qty: q }, () => this._refreshTotals())
    },
    onMaskTap() {
      this.triggerEvent('close')
    },
    stop() {},
    pickSingle(e) {
      const g = e.currentTarget.dataset.g
      const id = e.currentTarget.dataset.id
      if (!g || !id) return
      const sel = { ...this.data.sel, [g]: id }
      this.setData({ sel })
      this._syncGroups()
      this._refreshTotals(sel)
    },
    toggleTopping(e) {
      const id = e.currentTarget.dataset.id
      if (!id) return
      const tops = [...(this.data.sel.toppings || [])]
      const i = tops.indexOf(id)
      if (i >= 0) tops.splice(i, 1)
      else tops.push(id)
      const sel = { ...this.data.sel, toppings: tops }
      this.setData({ sel })
      this._syncGroups()
      this._refreshTotals(sel)
    },
    onAdd() {
      const p = this.data.product || {}
      if (!spec.hasStock(p)) {
        this.triggerEvent('err', { msg: '暂无可售库存' })
        return
      }
      const sel = { ...this.data.sel }
      const price = spec.totalPrice(p, sel)
      const specKey = spec.specKey(p, sel)
      const specText = spec.specLine(p, sel)
      const skuId = spec.inventorySkuId(p)
      this.triggerEvent('add', {
        price,
        qty: this.data.qty || 1,
        specKey,
        specText,
        sel,
        skuId,
      })
    },
  },
})
