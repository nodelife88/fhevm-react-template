"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaUser } from "react-icons/fa";
import { useFHESealrContracts } from "@/hooks/useFHESealr";
import { useFHESealrStore } from "@/store/useFHESealrStore";
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useFHESealrContracts();

  const { contractIsReady } = useFHESealrStore();
  const { 
    loading, 
    error, 
    profile,
    nameExists, 
    updateProfile,
    setError,
    getProfile 
  } = useFHESealrLoginStore();

  useEffect(() => {
    if (profile && isOpen) {
      setName(profile.name || "");
      setAvatarUrl(profile.avatarUrl || "");
    } else if (isOpen && !profile) {
      setName("");
      setAvatarUrl("");
    }
  }, [profile, isOpen]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (name !== profile?.name) {
      if (await nameExists(name)) {
        return;
      }
    }

    try {
      await updateProfile(name, avatarUrl.trim());
      await getProfile();
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
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
            Edit Your Profile
          </h2>
          <p className="text-muted-foreground mt-2">
            Update your name and avatar URL
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
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
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
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
            />
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={loading || !name.trim() || !contractIsReady}
            className="w-full h-11"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="flex flex-col gap-3">
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

export default EditProfileModal;

