<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * Modèle User : représente un utilisateur de la plateforme SkillHub.
 *
 * Un utilisateur a un rôle (apprenant ou formateur) qui détermine ses droits
 * dans l'application. Le mot de passe est automatiquement haché à l'enregistrement
 * grâce au cast "hashed". L'utilisateur implémente JWTSubject pour pouvoir être
 * identifié dans un token JWT.
 *
 * Relations Eloquent exposées :
 *  - formations         : formations créées (uniquement si rôle formateur)
 *  - inscriptions       : inscriptions à des formations (uniquement si rôle apprenant)
 *  - modulesTermines    : modules complétés via le pivot module_user
 *  - messagesEnvoyes / messagesRecus : messagerie 1:1
 */
class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    /**
     * Champs autorisés en mass-assignment (Eloquent::create / fill).
     */
    protected $fillable = [
        'nom',
        'email',
        'password',
        'role',
        'photo_profil',
    ];

    /**
     * Champs cachés lors de la sérialisation JSON (ne fuitent jamais dans les réponses API).
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts d'attributs : "hashed" hache automatiquement le password à l'écriture.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Identifiant utilisé comme "subject" du token JWT (ici la primary key).
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Claims personnalisés à ajouter dans le payload JWT (vide ici).
     */
    public function getJWTCustomClaims(): array
    {
        return [];
    }

    /**
     * Formations dont l'utilisateur est le formateur (relation 1-N).
     */
    public function formations()
    {
        return $this->hasMany(Formation::class, 'formateur_id');
    }

    /**
     * Inscriptions de l'utilisateur (apprenant) à des formations (relation 1-N).
     */
    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'utilisateur_id');
    }

    /**
     * Modules terminés par l'utilisateur (relation N-N via la table pivot module_user).
     * Le pivot stocke le booléen "termine" et les timestamps de complétion.
     */
    public function modulesTermines()
    {
        return $this->belongsToMany(Module::class, 'module_user', 'utilisateur_id', 'module_id')
            ->withPivot('termine')
            ->withTimestamps();
    }

    /**
     * Messages envoyés par l'utilisateur.
     */
    public function messagesEnvoyes()
    {
        return $this->hasMany(Message::class, 'expediteur_id');
    }

    /**
     * Messages reçus par l'utilisateur.
     */
    public function messagesRecus()
    {
        return $this->hasMany(Message::class, 'destinataire_id');
    }
}
