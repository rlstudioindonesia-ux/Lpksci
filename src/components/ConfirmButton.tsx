import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmModal } from './ConfirmModal';

interface ConfirmButtonProps {
  onConfirmClick: () => void | Promise<any>;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

export function ConfirmButton({
  onConfirmClick,
  confirmTitle = "Konfirmasi Aksi",
  confirmMessage = "Apakah Anda yakin ingin melanjutkan?",
  confirmLabel,
  cancelLabel = "Batal",
  children,
  type = "button",
  disabled,
  ...rest
}: ConfirmButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await Promise.resolve(onConfirmClick());
    } catch (err) {
      console.error("Error executing confirm action:", err);
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button 
        type={type} 
        onClick={handleClick} 
        disabled={disabled || isSubmitting} 
        {...rest}
      >
        {children}
      </button>
      {isModalOpen && createPortal(
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirm}
          title={confirmTitle}
          message={confirmMessage}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
        />,
        document.body
      )}
    </>
  );
}
