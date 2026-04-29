package com.example.auth.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service de chiffrement RÉVERSIBLE des mots de passe (AES-GCM).
 *
 * Contrairement à BCrypt (hachage à sens unique), ici les mots de passe sont
 * CHIFFRÉS de manière réversible avec AES-256-GCM. Cette particularité est
 * indispensable au protocole HMAC challenge-response : le serveur doit pouvoir
 * récupérer le mot de passe (ou une dérivée déterministe) pour recalculer la
 * preuve HMAC envoyée par le client.
 *
 * En contrepartie, la clé maître AES doit être protégée comme un secret de
 * niveau bancaire (HSM, vault, jamais committée). Si la clé est compromise,
 * tous les mots de passe le sont.
 *
 * Mode AES/GCM/NoPadding : authentifié (intègre le tag d'authentification),
 * pas besoin de padding. Tag de 128 bits, IV aléatoire de 12 octets par chiffrement.
 *
 * Format du résultat : Base64( IV (12 octets) + données chiffrées + tag GCM (16 octets) )
 *
 * @author Poun
 * @version 3.3
 */
@Service
public class PasswordCryptoService {

    /**
     * Algorithme de chiffrement sécurisé.
     * ✅ Fix java:S5542 — AES/GCM/NoPadding (GCM est un mode authentifié,
     * il ne nécessite pas de padding et est recommandé par SonarQube).
     */
    private static final String CIPHER_ALGORITHM = "AES/GCM/NoPadding";

    /**
     * Taille de l'IV recommandée pour GCM : 12 octets (96 bits).
     */
    private static final int IV_SIZE = 12;

    /**
     * Longueur du tag d'authentification GCM : 128 bits.
     */
    private static final int GCM_TAG_LENGTH = 128;

    /**
     * Instance SecureRandom réutilisable.
     * ✅ Fix java:S2119 — objet Random sauvegardé et réutilisé,
     * pas recréé à chaque appel.
     */
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Clé maître serveur lue depuis application.properties.
     */
    @Value("${app.security.smk}")
    private String serverMasterKey;

    /**
     * Clé AES préparée à partir de la SMK.
     */
    private SecretKeySpec secretKeySpec;

    /**
     * Prépare la clé AES sur 16 octets.
     */
    @PostConstruct
    public void init() {
        byte[] keyBytes = serverMasterKey.getBytes(StandardCharsets.UTF_8);
        byte[] finalKey = new byte[16];

        for (int i = 0; i < finalKey.length; i++) {
            if (i < keyBytes.length) {
                finalKey[i] = keyBytes[i];
            } else {
                finalKey[i] = 0;
            }
        }

        this.secretKeySpec = new SecretKeySpec(finalKey, "AES");
    }

    /**
     * Chiffre un texte en AES/GCM/NoPadding puis encode le résultat en Base64.
     *
     * Format : Base64( IV (12 octets) + données chiffrées + tag GCM (16 octets) )
     *
     * @param plainText texte en clair
     * @return texte chiffré encodé en Base64 (IV inclus)
     */
    public String encrypt(String plainText) {
        try {
            // ✅ Fix java:S2119 — utilisation du champ SECURE_RANDOM réutilisable
            byte[] iv = new byte[IV_SIZE];
            SECURE_RANDOM.nextBytes(iv);

            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, gcmSpec);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // On préfixe l'IV aux données chiffrées (+ tag GCM inclus dans encryptedBytes)
            byte[] combined = new byte[IV_SIZE + encryptedBytes.length];
            System.arraycopy(iv, 0, combined, 0, IV_SIZE);
            System.arraycopy(encryptedBytes, 0, combined, IV_SIZE, encryptedBytes.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Erreur pendant le chiffrement du mot de passe", e);
        }
    }

    /**
     * Déchiffre un texte Base64 chiffré en AES/GCM/NoPadding.
     *
     * Attend le format : Base64( IV (12 octets) + données chiffrées + tag GCM )
     *
     * @param encryptedText texte chiffré en Base64 (IV inclus)
     * @return texte en clair
     */
    public String decrypt(String encryptedText) {
        try {
            byte[] combined = Base64.getDecoder().decode(encryptedText);

            // Extraction de l'IV depuis les 12 premiers octets
            byte[] iv = new byte[IV_SIZE];
            byte[] encryptedBytes = new byte[combined.length - IV_SIZE];
            System.arraycopy(combined, 0, iv, 0, IV_SIZE);
            System.arraycopy(combined, IV_SIZE, encryptedBytes, 0, encryptedBytes.length);

            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, gcmSpec);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Erreur pendant le déchiffrement du mot de passe", e);
        }
    }
}