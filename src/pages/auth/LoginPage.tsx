import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Science } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { setTokens } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError(null);
      setIsLoading(true);

      const response = await authApi.login({
        username: data.username,
        password: data.password,
      });

      setTokens(response.accessToken, response.refreshToken);
      useAuthStore.getState().setUser({
        userId: response.userId,
        username: response.username,
        tenantId: response.tenantId,
        branchId: response.branchId,
        permissions: response.permissions ?? [],
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
        backgroundAttachment: 'fixed',
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white',
            padding: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Science sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, margin: 0 }}>
              LabSphere LIMS
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Laboratory Information Management System
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ padding: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {apiError && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {apiError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Username"
              placeholder="Enter your username"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              margin="normal"
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                marginTop: 3,
                paddingY: 1.5,
                backgroundColor: '#1e3c72',
                '&:hover': {
                  backgroundColor: '#2a5298',
                },
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
