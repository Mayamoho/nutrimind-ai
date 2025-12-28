/**
 * Data Analysis Strategy Pattern
 * Different strategies for analyzing and comparing user data
 */

export type MetricKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'water' | 'exercise';

export interface AnalysisResult {
  value: number;
  label: string;
  unit: string;
  remark: string;
  remarkType: 'excellent' | 'good' | 'average' | 'needs-improvement' | 'poor';
  percentile: number;
  comparison: 'above' | 'below' | 'at';
}

// Strategy Interface
export interface AnalysisStrategy {
  analyze(userValue: number, communityAvg: number, percentile: number): AnalysisResult;
  getMetricInfo(): { label: string; unit: string; icon: string };
}

// Calorie Analysis Strategy
export class CalorieAnalysisStrategy implements AnalysisStrategy {
  getMetricInfo() {
    return { label: 'Daily Calories', unit: 'kcal', icon: '🔥' };
  }

  analyze(userValue: number, communityAvg: number, percentile: number): AnalysisResult {
    const diff = userValue - communityAvg;
    const comparison = diff > 50 ? 'above' : diff < -50 ? 'below' : 'at';
    
    let remark: string, remarkType: AnalysisResult['remarkType'];
    
    if (userValue >= 1500 && userValue <= 2500) {
      remark = 'Your calorie intake is within a healthy range';
      remarkType = percentile >= 40 && percentile <= 70 ? 'excellent' : 'good';
    } else if (userValue < 1200) {
      remark = 'Your intake may be too low for sustained energy';
      remarkType = 'needs-improvement';
    } else if (userValue > 3000) {
      remark = 'Consider if this aligns with your activity level';
      remarkType = 'average';
    } else {
      remark = 'Moderate intake - adjust based on your goals';
      remarkType = 'good';
    }
    
    return { value: userValue, ...this.getMetricInfo(), remark, remarkType, percentile, comparison };
  }
}

// Protein Analysis Strategy
export class ProteinAnalysisStrategy implements AnalysisStrategy {
  getMetricInfo() {
    return { label: 'Daily Protein', unit: 'g', icon: '🥩' };
  }

  analyze(userValue: number, communityAvg: number, percentile: number): AnalysisResult {
    const comparison = userValue > communityAvg * 1.1 ? 'above' : userValue < communityAvg * 0.9 ? 'below' : 'at';
    
    let remark: string, remarkType: AnalysisResult['remarkType'];
    
    if (userValue >= 100) {
      remark = 'Excellent protein intake for muscle maintenance';
      remarkType = 'excellent';
    } else if (userValue >= 60) {
      remark = 'Good protein levels for general health';
      remarkType = 'good';
    } else if (userValue >= 40) {
      remark = 'Consider increasing protein for better results';
      remarkType = 'average';
    } else {
      remark = 'Protein intake is below recommended levels';
      remarkType = 'needs-improvement';
    }
    
    return { value: userValue, ...this.getMetricInfo(), remark, remarkType, percentile, comparison };
  }
}

// Water Analysis Strategy
export class WaterAnalysisStrategy implements AnalysisStrategy {
  getMetricInfo() {
    return { label: 'Daily Water', unit: 'ml', icon: '💧' };
  }

  analyze(userValue: number, communityAvg: number, percentile: number): AnalysisResult {
    const comparison = userValue > communityAvg * 1.1 ? 'above' : userValue < communityAvg * 0.9 ? 'below' : 'at';
    
    let remark: string, remarkType: AnalysisResult['remarkType'];
    
    if (userValue >= 2500) {
      remark = 'Outstanding hydration habits!';
      remarkType = 'excellent';
    } else if (userValue >= 2000) {
      remark = 'Good hydration - keep it up!';
      remarkType = 'good';
    } else if (userValue >= 1500) {
      remark = 'Try to drink a bit more water daily';
      remarkType = 'average';
    } else {
      remark = 'Hydration needs improvement';
      remarkType = 'needs-improvement';
    }
    
    return { value: userValue, ...this.getMetricInfo(), remark, remarkType, percentile, comparison };
  }
}

// Exercise Analysis Strategy
export class ExerciseAnalysisStrategy implements AnalysisStrategy {
  getMetricInfo() {
    return { label: 'Exercise Burn', unit: 'kcal', icon: '💪' };
  }

  analyze(userValue: number, communityAvg: number, percentile: number): AnalysisResult {
    const comparison = userValue > communityAvg * 1.1 ? 'above' : userValue < communityAvg * 0.9 ? 'below' : 'at';
    
    let remark: string, remarkType: AnalysisResult['remarkType'];
    
    if (userValue >= 400) {
      remark = 'Exceptional activity level!';
      remarkType = 'excellent';
    } else if (userValue >= 200) {
      remark = 'Good exercise routine';
      remarkType = 'good';
    } else if (userValue >= 100) {
      remark = 'Moderate activity - room for improvement';
      remarkType = 'average';
    } else {
      remark = 'Consider adding more physical activity';
      remarkType = 'needs-improvement';
    }
    
    return { value: userValue, ...this.getMetricInfo(), remark, remarkType, percentile, comparison };
  }
}

// Carbs Analysis Strategy
export class CarbsAnalysisStrategy implements AnalysisStrategy {
  getMetricInfo() {
    return { label: 'Daily Carbs', unit: 'g', icon: '🍞' };
  }

  analyze(userValue: number, communityAvg: number, percentile: number): AnalysisResult {
    const comparison = userValue > communityAvg * 1.1 ? 'above' : userValue < communityAvg * 0.9 ? 'below' : 'at';
    
    let remark: string, remarkType: AnalysisResult['remarkType'];
    
    if (userValue >= 150 && userValue <= 300) {
      remark = 'Balanced carb intake for energy';
      remarkType = 'excellent';
    } else if (userValue < 100) {
      remark = 'Low carb approach - ensure adequate energy';
      remarkType = 'average';
    } else if (userValue > 350) {
      remark = 'High carb intake - monitor if weight is a goal';
      remarkType = 'average';
    } else {
      remark = 'Carb intake is reasonable';
      remarkType = 'good';
    }
    
    return { value: userValue, ...this.getMetricInfo(), remark, remarkType, percentile, comparison };
  }
}

// Fat Analysis Strategy
export class FatAnalysisStrategy implements AnalysisStrategy {
  getMetricInfo() {
    return { label: 'Daily Fat', unit: 'g', icon: '🥑' };
  }

  analyze(userValue: number, communityAvg: number, percentile: number): AnalysisResult {
    const comparison = userValue > communityAvg * 1.1 ? 'above' : userValue < communityAvg * 0.9 ? 'below' : 'at';
    
    let remark: string, remarkType: AnalysisResult['remarkType'];
    
    if (userValue >= 50 && userValue <= 80) {
      remark = 'Healthy fat intake for hormone balance';
      remarkType = 'excellent';
    } else if (userValue < 40) {
      remark = 'Consider adding healthy fats';
      remarkType = 'average';
    } else if (userValue > 100) {
      remark = 'High fat - ensure quality sources';
      remarkType = 'average';
    } else {
      remark = 'Fat intake is acceptable';
      remarkType = 'good';
    }
    
    return { value: userValue, ...this.getMetricInfo(), remark, remarkType, percentile, comparison };
  }
}

// Strategy Factory
export const AnalysisStrategyFactory = {
  calories: new CalorieAnalysisStrategy(),
  protein: new ProteinAnalysisStrategy(),
  carbs: new CarbsAnalysisStrategy(),
  fat: new FatAnalysisStrategy(),
  water: new WaterAnalysisStrategy(),
  exercise: new ExerciseAnalysisStrategy(),
};

// Analysis Context
export class DataAnalyzer {
  private strategies = AnalysisStrategyFactory;

  analyzeMetric(
    metric: MetricKey,
    userValue: number,
    communityAvg: number,
    percentile: number
  ): AnalysisResult {
    return this.strategies[metric].analyze(userValue, communityAvg, percentile);
  }

  analyzeAll(userData: Record<MetricKey, number>, communityData: Record<MetricKey, { avg: number; percentile: number }>) {
    const results: Record<MetricKey, AnalysisResult> = {} as any;
    (Object.keys(this.strategies) as MetricKey[]).forEach(key => {
      const community = communityData[key] || { avg: 0, percentile: 50 };
      results[key] = this.analyzeMetric(key, userData[key] || 0, community.avg, community.percentile);
    });
    return results;
  }
}
