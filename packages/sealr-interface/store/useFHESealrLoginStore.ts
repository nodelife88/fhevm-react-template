import { create } from "zustand";
import { TransactionResponse } from "ethers";
import { useFHESealrStore } from "./useFHESealrStore";

import { UserProfile } from "@/types";

type FHESealrLoginStore = {
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
  profiles: UserProfile[] | [];

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  nameExists: (name: string) => Promise<boolean>;
  getProfile: () => Promise<UserProfile | null>;
  getProfiles: () => Promise<UserProfile[] | []>;
  createProfile: (name: string, avatarUrl?: string) => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  clearState: () => void;
};

export const useFHESealrLoginStore = create<FHESealrLoginStore>(
  (set, get) => ({
    error: null,
    loading: false,
    profile: null,
    profiles: [],

    setError: (error: string | null) => set({ error }),
    setLoading: (loading: boolean) => set({ loading }),
    setProfile: (profile: UserProfile | null) => set({ profile }),

    nameExists: async (name: string): Promise<boolean> => {
        const { contractView } = useFHESealrStore.getState();

      try {
        const exists: boolean = await contractView?.nameExists(name);
        set({ error: exists ? "This name already exists." : null });
        return exists;
      } catch (err) {
        return false;
      }
    },

    createProfile: async (name: string, avatarUrl: string = ""): Promise<void> => {
        const { contractTx } = useFHESealrStore.getState();
      set({ loading: true, error: null });

      try {
        const tx: TransactionResponse = await contractTx?.createProfile(
          name,
          avatarUrl
        );

        await tx.wait();
      } catch (err: any) {
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    updateProfile: async (name: string, avatarUrl: string = ""): Promise<void> => {
        const { contractTx } = useFHESealrStore.getState();
      set({ loading: true, error: null });

      try {
        const tx: TransactionResponse = await contractTx?.updateProfile(
          name,
          avatarUrl
        );

        await tx.wait();
        
        await get().getProfile();
        await get().getProfiles();
      } catch (err: any) {
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    getProfile: async (): Promise<UserProfile | null> => {
        const { contractTx } = useFHESealrStore.getState();

      try {
        const profile = await contractTx?.getProfile();

        const result: UserProfile | null = profile
          ? {
            id: profile.name ?? "",
            wallet: profile.wallet ?? "",
            name: profile.name ?? "",
            avatarUrl: profile.avatarUrl ?? "",
            createdAt: Number(profile.createdAt ?? 0),
            active: profile.active ?? false,
          }
          : null;

        set({ profile: result });
        return result;
      } catch (err) {
        return null;
      }
    },

    getProfiles: async (): Promise<UserProfile[]> => {
        const { contractView } = useFHESealrStore.getState();

      try {
        const profiles = await contractView?.getProfiles();

        const result: UserProfile[] = profiles?.map((profile: any) => ({
          id: profile.name ?? "",
          wallet: profile.wallet ?? "",
          name: profile.name ?? "",
          avatarUrl: profile.avatarUrl ?? "",
          createdAt: Number(profile.createdAt ?? 0),
          active: profile.active ?? false,
        })) ?? [];

        set({ profiles: result });
        return result;
      } catch (err) {
        return [];
      }
    },

    clearState: () => {
      set({
        loading: false,
        error: null,
        profile: null,
        profiles: [],
      });
    },
  })
);
