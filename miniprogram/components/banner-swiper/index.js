Component({
  properties: {
    list: { type: Array, value: [] },
    autoplay: { type: Boolean, value: true },
  },
  methods: {
    onChange(e) {
      this.triggerEvent('change', { current: e.detail.current })
    },
    onTapItem(e) {
      const { link } = e.currentTarget.dataset
      this.triggerEvent('navigate', { link })
    },
  },
})
