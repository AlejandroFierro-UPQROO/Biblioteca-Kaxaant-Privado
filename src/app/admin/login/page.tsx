'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import axios from 'axios';

const API_URL = 'https://apps.upqroo.edu.mx/biblioteca';

const Login = () => {
  const unameRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const btnContainerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLInputElement>(null);

  const [areInputsEmpty, setAreInputsEmpty] = useState(true);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('');
  const [buttonPositionIndex, setButtonPositionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const positions = [
    'translate-x-[-120%]',
    'translate-y-[-150%]',
    'translate-x-[120%]',
    'translate-y-[150%]'
  ];

  const router = useRouter();

  const showMsg = () => {
    const isEmpty = (unameRef.current?.value === '' || passRef.current?.value === '');
    setAreInputsEmpty(isEmpty);
  };

  const resetButton = () => {
    setMessage('Ahora puedes continuar');
    setMessageColor('#92ff92');
    if (btnRef.current) {
      btnRef.current.disabled = false;
    }
  };

  const shiftButton = () => {
    showMsg();
    if (!areInputsEmpty) return;
    setButtonPositionIndex((prevIndex) => (prevIndex + 1) % positions.length);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = unameRef.current?.value;
    const password = passRef.current?.value;

    if (!username || !password) {
      setMessage('Por favor, complete los campos antes de continuar');
      setMessageColor('rgb(218 49 49)');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/admin/login`,
        {
          Usuario: username,
          Password: password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (data.token) {
        localStorage.setItem('token', data.token);
        router.push('/admin/dash');
      } else {
        setMessage(data.message || 'Credenciales inválidas');
        setMessageColor('rgb(218 49 49)');
      }
    } catch (error) {
      console.error('Error en login:', error);
      let errorMessage = 'Error al conectar con el servidor.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      setMessage(errorMessage);
      setMessageColor('rgb(218 49 49)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-[#193e61] mb-1">Biblioteca Kaxaant</h1>
          <p className="text-sm text-gray-500">Panel de administración</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Usuario */}
          <div className="relative mb-5">
            <i className="fa fa-user absolute text-sm left-2.5 bottom-2.5 text-[#a2a2a2]"></i>
            <input
              type="text"
              placeholder="Correo electrónico"
              id="user"
              ref={unameRef}
              onInput={showMsg}
              className="block outline-none w-full border-none text-base text-[#d2d2d2]
                         my-6 mb-1.5 caret-[#cccccc] bg-transparent pb-1 pl-6 border-b border-b-[#404040]"
            />
          </div>

          {/* Contraseña */}
          <div className="relative mb-6">
            <i className="fa fa-lock absolute text-sm right-2.5 bottom-2.5 text-[#a2a2a2]"></i>
            <input
              type="password"
              placeholder="Contraseña"
              id="pass"
              ref={passRef}
              onInput={showMsg}
              className="block outline-none w-full border-none text-base text-[#d2d2d2]
                         my-6 mb-1.5 caret-[#cccccc] bg-transparent pb-1 pr-6 border-b border-b-[#404040]"
            />
          </div>

          {/* Mensaje de error/éxito */}
          {message && (
            <p className="text-sm text-center mb-4" style={{ color: messageColor }}>
              {message}
            </p>
          )}

          {/* Botón */}
          <div
            className="p-5 transition-all duration-200 ease-linear"
            onMouseEnter={shiftButton}
            onTouchStart={shiftButton}
            ref={btnContainerRef}
          >
            {isLoading ? (
              <div className="my-6 flex justify-center items-center">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10 border-t-[#ffffff] animate-spin"></div>
              </div>
            ) : (
              <input
                type="submit"
                id="login-btn"
                value="Login"
                className={`p-1.5 px-5 border-none bg-[#193e61] text-white font-semibold text-base
                            rounded-[15px] transition-all duration-300 my-6
                            ${areInputsEmpty ? positions[buttonPositionIndex] : 'translate-x-0 translate-y-0'}`}
                ref={btnRef}
                onMouseEnter={shiftButton}
                onTouchStart={shiftButton}
                disabled={areInputsEmpty}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
