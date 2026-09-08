import { useState } from 'react';

import ActionConfirmModal from '@/components/common/ActionConfirmModal';
import { Button } from '@/components/ui/button';

/**
 * Example-only patterns for ActionConfirmModal.
 * Copy the relevant block into a page — this file is not routed.
 */
export function ConfirmationExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Confirm order</Button>
      <ActionConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        variant="confirmation"
        title="Confirm this order?"
        description="The kitchen will start preparing these items."
        confirmText="Confirm"
        isLoading={isLoading}
      />
    </>
  );
}

export function WarningExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="orange" onClick={() => setIsOpen(true)}>
        Close table
      </Button>
      <ActionConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => setIsOpen(false)}
        variant="warning"
        title="Close this table?"
        description="Guests will no longer be able to place orders on this QR session."
        confirmText="Close table"
      />
    </>
  );
}

export function DangerExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // await api.deleteProduct(productId)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        Delete product
      </Button>
      <ActionConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Delete this product?"
        description="This cannot be undone. Existing order history keeps the product name snapshot."
        confirmText="Delete"
        cancelText="Keep"
        isLoading={isLoading}
      />
    </>
  );
}
