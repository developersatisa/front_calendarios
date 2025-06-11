import {FC} from 'react'
import {getPageNumbers} from '../../utils/pagination'

interface Props {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

const SharedPagination: FC<Props> = ({currentPage, totalItems, pageSize, onPageChange}) => {
  const totalPages = Math.ceil(totalItems / pageSize)

  return (
    <div className='d-flex justify-content-between align-items-center flex-wrap pt-10'>
      <div className='fs-6 fw-semibold text-gray-700'>
        Mostrando {Math.min(pageSize, totalItems - (currentPage - 1) * pageSize)} de {totalItems} resultados
      </div>
      <ul className='pagination'>
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button className='page-link' onClick={() => onPageChange(currentPage - 1)}>
            Anterior
          </button>
        </li>
        {getPageNumbers(currentPage, totalPages).map((item, idx) => (
          <li key={idx} className={`page-item ${item === currentPage ? 'active' : typeof item === 'string' ? 'disabled' : ''}`}>
            {typeof item === 'number' ? (
              <button className='page-link' onClick={() => onPageChange(item)}>
                {item}
              </button>
            ) : (
              <span className='page-link'>{item}</span>
            )}
          </li>
        ))}
        <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
          <button className='page-link' onClick={() => onPageChange(currentPage + 1)}>
            Siguiente
          </button>
        </li>
      </ul>
    </div>
  )
}

export default SharedPagination
