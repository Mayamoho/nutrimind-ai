/**
 * NutrientBreakdown Component
 * Displays detailed macro and micro nutrient breakdown from today's foods
 * Uses Builder pattern for constructing nutrient data
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { NutrientInfo, DailyProgress } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Skeleton Loader Component
const NutrientSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Macros Skeleton */}
      <div>
        <div className="h-5 w-32 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Micros Skeleton */}
      <div>
        <div className="h-5 w-32 bg-muted rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Nutrient Detail Modal Component
const NutrientDetailModal = ({ nutrient, onClose }: { 
  nutrient: any, 
  onClose: () => void 
}) => {
  if (!nutrient) return null;

  // Helper functions for nutrient details
  const getNutrientSources = (nutrientName: string) => {
    const sources: Record<string, string[]> = {
      'Fiber': ['Whole grains', 'Fruits', 'Vegetables', 'Legumes', 'Nuts'],
      'Vitamin C': ['Citrus fruits', 'Bell peppers', 'Strawberries', 'Broccoli'],
      'Vitamin D': ['Fatty fish', 'Egg yolks', 'Fortified dairy', 'Sunlight'],
      'Calcium': ['Dairy products', 'Leafy greens', 'Almonds', 'Fortified plant milks'],
      'Iron': ['Red meat', 'Spinach', 'Legumes', 'Pumpkin seeds'],
    };
    return sources[nutrientName] || ['Various food sources'];
  };

  const getNutrientBenefits = (nutrientName: string) => {
    const benefits: Record<string, string> = {
      'Fiber': 'Supports digestive health, helps maintain healthy blood sugar levels, and may reduce the risk of heart disease.',
      'Vitamin C': 'Essential for immune function, skin health, and acts as an antioxidant to protect cells from damage.',
      'Vitamin D': 'Important for bone health, immune function, and may help prevent certain chronic diseases.',
      'Calcium': 'Vital for strong bones and teeth, muscle function, and nerve signaling.',
      'Iron': 'Essential for red blood cell production and oxygen transport throughout the body.',
    };
    return benefits[nutrientName] || 'This nutrient plays important roles in various bodily functions.';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">{nutrient.icon}</span>
              {nutrient.name}
            </h3>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Intake</span>
                <span className="font-medium">
                  {Math.round(nutrient.amount)}{nutrient.unit} of {Math.round(nutrient.target)}{nutrient.unit}
                </span>
              </div>
              <Progress 
                value={Math.min((nutrient.amount / nutrient.target) * 100, 100)} 
                className="h-2" 
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">Recommended Daily Intake</h4>
              <p className="text-sm text-muted-foreground">
                The recommended daily intake for {nutrient.name} is {nutrient.target}{nutrient.unit} 
                for an average adult.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Good Sources</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {getNutrientSources(nutrient.name).map((source, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>•</span>
                    <span>{source}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Health Benefits</h4>
              <p className="text-sm text-muted-foreground">
                {getNutrientBenefits(nutrient.name)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Nutrient Builder Pattern
class NutrientDataBuilder {
  private macros: Map<string, { amount: number; unit: string; color: string }> = new Map();
  private micros: Map<string, { 
    name: string;
    amount: number; 
    unit: string; 
    icon: string; 
    target: number;
    status: 'deficient' | 'adequate' | 'excess';
  }> = new Map();

  // Default daily values for micronutrients
  private static DV: Record<string, { target: number; unit: string }> = {
    'fiber': { target: 28, unit: 'g' },
    'sugar': { target: 25, unit: 'g' },
    'sodium': { target: 2300, unit: 'mg' },
    'potassium': { target: 4700, unit: 'mg' },
    'vitaminA': { target: 900, unit: 'mcg' },
    'vitaminC': { target: 90, unit: 'mg' },
    'vitaminD': { target: 20, unit: 'mcg' },
    'calcium': { target: 1000, unit: 'mg' },
    'iron': { target: 18, unit: 'mg' },
    'magnesium': { target: 420, unit: 'mg' },
    'zinc': { target: 11, unit: 'mg' },
  }

  public static getDVUnit(nutrient: string): string {
    return this.DV[nutrient]?.unit || 'g';
  };

  private static ICONS: Record<string, string> = {
    'fiber': '🌾',
    'sugar': '🍬',
    'sodium': '🧂',
    'potassium': '🍌',
    'vitaminA': '🥕',
    'vitaminC': '🍊',
    'vitaminD': '☀️',
    'calcium': '🦴',
    'iron': '💪',
    'magnesium': '🌰',
    'zinc': '🦪',
  };

  private static MACRO_COLORS: Record<string, string> = {
    'Protein': 'from-blue-400 to-blue-600',
    'Carbs': 'from-amber-400 to-amber-600',
    'Fat': 'from-rose-400 to-rose-600',
    'Fiber': 'from-green-400 to-green-600',
  };

  addMacro(name: string, amount: number, unit: string): this {
    const existing = this.macros.get(name);
    this.macros.set(name, {
      amount: (existing?.amount || 0) + amount,
      unit,
      color: NutrientDataBuilder.MACRO_COLORS[name] || 'from-slate-400 to-slate-600',
    });
    return this;
  }

  addMicro(name: string, amount: number, unit: string, target?: number): this {
    try {
      // Skip if amount is not a valid number
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        console.warn(`Invalid amount for ${name}:`, amount);
        return this;
      }

      // Normalize the nutrient name for consistent lookups
      const normalizedKey = name.toLowerCase().replace(/\s+/g, '');
      
      // Create a display name with proper capitalization
      const displayName = name
        .split(/(?=[A-Z])/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      
      // Get existing micro-nutrient data if it exists
      const existing = this.micros.get(normalizedKey);
      
      // Get target value from DV or use provided target, default to 100 if none
      const microData = NutrientDataBuilder.DV[normalizedKey] || { target: target || 100, unit };
      const newAmount = (existing?.amount || 0) + amount;
      const microTarget = target !== undefined ? target : (microData?.target || 100);
      const microUnit = microData?.unit || unit || 'mg';
      
      // Determine status based on percentage of target
      let status: 'deficient' | 'adequate' | 'excess' = 'deficient';
      const percentage = microTarget > 0 ? (newAmount / microTarget) * 100 : 0;
      
      if (percentage >= 80 && percentage <= 120) {
        status = 'adequate';
      } else if (percentage > 120) {
        status = 'excess';
      }

      // Update or add the micro-nutrient
      this.micros.set(normalizedKey, {
        name: displayName,
        amount: parseFloat(newAmount.toFixed(2)), // Round to 2 decimal places
        unit: microUnit,
        icon: NutrientDataBuilder.ICONS[normalizedKey] || '💊',
        target: microTarget,
        status,
      });
    } catch (error) {
      console.error('Error adding micro-nutrient:', { name, amount, unit, target, error });
    }
    return this;
  }

  build() {
    try {
      // Process macros
      const macros = Array.from(this.macros.entries()).map(([name, data]) => ({
        name,
        ...data,
      }));

      // Process micros with additional validation
      const micros = Array.from(this.micros.values())
        .filter(micro => {
          // Filter out any micros with invalid data
          return (
            micro && 
            typeof micro.amount === 'number' && 
            micro.amount > 0 &&
            micro.name &&
            micro.unit
          );
        })
        .map(data => ({
          ...data,
          percentage: data.target > 0 ? 
            Math.min(Math.round((data.amount / data.target) * 100), 300) : 
            0,
        }));

      // Sort micros by status (deficient first, then adequate, then excess)
      micros.sort((a, b) => {
        const statusOrder = { 'deficient': 0, 'adequate': 1, 'excess': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      return { 
        macros, 
        micros,
        // Add a summary of micro-nutrient status
        microSummary: {
          total: micros.length,
          deficient: micros.filter(m => m.status === 'deficient').length,
          adequate: micros.filter(m => m.status === 'adequate').length,
          excess: micros.filter(m => m.status === 'excess').length,
        }
      };
    } catch (error) {
      console.error('Error building nutrient data:', error);
      return { 
        macros: [], 
        micros: [],
        microSummary: {
          total: 0,
          deficient: 0,
          adequate: 0,
          excess: 0
        }
      };
    }
  }
}

const NutrientBreakdown: React.FC = () => {
  const { todayLog, dailyProgress, isDataLoading } = useData();
  const [selectedNutrient, setSelectedNutrient] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deficient': return 'bg-yellow-500';
      case 'adequate': return 'bg-green-500';
      case 'excess': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  if (isDataLoading) {
    return <NutrientSkeleton />;
  }

  const nutrientData = useMemo(() => {
    const builder = new NutrientDataBuilder();

    // Add macros from daily progress
    builder.addMacro('Protein', dailyProgress.protein, 'g');
    builder.addMacro('Carbs', dailyProgress.carbs, 'g');
    builder.addMacro('Fat', dailyProgress.fat, 'g');

    // Add micros from dailyProgress.microNutrients
    if (dailyProgress.microNutrients) {
      Object.entries(dailyProgress.microNutrients).forEach(([key, value]) => {
        if (value) {
          builder.addMicro(
            key,
            value.achieved,
            NutrientDataBuilder.getDVUnit(key),
            value.target
          );
        }
      });
    }

    return builder.build();
  }, [dailyProgress]);

  const totalCalories = dailyProgress.calories.achieved;
  const macroCalories = {
    protein: dailyProgress.protein * 4,
    carbs: dailyProgress.carbs * 4,
    fat: dailyProgress.fat * 9,
  };
  const totalMacroCalories = macroCalories.protein + macroCalories.carbs + macroCalories.fat;

  if (todayLog.foods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">🧬</span> Nutrient Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <span className="text-4xl block mb-2">🍽️</span>
            <p>Log some food to see your nutrient breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isDataLoading ? (
          <NutrientSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <span className="text-2xl">🧬</span> Nutrient Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>

                {/* Macro Distribution Ring */}
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  {/* Visual Ring */}
                  <div className="flex-shrink-0 flex justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" 
                          className="text-slate-200 dark:text-slate-700" strokeWidth="12" />
                        {/* Protein arc */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#proteinGrad)" strokeWidth="12"
                          strokeDasharray={`${(macroCalories.protein / totalMacroCalories) * 251.2} 251.2`}
                          strokeLinecap="round" />
                        {/* Carbs arc */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#carbsGrad)" strokeWidth="12"
                          strokeDasharray={`${(macroCalories.carbs / totalMacroCalories) * 251.2} 251.2`}
                          strokeDashoffset={`-${(macroCalories.protein / totalMacroCalories) * 251.2}`}
                          strokeLinecap="round" />
                        {/* Fat arc */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#fatGrad)" strokeWidth="12"
                          strokeDasharray={`${(macroCalories.fat / totalMacroCalories) * 251.2} 251.2`}
                          strokeDashoffset={`-${((macroCalories.protein + macroCalories.carbs) / totalMacroCalories) * 251.2}`}
                          strokeLinecap="round" />
                        <defs>
                          <linearGradient id="proteinGrad"><stop stopColor="#3B82F6"/><stop offset="1" stopColor="#2563EB"/></linearGradient>
                          <linearGradient id="carbsGrad"><stop stopColor="#F59E0B"/><stop offset="1" stopColor="#D97706"/></linearGradient>
                          <linearGradient id="fatGrad"><stop stopColor="#F43F5E"/><stop offset="1" stopColor="#E11D48"/></linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round(totalCalories)}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">kcal</span>
                      </div>
                    </div>
                  </div>

                  {/* Macro Bars */}
                  <div className="flex-1 space-y-3">
                    {nutrientData.macros.map((macro) => (
                      <div key={macro.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{macro.name}</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {Math.round(macro.amount)}{macro.unit}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${macro.color} rounded-full transition-all duration-500`}
                            style={{ 
                              width: `${Math.min((macro.amount / (macro.name === 'Protein' ? dailyProgress.proteinTarget : 
                                macro.name === 'Carbs' ? dailyProgress.carbTarget : dailyProgress.fatTarget)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micronutrients Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Micronutrients</h3>
                    {dailyProgress.microNutrientStatus && (
                      <div className="text-sm text-muted-foreground">
                        Overall Score: <span className="font-bold">{dailyProgress.microNutrientStatus.overallScore}%</span>
                      </div>
                    )}
                  </div>

                  {dailyProgress.microNutrientStatus?.recommendations?.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">Recommendations</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                        {dailyProgress.microNutrientStatus.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                  >
                    {nutrientData.micros.map((micro, index) => (
                      <motion.div 
                        key={micro.name} 
                        variants={itemVariants}
                        custom={index}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedNutrient(micro);
                          setIsDetailOpen(true);
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          micro.status === 'deficient' 
                            ? 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' 
                            : micro.status === 'adequate' 
                              ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800'
                              : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{micro.icon}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(micro.status)}`}></div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{micro.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(micro.amount)}{micro.unit} of {Math.round(micro.target)}{micro.unit}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Summary of Deficiencies and Adequate Nutrients */}
                  {(dailyProgress.microNutrientStatus?.topDeficiencies?.length > 0 || 
                    dailyProgress.microNutrientStatus?.topAdequate?.length > 0) && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dailyProgress.microNutrientStatus.topDeficiencies?.length > 0 && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                          <h4 className="text-sm font-medium mb-2 text-yellow-800 dark:text-yellow-200">Top Deficiencies</h4>
                          <ul className="space-y-1">
                            {dailyProgress.microNutrientStatus.topDeficiencies.map((item, i) => (
                              <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {dailyProgress.microNutrientStatus.topAdequate?.length > 0 && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                          <h4 className="text-sm font-medium mb-2 text-green-800 dark:text-green-200">Adequate Intake</h4>
                          <ul className="space-y-1">
                            {dailyProgress.microNutrientStatus.topAdequate.map((item, i) => (
                              <li key={i} className="text-sm text-green-700 dark:text-green-300">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailOpen && selectedNutrient && (
          <NutrientDetailModal 
            nutrient={selectedNutrient} 
            onClose={() => setIsDetailOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default NutrientBreakdown;
