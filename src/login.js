// src/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';

function Login({ setToken, apiUrl }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${apiUrl}/auth/login`, form);  // Usa apiUrl
      setToken(res.data.token);
    } catch (err) {
      console.error("Error de conexión:", err);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 10,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" mb={3} textAlign="center">
        Iniciar sesión
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Usuario"
          name="username"
          value={form.username}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          margin="normal"
          required
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{ mt: 2 }}
        >
          Entrar
        </Button>
      </form>
    </Box>
  );
}

export default Login;
