import React from 'react';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'card' | 'text' | 'avatar';

export interface SkeletonProps {
  /** Variant determines the shape and size */
  variant?: SkeletonVariant;
  /** Additional custom className */
  className?: string;
  /** Width value (px, %, rem) */
  width?: string;
  /** Height value (px, %, rem) */
  height?: string;
  /** Number of text lines when variant is 'text' */
  lines?: number;
}

/**
 * Skeleton component for loading states
 * Displays animated placeholder while content is loading
 * Optimized for mobile viewport
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  className = '',
  width,
  height,
  lines = 1,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'card':
        return styles.card;
      case 'avatar':
        return styles.avatar;
      case 'text':
      default:
        return styles.text;
    }
  };

  const renderTextLines = () => {
    const textLines = [];
    for (let i = 0; i < lines; i++) {
      const isLast = i === lines - 1;
      textLines.push(
        <div
          key={i}
          className={`${styles.textLine} ${isLast ? styles.lastLine : ''}`}
        />
      );
    }
    return textLines;
  };

  return (
    <div
      className={`${styles.skeleton} ${getVariantClass()} ${className}`}
      style={{
        width: variant === 'text' ? undefined : width,
        height: variant === 'text' ? undefined : height,
      }}
      aria-hidden="true"
    >
      {variant === 'text' && renderTextLines()}
    </div>
  );
};

export default Skeleton;