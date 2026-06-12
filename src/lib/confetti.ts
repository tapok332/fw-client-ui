"use client";

import confetti from 'canvas-confetti';

// Default confetti configuration
const defaultConfettiConfig = {
  particleCount: 30,
  spread: 70,
  origin: { y: 0.9, x: 0.9 }, // Bottom right
  colors: ['#4ade80', '#22c55e', '#16a34a', '#15803d'], // Green colors
  disableForReducedMotion: true, // Accessibility
  zIndex: 1500,
};

/**
 * Create a confetti burst at the specified origin or bottom-right by default
 * @param options Configuration options for the confetti burst
 */
export function triggerConfetti(options?: Partial<confetti.Options>) {
  try {
    // Merge default config with provided options
    const confettiConfig = {
      ...defaultConfettiConfig,
      ...options,
    };

    // Trigger the confetti animation
    confetti(confettiConfig);
  } catch (error) {
    console.error('Failed to trigger confetti:', error);
    // Silently fail - confetti is non-essential UI element
  }
}

/**
 * Trigger confetti at a specific position on the screen
 * @param position The x, y coordinates in pixels
 * @param options Additional confetti configuration options
 */
export function triggerConfettiAtPosition(
  position: { x: number; y: number },
  options?: Partial<confetti.Options>
) {
  try {
    // Convert absolute pixel position to origin format (0-1 range)
    const origin = {
      x: Math.min(Math.max(position.x / window.innerWidth, 0), 1),
      y: Math.min(Math.max(position.y / window.innerHeight, 0), 1),
    };
    
    // Trigger confetti with calculated origin
    triggerConfetti({
      ...options,
      origin,
    });
  } catch (error) {
    console.error("Error triggering confetti at position:", error);
    // Fallback to bottom-right position
    triggerConfetti(options);
  }
}
