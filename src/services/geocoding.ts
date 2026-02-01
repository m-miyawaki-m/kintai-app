const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

interface NominatimResponse {
  display_name: string
  address: {
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
    postcode?: string
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'ja',
          'User-Agent': 'KintaiApp/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data: NominatimResponse = await response.json()

    // Build a readable Japanese address
    const address = data.address
    const parts: string[] = []

    if (address.state) parts.push(address.state)
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village || '')
    }
    if (address.suburb) parts.push(address.suburb)
    if (address.road) parts.push(address.road)

    return parts.length > 0 ? parts.join(' ') : data.display_name
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  }
}
