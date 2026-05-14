Component({
  properties: {
    item: { type: Object, value: {} },
  },
  data: {
    imgLoaded: false,
  },
  observers: {
    'item.cover'() {
      this.setData({ imgLoaded: false })
    },
  },
  methods: {
    onImgLoad() {
      this.setData({ imgLoaded: true })
    },
    onTap() {
      this.triggerEvent('select', { id: this.data.item.id })
    },
  },
})
