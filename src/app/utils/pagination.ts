export const getPageNumbers = (current: number, total: number, delta: number = 2): (number | string)[] => {
  const pages: (number | string)[] = []

  // Siempre mostrar primera página
  pages.push(1)

  // Calcular rango alrededor de la página actual
  const rangeStart = Math.max(2, current - delta)
  const rangeEnd = Math.min(total - 1, current + delta)

  // Agregar puntos suspensivos después de la primera página si es necesario
  if (rangeStart > 2) {
    pages.push('...')
  }

  // Agregar páginas del rango
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }

  // Agregar puntos suspensivos antes de la última página si es necesario
  if (rangeEnd < total - 1) {
    pages.push('...')
  }

  // Siempre mostrar última página si hay más de una página
  if (total > 1) {
    pages.push(total)
  }

  return pages
}
