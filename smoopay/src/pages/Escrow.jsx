import React, { useState } from 'react';
import EscrowList from './EscrowList';
import EscrowDetail from './EscrowDetail';
import CreateAgreement from './CreateAgreement';
import { useMockStore } from '../store/MockStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function Escrow() {
  const [selectedEscrowId, setSelectedEscrowId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { fetchAgreements } = useMockStore();

  const handleBackToList = () => {
    setSelectedEscrowId(null);
    setIsCreating(false);
    fetchAgreements(); // Ensure list is fresh when returning
  };

  const handleCreateSuccess = (newId) => {
    console.log("Creation successful, jumping to details. New ID:", newId);
    setIsCreating(false);
    setSelectedEscrowId(newId); // Navigate to details view
    
    // Trigger the refresh of global state
    fetchAgreements();
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CreateAgreement 
              onBack={handleBackToList}
              onSuccess={handleCreateSuccess}
            />
          </motion.div>
        ) : selectedEscrowId ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EscrowDetail 
              escrowId={selectedEscrowId}
              onBack={handleBackToList}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <EscrowList 
              onSelect={setSelectedEscrowId}
              onCreateNew={() => setIsCreating(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
