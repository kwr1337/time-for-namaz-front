import React from 'react';
import Image from 'next/image';
import logo from '../../pic/logo.png';

const LogoLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    background: '#fff',
    zIndex: 9999,
  }}>
    <Image src={logo} alt="Logo" width={200} height={200} />
  </div>
);

export default LogoLoader; 