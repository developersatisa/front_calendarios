// Estilos corporativos Atisa - Reutilizables en todas las vistas
export const atisaStyles = {
  colors: {
    primary: '#00505C',      // Verde oscuro (Pantone 3165 C)
    secondary: '#9CBA39',    // Verde claro (Pantone 375 C)
    accent: '#00A1DE',       // Azul (Pantone 299 C)
    light: '#80E0D3',        // Verde claro secundario (Pantone 3245 C)
    dark: '#007C92',         // Verde oscuro secundario (Pantone 3145 C)
    warning: '#F1E800',      // Amarillo (Pantone 3945 C)
    error: '#FF6D22',        // Naranja (Pantone 1585 C)
    info: '#00A1DE',         // Azul (Pantone 299 C)
    success: '#9CBA39',      // Verde claro (Pantone 375 C)
  },
  fonts: {
    primary: 'Aleo, Georgia, serif',
    secondary: 'Lato, Arial, sans-serif',
  },
  toast: {
    success: {
      background: '#9CBA39',
      borderLeft: '#7AB800',
      textColor: '#ffffff',
      iconColor: '#00505C',
    },
    error: {
      background: '#FF6D22',
      borderLeft: '#e55a1a',
      textColor: '#ffffff',
      iconColor: '#ffffff',
    },
    warning: {
      background: '#F1E800',
      borderLeft: '#d4d000',
      textColor: '#00505C',
      iconColor: '#00505C',
    },
    info: {
      background: '#00A1DE',
      borderLeft: '#0065BD',
      textColor: '#ffffff',
      iconColor: '#ffffff',
    },
  }
}

// Función para obtener estilos de botón primario
export const getPrimaryButtonStyles = (isHovered: boolean = false) => ({
  backgroundColor: isHovered ? atisaStyles.colors.accent : atisaStyles.colors.secondary,
  border: `2px solid ${isHovered ? atisaStyles.colors.accent : atisaStyles.colors.secondary}`,
  color: 'white',
  fontFamily: atisaStyles.fonts.secondary,
  fontWeight: '600',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
})

// Función para obtener estilos de botón secundario
export const getSecondaryButtonStyles = (isHovered: boolean = false) => ({
  backgroundColor: 'transparent',
  border: `2px solid ${isHovered ? atisaStyles.colors.primary : 'white'}`,
  color: isHovered ? atisaStyles.colors.primary : 'white',
  fontFamily: atisaStyles.fonts.secondary,
  fontWeight: '600',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
})

// Función para obtener estilos de header de tabla
export const getTableHeaderStyles = () => ({
  backgroundColor: atisaStyles.colors.light,
  color: atisaStyles.colors.primary,
  fontFamily: atisaStyles.fonts.primary,
  fontWeight: 'bold',
  padding: '16px 8px',
  borderBottom: `3px solid ${atisaStyles.colors.primary}`,
  borderLeft: 'none',
  borderRight: 'none'
})

// Función para obtener estilos de celda de tabla
export const getTableCellStyles = () => ({
  padding: '12px 8px',
  color: atisaStyles.colors.dark,
  borderBottom: `1px solid ${atisaStyles.colors.light}`,
  borderLeft: 'none',
  borderRight: 'none',
  fontFamily: atisaStyles.fonts.secondary
})

// Función para obtener estilos de badge
export const getBadgeStyles = (isSuccess: boolean) => ({
  backgroundColor: isSuccess ? atisaStyles.colors.secondary : atisaStyles.colors.accent,
  color: 'white',
  fontFamily: atisaStyles.fonts.secondary,
  fontWeight: '600',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px'
})

// Función para obtener estilos de dropdown
export const getDropdownStyles = () => ({
  backgroundColor: 'white',
  border: `2px solid ${atisaStyles.colors.light}`,
  borderRadius: '8px',
  boxShadow: '0 8px 25px rgba(0, 80, 92, 0.3)',
  zIndex: 99999,
  minWidth: '160px',
  maxWidth: '200px'
})

// Función para obtener estilos de botón de acciones
export const getActionsButtonStyles = (isHovered: boolean = false) => ({
  backgroundColor: isHovered ? atisaStyles.colors.accent : atisaStyles.colors.primary,
  border: `2px solid ${isHovered ? atisaStyles.colors.accent : atisaStyles.colors.primary}`,
  color: 'white',
  fontFamily: atisaStyles.fonts.secondary,
  fontWeight: '600',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: '12px',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
})
