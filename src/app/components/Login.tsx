import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../modules/auth/core/Auth';

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
    <div className="container mt-5">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleLogin}>
        <Form.Group className="mb-3">
          <Form.Label>Usuario</Form.Label>
          <Form.Control
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>API Key</Form.Label>
          <Form.Control
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary">
          Iniciar Sesión
        </Button>
        <Button variant="link" onClick={() => setShowModal(true)}>
          Crear nuevo cliente
        </Button>
      </Form>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateClient}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Cliente</Form.Label>
              <Form.Control
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ingrese el nombre del cliente"
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary">
              Crear Cliente
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};
