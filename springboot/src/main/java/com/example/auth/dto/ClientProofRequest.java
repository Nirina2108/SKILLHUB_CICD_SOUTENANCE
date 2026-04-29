package com.example.auth.dto;

/**
 * Payload reçu sur POST /api/auth/client-proof (endpoint démo).
 *
 * Sert à demander au serveur de SIMULER ce que le client devrait calculer
 * localement : la preuve HMAC à partir du couple email + password.
 *
 * En production réelle, ce calcul est fait dans le navigateur ou l'app
 * mobile pour ne JAMAIS transmettre le mot de passe sur le réseau.
 * Cet endpoint existe uniquement pour faciliter les tests Postman / curl
 * pendant la démo de soutenance.
 *
 * @author Poun
 * @version 3.2
 */
public class ClientProofRequest {

    /**
     * Email de l'utilisateur.
     */
    private String email;

    /**
     * Mot de passe saisi côté client.
     */
    private String password;

    /**
     * Retourne l'email.
     *
     * @return email utilisateur
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
     * Retourne le mot de passe.
     *
     * @return mot de passe
     */
    public String getPassword() {
        return password;
    }

    /**
     * Modifie le mot de passe.
     *
     * @param password nouveau mot de passe
     */
    public void setPassword(String password) {
        this.password = password;
    }
}