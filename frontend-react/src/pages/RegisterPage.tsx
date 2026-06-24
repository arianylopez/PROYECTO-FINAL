import { RegisterForm } from '../features/auth/RegisterForm';

export const RegisterPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f3460',
      }}
    >
      <RegisterForm />
    </div>
  );
};
