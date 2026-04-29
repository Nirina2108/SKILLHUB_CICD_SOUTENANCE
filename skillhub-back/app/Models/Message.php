<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modèle Message : stocke un message envoyé entre deux utilisateurs.
 *
 * Stockage : table MySQL "messages". Pour la conversation en temps réel,
 * un système plus avancé (WebSocket, broadcasting) serait nécessaire ;
 * ici la lecture se fait par polling depuis le frontend.
 *
 * Champ "lu" : passe à true côté destinataire dès qu'il ouvre la conversation
 * (logique dans MessageController::messagerie).
 */
class Message extends Model
{
    /**
     * Champs autorisés en mass-assignment.
     */
    protected $fillable = [
        'expediteur_id',
        'destinataire_id',
        'contenu',
        'lu',
    ];

    /**
     * Casts automatiques : "lu" est un tinyint en BDD, exposé en booléen côté PHP/JSON.
     */
    protected $casts = [
        'lu' => 'boolean',
    ];

    /**
     * Relation N-1 : le message a un expéditeur.
     */
    public function expediteur()
    {
        return $this->belongsTo(User::class, 'expediteur_id');
    }

    /**
     * Relation N-1 : le message a un destinataire.
     */
    public function destinataire()
    {
        return $this->belongsTo(User::class, 'destinataire_id');
    }
}
