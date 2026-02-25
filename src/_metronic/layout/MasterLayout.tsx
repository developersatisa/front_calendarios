import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { HeaderWrapper } from './components/header'
import { RightToolbar } from '../partials/layout/RightToolbar'
import { ScrollTop } from './components/scroll-top'
import { FooterWrapper } from './components/footer'
import { Sidebar } from './components/sidebar'
import { ActivityDrawer, DrawerMessenger, InviteUsers, UpgradePlan } from '../partials'
import { PageDataProvider } from './core'
import { reInitMenu } from '../helpers'
import DocumentSearchChat from '../../app/components/DocumentSearchChat'
import { Bot, X } from 'lucide-react'
import { useState } from 'react'

const MasterLayout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    reInitMenu()
  }, [location.key])

  return (
    <PageDataProvider>
      <div className='d-flex flex-column flex-root app-root' id='kt_app_root'>
        <div className='app-page flex-column flex-column-fluid' id='kt_app_page'>
          <HeaderWrapper />
          <div className='app-wrapper flex-column flex-row-fluid' id='kt_app_wrapper'>
            <Sidebar />
            <div className='app-main flex-column flex-row-fluid' id='kt_app_main'>
              <div className='d-flex flex-column flex-column-fluid'>
                <Outlet />
              </div>
              <FooterWrapper />
            </div>
          </div>
        </div>
      </div>

      {/* begin:: Drawers */}
      <ActivityDrawer />
      <RightToolbar />
      <DrawerMessenger />
      {/* end:: Drawers */}

      {/* begin:: Modals */}
      <InviteUsers />
      <UpgradePlan />
      {/* end:: Modals */}
      <ScrollTop />

      {/* begin:: RAG Chat Global Flotante */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px'
        }}
      >
        {isChatOpen && (
          <div
            style={{
              width: '400px',
              height: '600px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              position: 'relative'
            }}
            className="animate-slide-up"
          >
            {/* Header overlay para el botón cerrar encima del componente original */}
            <button
              onClick={() => setIsChatOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 50,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              className="text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            <DocumentSearchChat />
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`btn btn-icon btn-custom shadow-sm ${isChatOpen ? 'btn-active-primary bg-primary text-white' : 'bg-primary text-white'}`}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
          }}
          title="Asistente Documental"
        >
          {isChatOpen ? <X size={28} /> : <Bot size={28} />}
        </button>
      </div>
      {/* end:: RAG Chat Global Flotante */}

    </PageDataProvider>
  )
}

export { MasterLayout }
