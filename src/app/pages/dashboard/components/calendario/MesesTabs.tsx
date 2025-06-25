import {FC} from 'react'

interface Props {
  selectedMonth: number
  onMonthChange: (month: number) => void
}

const MesesTabs: FC<Props> = ({selectedMonth, onMonthChange}) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return (
    <div className='nav-tabs-custom'>
      <ul className='nav nav-tabs nav-tabs-line nav-tabs-bold nav-tabs-line-3x'>
        {months.map((month, index) => (
          <li className='nav-item' key={month}>
            <button
              className={`nav-link ${selectedMonth === index ? 'active' : ''}`}
              onClick={() => onMonthChange(index)}
            >
              {month}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MesesTabs
