<?php

namespace App\Services;

use App\Models\ActivityLog;

/**
 * Service d'historisation des actions utilisateurs dans MongoDB.
 *
 * Centralise la logique d'écriture des événements d'audit pour éviter de
 * dupliquer la création de documents ActivityLog dans les contrôleurs.
 * Toutes les méthodes sont statiques car le service ne porte pas d'état.
 *
 * Le timestamp est fixé en ISO 8601 (UTC) pour faciliter les requêtes
 * temporelles dans MongoDB.
 *
 * Tous les appels à ces méthodes dans les contrôleurs sont enveloppés dans
 * un try/catch qui logue un warning Laravel : si MongoDB est indisponible,
 * l'application principale continue de fonctionner.
 */
class ActivityLogService
{
    /**
     * Enregistre une consultation de formation (par un utilisateur connecté ou anonyme).
     * Sert au reporting "formations les plus consultées".
     */
    public static function consultationFormation(int $formationId, ?int $userId): void
    {
        ActivityLog::create([
            'event'        => 'course_view',
            'user_id'      => $userId,
            'formation_id' => $formationId,
            'timestamp'    => now()->toISOString(),
        ]);
    }

    /**
     * Enregistre une inscription d'apprenant à une formation.
     */
    public static function inscriptionFormation(int $formationId, int $userId): void
    {
        ActivityLog::create([
            'event'        => 'course_enrollment',
            'user_id'      => $userId,
            'formation_id' => $formationId,
            'timestamp'    => now()->toISOString(),
        ]);
    }

    /**
     * Enregistre la création d'une nouvelle formation par un formateur.
     */
    public static function creationFormation(int $formationId, int $userId): void
    {
        ActivityLog::create([
            'event'        => 'course_creation',
            'user_id'      => $userId,
            'formation_id' => $formationId,
            'timestamp'    => now()->toISOString(),
        ]);
    }

    /**
     * Enregistre une modification de formation avec un diff complet (avant / après).
     *
     * old_values et new_values contiennent les colonnes ayant changé, ce qui
     * permet de reconstituer l'historique de la formation dans le temps.
     */
    public static function modificationFormation(int $formationId, int $userId, array $oldValues, array $newValues): void
    {
        ActivityLog::create([
            'event'        => 'course_update',
            'user_id'      => $userId,
            'formation_id' => $formationId,
            'old_values'   => $oldValues,
            'new_values'   => $newValues,
            'timestamp'    => now()->toISOString(),
        ]);
    }

    /**
     * Enregistre la suppression d'une formation (avant que l'enregistrement MySQL ne disparaisse).
     */
    public static function suppressionFormation(int $formationId, int $userId): void
    {
        ActivityLog::create([
            'event'        => 'course_deletion',
            'user_id'      => $userId,
            'formation_id' => $formationId,
            'timestamp'    => now()->toISOString(),
        ]);
    }
}
