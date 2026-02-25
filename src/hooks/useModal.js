import { useState, useCallback } from 'react';

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');

  const showSuccess = useCallback((msg) => {
    setMessage(msg);
    setType('success');
    setIsOpen(true);
  }, []);

  const showError = useCallback((msg) => {
    setMessage(msg);
    setType('error');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, message, type, showSuccess, showError, close };
}
