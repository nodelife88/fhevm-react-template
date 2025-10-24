"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaUser } from "react-icons/fa";
import { LogOut } from "lucide-react";
import { useFHESealrContracts } from "@/hooks/useFHESealr";
import { useFHESealrStore } from "@/store/useFHESealrStore";
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore";
import { useDisconnect } from "@/utils/auth";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const { disconnect } = useDisconnect();

  // Initialize contracts
  useFHESealrContracts();

  const { contractIsReady } = useFHESealrStore();
  const { 
    loading, 
    error, 
    nameExists, 
    createProfile,
    setError 
  } = useFHESealrLoginStore();

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (await nameExists(name)) {
      return; // Error is set in nameExists function
    }

    try {
      await createProfile(name);
      // Only redirect if profile creation was successful
      router.push('/chat');
      onClose();
    } catch (err) {
      console.error('Error creating profile:', err);
      // Don't redirect on error - user rejected transaction or other error occurred
      setError('Failed to create profile. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onClose();
    } catch (error) {
      console.error("Error during disconnect:", error);
      // Still close modal even if disconnect fails
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background border border-border rounded-lg p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <FaUser className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Create Your Profile
          </h2>
          <p className="text-muted-foreground mt-2">
            Choose a name for your profile to get started
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center border border-input rounded-md overflow-hidden h-11 bg-background">
            <div className="px-3 text-muted-foreground flex items-center">
              <FaUser size={14} />
            </div>
            <Input
              type="text"
              value={name}
              placeholder="Your name"
              className="w-full py-2 px-2 focus:outline-none text-foreground text-sm bg-transparent border-0"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
            />
          </div>

          <Button
            onClick={handleCreateProfile}
            disabled={loading || !name.trim()}
            className="w-full h-11"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleDisconnect}
            variant="outline"
            disabled={loading}
            className="w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            Disconnect Wallet
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
