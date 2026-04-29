package com.example.auth.dto;

/**
 * Payload reçu sur PUT /api/auth/change-password.
 *
 * AuthService.changePassword vérifie d'abord que oldPassword correspond
 * au mot de passe actuel (déchiffrement AES-GCM puis comparaison) avant
 * d'écraser avec newPassword. Cela protège contre un attaquant qui aurait
 * volé un JWT mais ne connaîtrait pas le mot de passe.
 *
 * Le nouveau mot de passe est validé par PasswordPolicyValidator avant
 * d'être chiffré et persisté.
 *
 * @author Poun
 * @version 5.0
 */
public class ChangePasswordRequest {

    /**
     * Ancien mot de passe saisi par l'utilisateur.
     */
    private String oldPassword;

    /**
     * Nouveau mot de passe saisi par l'utilisateur.
     */
    private String newPassword;

    /**
     * Retourne l'ancien mot de passe.
     *
     * @return ancien mot de passe
     */
    public String getOldPassword() {
        return oldPassword;
    }

    /**
     * Modifie l'ancien mot de passe.
     *
     * @param oldPassword ancien mot de passe
     */
    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    /**
     * Retourne le nouveau mot de passe.
     *
     * @return nouveau mot de passe
     */
    public String getNewPassword() {
        return newPassword;
    }

    /**
     * Modifie le nouveau mot de passe.
     *
     * @param newPassword nouveau mot de passe
     */
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}