/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales según Guía Técnica Atisa
        'atisa-primary': '#00505C',      // Pantone 3165 C - Verde oscuro
        'atisa-secondary': '#9CBA39',    // Pantone 375 C - Verde claro (clientes)
        'atisa-accent': '#00A1DE',       // Pantone 299 C - Azul (valor y servicios)

        // Colores secundarios
        'atisa-blue-light': '#3DB7E4',   // Pantone 298 C
        'atisa-blue-dark': '#0065BD',    // Pantone 300 C
        'atisa-green-light': '#80E0D3',  // Pantone 3245 C
        'atisa-green-dark': '#007C92',   // Pantone 3145 C
        'atisa-green-bright': '#C3E76F', // Pantone 374 C
        'atisa-green-medium': '#7AB800', // Pantone 376 C

        // Colores para infografías (uso limitado)
        'atisa-orange': '#FF6D22',       // Pantone 1585 C
        'atisa-yellow': '#F1E800',       // Pantone 3945 C
        'atisa-salmon': '#F7D6A5',       // Pantone 7507 C
        'atisa-purple': '#B634BB',       // Pantone Purple C

        // Alias para compatibilidad
        'atisa-light': '#80E0D3',        // Alias para verde claro secundario
        'atisa-dark': '#007C92',         // Alias para verde oscuro secundario
      },
      fontFamily: {
        // Tipografías según Guía Técnica Atisa
        'atisa-primary': ['Aleo', 'Georgia', 'serif'],        // Logotipo, titulares, destacados
        'atisa-secondary': ['Lato', 'Arial', 'sans-serif'],   // Texto corrido, párrafos, gráficos
        'sans': ['Lato', 'Arial', 'sans-serif'],
        'serif': ['Aleo', 'Georgia', 'serif'],
        // Alias para compatibilidad con clases existentes
        'primary': ['Aleo', 'Georgia', 'serif'],
        'secondary': ['Lato', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        // Pesos de Aleo: Light, Regular, Bold (+ Itálicas)
        'atisa-light': '300',
        'atisa-regular': '400',
        'atisa-bold': '700',
        // Pesos de Lato: Light → Black (incluye itálicas)
        'lato-light': '300',
        'lato-regular': '400',
        'lato-medium': '500',
        'lato-semibold': '600',
        'lato-bold': '700',
        'lato-extrabold': '800',
        'lato-black': '900',
      },
      boxShadow: {
        'atisa': '0 15px 40px rgba(0, 80, 92, 0.15)',
        'atisa-lg': '0 8px 25px rgba(0, 80, 92, 0.3)',
        'atisa-button': '0 3px 12px rgba(156, 186, 57, 0.3)',
        'atisa-button-hover': '0 4px 15px rgba(0, 161, 222, 0.4)',
      },
      borderRadius: {
        'atisa': '8px',
        'atisa-lg': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
}
