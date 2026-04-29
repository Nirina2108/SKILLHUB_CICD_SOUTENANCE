<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modèle Module : représente une "leçon" à l'intérieur d'une formation.
 *
 * Un module a un titre, un contenu textuel libre (rendu côté frontend),
 * et un numéro d'ordre qui détermine sa position dans la séquence pédagogique
 * affichée à l'apprenant.
 */
class Module extends Model
{
    /**
     * Champs autorisés en mass-assignment.
     */
    protected $fillable = [
        'titre',
        'contenu',
        'ordre',
        'formation_id',
    ];

    /**
     * Relation N-1 : le module appartient à une formation.
     */
    public function formation()
    {
        return $this->belongsTo(Formation::class, 'formation_id');
    }

    /**
     * Relation N-N : utilisateurs ayant terminé ce module (via le pivot module_user).
     * Le pivot porte le booléen "termine" et les timestamps de complétion.
     */
    public function utilisateurs()
    {
        return $this->belongsToMany(User::class, 'module_user', 'module_id', 'utilisateur_id')
            ->withPivot('termine')
            ->withTimestamps();
    }
}
