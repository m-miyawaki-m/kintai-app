import { ref } from 'vue'
import { reverseGeocode } from '@/services/geocoding'
import type { GeolocationState } from '@/types'

export function useGeolocation() {
  const state = ref<GeolocationState>({
    loading: false,
    error: null,
    position: null,
    address: null
  })

  async function getCurrentPosition(): Promise<GeolocationState> {
    state.value.loading = true
    state.value.error = null

    try {
      if (!navigator.geolocation) {
        throw new Error('お使いのブラウザは位置情報に対応していません')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords
      state.value.position = { latitude, longitude }

      // Reverse geocode to get address
      const address = await reverseGeocode(latitude, longitude)
      state.value.address = address

      return state.value
    } catch (error: any) {
      if (error.code === 1) {
        state.value.error = '位置情報へのアクセスが拒否されました'
      } else if (error.code === 2) {
        state.value.error = '位置情報を取得できませんでした'
      } else if (error.code === 3) {
        state.value.error = '位置情報の取得がタイムアウトしました'
      } else {
        state.value.error = error.message || '位置情報の取得に失敗しました'
      }
      throw error
    } finally {
      state.value.loading = false
    }
  }

  function reset() {
    state.value = {
      loading: false,
      error: null,
      position: null,
      address: null
    }
  }

  return {
    state,
    getCurrentPosition,
    reset
  }
}
