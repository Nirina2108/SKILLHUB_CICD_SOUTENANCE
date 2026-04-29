package com.example.auth.repository;

import com.example.auth.entity.AuthNonce;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository Spring Data JPA pour la table auth_nonce (anti-rejeu).
 *
 * Sert à vérifier qu'un nonce reçu lors d'une tentative d'authentification
 * n'a pas déjà été consommé pour le même utilisateur. La contrainte unique
 * (user_id, nonce) en base est doublée d'une vérification logicielle via
 * findByUserAndNonce qui permet de retrouver un nonce existant et de
 * consulter son flag consumed et son expiration.
 *
 * @author Poun
 * @version 3.3
 */
public interface AuthNonceRepository extends JpaRepository<AuthNonce, Long> {

    /**
     * Recherche un nonce par couple (utilisateur, valeur).
     * Utilisé avant chaque login pour vérifier que le nonce reçu :
     *  - existe bien pour cet utilisateur,
     *  - n'a pas déjà été consommé (consumed=false),
     *  - n'est pas expiré (expiresAt dans le futur).
     */
    Optional<AuthNonce> findByUserAndNonce(User user, String nonce);
}