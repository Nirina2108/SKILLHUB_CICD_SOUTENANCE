<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modèle FormationVue : trace les vues uniques d'une formation.
 *
 * Sert à empêcher le double-comptage du compteur "nombre_de_vues" sur Formation.
 * Une contrainte unique en base sur (formation_id, utilisateur_id) garantit
 * qu'un utilisateur connecté n'est compté qu'une seule fois. Pour les visiteurs
 * anonymes, on déduplique par couple (formation_id, ip).
 *
 * Le formateur propriétaire d'une formation n'est PAS enregistré dans cette
 * table (filtrage côté contrôleur dans show()).
 */
class FormationVue extends Model
{
    /**
     * Champs autorisés en mass-assignment. utilisateur_id peut être null pour les visiteurs anonymes.
     */
    protected $fillable = [
        'formation_id',
        'utilisateur_id',
        'ip',
    ];

    /**
     * Relation N-1 : la vue concerne une formation.
     */
    public function formation()
    {
        return $this->belongsTo(Formation::class);
    }

    /**
     * Relation N-1 : la vue est associée à un utilisateur (null si visiteur anonyme).
     */
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }
}
