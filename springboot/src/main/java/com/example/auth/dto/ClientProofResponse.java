package com.example.auth.dto;

/**
 * Payload retourné par POST /api/auth/client-proof (endpoint démo).
 *
 * Contient tous les éléments qu'un VRAI client (navigateur ou app mobile)
 * devrait calculer localement avant d'appeler /api/auth/login :
 *  - email      : repris de la requête
 *  - nonce      : valeur aléatoire générée par le serveur (UUID)
 *  - timestamp  : moment du calcul en epoch secondes
 *  - message    : "email:nonce:timestamp" (chaîne canonique signée)
 *  - hmac       : signature HMAC-SHA-256 du message avec le password en clé
 *
 * Ces 4 derniers champs sont à recopier dans LoginRequest pour s'authentifier.
 *
 * @author Poun
 * @version 3.2
 */
public class ClientProofResponse {

    /**
     * Email.
     */
    private String email;

    /**
     * Nonce généré.
     */
    private String nonce;

    /**
     * Timestamp epoch secondes.
     */
    private long timestamp;

    /**
     * Message signé.
     */
    private String message;

    /**
     * HMAC calculé.
     */
    private String hmac;

    /**
     * Retourne l'email.
     *
     * @return email
     */
    public String getEmail() {
        return email;
    }

    /**
     * Modifie l'email.
     *
     * @param email nouvel email
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Retourne le nonce.
     *
     * @return nonce
     */
    public String getNonce() {
        return nonce;
    }

    /**
     * Modifie le nonce.
     *
     * @param nonce nouveau nonce
     */
    public void setNonce(String nonce) {
        this.nonce = nonce;
    }

    /**
     * Retourne le timestamp.
     *
     * @return timestamp
     */
    public long getTimestamp() {
        return timestamp;
    }

    /**
     * Modifie le timestamp.
     *
     * @param timestamp nouveau timestamp
     */
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * Retourne le message signé.
     *
     * @return message
     */
    public String getMessage() {
        return message;
    }

    /**
     * Modifie le message signé.
     *
     * @param message nouveau message
     */
    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * Retourne le HMAC.
     *
     * @return hmac
     */
    public String getHmac() {
        return hmac;
    }

    /**
     * Modifie le HMAC.
     *
     * @param hmac nouveau hmac
     */
    public void setHmac(String hmac) {
        this.hmac = hmac;
    }
}