export type Address = {
    id: string;
    title: string;
    fullAddress: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: 'HOME' | 'WORK' | 'OTHER';
    coordinates: { latitude: number; longitude: number };
    isDefault: boolean;
};

export type UserAddress = Address;

export type PaymentMethod = {
    id: string;
    type: string;
    lastFour?: string;
    expiryDate?: string;
    cardType?: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    isDefault: boolean;
};

export type ReferralInfo = {
    code: string;
    referralCode?: string;
    invitedCount: number;
    invitationsCount?: number;
    pendingRewards: number;
    totalEarned: number;
    successfulInvites?: number;
};
