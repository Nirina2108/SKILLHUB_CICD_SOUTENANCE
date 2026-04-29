package com.example.auth.dto;

/**
 * Payload reçu sur POST /api/auth/login.
 *
 * Contient la preuve HMAC calculée par le client et envoyée au serveur :
 *  - email     : identifie l'utilisateur dont la preuve doit être vérifiée
 *  - nonce     : valeur unique reçue du serveur lors de l'init du challenge
 *  - timestamp : moment du calcul de la preuve (anti-rejeu temporel)
 *  - hmac      : signature HMAC-SHA-256 de "email:nonce:timestamp" avec le
 *                password comme clé secrète
 */
public class LoginRequest {

    private String email;
    private String nonce;
    private long timestamp;
    private String hmac;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNonce() { return nonce; }
    public void setNonce(String nonce) { this.nonce = nonce; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getHmac() { return hmac; }
    public void setHmac(String hmac) { this.hmac = hmac; }
}