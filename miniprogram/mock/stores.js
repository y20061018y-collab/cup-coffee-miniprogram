/**
 * 门店 + 模拟 LBS 距离排序（固定基准点）
 */
const baseLat = 31.23
const baseLng = 121.47

function mockDistanceKm(lat, lng) {
  const dLat = (lat - baseLat) * 111
  const dLng = (lng - baseLng) * 85
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

const stores = [
  {
    id: 'st1',
    name: '静安 · 久光概念店',
    address: '南京西路 1618 号 B1',
    lat: 31.224,
    lng: 121.445,
    hours: '07:30 - 22:00',
  },
  {
    id: 'st2',
    name: '徐汇 · 武康路手冲站',
    address: '武康路 88 号',
    lat: 31.21,
    lng: 121.44,
    hours: '08:00 - 20:00',
  },
  {
    id: 'st3',
    name: '浦东 · 滨江臻选',
    address: '滨江大道 9 号',
    lat: 31.24,
    lng: 121.5,
    hours: '07:00 - 23:00',
  },
]

function getStoresSorted(userLat, userLng) {
  const lat = typeof userLat === 'number' ? userLat : baseLat
  const lng = typeof userLng === 'number' ? userLng : baseLng
  return stores
    .map((s) => ({
      ...s,
      distanceKm: Number(mockDistanceKm(s.lat, s.lng).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

module.exports = { stores, getStoresSorted, baseLat, baseLng }

/**
 * @typedef {ReturnType<typeof getStoresSorted>[0]} StoreItem
 */
