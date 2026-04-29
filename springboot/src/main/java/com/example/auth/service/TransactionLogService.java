package com.example.auth.service;

import org.springframework.stereotype.Service;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service de journalisation des transactions sensibles dans un fichier dédié.
 *
 * Permet de garder une trace écrite (hors base SQL) de toutes les actions
 * critiques pour la sécurité : inscriptions, connexions (succès/échecs),
 * déconnexions, changements de mot de passe, vérifications d'email.
 *
 * Cette journalisation est COMPLÉMENTAIRE des logs système Spring Boot :
 *  - Permet un audit indépendant si la base est compromise.
 *  - Facilite la conformité (RGPD, certifications) qui demandent un journal
 *    des opérations sur les données personnelles.
 *
 * Format de chaque ligne : [DATE] [ACTION] [EMAIL] [STATUT]
 * Exemple : [2026-04-29T14:30:22] [LOGIN] [user@example.com] [SUCCESS]
 *
 * @author Nirina
 * @version 1.0
 */
@Service
public class TransactionLogService {

    /**
     * Chemin du fichier de log des transactions.
     */
    private static final String LOG_FILE = "logs/transactions.log";

    /**
     * Format de la date dans les logs.
     */
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Enregistre une transaction dans le fichier de log.
     *
     * @param action action effectuee (REGISTER, LOGIN, LOGOUT, etc.)
     * @param email email de l utilisateur
     * @param statut statut de l action (SUCCESS, FAILURE)
     * @param detail detail supplementaire
     */
    public void log(String action, String email, String statut, String detail) {
        String timestamp = LocalDateTime.now().format(FORMATTER);
        String logLine = String.format("[%s] [%s] [%s] [%s] %s",
                timestamp, action, email, statut, detail);

        writeToFile(logLine);
    }

    /**
     * Ecrit une ligne dans le fichier de log.
     * Cree le dossier logs si necessaire.
     *
     * @param logLine ligne a ecrire
     */
    private void writeToFile(String logLine) {
        try {
            java.io.File logsDir = new java.io.File("logs");
            if (!logsDir.exists()) {
                logsDir.mkdirs();
            }

            try (PrintWriter writer = new PrintWriter(new FileWriter(LOG_FILE, true))) {
                writer.println(logLine);
            }
        } catch (IOException e) {
            // On ne bloque pas l application si le log echoue
        }
    }
}