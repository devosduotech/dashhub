export interface GeocodingResult {
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

export interface WeatherCurrent {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
}

export interface WeatherDay {
  date: string
  tempMax: number
  tempMin: number
  weatherCode: number
}

export interface WeatherForecast {
  location: string
  current: WeatherCurrent
  daily: WeatherDay[]
  timezone: string
}

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return []
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`
  )
  const data = await res.json()
  if (!data.results) return []
  return data.results.map((r: Record<string, unknown>) => ({
    name: r.name as string,
    country: r.country as string,
    admin1: r.admin1 as string | undefined,
    latitude: r.latitude as number,
    longitude: r.longitude as number
  }))
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
  tempUnit: 'celsius' | 'fahrenheit',
  windUnit: 'kmh' | 'mph'
): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_10m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    timezone: 'auto',
    forecast_days: '5',
    temperature_unit: tempUnit,
    wind_speed_unit: windUnit
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  const data = await res.json()
  return {
    location: '',
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_10m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code
    },
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      weatherCode: data.daily.weather_code[i]
    })),
    timezone: data.timezone
  }
}

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Dense freezing drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌦️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Slight rain showers', icon: '🌦️' },
  81: { label: 'Moderate rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers', icon: '⛈️' },
  85: { label: 'Slight snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', icon: '⛈️' }
}

export function weatherCodeToLabel(code: number): string {
  return WMO_CODES[code]?.label ?? 'Unknown'
}

export function weatherCodeToIcon(code: number): string {
  return WMO_CODES[code]?.icon ?? '❓'
}

export function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}
