export const AI_CONFIG = {
  API_KEY: 'AIzaSyBzG01Uu2Yn51O9LX0BrrEdox6gpPge2mk', // Replace with your actual API key
  MODELS: {
    TEXT: 'gemini-2.0-flash-exp',
    VISION: 'gemini-pro-vision'
  },
  FEATURES: {
    INSIGHTS: {
      enabled: true,
      updateInterval: 24 * 60 * 60 * 1000, // 24 hours
      confidenceThreshold: 0.7
    },
    PREDICTIONS: {
      enabled: true,
      maxPredictionMonths: 6,
      minDataPoints: 10
    },
    RECOMMENDATIONS: {
      enabled: true,
      riskLevels: ['conservative', 'moderate', 'aggressive'],
      updateInterval: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  },
  PROMPTS: {
    INSIGHTS: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topK: 40,
      topP: 0.95
    },
    PREDICTIONS: {
      temperature: 0.3,
      maxOutputTokens: 512,
      topK: 20,
      topP: 0.8
    },
    RECOMMENDATIONS: {
      temperature: 0.5,
      maxOutputTokens: 768,
      topK: 30,
      topP: 0.9
    }
  }
}; 