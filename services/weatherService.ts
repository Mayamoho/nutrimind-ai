interface WeatherData {
  temp: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
}

export async function getWeather(): Promise<WeatherData | null> {
  const WEATHER_API_KEY = (global as any).process?.env?.WEATHER_API_KEY;
  
  if (!WEATHER_API_KEY) {
    console.log('Weather API key not configured, returning null');
    return null;
  }

  try {
    // Using OpenWeatherMap API as an example
    // You can replace this with your preferred weather API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=auto:ip&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    const data = await response.json();
    return {
      temp: data.main.temp,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed
    };
  } catch (error: any) {
    console.error('Error fetching weather:', error.message);
    return null;
  }
}
