// Utilidades de Tailwind CSS según Guía Técnica Atisa
// Implementación completa de la identidad visual corporativa

export const atisaClasses = {
  // Botones según guía técnica
  primaryButton: 'btn-atisa-primary',
  secondaryButton: 'btn-atisa-secondary',
  actionsButton: 'btn-atisa-actions',

  // Inputs según guía técnica
  input: 'input-atisa',

  // Tarjetas según guía técnica
  card: 'card-atisa',

  // Tablas según guía técnica
  tableHeader: 'table-atisa-header',
  tableCell: 'table-atisa-cell',

  // Badges según guía técnica
  badge: 'badge-atisa',
  badgeSuccess: 'badge-atisa badge-atisa-success',
  badgeInfo: 'badge-atisa badge-atisa-info',
  badgeWarning: 'badge-atisa badge-atisa-warning',
  badgeDanger: 'badge-atisa badge-atisa-danger',

  // Modales según guía técnica
  modalHeader: 'modal-atisa-header',

  // Alertas según guía técnica
  alert: 'alert-atisa',
  alertDanger: 'alert-atisa alert-atisa-danger',
  alertSuccess: 'alert-atisa alert-atisa-success',
  alertWarning: 'alert-atisa alert-atisa-warning',
  alertInfo: 'alert-atisa alert-atisa-info',

  // Layout según guía técnica
  gradient: 'gradient-atisa',
  gradientPrimary: 'gradient-atisa-primary',
  gradientSecondary: 'gradient-atisa-secondary',
  gradientAccent: 'gradient-atisa-accent',

  // Logo según guía técnica
  logo: 'logo-atisa',
  logoResponsive: 'logo-atisa-responsive',

  // Iconografía según guía técnica (retícula 22x22)
  icon: 'icon-atisa',
  iconPrimary: 'icon-atisa icon-atisa-primary',
  iconSecondary: 'icon-atisa icon-atisa-secondary',
  iconAccent: 'icon-atisa icon-atisa-accent',
  iconWhite: 'icon-atisa icon-atisa-white',

  // Ideogramas según guía técnica
  ideogram: 'ideogram-atisa',
  ideogramPrimary: 'ideogram-atisa ideogram-atisa-primary',
  ideogramSecondary: 'ideogram-atisa ideogram-atisa-secondary',
  ideogramAccent: 'ideogram-atisa ideogram-atisa-accent',
  ideogramGradient: 'ideogram-atisa ideogram-atisa-gradient',

  // Textos según guía técnica
  title: 'font-serif text-atisa-primary atisa-bold',
  subtitle: 'font-sans text-atisa-green-dark lato-regular',

  // Colores principales
  primaryText: 'text-atisa-primary',
  secondaryText: 'text-atisa-secondary',
  accentText: 'text-atisa-accent',

  // Colores secundarios
  blueLightText: 'text-atisa-blue-light',
  blueDarkText: 'text-atisa-blue-dark',
  greenLightText: 'text-atisa-green-light',
  greenDarkText: 'text-atisa-green-dark',
  greenBrightText: 'text-atisa-green-bright',
  greenMediumText: 'text-atisa-green-medium',

  // Colores para infografías
  orangeText: 'text-atisa-orange',
  yellowText: 'text-atisa-yellow',
  salmonText: 'text-atisa-salmon',
  purpleText: 'text-atisa-purple',

  // Alias para compatibilidad
  lightText: 'text-atisa-light',
  darkText: 'text-atisa-dark',

  // Fondos principales
  primaryBg: 'bg-atisa-primary',
  secondaryBg: 'bg-atisa-secondary',
  accentBg: 'bg-atisa-accent',

  // Fondos secundarios
  blueLightBg: 'bg-atisa-blue-light',
  blueDarkBg: 'bg-atisa-blue-dark',
  greenLightBg: 'bg-atisa-green-light',
  greenDarkBg: 'bg-atisa-green-dark',
  greenBrightBg: 'bg-atisa-green-bright',
  greenMediumBg: 'bg-atisa-green-medium',

  // Fondos para infografías
  orangeBg: 'bg-atisa-orange',
  yellowBg: 'bg-atisa-yellow',
  salmonBg: 'bg-atisa-salmon',
  purpleBg: 'bg-atisa-purple',

  // Alias para compatibilidad
  lightBg: 'bg-atisa-light',
  darkBg: 'bg-atisa-dark',

  // Bordes principales
  primaryBorder: 'border-atisa-primary',
  secondaryBorder: 'border-atisa-secondary',
  accentBorder: 'border-atisa-accent',

  // Bordes secundarios
  blueLightBorder: 'border-atisa-blue-light',
  blueDarkBorder: 'border-atisa-blue-dark',
  greenLightBorder: 'border-atisa-green-light',
  greenDarkBorder: 'border-atisa-green-dark',
  greenBrightBorder: 'border-atisa-green-bright',
  greenMediumBorder: 'border-atisa-green-medium',

  // Alias para compatibilidad
  lightBorder: 'border-atisa-light',
  darkBorder: 'border-atisa-dark',
}

// Funciones helper según Guía Técnica Atisa

// Función para obtener clases de botón primario con hover
export const getPrimaryButtonClasses = (isHovered: boolean = false) => {
  return isHovered
    ? 'btn-atisa-primary hover:bg-atisa-accent hover:shadow-atisa-button-hover hover:-translate-y-0.5'
    : 'btn-atisa-primary'
}

// Función para obtener clases de botón secundario con hover
export const getSecondaryButtonClasses = (isHovered: boolean = false) => {
  return isHovered
    ? 'btn-atisa-secondary hover:bg-atisa-green-light hover:text-atisa-primary'
    : 'btn-atisa-secondary'
}

// Función para obtener clases de botón de acciones con hover
export const getActionsButtonClasses = (isHovered: boolean = false) => {
  return isHovered
    ? 'btn-atisa-actions hover:bg-atisa-accent'
    : 'btn-atisa-actions'
}

// Función para obtener clases de badge según tipo
export const getBadgeClasses = (type: 'success' | 'info' | 'warning' | 'danger') => {
  switch (type) {
    case 'success':
      return atisaClasses.badgeSuccess
    case 'info':
      return atisaClasses.badgeInfo
    case 'warning':
      return atisaClasses.badgeWarning
    case 'danger':
      return atisaClasses.badgeDanger
    default:
      return atisaClasses.badge
  }
}

// Función para obtener clases de input con focus
export const getInputClasses = (hasFocus: boolean = false) => {
  return hasFocus
    ? 'input-atisa focus:border-atisa-accent focus:ring-2 focus:ring-atisa-accent/10'
    : 'input-atisa'
}

// Función para obtener clases de dropdown según guía técnica
export const getDropdownClasses = () => {
  return 'bg-white border-2 border-atisa-green-light rounded-atisa shadow-atisa-lg z-50 min-w-40 max-w-50'
}

// Función para obtener clases de tabla según guía técnica
export const getTableClasses = () => {
  return {
    header: atisaClasses.tableHeader,
    cell: atisaClasses.tableCell,
    container: 'w-full border-collapse'
  }
}

// Función para obtener clases de modal según guía técnica
export const getModalClasses = () => {
  return {
    header: atisaClasses.modalHeader,
    body: 'bg-white p-8',
    footer: 'bg-atisa-green-light px-8 py-6 border-t border-atisa-green-light'
  }
}

// Función para obtener clases de alerta según guía técnica
export const getAlertClasses = (type: 'success' | 'danger' | 'warning' | 'info') => {
  const baseClasses = atisaClasses.alert
  switch (type) {
    case 'success':
      return `${baseClasses} alert-atisa-success`
    case 'danger':
      return `${baseClasses} alert-atisa-danger`
    case 'warning':
      return `${baseClasses} alert-atisa-warning`
    case 'info':
      return `${baseClasses} alert-atisa-info`
    default:
      return baseClasses
  }
}

// Función para obtener clases de animación
export const getAnimationClasses = (animation: 'fade' | 'slide' | 'bounce' = 'fade') => {
  switch (animation) {
    case 'fade':
      return 'animate-fade-in'
    case 'slide':
      return 'animate-slide-up'
    case 'bounce':
      return 'animate-bounce-subtle'
    default:
      return 'animate-fade-in'
  }
}

// Función para obtener clases de espaciado según guía técnica
export const getSpacingClasses = (size: 'sm' | 'md' | 'lg' | 'xl') => {
  switch (size) {
    case 'sm':
      return 'p-4 m-2'
    case 'md':
      return 'p-6 m-4'
    case 'lg':
      return 'p-8 m-6'
    case 'xl':
      return 'p-12 m-8'
    default:
      return 'p-6 m-4'
  }
}

// Función para obtener clases de sombra según guía técnica
export const getShadowClasses = (intensity: 'sm' | 'md' | 'lg' | 'xl') => {
  switch (intensity) {
    case 'sm':
      return 'shadow-sm'
    case 'md':
      return 'shadow-atisa'
    case 'lg':
      return 'shadow-atisa-lg'
    case 'xl':
      return 'shadow-2xl'
    default:
      return 'shadow-atisa'
  }
}

// Función para obtener clases de icono según guía técnica (retícula 22x22)
export const getIconClasses = (color: 'primary' | 'secondary' | 'accent' | 'white' = 'primary') => {
  const baseClasses = atisaClasses.icon
  switch (color) {
    case 'primary':
      return `${baseClasses} icon-atisa-primary`
    case 'secondary':
      return `${baseClasses} icon-atisa-secondary`
    case 'accent':
      return `${baseClasses} icon-atisa-accent`
    case 'white':
      return `${baseClasses} icon-atisa-white`
    default:
      return `${baseClasses} icon-atisa-primary`
  }
}

// Función para obtener clases de ideograma según guía técnica
export const getIdeogramClasses = (type: 'primary' | 'secondary' | 'accent' | 'gradient' = 'primary') => {
  const baseClasses = atisaClasses.ideogram
  switch (type) {
    case 'primary':
      return `${baseClasses} ideogram-atisa-primary`
    case 'secondary':
      return `${baseClasses} ideogram-atisa-secondary`
    case 'accent':
      return `${baseClasses} ideogram-atisa-accent`
    case 'gradient':
      return `${baseClasses} ideogram-atisa-gradient`
    default:
      return `${baseClasses} ideogram-atisa-primary`
  }
}

// Función para obtener clases de logo según guía técnica
export const getLogoClasses = (size: 'normal' | 'responsive' = 'normal') => {
  return size === 'responsive' ? atisaClasses.logoResponsive : atisaClasses.logo
}

// Función para obtener clases de tipografía según guía técnica
export const getTypographyClasses = (type: 'title' | 'subtitle' | 'body' | 'caption') => {
  switch (type) {
    case 'title':
      return 'font-serif text-atisa-primary atisa-bold'
    case 'subtitle':
      return 'font-sans text-atisa-green-dark lato-semibold'
    case 'body':
      return 'font-sans text-gray-700 lato-regular'
    case 'caption':
      return 'font-sans text-atisa-green-dark lato-light text-sm'
    default:
      return 'font-sans text-gray-700 lato-regular'
  }
}

// Función para obtener clases de gradiente según guía técnica
export const getGradientClasses = (type: 'primary' | 'secondary' | 'accent' | 'neutral' = 'neutral') => {
  switch (type) {
    case 'primary':
      return atisaClasses.gradientPrimary
    case 'secondary':
      return atisaClasses.gradientSecondary
    case 'accent':
      return atisaClasses.gradientAccent
    case 'neutral':
      return atisaClasses.gradient
    default:
      return atisaClasses.gradient
  }
}
