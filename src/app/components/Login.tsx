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
    <div
      className="container-fluid"
      style={{
        fontFamily: atisaStyles.fonts.secondary,
        height: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        padding: '20px',
        overflow: 'hidden'
      }}
    >
      <div
        className="row justify-content-center h-100"
        style={{ height: '100vh' }}
      >
        <div
          className="col-md-5 col-lg-4 col-xl-3"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 15px 40px rgba(0, 80, 92, 0.15)',
              border: `1px solid ${atisaStyles.colors.light}`,
              padding: '30px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Header con logo */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: `2px solid ${atisaStyles.colors.primary}`
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: atisaStyles.colors.primary,
                  borderRadius: '50%',
                  margin: '0 auto 15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0, 80, 92, 0.3)'
                }}
              >
                <i
                  className="bi bi-shield-check"
                  style={{
                    fontSize: '30px',
                    color: 'white'
                  }}
                ></i>
              </div>
              <h2
                style={{
                  fontFamily: atisaStyles.fonts.primary,
                  color: atisaStyles.colors.primary,
                  fontWeight: 'bold',
                  margin: '0',
                  fontSize: '1.6rem'
                }}
              >
                ATISA
              </h2>
              <p
                style={{
                  fontFamily: atisaStyles.fonts.secondary,
                  color: atisaStyles.colors.dark,
                  margin: '6px 0 0 0',
                  fontSize: '0.9rem'
                }}
              >
                Gestión Calendario / Documental
              </p>
            </div>

            {error && (
              <Alert
                variant="danger"
                style={{
                  backgroundColor: '#f8d7da',
                  border: `1px solid #f5c6cb`,
                  color: '#721c24',
                  borderRadius: '6px',
                  fontFamily: atisaStyles.fonts.secondary,
                  marginBottom: '15px',
                  fontSize: '13px',
                  padding: '8px 12px'
                }}
              >
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                variant="success"
                style={{
                  backgroundColor: '#d4edda',
                  border: `1px solid #c3e6cb`,
                  color: '#155724',
                  borderRadius: '6px',
                  fontFamily: atisaStyles.fonts.secondary,
                  marginBottom: '15px',
                  fontSize: '13px',
                  padding: '8px 12px'
                }}
              >
                <i className="bi bi-check-circle me-2"></i>
                {success}
              </Alert>
            )}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    color: atisaStyles.colors.primary,
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}
                >
                  <i className="bi bi-person me-2"></i>
                  Usuario
                </Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    border: `2px solid ${atisaStyles.colors.light}`,
                    borderRadius: '6px',
                    fontFamily: atisaStyles.fonts.secondary,
                    fontSize: '13px',
                    padding: '10px 14px',
                    height: '42px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.accent
                    e.target.style.boxShadow = `0 0 0 2px rgba(0, 161, 222, 0.1)`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.light
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    color: atisaStyles.colors.primary,
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}
                >
                  <i className="bi bi-key me-2"></i>
                  API Key
                </Form.Label>
                <Form.Control
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  style={{
                    border: `2px solid ${atisaStyles.colors.light}`,
                    borderRadius: '6px',
                    fontFamily: atisaStyles.fonts.secondary,
                    fontSize: '13px',
                    padding: '10px 14px',
                    height: '42px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.accent
                    e.target.style.boxShadow = `0 0 0 2px rgba(0, 161, 222, 0.1)`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.light
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button
                  type="submit"
                  style={{
                    backgroundColor: atisaStyles.colors.secondary,
                    border: `2px solid ${atisaStyles.colors.secondary}`,
                    color: 'white',
                    fontFamily: atisaStyles.fonts.secondary,
                    fontWeight: '600',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '14px',
                    height: '42px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 12px rgba(156, 186, 57, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                    e.currentTarget.style.borderColor = atisaStyles.colors.accent
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 161, 222, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                    e.currentTarget.style.borderColor = atisaStyles.colors.secondary
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 3px 12px rgba(156, 186, 57, 0.3)'
                  }}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Iniciar Sesión
                </Button>
                <Button
                  variant="link"
                  onClick={() => setShowModal(true)}
                  style={{
                    color: atisaStyles.colors.accent,
                    fontFamily: atisaStyles.fonts.secondary,
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '13px',
                    padding: '6px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = atisaStyles.colors.primary
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = atisaStyles.colors.accent
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
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
        style={{
          fontFamily: atisaStyles.fonts.secondary
        }}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: atisaStyles.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title
            style={{
              fontFamily: atisaStyles.fonts.primary,
              fontWeight: 'bold',
              color: 'white',
              fontSize: '1.5rem'
            }}
          >
            <i className="bi bi-person-plus me-2"></i>
            Crear Nuevo Cliente
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: 'white',
            padding: '24px'
          }}
        >
          <Form onSubmit={handleCreateClient}>
            <Form.Group className="mb-4">
              <Form.Label
                style={{
                  fontFamily: atisaStyles.fonts.primary,
                  color: atisaStyles.colors.primary,
                  fontWeight: '600',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}
              >
                <i className="bi bi-building me-2"></i>
                Nombre del Cliente
              </Form.Label>
              <Form.Control
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ingrese el nombre del cliente"
                required
                style={{
                  border: `2px solid ${atisaStyles.colors.light}`,
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontSize: '14px',
                  padding: '12px 16px',
                  height: '48px',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = atisaStyles.colors.accent
                  e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = atisaStyles.colors.light
                  e.target.style.boxShadow = 'none'
                }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: atisaStyles.colors.dark,
                  border: `2px solid ${atisaStyles.colors.light}`,
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '10px 20px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                  e.currentTarget.style.color = atisaStyles.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = atisaStyles.colors.dark
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancelar
              </Button>
              <Button
                type="submit"
                style={{
                  backgroundColor: atisaStyles.colors.secondary,
                  border: `2px solid ${atisaStyles.colors.secondary}`,
                  color: 'white',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(156, 186, 57, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                  e.currentTarget.style.borderColor = atisaStyles.colors.accent
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 161, 222, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                  e.currentTarget.style.borderColor = atisaStyles.colors.secondary
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(156, 186, 57, 0.3)'
                }}
              >
                <i className="bi bi-check-circle me-2"></i>
                Crear Cliente
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};
