import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmModal } from './ConfirmModal';

interface ConfirmFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement> | any) => void;
  confirmTitle?: string;
  confirmMessage?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function ConfirmForm({ 
  onSubmit, 
  confirmTitle = "Konfirmasi Penyimpanan", 
  confirmMessage = "Apakah Anda yakin ingin menyimpan perubahan data ini?", 
  children, 
  ...rest 
}: ConfirmFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // We can't strictly persist SyntheticEvents nicely if we do e.preventDefault() and keep it asynchronous, 
  // but since we prevent default immediately and only use the event if the original handler didn't rely on 
  // synchronously doing things, it might be fine. BUT, React synthetic events are pooled.
  // Actually, in React 17+, event pooling is removed, so we can keep the event!
  const handleConfirm = () => {
    // Pass a dummy event that has preventDefault
    const dummyEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    onSubmit(dummyEvent);
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} {...rest}>
        {children}
      </form>
      {isModalOpen && createPortal(
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirm}
          title={confirmTitle}
          message={confirmMessage}
        />,
        document.body
      )}
    </>
  );
}
