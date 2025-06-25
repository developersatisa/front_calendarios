import { useState } from 'react';
import { authService } from '../api/auth';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const ADMIN_KEY = "7oK4Me0ChuaM3@1Hu3V0@666";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.login(username, apiKey);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      setSuccess('Login exitoso');
      // Aquí puedes redirigir al usuario o actualizar el estado de la app
    } catch (err) {
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
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>API Key</Form.Label>
          <Form.Control
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
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
