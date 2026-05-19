import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  height?: string;
  width?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  height = '20px', 
  width = '100%', 
  variant = 'text',
  className = '' 
}) => {
  const variantClass = styles[variant] || styles.text;
  
  return (
    <div 
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={{ height, width }}
    />
  );
};