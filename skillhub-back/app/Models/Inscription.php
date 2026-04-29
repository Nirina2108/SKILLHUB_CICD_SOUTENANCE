<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modèle Inscription : représente l'inscription d'un apprenant à une formation.
 *
 * Chaque ligne contient :
 *  - utilisateur_id : référence à l'apprenant (User avec role=apprenant)
 *  - formation_id   : référence à la formation suivie
 *  - progression    : pourcentage 0-100 calculé à partir des modules terminés
 *
 * La désinscription supprime physiquement la ligne (la progression est perdue).
 */
class Inscription extends Model
{
    /**
     * Champs autorisés en mass-assignment.
     */
    protected $fillable = [
        'utilisateur_id',
        'formation_id',
        'progression',
    ];

    /**
     * Relation N-1 : l'inscription appartient à un utilisateur (apprenant).
     */
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    /**
     * Relation N-1 : l'inscription concerne une formation.
     */
    public function formation()
    {
        return $this->belongsTo(Formation::class);
    }
}
