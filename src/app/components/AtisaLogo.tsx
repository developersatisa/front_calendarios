import React from 'react';
import { getLogoClasses } from '../styles/tailwindUtils';

// Componente de logotipo según Guía Técnica Atisa
interface AtisaLogoProps {
  size?: 'normal' | 'responsive';
  variant?: 'primary' | 'negative' | 'monochrome' | 'white' | 'black';
  showText?: boolean;
  className?: string;
}

export const AtisaLogo: React.FC<AtisaLogoProps> = ({
  size = 'normal',
  variant = 'primary',
  showText = true,
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'negative':
        return 'bg-white text-atisa-primary';
      case 'monochrome':
        return 'bg-atisa-primary text-white';
      case 'white':
        return 'bg-white text-atisa-primary border-2 border-atisa-primary';
      case 'black':
        return 'bg-black text-white';
      default:
        return 'bg-atisa-primary text-white';
    }
  };

  const getTextClasses = () => {
    switch (variant) {
      case 'negative':
        return 'text-atisa-primary';
      case 'monochrome':
        return 'text-white';
      case 'white':
        return 'text-atisa-primary';
      case 'black':
        return 'text-white';
      default:
        return 'text-white';
    }
  };

  const logoSize = size === 'responsive' ? 'w-8 h-8' : 'w-16 h-16';
  const textSize = size === 'responsive' ? 'text-lg' : 'text-3xl';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo principal según guía técnica */}
      <div className={`${logoSize} rounded-full flex items-center justify-center shadow-atisa-lg ${getVariantClasses()}`}>
        <i className="bi bi-shield-check text-2xl"></i>
      </div>

      {/* Texto del logotipo */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif atisa-bold ${textSize} ${getTextClasses()}`}>
            ATISA
          </span>
          {size === 'normal' && (
            <span className={` lato-light text-xs ${getTextClasses()} opacity-80`}>
              Gestión Integral
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de ideograma según guía técnica
interface AtisaIdeogramProps {
  type?: 'primary' | 'secondary' | 'accent' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  className?: string;
}

export const AtisaIdeogram: React.FC<AtisaIdeogramProps> = ({
  type = 'primary',
  size = 'md',
  icon = 'bi-shield-check',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-lg';
      case 'lg':
        return 'w-16 h-16 text-3xl';
      default:
        return 'w-12 h-12 text-2xl';
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'primary':
        return 'ideogram-atisa-primary';
      case 'secondary':
        return 'ideogram-atisa-secondary';
      case 'accent':
        return 'ideogram-atisa-accent';
      case 'gradient':
        return 'ideogram-atisa-gradient';
      default:
        return 'ideogram-atisa-primary';
    }
  };

  return (
    <div className={`ideogram-atisa ${getTypeClasses()} ${getSizeClasses()} ${className}`}>
      <i className={`${icon} text-white`}></i>
    </div>
  );
};

// Componente de icono según guía técnica (retícula 22x22)
interface AtisaIconProps {
  icon: string;
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AtisaIcon: React.FC<AtisaIconProps> = ({
  icon,
  color = 'primary',
  size = 'md',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4 text-sm';
      case 'lg':
        return 'w-6 h-6 text-lg';
      default:
        return 'w-5.5 h-5.5 text-base';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'icon-atisa-primary';
      case 'secondary':
        return 'icon-atisa-secondary';
      case 'accent':
        return 'icon-atisa-accent';
      case 'white':
        return 'icon-atisa-white';
      default:
        return 'icon-atisa-primary';
    }
  };

  return (
    <i className={`${icon} ${getSizeClasses()} ${getColorClasses()} ${className}`}></i>
  );
};
