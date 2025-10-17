import React from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'
import { atisaStyles } from '../../styles/atisaStyles'

interface CustomToastProps {
  show: boolean
  onClose: () => void
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  delay?: number
}

const CustomToast: React.FC<CustomToastProps> = ({
  show,
  onClose,
  message,
  type,
  delay = 5000
}) => {
  const getToastStyles = () => {
    const baseStyles = {
      borderRadius: '8px',
      border: 'none',
      boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: show ? 'translateX(0)' : 'translateX(100%)',
      opacity: show ? 1 : 0,
      fontFamily: '"Lato", Arial, sans-serif',
      minWidth: '320px',
      maxWidth: '400px',
    }

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: atisaStyles.toast.success.background,
          borderLeft: `4px solid ${atisaStyles.toast.success.borderLeft}`,
        }
      case 'error':
        return {
          ...baseStyles,
          background: atisaStyles.toast.error.background,
          borderLeft: `4px solid ${atisaStyles.toast.error.borderLeft}`,
        }
      case 'warning':
        return {
          ...baseStyles,
          background: atisaStyles.toast.warning.background,
          borderLeft: `4px solid ${atisaStyles.toast.warning.borderLeft}`,
          color: atisaStyles.toast.warning.textColor,
        }
      case 'info':
        return {
          ...baseStyles,
          background: atisaStyles.toast.info.background,
          borderLeft: `4px solid ${atisaStyles.toast.info.borderLeft}`,
        }
      default:
        return baseStyles
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill'
      case 'error':
        return 'bi-x-circle-fill'
      case 'warning':
        return 'bi-exclamation-triangle-fill'
      case 'info':
        return 'bi-info-circle-fill'
      default:
        return 'bi-info-circle-fill'
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Éxito'
      case 'error':
        return 'Error'
      case 'warning':
        return 'Advertencia'
      case 'info':
        return 'Información'
      default:
        return 'Información'
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return atisaStyles.toast.success.iconColor
      case 'error':
        return atisaStyles.toast.error.iconColor
      case 'warning':
        return atisaStyles.toast.warning.iconColor
      case 'info':
        return atisaStyles.toast.info.iconColor
      default:
        return atisaStyles.colors.primary
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return atisaStyles.toast.success.textColor
      case 'error':
        return atisaStyles.toast.error.textColor
      case 'warning':
        return atisaStyles.toast.warning.textColor
      case 'info':
        return atisaStyles.toast.info.textColor
      default:
        return '#ffffff'
    }
  }

  return (
    <ToastContainer
      position="top-end"
      className="p-3"
      style={{
        zIndex: 9999,
        position: 'fixed',
        top: '20px',
        right: '20px',
      }}
    >
      <Toast
        show={show}
        onClose={onClose}
        delay={delay}
        autohide
        style={getToastStyles()}
        className="custom-toast-atisa"
      >
        <Toast.Header
          closeButton={false}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '16px 20px 8px 20px',
            color: getTextColor(),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: type === 'warning' ? '#00505C' : 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                flexShrink: 0,
              }}
            >
              <i
                className={`bi ${getIcon()}`}
                style={{
                  color: getIconColor(),
                  fontSize: '16px',
                }}
              ></i>
            </div>
            <strong
              className="me-auto"
              style={{
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.025em',
                fontFamily: '"Aleo", Georgia, serif',
                color: getTextColor(),
              }}
            >
              {getTitle()}
            </strong>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: getTextColor(),
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '12px',
                transition: 'all 0.2s ease',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = type === 'warning' ? 'rgba(0, 80, 92, 0.1)' : 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ×
            </button>
          </div>
        </Toast.Header>
        <Toast.Body
          style={{
            padding: '8px 20px 20px 20px',
            color: getTextColor(),
            fontSize: '14px',
            lineHeight: '1.5',
            fontWeight: '400',
            fontFamily: '"Lato", Arial, sans-serif',
          }}
        >
          {message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  )
}

export default CustomToast
