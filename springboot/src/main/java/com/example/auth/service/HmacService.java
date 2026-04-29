package com.example.auth.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Service utilitaire de calcul de signatures HMAC-SHA-256.
 *
 * Utilisé par le mécanisme d'authentification challenge-response :
 *  - Côté client : calcule HMAC(password, email + nonce + timestamp) pour
 *    prouver la connaissance du mot de passe sans le transmettre en clair.
 *  - Côté serveur : recalcule la même signature avec le password stocké et
 *    compare. Si égales, l'authentification est valide.
 *
 * Le format canonique du message (email:nonce:timestamp) est fixe pour
 * garantir que client et serveur calculent exactement la même chose.
 * Toute différence de format conduit à une signature différente et donc
 * à un échec d'authentification.
 *
 * @author Poun
 * @version 3.3
 */
@Service
public class HmacService {

    /**
     * Secret par défaut utilisé seulement par generateHmac() pour les tests
     * unitaires. Les vraies signatures de prod passent par hmacSha256() avec
     * le mot de passe (ou une dérivée) comme secret.
     */
    private static final String SECRET = "secret";

    /**
     * Concatène les composants en un message canonique à signer.
     * Le séparateur ":" empêche toute ambiguïté entre les valeurs (par exemple
     * un email contenant un nonce).
     *
     * @param email email utilisateur
     * @param nonce nonce aléatoire généré côté serveur
     * @param timestamp timestamp epoch en secondes (anti-rejeu)
     * @return chaîne à signer
     */
    public String buildMessage(String email, String nonce, long timestamp) {
        return email + ":" + nonce + ":" + timestamp;
    }

    /**
     * Calcule un HMAC SHA-256 puis encode le résultat en Base64.
     *
     * @param secret secret partagé
     * @param data message à signer
     * @return signature HMAC
     */
    public String hmacSha256(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("Erreur pendant le calcul du HMAC", e);
        }
    }

    /**
     * Méthode simple utilisée par les tests.
     * Elle calcule le HMAC avec le secret par défaut.
     *
     * @param data message à signer
     * @return signature HMAC
     */
    public String generateHmac(String data) {
        return hmacSha256(SECRET, data);
    }
}