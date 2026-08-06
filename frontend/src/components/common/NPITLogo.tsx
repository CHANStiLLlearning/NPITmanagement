import React from 'react';

interface NPITLogoProps {
  className?: string;
  size?: number;
}

export function NPITLogo({ size = 44 }: NPITLogoProps) {
  return (
    <img
      src="/logo.jpg"
      alt="NPIT Logo"
      width={size}
      height={size}
      className="object-contain shrink-0 rounded-sm"
      style={{ width: size, height: size }}
    />
  );
}
