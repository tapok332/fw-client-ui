export type User = {
    id: string;
    name?: string;
    email: string;
} | null;

export type LoginCredentials = {
    email: string;
    password: string;
};

export type RegisterCredentials = {
    email: string;
    password: string;
    name?: string;
};

// ADR 0013: the response body carries ONLY the access token; the refresh token
// arrives as an httpOnly Set-Cookie that JS cannot read.
export type AuthResponse = {
    accessToken: StoredToken;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
};

export interface StoredToken {
    tokenValue: string;
    expDate: string;
}

export type RefreshTokenResponse = {
    accessToken: StoredToken;
};
