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
  const [avatarUrl, setAvatarUrl] = useState("");
  const { disconnect } = useDisconnect();

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
      return;
    }

    try {
      await createProfile(name, avatarUrl.trim());
      router.push('/chat');
      onClose();
    } catch (err) {
      setError('Failed to create profile. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onClose();
    } catch (error) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background border border-border rounded-lg p-6 space-y-6">
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

          <div className="flex items-center border border-input rounded-md overflow-hidden h-11 bg-background">
            <div className="px-3 text-muted-foreground flex items-center">
              <FaUser size={14} />
            </div>
            <Input
              type="url"
              value={avatarUrl}
              placeholder="Avatar URL (optional)"
              className="w-full py-2 px-2 focus:outline-none text-foreground text-sm bg-transparent border-0"
              onChange={(e) => setAvatarUrl(e.target.value)}
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

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

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
