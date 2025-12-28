/**
 * Observer Pattern Implementation
 * Allows achievement events to notify multiple subscribers (UI, notifications, analytics)
 */

export interface Observer<T> {
  update(data: T): void;
}

export interface Subject<T> {
  subscribe(observer: Observer<T>): void;
  unsubscribe(observer: Observer<T>): void;
  notify(data: T): void;
}

export class AchievementSubject<T> implements Subject<T> {
  private observers: Observer<T>[] = [];

  subscribe(observer: Observer<T>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  unsubscribe(observer: Observer<T>): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(data: T): void {
    this.observers.forEach(observer => observer.update(data));
  }
}

// Concrete observer for UI notifications
export class UINotificationObserver implements Observer<AchievementEvent> {
  private callback: (event: AchievementEvent) => void;

  constructor(callback: (event: AchievementEvent) => void) {
    this.callback = callback;
  }

  update(data: AchievementEvent): void {
    this.callback(data);
  }
}

// Concrete observer for analytics tracking
export class AnalyticsObserver implements Observer<AchievementEvent> {
  update(data: AchievementEvent): void {
    console.log('[Analytics] Achievement Event:', data.type, data.achievement?.name);
  }
}

export interface AchievementEvent {
  type: 'unlocked' | 'progress' | 'streak' | 'milestone';
  achievement?: Achievement;
  progress?: number;
  timestamp: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  unlockedAt?: Date;
  progress: number;
  target: number;
}

export type AchievementCategory = 'nutrition' | 'exercise' | 'consistency' | 'milestone' | 'special';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
