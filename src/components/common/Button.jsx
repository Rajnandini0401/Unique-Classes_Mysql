import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  to,
  onClick,
  variant = 'gold',
  className = '',
  icon: Icon,
  type = 'button',
  ...props
}) => {
  const variantClass = {
    gold: 'btn-gold',
    primary: 'btn-gold',
    dark: 'btn-dark',
    secondary: 'btn-dark',
    outline: 'btn-outline-gold',
    login: 'btn-login'
  }[variant] || 'btn-gold';

  const fullClassName = `btn ${variantClass} ${className}`;

  if (to) {
    return (
      <Link to={to} className={fullClassName} {...props}>
        {children}
        {Icon && <Icon size={18} />}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={fullClassName} {...props}>
      {children}
      {Icon && <Icon size={18} />}
    </button>
  );
};

export default Button;
