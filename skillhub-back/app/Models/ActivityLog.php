<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model as MongoModel;

/**
 * Modèle ActivityLog : journal d'audit stocké dans MongoDB.
 *
 * Enregistre les événements importants de l'application (création, modification,
 * suppression de formations, inscriptions, consultations) pour analyse postérieure.
 * Le stockage en NoSQL permet d'avoir des champs flexibles (old_values/new_values
 * peuvent contenir n'importe quel diff).
 *
 * Ce modèle étend MongoModel (paquet mongodb/laravel-mongodb) au lieu du modèle
 * Eloquent standard pour cibler la connexion MongoDB définie dans config/database.php.
 */
class ActivityLog extends MongoModel
{
    /**
     * Connexion MongoDB nommée dans config/database.php (clé "mongodb").
     */
    protected $connection = 'mongodb';

    /**
     * Nom de la collection MongoDB qui stocke les logs.
     */
    protected $collection = 'activity_logs';

    /**
     * Champs autorisés en mass-assignment.
     *
     * event       : identifiant de l'événement (ex: "formation.creation")
     * user_id     : utilisateur qui a déclenché l'événement (null si anonyme)
     * formation_id / module_id : ressources concernées
     * old_values  : valeurs avant modification (pour les events de type update)
     * new_values  : valeurs après modification
     * timestamp   : date de l'événement (peut différer du created_at MongoDB)
     */
    protected $fillable = [
        'event',
        'user_id',
        'formation_id',
        'module_id',
        'old_values',
        'new_values',
        'timestamp',
    ];
}
