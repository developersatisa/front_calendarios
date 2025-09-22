import {useIntl} from 'react-intl'
import {MenuItem} from './MenuItem'

export function MenuInner() {
  const intl = useIntl()
  return (
    <>
      <MenuItem title={intl.formatMessage({id: 'MENU.DOCUMENTAL_CALENDAR'})} to='/clientes-documental-calendario' />
      <MenuItem title={intl.formatMessage({id: 'MENU.DASHBOARD'})} to='/dashboard' />
    </>
  )
}
