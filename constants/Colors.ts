/**
 * Unified color system for ParkSafe app
 * Provides consistent colors across light and dark themes
 */

// Brand colors
const tintColorLight = '#34aa56';
const tintColorDark = '#34aa56';

export const Colors = {
  light: {
    // Base colors
    text: '#11181C',
    textSecondary: '#64748B',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    
    // Interactive colors
    tint: tintColorLight,
    tintSecondary: '#16A34A',
    
    // UI elements
    border: '#E2E8F0',
    borderSecondary: '#CBD5E1',
    
    // Icons
    icon: '#687076',
    iconSecondary: '#9CA3AF',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Status colors
    error: '#EF4444',
    errorBackground: '#FEF2F2',
    errorBorder: '#FECACA',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Card and surface colors
    cardBackground: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    
    // Input colors
    inputBackground: '#F8FAFC',
    placeholder: '#9CA3AF',
    
    // Gradient colors for consistency
    gradientPrimary: ['#22C55E', '#16A34A'],
    gradientSecondary: ['#3B82F6', '#2563EB'],
    gradientAccent: ['#F97316', '#EA580C'],
  },
  dark: {
    // Base colors
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    background: '#18181B',
    backgroundSecondary: '#1E293B',
    
    // Interactive colors
    tint: tintColorDark,
    tintSecondary: '#22C55E',
    
    // UI elements
    border: '#374151',
    borderSecondary: '#4B5563',
    
    // Icons
    icon: '#D1D5DB',
    iconSecondary: '#9CA3AF',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Status colors
    error: '#EF4444',
    errorBackground: '#7F1D1D',
    errorBorder: '#DC2626',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Card and surface colors
    cardBackground: '#1E293B',
    surfaceSecondary: '#0F172A',
    
    // Input colors
    inputBackground: '#1F2937',
    placeholder: '#6B7280',
    
    // Gradient colors for consistency
    gradientPrimary: ['#22C55E', '#16A34A'],
    gradientSecondary: ['#3B82F6', '#2563EB'],
    gradientAccent: ['#F97316', '#EA580C'],
  },
};
