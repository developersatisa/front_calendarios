import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../modules/auth/core/Auth';
import { atisaStyles } from '../styles/atisaStyles';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const ADMIN_KEY = "7oK4Me0ChuaM3@1Hu3V0@666";
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Usar authService que ahora está unificado con el sistema de Metronic
      const response = await authService.login(username, apiKey);

      saveAuth({
        api_token: response.access_token,
        refreshToken: response.refresh_token
      });

      setSuccess('Login exitoso');
      navigate('/clientes-documental-calendario');
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError('Error al iniciar sesión');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.createClient(newClientName, ADMIN_KEY);
      setSuccess(`Cliente creado exitosamente:\nCliente: ${response.cliente}\nAPI Key: ${response.api_key}`);
      setShowModal(false);
      setNewClientName('');
    } catch (err) {
      console.error('❌ Error al crear cliente:', err);
      setError('Error al crear cliente. Verifica el nombre del cliente.');
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounceSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
        `}
      </style>
      <div
        className="container-fluid h-screen p-5 overflow-hidden"
        style={{
          fontFamily: atisaStyles.fonts.secondary,
          background: `linear-gradient(135deg, ${atisaStyles.colors.light} 0%, #f8f9fa 50%, ${atisaStyles.colors.light} 100%)`,
          minHeight: '100vh'
        }}
      >
      <div className="row justify-content-center h-100">
        <div className="col-md-5 col-lg-4 col-xl-3 flex flex-col justify-center h-full">
          <div
            className="relative overflow-hidden"
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 80, 92, 0.15)',
              border: `2px solid ${atisaStyles.colors.light}`,
              padding: '40px 32px',
              animation: 'fadeIn 0.6s ease-out'
            }}
          >
            {/* Header con logo según guía técnica */}
            <div
              className="text-center mb-8 pb-6"
              style={{
                borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                paddingBottom: '24px'
              }}
            >
              <div
                className="mx-auto mb-6"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  backgroundColor: atisaStyles.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(0, 80, 92, 0.3)',
                  animation: 'bounceSubtle 2s ease-in-out infinite'
                }}
              >
                <i
                  className="bi bi-shield-check"
                  style={{
                    fontSize: '40px',
                    color: 'white'
                  }}
                ></i>
              </div>
              <h2
                style={{
                  fontFamily: atisaStyles.fonts.primary,
                  color: atisaStyles.colors.primary,
                  fontWeight: 'bold',
                  margin: 0,
                  fontSize: '2.5rem'
                }}
              >
                ATISA
              </h2>
              <p
                style={{
                  fontFamily: atisaStyles.fonts.secondary,
                  color: atisaStyles.colors.dark,
                  margin: '8px 0 0 0',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}
              >
                Gestión Calendario / Documental
              </p>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  color: '#721c24',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className="bi bi-exclamation-triangle me-2" style={{ fontSize: '18px', color: '#721c24' }}></i>
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  color: '#155724',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className="bi bi-check-circle me-2" style={{ fontSize: '18px', color: '#155724' }}></i>
                {success}
              </div>
            )}

            <Form onSubmit={handleLogin}>
              <Form.Group style={{ marginBottom: '24px' }}>
                <Form.Label
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    color: atisaStyles.colors.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <i
                    className="bi bi-person me-2"
                    style={{
                      fontSize: '16px',
                      color: atisaStyles.colors.primary
                    }}
                  ></i>
                  Usuario
                </Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Ingrese su nombre de usuario"
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    fontSize: '14px',
                    padding: '12px 16px',
                    height: '48px',
                    border: `2px solid ${atisaStyles.colors.light}`,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.accent
                    e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.light
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </Form.Group>

              <Form.Group style={{ marginBottom: '32px' }}>
                <Form.Label
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    color: atisaStyles.colors.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <i
                    className="bi bi-key me-2"
                    style={{
                      fontSize: '16px',
                      color: atisaStyles.colors.primary
                    }}
                  ></i>
                  API Key
                </Form.Label>
                <Form.Control
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  placeholder="Ingrese su clave API"
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    fontSize: '14px',
                    padding: '12px 16px',
                    height: '48px',
                    border: `2px solid ${atisaStyles.colors.light}`,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.accent
                    e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.light
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </Form.Group>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Button
                  type="submit"
                  style={{
                    backgroundColor: atisaStyles.colors.secondary,
                    border: 'none',
                    borderRadius: '12px',
                    height: '48px',
                    fontFamily: atisaStyles.fonts.secondary,
                    fontWeight: '600',
                    fontSize: '16px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(156, 186, 57, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 161, 222, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(156, 186, 57, 0.3)'
                  }}
                >
                  <i
                    className="bi bi-box-arrow-in-right me-2"
                    style={{ fontSize: '18px', color: 'white' }}
                  ></i>
                  Iniciar Sesión
                </Button>
                <Button
                  variant="link"
                  onClick={() => setShowModal(true)}
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    color: atisaStyles.colors.accent,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '12px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                    e.currentTarget.style.color = atisaStyles.colors.primary
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = atisaStyles.colors.accent
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <i
                    className="bi bi-plus-circle me-2"
                    style={{ fontSize: '16px', color: atisaStyles.colors.accent }}
                  ></i>
                  Crear nuevo cliente
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        style={{ fontFamily: atisaStyles.fonts.secondary }}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: atisaStyles.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '12px 12px 0 0',
            padding: '20px 24px'
          }}
        >
          <Modal.Title
            style={{
              fontFamily: atisaStyles.fonts.primary,
              fontWeight: 'bold',
              fontSize: '1.5rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <i
              className="bi bi-person-plus me-2"
              style={{ fontSize: '20px', color: 'white' }}
            ></i>
            Crear Nuevo Cliente
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: 'white',
            padding: '32px 24px',
            borderRadius: '0 0 12px 12px'
          }}
        >
          <Form onSubmit={handleCreateClient}>
            <Form.Group style={{ marginBottom: '24px' }}>
              <Form.Label
                style={{
                  fontFamily: atisaStyles.fonts.primary,
                  color: atisaStyles.colors.primary,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i
                  className="bi bi-building me-2"
                  style={{
                    fontSize: '16px',
                    color: atisaStyles.colors.primary
                  }}
                ></i>
                Nombre del Cliente
              </Form.Label>
              <Form.Control
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ingrese el nombre del cliente"
                required
                style={{
                  fontFamily: atisaStyles.fonts.secondary,
                  fontSize: '14px',
                  padding: '12px 16px',
                  height: '48px',
                  border: `2px solid ${atisaStyles.colors.light}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = atisaStyles.colors.accent
                  e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = atisaStyles.colors.light
                  e.target.style.boxShadow = 'none'
                }}
              />
            </Form.Group>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: atisaStyles.colors.primary,
                  border: `2px solid ${atisaStyles.colors.primary}`,
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '10px 20px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = atisaStyles.colors.primary
                }}
              >
                <i className="bi bi-x-circle me-2" style={{ fontSize: '14px', color: atisaStyles.colors.primary }}></i>
                Cancelar
              </Button>
              <Button
                type="submit"
                style={{
                  backgroundColor: atisaStyles.colors.secondary,
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '10px 20px',
                  color: 'white',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                }}
              >
                <i className="bi bi-check-circle me-2" style={{ fontSize: '14px', color: 'white' }}></i>
                Crear Cliente
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      </div>
    </>
  );
};
